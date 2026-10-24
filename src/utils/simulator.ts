import type { FinancialEngineOutput } from '../types';
import { formatINR } from './currency';

export type OutcomeCategory = 'SURPLUS' | 'BUFFER_GAP' | 'HARD_SHORTFALL' | 'BREAKEVEN';

export interface SimulatorOutcome {
  category: OutcomeCategory;
  cardVariant: 'default' | 'emerald' | 'amber' | 'rose';
  badgeText: string;
  title: string;
  description: string;
  iconName: 'ShieldCheck' | 'AlertTriangle' | 'AlertCircle' | 'Scale';
  iconColor: string;
  bgPill: string;
}

/**
 * Returns dynamic explanation of income drop using actual application figures
 */
export function getSimulatorExplanation(
  baseIncome: number,
  simulatedIncome: number,
  stressPercent: number
): string {
  if (stressPercent === 0) {
    return `Currently evaluating normal baseline shift earnings of ${formatINR(
      baseIncome
    )}. Adjust the slider to simulate orders slowing down or bad weather.`;
  }

  const lostIncome = Math.max(0, baseIncome - simulatedIncome);
  return `With a ${stressPercent}% reduction in expected income, your estimated next-shift income falls from ${formatINR(
    baseIncome
  )} to ${formatINR(simulatedIncome)} (a drop of ${formatINR(lostIncome)}).`;
}

/**
 * Determines visual feedback and status message based on simulated financial metrics
 */
export function getSimulatorOutcome(
  plan: FinancialEngineOutput,
  protectedBuffer: number
): SimulatorOutcome {
  if (plan.hardShortfall > 0) {
    return {
      category: 'HARD_SHORTFALL',
      cardVariant: 'rose',
      badgeText: 'Critical Deficit / Hard Shortfall',
      title: `Paison ki kami: ${formatINR(plan.hardShortfall)} deficit!`,
      description:
        'Is reduction par shift ki kamai aur ready money milakar bhi fuel aur bills poore nahi ho rahe hain. Aapko emergency funds ya udhar ki zaroorat pad sakti hai.',
      iconName: 'AlertCircle',
      iconColor: 'text-rose-700',
      bgPill: 'bg-rose-100 text-rose-800 border-rose-300',
    };
  }

  if (plan.protectedBufferGap > 0) {
    return {
      category: 'BUFFER_GAP',
      cardVariant: 'amber',
      badgeText: 'Caution: Protected Buffer Gap',
      title: `Buffer mein kami: ${formatINR(plan.protectedBufferGap)} gap!`,
      description: `Kharche aur bills nikal jayenge, lekin safety buffer ${formatINR(
        protectedBuffer
      )} se घटकर kam reh jayega. Faltu kharche bilkul na karein.`,
      iconName: 'AlertTriangle',
      iconColor: 'text-amber-700',
      bgPill: 'bg-amber-100 text-amber-800 border-amber-300',
    };
  }

  if (plan.safeToSave > 0) {
    return {
      category: 'SURPLUS',
      cardVariant: 'emerald',
      badgeText: 'Surplus Safe to Save',
      title: `Surplus surakshit: ${formatINR(plan.safeToSave)} bacha sakte hain!`,
      description:
        'Kamai kam hone ke bavajood aapke saare kharche, bills aur poora safety buffer surakshit hai. Bachat ka paisa safe hai.',
      iconName: 'ShieldCheck',
      iconColor: 'text-emerald-700',
      bgPill: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    };
  }

  return {
    category: 'BREAKEVEN',
    cardVariant: 'default',
    badgeText: 'Breakeven / Zero Surplus',
    title: 'Pura hisaab barabar (Zero Extra Savings)',
    description:
      'Is sthiti mein kharche aur buffer poore ho rahe hain, lekin alag se bachane ke liye koi extra paisa nahi bacha hai.',
    iconName: 'Scale',
    iconColor: 'text-slate-700',
    bgPill: 'bg-slate-100 text-slate-800 border-slate-300',
  };
}
