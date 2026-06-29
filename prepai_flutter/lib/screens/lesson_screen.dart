import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'dart:math';
import '../providers/app_state.dart';
import '../providers/audio_provider.dart';
import '../models/models.dart';
import 'quiz_screen.dart';

class LessonScreen extends StatefulWidget {
  final String chapterId;
  const LessonScreen({super.key, required this.chapterId});

  @override
  State<LessonScreen> createState() => _LessonScreenState();
}

class _LessonScreenState extends State<LessonScreen> {
  Chapter? _chapter;
  Book? _book;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadLessonData();
  }

  Future<void> _loadLessonData() async {
    final state = Provider.of<AppState>(context, listen: false);
    final audio = Provider.of<AudioProvider>(context, listen: false);
    final ch = await state.db.getChapter(widget.chapterId);
    
    if (ch != null) {
      _chapter = ch;
      _book = state.books.firstWhere(
        (b) => b.id == ch.bookId,
        orElse: () => state.books.first,
      );

      // Start playing via global provider (if same chapter, just resumes)
      await audio.startLesson(ch, _book);
    }
    setState(() {
      _loading = false;
    });
  }

  Future<void> _handleLessonComplete() async {
    final state = Provider.of<AppState>(context, listen: false);
    final audio = Provider.of<AudioProvider>(context, listen: false);

    // Stop audio when lesson is marked complete
    await audio.stop();

    // Save completion to Supabase database
    await state.completeChapter(widget.chapterId);

    if (mounted) {
      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (context) => AlertDialog(
          backgroundColor: const Color(0xFF070B16),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(20),
            side: const BorderSide(color: Color(0xFF10B981), width: 1.5),
          ),
          title: const Row(
            children: [
              Icon(Icons.emoji_events, color: Color(0xFF10B981)),
              SizedBox(width: 8),
              Text('Chapter Finished!', style: TextStyle(color: Colors.white, fontFamily: 'Outfit')),
            ],
          ),
          content: const Text(
            'Amazing! You completed this audio lesson and earned +50 XP. Ready to test your revision?',
            style: TextStyle(color: Colors.white70, fontSize: 13, height: 1.4),
          ),
          actions: [
            TextButton(
              onPressed: () {
                Navigator.pop(context); // Close dialog
                Navigator.pop(context); // Back to book details
              },
              child: const Text('Back to Course', style: TextStyle(color: Colors.white60)),
            ),
            ElevatedButton(
              onPressed: () {
                Navigator.pop(context); // Close dialog
                Navigator.pushReplacement(
                  context,
                  MaterialPageRoute(
                    builder: (context) => QuizScreen(chapterId: widget.chapterId),
                  ),
                );
              },
              style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF10B981), foregroundColor: const Color(0xFF0B1325)),
              child: const Text('Take Quiz Now', style: TextStyle(fontWeight: FontWeight.bold)),
            )
          ],
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final audio = Provider.of<AudioProvider>(context);
    final accentColor = const Color(0xFF10B981);

    if (_loading || _chapter == null) {
      return const Scaffold(
        backgroundColor: Color(0xFF0B1325),
        body: Center(child: CircularProgressIndicator(color: Color(0xFF10B981))),
      );
    }

    return Scaffold(
      backgroundColor: const Color(0xFF0B1325),
      body: SafeArea(
        child: Column(
          children: [
            // 1. Top bar
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 8.0, vertical: 4.0),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  IconButton(
                    icon: const Icon(Icons.keyboard_arrow_down_rounded, color: Colors.white, size: 28),
                    tooltip: 'Minimize to mini player',
                    onPressed: () => Navigator.pop(context),
                  ),
                  Column(
                    children: [
                      Text(
                        _book?.title ?? 'JTET Sathi Academy',
                        style: TextStyle(color: Colors.white.withOpacity(0.4), fontSize: 10, fontFamily: 'Inter'),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        'Chapter ${_chapter!.chapterNumber}',
                        style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold, fontFamily: 'Outfit'),
                      ),
                    ],
                  ),
                  IconButton(
                    icon: const Icon(Icons.playlist_play, color: Colors.white),
                    onPressed: () => _showSceneNavigatorSheet(),
                  ),
                ],
              ),
            ),

            // 2. Wave Canvas area
            Container(
              height: 120,
              width: double.infinity,
              margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.01),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: Colors.white.withOpacity(0.05)),
              ),
              child: CustomPaint(
                painter: AudioWavePainter(isPlaying: audio.isPlaying),
              ),
            ),

            // 3. Spoken Text highlights list
            Expanded(
              child: Container(
                margin: const EdgeInsets.symmetric(horizontal: 16),
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: const Color(0xFF070B16),
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(color: Colors.white.withOpacity(0.04)),
                ),
                child: ListView.builder(
                  itemCount: audio.sentences.length,
                  itemBuilder: (context, index) {
                    final isCurrent = index == audio.activeSentenceIndex;
                    return GestureDetector(
                      onTap: () => audio.seekToSentence(index),
                      child: Padding(
                        padding: const EdgeInsets.symmetric(vertical: 8.0),
                        child: Text(
                          audio.sentences[index],
                          style: TextStyle(
                            color: isCurrent ? accentColor : Colors.white.withOpacity(0.35),
                            fontSize: isCurrent ? 15 : 13,
                            fontWeight: isCurrent ? FontWeight.bold : FontWeight.normal,
                            height: 1.45,
                            fontFamily: 'Inter',
                          ),
                        ),
                      ),
                    );
                  },
                ),
              ),
            ),

            // 4. Scrub bar
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 16.0),
              child: Column(
                children: [
                  SliderTheme(
                    data: SliderThemeData(
                      thumbColor: accentColor,
                      activeTrackColor: accentColor,
                      inactiveTrackColor: Colors.white.withOpacity(0.08),
                      trackHeight: 4,
                      thumbShape: const RoundSliderThumbShape(enabledThumbRadius: 6),
                    ),
                    child: Slider(
                      value: audio.progressPercent,
                      onChanged: (val) => audio.seekToProgress(val),
                    ),
                  ),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(audio.elapsedString, style: TextStyle(color: Colors.white.withOpacity(0.4), fontSize: 10, fontFamily: 'Inter')),
                      Text(audio.totalDurationString, style: TextStyle(color: Colors.white.withOpacity(0.4), fontSize: 10, fontFamily: 'Inter')),
                    ],
                  ),
                ],
              ),
            ),

            // 5. Controls
            Padding(
              padding: const EdgeInsets.only(left: 16.0, right: 16.0, bottom: 24.0),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: [
                  // Playback speed selection
                  InkWell(
                    onTap: () => _showSpeedDialog(audio),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.04),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: Colors.white.withOpacity(0.1)),
                      ),
                      child: Text(
                        '${audio.playbackSpeed}x',
                        style: TextStyle(color: accentColor, fontSize: 11, fontWeight: FontWeight.bold, fontFamily: 'Inter'),
                      ),
                    ),
                  ),

                  // Skip backward 10s
                  IconButton(
                    icon: const Icon(Icons.replay_10_rounded, color: Colors.white, size: 28),
                    onPressed: () => audio.seekRelative(-10),
                  ),

                  // Play / Pause Circle
                  IconButton(
                    iconSize: 64,
                    icon: CircleAvatar(
                      radius: 32,
                      backgroundColor: accentColor,
                      child: Icon(
                        audio.isPlaying ? Icons.pause_rounded : Icons.play_arrow_rounded,
                        color: const Color(0xFF0B1325),
                        size: 36,
                      ),
                    ),
                    onPressed: () => audio.togglePlay(),
                  ),

                  // Skip forward 10s
                  IconButton(
                    icon: const Icon(Icons.forward_10_rounded, color: Colors.white, size: 28),
                    onPressed: () => audio.seekRelative(10),
                  ),

                  // Finished checkmark shortcut
                  IconButton(
                    icon: const Icon(Icons.check_circle_outline, color: Colors.greenAccent, size: 24),
                    onPressed: _handleLessonComplete,
                  ),
                ],
              ),
            )
          ],
        ),
      ),
    );
  }

  void _showSpeedDialog(AudioProvider audio) {
    showDialog(
      context: context,
      builder: (context) => SimpleDialog(
        backgroundColor: const Color(0xFF070B16),
        title: const Text('Playback Speed', style: TextStyle(color: Colors.white, fontFamily: 'Outfit')),
        children: [1.0, 1.25, 1.5, 2.0].map((speed) {
          return SimpleDialogOption(
            onPressed: () {
              Navigator.pop(context);
              audio.changeSpeed(speed);
            },
            child: Padding(
              padding: const EdgeInsets.symmetric(vertical: 6.0),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('${speed}x', style: const TextStyle(color: Colors.white, fontSize: 14)),
                  if (audio.playbackSpeed == speed)
                    const Icon(Icons.check, color: Color(0xFF10B981), size: 18),
                ],
              ),
            ),
          );
        }).toList(),
      ),
    );
  }

  void _showSceneNavigatorSheet() {
    final audio = Provider.of<AudioProvider>(context, listen: false);
    showModalBottomSheet(
      context: context,
      backgroundColor: const Color(0xFF070B16),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.only(topLeft: Radius.circular(20), topRight: Radius.circular(20)),
      ),
      builder: (context) {
        return Container(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text(
                'Scene Navigator',
                style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold, fontFamily: 'Outfit'),
              ),
              const SizedBox(height: 16),
              _buildSceneTile(audio, 1, 'Introduction', '0% progress', Icons.bookmark_added),
              _buildSceneTile(audio, 2, 'Core Arguments', '50% progress', Icons.psychology),
              _buildSceneTile(audio, 3, 'Summary Conclusion', '90% progress', Icons.stars),
            ],
          ),
        );
      },
    );
  }

  Widget _buildSceneTile(AudioProvider audio, int chNo, String title, String subtitle, IconData icon) {
    return ListTile(
      leading: Icon(icon, color: const Color(0xFF10B981)),
      title: Text(title, style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold)),
      subtitle: Text(subtitle, style: TextStyle(color: Colors.white.withOpacity(0.4), fontSize: 10)),
      onTap: () {
        Navigator.pop(context); // Close sheet
        final sentencesCount = audio.sentences.length;
        int targetIdx = 0;
        if (chNo == 2) targetIdx = sentencesCount ~/ 2;
        if (chNo == 3) targetIdx = sentencesCount - 2;
        audio.seekToSentence(targetIdx);
      },
    );
  }
}

// Custom Painter for animated wave audio indicator
class AudioWavePainter extends CustomPainter {
  final bool isPlaying;
  AudioWavePainter({required this.isPlaying});

  @override
  void paint(Canvas canvas, Size size) {
    final width = size.width;
    final height = size.height;
    final center = height / 2;

    final paint = Paint()
      ..color = const Color(0xFF10B981)
      ..strokeWidth = 2.0
      ..strokeCap = StrokeCap.round
      ..style = PaintingStyle.stroke;

    final barCount = 30;
    final space = width / barCount;
    final random = Random(42);

    for (int i = 0; i < barCount; i++) {
      final x = i * space + space / 2;
      double barHeight = 8.0;
      if (isPlaying) {
        // Create an oscillating motion
        final timeFactor = DateTime.now().millisecondsSinceEpoch / 250;
        barHeight = 12.0 + sin(timeFactor + i) * 35.0 * random.nextDouble();
      } else {
        barHeight = 10.0 + random.nextDouble() * 15.0;
      }
      canvas.drawLine(
        Offset(x, center - barHeight / 2),
        Offset(x, center + barHeight / 2),
        paint,
      );
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => true;
}
