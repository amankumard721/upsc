import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:uuid/uuid.dart';
import 'dart:convert';
import '../models/models.dart';
import '../providers/admin_state.dart';

class BatchUploader extends StatefulWidget {
  const BatchUploader({super.key});

  @override
  State<BatchUploader> createState() => _BatchUploaderState();
}

class _BatchUploaderState extends State<BatchUploader> {
  final TextEditingController _textController = TextEditingController();
  String _uploadType = 'MCQ_JSON'; // MCQ_JSON, FLASHCARD_JSON, MCQ_CSV
  String? _errorMessage;
  String? _successMessage;

  @override
  void dispose() {
    _textController.dispose();
    super.dispose();
  }

  void _showSampleFormat() {
    String sample = '';
    if (_uploadType == 'MCQ_JSON') {
      sample = '''[
  {
    "question": "Under which act did the Governor of Bengal become the Governor-General of India?",
    "option_a": "Regulating Act 1773",
    "option_b": "Pitt's India Act 1784",
    "option_c": "Charter Act 1833",
    "option_d": "Charter Act 1853",
    "correct_option": "C",
    "explanation": "The Charter Act of 1833 made the Governor-General of Bengal the Governor-General of India."
  }
]''';
    } else if (_uploadType == 'FLASHCARD_JSON') {
      sample = '''[
  {
    "front_text": "Who was the first Governor-General of India?",
    "back_text": "Lord William Bentinck",
    "difficulty_level": "Medium"
  }
]''';
    } else {
      sample = '''question,option_a,option_b,option_c,option_d,correct_option,explanation
"Which act separated commercial and political functions?","Regulating Act 1773","Pitt's India Act 1784","Charter Act 1813","Gov of India Act 1858","B","Pitt's India Act of 1784 separated functions."''';
    }

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: const Color(0xFF070B16),
        title: Text('Sample $_uploadType Format', style: const TextStyle(fontFamily: 'Outfit', fontSize: 14)),
        content: SingleChildScrollView(
          child: Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.black.withOpacity(0.3),
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: Colors.white10),
            ),
            child: Text(
              sample,
              style: const TextStyle(fontFamily: 'monospace', fontSize: 11, color: Colors.white70),
            ),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Close', style: TextStyle(color: Color(0xFF10B981))),
          )
        ],
      ),
    );
  }

  void _handleUpload(BuildContext context) async {
    final state = Provider.of<AdminState>(context, listen: false);
    
    if (state.selectedChapterId == null) {
      setState(() {
        _errorMessage = 'Please select a book and target chapter first.';
        _successMessage = null;
      });
      return;
    }

    final inputText = _textController.text.trim();
    if (inputText.isEmpty) {
      setState(() {
        _errorMessage = 'Input data cannot be empty.';
        _successMessage = null;
      });
      return;
    }

    final chapterId = state.selectedChapterId!;
    final subject = state.books.firstWhere((b) => b.id == state.selectedBookId).subject;

    setState(() {
      _errorMessage = null;
      _successMessage = null;
    });

    try {
      if (_uploadType == 'MCQ_JSON') {
        final List<dynamic> parsed = json.decode(inputText);
        final List<MCQ> mcqs = parsed.map((item) {
          final map = item as Map<String, dynamic>;
          return MCQ(
            id: const Uuid().v4(),
            chapterId: chapterId,
            question: map['question']?.toString() ?? '',
            optionA: map['option_a']?.toString() ?? map['optionA']?.toString() ?? '',
            optionB: map['option_b']?.toString() ?? map['optionB']?.toString() ?? '',
            optionC: map['option_c']?.toString() ?? map['optionC']?.toString() ?? '',
            optionD: map['option_d']?.toString() ?? map['optionD']?.toString() ?? '',
            correctOption: map['correct_option']?.toString() ?? map['correctOption']?.toString() ?? 'A',
            explanation: map['explanation']?.toString() ?? '',
            subject: subject,
          );
        }).toList();

        // Validate
        for (final m in mcqs) {
          if (m.question.isEmpty || m.optionA.isEmpty || m.optionB.isEmpty) {
            throw Exception('Each question must contain a question statement and options.');
          }
        }

        await state.importMCQs(mcqs);
        setState(() {
          _successMessage = 'Successfully imported ${mcqs.length} MCQs to chapter!';
          _textController.clear();
        });
      } else if (_uploadType == 'FLASHCARD_JSON') {
        final List<dynamic> parsed = json.decode(inputText);
        final List<Flashcard> cards = parsed.map((item) {
          final map = item as Map<String, dynamic>;
          return Flashcard(
            id: const Uuid().v4(),
            chapterId: chapterId,
            question: map['front_text']?.toString() ?? map['question']?.toString() ?? '',
            answer: map['back_text']?.toString() ?? map['answer']?.toString() ?? '',
            difficultyLevel: map['difficulty_level']?.toString() ?? map['difficultyLevel']?.toString() ?? 'Medium',
          );
        }).toList();

        for (final c in cards) {
          if (c.question.isEmpty || c.answer.isEmpty) {
            throw Exception('Each card must contain front question and back answer.');
          }
        }

        await state.importFlashcards(cards);
        setState(() {
          _successMessage = 'Successfully imported ${cards.length} Flashcards to chapter!';
          _textController.clear();
        });
      } else if (_uploadType == 'MCQ_CSV') {
        // Simple CSV parser
        final lines = const LineSplitter().convert(inputText);
        if (lines.length < 2) {
          throw Exception('CSV must have a header row and at least one data row.');
        }

        // Parse header
        final headers = _parseCSVLine(lines[0]);
        final List<MCQ> mcqs = [];

        for (int i = 1; i < lines.length; i++) {
          if (lines[i].trim().isEmpty) continue;
          final values = _parseCSVLine(lines[i]);
          
          String question = '';
          String optA = '';
          String optB = '';
          String optC = '';
          String optD = '';
          String correct = 'A';
          String explanation = '';

          for (int h = 0; h < headers.length; h++) {
            if (h >= values.length) continue;
            final header = headers[h].trim().toLowerCase();
            final value = values[h];

            if (header == 'question') question = value;
            else if (header == 'option_a' || header == 'optiona') optA = value;
            else if (header == 'option_b' || header == 'optionb') optB = value;
            else if (header == 'option_c' || header == 'optionc') optC = value;
            else if (header == 'option_d' || header == 'optiond') optD = value;
            else if (header == 'correct_option' || header == 'correctoption' || header == 'correct') correct = value;
            else if (header == 'explanation') explanation = value;
          }

          mcqs.add(MCQ(
            id: const Uuid().v4(),
            chapterId: chapterId,
            question: question,
            optionA: optA,
            optionB: optB,
            optionC: optC,
            optionD: optD,
            correctOption: correct,
            explanation: explanation,
            subject: subject,
          ));
        }

        for (final m in mcqs) {
          if (m.question.isEmpty || m.optionA.isEmpty || m.optionB.isEmpty) {
            throw Exception('CSV contains empty values. Ensure columns match the header template.');
          }
        }

        await state.importMCQs(mcqs);
        setState(() {
          _successMessage = 'Successfully imported ${mcqs.length} MCQs via CSV parser!';
          _textController.clear();
        });
      }
    } catch (e) {
      setState(() {
        _errorMessage = 'Parsing Error: ${e.toString()}';
        _successMessage = null;
      });
    }
  }

  List<String> _parseCSVLine(String line) {
    final List<String> result = [];
    StringBuffer sb = StringBuffer();
    bool inQuotes = false;
    for (int i = 0; i < line.length; i++) {
      final char = line[i];
      if (char == '"') {
        inQuotes = !inQuotes;
      } else if (char == ',' && !inQuotes) {
        result.add(sb.toString().trim());
        sb.clear();
      } else {
        sb.write(char);
      }
    }
    result.add(sb.toString().trim());
    return result;
  }

  @override
  Widget build(BuildContext context) {
    final state = Provider.of<AdminState>(context);
    final accentColor = Theme.of(context).primaryColor;

    final selectedBook = state.books.isEmpty
        ? null
        : state.books.firstWhere(
            (b) => b.id == state.selectedBookId,
            orElse: () => state.books.first,
          );

    final selectedChapter = state.chapters.isEmpty
        ? null
        : state.chapters.firstWhere(
            (c) => c.id == state.selectedChapterId,
            orElse: () => state.chapters.first,
          );

    return Scaffold(
      appBar: AppBar(
        title: const Text('Batch Data Uploader', style: TextStyle(fontFamily: 'Outfit', fontWeight: FontWeight.bold)),
        actions: [
          IconButton(
            icon: const Icon(Icons.help_outline),
            onPressed: _showSampleFormat,
          )
        ],
      ),
      body: state.books.isEmpty
          ? Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.library_books_rounded, size: 48, color: Colors.white.withOpacity(0.2)),
                  const SizedBox(height: 12),
                  const Text('Create syllabus books and chapters first', style: TextStyle(color: Colors.white30)),
                ],
              ),
            )
          : Column(
              children: [
                // Selection Filters (Book & Chapter)
                Container(
                  padding: const EdgeInsets.all(16),
                  color: const Color(0xFF070B16),
                  child: Column(
                    children: [
                      // Book selection
                      DropdownButtonFormField<String>(
                        value: selectedBook?.id,
                        dropdownColor: const Color(0xFF070B16),
                        decoration: const InputDecoration(
                          labelText: 'Syllabus Book',
                          labelStyle: TextStyle(color: Colors.white38, fontSize: 10),
                          border: OutlineInputBorder(),
                          contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                        ),
                        items: state.books.map((b) {
                          return DropdownMenuItem(value: b.id, child: Text(b.title, overflow: TextOverflow.ellipsis, style: const TextStyle(color: Colors.white, fontSize: 12)));
                        }).toList(),
                        onChanged: (id) {
                          if (id != null) {
                            state.selectBook(id);
                          }
                        },
                      ),
                      const SizedBox(height: 10),

                      // Chapter selection
                      DropdownButtonFormField<String>(
                        value: selectedChapter?.id,
                        dropdownColor: const Color(0xFF070B16),
                        decoration: const InputDecoration(
                          labelText: 'Assign to Chapter Unit',
                          labelStyle: TextStyle(color: Colors.white38, fontSize: 10),
                          border: OutlineInputBorder(),
                          contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                        ),
                        items: state.chapters.isEmpty
                            ? [const DropdownMenuItem(value: '', child: Text('No chapters found', style: TextStyle(color: Colors.white24, fontSize: 12)))]
                            : state.chapters.map((c) {
                                return DropdownMenuItem(value: c.id, child: Text('Ch ${c.chapterNumber}: ${c.title}', overflow: TextOverflow.ellipsis, style: const TextStyle(color: Colors.white, fontSize: 12)));
                              }).toList(),
                        onChanged: (id) {
                          if (id != null && id.isNotEmpty) {
                            state.selectChapter(id);
                          }
                        },
                      ),
                    ],
                  ),
                ),
                const Divider(height: 1, color: Colors.white10),

                // Editor and Controls
                Expanded(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.all(20),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Format Type Selector
                        const Text('Upload Format', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.white60)),
                        const SizedBox(height: 8),
                        DropdownButtonFormField<String>(
                          value: _uploadType,
                          dropdownColor: const Color(0xFF070B16),
                          decoration: const InputDecoration(
                            border: OutlineInputBorder(),
                            contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                          ),
                          items: const [
                            DropdownMenuItem(value: 'MCQ_JSON', child: Text('MCQs (JSON List)', style: TextStyle(color: Colors.white, fontSize: 13))),
                            DropdownMenuItem(value: 'FLASHCARD_JSON', child: Text('Flashcards (JSON List)', style: TextStyle(color: Colors.white, fontSize: 13))),
                            DropdownMenuItem(value: 'MCQ_CSV', child: Text('MCQs (CSV Raw Text)', style: TextStyle(color: Colors.white, fontSize: 13))),
                          ],
                          onChanged: (val) {
                            if (val != null) {
                              setState(() {
                                _uploadType = val;
                              });
                            }
                          },
                        ),
                        const SizedBox(height: 16),

                        // Error / Success Messages
                        if (_errorMessage != null)
                          Container(
                            width: double.infinity,
                            padding: const EdgeInsets.all(12),
                            margin: const EdgeInsets.only(bottom: 16),
                            decoration: BoxDecoration(color: Colors.red.withOpacity(0.12), borderRadius: BorderRadius.circular(10), border: Border.all(color: Colors.redAccent.withOpacity(0.3))),
                            child: Text(_errorMessage!, style: const TextStyle(color: Colors.redAccent, fontSize: 11)),
                          ),
                        if (_successMessage != null)
                          Container(
                            width: double.infinity,
                            padding: const EdgeInsets.all(12),
                            margin: const EdgeInsets.only(bottom: 16),
                            decoration: BoxDecoration(color: Colors.green.withOpacity(0.12), borderRadius: BorderRadius.circular(10), border: Border.all(color: Colors.greenAccent.withOpacity(0.3))),
                            child: Text(_successMessage!, style: const TextStyle(color: Colors.greenAccent, fontSize: 11)),
                          ),

                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text('Paste Raw Data Content', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.white60)),
                            TextButton.icon(
                              onPressed: _showSampleFormat,
                              icon: const Icon(Icons.code, size: 14, color: Color(0xFF10B981)),
                              label: const Text('View Sample Format', style: TextStyle(fontSize: 11, color: Color(0xFF10B981))),
                            ),
                          ],
                        ),
                        const SizedBox(height: 6),

                        // Large raw textarea editor
                        TextFormField(
                          controller: _textController,
                          maxLines: 12,
                          style: const TextStyle(fontFamily: 'monospace', fontSize: 12, color: Colors.white70, height: 1.4),
                          decoration: InputDecoration(
                            border: const OutlineInputBorder(),
                            hintText: _uploadType == 'MCQ_CSV'
                                ? 'question,option_a,option_b,option_c,option_d,correct_option,explanation\n...'
                                : '[\n  {\n    "question": "...",\n    ...\n  }\n]',
                            hintStyle: const TextStyle(color: Colors.white24, fontSize: 12),
                          ),
                        ),
                        const SizedBox(height: 24),

                        // Import button
                        SizedBox(
                          width: double.infinity,
                          height: 52,
                          child: ElevatedButton.icon(
                            onPressed: state.isLoading ? null : () => _handleUpload(context),
                            icon: const Icon(Icons.rocket_launch, color: Color(0xFF0B1325)),
                            label: Text(
                              state.isLoading ? 'Importing Data...' : 'Validate & Import to Course',
                              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Color(0xFF0B1325)),
                            ),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: accentColor,
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                            ),
                          ),
                        ),
                        const SizedBox(height: 48),
                      ],
                    ),
                  ),
                )
              ],
            ),
    );
  }
}
