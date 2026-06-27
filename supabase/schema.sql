-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY,
  name text,
  email text UNIQUE,
  avatar_url text,
  streak integer DEFAULT 0,
  total_points integer DEFAULT 0,
  is_premium boolean DEFAULT false,
  created_at timestamp WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Books Table
CREATE TABLE IF NOT EXISTS books (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  author text,
  subject text NOT NULL,
  cover_image text,
  total_chapters integer DEFAULT 0,
  created_at timestamp WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Chapters Table
CREATE TABLE IF NOT EXISTS chapters (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  book_id uuid REFERENCES books(id) ON DELETE CASCADE,
  chapter_number integer NOT NULL,
  title text NOT NULL,
  description text,
  audio_url text,
  video_url text,
  duration_seconds integer DEFAULT 0,
  is_free boolean DEFAULT false,
  content_text text, -- Text content for lesson player and AI features
  created_at timestamp WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. MCQ Table
CREATE TABLE IF NOT EXISTS mcqs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  chapter_id uuid REFERENCES chapters(id) ON DELETE CASCADE,
  question text NOT NULL,
  option_a text NOT NULL,
  option_b text NOT NULL,
  option_c text NOT NULL,
  option_d text NOT NULL,
  correct_option text NOT NULL CHECK (correct_option IN ('A', 'B', 'C', 'D')),
  explanation text,
  difficulty text CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
  year_asked integer,
  created_at timestamp WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Flashcards Table
CREATE TABLE IF NOT EXISTS flashcards (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  chapter_id uuid REFERENCES chapters(id) ON DELETE CASCADE,
  front_text text NOT NULL,
  back_text text NOT NULL,
  created_at timestamp WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. User Progress Table
CREATE TABLE IF NOT EXISTS user_progress (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  chapter_id uuid REFERENCES chapters(id) ON DELETE CASCADE,
  is_completed boolean DEFAULT false,
  last_position_seconds integer DEFAULT 0,
  score integer DEFAULT 0,
  completed_at timestamp WITH TIME ZONE,
  UNIQUE (user_id, chapter_id)
);

-- 7. Quiz Attempts Table
CREATE TABLE IF NOT EXISTS quiz_attempts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  chapter_id uuid REFERENCES chapters(id) ON DELETE CASCADE,
  total_questions integer NOT NULL,
  correct_answers integer NOT NULL,
  score numeric NOT NULL,
  time_taken_seconds integer,
  created_at timestamp WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE mcqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;

-- Create Policies (Read accessible to everyone, writes restricted)
CREATE POLICY "Allow public read on books" ON books FOR SELECT USING (true);
CREATE POLICY "Allow public read on chapters" ON chapters FOR SELECT USING (true);
CREATE POLICY "Allow public read on mcqs" ON mcqs FOR SELECT USING (true);
CREATE POLICY "Allow public read on flashcards" ON flashcards FOR SELECT USING (true);

-- User Policies
CREATE POLICY "Allow users to read their own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Allow users to update their own profile" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Allow insert of user profile on sign up" ON users FOR INSERT WITH CHECK (auth.uid() = id);

-- User Progress Policies
CREATE POLICY "Allow users to read their progress" ON user_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Allow users to manage their progress" ON user_progress FOR ALL USING (auth.uid() = user_id);

-- Quiz Attempts Policies
CREATE POLICY "Allow users to read their quiz attempts" ON quiz_attempts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Allow users to insert their quiz attempts" ON quiz_attempts FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Trigger to create user profile in users table when auth.users is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, name, email, avatar_url, streak, total_points, is_premium)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name', 'UPSC Aspirant'),
    new.email,
    COALESCE(new.raw_user_meta_data->>'avatar_url', ''),
    0,
    0,
    false
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
