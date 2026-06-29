import 'dart:convert';

class Book {
  final String id;
  final String title;
  final String author;
  final String coverImage;
  final String subject;
  final bool isActive;

  Book({
    required this.id,
    required this.title,
    required this.author,
    required this.coverImage,
    required this.subject,
    required this.isActive,
  });

  factory Book.fromJson(Map<String, dynamic> json) {
    return Book(
      id: json['id'] as String? ?? '',
      title: json['title'] as String? ?? '',
      author: json['author'] as String? ?? '',
      coverImage: json['cover_image'] as String? ?? '',
      subject: json['subject'] as String? ?? '',
      isActive: json['is_active'] as bool? ?? true,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'author': author,
      'cover_image': coverImage,
      'subject': subject,
      'is_active': isActive,
    };
  }
}

class Chapter {
  final String id;
  final String bookId;
  final String title;
  final String description;
  final String contentText;
  final String audioUrl;
  final int chapterNumber;
  final bool isFree;
  final int durationSeconds;

  Chapter({
    required this.id,
    required this.bookId,
    required this.title,
    required this.description,
    required this.contentText,
    required this.audioUrl,
    required this.chapterNumber,
    required this.isFree,
    required this.durationSeconds,
  });

  factory Chapter.fromJson(Map<String, dynamic> json) {
    return Chapter(
      id: json['id'] as String? ?? '',
      bookId: json['book_id'] as String? ?? '',
      title: json['title'] as String? ?? '',
      description: json['description'] as String? ?? '',
      contentText: json['content_text'] as String? ?? '',
      audioUrl: json['audio_url'] as String? ?? '',
      chapterNumber: json['chapter_number'] as int? ?? 0,
      isFree: json['is_free'] as bool? ?? false,
      durationSeconds: json['duration_seconds'] as int? ?? 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'book_id': bookId,
      'title': title,
      'description': description,
      'content_text': contentText,
      'audio_url': audioUrl,
      'chapter_number': chapterNumber,
      'is_free': isFree,
      'duration_seconds': durationSeconds,
    };
  }
}

class MCQ {
  final String id;
  final String chapterId;
  final String question;
  final String optionA;
  final String optionB;
  final String optionC;
  final String optionD;
  final String correctOption; // 'A', 'B', 'C', 'D'
  final String explanation;
  final String subject;

  MCQ({
    required this.id,
    required this.chapterId,
    required this.question,
    required this.optionA,
    required this.optionB,
    required this.optionC,
    required this.optionD,
    required this.correctOption,
    required this.explanation,
    required this.subject,
  });

  factory MCQ.fromJson(Map<String, dynamic> json) {
    return MCQ(
      id: json['id'] as String? ?? '',
      chapterId: json['chapter_id'] as String? ?? '',
      question: json['question'] as String? ?? '',
      optionA: json['option_a'] as String? ?? '',
      optionB: json['option_b'] as String? ?? '',
      optionC: json['option_c'] as String? ?? '',
      optionD: json['option_d'] as String? ?? '',
      correctOption: json['correct_option'] as String? ?? '',
      explanation: json['explanation'] as String? ?? '',
      subject: json['subject'] as String? ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'chapter_id': chapterId,
      'question': question,
      'option_a': optionA,
      'option_b': optionB,
      'option_c': optionC,
      'option_d': optionD,
      'correct_option': correctOption,
      'explanation': explanation,
      'subject': subject,
    };
  }
}

class Flashcard {
  final String id;
  final String chapterId;
  final String question;
  final String answer;
  final String difficultyLevel;

  Flashcard({
    required this.id,
    required this.chapterId,
    required this.question,
    required this.answer,
    required this.difficultyLevel,
  });

  factory Flashcard.fromJson(Map<String, dynamic> json) {
    return Flashcard(
      id: json['id'] as String? ?? '',
      chapterId: json['chapter_id'] as String? ?? '',
      question: json['front_text'] as String? ?? json['question'] as String? ?? '',
      answer: json['back_text'] as String? ?? json['answer'] as String? ?? '',
      difficultyLevel: json['difficulty_level'] as String? ?? 'Medium',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'chapter_id': chapterId,
      'front_text': question,
      'back_text': answer,
      'difficulty_level': difficultyLevel,
    };
  }
}

class UserProfile {
  final String id;
  final String fullName;
  final String email;
  final String preferredLanguage;
  final int totalPoints;
  final int streak;
  final bool isPremium;
  final DateTime lastActiveDate;

