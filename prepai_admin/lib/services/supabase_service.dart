import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';
import '../models/models.dart';

class SupabaseService {
  final SupabaseClient _client = Supabase.instance.client;
  static const String _booksLocalKey = 'admin_books_local';
  static const String _chaptersLocalKey = 'admin_chapters_local';
  static const String _mcqsLocalKey = 'admin_mcqs_local';
  static const String _flashcardsLocalKey = 'admin_flashcards_local';

  // ── BOOKS CRUD ──
  Future<List<Book>> getBooks() async {
    try {
      final response = await _client.from('books').select();
      final list = response as List<dynamic>;
      final books = list.map((json) => Book.fromJson(json)).toList();
      await _saveLocalBooks(books);
      return books;
    } catch (e) {
      print('Supabase getBooks error: $e. Using local fallback.');
      return _getLocalBooks();
    }
  }

  Future<Book> createBook(Book book) async {
    try {
      final response = await _client
          .from('books')
          .insert(book.toJson())
          .select()
          .single();
      final created = Book.fromJson(response);
      await _syncLocalBook(created);
      return created;
    } catch (e) {
      print('Supabase createBook error: $e. Saving locally.');
      await _syncLocalBook(book);
      return book;
    }
  }

  Future<Book> updateBook(Book book) async {
    try {
      final response = await _client
          .from('books')
          .update(book.toJson())
          .eq('id', book.id)
          .select()
          .single();
      final updated = Book.fromJson(response);
      await _syncLocalBook(updated);
      return updated;
    } catch (e) {
      print('Supabase updateBook error: $e. Updating locally.');
      await _syncLocalBook(book);
      return book;
    }
  }

  Future<void> deleteBook(String id) async {
    try {
      await _client.from('books').delete().eq('id', id);
      await _deleteLocalBook(id);
    } catch (e) {
      print('Supabase deleteBook error: $e. Deleting locally.');
      await _deleteLocalBook(id);
    }
  }

  // ── CHAPTERS CRUD ──
  Future<List<Chapter>> getChapters(String bookId) async {
    try {
      final response = await _client
          .from('chapters')
          .select()
          .eq('book_id', bookId)
          .order('chapter_number', ascending: true);
      final list = response as List<dynamic>;
      final chapters = list.map((json) => Chapter.fromJson(json)).toList();
      await _saveLocalChapters(chapters, bookId);
      return chapters;
    } catch (e) {
      print('Supabase getChapters error: $e. Using local fallback.');
      return _getLocalChapters(bookId);
    }
  }

  Future<Chapter> createChapter(Chapter chapter) async {
    try {
      final response = await _client
          .from('chapters')
          .insert(chapter.toJson())
          .select()
          .single();
      final created = Chapter.fromJson(response);
      await _syncLocalChapter(created);
      return created;
    } catch (e) {
      print('Supabase createChapter error: $e. Saving locally.');
      await _syncLocalChapter(chapter);
      return chapter;
    }
  }

  Future<Chapter> updateChapter(Chapter chapter) async {
    try {
      final response = await _client
          .from('chapters')
          .update(chapter.toJson())
          .eq('id', chapter.id)
          .select()
          .single();
      final updated = Chapter.fromJson(response);
      await _syncLocalChapter(updated);
      return updated;
    } catch (e) {
      print('Supabase updateChapter error: $e. Updating locally.');
      await _syncLocalChapter(chapter);
      return chapter;
    }
  }

  Future<void> deleteChapter(String id) async {
    try {
      await _client.from('chapters').delete().eq('id', id);
      await _deleteLocalChapter(id);
    } catch (e) {
      print('Supabase deleteChapter error: $e. Deleting locally.');
      await _deleteLocalChapter(id);
    }
  }

  // ── MCQS CRUD ──
  Future<List<MCQ>> getMCQs(String chapterId) async {
    try {
      final response = await _client
          .from('mcqs')
          .select()
          .eq('chapter_id', chapterId);
      final list = response as List<dynamic>;
      final mcqs = list.map((json) => MCQ.fromJson(json)).toList();
      await _saveLocalMCQs(mcqs, chapterId);
      return mcqs;
    } catch (e) {
      print('Supabase getMCQs error: $e. Using local fallback.');
      return _getLocalMCQs(chapterId);
    }
  }

  Future<MCQ> createMCQ(MCQ mcq) async {
    try {
      final response = await _client
          .from('mcqs')
          .insert(mcq.toDbJson())
          .select()
          .single();
      final created = MCQ.fromJson(response);
      await _syncLocalMCQ(created);
      return created;
    } catch (e) {
      print('Supabase createMCQ error: $e. Saving locally.');
      await _syncLocalMCQ(mcq);
      return mcq;
    }
  }

