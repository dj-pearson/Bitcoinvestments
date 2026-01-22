import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Shield, AlertTriangle } from 'lucide-react';
import { signIn, signInWithTwoFactor } from '../services/auth';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { loginFormSchema, validateWithZod, getFieldError } from '../lib/validation';
import { handleError } from '../lib/apiError';
import type { UserRole } from '../types/admin-database';

interface LocationState {
  from?: string | { pathname: string };
  isAdmin?: boolean;
}

export function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading, initializeSession } = useAuth();
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  // 2FA state
  const [requires2FA, setRequires2FA] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [useRecoveryCode, setUseRecoveryCode] = useState(false);

  // Store password securely for 2FA re-authentication (cleared after use)
  const pendingPasswordRef = useRef<string | null>(null);

  // Get the redirect location from state (if coming from a protected route)
  const locationState = location.state as LocationState | null;
  // Handle both string and Location object from different route types
  const fromPath = typeof locationState?.from === 'string' 
    ? locationState.from 
    : locationState?.from?.pathname;
  const wasAdminRedirect = locationState?.isAdmin;

  /**
   * Determine where to redirect after successful login based on user role and origin
   */
  const getRedirectPath = (userRole?: UserRole): string => {
    // If user came from an admin route, send them back there
    if (fromPath && fromPath.startsWith('/admin')) {
      return fromPath;
    }

    // If user is admin/super_admin, redirect to admin dashboard
    if (userRole === 'admin' || userRole === 'super_admin') {
      return '/admin';
    }

    // If user came from another protected route, send them back
    if (fromPath && fromPath !== '/login') {
      return fromPath;
    }

    // Default for regular users
    return '/dashboard';
  };

  // Redirect already logged-in users
  useEffect(() => {
    if (!authLoading && user) {
      const redirectPath = getRedirectPath(user.role);
      navigate(redirectPath, { replace: true });
    }
  }, [user, authLoading, navigate, fromPath, wasAdminRedirect]);

  // Clear pending password on unmount for security
  useEffect(() => {
    return () => {
      pendingPasswordRef.current = null;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    setLoading(true);

    // Validate form with Zod
    const validation = validateWithZod(loginFormSchema, { email, password });
    if (!validation.success) {
      setFieldErrors(validation.errors);
      setLoading(false);
      return;
    }

    try {
      const { user, requires2FA: needs2FA, userId, email: userEmail, error: signInError } = await signIn(
        validation.data.email,
        password
      );

      if (signInError) {
        // Use the error handler for user-friendly messages
        const userMessage = handleError(signInError, 'Login');
        setError(userMessage);
        setLoading(false);
        return;
      }

    // Check if 2FA is required
    if (needs2FA && userId) {
      setRequires2FA(true);
      setPendingUserId(userId);
      setPendingEmail(userEmail || email);
      // Store password securely for 2FA re-authentication
      pendingPasswordRef.current = password;
      // Clear password from input for security
      setPassword('');
      setLoading(false);
      return;
    }

      if (user) {
        // Initialize the session for the user
        await initializeSession(user.id);
        toast.success('Welcome back!', 'You have successfully signed in.');
        const redirectPath = getRedirectPath(user.role);
        navigate(redirectPath, { replace: true });
      }
    } catch (err) {
      // Handle unexpected errors with user-friendly message
      const userMessage = handleError(err, 'Login');
      setError(userMessage);
      toast.error('Sign in failed', userMessage);
    } finally {
      setLoading(false);
    }
  };

  const handle2FASubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!pendingUserId || !pendingEmail) {
      setError('Session expired. Please try logging in again.');
      handleBack();
      setLoading(false);
      return;
    }

    // Get stored password for re-authentication
    const storedPassword = pendingPasswordRef.current;
    if (!storedPassword) {
      setError('Session expired. Please try logging in again.');
      handleBack();
      setLoading(false);
      return;
    }

    const { user, error: verifyError } = await signInWithTwoFactor(
      pendingUserId,
      twoFactorCode,
      useRecoveryCode,
      pendingEmail,
      storedPassword
    );

    // Clear stored password immediately after use
    pendingPasswordRef.current = null;

    if (verifyError) {
      setError(verifyError);
      setLoading(false);
      return;
    }

    if (user) {
      // Initialize the session for the user
      await initializeSession(user.id);
      toast.success('Welcome back!', 'Two-factor authentication verified.');
      const redirectPath = getRedirectPath(user.role);
      navigate(redirectPath, { replace: true });
    }
    setLoading(false);
  };

  const handleBack = () => {
    setRequires2FA(false);
    setTwoFactorCode('');
    setPendingUserId(null);
    setPendingEmail(null);
    setUseRecoveryCode(false);
    setError(null);
    // Clear stored password for security
    pendingPasswordRef.current = null;
  };

  // 2FA Verification Screen
  if (requires2FA) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="bg-gray-800 rounded-xl p-8 shadow-xl border border-gray-700">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-orange-400" aria-hidden="true" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">
                {useRecoveryCode ? 'Enter Recovery Code' : 'Two-Factor Authentication'}
              </h1>
              <p className="text-gray-400">
                {useRecoveryCode
                  ? 'Enter one of your recovery codes to sign in.'
                  : 'Enter the 6-digit code from your authenticator app.'}
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-900/50 border border-red-700 rounded-lg text-red-300 text-sm flex items-center gap-2" role="alert" aria-live="assertive">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                {error}
              </div>
            )}

            <form onSubmit={handle2FASubmit} className="space-y-6">
              <div>
                <label htmlFor="2fa-code" className="block text-sm font-medium text-gray-300 mb-2">
                  {useRecoveryCode ? 'Recovery Code' : 'Verification Code'}
                </label>
                {useRecoveryCode ? (
                  <input
                    type="text"
                    id="2fa-code"
                    name="recovery-code"
                    value={twoFactorCode}
                    onChange={(e) => setTwoFactorCode(e.target.value.toUpperCase())}
                    required
                    autoComplete="off"
                    inputMode="text"
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white text-center font-mono text-lg tracking-wider placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="XXXXXXXX"
                    maxLength={8}
                  />
                ) : (
                  <input
                    type="text"
                    id="2fa-code"
                    name="otp-code"
                    value={twoFactorCode}
                    onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    required
                    autoComplete="one-time-code"
                    inputMode="numeric"
                    className="w-full px-4 py-4 bg-gray-700 border border-gray-600 rounded-lg text-white text-center font-mono text-2xl tracking-widest placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="000000"
                    maxLength={6}
                    autoFocus
                  />
                )}
              </div>

              <button
                type="submit"
                disabled={loading || (useRecoveryCode ? twoFactorCode.length < 8 : twoFactorCode.length !== 6)}
                className="w-full py-3 px-4 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-500/50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
              >
                {loading ? 'Verifying...' : 'Verify'}
              </button>
            </form>

            <div className="mt-6 space-y-3">
              <button
                onClick={() => setUseRecoveryCode(!useRecoveryCode)}
                className="w-full text-center text-sm text-orange-400 hover:text-orange-300"
              >
                {useRecoveryCode ? 'Use authenticator app instead' : 'Use a recovery code'}
              </button>

              <button
                onClick={handleBack}
                className="w-full text-center text-sm text-gray-400 hover:text-white"
              >
                Back to login
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Standard Login Screen
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-gray-800 rounded-xl p-8 shadow-xl border border-gray-700">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">
              {wasAdminRedirect ? 'Admin Login' : 'Welcome Back'}
            </h1>
            <p className="text-gray-400">
              {wasAdminRedirect 
                ? 'Sign in to access the admin panel' 
                : 'Sign in to your account'}
            </p>
          </div>

          {wasAdminRedirect && (
            <div className="mb-6 p-4 bg-orange-900/30 border border-orange-700/50 rounded-lg text-orange-300 text-sm flex items-center gap-2" role="status">
              <Shield className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
              <span>Admin credentials required to access this area</span>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-900/50 border border-red-700 rounded-lg text-red-300 text-sm" role="alert" aria-live="assertive">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email Address <span className="text-red-400" aria-hidden="true">*</span>
                <span className="sr-only">(required)</span>
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (fieldErrors.email) {
                    setFieldErrors((prev) => ({ ...prev, email: '' }));
                  }
                }}
                required
                autoComplete="email"
                className={`w-full px-4 py-3 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                  getFieldError(fieldErrors, 'email') ? 'border-red-500' : 'border-gray-600'
                }`}
                placeholder="you@example.com"
                aria-invalid={!!getFieldError(fieldErrors, 'email')}
                aria-describedby={getFieldError(fieldErrors, 'email') ? 'email-error' : undefined}
              />
              {getFieldError(fieldErrors, 'email') && (
                <p id="email-error" className="mt-1 text-sm text-red-400" role="alert">
                  {getFieldError(fieldErrors, 'email')}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Password <span className="text-red-400" aria-hidden="true">*</span>
                <span className="sr-only">(required)</span>
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (fieldErrors.password) {
                    setFieldErrors((prev) => ({ ...prev, password: '' }));
                  }
                }}
                required
                autoComplete="current-password"
                className={`w-full px-4 py-3 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                  getFieldError(fieldErrors, 'password') ? 'border-red-500' : 'border-gray-600'
                }`}
                placeholder="Enter your password"
                aria-invalid={!!getFieldError(fieldErrors, 'password')}
                aria-describedby={getFieldError(fieldErrors, 'password') ? 'password-error' : undefined}
              />
              {getFieldError(fieldErrors, 'password') && (
                <p id="password-error" className="mt-1 text-sm text-red-400" role="alert">
                  {getFieldError(fieldErrors, 'password')}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  id="remember-me"
                  name="remember-me"
                  className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-orange-500 focus:ring-orange-500"
                />
                <span className="ml-2 text-sm text-gray-400">Remember me</span>
              </label>
              <Link to="/forgot-password" className="text-sm text-orange-500 hover:text-orange-400">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-500/50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-400">
              Don't have an account?{' '}
              <Link to="/signup" className="text-orange-500 hover:text-orange-400 font-medium">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
