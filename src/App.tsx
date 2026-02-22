import { lazy, Suspense, type ReactNode } from 'react';
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
import { AppErrorBoundary, PageErrorBoundary } from './components/ErrorBoundary';
import { PageLoader } from './components/LoadingSkeletons';
import { WebVitalsTracker } from './components/WebVitalsTracker';
import { AccessibilityProvider } from './components/accessibility/AccessibilityContext';
import { useApiToastBridge } from './hooks/useApiToastBridge';

/**
 * Wraps a page element in a PageErrorBoundary so that a crash in one route
 * does not take down the entire application. The layout, header, and
 * navigation remain functional even when a single page throws.
 */
function withErrorBoundary(element: ReactNode, pageName: string): ReactNode {
  return <PageErrorBoundary pageName={pageName}>{element}</PageErrorBoundary>;
}

/**
 * Bridges the apiClient error/warning notifications to the Toast UI.
 * Must be rendered inside ToastProvider so it has access to toast context.
 */
function ApiToastBridge() {
  useApiToastBridge();
  return null;
}

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
const CoinDetail = lazy(() => import('./pages/CoinDetail').then(m => ({ default: m.CoinDetail })));
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
const AdminBlogList = lazy(() => import('./pages/admin/AdminBlogList').then(m => ({ default: m.AdminBlogList })));
const AdminBlogEditor = lazy(() => import('./pages/admin/AdminBlogEditor').then(m => ({ default: m.AdminBlogEditor })));
const AdminBlogCategories = lazy(() => import('./pages/admin/AdminBlogCategories').then(m => ({ default: m.AdminBlogCategories })));

