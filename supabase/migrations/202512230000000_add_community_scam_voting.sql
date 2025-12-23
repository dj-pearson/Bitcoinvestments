-- Migration: Add Community Voting System for Scam Reports
-- This enables community-based validation where users can upvote/downvote
-- and dispute scam reports that may be false positives

-- Add source field to track where reports came from
ALTER TABLE scam_reports ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT 'user_reported';
ALTER TABLE scam_reports ADD COLUMN IF NOT EXISTS external_id VARCHAR(100);
ALTER TABLE scam_reports ADD COLUMN IF NOT EXISTS upvotes INTEGER DEFAULT 0;
ALTER TABLE scam_reports ADD COLUMN IF NOT EXISTS downvotes INTEGER DEFAULT 0;
ALTER TABLE scam_reports ADD COLUMN IF NOT EXISTS dispute_count INTEGER DEFAULT 0;
ALTER TABLE scam_reports ADD COLUMN IF NOT EXISTS trust_score DECIMAL(5,2) DEFAULT 50.00;
ALTER TABLE scam_reports ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMPTZ DEFAULT NOW();

-- Create index for source filtering
CREATE INDEX IF NOT EXISTS idx_scam_reports_source ON scam_reports(source);
CREATE INDEX IF NOT EXISTS idx_scam_reports_external_id ON scam_reports(external_id);
CREATE INDEX IF NOT EXISTS idx_scam_reports_trust_score ON scam_reports(trust_score);

-- Community Votes table
CREATE TABLE IF NOT EXISTS scam_report_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scam_report_id UUID NOT NULL REFERENCES scam_reports(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vote_type VARCHAR(20) NOT NULL CHECK (vote_type IN ('upvote', 'downvote')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(scam_report_id, user_id)
);

-- Create indexes for votes
CREATE INDEX IF NOT EXISTS idx_scam_votes_report ON scam_report_votes(scam_report_id);
CREATE INDEX IF NOT EXISTS idx_scam_votes_user ON scam_report_votes(user_id);

-- Dispute Reports table (for when users believe a report is incorrect)
CREATE TABLE IF NOT EXISTS scam_report_disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scam_report_id UUID NOT NULL REFERENCES scam_reports(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  evidence_links TEXT[],
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'upheld', 'overturned', 'dismissed')),
  admin_notes TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for disputes
CREATE INDEX IF NOT EXISTS idx_scam_disputes_report ON scam_report_disputes(scam_report_id);
CREATE INDEX IF NOT EXISTS idx_scam_disputes_user ON scam_report_disputes(user_id);
CREATE INDEX IF NOT EXISTS idx_scam_disputes_status ON scam_report_disputes(status);

-- User reputation table for scam reporting credibility
CREATE TABLE IF NOT EXISTS scam_reporter_reputation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  total_reports INTEGER DEFAULT 0,
  verified_reports INTEGER DEFAULT 0,
  rejected_reports INTEGER DEFAULT 0,
  helpful_votes INTEGER DEFAULT 0,
  reputation_score DECIMAL(5,2) DEFAULT 50.00,
  badge VARCHAR(50) DEFAULT 'newcomer',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for reputation
CREATE INDEX IF NOT EXISTS idx_reporter_reputation_user ON scam_reporter_reputation(user_id);
CREATE INDEX IF NOT EXISTS idx_reporter_reputation_score ON scam_reporter_reputation(reputation_score);

-- Watchlist table for users to track specific scams
CREATE TABLE IF NOT EXISTS scam_watchlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scam_report_id UUID NOT NULL REFERENCES scam_reports(id) ON DELETE CASCADE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, scam_report_id)
);

-- Create indexes for watchlist
CREATE INDEX IF NOT EXISTS idx_scam_watchlist_user ON scam_watchlist(user_id);

