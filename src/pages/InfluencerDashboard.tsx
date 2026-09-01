import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  DollarSign,
  Link2,
  Copy,
  Check,
  TrendingUp,
  Gift,
  AlertCircle,
  Award,
  Clock,
  CheckCircle,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import {
  INFLUENCER_TIERS,
  generateAffiliateLink,
  formatEarnings,
  getConversionRate,
  type InfluencerProfile,
  type InfluencerApplication,
  validateApplication,
} from '../services/influencerAffiliate';
import { cn } from '../lib/utils';

import { DemoDataBanner } from '../components/DemoDataBanner';
// Mock influencer data (in production, fetch from database)
const mockInfluencerProfile: InfluencerProfile | null = null; // Set to profile for returning users

export function InfluencerDashboard() {
  const { user, profile } = useAuth();
  const [influencer] = useState<InfluencerProfile | null>(mockInfluencerProfile);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'referrals' | 'payouts'>('overview');
  const [showApplication, setShowApplication] = useState(false);
  const [application, setApplication] = useState<InfluencerApplication>({
    name: profile?.email?.split('@')[0] || '',
    email: profile?.email || '',
    platform: 'youtube',
    platform_url: '',
    followers_count: 0,
    content_description: '',
    why_join: '',
    agreed_to_terms: false,
  });
  const [applicationErrors, setApplicationErrors] = useState<string[]>([]);
  const [applicationSubmitted, setApplicationSubmitted] = useState(false);

  // Demo influencer data for approved users
  const demoInfluencer: InfluencerProfile = {
    id: 'inf-1',
    user_id: user?.id || '',
    name: 'CryptoCreator',
    email: profile?.email || '',
    platform: 'youtube',
    platform_url: 'https://youtube.com/@cryptocreator',
    followers_count: 15000,
    status: 'approved',
    tier: 'premium',
    commission_rate: 0.25,
    affiliate_code: 'crypto25',
    created_at: '2024-06-01',
    approved_at: '2024-06-05',
    total_referrals: 45,
    total_conversions: 12,
    total_earnings: 359.64,
    pending_payout: 89.91,
    payout_method: 'paypal',
    payout_details: 'creator@email.com',
  };

  const copyAffiliateLink = () => {
    if (!influencer) return;
    const link = generateAffiliateLink(influencer.affiliate_code);
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApplicationSubmit = () => {
    const errors = validateApplication(application);
    setApplicationErrors(errors);

    if (errors.length === 0) {
      // In production, submit to backend
      console.log('Submitting application:', application);
      setApplicationSubmitted(true);
    }
  };

  // Show application form for new users
  if (!influencer && !applicationSubmitted) {
    return (
      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-primary/20 text-brand-primary text-sm font-medium mb-6">
            <Gift className="w-4 h-4" />
            Earn up to 30% Revenue Share
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Influencer Affiliate Program
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto mb-8">
            Join our affiliate program and earn commission for every user you refer.
            Perfect for crypto YouTubers, bloggers, and content creators.
          </p>
          <button
            onClick={() => setShowApplication(true)}
            className="px-8 py-3 bg-brand-primary hover:bg-brand-primary/90 text-white font-semibold rounded-xl transition-colors"
          >
            Apply Now
          </button>
        </div>

        {/* Tiers Overview */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {Object.entries(INFLUENCER_TIERS).map(([key, tier]) => (
            <div key={key} className={cn(
              "glass-card p-6",
              key === 'premium' && "ring-2 ring-brand-primary"
            )}>
              <div className="flex items-center gap-2 mb-4">
                <Award className={cn(
                  "w-6 h-6",
                  key === 'elite' ? "text-purple-400" :
                  key === 'premium' ? "text-brand-primary" :
                  "text-gray-400"
                )} />
                <h3 className="text-xl font-bold text-white">{tier.name}</h3>
              </div>
              <p className="text-3xl font-bold text-brand-primary mb-4">
                {(tier.commission_rate * 100).toFixed(0)}%
                <span className="text-sm font-normal text-gray-400 ml-2">revenue share</span>
              </p>
              <p className="text-sm text-gray-400 mb-4">
                {tier.min_referrals === 0 ? 'Start earning immediately' : `Unlock at ${tier.min_referrals}+ referrals`}
              </p>
              <ul className="space-y-2">
                {tier.benefits.map((benefit, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-gray-300">
                    <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Application Form Modal */}
        {showApplication && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="glass-card p-8 max-w-xl w-full max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold text-white mb-6">Apply to Affiliate Program</h2>

              {applicationErrors.length > 0 && (
                <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30">
                  <ul className="space-y-1">
                    {applicationErrors.map((error, i) => (
                      <li key={i} className="text-sm text-red-400 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        {error}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Your Name *</label>
                  <input
                    type="text"
                    value={application.name}
                    onChange={(e) => setApplication({ ...application, name: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-brand-primary"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Email *</label>
                  <input
                    type="email"
                    value={application.email}
                    onChange={(e) => setApplication({ ...application, email: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-brand-primary"
                    placeholder="you@email.com"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Platform *</label>
                  <select
                    value={application.platform}
                    onChange={(e) => setApplication({ ...application, platform: e.target.value as InfluencerApplication['platform'] })}
                    className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-brand-primary"
                  >
                    <option value="youtube">YouTube</option>
                    <option value="twitter">Twitter/X</option>
                    <option value="blog">Blog/Website</option>
                    <option value="podcast">Podcast</option>
                    <option value="instagram">Instagram</option>
                    <option value="tiktok">TikTok</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Platform URL *</label>
                  <input
                    type="url"
                    value={application.platform_url}
                    onChange={(e) => setApplication({ ...application, platform_url: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-brand-primary"
                    placeholder="https://youtube.com/@yourchannel"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Followers/Subscribers *</label>
                  <input
                    type="number"
                    value={application.followers_count || ''}
                    onChange={(e) => setApplication({ ...application, followers_count: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-brand-primary"
                    placeholder="10000"
                    min={100}
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Describe Your Content *</label>
                  <textarea
                    value={application.content_description}
                    onChange={(e) => setApplication({ ...application, content_description: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-brand-primary"
                    rows={3}
                    placeholder="I create educational crypto content focusing on..."
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Why do you want to join?</label>
                  <textarea
                    value={application.why_join}
                    onChange={(e) => setApplication({ ...application, why_join: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-brand-primary"
                    rows={2}
                    placeholder="I believe this platform would benefit my audience because..."
                  />
                </div>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={application.agreed_to_terms}
                    onChange={(e) => setApplication({ ...application, agreed_to_terms: e.target.checked })}
                    className="mt-1"
                  />
                  <span className="text-sm text-gray-400">
                    I agree to the <Link to="/terms" className="text-brand-primary hover:underline">Terms of Service</Link> and
                    Affiliate Program guidelines. I understand that my application will be reviewed within 3-5 business days.
                  </span>
                </label>

                <div className="flex gap-4 pt-4">
                  <button
                    onClick={() => setShowApplication(false)}
                    className="flex-1 py-3 rounded-lg text-gray-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleApplicationSubmit}
                    className="flex-1 py-3 rounded-lg bg-brand-primary hover:bg-brand-primary/90 text-white font-semibold transition-colors"
                  >
                    Submit Application
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* How It Works */}
        <div className="glass-card p-8">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">How It Works</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-brand-primary/20 flex items-center justify-center mx-auto mb-4">
                <span className="text-brand-primary font-bold">1</span>
              </div>
              <h3 className="font-semibold text-white mb-2">Apply</h3>
              <p className="text-sm text-gray-400">Submit your application with your platform details</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-brand-primary/20 flex items-center justify-center mx-auto mb-4">
                <span className="text-brand-primary font-bold">2</span>
              </div>
              <h3 className="font-semibold text-white mb-2">Get Approved</h3>
              <p className="text-sm text-gray-400">We review applications within 3-5 business days</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-brand-primary/20 flex items-center justify-center mx-auto mb-4">
                <span className="text-brand-primary font-bold">3</span>
              </div>
              <h3 className="font-semibold text-white mb-2">Share & Promote</h3>
              <p className="text-sm text-gray-400">Use your unique link to refer your audience</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-brand-primary/20 flex items-center justify-center mx-auto mb-4">
                <span className="text-brand-primary font-bold">4</span>
              </div>
              <h3 className="font-semibold text-white mb-2">Earn Commission</h3>
              <p className="text-sm text-gray-400">Get paid for every subscription from your referrals</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Application submitted confirmation
  if (applicationSubmitted && !influencer) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto text-center">
          <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-4">Application Submitted!</h1>
          <p className="text-gray-400 mb-8">
            Thank you for applying to our affiliate program. We'll review your application and get back to you within 3-5 business days.
          </p>
          <Link
            to="/"
            className="inline-block px-6 py-3 rounded-lg bg-brand-primary hover:bg-brand-primary/90 text-white font-medium transition-colors"
          >
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  // Use demo data for demonstration
  // `mockInfluencerProfile` is hardcoded to null, so `influencer` is always
  // null and every affiliate currently sees `demoInfluencer` — fabricated
  // referral counts, commission totals and payout history. Until this reads a
  // real profile, say so on the page rather than showing someone invented
  // earnings figures.
  const displayInfluencer = influencer || demoInfluencer;
  const isDemoData = influencer === null;
  const affiliateLink = generateAffiliateLink(displayInfluencer.affiliate_code);

  // Approved Influencer Dashboard
  return (
    <div className="container mx-auto px-4 py-8">
      {isDemoData && <DemoDataBanner source="your affiliate account" />}
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Affiliate Dashboard</h1>
          <p className="text-gray-400 mt-1">
            Welcome back, {displayInfluencer.name}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className={cn(
            "px-3 py-1 rounded-full text-sm font-medium",
            displayInfluencer.tier === 'elite' ? "bg-purple-500/20 text-purple-400" :
            displayInfluencer.tier === 'premium' ? "bg-brand-primary/20 text-brand-primary" :
            "bg-gray-500/20 text-gray-400"
          )}>
            {INFLUENCER_TIERS[displayInfluencer.tier].name} Partner
          </span>
          <span className="text-brand-primary font-bold">
            {(displayInfluencer.commission_rate * 100).toFixed(0)}% Commission
          </span>
        </div>
      </div>

      {/* Affiliate Link */}
      <div className="glass-card p-6 mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="font-semibold text-white mb-1">Your Affiliate Link</h3>
            <p className="text-sm text-gray-400">Share this link to earn commission on referrals</p>
          </div>
          <div className="flex items-center gap-2 flex-1 md:max-w-xl">
            <div className="flex-1 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-gray-300 text-sm overflow-hidden">
              <span className="truncate block">{affiliateLink}</span>
            </div>
            <button
              onClick={copyAffiliateLink}
              className="px-4 py-2 rounded-lg bg-brand-primary hover:bg-brand-primary/90 text-white font-medium transition-colors flex items-center gap-2"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="glass-card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Referrals</p>
              <p className="text-2xl font-bold text-white">{displayInfluencer.total_referrals}</p>
            </div>
            <Users className="w-10 h-10 text-brand-primary opacity-50" />
          </div>
        </div>

        <div className="glass-card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Conversions</p>
              <p className="text-2xl font-bold text-white">{displayInfluencer.total_conversions}</p>
            </div>
            <TrendingUp className="w-10 h-10 text-green-500 opacity-50" />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {getConversionRate(displayInfluencer.total_referrals, displayInfluencer.total_conversions)} conversion rate
          </p>
        </div>

        <div className="glass-card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Earnings</p>
              <p className="text-2xl font-bold text-green-500">
                {formatEarnings(displayInfluencer.total_earnings)}
              </p>
            </div>
            <DollarSign className="w-10 h-10 text-green-500 opacity-50" />
          </div>
        </div>

        <div className="glass-card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Pending Payout</p>
              <p className="text-2xl font-bold text-brand-primary">
                {formatEarnings(displayInfluencer.pending_payout)}
              </p>
            </div>
            <Clock className="w-10 h-10 text-brand-primary opacity-50" />
          </div>
          <p className="text-xs text-gray-500 mt-2">Next payout in 5 days</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-white/10 pb-4">
        <button
          onClick={() => setActiveTab('overview')}
          className={cn(
            "px-4 py-2 rounded-lg font-medium transition-colors",
            activeTab === 'overview'
              ? "bg-brand-primary text-white"
              : "text-gray-400 hover:text-white hover:bg-white/5"
          )}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('referrals')}
          className={cn(
            "px-4 py-2 rounded-lg font-medium transition-colors",
            activeTab === 'referrals'
              ? "bg-brand-primary text-white"
              : "text-gray-400 hover:text-white hover:bg-white/5"
          )}
        >
          Referrals
        </button>
        <button
          onClick={() => setActiveTab('payouts')}
          className={cn(
            "px-4 py-2 rounded-lg font-medium transition-colors",
            activeTab === 'payouts'
              ? "bg-brand-primary text-white"
              : "text-gray-400 hover:text-white hover:bg-white/5"
          )}
        >
          Payouts
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Recent Activity */}
          <div className="glass-card p-6">
            <h3 className="font-semibold text-white mb-4">Recent Activity</h3>
            <div className="space-y-4">
              {[
                { type: 'click', date: '2 hours ago', details: 'New referral click' },
                { type: 'signup', date: '1 day ago', details: 'User signed up' },
                { type: 'conversion', date: '3 days ago', details: 'Premium subscription - $2.50 commission' },
                { type: 'click', date: '4 days ago', details: 'New referral click' },
              ].map((activity, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center",
                      activity.type === 'conversion' ? "bg-green-500/20" :
                      activity.type === 'signup' ? "bg-blue-500/20" :
                      "bg-gray-500/20"
                    )}>
                      {activity.type === 'conversion' ? (
                        <DollarSign className="w-4 h-4 text-green-400" />
                      ) : activity.type === 'signup' ? (
                        <Users className="w-4 h-4 text-blue-400" />
                      ) : (
                        <Link2 className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                    <span className="text-gray-300">{activity.details}</span>
                  </div>
                  <span className="text-sm text-gray-500">{activity.date}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Tier Progress */}
          <div className="glass-card p-6">
            <h3 className="font-semibold text-white mb-4">Tier Progress</h3>
            <div className="mb-6">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-400">Current: {INFLUENCER_TIERS[displayInfluencer.tier].name}</span>
                <span className="text-gray-400">
                  {displayInfluencer.tier === 'elite' ? 'Max tier reached!' :
                    `${INFLUENCER_TIERS[displayInfluencer.tier === 'standard' ? 'premium' : 'elite'].min_referrals - displayInfluencer.total_referrals} more to next tier`}
                </span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand-primary rounded-full"
                  style={{
                    width: displayInfluencer.tier === 'elite' ? '100%' :
                      `${(displayInfluencer.total_referrals / (displayInfluencer.tier === 'standard' ? 25 : 100)) * 100}%`
                  }}
                />
              </div>
            </div>

            <div className="space-y-3">
              {Object.entries(INFLUENCER_TIERS).map(([key, tier]) => (
                <div key={key} className={cn(
                  "flex items-center justify-between p-3 rounded-lg",
                  displayInfluencer.tier === key ? "bg-brand-primary/20 border border-brand-primary/30" : "bg-white/5"
                )}>
                  <div className="flex items-center gap-2">
                    {displayInfluencer.tier === key ? (
                      <Check className="w-4 h-4 text-brand-primary" />
                    ) : (
                      <div className="w-4 h-4" />
                    )}
                    <span className={cn(
                      "font-medium",
                      displayInfluencer.tier === key ? "text-brand-primary" : "text-gray-400"
                    )}>
                      {tier.name}
                    </span>
                  </div>
                  <span className="text-gray-400">{(tier.commission_rate * 100).toFixed(0)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'referrals' && (
        <div className="glass-card overflow-hidden">
          <table className="w-full">
            <thead className="bg-white/5">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Date</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Status</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Subscription</th>
                <th className="text-right px-6 py-4 text-sm font-medium text-gray-400">Commission</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {[
                { date: 'Dec 5, 2024', status: 'converted', subscription: 'Premium Annual', commission: 24.99 },
                { date: 'Dec 3, 2024', status: 'signed_up', subscription: '-', commission: 0 },
                { date: 'Nov 28, 2024', status: 'converted', subscription: 'Premium Monthly', commission: 2.50 },
                { date: 'Nov 25, 2024', status: 'click', subscription: '-', commission: 0 },
                { date: 'Nov 20, 2024', status: 'converted', subscription: 'Advisor', commission: 12.25 },
              ].map((referral, i) => (
                <tr key={i} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 text-white">{referral.date}</td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-2 py-1 rounded text-xs font-medium",
                      referral.status === 'converted' ? "bg-green-500/20 text-green-400" :
                      referral.status === 'signed_up' ? "bg-blue-500/20 text-blue-400" :
                      "bg-gray-500/20 text-gray-400"
                    )}>
                      {referral.status === 'converted' ? 'Converted' :
                       referral.status === 'signed_up' ? 'Signed Up' : 'Click'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-400">{referral.subscription}</td>
                  <td className="px-6 py-4 text-right">
                    {referral.commission > 0 ? (
                      <span className="text-green-400 font-medium">{formatEarnings(referral.commission)}</span>
                    ) : (
                      <span className="text-gray-500">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'payouts' && (
        <div className="space-y-6">
          {/* Payout Settings */}
          <div className="glass-card p-6">
            <h3 className="font-semibold text-white mb-4">Payout Settings</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Payout Method</label>
                <select
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-brand-primary"
                  defaultValue={displayInfluencer.payout_method}
                >
                  <option value="paypal">PayPal</option>
                  <option value="bank">Bank Transfer</option>
                  <option value="crypto">Cryptocurrency (USDC)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Payout Details</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-brand-primary"
                  placeholder="PayPal email or wallet address"
                  defaultValue={displayInfluencer.payout_details}
                />
              </div>
            </div>
            <button className="mt-4 px-4 py-2 rounded-lg bg-brand-primary hover:bg-brand-primary/90 text-white font-medium transition-colors">
              Update Settings
            </button>
          </div>

          {/* Payout History */}
          <div className="glass-card overflow-hidden">
            <div className="p-6 border-b border-white/10">
              <h3 className="font-semibold text-white">Payout History</h3>
            </div>
            <table className="w-full">
              <thead className="bg-white/5">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Date</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Amount</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Method</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {[
                  { date: 'Nov 15, 2024', amount: 125.50, method: 'PayPal', status: 'completed' },
                  { date: 'Oct 15, 2024', amount: 89.25, method: 'PayPal', status: 'completed' },
                  { date: 'Sep 15, 2024', amount: 55.39, method: 'PayPal', status: 'completed' },
                ].map((payout, i) => (
                  <tr key={i} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 text-white">{payout.date}</td>
                    <td className="px-6 py-4 text-green-400 font-medium">{formatEarnings(payout.amount)}</td>
                    <td className="px-6 py-4 text-gray-400">{payout.method}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 rounded text-xs font-medium bg-green-500/20 text-green-400">
                        {payout.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
