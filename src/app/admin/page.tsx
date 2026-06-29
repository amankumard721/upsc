'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { db } from '@/lib/supabase';
import { Book, Chapter } from '@/types';
import { 
  Plus, Save, Trash, BookOpen, AlertCircle, 
  ArrowLeft, FileText, CheckCircle, UploadCloud, Link2, 
  FolderPlus, Layers, Calendar, User, Sparkles, Megaphone, Bell
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<'books' | 'chapters' | 'notifications'>('books');
  const [books, setBooks] = useState<Book[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Book Form States
  const [bookTitle, setBookTitle] = useState('');
  const [bookAuthor, setBookAuthor] = useState('');
  const [bookSubject, setBookSubject] = useState('History');
  const [bookCover, setBookCover] = useState('');
  const [bookTotalChapters, setBookTotalChapters] = useState(1);

  // Chapter Form States
  const [targetBookId, setTargetBookId] = useState('');
  const [chapterTitle, setChapterTitle] = useState('');
  const [chapterDesc, setChapterDesc] = useState('');
  const [chapterNum, setChapterNum] = useState(1);
  const [chapterAudio, setChapterAudio] = useState('');
  const [chapterVideo, setChapterVideo] = useState('');
  const [chapterDuration, setChapterDuration] = useState(300);
  const [chapterText, setChapterText] = useState('');
  const [uploadingAudio, setUploadingAudio] = useState(false);

  // Popup Notification Form States
  const [popupTitle, setPopupTitle] = useState('');
  const [popupDesc, setPopupDesc] = useState('');
  const [popupImgUrl, setPopupImgUrl] = useState('');
  const [popupActionUrl, setPopupActionUrl] = useState('');
  const [popupActionLabel, setPopupActionLabel] = useState('View Details');
  const [popupIsActive, setPopupIsActive] = useState(true);
  const [currentActivePopup, setCurrentActivePopup] = useState<any>(null);

  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAudio(true);
    setError('');
    setSuccess('');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', 'Audio ppodcst polity');

    try {
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.url) {
        setChapterAudio(data.url);
        setSuccess(`Audio "${file.name}" uploaded to Cloudflare R2 and linked successfully!`);
      } else {
        throw new Error(data.error || 'Failed to upload.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error uploading file to Cloudflare R2.');
    } finally {
      setUploadingAudio(false);
      e.target.value = '';
    }
  };

  const [uploadingImg, setUploadingImg] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImg(true);
    setError('');
    setSuccess('');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', 'popups');

    try {
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.url) {
        setPopupImgUrl(data.url);
        setSuccess(`Image "${file.name}" uploaded to Cloudflare R2 and linked successfully!`);
      } else {
        throw new Error(data.error || 'Failed to upload.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error uploading image.');
    } finally {
      setUploadingImg(false);
      e.target.value = '';
    }
  };

  useEffect(() => {
    loadBooks();
  }, []);

  useEffect(() => {
    if (targetBookId) {
      loadChapters(targetBookId);
    } else {
      setChapters([]);
    }
  }, [targetBookId]);

  useEffect(() => {
    if (activeTab === 'notifications') {
      loadActivePopup();
    }
  }, [activeTab]);

  const loadActivePopup = async () => {
    try {
      const active = await db.getActivePopup();
      setCurrentActivePopup(active);
      if (active) {
        setPopupTitle(active.title || '');
        setPopupDesc(active.description || '');
        setPopupImgUrl(active.image_url || '');
        setPopupActionUrl(active.action_url || '');
        setPopupActionLabel(active.action_label || 'View Details');
        setPopupIsActive(active.is_active ?? true);
      }
    } catch (err) {
      console.error('Error loading active popup:', err);
    }
  };

  const handlePushPopup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!popupImgUrl || !popupActionUrl) {
      setError('Image URL and Action URL are required.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await db.pushPopup({
        title: popupTitle || undefined,
        description: popupDesc || undefined,
        image_url: popupImgUrl,
        action_url: popupActionUrl,
        action_label: popupActionLabel,
        is_active: popupIsActive
      });
      setSuccess('Full image popup notification pushed successfully!');
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      setCurrentActivePopup(result);
    } catch (err: any) {
      setError(err.message || 'Failed to push notification popup.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivatePopup = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await db.deactivatePopup();
      setSuccess('Active popup notification deactivated.');
      setCurrentActivePopup(null);
      setPopupIsActive(false);
    } catch (err: any) {
      setError(err.message || 'Failed to deactivate.');
    } finally {
      setLoading(false);
    }
  };

  const loadBooks = async () => {
    setLoading(true);
    try {
      const data = await db.getBooks();
      setBooks(data);
      if (data.length > 0) {
        setTargetBookId(data[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadChapters = async (bookId: string) => {
    try {
      const data = await db.getChapters(bookId);
      setChapters(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookTitle || !bookAuthor) {
      setError('Please fill in all required fields (Book Title & Author).');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const newBook = await db.createBook({
        title: bookTitle,
        author: bookAuthor,
        subject: bookSubject,
        cover_image: bookCover || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400',
        total_chapters: Number(bookTotalChapters)
      });

      setBooks(prev => [...prev, newBook]);
      setSuccess('Book created successfully!');
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      
      // Reset Form
      setBookTitle('');
      setBookAuthor('');
      setBookCover('');
      setBookTotalChapters(1);
    } catch (err: any) {
      setError(err.message || 'Failed to create book in Supabase.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBook = async (id: string) => {
    if (!confirm('Are you sure you want to delete this book? This will not delete its chapters but might cause orphan data.')) return;
    try {
      const success = await db.deleteBook(id);
      if (success) {
        setBooks(prev => prev.filter(b => b.id !== id));
        setSuccess('Book deleted successfully.');
      } else {
        setError('Failed to delete book.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetBookId) {
      setError('Please select a target book first.');
      return;
    }
    if (!chapterTitle || !chapterDesc) {
      setError('Please fill in all required fields (Chapter Title & Description).');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const newChapter = await db.createChapter({
        book_id: targetBookId,
        chapter_number: Number(chapterNum),
        title: chapterTitle,
        description: chapterDesc,
        audio_url: chapterAudio || undefined,
        video_url: chapterVideo || undefined,
        duration_seconds: Number(chapterDuration),
        content_text: chapterText,
        is_free: true
      });

      setChapters(prev => [...prev, newChapter]);
      setSuccess('Chapter created successfully!');
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      
      // Reset Form
      setChapterTitle('');
      setChapterDesc('');
      setChapterNum(prev => prev + 1);
      setChapterAudio('');
      setChapterVideo('');
      setChapterText('');
    } catch (err: any) {
      setError(err.message || 'Failed to create chapter in Supabase.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteChapter = async (id: string) => {
    if (!confirm('Are you sure you want to delete this chapter?')) return;
    try {
      const success = await db.deleteChapter(id);
      if (success) {
        setChapters(prev => prev.filter(c => c.id !== id));
        setSuccess('Chapter deleted successfully.');
      } else {
        setError('Failed to delete chapter.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B1325] text-foreground font-sans pb-16">
      
      {/* --- Top Navbar --- */}
      <header className="glass-nav sticky top-0 z-50 flex items-center justify-between px-6 py-4">
        <div className="flex items-center space-x-3">
          <Link href="/dashboard" className="p-2 -ml-2 text-foreground/80 hover:text-foreground transition rounded-full hover:bg-white/5">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-lg font-bold font-display tracking-wide text-foreground">PrepAI Admin Panel</h1>
        </div>
        
        <Link 
          href="/admin/generate" 
          className="flex items-center gap-1.5 bg-accent hover:bg-amber-500 text-slate-950 px-4 py-2 rounded-xl text-xs font-bold shadow-lg transition"
        >
          <Sparkles className="w-3.5 h-3.5" /> AI MCQ Compiler
        </Link>
      </header>

      <main className="max-w-4xl mx-auto px-6 mt-8">
        
        {/* --- Feedback Banners --- */}
        {error && (
          <div className="bg-error-red/10 border border-error-red/25 rounded-2xl p-4 mb-6 flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-error-red shrink-0 mt-0.5" />
            <p className="text-xs font-medium text-foreground">{error}</p>
          </div>
        )}
        {success && (
          <div className="bg-success-green/10 border border-success-green/25 rounded-2xl p-4 mb-6 flex items-start space-x-3 animate-bounce">
            <CheckCircle className="w-5 h-5 text-success-green shrink-0 mt-0.5" />
            <p className="text-xs font-medium text-foreground">{success}</p>
          </div>
        )}

        {/* --- Tabs Switcher --- */}
        <div className="flex bg-white/5 border border-white/10 rounded-2xl p-1 mb-8">
          <button
            onClick={() => { setActiveTab('books'); setError(''); setSuccess(''); }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition ${activeTab === 'books' ? 'bg-accent text-slate-950 shadow-md' : 'text-foreground/60 hover:text-foreground hover:bg-white/5'}`}
          >
            <FolderPlus className="w-4 h-4" /> Manage Books
          </button>
          <button
            onClick={() => { setActiveTab('chapters'); setError(''); setSuccess(''); }}
            className={`flex-1 flex-max items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition ${activeTab === 'chapters' ? 'bg-accent text-slate-950 shadow-md' : 'text-foreground/60 hover:text-foreground hover:bg-white/5'}`}
          >
            <Layers className="w-4 h-4" /> Manage Chapters & Audio
          </button>
          <button
            onClick={() => { setActiveTab('notifications'); setError(''); setSuccess(''); }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition ${activeTab === 'notifications' ? 'bg-accent text-slate-950 shadow-md' : 'text-foreground/60 hover:text-foreground hover:bg-white/5'}`}
          >
            <Megaphone className="w-4 h-4" /> In-App Popups
          </button>
        </div>

        {/* ========================================================
            BOOKS TAB
           ======================================================== */}
        {activeTab === 'books' && (
          <div className="space-y-8">
            {/* Create Book Form */}
            <form onSubmit={handleCreateBook} className="premium-card p-6 bg-slate-950/40 border border-white/5 space-y-4">
              <h2 className="text-sm font-bold text-accent uppercase tracking-wider flex items-center gap-2">
                <Plus className="w-4 h-4" /> Add New UPSC Syllabus Book
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-foreground/50 uppercase">Book Title *</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Modern Indian History"
                    value={bookTitle}
                    onChange={e => setBookTitle(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-foreground focus:border-accent transition outline-none"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-foreground/50 uppercase">Author / Publication *</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Rajiv Ahir (Spectrum)"
                    value={bookAuthor}
                    onChange={e => setBookAuthor(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-foreground focus:border-accent transition outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-foreground/50 uppercase">Subject Category</label>
                  <select 
                    value={bookSubject}
                    onChange={e => setBookSubject(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-foreground focus:border-accent transition outline-none"
                  >
                    <option value="History" className="bg-slate-900">History</option>
                    <option value="Geography" className="bg-slate-900">Geography</option>
                    <option value="Polity" className="bg-slate-900">Polity</option>
                    <option value="Economics" className="bg-slate-900">Economics</option>
                    <option value="Science" className="bg-slate-900">Science & Tech</option>
                  </select>
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-[11px] font-bold text-foreground/50 uppercase">Cover Image URL</label>
                  <input 
                    type="url" 
                    placeholder="https://images.unsplash.com/... or leave blank"
                    value={bookCover}
                    onChange={e => setBookCover(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-foreground focus:border-accent transition outline-none font-mono"
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-accent hover:bg-amber-500 text-slate-950 font-bold py-3 rounded-xl transition text-xs shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <Save className="w-4 h-4" /> Save Book to Supabase
              </button>
            </form>

            {/* Books List */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-foreground/40 uppercase tracking-wider">Existing Books ({books.length})</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {books.map(b => (
                  <div key={b.id} className="premium-card p-4 bg-white/5 border border-white/5 flex gap-4 items-center">
                    <img 
                      src={b.cover_image} 
                      alt={b.title} 
                      className="w-16 h-20 object-cover rounded-lg bg-slate-800 border border-white/10 shrink-0" 
                    />
                    <div className="flex-1 min-w-0">
                      <span className="text-[9px] font-bold tracking-widest text-accent uppercase font-mono">{b.subject}</span>
                      <h4 className="text-xs font-bold text-foreground truncate mt-0.5">{b.title}</h4>
                      <p className="text-[10px] text-foreground/50 truncate flex items-center gap-1 mt-0.5">
                        <User className="w-3 h-3 text-foreground/35" /> {b.author}
                      </p>
                      
                      <div className="flex justify-between items-center mt-3">
                        <span className="text-[10px] text-foreground/45 font-mono">Chapters: {b.total_chapters}</span>
                        <button 
                          onClick={() => handleDeleteBook(b.id)}
                          className="p-1.5 text-error-red/60 hover:text-error-red hover:bg-error-red/10 rounded-lg transition"
                          title="Delete Book"
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            CHAPTERS TAB
           ======================================================== */}
        {activeTab === 'chapters' && (
          <div className="space-y-8">
            {/* Create Chapter Form */}
            <form onSubmit={handleCreateChapter} className="premium-card p-6 bg-slate-950/40 border border-white/5 space-y-4">
              <h2 className="text-sm font-bold text-accent uppercase tracking-wider flex items-center gap-2">
                <Plus className="w-4 h-4" /> Add Chapter & Audio Narration
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-foreground/50 uppercase font-sans">Select Target Book *</label>
                  <select 
                    value={targetBookId}
                    onChange={e => setTargetBookId(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-foreground focus:border-accent transition outline-none"
                    required
                  >
                    {books.map(b => (
                      <option key={b.id} value={b.id} className="bg-slate-900">{b.title}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-foreground/50 uppercase">Chapter Number *</label>
                  <input 
                    type="number" 
                    placeholder="e.g. 1"
                    value={chapterNum}
                    onChange={e => setChapterNum(Number(e.target.value))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-foreground focus:border-accent transition outline-none"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-foreground/50 uppercase">Est. Duration (Seconds)</label>
                  <input 
                    type="number" 
                    placeholder="e.g. 300 (5 mins)"
                    value={chapterDuration}
                    onChange={e => setChapterDuration(Number(e.target.value))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-foreground focus:border-accent transition outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-foreground/50 uppercase">Chapter Title *</label>
                <input 
                  type="text" 
                  placeholder="e.g. Chapter 1 — Northern India in the First Half of the Eighteenth Century"
                  value={chapterTitle}
                  onChange={e => setChapterTitle(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-foreground focus:border-accent transition outline-none"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-foreground/50 uppercase">Short Description *</label>
                <textarea 
                  placeholder="e.g. Decline of the Mughal Empire and rise of autonomous states..."
                  value={chapterDesc}
                  onChange={e => setChapterDesc(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-foreground focus:border-accent transition outline-none min-h-[60px]"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-foreground/50 uppercase flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <UploadCloud className="w-3.5 h-3.5 text-accent/80" /> Audio File (MP3 / R2)
                    </span>
                    {uploadingAudio && <span className="text-[9px] text-accent font-bold animate-pulse">Uploading to Cloudflare R2...</span>}
                  </label>
                  
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Paste Audio URL or upload file →"
                      value={chapterAudio}
                      onChange={e => setChapterAudio(e.target.value)}
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-foreground focus:border-accent transition outline-none font-mono"
                    />
                    <label className={`cursor-pointer shrink-0 bg-white/5 border border-white/10 hover:border-accent hover:text-accent font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition active:scale-95 ${uploadingAudio ? 'opacity-50 pointer-events-none' : ''}`}>
                      <UploadCloud className="w-4 h-4" />
                      <span>{uploadingAudio ? 'Uploading...' : 'Upload File'}</span>
                      <input 
                        type="file" 
                        accept="audio/*" 
                        onChange={handleAudioUpload} 
                        className="hidden" 
                      />
                    </label>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-foreground/50 uppercase flex items-center gap-1">
                    <Link2 className="w-3.5 h-3.5 text-accent/80" /> Custom Video URL (YouTube)
                  </label>
                  <input 
                    type="url" 
                    placeholder="https://www.youtube.com/watch?v=..."
                    value={chapterVideo}
                    onChange={e => setChapterVideo(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-foreground focus:border-accent transition outline-none font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-foreground/50 uppercase flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-accent/80" /> Chapter Text Content (For AI Audio Reader / Compiler)
                </label>
                <textarea 
                  placeholder="Paste the full textbook chapter text content here. This text will be used for word-by-word highlights and AI compilers..."
                  value={chapterText}
                  onChange={e => setChapterText(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-foreground focus:border-accent transition outline-none min-h-[140px]"
                />
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-accent hover:bg-amber-500 text-slate-950 font-bold py-3 rounded-xl transition text-xs shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <Save className="w-4 h-4" /> Save Chapter to Supabase
              </button>
            </form>

            {/* Chapters List */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-bold text-foreground/40 uppercase tracking-wider">Chapters for Selected Book ({chapters.length})</h3>
                <select 
                  value={targetBookId}
                  onChange={e => setTargetBookId(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-[11px] text-foreground outline-none"
                >
                  {books.map(b => (
                    <option key={b.id} value={b.id} className="bg-slate-900">{b.title}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-3">
                {chapters.map(c => (
                  <div key={c.id} className="premium-card p-4 bg-white/5 border border-white/5 flex justify-between items-center">
                    <div className="min-w-0 flex-1 pr-4">
                      <div className="flex items-center gap-2">
                        <span className="bg-accent/15 border border-accent/20 text-accent font-mono text-[9px] font-bold px-2 py-0.5 rounded-full">
                          Ch {c.chapter_number}
                        </span>
                        <span className="text-[10px] text-foreground/45">
                          {Math.round(c.duration_seconds / 60)} mins
                        </span>
                        {c.audio_url && <span className="text-[10px] text-success-green font-semibold">🔊 Audio Connected</span>}
                        {c.video_url && <span className="text-[10px] text-indigo-400 font-semibold">📺 Video Connected</span>}
                      </div>
                      <h4 className="text-xs font-bold text-foreground truncate mt-2">{c.title}</h4>
                      <p className="text-[10px] text-foreground/50 truncate mt-0.5">{c.description}</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Link 
                        href={`/admin/generate?chapterId=${c.id}`} 
                        className="flex items-center gap-1 bg-white/5 border border-white/10 hover:border-accent hover:text-accent p-2 rounded-xl text-[10px] font-bold transition"
                        title="Generate MCQ via AI"
                      >
                        <Sparkles className="w-3.5 h-3.5" /> MCQ
                      </Link>
                      <button 
                        onClick={() => handleDeleteChapter(c.id)}
                        className="p-2 text-error-red/60 hover:text-error-red hover:bg-error-red/10 rounded-xl transition"
                        title="Delete Chapter"
                      >
                        <Trash className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
                {chapters.length === 0 && (
                  <div className="text-center py-8 bg-white/5 border border-dashed border-white/10 rounded-2xl">
                    <p className="text-[11px] text-foreground/45">No chapters have been added to this book yet.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            POPUP NOTIFICATIONS TAB
           ======================================================== */}
        {activeTab === 'notifications' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Push Popup Form */}
              <form onSubmit={handlePushPopup} className="premium-card p-6 bg-slate-950/40 border border-white/5 space-y-4">
                <h2 className="text-sm font-bold text-accent uppercase tracking-wider flex items-center gap-2">
                  <Megaphone className="w-4 h-4" /> Push Image Notification Popup
                </h2>
                
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-foreground/50 uppercase">Popup Title (Optional)</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Special Offer or New Mock Series!"
                    value={popupTitle}
                    onChange={e => setPopupTitle(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-foreground focus:border-accent transition outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-foreground/50 uppercase">Popup Description (Optional)</label>
                  <textarea 
                    placeholder="e.g. Get 7 days premium gold access code today."
                    value={popupDesc}
                    onChange={e => setPopupDesc(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-foreground focus:border-accent transition outline-none min-h-[70px]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-foreground/50 uppercase">Image URL * (Required)</label>
                  <div className="flex gap-2">
                    <input 
                      type="url" 
                      placeholder="e.g. https://images.unsplash.com/photo-... or upload file →"
                      value={popupImgUrl}
                      onChange={e => setPopupImgUrl(e.target.value)}
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-foreground focus:border-accent transition outline-none font-mono"
                      required
                    />
                    <label className={`cursor-pointer shrink-0 bg-white/5 border border-white/10 hover:border-accent hover:text-accent font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition active:scale-95 ${uploadingImg ? 'opacity-50 pointer-events-none' : ''}`}>
                      <UploadCloud className="w-4 h-4" />
                      <span>{uploadingImg ? 'Uploading...' : 'Upload Image'}</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleImageUpload} 
                        className="hidden" 
                      />
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-foreground/50 uppercase">Action Link / URL *</label>
                    <input 
                      type="text" 
                      placeholder="e.g. /profile or external https://"
                      value={popupActionUrl}
                      onChange={e => setPopupActionUrl(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-foreground focus:border-accent transition outline-none font-mono"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-foreground/50 uppercase">Action Button Label</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Claim Now"
                      value={popupActionLabel}
                      onChange={e => setPopupActionLabel(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-foreground focus:border-accent transition outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input 
                    type="checkbox" 
                    id="popup-active-checkbox"
                    checked={popupIsActive}
                    onChange={e => setPopupIsActive(e.target.checked)}
                    className="w-4 h-4 rounded accent-accent"
                  />
                  <label htmlFor="popup-active-checkbox" className="text-xs font-semibold text-foreground/80 cursor-pointer">
                    Enable and Show this Popup immediately
                  </label>
                </div>

                <div className="flex gap-2 pt-2">
                  <button 
                    type="submit" 
                    disabled={loading}
                    className="flex-1 bg-accent hover:bg-amber-500 text-slate-950 font-bold py-3 rounded-xl transition text-xs shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" /> Push Live Popup
                  </button>
                  {currentActivePopup && (
                    <button 
                      type="button"
                      onClick={handleDeactivatePopup}
                      disabled={loading}
                      className="bg-error-red/10 border border-error-red/25 hover:bg-error-red/20 text-error-red font-bold px-4 py-3 rounded-xl transition text-xs flex items-center justify-center gap-1.5"
                    >
                      <Trash className="w-4 h-4" /> Deactivate
                    </button>
                  )}
                </div>
              </form>

              {/* Preview and Live Status Card */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-foreground/40 uppercase tracking-wider">Live Preview Card</h3>
                
                {popupImgUrl ? (
                  <div className="premium-card bg-slate-950/40 border border-[#10B981]/25 overflow-hidden shadow-2xl relative">
                    <div className="absolute top-3 right-3 bg-[#10B981]/25 text-[#10B981] border border-[#10B981]/40 text-[9px] font-bold px-2 py-0.5 rounded-full z-10">
                      {popupIsActive ? '🟢 Live Active' : '🔴 Inactive'}
                    </div>

                    {/* Popup image */}
                    <div className="relative aspect-video w-full bg-slate-900 overflow-hidden">
                      <img 
                        src={popupImgUrl} 
                        alt="Popup Banner Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as any).src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600';
                        }}
                      />
                    </div>
                    
                    <div className="p-4 space-y-3">
                      {popupTitle && <h4 className="text-xs font-bold text-foreground font-display">{popupTitle}</h4>}
                      {popupDesc && <p className="text-[10px] text-foreground/60 leading-normal">{popupDesc}</p>}
                      
                      <div className="pt-2">
                        <span className="w-full bg-[#10B981] text-slate-950 font-bold py-2 px-4 rounded-xl text-[10px] text-center block tracking-wide uppercase">
                          {popupActionLabel} (Target: {popupActionUrl})
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 bg-white/5 border border-dashed border-white/10 rounded-2xl">
                    <Megaphone className="w-8 h-8 text-foreground/20 mb-2" />
                    <p className="text-[11px] text-foreground/45">Enter an Image URL to see live preview.</p>
                  </div>
                )}

                {/* Database Table SQL Helper */}
                <div className="premium-card p-4 bg-slate-950/60 border border-white/5 space-y-3">
                  <h4 className="text-[10px] font-bold text-accent uppercase tracking-wider flex items-center gap-1.5">
                    <Bell className="w-3.5 h-3.5" /> Supabase Table Required
                  </h4>
                  <p className="text-[9px] text-foreground/50 leading-relaxed">
                    Make sure to run this SQL in your Supabase SQL Editor if you want to store popups in your database:
                  </p>
                  <pre className="bg-[#070B16] border border-white/5 rounded-lg p-2.5 text-[8px] text-[#10B981] font-mono overflow-x-auto select-all max-h-[140px]">
{`create table popups (
  id uuid primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  title text,
  description text,
  image_url text not null,
  action_url text not null,
  action_label text not null default 'View Details',
  is_active boolean default true not null
);
alter table popups enable row level security;
create policy "Allow public read access to popups" on popups for select using (true);
create policy "Allow insert update for everyone" on popups for all using (true);`}
                  </pre>
                </div>
              </div>

            </div>
          </div>
        )}

      </main>
    </div>
  );
}
