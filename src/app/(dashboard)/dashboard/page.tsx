'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { db } from '@/lib/supabase';
import { sfx } from '@/lib/sounds';
import { Book, MCQ, UserProfile, LeaderboardEntry } from '@/types';
import {
  CheckCircle2, AlertCircle,
  ChevronRight, Award, BookOpen,
  Trophy, Target, TrendingUp, PlayCircle
} from 'lucide-react';

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
  const [dailyMCQ, setDailyMCQ] = useState<MCQ | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [mcqAnswered, setMcqAnswered] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState('All');
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);
  const [continueChapter, setContinueChapter] = useState<{ id: string, title: string } | null>(null);

  useEffect(() => {
    db.getUserProfile().then(setProfile);

    db.getBooks().then(booksData => {
      setBooks(booksData);
      setLoading(false);
    }).catch(() => setLoading(false));

    // Diagnostics
    const diag = async () => {
      const { supabase } = await import('@/lib/supabase');
      if (supabase) {
        const { error } = await supabase.from('books').select('count', { count: 'exact', head: true });
        if (error) setDbError(`Supabase Query Error: ${JSON.stringify(error)}`);
      } else {
        setDbError('Supabase connection is not active.');
      }
    };
    diag();

    db.getLeaderboard().then(d => setLeaderboard(d.slice(0, 3)));
    db.getMCQs('00000000-0000-0000-0000-000000000002').then(mcqs => {
      if (mcqs?.length) setDailyMCQ(mcqs[0]);
    });

    // Check for continue learning in localStorage
    if (typeof window !== 'undefined') {
      const list = JSON.parse(localStorage.getItem('prepai_user_progress') || '[]');
      const targetProgress = list.find((p: any) => !p.is_completed) || (list.length > 0 ? list[list.length - 1] : null);
      
      if (targetProgress) {
        db.getChapter(targetProgress.chapter_id).then(ch => {
           if (ch) setContinueChapter({ id: ch.id, title: ch.title });
        });
      } else {
        // Fallback: Get the very first chapter from the first book so the UI always shows
        db.getBooks().then(booksData => {
          if (booksData && booksData.length > 0) {
            db.getChapters(booksData[0].id).then(chs => {
              if (chs && chs.length > 0) {
                setContinueChapter({ id: chs[0].id, title: chs[0].title });
              }
            });
          }
        });
      }
    }
  }, []);

  const handleMCQ = async (option: string) => {
    if (mcqAnswered || !dailyMCQ) return;
    setSelectedOption(option);
    setMcqAnswered(true);
    const isCorrect = option === dailyMCQ.correct_option;
    if (isCorrect) {
      sfx.playCorrect();
      if (profile) {
        const updated = await db.updateUserProfile({ total_points: profile.total_points + 25 });
        setProfile(updated);
      }
    } else {
      sfx.playIncorrect();
    }
  };

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

      {/* ── Minimal Header / Continue Learning ────────────────────────────── */}
      <div className="flex items-center justify-between pt-2 pb-4">
        {continueChapter ? (
          <div className="flex-1 mr-4 premium-card p-4 bg-gradient-to-r from-accent/10 to-transparent border-accent/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-accent/10 rounded-full blur-2xl pointer-events-none" />
            <p className="text-[10px] font-bold text-accent uppercase tracking-widest font-mono mb-1">
              Jump back in
            </p>
            <h1 className="text-sm md:text-base font-bold text-foreground font-display line-clamp-1 pr-6">
              {continueChapter.title}
            </h1>
            <Link 
              href={`/lesson/${continueChapter.id}`} 
              className="mt-3 inline-flex items-center text-xs font-semibold text-slate-950 bg-accent hover:bg-amber-500 px-3 py-1.5 rounded-lg shadow-sm transition-all"
            >
              <PlayCircle className="w-3.5 h-3.5 mr-1.5 fill-slate-950/20" /> Continue Lesson
            </Link>
          </div>
        ) : (
          <div>
            <p className="text-[10px] font-medium text-foreground/50 uppercase tracking-widest font-mono">
              {profile?.name?.split(' ')[0] || 'Aspirant'}'s Dashboard
            </p>
            <h1 className="text-xl font-bold text-foreground font-display mt-0.5">
              Ready to learn? 🚀
            </h1>
          </div>
        )}
        
        <Link href="/profile" className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent text-base font-bold border border-accent/20 shadow-sm transition-transform hover:scale-105 shrink-0">
          {profile?.name ? profile.name[0].toUpperCase() : 'A'}
        </Link>
      </div>

      {/* ── Books Section ─────────────────────────────── */}
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-foreground font-display flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-accent" />
            Study Material
          </h2>
          <span className="text-xs text-foreground/40 font-mono">{books.length} Books</span>
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
                  : 'bg-foreground/5 border-foreground/10 text-foreground/60 hover:border-foreground/20'
              }`}
            >
              <span>{chip.emoji}</span>
              <span>{chip.label}</span>
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
                  className="shrink-0 w-44 premium-card overflow-hidden flex flex-col group"
                >
                  {/* Cover */}
                  <div className="relative h-28 overflow-hidden bg-primary/30">
                    <img
                      src={book.cover_image || ''}
                      alt={book.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <span className="absolute top-2 left-2 text-[9px] bg-accent/90 text-slate-950 px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">
                      {book.subject}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="p-3 flex-1 flex flex-col justify-between gap-2">
                    <div>
                      <h4 className="text-xs font-bold text-foreground leading-snug line-clamp-2">{book.title}</h4>
                      <p className="text-[10px] text-foreground/45 mt-0.5">{book.author}</p>
                    </div>

                    {/* Progress ring + chapters */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <svg className="w-8 h-8 -rotate-90 shrink-0">
                          <circle cx="16" cy="16" r="12" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-foreground/10" />
                          <circle
                            cx="16" cy="16" r="12" fill="none" stroke="currentColor" strokeWidth="2.5"
                            className="text-accent transition-all duration-700"
                            strokeDasharray={circumference}
                            strokeDashoffset={circumference - (circumference * progress) / 100}
                            strokeLinecap="round"
                          />
                        </svg>
                        <span className="text-[10px] font-mono font-bold text-accent">{progress}%</span>
                      </div>
                      <span className="text-[10px] text-foreground/40 font-mono">{book.total_chapters} ch</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* ── 5. Daily MCQ Challenge ─────────────────────── */}
      {dailyMCQ && (
        <div className="premium-card p-5 border-accent/25 border-2 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-accent/5 rounded-full blur-2xl" />
          {/* Badge */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-accent/15 rounded-xl flex items-center justify-center">
                <Target className="w-4 h-4 text-accent" />
              </div>
              <div>
                <p className="text-xs font-bold text-foreground">Daily MCQ Challenge</p>
                <p className="text-[10px] text-foreground/45 font-mono">Answer correctly for +25 XP</p>
              </div>
            </div>
            <span className="text-[10px] bg-amber-500/15 text-amber-400 border border-amber-500/25 px-2 py-1 rounded-full font-bold font-mono">
              +25 XP
            </span>
          </div>

          {/* Question */}
          <p className="text-sm text-foreground/90 leading-relaxed mb-4 font-medium">
            {dailyMCQ.question}
          </p>

          {/* Options */}
          <div className="space-y-2.5">
            {(['A','B','C','D'] as const).map(key => {
              const text = dailyMCQ[`option_${key.toLowerCase()}` as keyof MCQ] as string;
              const isSelected = selectedOption === key;
              const isCorrect = key === dailyMCQ.correct_option;

              let cls = 'border-foreground/10 bg-foreground/4 hover:border-accent/40 hover:bg-accent/5';
              if (mcqAnswered) {
                if (isCorrect) cls = 'border-success-green bg-success-green/10';
                else if (isSelected) cls = 'border-error-red bg-error-red/10';
                else cls = 'border-foreground/5 opacity-40';
              }

              return (
                <button
                  key={key}
                  disabled={mcqAnswered}
                  onClick={() => handleMCQ(key)}
                  className={`w-full text-left flex items-start gap-3 p-3.5 rounded-2xl border transition-all duration-200 ${cls}`}
                >
                  <span className="shrink-0 w-6 h-6 rounded-full border border-foreground/20 flex items-center justify-center text-[11px] font-bold font-mono text-accent bg-foreground/5 mt-0.5">
                    {key}
                  </span>
                  <span className="text-xs text-foreground/85 leading-relaxed">{text}</span>
                </button>
              );
            })}
          </div>

          {/* Explanation */}
          {mcqAnswered && (
            <div className="mt-4 p-3.5 bg-foreground/5 rounded-2xl border border-foreground/8">
              <div className="flex items-center gap-2 mb-2">
                {selectedOption === dailyMCQ.correct_option ? (
                  <><CheckCircle2 className="w-4 h-4 text-success-green shrink-0" /><span className="text-xs font-bold text-success-green">Correct! Well done!</span></>
                ) : (
                  <><AlertCircle className="w-4 h-4 text-error-red shrink-0" /><span className="text-xs font-bold text-error-red">Incorrect. Answer: {dailyMCQ.correct_option}</span></>
                )}
              </div>
              <p className="text-xs text-foreground/60 leading-relaxed">{dailyMCQ.explanation}</p>
            </div>
          )}
        </div>
      )}

      {/* ── 6. Leaderboard Preview ─────────────────────── */}
      <div className="premium-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-amber-500/15 rounded-xl flex items-center justify-center">
              <Trophy className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-xs font-bold text-foreground">Top Rankers</p>
          </div>
          <Link href="/leaderboard" className="text-[10px] text-accent font-bold uppercase tracking-wide flex items-center gap-0.5">
            See All <ChevronRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="space-y-2.5">
          {leaderboard.map((entry, idx) => (
            <div key={entry.id} className={`flex items-center gap-3 p-3 rounded-2xl border ${idx === 0 ? 'bg-amber-500/8 border-amber-500/20' : 'bg-foreground/3 border-foreground/8'}`}>
              <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold font-mono shrink-0 ${
                idx === 0 ? 'bg-amber-500/20 text-amber-400' :
                idx === 1 ? 'bg-slate-400/20 text-slate-300' :
                'bg-amber-800/20 text-amber-700'
              }`}>
                {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}
              </span>
              <span className="flex-1 text-xs font-medium text-foreground truncate">{entry.name}</span>
              <span className="text-xs font-bold font-mono text-accent shrink-0">{entry.total_points} XP</span>
            </div>
          ))}
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
