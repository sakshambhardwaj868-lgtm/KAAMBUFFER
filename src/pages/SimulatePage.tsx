import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCashFlow } from '../context';
import { Card } from '../components/common';
import {
  formatINR,
  getSimulatorOutcome,
  getSimulatorExplanation,
} from '../utils';
import { calculateFinancialPlan } from '../calculations/engine';
import {
  SlidersHorizontal,
  ArrowLeft,
  TrendingDown,
  RotateCcw,
  ShieldCheck,
  AlertTriangle,
  AlertCircle,
  Scale,
} from 'lucide-react';

export const SimulatePage: React.FC = () => {
  const navigate = useNavigate();
  const { inputs } = useCashFlow();

  // Selected simulation percentage is kept in local component state
  // to avoid overwriting the user's permanent financial data
  const [stressPercent, setStressPercent] = useState<number>(0);

  // Baseline scenario (0% income reduction)
  const basePlan = useMemo(() => {
    return calculateFinancialPlan({
      ...inputs,
      incomeStressPercent: 0,
    });
  }, [inputs]);

  // Simulated scenario at selected stress percentage
  const simulatedPlan = useMemo(() => {
    return calculateFinancialPlan({
      ...inputs,
      incomeStressPercent: stressPercent,
    });
  }, [inputs, stressPercent]);

  const baseIncome = inputs.expectedNextShiftIncome;
  const simulatedIncome = simulatedPlan.stressAdjustedIncome;

  const presetOptions = [0, 10, 25, 30, 50, 75, 100];

  const outcome = useMemo(() => {
    return getSimulatorOutcome(simulatedPlan, inputs.protectedBuffer);
  }, [simulatedPlan, inputs.protectedBuffer]);

  const explanation = useMemo(() => {
    return getSimulatorExplanation(baseIncome, simulatedIncome, stressPercent);
  }, [baseIncome, simulatedIncome, stressPercent]);

  const iconMap = {
    ShieldCheck,
    AlertTriangle,
    AlertCircle,
    Scale,
  };
  const OutcomeIcon = iconMap[outcome.iconName];

  const baseCoverage = Math.min(
    100,
    Math.round((basePlan.totalAvailableFunds / Math.max(1, basePlan.totalRequiredFunds)) * 100)
  );
  const simulatedCoverage = Math.min(
    100,
    Math.round((simulatedPlan.totalAvailableFunds / Math.max(1, simulatedPlan.totalRequiredFunds)) * 100)
  );

  return (
    <div className="flex flex-col gap-4 pb-8">
      {/* Page Title & Navigation */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-white tracking-tight">
            Income-Drop Simulator
          </h2>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            Agli shift mein orders ya barish se kamai kam hui toh kya hoga?
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="touch-target p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors inline-flex items-center justify-center border border-transparent hover:border-white/10"
          aria-label="Back to dashboard"
          title="Back to dashboard"
        >
          <ArrowLeft className="w-5 h-5 stroke-[2]" />
        </button>
      </div>

      {/* ========================================================= */}
      {/* 1. INCOME-STRESS SLIDER CARD                              */}
      {/* ========================================================= */}
      <Card className="border border-white/10 shadow-xl">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Shift Income Reduction Slider
            </span>
          </div>
          <span className="num-figure text-xs font-black text-amber-300 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20 shadow-xs">
            {stressPercent}% Drop
          </span>
        </div>

        {/* Range Slider */}
        <div className="py-2">
          <label htmlFor="incomeStressSlider" className="sr-only">
            Income reduction percentage (0% to 100%)
          </label>
          <input
            id="incomeStressSlider"
            type="range"
            min="0"
            max="100"
            step="1"
            value={stressPercent}
            onChange={(e) => setStressPercent(Number(e.target.value))}
            className="w-full touch-target cursor-pointer"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={stressPercent}
            aria-valuetext={`${stressPercent}% income reduction`}
          />
          <div className="flex justify-between text-[10px] text-slate-400 font-bold px-0.5 mt-1.5">
            <span>0% (Normal)</span>
            <span>25%</span>
            <span>50%</span>
            <span>75%</span>
            <span>100% (Zero)</span>
          </div>
        </div>

        {/* Mobile Quick-Tap Presets */}
        <div className="pt-2.5 border-t border-white/10">
          <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block mb-1.5">
            Quick Simulation Presets:
          </span>
          <div className="grid grid-cols-7 gap-1">
            {presetOptions.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setStressPercent(opt)}
                className={`touch-target py-1.5 px-0.5 text-xs font-bold rounded-lg transition-all border text-center active:scale-95 ${
                  stressPercent === opt
                    ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/20 font-black'
                    : 'bg-white/5 text-slate-300 border-white/8 hover:bg-white/10 hover:text-white'
                }`}
                aria-pressed={stressPercent === opt}
              >
                {opt === 0 ? '0%' : `-${opt}%`}
              </button>
            ))}
          </div>
        </div>

        {/* Reset Slider Button */}
        <div className="pt-3 flex justify-end">
          <button
            type="button"
            onClick={() => setStressPercent(0)}
            disabled={stressPercent === 0}
            className="touch-target inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border transition-all disabled:opacity-30 disabled:pointer-events-none text-slate-300 border-white/10 hover:bg-white/10 active:bg-white/15"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to 0% (Normal)</span>
          </button>
        </div>
      </Card>

      {/* ========================================================= */}
      {/* 2. DYNAMIC OUTCOME FEEDBACK BANNER                        */}
      {/* ========================================================= */}
      <Card variant={outcome.cardVariant} className="border shadow-lg">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-white/10 ring-1 ring-white/10 shrink-0 mt-0.5">
            <OutcomeIcon className={`w-6 h-6 ${outcome.iconColor}`} />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/10 text-white border border-white/10">
                {outcome.badgeText}
              </span>
            </div>
            <h3 className="text-sm font-extrabold text-white mt-1.5">
              {outcome.title}
            </h3>
            <p className="text-xs text-slate-300 font-medium mt-1 leading-relaxed">
              {outcome.description}
            </p>
          </div>
        </div>
      </Card>

      {/* ========================================================= */}
      {/* 3. DYNAMIC EXPLANATION WITH REAL VALUES                   */}
      {/* ========================================================= */}
      <Card>
        <div className="flex items-start gap-2.5">
          <TrendingDown className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div className="flex-1 text-xs leading-relaxed text-slate-300">
            <span className="font-bold text-white block mb-1">
              Impact Breakdown:
            </span>
            <p className="font-medium text-slate-300">
              {explanation}
            </p>
          </div>
        </div>
      </Card>

      {/* ========================================================= */}
      {/* 4. BASELINE VS SIMULATED SIDE-BY-SIDE COMPARISON          */}
      {/* ========================================================= */}
      <section className="flex flex-col gap-2.5">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
          <Scale className="w-3.5 h-3.5 text-emerald-400" />
          <span>Normal vs Simulated Comparison</span>
        </h3>

        <div className="grid grid-cols-2 gap-2.5">
          {/* Baseline Card */}
          <div className="p-3.5 rounded-2xl bg-[#0D121F] border border-white/10 shadow-md flex flex-col gap-2">
            <div className="flex items-center justify-between pb-1.5 border-b border-white/10">
              <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider">
                Normal (0%)
              </span>
              <span className="text-[10px] font-bold text-emerald-300 bg-emerald-500/15 px-1.5 py-0.5 rounded border border-emerald-500/20">
                Base
              </span>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 font-semibold block">Next-Shift Income</span>
              <span className="num-figure text-sm font-bold text-white">
                {formatINR(basePlan.stressAdjustedIncome)}
              </span>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 font-semibold block">Total Available</span>
              <span className="num-figure text-sm font-bold text-white">
                {formatINR(basePlan.totalAvailableFunds)}
              </span>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 font-semibold block">Safe to Save</span>
              <span className="num-figure text-base font-extrabold text-emerald-400">
                {formatINR(basePlan.safeToSave)}
              </span>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 font-semibold block">Hard Shortfall</span>
              <span className="num-figure text-sm font-semibold text-slate-400">
                {formatINR(basePlan.hardShortfall)}
              </span>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 font-semibold block">Buffer Gap</span>
              <span className="num-figure text-sm font-semibold text-slate-400">
                {formatINR(basePlan.protectedBufferGap)}
              </span>
            </div>
          </div>

          {/* Simulated Card */}
          <div className="p-3.5 rounded-2xl bg-[#111728] border-2 border-emerald-500/30 shadow-lg flex flex-col gap-2">
            <div className="flex items-center justify-between pb-1.5 border-b border-white/10">
              <span className="text-[11px] font-black uppercase text-white tracking-wider">
                Simulated (-{stressPercent}%)
              </span>
              <span className="text-[10px] font-bold text-amber-300 bg-amber-500/15 px-1.5 py-0.5 rounded border border-amber-500/20">
                Test
              </span>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 font-semibold block">Stress Income</span>
              <span className="num-figure text-sm font-bold text-white">
                {formatINR(simulatedPlan.stressAdjustedIncome)}
              </span>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 font-semibold block">Total Available</span>
              <span className="num-figure text-sm font-bold text-white">
                {formatINR(simulatedPlan.totalAvailableFunds)}
              </span>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 font-semibold block">Safe to Save</span>
              <span className={`num-figure text-base font-extrabold ${
                simulatedPlan.safeToSave > 0 ? 'text-emerald-400' : 'text-slate-500'
              }`}>
                {formatINR(simulatedPlan.safeToSave)}
              </span>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 font-semibold block">Hard Shortfall</span>
              <span className={`num-figure text-sm font-bold ${
                simulatedPlan.hardShortfall > 0 ? 'text-rose-400' : 'text-slate-400'
              }`}>
                {formatINR(simulatedPlan.hardShortfall)}
              </span>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 font-semibold block">Buffer Gap</span>
              <span className={`num-figure text-sm font-bold ${
                simulatedPlan.protectedBufferGap > 0 ? 'text-amber-400' : 'text-slate-400'
              }`}>
                {formatINR(simulatedPlan.protectedBufferGap)}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 5. VISUAL FUNDS COMPARISON BARS                           */}
      {/* ========================================================= */}
      <Card>
        <span className="text-xs font-bold text-white block mb-2.5">
          Funds vs Required Obligations
        </span>

        {/* Baseline bar */}
        <div className="flex flex-col gap-1.5 mb-3.5">
          <div className="flex justify-between text-[11px] font-semibold text-slate-300">
            <span>Normal Available: <strong className="num-figure text-white font-bold">{formatINR(basePlan.totalAvailableFunds)}</strong></span>
            <span className="text-slate-400">Needs: {formatINR(basePlan.totalRequiredFunds)} ({baseCoverage}%)</span>
          </div>
          <div className="w-full bg-[#080B12] rounded-full h-3 overflow-hidden border border-white/5">
            <div
              className="bg-emerald-500 h-full transition-all duration-300 shadow-sm shadow-emerald-500"
              style={{ width: `${baseCoverage}%` }}
              title="Baseline Funds Coverage"
            />
          </div>
        </div>

        {/* Simulated bar */}
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between text-[11px] font-semibold text-slate-300">
            <span>Simulated Available: <strong className="num-figure text-white font-bold">{formatINR(simulatedPlan.totalAvailableFunds)}</strong></span>
            <span className="text-slate-400">Needs: {formatINR(simulatedPlan.totalRequiredFunds)} ({simulatedCoverage}%)</span>
          </div>
          <div className="w-full bg-[#080B12] rounded-full h-3 overflow-hidden border border-white/5">
            <div
              className={`h-full transition-all duration-300 ${
                simulatedPlan.hardShortfall > 0
                  ? 'bg-rose-500 shadow-sm shadow-rose-500'
                  : simulatedPlan.protectedBufferGap > 0
                  ? 'bg-amber-500 shadow-sm shadow-amber-500'
                  : 'bg-emerald-500 shadow-sm shadow-emerald-500'
              }`}
              style={{ width: `${simulatedCoverage}%` }}
              title="Simulated Funds Coverage"
            />
          </div>
        </div>

        <p className="text-[10px] text-slate-400 mt-2.5 text-center font-medium">
          Green = 100%+ Coverage | Amber = Buffer Gap | Red = Hard Shortfall
        </p>
      </Card>

      {/* ========================================================= */}
      {/* 6. PROTECTED RUNNING COSTS & BUFFER SUMMARY               */}
      {/* ========================================================= */}
      <div className="p-3 bg-[#0D121F] border border-white/10 rounded-2xl flex flex-col gap-2 text-xs">
        <span className="font-bold text-slate-300">
          Shielded Obligations in this Simulation:
        </span>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2 bg-white/5 rounded-xl border border-white/8">
            <span className="text-[10px] text-slate-400 block font-semibold">Work Costs</span>
            <span className="font-bold text-white num-figure">{formatINR(simulatedPlan.totalWorkCosts)}</span>
          </div>
          <div className="p-2 bg-white/5 rounded-xl border border-white/8">
            <span className="text-[10px] text-slate-400 block font-semibold">Essential Bills</span>
            <span className="font-bold text-white num-figure">{formatINR(simulatedPlan.totalEssentialBills)}</span>
          </div>
          <div className="p-2 bg-white/5 rounded-xl border border-white/8">
            <span className="text-[10px] text-slate-400 block font-semibold">Safety Buffer</span>
            <span className="font-bold text-white num-figure">{formatINR(inputs.protectedBuffer)}</span>
          </div>
        </div>
      </div>

      {/* Return to Dashboard CTA */}
      <div className="pt-1">
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="w-full touch-target bg-white/10 hover:bg-white/15 active:scale-[0.99] text-white font-bold rounded-xl py-3 px-4 flex items-center justify-center gap-2 border border-white/10 transition-all text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Cash Flow Dashboard</span>
        </button>
      </div>
    </div>
  );
};
