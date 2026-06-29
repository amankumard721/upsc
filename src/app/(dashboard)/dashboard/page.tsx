'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/supabase';
import { Book, Chapter, UserProfile, LeaderboardEntry } from '@/types';
import {
  CheckCircle2, AlertCircle,
  Award, BookOpen, TrendingUp, PlayCircle,
  MoreVertical, Play, Flame, Target
} from 'lucide-react';
import { t } from '@/lib/translations';

export default function DashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [allChapters, setAllChapters] = useState<Chapter[]>([]);
  const [subjectsList, setSubjectsList] = useState<any[]>([]);
  const [selectedSubject, setSelectedSubject] = useState('All');
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);
  const [continueChapter, setContinueChapter] = useState<Chapter | null>(null);
  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [profileData, booksData, leaderboardData, chaptersData, subjectsData] = await Promise.all([
          db.getUserProfile(),
          db.getBooks(),
          db.getLeaderboard(),
          db.getAllChapters(40),
          db.getSubjects()
        ]);
        
        setProfile(profileData);
        setBooks(booksData);
        setLeaderboard(leaderboardData.slice(0, 3));
        setAllChapters(chaptersData);
        
        // Ensure "All" option is added at the beginning if not already present
        const list = subjectsData || [];
        if (!list.some(s => s.name.toLowerCase() === 'all')) {
          setSubjectsList([{ id: 'all', name: 'All', emoji: '📚' }, ...list]);
        } else {
          setSubjectsList(list);
        }

        if (typeof window !== 'undefined') {
          const listProgress = JSON.parse(localStorage.getItem('prepai_user_progress') || '[]');
          const targetProgress = listProgress.find((p: any) => !p.is_completed) || (listProgress.length > 0 ? listProgress[listProgress.length - 1] : null);
          
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
  }, []);

  const filteredBooks = books.filter(b =>
    selectedSubject === 'All' || b.subject.toLowerCase() === selectedSubject.toLowerCase()
  );

  // Filter chapters based on subject (by finding parent book's subject)
  const filteredChapters = allChapters.filter(ch => {
    if (selectedSubject === 'All') return true;
    const parentBook = books.find(b => b.id === ch.book_id);
    return parentBook?.subject.toLowerCase() === selectedSubject.toLowerCase();
  });

  // Chunk chapters into groups of 3 for vertical stacking in horizontal carousel
  const chunkChapters = (items: Chapter[], size: number) => {
    const chunks: Chapter[][] = [];
    for (let i = 0; i < items.length; i += size) {
      chunks.push(items.slice(i, i + size));
    }
    return chunks;
  };
  const chapterChunks = chunkChapters(filteredChapters, 3);

  if (loading) {
    return (
      <div className="space-y-6 px-1 py-8">
        <div className="skeleton h-56 w-full rounded-3xl" />
        <div className="skeleton h-8 w-40 rounded-xl" />
        <div className="flex gap-4 overflow-hidden">
          {[1,2,3].map(i => <div key={i} className="skeleton h-52 w-40 shrink-0 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 relative pb-16 font-sans">
      
      {/* Dynamic teal atmosphere glow */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#10B981]/5 rounded-full blur-[100px] pointer-events-none" />

      {dbError && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-2xl text-error-red text-xs font-mono">
          <p className="font-bold">⚠️ {dbError}</p>
        </div>
      )}

      {/* ── 1. DAILY CHALLENGE BANNER (Test your knowledge) ── */}
      <div className="premium-card p-5 bg-gradient-to-r from-emerald-950/20 via-slate-950/40 to-transparent border-[#10B981]/15 relative overflow-hidden rounded-3xl">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#10B981]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex items-center gap-2 mb-2">
          <Flame className="w-4 h-4 text-[#10B981] animate-pulse" />
          <p className="text-[10px] font-bold text-[#10B981] uppercase tracking-widest font-mono">
            {t('dailyChallenge')} Live
          </p>
        </div>
        <h3 className="text-base md:text-lg font-bold text-white font-display mb-3 max-w-lg leading-snug">
          {continueChapter 
            ? `${t('testKnowledge')} "${continueChapter.title}"`
            : "Review the daily high-yield syllabus podcast playlist."}
        </h3>
        <Link 
          href="/challenge" 
          className="inline-flex items-center text-xs font-bold text-slate-950 bg-[#10B981] hover:bg-emerald-400 px-5 py-2.5 rounded-full shadow-lg transition active:scale-95"
        >
          <Target className="w-3.5 h-3.5 mr-1.5 fill-slate-950/20" /> 
          <span>Start Daily Session</span>
        </Link>
      </div>

      {/* ── 2. RECOMMENDED SHELF ("Learning Material" / Book selector placed directly above list) ── */}
      <div className="space-y-4">
        <div>
          <p className="text-[9px] font-bold text-[#10B981] uppercase tracking-widest font-mono">
            LEARNING MATERIAL
          </p>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-extrabold text-white font-display tracking-tight">
              Learning Material
            </h2>
            <span className="text-xs text-foreground/40 font-mono font-medium">
              {filteredBooks.length} items
            </span>
          </div>

          {/* Dynamic Subject selector chips placed directly above book carousel */}
          {subjectsList.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-3 no-scrollbar scroll-smooth">
              {subjectsList.map(chip => (
                <button
                  key={chip.id}
                  onClick={() => setSelectedSubject(chip.name)}
                  className={`shrink-0 px-3.5 py-1.5 rounded-full text-[11px] font-semibold transition-all border ${
                    selectedSubject.toLowerCase() === chip.name.toLowerCase()
                      ? 'bg-[#10B981] text-slate-950 border-[#10B981] font-bold shadow-md'
                      : 'bg-white/5 border-white/10 text-foreground/80 hover:bg-white/10'
                  }`}
                >
                  <span className="mr-1.5">{chip.emoji}</span>
                  <span>{chip.name === 'All' ? t('all') : chip.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {filteredBooks.length === 0 ? (
          <div className="text-center py-12 bg-white/5 border border-dashed border-white/5 rounded-3xl">
            <p className="text-xs text-foreground/45">No books found in this category.</p>
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar -mx-1 px-1">
            {filteredBooks.map(book => {
              const progress = book.id === '00000000-0000-0000-0000-000000000001' ? 33 : 0;
              return (
                <Link
                  key={book.id}
                  href={`/books/${book.id}`}
                  // Restored original portrait layout (w-36 and h-48 image size, not square)
                  className="shrink-0 w-36 flex flex-col group space-y-2"
                >
                  {/* Portrait Book Cover image */}
                  <div className="relative h-48 w-full rounded-2xl overflow-hidden bg-slate-900 border border-white/5 shadow-md shadow-black/40">
                    <img
                      src={book.cover_image || ''}
                      alt={book.title}
                      className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-700 opacity-95"
                      onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400'; }}
                    />
                    {/* Linear thin progress line inside cover */}
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10 overflow-hidden">
                      <div className="h-full bg-[#10B981] rounded-r" style={{ width: `${Math.max(progress, 2)}%` }} />
                    </div>
                    {/* Play button overlay on hover */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="bg-[#10B981] p-3 rounded-full text-slate-950 shadow-lg scale-90 group-hover:scale-100 transition-transform">
                        <Play className="w-4 h-4 fill-current ml-0.5" />
                      </div>
                    </div>
                  </div>

                  {/* Info text below book */}
                  <div className="space-y-0.5 px-0.5">
                    <h4 className="text-xs font-bold text-white leading-tight truncate group-hover:text-[#10B981] transition-colors">
                      {book.title}
                    </h4>
                    <p className="text-[10px] text-foreground/50 leading-normal truncate font-medium">
                      By {book.author}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* ── 3. QUICK PICKS (3 list series scroll: stacks 3 tracks vertically, swiping horizontally) ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[9px] font-bold text-foreground/45 uppercase tracking-widest font-mono">
              SWIPE TO LISTEN
            </p>
            <h2 className="text-lg font-extrabold text-white font-display tracking-tight mt-0.5">
              Quick picks
            </h2>
          </div>
          <button 
            onClick={() => {
              if (filteredChapters.length > 0) {
                router.push(`/lesson/${filteredChapters[0].id}`);
              }
            }}
            className="text-xs border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 text-white font-bold px-4 py-1.5 rounded-full transition active:scale-95"
          >
            Play all
          </button>
        </div>

        {filteredChapters.length === 0 ? (
          <div className="text-center py-16 bg-white/5 border border-dashed border-white/5 rounded-3xl">
            <p className="text-xs text-foreground/45">No chapters found for this subject.</p>
          </div>
        ) : (
          /* YT Music dynamic track container: stacks exactly 3 chapters vertically, swiping horizontally */
          <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar -mx-1 px-1 snap-x">
            {chapterChunks.map((chunk, chunkIdx) => (
              <div 
                key={chunkIdx} 
                className="flex flex-col gap-3 shrink-0 w-[290px] sm:w-[350px] snap-start"
              >
                {chunk.map(ch => {
                  const parentBook = books.find(b => b.id === ch.book_id);
                  const coverImg = parentBook?.cover_image || '';

                  return (
                    <div 
                      key={ch.id}
                      className="flex items-center justify-between p-2 rounded-xl hover:bg-white/5 transition duration-150 group cursor-pointer"
                      onClick={() => router.push(`/lesson/${ch.id}`)}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        {/* Book Cover Thumbnail image */}
                        <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-slate-900 border border-white/5 shrink-0 shadow-md">
                          <img 
                            src={coverImg} 
                            alt={ch.title}
                            className="w-full h-full object-cover"
                            onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100'; }}
                          />
                          {/* Play icon overlay */}
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Play className="w-3.5 h-3.5 text-[#10B981] fill-current" />
                          </div>
                        </div>

                        {/* Metadata details */}
                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs font-bold text-white leading-snug truncate group-hover:text-[#10B981] transition-colors">
                            {ch.title}
                          </h4>
                          <p className="text-[10px] text-foreground/50 leading-normal mt-0.5 truncate font-medium">
                            {parentBook?.title || 'Study Book'} • By {parentBook?.author || 'PrepAI'} • {Math.round(ch.duration_seconds / 60)} Mins
                          </p>
                        </div>
                      </div>

                      {/* Right side check status / options */}
                      <div className="flex items-center gap-2 shrink-0 pl-3">
                        <span className="text-[9px] font-bold font-mono text-foreground/35 hidden sm:inline">
                          {ch.is_free ? 'FREE' : 'GOLD'}
                        </span>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/lesson/${ch.id}`);
                          }}
                          className="p-1.5 text-foreground/40 hover:text-foreground hover:bg-white/5 rounded-full transition"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── 4. MOCK TEST SERIES ── */}
      <div className="space-y-4">
        <div>
          <p className="text-[9px] font-bold text-foreground/45 uppercase tracking-widest font-mono">
            TEST YOUR CAPACITY
          </p>
          <h2 className="text-lg font-extrabold text-white font-display tracking-tight mt-0.5">
            Mock Test Series
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl border border-white/5 bg-slate-900/30 hover:bg-slate-900/50 transition flex items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <span className="text-[8px] bg-emerald-500/10 text-emerald-400 font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
                Free
              </span>
              <h4 className="text-xs font-bold text-white mt-1.5 truncate">JTET Mock Paper I</h4>
              <p className="text-[10px] text-foreground/45 mt-0.5 font-mono">150 Questions • 150 Mins</p>
            </div>
            <Link 
              href="/test-series/mock-1"
              className="bg-[#10B981] hover:bg-emerald-400 text-slate-950 text-[10px] font-extrabold px-4 py-2 rounded-full shrink-0 transition active:scale-95 shadow animate-pulse"
            >
              Start
            </Link>
          </div>

          <div className="p-4 rounded-2xl border border-white/5 bg-slate-900/30 hover:bg-slate-900/50 transition flex items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <span className="text-[8px] bg-indigo-500/10 text-indigo-400 font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
                Gold
              </span>
              <h4 className="text-xs font-bold text-white mt-1.5 truncate">JTET Mock Paper II</h4>
              <p className="text-[10px] text-foreground/45 mt-0.5 font-mono">150 Questions • 150 Mins</p>
            </div>
            <Link 
              href="/test-series/mock-2"
              className="bg-white/5 border border-white/10 hover:border-white/20 text-white text-[10px] font-extrabold px-4 py-2 rounded-full shrink-0 transition active:scale-95"
            >
              Start
            </Link>
          </div>

          <div className="p-4 rounded-2xl border border-white/5 bg-slate-900/30 hover:bg-slate-900/50 transition flex items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <span className="text-[8px] bg-emerald-500/10 text-emerald-400 font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
                Free
              </span>
              <h4 className="text-xs font-bold text-white mt-1.5 truncate">Daily Sectional Test</h4>
              <p className="text-[10px] text-foreground/45 mt-0.5 font-mono">20 Questions • 20 Mins</p>
            </div>
            <Link 
              href="/test-series/mock-1"
              className="bg-white/5 border border-white/10 hover:border-white/20 text-white text-[10px] font-extrabold px-4 py-2 rounded-full shrink-0 transition active:scale-95"
            >
              Start
            </Link>
          </div>
        </div>
      </div>

      {/* ── 5. WEEKLY ANALYTICS CHART ── */}
      <div className="premium-card p-5 bg-slate-950/40 border border-white/5 rounded-3xl">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 bg-[#10B981]/15 rounded-xl flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-[#10B981]" />
          </div>
          <div>
            <p className="text-xs font-bold text-white">Syllabus Listening Activity</p>
            <p className="text-[9px] text-foreground/40 font-mono uppercase">Minutes studied per day</p>
          </div>
        </div>

        <div className="w-full h-20 relative">
          <svg className="w-full h-full" viewBox="0 0 300 80" preserveAspectRatio="none">
            <defs>
              <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10B981" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d="M0 70 L43 55 L86 63 L129 30 L172 47 L215 12 L258 22 L300 18 L300 80 L0 80Z" fill="url(#grad)" />
            <path d="M0 70 L43 55 L86 63 L129 30 L172 47 L215 12 L258 22 L300 18" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div className="flex justify-between text-[9px] text-foreground/35 font-mono uppercase mt-2 px-1">
          {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => <span key={d}>{d}</span>)}
        </div>
      </div>

    </div>
  );
}
