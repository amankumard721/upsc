'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { db, supabase } from '@/lib/supabase';
import { UserProfile } from '@/types';
import { 
  Trophy, 
  Flame, 
  User, 
  Award, 
  Sparkles,
  Sun,
  Moon,
  Zap,
  Home,
  ArrowLeft
} from 'lucide-react';
import { t, getLanguage } from '@/lib/translations';

const navLinks = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/leaderboard', label: 'Ranks', icon: Trophy },
  { href: '/flashcards/00000000-0000-0000-0000-000000000002', label: 'Cards', icon: Sparkles },
  { href: '/profile', label: 'Profile', icon: User }
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isDark, setIsDark] = useState(true);
  const [lang, setLang] = useState<'en' | 'hi'>('en');
  const [tappedHref, setTappedHref] = useState<string | null>(null);
  const [bookTitle, setBookTitle] = useState<string>('');

  const isLiveDb = supabase !== null;

  useEffect(() => {
    db.getUserProfile().then(setProfile);
    const isDarkLocal = localStorage.getItem('prepai_dark_mode') !== 'false';
    setIsDark(isDarkLocal);
    setLang(getLanguage());
    const html = document.documentElement;
    if (isDarkLocal) html.classList.add('dark-theme');
    else html.classList.remove('dark-theme');

    if (pathname.startsWith('/books/')) {
      const bookId = pathname.split('/books/')[1];
      if (bookId) {
        db.getBook(bookId).then(b => { if (b) setBookTitle(b.title); });
      }
    } else {
      setBookTitle('');
    }

    // Listen to global language change events
    const handleLangChange = () => setLang(getLanguage());
    window.addEventListener('languageChange', handleLangChange);
    return () => window.removeEventListener('languageChange', handleLangChange);
  }, [pathname]);

  const toggleDarkMode = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    localStorage.setItem('prepai_dark_mode', String(nextDark));
    const html = document.documentElement;
    if (nextDark) html.classList.add('dark-theme');
    else html.classList.remove('dark-theme');
  };

  const toggleLanguage = () => {
    const nextLang = lang === 'en' ? 'hi' : 'en';
    setLang(nextLang);
    localStorage.setItem('prepai_language', nextLang);
    if (profile) {
      db.updateUserProfile({ preferred_language: nextLang }).then(setProfile);
    }
    window.dispatchEvent(new Event('languageChange'));
  };

  const getActiveLink = () => {
    if (pathname === '/dashboard') return '/dashboard';
    if (pathname.startsWith('/leaderboard')) return '/leaderboard';
    if (pathname.startsWith('/flashcards')) return '/flashcards/00000000-0000-0000-0000-000000000002';
    if (pathname.startsWith('/profile')) return '/profile';
    return '/dashboard';
  };

  const getPageTitle = () => {
    if (pathname.startsWith('/leaderboard')) return t('leaderboard');
    if (pathname.startsWith('/flashcards')) return t('dailyChallenge'); // Or cards
    if (pathname.startsWith('/profile')) return t('profile');
    if (pathname.startsWith('/books')) return bookTitle || 'Book Details';
    return '';
  };

  const activeHref = getActiveLink();
  const isHome = pathname === '/dashboard';
  
  // Immersive screens manage their own headers entirely (Lesson, Quiz)
  const isImmersive = pathname.startsWith('/lesson') || pathname.startsWith('/quiz');

  if (isImmersive) {
    return null; // Hide global top and bottom navbars entirely
  }

  return (
    <>
      {/* ── Desktop Top Bar ─────────────────────────────────── */}
      <header className="glass-nav sticky top-0 z-40 w-full transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Left Section */}
          {isHome ? (
            <Link href="/dashboard" className="flex items-center space-x-2">
              <span className="font-display font-bold text-2xl tracking-tight text-accent flex items-center">
                Prep<span className="text-foreground font-sans font-light">AI</span>
              </span>
            </Link>
          ) : (
            <div className="flex items-center space-x-3">
              <button 
                onClick={() => router.back()} 
                className="p-2 -ml-2 text-foreground/70 hover:text-foreground transition-colors rounded-full hover:bg-white/5"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="font-display font-bold text-lg tracking-tight text-foreground">
                {getPageTitle()}
              </h1>
            </div>
          )}

          {/* Center Section: Desktop Nav Links (Only on Home) */}
          {isHome && (
            <nav className="hidden md:flex space-x-1 absolute left-1/2 -translate-x-1/2">
              {navLinks.map((link) => {
                const isActive = activeHref === link.href;
                const Icon = link.icon;
                const resolvedLabel = link.href === '/dashboard' ? t('home') : 
                                      link.href === '/leaderboard' ? t('leaderboard') :
                                      link.href === '/profile' ? t('profile') : t('cards');
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center space-x-2 text-sm font-medium px-4 py-2 rounded-full transition-all duration-200 ${
                      isActive
                        ? 'bg-accent/15 text-accent'
                        : 'text-foreground/70 hover:text-foreground hover:bg-white/5'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'fill-accent stroke-none' : ''}`} />
                    <span>{resolvedLabel}</span>
                  </Link>
                );
              })}
            </nav>
          )}

          {/* Right Section */}
          <div className="flex items-center space-x-3">
            {isHome && profile && (
              <div className="flex items-center space-x-2 text-sm">
                <div className="flex items-center space-x-1 bg-amber-500/10 text-amber-500 px-2.5 py-1 rounded-full border border-amber-500/20 font-mono font-medium text-xs">
                  <Flame className="w-3.5 h-3.5 fill-amber-500" />
                  <span>{profile.streak}</span>
                </div>
                <div className="flex items-center space-x-1 bg-accent/10 text-accent px-2.5 py-1 rounded-full border border-accent/20 font-mono font-medium text-xs">
                  <Zap className="w-3.5 h-3.5 fill-accent" />
                  <span>{profile.total_points} XP</span>
                </div>
                {profile.is_premium ? (
                  <div className="hidden sm:flex items-center space-x-1 bg-indigo-500/20 text-indigo-400 px-2.5 py-1 rounded-full border border-indigo-500/30 text-xs font-semibold uppercase tracking-wider">
                     <Award className="w-3 h-3" />
                    <span>PRO</span>
                  </div>
                ) : (
                  <Link
                    href="/profile"
                    className="hidden sm:flex items-center space-x-1 bg-gradient-to-r from-accent to-amber-600 hover:opacity-90 text-foreground px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider shadow-sm transition-all"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Go Premium</span>
                  </Link>
                )}
              </div>
            )}

            {/* Language Switcher */}
            <button
              onClick={toggleLanguage}
              className="px-2.5 py-1 text-[10px] font-bold rounded-lg border border-foreground/15 hover:bg-white/5 text-foreground/80 transition-colors ml-1 font-mono uppercase tracking-wider shadow-sm"
              aria-label="Toggle Language"
            >
              {lang === 'en' ? '🇬🇧 EN' : '🇮🇳 HI'}
            </button>

            {/* Theme toggle (Available on all pages) */}
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-full hover:bg-white/10 text-foreground/80 transition-colors ml-1"
              aria-label="Toggle Theme"
            >
              {isDark ? <Sun className="w-5 h-5 text-accent" /> : <Moon className="w-5 h-5 text-primary" />}
            </button>
          </div>
        </div>
      </header>

      {/* ── Mobile Native Bottom Tab Bar ────────────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 native-bottom-bar">
        <div className="flex items-center justify-around px-2 pt-2 pb-safe">
          {navLinks.map((link) => {
            const isActive = activeHref === link.href;
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                onMouseDown={() => setTappedHref(link.href)}
                onMouseUp={() => setTappedHref(null)}
                onTouchStart={() => setTappedHref(link.href)}
                onTouchEnd={() => setTappedHref(null)}
                className={`native-tab-item ${isActive ? 'active' : ''} ${tappedHref === link.href ? 'tapped' : ''}`}
              >
                {isActive && <span className="tab-pill-indicator" />}
                <span className="tab-icon-wrap">
                  <Icon className={`w-[22px] h-[22px] transition-all duration-200 ${isActive ? 'text-accent' : 'text-foreground/40'}`}
                    strokeWidth={isActive ? 2.5 : 1.8}
                  />
                </span>
                <span className={`tab-label ${isActive ? 'text-accent font-semibold' : 'text-foreground/40'}`}>
                  {link.href === '/dashboard' ? t('home') : 
                   link.href === '/leaderboard' ? t('leaderboard') :
                   link.href === '/profile' ? t('profile') : t('cards')}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