-- Function to update vote counts on scam_reports
CREATE OR REPLACE FUNCTION update_scam_vote_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.vote_type = 'upvote' THEN
      UPDATE scam_reports SET upvotes = upvotes + 1, last_activity_at = NOW() WHERE id = NEW.scam_report_id;
    ELSE
      UPDATE scam_reports SET downvotes = downvotes + 1, last_activity_at = NOW() WHERE id = NEW.scam_report_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.vote_type = 'upvote' THEN
      UPDATE scam_reports SET upvotes = GREATEST(upvotes - 1, 0) WHERE id = OLD.scam_report_id;
    ELSE
      UPDATE scam_reports SET downvotes = GREATEST(downvotes - 1, 0) WHERE id = OLD.scam_report_id;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Handle vote change
    IF OLD.vote_type = 'upvote' AND NEW.vote_type = 'downvote' THEN
      UPDATE scam_reports SET upvotes = GREATEST(upvotes - 1, 0), downvotes = downvotes + 1, last_activity_at = NOW() WHERE id = NEW.scam_report_id;
    ELSIF OLD.vote_type = 'downvote' AND NEW.vote_type = 'upvote' THEN
      UPDATE scam_reports SET downvotes = GREATEST(downvotes - 1, 0), upvotes = upvotes + 1, last_activity_at = NOW() WHERE id = NEW.scam_report_id;
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger for vote count updates
DROP TRIGGER IF EXISTS trigger_update_scam_vote_counts ON scam_report_votes;
CREATE TRIGGER trigger_update_scam_vote_counts
  AFTER INSERT OR UPDATE OR DELETE ON scam_report_votes
  FOR EACH ROW EXECUTE FUNCTION update_scam_vote_counts();

-- Function to calculate trust score
CREATE OR REPLACE FUNCTION calculate_trust_score(report_id UUID)
RETURNS DECIMAL(5,2) AS $$
DECLARE
  v_upvotes INTEGER;
  v_downvotes INTEGER;
  v_disputes INTEGER;
  v_status VARCHAR(20);
  v_score DECIMAL(5,2);
BEGIN
  SELECT upvotes, downvotes, dispute_count, status
  INTO v_upvotes, v_downvotes, v_disputes, v_status
  FROM scam_reports WHERE id = report_id;

  -- Base score calculation
  IF v_upvotes + v_downvotes = 0 THEN
    v_score := 50.00;
  ELSE
    v_score := (v_upvotes::DECIMAL / (v_upvotes + v_downvotes)::DECIMAL) * 100;
  END IF;

  -- Adjust for disputes
  v_score := v_score - (v_disputes * 5);

  -- Adjust for verification status
  IF v_status = 'verified' THEN
    v_score := LEAST(v_score + 20, 100);
  ELSIF v_status = 'rejected' THEN
    v_score := 0;
  END IF;

  -- Clamp between 0 and 100
  v_score := GREATEST(LEAST(v_score, 100.00), 0.00);

  RETURN v_score;
END;
$$ LANGUAGE plpgsql;

-- Function to update dispute count
CREATE OR REPLACE FUNCTION update_dispute_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE scam_reports SET dispute_count = dispute_count + 1, last_activity_at = NOW() WHERE id = NEW.scam_report_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE scam_reports SET dispute_count = GREATEST(dispute_count - 1, 0) WHERE id = OLD.scam_report_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger for dispute count
DROP TRIGGER IF EXISTS trigger_update_dispute_count ON scam_report_disputes;
CREATE TRIGGER trigger_update_dispute_count
  AFTER INSERT OR DELETE ON scam_report_disputes
  FOR EACH ROW EXECUTE FUNCTION update_dispute_count();

-- Row Level Security Policies

-- scam_report_votes RLS
ALTER TABLE scam_report_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all votes" ON scam_report_votes
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can vote" ON scam_report_votes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own votes" ON scam_report_votes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own votes" ON scam_report_votes
  FOR DELETE USING (auth.uid() = user_id);

-- scam_report_disputes RLS
ALTER TABLE scam_report_disputes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all disputes" ON scam_report_disputes
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create disputes" ON scam_report_disputes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pending disputes" ON scam_report_disputes
  FOR UPDATE USING (auth.uid() = user_id AND status = 'pending');

-- scam_reporter_reputation RLS
ALTER TABLE scam_reporter_reputation ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view reputation" ON scam_reporter_reputation
  FOR SELECT USING (true);

CREATE POLICY "System manages reputation" ON scam_reporter_reputation
  FOR ALL USING (true);

-- scam_watchlist RLS
ALTER TABLE scam_watchlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own watchlist" ON scam_watchlist
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own watchlist" ON scam_watchlist
  FOR ALL USING (auth.uid() = user_id);

-- Add helpful comment explaining source values
COMMENT ON COLUMN scam_reports.source IS 'Source of the report: user_reported, cryptoscamdb, etherscamdb, community_import, admin_added';
COMMENT ON COLUMN scam_reports.trust_score IS 'Community trust score 0-100 based on votes and disputes';
COMMENT ON COLUMN scam_reports.external_id IS 'Original ID from external database if imported';