// Public Blog Pages (lazy loaded)
const Blog = lazy(() => import('./pages/Blog').then(m => ({ default: m.Blog })));
const BlogPost = lazy(() => import('./pages/BlogPost').then(m => ({ default: m.BlogPost })));

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
          <ApiToastBridge />
          <AuthProvider>
            <SessionExpiredModal />
            <SessionActivityTracker />
            <Suspense fallback={<PageLoader message="Loading page..." />}>
            <Routes>
                  {/* Admin Panel with dedicated layout */}
                  <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
                    <Route index element={withErrorBoundary(<AdminOverview />, 'AdminOverview')} />
                    <Route path="users" element={withErrorBoundary(<UserManagement />, 'UserManagement')} />
                    <Route path="subscriptions" element={withErrorBoundary(<AdminSubscriptions />, 'AdminSubscriptions')} />
                    <Route path="scam-database" element={withErrorBoundary(<ScamDatabase />, 'AdminScamDatabase')} />
                    <Route path="content" element={withErrorBoundary(<ContentModeration />, 'ContentModeration')} />
                    <Route path="support" element={withErrorBoundary(<SupportTickets />, 'SupportTickets')} />
                    <Route path="ai-settings" element={withErrorBoundary(<AdminAISettings />, 'AdminAISettings')} />
                    <Route path="audit-logs" element={withErrorBoundary(<AuditLogs />, 'AuditLogs')} />
                    <Route path="newsletters" element={withErrorBoundary(<AdminNewsletters />, 'AdminNewsletters')} />
                    <Route path="analytics" element={withErrorBoundary(<AdminAnalytics />, 'AdminAnalytics')} />
                    <Route path="settings" element={<AdminRoute requiredRole="super_admin">{withErrorBoundary(<SystemSettings />, 'SystemSettings')}</AdminRoute>} />
                    {/* Blog Admin Routes */}
                    <Route path="blog" element={withErrorBoundary(<AdminBlogList />, 'AdminBlogList')} />
                    <Route path="blog/new" element={withErrorBoundary(<AdminBlogEditor />, 'AdminBlogEditor')} />
                    <Route path="blog/edit/:id" element={withErrorBoundary(<AdminBlogEditor />, 'AdminBlogEditor')} />
                    <Route path="blog/categories" element={withErrorBoundary(<AdminBlogCategories />, 'AdminBlogCategories')} />
                  </Route>

                <Route path="/" element={<Layout />}>
                  <Route index element={withErrorBoundary(<Home />, 'Home')} />
                  <Route path="dashboard" element={withErrorBoundary(<Dashboard />, 'Dashboard')} />
                  <Route path="charts" element={withErrorBoundary(<Charts />, 'Charts')} />
                  <Route path="coin/:id" element={withErrorBoundary(<CoinDetail />, 'CoinDetail')} />
                  <Route path="calculators" element={withErrorBoundary(<Calculators />, 'Calculators')} />
                  <Route path="compare" element={withErrorBoundary(<Compare />, 'Compare')} />
                  <Route path="compare/:type/:id" element={withErrorBoundary(<Compare />, 'CompareDetail')} />
                  {/* Web3 routes - manual wallet tracking (no wallet connection) */}
                  <Route path="web3" element={withErrorBoundary(<Web3Features />, 'Web3Features')} />
                  <Route path="scam-database" element={withErrorBoundary(<ScamDatabase />, 'ScamDatabase')} />
                  <Route path="scam/:id" element={withErrorBoundary(<ScamReportDetail />, 'ScamReportDetail')} />
                  <Route path="report-scam" element={<ProtectedRoute>{withErrorBoundary(<ReportScam />, 'ReportScam')}</ProtectedRoute>} />
                  <Route path="login" element={withErrorBoundary(<Login />, 'Login')} />
                  <Route path="signup" element={withErrorBoundary(<Signup />, 'Signup')} />
                  <Route path="forgot-password" element={withErrorBoundary(<ForgotPassword />, 'ForgotPassword')} />
                  <Route path="reset-password" element={withErrorBoundary(<ResetPassword />, 'ResetPassword')} />
                  <Route path="profile" element={<ProtectedRoute>{withErrorBoundary(<Profile />, 'Profile')}</ProtectedRoute>} />
                  <Route path="affiliate-stats" element={<ProtectedRoute>{withErrorBoundary(<AffiliateStats />, 'AffiliateStats')}</ProtectedRoute>} />
                  <Route path="ad-manager" element={<ProtectedRoute>{withErrorBoundary(<AdManager />, 'AdManager')}</ProtectedRoute>} />
                  <Route path="tax-reports" element={<ProtectedRoute>{withErrorBoundary(<TaxReports />, 'TaxReports')}</ProtectedRoute>} />
                  <Route path="advisor" element={<ProtectedRoute>{withErrorBoundary(<AdvisorDashboard />, 'AdvisorDashboard')}</ProtectedRoute>} />
                  <Route path="affiliate" element={<ProtectedRoute>{withErrorBoundary(<InfluencerDashboard />, 'InfluencerDashboard')}</ProtectedRoute>} />
                  <Route path="backtesting" element={withErrorBoundary(<Backtesting />, 'Backtesting')} />
                  <Route path="portfolio-analysis" element={<ProtectedRoute>{withErrorBoundary(<PortfolioAnalysis />, 'PortfolioAnalysis')}</ProtectedRoute>} />

                  {/* Legacy Admin Routes - redirect to new admin panel */}

                  <Route path="search" element={withErrorBoundary(<SearchResults />, 'SearchResults')} />
                  <Route path="learn" element={withErrorBoundary(<Learn />, 'Learn')} />
                  <Route path="learn/:guideId" element={withErrorBoundary(<GuideDetail />, 'GuideDetail')} />
                  <Route path="course/:courseId" element={withErrorBoundary(<CourseLanding />, 'CourseLanding')} />
                  <Route path="course/:courseId/:moduleId" element={withErrorBoundary(<CourseModule />, 'CourseModule')} />
                  <Route path="glossary" element={withErrorBoundary(<Glossary />, 'Glossary')} />
                  <Route path="article/:slug" element={withErrorBoundary(<Article />, 'Article')} />
                  {/* Blog Routes */}
                  <Route path="blog" element={withErrorBoundary(<Blog />, 'Blog')} />
                  <Route path="blog/category/:category" element={withErrorBoundary(<Blog />, 'BlogCategory')} />
                  <Route path="blog/:slug" element={withErrorBoundary(<BlogPost />, 'BlogPost')} />
                  <Route path="privacy" element={withErrorBoundary(<Privacy />, 'Privacy')} />
                  <Route path="terms" element={withErrorBoundary(<Terms />, 'Terms')} />
                  <Route path="disclaimer" element={withErrorBoundary(<Terms />, 'Disclaimer')} />
                  <Route path="pricing" element={withErrorBoundary(<Pricing />, 'Pricing')} />
                  <Route path="developers/pricing" element={withErrorBoundary(<ApiPricing />, 'ApiPricing')} />
                  <Route path="developers/portal" element={<ProtectedRoute>{withErrorBoundary(<DeveloperPortal />, 'DeveloperPortal')}</ProtectedRoute>} />
                  <Route path="developers/docs" element={withErrorBoundary(<ApiPricing />, 'ApiDocs')} />
                  <Route path="advertiser" element={<ProtectedRoute>{withErrorBoundary(<AdvertiserDashboard />, 'AdvertiserDashboard')}</ProtectedRoute>} />

                  {/* Advanced Monetization Features */}
                  <Route path="influencer-verification" element={withErrorBoundary(<InfluencerVerification />, 'InfluencerVerification')} />
                  <Route path="lending" element={withErrorBoundary(<LendingComparison />, 'LendingComparison')} />
                  <Route path="social-trading" element={withErrorBoundary(<SocialTrading />, 'SocialTrading')} />
                  <Route path="onchain-analytics" element={withErrorBoundary(<OnChainAnalytics />, 'OnChainAnalytics')} />

                  {/* Premium Crypto Features */}
                  <Route path="hardware-wallet" element={withErrorBoundary(<HardwareWallet />, 'HardwareWallet')} />
                  <Route path="gas-optimizer" element={withErrorBoundary(<GasOptimizer />, 'GasOptimizer')} />
                  <Route path="defi-yield" element={withErrorBoundary(<DeFiYield />, 'DeFiYield')} />
                  <Route path="retirement-calculator" element={withErrorBoundary(<RetirementCalculator />, 'RetirementCalculator')} />

                  {/* New Premium Monetization Features */}
                  <Route path="multi-exchange" element={withErrorBoundary(<MultiExchange />, 'MultiExchange')} />
                  <Route path="staking-calculator" element={withErrorBoundary(<StakingCalculator />, 'StakingCalculator')} />
                  <Route path="trading-indicators" element={withErrorBoundary(<TradingIndicators />, 'TradingIndicators')} />
                  <Route path="whale-tracking" element={withErrorBoundary(<WhaleTrackingPage />, 'WhaleTracking')} />
                  <Route path="rebalancing-alerts" element={withErrorBoundary(<RebalancingAlertsPage />, 'RebalancingAlerts')} />
                  <Route path="dca-automation" element={withErrorBoundary(<DCAAutomationPage />, 'DCAAutomation')} />
                  <Route path="alert-bundles" element={withErrorBoundary(<SmartAlertBundlesPage />, 'SmartAlertBundles')} />

                  <Route path="accessibility" element={withErrorBoundary(<Accessibility />, 'Accessibility')} />
                  <Route path="start" element={withErrorBoundary(<Learn />, 'Start')} />
                  <Route path="prices" element={withErrorBoundary(<Dashboard />, 'Prices')} />
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
