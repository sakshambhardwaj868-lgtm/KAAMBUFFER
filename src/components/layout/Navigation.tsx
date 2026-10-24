import React from 'react';
import { NavLink } from 'react-router-dom';
import { Wallet, Receipt, LayoutDashboard, SlidersHorizontal } from 'lucide-react';

interface NavItem {
  to: string;
  label: string;
  hinglish: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  {
    to: '/balance',
    label: 'Pocket',
    hinglish: 'Jeb Check',
    icon: Wallet,
  },
  {
    to: '/obligations',
    label: 'Essentials',
    hinglish: 'Kharche',
    icon: Receipt,
  },
  {
    to: '/dashboard',
    label: 'Buffer',
    hinglish: 'Status',
    icon: LayoutDashboard,
  },
  {
    to: '/simulate',
    label: 'What-If',
    hinglish: 'Simulate',
    icon: SlidersHorizontal,
  },
];

export const Navigation: React.FC = () => {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30 glass-nav max-w-md mx-auto shadow-2xl shadow-black"
      aria-label="Primary Navigation"
    >
      <div className="grid grid-cols-4 px-2 py-1.5">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `touch-target flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all duration-150 relative active:scale-95 ${
                  isActive
                    ? 'text-emerald-400 font-bold'
                    : 'text-slate-400 hover:text-slate-200 font-medium'
                }`
              }
              aria-label={`${item.label} (${item.hinglish})`}
            >
              {({ isActive }) => (
                <>
                  <div
                    className={`p-1.5 rounded-xl transition-all duration-200 ${
                      isActive
                        ? 'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30 shadow-sm shadow-emerald-500/20'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Icon className="w-5 h-5 stroke-[2]" />
                  </div>
                  <span
                    className={`text-[11px] leading-tight mt-1 tracking-tight ${
                      isActive ? 'text-white font-bold' : 'text-slate-400'
                    }`}
                  >
                    {item.label}
                  </span>
                  <span className="text-[9px] text-slate-400 leading-tight">
                    {item.hinglish}
                  </span>
                  {isActive && (
                    <span
                      aria-hidden="true"
                      className="absolute bottom-0.5 w-1 h-1 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400"
                    />
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
