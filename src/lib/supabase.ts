import { createClient } from '@supabase/supabase-js';
import { Book, Chapter, MCQ, Flashcard, UserProfile, UserProgress, QuizAttempt, LeaderboardEntry } from '@/types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

// Helper to get local storage data
function getLocalData<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  const val = localStorage.getItem(key);
  return val ? JSON.parse(val) : fallback;
}

function setLocalData<T>(key: string, data: T): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(key, JSON.stringify(data));
  }
}

export const db = {
  // 1. Get User Profile
  async getUserProfile(userId?: string): Promise<UserProfile | null> {
    if (supabase) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const activeUid = userId || user?.id;
        
        if (activeUid) {
          const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', activeUid)
            .single();
          if (!error && data) return data as UserProfile;
        }
      } catch (err) {
        console.error('Error fetching user profile from Supabase:', err);
      }
    }
    
    // Fallback to local storage profile for quick offline onboarding
    const mockProfile: UserProfile = {
      id: userId || 'mock-user-123',
      name: 'UPSC Aspirant',
      email: 'aspirant@prepai.in',
      avatar_url: '',
      streak: 5,
      total_points: 350,
      is_premium: false,
      referral_code: 'PREPAI99',
      exam_type: 'UPSC',
      created_at: new Date().toISOString()
    };
    const saved = getLocalData<UserProfile | null>('prepai_user_profile', null);
    if (!saved) {
      setLocalData('prepai_user_profile', mockProfile);
      return mockProfile;
    }
    return saved;
  },

  // 2. Update User Profile
  async updateUserProfile(profile: Partial<UserProfile>, userId?: string): Promise<UserProfile> {
    if (supabase) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const activeUid = userId || user?.id;
        
        if (activeUid) {
          const { data, error } = await supabase
            .from('users')
            .update(profile)
            .eq('id', activeUid)
            .select()
            .single();
          if (!error && data) return data as UserProfile;
        }
      } catch (err) {
        console.error('Error updating user profile in Supabase:', err);
      }
    }

    const current = await this.getUserProfile(userId);
    const updated = { ...current, ...profile } as UserProfile;
    setLocalData('prepai_user_profile', updated);
    return updated;
  },

  // 3. Get Books
  async getBooks(): Promise<Book[]> {
    if (supabase) {
      const { data, error } = await supabase.from('books').select('*');
      if (error) {
        console.error('Supabase getBooks error:', error);
      }
      if (!error && data) return data as Book[];
    }
    return []; // Return empty list instead of mock static books
  },

  // 4. Get Book Details
  async getBook(bookId: string): Promise<Book | undefined> {
    if (supabase) {
      const { data, error } = await supabase.from('books').select('*').eq('id', bookId).single();
      if (!error && data) return data as Book;
    }
    return undefined;
  },

  // 5. Get Chapters for a Book
  async getChapters(bookId: string): Promise<Chapter[]> {
    if (supabase) {
      const { data, error } = await supabase.from('chapters').select('*').eq('book_id', bookId).order('chapter_number', { ascending: true });
      if (!error && data) return data as Chapter[];
    }
    return [];
  },

  // 6. Get Chapter Details
  async getChapter(chapterId: string): Promise<Chapter | undefined> {
    if (supabase) {
      const { data, error } = await supabase.from('chapters').select('*').eq('id', chapterId).single();
      if (!error && data) return data as Chapter;
    }
    return undefined;
  },

  // 7. Get MCQs for a Chapter
  async getMCQs(chapterId: string): Promise<MCQ[]> {
    if (supabase) {
      const { data, error } = await supabase.from('mcqs').select('*').eq('chapter_id', chapterId);
      if (!error && data) return data as MCQ[];
    }
    return [];
  },

  // 8. Get Flashcards for a Chapter
  async getFlashcards(chapterId: string): Promise<Flashcard[]> {
    if (supabase) {
      const { data, error } = await supabase.from('flashcards').select('*').eq('chapter_id', chapterId);
      if (!error && data) return data as Flashcard[];
    }
    return [];
  },

  // 9. Get User Progress for a Chapter
  async getUserProgress(chapterId: string, userId: string = 'mock-user-123'): Promise<UserProgress | null> {
    if (supabase) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const activeUid = user?.id || userId;
        const { data, error } = await supabase.from('user_progress').select('*').eq('user_id', activeUid).eq('chapter_id', chapterId).single();
        if (!error && data) return data as UserProgress;
      } catch (err) {
        console.error(err);
      }
    }
    const progressList = getLocalData<UserProgress[]>('prepai_user_progress', []);
    const prog = progressList.find(p => p.user_id === userId && p.chapter_id === chapterId);
    return prog || null;
  },

  // 10. Update User Progress
  async updateUserProgress(chapterId: string, progress: Partial<UserProgress>, userId: string = 'mock-user-123'): Promise<UserProgress> {
    if (supabase) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const activeUid = user?.id || userId;
        const { data, error } = await supabase.from('user_progress')
          .upsert({ user_id: activeUid, chapter_id: chapterId, ...progress })
          .select()
          .single();
        if (!error && data) return data as UserProgress;
      } catch (err) {
        console.error(err);
      }
    }
    const progressList = getLocalData<UserProgress[]>('prepai_user_progress', []);
    const index = progressList.findIndex(p => p.user_id === userId && p.chapter_id === chapterId);
    
    const now = new Date().toISOString();
    let updated: UserProgress;

    if (index >= 0) {
      updated = {
        ...progressList[index],
        ...progress,
        completed_at: progress.is_completed ? now : progressList[index].completed_at
      };
      progressList[index] = updated;
    } else {
      updated = {
        id: `prog-${Math.random().toString(36).substr(2, 9)}`,
        user_id: userId,
        chapter_id: chapterId,
        is_completed: progress.is_completed || false,
        last_position_seconds: progress.last_position_seconds || 0,
        score: progress.score || 0,
        completed_at: progress.is_completed ? now : undefined
      };
      progressList.push(updated);
    }
    setLocalData('prepai_user_progress', progressList);

    if (progress.is_completed) {
      const profile = await this.getUserProfile(userId);
      if (profile) {
        await this.updateUserProfile({ total_points: profile.total_points + 50 }, userId);
      }
    }

    return updated;
  },

  // 11. Save Quiz Attempt
  async saveQuizAttempt(attempt: Omit<QuizAttempt, 'id' | 'user_id' | 'created_at'>, userId: string = 'mock-user-123'): Promise<QuizAttempt> {
    if (supabase) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const activeUid = user?.id || userId;
        const { data, error } = await supabase.from('quiz_attempts')
          .insert({ user_id: activeUid, ...attempt })
          .select()
          .single();
        if (!error && data) return data as QuizAttempt;
      } catch (err) {
        console.error(err);
      }
    }
    const attempts = getLocalData<QuizAttempt[]>('prepai_quiz_attempts', []);
    const newAttempt: QuizAttempt = {
      id: `attempt-${Math.random().toString(36).substr(2, 9)}`,
      user_id: userId,
      created_at: new Date().toISOString(),
      ...attempt
    };
    attempts.push(newAttempt);
    setLocalData('prepai_quiz_attempts', attempts);

    const profile = await this.getUserProfile(userId);
    if (profile) {
      const xpEarned = Math.max(10, Math.round(attempt.correct_answers * 15));
      await this.updateUserProfile({ 
        total_points: profile.total_points + xpEarned,
        streak: profile.streak === 0 ? 1 : profile.streak
      }, userId);
    }

    return newAttempt;
  },

  // 12. Get Quiz Attempts
  async getQuizAttempts(userId: string = 'mock-user-123'): Promise<QuizAttempt[]> {
    if (supabase) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const activeUid = user?.id || userId;
        const { data, error } = await supabase.from('quiz_attempts').select('*').eq('user_id', activeUid).order('created_at', { ascending: false });
        if (!error && data) return data as QuizAttempt[];
      } catch (err) {
        console.error(err);
      }
    }
    return getLocalData<QuizAttempt[]>('prepai_quiz_attempts', []);
  },

  // 13. Get Leaderboard
  async getLeaderboard(): Promise<LeaderboardEntry[]> {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('id, name, total_points, avatar_url, streak')
          .order('total_points', { ascending: false })
          .limit(10);
        if (!error && data) {
          return data.map((item, idx) => ({
            id: item.id,
            name: item.name || 'Aspirant',
            total_points: item.total_points || 0,
            avatar_url: item.avatar_url || '',
            streak: item.streak || 0,
            rank: idx + 1
          }));
        }
      } catch (err) {
        console.error(err);
      }
    }
    return [
      { id: '1', name: 'Shreya Iyer (AIR 4)', total_points: 1250, streak: 12, rank: 1, avatar_url: '' },
      { id: '2', name: 'Aniket Sharma', total_points: 980, streak: 8, rank: 2, avatar_url: '' },
      { id: '3', name: 'Rahul Varma', total_points: 850, streak: 5, rank: 3, avatar_url: '' },
      { id: 'mock-user-123', name: 'UPSC Aspirant (You)', total_points: 350, streak: 3, rank: 4, avatar_url: '' }
    ];
  },

  // 14. Create Book
  async createBook(book: Omit<Book, 'id' | 'created_at'>): Promise<Book> {
    const id = `book-${Math.random().toString(36).substr(2, 9)}`;
    const newBook: Book = {
      id,
      created_at: new Date().toISOString(),
      ...book
    };
    if (supabase) {
      const { data, error } = await supabase.from('books').insert(newBook).select().single();
      if (error) {
        console.error("Error creating book in Supabase:", error);
        throw new Error(error.message);
      }
      if (data) return data as Book;
    }
    return newBook;
  },

  // 15. Delete Book
  async deleteBook(bookId: string): Promise<boolean> {
    if (supabase) {
      const { error } = await supabase.from('books').delete().eq('id', bookId);
      if (error) {
        console.error("Error deleting book in Supabase:", error);
        throw new Error(error.message);
      }
      return true;
    }
    return true;
  },

  // 16. Create Chapter
  async createChapter(chapter: Omit<Chapter, 'id' | 'created_at'>): Promise<Chapter> {
    const id = `chapter-${Math.random().toString(36).substr(2, 9)}`;
    const newChapter: Chapter = {
      id,
      created_at: new Date().toISOString(),
      ...chapter
    };
    if (supabase) {
      const { data, error } = await supabase.from('chapters').insert(newChapter).select().single();
      if (error) {
        console.error("Error creating chapter in Supabase:", error);
        throw new Error(error.message);
      }
      if (data) return data as Chapter;
    }
    return newChapter;
  },

  // 17. Delete Chapter
  async deleteChapter(chapterId: string): Promise<boolean> {
    if (supabase) {
      const { error } = await supabase.from('chapters').delete().eq('id', chapterId);
      if (error) {
        console.error("Error deleting chapter in Supabase:", error);
        throw new Error(error.message);
      }
      return true;
    }
    return true;
  },

  // 18. Create MCQ
  async createMCQ(mcq: Omit<MCQ, 'id' | 'created_at'>): Promise<MCQ> {
    const id = `mcq-${Math.random().toString(36).substr(2, 9)}`;
    const newMCQ: MCQ = {
      id,
      created_at: new Date().toISOString(),
      ...mcq
    };
    if (supabase) {
      const { data, error } = await supabase.from('mcqs').insert(newMCQ).select().single();
      if (error) {
        console.error("Error creating MCQ in Supabase:", error);
        throw new Error(error.message);
      }
      if (data) return data as MCQ;
    }
    return newMCQ;
  },

  // 19. Create Flashcard
  async createFlashcard(fc: Omit<Flashcard, 'id' | 'created_at'>): Promise<Flashcard> {
    const id = `flashcard-${Math.random().toString(36).substr(2, 9)}`;
    const newFC: Flashcard = {
      id,
      created_at: new Date().toISOString(),
      ...fc
    };
    if (supabase) {
      const { data, error } = await supabase.from('flashcards').insert(newFC).select().single();
      if (error) {
        console.error("Error creating Flashcard in Supabase:", error);
        throw new Error(error.message);
      }
      if (data) return data as Flashcard;
    }
    return newFC;
  }
};
