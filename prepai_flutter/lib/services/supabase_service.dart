import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';
import 'package:uuid/uuid.dart';
import '../models/models.dart';

class SupabaseService {
  final SupabaseClient _client = Supabase.instance.client;
  static const String _profileKey = 'prepai_user_profile';
  static const String _progressKey = 'prepai_user_progress';
  static const String _attemptsKey = 'prepai_quiz_attempts';

  // Helper to check if user is authenticated, otherwise signs in anonymously
  Future<String> getOrCreateUserId() async {
    try {
      final session = _client.auth.currentSession;
      if (session != null) {
        return session.user.id;
      }
      
      // Try signing in anonymously
      final response = await _client.auth.signInAnonymously();
      if (response.user != null) {
        return response.user!.id;
      }
    } catch (e) {
      print('Anonymous Auth error: $e');
    }
    return 'mock-user-123'; // offline/mock fallback ID
  }

  // 1. Fetch Books
  Future<List<Book>> getBooks() async {
    try {
      final response = await _client
          .from('books')
          .select();
      
      final list = response as List<dynamic>;
      return list.map((json) => Book.fromJson(json)).toList();
    } catch (e) {
      print('Supabase getBooks error: $e. Using local/mock fallback.');
      return _getMockBooks();
    }
  }

  // 2. Fetch Chapters
  Future<List<Chapter>> getChapters(String bookId) async {
    try {
      final response = await _client
          .from('chapters')
          .select()
          .eq('book_id', bookId)
          .order('chapter_number', ascending: true);
      
      final list = response as List<dynamic>;
      return list.map((json) => Chapter.fromJson(json)).toList();
    } catch (e) {
      print('Supabase getChapters error: $e. Using local/mock fallback.');
      return _getMockChapters().where((ch) => ch.bookId == bookId).toList();
    }
  }

  // 3. Fetch Chapter by ID
  Future<Chapter?> getChapter(String chapterId) async {
    try {
      final response = await _client
          .from('chapters')
          .select()
          .eq('id', chapterId)
          .single();
      
      return Chapter.fromJson(response);
    } catch (e) {
      print('Supabase getChapter error: $e. Using local/mock fallback.');
      try {
        return _getMockChapters().firstWhere((ch) => ch.id == chapterId);
      } catch (_) {
        return null;
      }
    }
  }

  // 4. Fetch MCQs for Chapter
  Future<List<MCQ>> getMCQs(String chapterId) async {
    try {
      final response = await _client
          .from('mcqs')
          .select()
          .eq('chapter_id', chapterId);
      
      final list = response as List<dynamic>;
      return list.map((json) => MCQ.fromJson(json)).toList();
    } catch (e) {
      print('Supabase getMCQs error: $e. Using local/mock fallback.');
      return _getMockMCQs().where((mcq) => mcq.chapterId == chapterId).toList();
    }
  }

  // 5. Fetch Flashcards for Chapter
  Future<List<Flashcard>> getFlashcards(String chapterId) async {
    try {
      final response = await _client
          .from('flashcards')
          .select()
          .eq('chapter_id', chapterId);
      
      final list = response as List<dynamic>;
      return list.map((json) => Flashcard.fromJson(json)).toList();
    } catch (e) {
      print('Supabase getFlashcards error: $e. Using local/mock fallback.');
      return _getMockFlashcards().where((fc) => fc.chapterId == chapterId).toList();
    }
  }

  // 6. Fetch User Profile
  Future<UserProfile> getUserProfile(String userId) async {
    try {
      final response = await _client
          .from('users')
          .select()
          .eq('id', userId)
          .single();
      
      return UserProfile.fromJson(response);
    } catch (e) {
      print('Supabase getUserProfile error: $e. Loading local preference.');
      final prefs = await SharedPreferences.getInstance();
      final savedStr = prefs.getString(_profileKey);
      if (savedStr != null) {
        try {
          return UserProfile.fromJson(json.decode(savedStr));
        } catch (_) {}
      }
      // Create a default local profile
      final defaultProfile = UserProfile(
        id: userId,
        fullName: 'JTET Aspirant',
        email: 'aspirant@jtetsathi.in',
        preferredLanguage: 'en',
        totalPoints: 350,
        streak: 5,
        isPremium: false,
        lastActiveDate: DateTime.now(),
      );
      await prefs.setString(_profileKey, json.encode(defaultProfile.toJson()));
      return defaultProfile;
    }
  }

