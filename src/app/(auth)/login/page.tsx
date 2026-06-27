'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { db, supabase } from '@/lib/supabase';
import { 
  Mail, 
  Lock, 
  User, 
  ArrowRight, 
  Sparkles,
  BookOpen,
  Award,
  Share2,
  CheckCircle
} from 'lucide-react';

function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') === 'signup' ? 'signup' : 'login';
  
  const [tab, setTab] = useState<'login' | 'signup'>(initialTab);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Onboarding states
  const [step, setStep] = useState<'auth' | 'exam' | 'referral' | 'success'>('auth');
  const [examType, setExamType] = useState('UPSC');
  const [referral, setReferral] = useState('');

  const handleOAuth = async () => {
    setLoading(true);
    setError('');
    try {
      if (supabase) {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: `${window.location.origin}/dashboard`
          }
        });
        if (error) throw error;
      } else {
        // Mock login
        const profile = await db.getUserProfile();
        await db.updateUserProfile({ name: 'Google Aspirant', email: 'aspirant@google.com' });
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      if (tab === 'login') {
        if (supabase) {
          const { error } = await supabase.auth.signInWithPassword({ email, password });
          if (error) throw error;
          router.push('/dashboard');
        } else {
          // Mock login
          const profile = await db.getUserProfile();
          await db.updateUserProfile({ email });
          router.push('/dashboard');
        }
      } else {
        // Sign Up flow -> goes to onboarding
        if (supabase) {
          const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { name } } });
          if (error) throw error;
          // Go to onboarding steps for real DB too
          setStep('exam');
        } else {
          // Mock Sign Up -> Go to onboarding
          setStep('exam');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
      setLoading(false);
    }
  };

  const handleExamNext = () => {
    setStep('referral');
  };

  const handleOnboardingComplete = async () => {
    setLoading(true);
    try {
      // Save onboarding choices to database
      const profileUpdates: any = {
        exam_type: examType,
      };
      
      if (name) profileUpdates.name = name;
      if (email) profileUpdates.email = email;
      
      // If a valid referral code was entered, give 7 days premium!
      if (referral.trim().toUpperCase() === 'PREPAI99') {
        profileUpdates.is_premium = true;
        profileUpdates.total_points = 500; // Reward bonus points
      }

      await db.updateUserProfile(profileUpdates);
      setStep('success');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#0B1325] text-[#FAF6EC] min-h-screen flex items-center justify-center p-4 relative font-sans">
      <div className="absolute top-0 left-0 right-0 h-[300px] bg-gradient-to-b from-primary/20 to-transparent pointer-events-none" />
      
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <Link href="/" className="font-display font-bold text-3xl tracking-tight text-accent inline-block">
            Prep<span className="text-white font-sans font-light">AI</span>
          </Link>
          <p className="text-xs text-white/50 mt-1.5 font-mono uppercase tracking-widest">Civil Services Academy</p>
        </div>

        <div className="premium-card p-8 bg-slate-900/40 border border-white/10 rounded-2xl shadow-xl">
          <AnimatePresence mode="wait">
            {step === 'auth' && (
              <motion.div
                key="auth"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
              >
                {/* Tabs */}
                <div className="flex border-b border-white/10 mb-6">
                  <button
                    onClick={() => setTab('login')}
                    className={`flex-1 pb-3 text-center text-sm font-semibold transition-all ${
                      tab === 'login' ? 'text-accent border-b-2 border-accent' : 'text-white/50'
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => setTab('signup')}
                    className={`flex-1 pb-3 text-center text-sm font-semibold transition-all ${
                      tab === 'signup' ? 'text-accent border-b-2 border-accent' : 'text-white/50'
                    }`}
                  >
                    Create Account
                  </button>
                </div>

                {error && (
                  <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400">
                    {error}
                  </div>
                )}

                <form onSubmit={handleAuthSubmit} className="space-y-4">
                  {tab === 'signup' && (
                    <div>
                      <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-1">Full Name</label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 w-4 h-4 text-white/40" />
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="e.g. Aniket Sharma"
                          className="w-full bg-slate-950 border border-white/15 focus:border-accent text-sm rounded-xl pl-10 pr-4 py-2.5 outline-none transition-all"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-1">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 w-4 h-4 text-white/40" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="aspirant@upsc.gov.in"
                        className="w-full bg-slate-950 border border-white/15 focus:border-accent text-sm rounded-xl pl-10 pr-4 py-2.5 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-1">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 w-4 h-4 text-white/40" />
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-slate-950 border border-white/15 focus:border-accent text-sm rounded-xl pl-10 pr-4 py-2.5 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-accent hover:bg-amber-600 text-slate-950 font-bold py-3 rounded-xl transition-all flex items-center justify-center space-x-2"
                  >
                    <span>{tab === 'login' ? 'Sign In' : 'Continue to Onboarding'}</span>
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <ArrowRight className="w-4 h-4" />
                    )}
                  </button>
                </form>

                {/* Google Sign-in */}
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10" /></div>
                  <div className="relative flex justify-center text-xs uppercase"><span className="bg-slate-900/40 px-2.5 text-white/40">Or continue with</span></div>
                </div>

                <button
                  type="button"
                  onClick={handleOAuth}
                  className="w-full border border-white/15 bg-white/5 hover:bg-white/10 text-white font-medium py-2.5 rounded-xl transition-all flex items-center justify-center space-x-2.5 text-sm"
                >
                  <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  <span>Sign In with Google</span>
                </button>
              </motion.div>
            )}

            {step === 'exam' && (
              <motion.div
                key="exam"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <Award className="w-12 h-12 text-accent mx-auto mb-3" />
                  <h3 className="text-lg font-bold text-white">Choose Your Target Exam</h3>
                  <p className="text-xs text-white/50 mt-1">We will tailor your learning syllabus and MCQ recommendations.</p>
                </div>

                <div className="space-y-3">
                  {[
                    { id: 'UPSC', name: 'UPSC Civil Services (IAS/IFS)', desc: 'Recommended - Full syllabus coverage & Standard reference books' },
                    { id: 'SSC', name: 'SSC CGL & Allied Exams', desc: 'Quantitative, logical reasoning, and static GK focus' },
                    { id: 'CTET', name: 'CTET & Teaching Exams', desc: 'Pedagogy, child development, and basic subject tests' }
                  ].map((exam) => (
                    <button
                      key={exam.id}
                      onClick={() => setExamType(exam.id)}
                      className={`w-full text-left p-4 rounded-xl border transition-all ${
                        examType === exam.id
                          ? 'border-accent bg-accent/5 text-white'
                          : 'border-white/10 bg-slate-950/40 text-white/70 hover:bg-slate-950/80'
                      }`}
                    >
                      <div className="font-bold text-sm">{exam.name}</div>
                      <div className="text-xs text-white/40 mt-1 font-light">{exam.desc}</div>
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleExamNext}
                  className="w-full bg-accent hover:bg-amber-600 text-slate-950 font-bold py-3 rounded-xl transition-all flex items-center justify-center space-x-2"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </motion.div>
            )}

            {step === 'referral' && (
              <motion.div
                key="referral"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <Share2 className="w-12 h-12 text-accent mx-auto mb-3" />
                  <h3 className="text-lg font-bold text-white">Have a Referral Code?</h3>
                  <p className="text-xs text-white/50 mt-1">Enter your friend’s referral code to instantly unlock 7 days of Premium Gold access!</p>
                </div>

                <div>
                  <input
                    type="text"
                    value={referral}
                    onChange={(e) => setReferral(e.target.value)}
                    placeholder="Enter referral code (e.g. PREPAI99)"
                    className="w-full bg-slate-950 border border-white/15 focus:border-accent text-center font-mono font-bold tracking-widest text-lg rounded-xl py-3.5 outline-none transition-all placeholder:font-sans placeholder:text-sm placeholder:tracking-normal placeholder:font-light"
                  />
                  <div className="text-center text-[10px] text-accent/80 mt-2 font-mono">
                    Try code: <span className="font-bold border-b border-accent/40 cursor-pointer" onClick={() => setReferral('PREPAI99')}>PREPAI99</span> for trial unlock.
                  </div>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      setReferral('');
                      handleOnboardingComplete();
                    }}
                    className="flex-1 border border-white/15 hover:bg-white/5 text-white font-medium py-3 rounded-xl transition-all"
                  >
                    Skip
                  </button>
                  <button
                    onClick={handleOnboardingComplete}
                    disabled={loading}
                    className="flex-1 bg-accent hover:bg-amber-600 text-slate-950 font-bold py-3 rounded-xl transition-all flex items-center justify-center space-x-2"
                  >
                    <span>Finish</span>
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <ArrowRight className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </motion.div>
            )}

            {step === 'success' && (
              <motion.div
                key="success"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center space-y-6 py-4"
              >
                <CheckCircle className="w-16 h-16 text-success-green mx-auto stroke-[1.5]" />
                <div>
                  <h3 className="text-xl font-bold text-white">Welcome to PrepAI!</h3>
                  <p className="text-sm text-white/60 mt-2 font-light">
                    Your {examType} syllabus account has been customized.
                    {referral.trim().toUpperCase() === 'PREPAI99' && (
                      <span className="block text-accent font-semibold mt-2">
                        🌟 7-Days Gold Premium Activated! (+500 XP rewarded)
                      </span>
                    )}
                  </p>
                </div>

                <button
                  onClick={() => router.push('/dashboard')}
                  className="w-full bg-accent hover:bg-amber-600 text-slate-950 font-bold py-3 rounded-xl transition-all flex items-center justify-center space-x-2"
                >
                  <span>Enter Study Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div className="bg-[#0B1325] text-[#FAF6EC] min-h-screen flex items-center justify-center p-4">
        <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <AuthContent />
    </Suspense>
  );
}
