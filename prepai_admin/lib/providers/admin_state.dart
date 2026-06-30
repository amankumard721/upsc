import 'package:flutter/material.dart';
import '../models/models.dart';
import '../services/supabase_service.dart';

class AdminState extends ChangeNotifier {
  final SupabaseService _db = SupabaseService();

  List<Book> _books = [];
  List<Chapter> _chapters = [];
  List<MCQ> _mcqs = [];
  List<Flashcard> _flashcards = [];

  String? _selectedBookId;
  String? _selectedChapterId;
  bool _isLoading = false;

  // Getters
  List<Book> get books => _books;
  List<Chapter> get chapters => _chapters;
  List<MCQ> get mcqs => _mcqs;
  List<Flashcard> get flashcards => _flashcards;
  String? get selectedBookId => _selectedBookId;
  String? get selectedChapterId => _selectedChapterId;
  bool get isLoading => _isLoading;

  SupabaseService get db => _db;

  // ── BOOKS METHODS ──
  Future<void> loadBooks() async {
    _isLoading = true;
    notifyListeners();
    try {
      _books = await _db.getBooks();
      if (_books.isNotEmpty && _selectedBookId == null) {
        await selectBook(_books.first.id);
      }
    } catch (e) {
      print('AdminState loadBooks error: $e');
    }
    _isLoading = false;
    notifyListeners();
  }

  Future<void> selectBook(String bookId) async {
    _selectedBookId = bookId;
    _selectedChapterId = null;
    _chapters = [];
    _mcqs = [];
    _flashcards = [];
    notifyListeners();
    await loadChapters(bookId);
  }

  Future<void> createBook(Book book) async {
    _isLoading = true;
    notifyListeners();
    try {
      final created = await _db.createBook(book);
      _books.add(created);
      if (_selectedBookId == null) {
        await selectBook(created.id);
      }
    } catch (e) {
      print('AdminState createBook error: $e');
    }
    _isLoading = false;
    notifyListeners();
  }

  Future<void> updateBook(Book book) async {
    _isLoading = true;
    notifyListeners();
    try {
      final updated = await _db.updateBook(book);
      final idx = _books.indexWhere((b) => b.id == book.id);
      if (idx >= 0) {
        _books[idx] = updated;
      }
    } catch (e) {
      print('AdminState updateBook error: $e');
    }
    _isLoading = false;
    notifyListeners();
  }

  Future<void> deleteBook(String id) async {
    _isLoading = true;
    notifyListeners();
    try {
      await _db.deleteBook(id);
      _books.removeWhere((b) => b.id == id);
      if (_selectedBookId == id) {
        _selectedBookId = _books.isNotEmpty ? _books.first.id : null;
        if (_selectedBookId != null) {
          await selectBook(_selectedBookId!);
        } else {
          _selectedChapterId = null;
          _chapters = [];
          _mcqs = [];
          _flashcards = [];
        }
      }
    } catch (e) {
      print('AdminState deleteBook error: $e');
    }
    _isLoading = false;
    notifyListeners();
  }

  // ── CHAPTERS METHODS ──
  Future<void> loadChapters(String bookId) async {
    try {
      _chapters = await _db.getChapters(bookId);
      if (_chapters.isNotEmpty) {
        await selectChapter(_chapters.first.id);
      } else {
        _selectedChapterId = null;
        _mcqs = [];
        _flashcards = [];
      }
    } catch (e) {
      print('AdminState loadChapters error: $e');
    }
    notifyListeners();
  }

  Future<void> selectChapter(String chapterId) async {
    _selectedChapterId = chapterId;
    _mcqs = [];
    _flashcards = [];
    notifyListeners();
    await Future.wait([
      loadMCQs(chapterId),
      loadFlashcards(chapterId),
    ]);
  }

  Future<void> createChapter(Chapter chapter) async {
    _isLoading = true;
    notifyListeners();
    try {
      final created = await _db.createChapter(chapter);
      if (created.bookId == _selectedBookId) {
        _chapters.add(created);
        _chapters.sort((a, b) => a.chapterNumber.compareTo(b.chapterNumber));
        if (_selectedChapterId == null) {
          await selectChapter(created.id);
        }
      }
    } catch (e) {
      print('AdminState createChapter error: $e');
    }
    _isLoading = false;
    notifyListeners();
  }

