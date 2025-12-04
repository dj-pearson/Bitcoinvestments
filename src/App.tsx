import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout/Layout';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Home } from './pages/Home';
import { Dashboard } from './pages/Dashboard';
import { Calculators } from './pages/Calculators';
import { Compare } from './pages/Compare';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { ForgotPassword } from './pages/ForgotPassword';
import { Profile } from './pages/Profile';
import { Learn } from './pages/Learn';
import { Glossary } from './pages/Glossary';
import { Article } from './pages/Article';
import { Privacy } from './pages/Privacy';
import { Terms } from './pages/Terms';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="calculators" element={<Calculators />} />
            <Route path="compare" element={<Compare />} />
            <Route path="compare/:type/:id" element={<Compare />} />
            <Route path="login" element={<Login />} />
            <Route path="signup" element={<Signup />} />
            <Route path="forgot-password" element={<ForgotPassword />} />
            <Route path="profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="learn" element={<Learn />} />
            <Route path="learn/:guideId" element={<Learn />} />
            <Route path="glossary" element={<Glossary />} />
            <Route path="article/:slug" element={<Article />} />
            <Route path="privacy" element={<Privacy />} />
            <Route path="terms" element={<Terms />} />
            <Route path="disclaimer" element={<Terms />} />
            <Route path="start" element={<Learn />} />
            <Route path="prices" element={<Dashboard />} />
            <Route path="*" element={<Home />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
