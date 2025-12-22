/**
 * Analytics Hook
 *
 * React hook for tracking analytics events and page views.
 * Integrates with the analytics service for easy use in components.
 */

import { useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import {
  trackEvent,
  trackPageview,
  trackGuideView,
  trackCourseStart,
  trackModuleComplete,
  trackCourseComplete,
  trackExchangeCompare,
  trackWalletCompare,
  trackAffiliateClick,
  trackSearch,
  trackSearchResultClick,
  trackNewsletterSignup,
  track2FAEnabled,
  trackCalculatorUse,
  trackGlossaryView,
  trackChartView,
  trackError,
} from '../services/analytics';

/**
 * Hook for tracking page views on route changes
 */
export function usePageTracking(): void {
  const location = useLocation();

  useEffect(() => {
    // Track page view on route change
    trackPageview(location.pathname + location.search);
  }, [location]);
}

/**
 * Hook for analytics with all tracking methods
 */
export function useAnalytics() {
  const location = useLocation();

  // Track custom event
  const track = useCallback(
    (eventName: string, props?: Record<string, string | number | boolean>) => {
      trackEvent(eventName, props);
    },
    []
  );

  // Track guide view
  const trackGuide = useCallback(
    (guideId: string, guideName: string, category: string) => {
      trackGuideView(guideId, guideName, category);
    },
    []
  );

  // Track course start
  const trackCourse = useCallback((courseId: string, courseName: string) => {
    trackCourseStart(courseId, courseName);
  }, []);

  // Track module completion
  const trackModule = useCallback(
    (courseId: string, moduleId: string, moduleName: string, moduleNumber: number) => {
      trackModuleComplete(courseId, moduleId, moduleName, moduleNumber);
    },
    []
  );

  // Track course completion
  const completeCourse = useCallback((courseId: string, courseName: string) => {
    trackCourseComplete(courseId, courseName);
  }, []);

  // Track exchange view
  const trackExchange = useCallback((exchangeId: string, exchangeName: string) => {
    trackExchangeCompare(exchangeId, exchangeName);
  }, []);

  // Track wallet view
  const trackWallet = useCallback((walletId: string, walletName: string) => {
    trackWalletCompare(walletId, walletName);
  }, []);

  // Track affiliate click
  const trackAffiliate = useCallback(
    (type: 'exchange' | 'wallet', name: string, url: string) => {
      trackAffiliateClick(type, name, url);
    },
    []
  );

  // Track search
  const searchTrack = useCallback((query: string, resultCount: number) => {
    trackSearch(query, resultCount);
  }, []);

  // Track search result click
  const searchClick = useCallback(
    (query: string, resultType: string, resultTitle: string) => {
      trackSearchResultClick(query, resultType, resultTitle);
    },
    []
  );

  // Track newsletter signup
  const newsletterSignup = useCallback((source: string) => {
    trackNewsletterSignup(source);
  }, []);

  // Track 2FA enabled
  const twoFactorEnabled = useCallback((method: string) => {
    track2FAEnabled(method);
  }, []);

  // Track calculator use
  const calculatorUse = useCallback((calculatorType: string) => {
    trackCalculatorUse(calculatorType);
  }, []);

  // Track glossary view
  const glossaryView = useCallback((term: string, category: string) => {
    trackGlossaryView(term, category);
  }, []);

  // Track chart view
  const chartView = useCallback((cryptocurrency: string) => {
    trackChartView(cryptocurrency);
  }, []);

  // Track error
  const errorTrack = useCallback(
    (errorType: string, errorMessage: string) => {
      trackError(errorType, errorMessage, location.pathname);
    },
    [location.pathname]
  );

  return {
    track,
    trackGuide,
    trackCourse,
    trackModule,
    completeCourse,
    trackExchange,
    trackWallet,
    trackAffiliate,
    trackSearch: searchTrack,
    trackSearchClick: searchClick,
    trackNewsletter: newsletterSignup,
    track2FA: twoFactorEnabled,
    trackCalculator: calculatorUse,
    trackGlossary: glossaryView,
    trackChart: chartView,
    trackError: errorTrack,
  };
}

export default useAnalytics;
