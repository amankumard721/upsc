import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/app_state.dart';
import '../models/models.dart';
import 'book_details_screen.dart';
import 'quiz_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  String _selectedSubject = 'All';

  final List<Map<String, String>> _subjects = [
    {'label': 'All', 'emoji': '📚'},
    {'label': 'Jharkhand', 'emoji': '🏔️'},
    {'label': 'Geography', 'emoji': '🌍'},
    {'label': 'History', 'emoji': '🏛️'},
  ];

  @override
  Widget build(BuildContext StateContext) {
    final state = Provider.of<AppState>(StateContext);
    final profile = state.profile;
    
    // Filter books by subject
    final filteredBooks = state.books.where((book) {
      return _selectedSubject == 'All' || book.subject == _selectedSubject;
    }).toList();

    return Scaffold(
      backgroundColor: const Color(0xFF0B1325),
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: () => state.initialize(),
          color: const Color(0xFF10B981),
          backgroundColor: const Color(0xFF070B16),
          child: SingleChildScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // 1. Header Row
                _buildHeader(profile, state),
                const SizedBox(height: 24),

                // 2. Daily Challenge Card
                _buildDailyChallengeCard(state),
                const SizedBox(height: 24),

                // 3. Books Section Header
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'Study Material',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        fontFamily: 'Outfit',
                      ),
                    ),
                    Text(
                      '${state.books.length} Books available',
                      style: TextStyle(
                        color: Colors.white.withOpacity(0.4),
                        fontSize: 12,
                        fontFamily: 'Inter',
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),

                // 4. Subject Chips
                SizedBox(
                  height: 38,
                  child: ListView.separated(
                    scrollDirection: Axis.horizontal,
                    itemCount: _subjects.length,
                    separatorBuilder: (_, __) => const SizedBox(width: 8),
                    itemBuilder: (context, index) {
                      final sub = _subjects[index];
                      final isSelected = _selectedSubject == sub['label'];
                      return ChoiceChip(
                        label: Row(
                          children: [
                            Text(sub['emoji']!),
                            const SizedBox(width: 4),
                            Text(sub['label']!),
                          ],
                        ),
                        selected: isSelected,
                        onSelected: (selected) {
                          setState(() {
                            _selectedSubject = sub['label']!;
                          });
                        },
                        selectedColor: const Color(0xFF10B981),
                        backgroundColor: Colors.white.withOpacity(0.04),
                        labelStyle: TextStyle(
                          color: isSelected ? const Color(0xFF0B1325) : Colors.white.withOpacity(0.6),
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                        ),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(20),
                          side: BorderSide(
                            color: isSelected ? const Color(0xFF10B981) : Colors.white.withOpacity(0.08),
                          ),
                        ),
                      );
                    },
                  ),
                ),
                const SizedBox(height: 16),

                // 5. Horizontal Books Scroll
                state.loading 
                    ? const Center(child: CircularProgressIndicator(color: Color(0xFF10B981)))
                    : filteredBooks.isEmpty 
                        ? _buildEmptyState('No books found. Syncing database...')
                        : SizedBox(
                            height: 250,
                            child: ListView.separated(
                              scrollDirection: Axis.horizontal,
                              itemCount: filteredBooks.length,
                              separatorBuilder: (_, __) => const SizedBox(width: 16),
                              itemBuilder: (context, index) {
                                final book = filteredBooks[index];
                                return _buildBookCard(context, book, state);
                              },
                            ),
                          ),
                const SizedBox(height: 28),

                // 6. JTET Test Series Section
                const Text(
                  'JTET Test Series',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    fontFamily: 'Outfit',
                  ),
                ),
                const SizedBox(height: 12),
                _buildTestSeriesCard(
                  title: 'JTET Full-Length Mock Test 1',
                  subtitle: 'Paper I (Class 1-5)',
                  questions: 150,
                  time: 150,
                  attemptedProgress: 0.45,
                  isFree: true,
                  chapterId: '00000000-0000-0000-0000-000000000012',
                ),
                const SizedBox(height: 12),
                _buildTestSeriesCard(
                  title: 'JTET Paper II Mock Test 1',
                  subtitle: 'Paper II (Class 6-8)',
                  questions: 150,
                  time: 150,
                  attemptedProgress: 0.0,
                  isFree: false,
                  chapterId: '00000000-0000-0000-0000-000000000012',
                ),
                const SizedBox(height: 24),

                // 7. Weekly Activity Graphic
                _buildWeeklyActivityChart(),
                const SizedBox(height: 32),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildHeader(UserProfile? profile, AppState state) {
    final greenColor = const Color(0xFF10B981);
    
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'JTET Sathi',
              style: TextStyle(
                color: greenColor,
                fontSize: 24,
                fontWeight: FontWeight.bold,
                fontFamily: 'Outfit',
              ),
            ),
            const SizedBox(height: 2),
            Text(
              'Welcome, ${profile?.fullName ?? "Aspirant"}',
              style: const TextStyle(
                color: Colors.white,
                fontSize: 14,
                fontFamily: 'Inter',
              ),
            ),
          ],
        ),
        Row(
          children: [
            // Streak Flame
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(
                color: Colors.orange.withOpacity(0.08),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: Colors.orange.withOpacity(0.2)),
              ),
              child: Row(
                children: [
                  const Icon(Icons.local_fire_department, color: Colors.orange, size: 16),
                  const SizedBox(width: 4),
                  Text(
                    '${profile?.streak ?? 0}',
                    style: const TextStyle(
                      color: Colors.orange,
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                      fontFamily: 'Inter',
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 8),

            // XP Zap
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(
                color: greenColor.withOpacity(0.08),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: greenColor.withOpacity(0.2)),
              ),
              child: Row(
                children: [
                  Icon(Icons.bolt, color: greenColor, size: 16),
                  const SizedBox(width: 4),
                  Text(
                    '${profile?.totalPoints ?? 0} XP',
                    style: TextStyle(
                      color: greenColor,
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                      fontFamily: 'Inter',
                    ),
                  ),
                ],
              ),
            ),
          ],
        )
      ],
    );
  }

  Widget _buildDailyChallengeCard(AppState state) {
    final greenColor = const Color(0xFF10B981);
    
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16.0),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            greenColor.withOpacity(0.18),
            greenColor.withOpacity(0.05),
            Colors.transparent,
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: greenColor.withOpacity(0.15)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text(
                'DAILY CHALLENGE 🔥',
                style: TextStyle(
                  color: greenColor,
                  fontSize: 10,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 1.5,
                  fontFamily: 'Inter',
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          const Text(
            'Test your knowledge in JTET Pedagogy & GK',
            style: TextStyle(
              color: Colors.white,
              fontSize: 15,
              fontWeight: FontWeight.bold,
              fontFamily: 'Outfit',
            ),
          ),
          const SizedBox(height: 12),
          ElevatedButton.icon(
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => const QuizScreen(chapterId: '00000000-0000-0000-0000-000000000012'),
                ),
              );
            },
            icon: Icon(Icons.track_changes_rounded, color: const Color(0xFF0B1325), size: 16),
            label: const Text('Play Challenge'),
            style: ElevatedButton.styleFrom(
              backgroundColor: greenColor,
              foregroundColor: const Color(0xFF0B1325),
              elevation: 0,
              textStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBookCard(BuildContext context, Book book, AppState state) {
    final progressList = state.progressList;
    final doneChaptersCount = progressList.where((p) => p.isCompleted).length;
    final bookProgress = book.id == '00000000-0000-0000-0000-000000000001' && doneChaptersCount > 0 ? 0.33 : 0.0;

    return InkWell(
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => BookDetailsScreen(bookId: book.id),
          ),
        );
      },
      child: Container(
        width: 140,
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.02),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: Colors.white.withOpacity(0.05)),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.3),
              blurRadius: 10,
              offset: const Offset(0, 4),
            )
          ],
        ),
        clipBehavior: Clip.antiAlias,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Cover Image
            Expanded(
              child: Stack(
                fit: StackFit.expand,
                children: [
                  Image.network(
                    book.coverImage,
                    fit: BoxFit.cover,
                    errorBuilder: (context, error, stackTrace) => Container(
                      color: Colors.grey.shade900,
                      child: const Icon(Icons.book, color: Colors.white24, size: 40),
                    ),
                  ),
                  Container(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [
                          Colors.transparent,
                          const Color(0xFF0B1325).withOpacity(0.8),
                        ],
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                      ),
                    ),
                  ),
                  Positioned(
                    top: 8,
                    left: 8,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: Colors.black.withOpacity(0.6),
                        borderRadius: BorderRadius.circular(4),
                        border: Border.all(color: Colors.white.withOpacity(0.2)),
                      ),
                      child: Text(
                        book.subject.toUpperCase(),
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 8,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ),
                  Positioned(
                    bottom: 8,
                    left: 8,
                    right: 8,
                    child: Text(
                      book.title,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            // Info Row
            Padding(
              padding: const EdgeInsets.all(8.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: Text(
                          book.author,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(
                            color: Colors.white.withOpacity(0.4),
                            fontSize: 8,
                            fontFamily: 'Inter',
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  // Progress indicator line
                  ClipRRect(
                    borderRadius: BorderRadius.circular(2),
                    child: LinearProgressIndicator(
                      value: bookProgress,
                      backgroundColor: Colors.white.withOpacity(0.1),
                      valueColor: const AlwaysStoppedAnimation(Color(0xFF10B981)),
                      minHeight: 3,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.end,
                    children: [
                      Text(
                        '${(bookProgress * 100).toInt()}% Done',
                        style: const TextStyle(
                          color: Color(0xFF10B981),
                          fontSize: 8,
                          fontWeight: FontWeight.bold,
                          fontFamily: 'Inter',
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            )
          ],
        ),
      ),
    );
  }

  Widget _buildTestSeriesCard({
    required String title,
    required String subtitle,
    required int questions,
    required int time,
    required double attemptedProgress,
    required bool isFree,
    required String chapterId,
  }) {
    final greenColor = const Color(0xFF10B981);
    
    return Container(
      padding: const EdgeInsets.all(14.0),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.02),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withOpacity(0.06)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 13,
                      fontWeight: FontWeight.bold,
                      fontFamily: 'Outfit',
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    subtitle,
                    style: TextStyle(
                      color: Colors.white.withOpacity(0.4),
                      fontSize: 10,
                      fontFamily: 'Inter',
                    ),
                  ),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: isFree ? Colors.green.withOpacity(0.1) : greenColor.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(6),
                  border: Border.all(color: isFree ? Colors.green.withOpacity(0.3) : greenColor.withOpacity(0.3)),
                ),
                child: Text(
                  isFree ? 'FREE' : 'PRO',
                  style: TextStyle(
                    color: isFree ? Colors.green : greenColor,
                    fontSize: 8,
                    fontWeight: FontWeight.bold,
                    fontFamily: 'Inter',
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Icon(Icons.description, size: 12, color: Colors.white.withOpacity(0.3)),
              const SizedBox(width: 4),
              Text(
                '$questions Questions',
                style: TextStyle(color: Colors.white.withOpacity(0.4), fontSize: 10, fontFamily: 'Inter'),
              ),
              const SizedBox(width: 12),
              Icon(Icons.timer, size: 12, color: Colors.white.withOpacity(0.3)),
              const SizedBox(width: 4),
              Text(
                '$time Minutes',
                style: TextStyle(color: Colors.white.withOpacity(0.4), fontSize: 10, fontFamily: 'Inter'),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(2),
                  child: LinearProgressIndicator(
                    value: attemptedProgress,
                    backgroundColor: Colors.white.withOpacity(0.05),
                    valueColor: const AlwaysStoppedAnimation(Color(0xFF00C853)),
                    minHeight: 3,
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Text(
                attemptedProgress > 0 ? '${(attemptedProgress * 100).toInt()}% Attempted' : 'Never Attempted',
                style: TextStyle(
                  color: attemptedProgress > 0 ? const Color(0xFF00C853) : Colors.white.withOpacity(0.3),
                  fontSize: 8,
                  fontWeight: FontWeight.bold,
                  fontFamily: 'Inter',
                ),
              ),
              const SizedBox(width: 12),
              ElevatedButton(
                onPressed: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => QuizScreen(chapterId: chapterId),
                    ),
                  );
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: greenColor,
                  foregroundColor: const Color(0xFF0B1325),
                  elevation: 0,
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 0),
                  minimumSize: const Size(60, 28),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
                child: const Text('Start', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold)),
              ),
            ],
          )
        ],
      ),
    );
  }

  Widget _buildWeeklyActivityChart() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.02),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.white.withOpacity(0.05)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(
                  color: Colors.indigo.withOpacity(0.15),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Icon(Icons.trending_up, color: Colors.indigoAccent, size: 16),
              ),
              const SizedBox(width: 8),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Weekly Activity',
                    style: TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold),
                  ),
                  Text(
                    'Minutes studied per day',
                    style: TextStyle(color: Colors.white.withOpacity(0.4), fontSize: 10),
                  ),
                ],
              )
            ],
          ),
          const SizedBox(height: 24),
          // Custom chart drawing area
          SizedBox(
            height: 90,
            width: double.infinity,
            child: CustomPaint(
              painter: ChartLinePainter(),
            ),
          ),
          const SizedBox(height: 8),
          // Chart labels
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) {
              return Text(
                day,
                style: TextStyle(
                  color: Colors.white.withOpacity(0.3),
                  fontSize: 9,
                  fontWeight: FontWeight.bold,
                  fontFamily: 'Inter',
                ),
              );
            }).toList(),
          )
        ],
      ),
    );
  }

  Widget _buildEmptyState(String text) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(vertical: 40),
      decoration: BoxDecoration(
        border: Border.all(color: Colors.white.withOpacity(0.05)),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Center(
        child: Text(
          text,
          style: TextStyle(color: Colors.white.withOpacity(0.4), fontSize: 13),
        ),
      ),
    );
  }
}

