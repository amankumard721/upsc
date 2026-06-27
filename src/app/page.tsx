'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  Sparkles, 
  BookOpen, 
  Cpu, 
  Award, 
  ArrowRight, 
  Volume2, 
  HelpCircle, 
  CheckCircle,
  MessageSquare,
  Check
} from 'lucide-react';

export default function LandingPage() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
      }
    }
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: 'spring' as const, stiffness: 100 }
    }
  };

  const features = [
    {
      title: 'AI Audiobook Lessons',
      description: 'Listen to key standard books narrated with auto-synchronized text highlighting and customizable speed.',
      icon: Volume2
    },
    {
      title: 'Interactive UPSC MCQs',
      description: 'Practice UPSC-level questions with immediate feedback, timer challenges, negative marking, and explanations.',
      icon: HelpCircle
    },
    {
      title: '3D Flashcard decks',
      description: 'Retain complex syllabus items (e.g. articles, amendments) using spaced repetition algorithms.',
      icon: Sparkles
    },
    {
      title: 'AI Doubt Solving',
      description: 'Discuss chapter contents in real-time with an AI bot loaded with official NCERT and reference material contexts.',
      icon: Cpu
    }
  ];

  const pricingTiers = [
    {
      name: 'Aspirant (Free)',
      price: '₹0',
      description: 'Perfect for starters seeking core content.',
      features: [
        '3 chapters per subject',
        '10 daily MCQ challenges',
        '5 daily flashcards reviews',
        'Basic progress tracking'
      ],
      cta: 'Start Learning Free',
      isPopular: false,
      href: '/dashboard'
    },
    {
      name: 'LBSNAA Gold (Premium)',
      price: '₹199',
      period: '/month',
      description: 'Unleash full AI potential and offline resources.',
      features: [
        'Unlimited chapters & standard books',
        'Unlimited MCQ generation & practice',
        'Unlimited flashcard review & custom decks',
        'Unlimited AI Doubt Solver (GPT-4)',
        'Priority support & ad-free reading',
        'Referral system enabled'
      ],
      cta: 'Upgrade to Gold',
      isPopular: true,
      href: '/profile'
    }
  ];

  return (
    <div className="bg-[#0B1325] text-[#FAF6EC] min-h-screen font-sans selection:bg-accent selection:text-[#0B1325]">
      {/* Background patterns */}
      <div className="absolute top-0 left-0 right-0 h-[600px] bg-gradient-to-b from-primary/30 to-transparent pointer-events-none opacity-30" />
      <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] bg-accent/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Header */}
      <header className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between relative z-10">
        <Link href="/" className="font-display font-bold text-2xl tracking-tight text-accent flex items-center">
          Prep<span className="text-[#FAF6EC] font-sans font-light">AI</span>
        </Link>
        <div className="flex items-center space-x-4">
          <Link href="/dashboard" className="text-sm font-medium hover:text-accent transition-colors">
            Study Dashboard
          </Link>
          <Link 
            href="/dashboard" 
            className="bg-accent hover:bg-amber-600 text-[#0B1325] font-semibold text-sm px-5 py-2.5 rounded-full transition-all flex items-center space-x-1"
          >
            <span>Launch App</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-24 relative z-10">
        <motion.div 
          className="text-center max-w-3xl mx-auto"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div 
            variants={itemVariants} 
            className="inline-flex items-center space-x-2 bg-accent/10 border border-accent/20 px-4 py-1.5 rounded-full text-accent text-xs font-semibold uppercase tracking-wider mb-6"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI-Powered UPSC Prep Engine</span>
          </motion.div>

          <motion.h1 
            variants={itemVariants}
            className="font-display text-4xl sm:text-6xl font-extrabold tracking-tight leading-none mb-6"
          >
            Shatter the <span className="gold-gradient-text">UPSC CSE</span> Barrier with AI
          </motion.h1>

          <motion.p 
            variants={itemVariants}
            className="text-foreground/80 text-lg sm:text-xl font-light leading-relaxed mb-8 max-w-2xl mx-auto"
          >
            Immersive audio narration of standard text-books, interactive OMR-style testing, and spaced repetition flashcards powered by GPT-4.
          </motion.p>

          <motion.div 
            variants={itemVariants}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link 
              href="/dashboard" 
              className="w-full sm:w-auto bg-gradient-to-r from-accent to-amber-600 hover:from-amber-600 hover:to-accent text-[#0B1325] font-bold text-base px-8 py-4 rounded-full shadow-lg shadow-accent/20 hover:shadow-xl hover:shadow-accent/30 transition-all flex items-center justify-center space-x-2"
            >
              <span>Start Learning Free</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
            <a 
              href="#features" 
              className="w-full sm:w-auto bg-white/5 hover:bg-white/10 text-white border border-white/10 hover:border-white/20 font-semibold text-base px-8 py-4 rounded-full transition-all flex items-center justify-center"
            >
              Explore Features
            </a>
          </motion.div>
        </motion.div>

        {/* Floating App Mockup (Visual Highlight) */}
        <motion.div 
          className="mt-20 rounded-2xl overflow-hidden border border-white/10 bg-[#0B1325]/80 shadow-2xl relative"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8 }}
        >
          <div className="h-10 bg-slate-900/60 border-b border-white/5 flex items-center px-4 space-x-1.5">
            <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block" />
            <span className="w-3 h-3 rounded-full bg-yellow-500/80 inline-block" />
            <span className="w-3 h-3 rounded-full bg-green-500/80 inline-block" />
            <span className="text-xs text-white/40 ml-4 font-mono">prepai.upsc.in/dashboard</span>
          </div>
          <div className="aspect-[16/9] bg-slate-950 p-6 md:p-10 flex flex-col md:flex-row gap-6 relative">
            <div className="flex-1 space-y-4">
              <div className="h-8 w-48 bg-accent/20 rounded-lg animate-pulse" />
              <div className="h-4 w-full bg-white/10 rounded-lg" />
              <div className="h-4 w-5/6 bg-white/10 rounded-lg" />
              <div className="h-4 w-4/5 bg-white/10 rounded-lg" />
              <div className="pt-4 grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-white/5 bg-white/5">
                  <div className="font-mono text-2xl font-bold text-accent">1,250</div>
                  <div className="text-xs text-white/50 uppercase">Total XP</div>
                </div>
                <div className="p-4 rounded-xl border border-white/5 bg-white/5">
                  <div className="font-mono text-2xl font-bold text-amber-500">5 Days</div>
                  <div className="text-xs text-white/50 uppercase">Study Streak</div>
                </div>
              </div>
            </div>
            <div className="w-full md:w-80 bg-slate-900 border border-white/10 rounded-xl p-5 flex flex-col justify-between">
              <div>
                <div className="text-xs text-accent uppercase font-bold tracking-wider mb-2">Live MCQ Practice</div>
                <div className="text-sm font-semibold mb-4 text-white">Under which act did the Governor of Bengal become Governor-General of India?</div>
                <div className="space-y-2">
                  {['Regulating Act 1773', 'Pitt’s India Act 1784', 'Charter Act 1833'].map((opt, i) => (
                    <div key={i} className={`p-2.5 rounded-lg border text-xs cursor-pointer ${i === 2 ? 'border-success-green bg-success-green/10 text-white' : 'border-white/10 hover:bg-white/5'}`}>
                      {opt}
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-4 text-xs text-white/40 border-t border-white/5 pt-3">
                Year Asked: 2018 | Explanation included.
              </div>
            </div>
          </div>
        </motion.div>

        {/* Features Section */}
        <section id="features" className="pt-28 pb-16">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-white mb-4">Study Smarter, Not Longer</h2>
            <p className="text-white/60 font-light">PrepAI combines cognitive science tools with artificial intelligence to optimize your UPSC preparation workflow.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <div key={idx} className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-accent/30 hover:bg-accent/[0.02] transition-all">
                  <div className="w-12 h-12 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center mb-6 text-accent">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
                  <p className="text-sm text-white/60 font-light leading-relaxed">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-20 border-y border-white/5 my-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                quote: "The audio narrations are game-changing. I listen to Indian Polity by Laxmikanth while commuting. The highlighted reading sync makes revision extremely fast.",
                author: "Siddharth Verma",
                role: "UPSC CSE 2025 Aspirant"
              },
              {
                quote: "PrepAI's spaced-repetition flashcards helped me memorize hundreds of constitutional articles and amendments. The UI feels incredibly smooth and premium.",
                author: "Meghna Roy",
                role: "Cleared UPSC Prelims 2024"
              },
              {
                quote: "The negative marking and immediate OMR explanations gave me realistic test practice. I generated custom chapter MCQs using the AI builder. Worth every rupee.",
                author: "Vikram Jeet",
                role: "IPS Officer (CSE Rank 242)"
              }
            ].map((test, i) => (
              <div key={i} className="p-8 rounded-2xl bg-white/[0.01] border border-white/5 flex flex-col justify-between">
                <p className="text-white/80 italic font-light leading-relaxed mb-6">"{test.quote}"</p>
                <div>
                  <div className="font-bold text-white text-sm">{test.author}</div>
                  <div className="text-xs text-accent mt-0.5">{test.role}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Pricing */}
        <section className="pt-16">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-white mb-4">Invest in Your LBSNAA Dream</h2>
            <p className="text-white/60 font-light">Flexible plans designed to assist you in every step of the Civil Services Journey.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {pricingTiers.map((tier, idx) => (
              <div 
                key={idx} 
                className={`p-8 rounded-3xl flex flex-col justify-between relative ${
                  tier.isPopular 
                    ? 'bg-slate-900 border-2 border-accent shadow-xl shadow-accent/5' 
                    : 'bg-white/[0.02] border border-white/10'
                }`}
              >
                {tier.isPopular && (
                  <span className="absolute -top-3.5 left-1/2 transform -translate-x-1/2 bg-accent text-[#0B1325] text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                    Recommended
                  </span>
                )}
                <div>
                  <div className="text-lg font-bold text-white mb-2">{tier.name}</div>
                  <div className="flex items-baseline space-x-1 mb-4">
                    <span className="text-4xl font-mono font-bold text-white">{tier.price}</span>
                    {tier.period && <span className="text-white/60 text-sm">{tier.period}</span>}
                  </div>
                  <p className="text-sm text-white/50 mb-6 font-light">{tier.description}</p>
                  
                  <ul className="space-y-3 mb-8">
                    {tier.features.map((feat, fIdx) => (
                      <li key={fIdx} className="flex items-center space-x-2.5 text-sm text-white/80">
                        <Check className="w-4 h-4 text-accent flex-shrink-0" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Link
                  href={tier.href}
                  className={`w-full py-3.5 rounded-full font-bold text-center transition-all ${
                    tier.isPopular
                      ? 'bg-accent hover:bg-amber-600 text-[#0B1325]'
                      : 'bg-white/10 hover:bg-white/20 text-white'
                  }`}
                >
                  {tier.cta}
                </Link>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-[#070b16] py-12 relative z-10 text-center text-xs text-white/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="mb-2">© {new Date().getFullYear()} PrepAI. Made for Civil Services Excellence.</p>
          <p>Privacy Policy | Terms of Service | Contact Support</p>
        </div>
      </footer>
    </div>
  );
}
