'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/supabase';
import { sfx } from '@/lib/sounds';
import { Chapter, Flashcard, UserProfile } from '@/types';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { 
  ArrowLeft, 
  Sparkles, 
  HelpCircle, 
  RotateCw, 
  Check, 
  X, 
  Award,
  ChevronRight,
  TrendingUp,
  LayoutDashboard,
  RotateCcw
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface FlashcardPageProps {
  params: Promise<{ chapterId: string }>;
}

export default function FlashcardsPage({ params }: FlashcardPageProps) {
  const router = useRouter();
  const { chapterId } = use(params);

  // States
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Session state
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [knowCount, setKnowCount] = useState(0);
  const [dontKnowCount, setDontKnowCount] = useState(0);
  const [sessionFinished, setSessionFinished] = useState(false);

  // Swipe gesture animation (Framer Motion)
  const xValue = useMotionValue(0);
  const rotateValue = useTransform(xValue, [-200, 200], [-30, 30]);
  const opacityValue = useTransform(xValue, [-200, -150, 0, 150, 200], [0.5, 1, 1, 1, 0.5]);

  useEffect(() => {
    async function loadFlashcardData() {
      try {
        const ch = await db.getChapter(chapterId);
        if (!ch) {
          setLoading(false);
          return;
        }
        setChapter(ch);

        const chCards = await db.getFlashcards(chapterId);
        setCards(chCards);

        const prof = await db.getUserProfile();
        setProfile(prof);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadFlashcardData();
  }, [chapterId]);

  const handleReview = async (know: boolean) => {
    if (cards.length === 0) return;

    const currentCard = cards[currentIdx];
    
    // Leitner Spaced Repetition (Mock update in localStorage)
    const cardId = currentCard.id;
    const history = JSON.parse(localStorage.getItem('prepai_flashcards_history') || '{}');
    
    let interval = 1; // day
    let ease = 2.5;

    if (history[cardId]) {
      const prev = history[cardId];
      ease = prev.ease || 2.5;
      if (know) {
        interval = Math.round(prev.interval * ease);
        ease = Math.min(3.0, ease + 0.1);
      } else {
        interval = 1;
        ease = Math.max(1.3, ease - 0.2);
      }
    } else {
      if (know) {
        interval = 2; // day
      } else {
        interval = 1;
      }
    }

    history[cardId] = {
      interval,
      ease,
      next_review: new Date(Date.now() + interval * 24 * 60 * 60 * 1000).toISOString()
    };
    localStorage.setItem('prepai_flashcards_history', JSON.stringify(history));

    if (know) {
      setKnowCount(prev => prev + 1);
    } else {
      setDontKnowCount(prev => prev + 1);
    }

    // Go to next card or finish
    if (currentIdx + 1 < cards.length) {
      setCurrentIdx(prev => prev + 1);
      setIsFlipped(false);
      xValue.set(0); // reset swipe position
    } else {
      // Award XP points
      if (profile) {
        await db.updateUserProfile({ total_points: profile.total_points + (knowCount + (know ? 1 : 0)) * 10 });
      }
      setSessionFinished(true);
      sfx.playSuccess();
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 }
      });
    }
  };

  // Drag handlers for Swipe Gestures
  const handleDragEnd = (event: any, info: any) => {
    const swipeThreshold = 100;
    if (info.offset.x > swipeThreshold) {
      handleReview(true); // Know -> Swipe Right
    } else if (info.offset.x < -swipeThreshold) {
      handleReview(false); // Don't Know -> Swipe Left
    } else {
      xValue.set(0); // bounce back
    }
  };

  const handleRetry = () => {
    setCurrentIdx(0);
    setIsFlipped(false);
    setKnowCount(0);
    setDontKnowCount(0);
    setSessionFinished(false);
    xValue.set(0);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-foreground/50 font-light">Shuffling Spaced Repetition deck...</p>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="text-center py-16 space-y-4">
        <p className="text-foreground/60">No flashcards created for this chapter yet.</p>
        <Link href={`/lesson/${chapterId}`} className="text-accent underline inline-flex items-center space-x-1">
          <ArrowLeft className="w-4 h-4" />
          <span>Go back to lesson</span>
        </Link>
      </div>
    );
  }

  const activeCard = cards[currentIdx];

  return (
    <div className="space-y-8 font-sans max-w-2xl mx-auto pb-16">
      
      {/* Header Info */}
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <Link href={`/lesson/${chapterId}`} className="text-sm text-foreground/60 hover:text-accent inline-flex items-center space-x-1.5 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span>Exit Deck</span>
        </Link>
        <span className="font-display font-bold text-lg text-accent">AI Flashcards</span>
      </div>

      {!sessionFinished ? (
        <div className="space-y-8">
          
          {/* Progress bar */}
          <div>
            <div className="flex justify-between text-xs text-foreground/40 mb-1.5 font-mono">
              <span>Progress</span>
              <span>{currentIdx + 1} / {cards.length} cards</span>
            </div>
            <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="bg-accent h-full transition-all duration-300" 
                style={{ width: `${((currentIdx + 1) / cards.length) * 100}%` }} 
              />
            </div>
          </div>

          {/* Cards due today counter */}
          <div className="text-center">
            <span className="text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-3 py-1 rounded-full font-mono uppercase font-bold tracking-wider">
              {cards.length - currentIdx} Cards remaining in review
            </span>
          </div>

          {/* 3D Flip Card Container */}
          <div className="w-full aspect-[4/3] max-h-[350px] relative cursor-pointer select-none" style={{ perspective: '1200px' }}>
            <motion.div
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.7}
              onDragEnd={handleDragEnd}
              animate={{ rotateY: isFlipped ? 180 : 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              style={{ x: xValue, rotate: rotateValue, opacity: opacityValue, transformStyle: 'preserve-3d' }}
              onClick={() => {
                setIsFlipped(!isFlipped);
                sfx.playFlip();
              }}
              className="w-full h-full relative"
            >
              {/* CARD FRONT */}
              <div 
                className="absolute inset-0 premium-card p-8 bg-gradient-to-br from-slate-900 to-slate-950 border border-white/10 rounded-3xl flex flex-col justify-between shadow-[0_20px_40px_rgba(0,0,0,0.5)] z-10"
                style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
              >
                <div className="flex justify-between items-center text-[10px] text-foreground/40 uppercase font-mono tracking-wider">
                  <span>Question</span>
                  <div className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded-md border border-white/10">
                    <RotateCw className="w-3 h-3 animate-spin-slow" /> Tap to Flip
                  </div>
                </div>
                
                <p className="text-center text-xl md:text-2xl font-bold font-display text-foreground leading-relaxed max-w-md mx-auto drop-shadow-md">
                  {activeCard.front_text}
                </p>

                <div className="text-center text-[10px] text-foreground/30 uppercase tracking-widest font-mono">
                  Swipe left (Don't Know) / Swipe right (Know)
                </div>
              </div>

              {/* CARD BACK */}
              <div 
                className="absolute inset-0 premium-card p-8 bg-gradient-to-br from-amber-900/40 to-slate-950 border-2 border-accent/30 rounded-3xl flex flex-col justify-between shadow-[0_20px_50px_rgba(216,155,60,0.15)] z-0"
                style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
              >
                <div className="flex justify-between items-center text-[10px] text-accent uppercase font-mono tracking-wider font-bold">
                  <span>Answer</span>
                  <span className="flex items-center gap-1 bg-accent/10 px-2 py-1 rounded-md border border-accent/20"><Sparkles className="w-3 h-3" /> Core Summary</span>
                </div>

                <p className="text-center text-xl md:text-2xl font-bold font-display text-accent leading-relaxed max-w-md mx-auto drop-shadow-[0_2px_10px_rgba(216,155,60,0.3)]">
                  {activeCard.back_text}
                </p>

                <div className="text-center text-[10px] text-accent/50 uppercase tracking-widest font-mono">
                  Assess your recall before swiping.
                </div>
              </div>
            </motion.div>
          </div>

          {/* Action review buttons */}
          <div className="flex items-center justify-center space-x-6">
            <button
              onClick={() => handleReview(false)}
              className="w-14 h-14 bg-error-red/10 border border-error-red/35 hover:bg-error-red/20 text-error-red rounded-full flex items-center justify-center transition-all hover:scale-105 shadow-md"
              title="Don't Know (Swipe Left)"
            >
              <X className="w-6 h-6" />
            </button>
            
            <button
              onClick={() => {
                setIsFlipped(!isFlipped);
                sfx.playFlip();
              }}
              className="text-xs border border-white/10 hover:border-accent hover:text-accent bg-white/5 px-6 py-3.5 rounded-full transition-all flex items-center gap-1.5"
            >
              <RotateCw className="w-4 h-4" />
              <span>Flip Card</span>
            </button>

            <button
              onClick={() => handleReview(true)}
              className="w-14 h-14 bg-success-green/10 border border-success-green/35 hover:bg-success-green/20 text-success-green rounded-full flex items-center justify-center transition-all hover:scale-105 shadow-md"
              title="Know (Swipe Right)"
            >
              <Check className="w-6 h-6" />
            </button>
          </div>

        </div>
      ) : (
        // Session Complete Screen
        <div className="premium-card p-8 md:p-12 bg-slate-900/40 text-center space-y-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-accent/5 rounded-full blur-[80px]" />
          
          <div className="space-y-3">
            <Award className="w-16 h-16 text-accent mx-auto stroke-[1.5]" />
            <h2 className="font-display text-2xl md:text-3xl font-extrabold text-foreground">Session Complete!</h2>
            <p className="text-sm text-foreground/60 max-w-md mx-auto">
              Your Leitner spaced-repetition card index has been rescheduled. We have pushed new cards into review intervals.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto font-mono text-center">
            <div className="p-4 bg-success-green/10 border border-success-green/20 rounded-2xl">
              <div className="text-2xl font-bold text-success-green">{knowCount}</div>
              <div className="text-[10px] text-foreground/40 uppercase font-semibold mt-1">Know (Recall)</div>
            </div>
            <div className="p-4 bg-error-red/10 border border-error-red/20 rounded-2xl">
              <div className="text-2xl font-bold text-error-red">{dontKnowCount}</div>
              <div className="text-[10px] text-foreground/40 uppercase font-semibold mt-1">Don't Know (Reset)</div>
            </div>
          </div>

          <p className="text-xs text-accent font-mono">🌟 Earned +{(knowCount * 10)} XP points for review recall!</p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-sm mx-auto">
            <Link
              href="/dashboard"
              className="w-full bg-white/5 border border-white/10 hover:border-accent hover:bg-accent/5 text-foreground font-bold py-3.5 rounded-xl transition-all flex items-center justify-center space-x-2 text-xs"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Back to Dashboard</span>
            </Link>
            <button
              onClick={handleRetry}
              className="w-full bg-accent hover:bg-amber-600 text-slate-950 font-bold py-3.5 rounded-xl transition-all flex items-center justify-center space-x-2 text-xs"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Review Deck Again</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
