import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, LogIn, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export function SessionExpiredModal() {
  const { sessionExpired, clearSessionExpired } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Prevent scrolling when modal is open
    if (sessionExpired) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [sessionExpired]);

  if (!sessionExpired) {
    return null;
  }

  const handleLogin = () => {
    clearSessionExpired();
    navigate('/login');
  };

  const handleDismiss = () => {
    clearSessionExpired();
    navigate('/');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={handleDismiss}
      />

      {/* Modal */}
      <div className="relative bg-slate-800 rounded-xl p-6 max-w-md mx-4 shadow-2xl border border-slate-700">
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="text-center">
          {/* Icon */}
          <div className="w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="h-8 w-8 text-orange-400" />
          </div>

          {/* Title */}
          <h2 className="text-xl font-bold text-white mb-2">Session Expired</h2>

          {/* Description */}
          <p className="text-slate-400 mb-6">
            Your session has expired due to inactivity. Please sign in again to continue using your account.
          </p>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <button
              onClick={handleLogin}
              className="flex items-center justify-center gap-2 w-full py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium"
            >
              <LogIn className="h-5 w-5" />
              Sign In Again
            </button>

            <button
              onClick={handleDismiss}
              className="w-full py-2 text-slate-400 hover:text-white transition-colors"
            >
              Continue as Guest
            </button>
          </div>
        </div>

        {/* Security note */}
        <div className="mt-4 p-3 bg-slate-700/50 rounded-lg">
          <p className="text-xs text-slate-400 text-center">
            For your security, sessions automatically expire after 30 minutes of inactivity.
          </p>
        </div>
      </div>
    </div>
  );
}
