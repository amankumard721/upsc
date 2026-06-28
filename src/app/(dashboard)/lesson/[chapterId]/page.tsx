'use client';

import React, { useEffect, useState, useRef, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/supabase';
import { Chapter, Book } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play, Pause, SkipBack, SkipForward, ArrowLeft,
  Video, Radio, Expand, Shrink, FileText, CheckCircle,
  ChevronDown, MoreHorizontal, ThumbsUp, ThumbsDown, Share2,
  RotateCcw, RotateCw, Shuffle, Volume2, ListMusic, ListCollapse
} from 'lucide-react';

// --- Types ---
interface Scene {
  title: string;
  icon: string;
  theme: string;
  lines: string[];
}

interface Lesson {
  title: string;
  scenes: Scene[];
}

interface FlatLine {
  sceneIdx: number;
  lineText: string;
  words: string[];
}

function getYoutubeId(url: string | undefined | null) {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

// --- Mock Data Generator ---
function generateMockLesson(chapter: Chapter): Lesson {
  const defaultScenes: Scene[] = [
    { title: "Introduction", icon: "📖", theme: "bg-indigo-900", lines: ["Welcome to this lesson.", "Today we are going to explore some fascinating concepts.", "Let's dive right in."] },
    { title: "Core Concepts", icon: "🧠", theme: "bg-emerald-900", lines: ["The primary idea revolves around foundational principles.", "Understanding these is crucial for mastery.", "Take your time to absorb the details."] },
    { title: "Summary", icon: "✨", theme: "bg-amber-900", lines: ["We have covered a lot of ground today.", "Review the notes if you need a refresher.", "Great job completing the lesson!"] }
  ];

  if (chapter.content_text && chapter.content_text.length > 50) {
    const rawSentences = chapter.content_text.match(/[^.!?]+[.!?]+(\s|$)/g)?.map(s => s.trim()).filter(Boolean) || [chapter.content_text];
    const chunk = Math.ceil(rawSentences.length / 3);
    return {
      title: chapter.title,
      scenes: [
        { title: "Introduction", icon: "📖", theme: "bg-indigo-950", lines: rawSentences.slice(0, chunk).length ? rawSentences.slice(0, chunk) : ["Welcome to this chapter."] },
        { title: "Deep Dive", icon: "⚖️", theme: "bg-slate-900", lines: rawSentences.slice(chunk, chunk * 2).length ? rawSentences.slice(chunk, chunk * 2) : ["Let's explore further."] },
        { title: "Conclusion", icon: "✨", theme: "bg-stone-900", lines: rawSentences.slice(chunk * 2).length ? rawSentences.slice(chunk * 2) : ["That concludes our topic."] }
      ].filter(s => s.lines.length > 0)
    };
  }

  return { title: chapter.title, scenes: defaultScenes };
}

const BASE_LINE_MS = 4000; // 4 seconds per line at 1x speed

export default function LessonPlayerPage({ params }: { params: Promise<{ chapterId: string }> }) {
  const router = useRouter();
  const { chapterId } = use(params);

  // Data
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [book, setBook] = useState<Book | null>(null);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [flatLines, setFlatLines] = useState<FlatLine[]>([]);
  const [loading, setLoading] = useState(true);

  // Playback State
  const [mode, setMode] = useState<'video' | 'podcast'>('podcast'); // default to podcast to match playing now
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [cursor, setCursor] = useState(0);       // Index into flatLines
  const [wordIdx, setWordIdx] = useState(0);     // Index into current line's words
  const [ended, setEnded] = useState(false);
  const [isTheater, setIsTheater] = useState(false);

  const [audioCurrentTime, setAudioCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);

  // Interaction State
  const [liked, setLiked] = useState<'up' | 'down' | null>(null);
  const [likeCount, setLikeCount] = useState(66);

  // Refs for timer and speech
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null);
  const lastTimeRef = useRef<number>(0);
  const elapsedMsRef = useRef<number>(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Load Data
  useEffect(() => {
    db.getChapter(chapterId).then(ch => {
      if (ch) {
        setChapter(ch);
        const l = generateMockLesson(ch);
        setLesson(l);
        
        // Fetch book cover
        db.getBook(ch.book_id).then(b => setBook(b || null));

        // Flatten scenes
        const flat: FlatLine[] = [];
        l.scenes.forEach((scene, sIdx) => {
          scene.lines.forEach(line => {
            flat.push({
              sceneIdx: sIdx,
              lineText: line,
              words: line.split(' ')
            });
          });
        });
        setFlatLines(flat);
      }
      setLoading(false);
    });

    return () => {
      if (typeof window !== 'undefined') window.speechSynthesis.cancel();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [chapterId]);

  // Playback Engine
  useEffect(() => {
    if (!isPlaying || ended || flatLines.length === 0) {
      if (timerRef.current) clearInterval(timerRef.current);
      if (typeof window !== 'undefined') window.speechSynthesis.cancel();
      if (audioRef.current) audioRef.current.pause();
      return;
    }

    const currentLine = flatLines[cursor];
    const totalLineMs = BASE_LINE_MS / playbackSpeed;
    const wordIntervalMs = Math.max(totalLineMs / currentLine.words.length, 100);

    if (chapter?.audio_url) {
      if (audioRef.current && audioRef.current.paused) {
        audioRef.current.play().catch(console.error);
      }
      
      lastTimeRef.current = performance.now();
      timerRef.current = setInterval(() => {
        const now = performance.now();
        const delta = now - lastTimeRef.current;
        lastTimeRef.current = now;
        elapsedMsRef.current += delta;

        // Roughly match word tracking
        const expectedWord = Math.floor(elapsedMsRef.current / wordIntervalMs);
        setWordIdx(Math.min(expectedWord, currentLine.words.length - 1));

        if (elapsedMsRef.current >= totalLineMs) {
          elapsedMsRef.current = 0;
          setWordIdx(0);
          if (cursor + 1 < flatLines.length) {
            setCursor(c => c + 1);
          } else {
            setEnded(true);
            setIsPlaying(false);
          }
        }
      }, 50);

    } else {
      if (elapsedMsRef.current === 0 && typeof window !== 'undefined') {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(currentLine.lineText);
        utterance.rate = playbackSpeed * 1.1; 
        const voices = window.speechSynthesis.getVoices();
        const preferred = voices.find(v => v.lang.startsWith('en-IN') || v.name.includes('Google') || v.lang.startsWith('hi-IN'));
        if (preferred) utterance.voice = preferred;
        synthRef.current = utterance;
        window.speechSynthesis.speak(utterance);
      }

      lastTimeRef.current = performance.now();
      
      timerRef.current = setInterval(() => {
        const now = performance.now();
        const delta = now - lastTimeRef.current;
        lastTimeRef.current = now;
        elapsedMsRef.current += delta;

        if (elapsedMsRef.current >= totalLineMs) {
          elapsedMsRef.current = 0;
          setWordIdx(0);
          if (cursor + 1 >= flatLines.length) {
            setIsPlaying(false);
            setEnded(true);
          } else {
            setCursor(c => c + 1);
          }
        } else {
          const expectedWord = Math.floor(elapsedMsRef.current / wordIntervalMs);
          setWordIdx(Math.min(expectedWord, currentLine.words.length - 1));
        }
      }, 50);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, cursor, playbackSpeed, ended, flatLines, chapter]);

  // Save Progress
  useEffect(() => {
    if (typeof window !== 'undefined' && chapter) {
      try {
        const list = JSON.parse(localStorage.getItem('prepai_user_progress') || '[]');
        const existingIdx = list.findIndex((p: any) => p.chapter_id === chapterId);
        
        const isCompleted = ended || (existingIdx !== -1 && list[existingIdx].is_completed);
        
        const newProg = {
          id: existingIdx !== -1 ? list[existingIdx].id : Math.random().toString(36).substr(2, 9),
          user_id: 'default-user',
          chapter_id: chapterId,
          is_completed: isCompleted,
          last_position_seconds: (cursor * BASE_LINE_MS) / 1000,
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
  }, [cursor, ended, chapter, chapterId]);

  // Controls
  const togglePlay = () => {
    if (ended) {
      setCursor(0);
      setWordIdx(0);
      elapsedMsRef.current = 0;
      setEnded(false);
    }
    setIsPlaying(!isPlaying);
  };

  const seekBy = (linesDelta: number) => {
    let newCursor = cursor + linesDelta;
    if (newCursor < 0) newCursor = 0;
    if (newCursor >= flatLines.length) {
      newCursor = flatLines.length - 1;
      setEnded(true);
      setIsPlaying(false);
    } else {
      setEnded(false);
    }
    setCursor(newCursor);
    setWordIdx(0);
    elapsedMsRef.current = 0;
    if (typeof window !== 'undefined') window.speechSynthesis.cancel();
  };

  const jumpToScene = (sceneIdx: number) => {
    const idx = flatLines.findIndex(f => f.sceneIdx === sceneIdx);
    if (idx !== -1) {
      setCursor(idx);
      setWordIdx(0);
      elapsedMsRef.current = 0;
      setEnded(false);
      setIsPlaying(true);
    }
  };

  const handleScrub = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    
    if (chapter?.audio_url && audioRef.current) {
      const newTime = percentage * audioDuration;
      audioRef.current.currentTime = newTime;
      setAudioCurrentTime(newTime);
      
      const totalLines = flatLines.length;
      const newCursor = Math.min(Math.floor(percentage * totalLines), totalLines - 1);
      setCursor(newCursor);
      setWordIdx(0);
    } else {
      const totalLines = flatLines.length;
      const newCursor = Math.min(Math.floor(percentage * totalLines), totalLines - 1);
      setCursor(newCursor);
      setWordIdx(0);
      elapsedMsRef.current = 0;
    }
  };

  const handleSkipTime = (direction: 'forward' | 'backward') => {
    if (chapter?.audio_url && audioRef.current) {
      const delta = direction === 'forward' ? 10 : -10;
      let newTime = audioRef.current.currentTime + delta;
      if (newTime < 0) newTime = 0;
      if (newTime > audioDuration) newTime = audioDuration;
      audioRef.current.currentTime = newTime;
      setAudioCurrentTime(newTime);

      const percentage = newTime / audioDuration;
      const totalLines = flatLines.length;
      const newCursor = Math.min(Math.floor(percentage * totalLines), totalLines - 1);
      setCursor(newCursor);
      setWordIdx(0);
    } else {
      seekBy(direction === 'forward' ? 2 : -2);
    }
  };

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
        title: chapter?.title || 'PrepAI Lesson',
        text: `Listen to this narration of ${chapter?.title}`,
        url: window.location.href,
      }).catch(console.error);
    } else {
      alert('Share link copied to clipboard!');
      navigator.clipboard.writeText(window.location.href);
    }
  };

  if (loading || !lesson || flatLines.length === 0) {
    return (
      <div className="h-full w-full bg-[#060D1A] flex items-center justify-center p-5">
        <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const currentFlatLine = flatLines[cursor] || flatLines[0];
  const prevFlatLine = cursor > 0 ? flatLines[cursor - 1] : null;
  const nextFlatLine = cursor + 1 < flatLines.length ? flatLines[cursor + 1] : null;

  const currentScene = lesson.scenes[currentFlatLine.sceneIdx];
  
  const isCustomAudio = !!chapter?.audio_url;
  const currentTotalSeconds = isCustomAudio ? audioDuration : (flatLines.length * BASE_LINE_MS / 1000);
  const currentElapsedSeconds = isCustomAudio ? audioCurrentTime : ((cursor * BASE_LINE_MS + elapsedMsRef.current) / 1000);
  
  const totalDurationStr = formatTime(currentTotalSeconds);
  const elapsedStr = formatTime(currentElapsedSeconds);
  const progressPercent = currentTotalSeconds > 0 ? (currentElapsedSeconds / currentTotalSeconds) * 100 : 0;

  return (
    <div className="h-full w-full bg-[#060D1A] text-foreground font-sans flex flex-col relative overflow-hidden select-none">
      
      {/* Hidden Audio Element */}
      {chapter?.audio_url && (
        <audio 
          ref={audioRef} 
          src={chapter.audio_url} 
          onEnded={() => {
            setEnded(true);
            setIsPlaying(false);
          }}
          onTimeUpdate={() => setAudioCurrentTime(audioRef.current?.currentTime || 0)}
          onLoadedMetadata={() => setAudioDuration(audioRef.current?.duration || 0)}
        />
      )}

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
          <span className="text-xs font-semibold text-accent">{book?.title || 'PrepAI Academy'}</span>
        </div>
        
        <button className="p-2 -mr-2 text-foreground/80 hover:text-foreground transition rounded-full hover:bg-white/5">
          <MoreHorizontal className="w-6 h-6" />
        </button>
      </header>

      {/* --- Mode switcher (Integrated into Header area) --- */}
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

      {/* --- Main Content Area --- */}
      <main className="flex-1 flex flex-col justify-between w-full max-w-xl mx-auto px-6 pb-6 pt-4 z-10 relative overflow-y-auto no-scrollbar">
        
        {mode === 'video' ? (
          /* VIDEO MODE */
          chapter?.video_url && getYoutubeId(chapter.video_url) ? (
            <div className="w-full my-auto aspect-video rounded-3xl overflow-hidden shadow-2xl border border-white/10 relative">
              <iframe
                src={`https://www.youtube.com/embed/${getYoutubeId(chapter.video_url)}?rel=0`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full border-0"
              />
            </div>
          ) : (
            <div className={`w-full my-auto aspect-video rounded-3xl overflow-hidden transition-all duration-700 shadow-2xl border border-white/10 flex flex-col relative ${currentScene.theme}`}>
              <div className="absolute inset-0 opacity-40 mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] animate-zoom" />
              
              <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 z-20">
                <div className={`w-2 h-2 rounded-full bg-accent ${isPlaying ? 'animate-pulse' : ''}`} />
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

              {/* Karaoke lines in Video mode */}
              <div className="absolute bottom-0 left-0 right-0 p-4 pt-12 bg-gradient-to-t from-black/90 to-transparent z-20">
                <p className="text-center font-display text-base leading-relaxed">
                  {currentFlatLine.words.map((word, idx) => (
                    <span 
                      key={idx} 
                      className={`inline-block mx-[2px] transition-colors duration-150 ${idx <= wordIdx ? 'text-accent font-bold' : 'text-white/40'}`}
                    >
                      {word}
                    </span>
                  ))}
                </p>
              </div>
            </div>
          )
        ) : (
          /* PODCAST MODE (Spotify lyrics/audio style) */
          <div className="flex-1 flex flex-col justify-around py-4">
            
            {/* Center Lyrics Layout */}
            <div className="flex flex-col justify-center text-center space-y-6 my-auto px-4">
              {/* Previous line (faded) */}
              <div className="h-10 overflow-hidden flex items-center justify-center">
                {prevFlatLine && (
                  <p className="text-foreground/30 text-sm font-medium line-clamp-1 truncate max-w-md">
                    {prevFlatLine.lineText}
                  </p>
                )}
              </div>

              {/* Current highlighted line */}
              <div className="min-h-[120px] flex items-center justify-center">
                <h2 className="text-xl md:text-2xl font-bold font-sans text-foreground leading-relaxed max-w-lg">
                  {currentFlatLine.words.map((word, idx) => {
                    const isActive = idx <= wordIdx;
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

              {/* Next line (faded) */}
              <div className="h-10 overflow-hidden flex items-center justify-center">
                {nextFlatLine && (
                  <p className="text-foreground/20 text-sm font-medium line-clamp-1 truncate max-w-md">
                    {nextFlatLine.lineText}
                  </p>
                )}
              </div>
            </div>

            {/* Action Bar (Thumbs Up/Down Pill and Share Pill) */}
            <div className="flex items-center justify-between px-4 mb-4">
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

        {/* --- Scrubber & Timeline Panel --- */}
        <div className="space-y-4 pt-4 border-t border-white/5">
          
          {/* Track Info Panel */}
          <div className="flex items-center space-x-4 px-2">
            <img 
              src={book?.cover_image || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100'} 
              alt={chapter?.title} 
              className="w-14 h-14 rounded-xl object-cover bg-slate-800 border border-white/10 shadow-lg flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-foreground truncate">{chapter?.title}</h3>
              <p className="text-xs text-foreground/50 truncate font-medium">By {book?.author || 'PrepAI Engine'}</p>
            </div>
          </div>

          {/* Timeline and Scrubber */}
          <div className="space-y-2">
            <div 
              onClick={handleScrub}
              className="w-full h-1.5 bg-white/10 rounded-full cursor-pointer relative group flex items-center"
            >
              <div 
                className="h-full bg-accent rounded-full relative transition-all duration-100"
                style={{ width: `${Math.max(progressPercent, 1)}%` }}
              >
                {/* Drag Handle knob */}
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full shadow-md scale-0 group-hover:scale-100 transition-transform duration-150" />
              </div>
            </div>
            
            {/* Timeline info row */}
            <div className="flex justify-between items-center text-[10px] font-mono text-foreground/45">
              <span>{elapsedStr}</span>
              
              {/* Scene/Section current marker */}
              <div className="flex items-center gap-1 bg-white/5 border border-white/10 px-2 py-0.5 rounded text-[9px] font-semibold text-accent max-w-[180px] truncate">
                <ListCollapse className="w-3 h-3 text-accent/70 shrink-0" />
                <span className="truncate">{currentScene.title}</span>
              </div>
              
              <span>-{formatTime(Math.max(currentTotalSeconds - currentElapsedSeconds, 0))}</span>
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-between px-2 pt-2">
            {/* Speed Option */}
            <button 
              onClick={() => setPlaybackSpeed(s => s === 1 ? 1.25 : s === 1.25 ? 1.5 : s === 1.5 ? 2 : 1)}
              className="w-12 text-xs font-mono font-bold text-foreground/60 hover:text-accent transition text-left"
            >
              {playbackSpeed}x
            </button>

            {/* Playback Controls */}
            <div className="flex items-center gap-6">
              <button 
                onClick={() => seekBy(-1)} 
                className="p-2 text-foreground/65 hover:text-foreground transition disabled:opacity-30"
                disabled={cursor === 0}
              >
                <SkipBack className="w-5 h-5 fill-current" />
              </button>

              <button 
                onClick={() => handleSkipTime('backward')}
                className="p-2 text-foreground/65 hover:text-foreground transition"
              >
                <RotateCcw className="w-5 h-5" />
              </button>

              <button 
                onClick={togglePlay}
                className="w-14 h-14 rounded-full bg-white text-slate-950 flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-transform"
              >
                {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-1" />}
              </button>

              <button 
                onClick={() => handleSkipTime('forward')}
                className="p-2 text-foreground/65 hover:text-foreground transition"
              >
                <RotateCw className="w-5 h-5" />
              </button>

              <button 
                onClick={() => seekBy(1)}
                className="p-2 text-foreground/65 hover:text-foreground transition disabled:opacity-30"
                disabled={cursor === flatLines.length - 1}
              >
                <SkipForward className="w-5 h-5 fill-current" />
              </button>
            </div>

            {/* Bottom Playlist Queue Toggle */}
            <div className="w-12 flex justify-end">
              <button 
                onClick={() => alert(`Syllabus Structure: ${lesson.scenes.map(s => s.title).join(' → ')}`)}
                className="p-2 text-foreground/60 hover:text-accent transition"
                title="Scene Queue"
              >
                <ListMusic className="w-5 h-5" />
              </button>
            </div>
          </div>

        </div>

        {/* --- Post-Lesson CTA Card --- */}
        <AnimatePresence>
          {ended && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
              className="absolute inset-x-6 bottom-56 premium-card p-6 bg-slate-900 border border-accent/25 text-center z-30 shadow-2xl"
            >
              <CheckCircle className="w-10 h-10 text-success-green mx-auto mb-3" />
              <h3 className="text-sm font-bold text-foreground font-display">Lesson Completed! 🎉</h3>
              <p className="text-[11px] text-foreground/60 mt-1 mb-4">You've mastered this chapter. What's next?</p>
              
              <div className="flex gap-3">
                <Link href={`/quiz/${chapterId}`} className="flex-1 bg-accent hover:bg-amber-500 text-slate-950 font-bold py-2.5 rounded-xl transition flex justify-center items-center gap-1.5 text-xs shadow-md">
                  <CheckCircle className="w-3.5 h-3.5" /> Start Quiz
                </Link>
                <Link href={`/flashcards/${chapterId}`} className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-foreground font-bold py-2.5 rounded-xl transition flex justify-center items-center gap-1.5 text-xs">
                  <FileText className="w-3.5 h-3.5" /> Flashcards
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </main>
    </div>
  );
}

function formatTime(seconds: number) {
  if (isNaN(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}
