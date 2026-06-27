'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { db } from '@/lib/supabase';
import { UserProfile } from '@/types';
import { 
  BookOpen, 
  Trophy, 
  Flame, 
  User, 
  Award, 
  LayoutDashboard, 
  Sparkles,
  Sun,
  Moon,
  Zap
} from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    // Fetch profile
    db.getUserProfile().then(setProfile);

    // Initial dark mode setup
    const isDarkLocal = localStorage.getItem('prepai_dark_mode') !== 'false';
    setIsDark(isDarkLocal);
    const html = document.documentElement;
    if (isDarkLocal) {
      html.classList.add('dark-theme');
    } else {
      html.classList.remove('dark-theme');
    }
  }, [pathname]);

  const toggleDarkMode = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    localStorage.setItem('prepai_dark_mode', String(nextDark));
    const html = document.documentElement;
    if (nextDark) {
      html.classList.add('dark-theme');
    } else {
      html.classList.remove('dark-theme');
    }
  };

  const navLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/leaderboard', label: 'Leaderboard', icon: Trophy },
    { href: '/flashcards/polity-ch1', label: 'Flashcards', icon: Sparkles },
    { href: '/profile', label: 'Profile', icon: User }
  ];

  return (
    <>
      {/* Desktop Top Navbar */}
      <header className="glass-nav sticky top-0 z-40 w-full transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <span className="font-display font-bold text-2xl tracking-tight text-accent flex items-center">
                Prep<span className="text-foreground font-sans font-light">AI</span>
              </span>
            </Link>

            <nav className="hidden md:flex space-x-6">
              {navLinks.map((link) => {
                const isActive = pathname.startsWith(link.href.split('/')[1]);
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center space-x-2 text-sm font-medium transition-colors hover:text-accent ${
                      isActive ? 'text-accent border-b-2 border-accent pb-1 pt-1' : 'text-foreground/80'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center space-x-4">
            {/* Streak & XP Counters */}
            {profile && (
              <div className="flex items-center space-x-3 text-sm">
                {/* Streak */}
                <div className="flex items-center space-x-1 bg-amber-500/10 text-amber-500 px-2.5 py-1 rounded-full border border-amber-500/20 font-mono font-medium">
                  <Flame className="w-4 h-4 fill-amber-500" />
                  <span>{profile.streak} Days</span>
                </div>

                {/* Points/XP */}
                <div className="flex items-center space-x-1 bg-accent/10 text-accent px-2.5 py-1 rounded-full border border-accent/20 font-mono font-medium">
                  <Zap className="w-4 h-4 fill-accent" />
                  <span>{profile.total_points} XP</span>
                </div>

                {/* Premium status */}
                {profile.is_premium ? (
                  <div className="hidden sm:flex items-center space-x-1 bg-indigo-500/20 text-indigo-400 px-2.5 py-1 rounded-full border border-indigo-500/30 text-xs font-semibold uppercase tracking-wider">
                    <Award className="w-3.5 h-3.5" />
                    <span>PRO</span>
                  </div>
                ) : (
                  <Link
                    href="/profile"
                    className="hidden sm:flex items-center space-x-1 bg-gradient-to-r from-accent to-amber-600 hover:from-amber-600 hover:to-accent text-white px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider shadow-sm transition-all"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Go Premium</span>
                  </Link>
                )}
              </div>
            )}

            {/* Dark Mode toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-full hover:bg-foreground/10 text-foreground/80 transition-colors"
              aria-label="Toggle Theme"
            >
              {isDark ? <Sun className="w-5 h-5 text-accent" /> : <Moon className="w-5 h-5 text-primary" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-background border-t border-foreground/10 shadow-lg px-6 py-2 flex items-center justify-between pb-safe">
        {navLinks.map((link) => {
          const isActive = pathname.startsWith(link.href.split('/')[1]);
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-col items-center space-y-0.5 text-xs transition-colors py-1 px-3 rounded-lg ${
                isActive ? 'text-accent font-semibold' : 'text-foreground/60'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5px]' : 'stroke-[1.5px]'}`} />
              <span className="scale-95">{link.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
