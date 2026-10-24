import React from 'react';
import { useLocation } from 'react-router-dom';
import { Header } from './Header';
import { Navigation } from './Navigation';
import { useAuth } from '../../context/AuthContext';

interface MobileContainerProps {
  children: React.ReactNode;
}

export const MobileContainer: React.FC<MobileContainerProps> = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();
  const isAuthPage = ['/login', '/signup', '/reset-password'].includes(location.pathname);

  return (
    <div className="min-h-screen bg-[#07090E] text-slate-100 flex justify-center relative overflow-hidden">
      {/* Ambient background glows for desktop/tablet elegance */}
      <div
        aria-hidden="true"
        className="fixed top-[-10%] left-[50%] translate-x-[-50%] w-[600px] h-[350px] bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none"
      />
      <div
        aria-hidden="true"
        className="fixed bottom-[-10%] left-[50%] translate-x-[-50%] w-[500px] h-[300px] bg-indigo-500/8 blur-[100px] rounded-full pointer-events-none"
      />

      {/* Main Mobile App Frame */}
      <div className={`w-full max-w-md min-h-screen bg-[#0C1019] sm:border-x sm:border-white/10 sm:shadow-2xl sm:shadow-black/80 flex flex-col relative z-10 ${
        user && !isAuthPage ? 'pb-24' : 'pb-6'
      }`}>
        <Header />
        <main className="flex-1 p-4 flex flex-col gap-4 overflow-y-auto">
          {children}
        </main>
        {user && !isAuthPage && <Navigation />}
      </div>
    </div>
  );
};
