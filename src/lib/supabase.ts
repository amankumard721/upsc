import { createClient } from '@supabase/supabase-js';
import { Book, Chapter, MCQ, Flashcard, UserProfile, UserProgress, QuizAttempt, LeaderboardEntry } from '@/types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Initialize real Supabase if credentials are provided
export const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

// ==========================================
// MOCK DATABASE & SEED DATA (FALLBACK)
// ==========================================

const MOCK_BOOKS: Book[] = [
  {
    id: 'polity-laxmikanth',
    title: 'Indian Polity',
    author: 'M. Laxmikanth',
    subject: 'Polity',
    cover_image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&q=80',
    total_chapters: 3,
    created_at: new Date().toISOString()
  },
  {
    id: 'history-bipinchandra',
    title: 'History of Modern India',
    author: 'Bipin Chandra',
    subject: 'History',
    cover_image: 'https://images.unsplash.com/photo-1461360370896-922624d12aa1?w=400&q=80',
    total_chapters: 2,
    created_at: new Date().toISOString()
  },
  {
    id: 'geography-gcleong',
    title: 'Certificate Physical and Human Geography',
    author: 'G.C. Leong',
    subject: 'Geography',
    cover_image: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?w=400&q=80',
    total_chapters: 2,
    created_at: new Date().toISOString()
  },
  {
    id: 'economy-rameshsingh',
    title: 'Indian Economy',
    author: 'Ramesh Singh',
    subject: 'Economy',
    cover_image: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&q=80',
    total_chapters: 2,
    created_at: new Date().toISOString()
  }
];

