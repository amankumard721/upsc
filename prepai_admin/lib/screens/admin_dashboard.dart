import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/admin_state.dart';
import 'book_manager.dart';
import 'batch_uploader.dart';

class AdminDashboard extends StatelessWidget {
  const AdminDashboard({super.key});

  @override
  Widget build(BuildContext context) {
    final state = Provider.of<AdminState>(context);
    final primaryColor = Theme.of(context).primaryColor;
    
    // Count stats
    final totalBooks = state.books.length;
    final totalChapters = state.chapters.length;

    return Scaffold(
      appBar: AppBar(
        title: const Text('PrepAI Admin Control Center', style: TextStyle(fontFamily: 'Outfit', fontWeight: FontWeight.bold)),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => state.loadBooks(),
          )
        ],
      ),
      body: state.isLoading 
          ? const Center(child: CircularProgressIndicator()) 
          : SingleChildScrollView(
              padding: const EdgeInsets.all(20.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Welcome Card
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [primaryColor.withOpacity(0.15), Colors.indigo.withOpacity(0.1)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: primaryColor.withOpacity(0.2)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Icon(Icons.stars, color: primaryColor, size: 28),
                            const SizedBox(width: 8),
                            const Text(
                              'Developer Admin Mode',
                              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white, fontFamily: 'Outfit'),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        const Text(
                          'Welcome back! Manage the entire syllabus database, upload textbooks, lessons, and compile MCQ practice sets directly to Supabase.',
                          style: TextStyle(color: Colors.white70, fontSize: 13, height: 1.4),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),

                  // Database Stats Grid
                  const Text('Database Metrics', style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, fontFamily: 'Outfit')),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: _buildMetricCard(
                          context,
                          'Active Books',
                          '$totalBooks',
                          Icons.book_rounded,
                          primaryColor,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: _buildMetricCard(
                          context,
                          'Mapped Chapters',
                          '$totalChapters',
                          Icons.menu_book_rounded,
                          Colors.blueAccent,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),

                  // Administrative Modules Grid
                  const Text('Management Modules', style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, fontFamily: 'Outfit')),
                  const SizedBox(height: 12),
                  GridView.count(
                    crossAxisCount: 2,
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    crossAxisSpacing: 16,
                    mainAxisSpacing: 16,
                    childAspectRatio: 1.1,
                    children: [
                      _buildModuleButton(
                        context,
                        'Books Manager',
                        'Manage syllabus books and subjects',
                        Icons.library_books_rounded,
                        primaryColor,
                        onTap: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(builder: (context) => const BookManager()),
                          );
                        },
                      ),
                      _buildModuleButton(
                        context,
                        'Chapters Manager',
                        'Manage units, topics, and contents',
                        Icons.collections_bookmark_rounded,
                        Colors.indigoAccent,
                        onTap: () {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('Select a book from the Library to manage chapters!')),
                          );
                          Navigator.push(
                            context,
                            MaterialPageRoute(builder: (context) => const BookManager()),
                          );
                        },
                      ),
                      _buildModuleButton(
                        context,
                        'Q&A Manager',
                        'Add/edit MCQs & flashcards',
                        Icons.quiz_rounded,
                        Colors.orangeAccent,
                        onTap: () {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('Select a book, then a chapter to manage its Q&A!')),
                          );
                          Navigator.push(
                            context,
                            MaterialPageRoute(builder: (context) => const BookManager()),
                          );
                        },
                      ),
                      _buildModuleButton(
                        context,
                        'Batch Uploader',
                        'Bulk upload JSON/CSV questions',
                        Icons.cloud_upload_rounded,
                        Colors.pinkAccent,
                        onTap: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(builder: (context) => const BatchUploader()),
                          );
                        },
                      ),
                    ],
                  ),
                  const SizedBox(height: 32),
                ],
              ),
            ),
    );
  }

  Widget _buildMetricCard(BuildContext context, String label, String value, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF070B16),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withOpacity(0.05)),
      ),
      child: Row(
        children: [
          CircleAvatar(
            backgroundColor: color.withOpacity(0.1),
            child: Icon(icon, color: color, size: 20),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  value,
                  style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.white),
                ),
                const SizedBox(height: 2),
                Text(
                  label,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(fontSize: 10, color: Colors.white.withOpacity(0.4)),
                ),
              ],
            ),
          )
        ],
      ),
    );
  }

  Widget _buildModuleButton(
    BuildContext context,
    String title,
    String description,
    IconData icon,
    Color color, {
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(20),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: const Color(0xFF070B16),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: color.withOpacity(0.12)),
          boxShadow: [
            BoxShadow(
              color: color.withOpacity(0.02),
              blurRadius: 10,
              offset: const Offset(0, 4),
            )
          ]
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, color: color, size: 32),
            const SizedBox(height: 12),
            Text(
              title,
              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.white),
            ),
            const SizedBox(height: 4),
            Text(
              description,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(fontSize: 9, color: Colors.white.withOpacity(0.35), height: 1.3),
            ),
          ],
        ),
      ),
    );
  }
}
