import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:uuid/uuid.dart';
import '../models/models.dart';
import '../providers/admin_state.dart';

class DataManager extends StatefulWidget {
  final Chapter chapter;
  final String subject;
  const DataManager({super.key, required this.chapter, required this.subject});

  @override
  State<DataManager> createState() => _DataManagerState();
}

class _DataManagerState extends State<DataManager> with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    
    // Load MCQs and Flashcards contextually for this chapter
    Future.microtask(() {
      final state = Provider.of<AdminState>(context, listen: false);
      state.loadMCQs(widget.chapter.id);
      state.loadFlashcards(widget.chapter.id);
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  void _showMCQForm(BuildContext context, String chapterId, {MCQ? mcq}) {
    final state = Provider.of<AdminState>(context, listen: false);
    final isEdit = mcq != null;

    final qController = TextEditingController(text: mcq?.question ?? '');
    final optAController = TextEditingController(text: mcq?.optionA ?? '');
    final optBController = TextEditingController(text: mcq?.optionB ?? '');
    final optCController = TextEditingController(text: mcq?.optionC ?? '');
    final optDController = TextEditingController(text: mcq?.optionD ?? '');
    final expController = TextEditingController(text: mcq?.explanation ?? '');
    String correctOpt = mcq?.correctOption ?? 'A';

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: const Color(0xFF070B16),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            return Padding(
              padding: EdgeInsets.only(
                bottom: MediaQuery.of(context).viewInsets.bottom + 24,
                top: 24,
                left: 20,
                right: 20,
              ),
              child: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      isEdit ? 'Modify MCQ' : 'Create New MCQ Question',
                      style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white, fontFamily: 'Outfit'),
                    ),
                    const SizedBox(height: 16),

                    // Question
                    TextFormField(
                      controller: qController,
                      maxLines: 3,
                      decoration: const InputDecoration(
                        labelText: 'Question Statement *',
                        labelStyle: TextStyle(color: Colors.white60, fontSize: 13),
                        border: OutlineInputBorder(),
                        alignLabelWithHint: true,
                      ),
                      style: const TextStyle(color: Colors.white, fontSize: 13, height: 1.4),
                    ),
                    const SizedBox(height: 12),

                    // Options A & B
                    Row(
                      children: [
                        Expanded(
                          child: TextFormField(
                            controller: optAController,
                            decoration: const InputDecoration(
                              labelText: 'Option A *',
                              labelStyle: TextStyle(color: Colors.white60, fontSize: 13),
                              border: OutlineInputBorder(),
                            ),
                            style: const TextStyle(color: Colors.white, fontSize: 13),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: TextFormField(
                            controller: optBController,
                            decoration: const InputDecoration(
                              labelText: 'Option B *',
                              labelStyle: TextStyle(color: Colors.white60, fontSize: 13),
                              border: OutlineInputBorder(),
                            ),
                            style: const TextStyle(color: Colors.white, fontSize: 13),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),

                    // Options C & D
                    Row(
                      children: [
                        Expanded(
                          child: TextFormField(
                            controller: optCController,
                            decoration: const InputDecoration(
                              labelText: 'Option C *',
                              labelStyle: TextStyle(color: Colors.white60, fontSize: 13),
                              border: OutlineInputBorder(),
                            ),
                            style: const TextStyle(color: Colors.white, fontSize: 13),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: TextFormField(
                            controller: optDController,
                            decoration: const InputDecoration(
                              labelText: 'Option D *',
                              labelStyle: TextStyle(color: Colors.white60, fontSize: 13),
                              border: OutlineInputBorder(),
                            ),
                            style: const TextStyle(color: Colors.white, fontSize: 13),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),

                    // Correct Option
                    DropdownButtonFormField<String>(
                      value: correctOpt,
                      decoration: const InputDecoration(
                        labelText: 'Correct Option Answer *',
                        labelStyle: TextStyle(color: Colors.white60, fontSize: 13),
                        border: OutlineInputBorder(),
                      ),
                      dropdownColor: const Color(0xFF070B16),
                      items: ['A', 'B', 'C', 'D'].map((opt) {
                        return DropdownMenuItem(value: opt, child: Text('Option $opt', style: const TextStyle(color: Colors.white, fontSize: 13)));
                      }).toList(),
                      onChanged: (val) {
                        if (val != null) {
                          setModalState(() {
                            correctOpt = val;
                          });
                        }
                      },
                    ),
                    const SizedBox(height: 12),

                    // Explanation
                    TextFormField(
                      controller: expController,
                      maxLines: 2,
                      decoration: const InputDecoration(
                        labelText: 'Explanation / Reference Notes',
                        labelStyle: TextStyle(color: Colors.white60, fontSize: 13),
                        border: OutlineInputBorder(),
                        alignLabelWithHint: true,
                      ),
                      style: const TextStyle(color: Colors.white, fontSize: 13, height: 1.4),
                    ),
                    const SizedBox(height: 20),

                    // Save Button
                    SizedBox(
                      width: double.infinity,
                      height: 50,
                      child: ElevatedButton(
                        onPressed: () {
                          if (qController.text.trim().isEmpty ||
                              optAController.text.trim().isEmpty ||
                              optBController.text.trim().isEmpty ||
                              optCController.text.trim().isEmpty ||
                              optDController.text.trim().isEmpty) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(content: Text('Please fill out all options and question.')),
                            );
                            return;
                          }

                          if (isEdit) {
                            final updated = MCQ(
                              id: mcq.id,
                              chapterId: chapterId,
                              question: qController.text.trim(),
                              optionA: optAController.text.trim(),
                              optionB: optBController.text.trim(),
                              optionC: optCController.text.trim(),
                              optionD: optDController.text.trim(),
                              correctOption: correctOpt,
                              explanation: expController.text.trim(),
                              subject: widget.subject,
                            );
                            state.updateMCQ(updated);
                          } else {
                            final newMcq = MCQ(
                              id: const Uuid().v4(),
                              chapterId: chapterId,
                              question: qController.text.trim(),
                              optionA: optAController.text.trim(),
                              optionB: optBController.text.trim(),
                              optionC: optCController.text.trim(),
                              optionD: optDController.text.trim(),
                              correctOption: correctOpt,
                              explanation: expController.text.trim(),
                              subject: widget.subject,
                            );
                            state.createMCQ(newMcq);
                          }

                          Navigator.pop(context);
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Theme.of(context).primaryColor,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                        child: Text(
                          isEdit ? 'Update Question' : 'Save Question',
                          style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF0B1325)),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }

  void _showFlashcardForm(BuildContext context, String chapterId, {Flashcard? card}) {
    final state = Provider.of<AdminState>(context, listen: false);
    final isEdit = card != null;

    final questionController = TextEditingController(text: card?.question ?? '');
    final answerController = TextEditingController(text: card?.answer ?? '');
    String difficulty = card?.difficultyLevel ?? 'Medium';

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: const Color(0xFF070B16),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            return Padding(
              padding: EdgeInsets.only(
                bottom: MediaQuery.of(context).viewInsets.bottom + 24,
                top: 24,
                left: 20,
                right: 20,
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    isEdit ? 'Modify Flashcard' : 'Create New Flashcard',
                    style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white, fontFamily: 'Outfit'),
                  ),
                  const SizedBox(height: 16),

                  // Front question
                  TextFormField(
                    controller: questionController,
                    maxLines: 2,
                    decoration: const InputDecoration(
                      labelText: 'Front Text (Question / Prompt) *',
                      labelStyle: TextStyle(color: Colors.white60, fontSize: 13),
                      border: OutlineInputBorder(),
                    ),
                    style: const TextStyle(color: Colors.white, fontSize: 13),
                  ),
                  const SizedBox(height: 12),

                  // Back answer
                  TextFormField(
                    controller: answerController,
                    maxLines: 3,
                    decoration: const InputDecoration(
                      labelText: 'Back Text (Answer / Explanation) *',
                      labelStyle: TextStyle(color: Colors.white60, fontSize: 13),
                      border: OutlineInputBorder(),
                    ),
                    style: const TextStyle(color: Colors.white, fontSize: 13),
                  ),
                  const SizedBox(height: 12),

                  // Difficulty
                  DropdownButtonFormField<String>(
                    value: difficulty,
                    decoration: const InputDecoration(
                      labelText: 'Difficulty Level',
                      labelStyle: TextStyle(color: Colors.white60, fontSize: 13),
                      border: OutlineInputBorder(),
                    ),
                    dropdownColor: const Color(0xFF070B16),
                    items: ['Easy', 'Medium', 'Hard'].map((diff) {
                      return DropdownMenuItem(value: diff, child: Text(diff, style: const TextStyle(color: Colors.white, fontSize: 13)));
                    }).toList(),
                    onChanged: (val) {
                      if (val != null) {
                        setModalState(() {
                          difficulty = val;
                        });
                      }
                    },
                  ),
                  const SizedBox(height: 20),

                  // Save Button
                  SizedBox(
                    width: double.infinity,
                    height: 50,
                    child: ElevatedButton(
                      onPressed: () {
                        if (questionController.text.trim().isEmpty || answerController.text.trim().isEmpty) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('Please fill out both front and back texts.')),
                          );
                          return;
                        }

                        if (isEdit) {
                          final updated = Flashcard(
                            id: card.id,
                            chapterId: chapterId,
                            question: questionController.text.trim(),
                            answer: answerController.text.trim(),
                            difficultyLevel: difficulty,
                          );
                          state.updateFlashcard(updated);
                        } else {
                          final newCard = Flashcard(
                            id: const Uuid().v4(),
                            chapterId: chapterId,
                            question: questionController.text.trim(),
                            answer: answerController.text.trim(),
                            difficultyLevel: difficulty,
                          );
                          state.createFlashcard(newCard);
                        }

                        Navigator.pop(context);
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Theme.of(context).primaryColor,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      child: Text(
                        isEdit ? 'Update Card' : 'Save Card',
                        style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF0B1325)),
                      ),
                    ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final state = Provider.of<AdminState>(context);
    final accentColor = Theme.of(context).primaryColor;

    return Scaffold(
      appBar: AppBar(
        title: Column(
          children: [
            Text('Ch ${widget.chapter.chapterNumber} Q&A Manager', style: const TextStyle(fontFamily: 'Outfit', fontWeight: FontWeight.bold, fontSize: 14)),
            const SizedBox(height: 2),
            Text(widget.chapter.title, style: TextStyle(fontSize: 10, color: Colors.white.withOpacity(0.5))),
          ],
        ),
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: accentColor,
          labelColor: accentColor,
          unselectedLabelColor: Colors.white38,
          tabs: const [
            Tab(icon: Icon(Icons.quiz), text: 'MCQ Practice'),
            Tab(icon: Icon(Icons.layers), text: 'Flashcards'),
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          if (_tabController.index == 0) {
            _showMCQForm(context, widget.chapter.id);
          } else {
            _showFlashcardForm(context, widget.chapter.id);
          }
        },
        backgroundColor: accentColor,
        child: const Icon(Icons.add, color: Color(0xFF0B1325)),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          // ── MCQ TAB VIEW ──
          state.isLoading
              ? const Center(child: CircularProgressIndicator())
              : state.mcqs.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.quiz_rounded, size: 40, color: Colors.white.withOpacity(0.15)),
                          const SizedBox(height: 8),
                          const Text('No MCQs added to this chapter', style: TextStyle(color: Colors.white24, fontSize: 11)),
                          const SizedBox(height: 4),
                          const Text('Tap "+" to create a new multiple choice question', style: TextStyle(color: Colors.white12, fontSize: 9)),
                        ],
                      ),
                    )
                  : ListView.builder(
                      padding: const EdgeInsets.all(16),
                      itemCount: state.mcqs.length,
                      itemBuilder: (context, idx) {
                        final mcq = state.mcqs[idx];
                        return Container(
                          margin: const EdgeInsets.only(bottom: 12),
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: const Color(0xFF070B16),
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: Colors.white.withOpacity(0.04)),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                    decoration: BoxDecoration(
                                      color: accentColor.withOpacity(0.1),
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                    child: Text(
                                      'Q${idx + 1}',
                                      style: TextStyle(color: accentColor, fontWeight: FontWeight.bold, fontSize: 10),
                                    ),
                                  ),
                                  Row(
                                    children: [
                                      IconButton(
                                        icon: const Icon(Icons.edit_rounded, color: Colors.white54, size: 16),
                                        onPressed: () => _showMCQForm(context, widget.chapter.id, mcq: mcq),
                                      ),
                                      IconButton(
                                        icon: const Icon(Icons.delete_outline_rounded, color: Colors.redAccent, size: 16),
                                        onPressed: () {
                                          showDialog(
                                            context: context,
                                            builder: (context) => AlertDialog(
                                              backgroundColor: const Color(0xFF070B16),
                                              title: const Text('Delete Question?'),
                                              content: const Text('Are you sure you want to delete this MCQ?'),
                                              actions: [
                                                TextButton(
                                                  onPressed: () => Navigator.pop(context),
                                                  child: const Text('Cancel', style: TextStyle(color: Colors.white30)),
                                                ),
                                                TextButton(
                                                  onPressed: () {
                                                    state.deleteMCQ(mcq.id);
                                                    Navigator.pop(context);
                                                  },
                                                  child: const Text('Delete', style: TextStyle(color: Colors.redAccent)),
                                                )
                                              ],
                                            ),
                                          );
                                        },
                                      )
                                    ],
                                  )
                                ],
                              ),
                              const SizedBox(height: 8),
                              Text(
                                mcq.question,
                                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.white),
                              ),
                              const SizedBox(height: 12),
                              _buildOptionRow('A', mcq.optionA, mcq.correctOption == 'A'),
                              _buildOptionRow('B', mcq.optionB, mcq.correctOption == 'B'),
                              _buildOptionRow('C', mcq.optionC, mcq.correctOption == 'C'),
                              _buildOptionRow('D', mcq.optionD, mcq.correctOption == 'D'),
                              if (mcq.explanation.isNotEmpty) ...[
                                const SizedBox(height: 12),
                                const Divider(color: Colors.white10),
                                const SizedBox(height: 4),
                                Text(
                                  'Explanation: ${mcq.explanation}',
                                  style: TextStyle(fontSize: 10, color: Colors.white.withOpacity(0.4), height: 1.4),
                                ),
                              ]
                            ],
                          ),
                        );
                      },
                    ),

          // ── FLASHCARDS TAB VIEW ──
          state.isLoading
              ? const Center(child: CircularProgressIndicator())
              : state.flashcards.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.layers_rounded, size: 40, color: Colors.white.withOpacity(0.15)),
                          const SizedBox(height: 8),
                          const Text('No flashcards added to this chapter', style: TextStyle(color: Colors.white24, fontSize: 11)),
                          const SizedBox(height: 4),
                          const Text('Tap "+" to create a new revision card', style: TextStyle(color: Colors.white12, fontSize: 9)),
                        ],
                      ),
                    )
                  : ListView.builder(
                      padding: const EdgeInsets.all(16),
                      itemCount: state.flashcards.length,
                      itemBuilder: (context, idx) {
                        final card = state.flashcards[idx];
                        return Container(
                          margin: const EdgeInsets.only(bottom: 12),
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: const Color(0xFF070B16),
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: Colors.white.withOpacity(0.04)),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                    decoration: BoxDecoration(
                                      color: Colors.indigo.withOpacity(0.12),
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                    child: Text(
                                      card.difficultyLevel.toUpperCase(),
                                      style: const TextStyle(color: Colors.indigoAccent, fontWeight: FontWeight.bold, fontSize: 9),
                                    ),
                                  ),
                                  Row(
                                    children: [
                                      IconButton(
                                        icon: const Icon(Icons.edit_rounded, color: Colors.white54, size: 16),
                                        onPressed: () => _showFlashcardForm(context, widget.chapter.id, card: card),
                                      ),
                                      IconButton(
                                        icon: const Icon(Icons.delete_outline_rounded, color: Colors.redAccent, size: 16),
                                        onPressed: () {
                                          showDialog(
                                            context: context,
                                            builder: (context) => AlertDialog(
                                              backgroundColor: const Color(0xFF070B16),
                                              title: const Text('Delete Flashcard?'),
                                              content: const Text('Are you sure you want to delete this flashcard?'),
                                              actions: [
                                                TextButton(
                                                  onPressed: () => Navigator.pop(context),
                                                  child: const Text('Cancel', style: TextStyle(color: Colors.white30)),
                                                ),
                                                TextButton(
                                                  onPressed: () {
                                                    state.deleteFlashcard(card.id);
                                                    Navigator.pop(context);
                                                  },
                                                  child: const Text('Delete', style: TextStyle(color: Colors.redAccent)),
                                                )
                                              ],
                                            ),
                                          );
                                        },
                                      )
                                    ],
                                  )
                                ],
                              ),
                              const SizedBox(height: 8),
                              const Text('FRONT / QUESTION:', style: TextStyle(fontSize: 9, color: Colors.white30, fontWeight: FontWeight.bold)),
                              const SizedBox(height: 2),
                              Text(card.question, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.white)),
                              const SizedBox(height: 12),
                              const Text('BACK / ANSWER:', style: TextStyle(fontSize: 9, color: Colors.white30, fontWeight: FontWeight.bold)),
                              const SizedBox(height: 2),
                              Text(card.answer, style: TextStyle(fontSize: 12, color: Colors.white.withOpacity(0.7), height: 1.4)),
                            ],
                          ),
                        );
                      },
                    ),
        ],
      ),
    );
  }

  Widget _buildOptionRow(String label, String content, bool isCorrect) {
    final color = isCorrect ? const Color(0xFF10B981) : Colors.white30;
    return Container(
      margin: const EdgeInsets.only(bottom: 6),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: isCorrect ? const Color(0xFF10B981).withOpacity(0.06) : Colors.transparent,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Row(
        children: [
          CircleAvatar(
            radius: 9,
            backgroundColor: color.withOpacity(0.12),
            child: Text(label, style: TextStyle(color: isCorrect ? const Color(0xFF10B981) : Colors.white60, fontSize: 9, fontWeight: FontWeight.bold)),
          ),
          const SizedBox(width: 8),
          Expanded(child: Text(content, style: TextStyle(fontSize: 12, color: isCorrect ? Colors.white : Colors.white60))),
          if (isCorrect) const Icon(Icons.check_circle, size: 14, color: Color(0xFF10B981)),
        ],
      ),
    );
  }
}
