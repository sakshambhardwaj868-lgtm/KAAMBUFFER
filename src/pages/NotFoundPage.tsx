import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
      <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-emerald-400 font-mono font-black text-xl shadow-lg shadow-black">
        404
      </div>
      <div>
        <h2 className="text-lg font-bold text-white">Page Not Found</h2>
        <p className="text-xs text-slate-400 mt-1">
          Ye page maujood nahi hai.
        </p>
      </div>
      <Link
        to="/balance"
        className="touch-target inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-400 text-slate-950 font-black text-xs px-4 py-2.5 rounded-xl shadow-md shadow-emerald-500/20 active:scale-95 transition-all"
      >
        <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
        <span>Go to Daily Pocket Check</span>
      </Link>
    </div>
  );
};
