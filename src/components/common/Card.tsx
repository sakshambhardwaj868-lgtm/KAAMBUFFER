import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'emerald' | 'amber' | 'rose';
  id?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  variant = 'default',
  id,
}) => {
  const variantStyles = {
    default: 'bg-[#111726]/90 border border-white/8 hover:border-white/14 shadow-lg shadow-black/40',
    emerald: 'bg-[#0B1A1B]/90 border border-emerald-500/30 hover:border-emerald-500/50 shadow-lg shadow-emerald-950/30 glow-emerald',
    amber: 'bg-[#1C150D]/90 border border-amber-500/30 hover:border-amber-500/50 shadow-lg shadow-amber-950/30 glow-amber',
    rose: 'bg-[#1D0E14]/90 border border-rose-500/30 hover:border-rose-500/50 shadow-lg shadow-rose-950/30 glow-rose',
  }[variant];

  return (
    <div
      id={id}
      className={`rounded-2xl p-4 transition-all duration-200 backdrop-blur-md relative overflow-hidden ${variantStyles} ${className}`}
    >
      {children}
    </div>
  );
};
