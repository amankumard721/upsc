'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { db, supabase } from '@/lib/supabase';
import { 
  Mail, Lock, User, ArrowRight, Sparkles, BookOpen, Award, Share2, CheckCircle, Phone, Fingerprint, ShieldCheck
} from 'lucide-react';

function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') === 'signup' ? 'signup' : 'login';
  
  // States
  const [authMethod, setAuthMethod] = useState<'phone' | 'email'>('phone');
  const [emailTab, setEmailTab] = useState<'login' | 'signup'>(initialTab);
  
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Onboarding states
  const [step, setStep] = useState<'auth' | 'exam' | 'referral' | 'success'>('auth');
  const [examType, setExamType] = useState('UPSC');
  const [referral, setReferral] = useState('');
  const [lang, setLang] = useState<'en' | 'hi'>('en');

  const handleOAuth = async () => {
    setLoading(true);
    setError('');
    try {
      if (supabase) {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: { redirectTo: `${window.location.origin}/dashboard` }
        });
        if (error) throw error;
      } else {
        // Mock
        await db.updateUserProfile({ name: 'Google Aspirant', email: 'aspirant@google.com' });
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      if (!otpSent) {
        // Send OTP
        if (supabase) {
          const { error } = await supabase.auth.signInWithOtp({ phone: `+91${phone}` });
          if (error) throw error;
          setOtpSent(true);
        } else {
          // Mock sending OTP
          setOtpSent(true);
        }
      } else {
        // Verify OTP
        if (supabase) {
          const { data, error } = await supabase.auth.verifyOtp({ phone: `+91${phone}`, token: otp, type: 'sms' });
          if (error) throw error;
          
          // Check if user is new (no name). If new, go to onboarding, else dashboard.
          // For simplicity, we just go to onboarding for all Phone logins in this demo, or direct to dashboard.
          // In a real app we check if profile exists. Let's direct to onboarding.
          setStep('exam');
        } else {
          // Mock verify
          if (otp === '123456') {
            await db.updateUserProfile({ name: `User ${phone.slice(-4)}` });
            setStep('exam');
          } else {
            throw new Error('Invalid OTP (Mock is 123456)');
          }
        }
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      if (emailTab === 'login') {
        if (supabase) {
          const { error } = await supabase.auth.signInWithPassword({ email, password });
          if (error) throw error;
          router.push('/dashboard');
        } else {
          await db.updateUserProfile({ email });
          router.push('/dashboard');
        }
      } else {
        if (supabase) {
          const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { name } } });
          if (error) throw error;
          setStep('exam');
        } else {
          setStep('exam');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleExamNext = () => setStep('referral');

  const handleOnboardingComplete = async () => {
    setLoading(true);
    try {
      const profileUpdates: any = { 
        exam_type: examType,
        preferred_language: lang
      };
      if (name) profileUpdates.name = name;
      if (email) profileUpdates.email = email;
      
      if (referral.trim().toUpperCase() === 'PREPAI99') {
        profileUpdates.is_premium = true;
        profileUpdates.total_points = 500;
      }

      await db.updateUserProfile(profileUpdates);
      localStorage.setItem('prepai_language', lang);
      setStep('success');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#0B1325] text-[#FAF6EC] min-h-screen flex items-center justify-center p-4 relative font-sans">
      <div className="absolute top-0 left-0 right-0 h-[400px] bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30 mix-blend-overlay pointer-events-none" />
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-accent/10 rounded-full blur-[120px] pointer-events-none animate-breathe" />
      
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <Link href="/" className="font-display font-bold text-4xl tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-accent to-amber-500 inline-block drop-shadow-[0_0_15px_rgba(216,155,60,0.4)]">
            Prep<span className="text-foreground font-sans font-light drop-shadow-none">AI</span>
          </Link>
          <p className="text-[10px] text-foreground/50 mt-2 font-mono uppercase tracking-[0.2em] font-medium">Civil Services Academy</p>
        </div>

        <div className="premium-card p-6 sm:p-8 bg-slate-900/60 backdrop-blur-2xl border border-white/10 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
          <AnimatePresence mode="wait">
            {step === 'auth' && (
              <motion.div
                key="auth"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
              >
                {/* Method Switcher */}
                <div className="bg-slate-950/50 p-1 rounded-xl flex mb-6 border border-white/5 relative">
                  <div className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white/10 rounded-lg shadow-sm border border-white/10 transition-all duration-300 ease-out ${authMethod === 'phone' ? 'left-1' : 'left-[calc(50%+3px)]'}`} />
                  
                  <button
                    onClick={() => setAuthMethod('phone')}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg z-10 transition-colors flex justify-center items-center gap-2 ${authMethod === 'phone' ? 'text-foreground' : 'text-foreground/40 hover:text-foreground/70'}`}
                  >
                    <Phone className="w-3.5 h-3.5" /> Mobile
                  </button>
                  <button
                    onClick={() => setAuthMethod('email')}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg z-10 transition-colors flex justify-center items-center gap-2 ${authMethod === 'email' ? 'text-foreground' : 'text-foreground/40 hover:text-foreground/70'}`}
                  >
                    <Mail className="w-3.5 h-3.5" /> Email
                  </button>
                </div>

                {error && (
                  <div className="mb-5 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 font-medium flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 shrink-0" />
                    {error}
                  </div>
                )}

                {/* --- PHONE AUTH --- */}
                {authMethod === 'phone' && (
                  <form onSubmit={handlePhoneSubmit} className="space-y-4">
                    {!otpSent ? (
                      <div>
                        <label className="block text-[10px] font-bold text-foreground/50 uppercase tracking-widest mb-1.5 ml-1">Phone Number</label>
                        <div className="relative flex items-center bg-slate-950 border border-white/10 focus-within:border-accent/70 rounded-xl transition-all overflow-hidden group">
                          <div className="pl-4 pr-3 py-3 border-r border-white/10 text-foreground/50 font-mono text-sm group-focus-within:text-accent transition-colors">
                            +91
                          </div>
                          <input
                            type="tel"
                            required
                            maxLength={10}
                            value={phone}
                            onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                            placeholder="98765 43210"
                            className="w-full bg-transparent text-sm pl-3 pr-4 py-3 outline-none font-mono tracking-widest placeholder:text-foreground/20"
                          />
                        </div>
                      </div>
                    ) : (
                      <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}>
                        <label className="block text-[10px] font-bold text-foreground/50 uppercase tracking-widest mb-1.5 ml-1 flex justify-between">
                          <span>Enter OTP</span>
                          <button type="button" onClick={() => setOtpSent(false)} className="text-accent hover:underline">Change Number</button>
                        </label>
                        <div className="relative">
                          <Fingerprint className="absolute left-4 top-3.5 w-4 h-4 text-foreground/30" />
                          <input
                            type="text"
                            required
                            maxLength={6}
                            value={otp}
                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                            placeholder="••••••"
                            className="w-full bg-slate-950 border border-white/10 focus:border-accent text-center tracking-[1em] text-lg font-mono rounded-xl pl-12 pr-4 py-2.5 outline-none transition-all placeholder:tracking-normal placeholder:text-sm"
                          />
                        </div>
                      </motion.div>
                    )}

                    <button
                      type="submit"
                      disabled={loading || (otpSent && otp.length < 6) || (!otpSent && phone.length < 10)}
                      className="w-full bg-gradient-to-r from-accent to-amber-600 hover:from-amber-500 hover:to-amber-500 text-slate-950 font-extrabold py-3.5 rounded-xl transition-all shadow-[0_5px_15px_rgba(216,155,60,0.2)] hover:shadow-[0_5px_20px_rgba(216,155,60,0.4)] flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                    >
                      <span>{otpSent ? 'Verify Securely' : 'Send OTP'}</span>
                      {loading ? (
                        <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin ml-2" />
                      ) : (
                        <ArrowRight className="w-4 h-4 ml-1" />
                      )}
                    </button>
                  </form>
                )}

                {/* --- EMAIL AUTH --- */}
                {authMethod === 'email' && (
                  <form onSubmit={handleEmailSubmit} className="space-y-4">
                    {/* Sub-tabs for Email */}
                    <div className="flex gap-4 mb-2 ml-1">
                      <button type="button" onClick={() => setEmailTab('login')} className={`text-xs font-bold uppercase tracking-wider transition-colors ${emailTab === 'login' ? 'text-accent' : 'text-foreground/30 hover:text-foreground/60'}`}>Sign In</button>
                      <button type="button" onClick={() => setEmailTab('signup')} className={`text-xs font-bold uppercase tracking-wider transition-colors ${emailTab === 'signup' ? 'text-accent' : 'text-foreground/30 hover:text-foreground/60'}`}>Sign Up</button>
                    </div>

                    {emailTab === 'signup' && (
                      <div>
                        <div className="relative">
                          <User className="absolute left-4 top-3.5 w-4 h-4 text-foreground/30" />
                          <input
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Full Name"
                            className="w-full bg-slate-950 border border-white/10 focus:border-accent text-sm rounded-xl pl-11 pr-4 py-3 outline-none transition-all placeholder:text-foreground/30"
                          />
                        </div>
                      </div>
                    )}

                    <div>
                      <div className="relative">
                        <Mail className="absolute left-4 top-3.5 w-4 h-4 text-foreground/30" />
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="Email Address"
                          className="w-full bg-slate-950 border border-white/10 focus:border-accent text-sm rounded-xl pl-11 pr-4 py-3 outline-none transition-all placeholder:text-foreground/30"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="relative">
                        <Lock className="absolute left-4 top-3.5 w-4 h-4 text-foreground/30" />
                        <input
                          type="password"
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Password"
                          className="w-full bg-slate-950 border border-white/10 focus:border-accent text-sm rounded-xl pl-11 pr-4 py-3 outline-none transition-all placeholder:text-foreground/30"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-white/10 hover:bg-white/20 border border-white/10 text-foreground font-bold py-3 rounded-xl transition-all flex items-center justify-center space-x-2 mt-2"
                    >
                      <span>{emailTab === 'login' ? 'Sign In with Email' : 'Create Account'}</span>
                      {loading ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin ml-2" />
                      ) : (
                        <ArrowRight className="w-4 h-4 ml-1" />
                      )}
                    </button>
                  </form>
                )}

                {/* Google Sign-in */}
                <div className="relative my-7">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5" /></div>
                  <div className="relative flex justify-center text-[9px] font-bold tracking-widest uppercase"><span className="bg-slate-900 px-3 text-foreground/30">Or Connect</span></div>
                </div>

                <button
                  type="button"
                  onClick={handleOAuth}
                  className="w-full border border-white/10 bg-white/5 hover:bg-white/10 text-foreground font-bold py-3.5 rounded-xl transition-all flex items-center justify-center space-x-3 text-sm shadow-sm"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  <span>Continue with Google</span>
                </button>
              </motion.div>
            )}

            {/* --- ONBOARDING STEPS --- */}
            {step === 'exam' && (
              <motion.div
                key="exam"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center mx-auto mb-3">
                    <Award className="w-7 h-7 text-accent" />
                  </div>
                  <h3 className="text-lg font-bold font-display text-foreground">Set Up Your Profile</h3>
                  <p className="text-xs text-foreground/50 mt-1 font-light leading-relaxed px-4">Choose your target exam and study language to customize your dashboard.</p>
                </div>

                <div className="space-y-4">
                  {/* Exam Selection */}
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-foreground/50 uppercase tracking-widest ml-1">
                      Select Target Exam / लक्ष्य परीक्षा
                    </label>
                    <div className="space-y-2">
                      {[
                        { id: 'UPSC', name: 'UPSC Civil Services (IAS/IFS)', desc: 'Standard syllabus coverage & current affairs' },
                        { id: 'SSC', name: 'SSC CGL & Allied Exams', desc: 'Quantitative, logical reasoning, and static GK' },
                        { id: 'CTET', name: 'CTET & Teaching Exams', desc: 'Pedagogy and child development tests' }
                      ].map((exam) => (
                        <button
                          key={exam.id}
                          type="button"
                          onClick={() => setExamType(exam.id)}
                          className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                            examType === exam.id
                              ? 'border-accent bg-accent/10 shadow-[0_0_12px_rgba(216,155,60,0.1)]'
                              : 'border-white/5 bg-slate-950/40 hover:bg-slate-950/80 hover:border-white/10'
                          }`}
                        >
                          <div className={`font-bold text-xs ${examType === exam.id ? 'text-foreground' : 'text-foreground/80'}`}>{exam.name}</div>
                          <div className="text-[10px] text-foreground/45 mt-0.5 font-light">{exam.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Language Selection */}
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-foreground/50 uppercase tracking-widest ml-1">
                      Preferred Language / भाषा चुनें
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setLang('en')}
                        className={`p-3 rounded-xl border text-center font-bold text-xs transition-all ${
                          lang === 'en'
                            ? 'border-accent bg-accent/10 shadow-[0_0_12px_rgba(216,155,60,0.1)] text-foreground'
                            : 'border-white/5 bg-slate-950/40 hover:bg-slate-950/80 hover:border-white/10 text-foreground/70'
                        }`}
                      >
                        🇬🇧 English Only
                      </button>
                      <button
                        type="button"
                        onClick={() => setLang('hi')}
                        className={`p-3 rounded-xl border text-center font-bold text-xs transition-all ${
                          lang === 'hi'
                            ? 'border-accent bg-accent/10 shadow-[0_0_12px_rgba(216,155,60,0.1)] text-foreground'
                            : 'border-white/5 bg-slate-950/40 hover:bg-slate-950/80 hover:border-white/10 text-foreground/70'
                        }`}
                      >
                        🇮🇳 हिंदी (Bilingual)
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleExamNext}
                  className="w-full bg-accent hover:bg-amber-500 text-slate-950 font-bold py-3.5 rounded-xl transition-all flex items-center justify-center space-x-2 shadow-[0_5px_15px_rgba(216,155,60,0.2)]"
                >
                  <span>Continue Setup</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
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
                  <div className="w-16 h-16 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="w-8 h-8 text-indigo-400" />
                  </div>
                  <h3 className="text-xl font-bold font-display text-foreground">Unlock Premium</h3>
                  <p className="text-xs text-foreground/50 mt-1.5 font-light leading-relaxed px-4">Enter a friend's invite code to instantly get 7 days of Gold access.</p>
                </div>

                <div className="pt-2">
                  <input
                    type="text"
                    value={referral}
                    onChange={(e) => setReferral(e.target.value)}
                    placeholder="Enter Code (e.g. PREPAI99)"
                    className="w-full bg-slate-950/80 border border-white/15 focus:border-indigo-400 focus:shadow-[0_0_15px_rgba(99,102,241,0.2)] text-center font-mono font-bold tracking-widest text-lg rounded-xl py-4 outline-none transition-all placeholder:font-sans placeholder:text-sm placeholder:tracking-normal placeholder:font-light"
                  />
                  <div className="text-center text-[10px] text-indigo-300 mt-3 font-mono">
                    Try code: <span className="font-bold border-b border-indigo-400/40 cursor-pointer" onClick={() => setReferral('PREPAI99')}>PREPAI99</span> for trial unlock.
                  </div>
                </div>

                <div className="flex space-x-3 pt-2">
                  <button
                    onClick={() => {
                      setReferral('');
                      handleOnboardingComplete();
                    }}
                    className="flex-1 border border-white/10 hover:bg-white/5 text-foreground/70 hover:text-foreground font-medium py-3.5 rounded-xl transition-all"
                  >
                    Skip
                  </button>
                  <button
                    onClick={handleOnboardingComplete}
                    disabled={loading}
                    className="flex-1 bg-indigo-500 hover:bg-indigo-400 text-foreground font-bold py-3.5 rounded-xl transition-all flex items-center justify-center space-x-2 shadow-[0_5px_15px_rgba(99,102,241,0.3)]"
                  >
                    <span>Finish</span>
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin ml-2" />
                    ) : (
                      <ArrowRight className="w-4 h-4 ml-1" />
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
                className="text-center space-y-6 py-6"
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-success-green/20 rounded-full blur-xl animate-pulse" />
                  <CheckCircle className="w-20 h-20 text-success-green mx-auto stroke-[1.5] relative z-10" />
                </div>
                
                <div>
                  <h3 className="text-2xl font-bold text-foreground font-display">You're All Set!</h3>
                  <p className="text-sm text-foreground/60 mt-2 font-light leading-relaxed">
                    Your <strong className="text-foreground font-semibold">{examType}</strong> syllabus account has been customized.
                  </p>
                  {referral.trim().toUpperCase() === 'PREPAI99' && (
                    <div className="mt-4 p-3 bg-accent/10 border border-accent/20 rounded-xl">
                      <span className="block text-accent font-semibold text-xs tracking-wide">
                        🌟 7-Days Gold Premium Activated! (+500 XP)
                      </span>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => router.push('/dashboard')}
                  className="w-full bg-accent hover:bg-amber-500 text-slate-950 font-bold py-4 rounded-xl transition-all flex items-center justify-center space-x-2 shadow-[0_5px_15px_rgba(216,155,60,0.2)] mt-4"
                >
                  <span>Enter Dashboard</span>
                  <ArrowRight className="w-5 h-5 ml-1" />
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
