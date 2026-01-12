import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Layout } from './components/Layout/Layout';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { AnalyticsProvider, PageTracker } from './components/AnalyticsProvider';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AdminRoute } from './components/AdminRoute';
import { SessionExpiredModal } from './components/SessionExpiredModal';
import { SessionActivityTracker } from './components/SessionActivityTracker';
import { AppErrorBoundary } from './components/ErrorBoundary';
import { PageLoader } from './components/LoadingSkeletons';
import { WebVitalsTracker } from './components/WebVitalsTracker';
import { Web3Route } from './components/Web3Route';
import { AccessibilityProvider } from './components/accessibility/AccessibilityContext';

// Eagerly loaded pages (critical path - only Home and Auth pages)
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';

// Lazy loaded main pages (improves initial bundle size)
const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const Learn = lazy(() => import('./pages/Learn').then(m => ({ default: m.Learn })));
const Compare = lazy(() => import('./pages/Compare').then(m => ({ default: m.Compare })));
const Calculators = lazy(() => import('./pages/Calculators').then(m => ({ default: m.Calculators })));

// Lazy loaded pages for better initial bundle size
const Charts = lazy(() => import('./pages/Charts').then(m => ({ default: m.Charts })));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword').then(m => ({ default: m.ForgotPassword })));
const ResetPassword = lazy(() => import('./pages/ResetPassword').then(m => ({ default: m.ResetPassword })));
const Profile = lazy(() => import('./pages/Profile').then(m => ({ default: m.Profile })));
const GuideDetail = lazy(() => import('./pages/GuideDetail').then(m => ({ default: m.GuideDetail })));
const CourseLanding = lazy(() => import('./pages/CourseLanding').then(m => ({ default: m.CourseLanding })));
const CourseModule = lazy(() => import('./pages/CourseModule').then(m => ({ default: m.CourseModule })));
const Glossary = lazy(() => import('./pages/Glossary').then(m => ({ default: m.Glossary })));
const Article = lazy(() => import('./pages/Article').then(m => ({ default: m.Article })));
const Privacy = lazy(() => import('./pages/Privacy').then(m => ({ default: m.Privacy })));
const Terms = lazy(() => import('./pages/Terms').then(m => ({ default: m.Terms })));
const AffiliateStats = lazy(() => import('./pages/AffiliateStats').then(m => ({ default: m.AffiliateStats })));
const AdManager = lazy(() => import('./pages/AdManager').then(m => ({ default: m.AdManager })));
const Pricing = lazy(() => import('./pages/Pricing').then(m => ({ default: m.Pricing })));
const Web3Features = lazy(() => import('./pages/Web3Features').then(m => ({ default: m.Web3Features })));
const UserManagement = lazy(() => import('./pages/UserManagement').then(m => ({ default: m.UserManagement })));
const ScamDatabase = lazy(() => import('./pages/ScamDatabase').then(m => ({ default: m.ScamDatabase })));
const ScamReportDetail = lazy(() => import('./pages/ScamReportDetail').then(m => ({ default: m.ScamReportDetail })));
const ReportScam = lazy(() => import('./pages/ReportScam').then(m => ({ default: m.ReportScam })));
const AdminAISettings = lazy(() => import('./pages/AdminAISettings').then(m => ({ default: m.AdminAISettings })));
const TaxReports = lazy(() => import('./pages/TaxReports'));
const AdvisorDashboard = lazy(() => import('./pages/AdvisorDashboard').then(m => ({ default: m.AdvisorDashboard })));
const InfluencerDashboard = lazy(() => import('./pages/InfluencerDashboard').then(m => ({ default: m.InfluencerDashboard })));
const Backtesting = lazy(() => import('./pages/Backtesting').then(m => ({ default: m.Backtesting })));
const PortfolioAnalysis = lazy(() => import('./pages/PortfolioAnalysis').then(m => ({ default: m.PortfolioAnalysis })));
const SearchResults = lazy(() => import('./pages/SearchResults').then(m => ({ default: m.SearchResults })));
const ApiPricing = lazy(() => import('./pages/ApiPricing').then(m => ({ default: m.ApiPricing })));
const DeveloperPortal = lazy(() => import('./pages/DeveloperPortal').then(m => ({ default: m.DeveloperPortal })));
const AdvertiserDashboard = lazy(() => import('./pages/AdvertiserDashboard').then(m => ({ default: m.AdvertiserDashboard })));
const InfluencerVerification = lazy(() => import('./pages/InfluencerVerification'));
const LendingComparison = lazy(() => import('./pages/LendingComparison'));
const SocialTrading = lazy(() => import('./pages/SocialTrading'));
const OnChainAnalytics = lazy(() => import('./pages/OnChainAnalytics'));
const HardwareWallet = lazy(() => import('./pages/HardwareWallet'));
const GasOptimizer = lazy(() => import('./pages/GasOptimizer'));
const DeFiYield = lazy(() => import('./pages/DeFiYield'));
const RetirementCalculator = lazy(() => import('./pages/RetirementCalculator'));
const MultiExchange = lazy(() => import('./pages/MultiExchange'));
const StakingCalculator = lazy(() => import('./pages/StakingCalculator'));
const TradingIndicators = lazy(() => import('./pages/TradingIndicators'));
const WhaleTrackingPage = lazy(() => import('./pages/WhaleTracking'));
const RebalancingAlertsPage = lazy(() => import('./pages/RebalancingAlerts'));
const DCAAutomationPage = lazy(() => import('./pages/DCAAutomation'));
const SmartAlertBundlesPage = lazy(() => import('./pages/SmartAlertBundles'));
const Accessibility = lazy(() => import('./pages/Accessibility').then(m => ({ default: m.Accessibility })));
const NotFound = lazy(() => import('./pages/NotFound').then(m => ({ default: m.NotFound })));