const MOCK_CHAPTERS: Chapter[] = [
  // Indian Polity
  {
    id: 'polity-ch1',
    book_id: 'polity-laxmikanth',
    chapter_number: 1,
    title: 'Historical Background',
    description: 'Understand the constitutional developments during British Rule, including the Regulating Act of 1773 and the Charter Acts.',
    duration_seconds: 600,
    is_free: true,
    video_url: 'https://www.youtube.com/watch?v=Xn7K_F2Gssw', // Mock UPSC Polity video
    audio_url: 'polity-ch1-audio',
    content_text: `The Constitution of India was not created in a day. It has its roots in the British administration in India. The British came to India in 1600 as traders, in the form of the East India Company, which had the exclusive right of trading in India under a charter granted by Queen Elizabeth I.

In 1765, the Company, which till now had purely trading functions, obtained the 'Diwani' (i.e., rights over revenue and civil justice) of Bengal, Bihar, and Orissa. This started its career as a territorial power. 

The historical background can be broadly divided into two phases:
1. The Company Rule (1773-1858)
2. The Crown Rule (1858-1947)

**The Company Rule (1773-1858)**
The Regulating Act of 1773 was the first step taken by the British Government to control and regulate the affairs of the East India Company in India. It designated the Governor of Bengal as the 'Governor-General of Bengal' and created an Executive Council of four members to assist him. Lord Warren Hastings was the first Governor-General of Bengal. The Act also provided for the establishment of a Supreme Court at Calcutta in 1774.

**The Pitt's India Act of 1784**
To rectify the defects of the Regulating Act of 1773, the British Parliament passed the Amending Act of 1781, also known as the Act of Settlement. The next important act was the Pitt's India Act of 1784. It distinguished between the commercial and political functions of the Company. It allowed the Court of Directors to manage the commercial affairs but created a new body called the Board of Control to manage the political affairs. Thus, it established a system of double government.

**The Charter Act of 1833**
This Act was the final step towards centralisation in British India. It made the Governor-General of Bengal as the 'Governor-General of India' and vested in him all civil and military powers. Lord William Bentinck was the first Governor-General of India. It deprived the governors of Bombay and Madras of their legislative powers. The East India Company ended its activities as a commercial body and became a purely administrative body.`,
    created_at: new Date().toISOString()
  },
  {
    id: 'polity-ch2',
    book_id: 'polity-laxmikanth',
    chapter_number: 2,
    title: 'Making of the Constitution',
    description: 'Learn about the Constituent Assembly, its composition, working, committees, and the enactment of the Constitution.',
    duration_seconds: 720,
    is_free: true,
    video_url: 'https://www.youtube.com/watch?v=0kG7Rk_14_Y',
    audio_url: 'polity-ch2-audio',
    content_text: `It was in 1934 that the idea of a Constituent Assembly for India was proposed for the first time by M.N. Roy, a pioneer of the communist movement in India. In 1935, the Indian National Congress (INC) for the first time officially demanded a Constituent Assembly to frame the Constitution of India.

The demand was finally accepted in principle by the British Government in what is known as the 'August Offer' of 1940. In 1942, Sir Stafford Cripps, a member of the cabinet, came to India with a draft proposal of the British Government on the framing of an independent constitution to be adopted after World War II.

**Composition of the Constituent Assembly**
The Constituent Assembly was constituted in November 1946 under the scheme formulated by the Cabinet Mission Plan. The total strength of the Assembly was to be 389. Of these, 296 seats were to be allotted to British India and 93 seats to the Princely States. 

The Assembly held its first meeting on December 9, 1946. The Muslim League boycotted the meeting and insisted on a separate state of Pakistan. The meeting was thus attended by only 211 members. Dr. Sachchidanand Sinha, the oldest member, was elected as the temporary President of the Assembly, following the French practice. Later, Dr. Rajendra Prasad was elected as the President of the Assembly. H.C. Mukherjee and V.T. Krishnamachari were elected as the Vice-Presidents.

**Drafting Committee**
Among all the committees of the Constituent Assembly, the most important committee was the Drafting Committee set up on August 29, 1947. It was this committee that was entrusted with the task of preparing a draft of the new Constitution. It consisted of seven members, chaired by Dr. B.R. Ambedkar, who is recognized as the 'Father of the Constitution of India'.`,
    created_at: new Date().toISOString()
  },
  {
    id: 'polity-ch3',
    book_id: 'polity-laxmikanth',
    chapter_number: 3,
    title: 'Salient Features of the Constitution',
    description: 'Explore the key features of the Indian Constitution, such as the lengthiest written constitution, federal system, and parliamentary form.',
    duration_seconds: 800,
    is_free: false,
    video_url: 'https://www.youtube.com/watch?v=O1aY6gWqJ5w',
    audio_url: 'polity-ch3-audio',
    content_text: `The Indian Constitution is unique in its contents and spirit. Though borrowed from almost every constitution of the world, the Constitution of India has several salient features that distinguish it from the constitutions of other countries.

It is important to note that a number of original features of the Constitution (as adopted in 1949) have undergone a substantial change, on account of several amendments, particularly the 7th, 42nd, 44th, 73rd, 74th, 97th, and 101st Amendments. The 42nd Amendment Act (1976) is known as 'Mini-Constitution' due to the important and large number of changes made by it.

**Salient Features:**
1. **Lengthiest Written Constitution**: Constitutions are classified into written (like the American) and unwritten (like the British). The Constitution of India is a written constitution and holds the distinction of being the lengthiest written constitution in the world. This is due to geographical factors, historical factors, single constitution for both Centre and States, and dominance of legal luminaries in the Constituent Assembly.
2. **Drawn from Various Sources**: The Constitution of India has borrowed most of its provisions from the constitutions of various other countries as well as from the Government of India Act of 1935. Dr. B.R. Ambedkar proudly acclaimed that the Constitution of India has been framed after 'ransacking all the known constitutions of the world'.
3. **Blend of Rigidity and Flexibility**: Constitutions are also classified into rigid and flexible. A rigid constitution is one that requires a special procedure for its amendment (e.g., American). A flexible constitution is one that can be amended in the same manner as the ordinary laws (e.g., British). The Indian Constitution is neither rigid nor flexible, but a synthesis of both.
4. **Federal System with Unitary Bias**: The Constitution of India establishes a federal system of government. It contains all the usual features of a federation, viz., two governments, division of powers, written constitution, supremacy of constitution, rigidity of constitution, independent judiciary and bicameralism. However, it also contains a large number of unitary or non-federal features. Moreover, the term 'Federation' has nowhere been used in the Constitution. Article 1, on the other hand, describes India as a 'Union of States'.`,
    created_at: new Date().toISOString()
  },
  // Modern History
  {
    id: 'history-ch1',
    book_id: 'history-bipinchandra',
    chapter_number: 1,
    title: 'Decline of the Mughal Empire',
    description: 'Trace the factors leading to the disintegration of the Mughal Empire in the 18th century after Aurangzeb.',
    duration_seconds: 640,
    is_free: true,
    video_url: 'https://www.youtube.com/watch?v=F_fP49H29-M',
    audio_url: 'history-ch1-audio',
    content_text: `The great Mughal Empire, which had dominated the Indian subcontinent for over two centuries, began to decline and disintegrate in the first half of the 18th century. The reign of Aurangzeb (1658-1707) marked the beginning of the end, although the empire survived for another 150 years as a nominal authority.

**Factors for Decline:**
1. **Aurangzeb's Policies**: Aurangzeb's religious orthodoxy, long campaigns in the Deccan, and alienation of the Rajputs and Marathas severely weakened the empire's stability. His Deccan wars exhausted the treasury and destroyed the administration of Northern India.
2. **Weak Successors**: After Aurangzeb died in 1707, a war of succession broke out among his three sons. Bahadur Shah I emerged victorious but was already old. The subsequent rulers (like Farrukhsiyar, Muhammad Shah, and Jahandar Shah) were weak, incompetent, and puppets in the hands of powerful nobles.
3. **Court Factions**: The Mughal court became a hotbed of intrigue. Nobles divided themselves into rival groups: Irani, Turani, Afghani, and Hindustani (Indian Muslims). They fought for power, titles, and jagirs, neglecting the interests of the empire.
4. **Foreign Invasions**: The weak defenses of the empire invited foreign invaders. Nadir Shah, the Persian ruler, invaded India in 1739. He defeated the Mughal army at Karnal, plundered Delhi, and took away the famous Peacock Throne and the Koh-i-Noor diamond. Later, Ahmad Shah Abdali, the ruler of Afghanistan, invaded India several times between 1748 and 1767, culminating in the Third Battle of Panipat in 1761.`,
    created_at: new Date().toISOString()
  }
];

