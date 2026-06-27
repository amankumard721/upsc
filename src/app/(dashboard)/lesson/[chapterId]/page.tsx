'use client';

import React, { useEffect, useState, use, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/supabase';
import { Chapter, MCQ, UserProgress, UserProfile } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { sfx } from '@/lib/sounds';
import { formatTime } from '@/lib/utils';
import { 
  ArrowLeft, 
  Play, 
  Pause, 
  Volume2, 
  SkipForward, 
  CheckCircle, 
  ChevronRight, 
  ChevronLeft,
  BookOpen,
  Sparkles,
  Bookmark,
  FileText,
  MessageSquare,
  HelpCircle,
  XCircle,
  BookMarked
} from 'lucide-react';

interface LessonPageProps {
  params: Promise<{ chapterId: string }>;
}

export default function LessonPlayerPage({ params }: LessonPageProps) {
  const router = useRouter();
  const { chapterId } = use(params);

  // States
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [nextChapterId, setNextChapterId] = useState<string | null>(null);
  const [prevChapterId, setPrevChapterId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Audio state (SpeechSynthesis)
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(-1);
  const [sentences, setSentences] = useState<string[]>([]);
  const [audioProgress, setAudioProgress] = useState(0); // 0 to 100

  // Interactive UI panels
  const [activeTab, setActiveTab] = useState<'chat' | 'notes' | 'bookmarks'>('chat');
  const [notes, setNotes] = useState('');
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [chatQuestion, setChatQuestion] = useState('');
  const [chatLog, setChatLog] = useState<{ sender: 'user' | 'ai'; text: string }[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  
  // MCQ popup trigger
  const [quizPopupMcq, setQuizPopupMcq] = useState<MCQ | null>(null);
  const [showPopupQuiz, setShowPopupQuiz] = useState(false);
  const [popupSelectedOpt, setPopupSelectedOpt] = useState<string | null>(null);
  const [popupAnswered, setPopupAnswered] = useState(false);

  // Speech synthesis reference
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const sentenceIndexRef = useRef(-1);

  useEffect(() => {
    async function loadLesson() {
      try {
        const ch = await db.getChapter(chapterId);
        if (!ch) {
          setLoading(false);
          return;
        }
        setChapter(ch);
        localStorage.setItem('prepai_last_accessed_chapter_id', ch.id);

        // Split text content into sentences for TTS and highlighting
        const textToSplit = ch.content_text || '';
        const sentenceRegex = /[^.!?]+[.!?]+(\s|$)/g;
        const matched = textToSplit.match(sentenceRegex) || [textToSplit];
        setSentences(matched.map(s => s.trim()).filter(Boolean));

        // Determine next/prev chapters
        const siblings = await db.getChapters(ch.book_id);
        const index = siblings.findIndex(s => s.id === ch.id);
        if (index > 0) setPrevChapterId(siblings[index - 1].id);
        if (index < siblings.length - 1) setNextChapterId(siblings[index + 1].id);

        // Load personal notes
        const savedNotes = localStorage.getItem(`notes_${ch.id}`) || '';
        setNotes(savedNotes);

        // Load bookmarks
        const savedBookmarks = JSON.parse(localStorage.getItem(`bookmarks_${ch.id}`) || '[]');
        setBookmarks(savedBookmarks);

        // Initial welcome chat message
        setChatLog([
          { 
            sender: 'ai', 
            text: `Jai Hind! I have read through "${ch.title}". You can ask me any doubt regarding this chapter's constitutional contexts, acts, or history.` 
          }
        ]);

        // Load a check MCQ for popup
        const mcqs = await db.getMCQs(ch.id);
        if (mcqs && mcqs.length > 0) {
          setQuizPopupMcq(mcqs[Math.floor(Math.random() * mcqs.length)]);
        }

        // Set up local progress (last accessed position)
        await db.updateUserProgress(ch.id, { last_position_seconds: 10 });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadLesson();

    // Cleanup speech synthesis on navigate/unmount
    return () => {
      if (typeof window !== 'undefined') {
        window.speechSynthesis.cancel();
      }
    };
  }, [chapterId]);

  // Spaced Timer for interactive MCQ popup (Triggered after 15 seconds for demo/user testing, instead of full 5 minutes)
  useEffect(() => {
    if (loading || !chapter) return;
    
    const timer = setTimeout(() => {
      if (quizPopupMcq) {
        // Pause audio narration if playing
        pauseAudio();
        setShowPopupQuiz(true);
      }
    }, 25000); // 25 seconds for interactive preview popup

    return () => clearTimeout(timer);
  }, [loading, chapter, quizPopupMcq]);

  // Audio Functions (TTS)
  const speakSentence = (index: number) => {
    if (typeof window === 'undefined') return;
    window.speechSynthesis.cancel();

    if (index < 0 || index >= sentences.length) {
      setIsPlaying(false);
      setCurrentSentenceIndex(-1);
      setAudioProgress(100);
      return;
    }

    sentenceIndexRef.current = index;
    setCurrentSentenceIndex(index);
    setAudioProgress(Math.round((index / sentences.length) * 100));

    const textToSpeak = sentences[index];
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utteranceRef.current = utterance;
    utterance.rate = playbackSpeed;

    // Detect voices and prefer premium English/Hindi accent if available
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => v.lang.startsWith('en-IN') || v.lang.startsWith('en-GB') || v.name.includes('Google'));
    if (preferredVoice) utterance.voice = preferredVoice;

    utterance.onend = () => {
      const nextIndex = sentenceIndexRef.current + 1;
      if (nextIndex < sentences.length) {
        speakSentence(nextIndex);
      } else {
        setIsPlaying(false);
        setCurrentSentenceIndex(-1);
        setAudioProgress(100);
        // Complete the lesson progress
        handleMarkComplete();
      }
    };

    utterance.onerror = (e) => {
      console.error('Speech synthesis error', e);
      setIsPlaying(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  const playAudio = () => {
    if (sentences.length === 0) return;
    setIsPlaying(true);
    const startIdx = currentSentenceIndex === -1 ? 0 : currentSentenceIndex;
    speakSentence(startIdx);
  };

  const pauseAudio = () => {
    if (typeof window === 'undefined') return;
    setIsPlaying(false);
    window.speechSynthesis.cancel();
  };

  const skipForward = () => {
    if (sentences.length === 0) return;
    const nextIdx = Math.min(sentences.length - 1, currentSentenceIndex + 1);
    speakSentence(nextIdx);
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (isPlaying && currentSentenceIndex !== -1) {
      speakSentence(currentSentenceIndex); // restart active sentence with new speed
    }
  };

  // Notes function
  const handleNotesChange = (text: string) => {
    setNotes(text);
    if (chapter) {
      localStorage.setItem(`notes_${chapter.id}`, text);
    }
  };

  // Bookmarks function
  const toggleBookmark = () => {
    if (!chapter) return;
    let updated;
    const activeText = currentSentenceIndex !== -1 ? sentences[currentSentenceIndex] : 'Chapter Bookmark';
    if (bookmarks.includes(activeText)) {
      updated = bookmarks.filter(b => b !== activeText);
    } else {
      updated = [...bookmarks, activeText];
    }
    setBookmarks(updated);
    localStorage.setItem(`bookmarks_${chapter.id}`, JSON.stringify(updated));
  };

  // Chat/Doubt Solver API call (Mocking OpenAI GPT-4 reply locally)
  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatQuestion.trim() || !chapter) return;

    const userText = chatQuestion;
    setChatLog(prev => [...prev, { sender: 'user', text: userText }]);
    setChatQuestion('');
    setChatLoading(true);

    try {
      // Simulate API lag
      await new Promise(resolve => setTimeout(resolve, 1500));

      let aiReply = "Thank you for asking. Based on this chapter, the core concept centers around the evolution of Indian administrative systems under British rule. Let me look up standard materials (e.g. Laxmikanth, NCERT) for you.";

      // Intelligent replies based on text keyword matching
      const query = userText.toLowerCase();
      if (query.includes('1773') || query.includes('regulating')) {
        aiReply = "The Regulating Act of 1773 was crucial because it was the first step by the British Government to regulate the East India Company. It created the office of Governor-General of Bengal (Warren Hastings) and subordinate Governors of Bombay/Madras, paving the way for centralisation.";
      } else if (query.includes('1833') || query.includes('charter')) {
        aiReply = "The Charter Act of 1833 was the final step of centralisation in British India. It designated the Governor-General of Bengal as the Governor-General of India (Lord William Bentinck). It also made the East India Company a purely administrative body, ending its commercial monopoly.";
      } else if (query.includes('double') || query.includes('pitt')) {
        aiReply = "Pitt's India Act of 1784 established the system of 'Double Government'. It created a new Board of Control to handle political/administrative affairs while the Court of Directors continued managing commercial matters. This distinction remained until 1858.";
      } else if (query.includes('assembly') || query.includes('constituent')) {
        aiReply = "The Constituent Assembly was formed in Nov 1946 under the Cabinet Mission Plan. It comprised 389 members, chaired by Dr. Sachchidanand Sinha temporarily, then Dr. Rajendra Prasad. Dr. Ambedkar headed the 7-member Drafting Committee.";
      }

      setChatLog(prev => [...prev, { sender: 'ai', text: aiReply }]);
    } catch (err) {
      console.error(err);
    } finally {
      setChatLoading(false);
    }
  };

  // Quiz popup answers
  const handlePopupQuizSubmit = async (opt: string) => {
    if (popupAnswered || !quizPopupMcq) return;
    setPopupSelectedOpt(opt);
    setPopupAnswered(true);

    const isCorrect = opt === quizPopupMcq.correct_option;
    if (isCorrect) {
      sfx.playCorrect();
      const prof = await db.getUserProfile();
      if (prof) {
        await db.updateUserProfile({ total_points: prof.total_points + 20 }); // reward +20 XP
      }
    } else {
      sfx.playIncorrect();
    }
  };

  // Mark chapter as complete
  const handleMarkComplete = async () => {
    if (!chapter) return;
    await db.updateUserProgress(chapter.id, { is_completed: true });
    
    // Add banner notification or redirect
    alert('Congratulations! You completed the lesson and earned +50 XP!');
    if (nextChapterId) {
      router.push(`/lesson/${nextChapterId}`);
    } else {
      router.push(`/books/${chapter.book_id}`);
    }
  };

  // Helper to extract YouTube video ID
  const getYouTubeId = (url?: string) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-white/50 font-light">Synthesizing AI audiobook narration...</p>
      </div>
    );
  }

  if (!chapter) {
    return (
      <div className="text-center py-16">
        <p className="text-white/60">Chapter not found.</p>
        <Link href="/dashboard" className="text-accent underline mt-2 inline-block">Return to dashboard</Link>
      </div>
    );
  }

  const videoId = getYouTubeId(chapter.video_url);

  return (
    <div className="space-y-8 font-sans pb-16">
      {/* Back link */}
      <div className="flex justify-between items-center">
        <Link href={`/books/${chapter.book_id}`} className="text-sm text-white/60 hover:text-accent inline-flex items-center space-x-1.5 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Chapters</span>
        </Link>
        <button 
          onClick={toggleBookmark}
          className="text-xs bg-white/5 border border-white/10 hover:border-accent hover:text-accent px-3 py-1.5 rounded-xl transition-all flex items-center space-x-1.5"
        >
          <Bookmark className="w-3.5 h-3.5 fill-none" />
          <span>Bookmark Section</span>
        </button>
      </div>

      {/* Video Embed */}
      {videoId && (
        <div className="w-full aspect-video rounded-3xl overflow-hidden shadow-2xl border border-white/10 relative bg-black">
          <iframe 
            src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`} 
            title={chapter.title}
            frameBorder="0" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
            allowFullScreen
            className="w-full h-full"
          />
        </div>
      )}

      {/* Premium Audiobook Narration Controller */}
      <div className="premium-card p-6 bg-slate-900/50 flex flex-col md:flex-row md:items-center justify-between gap-6 relative">
        <div className="flex items-center space-x-4">
          <button
            onClick={isPlaying ? pauseAudio : playAudio}
            className="w-12 h-12 rounded-full bg-accent hover:bg-amber-600 flex items-center justify-center text-slate-950 shadow-md shadow-accent/20 transition-all hover:scale-105"
            aria-label={isPlaying ? 'Pause AI Audiobook' : 'Play AI Audiobook'}
          >
            {isPlaying ? <Pause className="w-5 h-5 fill-slate-950" /> : <Play className="w-5 h-5 fill-slate-950 ml-0.5" />}
          </button>
          
          <div>
            <h3 className="font-display text-sm font-bold text-white flex items-center gap-1.5">
              <span>AI Audio Narrator</span>
              {isPlaying && (
                <div className="flex items-end space-x-0.5 h-3 w-4">
                  <span className="w-0.5 bg-accent rounded-full animate-bar-1" />
                  <span className="w-0.5 bg-accent rounded-full animate-bar-2" />
                  <span className="w-0.5 bg-accent rounded-full animate-bar-3" />
                  <span className="w-0.5 bg-accent rounded-full animate-bar-4" />
                </div>
              )}
            </h3>
            <p className="text-[10px] text-white/50 font-mono mt-0.5">Narrating sentence by sentence</p>
          </div>
        </div>

        {/* Audiobook Progress Bar */}
        <div className="flex-1 max-w-md">
          <div className="flex justify-between text-[10px] text-white/40 mb-1 font-mono">
            <span>Narration progress</span>
            <span>{audioProgress}%</span>
          </div>
          <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
            <div className="bg-accent h-full transition-all duration-300" style={{ width: `${audioProgress}%` }} />
          </div>
        </div>

        {/* Speed / Volume Controller */}
        <div className="flex items-center space-x-4">
          {/* Speed */}
          <div className="flex items-center space-x-1.5">
            <span className="text-[10px] text-white/40 font-mono uppercase">Speed</span>
            <select
              value={playbackSpeed}
              onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
              className="bg-slate-950 border border-white/10 text-white text-xs rounded-lg px-2.5 py-1 outline-none focus:border-accent"
            >
              <option value="0.75">0.75x</option>
              <option value="1">1.0x</option>
              <option value="1.25">1.25x</option>
              <option value="1.5">1.5x</option>
              <option value="2">2.0x</option>
            </select>
          </div>

          <button
            onClick={skipForward}
            className="p-2 border border-white/10 rounded-xl hover:border-accent text-white transition-colors"
            title="Next Sentence"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main split sections: Chapter Text vs Study panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left: Interactive Highlighted Text Reader */}
        <div className="lg:col-span-2 space-y-4">
          <div className="premium-card p-6 md:p-8 bg-slate-900/30">
            <h2 className="font-display text-xl font-bold text-white mb-6 border-b border-white/5 pb-4">
              Chapter Text Content
            </h2>
            
            <div className="prose prose-invert max-w-none text-white/80 leading-relaxed font-light text-sm space-y-4">
              {sentences.map((sent, idx) => {
                const isActive = idx === currentSentenceIndex;
                return (
                  <span 
                    key={idx}
                    onClick={() => speakSentence(idx)}
                    className={`cursor-pointer transition-all duration-200 inline ${
                      isActive 
                        ? 'bg-accent/25 text-white font-medium border-b-2 border-accent px-0.5 rounded shadow-sm scale-[1.01]' 
                        : 'hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    {sent}{' '}
                  </span>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Study Sidebar Panels */}
        <div className="space-y-8">
          
          {/* Tabs header */}
          <div className="flex border-b border-white/10">
            {[
              { id: 'chat', label: 'AI Doubt Solver', icon: MessageSquare },
              { id: 'notes', label: 'Notes', icon: FileText },
              { id: 'bookmarks', label: 'Bookmarks', icon: BookMarked }
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 pb-3 text-center text-xs font-semibold flex flex-col items-center justify-center space-y-1 transition-all ${
                    activeTab === tab.id ? 'text-accent border-b-2 border-accent' : 'text-white/40 hover:text-white/60'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Panel bodies */}
          <div className="premium-card p-5 bg-slate-900/40 min-h-[300px]">
            {activeTab === 'chat' && (
              <div className="space-y-4 flex flex-col h-[350px] justify-between">
                <div className="flex-1 overflow-y-auto space-y-3.5 pr-2 custom-scrollbar">
                  {chatLog.map((chat, idx) => (
                    <div 
                      key={idx} 
                      className={`p-3 rounded-xl text-xs leading-relaxed max-w-[85%] ${
                        chat.sender === 'user' 
                          ? 'bg-accent/15 border border-accent/20 text-white ml-auto' 
                          : 'bg-slate-950/60 border border-white/5 text-white/80'
                      }`}
                    >
                      <span className="font-mono text-[9px] uppercase font-bold tracking-wider text-accent block mb-1">
                        {chat.sender === 'user' ? 'Aspirant' : 'PrepAI Mentor'}
                      </span>
                      <span>{chat.text}</span>
                    </div>
                  ))}
                  {chatLoading && (
                    <div className="bg-slate-950/60 border border-white/5 p-3 rounded-xl text-xs text-white/40 flex items-center space-x-1.5">
                      <div className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  )}
                </div>

                <form onSubmit={handleChatSubmit} className="flex gap-2 border-t border-white/5 pt-3">
                  <input
                    type="text"
                    value={chatQuestion}
                    onChange={(e) => setChatQuestion(e.target.value)}
                    placeholder="Ask a doubt about this act..."
                    className="flex-1 bg-slate-950 border border-white/10 focus:border-accent text-xs rounded-xl px-3 py-2 outline-none transition-all placeholder:text-white/20"
                  />
                  <button
                    type="submit"
                    className="bg-accent hover:bg-amber-600 text-slate-950 text-xs font-bold px-3 py-2 rounded-xl transition-all"
                  >
                    Ask
                  </button>
                </form>
              </div>
            )}

            {activeTab === 'notes' && (
              <div className="space-y-4">
                <span className="text-[10px] text-accent font-bold uppercase tracking-wider block">Personal Study Notes</span>
                <textarea
                  value={notes}
                  onChange={(e) => handleNotesChange(e.target.value)}
                  placeholder="Summarize key facts (e.g. Warren Hastings, Supreme Court 1774) here. Notes are auto-saved to your profile."
                  className="w-full min-h-[220px] bg-slate-950 border border-white/10 focus:border-accent rounded-xl p-3 text-xs leading-relaxed text-white outline-none resize-none transition-all"
                />
              </div>
            )}

            {activeTab === 'bookmarks' && (
              <div className="space-y-4">
                <span className="text-[10px] text-accent font-bold uppercase tracking-wider block">Bookmarked Citations</span>
                {bookmarks.length === 0 ? (
                  <p className="text-xs text-white/30 italic text-center py-8">No sentences bookmarked in this lesson yet.</p>
                ) : (
                  <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1">
                    {bookmarks.map((b, idx) => (
                      <div key={idx} className="p-3 bg-slate-950/40 border border-white/5 rounded-xl text-xs text-white/70 italic leading-relaxed relative group">
                        <span>"{b}"</span>
                        <button 
                          onClick={() => {
                            const updated = bookmarks.filter((_, i) => i !== idx);
                            setBookmarks(updated);
                            localStorage.setItem(`bookmarks_${chapter.id}`, JSON.stringify(updated));
                          }}
                          className="absolute -top-1.5 -right-1.5 hidden group-hover:block text-error-red bg-slate-900 rounded-full"
                        >
                          <XCircle className="w-4 h-4 fill-slate-900" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Quick MCQ pop challenge to test */}
          <Link
            href={`/quiz/${chapter.id}`}
            className="w-full bg-gradient-to-r from-accent to-amber-600 hover:from-amber-600 hover:to-accent text-slate-950 font-bold py-3.5 rounded-2xl transition-all flex items-center justify-center space-x-2 shadow-lg shadow-accent/15"
          >
            <HelpCircle className="w-5 h-5" />
            <span>Launch Chapter MCQ Quiz</span>
          </Link>

        </div>
      </div>

      {/* Lesson Navigation footer */}
      <div className="flex items-center justify-between border-t border-white/5 pt-6 mt-8">
        {prevChapterId ? (
          <Link
            href={`/lesson/${prevChapterId}`}
            className="text-xs text-white/75 border border-white/10 hover:border-accent hover:text-accent px-4 py-2.5 rounded-xl transition-all flex items-center space-x-1"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous Chapter</span>
          </Link>
        ) : (
          <div />
        )}

        <button
          onClick={handleMarkComplete}
          className="bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 text-emerald-400 font-bold text-xs px-5 py-2.5 rounded-xl transition-all flex items-center space-x-1.5"
        >
          <CheckCircle className="w-4 h-4" />
          <span>Mark Lesson Completed (+50 XP)</span>
        </button>

        {nextChapterId ? (
          <Link
            href={`/lesson/${nextChapterId}`}
            className="text-xs text-white/75 border border-white/10 hover:border-accent hover:text-accent px-4 py-2.5 rounded-xl transition-all flex items-center space-x-1"
          >
            <span>Next Chapter</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        ) : (
          <div />
        )}
      </div>

      {/* Interactive MCQ Popup Modal (Every 5 minutes, simulated at 25 seconds) */}
      <AnimatePresence>
        {showPopupQuiz && quizPopupMcq && (
          <div className="fixed inset-0 z-50 bg-[#0B1325]/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-lg bg-slate-900 border-2 border-accent rounded-3xl p-8 shadow-2xl space-y-6 relative overflow-hidden"
            >
              <div className="absolute -top-10 -left-10 w-24 h-24 bg-accent/5 rounded-full blur-[20px]" />
              
              <div className="text-center space-y-2">
                <span className="bg-accent/15 text-accent border border-accent/20 text-[9px] font-bold px-2.5 py-0.5 rounded-full font-mono uppercase tracking-widest">
                  Quick check-in question
                </span>
                <h3 className="font-display text-lg font-bold text-white leading-snug">Let's verify your attention!</h3>
                <p className="text-xs text-white/50">Solve this quick MCQ to unlock and resume your audiobook player.</p>
              </div>

              <div className="p-4 bg-slate-950/60 border border-white/5 rounded-2xl">
                <span className="text-[10px] text-accent/60 uppercase font-bold font-mono">Question</span>
                <p className="text-xs text-white mt-1 leading-relaxed">{quizPopupMcq.question}</p>
              </div>

              <div className="space-y-2">
                {[
                  { key: 'A', text: quizPopupMcq.option_a },
                  { key: 'B', text: quizPopupMcq.option_b },
                  { key: 'C', text: quizPopupMcq.option_c },
                  { key: 'D', text: quizPopupMcq.option_d }
                ].map((opt) => {
                  const isSelected = popupSelectedOpt === opt.key;
                  const isCorrect = opt.key === quizPopupMcq.correct_option;
                  
                  let optionClass = 'border-white/10 bg-slate-950/40 hover:bg-slate-950/80';
                  if (popupAnswered) {
                    if (isCorrect) {
                      optionClass = 'border-success-green bg-success-green/10 text-white';
                    } else if (isSelected) {
                      optionClass = 'border-error-red bg-error-red/10 text-white';
                    } else {
                      optionClass = 'border-white/5 opacity-50 bg-slate-950/20';
                    }
                  }

                  return (
                    <button
                      key={opt.key}
                      disabled={popupAnswered}
                      onClick={() => handlePopupQuizSubmit(opt.key)}
                      className={`w-full text-left p-3.5 rounded-xl border text-xs transition-all flex items-start gap-2.5 ${optionClass}`}
                    >
                      <span className="font-mono font-bold bg-white/5 px-1.5 py-0.5 rounded border border-white/10 text-[10px] text-accent mt-0.5">
                        {opt.key}
                      </span>
                      <span className="flex-1">{opt.text}</span>
                    </button>
                  );
                })}
              </div>

              {popupAnswered && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <div className="p-3.5 bg-white/5 rounded-xl border border-white/5 text-xs">
                    <span className="text-[9px] uppercase font-bold text-accent font-mono block mb-1">Answer explanation</span>
                    <p className="text-white/60 font-light leading-relaxed">{quizPopupMcq.explanation}</p>
                  </div>

                  <button
                    onClick={() => {
                      setShowPopupQuiz(false);
                      setPopupSelectedOpt(null);
                      setPopupAnswered(false);
                    }}
                    className="w-full bg-accent hover:bg-amber-600 text-slate-950 font-bold py-3 rounded-xl transition-all text-xs flex items-center justify-center space-x-1"
                  >
                    <span>Resume Learning Audiobook</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </motion.div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
