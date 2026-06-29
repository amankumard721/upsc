'use client';

import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';

// ── Types ──
interface AudioTrack {
  chapterId: string;
  chapterTitle: string;
  chapterNumber: number;
  bookTitle: string;
  bookCover: string;
  bookAuthor: string;
  contentText: string;
  audioUrl?: string;
  videoUrl?: string;
}

interface FlatLine {
  sceneIdx: number;
  lineText: string;
  words: string[];
}

interface Scene {
  title: string;
  icon: string;
  theme: string;
  lines: string[];
}

interface AudioState {
  // Track info
  track: AudioTrack | null;
  scenes: Scene[];
  flatLines: FlatLine[];

  // Playback
  isPlaying: boolean;
  cursor: number;
  wordIdx: number;
  ended: boolean;
  playbackSpeed: number;
  audioCurrentTime: number;
  audioDuration: number;

  // Refs (exposed for lesson page to use)
  audioRef: React.RefObject<HTMLAudioElement | null>;
  timerRef: React.MutableRefObject<NodeJS.Timeout | null>;
  elapsedMsRef: React.MutableRefObject<number>;
  lastTimeRef: React.MutableRefObject<number>;

  // Actions
  startTrack: (track: AudioTrack) => void;
  togglePlay: () => void;
  seekBy: (linesDelta: number) => void;
  jumpToScene: (sceneIdx: number) => void;
  handleScrub: (percentage: number) => void;
  handleSkipTime: (direction: 'forward' | 'backward') => void;
  setPlaybackSpeed: (speed: number) => void;
  stopAndClear: () => void;
  setCursor: React.Dispatch<React.SetStateAction<number>>;
  setWordIdx: React.Dispatch<React.SetStateAction<number>>;
  setIsPlaying: React.Dispatch<React.SetStateAction<boolean>>;
  setEnded: React.Dispatch<React.SetStateAction<boolean>>;
  setAudioCurrentTime: React.Dispatch<React.SetStateAction<number>>;
  setAudioDuration: React.Dispatch<React.SetStateAction<number>>;
}

const AudioContext = createContext<AudioState | null>(null);

export function useAudio() {
  const ctx = useContext(AudioContext);
  if (!ctx) throw new Error('useAudio must be used within AudioProvider');
  return ctx;
}

const BASE_LINE_MS = 4000;

