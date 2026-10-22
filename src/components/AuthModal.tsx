import React, { useState } from 'react';
import {
  X,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'login' | 'register';
  onSuccessNotification?: (msg: string) => void;
}

interface AuthErrorInfo {
  code: string;
  message: string;
  userFacing: string;
  fixAction?: 'unauthorized_domain' | 'operation_not_allowed' | null;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  defaultMode = 'login',
  onSuccessNotification
}) => {
  const { loginWithEmail, registerWithEmail, loginWithGoogle, loginWithDemo, resetPassword } = useAuth();

  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>(defaultMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState<AuthErrorInfo | null>(null);
  const [resetSent, setResetSent] = useState(false);
  const [copiedDomain, setCopiedDomain] = useState(false);

  if (!isOpen) return null;

  const currentDomain = typeof window !== 'undefined' ? window.location.hostname : '';

  const validateEmail = (val: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
  };

  const extractErrorInfo = (err: unknown): AuthErrorInfo => {
    const errObj = err && typeof err === 'object' ? (err as Record<string, any>) : {};
    const rawMsg = err instanceof Error ? err.message : String(err || 'Authentication failed');

    // Extract Firebase error code
    let code = errObj.code || '';
    if (!code && typeof rawMsg === 'string') {
      const match = rawMsg.match(/auth\/[a-zA-Z0-9_-]+/);
      if (match) code = match[0];
    }
    if (!code) code = 'auth/unknown-error';

    let userFacing = rawMsg;
    let fixAction: 'unauthorized_domain' | 'operation_not_allowed' | null = null;

    if (code === 'auth/unauthorized-domain' || rawMsg.includes('unauthorized-domain')) {
      code = 'auth/unauthorized-domain';
      userFacing = `This web domain (${currentDomain}) is not yet authorized in Firebase Console for OAuth sign-in. Add it under Authentication > Settings > Authorized domains.`;
      fixAction = 'unauthorized_domain';
    } else if (code === 'auth/operation-not-allowed' || rawMsg.includes('operation-not-allowed')) {
      code = 'auth/operation-not-allowed';
      userFacing = 'Email/Password sign-in method is currently disabled in Firebase Console. Please enable it under Authentication > Sign-in method.';
      fixAction = 'operation_not_allowed';
    } else if (code === 'auth/email-already-in-use' || rawMsg.includes('email-already-in-use')) {
      code = 'auth/email-already-in-use';
      userFacing = 'An account with this email address already exists. Please switch to Sign In or reset your password.';
    } else if (code === 'auth/invalid-email' || rawMsg.includes('invalid-email')) {
      code = 'auth/invalid-email';
      userFacing = 'The email address format is invalid. Please check for typos.';
    } else if (code === 'auth/weak-password' || rawMsg.includes('weak-password')) {
      code = 'auth/weak-password';
      userFacing = 'Password is too weak. Please use at least 6 characters.';
    } else if (
      code === 'auth/user-not-found' ||
      code === 'auth/wrong-password' ||
      code === 'auth/invalid-credential' ||
      rawMsg.includes('user-not-found') ||
      rawMsg.includes('wrong-password') ||
      rawMsg.includes('invalid-credential')
    ) {
      code = 'auth/invalid-credential';
      userFacing = 'Invalid email or password. Please verify your credentials or register a new account.';
    } else if (code === 'auth/too-many-requests' || rawMsg.includes('too-many-requests')) {
      code = 'auth/too-many-requests';
      userFacing = 'Too many failed login attempts. Access temporarily disabled. Please wait a few moments or reset your password.';
    } else if (code === 'auth/network-request-failed' || rawMsg.includes('network-request-failed')) {
      code = 'auth/network-request-failed';
      userFacing = 'Network connection error. Please check your internet connection.';
    } else if (code === 'auth/popup-closed-by-user' || rawMsg.includes('popup-closed-by-user')) {
      code = 'auth/popup-closed-by-user';
      userFacing = 'Sign-in window was closed before completing.';
    } else if (code === 'auth/popup-blocked' || rawMsg.includes('popup-blocked')) {
      code = 'auth/popup-blocked';
      userFacing = 'Sign-in popup was blocked by your browser. Please allow popups for this site.';
    }

    return {
      code,
      message: rawMsg,
      userFacing,
      fixAction
    };
  };

  const handleCopyDomain = () => {
    if (navigator.clipboard && currentDomain) {
      navigator.clipboard.writeText(currentDomain);
      setCopiedDomain(true);
      setTimeout(() => setCopiedDomain(false), 2500);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    const cleanEmail = email.trim();
    if (!cleanEmail || !validateEmail(cleanEmail)) {
      setAuthError({
        code: 'validation/invalid-email',
        message: 'Please enter a valid email address.',
        userFacing: 'Please enter a valid email address.'
      });
      return;
    }

    if (mode === 'forgot') {
      try {
        setLoading(true);
        await resetPassword(cleanEmail);
        setResetSent(true);
      } catch (err: unknown) {
        setAuthError(extractErrorInfo(err));
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!password || password.length < 6) {
      setAuthError({
        code: 'validation/weak-password',
        message: 'Password must be at least 6 characters long.',
        userFacing: 'Password must be at least 6 characters long.'
      });
      return;
    }

    if (mode === 'register') {
      if (!displayName.trim() || displayName.trim().length < 2) {
        setAuthError({
          code: 'validation/invalid-name',
          message: 'Please enter your full name (at least 2 characters).',
          userFacing: 'Please enter your full name (at least 2 characters).'
        });
        return;
      }
      if (password !== confirmPassword) {
        setAuthError({
          code: 'validation/password-mismatch',
          message: 'Passwords do not match.',
          userFacing: 'Passwords do not match. Please verify your password confirmation.'
        });
        return;
      }
    }

    try {
      setLoading(true);
      if (mode === 'login') {
        await loginWithEmail(cleanEmail, password);
        if (onSuccessNotification) onSuccessNotification('Welcome back! You are now signed in.');
      } else {
        await registerWithEmail(cleanEmail, password, displayName.trim());
        if (onSuccessNotification) onSuccessNotification('Account created successfully! Welcome to Kishore Opinion.');
      }
      onClose();
    } catch (err: unknown) {
      setAuthError(extractErrorInfo(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setAuthError(null);
    try {
      setLoading(true);
      await loginWithGoogle();
      if (onSuccessNotification) onSuccessNotification('Successfully signed in with Google!');
      onClose();
    } catch (err: unknown) {
      setAuthError(extractErrorInfo(err));
    } finally {
      setLoading(false);
    }
  };

  const handleDemoSignIn = async (asAdmin: boolean = true) => {
    setAuthError(null);
    try {
      setLoading(true);
      await loginWithDemo(asAdmin);
      if (onSuccessNotification) {
        onSuccessNotification(asAdmin ? 'Signed in as Kishore Kumar (Admin)!' : 'Signed in as Demo Contributor!');
      }
      onClose();
    } catch (err: unknown) {
      setAuthError(extractErrorInfo(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div 
        className="w-full max-w-lg glass-panel-elevated rounded-3xl p-6 sm:p-8 relative border border-white/15 overflow-hidden shadow-2xl max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow ambient background circles */}
        <div className="absolute -top-20 -right-20 w-44 h-44 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-44 h-44 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
          title="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Branding */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-purple-600 p-0.5 shadow-lg shadow-cyan-500/25 mb-3">
            <div className="w-full h-full bg-[#080D24] rounded-[14px] flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-cyan-400" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            {mode === 'login' && 'Sign in to Kishore Opinion'}
            {mode === 'register' && 'Create your Account'}
            {mode === 'forgot' && 'Reset your Password'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {mode === 'login' && 'Enter your credentials to access your opinion dashboard'}
            {mode === 'register' && 'Join the community and publish your perspectives'}
            {mode === 'forgot' && 'We will send a secure password reset link to your email'}
          </p>
        </div>

        {/* Auth Mode Toggle Pill (Login vs Register) */}
        {mode !== 'forgot' && (
          <div className="flex p-1 rounded-xl bg-slate-900/80 border border-white/10 mb-6">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setAuthError(null);
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                mode === 'login'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setAuthError(null);
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                mode === 'register'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Create Account
            </button>
          </div>
        )}

        {/* Detailed Firebase Error Alert with Error Code and Diagnostics */}
        {authError && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/40 text-rose-200 text-xs mb-5 space-y-2.5 animate-fadeIn">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span className="font-bold text-white">Firebase Error</span>
              </div>
              <code className="font-mono text-[11px] font-bold text-rose-300 bg-rose-950/80 px-2 py-0.5 rounded border border-rose-500/40">
                {authError.code}
              </code>
            </div>

            <p className="text-xs font-medium text-rose-100 leading-relaxed">
              {authError.userFacing}
            </p>

            {authError.message && authError.message !== authError.userFacing && (
              <p className="text-[10px] text-slate-400 font-mono break-all pt-1 border-t border-rose-500/20">
                Log: {authError.message}
              </p>
            )}

            {/* Specific Helper for auth/unauthorized-domain */}
            {authError.fixAction === 'unauthorized_domain' && (
              <div className="mt-3 p-3 rounded-xl bg-slate-900/90 border border-amber-500/40 text-amber-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-300">How to Fix in Firebase Console:</span>
                  <a
                    href="https://console.firebase.google.com/project/seismic-post-5w2pc/authentication/settings"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-[11px] font-semibold text-cyan-300 hover:underline"
                  >
                    <span>Open Settings</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <p className="text-[11px] text-slate-300">
                  1. Open Firebase Console → <strong>Authentication</strong> → <strong>Settings</strong> tab.
                  <br />
                  2. Scroll to <strong>Authorized domains</strong> and click <strong>Add domain</strong>.
                  <br />
                  3. Paste this exact domain:
                </p>
                <div className="flex items-center gap-2 p-1.5 rounded-lg bg-black/60 border border-white/10 font-mono text-[11px] text-cyan-300">
                  <span className="flex-1 truncate">{currentDomain}</span>
                  <button
                    type="button"
                    onClick={handleCopyDomain}
                    className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-white text-[10px] flex items-center gap-1 shrink-0"
                  >
                    {copiedDomain ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedDomain ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Specific Helper for auth/operation-not-allowed */}
            {authError.fixAction === 'operation_not_allowed' && (
              <div className="mt-3 p-3 rounded-xl bg-slate-900/90 border border-amber-500/40 text-amber-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-300">How to Fix in Firebase Console:</span>
                  <a
                    href="https://console.firebase.google.com/project/seismic-post-5w2pc/authentication/providers"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-[11px] font-semibold text-cyan-300 hover:underline"
                  >
                    <span>Open Sign-in Methods</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <p className="text-[11px] text-slate-300">
                  1. Open Firebase Console → <strong>Authentication</strong> → <strong>Sign-in method</strong>.
                  <br />
                  2. Click on <strong>Email/Password</strong>.
                  <br />
                  3. Toggle <strong>Enable</strong> to ON and click <strong>Save</strong>.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Reset Email Sent Confirmation */}
        {mode === 'forgot' && resetSent ? (
          <div className="text-center py-4">
            <div className="w-12 h-12 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-white">Reset Link Dispatched</h3>
            <p className="text-xs text-slate-300 mt-2">
              If an account exists with <span className="text-cyan-300 font-medium">{email}</span>, you will receive password reset instructions shortly.
            </p>
            <button
              onClick={() => {
                setMode('login');
                setResetSent(false);
              }}
              className="mt-6 w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-sm font-semibold transition-colors"
            >
              Back to Sign In
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Display Name (Only in Register mode) */}
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g. Kishore Kumar"
                    className="w-full glass-input rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500"
                    required
                  />
                </div>
              </div>
            )}

            {/* Email Address */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full glass-input rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500"
                  required
                />
              </div>
            </div>

            {/* Password Field (for Login and Register) */}
            {mode !== 'forgot' && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-medium text-slate-300">
                    Password
                  </label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => {
                        setMode('forgot');
                        setAuthError(null);
                      }}
                      className="text-xs text-cyan-400 hover:text-cyan-300 hover:underline"
                    >
                      Forgot Password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full glass-input rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder-slate-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {/* Confirm Password (Only in Register mode) */}
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your password"
                    className="w-full glass-input rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder-slate-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    title={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-semibold text-sm shadow-lg shadow-cyan-500/25 transition-all duration-200 mt-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>
                    {mode === 'login' && 'Sign In'}
                    {mode === 'register' && 'Create Free Account'}
                    {mode === 'forgot' && 'Send Password Reset Email'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {mode === 'forgot' && (
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setAuthError(null);
                }}
                className="w-full text-center text-xs text-slate-400 hover:text-cyan-300 mt-2"
              >
                Back to Sign In
              </button>
            )}

            {/* Divider and Google Sign-in */}
            {mode !== 'forgot' && (
              <>
                <div className="relative my-4 flex items-center justify-center">
                  <div className="w-full border-t border-white/10" />
                  <span className="absolute bg-[#0b102c] px-3 text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                    Or sign in with
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-3 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-white/10 text-white text-xs font-semibold transition-colors shadow-sm"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#EA4335"
                      d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"
                    />
                    <path
                      fill="#4285F4"
                      d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.6 14.8c-.3-.8-.4-1.8-.4-2.8s.2-2 .4-2.8L1.9 6.3C.7 8.7 0 11.3 0 14s.7 5.3 1.9 7.7l3.7-2.9z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16c1.8 3.7 5.6 7 10.1 7z"
                    />
                  </svg>
                  <span>Google Account (Popup)</span>
                </button>

                {/* Instant Test / Development Sign-In */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => handleDemoSignIn(true)}
                    className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-purple-950/40 hover:bg-purple-900/50 border border-purple-500/30 text-purple-300 text-xs font-semibold transition-colors"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                    <span>Instant Login as Kishore Kumar (Admin Mode)</span>
                  </button>
                  <p className="text-[10px] text-slate-500 text-center mt-1">
                    Allows immediate testing of opinions &amp; admin controls while Firebase settings are being updated.
                  </p>
                </div>
              </>
            )}
          </form>
        )}
      </div>
    </div>
  );
};
