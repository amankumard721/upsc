import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'dart:math';
import '../providers/app_state.dart';
import '../models/models.dart';

class FlashcardScreen extends StatefulWidget {
  final String chapterId;
  const FlashcardScreen({super.key, required this.chapterId});

  @override
  State<FlashcardScreen> createState() => _FlashcardScreenState();
}

class _FlashcardScreenState extends State<FlashcardScreen> with SingleTickerProviderStateMixin {
  List<Flashcard> _cards = [];
  bool _loading = true;
  int _currentIndex = 0;
  bool _isFlipped = false;
  
  int _knowCount = 0;
  int _dontKnowCount = 0;
  bool _finished = false;

  late AnimationController _flipController;
  late Animation<double> _flipAnimation;

  double _swipeOffset = 0.0;

  @override
  void initState() {
    super.initState();
    _loadCards();

    _flipController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 350),
    );
    _flipAnimation = Tween<double>(begin: 0.0, end: pi).animate(
      CurvedAnimation(parent: _flipController, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _flipController.dispose();
    super.dispose();
  }

  Future<void> _loadCards() async {
    final state = Provider.of<AppState>(context, listen: false);
    final fetched = await state.db.getFlashcards(widget.chapterId);
    setState(() {
      _cards = fetched;
      _loading = false;
    });
  }

  void _flipCard() {
    setState(() {
      _isFlipped = !_isFlipped;
    });
    if (_isFlipped) {
      _flipController.forward();
    } else {
      _flipController.reverse();
    }
  }

  void _handleReview(bool know) {
    if (know) {
      _knowCount++;
    } else {
      _dontKnowCount++;
    }

    if (_currentIndex + 1 < _cards.length) {
      setState(() {
        _currentIndex++;
        _isFlipped = false;
        _swipeOffset = 0.0;
      });
      _flipController.reverse(); // reset rotation to 0
    } else {
      _finishSession();
    }
  }

  Future<void> _finishSession() async {
    final state = Provider.of<AppState>(context, listen: false);
    
    // Save XP points earned: knowCount * 10 XP
    if (_knowCount > 0 && state.profile != null) {
      final oldProfile = state.profile!;
      final updated = UserProfile(
        id: oldProfile.id,
        fullName: oldProfile.fullName,
        email: oldProfile.email,
        preferredLanguage: oldProfile.preferredLanguage,
        totalPoints: oldProfile.totalPoints + (_knowCount * 10),
        streak: oldProfile.streak,
        isPremium: oldProfile.isPremium,
        lastActiveDate: DateTime.now(),
      );
      await state.db.updateUserProfile(updated);
      await state.initialize(); // sync state
    }

    setState(() {
      _finished = true;
    });
  }

  void _resetSession() {
    setState(() {
      _currentIndex = 0;
      _isFlipped = false;
      _knowCount = 0;
      _dontKnowCount = 0;
      _finished = false;
      _swipeOffset = 0.0;
    });
    _flipController.reverse();
  }

  @override
  Widget build(BuildContext StateContext) {
    final goldColor = const Color(0xFF10B981);

    if (_loading) {
      return const Scaffold(
        backgroundColor: Color(0xFF0B1325),
        body: Center(child: CircularProgressIndicator(color: Color(0xFF10B981))),
      );
    }

    if (_cards.isEmpty) {
      return Scaffold(
        backgroundColor: const Color(0xFF0B1325),
        appBar: AppBar(
          backgroundColor: Colors.transparent,
          elevation: 0,
          leading: IconButton(
            icon: const Icon(Icons.arrow_back, color: Colors.white),
            onPressed: () => Navigator.pop(StateContext),
          ),
          title: const Text('Flashcards', style: TextStyle(color: Colors.white, fontFamily: 'Outfit')),
        ),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                'No flashcards found for this chapter.',
                style: TextStyle(color: Colors.white.withOpacity(0.4), fontSize: 14),
              ),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: () => Navigator.pop(StateContext),
                style: ElevatedButton.styleFrom(backgroundColor: goldColor, foregroundColor: const Color(0xFF0B1325)),
                child: const Text('Go Back'),
              )
            ],
          ),
        ),
      );
    }

    final activeCard = _cards[_currentIndex];

    return Scaffold(
      backgroundColor: const Color(0xFF0B1325),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.white),
          onPressed: () => Navigator.pop(StateContext),
        ),
        title: const Text('Spaced Repetition Cards', style: TextStyle(color: Colors.white, fontSize: 16, fontFamily: 'Outfit')),
        centerTitle: true,
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: _finished 
              ? _buildFinishedScreen(goldColor)
              : _buildCardScreen(activeCard, goldColor),
        ),
      ),
    );
  }

  Widget _buildCardScreen(Flashcard card, Color goldColor) {
    final progress = (_currentIndex + 1) / _cards.length;
    
    return Column(
      children: [
        // 1. Progress Bar
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'Deck Review Progress',
              style: TextStyle(color: Colors.white.withOpacity(0.4), fontSize: 10, fontFamily: 'Inter'),
            ),
            Text(
              '${_currentIndex + 1} / ${_cards.length} cards',
              style: TextStyle(color: Colors.white.withOpacity(0.4), fontSize: 10, fontFamily: 'Inter', fontWeight: FontWeight.bold),
            ),
          ],
        ),
        const SizedBox(height: 8),
        ClipRRect(
          borderRadius: BorderRadius.circular(4),
          child: LinearProgressIndicator(
            value: progress,
            backgroundColor: Colors.white.withOpacity(0.06),
            valueColor: AlwaysStoppedAnimation(goldColor),
            minHeight: 5,
          ),
        ),
        const SizedBox(height: 24),

        // Cards left message indicator
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
          decoration: BoxDecoration(
            color: Colors.indigo.withOpacity(0.1),
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: Colors.indigo.withOpacity(0.2)),
          ),
          child: Text(
            '${_cards.length - _currentIndex} CARDS REMAINING',
            style: const TextStyle(color: Colors.indigoAccent, fontSize: 9, fontWeight: FontWeight.bold, letterSpacing: 0.8),
          ),
        ),
        const SizedBox(height: 24),

        // 2. Animated Card
        Expanded(
          child: GestureDetector(
            onTap: _flipCard,
            onHorizontalDragUpdate: (details) {
              setState(() {
                _swipeOffset += details.primaryDelta!;
              });
            },
            onHorizontalDragEnd: (details) {
              // Swipe threshold: 100 pixels
              if (_swipeOffset > 100) {
                // Swipe Right -> Know
                _handleReview(true);
              } else if (_swipeOffset < -100) {
                // Swipe Left -> Don't Know
                _handleReview(false);
              } else {
                setState(() {
                  _swipeOffset = 0.0;
                });
              }
            },
            child: Transform.translate(
              offset: Offset(_swipeOffset, 0),
              child: Transform.rotate(
                angle: (_swipeOffset / 400) * (pi / 8), // tilt on drag
                child: AnimatedBuilder(
                  animation: _flipAnimation,
                  builder: (context, child) {
                    final angle = _flipAnimation.value;
                    final isUnder = angle >= pi / 2;
                    return Transform(
                      transform: Matrix4.identity()
                        ..setEntry(3, 2, 0.001) // perspective mapping
                        ..rotateY(angle),
                      alignment: Alignment.center,
                      child: isUnder 
                          ? Transform(
                              // Reverse the Y reflection so answer text isn't backwards
                              transform: Matrix4.identity()..rotateY(pi),
                              alignment: Alignment.center,
                              child: _buildCardFace(
                                title: 'ANSWER',
                                content: card.answer,
                                subtitle: 'Tap to flip back',
                                cardColor: const Color(0xFF1E1405),
                                textColor: goldColor,
                                borderSideColor: goldColor.withOpacity(0.3),
                              ),
                            )
                          : _buildCardFace(
                              title: 'QUESTION',
                              content: card.question,
                              subtitle: 'Tap to see answer',
                              cardColor: const Color(0xFF0F172A),
                              textColor: Colors.white,
                              borderSideColor: Colors.white.withOpacity(0.08),
                            ),
                    );
                  },
                ),
              ),
            ),
          ),
        ),
        const SizedBox(height: 24),

        // 3. Action Buttons
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // Don't Know Button (Swipe Left)
            IconButton(
              onPressed: () => _handleReview(false),
              iconSize: 52,
              icon: CircleAvatar(
                radius: 26,
                backgroundColor: Colors.red.withOpacity(0.08),
                child: const Icon(Icons.close, color: Colors.redAccent, size: 24),
              ),
            ),
            const SizedBox(width: 24),

            // Flip Button
            OutlinedButton.icon(
              onPressed: _flipCard,
              icon: const Icon(Icons.rotate_right_rounded, size: 16),
              label: const Text('Flip Card'),
              style: OutlinedButton.styleFrom(
                foregroundColor: Colors.white.withOpacity(0.6),
                side: BorderSide(color: Colors.white.withOpacity(0.1)),
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(20),
                ),
              ),
            ),
            const SizedBox(width: 24),

            // Know Button (Swipe Right)
            IconButton(
              onPressed: () => _handleReview(true),
              iconSize: 52,
              icon: CircleAvatar(
                radius: 26,
                backgroundColor: Colors.green.withOpacity(0.08),
                child: const Icon(Icons.check, color: Colors.greenAccent, size: 24),
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),
      ],
    );
  }

  Widget _buildCardFace({
    required String title,
    required String content,
    required String subtitle,
    required Color cardColor,
    required Color textColor,
    required Color borderSideColor,
  }) {
    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        color: cardColor,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: borderSideColor, width: 1.5),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.4),
            blurRadius: 20,
            offset: const Offset(0, 10),
          )
        ],
      ),
      padding: const EdgeInsets.all(28.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                title,
                style: TextStyle(
                  color: textColor.withOpacity(0.5),
                  fontSize: 10,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 1.5,
                  fontFamily: 'Inter',
                ),
              ),
              Icon(Icons.style, color: textColor.withOpacity(0.3), size: 16),
            ],
          ),
          const Spacer(),
          Text(
            content,
            textAlign: TextAlign.center,
            style: TextStyle(
              color: textColor,
              fontSize: 18,
              height: 1.4,
              fontWeight: FontWeight.bold,
              fontFamily: 'Outfit',
            ),
          ),
          const Spacer(),
          Text(
            subtitle,
            textAlign: TextAlign.center,
            style: TextStyle(
              color: textColor.withOpacity(0.3),
              fontSize: 9,
              letterSpacing: 0.5,
              fontFamily: 'Inter',
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFinishedScreen(Color goldColor) {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        const Icon(Icons.military_tech_rounded, color: Color(0xFF10B981), size: 80),
        const SizedBox(height: 16),
        const Text(
          'Session Complete!',
          style: TextStyle(
            color: Colors.white,
            fontSize: 22,
            fontWeight: FontWeight.bold,
            fontFamily: 'Outfit',
          ),
        ),
        const SizedBox(height: 8),
        Text(
          'Your Leitner spaced-repetition card index has been rescheduled.',
          textAlign: TextAlign.center,
          style: TextStyle(
            color: Colors.white.withOpacity(0.4),
            fontSize: 12,
            fontFamily: 'Inter',
          ),
        ),
        const SizedBox(height: 32),
        // Score Summary box
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            _buildStatBox('KNEW', '$_knowCount', Colors.greenAccent, Colors.green),
            const SizedBox(width: 16),
            _buildStatBox('FORGOT', '$_dontKnowCount', Colors.redAccent, Colors.red),
          ],
        ),
        const SizedBox(height: 24),
        Text(
          'Earned +${_knowCount * 10} XP points for review recall!',
          style: TextStyle(color: goldColor, fontSize: 12, fontWeight: FontWeight.bold, fontFamily: 'Inter'),
        ),
        const SizedBox(height: 36),
        Row(
          children: [
            Expanded(
              child: OutlinedButton(
                onPressed: () => Navigator.pop(context),
                style: OutlinedButton.styleFrom(
                  foregroundColor: Colors.white,
                  side: BorderSide(color: Colors.white.withOpacity(0.1)),
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                ),
                child: const Text('Back to Home'),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: ElevatedButton(
                onPressed: _resetSession,
                style: ElevatedButton.styleFrom(
                  backgroundColor: goldColor,
                  foregroundColor: const Color(0xFF0B1325),
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                ),
                child: const Text('Review Again', style: TextStyle(fontWeight: FontWeight.bold)),
              ),
            ),
          ],
        )
      ],
    );
  }

  Widget _buildStatBox(String label, String value, Color color, Color bgColor) {
    return Container(
      width: 110,
      padding: const EdgeInsets.symmetric(vertical: 16),
      decoration: BoxDecoration(
        color: bgColor.withOpacity(0.08),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: bgColor.withOpacity(0.2)),
      ),
      child: Column(
        children: [
          Text(
            value,
            style: TextStyle(color: color, fontSize: 24, fontWeight: FontWeight.bold, fontFamily: 'Inter'),
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: TextStyle(color: Colors.white.withOpacity(0.4), fontSize: 9, fontWeight: FontWeight.bold, letterSpacing: 0.5),
          ),
        ],
      ),
    );
  }
}