// Admin Layout and Pages (lazy loaded)
const AdminLayout = lazy(() => import('./components/admin/AdminLayout').then(m => ({ default: m.AdminLayout })));
const AdminOverview = lazy(() => import('./pages/admin').then(m => ({ default: m.AdminOverview })));
const AuditLogs = lazy(() => import('./pages/admin').then(m => ({ default: m.AuditLogs })));
const ContentModeration = lazy(() => import('./pages/admin').then(m => ({ default: m.ContentModeration })));
const SupportTickets = lazy(() => import('./pages/admin').then(m => ({ default: m.SupportTickets })));
const SystemSettings = lazy(() => import('./pages/admin').then(m => ({ default: m.SystemSettings })));
const AdminAnalytics = lazy(() => import('./pages/admin').then(m => ({ default: m.AdminAnalytics })));
const AdminSubscriptions = lazy(() => import('./pages/admin').then(m => ({ default: m.AdminSubscriptions })));
const AdminNewsletters = lazy(() => import('./pages/admin').then(m => ({ default: m.AdminNewsletters })));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes (previously cacheTime)
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppErrorBoundary>
        <AccessibilityProvider>
        <AnalyticsProvider domain="bitcoinvestments.net">
          <PageTracker />
          <WebVitalsTracker />
          <ToastProvider>
          <AuthProvider>
            <SessionExpiredModal />
            <SessionActivityTracker />
            <Suspense fallback={<PageLoader message="Loading page..." />}>
            <Routes>
                  {/* Admin Panel with dedicated layout */}
                  <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
                    <Route index element={<AdminOverview />} />
                    <Route path="users" element={<UserManagement />} />
                    <Route path="subscriptions" element={<AdminSubscriptions />} />
                    <Route path="scam-database" element={<ScamDatabase />} />
                    <Route path="content" element={<ContentModeration />} />
                    <Route path="support" element={<SupportTickets />} />
                    <Route path="ai-settings" element={<AdminAISettings />} />
                    <Route path="audit-logs" element={<AuditLogs />} />
                    <Route path="newsletters" element={<AdminNewsletters />} />
                    <Route path="analytics" element={<AdminAnalytics />} />
                    <Route path="settings" element={<AdminRoute requiredRole="super_admin"><SystemSettings /></AdminRoute>} />
                  </Route>

                <Route path="/" element={<Layout />}>
                  <Route index element={<Home />} />
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="charts" element={<Charts />} />
                  <Route path="calculators" element={<Calculators />} />
                  <Route path="compare" element={<Compare />} />
                  <Route path="compare/:type/:id" element={<Compare />} />
                  {/* Web3 routes - lazily load Web3 providers only when needed */}
                  <Route path="web3" element={<Web3Route><Web3Features /></Web3Route>} />
                  <Route path="scam-database" element={<ScamDatabase />} />
                  <Route path="scam/:id" element={<ScamReportDetail />} />
                  <Route path="report-scam" element={<ProtectedRoute><ReportScam /></ProtectedRoute>} />
                  <Route path="login" element={<Login />} />
                  <Route path="signup" element={<Signup />} />
                  <Route path="forgot-password" element={<ForgotPassword />} />
                  <Route path="reset-password" element={<ResetPassword />} />
                  <Route path="profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                  <Route path="affiliate-stats" element={<ProtectedRoute><AffiliateStats /></ProtectedRoute>} />
                  <Route path="ad-manager" element={<ProtectedRoute><AdManager /></ProtectedRoute>} />
                  <Route path="tax-reports" element={<ProtectedRoute><TaxReports /></ProtectedRoute>} />
                  <Route path="advisor" element={<ProtectedRoute><AdvisorDashboard /></ProtectedRoute>} />
                  <Route path="affiliate" element={<ProtectedRoute><InfluencerDashboard /></ProtectedRoute>} />
                  <Route path="backtesting" element={<Backtesting />} />
                  <Route path="portfolio-analysis" element={<ProtectedRoute><PortfolioAnalysis /></ProtectedRoute>} />

                  {/* Legacy Admin Routes - redirect to new admin panel */}

                  <Route path="search" element={<SearchResults />} />
                  <Route path="learn" element={<Learn />} />
                  <Route path="learn/:guideId" element={<GuideDetail />} />
                  <Route path="course/:courseId" element={<CourseLanding />} />
                  <Route path="course/:courseId/:moduleId" element={<CourseModule />} />
                  <Route path="glossary" element={<Glossary />} />
                  <Route path="article/:slug" element={<Article />} />
                  <Route path="privacy" element={<Privacy />} />
                  <Route path="terms" element={<Terms />} />
                  <Route path="disclaimer" element={<Terms />} />
                  <Route path="pricing" element={<Pricing />} />
                  <Route path="developers/pricing" element={<ApiPricing />} />
                  <Route path="developers/portal" element={<ProtectedRoute><DeveloperPortal /></ProtectedRoute>} />
                  <Route path="developers/docs" element={<ApiPricing />} />
                  <Route path="advertiser" element={<ProtectedRoute><AdvertiserDashboard /></ProtectedRoute>} />

                  {/* Advanced Monetization Features */}
                  <Route path="influencer-verification" element={<InfluencerVerification />} />
                  <Route path="lending" element={<LendingComparison />} />
                  <Route path="social-trading" element={<SocialTrading />} />
                  <Route path="onchain-analytics" element={<Web3Route><OnChainAnalytics /></Web3Route>} />

                  {/* Premium Crypto Features */}
                  <Route path="hardware-wallet" element={<HardwareWallet />} />
                  <Route path="gas-optimizer" element={<Web3Route><GasOptimizer /></Web3Route>} />
                  <Route path="defi-yield" element={<Web3Route><DeFiYield /></Web3Route>} />
                  <Route path="retirement-calculator" element={<RetirementCalculator />} />

                  {/* New Premium Monetization Features */}
                  <Route path="multi-exchange" element={<Web3Route><MultiExchange /></Web3Route>} />
                  <Route path="staking-calculator" element={<Web3Route><StakingCalculator /></Web3Route>} />
                  <Route path="trading-indicators" element={<TradingIndicators />} />
                  <Route path="whale-tracking" element={<WhaleTrackingPage />} />
                  <Route path="rebalancing-alerts" element={<RebalancingAlertsPage />} />
                  <Route path="dca-automation" element={<DCAAutomationPage />} />
                  <Route path="alert-bundles" element={<SmartAlertBundlesPage />} />

                  <Route path="accessibility" element={<Accessibility />} />
                  <Route path="start" element={<Learn />} />
                  <Route path="prices" element={<Dashboard />} />
                  <Route path="404" element={<NotFound />} />
                  <Route path="*" element={<NotFound />} />
                </Route>
              </Routes>
            </Suspense>
          </AuthProvider>
          </ToastProvider>
        </AnalyticsProvider>
        </AccessibilityProvider>
        </AppErrorBoundary>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
