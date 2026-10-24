import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useCashFlow } from '../../context';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge } from '../common/StatusBadge';
import { RotateCcw, Shield, Check, X, Sparkles, LogOut, User } from 'lucide-react';

export const Header: React.FC = () => {
  const { summary, resetToDefaults } = useCashFlow();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const isAuthRoute = ['/login', '/signup', '/reset-password'].includes(location.pathname);

  const handleConfirmReset = () => {
    resetToDefaults();
    setShowResetConfirm(false);
  };

  const handleConfirmLogout = async () => {
    await signOut();
    setShowLogoutConfirm(false);
    navigate('/login', { replace: true });
  };

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Partner';

  return (
    <>
      <header className="sticky top-0 z-30 glass-header px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Brand Identity */}
          <Link to={user ? '/dashboard' : '/login'} className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-slate-950 shadow-lg shadow-emerald-500/25 ring-1 ring-emerald-300/30 group-hover:scale-105 transition-transform">
              <Shield className="w-5 h-5 text-slate-950 fill-slate-950/20 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black text-white tracking-tight leading-none">
                  Kaam<span className="text-emerald-400">Buffer</span>
                </h1>
                {user && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    LIVE
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                {user ? `Namaste, ${displayName}` : 'Roz ki kamai & kharche ka hisaab'}
              </p>
            </div>
          </Link>

          {/* Right Header Actions */}
          <div className="flex items-center gap-1.5">
            {user ? (
              <>
                <StatusBadge status={summary.bufferStatus} size="sm" />
                <button
                  type="button"
                  onClick={() => setShowResetConfirm(true)}
                  title="Reset sample data"
                  className="touch-target p-2 text-slate-400 hover:text-slate-100 hover:bg-white/5 active:bg-white/10 rounded-xl transition-all inline-flex items-center justify-center border border-transparent hover:border-white/10"
                  aria-label="Reset inputs to defaults"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setShowLogoutConfirm(true)}
                  title="Sign out"
                  className="touch-target p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 active:bg-rose-500/20 rounded-xl transition-all inline-flex items-center justify-center border border-transparent hover:border-rose-500/20"
                  aria-label="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : !isAuthRoute ? (
              <Link
                to="/login"
                className="touch-target inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold hover:bg-emerald-500/25 transition-all"
              >
                <User className="w-3.5 h-3.5" />
                <span>Log In</span>
              </Link>
            ) : null}
          </div>
        </div>
      </header>

      {/* Modern Reset Confirmation Modal */}
      {showResetConfirm && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="reset-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div className="w-full max-w-xs bg-[#141B2B] border border-white/10 rounded-2xl p-5 shadow-2xl flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 id="reset-modal-title" className="text-sm font-bold text-white">
                  Reset Sample Data?
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Saari details default par reset karein?
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-[#0E131F] p-3 rounded-xl border border-white/5">
              This will reset your cash, bank balances, shift estimates, and bills back to the default gig-worker template.
            </p>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="touch-target py-2 px-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                <span>Cancel</span>
              </button>
              <button
                type="button"
                onClick={handleConfirmReset}
                className="touch-target py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-slate-950 text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20 transition-all"
              >
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Yes, Reset</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modern Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="logout-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div className="w-full max-w-xs bg-[#141B2B] border border-white/10 rounded-2xl p-5 shadow-2xl flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center shrink-0">
                <LogOut className="w-4 h-4 stroke-[2.5]" />
              </div>
              <div>
                <h3 id="logout-modal-title" className="text-sm font-bold text-white">
                  Log Out of KaamBuffer?
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Sign out karna chahte hain?
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-[#0E131F] p-3 rounded-xl border border-white/5">
              Your session will be closed securely. Your local buffer calculations will remain safe on this device.
            </p>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="touch-target py-2 px-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                <span>Cancel</span>
              </button>
              <button
                type="button"
                onClick={handleConfirmLogout}
                className="touch-target py-2 px-3 rounded-xl bg-rose-500 hover:bg-rose-400 active:bg-rose-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-rose-500/20 transition-all"
              >
                <LogOut className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Yes, Log Out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
