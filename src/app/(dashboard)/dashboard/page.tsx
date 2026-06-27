'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { db } from '@/lib/supabase';
import { sfx } from '@/lib/sounds';
import { Book, Chapter, MCQ, UserProfile, LeaderboardEntry } from '@/types';
import {
  Flame, Zap, Play, CheckCircle2, AlertCircle,
  ChevronRight, Award, Sparkles, BookOpen,
  Trophy, Target, Clock, TrendingUp
} from 'lucide-react';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return { text: 'Good Morning', emoji: '🌅' };
  if (h < 17) return { text: 'Good Afternoon', emoji: '☀️' };
  if (h < 21) return { text: 'Good Evening', emoji: '🌆' };
  return { text: 'Study Time', emoji: '🌙' };
}

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
  const [lastChapter, setLastChapter] = useState<Chapter | null>(null);
  const [lastBook, setLastBook] = useState<Book | null>(null);
  const [overallProgress, setOverallProgress] = useState(0);
  const [dbError, setDbError] = useState<string | null>(null);

  const greeting = getGreeting();

  useEffect(() => {
    db.getUserProfile().then(setProfile);

    db.getBooks().then(booksData => {
      setBooks(booksData);
      setLoading(false);
      const total = booksData.reduce((a, b) => a + (b.total_chapters || 0), 0);
      if (total > 0 && typeof window !== 'undefined') {
        const prog = JSON.parse(localStorage.getItem('prepai_user_progress') || '[]');
        setOverallProgress(Math.min(100, Math.round((prog.filter((p: any) => p.is_completed).length / total) * 100)));
      }
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

    if (typeof window !== 'undefined') {
      const lastChId = localStorage.getItem('prepai_last_accessed_chapter_id') || '00000000-0000-0000-0000-000000000002';
      db.getChapter(lastChId).then(ch => {
        if (ch) {
          setLastChapter(ch);
          db.getBook(ch.book_id).then(b => setLastBook(b || null));
        }
      });
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
        <div className="skeleton h-28 w-full rounded-3xl" />
        <div className="flex gap-3">
          {[1,2,3].map(i => <div key={i} className="skeleton h-20 flex-1 rounded-2xl" />)}
        </div>
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

      {/* ── 1. Greeting Header ─────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-[#1e3a6e] to-[#0B1325] p-5 border border-white/8">
        {/* background orb */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-accent/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-indigo-500/8 rounded-full blur-2xl pointer-events-none" />

        <div className="relative">
          <p className="text-xs font-medium text-white/50 uppercase tracking-widest font-mono">
            {greeting.emoji} {greeting.text}
          </p>
          <h1 className="mt-1 text-2xl font-bold text-white font-display leading-tight">
            {profile?.name?.split(' ')[0] || 'Aspirant'} 👋
          </h1>
          <p className="mt-0.5 text-sm text-white/55">
            {overallProgress > 0 ? `${overallProgress}% syllabus covered` : 'Start your UPSC journey today'}
          </p>

          {/* Streak + XP pills */}
          <div className="flex items-center gap-2 mt-4">
            <div className="flex items-center gap-1.5 bg-amber-500/15 border border-amber-500/25 text-amber-400 px-3 py-1.5 rounded-full text-xs font-semibold font-mono">
              <Flame className="w-3.5 h-3.5 fill-amber-400" />
              {profile?.streak ?? 0} Day Streak
            </div>
            <div className="flex items-center gap-1.5 bg-accent/15 border border-accent/25 text-accent px-3 py-1.5 rounded-full text-xs font-semibold font-mono">
              <Zap className="w-3.5 h-3.5 fill-accent" />
              {profile?.total_points ?? 0} XP
            </div>
            {profile?.is_premium && (
              <div className="flex items-center gap-1 bg-indigo-500/15 border border-indigo-500/25 text-indigo-300 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide">
                <Award className="w-3 h-3" /> PRO
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── 2. Quick Stats Row ─────────────────────────── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: BookOpen, label: 'Chapters', value: books.reduce((a,b) => a + (b.total_chapters||0), 0), color: 'text-accent', bg: 'bg-accent/10' },
          { icon: Target, label: 'Completed', value: 0, color: 'text-success-green', bg: 'bg-success-green/10' },
          { icon: Trophy, label: 'Rank', value: '#—', color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
        ].map(({ icon: Icon, label, value, color, bg }) => (
          <div key={label} className="premium-card p-3 flex flex-col items-center gap-1 text-center">
            <div className={`w-8 h-8 ${bg} rounded-xl flex items-center justify-center`}>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <span className={`text-lg font-bold font-mono ${color}`}>{value}</span>
            <span className="text-[10px] text-foreground/50 font-medium uppercase tracking-wide">{label}</span>
          </div>
        ))}
      </div>

      {/* ── 3. Continue Learning Card ──────────────────── */}
      {lastChapter && (
        <div className="premium-card p-5 relative overflow-hidden border-accent/20 border">
          <div className="absolute -top-6 -right-6 w-24 h-24 bg-accent/8 rounded-full blur-2xl" />
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <span className="text-[10px] text-accent uppercase font-bold tracking-widest font-mono">▶ Continue Learning</span>
              <h3 className="mt-1 text-base font-bold text-foreground leading-tight">
                Ch.{lastChapter.chapter_number}: {lastChapter.title}
              </h3>
              <p className="text-xs text-foreground/50 mt-0.5 truncate">
                {lastBook ? `${lastBook.title} · ${lastBook.author}` : 'PrepAI Syllabus'}
              </p>
              {/* Progress bar */}
              <div className="mt-3">
                <div className="flex justify-between text-[10px] text-foreground/40 font-mono mb-1">
                  <span>Overall Progress</span>
                  <span>{overallProgress}%</span>
                </div>
                <div className="h-1.5 bg-foreground/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-accent to-amber-400 rounded-full transition-all duration-700"
                    style={{ width: `${Math.max(overallProgress, 3)}%` }}
                  />
                </div>
              </div>
            </div>
            <Link
              href={`/lesson/${lastChapter.id}`}
              className="shrink-0 w-12 h-12 bg-accent rounded-2xl flex items-center justify-center shadow-lg shadow-accent/30 hover:bg-amber-500 transition-colors"
            >
              <Play className="w-5 h-5 fill-slate-950 text-slate-950 ml-0.5" />
            </Link>
          </div>
        </div>
      )}

      {/* ── 4. Books Section ───────────────────────────── */}
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