  Future<void> updateChapter(Chapter chapter) async {
    _isLoading = true;
    notifyListeners();
    try {
      final updated = await _db.updateChapter(chapter);
      if (updated.bookId == _selectedBookId) {
        final idx = _chapters.indexWhere((c) => c.id == chapter.id);
        if (idx >= 0) {
          _chapters[idx] = updated;
          _chapters.sort((a, b) => a.chapterNumber.compareTo(b.chapterNumber));
        }
      }
    } catch (e) {
      print('AdminState updateChapter error: $e');
    }
    _isLoading = false;
    notifyListeners();
  }

  Future<void> deleteChapter(String id) async {
    _isLoading = true;
    notifyListeners();
    try {
      await _db.deleteChapter(id);
      _chapters.removeWhere((c) => c.id == id);
      if (_selectedChapterId == id) {
        _selectedChapterId = _chapters.isNotEmpty ? _chapters.first.id : null;
        if (_selectedChapterId != null) {
          await selectChapter(_selectedChapterId!);
        } else {
          _mcqs = [];
          _flashcards = [];
        }
      }
    } catch (e) {
      print('AdminState deleteChapter error: $e');
    }
    _isLoading = false;
    notifyListeners();
  }

  // ── MCQS METHODS ──
  Future<void> loadMCQs(String chapterId) async {
    try {
      _mcqs = await _db.getMCQs(chapterId);
    } catch (e) {
      print('AdminState loadMCQs error: $e');
    }
    notifyListeners();
  }

  Future<void> createMCQ(MCQ mcq) async {
    try {
      final created = await _db.createMCQ(mcq);
      if (created.chapterId == _selectedChapterId) {
        _mcqs.add(created);
      }
    } catch (e) {
      print('AdminState createMCQ error: $e');
    }
    notifyListeners();
  }

  Future<void> importMCQs(List<MCQ> newMcqs) async {
    _isLoading = true;
    notifyListeners();
    try {
      await _db.batchInsertMCQs(newMcqs);
      if (newMcqs.isNotEmpty && newMcqs.first.chapterId == _selectedChapterId) {
        _mcqs.addAll(newMcqs);
      }
    } catch (e) {
      print('AdminState importMCQs error: $e');
    }
    _isLoading = false;
    notifyListeners();
  }

  Future<void> updateMCQ(MCQ mcq) async {
    try {
      final updated = await _db.updateMCQ(mcq);
      if (updated.chapterId == _selectedChapterId) {
        final idx = _mcqs.indexWhere((m) => m.id == mcq.id);
        if (idx >= 0) {
          _mcqs[idx] = updated;
        }
      }
    } catch (e) {
      print('AdminState updateMCQ error: $e');
    }
    notifyListeners();
  }

  Future<void> deleteMCQ(String id) async {
    try {
      await _db.deleteMCQ(id);
      _mcqs.removeWhere((m) => m.id == id);
    } catch (e) {
      print('AdminState deleteMCQ error: $e');
    }
    notifyListeners();
  }

  // ── FLASHCARDS METHODS ──
  Future<void> loadFlashcards(String chapterId) async {
    try {
      _flashcards = await _db.getFlashcards(chapterId);
    } catch (e) {
      print('AdminState loadFlashcards error: $e');
    }
    notifyListeners();
  }

  Future<void> createFlashcard(Flashcard card) async {
    try {
      final created = await _db.createFlashcard(card);
      if (created.chapterId == _selectedChapterId) {
        _flashcards.add(created);
      }
    } catch (e) {
      print('AdminState createFlashcard error: $e');
    }
    notifyListeners();
  }

  Future<void> importFlashcards(List<Flashcard> newCards) async {
    _isLoading = true;
    notifyListeners();
    try {
      await _db.batchInsertFlashcards(newCards);
      if (newCards.isNotEmpty && newCards.first.chapterId == _selectedChapterId) {
        _flashcards.addAll(newCards);
      }
    } catch (e) {
      print('AdminState importFlashcards error: $e');
    }
    _isLoading = false;
    notifyListeners();
  }

  Future<void> updateFlashcard(Flashcard card) async {
    try {
      final updated = await _db.updateFlashcard(card);
      if (updated.chapterId == _selectedChapterId) {
        final idx = _flashcards.indexWhere((c) => c.id == card.id);
        if (idx >= 0) {
          _flashcards[idx] = updated;
        }
      }
    } catch (e) {
      print('AdminState updateFlashcard error: $e');
    }
    notifyListeners();
  }

  Future<void> deleteFlashcard(String id) async {
    try {
      await _db.deleteFlashcard(id);
      _flashcards.removeWhere((c) => c.id == id);
    } catch (e) {
      print('AdminState deleteFlashcard error: $e');
    }
    notifyListeners();
  }
}
