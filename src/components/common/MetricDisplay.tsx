import React from 'react';
import { formatINR, toAccessibleINR } from '../../utils/currency';

interface MetricDisplayProps {
  label: string;
  hinglish?: string;
  amount: number;
  variant?: 'emerald' | 'amber' | 'crimson' | 'neutral';
  size?: 'md' | 'lg' | 'xl';
  suffix?: string;
  id?: string;
}

export const MetricDisplay: React.FC<MetricDisplayProps> = ({
  label,
  hinglish,
  amount,
  variant = 'neutral',
  size = 'lg',
  suffix,
  id,
}) => {
  const colorClass = {
    emerald: 'text-emerald-400 drop-shadow-[0_0_12px_rgba(16,185,129,0.3)]',
    amber: 'text-amber-400 drop-shadow-[0_0_12px_rgba(245,158,11,0.25)]',
    crimson: 'text-rose-400 drop-shadow-[0_0_12px_rgba(244,63,94,0.3)]',
    neutral: 'text-white',
  }[variant];

  const sizeClass = {
    md: 'text-xl font-bold tracking-tight',
    lg: 'text-2xl sm:text-3xl font-extrabold tracking-tight',
    xl: 'text-3xl sm:text-4xl font-black tracking-tight',
  }[size];

  return (
    <div id={id} className="flex flex-col">
      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
        {label}
      </span>
      {hinglish && (
        <span className="text-[11px] text-slate-500 mt-0.5 leading-snug">
          {hinglish}
        </span>
      )}
      <div className="flex items-baseline gap-1.5 mt-1">
        <span
          className={`num-figure ${sizeClass} ${colorClass}`}
          aria-label={toAccessibleINR(amount)}
        >
          {formatINR(amount)}
        </span>
        {suffix && (
          <span className="text-xs font-semibold text-slate-400">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
};
