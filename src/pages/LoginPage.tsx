import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/common';
import {
  Shield,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, isConfigured } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Success message passed from signup or password reset
  const successMessage = (location.state as { message?: string })?.message;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setErrorMessage('Please enter your email address (Apna email bharein).');
      return;
    }

    if (!password) {
      setErrorMessage('Please enter your password (Apna password bharein).');
      return;
    }

    setIsLoading(true);
    const { error } = await signIn(cleanEmail, password);
    setIsLoading(false);

    if (error) {
      const errStr = error.message.toLowerCase();
      if (errStr.includes('invalid login credentials') || errStr.includes('invalid_grant')) {
        setErrorMessage('Invalid email or password (Email ya password galat hai).');
      } else if (errStr.includes('email not confirmed')) {
        setErrorMessage('Please verify your email address before logging in (Kripya pehle apna email verify karein).');
      } else {
        setErrorMessage(error.message);
      }
      return;
    }

    const destination = (location.state as { from?: { pathname?: string } })?.from?.pathname || '/balance';
    navigate(destination, { replace: true });
  };

  return (
    <div className="flex flex-col gap-5 py-4 animate-in fade-in duration-200">
      {/* Brand Header */}
      <div className="flex flex-col items-center text-center gap-2 pt-2">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-slate-950 shadow-xl shadow-emerald-500/25 ring-1 ring-emerald-300/30">
          <Shield className="w-6 h-6 stroke-[2.2]" />
        </div>
        <div>
          <h1 className="text-xl font-black text-white tracking-tight">
            Welcome to Kaam<span className="text-emerald-400">Buffer</span>
          </h1>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            Log in to protect your daily shift cash flow & buffer
          </p>
        </div>
      </div>

      {/* Unconfigured Alert */}
      {!isConfigured && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-xs text-amber-200 flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-bold block text-white">Supabase Setup Required</span>
            <span>VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY is not configured in .env.local.</span>
          </div>
        </div>
      )}

      {/* Success Notice if coming from Signup or Reset */}
      {successMessage && !errorMessage && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-xs text-emerald-300 flex items-center gap-2.5 shadow-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Error Alert */}
      {errorMessage && (
        <div
          role="alert"
          className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-xs text-rose-300 flex items-center gap-2.5 shadow-sm animate-in fade-in"
        >
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Login Card */}
      <Card className="border border-white/10 shadow-xl">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Email Field */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="loginEmail" className="text-xs font-bold text-slate-300">
              Email Address
            </label>
            <div className="relative">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500"
              >
                <Mail className="w-4 h-4" />
              </div>
              <input
                id="loginEmail"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder="name@example.com"
                className="block w-full rounded-xl border border-white/10 bg-[#0A0D17] pl-10 pr-4 py-3 text-white text-sm font-medium touch-target placeholder:text-slate-600 focus:border-emerald-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-400/20 transition-all"
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="loginPassword" className="text-xs font-bold text-slate-300">
                Password
              </label>
              <Link
                to="/reset-password"
                className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500"
              >
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="loginPassword"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder="••••••••"
                className="block w-full rounded-xl border border-white/10 bg-[#0A0D17] pl-10 pr-11 py-3 text-white text-sm font-medium touch-target placeholder:text-slate-600 focus:border-emerald-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-400/20 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-500 hover:text-slate-300 touch-target"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full touch-target mt-1 bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 active:scale-[0.99] text-slate-950 font-black rounded-xl py-3.5 px-4 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all text-sm disabled:opacity-50 disabled:pointer-events-none"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin stroke-[2.5]" />
                <span>Logging in...</span>
              </>
            ) : (
              <>
                <span>Sign In to KaamBuffer</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </>
            )}
          </button>
        </form>
      </Card>

      {/* Switch to Sign Up */}
      <div className="text-center text-xs text-slate-400">
        Naye user hain?{' '}
        <Link
          to="/signup"
          className="font-bold text-emerald-400 hover:text-emerald-300 underline underline-offset-4 transition-colors"
        >
          Create an Account (Naya Account Banayein)
        </Link>
      </div>
    </div>
  );
};
