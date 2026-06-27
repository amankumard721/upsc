export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar_url: string;
  streak: number;
  total_points: number;
  is_premium: boolean;
  created_at: string;
  exam_type?: string;
  referral_code?: string;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  subject: string;
  cover_image: string;
  total_chapters: number;
  created_at: string;
}

export interface Chapter {
  id: string;
  book_id: string;
  chapter_number: number;
  title: string;
  description: string;
  audio_url?: string;
  video_url?: string;
  duration_seconds: number;
  is_free: boolean;
  content_text: string;
  created_at: string;
}

export interface MCQ {
  id: string;
  chapter_id: string;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: 'A' | 'B' | 'C' | 'D';
  explanation: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  year_asked?: number;
  created_at: string;
}

export interface Flashcard {
  id: string;
  chapter_id: string;
  front_text: string;
  back_text: string;
  created_at: string;
  due_date?: string; // for spaced repetition
  interval?: number; // for spaced repetition
  ease_factor?: number; // for spaced repetition
}

export interface UserProgress {
  id: string;
  user_id: string;
  chapter_id: string;
  is_completed: boolean;
  last_position_seconds: number;
  score: number;
  completed_at?: string;
}

export interface QuizAttempt {
  id: string;
  user_id: string;
  chapter_id: string;
  total_questions: number;
  correct_answers: number;
  score: number;
  time_taken_seconds: number;
  created_at: string;
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  avatar_url: string;
  total_points: number;
  streak: number;
  rank?: number;
}