const MOCK_MCQS: MCQ[] = [
  // Polity Chapter 1 MCQs
  {
    id: 'mcq-p1-1',
    chapter_id: 'polity-ch1',
    question: 'Which of the following acts introduced for the first time the system of double government in British India?',
    option_a: 'Regulating Act of 1773',
    option_b: 'Pitt’s India Act of 1784',
    option_c: 'Charter Act of 1813',
    option_d: 'Charter Act of 1833',
    correct_option: 'B',
    explanation: 'The Pitt’s India Act of 1784 distinguished between the commercial and political functions of the East India Company. It allowed the Court of Directors to manage commercial affairs but created a new body called the Board of Control to manage political affairs. Thus, it established a system of double government.',
    difficulty: 'Easy',
    year_asked: 2018,
    created_at: new Date().toISOString()
  },
  {
    id: 'mcq-p1-2',
    chapter_id: 'polity-ch1',
    question: 'Who was the first Governor-General of India?',
    option_a: 'Lord Warren Hastings',
    option_b: 'Lord William Bentinck',
    option_c: 'Lord Mountbatten',
    option_d: 'Lord Canning',
    correct_option: 'B',
    explanation: 'The Charter Act of 1833 made the Governor-General of Bengal as the Governor-General of India and vested in him all civil and military powers. Lord William Bentinck was the first Governor-General of India.',
    difficulty: 'Easy',
    year_asked: 2015,
    created_at: new Date().toISOString()
  },
  {
    id: 'mcq-p1-3',
    chapter_id: 'polity-ch1',
    question: 'Consider the following statements regarding the Regulating Act of 1773:\n1. It established a Supreme Court at Calcutta in 1774.\n2. It made the Governors of Bombay and Madras Presidencies subordinate to the Governor-General of Bengal.\nWhich of the statements given above is/are correct?',
    option_a: '1 only',
    option_b: '2 only',
    option_c: 'Both 1 and 2',
    option_d: 'Neither 1 nor 2',
    correct_option: 'C',
    explanation: 'Both statements are correct. The Regulating Act of 1773 provided for the establishment of a Supreme Court at Calcutta (comprising a Chief Justice and three other judges) in 1774. It also made the governors of Bombay and Madras presidencies subordinate to the governor-general of Bengal, unlike earlier when the three presidencies were independent of one another.',
    difficulty: 'Medium',
    year_asked: 2021,
    created_at: new Date().toISOString()
  },
  // Polity Chapter 2 MCQs
  {
    id: 'mcq-p2-1',
    chapter_id: 'polity-ch2',
    question: 'Who among the following was the temporary President of the Constituent Assembly during its first meeting on December 9, 1946?',
    option_a: 'Dr. Rajendra Prasad',
    option_b: 'Dr. B.R. Ambedkar',
    option_c: 'Dr. Sachchidanand Sinha',
    option_d: 'Jawaharlal Nehru',
    correct_option: 'C',
    explanation: 'Dr. Sachchidanand Sinha, the oldest member of the Constituent Assembly, was elected as the temporary President of the Assembly, following the French practice of electing the oldest member. Later, on December 11, 1946, Dr. Rajendra Prasad was elected as the permanent President of the Assembly.',
    difficulty: 'Easy',
    year_asked: 2017,
    created_at: new Date().toISOString()
  },
  {
    id: 'mcq-p2-2',
    chapter_id: 'polity-ch2',
    question: 'Who proposed the idea of a Constituent Assembly for India for the first time in 1934?',
    option_a: 'M.N. Roy',
    option_b: 'Mahatma Gandhi',
    option_c: 'Jawaharlal Nehru',
    option_d: 'Subhash Chandra Bose',
    correct_option: 'A',
    explanation: 'The idea of a Constituent Assembly for India was proposed for the first time in 1934 by M.N. Roy, a pioneer of the communist movement in India and an advocate of radical democratism.',
    difficulty: 'Easy',
    year_asked: 2019,
    created_at: new Date().toISOString()
  }
];

