import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/common';
import {
  Mail,
  Lock,
  ArrowRight,
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle2,
  KeyRound,
} from 'lucide-react';

export const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const { resetPasswordForEmail, updatePassword, user } = useAuth();

  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const isUpdateMode = Boolean(
    user ||
    (typeof window !== 'undefined' &&
      window.location.hash &&
      (window.location.hash.includes('type=recovery') || window.location.hash.includes('access_token=')))
  );

  const handleSendResetEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setErrorMessage('Please enter your registered email address.');
      return;
    }

    setIsLoading(true);
    const { error } = await resetPasswordForEmail(cleanEmail);
    setIsLoading(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setSuccessMessage('Password reset instructions have been sent to your email. (Kripya apna email check karein).');
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (newPassword.length < 6) {
      setErrorMessage('New password must be at least 6 characters (Kam se kam 6 akshar ka hona chahiye).');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setErrorMessage('Passwords do not match (Dono password alag hain).');
      return;
    }

    setIsLoading(true);
    const { error } = await updatePassword(newPassword);
    setIsLoading(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    navigate('/login', {
      state: { message: 'Password updated successfully! Please sign in with your new password.' },
      replace: true,
    });
  };

  return (
    <div className="flex flex-col gap-5 py-4 animate-in fade-in duration-200">
      {/* Brand Header */}
      <div className="flex flex-col items-center text-center gap-2 pt-2">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-slate-950 shadow-xl shadow-emerald-500/25 ring-1 ring-emerald-300/30">
          <KeyRound className="w-6 h-6 stroke-[2.2]" />
        </div>
        <div>
          <h1 className="text-xl font-black text-white tracking-tight">
            {isUpdateMode ? 'Set New Password' : 'Reset Password'}
          </h1>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            {isUpdateMode
              ? 'Apna naya surakshit password set karein'
              : 'Enter your email to receive recovery instructions'}
          </p>
        </div>
      </div>

      {/* Success Notice */}
      {successMessage && (
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

      <Card className="border border-white/10 shadow-xl">
        {!isUpdateMode ? (
          /* Request Password Reset Email */
          <form onSubmit={handleSendResetEmail} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="resetEmail" className="text-xs font-bold text-slate-300">
                Registered Email Address
              </label>
              <div className="relative">
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500"
                >
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="resetEmail"
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

            <button
              type="submit"
              disabled={isLoading}
              className="w-full touch-target mt-1 bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 active:scale-[0.99] text-slate-950 font-black rounded-xl py-3.5 px-4 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all text-sm disabled:opacity-50 disabled:pointer-events-none"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin stroke-[2.5]" />
                  <span>Sending Reset Link...</span>
                </>
              ) : (
                <>
                  <span>Send Recovery Email</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </>
              )}
            </button>
          </form>
        ) : (
          /* Set New Password Form */
          <form onSubmit={handleUpdatePassword} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="newPassword" className="text-xs font-bold text-slate-300">
                New Password (kam se kam 6 akshar)
              </label>
              <div className="relative">
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500"
                >
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="••••••••"
                  className="block w-full rounded-xl border border-white/10 bg-[#0A0D17] pl-10 pr-4 py-3 text-white text-sm font-medium touch-target placeholder:text-slate-600 focus:border-emerald-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-400/20 transition-all"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="confirmNewPassword" className="text-xs font-bold text-slate-300">
                Confirm New Password
              </label>
              <div className="relative">
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500"
                >
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="confirmNewPassword"
                  name="confirmNewPassword"
                  type="password"
                  required
                  value={confirmNewPassword}
                  onChange={(e) => {
                    setConfirmNewPassword(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="••••••••"
                  className="block w-full rounded-xl border border-white/10 bg-[#0A0D17] pl-10 pr-4 py-3 text-white text-sm font-medium touch-target placeholder:text-slate-600 focus:border-emerald-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-400/20 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full touch-target mt-1 bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 active:scale-[0.99] text-slate-950 font-black rounded-xl py-3.5 px-4 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all text-sm disabled:opacity-50 disabled:pointer-events-none"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin stroke-[2.5]" />
                  <span>Updating Password...</span>
                </>
              ) : (
                <>
                  <span>Save New Password</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </>
              )}
            </button>
          </form>
        )}
      </Card>

      {/* Back to Login link */}
      <div className="text-center text-xs text-slate-400">
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 font-bold text-emerald-400 hover:text-emerald-300 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Sign In (Login par wapas jayein)</span>
        </Link>
      </div>
    </div>
  );
};
