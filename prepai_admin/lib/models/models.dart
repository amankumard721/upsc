class Book {
  final String id;
  final String title;
  final String author;
  final String coverImage;
  final String subject;
  final bool isActive;
  final int totalChapters;

  Book({
    required this.id,
    required this.title,
    required this.author,
    required this.coverImage,
    required this.subject,
    required this.isActive,
    required this.totalChapters,
  });

  factory Book.fromJson(Map<String, dynamic> json) {
    return Book(
      id: json['id'] as String? ?? '',
      title: json['title'] as String? ?? '',
      author: json['author'] as String? ?? '',
      coverImage: json['cover_image'] as String? ?? '',
      subject: json['subject'] as String? ?? '',
      isActive: json['is_active'] as bool? ?? true,
      totalChapters: json['total_chapters'] as int? ?? 1,
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
      'total_chapters': totalChapters,
    };
  }

  Book copyWith({
    String? id,
    String? title,
    String? author,
    String? coverImage,
    String? subject,
    bool? isActive,
    int? totalChapters,
  }) {
    return Book(
      id: id ?? this.id,
      title: title ?? this.title,
      author: author ?? this.author,
      coverImage: coverImage ?? this.coverImage,
      subject: subject ?? this.subject,
      isActive: isActive ?? this.isActive,
      totalChapters: totalChapters ?? this.totalChapters,
    );
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

  Chapter copyWith({
    String? id,
    String? bookId,
    String? title,
    String? description,
    String? contentText,
    String? audioUrl,
    int? chapterNumber,
    bool? isFree,
    int? durationSeconds,
  }) {
    return Chapter(
      id: id ?? this.id,
      bookId: bookId ?? this.bookId,
      title: title ?? this.title,
      description: description ?? this.description,
      contentText: contentText ?? this.contentText,
      audioUrl: audioUrl ?? this.audioUrl,
      chapterNumber: chapterNumber ?? this.chapterNumber,
      isFree: isFree ?? this.isFree,
      durationSeconds: durationSeconds ?? this.durationSeconds,
    );
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

  Map<String, dynamic> toDbJson() {
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

  Map<String, dynamic> toDbJson() {
    return {
      'id': id,
      'chapter_id': chapterId,
      'front_text': question,
      'back_text': answer,
    };
  }
}
