import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:uuid/uuid.dart';
import '../models/models.dart';
import '../providers/admin_state.dart';

class ChapterManager extends StatelessWidget {
  const ChapterManager({super.key});

  void _showChapterForm(BuildContext context, String bookId, {Chapter? chapter}) {
    final state = Provider.of<AdminState>(context, listen: false);
    final isEdit = chapter != null;

    final numController = TextEditingController(text: chapter?.chapterNumber.toString() ?? '1');
    final titleController = TextEditingController(text: chapter?.title ?? '');
    final descController = TextEditingController(text: chapter?.description ?? '');
    final audioController = TextEditingController(text: chapter?.audioUrl ?? '');
    final durationController = TextEditingController(text: chapter?.durationSeconds.toString() ?? '300');
    final contentController = TextEditingController(text: chapter?.contentText ?? '');
    bool isFree = chapter?.isFree ?? true;

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
                      isEdit ? 'Modify Chapter Details' : 'Add New Chapter to Syllabus',
                      style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white, fontFamily: 'Outfit'),
                    ),
                    const SizedBox(height: 16),

                    Row(
                      children: [
                        // Chapter Number
                        Expanded(
                          flex: 1,
                          child: TextFormField(
                            controller: numController,
                            keyboardType: TextInputType.number,
                            decoration: const InputDecoration(
                              labelText: 'Ch No. *',
                              labelStyle: TextStyle(color: Colors.white60, fontSize: 13),
                              border: OutlineInputBorder(),
                            ),
                            style: const TextStyle(color: Colors.white, fontSize: 14),
                          ),
                        ),
                        const SizedBox(width: 12),
                        // Title
                        Expanded(
                          flex: 3,
                          child: TextFormField(
                            controller: titleController,
                            decoration: const InputDecoration(
                              labelText: 'Chapter Title *',
                              labelStyle: TextStyle(color: Colors.white60, fontSize: 13),
                              border: OutlineInputBorder(),
                            ),
                            style: const TextStyle(color: Colors.white, fontSize: 14),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),

                    // Description
                    TextFormField(
                      controller: descController,
                      maxLines: 2,
                      decoration: const InputDecoration(
                        labelText: 'Brief Description *',
                        labelStyle: TextStyle(color: Colors.white60, fontSize: 13),
                        border: OutlineInputBorder(),
                      ),
                      style: const TextStyle(color: Colors.white, fontSize: 13),
                    ),
                    const SizedBox(height: 12),

                    // Audio URL
                    TextFormField(
                      controller: audioController,
                      decoration: const InputDecoration(
                        labelText: 'Audio URL (.mp3)',
                        labelStyle: TextStyle(color: Colors.white60, fontSize: 13),
                        border: OutlineInputBorder(),
                        hintText: 'https://...',
                      ),
                      style: const TextStyle(color: Colors.white, fontSize: 13),
                    ),
                    const SizedBox(height: 12),

                    Row(
                      children: [
                        // Duration Seconds
                        Expanded(
                          child: TextFormField(
                            controller: durationController,
                            keyboardType: TextInputType.number,
                            decoration: const InputDecoration(
                              labelText: 'Duration (Secs)',
                              labelStyle: TextStyle(color: Colors.white60, fontSize: 13),
                              border: OutlineInputBorder(),
                            ),
                            style: const TextStyle(color: Colors.white, fontSize: 14),
                          ),
                        ),
                        const SizedBox(width: 12),
                        // Is Free
                        Expanded(
                          child: Container(
                            height: 56,
                            padding: const EdgeInsets.symmetric(horizontal: 10),
                            decoration: BoxDecoration(
                              borderRadius: BorderRadius.circular(4),
                              border: Border.all(color: Colors.white30),
                            ),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                const Text('Free Access', style: TextStyle(color: Colors.white60, fontSize: 12)),
                                Switch(
                                  value: isFree,
                                  activeColor: Theme.of(context).primaryColor,
                                  onChanged: (val) {
                                    setModalState(() {
                                      isFree = val;
                                    });
                                  },
                                ),
                              ],
                            ),
                          ),
                        )
                      ],
                    ),
                    const SizedBox(height: 12),

                    // Content text
                    TextFormField(
                      controller: contentController,
                      maxLines: 5,
                      decoration: const InputDecoration(
                        labelText: 'Lesson / Study Notes Content',
                        labelStyle: TextStyle(color: Colors.white60, fontSize: 13),
                        border: OutlineInputBorder(),
                        alignLabelWithHint: true,
                        hintText: 'Paste NCERT text or study contents...',
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
                          if (titleController.text.trim().isEmpty || descController.text.trim().isEmpty) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(content: Text('Please fill out required fields.')),
                            );
                            return;
                          }

                          final chNum = int.tryParse(numController.text.trim()) ?? 1;
                          final duration = int.tryParse(durationController.text.trim()) ?? 300;

                          if (isEdit) {
                            final updated = chapter.copyWith(
                              chapterNumber: chNum,
                              title: titleController.text.trim(),
                              description: descController.text.trim(),
                              audioUrl: audioController.text.trim(),
                              durationSeconds: duration,
                              isFree: isFree,
                              contentText: contentController.text.trim(),
                            );
                            state.updateChapter(updated);
                          } else {
                            final newChapter = Chapter(
                              id: const Uuid().v4(),
                              bookId: bookId,
                              chapterNumber: chNum,
                              title: titleController.text.trim(),
                              description: descController.text.trim(),
                              audioUrl: audioController.text.trim(),
                              durationSeconds: duration,
                              isFree: isFree,
                              contentText: contentController.text.trim(),
                            );
                            state.createChapter(newChapter);
                          }

                          Navigator.pop(context);
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Theme.of(context).primaryColor,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                        child: Text(
                          isEdit ? 'Update Chapter' : 'Add Chapter',
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

    return Scaffold(
      appBar: AppBar(
        title: const Text('Chapters Manager', style: TextStyle(fontFamily: 'Outfit', fontWeight: FontWeight.bold)),
      ),
      floatingActionButton: selectedBook == null
          ? null
          : FloatingActionButton(
              onPressed: () => _showChapterForm(context, selectedBook.id),
              backgroundColor: accentColor,
              child: const Icon(Icons.add, color: Color(0xFF0B1325)),
            ),
      body: state.books.isEmpty
          ? Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.library_books_rounded, size: 48, color: Colors.white.withOpacity(0.2)),
                  const SizedBox(height: 12),
                  const Text('Create a book first to add chapters', style: TextStyle(color: Colors.white30)),
                ],
              ),
            )
          : Column(
              children: [
                // Book Selector Header
                Container(
                  padding: const EdgeInsets.all(16),
                  color: const Color(0xFF070B16),
                  child: DropdownButtonFormField<String>(
                    value: selectedBook?.id,
                    dropdownColor: const Color(0xFF070B16),
                    decoration: const InputDecoration(
                      labelText: 'Select Syllabus Book',
                      labelStyle: TextStyle(color: Colors.white38, fontSize: 11),
                      border: OutlineInputBorder(),
                      contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    ),
                    items: state.books.map((book) {
                      return DropdownMenuItem(
                        value: book.id,
                        child: Text(
                          book.title,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold),
                        ),
                      );
                    }).toList(),
                    onChanged: (id) {
                      if (id != null) {
                        state.selectBook(id);
                      }
                    },
                  ),
                ),
                const Divider(height: 1, color: Colors.white10),

                // Chapters List
                Expanded(
                  child: state.isLoading
                      ? const Center(child: CircularProgressIndicator())
                      : state.chapters.isEmpty
                          ? Center(
                              child: Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Icon(Icons.collections_bookmark_rounded, size: 48, color: Colors.white.withOpacity(0.15)),
                                  const SizedBox(height: 12),
                                  const Text('No chapters added for this book', style: TextStyle(color: Colors.white24, fontSize: 12)),
                                ],
                              ),
                            )
                          : ListView.builder(
                              padding: const EdgeInsets.all(16),
                              itemCount: state.chapters.length,
                              itemBuilder: (context, idx) {
                                final ch = state.chapters[idx];
                                return Container(
                                  margin: const EdgeInsets.only(bottom: 12),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFF070B16),
                                    borderRadius: BorderRadius.circular(16),
                                    border: Border.all(color: Colors.white.withOpacity(0.04)),
                                  ),
                                  child: ListTile(
                                    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                                    leading: CircleAvatar(
                                      backgroundColor: accentColor.withOpacity(0.1),
                                      child: Text(
                                        '${ch.chapterNumber}',
                                        style: TextStyle(color: accentColor, fontWeight: FontWeight.bold, fontSize: 13),
                                      ),
                                    ),
                                    title: Text(
                                      ch.title,
                                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.white),
                                    ),
                                    subtitle: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        const SizedBox(height: 4),
                                        Text(
                                          ch.description,
                                          maxLines: 2,
                                          overflow: TextOverflow.ellipsis,
                                          style: TextStyle(fontSize: 11, color: Colors.white.withOpacity(0.4)),
                                        ),
                                        const SizedBox(height: 6),
                                        Row(
                                          children: [
                                            if (ch.audioUrl.isNotEmpty) ...[
                                              Icon(Icons.audiotrack, size: 12, color: accentColor),
                                              const SizedBox(width: 4),
                                              Text('Audio', style: TextStyle(fontSize: 9, color: accentColor)),
                                              const SizedBox(width: 12),
                                            ],
                                            Container(
                                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1.5),
                                              decoration: BoxDecoration(
                                                color: ch.isFree ? Colors.green.withOpacity(0.1) : Colors.amber.withOpacity(0.1),
                                                borderRadius: BorderRadius.circular(6),
                                              ),
                                              child: Text(
                                                ch.isFree ? 'FREE' : 'PREMIUM',
                                                style: TextStyle(
                                                  color: ch.isFree ? Colors.greenAccent : Colors.amberAccent,
                                                  fontSize: 8,
                                                  fontWeight: FontWeight.bold,
                                                ),
                                              ),
                                            )
                                          ],
                                        )
                                      ],
                                    ),
                                    trailing: Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        IconButton(
                                          icon: const Icon(Icons.edit_rounded, color: Colors.white54, size: 18),
                                          onPressed: () => _showChapterForm(context, selectedBook!.id, chapter: ch),
                                        ),
                                        IconButton(
                                          icon: const Icon(Icons.delete_outline_rounded, color: Colors.redAccent, size: 18),
                                          onPressed: () {
                                            showDialog(
                                              context: context,
                                              builder: (context) => AlertDialog(
                                                backgroundColor: const Color(0xFF070B16),
                                                title: const Text('Delete Chapter?'),
                                                content: Text('Are you sure you want to delete chapter ${ch.chapterNumber}: "${ch.title}"?'),
                                                actions: [
                                                  TextButton(
                                                    onPressed: () => Navigator.pop(context),
                                                    child: const Text('Cancel', style: TextStyle(color: Colors.white30)),
                                                  ),
                                                  TextButton(
                                                    onPressed: () {
                                                      state.deleteChapter(ch.id);
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
                ),
              ],
            ),
    );
  }
}
