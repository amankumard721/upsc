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
  Share2,
  BookOpen
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
        chs.sort((a, b) => a.chapter_number - b.chapter_number);
        setChapters(chs);

        const prof = await db.getUserProfile();
        setProfile(prof);

        // Load progress list
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
        <p className="text-xs text-foreground/45 font-medium font-mono">Loading book details...</p>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="text-center py-24 space-y-6">
        <p className="text-foreground/50 text-sm">Book not found in PrepAI.</p>
        <Link href="/dashboard" className="text-[#10B981] hover:underline inline-flex items-center space-x-1 text-xs font-bold">
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Dashboard</span>
        </Link>
      </div>
    );
  }

  // Calculate completed chapters count for this book
  const completedChaptersCount = progressList.filter(p => chapters.some(c => c.id === p.chapter_id) && p.is_completed).length;

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
      {/* Background glow matching the branding */}
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
          BOOK DETAIL
        </span>
      </div>

      {/* ========================================================
          1. TOP PORTION: SINGLE BOOK LAYOUT CARD
         ======================================================== */}
      <div className="premium-card p-6 bg-slate-950/40 border border-[#10B981]/15 rounded-3xl relative overflow-hidden shadow-xl">
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#10B981]/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
          {/* Square Book Cover */}
          <div className="relative aspect-square w-28 md:w-32 rounded-2xl overflow-hidden bg-slate-900 border border-white/10 shrink-0 shadow-md">
            <img 
              src={book.cover_image} 
              alt={book.title} 
              className="w-full h-full object-cover"
              onError={(e) => { (e.target as any).src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400'; }}
            />
          </div>

          {/* Book Info Metadata */}
          <div className="flex-1 space-y-3 min-w-0">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[9px] bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/25 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider font-mono">
                  {book.subject}
                </span>
                <span className="text-[9px] bg-white/5 text-foreground/50 border border-white/5 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider font-mono">
                  {chapters.length} Chapters
                </span>
              </div>
              
              <h1 className="text-xl md:text-2xl font-extrabold text-white leading-tight font-display tracking-tight mt-1 truncate">
                {book.title}
              </h1>
              
              <p className="text-xs text-foreground/50 font-medium">
                By <span className="text-[#10B981]">{book.author}</span>
              </p>
            </div>

            {/* Description or details */}
            <p className="text-xs text-foreground/60 leading-relaxed font-light line-clamp-2">
              Syllabus lectures compiled for custom high-yield exam preparation. Play chapter audio podcasts with highlighted sync and MCQs.
            </p>

            {/* Completion stats */}
            <div className="flex items-center gap-4 text-[10px] font-bold text-foreground/45 font-mono pt-1">
              <span className="flex items-center text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                <span>{completedChaptersCount} / {chapters.length} Completed</span>
              </span>
            </div>
          </div>

          {/* Playlist Quick Action button */}
          {chapters.length > 0 && (
            <button 
              onClick={() => router.push(`/lesson/${chapters[0].id}`)}
              className="w-full md:w-auto bg-[#10B981] hover:bg-emerald-400 text-slate-950 font-bold text-xs px-6 py-3 rounded-full flex items-center justify-center gap-2 active:scale-95 transition shadow-lg shrink-0"
            >
              <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
              <span>Start Playlist</span>
            </button>
          )}
        </div>
      </div>

      {/* ========================================================
          2. FILTER AND SEARCH SECTION
         ======================================================== */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Chips filters */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 sm:pb-0">
          {(['All', 'Completed', 'Incomplete'] as const).map(filter => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={`text-xs px-4 py-2 rounded-full transition-all border font-semibold ${
                statusFilter === filter
                  ? 'bg-[#10B981] border-[#10B981] text-slate-950 font-bold shadow-md shadow-[#10B981]/15'
                  : 'bg-white/5 border-white/10 text-foreground/75 hover:bg-white/10 hover:border-white/20'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        {/* Search Input bar */}
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3.5 top-3.5 w-3.5 h-3.5 text-foreground/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search chapters..."
            className="w-full bg-white/5 border border-white/10 focus:border-[#10B981] text-xs rounded-full pl-10 pr-4 py-3 outline-none transition-all placeholder:text-foreground/30"
          />
        </div>
      </div>

      {/* ========================================================
          3. BOTTOM SECTION: "chapter list with play button" / "Quick picks"
         ======================================================== */}
      <div className="space-y-3">
        {filteredChapters.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-white/5 rounded-3xl bg-slate-950/20">
            <p className="text-xs text-foreground/35">No chapters match your criteria.</p>
          </div>
        ) : (
          /* YT Music styled grid layout of track rows. Displays book cover thumbnail for all tracks. */
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
                    {/* Chapter Thumbnail Image (Using the book's cover art) */}
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-slate-900 border border-white/5 shrink-0 shadow-md">
                      <img 
                        src={book.cover_image} 
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
                        {book.title} • By {book.author} • {Math.round(ch.duration_seconds / 60)} Mins play
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