  Future<void> batchInsertMCQs(List<MCQ> mcqs) async {
    try {
      final data = mcqs.map((m) => m.toDbJson()).toList();
      await _client.from('mcqs').insert(data);
      for (final mcq in mcqs) {
        await _syncLocalMCQ(mcq);
      }
    } catch (e) {
      print('Supabase batchInsertMCQs error: $e. Saving locally.');
      for (final mcq in mcqs) {
        await _syncLocalMCQ(mcq);
      }
      rethrow;
    }
  }

  Future<MCQ> updateMCQ(MCQ mcq) async {
    try {
      final response = await _client
          .from('mcqs')
          .update(mcq.toDbJson())
          .eq('id', mcq.id)
          .select()
          .single();
      final updated = MCQ.fromJson(response);
      await _syncLocalMCQ(updated);
      return updated;
    } catch (e) {
      print('Supabase updateMCQ error: $e. Updating locally.');
      await _syncLocalMCQ(mcq);
      return mcq;
    }
  }

  Future<void> deleteMCQ(String id) async {
    try {
      await _client.from('mcqs').delete().eq('id', id);
      await _deleteLocalMCQ(id);
    } catch (e) {
      print('Supabase deleteMCQ error: $e. Deleting locally.');
      await _deleteLocalMCQ(id);
    }
  }

  // ── FLASHCARDS CRUD ──
  Future<List<Flashcard>> getFlashcards(String chapterId) async {
    try {
      final response = await _client
          .from('flashcards')
          .select()
          .eq('chapter_id', chapterId);
      final list = response as List<dynamic>;
      final flashcards = list.map((json) => Flashcard.fromJson(json)).toList();
      await _saveLocalFlashcards(flashcards, chapterId);
      return flashcards;
    } catch (e) {
      print('Supabase getFlashcards error: $e. Using local fallback.');
      return _getLocalFlashcards(chapterId);
    }
  }

  Future<Flashcard> createFlashcard(Flashcard card) async {
    try {
      final response = await _client
          .from('flashcards')
          .insert(card.toDbJson())
          .select()
          .single();
      final created = Flashcard.fromJson(response);
      await _syncLocalFlashcard(created);
      return created;
    } catch (e) {
      print('Supabase createFlashcard error: $e. Saving locally.');
      await _syncLocalFlashcard(card);
      return card;
    }
  }

  Future<void> batchInsertFlashcards(List<Flashcard> cards) async {
    try {
      final data = cards.map((c) => c.toDbJson()).toList();
      await _client.from('flashcards').insert(data);
      for (final card in cards) {
        await _syncLocalFlashcard(card);
      }
    } catch (e) {
      print('Supabase batchInsertFlashcards error: $e. Saving locally.');
      for (final card in cards) {
        await _syncLocalFlashcard(card);
      }
      rethrow;
    }
  }

  Future<Flashcard> updateFlashcard(Flashcard card) async {
    try {
      final response = await _client
          .from('flashcards')
          .update(card.toDbJson())
          .eq('id', card.id)
          .select()
          .single();
      final updated = Flashcard.fromJson(response);
      await _syncLocalFlashcard(updated);
      return updated;
    } catch (e) {
      print('Supabase updateFlashcard error: $e. Updating locally.');
      await _syncLocalFlashcard(card);
      return card;
    }
  }

  Future<void> deleteFlashcard(String id) async {
    try {
      await _client.from('flashcards').delete().eq('id', id);
      await _deleteLocalFlashcard(id);
    } catch (e) {
      print('Supabase deleteFlashcard error: $e. Deleting locally.');
      await _deleteLocalFlashcard(id);
    }
  }

  // ── LOCAL PERSISTENCE HELPERS ──

  // Books
  Future<List<Book>> _getLocalBooks() async {
    final prefs = await SharedPreferences.getInstance();
    final jsonStr = prefs.getString(_booksLocalKey);
    if (jsonStr == null) return [];
    final List<dynamic> list = json.decode(jsonStr);
    return list.map((json) => Book.fromJson(json)).toList();
  }

