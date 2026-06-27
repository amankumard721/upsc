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
  PlayCircle, 
  CheckCircle2, 
  Clock, 
  Sparkles,
  Award
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
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-white/50 font-light">Loading UPSC study material...</p>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="text-center py-16 space-y-4">
        <p className="text-white/60">Book not found in PrepAI database.</p>
        <Link href="/dashboard" className="text-accent underline inline-flex items-center space-x-1">
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
    <div className="space-y-8 font-sans">
      {/* Back button */}
      <div>
        <Link href="/dashboard" className="text-sm text-white/60 hover:text-accent inline-flex items-center space-x-1.5 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>
      </div>

      {/* Book details card */}
      <div className="premium-card p-6 md:p-8 bg-slate-900/40 flex flex-col md:flex-row gap-8 items-center md:items-start relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-accent/5 rounded-full blur-[50px] pointer-events-none" />
        
        <img 
          src={book.cover_image} 
          alt={book.title} 
          className="w-36 h-48 md:w-44 md:h-56 rounded-xl object-cover bg-slate-800 shadow-xl border border-white/10 flex-shrink-0"
        />

        <div className="flex-1 text-center md:text-left space-y-4">
          <div>
            <span className="text-xs bg-accent/15 text-accent border border-accent/25 px-2.5 py-0.5 rounded-full font-semibold uppercase tracking-wider font-mono">
              {book.subject}
            </span>
            <h1 className="font-display text-2xl md:text-4xl font-extrabold text-white mt-3 leading-tight">{book.title}</h1>
            <p className="text-white/60 text-sm mt-1 font-light">Author: <span className="text-white font-medium">{book.author}</span></p>
          </div>

          <div className="flex flex-wrap justify-center md:justify-start gap-4 text-xs font-mono">
            <div className="bg-white/5 px-3 py-1.5 rounded-xl border border-white/5">
              <span className="text-white/50 mr-1.5">Chapters:</span>
              <span className="text-white font-bold">{chapters.length}</span>
            </div>
            <div className="bg-white/5 px-3 py-1.5 rounded-xl border border-white/5">
              <span className="text-white/50 mr-1.5">Free Access:</span>
              <span className="text-white font-bold">{chapters.filter(c => c.is_free).length}</span>
            </div>
            <div className="bg-white/5 px-3 py-1.5 rounded-xl border border-white/5">
              <span className="text-white/50 mr-1.5">Progress:</span>
              <span className="text-white font-bold">
                {progressList.filter(p => chapters.some(c => c.id === p.chapter_id) && p.is_completed).length} / {chapters.length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-white/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search chapters by keyword..."
            className="w-full bg-slate-950 border border-white/10 focus:border-accent text-sm rounded-2xl pl-11 pr-4 py-3 outline-none transition-all placeholder:text-white/30"
          />
        </div>

        {/* Completion status Filter */}
        <div className="flex items-center space-x-2">
          {(['All', 'Completed', 'Incomplete'] as const).map(filter => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={`text-xs px-3.5 py-2 rounded-xl transition-all border ${
                statusFilter === filter
                  ? 'bg-accent border-accent text-slate-950 font-semibold shadow-sm'
                  : 'bg-slate-900/40 border-white/10 text-white/70 hover:border-white/20'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Chapter List */}
      <div className="space-y-4">
        {filteredChapters.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-white/10 rounded-2xl bg-white/[0.01]">
            <p className="text-xs text-white/40">No chapters match your search filter criteria.</p>
          </div>
        ) : (
          filteredChapters.map(ch => {
            const progObj = progressList.find(p => p.chapter_id === ch.id);
            const isCompleted = progObj?.is_completed || false;
            
            // Check access: user has access if chapter is free OR user has premium active
            const hasAccess = ch.is_free || profile?.is_premium;

            return (
              <div 
                key={ch.id} 
                className={`premium-card p-5 bg-slate-900/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all ${
                  !hasAccess ? 'opacity-75 hover:border-white/10 hover:shadow-none' : ''
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex flex-col items-center justify-center text-accent font-mono flex-shrink-0">
                    <span className="text-[10px] uppercase font-bold leading-none text-accent/50">CH</span>
                    <span className="text-sm font-bold mt-0.5 leading-none">{ch.chapter_number}</span>
                  </div>
                  
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-white text-sm leading-snug">{ch.title}</h3>
                      {isCompleted && (
                        <span className="flex items-center text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full font-semibold">
                          <CheckCircle2 className="w-3 h-3 mr-0.5 fill-emerald-500/10" />
                          <span>Done</span>
                        </span>
                      )}
                      {ch.is_free ? (
                        <span className="text-[9px] text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider">
                          Free
                        </span>
                      ) : (
                        <span className="flex items-center text-[9px] text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider">
                          <Award className="w-3 h-3 mr-0.5" />
                          <span>Premium</span>
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-white/50 font-light mt-1 line-clamp-2 leading-relaxed max-w-2xl">{ch.description}</p>
                    
                    <div className="flex items-center space-x-3 text-[10px] text-white/40 font-mono mt-2">
                      <span className="flex items-center">
                        <Clock className="w-3.5 h-3.5 mr-1" />
                        <span>{Math.round(ch.duration_seconds / 60)} Mins</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end w-full sm:w-auto">
                  {hasAccess ? (
                    <Link
                      href={`/lesson/${ch.id}`}
                      className="w-full sm:w-auto bg-accent hover:bg-amber-600 text-slate-950 font-bold text-xs px-4 py-2.5 rounded-xl transition-all flex items-center justify-center space-x-1 shadow-sm"
                    >
                      <PlayCircle className="w-4 h-4 fill-slate-950/20" />
                      <span>Start Lesson</span>
                    </Link>
                  ) : (
                    <Link
                      href="/profile"
                      className="w-full sm:w-auto bg-white/5 border border-white/10 hover:border-accent hover:bg-accent/5 text-white/80 hover:text-accent font-semibold text-xs px-4 py-2.5 rounded-xl transition-all flex items-center justify-center space-x-1.5"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Unlock Gold</span>
                    </Link>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