function generateScenes(contentText: string, title: string): Scene[] {
  const defaultScenes: Scene[] = [
    { title: "Introduction", icon: "📖", theme: "bg-indigo-900", lines: ["Welcome to this lesson.", "Today we are going to explore some fascinating concepts.", "Let's dive right in."] },
    { title: "Core Concepts", icon: "🧠", theme: "bg-emerald-900", lines: ["The primary idea revolves around foundational principles.", "Understanding these is crucial for mastery.", "Take your time to absorb the details."] },
    { title: "Summary", icon: "✨", theme: "bg-amber-900", lines: ["We have covered a lot of ground today.", "Review the notes if you need a refresher.", "Great job completing the lesson!"] }
  ];

  if (contentText && contentText.length > 50) {
    const rawSentences = contentText.match(/[^.!?]+[.!?]+(\s|$)/g)?.map(s => s.trim()).filter(Boolean) || [contentText];
    const chunk = Math.ceil(rawSentences.length / 3);
    return [
      { title: "Introduction", icon: "📖", theme: "bg-indigo-950", lines: rawSentences.slice(0, chunk).length ? rawSentences.slice(0, chunk) : ["Welcome to this chapter."] },
      { title: "Deep Dive", icon: "⚖️", theme: "bg-slate-900", lines: rawSentences.slice(chunk, chunk * 2).length ? rawSentences.slice(chunk, chunk * 2) : ["Let's explore further."] },
      { title: "Conclusion", icon: "✨", theme: "bg-stone-900", lines: rawSentences.slice(chunk * 2).length ? rawSentences.slice(chunk * 2) : ["That concludes our topic."] }
    ].filter(s => s.lines.length > 0);
  }

  return defaultScenes;
}

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const [track, setTrack] = useState<AudioTrack | null>(null);
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [flatLines, setFlatLines] = useState<FlatLine[]>([]);

  const [isPlaying, setIsPlaying] = useState(false);
  const [cursor, setCursor] = useState(0);
  const [wordIdx, setWordIdx] = useState(0);
  const [ended, setEnded] = useState(false);
  const [playbackSpeed, setPlaybackSpeedState] = useState(1);
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const elapsedMsRef = useRef(0);
  const lastTimeRef = useRef(0);

  // ── Start a new track ──
  const startTrack = useCallback((newTrack: AudioTrack) => {
    // If same track, just resume
    if (track?.chapterId === newTrack.chapterId) return;

    // Cleanup previous
    if (timerRef.current) clearInterval(timerRef.current);
    if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel();

    const newScenes = generateScenes(newTrack.contentText, newTrack.chapterTitle);
    const flat: FlatLine[] = [];
    newScenes.forEach((scene, sIdx) => {
      scene.lines.forEach(line => {
        flat.push({ sceneIdx: sIdx, lineText: line, words: line.split(' ') });
      });
    });

    setTrack(newTrack);
    setScenes(newScenes);
    setFlatLines(flat);
    setCursor(0);
    setWordIdx(0);
    setEnded(false);
    elapsedMsRef.current = 0;
    setAudioCurrentTime(0);
    setAudioDuration(0);
    setPlaybackSpeedState(1);
    // Don't auto-play here — let the lesson page handle it
  }, [track]);

  // ── Toggle play/pause ──
  const togglePlay = useCallback(() => {
    if (ended) {
      setCursor(0);
      setWordIdx(0);
      elapsedMsRef.current = 0;
      setEnded(false);
    }
    setIsPlaying(prev => !prev);
  }, [ended]);

  // ── Seek by lines ──
  const seekBy = useCallback((linesDelta: number) => {
    setFlatLines(current => {
      let newCursor = cursor + linesDelta;
      if (newCursor < 0) newCursor = 0;
      if (newCursor >= current.length) {
        newCursor = current.length - 1;
        setEnded(true);
        setIsPlaying(false);
      } else {
        setEnded(false);
      }
      setCursor(newCursor);
      setWordIdx(0);
      elapsedMsRef.current = 0;
      if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel();
      return current;
    });
  }, [cursor]);

  // ── Jump to scene ──
  const jumpToScene = useCallback((sceneIdx: number) => {
    const idx = flatLines.findIndex(f => f.sceneIdx === sceneIdx);
    if (idx !== -1) {
      setCursor(idx);
      setWordIdx(0);
      elapsedMsRef.current = 0;
      setEnded(false);
      setIsPlaying(true);
    }
  }, [flatLines]);

  // ── Scrub by percentage ──
  const handleScrub = useCallback((percentage: number) => {
    if (track?.audioUrl && audioRef.current) {
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
  }, [track, audioDuration, flatLines]);

  // ── Skip time ──
  const handleSkipTime = useCallback((direction: 'forward' | 'backward') => {
    if (track?.audioUrl && audioRef.current) {
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
  }, [track, audioDuration, flatLines, seekBy]);

  // ── Set speed ──
  const setPlaybackSpeed = useCallback((speed: number) => {
    setPlaybackSpeedState(speed);
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
  }, []);

  // ── Stop and clear ──
  const stopAndClear = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setTrack(null);
    setScenes([]);
    setFlatLines([]);
    setIsPlaying(false);
    setCursor(0);
    setWordIdx(0);
    setEnded(false);
    setAudioCurrentTime(0);
    setAudioDuration(0);
    elapsedMsRef.current = 0;
  }, []);

  // ── Playback engine ──
  useEffect(() => {
    if (!isPlaying || ended || flatLines.length === 0) {
      if (timerRef.current) clearInterval(timerRef.current);
      if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel();
      if (audioRef.current && !isPlaying) audioRef.current.pause();
      return;
    }

    const currentLine = flatLines[cursor];
    if (!currentLine) return;
    const totalLineMs = BASE_LINE_MS / playbackSpeed;
    const wordIntervalMs = Math.max(totalLineMs / currentLine.words.length, 100);

    if (track?.audioUrl) {
      if (audioRef.current && audioRef.current.paused) {
        audioRef.current.playbackRate = playbackSpeed;
        audioRef.current.play().catch(console.error);
      }

      lastTimeRef.current = performance.now();
      timerRef.current = setInterval(() => {
        const now = performance.now();
        const delta = now - lastTimeRef.current;
        lastTimeRef.current = now;
        elapsedMsRef.current += delta;

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
      // TTS fallback
      if (elapsedMsRef.current === 0 && typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(currentLine.lineText);
        utterance.rate = playbackSpeed * 1.1;
        const voices = window.speechSynthesis.getVoices();
        const preferred = voices.find(v => v.lang.startsWith('en-IN') || v.name.includes('Google') || v.lang.startsWith('hi-IN'));
        if (preferred) utterance.voice = preferred;
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
  }, [isPlaying, cursor, playbackSpeed, ended, flatLines, track]);

  const value: AudioState = {
    track, scenes, flatLines,
    isPlaying, cursor, wordIdx, ended, playbackSpeed,
    audioCurrentTime, audioDuration,
    audioRef, timerRef, elapsedMsRef, lastTimeRef,
    startTrack, togglePlay, seekBy, jumpToScene,
    handleScrub, handleSkipTime, setPlaybackSpeed, stopAndClear,
    setCursor, setWordIdx, setIsPlaying, setEnded,
    setAudioCurrentTime, setAudioDuration,
  };

  return (
    <AudioContext.Provider value={value}>
      {/* Hidden global audio element */}
      {track?.audioUrl && (
        <audio
          ref={audioRef}
          src={track.audioUrl}
          onEnded={() => { setEnded(true); setIsPlaying(false); }}
          onTimeUpdate={() => setAudioCurrentTime(audioRef.current?.currentTime || 0)}
          onLoadedMetadata={() => setAudioDuration(audioRef.current?.duration || 0)}
        />
      )}
      {children}
    </AudioContext.Provider>
  );
}
