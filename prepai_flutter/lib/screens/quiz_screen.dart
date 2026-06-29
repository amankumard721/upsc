import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'dart:async';
import '../providers/app_state.dart';
import '../models/models.dart';

class QuizScreen extends StatefulWidget {
  final String chapterId;
  const QuizScreen({super.key, required this.chapterId});

  @override
  State<QuizScreen> createState() => _QuizScreenState();
}

class _QuizScreenState extends State<QuizScreen> {
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();
  
  List<MCQ> _mcqs = [];
  bool _loading = true;
  String _chapterTitle = "JTET Mock Test";

  // Flow State: 'instruction', 'live', 'result'
  String _phase = 'instruction';
  int _currentIndex = 0;
  
  // Selected answers: key is question index, value is selected option index (0 to 3)
  final Map<int, int> _selectedAnswers = {};
  final Map<int, bool> _markedForReview = {};
  final Map<int, bool> _visitedQuestions = {0: true};

  // Timers
  int _timeLeft = 30 * 60; // 30 minutes in seconds (default)
  Timer? _globalTimer;
  final Map<int, int> _questionSeconds = {};
  Timer? _qSecondsTimer;
  bool _paused = false;

  // Evaluation details
  double _positiveMarks = 2.0;
  double _negativeMarks = 0.5;
  int _correctCount = 0;
  int _incorrectCount = 0;
  double _finalScore = 0.0;
  int _accuracy = 0;

  // Palette drawer view mode
  String _paletteView = 'grid'; // 'grid' or 'list'

  @override
  void initState() {
    super.initState();
    _loadTestData();
  }

  @override
  void dispose() {
    _globalTimer?.cancel();
    _qSecondsTimer?.cancel();
    super.dispose();
  }

  Future<void> _loadTestData() async {
    final state = Provider.of<AppState>(context, listen: false);
    
    // Load title
    final chapter = await state.db.getChapter(widget.chapterId);
    if (chapter != null) {
      _chapterTitle = chapter.title;
    }

    final fetched = await state.db.getMCQs(widget.chapterId);
    setState(() {
      _mcqs = fetched;
      _timeLeft = fetched.length * 120; // 2 mins per question
      _loading = false;
    });
  }

  void _startExamTimers() {
    _globalTimer?.cancel();
    _qSecondsTimer?.cancel();

    _globalTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_paused) return;
      