  UserProfile({
    required this.id,
    required this.fullName,
    required this.email,
    required this.preferredLanguage,
    required this.totalPoints,
    required this.streak,
    required this.isPremium,
    required this.lastActiveDate,
  });

  factory UserProfile.fromJson(Map<String, dynamic> json) {
    return UserProfile(
      id: json['id'] as String? ?? '',
      fullName: json['name'] as String? ?? json['full_name'] as String? ?? 'UPSC Aspirant',
      email: json['email'] as String? ?? '',
      preferredLanguage: json['preferred_language'] as String? ?? 'en',
      totalPoints: json['total_points'] as int? ?? 0,
      streak: json['streak'] as int? ?? 0,
      isPremium: json['is_premium'] as bool? ?? false,
      lastActiveDate: json['created_at'] != null 
          ? DateTime.parse(json['created_at']) 
          : (json['last_active_date'] != null 
              ? DateTime.parse(json['last_active_date']) 
              : DateTime.now()),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': fullName,
      'full_name': fullName,
      'email': email,
      'preferred_language': preferredLanguage,
      'total_points': totalPoints,
      'streak': streak,
      'is_premium': isPremium,
      'created_at': lastActiveDate.toIso8601String(),
      'last_active_date': lastActiveDate.toIso8601String(),
    };
  }

  Map<String, dynamic> toDbJson() {
    return {
      'id': id,
      'name': fullName,
      'email': email,
      'streak': streak,
      'total_points': totalPoints,
      'is_premium': isPremium,
    };
  }
}

class UserProgress {
  final String id;
  final String userId;
  final String chapterId;
  final bool isCompleted;
  final DateTime lastAccessed;

  UserProgress({
    required this.id,
    required this.userId,
    required this.chapterId,
    required this.isCompleted,
    required this.lastAccessed,
  });

  factory UserProgress.fromJson(Map<String, dynamic> json) {
    return UserProgress(
      id: json['id'] as String? ?? '',
      userId: json['user_id'] as String? ?? '',
      chapterId: json['chapter_id'] as String? ?? '',
      isCompleted: json['is_completed'] as bool? ?? false,
      lastAccessed: json['completed_at'] != null 
          ? DateTime.parse(json['completed_at']) 
          : (json['last_accessed'] != null 
              ? DateTime.parse(json['last_accessed']) 
              : DateTime.now()),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'user_id': userId,
      'chapter_id': chapterId,
      'is_completed': isCompleted,
      'completed_at': lastAccessed.toIso8601String(),
      'last_accessed': lastAccessed.toIso8601String(),
    };
  }

  Map<String, dynamic> toDbJson() {
    return {
      'id': id,
      'user_id': userId,
      'chapter_id': chapterId,
      'is_completed': isCompleted,
      'completed_at': lastAccessed.toIso8601String(),
    };
  }
}

class QuizAttempt {
  final String id;
  final String userId;
  final String chapterId;
  final int score;
  final int totalQuestions;
  final int correctAnswers;
  final DateTime attemptDate;

  QuizAttempt({
    required this.id,
    required this.userId,
    required this.chapterId,
    required this.score,
    required this.totalQuestions,
    required this.correctAnswers,
    required this.attemptDate,
  });

  factory QuizAttempt.fromJson(Map<String, dynamic> json) {
    return QuizAttempt(
      id: json['id'] as String? ?? '',
      userId: json['user_id'] as String? ?? '',
      chapterId: json['chapter_id'] as String? ?? '',
      score: (json['score'] as num?)?.toInt() ?? 0,
      totalQuestions: json['total_questions'] as int? ?? 0,
      correctAnswers: json['correct_answers'] as int? ?? 0,
      attemptDate: json['created_at'] != null 
          ? DateTime.parse(json['created_at']) 
          : (json['attempt_date'] != null 
              ? DateTime.parse(json['attempt_date']) 
              : DateTime.now()),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'user_id': userId,
      'chapter_id': chapterId,
      'score': score,
      'total_questions': totalQuestions,
      'correct_answers': correctAnswers,
      'created_at': attemptDate.toIso8601String(),
      'attempt_date': attemptDate.toIso8601String(),
    };
  }

  Map<String, dynamic> toDbJson() {
    return {
      'id': id,
      'user_id': userId,
      'chapter_id': chapterId,
      'score': score,
      'total_questions': totalQuestions,
      'correct_answers': correctAnswers,
      'created_at': attemptDate.toIso8601String(),
    };
  }
}
