import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import '@rainbow-me/rainbowkit/styles.css';
import { Layout } from './components/Layout/Layout';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AdminRoute } from './components/AdminRoute';
import { Home } from './pages/Home';
import { Dashboard } from './pages/Dashboard';
import { Calculators } from './pages/Calculators';
import { Compare } from './pages/Compare';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { ForgotPassword } from './pages/ForgotPassword';
import { Profile } from './pages/Profile';
import { Learn } from './pages/Learn';
import { GuideDetail } from './pages/GuideDetail';
import { CourseLanding } from './pages/CourseLanding';
import { CourseModule } from './pages/CourseModule';
import { Glossary } from './pages/Glossary';
import { Article } from './pages/Article';
import { Privacy } from './pages/Privacy';
import { Terms } from './pages/Terms';
import { AffiliateStats } from './pages/AffiliateStats';
import { AdManager } from './pages/AdManager';
import { Pricing } from './pages/Pricing';
import { Charts } from './pages/Charts';
import { Web3Features } from './pages/Web3Features';
import { AdminDashboard } from './pages/AdminDashboard';
import { UserManagement } from './pages/UserManagement';
import { ScamDatabase } from './pages/ScamDatabase';
import { AdminAISettings } from './pages/AdminAISettings';
import TaxReports from './pages/TaxReports';
import { wagmiConfig } from './lib/wagmi';

const queryClient = new QueryClient();

function App() {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <BrowserRouter>
            <AuthProvider>
              <Routes>
                <Route path="/" element={<Layout />}>
                  <Route index element={<Home />} />
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="charts" element={<Charts />} />
                  <Route path="calculators" element={<Calculators />} />
                  <Route path="compare" element={<Compare />} />
                  <Route path="compare/:type/:id" element={<Compare />} />
                  <Route path="web3" element={<Web3Features />} />
                  <Route path="scam-database" element={<ScamDatabase />} />
                  <Route path="login" element={<Login />} />
                  <Route path="signup" element={<Signup />} />
                  <Route path="forgot-password" element={<ForgotPassword />} />
                  <Route path="profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                  <Route path="affiliate-stats" element={<ProtectedRoute><AffiliateStats /></ProtectedRoute>} />
                  <Route path="ad-manager" element={<ProtectedRoute><AdManager /></ProtectedRoute>} />
                  <Route path="tax-reports" element={<ProtectedRoute><TaxReports /></ProtectedRoute>} />

                  {/* Admin Routes - require admin role */}
                  <Route path="admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
                  <Route path="admin/users" element={<AdminRoute><UserManagement /></AdminRoute>} />
                  <Route path="admin/scam-database" element={<AdminRoute><ScamDatabase /></AdminRoute>} />
                  <Route path="admin/ai-settings" element={<AdminRoute><AdminAISettings /></AdminRoute>} />

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
                  <Route path="start" element={<Learn />} />
                  <Route path="prices" element={<Dashboard />} />
                  <Route path="*" element={<Home />} />
                </Route>
              </Routes>
            </AuthProvider>
          </BrowserRouter>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App;
