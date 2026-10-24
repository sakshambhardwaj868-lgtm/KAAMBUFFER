import React from 'react';
import type { BufferHealthStatus } from '../../calculations/engine';
import { ShieldCheck, AlertTriangle, AlertCircle } from 'lucide-react';

interface StatusBadgeProps {
  status: BufferHealthStatus;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const isSm = size === 'sm';

  switch (status) {
    case 'SAFE':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-bold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-sm shadow-emerald-500/10 tracking-tight ${
            isSm ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-xs'
          }`}
          role="status"
          aria-label="Buffer status: Safe"
        >
          <ShieldCheck className={isSm ? 'w-3.5 h-3.5 text-emerald-400' : 'w-4 h-4 text-emerald-400'} />
          <span>Buffer Safe</span>
        </span>
      );
    case 'CAUTION':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-bold rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 shadow-sm shadow-amber-500/10 tracking-tight ${
            isSm ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-xs'
          }`}
          role="status"
          aria-label="Buffer status: Caution"
        >
          <AlertTriangle className={isSm ? 'w-3.5 h-3.5 text-amber-400' : 'w-4 h-4 text-amber-400'} />
          <span>Caution</span>
        </span>
      );
    case 'SHORTFALL':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-bold rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30 shadow-sm shadow-rose-500/10 tracking-tight ${
            isSm ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-xs'
          }`}
          role="status"
          aria-label="Buffer status: Shortfall Alert"
        >
          <AlertCircle className={isSm ? 'w-3.5 h-3.5 text-rose-400' : 'w-4 h-4 text-rose-400'} />
          <span>Shortfall Alert</span>
        </span>
      );
  }
};