const MOCK_FLASHCARDS: Flashcard[] = [
  // Polity Chapter 1 Flashcards
  {
    id: 'fc-p1-1',
    chapter_id: 'polity-ch1',
    front_text: 'What did the Regulating Act of 1773 designate the Governor of Bengal as?',
    back_text: 'The Governor-General of Bengal (Lord Warren Hastings was the first).',
    created_at: new Date().toISOString()
  },
  {
    id: 'fc-p1-2',
    chapter_id: 'polity-ch1',
    front_text: 'Which act established the system of double government?',
    back_text: 'Pitt’s India Act of 1784 (created the Board of Control to manage political affairs while Court of Directors managed commercial affairs).',
    created_at: new Date().toISOString()
  },
  {
    id: 'fc-p1-3',
    chapter_id: 'polity-ch1',
    front_text: 'Which act was the final step towards centralisation in British India?',
    back_text: 'The Charter Act of 1833 (made the Governor-General of Bengal the Governor-General of India).',
    created_at: new Date().toISOString()
  },
  // Polity Chapter 2 Flashcards
  {
    id: 'fc-p2-1',
    chapter_id: 'polity-ch2',
    front_text: 'When did the Constituent Assembly hold its first meeting?',
    back_text: 'December 9, 1946 (boycotted by the Muslim League, attended by 211 members).',
    created_at: new Date().toISOString()
  },
  {
    id: 'fc-p2-2',
    chapter_id: 'polity-ch2',
    front_text: 'Who chaired the Drafting Committee of the Constituent Assembly?',
    back_text: 'Dr. B.R. Ambedkar (set up on August 29, 1947, consisting of 7 members).',
    created_at: new Date().toISOString()
  }
];

// Active mock user profile state (stored in localStorage)
const DEFAULT_USER: UserProfile = {
  id: 'mock-user-123',
  name: 'Aniket Sharma',
  email: 'aniket.sharma@upsc.gov.in',
  avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&q=80',
  streak: 5,
  total_points: 1250,
  is_premium: false,
  created_at: new Date().toISOString(),
  exam_type: 'UPSC',
  referral_code: 'PREPAI99'
};

