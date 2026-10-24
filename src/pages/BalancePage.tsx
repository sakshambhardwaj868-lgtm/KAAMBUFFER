import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCashFlow } from '../context';
import { Card, MetricDisplay, CurrencyInput } from '../components/common';
import { Wallet, Smartphone, ArrowRight, TrendingUp, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';
import { formatINR } from '../utils/currency';

export const BalancePage: React.FC = () => {
  const navigate = useNavigate();
  const {
    inputs,
    summary,
    validation,
    updateCashInHand,
    updateBankBalance,
    updateExpectedIncome,
    updateProtectedBuffer,
  } = useCashFlow();

  const handleCashChange = (val: number) => {
    updateCashInHand(val);
  };

  const handleBankChange = (val: number) => {
    updateBankBalance(val);
  };

  const handleIncomeChange = (val: number) => {
    updateExpectedIncome(val);
  };

  const handleBufferChange = (val: number) => {
    updateProtectedBuffer(val);
  };

  return (
    <div className="flex flex-col gap-4 pb-6">
      {/* Page Title & Context */}
      <div>
        <h2 className="text-xl font-black text-white tracking-tight">
          Daily Pocket Check
        </h2>
        <p className="text-xs text-slate-400 font-medium mt-0.5">
          Apni aaj ki jeb aur bank account ka hisaab check karein
        </p>
      </div>

      {/* Validation Banner if errors exist */}
      {!validation.isValid && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center gap-2.5 text-rose-300 text-xs font-semibold shadow-xs">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>
            Kripya niche diye gaye fields mein sahi aur positive rakam bharein.
          </span>
        </div>
      )}

      {/* Immediate Total Ready Liquidity Card */}
      <Card variant="emerald" className="relative overflow-hidden">
        <div className="flex items-start justify-between">
          <MetricDisplay
            label="Total Ready Money"
            hinglish="Kareeb ka poora paisa (Cash + Bank)"
            amount={summary.totalLiquidity}
            variant="emerald"
            size="xl"
          />
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center ring-1 ring-emerald-500/30">
            <Wallet className="w-5 h-5 stroke-[2.2]" />
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-emerald-500/20 flex items-center justify-between text-xs text-emerald-200/90 font-medium">
          <span>Physical Cash: <strong className="num-figure text-white font-bold">{formatINR(inputs.cashInHand)}</strong></span>
          <span>Digital UPI: <strong className="num-figure text-white font-bold">{formatINR(inputs.bankBalance)}</strong></span>
        </div>
      </Card>

      {/* Input 1: Cash in Hand */}
      <Card>
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/25 flex items-center justify-center shrink-0 mt-0.5">
            <Wallet className="w-4 h-4 stroke-[2]" />
          </div>
          <div className="flex-1 flex flex-col gap-2">
            <CurrencyInput
              id="cashInHand"
              label="Cash in Pocket"
              hinglish="Jeb mein kitna cash hai?"
              value={inputs.cashInHand}
              onChange={handleCashChange}
              error={validation.errors.cashInHand}
              placeholder="e.g. 450"
              helpText="Cash notes and coins physically with you right now"
            />
            {/* Quick-add pills for rapid one-handed mobile entry */}
            <div className="flex items-center gap-1.5 pt-1">
              <span className="text-[11px] text-slate-400 font-medium">Quick Add:</span>
              {[50, 100, 200].map((add) => (
                <button
                  key={add}
                  type="button"
                  onClick={() => updateCashInHand(Math.max(0, inputs.cashInHand + add))}
                  className="px-2.5 py-1 text-xs font-bold bg-white/5 hover:bg-white/10 active:bg-white/15 border border-white/10 rounded-lg text-slate-200 hover:text-white transition-all touch-target active:scale-95"
                >
                  +₹{add}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Input 2: Bank / UPI Balance */}
      <Card>
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-sky-500/15 text-sky-400 ring-1 ring-sky-500/25 flex items-center justify-center shrink-0 mt-0.5">
            <Smartphone className="w-4 h-4 stroke-[2]" />
          </div>
          <div className="flex-1 flex flex-col gap-2">
            <CurrencyInput
              id="bankBalance"
              label="Bank & UPI Balance"
              hinglish="Bank account ya Paytm / GPay mein kitna hai?"
              value={inputs.bankBalance}
              onChange={handleBankChange}
              error={validation.errors.bankBalance}
              placeholder="e.g. 1200"
              helpText="Immediately spendable digital balance"
            />
            <div className="flex items-center gap-1.5 pt-1">
              <span className="text-[11px] text-slate-400 font-medium">Quick Add:</span>
              {[200, 500, 1000].map((add) => (
                <button
                  key={add}
                  type="button"
                  onClick={() => updateBankBalance(Math.max(0, inputs.bankBalance + add))}
                  className="px-2.5 py-1 text-xs font-bold bg-white/5 hover:bg-white/10 active:bg-white/15 border border-white/10 rounded-lg text-slate-200 hover:text-white transition-all touch-target active:scale-95"
                >
                  +₹{add}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Input 3: Expected Shift Earnings */}
      <Card>
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/15 text-indigo-400 ring-1 ring-indigo-500/25 flex items-center justify-center shrink-0 mt-0.5">
            <TrendingUp className="w-4 h-4 stroke-[2]" />
          </div>
          <div className="flex-1 flex flex-col gap-2">
            <CurrencyInput
              id="expectedIncome"
              label="Expected Next Shift Income"
              hinglish="Agli shift se anumanit kamai kitni hogi?"
              value={inputs.expectedNextShiftIncome}
              onChange={handleIncomeChange}
              error={validation.errors.expectedNextShiftIncome}
              placeholder="e.g. 850"
              helpText="Realistic shift earning expectation after platform deductions"
            />
            <div className="flex items-center gap-1.5 pt-1">
              <span className="text-[11px] text-slate-400 font-medium">Quick Estimate:</span>
              {[500, 800, 1200].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => updateExpectedIncome(amt)}
                  className="px-2.5 py-1 text-xs font-bold bg-white/5 hover:bg-white/10 active:bg-white/15 border border-white/10 rounded-lg text-slate-200 hover:text-white transition-all touch-target active:scale-95"
                >
                  ₹{amt}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Input 4: Minimum Protected Buffer */}
      <Card>
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/25 flex items-center justify-center shrink-0 mt-0.5">
            <ShieldCheck className="w-4 h-4 stroke-[2]" />
          </div>
          <div className="flex-1 flex flex-col gap-2">
            <CurrencyInput
              id="protectedBuffer"
              label="Minimum Protected Buffer"
              hinglish="Suraksha rakam jo kabhi kharch nahi karni"
              value={inputs.protectedBuffer}
              onChange={handleBufferChange}
              error={validation.errors.protectedBuffer}
              placeholder="e.g. 500"
              helpText="Minimum cushion retained for unexpected emergencies and tyre punctures"
            />
            <div className="flex items-center gap-1.5 pt-1">
              <span className="text-[11px] text-slate-400 font-medium">Presets:</span>
              {[300, 500, 1000].map((buf) => (
                <button
                  key={buf}
                  type="button"
                  onClick={() => updateProtectedBuffer(buf)}
                  className="px-2.5 py-1 text-xs font-bold bg-white/5 hover:bg-white/10 active:bg-white/15 border border-white/10 rounded-lg text-slate-200 hover:text-white transition-all touch-target active:scale-95"
                >
                  ₹{buf}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Auto-sync Notification */}
      <div className="flex items-center gap-2.5 px-3.5 py-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-300">
        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
        <span>Aapka hisaab phone ke LocalStorage mein automatically save ho raha hai.</span>
      </div>

      {/* Action Button: Next screen */}
      <div className="pt-1">
        <button
          type="button"
          onClick={() => navigate('/obligations')}
          className="w-full touch-target bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 active:scale-[0.99] text-slate-950 font-black rounded-xl py-3.5 px-4 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all text-sm tracking-tight"
        >
          <span>Check Next Shift Obligations</span>
          <ArrowRight className="w-4 h-4 stroke-[2.5]" />
        </button>
      </div>
    </div>
  );
};
