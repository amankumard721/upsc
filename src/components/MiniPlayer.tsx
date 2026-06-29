'use client';

import React from 'react';
import Link from 'next/link';
import { useAudio } from '@/contexts/AudioContext';
import { Play, Pause, X, Headphones, AudioLines } from 'lucide-react';

export default function MiniPlayer() {
  const audio = useAudio();

  if (!audio.track) return null;

  const { track, isPlaying, cursor, flatLines, audioCurrentTime, audioDuration } = audio;

  // Progress calculation
  const BASE_LINE_MS = 4000;
  const isCustomAudio = !!track.audioUrl;
  const totalSecs = isCustomAudio ? audioDuration : (flatLines.length * BASE_LINE_MS / 1000);
  const elapsedSecs = isCustomAudio ? audioCurrentTime : ((cursor * BASE_LINE_MS) / 1000);
  const progressPercent = totalSecs > 0 ? (elapsedSecs / totalSecs) * 100 : 0;

  // Format time
  const formatT = (s: number) => {
    if (isNaN(s)) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed bottom-[60px] left-0 right-0 z-50 md:bottom-4 md:left-4 md:right-4 md:max-w-xl md:mx-auto">
      <Link
        href={`/lesson/${track.chapterId}`}
        className="block"
      >
        <div className="bg-[#070B16]/95 backdrop-blur-xl border-t border-[#10B981]/15 md:border md:border-[#10B981]/20 md:rounded-2xl shadow-[0_-4px_30px_rgba(0,0,0,0.5)] md:shadow-2xl overflow-hidden transition-all hover:border-[#10B981]/30">
          {/* Progress bar */}
          <div className="h-[3px] bg-white/5 w-full">
            <div
              className="h-full bg-[#10B981] transition-all duration-200"
              style={{ width: `${Math.max(progressPercent, 0.5)}%` }}
            />
          </div>

          {/* Content */}
          <div className="flex items-center gap-3 px-4 py-3">
            {/* Icon */}
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#10B981]/20 to-[#10B981]/5 border border-[#10B981]/20 flex items-center justify-center flex-shrink-0">
              {isPlaying ? (
                <AudioLines className="w-5 h-5 text-[#10B981] animate-pulse" />
              ) : (
                <Headphones className="w-5 h-5 text-[#10B981]" />
              )}
            </div>

            {/* Title & subtitle */}
            <div className="flex-1 min-w-0">
              <p className="text-white text-[13px] font-bold truncate leading-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
                {track.chapterTitle || `Chapter ${track.chapterNumber}`}
              </p>
              <p className="text-white/40 text-[10px] truncate mt-0.5" style={{ fontFamily: 'Inter, sans-serif' }}>
                {track.bookTitle || 'JTET Sathi'}
              </p>
            </div>

            {/* Time */}
            <div className="bg-white/[0.04] rounded-md px-1.5 py-1 flex-shrink-0">
              <span className="text-[10px] font-bold text-[#10B981]/80 font-mono">
                {formatT(elapsedSecs)}
              </span>
            </div>

            {/* Play/Pause */}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                audio.togglePlay();
              }}
              className="w-9 h-9 rounded-full bg-[#10B981] flex items-center justify-center flex-shrink-0 active:scale-90 transition-transform shadow-lg shadow-[#10B981]/20"
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 text-[#0B1325] fill-[#0B1325]" />
              ) : (
                <Play className="w-4 h-4 text-[#0B1325] fill-[#0B1325] ml-0.5" />
              )}
            </button>

            {/* Close */}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                audio.stopAndClear();
              }}
              className="w-9 h-9 rounded-full bg-white/[0.06] border border-white/10 flex items-center justify-center flex-shrink-0 hover:border-red-500/30 hover:text-red-400 text-white/50 active:scale-90 transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </Link>
    </div>
  );
}
