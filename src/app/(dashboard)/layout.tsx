'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Navbar from '@/components/Navbar';
import MiniPlayer from '@/components/MiniPlayer';
import InAppPopup from '@/components/InAppPopup';
import { AudioProvider } from '@/contexts/AudioContext';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isImmersive = 
    pathname.startsWith('/lesson') || 
    pathname.startsWith('/quiz') || 
    pathname.startsWith('/test-series') || 
    pathname.startsWith('/flashcards') || 
    pathname.startsWith('/challenge');

  return (
    <AudioProvider>
      {isImmersive ? (
        <div className="h-[100dvh] w-screen overflow-hidden bg-[#060D1A]">
          {children}
        </div>
      ) : (
        <div className="flex flex-col min-h-screen">
          <Navbar />
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8">
            {children}
          </main>
        </div>
      )}
      {/* Mini player shows on all pages except when lesson is fully open */}
      {!pathname.startsWith('/lesson') && <MiniPlayer />}
      <InAppPopup />
    </AudioProvider>
  );
}
