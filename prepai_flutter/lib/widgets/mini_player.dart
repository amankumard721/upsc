import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/audio_provider.dart';
import '../screens/lesson_screen.dart';

/// A YouTube-style persistent mini player bar that appears at the bottom
/// of the screen when audio is playing and the user has navigated away
/// from the full LessonScreen.
class MiniPlayer extends StatelessWidget {
  const MiniPlayer({super.key});

  static const _emerald = Color(0xFF10B981);
  static const _bgDark = Color(0xFF070B16);
  static const _surfaceDark = Color(0xFF0B1325);

  @override
  Widget build(BuildContext context) {
    final audio = Provider.of<AudioProvider>(context);

    // Don't show if nothing is loaded
    if (!audio.hasTrack) return const SizedBox.shrink();

    final chapter = audio.currentChapter!;
    final book = audio.currentBook;

    return GestureDetector(
      onTap: () {
        // Open full lesson screen
        Navigator.of(context).push(
          PageRouteBuilder(
            pageBuilder: (context, animation, secondaryAnimation) =>
                LessonScreen(chapterId: chapter.id),
            transitionsBuilder: (context, animation, secondaryAnimation, child) {
              const begin = Offset(0.0, 1.0);
              const end = Offset.zero;
              final tween = Tween(begin: begin, end: end)
                  .chain(CurveTween(curve: Curves.easeOutCubic));
              return SlideTransition(position: animation.drive(tween), child: child);
            },
            transitionDuration: const Duration(milliseconds: 350),
          ),
        );
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeOut,
        decoration: BoxDecoration(
          color: _bgDark,
          border: Border(
            top: BorderSide(color: _emerald.withOpacity(0.15), width: 1),
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.5),
              blurRadius: 20,
              offset: const Offset(0, -4),
            ),
          ],
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // ── Top progress line ──
            SizedBox(
              height: 2.5,
              child: LinearProgressIndicator(
                value: audio.progressPercent,
                backgroundColor: Colors.white.withOpacity(0.05),
                valueColor: const AlwaysStoppedAnimation<Color>(_emerald),
              ),
            ),

            // ── Content row ──
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              child: Row(
                children: [
                  // Animated wave icon
                  Container(
                    width: 42,
                    height: 42,
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [
                          _emerald.withOpacity(0.2),
                          _emerald.withOpacity(0.05),
                        ],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: _emerald.withOpacity(0.2)),
                    ),
                    child: Icon(
                      audio.isPlaying
                          ? Icons.graphic_eq_rounded
                          : Icons.headphones_rounded,
                      color: _emerald,
                      size: 22,
                    ),
                  ),

                  const SizedBox(width: 12),

                  // Title + subtitle
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          chapter.title.isNotEmpty
                              ? chapter.title
                              : 'Chapter ${chapter.chapterNumber}',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 13,
                            fontWeight: FontWeight.bold,
                            fontFamily: 'Outfit',
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 2),
                        Text(
                          book?.title ?? 'JTET Sathi',
                          style: TextStyle(
                            color: Colors.white.withOpacity(0.4),
                            fontSize: 10,
                            fontFamily: 'Inter',
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),

                  // Time label
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.04),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(
                      audio.elapsedString,
                      style: TextStyle(
                        color: _emerald.withOpacity(0.8),
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                        fontFamily: 'Inter',
                      ),
                    ),
                  ),

                  const SizedBox(width: 8),

                  // Play / Pause
                  _MiniControlButton(
                    icon: audio.isPlaying
                        ? Icons.pause_rounded
                        : Icons.play_arrow_rounded,
                    onTap: () => audio.togglePlay(),
                    filled: true,
                  ),

                  const SizedBox(width: 4),

                  // Close
                  _MiniControlButton(
                    icon: Icons.close_rounded,
                    onTap: () => audio.stop(),
                    filled: false,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _MiniControlButton extends StatelessWidget {
  final IconData icon;
  final VoidCallback onTap;
  final bool filled;

  const _MiniControlButton({
    required this.icon,
    required this.onTap,
    required this.filled,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(20),
        child: Container(
          width: 36,
          height: 36,
          decoration: BoxDecoration(
            color: filled
                ? MiniPlayer._emerald
                : Colors.white.withOpacity(0.06),
            shape: BoxShape.circle,
            border: filled
                ? null
                : Border.all(color: Colors.white.withOpacity(0.1)),
          ),
          child: Icon(
            icon,
            color: filled ? const Color(0xFF0B1325) : Colors.white.withOpacity(0.6),
            size: 20,
          ),
        ),
      ),
    );
  }
}
