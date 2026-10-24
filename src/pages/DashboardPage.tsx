import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCashFlow } from '../context';
import { Card, StatusBadge } from '../components/common';
import { formatINR } from '../utils/currency';
import {
  ShieldCheck,
  AlertTriangle,
  AlertCircle,
  ArrowRight,
  Wallet,
  Smartphone,
  TrendingUp,
  Receipt,
  PiggyBank,
  Shield,
  Layers,
  Sparkles,
  Edit3,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { inputs, summary, validation } = useCashFlow();

  const getStatusAdvice = () => {
    switch (summary.bufferStatus) {
      case 'SAFE':
        return {
          title: 'Buffer is Healthy (Surplus Available)',
          hinglish: 'Aapka cash buffer surakshit hai. Kharche aur buffer nikalne ke baad bachat ka paisa uplabdh hai.',
          variant: 'emerald' as const,
          icon: ShieldCheck,
          accentBg: 'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30',
        };
      case 'CAUTION':
        return {
          title: 'Caution: Tight Liquidity / Buffer Gap',
          hinglish: 'Kharche nikal jayenge, lekin safety buffer thoda kam hai. Faltu kharcho se bachein.',
          variant: 'amber' as const,
          icon: AlertTriangle,
          accentBg: 'bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30',
        };
      case 'SHORTFALL':
        return {
          title: 'Shortfall Alert: Funds Deficit!',
          hinglish: 'Agli shift ki anumanit kamai milakar bhi zaroori kharche poore nahi ho rahe hain.',
          variant: 'rose' as const,
          icon: AlertCircle,
          accentBg: 'bg-rose-500/15 text-rose-400 ring-1 ring-rose-500/30',
        };
    }
  };

  const advice = getStatusAdvice();
  const StatusIcon = advice.icon;

  const coverageRatio = Math.min(
    100,
    Math.round((summary.totalAvailableFunds / Math.max(1, summary.totalRequiredFunds)) * 100)
  );

  return (
    <div className="flex flex-col gap-4 pb-6">
      {/* Validation Warning Alert */}
      {!validation.isValid && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center gap-2.5 text-rose-300 text-xs font-semibold shadow-xs">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>
            Kuch inputs galat hain. Sahi hisaab dekhne ke liye balance aur obligations update karein.
          </span>
        </div>
      )}

      {/* Header & Status */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-white tracking-tight">
            Cash Flow Cockpit
          </h2>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            Aapki taaza financial sthiti aur buffer ka haal
          </p>
        </div>
        <StatusBadge status={summary.bufferStatus} />
      </div>

      {/* Main Status Advice Callout */}
      <Card variant={advice.variant} className="border shadow-lg">
        <div className="flex items-start gap-3">
          <div className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${advice.accentBg}`}>
            <StatusIcon className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-white">
              {advice.title}
            </h3>
            <p className="text-xs text-slate-300 font-medium mt-1 leading-relaxed">
              {advice.hinglish}
            </p>
          </div>
        </div>
      </Card>

      {/* Hero Decision Metric: Safe To Save OR Shortfall Callout */}
      <Card
        variant={
          summary.safeToSave > 0
            ? 'emerald'
            : summary.hardShortfall > 0
            ? 'rose'
            : 'amber'
        }
        className="relative overflow-hidden border shadow-xl"
      >
        <div className="flex items-start justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              {summary.safeToSave > 0
                ? 'Safe to Save (Bachat)'
                : summary.hardShortfall > 0
                ? 'Hard Shortfall (Paison ki Kami)'
                : 'Protected Buffer Gap'}
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="num-figure text-3xl sm:text-4xl font-black text-white">
                {formatINR(
                  summary.safeToSave > 0
                    ? summary.safeToSave
                    : summary.hardShortfall > 0
                    ? summary.hardShortfall
                    : summary.protectedBufferGap
                )}
              </span>
            </div>
            <p className="text-xs text-slate-300 font-medium mt-1.5 max-w-xs leading-snug">
              {summary.safeToSave > 0
                ? 'Yeh paisa aap bina kisi tension ke bacha sakte hain ya ghar bhej sakte hain.'
                : summary.hardShortfall > 0
                ? 'Zaroori kharche aur shift costs poori karne ke liye itni rakam kam pad rahi hai.'
                : 'Kharche nikal jayenge, lekin safety buffer poora karne ke liye itna paisa chahiye.'}
            </p>
          </div>
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
              summary.safeToSave > 0
                ? 'bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30'
                : summary.hardShortfall > 0
                ? 'bg-rose-500/20 text-rose-400 ring-1 ring-rose-500/30'
                : 'bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/30'
            }`}
          >
            {summary.safeToSave > 0 ? (
              <PiggyBank className="w-6 h-6 stroke-[2]" />
            ) : summary.hardShortfall > 0 ? (
              <AlertCircle className="w-6 h-6 stroke-[2]" />
            ) : (
              <Shield className="w-6 h-6 stroke-[2]" />
            )}
          </div>
        </div>

        {/* Visual Liquidity Coverage Bar */}
        <div className="mt-4 pt-3 border-t border-white/10">
          <div className="flex justify-between items-center text-[11px] font-semibold text-slate-400 mb-1.5">
            <span>Financial Coverage Ratio</span>
            <span className="num-figure text-white font-bold">{coverageRatio}%</span>
          </div>
          <div className="w-full bg-slate-900/80 rounded-full h-2.5 overflow-hidden border border-white/5">
            <div
              className={`h-full transition-all duration-500 ${
                summary.hardShortfall > 0
                  ? 'bg-rose-500 shadow-sm shadow-rose-500'
                  : summary.protectedBufferGap > 0
                  ? 'bg-amber-500 shadow-sm shadow-amber-500'
                  : 'bg-emerald-500 shadow-sm shadow-emerald-500'
              }`}
              style={{ width: `${coverageRatio}%` }}
            />
          </div>
        </div>
      </Card>

      {/* 3 Core Buffer Calculation Results Grid */}
      <div className="grid grid-cols-3 gap-2">
        <div className="p-3 rounded-2xl bg-[#111726]/90 border border-white/8 shadow-md">
          <span className="text-[10px] font-bold uppercase text-slate-400 block leading-tight">
            Safe to Save
          </span>
          <span className="num-figure text-base font-black text-emerald-400 mt-1 block">
            {formatINR(summary.safeToSave)}
          </span>
          <span className="text-[10px] text-slate-400 font-medium">Bachat</span>
        </div>

        <div className="p-3 rounded-2xl bg-[#111726]/90 border border-white/8 shadow-md">
          <span className="text-[10px] font-bold uppercase text-slate-400 block leading-tight">
            Hard Shortfall
          </span>
          <span
            className={`num-figure text-base font-black mt-1 block ${
              summary.hardShortfall > 0 ? 'text-rose-400' : 'text-slate-300'
            }`}
          >
            {formatINR(summary.hardShortfall)}
          </span>
          <span className="text-[10px] text-slate-400 font-medium">Kami</span>
        </div>

        <div className="p-3 rounded-2xl bg-[#111726]/90 border border-white/8 shadow-md">
          <span className="text-[10px] font-bold uppercase text-slate-400 block leading-tight">
            Buffer Gap
          </span>
          <span
            className={`num-figure text-base font-black mt-1 block ${
              summary.protectedBufferGap > 0 ? 'text-amber-400' : 'text-slate-300'
            }`}
          >
            {formatINR(summary.protectedBufferGap)}
          </span>
          <span className="text-[10px] text-slate-400 font-medium">Gap</span>
        </div>
      </div>

      {/* Section: Inflow Breakdown */}
      <section className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <Wallet className="w-3.5 h-3.5 text-emerald-400" />
            <span>Available Inflows & Liquidity</span>
          </h3>
          <button
            type="button"
            onClick={() => navigate('/balance')}
            className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 touch-target py-1 px-2"
          >
            <Edit3 className="w-3 h-3" />
            <span>Edit</span>
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="p-3 rounded-xl bg-[#0D121F] border border-white/8">
            <div className="flex items-center gap-1 text-slate-400 mb-1">
              <Wallet className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[11px] font-bold text-slate-300">Cash</span>
            </div>
            <span className="num-figure text-sm font-extrabold text-white block">
              {formatINR(inputs.cashInHand)}
            </span>
            <span className="text-[10px] text-slate-400">Jeb mein</span>
          </div>

          <div className="p-3 rounded-xl bg-[#0D121F] border border-white/8">
            <div className="flex items-center gap-1 text-slate-400 mb-1">
              <Smartphone className="w-3.5 h-3.5 text-sky-400" />
              <span className="text-[11px] font-bold text-slate-300">Bank / UPI</span>
            </div>
            <span className="num-figure text-sm font-extrabold text-white block">
              {formatINR(inputs.bankBalance)}
            </span>
            <span className="text-[10px] text-slate-400">Account</span>
          </div>

          <div className="p-3 rounded-xl bg-[#0D121F] border border-white/8">
            <div className="flex items-center gap-1 text-slate-400 mb-1">
              <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-[11px] font-bold text-slate-300">Shift</span>
            </div>
            <span className="num-figure text-sm font-extrabold text-white block">
              {formatINR(inputs.expectedNextShiftIncome)}
            </span>
            <span className="text-[10px] text-slate-400">Anumanit</span>
          </div>
        </div>

        <div className="px-3.5 py-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-between text-xs">
          <span className="font-bold text-emerald-200">
            Total Available Funds (Ready + Shift):
          </span>
          <span className="num-figure font-black text-emerald-400 text-sm">
            {formatINR(summary.totalAvailableFunds)}
          </span>
        </div>
      </section>

      {/* Section: Outflows & Protected Buffer */}
      <section className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <Receipt className="w-3.5 h-3.5 text-amber-400" />
            <span>Required Outflows & Protection</span>
          </h3>
          <button
            type="button"
            onClick={() => navigate('/obligations')}
            className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 touch-target py-1 px-2"
          >
            <Edit3 className="w-3 h-3" />
            <span>Edit</span>
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="p-3 rounded-xl bg-[#0D121F] border border-white/8">
            <span className="text-[11px] font-bold text-slate-300 block mb-1">
              Work Costs
            </span>
            <span className="num-figure text-sm font-extrabold text-white block">
              {formatINR(summary.totalWorkCosts)}
            </span>
            <span className="text-[10px] text-slate-400">Petrol & Data</span>
          </div>

          <div className="p-3 rounded-xl bg-[#0D121F] border border-white/8">
            <span className="text-[11px] font-bold text-slate-300 block mb-1">
              Essential Bills
            </span>
            <span className="num-figure text-sm font-extrabold text-white block">
              {formatINR(summary.totalEssentialBills)}
            </span>
            <span className="text-[10px] text-slate-400">Rent & EMI</span>
          </div>

          <div className="p-3 rounded-xl bg-[#0D121F] border border-white/8">
            <span className="text-[11px] font-bold text-slate-300 block mb-1">
              Safety Buffer
            </span>
            <span className="num-figure text-sm font-extrabold text-white block">
              {formatINR(inputs.protectedBuffer)}
            </span>
            <span className="text-[10px] text-slate-400">Suraksha</span>
          </div>
        </div>

        <div className="px-3.5 py-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-between text-xs">
          <span className="font-bold text-amber-200">
            Total Required Funds (Costs + Bills + Buffer):
          </span>
          <span className="num-figure font-black text-amber-400 text-sm">
            {formatINR(summary.totalRequiredFunds)}
          </span>
        </div>
      </section>

      {/* Pre-Shift Operational Liquidity Check */}
      <Card>
        <div className="flex items-start justify-between">
          <div className="flex flex-col">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Pre-Shift Pocket Liquidity
            </span>
            <span className="text-[11px] text-slate-400 mt-0.5">
              Shift shuru karne se pehle petrol/data ke liye kitna paisa bacha hai
            </span>
            <span
              className={`num-figure text-2xl font-black mt-1 ${
                summary.netAvailableBeforeShift >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {formatINR(summary.netAvailableBeforeShift)}
            </span>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
          <span>Ready Money: <strong className="text-white num-figure">{formatINR(summary.totalLiquidity)}</strong></span>
          <span>Shift Work Cost: <strong className="text-rose-400 num-figure">-{formatINR(summary.totalWorkCosts)}</strong></span>
        </div>
      </Card>

      {/* Primary Action Buttons */}
      <div className="flex flex-col gap-2 pt-1">
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => navigate('/balance')}
            className="touch-target py-2.5 px-3 bg-white/5 border border-white/10 hover:bg-white/10 active:scale-95 rounded-xl font-bold text-slate-200 text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all"
          >
            <Wallet className="w-4 h-4 text-emerald-400" />
            <span>Update Pocket</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/obligations')}
            className="touch-target py-2.5 px-3 bg-white/5 border border-white/10 hover:bg-white/10 active:scale-95 rounded-xl font-bold text-slate-200 text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all"
          >
            <Layers className="w-4 h-4 text-amber-400" />
            <span>Manage Bills</span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => navigate('/simulate')}
          className="w-full touch-target bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 active:scale-[0.99] text-slate-950 font-black rounded-xl py-3 px-4 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all text-sm tracking-tight"
        >
          <Sparkles className="w-4 h-4 fill-slate-950 stroke-[2]" />
          <span>Simulate What-If Income Drops</span>
          <ArrowRight className="w-4 h-4 stroke-[2.5]" />
        </button>
      </div>
    </div>
  );
};