      setState(() {
        if (_timeLeft > 0) {
          _timeLeft--;
          if (_timeLeft == 5 * 60) {
            _showFiveMinuteWarning();
          }
        } else {
          _globalTimer?.cancel();
          _submitTest(); // Auto submit
        }
      });
    });

    _qSecondsTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_paused) return;
      setState(() {
        _questionSeconds[_currentIndex] = (_questionSeconds[_currentIndex] ?? 0) + 1;
      });
    });
  }

  void _showFiveMinuteWarning() {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        backgroundColor: Colors.redAccent,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        content: const Row(
          children: [
            Icon(Icons.warning_amber_rounded, color: Colors.white),
            SizedBox(width: 8),
            Text(
              'Only 5 minutes remaining! Review your OMR sheet.',
              style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold),
            ),
          ],
        ),
      ),
    );
  }

  void _handleNavigateQuestion(int index) {
    setState(() {
      _currentIndex = index;
      _visitedQuestions[index] = true;
    });
  }

  void _handleOptionSelected(int optionIndex) {
    setState(() {
      _selectedAnswers[_currentIndex] = optionIndex;
    });
  }

  void _handleClearResponse() {
    setState(() {
      _selectedAnswers.remove(_currentIndex);
    });
  }

  void _handleMarkForReview() {
    setState(() {
      _markedForReview[_currentIndex] = !(_markedForReview[_currentIndex] ?? false);
    });
    
    // Auto-navigate to next
    if (_currentIndex + 1 < _mcqs.length) {
      _handleNavigateQuestion(_currentIndex + 1);
    }
  }

  void _handleSaveAndNext() {
    if (_currentIndex + 1 < _mcqs.length) {
      _handleNavigateQuestion(_currentIndex + 1);
    } else {
      _showSubmitConfirmationSheet();
    }
  }

  Future<void> _submitTest() async {
    _globalTimer?.cancel();
    _qSecondsTimer?.cancel();

    int correct = 0;
    int incorrect = 0;

    for (int i = 0; i < _mcqs.length; i++) {
      final selectedOptIdx = _selectedAnswers[i];
      if (selectedOptIdx == null) continue;

      final selectedOptChar = String.fromCharCode(65 + selectedOptIdx);
      if (selectedOptChar == _mcqs[i].correctOption) {
        correct++;
      } else {
        incorrect++;
      }
    }

    final score = (correct * _positiveMarks) - (incorrect * _negativeMarks);
    final totalAttempted = correct + incorrect;
    final acc = totalAttempted == 0 ? 0 : ((correct / totalAttempted) * 100).toInt();

    final state = Provider.of<AppState>(context, listen: false);
    
    setState(() {
      _correctCount = correct;
      _incorrectCount = incorrect;
      _finalScore = score;
      _accuracy = acc;
      _phase = 'result';
    });

    // Save to Database
    await state.addQuizAttempt(
      chapterId: widget.chapterId,
      score: score.toInt(),
      totalQuestions: _mcqs.length,
      correctAnswers: correct,
    );
  }

  void _resetQuiz() {
    setState(() {
      _currentIndex = 0;
      _selectedAnswers.clear();
      _markedForReview.clear();
      _visitedQuestions.clear();
      _visitedQuestions[0] = true;
      _timeLeft = _mcqs.length * 120;
      _questionSeconds.clear();
      _paused = false;
      _phase = 'instruction';
    });
  }

  String _formatTime(int totalSecs) {
    final hrs = totalSecs ~/ 3600;
    final mins = (totalSecs % 3600) ~/ 60;
    final secs = totalSecs % 60;
    return '${hrs.toString().padLeft(2, '0')}:${mins.toString().padLeft(2, '0')}:${secs.toString().padLeft(2, '0')}';
  }

  String _formatShortTime(int secs) {
    final mins = secs ~/ 60;
    final s = secs % 60;
    return '$mins:${s.toString().padLeft(2, '0')}';
  }

  String _getQuestionStatus(int idx) {
    final isAnswered = _selectedAnswers[idx] != null;
    final isMarked = _markedForReview[idx] == true;
    final isUnseen = _visitedQuestions[idx] != true;

    if (isAnswered && isMarked) return 'answered-marked';
    if (isAnswered) return 'answered';
    if (isMarked) return 'marked';
    if (isUnseen) return 'unseen';
    return 'unattempted';
  }

  void _showSubmitConfirmationSheet() {
    showModalBottomSheet(
      context: context,
      backgroundColor: const Color(0xFF0F172A),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (context) {
        final greenColor = const Color(0xFF10B981);
        final attempted = _selectedAnswers.length;
        final unattempted = _mcqs.length - attempted;
        final marked = _markedForReview.values.where((v) => v).length;

        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Center(
                  child: Container(
                    width: 40,
                    height: 4,
                    decoration: BoxDecoration(
                      color: Colors.white24,
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                const Text(
                  'Confirm Test Submission',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold, fontFamily: 'Outfit'),
                ),
                const SizedBox(height: 20),

                // Stats table
                _buildConfirmRow(Icons.timer, 'Time Remaining', _formatTime(_timeLeft), greenColor),
                _buildConfirmRow(Icons.check_circle_outline, 'Attempted Questions', '$attempted / ${_mcqs.length}', greenColor),
                _buildConfirmRow(Icons.help_outline, 'Unattempted Questions', '$unattempted / ${_mcqs.length}', Colors.white38),
                _buildConfirmRow(Icons.star_outline, 'Marked for Review', '$marked', Colors.amberAccent),
                const SizedBox(height: 24),

                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton(
                        onPressed: () => Navigator.pop(context),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: Colors.white,
                          side: const BorderSide(color: Colors.white10),
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                        child: const Text('No, Resume'),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: ElevatedButton(
                        onPressed: () {
                          Navigator.pop(context); // Close sheet
                          _submitTest();
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: greenColor,
                          foregroundColor: const Color(0xFF0B1325),
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                        child: const Text('Yes, Submit', style: TextStyle(fontWeight: FontWeight.bold)),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildConfirmRow(IconData icon, String label, String value, Color valueColor) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 10),
      decoration: const BoxDecoration(
        border: Border(bottom: BorderSide(color: Colors.white10)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            children: [
              Icon(icon, size: 16, color: Colors.white54),
              const SizedBox(width: 8),
              Text(label, style: const TextStyle(color: Colors.white70, fontSize: 13)),
            ],
          ),
          Text(value, style: TextStyle(color: valueColor, fontSize: 13, fontWeight: FontWeight.bold, fontFamily: 'Inter')),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final greenColor = const Color(0xFF10B981);

    if (_loading) {
      return const Scaffold(
        backgroundColor: Color(0xFF0B1325),
        body: Center(child: CircularProgressIndicator(color: Color(0xFF10B981))),
      );
    }

    if (_mcqs.isEmpty) {
      return Scaffold(
        backgroundColor: const Color(0xFF0B1325),
        appBar: AppBar(
          backgroundColor: Colors.transparent,
          elevation: 0,
          leading: IconButton(
            icon: const Icon(Icons.arrow_back, color: Colors.white),
            onPressed: () => Navigator.pop(context),
          ),
          title: const Text('Quiz Error', style: TextStyle(color: Colors.white)),
        ),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text('No MCQs found for this chapter.', style: TextStyle(color: Colors.white.withOpacity(0.4))),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: () => Navigator.pop(context),
                style: ElevatedButton.styleFrom(backgroundColor: greenColor),
                child: const Text('Go Back'),
              ),
            ],
          ),
        ),
      );
    }

    Widget activeBody;
    if (_phase == 'instruction') {
      activeBody = _buildInstructionScreen(greenColor);
    } else if (_phase == 'live') {
      activeBody = _buildLiveTestScreen(greenColor);
    } else {
      activeBody = _buildResultScreen(greenColor);
    }

    return Scaffold(
      key: _scaffoldKey,
      backgroundColor: const Color(0xFF0B1325),
      endDrawer: _phase == 'live' ? _buildOMRDrawer(greenColor) : null,
      body: SafeArea(
        child: activeBody,
      ),
    );
  }

  // ────────────────────────────────────────────────────────
  // PHASE 1: INSTRUCTIONS SCREEN
  // ────────────────────────────────────────────────────────
  Widget _buildInstructionScreen(Color greenColor) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Row(
            children: [
              IconButton(
                icon: const Icon(Icons.arrow_back, color: Colors.white),
                onPressed: () => Navigator.pop(context),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      _chapterTitle,
                      style: const TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.bold, fontFamily: 'Outfit'),
                    ),
                    Text(
                      'JTET Exam Rules & Description',
                      style: TextStyle(color: Colors.white.withOpacity(0.4), fontSize: 11),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),

          // Stat Cards Grid
          GridWidget(greenColor),
          const SizedBox(height: 20),

          // Instructions List
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.02),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: Colors.white.withOpacity(0.06)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(Icons.info_outline, color: greenColor, size: 18),
                    const SizedBox(width: 8),
                    const Text('General Instructions', style: TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold)),
                  ],
                ),
                const SizedBox(height: 12),
                _buildInstructionBullet('Each correct answer awards +2.0 marks.'),
                _buildInstructionBullet('Negative marking of -0.5 marks applies for incorrect responses.'),
                _buildInstructionBullet('Use the "Mark & Next" feature to flag tricky questions. They will turn amber with a star.'),
                _buildInstructionBullet('Use the OMR Bubble Sheet drawer to freely navigate across questions.'),
                _buildInstructionBullet('The test will auto-submit when the countdown timer hits zero.'),
              ],
            ),
          ),
          const SizedBox(height: 20),

          // OMR legend map
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.02),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: Colors.white.withOpacity(0.06)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('OMR Bubble Legend', style: TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold)),
                const SizedBox(height: 12),
                Row(
                  children: [
                    _buildLegendItem(Colors.green, 'Answered'),
                    _buildLegendItem(Colors.redAccent, 'Not Answered'),
                  ],
                ),
                const SizedBox(height: 10),
                Row(
                  children: [
                    _buildLegendItem(Colors.amber, 'Marked'),
                    _buildLegendItem(Colors.purple, 'Answered & Marked'),
                  ],
                ),
                const SizedBox(height: 10),
                Row(
                  children: [
                    _buildLegendItem(Colors.white12, 'Not Visited'),
                    _buildLegendItem(greenColor, 'Current', borderOnly: true),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 28),

          // Action button
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () {
                setState(() {
                  _phase = 'live';
                });
                _startExamTimers();
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: greenColor,
                foregroundColor: const Color(0xFF0B1325),
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              ),
              child: const Text('BEGIN JTET MOCK EXAM', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, letterSpacing: 0.5)),
            ),
          ),
        ],
      ),
    );
  }

  Widget GridWidget(Color greenColor) {
    return Row(
      children: [
        _buildStatCard('Questions', '${_mcqs.length} Qs', greenColor),
        const SizedBox(width: 8),
        _buildStatCard('Time Limit', '${_timeLeft ~/ 60} Min', greenColor),
        const SizedBox(width: 8),
        _buildStatCard('Max Marks', '${(_mcqs.length * 2).toInt()} M', greenColor),
        const SizedBox(width: 8),
        _buildStatCard('Negative', '-0.5', Colors.redAccent),
      ],
    );
  }

  Widget _buildStatCard(String label, String value, Color color) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.02),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.white.withOpacity(0.04)),
        ),
        child: Column(
          children: [
            Text(label, style: TextStyle(color: Colors.white.withOpacity(0.3), fontSize: 8)),
            const SizedBox(height: 4),
            Text(value, style: TextStyle(color: color, fontSize: 12, fontWeight: FontWeight.bold)),
          ],
        ),
      ),
    );
  }

  Widget _buildInstructionBullet(String text) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4.0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('• ', style: TextStyle(color: Colors.white38)),
          Expanded(child: Text(text, style: const TextStyle(color: Colors.white70, fontSize: 11, height: 1.3))),
        ],
      ),
    );
  }

  Widget _buildLegendItem(Color color, String label, {bool borderOnly = false}) {
    return Expanded(
      child: Row(
        children: [
          Container(
            width: 14,
            height: 14,
            decoration: BoxDecoration(
              color: borderOnly ? Colors.transparent : color,
              shape: BoxShape.circle,
              border: Border.all(color: color, width: borderOnly ? 2 : 1),
            ),
          ),
          const SizedBox(width: 8),
          Text(label, style: const TextStyle(color: Colors.white70, fontSize: 11)),
        ],
      ),
    );
  }

  // ────────────────────────────────────────────────────────
  // PHASE 2: LIVE TEST SIMULATOR
  // ────────────────────────────────────────────────────────
  Widget _buildLiveTestScreen(Color greenColor) {
    final mcq = _mcqs[_currentIndex];
    final isMarked = _markedForReview[_currentIndex] == true;

    return Stack(
      children: [
        Column(
          children: [
            // Header controls
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 10.0),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      // Pause Button
                      InkWell(
                        onTap: () {
                          setState(() {
                            _paused = !_paused;
                          });
                        },
                        child: Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.04),
                            shape: BoxShape.circle,
                          ),
                          child: Icon(
                            _paused ? Icons.play_arrow : Icons.pause,
                            color: Colors.white,
                            size: 16,
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            _formatTime(_timeLeft),
                            style: const TextStyle(color: Colors.white, fontSize: 17, fontWeight: FontWeight.bold, fontFamily: 'Inter'),
                          ),
                          Text(
                            _chapterTitle,
                            style: TextStyle(color: Colors.white.withOpacity(0.4), fontSize: 10),
                          ),
                        ],
                      ),
                    ],
                  ),

                  // Open OMR sheet
                  ElevatedButton.icon(
                    onPressed: () {
                      _scaffoldKey.currentState?.openEndDrawer();
                    },
                    icon: Icon(Icons.grid_on_rounded, size: 14, color: greenColor),
                    label: const Text('OMR Sheet', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold)),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF0F172A),
                      foregroundColor: Colors.white,
                      elevation: 0,
                      side: const BorderSide(color: Colors.white10),
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    ),
                  ),
                ],
              ),
            ),
            const Divider(color: Colors.white10, height: 1),

            // Sub header info bar
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 10.0),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      Container(
                        width: 28,
                        height: 28,
                        decoration: BoxDecoration(
                          color: greenColor.withOpacity(0.15),
                          shape: BoxShape.circle,
                          border: Border.all(color: greenColor, width: 1.5),
                        ),
                        child: Center(
                          child: Text(
                            '${_currentIndex + 1}',
                            style: TextStyle(color: greenColor, fontSize: 11, fontWeight: FontWeight.bold),
                          ),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Row(
                        children: [
                          const Icon(Icons.timer_outlined, color: Colors.white30, size: 14),
                          const SizedBox(width: 4),
                          Text(
                            _formatShortTime(_questionSeconds[_currentIndex] ?? 0),
                            style: TextStyle(color: Colors.white.withOpacity(0.4), fontSize: 11, fontFamily: 'Inter'),
                          ),
                        ],
                      ),
                    ],
                  ),

                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: Colors.green.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: const Text('+2.0', style: TextStyle(color: Colors.green, fontSize: 9, fontWeight: FontWeight.bold)),
                      ),
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: Colors.red.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: const Text('-0.5', style: TextStyle(color: Colors.red, fontSize: 9, fontWeight: FontWeight.bold)),
                      ),
                      const SizedBox(width: 8),
                      
                      // Star Mark Button
                      IconButton(
                        onPressed: () {
                          setState(() {
                            _markedForReview[_currentIndex] = !isMarked;
                          });
                        },
                        icon: Icon(
                          isMarked ? Icons.star : Icons.star_border,
                          color: isMarked ? Colors.amber : Colors.white24,
                          size: 20,
                        ),
                        padding: EdgeInsets.zero,
                        constraints: const BoxConstraints(),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const Divider(color: Colors.white10, height: 1),

            // Question content area
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(18),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Subject badge
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.04),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.auto_awesome, color: greenColor, size: 10),
                          const SizedBox(width: 4),
                          Text(
                            mcq.subject.toUpperCase(),
                            style: const TextStyle(color: Colors.white60, fontSize: 8, fontWeight: FontWeight.bold, letterSpacing: 0.5),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),

                    // Question statement
                    Text(
                      mcq.question,
                      style: const TextStyle(color: Colors.white, fontSize: 16, height: 1.4, fontWeight: FontWeight.w500, fontFamily: 'Outfit'),
                    ),
                    const SizedBox(height: 24),

                    // Option buttons
                    _buildLiveOption('A', mcq.optionA, greenColor),
                    const SizedBox(height: 12),
                    _buildLiveOption('B', mcq.optionB, greenColor),
                    const SizedBox(height: 12),
                    _buildLiveOption('C', mcq.optionC, greenColor),
                    const SizedBox(height: 12),
                    _buildLiveOption('D', mcq.optionD, greenColor),
                  ],
                ),
              ),
            ),

            // Bottom toolbar
            Container(
              padding: const EdgeInsets.all(14),
              decoration: const BoxDecoration(
                color: Color(0xFF070B16),
                border: Border(top: BorderSide(color: Colors.white10)),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: _handleMarkForReview,
                      icon: const Icon(Icons.star_outline, size: 14),
                      label: const Text('Mark & Next', style: TextStyle(fontSize: 11)),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: Colors.amber,
                        side: const BorderSide(color: Colors.white10),
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: OutlinedButton(
                      onPressed: _handleClearResponse,
                      style: OutlinedButton.styleFrom(
                        foregroundColor: Colors.redAccent,
                        side: const BorderSide(color: Colors.white10),
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      child: const Text('Clear', style: TextStyle(fontSize: 11)),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: ElevatedButton(
                      onPressed: _handleSaveAndNext,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: greenColor,
                        foregroundColor: const Color(0xFF0B1325),
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      child: const Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text('Save & Next', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                          SizedBox(width: 4),
                          Icon(Icons.chevron_right, size: 14),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),

        // Paused Screen Overlay
        if (_paused)
          Positioned.fill(
            child: Container(
              color: const Color(0xFF0B1325).withOpacity(0.92),
              child: Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(Icons.pause_circle_filled, size: 64, color: Colors.amberAccent),
                    const SizedBox(height: 16),
                    const Text('Exam Paused', style: TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 8),
                    const Text('Your timer and evaluation have been suspended.', style: TextStyle(color: Colors.white38, fontSize: 11)),
                    const SizedBox(height: 24),
                    ElevatedButton(
                      onPressed: () {
                        setState(() {
                          _paused = false;
                        });
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: greenColor,
                        foregroundColor: const Color(0xFF0B1325),
                        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      child: const Text('Resume Exam', style: TextStyle(fontWeight: FontWeight.bold)),
                    ),
                  ],
                ),
              ),
            ),
          ),
      ],
    );
  }

  Widget _buildLiveOption(String key, String text, Color greenColor) {
    final optionIdx = key.codeUnitAt(0) - 65; // A=0, B=1...
    final isSelected = _selectedAnswers[_currentIndex] == optionIdx;

    return InkWell(
      onTap: () => _handleOptionSelected(optionIdx),
      borderRadius: BorderRadius.circular(12),
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
        decoration: BoxDecoration(
          color: isSelected ? greenColor.withOpacity(0.08) : Colors.white.withOpacity(0.01),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: isSelected ? greenColor : Colors.white10, width: isSelected ? 1.5 : 1),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
              decoration: BoxDecoration(
                color: isSelected ? greenColor : Colors.white.withOpacity(0.05),
                borderRadius: BorderRadius.circular(6),
                border: Border.all(color: isSelected ? greenColor : Colors.white10),
              ),
              child: Text(
                key,
                style: TextStyle(
                  color: isSelected ? const Color(0xFF0B1325) : greenColor,
                  fontSize: 10,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                text,
                style: TextStyle(
                  color: isSelected ? Colors.white : Colors.white70,
                  fontSize: 13,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ────────────────────────────────────────────────────────
  // OMR SIDE BAR DRAWER
  // ────────────────────────────────────────────────────────
  Widget _buildOMRDrawer(Color greenColor) {
    return Drawer(
      backgroundColor: const Color(0xFF0F172A),
      child: SafeArea(
        child: Column(
          children: [
            // Drawer header
            Padding(
              padding: const EdgeInsets.all(16.0),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('OMR BUBBLE SHEET', style: TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold)),
                  IconButton(
                    icon: const Icon(Icons.close, color: Colors.white54, size: 18),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
            ),
            const Divider(color: Colors.white10, height: 1),

            // Tab bar toggle
            Row(
              children: [
                Expanded(
                  child: InkWell(
                    onTap: () => setState(() => _paletteView = 'grid'),
                    child: Container(
                      alignment: Alignment.center,
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      decoration: BoxDecoration(
                        border: Border(bottom: BorderSide(color: _paletteView == 'grid' ? greenColor : Colors.transparent, width: 2)),
                      ),
                      child: Text(
                        'Grid View',
                        style: TextStyle(color: _paletteView == 'grid' ? greenColor : Colors.white38, fontSize: 12, fontWeight: FontWeight.bold),
                      ),
                    ),
                  ),
                ),
                Expanded(
                  child: InkWell(
                    onTap: () => setState(() => _paletteView = 'list'),
                    child: Container(
                      alignment: Alignment.center,
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      decoration: BoxDecoration(
                        border: Border(bottom: BorderSide(color: _paletteView == 'list' ? greenColor : Colors.transparent, width: 2)),
                      ),
                      child: Text(
                        'List View',
                        style: TextStyle(color: _paletteView == 'list' ? greenColor : Colors.white38, fontSize: 12, fontWeight: FontWeight.bold),
                      ),
                    ),
                  ),
                ),
              ],
            ),

            // Bubbles content
            Expanded(
              child: _paletteView == 'grid' 
                  ? _buildOMRGrid(greenColor) 
                  : _buildOMRList(greenColor),
            ),

            // Submit CTA
            Padding(
              padding: const EdgeInsets.all(16.0),
              child: SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () {
                    Navigator.pop(context); // Close drawer
                    _showSubmitConfirmationSheet();
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.redAccent,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  child: const Text('SUBMIT TEST PAPER', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 11)),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildOMRGrid(Color greenColor) {
    return GridView.builder(
      padding: const EdgeInsets.all(16),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 5,
        crossAxisSpacing: 10,
        mainAxisSpacing: 10,
      ),
      itemCount: _mcqs.length,
      itemBuilder: (context, idx) {
        final status = _getQuestionStatus(idx);
        final isCurrent = idx == _currentIndex;

        Color bubbleColor = Colors.white.withOpacity(0.02);
        Color textColor = Colors.white30;
        BorderSide border = const BorderSide(color: Colors.white10);

        if (isCurrent) {
          border = BorderSide(color: greenColor, width: 2.0);
          textColor = greenColor;
        } else if (status == 'answered-marked') {
          bubbleColor = Colors.purple;
          textColor = Colors.white;
        } else if (status == 'answered') {
          bubbleColor = Colors.green;
          textColor = Colors.white;
        } else if (status == 'marked') {
          bubbleColor = Colors.amber;
          textColor = Colors.white;
        } else if (status == 'unattempted') {
          bubbleColor = Colors.redAccent;
          textColor = Colors.white;
        }

        return InkWell(
          onTap: () {
            _handleNavigateQuestion(idx);
            Navigator.pop(context); // Close drawer
          },
          child: Container(
            decoration: BoxDecoration(
              color: bubbleColor,
              shape: BoxShape.circle,
              border: Border.fromBorderSide(border),
            ),
            child: Center(
              child: Text(
                status == 'marked' ? '★' : '${idx + 1}',
                style: TextStyle(color: textColor, fontSize: 11, fontWeight: FontWeight.bold, fontFamily: 'Inter'),
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildOMRList(Color greenColor) {
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _mcqs.length,
      itemBuilder: (context, idx) {
        final status = _getQuestionStatus(idx);
        final isCurrent = idx == _currentIndex;

        Color dotColor = Colors.white12;
        if (status == 'answered-marked') dotColor = Colors.purple;
        else if (status == 'answered') dotColor = Colors.green;
        else if (status == 'marked') dotColor = Colors.amber;
        else if (status == 'unattempted') dotColor = Colors.redAccent;

        return Padding(
          padding: const EdgeInsets.only(bottom: 8.0),
          child: InkWell(
            onTap: () {
              _handleNavigateQuestion(idx);
              Navigator.pop(context);
            },
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              decoration: BoxDecoration(
                color: isCurrent ? greenColor.withOpacity(0.08) : Colors.white.withOpacity(0.01),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: isCurrent ? greenColor : Colors.white10),
              ),
              child: Row(
                children: [
                  Container(
                    width: 20,
                    height: 20,
                    decoration: BoxDecoration(color: dotColor, shape: BoxShape.circle),
                    child: Center(
                      child: Text(
                        '${idx + 1}',
                        style: const TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.bold, fontFamily: 'Inter'),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      _mcqs[idx].question,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(color: Colors.white70, fontSize: 11),
                    ),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  // ────────────────────────────────────────────────────────
  // PHASE 3: EVALUATION RESULTS
  // ────────────────────────────────────────────────────────
  Widget _buildResultScreen(Color greenColor) {
    return Padding(
      padding: const EdgeInsets.all(24.0),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.analytics_rounded, color: greenColor, size: 72),
          const SizedBox(height: 16),
          const Text(
            'Test Evaluated!',
            style: TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.bold, fontFamily: 'Outfit'),
          ),
          const SizedBox(height: 6),
          Text(
            'Score aggregates synced to your JTET Dashboard.',
            style: TextStyle(color: Colors.white.withOpacity(0.4), fontSize: 12),
          ),
          const SizedBox(height: 36),

          Row(
            children: [
              _buildStatReportCard('TOTAL SCORE', '${_finalScore.toStringAsFixed(1)} pts', greenColor),
              const SizedBox(width: 10),
              _buildStatReportCard('CORRECT', '$_correctCount', Colors.greenAccent),
              const SizedBox(width: 10),
              _buildStatReportCard('ACCURACY', '$_accuracy%', Colors.blueAccent),
            ],
          ),
          const SizedBox(height: 48),

          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: () => Navigator.pop(context),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: Colors.white,
                    side: const BorderSide(color: Colors.white10),
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  ),
                  child: const Text('Back to Home'),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: ElevatedButton(
                  onPressed: _resetQuiz,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: greenColor,
                    foregroundColor: const Color(0xFF0B1325),
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  ),
                  child: const Text('Re-take Test', style: TextStyle(fontWeight: FontWeight.bold)),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildStatReportCard(String label, String value, Color color) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 20),
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.01),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: Colors.white.withOpacity(0.05)),
        ),
        child: Column(
          children: [
            Text(
              value,
              style: TextStyle(color: color, fontSize: 18, fontWeight: FontWeight.bold, fontFamily: 'Inter'),
            ),
            const SizedBox(height: 8),
            Text(
              label,
              style: TextStyle(color: Colors.white.withOpacity(0.3), fontSize: 8, fontWeight: FontWeight.bold, letterSpacing: 0.5),
            ),
          ],
        ),
      ),
    );
  }
}