const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  { id: 'leader-1', name: 'Ravi Kumar (AIR 4)', avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80', total_points: 4850, streak: 42 },
  { id: 'leader-2', name: 'Divya Tanwar', avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80', total_points: 4200, streak: 31 },
  { id: 'leader-3', name: 'Shruti Sharma', avatar_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&q=80', total_points: 3950, streak: 28 },
  { id: 'leader-4', name: 'Aniket Sharma (You)', avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&q=80', total_points: 1250, streak: 5 },
  { id: 'leader-5', name: 'Priyanka Goel', avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&q=80', total_points: 1100, streak: 12 }
];

// Helper to initialize local storage database
const getLocalData = <T>(key: string, defaultValue: T): T => {
  if (typeof window === 'undefined') return defaultValue;
  const stored = localStorage.getItem(key);
  if (!stored) {
    localStorage.setItem(key, JSON.stringify(defaultValue));
    return defaultValue;
  }
  return JSON.parse(stored);
};

const setLocalData = <T>(key: string, data: T): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(data));
};

// ==========================================
// DB SERVICE WRAPPER
// ==========================================
export const db = {
  // 1. Get User Profile
  async getUserProfile(userId: string = 'mock-user-123'): Promise<UserProfile> {
    if (supabase) {
      const { data, error } = await supabase.from('users').select('*').eq('id', userId).single();
      if (!error && data) return data as UserProfile;
    }
    return getLocalData<UserProfile>('prepai_user_profile', DEFAULT_USER);
  },

  // 2. Update User Profile (e.g. points, streak, premium)
  async updateUserProfile(profile: Partial<UserProfile>, userId: string = 'mock-user-123'): Promise<UserProfile> {
    if (supabase) {
      const { data, error } = await supabase.from('users').update(profile).eq('id', userId).select().single();
      if (!error && data) return data as UserProfile;
    }
    const current = getLocalData<UserProfile>('prepai_user_profile', DEFAULT_USER);
    const updated = { ...current, ...profile };
    setLocalData('prepai_user_profile', updated);
    return updated;
  },

  // 3. Get Books
  async getBooks(): Promise<Book[]> {
    if (supabase) {
      const { data, error } = await supabase.from('books').select('*');
      if (!error && data && data.length > 0) return data as Book[];
    }
    return MOCK_BOOKS;
  },

  // 4. Get Book Details
  async getBook(bookId: string): Promise<Book | undefined> {
    if (supabase) {
      const { data, error } = await supabase.from('books').select('*').eq('id', bookId).single();
      if (!error && data) return data as Book;
    }
    return MOCK_BOOKS.find(b => b.id === bookId);
  },

  // 5. Get Chapters for a Book
  async getChapters(bookId: string): Promise<Chapter[]> {
    if (supabase) {
      const { data, error } = await supabase.from('chapters').select('*').eq('book_id', bookId).order('chapter_number', { ascending: true });
      if (!error && data) return data as Chapter[];
    }
    return MOCK_CHAPTERS.filter(c => c.book_id === bookId);
  },

  // 6. Get Chapter Details
  async getChapter(chapterId: string): Promise<Chapter | undefined> {
    if (supabase) {
      const { data, error } = await supabase.from('chapters').select('*').eq('id', chapterId).single();
      if (!error && data) return data as Chapter;
    }
    return MOCK_CHAPTERS.find(c => c.id === chapterId);
  },

  // 7. Get MCQs for a Chapter
  async getMCQs(chapterId: string): Promise<MCQ[]> {
    if (supabase) {
      const { data, error } = await supabase.from('mcqs').select('*').eq('chapter_id', chapterId);
      if (!error && data && data.length > 0) return data as MCQ[];
    }
    const mockList = MOCK_MCQS.filter(m => m.chapter_id === chapterId);
    const customList = getLocalData<MCQ[]>(`prepai_custom_chapter_mcqs_${chapterId}`, []);
    return [...mockList, ...customList];
  },

  // 8. Get Flashcards for a Chapter
  async getFlashcards(chapterId: string): Promise<Flashcard[]> {
    if (supabase) {
      const { data, error } = await supabase.from('flashcards').select('*').eq('chapter_id', chapterId);
      if (!error && data && data.length > 0) return data as Flashcard[];
    }
    return MOCK_FLASHCARDS.filter(f => f.chapter_id === chapterId);
  },

  // 9. Get User Progress for a Chapter
  async getUserProgress(chapterId: string, userId: string = 'mock-user-123'): Promise<UserProgress | null> {
    if (supabase) {
      const { data, error } = await supabase.from('user_progress').select('*').eq('user_id', userId).eq('chapter_id', chapterId).single();
      if (!error && data) return data as UserProgress;
    }
    const progressList = getLocalData<UserProgress[]>('prepai_user_progress', []);
    const prog = progressList.find(p => p.user_id === userId && p.chapter_id === chapterId);
    return prog || null;
  },

  // 10. Update User Progress
  async updateUserProgress(chapterId: string, progress: Partial<UserProgress>, userId: string = 'mock-user-123'): Promise<UserProgress> {
    if (supabase) {
      const { data, error } = await supabase.from('user_progress')
        .upsert({ user_id: userId, chapter_id: chapterId, ...progress })
        .select()
        .single();
      if (!error && data) return data as UserProgress;
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

    // If completed, add XP/Points to user
    if (progress.is_completed) {
      const profile = getLocalData<UserProfile>('prepai_user_profile', DEFAULT_USER);
      setLocalData('prepai_user_profile', {
        ...profile,
        total_points: profile.total_points + 50
      });
    }

    return updated;
  },

  // 11. Add Quiz Attempt
  async saveQuizAttempt(attempt: Omit<QuizAttempt, 'id' | 'created_at' | 'user_id'>, userId: string = 'mock-user-123'): Promise<QuizAttempt> {
    if (supabase) {
      const { data, error } = await supabase.from('quiz_attempts')
        .insert({ user_id: userId, ...attempt })
        .select()
        .single();
      if (!error && data) return data as QuizAttempt;
    }
    const attempts = getLocalData<QuizAttempt[]>('prepai_quiz_attempts', []);
    const newAttempt: QuizAttempt = {
      id: `attempt-${Math.random().toString(36).substr(2, 9)}`,
      user_id: userId,
      chapter_id: attempt.chapter_id,
      total_questions: attempt.total_questions,
      correct_answers: attempt.correct_answers,
      score: attempt.score,
      time_taken_seconds: attempt.time_taken_seconds,
      created_at: new Date().toISOString()
    };
    attempts.push(newAttempt);
    setLocalData('prepai_quiz_attempts', attempts);

    // Add XP Points
    const profile = getLocalData<UserProfile>('prepai_user_profile', DEFAULT_USER);
    setLocalData('prepai_user_profile', {
      ...profile,
      total_points: profile.total_points + Math.max(0, Math.floor(attempt.score * 10))
    });

    return newAttempt;
  },

  // 12. Get Quiz Attempts
  async getQuizAttempts(userId: string = 'mock-user-123'): Promise<QuizAttempt[]> {
    if (supabase) {
      const { data, error } = await supabase.from('quiz_attempts').select('*').eq('user_id', userId).order('created_at', { ascending: false });
      if (!error && data) return data as QuizAttempt[];
    }
    return getLocalData<QuizAttempt[]>('prepai_quiz_attempts', []);
  },

  // 13. Get Leaderboard
  async getLeaderboard(): Promise<LeaderboardEntry[]> {
    const profile = getLocalData<UserProfile>('prepai_user_profile', DEFAULT_USER);
    // Sync active user profile with leaderboard
    return MOCK_LEADERBOARD.map(entry => {
      if (entry.id === 'leader-4') {
        return {
          ...entry,
          name: `${profile.name} (You)`,
          total_points: profile.total_points,
          streak: profile.streak,
          avatar_url: profile.avatar_url
        };
      }
      return entry;
    }).sort((a, b) => b.total_points - a.total_points).map((entry, index) => ({ ...entry, rank: index + 1 }));
  }
};
