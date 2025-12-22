import { useState, useEffect } from 'react';
import { Monitor, Smartphone, Clock, MapPin, Trash2, LogOut, AlertCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import {
  getUserSessions,
  terminateSession,
  type Session,
} from '../services/sessionManager';

export function SessionsManager() {
  const { user, signOutAllDevices } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [terminating, setTerminating] = useState<string | null>(null);
  const [signingOutAll, setSigningOutAll] = useState(false);

  const fetchSessions = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    const { sessions: userSessions, error: fetchError } = await getUserSessions(user.id);

    if (fetchError) {
      setError(fetchError);
    } else {
      setSessions(userSessions);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchSessions();
  }, [user]);

  const handleTerminateSession = async (sessionId: string) => {
    if (!user) return;

    setTerminating(sessionId);

    const { error: terminateError } = await terminateSession(sessionId, user.id);

    if (terminateError) {
      setError(terminateError);
    } else {
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    }

    setTerminating(null);
  };

  const handleSignOutAll = async () => {
    setSigningOutAll(true);
    await signOutAllDevices();
    // User will be redirected after sign out
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  const getDeviceIcon = (deviceInfo: string) => {
    if (deviceInfo.includes('Mobile') || deviceInfo.includes('Android') || deviceInfo.includes('iOS')) {
      return <Smartphone className="h-5 w-5" />;
    }
    return <Monitor className="h-5 w-5" />;
  };

  if (loading) {
    return (
      <div className="bg-slate-800/50 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Active Sessions</h3>
        </div>
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="h-6 w-6 text-slate-400 animate-spin" />
          <span className="ml-2 text-slate-400">Loading sessions...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/50 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Active Sessions</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchSessions}
            className="p-2 text-slate-400 hover:text-white transition-colors"
            title="Refresh sessions"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          {sessions.length > 1 && (
            <button
              onClick={handleSignOutAll}
              disabled={signingOutAll}
              className="flex items-center gap-2 px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors text-sm disabled:opacity-50"
            >
              {signingOutAll ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <LogOut className="h-4 w-4" />
              )}
              Sign out all devices
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-500/20 text-red-400 rounded-lg mb-4">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      <p className="text-slate-400 text-sm mb-4">
        These are the devices that are currently logged into your account. You can sign out any session you don't recognize.
      </p>

      {sessions.length === 0 ? (
        <div className="text-center py-8 text-slate-400">
          <Monitor className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>No active sessions found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((session) => (
            <div
              key={session.id}
              className={`flex items-center justify-between p-4 rounded-lg border ${
                session.is_current
                  ? 'bg-orange-500/10 border-orange-500/30'
                  : 'bg-slate-700/50 border-slate-700'
              }`}
            >
              <div className="flex items-center gap-4">
                <div
                  className={`p-2 rounded-lg ${
                    session.is_current ? 'bg-orange-500/20 text-orange-400' : 'bg-slate-600 text-slate-300'
                  }`}
                >
                  {getDeviceIcon(session.device_info)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white">{session.device_info}</span>
                    {session.is_current && (
                      <span className="px-2 py-0.5 bg-orange-500/20 text-orange-400 text-xs rounded-full">
                        Current Session
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-sm text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      Last active: {formatDate(session.last_activity_at)}
                    </span>
                    {session.ip_address && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {session.ip_address}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {!session.is_current && (
                <button
                  onClick={() => handleTerminateSession(session.id)}
                  disabled={terminating === session.id}
                  className="flex items-center gap-1 px-3 py-1.5 bg-slate-600 text-slate-300 rounded-lg hover:bg-red-500/20 hover:text-red-400 transition-colors text-sm disabled:opacity-50"
                >
                  {terminating === session.id ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  <span>End Session</span>
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 p-3 bg-slate-700/30 rounded-lg">
        <p className="text-xs text-slate-400">
          <strong>Security tip:</strong> If you see a session you don't recognize, end it immediately and
          consider changing your password. Enable 2FA for additional security.
        </p>
      </div>
    </div>
  );
}
