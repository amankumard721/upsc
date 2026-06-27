'use client';

import React, { useEffect, useState, useRef, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/supabase';
import { Chapter } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play, Pause, SkipBack, SkipForward, ArrowLeft,
  Video, Radio, Expand, Shrink, FileText, CheckCircle
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
// We generate a structured lesson from the raw chapter data for demonstration.
function generateMockLesson(chapter: Chapter): Lesson {
  const defaultScenes: Scene[] = [
    { title: "Introduction", icon: "📖", theme: "bg-indigo-900", lines: ["Welcome to this lesson.", "Today we are going to explore some fascinating concepts.", "Let's dive right in."] },
    { title: "Core Concepts", icon: "🧠", theme: "bg-emerald-900", lines: ["The primary idea revolves around foundational principles.", "Understanding these is crucial for mastery.", "Take your time to absorb the details."] },
    { title: "Summary", icon: "✨", theme: "bg-amber-900", lines: ["We have covered a lot of ground today.", "Review the notes if you need a refresher.", "Great job completing the lesson!"] }
  ];

  // If chapter has actual content, try to break it into mock scenes
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

// --- Playback Configuration ---
const BASE_LINE_MS = 3000; // 3 seconds per line at 1x speed

export default function LessonPlayerPage({ params }: { params: Promise<{ chapterId: string }> }) {
  const router = useRouter();
  const { chapterId } = use(params);

  // Data
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [flatLines, setFlatLines] = useState<FlatLine[]>([]);
  const [loading, setLoading] = useState(true);

  // Playback State
  const [mode, setMode] = useState<'video' | 'podcast'>('video');
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [cursor, setCursor] = useState(0);       // Index into flatLines
  const [wordIdx, setWordIdx] = useState(0);     // Index into current line's words
  const [ended, setEnded] = useState(false);
  const [isTheater, setIsTheater] = useState(false);

  // Refs for timer and speech
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null);
  const lastTimeRef = useRef<number>(0);
  const elapsedMsRef = useRef<number>(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // 1. Load Data
  useEffect(() => {
    db.getChapter(chapterId).then(ch => {
      if (ch) {
        setChapter(ch);
        const l = generateMockLesson(ch);
        setLesson(l);
        
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

  // 2. Playback Engine
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
      // Use real audio file instead of TTS
      if (audioRef.current && audioRef.current.paused) {
        audioRef.current.play().catch(console.error);
      }
      
      // Auto-advance cursor loosely based on time since we don't have exact VTT sync
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
        }
      }, 50);

    } else {
      // Use Browser TTS
      if (elapsedMsRef.current === 0 && typeof window !== 'undefined') {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(currentLine.lineText);
        utterance.rate = playbackSpeed * 1.1; 
        const voices = window.speechSynthesis.getVoices();
        const preferred = voices.find(v => v.lang.startsWith('en-IN') || v.name.includes('Google'));
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

  // 3. Save Progress
  useEffect(() => {
    if (typeof window !== 'undefined' && chapter) {
      try {
        const list = JSON.parse(localStorage.getItem('prepai_user_progress') || '[]');
        const existingIdx = list.findIndex((p: any) => p.chapter_id === chapterId);
        
        const isCompleted = ended || (existingIdx !== -1 && list[existingIdx].is_completed);
        
        const newProg = {
          id: existingIdx !== -1 ? list[existingIdx].id : Math.random().toString(36).substr(2, 9),
          user_id: 'default-user', // Mock user for local tracking
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

  // 4. Controls
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

  if (loading || !lesson || flatLines.length === 0) {
    return (
      <div className="min-h-screen bg-[#0B1325] flex items-center justify-center p-5">
        <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const currentFlatLine = flatLines[cursor];
  const currentScene = lesson.scenes[currentFlatLine.sceneIdx];
  const totalDurationStr = formatTime(flatLines.length * BASE_LINE_MS / 1000);
  const elapsedStr = formatTime((cursor * BASE_LINE_MS + elapsedMsRef.current) / 1000);
  const progressPercent = ((cursor + elapsedMsRef.current/BASE_LINE_MS) / flatLines.length) * 100;

  return (
    <div className="min-h-screen bg-[#060d1a] text-[#FAF6EC] font-sans flex flex-col pb-safe">
      
      {/* Hidden Audio Element for Custom MP3s */}
      {chapter?.audio_url && (
        <audio 
          ref={audioRef} 
          src={chapter.audio_url} 
          onEnded={() => {
            setEnded(true);
            setIsPlaying(false);
          }}
        />
      )}

      {/* --- Top Bar & Mode Toggle --- */}
      <header className="flex items-center justify-between p-4 glass-nav sticky top-0 z-50">
        <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition">
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        
        <div className="flex bg-white/5 border border-white/10 rounded-full p-1 shadow-inner">
          <button
            onClick={() => setMode('video')}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold transition-all ${mode === 'video' ? 'bg-accent text-slate-950 shadow-md' : 'text-white/50 hover:text-white/80'}`}
          >
            <Video className="w-3.5 h-3.5" /> Video
          </button>
          <button
            onClick={() => setMode('podcast')}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold transition-all ${mode === 'podcast' ? 'bg-accent text-slate-950 shadow-md' : 'text-white/50 hover:text-white/80'}`}
          >
            <Radio className="w-3.5 h-3.5" /> Podcast
          </button>
        </div>
        
        <div className="w-10" /> {/* Spacer */}
      </header>

      {/* --- Main Content Area --- */}
      <main className="flex-1 flex flex-col items-center w-full max-w-2xl mx-auto p-4 transition-all duration-500 relative">
        <AnimatePresence mode="wait">
          
          {mode === 'video' && (
            chapter?.video_url && getYoutubeId(chapter.video_url) ? (
              <motion.div
                key="yt-video"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`w-full relative rounded-3xl overflow-hidden shadow-2xl border border-white/10 ${isTheater ? 'h-[70vh]' : 'aspect-video'}`}
              >
                <iframe
                  src={`https://www.youtube.com/embed/${getYoutubeId(chapter.video_url)}?rel=0`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full border-0"
                />
              </motion.div>
            ) : (
              <motion.div
                key="video"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`w-full relative rounded-3xl overflow-hidden transition-all duration-700 shadow-2xl border border-white/10 flex flex-col ${isTheater ? 'h-[70vh]' : 'aspect-video'} ${currentScene.theme} ${!isPlaying ? 'paused' : ''}`}
              >
                {/* Ambient Background & Particles */}
              <div className="absolute inset-0 opacity-40 mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] animate-zoom" />
              <div className="absolute inset-0 animate-dust-1" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
              <div className="absolute inset-0 animate-dust-2" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.15) 2px, transparent 2px)', backgroundSize: '70px 70px' }} />

              {/* Badge */}
              <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 z-20">
                <div className={`w-2 h-2 rounded-full bg-accent ${isPlaying ? 'animate-pulse' : ''}`} />
                <span className="text-[9px] font-bold tracking-widest text-white uppercase font-mono">AI Narration</span>
              </div>
              
              <div className="absolute top-4 right-4 z-20">
                <button onClick={() => setIsTheater(!isTheater)} className="p-2 bg-black/40 backdrop-blur-md rounded-full text-white/70 hover:text-white border border-white/10 transition">
                  {isTheater ? <Shrink className="w-4 h-4" /> : <Expand className="w-4 h-4" />}
                </button>
              </div>

              {/* Center Scene: Teacher + Icon */}
              <div className="flex-1 flex flex-col items-center justify-center relative z-10 pt-8">
                <div className="text-6xl mb-6 opacity-90 drop-shadow-2xl animate-breathe filter saturate-150">
                  {currentScene.icon}
                </div>
                
                {/* Chalk-silhouette Avatar */}
                <div className="relative w-32 h-40 opacity-80 mix-blend-screen drop-shadow-md">
                  {/* Body/Robe */}
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-28 h-24 bg-white/20 rounded-t-[3rem] border-t-2 border-l-2 border-r-2 border-white/40" />
                  {/* Head */}
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 w-16 h-16 bg-white/20 rounded-full border-2 border-white/40 flex items-center justify-center">
                    {/* Eyes */}
                    <div className="flex gap-3 mb-2 animate-blink">
                      <div className="w-1.5 h-1.5 bg-white rounded-full" />
                      <div className="w-1.5 h-1.5 bg-white rounded-full" />
                    </div>
                    {/* Mouth */}
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-4 h-1.5 bg-white rounded-full animate-talk" />
                  </div>
                  {/* Arm */}
                  <div className="absolute bottom-6 right-2 w-16 h-4 bg-white/20 border-2 border-white/40 rounded-full origin-left rotate-45 animate-sway" />
                </div>
              </div>

              {/* Karaoke Captions */}
              <div className="absolute bottom-0 left-0 right-0 p-6 pt-16 bg-gradient-to-t from-black/90 via-black/50 to-transparent z-20">
                <p className="text-center font-display text-xl leading-relaxed">
                  {currentFlatLine.words.map((word, idx) => (
                    <span 
                      key={idx} 
                      className={`inline-block mx-[2px] transition-colors duration-150 ${idx <= wordIdx ? 'text-white text-shadow-glow font-bold' : 'text-white/40'}`}
                      style={{ textShadow: idx <= wordIdx ? '0 0 10px rgba(255,255,255,0.5)' : 'none' }}
                    >
                      {word}
                    </span>
                  ))}
                </p>
              </div>
            </motion.div>
            )
          )}

          {mode === 'podcast' && (
            <motion.div
              key="podcast"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full flex flex-col items-center mt-6"
            >
              {/* Square Cover Art */}
              <div className={`w-64 h-64 rounded-[2rem] shadow-2xl flex items-center justify-center border-4 border-white/5 transition-all duration-700 relative overflow-hidden ${currentScene.theme} ${!isPlaying ? 'paused' : ''}`}>
                <div className="absolute inset-0 bg-black/10 mix-blend-overlay animate-zoom" />
                <div className="text-8xl drop-shadow-2xl animate-breathe">{currentScene.icon}</div>
              </div>

              {/* Episode Info */}
              <div className="text-center mt-8 mb-6">
                <p className="text-[10px] font-mono tracking-widest uppercase text-accent mb-2">
                  Episode {currentFlatLine.sceneIdx + 1} of {lesson.scenes.length}
                </p>
                <h2 className="text-2xl font-bold font-display text-white">{currentScene.title}</h2>
                <p className="text-xs text-white/50 mt-1 font-medium">Narrated by AI Teacher</p>
              </div>

              {/* Waveform */}
              <div className={`flex items-end justify-center gap-1.5 h-16 mb-8 w-full px-8 ${!isPlaying ? 'paused' : ''}`}>
                {Array.from({ length: 28 }).map((_, i) => {
                  // Color earlier bars differently
                  const isPast = (i / 28) < ((cursor+1)/flatLines.length);
                  const animClass = ['animate-bar-1', 'animate-bar-2', 'animate-bar-3', 'animate-bar-4'][i % 4];
                  return (
                    <div 
                      key={i} 
                      className={`w-1.5 rounded-full transition-colors ${animClass} ${isPast ? 'bg-accent/80 shadow-[0_0_8px_rgba(216,155,60,0.5)]' : 'bg-white/10'}`} 
                    />
                  );
                })}
              </div>

            </motion.div>
          )}
        </AnimatePresence>

        {/* --- Shared Controls Layer --- */}
        <div className="w-full mt-6 space-y-5 relative z-30 bg-[#060d1a]">
          {/* Chapter Chips (Podcast only, or both?) Let's show on both for easy nav */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 mask-edges">
            {lesson.scenes.map((scene, idx) => (
              <button
                key={idx}
                onClick={() => jumpToScene(idx)}
                className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs transition-all ${
                  currentFlatLine.sceneIdx === idx 
                    ? 'bg-white/10 border-white/20 text-white font-bold' 
                    : 'bg-transparent border-white/5 text-white/40 hover:text-white/70'
                }`}
              >
                <span>{scene.icon}</span>
                <span>{scene.title}</span>
              </button>
            ))}
          </div>

          {/* Scrubber */}
          <div className="relative pt-2">
            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden cursor-pointer">
              <div 
                className="h-full bg-accent relative transition-all duration-200"
                style={{ width: `${Math.max(progressPercent, 1)}%` }}
              >
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-md" />
              </div>
            </div>
            <div className="flex justify-between mt-2 text-[10px] font-mono text-white/40">
              <span>{elapsedStr}</span>
              <span>{totalDurationStr}</span>
            </div>
          </div>

          {/* Media Buttons */}
          <div className="flex items-center justify-between px-4 pb-4">
            <button 
              onClick={() => setPlaybackSpeed(s => s === 1 ? 1.25 : s === 1.25 ? 1.5 : s === 1.5 ? 2 : 1)}
              className="w-12 text-xs font-mono font-bold text-white/60 hover:text-accent transition"
            >
              {playbackSpeed}x
            </button>
            
            <div className="flex items-center gap-6">
              <button onClick={() => seekBy(-2)} className="p-2 text-white/70 hover:text-white transition">
                <SkipBack className="w-6 h-6 fill-current" />
              </button>
              
              <button 
                onClick={togglePlay}
                className="w-16 h-16 rounded-full bg-white text-slate-950 flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:scale-105 transition-transform"
              >
                {isPlaying ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current ml-1" />}
              </button>
              
              <button onClick={() => seekBy(2)} className="p-2 text-white/70 hover:text-white transition">
                <SkipForward className="w-6 h-6 fill-current" />
              </button>
            </div>

            <div className="w-12 flex justify-end">
               <div className="w-1.5 h-1.5 rounded-full bg-white/20" /> {/* Spacer dot */}
            </div>
          </div>
        </div>

        {/* --- Post-Lesson CTA --- */}
        <AnimatePresence>
          {ended && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full premium-card p-6 mt-4 border-accent/30 text-center"
            >
              <CheckCircle className="w-12 h-12 text-success-green mx-auto mb-3" />
              <h3 className="text-lg font-bold text-white font-display">Lesson Complete!</h3>
              <p className="text-xs text-white/60 mt-1 mb-5">You've mastered this topic. Ready to practice?</p>
              
              <div className="flex gap-3">
                <Link href={`/quiz/${chapterId}`} className="flex-1 bg-accent hover:bg-amber-500 text-slate-950 font-bold py-3 rounded-xl transition flex justify-center items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4" /> Quiz (10)
                </Link>
                <Link href={`/flashcards/${chapterId}`} className="flex-1 bg-white/10 hover:bg-white/20 border border-white/10 text-white font-bold py-3 rounded-xl transition flex justify-center items-center gap-2 text-sm">
                  <FileText className="w-4 h-4" /> Flashcards
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
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}
