'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/supabase';
import { Book, Chapter, UserProfile, UserProgress } from '@/types';
import { 
  ArrowLeft, 
  Search, 
  Lock, 
  Play, 
  CheckCircle2, 
  Clock, 
  Award,
  MoreVertical,
  PlayCircle
} from 'lucide-react';

interface BookPageProps {
  params: Promise<{ bookId: string }>;
}

export default function BookDetailsPage({ params }: BookPageProps) {
  const router = useRouter();
  const { bookId: initialBookId } = use(params);
  
  // Dynamic State for active book selection
  const [activeBookId, setActiveBookId] = useState<string>(initialBookId);
  const [activeBook, setActiveBook] = useState<Book | null>(null);
  
  const [booksInSubject, setBooksInSubject] = useState<Book[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [progressList, setProgressList] = useState<UserProgress[]>([]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Completed' | 'Incomplete'>('All');
  const [loading, setLoading] = useState(true);
  const [hoveredTrackId, setHoveredTrackId] = useState<string | null>(null);

  // 1. Initial Load: Load profile, all books in subject, and progress list
  useEffect(() => {
    async function loadInitialData() {
      try {
        const initialBook = await db.getBook(initialBookId);
        if (!initialBook) {
          setLoading(false);
          return;
        }

        const prof = await db.getUserProfile();
        setProfile(prof);

        // Fetch all books belonging to the same subject category
        const allBooks = await db.getBooks();
        const subjectBooks = allBooks.filter(b => b.subject === initialBook.subject);
        setBooksInSubject(subjectBooks);

        // Load progress
        if (typeof window !== 'undefined') {
          const list = JSON.parse(localStorage.getItem('prepai_user_progress') || '[]');
          setProgressList(list);
        }
      } catch (err) {
        console.error('Error loading initial page data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadInitialData();
  }, [initialBookId]);

  // 2. Dynamic loading: whenever activeBookId changes, update activeBook and fetch its chapters
  useEffect(() => {
    async function loadActiveBookChapters() {
      const selectedBook = booksInSubject.find(b => b.id === activeBookId) || await db.getBook(activeBookId);
      if (selectedBook) {
        setActiveBook(selectedBook);
        const chs = await db.getChapters(activeBookId);
        chs.sort((a, b) => a.chapter_number - b.chapter_number);
        setChapters(chs);
      }
    }
    if (activeBookId) {
      loadActiveBookChapters();
    }
  }, [activeBookId, booksInSubject]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-12 h-12 border-4 border-[#10B981] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-foreground/45 font-medium font-mono">Loading subject materials...</p>
      </div>
    );
  }

  // Fallback if activeBook isn't loaded yet
  const displayBook = activeBook || booksInSubject.find(b => b.id === initialBookId);
  if (!displayBook) {
    return (
      <div className="text-center py-24 space-y-6">
        <p className="text-foreground/50 text-sm">Subject material not found.</p>
        <Link href="/dashboard" className="text-[#10B981] hover:underline inline-flex items-center space-x-1 text-xs font-bold">
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Dashboard</span>
        </Link>
      </div>
    );
  }

  // Filter chapters list based on search and completion chips
  const filteredChapters = chapters.filter(ch => {
    const matchesSearch = ch.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          ch.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const progObj = progressList.find(p => p.chapter_id === ch.id);
    const isCompleted = progObj?.is_completed || false;
    
    let matchesStatus = true;
    if (statusFilter === 'Completed') matchesStatus = isCompleted;
    else if (statusFilter === 'Incomplete') matchesStatus = !isCompleted;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8 font-sans pb-16 relative">
      {/* Background atmospheric glowing overlay */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#10B981]/5 rounded-full blur-[100px] pointer-events-none" />

      {/* --- Top Navigation Header --- */}
      <div className="flex items-center justify-between">
        <Link 
          href="/dashboard" 
          className="inline-flex items-center gap-2 text-xs font-bold text-foreground/60 hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Library</span>
        </Link>
        <span className="text-[10px] uppercase font-bold text-[#10B981] tracking-widest font-mono">
          {displayBook.subject} ARCHIVE
        </span>
      </div>

      {/* --- Mood / Status Filter Chips --- */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {(['All', 'Completed', 'Incomplete'] as const).map(filter => (
          <button
            key={filter}
            onClick={() => setStatusFilter(filter)}
            className={`shrink-0 px-4 py-2 rounded-full text-xs font-semibold transition-all border ${
              statusFilter === filter
                ? 'bg-[#10B981] border-[#10B981] text-slate-950 font-bold shadow-md'
                : 'bg-white/5 border-white/10 text-foreground/80 hover:bg-white/10'
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* ========================================================
          1. TOP HORIZONTAL SHELF: "book and book titled author"
         ======================================================== */}
      <div className="space-y-4">
        <div>
          <p className="text-[9px] font-bold text-foreground/45 uppercase tracking-widest font-mono">
            {displayBook.subject} PLAYLISTS
          </p>
          <h2 className="text-lg font-extrabold text-white font-display tracking-tight mt-0.5">
            Select Book to view Chapters
          </h2>
        </div>

        <div className="flex gap-5 overflow-x-auto pb-2 no-scrollbar -mx-1 px-1">
          {booksInSubject.map(b => {
            const isActive = b.id === activeBookId;
            return (
              <div
                key={b.id}
                onClick={() => {
                  setActiveBookId(b.id);
                  // Update route without full reload
                  window.history.pushState(null, '', `/books/${b.id}`);
                }}
                className="shrink-0 w-36 md:w-40 flex flex-col space-y-2.5 cursor-pointer group"
              >
                {/* Book cover art wrapper */}
                <div 
                  className={`relative aspect-square w-full rounded-2xl overflow-hidden bg-slate-900 transition-all duration-300 ${
                    isActive 
                      ? 'border-2 border-[#10B981] shadow-lg shadow-[#10B981]/15 scale-102' 
                      : 'border border-white/5 shadow-md hover:border-white/20'
                  }`}
                >
                  <img
                    src={b.cover_image}
                    alt={b.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-103"
                    onError={(e) => { (e.target as any).src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400'; }}
                  />
                  {isActive && (
                    <div className="absolute top-2.5 right-2.5 bg-[#10B981] text-slate-950 text-[8px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Selected
                    </div>
                  )}
                </div>
                
                {/* Title & Author */}
                <div className="space-y-0.5 px-0.5">
                  <h4 className={`text-xs font-bold leading-tight truncate transition-colors ${
                    isActive ? 'text-[#10B981]' : 'text-white group-hover:text-[#10B981]'
                  }`}>
                    {b.title}
                  </h4>
                  <p className="text-[10px] text-foreground/50 leading-normal truncate font-medium">
                    By {b.author}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <hr className="border-white/5" />

      {/* ========================================================
          2. MIDDLE SECTION: "chapter list with play button" / "Quick picks"
         ======================================================== */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[9px] font-bold text-foreground/45 uppercase tracking-widest font-mono">
              QUICK PICKS • {displayBook.title}
            </p>
            <h2 className="text-lg font-extrabold text-white font-display tracking-tight mt-0.5">
              Chapter Tracks
            </h2>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Search Input bar */}
            <div className="relative w-40 sm:w-52">
              <Search className="absolute left-3 top-3 w-3 h-3 text-foreground/40" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tracks..."
                className="w-full bg-white/5 border border-white/10 focus:border-[#10B981] text-[10px] rounded-full pl-8 pr-3 py-2 outline-none transition-all placeholder:text-foreground/30"
              />
            </div>
            
            <button 
              onClick={() => {
                if (filteredChapters.length > 0) {
                  router.push(`/lesson/${filteredChapters[0].id}`);
                }
              }}
              className="text-[10px] border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 text-white font-bold px-4 py-2 rounded-full transition active:scale-95 shrink-0"
            >
              Play all
            </button>
          </div>
        </div>

        {filteredChapters.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-white/5 rounded-3xl bg-slate-950/20">
            <p className="text-xs text-foreground/35">No tracks available for this selection.</p>
          </div>
        ) : (
          /* YT Music styled grid layout of track rows. Displays active book cover thumbnail for all tracks. */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
            {filteredChapters.map(ch => {
              const progObj = progressList.find(p => p.chapter_id === ch.id);
              const isCompleted = progObj?.is_completed || false;
              const hasAccess = ch.is_free || profile?.is_premium;
              const isHovered = hoveredTrackId === ch.id;

              return (
                <div 
                  key={ch.id}
                  className={`flex items-center justify-between p-2.5 rounded-xl hover:bg-white/5 transition duration-150 group cursor-pointer ${
                    !hasAccess ? 'opacity-65' : ''
                  }`}
                  onMouseEnter={() => setHoveredTrackId(ch.id)}
                  onMouseLeave={() => setHoveredTrackId(null)}
                  onClick={() => {
                    if (hasAccess) {
                      router.push(`/lesson/${ch.id}`);
                    } else {
                      router.push('/profile');
                    }
                  }}
                >
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    {/* Chapter Thumbnail Image (Using the active book's cover art) */}
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-slate-900 border border-white/5 shrink-0 shadow-md">
                      <img 
                        src={displayBook.cover_image} 
                        alt={ch.title}
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.target as any).src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100'; }}
                      />
                      {/* Play or Lock overlay icon */}
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        {hasAccess ? (
                          <Play className="w-3.5 h-3.5 text-[#10B981] fill-current" />
                        ) : (
                          <Lock className="w-3.5 h-3.5 text-indigo-400" />
                        )}
                      </div>
                    </div>

                    {/* Metadata details */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="text-xs font-bold text-white leading-snug truncate group-hover:text-[#10B981] transition-colors">
                          {ch.title}
                        </h4>
                        {isCompleted && (
                          <CheckCircle2 className="w-3 h-3 text-emerald-400 fill-emerald-500/10 shrink-0" />
                        )}
                      </div>
                      
                      <p className="text-[10px] text-foreground/50 leading-normal mt-0.5 truncate font-medium">
                        {displayBook.title} • By {displayBook.author} • {Math.round(ch.duration_seconds / 60)} Mins play
                      </p>
                    </div>
                  </div>

                  {/* Play count / Status badge / Option trigger */}
                  <div className="flex items-center gap-3 shrink-0 pl-3">
                    <span className="text-[9px] font-bold font-mono text-foreground/35">
                      {ch.is_free ? (
                        <span className="text-[#10B981] bg-[#10B981]/10 px-1.5 py-0.5 rounded">FREE</span>
                      ) : (
                        <span className="text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded">GOLD</span>
                      )}
                    </span>

                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        if (hasAccess) {
                          router.push(`/lesson/${ch.id}`);
                        } else {
                          router.push('/profile');
                        }
                      }}
                      className="p-1.5 text-foreground/45 hover:text-foreground hover:bg-white/5 rounded-full transition"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
