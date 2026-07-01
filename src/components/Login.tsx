import React, { useState } from 'react';
import { Mail, Lock, AlertCircle, Loader2, Sparkles, CheckCircle2 } from 'lucide-react';
import FinVistaLogo from './FinVistaLogo';

interface LoginProps {
  logoUrl?: string;
  onLoginSuccess: (email: string) => void;
}

export default function Login({ logoUrl, onLoginSuccess }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedEmail = email.trim().toLowerCase();
    const targetEmail = 'susheelkumarv@gmail.com';

    if (!trimmedEmail) {
      setError('Please enter your email address.');
      return;
    }

    if (trimmedEmail !== targetEmail) {
      setError('Access Denied. Only registered client accounts are permitted.');
      return;
    }

    if (!password) {
      setError('Please enter your password.');
      return;
    }

    // Standard simulated loading for modern auth feel
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      setTimeout(() => {
        onLoginSuccess(trimmedEmail);
      }, 800);
    }, 1200);
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-gray-50 text-gray-900 dark:bg-zinc-950 dark:text-zinc-100 transition-colors duration-300">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Logo Display */}
        <div className="flex flex-col items-center text-center space-y-3">
          <FinVistaLogo logoUrl={logoUrl} size="xl" />
          <div className="h-[2px] w-12 bg-emerald-500/80 rounded-full my-1" />
          <p className="text-xs text-gray-500 dark:text-zinc-400 font-medium max-w-xs leading-relaxed">
            Institutional-grade wealth intelligence, real-time dividend cash flow tracking, and AI portfolio diagnostics.
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white dark:bg-zinc-900 border border-gray-150 dark:border-zinc-850 p-8 rounded-3xl shadow-xl space-y-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-emerald-600 to-indigo-600" />

          <div className="space-y-1">
            <h2 className="text-xl font-bold tracking-tight text-gray-900 dark:text-zinc-50">
              Access Terminal
            </h2>
            <p className="text-xs text-gray-400 dark:text-zinc-500">
              Enter your credential profile to establish secure session
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider block">
                Registered Email Address
              </label>
              <div className="relative">
                <input
                  id="login-email-input"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading || success}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-250 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-gray-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium disabled:opacity-50"
                  autoComplete="email"
                />
                <Mail className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-gray-400 dark:text-zinc-500" />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider block">
                Security Password
              </label>
              <div className="relative">
                <input
                  id="login-password-input"
                  type="password"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading || success}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-250 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-gray-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium disabled:opacity-50"
                  autoComplete="current-password"
                />
                <Lock className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-gray-400 dark:text-zinc-500" />
              </div>
            </div>

            {/* Validation Feedback */}
            {error && (
              <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 rounded-xl text-xs flex items-start gap-2 animate-shake">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="font-semibold">{error}</span>
              </div>
            )}

            {/* Success Feedback */}
            {success && (
              <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span className="font-bold">Session authorized. Initiating uplink...</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              id="login-submit-btn"
              type="submit"
              disabled={loading || success}
              className="w-full py-2.5 bg-emerald-600 dark:bg-emerald-500 text-white font-bold rounded-xl text-sm hover:bg-emerald-700 dark:hover:bg-emerald-600 transition-all duration-200 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 shadow-md dark:shadow-none hover:shadow-emerald-500/10"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Authenticating profile...
                </>
              ) : success ? (
                'Access Granted'
              ) : (
                'Secure Login'
              )}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
