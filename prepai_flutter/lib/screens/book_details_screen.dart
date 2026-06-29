import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/app_state.dart';
import '../models/models.dart';
import 'lesson_screen.dart';
import 'profile_screen.dart';

class BookDetailsScreen extends StatefulWidget {
  final String bookId;
  const BookDetailsScreen({super.key, required this.bookId});

  @override
  State<BookDetailsScreen> createState() => _BookDetailsScreenState();
}

class _BookDetailsScreenState extends State<BookDetailsScreen> {
  String _searchQuery = '';
  String _statusFilter = 'All'; // 'All', 'Completed', 'Incomplete'
  final TextEditingController _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    // Load chapters for this book
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<AppState>(context, listen: false).selectBook(widget.bookId);
    });
  }

  @override
  Widget build(BuildContext StateContext) {
    final state = Provider.of<AppState>(StateContext);
    final goldColor = const Color(0xFF10B981);

    final selectedBook = state.books.firstWhere(
      (b) => b.id == widget.bookId,
      orElse: () => Book(id: '', title: 'Loading...', author: '', coverImage: '', subject: '', isActive: false),
    );

    // Filters
    final filteredChapters = state.chapters.where((ch) {
      final matchesSearch = ch.title.toLowerCase().contains(_searchQuery.toLowerCase()) ||
          ch.description.toLowerCase().contains(_searchQuery.toLowerCase());
      
      final isCompleted = state.progressList.any((p) => p.chapterId == ch.id && p.isCompleted);
      
      bool matchesStatus = true;
      if (_statusFilter == 'Completed') {
        matchesStatus = isCompleted;
      } else if (_statusFilter == 'Incomplete') {
        matchesStatus = !isCompleted;
      }

      return matchesSearch && matchesStatus;
    }).toList();

    return Scaffold(
      backgroundColor: const Color(0xFF0B1325),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.white),
          onPressed: () => Navigator.pop(StateContext),
        ),
        title: Text(selectedBook.title, style: const TextStyle(color: Colors.white, fontSize: 16, fontFamily: 'Outfit')),
      ),
      body: SafeArea(
        child: Column(
          children: [
            // 1. Compact Book Details Header Card
            _buildBookHeaderCard(selectedBook, state, goldColor),
            
            // 2. Search & Filter Bar
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 12.0),
              child: Column(
                children: [
                  Row(
                    children: [
                      // Search input
                      Expanded(
                        child: Container(
                          decoration: BoxDecoration(
                            color: const Color(0xFF070B16),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: Colors.white.withOpacity(0.08)),
                          ),
                          child: TextField(
                            controller: _searchController,
                            style: const TextStyle(color: Colors.white, fontSize: 13),
                            onChanged: (val) {
                              setState(() {
                                _searchQuery = val;
                              });
                            },
                            decoration: InputDecoration(
                              hintText: 'Search chapters...',
                              hintStyle: TextStyle(color: Colors.white.withOpacity(0.2), fontSize: 13),
                              prefixIcon: Icon(Icons.search, color: Colors.white.withOpacity(0.3), size: 18),
                              border: InputBorder.none,
                              contentPadding: const EdgeInsets.symmetric(vertical: 12),
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  // Status chips
                  Row(
                    children: ['All', 'Completed', 'Incomplete'].map((filter) {
                      final isSelected = _statusFilter == filter;
                      return Container(
                        margin: const EdgeInsets.only(right: 8),
                        child: ChoiceChip(
                          label: Text(filter),
                          selected: isSelected,
                          onSelected: (selected) {
                            setState(() {
                              _statusFilter = filter;
                            });
                          },
                          selectedColor: goldColor,
                          backgroundColor: Colors.white.withOpacity(0.02),
                          labelStyle: TextStyle(
                            color: isSelected ? const Color(0xFF0B1325) : Colors.white.withOpacity(0.6),
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                          ),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(10),
                            side: BorderSide(
                              color: isSelected ? goldColor : Colors.white.withOpacity(0.06),
                            ),
                          ),
                        ),
                      );
                    }).toList(),
                  )
                ],
              ),
            ),

            // 3. Chapters List
            Expanded(
              child: state.loading 
                  ? const Center(child: CircularProgressIndicator(color: Color(0xFF10B981)))
                  : filteredChapters.isEmpty
                      ? const Center(
                          child: Text(
                            'No chapters match your criteria.',
                            style: TextStyle(color: Colors.white30, fontSize: 13),
                          ),
                        )
                      : ListView.separated(
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                          itemCount: filteredChapters.length,
                          separatorBuilder: (_, __) => const SizedBox(height: 12),
                          itemBuilder: (context, index) {
                            final chapter = filteredChapters[index];
                            return _buildChapterListItem(chapter, state, goldColor);
                          },
                        ),
            )
          ],
        ),
      ),
    );
  }

  Widget _buildBookHeaderCard(Book book, AppState state, Color goldColor) {
    final doneChaptersCount = state.progressList.where((p) => p.isCompleted).length;
    
    return Container(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.02),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.white.withOpacity(0.06)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Cover Image
          ClipRRect(
            borderRadius: BorderRadius.circular(12),
            child: SizedBox(
              width: 80,
              height: 110,
              child: Image.network(
                book.coverImage,
                fit: BoxFit.cover,
                errorBuilder: (context, error, stackTrace) => Container(
                  color: Colors.grey.shade900,
                  child: const Icon(Icons.book, color: Colors.white24),
                ),
              ),
            ),
          ),
          const SizedBox(width: 16),
          // Book description info
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                  decoration: BoxDecoration(
                    color: goldColor.withOpacity(0.12),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: goldColor.withOpacity(0.2)),
                  ),
                  child: Text(
                    book.subject,
                    style: TextStyle(color: goldColor, fontSize: 8, fontWeight: FontWeight.bold),
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  book.title,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    fontFamily: 'Outfit',
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  'By ${book.author}',
                  style: TextStyle(
                    color: Colors.white.withOpacity(0.4),
                    fontSize: 11,
                  ),
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Icon(Icons.collections_bookmark_rounded, color: Colors.white.withOpacity(0.3), size: 12),
                    const SizedBox(width: 4),
                    Text(
                      '${state.chapters.length} Chapters',
                      style: TextStyle(color: Colors.white.withOpacity(0.5), fontSize: 10, fontFamily: 'Inter'),
                    ),
                    const SizedBox(width: 16),
                    Icon(Icons.check_circle, color: Colors.greenAccent, size: 12),
                    const SizedBox(width: 4),
                    Text(
                      '$doneChaptersCount Done',
                      style: TextStyle(color: Colors.white.withOpacity(0.5), fontSize: 10, fontFamily: 'Inter'),
                    ),
                  ],
                )
              ],
            ),
          )
        ],
      ),
    );
  }

  Widget _buildChapterListItem(Chapter chapter, AppState state, Color goldColor) {
    final isCompleted = state.progressList.any((p) => p.chapterId == chapter.id && p.isCompleted);
    final hasAccess = chapter.isFree || (state.profile?.isPremium ?? false);
    
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.01),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withOpacity(0.05)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Chapter counter badge
              Container(
                width: 32,
                height: 32,
                decoration: BoxDecoration(
                  color: goldColor.withOpacity(0.08),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: goldColor.withOpacity(0.2)),
                ),
                child: Center(
                  child: Text(
                    '${chapter.chapterNumber}',
                    style: TextStyle(color: goldColor, fontSize: 12, fontWeight: FontWeight.bold),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              
              // Title & Description
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            chapter.title,
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 14,
                              fontWeight: FontWeight.bold,
                              fontFamily: 'Outfit',
                            ),
                          ),
                        ),
                        if (isCompleted) ...[
                          const SizedBox(width: 6),
                          const Icon(Icons.check_circle_rounded, color: Colors.greenAccent, size: 14),
                        ]
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      chapter.description,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        color: Colors.white.withOpacity(0.4),
                        fontSize: 11,
                        height: 1.3,
                      ),
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Icon(Icons.headset, color: Colors.white.withOpacity(0.2), size: 12),
                        const SizedBox(width: 4),
                        Text(
                          '${chapter.durationSeconds ~/ 60} mins play',
                          style: TextStyle(color: Colors.white.withOpacity(0.3), fontSize: 9, fontFamily: 'Inter'),
                        ),
                        const SizedBox(width: 12),
                        // Access badge
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1.5),
                          decoration: BoxDecoration(
                            color: chapter.isFree ? Colors.green.withOpacity(0.08) : Colors.indigo.withOpacity(0.08),
                            borderRadius: BorderRadius.circular(6),
                            border: Border.all(color: chapter.isFree ? Colors.green.withOpacity(0.2) : Colors.indigo.withOpacity(0.2)),
                          ),
                          child: Text(
                            chapter.isFree ? 'FREE' : 'PREMIUM',
                            style: TextStyle(
                              color: chapter.isFree ? Colors.greenAccent : Colors.indigoAccent,
                              fontSize: 7,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        )
                      ],
                    )
                  ],
                ),
              )
            ],
          ),
          const SizedBox(height: 16),
          // Action button
          Row(
            mainAxisAlignment: MainAxisAlignment.end,
            children: [
              if (hasAccess)
                ElevatedButton.icon(
                  onPressed: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) => LessonScreen(chapterId: chapter.id),
                      ),
                    );
                  },
                  icon: Icon(Icons.play_circle_fill, size: 14, color: const Color(0xFF0B1325)),
                  label: const Text('Start Lesson'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: goldColor,
                    foregroundColor: const Color(0xFF0B1325),
                    elevation: 0,
                    textStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 11),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                )
              else
                OutlinedButton.icon(
                  onPressed: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) => const ProfileScreen(),
                      ),
                    );
                  },
                  icon: const Icon(Icons.lock, size: 12, color: Colors.indigoAccent),
                  label: const Text('Unlock Gold'),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: Colors.white.withOpacity(0.8),
                    side: BorderSide(color: Colors.indigo.withOpacity(0.4)),
                    textStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 11),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                ),
            ],
          )
        ],
      ),
    );
  }
}
