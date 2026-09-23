/**
 * Gate for every route that needs an account or the database.
 *
 * Renders its children only when all of these hold:
 *   1. VITE_ACCOUNTS_ENABLED=true at build time (src/config/staticMode.ts),
 *   2. Supabase is configured (VITE_SUPABASE_URL / _PUBLISHABLE_KEY),
 *   3. the feature has a real backend (`ready` in src/config/features.ts; local
 *      development bypasses this so unfinished pages can be worked on),
 *   4. the database answers with at least the schema version this build needs
 *      (src/hooks/useBackendStatus.ts).
 *
 * Otherwise it renders the feature's ComingSoon page: "not open yet" when the
 * switch is off, "temporarily unavailable" when the database is down or behind.
 * The auth provider does not depend on this check, so a health blip never signs
 * anyone out; only the route reacts.
 */

import type { ReactNode } from 'react';
import { ComingSoon } from '../pages/ComingSoon';
import { PageLoader } from './LoadingSkeletons';
import { useBackendStatus } from '../hooks/useBackendStatus';
import { FEATURES, type FeatureKey } from '../config/features';

interface FeatureGateProps {
  feature: FeatureKey;
  children: ReactNode;
}

export function FeatureGate({ feature, children }: FeatureGateProps) {
  const status = useBackendStatus();
  const ready = FEATURES[feature].ready || import.meta.env.DEV;

  if (status === 'disabled' || !ready) {
    return <ComingSoon feature={feature} />;
  }
  if (status === 'checking') {
    return <PageLoader message="Loading..." />;
  }
  if (status === 'down' || status === 'outdated') {
    return <ComingSoon feature={feature} reason="unavailable" />;
  }
  return <>{children}</>;
}

export default FeatureGate;
