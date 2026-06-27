'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/supabase';
import { Book, Chapter, MCQ, UserProfile, LeaderboardEntry } from '@/types';
import { 
  BookOpen, 
  Flame, 
  Zap, 
  Play, 
  CheckCircle2, 
  AlertCircle,
  TrendingUp, 
  ChevronRight, 
  Award,
  Sparkles,
  Search,
  Filter
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [dailyMCQ, setDailyMCQ] = useState<MCQ | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [mcqAnswered, setMcqAnswered] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('All');
  
  // Stats
  const [completedChapters, setCompletedChapters] = useState(0);

  useEffect(() => {
    // Fetch profile
    db.getUserProfile().then(setProfile);

    // Fetch books
    db.getBooks().then(setBooks);

    // Fetch leaderboard
    db.getLeaderboard().then(data => setLeaderboard(data.slice(0, 3)));

    // Fetch progress and calculate completed chapters
    // For now, load a static MCQ for the daily challenge (historical background ch1)
    db.getMCQs('polity-ch1').then(mcqs => {
      if (mcqs && mcqs.length > 0) {
        // Use the first MCQ as daily challenge
        setDailyMCQ(mcqs[0]);
      }
    });

    // Load progress list to see completions
    if (typeof window !== 'undefined') {
      const progress = JSON.parse(localStorage.getItem('prepai_user_progress') || '[]');
      const completedCount = progress.filter((p: any) => p.is_completed).length;
      setCompletedChapters(completedCount);
    }
  }, []);

  const handleMCQSubmit = async (option: string) => {
    if (mcqAnswered || !dailyMCQ) return;
    
    setSelectedOption(option);
    setMcqAnswered(true);

    const isCorrect = option === dailyMCQ.correct_option;
    if (isCorrect && profile) {
      const updatedProfile = await db.updateUserProfile({
        total_points: profile.total_points + 25, // +25 XP
        streak: profile.streak === 0 ? 1 : profile.streak // ensure streak is active
      });
      setProfile(updatedProfile);
    }
  };

  const subjects = ['All', 'Polity', 'History', 'Geography', 'Economy'];
  
  const filteredBooks = books.filter(book => {
    const matchesSearch = book.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          book.author.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubject = selectedSubject === 'All' || book.subject === selectedSubject;
    return matchesSearch && matchesSubject;
  });

  return (
    <div className="space-y-8 font-sans">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Columns (Syllabus, Daily Challenge) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Continue Learning Card */}
          <div className="premium-card p-6 bg-slate-900/40 relative">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] text-accent uppercase font-bold tracking-widest font-mono">Last Accessed</span>
                <h3 className="text-lg font-bold text-white mt-1">Chapter 1: Historical Background</h3>
                <p className="text-xs text-white/60 font-light mt-0.5">Indian Polity — M. Laxmikanth</p>
              </div>
              <Link 
                href="/lesson/polity-ch1"
                className="w-12 h-12 bg-accent hover:bg-amber-600 hover:scale-105 rounded-full flex items-center justify-center text-slate-950 shadow-md shadow-accent/20 transition-all"
              >
                <Play className="w-5 h-5 fill-slate-950 ml-0.5" />
              </Link>
            </div>
            <div className="mt-4">
              <div className="flex justify-between text-xs text-white/50 mb-1">
                <span>Course Progress</span>
                <span>35%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div className="bg-accent h-full rounded-full transition-all duration-500" style={{ width: '35%' }} />
              </div>
            </div>
          </div>

          {/* Subjects Syllabus */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <h2 className="font-display text-xl font-bold text-white flex items-center">
                <BookOpen className="w-5 h-5 text-accent mr-2" />
                <span>UPSC Standard Books</span>
              </h2>

              {/* Subject Filters */}
              <div className="flex items-center space-x-2 overflow-x-auto pb-1 max-w-full">
                {subjects.map(sub => (
                  <button
                    key={sub}
                    onClick={() => setSelectedSubject(sub)}
                    className={`text-xs px-3 py-1.5 rounded-full transition-all border ${
                      selectedSubject === sub
                        ? 'bg-accent border-accent text-slate-950 font-semibold shadow-sm'
                        : 'bg-slate-900/40 border-white/10 text-white/70 hover:border-white/20'
                    }`}
                  >
                    {sub}
                  </button>
                ))}
              </div>
            </div>

            {/* Books Search bar */}
            <div className="relative mb-6">
              <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-white/40" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search standard books, authors (e.g. Laxmikanth, Bipin Chandra)..."
                className="w-full bg-slate-950 border border-white/10 focus:border-accent text-sm rounded-2xl pl-11 pr-4 py-3 outline-none transition-all placeholder:text-white/30"
              />
            </div>

            {/* Books Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {filteredBooks.map(book => {
                // Calculate completion rate based on mock database
                // Let's hardcode some percentages for premium feel
                let percent = 0;
                if (book.id === 'polity-laxmikanth') percent = 33;
                
                return (
                  <div key={book.id} className="premium-card overflow-hidden bg-slate-900/30 flex flex-col justify-between h-48">
                    <div className="p-5 flex gap-4">
                      <img 
                        src={book.cover_image} 
                        alt={book.title} 
                        className="w-16 h-20 rounded-lg object-cover bg-slate-800 shadow-md border border-white/10" 
                      />
                      <div>
                        <span className="text-[9px] bg-accent/15 text-accent border border-accent/25 px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider font-mono">
                          {book.subject}
                        </span>
                        <h4 className="font-bold text-white text-sm mt-1.5 line-clamp-2 leading-snug">{book.title}</h4>
                        <p className="text-xs text-white/50 font-light mt-0.5">{book.author}</p>
                      </div>
                    </div>

                    <div className="px-5 pb-5 border-t border-white/5 pt-3.5 flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {/* Custom Radial Progress Ring */}
                        <svg className="w-6 h-6 transform -rotate-90">
                          <circle cx="12" cy="12" r="9" className="stroke-slate-800" strokeWidth="2.5" fill="none" />
                          <circle cx="12" cy="12" r="9" className="stroke-accent" strokeWidth="2.5" fill="none" 
                                  strokeDasharray={56.5} strokeDashoffset={56.5 - (56.5 * percent) / 100} />
                        </svg>
                        <span className="text-xs font-mono font-medium text-white">{percent}%</span>
                      </div>
                      <Link 
                        href={`/books/${book.id}`}
                        className="text-xs text-accent hover:text-white flex items-center font-medium transition-colors"
                      >
                        <span>Study Syllabus</span>
                        <ChevronRight className="w-4 h-4 ml-0.5" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column (Leaderboard, Daily Challenge, Stats Chart) */}
        <div className="space-y-8">
          
          {/* Daily MCQ Challenge */}
          {dailyMCQ && (
            <div className="premium-card p-6 bg-slate-900/40 border-2 border-accent/20 shadow-md relative">
              <div className="absolute top-4 right-4 bg-amber-500/10 text-amber-500 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border border-amber-500/20">
                Daily +25 XP
              </div>
              <h3 className="font-display text-base font-bold text-white mb-3">Daily MCQ Challenge</h3>
              <p className="text-xs text-white/90 leading-relaxed font-light mb-4">{dailyMCQ.question}</p>

              <div className="space-y-2">
                {[
                  { key: 'A', text: dailyMCQ.option_a },
                  { key: 'B', text: dailyMCQ.option_b },
                  { key: 'C', text: dailyMCQ.option_c },
                  { key: 'D', text: dailyMCQ.option_d }
                ].map((opt) => {
                  const isSelected = selectedOption === opt.key;
                  const isCorrect = opt.key === dailyMCQ.correct_option;
                  
                  let optionClass = 'border-white/10 bg-slate-950/40 hover:bg-slate-950/80';
                  if (mcqAnswered) {
                    if (isCorrect) {
                      optionClass = 'border-success-green bg-success-green/10 text-white';
                    } else if (isSelected) {
                      optionClass = 'border-error-red bg-error-red/10 text-white';
                    } else {
                      optionClass = 'border-white/5 opacity-50 bg-slate-950/20';
                    }
                  }

                  return (
                    <button
                      key={opt.key}
                      disabled={mcqAnswered}
                      onClick={() => handleMCQSubmit(opt.key)}
                      className={`w-full text-left p-3 rounded-xl border text-xs transition-all flex items-start gap-2.5 ${optionClass}`}
                    >
                      <span className="font-mono font-bold bg-white/5 px-1.5 py-0.5 rounded border border-white/10 text-[10px] text-accent mt-0.5">
                        {opt.key}
                      </span>
                      <span className="flex-1">{opt.text}</span>
                    </button>
                  );
                })}
              </div>

              {mcqAnswered && (
                <div className="mt-4 p-3 bg-white/5 rounded-xl border border-white/10 text-xs">
                  <div className="flex items-center space-x-1.5 mb-1 text-accent font-bold">
                    {selectedOption === dailyMCQ.correct_option ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-success-green" />
                        <span className="text-success-green">Correct Answer!</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-4 h-4 text-error-red" />
                        <span className="text-error-red">Incorrect. Correct option was {dailyMCQ.correct_option}</span>
                      </>
                    )}
                  </div>
                  <p className="text-white/60 font-light leading-relaxed">{dailyMCQ.explanation}</p>
                </div>
              )}
            </div>
          )}

          {/* Activity Chart (Custom Premium SVG) */}
          <div className="premium-card p-6 bg-slate-900/40">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-sm font-bold text-white flex items-center">
                <TrendingUp className="w-4 h-4 text-accent mr-1.5" />
                <span>Weekly Activity</span>
              </h3>
              <span className="text-[10px] text-white/40 font-mono uppercase">Minutes Studied</span>
            </div>

            {/* Custom SVG Line Chart */}
            <div className="w-full h-32 relative">
              <svg className="w-full h-full" viewBox="0 0 300 100" preserveAspectRatio="none">
                {/* Grid Lines */}
                <line x1="0" y1="20" x2="300" y2="20" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                <line x1="0" y1="50" x2="300" y2="50" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                <line x1="0" y1="80" x2="300" y2="80" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />

                {/* Path Area (Gradient) */}
                <defs>
                  <linearGradient id="chart-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#D89B3C" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#D89B3C" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <path d="M 10 90 L 50 70 L 95 80 L 140 40 L 185 60 L 230 20 L 290 30 L 290 90 Z" fill="url(#chart-grad)" />

                {/* Path Line */}
                <path d="M 10 90 L 50 70 L 95 80 L 140 40 L 185 60 L 230 20 L 290 30" fill="none" stroke="#D89B3C" strokeWidth="2.5" strokeLinecap="round" />

                {/* Dots */}
                {[
                  { cx: 10, cy: 90, val: 10 },
                  { cx: 50, cy: 70, val: 30 },
                  { cx: 95, cy: 80, val: 20 },
                  { cx: 140, cy: 40, val: 60 },
                  { cx: 185, cy: 60, val: 40 },
                  { cx: 230, cy: 20, val: 80 },
                  { cx: 290, cy: 30, val: 70 }
                ].map((dot, i) => (
                  <circle key={i} cx={dot.cx} cy={dot.cy} r="3.5" fill="#FAF6EC" stroke="#1B2A4A" strokeWidth="2" />
                ))}
              </svg>

              {/* X Axis Labels */}
              <div className="flex justify-between text-[9px] text-white/40 mt-1 font-mono uppercase">
                <span>Mon</span>
                <span>Tue</span>
                <span>Wed</span>
                <span>Thu</span>
                <span>Fri</span>
                <span>Sat</span>
                <span>Sun</span>
              </div>
            </div>
          </div>

          {/* Leaderboard Preview */}
          <div className="premium-card p-6 bg-slate-900/40">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-sm font-bold text-white flex items-center">
                <Award className="w-4 h-4 text-accent mr-1.5" />
                <span>Leaderboard</span>
              </h3>
              <Link href="/leaderboard" className="text-[10px] text-accent hover:text-white transition-colors uppercase font-bold flex items-center">
                <span>Full List</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-3">
              {leaderboard.map((entry, idx) => (
                <div key={entry.id} className="flex items-center justify-between p-2.5 rounded-xl border border-white/5 bg-slate-950/20">
                  <div className="flex items-center space-x-3">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center font-mono text-xs font-bold ${
                      idx === 0 ? 'bg-amber-500/20 text-amber-400' :
                      idx === 1 ? 'bg-slate-400/20 text-slate-300' :
                      'bg-amber-800/20 text-amber-600'
                    }`}>
                      {idx + 1}
                    </span>
                    <img src={entry.avatar_url} alt={entry.name} className="w-7 h-7 rounded-full object-cover" />
                    <span className="text-xs font-semibold text-white/90 line-clamp-1">{entry.name}</span>
                  </div>
                  <div className="flex items-center space-x-1 text-xs font-mono font-medium text-accent">
                    <Zap className="w-3 h-3 fill-accent" />
                    <span>{entry.total_points}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
