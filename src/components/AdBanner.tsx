'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export default function AdBanner() {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(true);

  // Hide ads on admin, login, signup, or immersive lesson/quiz paths
  useEffect(() => {
    const isImmersive = 
      pathname.startsWith('/lesson') || 
      pathname.startsWith('/quiz') || 
      pathname.startsWith('/admin') ||
      pathname.startsWith('/login') ||
      pathname.startsWith('/signup');
    setIsVisible(!isImmersive);
  }, [pathname]);

  if (!isVisible) return null;

  return (
    <div className="w-full bg-slate-950/20 backdrop-blur-md border-t border-white/5 py-1.5 flex justify-center items-center z-40 fixed bottom-[68px] left-0 right-0 md:hidden select-none">
      <div className="w-[320px] h-[50px] bg-[#E8E8E8] dark:bg-[#1E293B] border border-slate-300 dark:border-slate-800 flex items-center justify-between px-3 shadow-md rounded-xl relative overflow-hidden">
        {/* Google AdMob Info Icon decoration */}
        <div className="absolute top-0 right-0 flex items-center px-1.5 py-0.5 bg-sky-500 text-[6px] font-bold text-white uppercase rounded-bl tracking-wider">
          Test Ad
        </div>
        
        {/* Ad Content */}
        <div className="flex items-center space-x-2">
          {/* AdMob Mock Logo */}
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-yellow-500 via-amber-600 to-red-500 flex items-center justify-center text-[10px] font-black text-white shadow-sm font-sans">
            Ad
          </div>
          
          {/* Ad Text */}
          <div className="flex flex-col text-left">
            <span className="text-[9px] font-bold text-slate-800 dark:text-slate-200 leading-tight">Google AdMob</span>
            <span className="text-[8px] text-slate-500 dark:text-slate-400 font-medium leading-none mt-0.5">Nice job! This is a 320x50 test ad.</span>
          </div>
        </div>

        {/* Dummy CTA */}
        <div className="bg-sky-600 text-white text-[8px] font-extrabold px-3 py-1.5 rounded-lg transition active:scale-95 shadow-sm uppercase tracking-wider">
          Install
        </div>
      </div>
    </div>
  );
}
