'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/supabase';
import { Chapter, Book } from '@/types';
import { useAudio } from '@/contexts/AudioContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play, Pause, SkipBack, SkipForward, ArrowLeft,
  Video, Radio, Expand, Shrink, FileText, CheckCircle,
  ChevronDown, MoreHorizontal, ThumbsUp, ThumbsDown, Share2,
  RotateCcw, RotateCw, Shuffle, Volume2, ListMusic, ListCollapse
} from 'lucide-react';

const BASE_LINE_MS = 4000;

function getYoutubeId(url: string | undefined | null) {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

function formatTime(seconds: number) {
  if (isNaN(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function LessonPlayerPage({ params }: { params: Promise<{ chapterId: string }> }) {
  const router = useRouter();
  const { chapterId } = use(params);
  const audio = useAudio();

  // Local UI state
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<'video' | 'podcast'>('podcast');
  const [isTheater, setIsTheater] = useState(false);
  const [liked, setLiked] = useState<'up' | 'down' | null>(null);
  const [likeCount, setLikeCount] = useState(66);

  // Load data & start track
  useEffect(() => {
    db.getChapter(chapterId).then(ch => {
      if (ch) {
        setChapter(ch);
        db.getBook(ch.book_id).then(b => setBook(b || null));

        // Start track in global audio context (if already same track, resumes)
        audio.startTrack({
          chapterId: ch.id,
          chapterTitle: ch.title,
          chapterNumber: ch.chapter_number,
          bookTitle: '',
          bookCover: '',
          bookAuthor: '',
          contentText: ch.content_text,
          audioUrl: ch.audio_url || undefined,
          videoUrl: ch.video_url || undefined,
        });
      }
      setLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chapterId]);

  // Update track with book info when available
  useEffect(() => {
    if (book && audio.track?.chapterId === chapterId) {
      audio.startTrack({
        ...audio.track,
        bookTitle: book.title,
        bookCover: book.cover_image,
        bookAuthor: book.author,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [book]);

  // Save progress
  useEffect(() => {
    if (typeof window !== 'undefined' && chapter) {
      try {
        const list = JSON.parse(localStorage.getItem('prepai_user_progress') || '[]');
        const existingIdx = list.findIndex((p: any) => p.chapter_id === chapterId);
        
        const isCompleted = audio.ended || (existingIdx !== -1 && list[existingIdx].is_completed);
        
        const newProg = {
          id: existingIdx !== -1 ? list[existingIdx].id : Math.random().toString(36).substr(2, 9),
          user_id: 'default-user',
          chapter_id: chapterId,
          is_completed: isCompleted,
          last_position_seconds: (audio.cursor * BASE_LINE_MS) / 1000,
          score: existingIdx !== -1 ? list[existingIdx].score : 0,
          completed_at: isCompleted ? new Date().toISOString() : (existingIdx !== -1 ? list[existingIdx].completed_at : undefined)
        };

        if (existingIdx !== -1) {
          list[existingIdx] = { ...list[existingIdx], ...newProg };
        } else {
          list.push(newProg);
        }
        localStorage.setItem('prepai_user_progress', JSON.stringify(list));
      } catch (err) {
        console.error("Failed to save progress", err);
      }
    }
  }, [audio.cursor, audio.ended, chapter, chapterId]);

  // Interaction handlers
  const handleLike = (type: 'up' | 'down') => {
    if (liked === type) {
      setLiked(null);
      if (type === 'up') setLikeCount(c => c - 1);
    } else {
      if (liked === 'up') setLikeCount(c => c - 1);
      setLiked(type);
      if (type === 'up') setLikeCount(c => c + 1);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: chapter?.title || 'JTET Sathi Lesson',
        text: `Listen to this narration of ${chapter?.title}`,
        url: window.location.href,
      }).catch(console.error);
    } else {
      alert('Share link copied to clipboard!');
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const handleScrubClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    audio.handleScrub(percentage);
  };

  if (loading || audio.flatLines.length === 0) {
    return (
      <div className="h-full w-full bg-[#060D1A] flex items-center justify-center p-5">
        <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const currentFlatLine = audio.flatLines[audio.cursor] || audio.flatLines[0];
  const prevFlatLine = audio.cursor > 0 ? audio.flatLines[audio.cursor - 1] : null;
  const nextFlatLine = audio.cursor + 1 < audio.flatLines.length ? audio.flatLines[audio.cursor + 1] : null;
  const currentScene = audio.scenes[currentFlatLine.sceneIdx];
  
  const isCustomAudio = !!chapter?.audio_url;
  const currentTotalSeconds = isCustomAudio ? audio.audioDuration : (audio.flatLines.length * BASE_LINE_MS / 1000);
  const currentElapsedSeconds = isCustomAudio ? audio.audioCurrentTime : ((audio.cursor * BASE_LINE_MS + audio.elapsedMsRef.current) / 1000);
  
  const totalDurationStr = formatTime(currentTotalSeconds);
  const elapsedStr = formatTime(currentElapsedSeconds);
  const progressPercent = currentTotalSeconds > 0 ? (currentElapsedSeconds / currentTotalSeconds) * 100 : 0;

  return (
    <div className="h-full w-full bg-[#060D1A] text-foreground font-sans flex flex-col relative overflow-hidden select-none">
      
      {/* --- Blurred Cover Background for Premium Feel --- */}
      {mode === 'podcast' && (
        <div 
          className="absolute inset-0 bg-cover bg-center blur-[60px] scale-110 opacity-30 pointer-events-none transition-all duration-700 z-0"
          style={{ backgroundImage: `url(${book?.cover_image || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800'})` }}
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-[#060D1A]/50 via-[#060D1A]/85 to-[#060D1A] pointer-events-none z-0" />

      {/* --- Header --- */}
      <header className="flex items-center justify-between px-6 pt-4 pb-2 z-10 relative">
        <button onClick={() => router.back()} className="p-2 -ml-2 text-foreground/80 hover:text-foreground transition rounded-full hover:bg-white/5">
          <ChevronDown className="w-6 h-6" />
        </button>
        
        <div className="text-center">
          <p className="text-[10px] font-bold tracking-[0.2em] text-foreground/40 uppercase font-mono mb-0.5">Playing Now</p>
          <span className="text-xs font-semibold text-accent">{book?.title || 'JTET Sathi Academy'}</span>
        </div>
        
        <button className="p-2 -mr-2 text-foreground/80 hover:text-foreground transition rounded-full hover:bg-white/5">
          <MoreHorizontal className="w-6 h-6" />
        </button>
      </header>

      {/* --- Mode switcher --- */}
      <div className="flex justify-center my-2 z-10 relative">
        <div className="flex bg-white/5 border border-white/10 rounded-full p-0.5 shadow-inner">
          <button
            onClick={() => setMode('video')}
            className={`flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold transition-all ${mode === 'video' ? 'bg-accent text-slate-950 shadow-md' : 'text-foreground/50 hover:text-foreground'}`}
          >
            <Video className="w-3 h-3" /> Video
          </button>
          <button
            onClick={() => setMode('podcast')}
            className={`flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold transition-all ${mode === 'podcast' ? 'bg-accent text-slate-950 shadow-md' : 'text-foreground/50 hover:text-foreground'}`}
          >
            <Radio className="w-3 h-3" /> Podcast
          </button>
        </div>
      </div>

      {/* --- Scrollable Content Area --- */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar w-full max-w-xl mx-auto px-6 py-4 flex flex-col justify-center z-10 relative">
        {mode === 'video' ? (
          chapter?.video_url && getYoutubeId(chapter.video_url) ? (
            <div className="w-full my-auto aspect-video rounded-3xl overflow-hidden shadow-2xl border border-white/10 relative flex-shrink-0">
              <iframe
                src={`https://www.youtube.com/embed/${getYoutubeId(chapter.video_url)}?rel=0`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full border-0"
              />
            </div>
          ) : (
            <div className={`w-full my-auto aspect-video rounded-3xl overflow-hidden transition-all duration-700 shadow-2xl border border-white/10 flex flex-col relative flex-shrink-0 ${currentScene.theme}`}>
              <div className="absolute inset-0 opacity-40 mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] animate-zoom" />
              
              <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 z-20">
                <div className={`w-2 h-2 rounded-full bg-accent ${audio.isPlaying ? 'animate-pulse' : ''}`} />
                <span className="text-[9px] font-bold tracking-widest text-foreground uppercase font-mono">AI Teacher</span>
              </div>
              
              <div className="flex-1 flex flex-col items-center justify-center relative z-10 pt-4">
                <div className="text-5xl mb-4 drop-shadow-2xl animate-breathe">{currentScene.icon}</div>
                <div className="relative w-28 h-32 opacity-80 flex flex-col items-center justify-end pb-4">
                  <div className="w-20 h-16 bg-white/20 rounded-t-full border-t border-white/40" />
                  <div className="w-12 h-12 bg-white/20 rounded-full border border-white/40 flex items-center justify-center mb-1">
                    <div className="flex gap-2">
                      <div className="w-1 h-1 bg-white rounded-full" />
                      <div className="w-1 h-1 bg-white rounded-full" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="absolute bottom-0 left-0 right-0 p-4 pt-12 bg-gradient-to-t from-black/90 to-transparent z-20">
                <p className="text-center font-display text-base leading-relaxed">
                  {currentFlatLine.words.map((word, idx) => (
                    <span 
                      key={idx} 
                      className={`inline-block mx-[2px] transition-colors duration-150 ${idx <= audio.wordIdx ? 'text-accent font-bold' : 'text-white/40'}`}
                    >
                      {word}
                    </span>
                  ))}
                </p>
              </div>
            </div>
          )
        ) : (
          /* PODCAST MODE */
          <div className="flex-1 flex flex-col justify-center py-4 my-auto">
            <div className="flex flex-col justify-center text-center space-y-6 my-auto px-4">
              <div className="h-10 overflow-hidden flex items-center justify-center flex-shrink-0">
                {prevFlatLine && (
                  <p className="text-foreground/30 text-sm font-medium line-clamp-1 truncate max-w-md">
                    {prevFlatLine.lineText}
                  </p>
                )}
              </div>

              <div className="min-h-[120px] flex items-center justify-center flex-shrink-0">
                <h2 className="text-xl md:text-2xl font-bold font-sans text-foreground leading-relaxed max-w-lg">
                  {currentFlatLine.words.map((word, idx) => {
                    const isActive = idx <= audio.wordIdx;
                    return (
                      <span 
                        key={idx} 
                        className={`inline-block mx-[3px] transition-all duration-200 py-0.5 px-1 rounded ${
                          isActive 
                            ? 'text-accent font-extrabold bg-accent/10 border-b-2 border-accent shadow-sm' 
                            : 'text-foreground/45 font-medium'
                        }`}
                      >
                        {word}
                      </span>
                    );
                  })}
                </h2>
              </div>

              <div className="h-10 overflow-hidden flex items-center justify-center flex-shrink-0">
                {nextFlatLine && (
                  <p className="text-foreground/20 text-sm font-medium line-clamp-1 truncate max-w-md">
                    {nextFlatLine.lineText}
                  </p>
                )}
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between px-4 mt-6 flex-shrink-0">
              <div className="flex items-center bg-white/5 border border-white/10 rounded-full p-1 shadow-md">
                <button 
                  onClick={() => handleLike('up')}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition ${
                    liked === 'up' 
                      ? 'bg-accent text-slate-950 font-bold' 
                      : 'text-foreground/70 hover:text-foreground'
                  }`}
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                  <span>{likeCount}</span>
                </button>
                <div className="w-[1px] h-4 bg-white/10 mx-1" />
                <button 
                  onClick={() => handleLike('down')}
                  className={`flex items-center p-2 rounded-full transition ${
                    liked === 'down' 
                      ? 'text-accent' 
                      : 'text-foreground/50 hover:text-foreground'
                  }`}
                >
                  <ThumbsDown className="w-3.5 h-3.5" />
                </button>
              </div>

              <button 
                onClick={handleShare}
                className="flex items-center gap-2 bg-white/5 border border-white/10 hover:border-accent hover:text-accent px-5 py-2.5 rounded-full text-xs font-semibold transition shadow-md"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Share</span>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* --- Fixed Bottom Scrubber & Timeline Panel --- */}
      <div className="w-full max-w-xl mx-auto px-6 pb-6 pt-4 z-10 relative border-t border-white/5 space-y-4 bg-[#060D1A]/95 backdrop-blur-md flex-shrink-0">
        
        {/* Track Info Panel */}
        <div className="flex items-center space-x-4 px-2">
          <img 
            src={book?.cover_image || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100'} 
            alt={chapter?.title} 
            className="w-14 h-14 rounded-xl object-cover bg-slate-800 border border-white/10 shadow-lg flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-foreground truncate">{chapter?.title}</h3>
            <p className="text-xs text-foreground/50 truncate font-medium">By {book?.author || 'JTET Sathi Engine'}</p>
          </div>
        </div>

        {/* Timeline and Scrubber */}
        <div className="space-y-2">
          <div 
            onClick={handleScrubClick}
            className="w-full h-1.5 bg-white/10 rounded-full cursor-pointer relative group flex items-center"
          >
            <div 
              className="h-full bg-accent rounded-full relative transition-all duration-100"
              style={{ width: `${Math.max(progressPercent, 1)}%` }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full shadow-md scale-0 group-hover:scale-100 transition-transform duration-150" />
            </div>
          </div>
          
          <div className="flex justify-between items-center text-[10px] font-mono text-foreground/45">
            <span>{elapsedStr}</span>
            <div className="flex items-center gap-1 bg-white/5 border border-white/10 px-2 py-0.5 rounded text-[9px] font-semibold text-accent max-w-[180px] truncate">
              <ListCollapse className="w-3 h-3 text-accent/70 shrink-0" />
              <span className="truncate">{currentScene.title}</span>
            </div>
            <span>-{formatTime(Math.max(currentTotalSeconds - currentElapsedSeconds, 0))}</span>
          </div>
        </div>

        {/* Playback Controls Row */}
        <div className="flex items-center justify-center gap-6 pt-2">
          <button 
            onClick={() => audio.seekBy(-1)} 
            className="p-2 text-foreground/65 hover:text-foreground transition disabled:opacity-30"
            disabled={audio.cursor === 0}
          >
            <SkipBack className="w-5 h-5 fill-current" />
          </button>

          <button 
            onClick={() => audio.handleSkipTime('backward')}
            className="p-2 text-foreground/65 hover:text-foreground transition"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          <button 
            onClick={() => audio.togglePlay()}
            className="w-14 h-14 rounded-full bg-white text-slate-950 flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-transform"
          >
            {audio.isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-1" />}
          </button>

          <button 
            onClick={() => audio.handleSkipTime('forward')}
            className="p-2 text-foreground/65 hover:text-foreground transition"
          >
            <RotateCw className="w-5 h-5" />
          </button>

          <button 
            onClick={() => audio.seekBy(1)}
            className="p-2 text-foreground/65 hover:text-foreground transition disabled:opacity-30"
            disabled={audio.cursor === audio.flatLines.length - 1}
          >
            <SkipForward className="w-5 h-5 fill-current" />
          </button>
        </div>

        {/* Bottom Toolbar Row */}
        <div className="flex items-center justify-between px-4 pt-2 border-t border-white/5">
          <button 
            onClick={() => audio.setPlaybackSpeed(audio.playbackSpeed === 1 ? 1.25 : audio.playbackSpeed === 1.25 ? 1.5 : audio.playbackSpeed === 1.5 ? 2 : 1)}
            className="text-xs font-mono font-bold text-foreground/60 hover:text-accent transition px-2 py-1 rounded hover:bg-white/5"
          >
            {audio.playbackSpeed}x
          </button>

          <button 
            onClick={() => alert("Shuffle is active")}
            className="p-2 text-foreground/60 hover:text-accent transition"
          >
            <Shuffle className="w-4.5 h-4.5" />
          </button>

          <button 
            onClick={handleShare}
            className="p-2 text-foreground/60 hover:text-accent transition"
          >
            <Share2 className="w-4.5 h-4.5" />
          </button>

          <button 
            onClick={() => alert(`Syllabus Structure: ${audio.scenes.map(s => s.title).join(' → ')}`)}
            className="p-2 text-foreground/60 hover:text-accent transition"
            title="Scene Queue"
          >
            <ListMusic className="w-5 h-5" />
          </button>
        </div>

      </div>


    </div>
  );
}
