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
  const [relatedBooks, setRelatedBooks] = useState<Book[]>([]);
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

        // Fetch related books in the same subject
        const booksData = await db.getBooks();
        const related = booksData.filter(b => b.subject === bookData.subject && b.id !== bookData.id);
        setRelatedBooks(related);

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
        <p className="text-xs text-foreground/45 font-medium font-mono">Loading subject materials...</p>
      </div>
    );
  }

  if (!book) {
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

  return (
    <div className="space-y-8 font-sans pb-16 relative">
      {/* Background soft teal glow */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#10B981]/5 rounded-full blur-[100px] pointer-events-none" />

      {/* --- Top Navigation & Page Title --- */}
      <div className="flex items-center justify-between">
        <Link 
          href="/dashboard" 
          className="inline-flex items-center gap-2 text-xs font-bold text-foreground/60 hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Library</span>
        </Link>
        <span className="text-[10px] uppercase font-bold text-[#10B981] tracking-widest font-mono">
          {book.subject} PORTAL
        </span>
      </div>

      {/* --- YouTube Music Style Category / Mood Header --- */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {(['All', 'Completed', 'Incomplete'] as const).map(filter => (
          <button
            key={filter}
            onClick={() => setStatusFilter(filter)}
            className={`shrink-0 px-4 py-2 rounded-full text-xs font-semibold transition-all border ${
              statusFilter === filter
                ? 'bg-[#10B981] border-[#10B981] text-slate-950 font-bold shadow-md shadow-[#10B981]/15'
                : 'bg-white/5 border-white/10 text-foreground/80 hover:bg-white/10'
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* ========================================================
          1. TOP HORIZONTAL SHELF: "BOOK AND BOOK TITLED AUTHOR"
         ======================================================== */}
      <div className="space-y-4">
        <div>
          <p className="text-[9px] font-bold text-foreground/45 uppercase tracking-widest font-mono">
            {book.subject} CATALOG
          </p>
          <h2 className="text-lg font-extrabold text-white font-display tracking-tight">
            Featured Playlists & Books
          </h2>
        </div>

        <div className="flex gap-5 overflow-x-auto pb-2 no-scrollbar -mx-1 px-1">
          {/* Active Book Card (Always first) */}
          <div className="shrink-0 w-36 md:w-40 flex flex-col space-y-2.5">
            <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-slate-900 border-2 border-[#10B981] shadow-lg shadow-[#10B981]/10">
              <img
                src={book.cover_image}
                alt={book.title}
                className="w-full h-full object-cover"
                onError={(e) => { (e.target as any).src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400'; }}
              />
              <div className="absolute top-2.5 right-2.5 bg-[#10B981] text-slate-950 text-[8px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                Active
              </div>
            </div>
            <div className="space-y-0.5 px-0.5">
              <h4 className="text-xs font-bold text-[#10B981] leading-tight truncate">
                {book.title}
              </h4>
              <p className="text-[10px] text-foreground/50 leading-normal truncate font-medium">
                By {book.author}
              </p>
            </div>
          </div>

          {/* Related books in subject */}
          {relatedBooks.map(rel => (
            <Link
              key={rel.id}
              href={`/books/${rel.id}`}
              className="shrink-0 w-36 md:w-40 flex flex-col group space-y-2.5"
            >
              <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-slate-900 border border-white/5 shadow-md hover:border-white/20 transition-all">
                <img
                  src={rel.cover_image}
                  alt={rel.title}
                  className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
                  onError={(e) => { (e.target as any).src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400'; }}
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="bg-[#10B981] p-3 rounded-full text-slate-950 shadow-lg">
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                  </div>
                </div>
              </div>
              <div className="space-y-0.5 px-0.5">
                <h4 className="text-xs font-bold text-white leading-tight truncate group-hover:text-[#10B981] transition-colors">
                  {rel.title}
                </h4>
                <p className="text-[10px] text-foreground/50 leading-normal truncate font-medium">
                  By {rel.author}
                </p>
              </div>
            </Link>
          ))}

          {relatedBooks.length === 0 && (
            <div className="shrink-0 w-36 md:w-40 flex flex-col items-center justify-center border border-dashed border-white/10 rounded-2xl bg-white/[0.01] h-36">
              <span className="text-[9px] text-foreground/35 text-center px-4 font-mono">No other books in this subject.</span>
            </div>
          )}
        </div>
      </div>

      <hr className="border-white/5" />

      {/* ========================================================
          2. MIDDLE SECTION: "QUICK PICKS / CHAPTERS LIST"
         ======================================================== */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[9px] font-bold text-foreground/45 uppercase tracking-widest font-mono">
              CHAPTER LIST WITH PLAY BUTTON
            </p>
            <h2 className="text-lg font-extrabold text-white font-display tracking-tight mt-0.5">
              Quick picks
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {/* Search Input bar */}
            <div className="relative w-44 sm:w-56">
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
            <p className="text-xs text-foreground/35">No tracks match your filter criteria.</p>
          </div>
        ) : (
          /* YT Music styled grid layout of track rows. Displays parent book cover for all tracks. */
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
