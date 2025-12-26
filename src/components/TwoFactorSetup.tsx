import { useState, useEffect } from 'react';
import { Shield, Copy, Check, AlertTriangle, Smartphone, Key, X } from 'lucide-react';
import {
  generateSecret,
  generateRecoveryCodes,
  generateOTPAuthURI,
  verifyTOTP,
  enableTwoFactor,
  disableTwoFactor,
  getTwoFactorSettings,
  type TwoFactorSettings,
} from '../services/twoFactor';

interface TwoFactorSetupProps {
  userId: string;
  userEmail: string;
  onComplete?: () => void;
}

type SetupStep = 'initial' | 'setup' | 'verify' | 'recovery' | 'complete' | 'disable';

export function TwoFactorSetup({ userId, userEmail, onComplete }: TwoFactorSetupProps) {
  const [step, setStep] = useState<SetupStep>('initial');
  const [settings, setSettings] = useState<TwoFactorSettings | null>(null);
  const [secret, setSecret] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [verificationCode, setVerificationCode] = useState('');
  const [disableCode, setDisableCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [recoveryCodesCopied, setRecoveryCodesCopied] = useState(false);

  const loadSettings = async () => {
    setLoading(true);
    const twoFactorSettings = await getTwoFactorSettings(userId);
    setSettings(twoFactorSettings);
    setLoading(false);
  };

  useEffect(() => {
    loadSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const startSetup = () => {
    const newSecret = generateSecret();
    const codes = generateRecoveryCodes();
    setSecret(newSecret);
    setRecoveryCodes(codes);
    setStep('setup');
    setError(null);
  };

  const handleVerify = async () => {
    setError(null);

    if (!verificationCode || verificationCode.length !== 6) {
      setError('Please enter a 6-digit code');
      return;
    }

    const isValid = await verifyTOTP(secret, verificationCode);

    if (!isValid) {
      setError('Invalid verification code. Please try again.');
      return;
    }

    setStep('recovery');
  };

  const handleComplete = async () => {
    setError(null);

    const { error: enableError } = await enableTwoFactor(userId, secret, recoveryCodes);

    if (enableError) {
      setError(enableError);
      return;
    }

    setStep('complete');
    await loadSettings();
    onComplete?.();
  };

  const handleDisable = async () => {
    setError(null);

    if (!disableCode || disableCode.length !== 6) {
      setError('Please enter your 6-digit authentication code');
      return;
    }

    const isValid = await verifyTOTP(settings?.secret || '', disableCode);

    if (!isValid) {
      setError('Invalid verification code');
      return;
    }

    const { error: disableError } = await disableTwoFactor(userId);

    if (disableError) {
      setError(disableError);
      return;
    }

    setStep('initial');
    setDisableCode('');
    await loadSettings();
    onComplete?.();
  };

  const copyToClipboard = (text: string, type: 'secret' | 'recovery') => {
    navigator.clipboard.writeText(text);
    if (type === 'secret') {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else {
      setRecoveryCodesCopied(true);
      setTimeout(() => setRecoveryCodesCopied(false), 2000);
    }
  };

  const formatSecret = (s: string) => {
    return s.match(/.{1,4}/g)?.join(' ') || s;
  };

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-700 rounded w-1/3"></div>
          <div className="h-20 bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  // 2FA is already enabled
  if (settings?.is_enabled && (step === 'initial' || step === 'disable')) {
    return (
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-green-500/20 rounded-lg">
            <Shield className="w-6 h-6 text-green-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white mb-1">
              Two-Factor Authentication Enabled
            </h3>
            <p className="text-sm text-gray-400 mb-4">
              Your account is protected with 2FA.
              {settings.enabled_at && (
                <span className="block mt-1">
                  Enabled on {new Date(settings.enabled_at).toLocaleDateString()}
                </span>
              )}
            </p>
            <button
              onClick={() => setStep('disable')}
              className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors text-sm font-medium"
            >
              Disable 2FA
            </button>
          </div>
        </div>

        {/* Disable Modal */}
        {step === 'disable' && (
          <div className="mt-6 pt-6 border-t border-gray-700">
            <h4 className="text-white font-medium mb-3">Disable Two-Factor Authentication</h4>
            <p className="text-sm text-gray-400 mb-4">
              Enter your current 2FA code to disable two-factor authentication.
            </p>

            {error && (
              <div className="mb-4 p-3 bg-red-900/30 border border-red-500/30 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <input
                type="text"
                value={disableCode}
                onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                className="flex-1 px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white text-center text-xl tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-red-500"
                maxLength={6}
              />
              <button
                onClick={handleDisable}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors font-medium"
              >
                Disable
              </button>
              <button
                onClick={() => {
                  setStep('initial');
                  setDisableCode('');
                  setError(null);
                }}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Initial state - 2FA not enabled
  if (step === 'initial') {
    return (
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-orange-500/20 rounded-lg">
            <Shield className="w-6 h-6 text-orange-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white mb-1">
              Two-Factor Authentication
            </h3>
            <p className="text-sm text-gray-400 mb-4">
              Add an extra layer of security to your account by requiring a verification code
              from your authenticator app when signing in.
            </p>
            <button
              onClick={startSetup}
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors text-sm font-medium"
            >
              Enable 2FA
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Setup step - show QR code and secret
  if (step === 'setup') {
    const otpAuthURI = generateOTPAuthURI(secret, userEmail);

    return (
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-orange-500/20 rounded-lg">
            <Smartphone className="w-5 h-5 text-orange-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Set Up Authenticator</h3>
            <p className="text-sm text-gray-400">Step 1 of 3</p>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <p className="text-sm text-gray-300 mb-4">
              Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
              or manually enter the secret key below.
            </p>

            {/* QR Code placeholder - in production, use a QR code library */}
            <div className="bg-white p-4 rounded-lg w-fit mx-auto mb-4">
              <div className="w-48 h-48 bg-gray-100 flex items-center justify-center">
                <div className="text-center text-gray-500 text-xs p-2">
                  <p className="font-medium mb-2">QR Code</p>
                  <p className="break-all text-[10px]">{otpAuthURI.slice(0, 60)}...</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-700 rounded-lg p-4">
              <p className="text-xs text-gray-400 mb-2">Or enter this key manually:</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-lg font-mono text-white tracking-wider">
                  {formatSecret(secret)}
                </code>
                <button
                  onClick={() => copyToClipboard(secret, 'secret')}
                  className="p-2 hover:bg-gray-600 rounded-lg transition-colors"
                  title="Copy to clipboard"
                >
                  {copied ? (
                    <Check className="w-5 h-5 text-green-400" />
                  ) : (
                    <Copy className="w-5 h-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-between">
            <button
              onClick={() => setStep('initial')}
              className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => setStep('verify')}
              className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors font-medium"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Verify step
  if (step === 'verify') {
    return (
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-orange-500/20 rounded-lg">
            <Key className="w-5 h-5 text-orange-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Verify Setup</h3>
            <p className="text-sm text-gray-400">Step 2 of 3</p>
          </div>
        </div>

        <div className="space-y-6">
          <p className="text-sm text-gray-300">
            Enter the 6-digit code from your authenticator app to verify the setup.
          </p>

          {error && (
            <div className="p-3 bg-red-900/30 border border-red-500/30 rounded-lg text-red-400 text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <div>
            <input
              type="text"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              className="w-full px-4 py-4 bg-gray-700 border border-gray-600 rounded-lg text-white text-center text-2xl tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-orange-500"
              maxLength={6}
              autoFocus
            />
          </div>

          <div className="flex justify-between">
            <button
              onClick={() => {
                setStep('setup');
                setVerificationCode('');
                setError(null);
              }}
              className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
            >
              Back
            </button>
            <button
              onClick={handleVerify}
              disabled={verificationCode.length !== 6}
              className="px-6 py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-500/50 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
            >
              Verify
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Recovery codes step
  if (step === 'recovery') {
    return (
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-orange-500/20 rounded-lg">
            <Key className="w-5 h-5 text-orange-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Save Recovery Codes</h3>
            <p className="text-sm text-gray-400">Step 3 of 3</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-200">
                <p className="font-medium mb-1">Save these recovery codes</p>
                <p className="text-yellow-200/80">
                  If you lose access to your authenticator app, you can use one of these codes
                  to sign in. Each code can only be used once. Store them securely.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-400">Recovery Codes</span>
              <button
                onClick={() => copyToClipboard(recoveryCodes.join('\n'), 'recovery')}
                className="flex items-center gap-1 text-sm text-orange-400 hover:text-orange-300 transition-colors"
              >
                {recoveryCodesCopied ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy all
                  </>
                )}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {recoveryCodes.map((code, index) => (
                <code
                  key={index}
                  className="bg-gray-800 px-3 py-2 rounded text-sm font-mono text-white"
                >
                  {code}
                </code>
              ))}
            </div>
          </div>

          <div className="flex justify-between">
            <button
              onClick={() => setStep('verify')}
              className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
            >
              Back
            </button>
            <button
              onClick={handleComplete}
              className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors font-medium"
            >
              Complete Setup
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Complete step
  if (step === 'complete') {
    return (
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-400" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">2FA Enabled Successfully!</h3>
          <p className="text-gray-400 mb-6">
            Your account is now protected with two-factor authentication.
          </p>
          <button
            onClick={() => setStep('initial')}
            className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors font-medium"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  return null;
}
