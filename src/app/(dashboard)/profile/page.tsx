'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { db } from '@/lib/supabase';
import { sfx } from '@/lib/sounds';
import { notifications } from '@/lib/notifications';
import { UserProfile, QuizAttempt } from '@/types';
import { generateReferralCode } from '@/lib/utils';
import { 
  User, 
  Flame, 
  Zap, 
  CheckCircle, 
  Award, 
  Share2, 
  CreditCard, 
  Settings, 
  Sparkles,
  ArrowLeft,
  ChevronRight,
  TrendingUp,
  XCircle,
  Copy
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [loading, setLoading] = useState(true);

  // Settings form states
  const [editName, setEditName] = useState('');
  const [editExam, setEditExam] = useState('UPSC');
  const [editLang, setEditLang] = useState<'en' | 'hi'>('en');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Razorpay Checkout Simulation states
  const [showRazorpayModal, setShowRazorpayModal] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);

  useEffect(() => {
    async function loadProfileData() {
      try {
        const prof = await db.getUserProfile();
        setProfile(prof);
        if (prof) {
          setEditName(prof.name);
          setEditExam(prof.exam_type || 'UPSC');
          setEditLang((prof.preferred_language || 'en') as 'en' | 'hi');
        }

        const quizHistory = await db.getQuizAttempts();
        setAttempts(quizHistory);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadProfileData();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    try {
      const updated = await db.updateUserProfile({
        name: editName,
        exam_type: editExam,
        preferred_language: editLang
      });
      setProfile(updated);
      localStorage.setItem('prepai_language', editLang);
      window.dispatchEvent(new Event('languageChange'));
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  const copyReferralCode = () => {
    if (!profile) return;
    const refCode = profile.referral_code || generateReferralCode();
    navigator.clipboard.writeText(refCode);
    alert(`Referral code "${refCode}" copied to clipboard! Share with other aspirants.`);
  };

  // Razorpay simulation
  const handleUpgradePayment = () => {
    setShowRazorpayModal(true);
  };

  const handleTestNotification = async () => {
    const granted = await notifications.requestPermission();
    if (granted) {
      notifications.sendLocal(
        'Streak Alert! 🔥',
        "Don't lose your progress! Complete today's Indian Polity daily MCQ challenge to maintain your streak."
      );
    } else {
      alert('Please enable notifications permission in your browser/device settings to test push alerts!');
    }
  };

  const submitMockRazorpayPayment = async () => {
    setPaymentLoading(true);
    // Simulate Razorpay checkout frame loading
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    if (profile) {
      const updated = await db.updateUserProfile({
        is_premium: true,
        total_points: profile.total_points + 300 // award gold welcome bonus!
      });
      setProfile(updated);
      setPaymentLoading(false);
      setShowRazorpayModal(false);

      // Trigger Confetti
      sfx.playSuccess();
      notifications.sendLocal(
        'Gold Activated! 🌟',
        'Welcome to LBSNAA Gold tier! +300 XP welcome bonus added.'
      );
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.5 }
      });
    }
  };

  // Calculation of Stats
  const totalQuestionsSolved = attempts.reduce((acc, cur) => acc + cur.total_questions, 0);
  const totalCorrectQuestions = attempts.reduce((acc, cur) => acc + cur.correct_answers, 0);
  const averageAccuracy = totalQuestionsSolved > 0 
    ? Math.round((totalCorrectQuestions / totalQuestionsSolved) * 100) 
    : 0;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-foreground/50 font-light">Retrieving profile portfolio...</p>
      </div>
    );
  }

  // Achievement Badges Configuration
  const achievements = [
    {
      title: 'LBSNAA Bound',
      desc: 'Earn over 1000 total XP points',
      unlocked: (profile?.total_points || 0) >= 1000,
      icon: CrownIcon
    },
    {
      title: 'Consistency Champion',
      desc: 'Maintain a 5-day study streak',
      unlocked: (profile?.streak || 0) >= 5,
      icon: FlameIcon
    },
    {
      title: 'Accuracy Master',
      desc: 'Maintain MCQ accuracy above 75%',
      unlocked: averageAccuracy >= 75 && totalQuestionsSolved >= 5,
      icon: TargetIcon
    }
  ];

  return (
    <div className="space-y-8 font-sans max-w-4xl mx-auto pb-16">
      
      {/* Header Info */}
      <div className="border-b border-white/5 pb-4">
        <Link href="/dashboard" className="text-sm text-foreground/60 hover:text-accent inline-flex items-center space-x-1.5 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span>Dashboard</span>
        </Link>
        <h1 className="font-display text-2xl md:text-3xl font-extrabold text-foreground mt-1">Aspirant Profile</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Left Column: Stats & Badge overview */}
        <div className="space-y-8">
          
          {/* Avatar and Main Info card */}
          <div className="premium-card p-6 bg-slate-900/40 text-center space-y-4">
            <img 
              src={profile?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&q=80'} 
              alt={profile?.name} 
              className="w-20 h-20 rounded-full object-cover mx-auto border-2 border-accent/40"
            />
            <div>
              <h3 className="text-base font-bold text-foreground leading-none">{profile?.name}</h3>
              <span className="text-[10px] text-accent font-mono block mt-1">{profile?.email}</span>
            </div>

            <div className="pt-2">
              {profile?.is_premium ? (
                <div className="inline-flex items-center space-x-1 bg-gradient-to-r from-accent to-amber-500 text-slate-950 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5 fill-slate-950" />
                  <span>Gold Premium</span>
                </div>
              ) : (
                <div className="inline-flex items-center space-x-1 bg-white/5 text-foreground/60 px-3 py-1 rounded-full text-xs font-medium border border-white/10">
                  <span>Free Tier Account</span>
                </div>
              )}
            </div>
          </div>

          {/* Stats Grid */}
          <div className="premium-card p-6 bg-slate-900/40 space-y-4">
            <h4 className="text-xs text-foreground/40 uppercase font-bold tracking-wider font-mono border-b border-white/5 pb-2">Academic Metrics</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-[10px] text-foreground/50 block">Accuracy</span>
                <span className="text-lg font-mono font-bold text-emerald-400">{averageAccuracy}%</span>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-foreground/50 block">Questions Solved</span>
                <span className="text-lg font-mono font-bold text-foreground">{totalQuestionsSolved}</span>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-foreground/50 block">Points (XP)</span>
                <span className="text-lg font-mono font-bold text-accent">{profile?.total_points}</span>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-foreground/50 block">Current Streak</span>
                <span className="text-lg font-mono font-bold text-amber-500">{profile?.streak} days</span>
              </div>
            </div>
          </div>

        </div>

        {/* Right Columns: Subscriptions, referral, and settings form */}
        <div className="md:col-span-2 space-y-8">
          
          {/* Subscription / razorpay card */}
          <div className="premium-card p-6 bg-gradient-to-br from-slate-900 to-primary/40 border-accent/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-[150px] h-[150px] bg-accent/5 rounded-full blur-[40px] pointer-events-none" />
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] text-accent uppercase font-bold tracking-wider font-mono">Premium Upgrade</span>
                <h3 className="text-lg font-bold text-foreground mt-1">LBSNAA Gold Access</h3>
                <p className="text-xs text-foreground/70 font-light mt-1 max-w-sm">
                  Get unlimited standard chapters, GPT-4 doubt solving, and custom MCQ creators.
                </p>
              </div>

              <div>
                {profile?.is_premium ? (
                  <span className="bg-success-green/10 border border-success-green/20 text-emerald-400 text-xs px-3.5 py-2 rounded-xl font-bold uppercase tracking-wider block text-center font-mono">
                    Active Gold
                  </span>
                ) : (
                  <button
                    onClick={handleUpgradePayment}
                    className="w-full bg-accent hover:bg-amber-600 text-slate-950 text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-md shadow-accent/10 flex items-center justify-center space-x-1.5"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Buy Gold (₹199)</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Referral system card */}
          <div className="premium-card p-6 bg-slate-900/40 space-y-4">
            <div>
              <span className="text-[10px] text-accent uppercase font-bold tracking-wider font-mono">Invite Friends</span>
              <h3 className="text-base font-bold text-foreground mt-1">Referral Rewards</h3>
              <p className="text-xs text-foreground/50 font-light mt-1">
                Share your code. Both you and your friend get 7 days of premium access once they complete onboarding.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-1 bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-center font-mono font-bold tracking-widest text-foreground text-base">
                {profile?.referral_code || 'PREPAI99'}
              </div>
              <button
                onClick={copyReferralCode}
                className="bg-white/5 border border-white/10 hover:border-accent hover:text-accent p-3.5 rounded-xl transition-all"
                title="Copy Code"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Achievement badges */}
          <div className="premium-card p-6 bg-slate-900/40 space-y-4">
            <h3 className="text-sm font-bold text-foreground border-b border-white/5 pb-2">Achievement Badges</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {achievements.map((ach, idx) => {
                const Icon = ach.icon;
                return (
                  <div 
                    key={idx} 
                    className={`p-4 rounded-xl border text-center space-y-2 flex flex-col items-center justify-center transition-all ${
                      ach.unlocked 
                        ? 'bg-accent/5 border-accent/30 text-foreground shadow-sm shadow-accent/5' 
                        : 'bg-slate-950/20 border-white/5 opacity-50 grayscale'
                    }`}
                  >
                    <Icon className={`w-8 h-8 ${ach.unlocked ? 'text-accent' : 'text-foreground/40'}`} />
                    <div>
                      <div className="text-xs font-bold leading-tight">{ach.title}</div>
                      <div className="text-[9px] text-foreground/50 mt-0.5 leading-snug">{ach.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Settings panel form */}
          <div className="premium-card p-6 bg-slate-900/40 space-y-4">
            <h3 className="text-sm font-bold text-foreground border-b border-white/5 pb-2">Settings Panel</h3>
            
            {saveSuccess && (
              <div className="p-3 bg-success-green/10 border border-success-green/20 rounded-xl text-xs text-emerald-400">
                Settings saved successfully.
              </div>
            )}

            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-foreground/60 uppercase tracking-wider mb-1">Aspirant Name</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 focus:border-accent text-xs rounded-xl px-3 py-2.5 outline-none text-foreground transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-foreground/60 uppercase tracking-wider mb-1">Target Syllabus</label>
                  <select
                    value={editExam}
                    onChange={(e) => setEditExam(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 focus:border-accent text-xs rounded-xl px-3 py-2.5 outline-none text-foreground transition-all"
                  >
                    <option value="UPSC">UPSC Civil Services</option>
                    <option value="SSC">SSC CGL</option>
                    <option value="CTET">CTET & Teaching</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-foreground/60 uppercase tracking-wider mb-1">Language Preference</label>
                  <select
                    value={editLang}
                    onChange={(e) => setEditLang(e.target.value as 'en' | 'hi')}
                    className="w-full bg-slate-950 border border-white/10 focus:border-accent text-xs rounded-xl px-3 py-2.5 outline-none text-foreground transition-all"
                  >
                    <option value="en">English Only</option>
                    <option value="hi">हिंदी (Bilingual)</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="bg-accent hover:bg-amber-600 text-slate-950 font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-sm"
              >
                Save Settings
              </button>
            </form>

            <div className="border-t border-white/5 pt-4 mt-4 space-y-3">
              <h4 className="text-xs font-bold text-accent font-mono uppercase tracking-wider">System Alerts</h4>
              <p className="text-xs text-foreground/50 font-light">
                Enable local push notifications to get daily streak reminders and quiz results directly on your screen.
              </p>
              <button
                type="button"
                onClick={handleTestNotification}
                className="w-full bg-white/5 border border-white/10 hover:border-accent hover:text-accent text-foreground font-bold text-xs px-4 py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-4 h-4 text-accent animate-pulse" />
                <span>Send Test Push Reminder</span>
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* RAZORPAY PAYMENT SIMULATION MODAL */}
      {showRazorpayModal && (
        <div className="fixed inset-0 z-50 bg-[#0B1325]/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-indigo-500/30 rounded-2xl overflow-hidden shadow-2xl relative">
            
            {/* Razorpay stylized header */}
            <div className="bg-indigo-600 p-6 text-foreground text-center space-y-1 relative">
              <button 
                onClick={() => setShowRazorpayModal(false)}
                className="absolute top-4 right-4 text-foreground/60 hover:text-foreground"
              >
                <XCircle className="w-5 h-5 fill-indigo-600" />
              </button>
              
              <div className="text-[10px] bg-white/10 inline-block px-2.5 py-0.5 rounded-full font-semibold uppercase tracking-widest text-indigo-200">
                Razorpay Checkout
              </div>
              <h3 className="font-display text-lg font-bold">PrepAI Academy</h3>
              <p className="text-xs text-indigo-200 font-light">LBSNAA Gold Premium Upgrade</p>
            </div>

            <div className="p-6 space-y-6">
              <div className="flex justify-between items-center text-xs font-mono border-b border-white/5 pb-3">
                <span className="text-foreground/50">Plan Price:</span>
                <span className="text-foreground font-bold">₹199.00 INR</span>
              </div>
              <div className="flex justify-between items-center text-xs font-mono border-b border-white/5 pb-3">
                <span className="text-foreground/50">XP Welcome Bonus:</span>
                <span className="text-accent font-bold">+300 XP</span>
              </div>

              <div className="space-y-1 text-center py-2">
                <span className="text-[10px] text-foreground/40 block">Secure encryption standard enabled</span>
                <div className="flex justify-center gap-2 text-indigo-400">
                  <CreditCard className="w-5 h-5" />
                  <Sparkles className="w-5 h-5 text-accent" />
                </div>
              </div>

              <button
                onClick={submitMockRazorpayPayment}
                disabled={paymentLoading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-foreground font-bold py-3 rounded-xl transition-all flex items-center justify-center space-x-2 text-xs"
              >
                <span>{paymentLoading ? 'Authenticating Gateway...' : 'Pay ₹199 via Razorpay'}</span>
                {paymentLoading && (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

// Icon Components for badges
function CrownIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7z" />
      <path d="M5 20h14" />
    </svg>
  );
}

function FlameIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
    </svg>
  );
}

function TargetIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}
