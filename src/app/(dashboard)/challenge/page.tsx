'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { db } from '@/lib/supabase';
import { sfx } from '@/lib/sounds';
import { MCQ, UserProfile } from '@/types';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Target, 
  CheckCircle2, 
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { t } from '@/lib/translations';

export default function ChallengePage() {
  const [mcq, setMcq] = useState<MCQ | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [langTick, setLangTick] = useState(0);

  // Interaction State
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [streak, setStreak] = useState(0);

  // Load Initial Data
  useEffect(() => {
    loadNextChallenge();
    db.getUserProfile().then(setProfile);

    const handleLangChange = () => setLangTick(t => t + 1);
    window.addEventListener('languageChange', handleLangChange);
    return () => window.removeEventListener('languageChange', handleLangChange);
  }, []);

  const loadNextChallenge = async () => {
    setLoading(true);
    setIsFlipped(false);
    setSelectedOption(null);
    try {
      const chIds = ['00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002'];
      const randomCh = chIds[Math.floor(Math.random() * chIds.length)];
      const mcqs = await db.getMCQs(randomCh);
      if (mcqs && mcqs.length > 0) {
        setMcq(mcqs[Math.floor(Math.random() * mcqs.length)]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleMCQ = async (option: string) => {
    if (isFlipped || !mcq) return;
    
    setSelectedOption(option);
    const isCorrect = option === mcq.correct_option;
    
    if (isCorrect) {
      sfx.playCorrect();
      setStreak(s => s + 1);
      if (profile) {
        await db.updateUserProfile({ total_points: profile.total_points + 25 });
      }
    } else {
      sfx.playIncorrect();
      setStreak(0);
    }

    setTimeout(() => {
      setIsFlipped(true);
      sfx.playFlip();
    }, 800);
  };

  if (loading && !mcq) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-foreground/50 font-light">Loading...</p>
      </div>
    );
  }

  if (!mcq) {
    return (
      <div className="text-center py-16 space-y-4">
        <p className="text-foreground/60">No challenges available right now.</p>
        <Link href="/dashboard" className="text-accent underline inline-flex items-center space-x-1">
          <ArrowLeft className="w-4 h-4" />
          <span>{t('backToDashboard')}</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 font-sans max-w-xl mx-auto pb-16 px-4" style={{ paddingTop: 'calc(1.5rem + env(safe-area-inset-top, 0px))' }}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-foreground/5 pb-4">
        <Link href="/dashboard" className="text-sm text-foreground/60 hover:text-accent inline-flex items-center space-x-1.5 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span>{t('dashboardTitle')}</span>
        </Link>
        <div className="flex items-center space-x-3">
          <span className="font-display font-bold text-lg text-accent">{t('dailyChallenge')}</span>
          {streak > 1 && (
            <span className="bg-amber-500/15 text-amber-500 border border-amber-500/30 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider animate-pulse">
              {streak} Streak! 🔥
            </span>
          )}
        </div>
      </div>

      {/* 3D Flip Card */}
      <div className="w-full aspect-[4/5] sm:aspect-[4/4] max-h-[500px] relative select-none" style={{ perspective: '1200px' }}>
        <motion.div
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          style={{ transformStyle: 'preserve-3d' }}
          className="w-full h-full relative"
        >
          {/* FRONT: MCQ Question */}
          <div 
            className="absolute inset-0 premium-card p-6 md:p-8 bg-gradient-to-br from-slate-900 to-slate-950 border border-white/10 rounded-[2rem] flex flex-col shadow-[0_20px_40px_rgba(0,0,0,0.5)] z-10"
            style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
          >
            <div className="flex justify-between items-center text-[10px] text-white/40 uppercase font-mono tracking-wider mb-6">
              <span className="flex items-center gap-1.5 text-accent"><Target className="w-3.5 h-3.5" /> {t('dailyChallenge')}</span>
              <span className="bg-white/5 px-2 py-1 rounded-md border border-white/10">+25 XP</span>
            </div>
            
            <p className="text-lg md:text-xl font-medium text-white leading-relaxed mb-6">
              {mcq.question}
            </p>

            <div className="space-y-3 mt-auto">
              {(['A','B','C','D'] as const).map(key => {
                const text = mcq[`option_${key.toLowerCase()}` as keyof MCQ] as string;
                const isSelected = selectedOption === key;
                
                let cls = 'border-white/10 bg-white/5 hover:border-accent/40 hover:bg-accent/10';
                if (selectedOption) {
                  if (isSelected) cls = 'border-accent bg-accent/20 scale-[0.98]';
                  else cls = 'border-white/5 opacity-50';
                }

                return (
                  <button
                    key={key}
                    disabled={selectedOption !== null}
                    onClick={() => handleMCQ(key)}
                    className={`w-full text-left flex items-start gap-4 p-4 rounded-2xl border transition-all duration-200 ${cls}`}
                  >
                    <span className="shrink-0 w-7 h-7 rounded-full border border-white/20 flex items-center justify-center text-[11px] font-bold font-mono text-accent bg-white/5">
                      {key}
                    </span>
                    <span className="text-sm text-white/90 leading-relaxed font-medium mt-0.5">{text}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* BACK: Flashcard Explanation */}
          <div 
            className="absolute inset-0 premium-card p-6 md:p-8 bg-gradient-to-br from-amber-900/40 to-slate-950 border-2 border-accent/30 rounded-[2rem] flex flex-col shadow-[0_20px_50px_rgba(216,155,60,0.15)] z-0"
            style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          >
            <div className="flex justify-between items-center text-[10px] text-accent uppercase font-mono tracking-wider font-bold mb-6">
              <span className="flex items-center gap-1 bg-accent/10 px-2 py-1 rounded-md border border-accent/20">
                <Sparkles className="w-3 h-3" /> {t('result')}
              </span>
              {selectedOption === mcq.correct_option ? (
                <span className="text-success-green flex items-center"><CheckCircle2 className="w-3.5 h-3.5 mr-1" /> {t('correct')}</span>
              ) : (
                <span className="text-error-red flex items-center"><AlertCircle className="w-3.5 h-3.5 mr-1" /> {t('incorrect')}</span>
              )}
            </div>

            <div className="bg-black/20 border border-white/5 p-4 rounded-xl mb-6">
              <p className="text-[10px] text-white/40 uppercase font-mono mb-1">{t('correctAnswer')}</p>
              <p className="text-base font-bold text-accent">
                {mcq.correct_option}. {mcq[`option_${mcq.correct_option.toLowerCase()}` as keyof MCQ] as string}
              </p>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 no-scrollbar">
              <p className="text-[10px] text-white/40 uppercase font-mono mb-2">{t('explanation')}</p>
              <p className="text-sm text-white/80 leading-relaxed">
                {mcq.explanation}
              </p>
            </div>

            <button 
              onClick={loadNextChallenge}
              className="w-full mt-6 bg-accent hover:bg-amber-500 text-slate-950 font-bold py-4 rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
            >
              <span>{t('nextChallenge')}</span>
            </button>
          </div>
        </motion.div>
      </div>

    </div>
  );
}
