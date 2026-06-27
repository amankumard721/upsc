'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/supabase';
import { Chapter, MCQ, QuizAttempt, UserProfile } from '@/types';
import { 
  ArrowLeft, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Award, 
  Share2, 
  RotateCcw, 
  LayoutDashboard,
  AlertCircle,
  HelpCircle,
  ChevronRight,
  TrendingUp
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface QuizPageProps {
  params: Promise<{ chapterId: string }>;
}

export default function MCQQuizPage({ params }: QuizPageProps) {
  const router = useRouter();
  const { chapterId } = use(params);

  // States
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [mcqs, setMcqs] = useState<MCQ[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Quiz execution states
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOpt, setSelectedOpt] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [answersState, setAnswersState] = useState<{ [key: number]: { selected: string; isCorrect: boolean; score: number } }>({});
  
  // Game metrics
  const [quizFinished, setQuizFinished] = useState(false);
  const [finalAttempt, setFinalAttempt] = useState<QuizAttempt | null>(null);

  // Load chapter and MCQs
  useEffect(() => {
    async function loadQuizData() {
      try {
        const ch = await db.getChapter(chapterId);
        if (!ch) {
          setLoading(false);
          return;
        }
        setChapter(ch);

        const chMcqs = await db.getMCQs(chapterId);
        setMcqs(chMcqs);

        const prof = await db.getUserProfile();
        setProfile(prof);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadQuizData();
  }, [chapterId]);

  // Timer loop
  useEffect(() => {
    if (loading || quizFinished || isAnswered || mcqs.length === 0) return;

    if (timeLeft <= 0) {
      // Time is up! Treat as incorrect/missed
      handleAnswerSelect('NONE');
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLeft, isAnswered, quizFinished, loading, mcqs]);

  // Trigger answer evaluation
  const handleAnswerSelect = (option: string) => {
    if (isAnswered) return;
    
    setSelectedOpt(option);
    setIsAnswered(true);

    const currentMcq = mcqs[currentIdx];
    const isCorrect = option === currentMcq.correct_option;
    const scoreVal = isCorrect ? 2.0 : -0.5;

    // Save answer state
    setAnswersState(prev => ({
      ...prev,
      [currentIdx]: {
        selected: option,
        isCorrect,
        score: scoreVal
      }
    }));
  };

  const handleNextQuestion = () => {
    if (currentIdx + 1 < mcqs.length) {
      setCurrentIdx(prev => prev + 1);
      setSelectedOpt(null);
      setIsAnswered(false);
      setTimeLeft(30);
    } else {
      finishQuiz();
    }
  };

  const finishQuiz = async () => {
    if (!chapter || mcqs.length === 0) return;

    // Calculate aggregate scores
    let correctCount = 0;
    let totalQuizScore = 0;

    Object.keys(answersState).forEach((key: any) => {
      const state = answersState[key];
      if (state.isCorrect) correctCount++;
      totalQuizScore += state.score;
    });

    const elapsedSeconds = 30 * mcqs.length; // rough estimate or we can accumulate

    const attemptData = {
      chapter_id: chapter.id,
      total_questions: mcqs.length,
      correct_answers: correctCount,
      score: Number(totalQuizScore.toFixed(1)),
      time_taken_seconds: elapsedSeconds
    };

    // Save attempt (handles XP award internally)
    const savedAttempt = await db.saveQuizAttempt(attemptData);
    setFinalAttempt(savedAttempt);
    setQuizFinished(true);

    // Trigger premium confetti
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  const handleRetry = () => {
    setCurrentIdx(0);
    setSelectedOpt(null);
    setIsAnswered(false);
    setTimeLeft(30);
    setAnswersState({});
    setQuizFinished(false);
    setFinalAttempt(null);
  };

  const handleShare = () => {
    if (!finalAttempt || !chapter) return;
    const text = `🎯 I scored ${finalAttempt.score} pts (${finalAttempt.correct_answers}/${finalAttempt.total_questions} correct) in the UPSC Chapter Quiz: "${chapter.title}" on PrepAI! Join the AI learning dashboard today.`;
    navigator.clipboard.writeText(text);
    alert('Score board copy pasted to your clipboard! Share with your friends on Twitter/WhatsApp.');
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-white/50 font-light">Assembling OMR sheet questions...</p>
      </div>
    );
  }

  if (mcqs.length === 0) {
    return (
      <div className="text-center py-16 space-y-4">
        <p className="text-white/60">No MCQs seeded for this chapter yet.</p>
        <Link href={`/lesson/${chapterId}`} className="text-accent underline inline-flex items-center space-x-1">
          <ArrowLeft className="w-4 h-4" />
          <span>Go back to lesson</span>
        </Link>
      </div>
    );
  }

  const activeMcq = mcqs[currentIdx];

  return (
    <div className="space-y-8 font-sans max-w-4xl mx-auto pb-16">
      {/* Header info */}
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <Link href={`/lesson/${chapterId}`} className="text-sm text-white/60 hover:text-accent inline-flex items-center space-x-1.5 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span>Exit Quiz</span>
        </Link>
        <span className="font-display font-bold text-lg text-accent">OMR Mock Test</span>
      </div>

      {!quizFinished ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Main Question Card (Left 3 columns) */}
          <div className="md:col-span-3 space-y-6">
            <div className="premium-card p-6 md:p-8 bg-slate-900/40 border border-white/10 rounded-2xl relative">
              
              {/* Question header badges */}
              <div className="flex items-center justify-between mb-6">
                <span className="text-[10px] text-white/40 font-mono">
                  Question {currentIdx + 1} of {mcqs.length}
                </span>

                <div className="flex items-center space-x-2">
                  {/* Difficulty Badge */}
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border ${
                    activeMcq.difficulty === 'Easy' ? 'bg-success-green/10 text-emerald-400 border-success-green/20' :
                    activeMcq.difficulty === 'Medium' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                    'bg-error-red/10 text-red-400 border-error-red/20'
                  }`}>
                    {activeMcq.difficulty}
                  </span>

                  {/* Previous year asked */}
                  {activeMcq.year_asked && (
                    <span className="text-[9px] font-bold bg-accent/15 text-accent border border-accent/25 px-2 py-0.5 rounded-full font-mono uppercase tracking-wider">
                      UPSC {activeMcq.year_asked}
                    </span>
                  )}
                </div>
              </div>

              {/* Question Statement */}
              <h2 className="text-base md:text-lg font-medium text-white leading-relaxed mb-6">
                {activeMcq.question}
              </h2>

              {/* Options */}
              <div className="space-y-3">
                {[
                  { key: 'A', text: activeMcq.option_a },
                  { key: 'B', text: activeMcq.option_b },
                  { key: 'C', text: activeMcq.option_c },
                  { key: 'D', text: activeMcq.option_d }
                ].map((opt) => {
                  const isSelected = selectedOpt === opt.key;
                  const isCorrect = opt.key === activeMcq.correct_option;
                  
                  let optionStyle = 'border-white/10 bg-slate-950/40 hover:bg-slate-950/80';
                  if (isAnswered) {
                    if (isCorrect) {
                      optionStyle = 'border-success-green bg-success-green/15 text-white';
                    } else if (isSelected) {
                      optionStyle = 'border-error-red bg-error-red/15 text-white';
                    } else {
                      optionStyle = 'border-white/5 opacity-50 bg-slate-950/20';
                    }
                  }

                  return (
                    <button
                      key={opt.key}
                      disabled={isAnswered}
                      onClick={() => handleAnswerSelect(opt.key)}
                      className={`w-full text-left p-4 rounded-xl border text-xs md:text-sm transition-all flex items-start gap-3 ${optionStyle}`}
                    >
                      <span className="font-mono font-bold bg-white/5 px-2 py-0.5 rounded border border-white/10 text-[11px] text-accent mt-0.5">
                        {opt.key}
                      </span>
                      <span className="flex-1">{opt.text}</span>
                    </button>
                  );
                })}
              </div>

              {/* Explanation panel */}
              {isAnswered && (
                <div className="mt-6 p-4 bg-white/5 border border-white/15 rounded-2xl space-y-2">
                  <div className="flex items-center space-x-1.5 font-bold text-xs uppercase">
                    {selectedOpt === activeMcq.correct_option ? (
                      <span className="text-success-green flex items-center gap-1">
                        <CheckCircle className="w-4 h-4 fill-success-green/10" /> Correct (+2.0 points)
                      </span>
                    ) : (
                      <span className="text-error-red flex items-center gap-1">
                        <XCircle className="w-4 h-4 fill-error-red/10" /> Incorrect (-0.5 points)
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-white/70 font-light leading-relaxed">
                    <span className="font-bold text-accent">Explanation:</span> {activeMcq.explanation}
                  </p>

                  <button
                    onClick={handleNextQuestion}
                    className="mt-4 bg-accent hover:bg-amber-600 text-slate-950 text-xs font-bold px-4 py-2.5 rounded-xl transition-all flex items-center justify-center space-x-1.5 ml-auto"
                  >
                    <span>{currentIdx + 1 === mcqs.length ? 'Finish Quiz' : 'Next Question'}</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}

            </div>
          </div>

          {/* OMR bubble sheet / Status (Right 1 column) */}
          <div className="space-y-6">
            
            {/* Timer card */}
            <div className="premium-card p-5 bg-slate-900/40 text-center space-y-2">
              <span className="text-[10px] text-white/40 font-mono uppercase">OMR Time Remaining</span>
              <div className="flex items-center justify-center space-x-2 text-2xl font-mono font-bold">
                <Clock className={`w-6 h-6 ${timeLeft <= 10 ? 'text-error-red animate-pulse' : 'text-accent'}`} />
                <span className={timeLeft <= 10 ? 'text-error-red' : 'text-white'}>{timeLeft}s</span>
              </div>
            </div>

            {/* OMR bubble sheet grid */}
            <div className="premium-card p-5 bg-slate-900/40 space-y-4">
              <div className="text-center pb-2 border-b border-white/5">
                <span className="text-[10px] text-white/40 font-mono uppercase">OMR Sheet Bubbles</span>
              </div>
              <div className="grid grid-cols-5 gap-3">
                {mcqs.map((_, idx) => {
                  const state = answersState[idx];
                  const isActive = idx === currentIdx;
                  
                  let bubbleClass = 'border-white/10 bg-slate-950/20 text-white/40';
                  if (isActive) {
                    bubbleClass = 'border-accent bg-accent/15 text-accent font-bold ring-1 ring-accent/30';
                  } else if (state) {
                    bubbleClass = state.isCorrect 
                      ? 'border-success-green bg-success-green/20 text-emerald-400 font-bold' 
                      : 'border-error-red bg-error-red/20 text-red-400 font-bold';
                  }

                  return (
                    <div 
                      key={idx} 
                      className={`w-9 h-9 rounded-full border flex items-center justify-center text-xs font-mono transition-all ${bubbleClass}`}
                    >
                      {idx + 1}
                    </div>
                  );
                })}
              </div>
              
              <div className="text-[9px] text-white/30 space-y-1.5 pt-2 border-t border-white/5 font-mono">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-success-green/20 border border-success-green/40 inline-block" />
                  <span>Correct: +2.0</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-error-red/20 border border-error-red/40 inline-block" />
                  <span>Incorrect: -0.5</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      ) : (
        // Score Report Screen
        <div className="premium-card p-8 md:p-12 bg-slate-900/40 text-center space-y-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-accent/5 rounded-full blur-[80px]" />
          
          <div className="space-y-3">
            <Award className="w-16 h-16 text-accent mx-auto stroke-[1.5]" />
            <h2 className="font-display text-2xl md:text-3xl font-extrabold text-white">Quiz Completed!</h2>
            <p className="text-sm text-white/60 max-w-md mx-auto">
              You resolved the OMR sheet evaluation check-in. Detailed score metrics calculated.
            </p>
          </div>

          {/* Core Score Statistics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto">
            <div className="p-4 bg-slate-950/40 border border-white/5 rounded-2xl">
              <div className="font-mono text-xl font-bold text-accent">{finalAttempt?.score}</div>
              <div className="text-[10px] text-white/40 uppercase font-semibold mt-1">Final Score</div>
            </div>
            <div className="p-4 bg-slate-950/40 border border-white/5 rounded-2xl">
              <div className="font-mono text-xl font-bold text-emerald-400">
                {finalAttempt?.correct_answers} / {finalAttempt?.total_questions}
              </div>
              <div className="text-[10px] text-white/40 uppercase font-semibold mt-1">Correct answers</div>
            </div>
            <div className="p-4 bg-slate-950/40 border border-white/5 rounded-2xl">
              <div className="font-mono text-xl font-bold text-red-400">
                {mcqs.length - (finalAttempt?.correct_answers || 0)}
              </div>
              <div className="text-[10px] text-white/40 uppercase font-semibold mt-1">Incorrect</div>
            </div>
            <div className="p-4 bg-slate-950/40 border border-white/5 rounded-2xl">
              <div className="font-mono text-xl font-bold text-white">
                {Math.round(((finalAttempt?.correct_answers || 0) / mcqs.length) * 100)}%
              </div>
              <div className="text-[10px] text-white/40 uppercase font-semibold mt-1">Accuracy</div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-sm mx-auto">
            <button
              onClick={handleShare}
              className="w-full bg-white/5 border border-white/10 hover:border-accent hover:bg-accent/5 text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center space-x-2 text-xs"
            >
              <Share2 className="w-4 h-4" />
              <span>Share Score Card</span>
            </button>
            <button
              onClick={handleRetry}
              className="w-full bg-accent hover:bg-amber-600 text-slate-950 font-bold py-3.5 rounded-xl transition-all flex items-center justify-center space-x-2 text-xs"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Retry Test Paper</span>
            </button>
          </div>

          <div className="border-t border-white/5 pt-6 max-w-md mx-auto">
            <Link 
              href={`/lesson/${chapterId}`}
              className="text-xs text-accent hover:text-white transition-colors underline flex items-center justify-center space-x-1"
            >
              <span>Go back to Chapter reading player</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