  Future<void> _saveLocalBooks(List<Book> books) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_booksLocalKey, json.encode(books.map((b) => b.toJson()).toList()));
  }

  Future<void> _syncLocalBook(Book book) async {
    final list = await _getLocalBooks();
    final idx = list.indexWhere((b) => b.id == book.id);
    if (idx >= 0) {
      list[idx] = book;
    } else {
      list.add(book);
    }
    await _saveLocalBooks(list);
  }

  Future<void> _deleteLocalBook(String id) async {
    final list = await _getLocalBooks();
    list.removeWhere((b) => b.id == id);
    await _saveLocalBooks(list);
  }

  // Chapters
  Future<List<Chapter>> _getLocalChapters(String bookId) async {
    final prefs = await SharedPreferences.getInstance();
    final jsonStr = prefs.getString('${_chaptersLocalKey}_$bookId');
    if (jsonStr == null) return [];
    final List<dynamic> list = json.decode(jsonStr);
    return list.map((json) => Chapter.fromJson(json)).toList();
  }

  Future<void> _saveLocalChapters(List<Chapter> chapters, String bookId) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('${_chaptersLocalKey}_$bookId', json.encode(chapters.map((c) => c.toJson()).toList()));
  }

  Future<void> _syncLocalChapter(Chapter chapter) async {
    final list = await _getLocalChapters(chapter.bookId);
    final idx = list.indexWhere((c) => c.id == chapter.id);
    if (idx >= 0) {
      list[idx] = chapter;
    } else {
      list.add(chapter);
    }
    await _saveLocalChapters(list, chapter.bookId);
  }

  Future<void> _deleteLocalChapter(String id) async {
    final prefs = await SharedPreferences.getInstance();
    // Look through all local keys to delete
    final keys = prefs.getKeys();
    for (final key in keys) {
      if (key.startsWith(_chaptersLocalKey)) {
        final jsonStr = prefs.getString(key);
        if (jsonStr != null) {
          final List<dynamic> list = json.decode(jsonStr);
          final chs = list.map((json) => Chapter.fromJson(json)).toList();
          final lenBefore = chs.length;
          chs.removeWhere((c) => c.id == id);
          if (chs.length != lenBefore) {
            await prefs.setString(key, json.encode(chs.map((c) => c.toJson()).toList()));
          }
        }
      }
    }
  }

  // MCQs
  Future<List<MCQ>> _getLocalMCQs(String chapterId) async {
    final prefs = await SharedPreferences.getInstance();
    final jsonStr = prefs.getString('${_mcqsLocalKey}_$chapterId');
    if (jsonStr == null) return [];
    final List<dynamic> list = json.decode(jsonStr);
    return list.map((json) => MCQ.fromJson(json)).toList();
  }

  Future<void> _saveLocalMCQs(List<MCQ> mcqs, String chapterId) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('${_mcqsLocalKey}_$chapterId', json.encode(mcqs.map((m) => m.toJson()).toList()));
  }

  Future<void> _syncLocalMCQ(MCQ mcq) async {
    final list = await _getLocalMCQs(mcq.chapterId);
    final idx = list.indexWhere((m) => m.id == mcq.id);
    if (idx >= 0) {
      list[idx] = mcq;
    } else {
      list.add(mcq);
    }
    await _saveLocalMCQs(list, mcq.chapterId);
  }

  Future<void> _deleteLocalMCQ(String id) async {
    final prefs = await SharedPreferences.getInstance();
    final keys = prefs.getKeys();
    for (final key in keys) {
      if (key.startsWith(_mcqsLocalKey)) {
        final jsonStr = prefs.getString(key);
        if (jsonStr != null) {
          final List<dynamic> list = json.decode(jsonStr);
          final mcqs = list.map((json) => MCQ.fromJson(json)).toList();
          final lenBefore = mcqs.length;
          mcqs.removeWhere((m) => m.id == id);
          if (mcqs.length != lenBefore) {
            await prefs.setString(key, json.encode(mcqs.map((m) => m.toJson()).toList()));
          }
        }
      }
    }
  }

  // Flashcards
  Future<List<Flashcard>> _getLocalFlashcards(String chapterId) async {
    final prefs = await SharedPreferences.getInstance();
    final jsonStr = prefs.getString('${_flashcardsLocalKey}_$chapterId');
    if (jsonStr == null) return [];
    final List<dynamic> list = json.decode(jsonStr);
    return list.map((json) => Flashcard.fromJson(json)).toList();
  }

  Future<void> _saveLocalFlashcards(List<Flashcard> cards, String chapterId) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('${_flashcardsLocalKey}_$chapterId', json.encode(cards.map((c) => c.toJson()).toList()));
  }

  Future<void> _syncLocalFlashcard(Flashcard card) async {
    final list = await _getLocalFlashcards(card.chapterId);
    final idx = list.indexWhere((c) => c.id == card.id);
    if (idx >= 0) {
      list[idx] = card;
    } else {
      list.add(card);
    }
    await _saveLocalFlashcards(list, card.chapterId);
  }

  Future<void> _deleteLocalFlashcard(String id) async {
    final prefs = await SharedPreferences.getInstance();
    final keys = prefs.getKeys();
    for (final key in keys) {
      if (key.startsWith(_flashcardsLocalKey)) {
        final jsonStr = prefs.getString(key);
        if (jsonStr != null) {
          final List<dynamic> list = json.decode(jsonStr);
          final cards = list.map((json) => Flashcard.fromJson(json)).toList();
          final lenBefore = cards.length;
          cards.removeWhere((c) => c.id == id);
          if (cards.length != lenBefore) {
            await prefs.setString(key, json.encode(cards.map((c) => c.toJson()).toList()));
          }
        }
      }
    }
  }
}