// Custom Painter for Weekly Spline Chart
class ChartLinePainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final width = size.width;
    final height = size.height;

    final paintLine = Paint()
      ..color = const Color(0xFF10B981)
      ..strokeWidth = 3.0
      ..strokeCap = StrokeCap.round
      ..style = PaintingStyle.stroke;

    final paintArea = Paint()
      ..style = PaintingStyle.fill
      ..shader = LinearGradient(
        colors: [
          const Color(0xFF10B981).withOpacity(0.3),
          const Color(0xFF10B981).withOpacity(0.0),
        ],
        begin: Alignment.topCenter,
        end: Alignment.bottomCenter,
      ).createShader(Rect.fromLTRB(0, 0, width, height));

    // Data points representing minutes: Mon=10, Tue=25, Wed=17, Thu=50, Fri=33, Sat=70, Sun=55
    // Map values to coordinates
    final points = <Offset>[
      Offset(0, height - (10 / 80) * height),
      Offset(width * 0.16, height - (25 / 80) * height),
      Offset(width * 0.33, height - (17 / 80) * height),
      Offset(width * 0.5, height - (50 / 80) * height),
      Offset(width * 0.66, height - (33 / 80) * height),
      Offset(width * 0.83, height - (70 / 80) * height),
      Offset(width, height - (55 / 80) * height),
    ];

    final path = Path();
    path.moveTo(points[0].dx, points[0].dy);

    for (int i = 0; i < points.length - 1; i++) {
      final p1 = points[i];
      final p2 = points[i + 1];
      final controlPointX = p1.dx + (p2.dx - p1.dx) / 2;
      path.cubicTo(
        controlPointX, p1.dy,
        controlPointX, p2.dy,
        p2.dx, p2.dy,
      );
    }

    // Fill area
    final areaPath = Path.from(path);
    areaPath.lineTo(width, height);
    areaPath.lineTo(0, height);
    areaPath.close();

    canvas.drawPath(areaPath, paintArea);
    canvas.drawPath(path, paintLine);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