  // 7. Update User Profile
  Future<UserProfile> updateUserProfile(UserProfile profile) async {
    try {
      final response = await _client
          .from('users')
          .upsert(profile.toDbJson())
          .select()
          .single();
      
      final updated = UserProfile.fromJson(response);
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_profileKey, json.encode(updated.toJson()));
      return updated;
    } catch (e) {
      print('Supabase updateUserProfile error: $e. Saving to local preference.');
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_profileKey, json.encode(profile.toJson()));
      return profile;
    }
  }

  // 8. Fetch User Progress List
  Future<List<UserProgress>> getUserProgressList(String userId) async {
    try {
      final response = await _client
          .from('user_progress')
          .select()
          .eq('user_id', userId);
      
      final list = response as List<dynamic>;
      return list.map((json) => UserProgress.fromJson(json)).toList();
    } catch (e) {
      print('Supabase getUserProgressList error: $e. Using local fallback.');
      final prefs = await SharedPreferences.getInstance();
      final savedStr = prefs.getString(_progressKey);
      if (savedStr != null) {
        final List<dynamic> decoded = json.decode(savedStr);
        return decoded.map((json) => UserProgress.fromJson(json)).toList();
      }
      return [];
    }
  }

  // 9. Update User Progress
  Future<UserProgress> updateUserProgress({
    required String userId,
    required String chapterId,
    required bool isCompleted,
  }) async {
    final now = DateTime.now();
    final progressId = const Uuid().v4();
    final progressData = {
      'id': progressId,
      'user_id': userId,
      'chapter_id': chapterId,
      'is_completed': isCompleted,
      'completed_at': now.toIso8601String(),
    };

    try {
      // Check if progress already exists
      final existingResponse = await _client
          .from('user_progress')
          .select()
          .eq('user_id', userId)
          .eq('chapter_id', chapterId)
          .maybeSingle();

      Map<String, dynamic> response;
      if (existingResponse != null) {
        response = await _client
            .from('user_progress')
            .update({'is_completed': isCompleted, 'completed_at': now.toIso8601String()})
            .eq('id', existingResponse['id'])
            .select()
            .single();
      } else {
        response = await _client
            .from('user_progress')
            .insert(progressData)
            .select()
            .single();
      }
      
      final progress = UserProgress.fromJson(response);
      await _syncLocalProgress(userId, progress);

      // Award XP
      if (isCompleted && (existingResponse == null || !existingResponse['is_completed'])) {
        final profile = await getUserProfile(userId);
        final updatedProfile = UserProfile(
          id: profile.id,
          fullName: profile.fullName,
          email: profile.email,
          preferredLanguage: profile.preferredLanguage,
          totalPoints: profile.totalPoints + 50,
          streak: profile.streak == 0 ? 1 : profile.streak,
          isPremium: profile.isPremium,
          lastActiveDate: DateTime.now(),
        );
        await updateUserProfile(updatedProfile);
      }

      return progress;
    } catch (e) {
      print('Supabase updateUserProgress error: $e. Saving to local storage.');
      final progress = UserProgress(
        id: progressId,
        userId: userId,
        chapterId: chapterId,
        isCompleted: isCompleted,
        lastAccessed: now,
      );
      await _syncLocalProgress(userId, progress);

      if (isCompleted) {
        final profile = await getUserProfile(userId);
        final updatedProfile = UserProfile(
          id: profile.id,
          fullName: profile.fullName,
          email: profile.email,
          preferredLanguage: profile.preferredLanguage,
          totalPoints: profile.totalPoints + 50,
          streak: profile.streak == 0 ? 1 : profile.streak,
          isPremium: profile.isPremium,
          lastActiveDate: DateTime.now(),
        );
        await updateUserProfile(updatedProfile);
      }

      return progress;
    }
  }

  Future<void> _syncLocalProgress(String userId, UserProgress progress) async {
    final prefs = await SharedPreferences.getInstance();
    final list = await getUserProgressList(userId);
    final idx = list.indexWhere((p) => p.chapterId == progress.chapterId);
    if (idx >= 0) {
      list[idx] = progress;
    } else {
      list.add(progress);
    }
    await prefs.setString(_progressKey, json.encode(list.map((p) => p.toJson()).toList()));
  }

  // 10. Fetch Quiz Attempts
  Future<List<QuizAttempt>> getQuizAttempts(String userId) async {
    try {
      final response = await _client
          .from('quiz_attempts')
          .select()
          .eq('user_id', userId)
          .order('attempt_date', ascending: false);
      
      final list = response as List<dynamic>;
      return list.map((json) => QuizAttempt.fromJson(json)).toList();
    } catch (e) {
      print('Supabase getQuizAttempts error: $e. Using local storage.');
      final prefs = await SharedPreferences.getInstance();
      final savedStr = prefs.getString(_attemptsKey);
      if (savedStr != null) {
        final List<dynamic> decoded = json.decode(savedStr);
        return decoded.map((json) => QuizAttempt.fromJson(json)).toList();
      }
      return [];
    }
  }

  // 11. Save Quiz Attempt
  Future<QuizAttempt> saveQuizAttempt(QuizAttempt attempt) async {
    try {
      final response = await _client
          .from('quiz_attempts')
          .insert(attempt.toDbJson())
          .select()
          .single();
      
      final saved = QuizAttempt.fromJson(response);
      await _syncLocalAttempt(attempt.userId, saved);

      // Award XP based on correct answers
      final profile = await getUserProfile(attempt.userId);
      final xpEarned = MathMax(10, attempt.correctAnswers * 15);
      final updatedProfile = UserProfile(
        id: profile.id,
        fullName: profile.fullName,
        email: profile.email,
        preferredLanguage: profile.preferredLanguage,
        totalPoints: profile.totalPoints + xpEarned,
        streak: profile.streak == 0 ? 1 : profile.streak,
        isPremium: profile.isPremium,
        lastActiveDate: DateTime.now(),
      );
      await updateUserProfile(updatedProfile);

      return saved;
    } catch (e) {
      print('Supabase saveQuizAttempt error: $e. Saving locally.');
      await _syncLocalAttempt(attempt.userId, attempt);

      final profile = await getUserProfile(attempt.userId);
      final xpEarned = MathMax(10, attempt.correctAnswers * 15);
      final updatedProfile = UserProfile(
        id: profile.id,
        fullName: profile.fullName,
        email: profile.email,
        preferredLanguage: profile.preferredLanguage,
        totalPoints: profile.totalPoints + xpEarned,
        streak: profile.streak == 0 ? 1 : profile.streak,
        isPremium: profile.isPremium,
        lastActiveDate: DateTime.now(),
      );
      await updateUserProfile(updatedProfile);

      return attempt;
    }
  }

  int MathMax(int a, int b) => a > b ? a : b;

  Future<void> _syncLocalAttempt(String userId, QuizAttempt attempt) async {
    final prefs = await SharedPreferences.getInstance();
    final list = await getQuizAttempts(userId);
    list.insert(0, attempt);
    await prefs.setString(_attemptsKey, json.encode(list.map((a) => a.toJson()).toList()));
  }

  // 12. Fetch Leaderboard
  Future<List<UserProfile>> getLeaderboard() async {
    try {
      final response = await _client
          .from('users')
          .select('id, name, total_points, email, streak, is_premium, created_at')
          .order('total_points', ascending: false)
          .limit(10);
      
      final list = response as List<dynamic>;
      return list.map((json) => UserProfile.fromJson(json)).toList();
    } catch (e) {
      print('Supabase getLeaderboard error: $e. Mock leaderboard returned.');
      return [
        UserProfile(id: '1', fullName: 'Shreya Iyer (AIR 4)', email: '', preferredLanguage: 'en', totalPoints: 1250, streak: 12, isPremium: true, lastActiveDate: DateTime.now()),
        UserProfile(id: '2', fullName: 'Aniket Sharma', email: '', preferredLanguage: 'en', totalPoints: 980, streak: 8, isPremium: false, lastActiveDate: DateTime.now()),
        UserProfile(id: '3', fullName: 'Rahul Varma', email: '', preferredLanguage: 'en', totalPoints: 850, streak: 5, isPremium: false, lastActiveDate: DateTime.now()),
        UserProfile(id: 'mock-user-123', fullName: 'JTET Aspirant (You)', email: 'aspirant@jtetsathi.in', preferredLanguage: 'en', totalPoints: 350, streak: 5, isPremium: false, lastActiveDate: DateTime.now()),
      ];
    }
  }

  // ── MOCK DATA GENERATION (FALLBACKS) ───────────────────────────────────────
  List<Book> _getMockBooks() {
    return [
      Book(
        id: '00000000-0000-0000-0000-000000000001',
        title: 'Indian Polity',
        author: 'M. Laxmikanth',
        coverImage: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400',
        subject: 'Polity',
        isActive: true,
      ),
      Book(
        id: '00000000-0000-0000-0000-000000000002',
        title: 'A Brief History of Modern India',
        author: 'Rajiv Ahir (Spectrum)',
        coverImage: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400',
        subject: 'History',
        isActive: true,
      ),
      Book(
        id: '00000000-0000-0000-0000-000000000003',
        title: 'Certificate Physical and Human Geography',
        author: 'G.C. Leong',
        coverImage: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=400',
        subject: 'Geography',
        isActive: true,
      ),
    ];
  }

  List<Chapter> _getMockChapters() {
    return [
      Chapter(
        id: '00000000-0000-0000-0000-000000000011',
        bookId: '00000000-0000-0000-0000-000000000001',
        chapterNumber: 1,
        title: 'Historical Background',
        description: 'Evolution of the Indian Constitution, Regulating Act 1773, Pitt\'s India Act 1784, Charter Acts.',
        contentText: 'The British came to India in 1600 as traders in the form of East India Company. In 1765, the Company obtained the Diwani rights. In 1773, the British Government passed the Regulating Act to control and regulate the affairs of the Company in India. This was the first step towards centralization.',
        audioUrl: 'https://pub-00ab21363ea74b46a5d0555ad4f47b47.r2.dev/historical_background.mp3',
        isFree: true,
        durationSeconds: 240,
      ),
      Chapter(
        id: '00000000-0000-0000-0000-000000000012',
        bookId: '00000000-0000-0000-0000-000000000001',
        chapterNumber: 2,
        title: 'Making of the Constitution',
        description: 'Demand for a Constituent Assembly, composition, working, and enactments of the constitution.',
        contentText: 'It was in 1934 that the idea of a Constituent Assembly for India was proposed by M.N. Roy. In 1935, the Indian National Congress officially demanded it. The assembly held its first meeting on December 9, 1946.',
        audioUrl: '',
        isFree: true,
        durationSeconds: 180,
      ),
      Chapter(
        id: '00000000-0000-0000-0000-000000000013',
        bookId: '00000000-0000-0000-0000-000000000001',
        chapterNumber: 3,
        title: 'Salient Features of the Constitution',
        description: 'Detailed analysis of various features, lengthiest written constitution, drawn from various sources.',
        contentText: 'The Indian Constitution is unique in its contents and spirit. It is the lengthiest written constitution. It is blend of rigidity and flexibility. It establishes a federal system with a unitary bias.',
        audioUrl: '',
        isFree: false,
        durationSeconds: 300,
      ),
    ];
  }

  List<MCQ> _getMockMCQs() {
    return [
      MCQ(
        id: 'm1',
        chapterId: '00000000-0000-0000-0000-000000000011',
        question: 'Under which of the following acts did the Governor of Bengal become the Governor-General of India?',
        optionA: 'Regulating Act 1773',
        optionB: 'Pitt’s India Act 1784',
        optionC: 'Charter Act 1833',
        optionD: 'Charter Act 1853',
        correctOption: 'C',
        explanation: 'The Charter Act of 1833 made the Governor-General of Bengal as the Governor-General of India and vested in him all civil and military powers. Lord William Bentinck was the first Governor-General of India.',
        subject: 'Polity',
      ),
      MCQ(
        id: 'm2',
        chapterId: '00000000-0000-0000-0000-000000000011',
        question: 'Which act introduced a system of double government by separating commercial and political functions?',
        optionA: 'Regulating Act 1773',
        optionB: 'Pitt’s India Act 1784',
        optionC: 'Charter Act 1813',
        optionD: 'Government of India Act 1858',
        correctOption: 'B',
        explanation: 'Pitt’s India Act of 1784 distinguished between the commercial and political functions of the Company. It allowed the Court of Directors to manage commercial affairs but created a Board of Control to manage political affairs.',
        subject: 'Polity',
      ),
    ];
  }

  List<Flashcard> _getMockFlashcards() {
    return [
      Flashcard(
        id: 'f1',
        chapterId: '00000000-0000-0000-0000-000000000011',
        question: 'What act is considered the first step towards centralization in British India?',
        answer: 'Regulating Act of 1773',
        difficultyLevel: 'Easy',
      ),
      Flashcard(
        id: 'f2',
        chapterId: '00000000-0000-0000-0000-000000000011',
        question: 'Who was the first Governor-General of India designated under the Charter Act of 1833?',
        answer: 'Lord William Bentinck',
        difficultyLevel: 'Medium',
      ),
      Flashcard(
        id: 'f3',
        chapterId: '00000000-0000-0000-0000-000000000011',
        question: 'Which act ended the commercial monopoly of the East India Company in India entirely?',
        answer: 'Charter Act of 1833',
        difficultyLevel: 'Hard',
      ),
    ];
  }
}
