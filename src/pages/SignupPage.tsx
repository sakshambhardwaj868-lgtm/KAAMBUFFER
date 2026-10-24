import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/common';
import {
  Shield,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  AlertCircle,
  Sparkles,
  Inbox,
} from 'lucide-react';

export const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const { signUp, isConfigured } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [verificationSent, setVerificationSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanName = fullName.trim();
    if (!cleanName) {
      setErrorMessage('Please enter your full name (Apna poora naam bharein).');
      return;
    }

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setErrorMessage('Please enter your email address (Apna email bharein).');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters (Password kam se kam 6 akshar ka hona chahiye).');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match (Dono password alag hain).');
      return;
    }

    setIsLoading(true);
    const { error, needsEmailVerification } = await signUp(cleanEmail, password, cleanName);
    setIsLoading(false);

    if (error) {
      const errStr = error.message.toLowerCase();
      if (errStr.includes('already registered') || errStr.includes('already exists')) {
        setErrorMessage('This email is already registered. Please log in instead (Yeh email pehle se registered hai).');
      } else {
        setErrorMessage(error.message);
      }
      return;
    }

    if (needsEmailVerification) {
      setVerificationSent(true);
    } else {
      navigate('/balance', { replace: true });
    }
  };

  if (verificationSent) {
    return (
      <div className="flex flex-col gap-5 py-6 animate-in fade-in duration-200">
        <Card variant="emerald" className="border shadow-xl p-6 text-center flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30 flex items-center justify-center">
            <Inbox className="w-7 h-7 stroke-[2]" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white">Check Your Inbox</h2>
            <p className="text-xs text-slate-300 font-medium mt-1 leading-relaxed">
              We have sent an email verification link to:
            </p>
            <p className="num-figure text-sm font-bold text-emerald-400 mt-0.5">
              {email}
            </p>
          </div>
          <p className="text-xs text-slate-400 bg-white/5 p-3 rounded-xl border border-white/5 leading-relaxed">
            Kripya apna email check karein aur verification link par click karein. Uske baad aap seedhe login kar sakte hain.
          </p>
          <button
            type="button"
            onClick={() => navigate('/login', { state: { message: 'Email verified! Please sign in with your password.' } })}
            className="w-full touch-target mt-2 bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-slate-950 font-black rounded-xl py-3 px-4 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all text-sm"
          >
            <span>Proceed to Login</span>
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </button>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 py-4 animate-in fade-in duration-200">
      {/* Brand Header */}
      <div className="flex flex-col items-center text-center gap-2 pt-2">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-slate-950 shadow-xl shadow-emerald-500/25 ring-1 ring-emerald-300/30">
          <Shield className="w-6 h-6 stroke-[2.2]" />
        </div>
        <div>
          <h1 className="text-xl font-black text-white tracking-tight">
            Create Your Account
          </h1>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            Join KaamBuffer to secure your gig shift earnings & buffer
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

      {/* Signup Card */}
      <Card className="border border-white/10 shadow-xl">
        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          {/* Full Name Field */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="signupName" className="text-xs font-bold text-slate-300">
              Full Name (Aapka Naam)
            </label>
            <div className="relative">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500"
              >
                <User className="w-4 h-4" />
              </div>
              <input
                id="signupName"
                name="fullName"
                type="text"
                autoComplete="name"
                required
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder="e.g. Ramesh Kumar"
                className="block w-full rounded-xl border border-white/10 bg-[#0A0D17] pl-10 pr-4 py-3 text-white text-sm font-medium touch-target placeholder:text-slate-600 focus:border-emerald-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-400/20 transition-all"
              />
            </div>
          </div>

          {/* Email Field */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="signupEmail" className="text-xs font-bold text-slate-300">
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
                id="signupEmail"
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
            <label htmlFor="signupPassword" className="text-xs font-bold text-slate-300">
              Password (kam se kam 6 akshar)
            </label>
            <div className="relative">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500"
              >
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="signupPassword"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                minLength={6}
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

          {/* Confirm Password Field */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="signupConfirmPassword" className="text-xs font-bold text-slate-300">
              Confirm Password
            </label>
            <div className="relative">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500"
              >
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="signupConfirmPassword"
                name="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder="••••••••"
                className="block w-full rounded-xl border border-white/10 bg-[#0A0D17] pl-10 pr-4 py-3 text-white text-sm font-medium touch-target placeholder:text-slate-600 focus:border-emerald-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-400/20 transition-all"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full touch-target mt-2 bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 active:scale-[0.99] text-slate-950 font-black rounded-xl py-3.5 px-4 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all text-sm disabled:opacity-50 disabled:pointer-events-none"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin stroke-[2.5]" />
                <span>Creating Account...</span>
              </>
            ) : (
              <>
                <span>Sign Up for KaamBuffer</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </>
            )}
          </button>
        </form>
      </Card>

      {/* Switch to Sign In */}
      <div className="text-center text-xs text-slate-400">
        Pehle se account hai?{' '}
        <Link
          to="/login"
          className="font-bold text-emerald-400 hover:text-emerald-300 underline underline-offset-4 transition-colors"
        >
          Sign In (Yahan Login Karein)
        </Link>
      </div>
    </div>
  );
};
