import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/models.dart';
import '../services/supabase_service.dart';
import '../services/api_service.dart';
import 'package:uuid/uuid.dart';

class AppState extends ChangeNotifier {
  final SupabaseService _db = SupabaseService();
  final ApiService _api = ApiService();

  UserProfile? _profile;
  List<Book> _books = [];
  List<Chapter> _chapters = [];
  List<UserProgress> _progressList = [];
  List<QuizAttempt> _attempts = [];
  
  String _userId = 'mock-user-123';
  String? _activeBookId;
  bool _loading = true;
  bool _isDarkMode = true;

  // Getters
  UserProfile? get profile => _profile;
  List<Book> get books => _books;
  List<Chapter> get chapters => _chapters;
  List<UserProgress> get progressList => _progressList;
  List<QuizAttempt> get attempts => _attempts;
  String get userId => _userId;
  String? get activeBookId => _activeBookId;
  bool get loading => _loading;
  bool get isDarkMode => _isDarkMode;

  SupabaseService get db => _db;
  ApiService get api => _api;

  // Initialize App state
  Future<void> initialize() async {
    _loading = true;
    notifyListeners();

    // Check saved theme
    final prefs = await SharedPreferences.getInstance();
    _isDarkMode = prefs.getBool('prepai_dark_mode') ?? true;

    // Get Auth user
    _userId = await _db.getOrCreateUserId();
    
    // Fetch profile
    _profile = await _db.getUserProfile(_userId);
    
    // Load lists
    _books = await _db.getBooks();
    _progressList = await _db.getUserProgressList(_userId);
    _attempts = await _db.getQuizAttempts(_userId);

    _loading = false;
    notifyListeners();
  }

  // Select a book
  Future<void> selectBook(String bookId) async {
    _activeBookId = bookId;
    _chapters = [];
    _loading = true;
    notifyListeners();

    _chapters = await _db.getChapters(bookId);
    
    _loading = false;
    notifyListeners();
  }

  // Toggle Dark Mode
  Future<void> toggleDarkMode() async {
    _isDarkMode = !_isDarkMode;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('prepai_dark_mode', _isDarkMode);
    notifyListeners();
  }

  // Update Language
  Future<void> updateLanguage(String lang) async {
    if (_profile == null) return;
    _loading = true;
    notifyListeners();

    final updated = UserProfile(
      id: _profile!.id,
      fullName: _profile!.fullName,
      email: _profile!.email,
      preferredLanguage: lang,
      totalPoints: _profile!.totalPoints,
      streak: _profile!.streak,
      isPremium: _profile!.isPremium,
      lastActiveDate: _profile!.lastActiveDate,
    );
    _profile = await _db.updateUserProfile(updated);
    
    _loading = false;
    notifyListeners();
  }

  // Update Full Name
  Future<void> updateProfileName(String name) async {
    if (_profile == null) return;
    _loading = true;
    notifyListeners();

    final updated = UserProfile(
      id: _profile!.id,
      fullName: name,
      email: _profile!.email,
      preferredLanguage: _profile!.preferredLanguage,
      totalPoints: _profile!.totalPoints,
      streak: _profile!.streak,
      isPremium: _profile!.isPremium,
      lastActiveDate: _profile!.lastActiveDate,
    );
    _profile = await _db.updateUserProfile(updated);

    _loading = false;
    notifyListeners();
  }

  // Complete a Chapter and earn +50 XP
  Future<void> completeChapter(String chapterId) async {
    final alreadyCompleted = _progressList.any((p) => p.chapterId == chapterId && p.isCompleted);
    
    final progress = await _db.updateUserProgress(
      userId: _userId,
      chapterId: chapterId,
      isCompleted: true,
    );

    // Refresh progress list
    _progressList = await _db.getUserProgressList(_userId);

    // If it's a new completion, refresh profile (for XP increase)
    if (!alreadyCompleted) {
      _profile = await _db.getUserProfile(_userId);
    }
    notifyListeners();
  }

  // Record Quiz Attempt and earn XP
  Future<void> addQuizAttempt({
    required String chapterId,
    required int score,
    required int totalQuestions,
    required int correctAnswers,
  }) async {
    final attempt = QuizAttempt(
      id: const Uuid().v4(),
      userId: _userId,
      chapterId: chapterId,
      score: score,
      totalQuestions: totalQuestions,
      correctAnswers: correctAnswers,
      attemptDate: DateTime.now(),
    );

    await _db.saveQuizAttempt(attempt);

    // Refresh attempts and profile
    _attempts = await _db.getQuizAttempts(_userId);
    _profile = await _db.getUserProfile(_userId);
    notifyListeners();
  }

  // Upgrade to Premium and award +300 XP
  Future<void> upgradeToPremium() async {
    if (_profile == null) return;
    _loading = true;
    notifyListeners();

    final updated = UserProfile(
      id: _profile!.id,
      fullName: _profile!.fullName,
      email: _profile!.email,
      preferredLanguage: _profile!.preferredLanguage,
      totalPoints: _profile!.totalPoints + 300,
      streak: _profile!.streak == 0 ? 1 : _profile!.streak,
      isPremium: true,
      lastActiveDate: DateTime.now(),
    );

    _profile = await _db.updateUserProfile(updated);
    _loading = false;
    notifyListeners();
  }
}
