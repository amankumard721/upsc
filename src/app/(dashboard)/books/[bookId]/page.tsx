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
  Pause,
  CheckCircle2, 
  Clock, 
  Sparkles,
  Award,
  MoreVertical,
  Share2,
  ListPlus,
  PlayCircle
} from 'lucide-react';

interface BookPageProps {
  params: Promise<{ bookId: string }>;
}

export default function BookDetailsPage({ params }: BookPageProps) {
  const router = useRouter();
  const { bookId } = use(params);
  
  const [book, setBook] = useState<Book | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [progressList, setProgressList] = useState<UserProgress[]>([]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Completed' | 'Incomplete'>('All');
  const [loading, setLoading] = useState(true);

  // Hover states for track index
  const [hoveredTrackId, setHoveredTrackId] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const bookData = await db.getBook(bookId);
        if (!bookData) {
          setLoading(false);
          return;
        }
        setBook(bookData);

        const chs = await db.getChapters(bookId);
        // Sort chapters by chapter number
        chs.sort((a, b) => a.chapter_number - b.chapter_number);
        setChapters(chs);

        const prof = await db.getUserProfile();
        setProfile(prof);

        // Load progress
        if (typeof window !== 'undefined') {
          const list = JSON.parse(localStorage.getItem('prepai_user_progress') || '[]');
          setProgressList(list);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [bookId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-12 h-12 border-4 border-[#10B981] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-foreground/45 font-medium font-mono">Loading playlists & tracks...</p>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="text-center py-24 space-y-6">
        <p className="text-foreground/50 text-sm">Book not found in PrepAI database.</p>
        <Link href="/dashboard" className="text-[#10B981] hover:underline inline-flex items-center space-x-1 text-xs font-bold">
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Dashboard</span>
        </Link>
      </div>
    );
  }

  // Stats calculation
  const completedChaptersCount = progressList.filter(p => chapters.some(c => c.id === p.chapter_id) && p.is_completed).length;
  const progressPercent = chapters.length > 0 ? Math.round((completedChaptersCount / chapters.length) * 100) : 0;

  // Filter logic
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

  const handlePlayFirst = () => {
    if (chapters.length > 0) {
      router.push(`/lesson/${chapters[0].id}`);
    }
  };

  return (
    <div className="space-y-10 font-sans pb-16">
      
      {/* Back navigation & Header label */}
      <div className="flex items-center justify-between">
        <Link 
          href="/dashboard" 
          className="inline-flex items-center gap-2 text-xs font-bold text-foreground/60 hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Library</span>
        </Link>
        <span className="text-[10px] uppercase font-bold text-foreground/45 tracking-widest font-mono">
          PLAYLIST DETAIL
        </span>
      </div>

      {/* ========================================================
          YOUTUBE MUSIC ALBUM HEADER LAYOUT
         ======================================================== */}
      <div className="flex flex-col md:flex-row gap-8 items-start relative">
        {/* Soft atmospheric blurred background glow matching the cover art */}
        <div className="absolute -top-16 -left-16 w-80 h-80 bg-[#10B981]/5 rounded-full blur-[80px] pointer-events-none" />
        
        {/* Cover Art Image Box */}
        <div className="relative w-48 h-64 md:w-56 md:h-76 flex-shrink-0 rounded-2xl overflow-hidden group shadow-[0_15px_35px_rgba(0,0,0,0.5)] border border-white/10 self-center md:self-start">
          <img 
            src={book.cover_image} 
            alt={book.title} 
            className="w-full h-full object-cover transition-transform duration-750 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <button 
              onClick={handlePlayFirst}
              className="bg-[#10B981] text-slate-950 p-4 rounded-full shadow-lg active:scale-90 transition-transform"
            >
              <Play className="w-6 h-6 fill-current" />
            </button>
          </div>
        </div>

        {/* Playlist metadata details */}
        <div className="flex-1 space-y-5 text-center md:text-left">
          <div className="space-y-2">
            <span className="text-[9px] bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/25 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider font-mono">
              {book.subject}
            </span>
            <h1 className="text-2xl md:text-4xl font-extrabold text-white leading-tight font-display tracking-tight mt-2">
              {book.title}
            </h1>
            <p className="text-sm font-semibold text-[#10B981] hover:underline cursor-pointer">
              By {book.author}
            </p>
            <p className="text-xs text-foreground/45 mt-1 font-mono">
              Playlist • {chapters.length} chapters • {Math.round(chapters.reduce((acc, c) => acc + c.duration_seconds, 0) / 60)} mins total
            </p>
          </div>

          <div className="text-xs text-foreground/60 leading-relaxed font-light max-w-xl">
            Syllabus chapter lectures compiled into custom playlists with auto-reader highlights, key summaries, and mock test compilers.
          </div>

          {/* Progress Indicators */}
          <div className="space-y-1.5 max-w-sm mx-auto md:mx-0">
            <div className="flex justify-between text-[10px] font-bold text-foreground/50 font-mono">
              <span>PLAYBACK PROGRESS</span>
              <span>{progressPercent}% ({completedChaptersCount}/{chapters.length} completed)</span>
            </div>
            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
              <div 
                className="h-full bg-gradient-to-r from-[#10B981] to-emerald-500 rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Action buttons (YouTube Music styled buttons) */}
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-2">
            <button 
              onClick={handlePlayFirst}
              className="bg-white text-black hover:bg-white/95 font-bold text-xs px-6 py-3 rounded-full flex items-center gap-2 active:scale-95 transition-all shadow-md"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Listen Now</span>
            </button>
            
            <button 
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                alert("Playlist link copied to clipboard!");
              }}
              className="bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-xs px-5 py-3 rounded-full flex items-center gap-2 active:scale-95 transition-all"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share</span>
            </button>

            <button 
              onClick={() => alert("Added book playlist to your custom dashboard shortcut.")}
              className="bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-xs p-3 rounded-full flex items-center justify-center active:scale-95 transition-all"
              title="Add to Library"
            >
              <ListPlus className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <hr className="border-white/5" />

      {/* ========================================================
          FILTER CHIPS & SEARCH SECTION
         ======================================================== */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Mood/Status Filter pills (YouTube Music mood filters style) */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 sm:pb-0">
          {(['All', 'Completed', 'Incomplete'] as const).map(filter => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={`text-xs px-4 py-2 rounded-full transition-all border font-semibold ${
                statusFilter === filter
                  ? 'bg-[#10B981] border-[#10B981] text-slate-950 font-bold shadow-md'
                  : 'bg-white/5 border-white/10 text-foreground/75 hover:bg-white/10 hover:border-white/20'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        {/* Search Input bar */}
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3.5 top-3.5 w-3.5 h-3.5 text-foreground/45" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tracks..."
            className="w-full bg-white/5 border border-white/10 focus:border-[#10B981] text-xs rounded-full pl-10 pr-4 py-3 outline-none transition-all placeholder:text-foreground/35"
          />
        </div>
      </div>

      {/* ========================================================
          YOUTUBE MUSIC TRACKLIST ROWS
         ======================================================== */}
      <div className="space-y-0.5">
        {filteredChapters.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-white/5 rounded-3xl bg-slate-950/20">
            <p className="text-xs text-foreground/35">No tracks match your search filters.</p>
          </div>
        ) : (
          filteredChapters.map((ch, index) => {
            const progObj = progressList.find(p => p.chapter_id === ch.id);
            const isCompleted = progObj?.is_completed || false;
            const hasAccess = ch.is_free || profile?.is_premium;
            
            // Format index number (e.g. 01, 02)
            const trackIndexStr = (index + 1).toString().padStart(2, '0');
            const isHovered = hoveredTrackId === ch.id;

            return (
              <div 
                key={ch.id} 
                className={`flex items-center justify-between py-3.5 px-4 rounded-xl transition-all duration-150 ${
                  isHovered ? 'bg-white/5' : 'bg-transparent'
                } ${!hasAccess ? 'opacity-65' : ''}`}
                onMouseEnter={() => setHoveredTrackId(ch.id)}
                onMouseLeave={() => setHoveredTrackId(null)}
              >
                {/* Left Section: Index / Play Icon & Track Meta */}
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  
                  {/* Track Index or Play Action Indicator */}
                  <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center text-xs font-mono font-bold text-foreground/40">
                    {isHovered && hasAccess ? (
                      <Link href={`/lesson/${ch.id}`}>
                        <PlayCircle className="w-5 h-5 text-[#10B981] cursor-pointer hover:scale-115 transition-transform" />
                      </Link>
                    ) : isHovered && !hasAccess ? (
                      <Link href="/profile">
                        <Lock className="w-4 h-4 text-indigo-400" />
                      </Link>
                    ) : (
                      <span>{trackIndexStr}</span>
                    )}
                  </div>

                  {/* Title & details row */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-semibold text-white leading-snug truncate">
                        {ch.title}
                      </h4>
                      
                      {/* Completed badge */}
                      {isCompleted && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 fill-emerald-500/10 shrink-0" />
                      )}
                      
                      {/* Premium/Free badge */}
                      {ch.is_free ? (
                        <span className="text-[8px] text-[#10B981] bg-[#10B981]/15 border border-[#10B981]/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                          Free
                        </span>
                      ) : (
                        <span className="text-[8px] text-indigo-400 bg-indigo-500/15 border border-indigo-500/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-0.5">
                          <Award className="w-2.5 h-2.5" />
                          <span>Gold</span>
                        </span>
                      )}
                    </div>
                    
                    {/* Chapter description & duration */}
                    <p className="text-xs text-foreground/50 font-light truncate mt-1 max-w-xl">
                      {ch.description}
                    </p>
                  </div>
                </div>

                {/* Right Section: Time, CTA Button, Options menu */}
                <div className="flex items-center gap-4 shrink-0 pl-4">
                  {/* Track Duration */}
                  <span className="text-[11px] text-foreground/40 font-mono flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{Math.round(ch.duration_seconds / 60)}:00</span>
                  </span>

                  {/* CTA button (Pill or lock) */}
                  <div className="hidden sm:block">
                    {hasAccess ? (
                      <Link
                        href={`/lesson/${ch.id}`}
                        className={`text-[10px] font-bold px-3 py-1.5 rounded-full transition-all ${
                          isHovered 
                            ? 'bg-[#10B981] text-slate-950' 
                            : 'bg-white/5 border border-white/10 text-white/90 hover:bg-white/10'
                        }`}
                      >
                        Listen
                      </Link>
                    ) : (
                      <Link
                        href="/profile"
                        className="text-[10px] font-bold bg-indigo-950/40 border border-indigo-500/35 hover:border-indigo-400 text-indigo-400 px-3 py-1.5 rounded-full transition-all flex items-center gap-1"
                      >
                        <Lock className="w-3 h-3" />
                        <span>Unlock</span>
                      </Link>
                    )}
                  </div>

                  {/* Options Menu button */}
                  <button 
                    onClick={() => {
                      if (hasAccess) {
                        router.push(`/lesson/${ch.id}`);
                      } else {
                        router.push('/profile');
                      }
                    }}
                    className="p-1.5 text-foreground/40 hover:text-foreground hover:bg-white/5 rounded-full transition"
                    title="Actions"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>

              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
