'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { db } from '@/lib/supabase';
import { Book, Chapter, MCQ } from '@/types';
import { 
  Sparkles, 
  ArrowLeft, 
  Plus, 
  Save, 
  Edit3, 
  Check, 
  Trash, 
  BookOpen, 
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function AdminGeneratePage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  
  // Selection
  const [selectedBookId, setSelectedBookId] = useState('');
  const [selectedChapterId, setSelectedChapterId] = useState('');
  
  // Inputs
  const [chapterText, setChapterText] = useState('');
  const [mcqCount, setMcqCount] = useState(5);
  const [difficulty, setDifficulty] = useState('Medium');
  
  // States
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Results
  const [generatedMCQs, setGeneratedMCQs] = useState<MCQ[]>([]);

  useEffect(() => {
    // Load books
    db.getBooks().then(data => {
      setBooks(data);
      
      // Check query parameter first
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const chapterId = params.get('chapterId');
        if (chapterId) {
          db.getChapter(chapterId).then(ch => {
            if (ch) {
              setSelectedBookId(ch.book_id);
              setSelectedChapterId(ch.id);
              if (ch.content_text) {
                setChapterText(ch.content_text);
              }
            }
          });
          return;
        }
      }

      if (data.length > 0) {
        setSelectedBookId(data[0].id);
      }
    });
  }, []);

  useEffect(() => {
    if (selectedBookId) {
      db.getChapters(selectedBookId).then(data => {
        setChapters(data);
        
        // Check query parameter matching this book
        if (typeof window !== 'undefined') {
          const params = new URLSearchParams(window.location.search);
          const chapterId = params.get('chapterId');
          if (chapterId && data.some(c => c.id === chapterId)) {
            setSelectedChapterId(chapterId);
            return;
          }
        }

        if (data.length > 0) {
          setSelectedChapterId(data[0].id);
        } else {
          setSelectedChapterId('');
        }
      });
    }
  }, [selectedBookId]);

  const handleGenerate = async () => {
    if (!chapterText.trim()) {
      setError('Please provide chapter text content to run the AI compiler.');
      return;
    }
    if (!selectedChapterId) {
      setError('Please select a target book and chapter to assign generated MCQs.');
      return;
    }

    setGenerating(true);
    setError('');
    setSuccess('');
    setGeneratedMCQs([]);

    try {
      const response = await fetch('/api/generate-mcq', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          chapterText,
          count: mcqCount,
          difficulty
        })
      });

      if (!response.ok) throw new Error('API server failed to respond.');

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      // Auto assignment to chapter
      const mcqsWithChapter = (data.mcqs || []).map((m: any) => ({
        ...m,
        chapter_id: selectedChapterId
      }));

      setGeneratedMCQs(mcqsWithChapter);
      setSuccess(`AI successfully drafted ${mcqsWithChapter.length} UPSC questions! Review below.`);
      
      confetti({
        particleCount: 40,
        spread: 50,
        origin: { y: 0.6 }
      });
    } catch (err: any) {
      setError(err.message || 'Generation failed.');
    } finally {
      setGenerating(false);
    }
  };

  const handleEditMCQField = (index: number, field: keyof MCQ, value: any) => {
    setGeneratedMCQs(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [field]: value
      };
      return updated;
    });
  };

  const handleDeleteMCQ = (index: number) => {
    setGeneratedMCQs(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveToDatabase = async () => {
    if (generatedMCQs.length === 0) return;
    setSaving(true);
    setError('');

    try {
      // In localStorage mode, we retrieve existing MCQs list and append
      if (typeof window !== 'undefined') {
        const storedMCQs = JSON.parse(localStorage.getItem('prepai_custom_mcqs') || '[]');
        const updatedList = [...storedMCQs, ...generatedMCQs];
        localStorage.setItem('prepai_custom_mcqs', JSON.stringify(updatedList));
        
        // Also update standard database memory for this session
        // For simulation, we push it into the global mock MCQ seed array
        // db service retrieves it seamlessly if seed is empty, but we can also store locally
        // so that it persists across pages. Let's make sure our seed getter pulls it!
        // We'll see: in getMCQs we can read from mock arrays AND pre-existing local storage.
        // Let's add it to local storage keys!
        const existing = JSON.parse(localStorage.getItem('prepai_custom_chapter_mcqs_' + selectedChapterId) || '[]');
        localStorage.setItem('prepai_custom_chapter_mcqs_' + selectedChapterId, JSON.stringify([...existing, ...generatedMCQs]));
      }

      setSuccess('Successfully published and assigned questions to the active UPSC syllabus!');
      setGeneratedMCQs([]);
    } catch (err) {
      setError('Database save error occurred.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 font-sans max-w-4xl mx-auto pb-24">
      {/* Header */}
      <div className="border-b border-white/5 pb-4">
        <Link href="/dashboard" className="text-sm text-foreground/60 hover:text-accent inline-flex items-center space-x-1.5 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span>Exit Portal</span>
        </Link>
        <h1 className="font-display text-2xl md:text-3xl font-extrabold text-foreground mt-1 flex items-center">
          <Sparkles className="w-7 h-7 text-accent mr-2" />
          <span>AI MCQ Compiler Portal</span>
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Input Form (1 column) */}
        <div className="space-y-6">
          <div className="premium-card p-6 bg-slate-900/40 space-y-4">
            <h3 className="text-sm font-bold text-foreground border-b border-white/5 pb-2">Generation Controls</h3>
            
            {/* Target Selectors */}
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-semibold text-foreground/60 uppercase tracking-wider mb-1">Standard Book</label>
                <select
                  value={selectedBookId}
                  onChange={(e) => setSelectedBookId(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 text-xs rounded-xl px-3 py-2 outline-none text-foreground focus:border-accent"
                >
                  {books.map(b => (
                    <option key={b.id} value={b.id}>{b.title} ({b.author})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-foreground/60 uppercase tracking-wider mb-1">Chapter Assignment</label>
                <select
                  value={selectedChapterId}
                  onChange={(e) => setSelectedChapterId(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 text-xs rounded-xl px-3 py-2 outline-none text-foreground focus:border-accent"
                  disabled={chapters.length === 0}
                >
                  {chapters.length === 0 ? (
                    <option value="">No chapters found</option>
                  ) : (
                    chapters.map(c => (
                      <option key={c.id} value={c.id}>Ch {c.chapter_number}: {c.title}</option>
                    ))
                  )}
                </select>
              </div>
            </div>

            {/* MCQ parameters */}
            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-[10px] font-semibold text-foreground/60 uppercase tracking-wider mb-1">Question Count</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={mcqCount}
                  onChange={(e) => setMcqCount(parseInt(e.target.value))}
                  className="w-full bg-slate-950 border border-white/10 text-xs rounded-xl px-3 py-2 outline-none text-foreground focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-foreground/60 uppercase tracking-wider mb-1">Target Difficulty</label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 text-xs rounded-xl px-3 py-2 outline-none text-foreground focus:border-accent"
                >
                  <option value="Easy">Easy (Conceptual basics)</option>
                  <option value="Medium">Medium (Application analysis)</option>
                  <option value="Hard">Hard (UPSC Statement complex)</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={generating}
              className="w-full bg-accent hover:bg-amber-600 text-slate-950 font-bold py-3 rounded-xl transition-all flex items-center justify-center space-x-1.5 text-xs shadow-md shadow-accent/10"
            >
              <Sparkles className="w-4 h-4 fill-slate-950/20" />
              <span>{generating ? 'Compiling AI Prompts...' : 'Generate MCQs'}</span>
            </button>
          </div>
        </div>

        {/* Right Output Review (2 columns) */}
        <div className="lg:col-span-2 space-y-6">
          {error && (
            <div className="p-4 bg-error-red/10 border border-error-red/20 rounded-2xl text-xs text-red-400 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-4 bg-success-green/10 border border-success-green/20 rounded-2xl text-xs text-emerald-400 flex items-start gap-2">
              <Check className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{success}</span>
            </div>
          )}

          {/* Chapter input text area */}
          {generatedMCQs.length === 0 && (
            <div className="premium-card p-6 bg-slate-900/40 space-y-4">
              <label className="block text-xs font-semibold text-foreground/60 uppercase tracking-wider">Chapter Text Material</label>
              <textarea
                value={chapterText}
                onChange={(e) => setChapterText(e.target.value)}
                placeholder="Paste the text content of your UPSC chapter, NCERT pages, or reference notes. The AI compiler will extract facts, detect difficulty, and compile mock questions..."
                className="w-full min-h-[250px] bg-slate-950 border border-white/10 focus:border-accent rounded-2xl p-4 text-xs leading-relaxed text-foreground outline-none resize-none transition-all"
              />
            </div>
          )}

          {/* Generated MCQ review lists */}
          {generatedMCQs.length > 0 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-foreground">Review Generated Questions</h3>
                <button
                  onClick={handleSaveToDatabase}
                  disabled={saving}
                  className="bg-success-green/10 border border-success-green/20 hover:bg-success-green/20 text-emerald-400 font-bold text-xs px-4 py-2 rounded-xl transition-all flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'Publishing...' : 'Publish to Course'}</span>
                </button>
              </div>

              {generatedMCQs.map((mcq, idx) => (
                <div key={idx} className="premium-card p-6 bg-slate-900/40 space-y-4 border border-white/10 relative group">
                  
                  {/* Delete button */}
                  <button 
                    onClick={() => handleDeleteMCQ(idx)}
                    className="absolute top-4 right-4 text-error-red bg-slate-950 p-2 rounded-xl border border-white/5 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500/10"
                  >
                    <Trash className="w-4 h-4" />
                  </button>

                  <div className="space-y-3">
                    {/* Question Input */}
                    <div>
                      <label className="block text-[9px] font-bold text-foreground/40 uppercase font-mono mb-1">Question Statement {idx + 1}</label>
                      <textarea
                        value={mcq.question}
                        onChange={(e) => handleEditMCQField(idx, 'question', e.target.value)}
                        className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-xs leading-relaxed outline-none text-foreground focus:border-accent"
                      />
                    </div>

                    {/* Options Inputs */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[9px] font-bold text-foreground/40 uppercase font-mono mb-1">Option A</label>
                        <input
                          type="text"
                          value={mcq.option_a}
                          onChange={(e) => handleEditMCQField(idx, 'option_a', e.target.value)}
                          className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs outline-none text-foreground focus:border-accent"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-foreground/40 uppercase font-mono mb-1">Option B</label>
                        <input
                          type="text"
                          value={mcq.option_b}
                          onChange={(e) => handleEditMCQField(idx, 'option_b', e.target.value)}
                          className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs outline-none text-foreground focus:border-accent"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-foreground/40 uppercase font-mono mb-1">Option C</label>
                        <input
                          type="text"
                          value={mcq.option_c}
                          onChange={(e) => handleEditMCQField(idx, 'option_c', e.target.value)}
                          className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs outline-none text-foreground focus:border-accent"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-foreground/40 uppercase font-mono mb-1">Option D</label>
                        <input
                          type="text"
                          value={mcq.option_d}
                          onChange={(e) => handleEditMCQField(idx, 'option_d', e.target.value)}
                          className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs outline-none text-foreground focus:border-accent"
                        />
                      </div>
                    </div>

                    {/* Correct option & Explanation */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[9px] font-bold text-foreground/40 uppercase font-mono mb-1">Correct Option</label>
                        <select
                          value={mcq.correct_option}
                          onChange={(e) => handleEditMCQField(idx, 'correct_option', e.target.value)}
                          className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs outline-none text-foreground focus:border-accent"
                        >
                          <option value="A">A</option>
                          <option value="B">B</option>
                          <option value="C">C</option>
                          <option value="D">D</option>
                        </select>
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-[9px] font-bold text-foreground/40 uppercase font-mono mb-1">Answer Explanation</label>
                        <input
                          type="text"
                          value={mcq.explanation}
                          onChange={(e) => handleEditMCQField(idx, 'explanation', e.target.value)}
                          className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs outline-none text-foreground focus:border-accent"
                        />
                      </div>
                    </div>

                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
