'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';

export default function AndroidBackButtonHandler() {
  const pathname = usePathname();
  const router = useRouter();
  const [showExitModal, setShowExitModal] = useState(false);

  useEffect(() => {
    // Only run on native platforms (Android / iOS)
    if (!Capacitor.isNativePlatform()) return;

    const backButtonListener = App.addListener('backButton', () => {
      // Define root level pages where back button should trigger exit confirm modal
      const isRootScreen = 
        pathname === '/dashboard' || 
        pathname === '/login' || 
        pathname === '/signup' || 
        pathname === '/';

      if (isRootScreen) {
        setShowExitModal(true);
      } else {
        // Go back to the previous screen using browser navigation history
        router.back();
      }
    });

    return () => {
      backButtonListener.then(handler => handler.remove());
    };
  }, [pathname, router]);

  const handleExitConfirm = () => {
    App.exitApp();
  };

  if (!showExitModal) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-white/10 p-6 rounded-2xl max-w-xs w-full text-center space-y-5 animate-in fade-in zoom-in-95 duration-200">
        <div className="w-12 h-12 bg-amber-500/15 rounded-full flex items-center justify-center mx-auto text-amber-500 text-xl font-bold">
          🚪
        </div>
        <div className="space-y-1.5 font-sans">
          <h3 className="text-sm font-black text-foreground uppercase tracking-wider">Exit PrepAI?</h3>
          <p className="text-xs text-foreground/50 leading-relaxed font-light">
            क्या आप ऐप बंद करना चाहते हैं?
          </p>
        </div>
        <div className="flex gap-3 font-sans">
          <button
            onClick={() => setShowExitModal(false)}
            className="flex-1 bg-white/5 border border-white/10 hover:bg-white/10 text-foreground text-xs font-bold py-2.5 rounded-xl transition active:scale-95"
          >
            No / नहीं
          </button>
          <button
            onClick={handleExitConfirm}
            className="flex-1 bg-red-500 hover:bg-red-600 text-white text-xs font-bold py-2.5 rounded-xl transition active:scale-95 shadow-md shadow-red-500/10"
          >
            Yes / हाँ
          </button>
        </div>
      </div>
    </div>
  );
}
