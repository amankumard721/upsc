import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:uuid/uuid.dart';
import '../models/models.dart';
import '../providers/admin_state.dart';
import 'book_lessons_screen.dart';

class BookManager extends StatelessWidget {
  const BookManager({super.key});

  void _showBookForm(BuildContext context, {Book? book}) {
    final state = Provider.of<AdminState>(context, listen: false);
    final isEdit = book != null;

    final titleController = TextEditingController(text: book?.title ?? '');
    final authorController = TextEditingController(text: book?.author ?? '');
    final coverController = TextEditingController(text: book?.coverImage ?? '');
    final chaptersController = TextEditingController(text: book?.totalChapters.toString() ?? '1');
    String selectedSubject = book?.subject ?? 'History';

    final subjectsList = ['History', 'Polity', 'Geography', 'Economy', 'Science', 'All'];

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
                    isEdit ? 'Modify Syllabus Book' : 'Add New Syllabus Book',
                    style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white, fontFamily: 'Outfit'),
                  ),
                  const SizedBox(height: 16),
                  
                  // Title
                  TextFormField(
                    controller: titleController,
                    decoration: const InputDecoration(
                      labelText: 'Book Title *',
                      labelStyle: TextStyle(color: Colors.white60, fontSize: 13),
                      border: OutlineInputBorder(),
                    ),
                    style: const TextStyle(color: Colors.white, fontSize: 14),
                  ),
                  const SizedBox(height: 12),
                  
                  // Author
                  TextFormField(
                    controller: authorController,
                    decoration: const InputDecoration(
                      labelText: 'Author Name *',
                      labelStyle: TextStyle(color: Colors.white60, fontSize: 13),
                      border: OutlineInputBorder(),
                    ),
                    style: const TextStyle(color: Colors.white, fontSize: 14),
                  ),
                  const SizedBox(height: 12),

                  Row(
                    children: [
                      // Subject
                      Expanded(
                        child: DropdownButtonFormField<String>(
                          value: selectedSubject,
                          decoration: const InputDecoration(
                            labelText: 'Subject Category',
                            labelStyle: TextStyle(color: Colors.white60, fontSize: 13),
                            border: OutlineInputBorder(),
                          ),
                          dropdownColor: const Color(0xFF070B16),
                          items: subjectsList.map((sub) {
                            return DropdownMenuItem(value: sub, child: Text(sub, style: const TextStyle(color: Colors.white, fontSize: 13)));
                          }).toList(),
                          onChanged: (val) {
                            if (val != null) {
                              setModalState(() {
                                selectedSubject = val;
                              });
                            }
                          },
                        ),
                      ),
                      const SizedBox(width: 12),
                      // Chapters count
                      Expanded(
                        child: TextFormField(
                          controller: chaptersController,
                          keyboardType: TextInputType.number,
                          decoration: const InputDecoration(
                            labelText: 'Total Chapters',
                            labelStyle: TextStyle(color: Colors.white60, fontSize: 13),
                            border: OutlineInputBorder(),
                          ),
                          style: const TextStyle(color: Colors.white, fontSize: 14),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),

                  // Cover image URL
                  TextFormField(
                    controller: coverController,
                    decoration: const InputDecoration(
                      labelText: 'Cover Image URL (Optional)',
                      labelStyle: TextStyle(color: Colors.white60, fontSize: 13),
                      border: OutlineInputBorder(),
                      hintText: 'https://...',
                    ),
                    style: const TextStyle(color: Colors.white, fontSize: 13),
                  ),
                  const SizedBox(height: 20),

                  // Save Button
                  SizedBox(
                    width: double.infinity,
                    height: 50,
                    child: ElevatedButton(
                      onPressed: () {
                        if (titleController.text.trim().isEmpty || authorController.text.trim().isEmpty) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('Please fill out required fields.')),
                          );
                          return;
                        }

                        final numChapters = int.tryParse(chaptersController.text.trim()) ?? 1;

                        if (isEdit) {
                          final updated = book.copyWith(
                            title: titleController.text.trim(),
                            author: authorController.text.trim(),
                            subject: selectedSubject,
                            coverImage: coverController.text.trim().isNotEmpty
                                ? coverController.text.trim()
                                : book.coverImage,
                            totalChapters: numChapters,
                          );
                          state.updateBook(updated);
                        } else {
                          final newBook = Book(
                            id: const Uuid().v4(),
                            title: titleController.text.trim(),
                            author: authorController.text.trim(),
                            subject: selectedSubject,
                            coverImage: coverController.text.trim().isNotEmpty 
                                ? coverController.text.trim() 
                                : 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400',
                            isActive: true,
                            totalChapters: numChapters,
                          );
                          state.createBook(newBook);
                        }

                        Navigator.pop(context);
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Theme.of(context).primaryColor,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      child: Text(
                        isEdit ? 'Update Details' : 'Publish Book',
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
        title: const Text('Books Manager', style: TextStyle(fontFamily: 'Outfit', fontWeight: FontWeight.bold)),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => _showBookForm(context),
        backgroundColor: accentColor,
        child: const Icon(Icons.add, color: Color(0xFF0B1325)),
      ),
      body: state.isLoading 
          ? const Center(child: CircularProgressIndicator()) 
          : state.books.isEmpty 
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.library_books_rounded, size: 48, color: Colors.white.withOpacity(0.2)),
                      const SizedBox(height: 12),
                      const Text('No books registered yet', style: TextStyle(color: Colors.white30)),
                    ],
                  ),
                )
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: state.books.length,
                  itemBuilder: (context, idx) {
                    final book = state.books[idx];
                    return Container(
                      margin: const EdgeInsets.only(bottom: 12),
                      decoration: BoxDecoration(
                        color: const Color(0xFF070B16),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: Colors.white.withOpacity(0.04)),
                      ),
                      child: ListTile(
                        onTap: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (context) => BookLessonsScreen(book: book),
                            ),
                          );
                        },
                        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                        leading: ClipRRect(
                          borderRadius: BorderRadius.circular(8),
                          child: book.coverImage.startsWith('http')
                              ? Image.network(
                                  book.coverImage,
                                  width: 48,
                                  height: 64,
                                  fit: BoxFit.cover,
                                  errorBuilder: (_, __, ___) => Container(
                                    width: 48,
                                    height: 64,
                                    color: Colors.white.withOpacity(0.05),
                                    child: Icon(Icons.book, color: accentColor, size: 20),
                                  ),
                                )
                              : Container(
                                  width: 48,
                                  height: 64,
                                  color: Colors.white.withOpacity(0.05),
                                  child: Icon(Icons.book, color: accentColor, size: 20),
                                ),
                        ),
                        title: Text(
                          book.title,
                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: Colors.white),
                        ),
                        subtitle: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const SizedBox(height: 4),
                            Text('By ${book.author}', style: TextStyle(fontSize: 11, color: Colors.white.withOpacity(0.5))),
                            const SizedBox(height: 6),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                              decoration: BoxDecoration(
                                color: accentColor.withOpacity(0.08),
                                borderRadius: BorderRadius.circular(10),
                              ),
                              child: Text(
                                book.subject,
                                style: TextStyle(color: accentColor, fontSize: 9, fontWeight: FontWeight.bold),
                              ),
                            )
                          ],
                        ),
                        trailing: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            IconButton(
                              icon: const Icon(Icons.edit_rounded, color: Colors.white54, size: 18),
                              onPressed: () => _showBookForm(context, book: book),
                            ),
                            IconButton(
                              icon: const Icon(Icons.delete_outline_rounded, color: Colors.redAccent, size: 18),
                              onPressed: () {
                                showDialog(
                                  context: context,
                                  builder: (context) => AlertDialog(
                                    backgroundColor: const Color(0xFF070B16),
                                    title: const Text('Delete Book?'),
                                    content: Text('Are you sure you want to delete "${book.title}"? This action cannot be undone.'),
                                    actions: [
                                      TextButton(
                                        onPressed: () => Navigator.pop(context),
                                        child: const Text('Cancel', style: TextStyle(color: Colors.white30)),
                                      ),
                                      TextButton(
                                        onPressed: () {
                                          state.deleteBook(book.id);
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
                        ),
                      ),
                    );
                  },
                ),
    );
  }
}
