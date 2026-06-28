'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { db } from '@/lib/supabase';
import { sfx } from '@/lib/sounds';
import { Book, MCQ, UserProfile, LeaderboardEntry, Chapter } from '@/types';
import {
  CheckCircle2, AlertCircle,
  ChevronRight, Award, BookOpen,
  Trophy, Target, TrendingUp, PlayCircle
} from 'lucide-react';
import { t } from '@/lib/translations';

const SUBJECT_CHIPS = [
  { label: 'All', emoji: '📚' },
  { label: 'Polity', emoji: '📜' },
  { label: 'History', emoji: '🏛️' },
  { label: 'Geography', emoji: '🌍' },
  { label: 'Economy', emoji: '💰' },
];

export default function DashboardPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [selectedSubject, setSelectedSubject] = useState('All');
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);
  const [continueChapter, setContinueChapter] = useState<Chapter | null>(null);
  const [langTick, setLangTick] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [profileData, booksData, leaderboardData] = await Promise.all([
          db.getUserProfile(),
          db.getBooks(),
          db.getLeaderboard(),
        ]);
        
        setProfile(profileData);
        setBooks(booksData);
        setLeaderboard(leaderboardData.slice(0, 3));

        if (typeof window !== 'undefined') {
          const list = JSON.parse(localStorage.getItem('prepai_user_progress') || '[]');
          const targetProgress = list.find((p: any) => !p.is_completed) || (list.length > 0 ? list[list.length - 1] : null);
          
          if (targetProgress) {
            try {
              const ch = await db.getChapter(targetProgress.chapter_id);
              if (ch) setContinueChapter(ch);
            } catch (err) {
              // ignore chapter load error
            }
          }
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setDbError('Failed to connect to database. Check your Supabase configuration.');
      } finally {
        setLoading(false);
      }
    };
    loadData();

    const handleLangChange = () => setLangTick(t => t + 1);
    window.addEventListener('languageChange', handleLangChange);
    return () => window.removeEventListener('languageChange', handleLangChange);
  }, []);


  const filteredBooks = books.filter(b =>
    selectedSubject === 'All' || b.subject === selectedSubject
  );

  // ── Skeleton ────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-5 page-enter px-1">
        <div className="skeleton h-10 w-full rounded-2xl" />
        <div className="flex gap-4 overflow-hidden">
          {[1,2,3].map(i => <div key={i} className="skeleton h-52 w-48 shrink-0 rounded-2xl" />)}
        </div>
        <div className="skeleton h-56 w-full rounded-3xl" />
      </div>
    );
  }

  // ── Render ───────────────────────────────────────────────
  return (
    <div className="space-y-6 page-enter">

      {/* DB error */}
      {dbError && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-2xl text-error-red text-xs font-mono">
          <p className="font-bold">⚠️ {dbError}</p>
        </div>
      )}


      {/* ── Daily Challenge Banner (Always Visible) ────────────────────────────── */}
      <div className="premium-card p-4 bg-gradient-to-r from-accent/15 via-accent/5 to-transparent border-accent/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-accent/10 rounded-full blur-2xl pointer-events-none" />
        <p className="text-[10px] font-bold text-accent uppercase tracking-widest font-mono mb-1">
          {t('dailyChallenge')} 🔥
        </p>
        <h3 className="text-sm md:text-base font-bold text-foreground font-display mb-2">
          {continueChapter 
            ? `${t('testKnowledge')} ${continueChapter.title}`
            : t('syllabusReview')}
        </h3>
        <Link 
          href="/challenge" 
          className="inline-flex items-center text-xs font-semibold text-slate-950 bg-accent hover:bg-amber-500 px-4 py-2 rounded-xl shadow-md transition-all duration-200"
        >
          <Target className="w-3.5 h-3.5 mr-1.5 fill-slate-950/20 animate-pulse" /> {t('playChallenge')}
        </Link>
      </div>

      {/* ── Books Section ─────────────────────────────── */}
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-foreground font-display flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-accent" />
            {t('studyMaterial')}
          </h2>
          <span className="text-xs text-foreground/40 font-mono">{books.length} {t('booksCount')}</span>
        </div>

        {/* Subject Chips */}
        <div className="flex gap-2 overflow-x-auto pb-3 no-scrollbar mb-4">
          {SUBJECT_CHIPS.map(chip => (
            <button
              key={chip.label}
              onClick={() => setSelectedSubject(chip.label)}
              className={`shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold transition-all duration-200 border ${
                selectedSubject === chip.label
                  ? 'bg-accent text-slate-950 border-accent shadow-md shadow-accent/20'
                  : 'bg-white/5 border-white/10 text-foreground/60 hover:border-white/20'
              }`}
            >
              <span>{chip.emoji}</span>
              <span>{chip.label === 'All' ? t('all') : chip.label}</span>
            </button>
          ))}
        </div>

        {/* Books — horizontal scroll on mobile */}
        {filteredBooks.length === 0 ? (
          <div className="premium-card p-8 text-center">
            <p className="text-foreground/40 text-sm">No books found. Add data in Supabase.</p>
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar -mx-1 px-1">
            {filteredBooks.map(book => {
              const progress = book.id === '00000000-0000-0000-0000-000000000001' ? 33 : 0;
              const circumference = 2 * Math.PI * 16;
              return (
                <Link
                  key={book.id}
                  href={`/books/${book.id}`}
                  className="shrink-0 w-36 premium-card overflow-hidden flex flex-col group border border-white/5 bg-slate-900/40 hover:bg-slate-900/60 transition-all rounded-[1.25rem] shadow-[0_8px_20px_rgba(0,0,0,0.3)]"
                >
                  {/* Cover */}
                  <div className="relative h-44 overflow-hidden bg-primary/20">
                    <img
                      src={book.cover_image || ''}
                      alt={book.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-90"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/20 to-transparent opacity-100" />
                    
                    <span className="absolute top-2.5 left-2.5 text-[8px] bg-slate-950/40 backdrop-blur-md border border-white/20 text-foreground px-2 py-1 rounded-md font-bold uppercase tracking-widest shadow-sm">
                      {book.subject}
                    </span>
                    
                    {/* Floating Title inside Cover for premium feel */}
                    <div className="absolute bottom-2.5 left-2.5 right-2.5">
                       <h4 className="text-xs font-bold text-foreground leading-snug line-clamp-2 drop-shadow-md">{book.title}</h4>
                    </div>
                  </div>

                  {/* Info Panel */}
                  <div className="p-3 flex-1 flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-2.5">
                      <p className="text-[9px] text-foreground/50 font-mono truncate mr-2">{book.author}</p>
                      <span className="text-[9px] text-foreground/30 font-mono shrink-0 font-medium bg-white/5 px-1.5 py-0.5 rounded-sm">{book.total_chapters} CH</span>
                    </div>

                    {/* Clean Linear Progress */}
                    <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-accent rounded-full transition-all duration-700 shadow-[0_0_8px_rgba(216,155,60,0.8)]" style={{ width: `${Math.max(progress, 2)}%` }} />
                    </div>
                    <div className="text-right text-[9px] font-mono text-accent font-bold mt-1 tracking-wide">{progress}% DONE</div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>



      {/* ── 6. JTET Test Series Section ─────────────────────── */}
      <div className="premium-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-accent/15 rounded-xl flex items-center justify-center">
              <Award className="w-4 h-4 text-accent" />
            </div>
            <p className="text-xs font-bold text-foreground">{t('testSeries')}</p>
          </div>
          <span className="text-[9px] bg-accent/10 text-accent font-extrabold uppercase px-2 py-0.5 rounded-md border border-accent/20 tracking-wider">
            Premium Pack
          </span>
        </div>

        <div className="space-y-3.5">
          {/* Test 1: Full Length Mock */}
          <div className="p-3.5 rounded-2xl border border-white/5 bg-slate-900/40 hover:bg-slate-900/60 transition duration-200">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h4 className="text-xs font-bold text-foreground leading-snug">JTET Full-Length Mock Test 1</h4>
                <p className="text-[10px] text-foreground/45 mt-0.5">Paper I (Class 1-5)</p>
              </div>
              <span className="text-[8px] bg-emerald-500/10 text-emerald-400 font-bold px-2 py-0.5 rounded-md">FREE</span>
            </div>
            
            <div className="flex items-center gap-4 text-[9px] text-foreground/40 font-mono mt-3">
              <span>📝 150 {t('questions')}</span>
              <span>⏱️ 150 {t('minutes')}</span>
              <span>🎯 150 {t('marks')}</span>
            </div>

            <div className="flex items-center gap-3 mt-4 pt-3 border-t border-white/5">
              <div className="flex-1 bg-white/5 h-1 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: '45%' }} />
              </div>
              <span className="text-[8px] font-mono font-bold text-emerald-400">45% Attempted</span>
              <Link 
                href="/test-series/mock-1"
                className="bg-accent text-slate-950 text-[10px] font-extrabold px-3 py-1.5 rounded-lg flex items-center gap-1 transition active:scale-95 shadow-sm uppercase tracking-wider"
              >
                <PlayCircle className="w-3.5 h-3.5 fill-slate-950/20" /> {t('startTest')}
              </Link>
            </div>
          </div>

          {/* Test 2: CSAT */}
          <div className="p-3.5 rounded-2xl border border-white/5 bg-slate-900/40 hover:bg-slate-900/60 transition duration-200">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h4 className="text-xs font-bold text-foreground leading-snug">JTET Paper II Mock Test 1</h4>
                <p className="text-[10px] text-foreground/45 mt-0.5">Paper II (Class 6-8)</p>
              </div>
              <span className="text-[8px] bg-accent/15 text-accent font-bold px-2 py-0.5 rounded-md">PRO</span>
            </div>
            
            <div className="flex items-center gap-4 text-[9px] text-foreground/40 font-mono mt-3">
              <span>📝 150 {t('questions')}</span>
              <span>⏱️ 150 {t('minutes')}</span>
              <span>🎯 150 {t('marks')}</span>
            </div>

            <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5">
              <span className="text-[8px] font-mono text-foreground/30">Never Attempted</span>
              <Link 
                href="/test-series/mock-2"
                className="bg-white/5 border border-white/10 hover:border-accent hover:text-accent text-[10px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition active:scale-95"
              >
                <PlayCircle className="w-3.5 h-3.5" /> {t('startTest')}
              </Link>
            </div>
          </div>

          {/* Test 3: Sectional Test */}
          <div className="p-3.5 rounded-2xl border border-white/5 bg-slate-900/40 hover:bg-slate-900/60 transition duration-200">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h4 className="text-xs font-bold text-foreground leading-snug">Daily Mini Test (Polity)</h4>
                <p className="text-[10px] text-foreground/45 mt-0.5">Syllabus-wise Sectional Test</p>
              </div>
              <span className="text-[8px] bg-emerald-500/10 text-emerald-400 font-bold px-2 py-0.5 rounded-md">FREE</span>
            </div>
            
            <div className="flex items-center gap-4 text-[9px] text-foreground/40 font-mono mt-3">
              <span>📝 20 {t('questions')}</span>
              <span>⏱️ 20 {t('minutes')}</span>
              <span>🎯 40 {t('marks')}</span>
            </div>

            <div className="flex items-center gap-3 mt-4 pt-3 border-t border-white/5">
              <div className="flex-1 bg-white/5 h-1 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: '100%' }} />
              </div>
              <span className="text-[8px] font-mono font-bold text-emerald-400">100% Score: 36/40</span>
              <Link 
                href="/test-series/mock-1"
                className="bg-white/5 border border-white/10 hover:border-accent hover:text-accent text-[10px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition active:scale-95"
              >
                Re-take
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ── 7. Weekly Activity ─────────────────────────── */}
      <div className="premium-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 bg-indigo-500/15 rounded-xl flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <p className="text-xs font-bold text-foreground">Weekly Activity</p>
            <p className="text-[10px] text-foreground/40 font-mono">Minutes studied per day</p>
          </div>
        </div>

        <div className="w-full h-24 relative">
          <svg className="w-full h-full" viewBox="0 0 300 80" preserveAspectRatio="none">
            <defs>
              <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#D89B3C" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#D89B3C" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d="M0 70 L43 55 L86 63 L129 30 L172 47 L215 12 L258 22 L300 18 L300 80 L0 80Z" fill="url(#grad)" />
            <path d="M0 70 L43 55 L86 63 L129 30 L172 47 L215 12 L258 22 L300 18" fill="none" stroke="#D89B3C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div className="flex justify-between text-[9px] text-foreground/35 font-mono uppercase mt-1">
          {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => <span key={d}>{d}</span>)}
        </div>
      </div>

      {/* Bottom padding for tab bar */}
      <div className="h-4" />
    </div>
  );
}
