import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:uuid/uuid.dart';
import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:file_picker/file_picker.dart';
import 'package:record/record.dart';
import 'package:path_provider/path_provider.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:just_audio/just_audio.dart';
import 'package:http/http.dart' as http;
import 'package:crypto/crypto.dart';
import '../models/models.dart';
import '../providers/admin_state.dart';
import 'data_manager.dart';

class BookLessonsScreen extends StatefulWidget {
  final Book book;
  const BookLessonsScreen({super.key, required this.book});

  @override
  State<BookLessonsScreen> createState() => _BookLessonsScreenState();
}

class _BookLessonsScreenState extends State<BookLessonsScreen> {
  // Global AudioPlayer instance for playing uploaded audios in the admin app
  final AudioPlayer _audioPlayer = AudioPlayer();
  String? _playingChapterId;
  bool _isPlaying = false;
  StreamSubscription? _playerStateSub;

  @override
  void initState() {
    super.initState();
    Future.microtask(() {
      Provider.of<AdminState>(context, listen: false).loadChapters(widget.book.id);
    });

    // Listen to player state streams
    _playerStateSub = _audioPlayer.playerStateStream.listen((state) {
      if (mounted) {
        setState(() {
          _isPlaying = state.playing;
          if (state.processingState == ProcessingState.completed) {
            _playingChapterId = null;
            _isPlaying = false;
          }
        });
      }
    });
  }

  @override
  void dispose() {
    _playerStateSub?.cancel();
    _audioPlayer.dispose();
    super.dispose();
  }

  // Upload file helper to Cloudflare R2 directly from Flutter using AWS SigV4
  Future<String> _uploadToR2(File file, String folderName, String filename) async {
    final accessKey = "f1f229805186d8a98e05beff34164638";
    final secretKey = "e8d24cb0a633a2ffd2c20f86a9db212999419dbc6cd637038bfe328aeec86f90";
    final endpoint = "6743ea22b860660512156b0dbe7638d7.r2.cloudflarestorage.com";
    final bucketName = "audiopodcast";
    
    final path = "/$bucketName/$folderName/$filename";
    final requestUri = Uri.parse("https://$endpoint$path");

    final bytes = await file.readAsBytes();
    final payloadHash = sha256.convert(bytes).toString();

    final now = DateTime.now().toUtc();
    final amzDate = now.toIso8601String().replaceAll('-', '').replaceAll(':', '').split('.').first + 'Z';
    final dateStamp = amzDate.substring(0, 8);

    final headers = {
      'host': endpoint,
      'x-amz-content-sha256': payloadHash,
      'x-amz-date': amzDate,
    };

    final signer = R2Signer(accessKey: accessKey, secretKey: secretKey, endpoint: endpoint);
    final signature = signer.getSignature(
      method: 'PUT',
      path: path,
      amzDate: amzDate,
      dateStamp: dateStamp,
      payloadHash: payloadHash,
      headers: headers,
    );

    final credentialScope = '$dateStamp/auto/s3/aws4_request';
    final authHeader = 'AWS4-HMAC-SHA256 Credential=$accessKey/$credentialScope, SignedHeaders=host;x-amz-content-sha256;x-amz-date, Signature=$signature';

    final response = await http.put(
      requestUri,
      headers: {
        'host': endpoint,
        'x-amz-content-sha256': payloadHash,
        'x-amz-date': amzDate,
        'Authorization': authHeader,
        'Content-Type': filename.endsWith('.m4a') ? 'audio/x-m4a' : 'audio/mpeg',
      },
      body: bytes,
    );

    if (response.statusCode == 200 || response.statusCode == 201) {
      final publicBaseUrl = 'https://pub-00ab21363ea74b46a5d0555ad4f47b47.r2.dev';
      return '$publicBaseUrl/$folderName/$filename';
    } else {
      throw Exception('R2 upload failed with status code ${response.statusCode}: ${response.body}');
    }
  }

  void _toggleChapterAudio(Chapter ch) async {
    if (_playingChapterId == ch.id) {
      if (_isPlaying) {
        await _audioPlayer.pause();
      } else {
        await _audioPlayer.play();
      }
    } else {
      await _audioPlayer.stop();
      
      if (ch.audioUrl.isEmpty) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('No audio URL found for this lesson.')),
        );
        return;
      }

      setState(() {
        _playingChapterId = ch.id;
        _isPlaying = true;
      });

      try {
        if (ch.audioUrl.startsWith('[')) {
          final List<dynamic> parsed = json.decode(ch.audioUrl);
          final urls = parsed.map((e) => e.toString()).toList();
          final playlist = ConcatenatingAudioSource(
            children: urls.map((url) => AudioSource.uri(Uri.parse(url))).toList(),
          );
          await _audioPlayer.setAudioSource(playlist);
        } else {
          await _audioPlayer.setUrl(ch.audioUrl);
        }
        await _audioPlayer.play();
      } catch (e) {
        print('Admin audio play error: $e');
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error playing audio: $e')),
        );
        setState(() {
          _playingChapterId = null;
          _isPlaying = false;
        });
      }
    }
  }

  void _showChapterForm(BuildContext context, {Chapter? chapter}) {
    final state = Provider.of<AdminState>(context, listen: false);
    final isEdit = chapter != null;

    final numController = TextEditingController(text: chapter?.chapterNumber.toString() ?? '1');
    final titleController = TextEditingController(text: chapter?.title ?? '');
    final descController = TextEditingController(text: chapter?.description ?? '');
    final contentController = TextEditingController(text: chapter?.contentText ?? '');
    bool isFree = chapter?.isFree ?? true;

    // Real AudioRecorder instance
    final AudioRecorder audioRecorder = AudioRecorder();

    // Parsing initial audio playlist
    List<Map<String, dynamic>> audioClips = [];
    if (chapter != null && chapter.audioUrl.isNotEmpty) {
      if (chapter.audioUrl.startsWith('[')) {
        try {
          final List<dynamic> parsed = json.decode(chapter.audioUrl);
          audioClips = parsed.map((url) {
            final urlStr = url.toString();
            final name = urlStr.split('/').last;
            return {
              'type': urlStr.contains('rec_') ? 'record' : 'upload',
              'url': urlStr,
              'duration': 60, // default placeholder clip duration
              'name': name,
            };
          }).toList();
        } catch (_) {
          audioClips = [
            {
              'type': 'upload',
              'url': chapter.audioUrl,
              'duration': chapter.durationSeconds,
              'name': 'Audio Lesson Link',
            }
          ];
        }
      } else {
        audioClips = [
          {
            'type': 'upload',
            'url': chapter.audioUrl,
            'duration': chapter.durationSeconds,
            'name': 'Audio Lesson Link',
          }
        ];
      }
    }

    // Recorder State
    String recordingState = 'idle'; // idle, recording, paused, finished
    int recordingSeconds = 0;
    Timer? recordingTimer;
    List<double> waveformHeights = List.generate(20, (_) => 4.0);
    Timer? waveformTimer;

    // File Uploader State
    bool isUploading = false;
    String? selectedFileName;

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
            
            String formatTime(int seconds) {
              final m = (seconds ~/ 60).toString().padLeft(2, '0');
              final s = (seconds % 60).toString().padLeft(2, '0');
              return '$m:$s';
            }

            // Recorder controls (Real Microphone upload to Cloudflare R2)
            void startRecording() async {
              try {
                if (await audioRecorder.hasPermission()) {
                  final tempDir = await getTemporaryDirectory();
                  final path = '${tempDir.path}/temp_record_${DateTime.now().millisecondsSinceEpoch}.m4a';
                  
                  await audioRecorder.start(
                    const RecordConfig(encoder: AudioEncoder.aacLc),
                    path: path,
                  );

                  setModalState(() {
                    recordingState = 'recording';
                    recordingSeconds = 0;
                  });

                  recordingTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
                    setModalState(() {
                      recordingSeconds++;
                    });
                  });

                  waveformTimer = Timer.periodic(const Duration(milliseconds: 150), (timer) {
                    setModalState(() {
                      waveformHeights = List.generate(20, (_) => 4.0 + (32.0 * (0.2 + (0.8 * (DateTime.now().millisecond % 5) / 5))));
                    });
                  });
                } else {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Microphone permission is required to record.')),
                  );
                }
              } catch (e) {
                print('Record start error: $e');
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text('Recording error: $e')),
                );
              }
            }

            void pauseRecording() async {
              await audioRecorder.pause();
              recordingTimer?.cancel();
              waveformTimer?.cancel();
              setModalState(() {
                recordingState = 'paused';
              });
            }

            void resumeRecording() async {
              await audioRecorder.resume();
              setModalState(() {
                recordingState = 'recording';
              });
              recordingTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
                setModalState(() {
                  recordingSeconds++;
                });
              });
              waveformTimer = Timer.periodic(const Duration(milliseconds: 150), (timer) {
                setModalState(() {
                  waveformHeights = List.generate(20, (_) => 4.0 + (32.0 * (0.2 + (0.8 * (DateTime.now().millisecond % 5) / 5))));
                });
              });
            }

            void stopRecording() async {
              recordingTimer?.cancel();
              waveformTimer?.cancel();
              
              final path = await audioRecorder.stop();
              if (path == null) {
                setModalState(() {
                  recordingState = 'idle';
                });
                return;
              }

              final recordedFile = File(path);
              final timestamp = DateTime.now().millisecondsSinceEpoch;
              final cleanBookTitle = widget.book.title.replaceAll(RegExp(r'[^a-zA-Z0-9]'), '-').toLowerCase();
              final chNum = numController.text.trim();
              
              final folderName = 'books/$cleanBookTitle/chapter_$chNum';
              final filename = 'rec_$timestamp.m4a';

              // Show uploading state
              setModalState(() {
                isUploading = true;
                selectedFileName = filename;
              });

              try {
                // Upload directly to Cloudflare R2 via Next.js API
                final publicUrl = await _uploadToR2(recordedFile, folderName, filename);

                setModalState(() {
                  audioClips.add({
                    'type': 'record',
                    'url': publicUrl,
                    'duration': recordingSeconds == 0 ? 5 : recordingSeconds,
                    'name': filename,
                  });
                  isUploading = false;
                  recordingState = 'idle';
                  recordingSeconds = 0;
                });
              } catch (e) {
                print('R2 upload record error: $e');
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text('Cloudflare R2 Upload Error: $e')),
                );
                setModalState(() {
                  isUploading = false;
                  recordingState = 'idle';
                  recordingSeconds = 0;
                });
              }
            }

            // File Uploader (Real file pick and Cloudflare R2 upload)
            void pickAndUploadFile() async {
              try {
                FilePickerResult? result = await FilePicker.platform.pickFiles(type: FileType.audio);
                if (result == null || result.files.single.path == null) return;

                final pickedFile = File(result.files.single.path!);
                final filename = result.files.single.name;

                setModalState(() {
                  isUploading = true;
                  selectedFileName = filename;
                });

                final cleanBookTitle = widget.book.title.replaceAll(RegExp(r'[^a-zA-Z0-9]'), '-').toLowerCase();
                final chNum = numController.text.trim();
                final folderName = 'books/$cleanBookTitle/chapter_$chNum';

                // Upload directly to Cloudflare R2 via Next.js API
                final publicUrl = await _uploadToR2(pickedFile, folderName, filename);

                setModalState(() {
                  audioClips.add({
                    'type': 'upload',
                    'url': publicUrl,
                    'duration': 180, // Default 3 minutes
                    'name': filename,
                  });
                  isUploading = false;
                });
              } catch (e) {
                print('R2 upload file error: $e');
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text('Cloudflare R2 Upload Error: $e')),
                );
                setModalState(() {
                  isUploading = false;
                });
              }
            }

            return Container(
              height: MediaQuery.of(context).size.height * 0.85,
              padding: EdgeInsets.only(
                bottom: MediaQuery.of(context).viewInsets.bottom + 24,
                top: 24,
                left: 20,
                right: 20,
              ),
              child: SingleChildScrollView(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          isEdit ? 'Edit Lesson' : 'Add New Lesson',
                          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white, fontFamily: 'Outfit'),
                        ),
                        IconButton(
                          icon: const Icon(Icons.close, color: Colors.white60),
                          onPressed: () {
                            recordingTimer?.cancel();
                            waveformTimer?.cancel();
                            audioRecorder.dispose();
                            Navigator.pop(context);
                          },
                        )
                      ],
                    ),
                    const Divider(color: Colors.white10, height: 20),

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
                        labelText: 'Lesson Subtitle / Description *',
                        labelStyle: TextStyle(color: Colors.white60, fontSize: 13),
                        border: OutlineInputBorder(),
                      ),
                      style: const TextStyle(color: Colors.white, fontSize: 13),
                    ),
                    const SizedBox(height: 16),

                    // ── PLAYLIST EDITOR PANEL ──
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.black.withOpacity(0.2),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: Colors.white.withOpacity(0.06)),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Sequential Audio Clips Playlist',
                            style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.white70),
                          ),
                          const SizedBox(height: 10),

                          // List of Playlist clips
                          if (audioClips.isEmpty)
                            Container(
                              height: 60,
                              alignment: Alignment.center,
                              child: const Text('No audio clips added. Record mic or upload files.', style: TextStyle(color: Colors.white24, fontSize: 11)),
                            )
                          else
                            ListView.builder(
                              shrinkWrap: true,
                              physics: const NeverScrollableScrollPhysics(),
                              itemCount: audioClips.length,
                              itemBuilder: (context, cIdx) {
                                final clip = audioClips[cIdx];
                                final isRecord = clip['type'] == 'record';
                                return Container(
                                  margin: const EdgeInsets.only(bottom: 8),
                                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFF070B16),
                                    borderRadius: BorderRadius.circular(10),
                                    border: Border.all(color: Colors.white.withOpacity(0.04)),
                                  ),
                                  child: Row(
                                    children: [
                                      Icon(
                                        isRecord ? Icons.mic : Icons.audiotrack,
                                        color: isRecord ? Colors.redAccent : const Color(0xFF10B981),
                                        size: 16,
                                      ),
                                      const SizedBox(width: 10),
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Text(
                                              clip['name'],
                                              maxLines: 1,
                                              overflow: TextOverflow.ellipsis,
                                              style: const TextStyle(color: Colors.white70, fontSize: 12, fontWeight: FontWeight.bold),
                                            ),
                                            const SizedBox(height: 2),
                                            Text(
                                              '${clip['type'].toString().toUpperCase()} • ${formatTime(clip['duration'])}',
                                              style: TextStyle(color: Colors.white30, fontSize: 9),
                                            )
                                          ],
                                        ),
                                      ),
                                      // Reorder & Delete actions
                                      Row(
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          if (cIdx > 0)
                                            IconButton(
                                              icon: const Icon(Icons.arrow_upward, size: 14, color: Colors.white30),
                                              onPressed: () {
                                                setModalState(() {
                                                  final temp = audioClips[cIdx];
                                                  audioClips[cIdx] = audioClips[cIdx - 1];
                                                  audioClips[cIdx - 1] = temp;
                                                });
                                              },
                                            ),
                                          if (cIdx < audioClips.length - 1)
                                            IconButton(
                                              icon: const Icon(Icons.arrow_downward, size: 14, color: Colors.white30),
                                              onPressed: () {
                                                setModalState(() {
                                                  final temp = audioClips[cIdx];
                                                  audioClips[cIdx] = audioClips[cIdx + 1];
                                                  audioClips[cIdx + 1] = temp;
                                                });
                                              },
                                            ),
                                          IconButton(
                                            icon: const Icon(Icons.delete_outline, size: 16, color: Colors.redAccent),
                                            onPressed: () {
                                              setModalState(() {
                                                audioClips.removeAt(cIdx);
                                              });
                                            },
                                          ),
                                        ],
                                      )
                                    ],
                                  ),
                                );
                              },
                            ),

                          const SizedBox(height: 12),
                          const Divider(color: Colors.white10),
                          const SizedBox(height: 8),

                          // Recorder panel
                          if (recordingState == 'recording' || recordingState == 'paused')
                            Container(
                              padding: const EdgeInsets.all(12),
                              margin: const EdgeInsets.only(bottom: 12),
                              decoration: BoxDecoration(color: Colors.red.withOpacity(0.04), borderRadius: BorderRadius.circular(12), border: Border.all(color: Colors.redAccent.withOpacity(0.1))),
                              child: Column(
                                children: [
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      Container(width: 8, height: 8, decoration: BoxDecoration(color: recordingState == 'recording' ? Colors.red : Colors.grey, shape: BoxShape.circle)),
                                      const SizedBox(width: 8),
                                      Text(formatTime(recordingSeconds), style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white)),
                                    ],
                                  ),
                                  const SizedBox(height: 8),
                                  // waveform pulse
                                  SizedBox(
                                    height: 24,
                                    child: Row(
                                      mainAxisAlignment: MainAxisAlignment.center,
                                      children: waveformHeights.map((h) {
                                        return Container(width: 2, height: recordingState == 'recording' ? h * 0.6 : 3.0, margin: const EdgeInsets.symmetric(horizontal: 1.0), decoration: BoxDecoration(color: Colors.redAccent.withOpacity(0.6), borderRadius: BorderRadius.circular(1)));
                                      }).toList(),
                                    ),
                                  ),
                                  const SizedBox(height: 10),
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      IconButton(icon: Icon(recordingState == 'recording' ? Icons.pause : Icons.play_arrow, color: Colors.redAccent, size: 24), onPressed: recordingState == 'recording' ? pauseRecording : resumeRecording),
                                      const SizedBox(width: 16),
                                      IconButton(icon: const Icon(Icons.stop, color: Colors.redAccent, size: 24), onPressed: stopRecording),
                                    ],
                                  )
                                ],
                              ),
                            ),

                          // File Uploader panel
                          if (isUploading)
                            Container(
                              padding: const EdgeInsets.all(12),
                              margin: const EdgeInsets.only(bottom: 12),
                              decoration: BoxDecoration(color: const Color(0xFF10B981).withOpacity(0.04), borderRadius: BorderRadius.circular(12), border: Border.all(color: const Color(0xFF10B981).withOpacity(0.1))),
                              child: Column(
                                children: [
                                  Row(
                                    children: [
                                      const CircularProgressIndicator(strokeWidth: 2, color: Color(0xFF10B981)),
                                      const SizedBox(width: 14),
                                      Expanded(child: Text('Uploading $selectedFileName to Cloudflare R2...', style: const TextStyle(color: Colors.white70, fontSize: 11, fontWeight: FontWeight.bold))),
                                    ],
                                  ),
                                ],
                              ),
                            ),

                          // Trigger buttons
                          if (recordingState == 'idle' && !isUploading)
                            Row(
                              children: [
                                Expanded(
                                  child: ElevatedButton.icon(
                                    onPressed: startRecording,
                                    icon: const Icon(Icons.mic, size: 14, color: Color(0xFF0B1325)),
                                    label: const Text('Record Mic Clip', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF0B1325))),
                                    style: ElevatedButton.styleFrom(backgroundColor: Colors.redAccent, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8))),
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: ElevatedButton.icon(
                                    onPressed: pickAndUploadFile,
                                    icon: const Icon(Icons.cloud_upload, size: 14, color: Color(0xFF0B1325)),
                                    label: const Text('Upload File Clip', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF0B1325))),
                                    style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF10B981), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8))),
                                  ),
                                ),
                              ],
                            )
                        ],
                      ),
                    ),
                    const SizedBox(height: 12),

                    // Content text
                    TextFormField(
                      controller: contentController,
                      maxLines: 4,
                      decoration: const InputDecoration(
                        labelText: 'Lesson Study Material (Content Text)',
                        labelStyle: TextStyle(color: Colors.white60, fontSize: 13),
                        border: OutlineInputBorder(),
                        alignLabelWithHint: true,
                        hintText: 'Paste textbooks or reference pages here...',
                      ),
                      style: const TextStyle(color: Colors.white, fontSize: 12, height: 1.4),
                    ),
                    const SizedBox(height: 20),

                    // Save Button
                    SizedBox(
                      width: double.infinity,
                      height: 50,
                      child: ElevatedButton(
                        onPressed: () async {
                          if (titleController.text.trim().isEmpty || descController.text.trim().isEmpty) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(content: Text('Please fill out all required fields.')),
                            );
                            return;
                          }

                          final chNum = int.tryParse(numController.text.trim()) ?? 1;
                          
                          // Calculate total duration from playlist clips
                          final totalSecs = audioClips.fold<int>(0, (sum, clip) => sum + (clip['duration'] as int? ?? 0));

                          // Serialize audioClips array as JSON string
                          final playlistUrls = audioClips.map((c) => c['url']).toList();
                          final playlistJson = json.encode(playlistUrls);

                          // Set loading state in sheet
                          setModalState(() {
                            isUploading = true;
                            selectedFileName = 'Saving to Supabase...';
                          });

                          // DIRECT Supabase call (bypass AdminState to debug exact error)
                          final supabase = Supabase.instance.client;
                          final chapterId = isEdit ? chapter.id : const Uuid().v4();

                          final dataMap = {
                            'id': chapterId,
                            'book_id': widget.book.id,
                            'title': titleController.text.trim(),
                            'description': descController.text.trim(),
                            'content_text': contentController.text.trim(),
                            'audio_url': playlistUrls.isEmpty ? '' : playlistJson,
                            'chapter_number': chNum,
                            'is_free': isFree,
                            'duration_seconds': totalSecs == 0 ? 300 : totalSecs,
                          };

                          try {
                            if (isEdit) {
                              await supabase
                                  .from('chapters')
                                  .update(dataMap)
                                  .eq('id', chapterId);
                            } else {
                              await supabase
                                  .from('chapters')
                                  .insert(dataMap);
                            }

                            // Reload chapters in state
                            await state.loadChapters(widget.book.id);

                            recordingTimer?.cancel();
                            waveformTimer?.cancel();
                            audioRecorder.dispose();
                            Navigator.pop(context);

                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                content: Text(isEdit ? 'Chapter updated!' : 'Chapter published!'),
                                backgroundColor: const Color(0xFF10B981),
                              ),
                            );
                          } catch (dbErr) {
                            print('DIRECT Supabase error: $dbErr');
                            setModalState(() {
                              isUploading = false;
                            });
                            // Show FULL error in AlertDialog so user can read and report it
                            showDialog(
                              context: context,
                              builder: (ctx) => AlertDialog(
                                backgroundColor: const Color(0xFF070B16),
                                title: const Text('❌ Database Error', style: TextStyle(color: Colors.redAccent, fontSize: 16)),
                                content: SingleChildScrollView(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      const Text('Error Details:', style: TextStyle(color: Colors.white70, fontSize: 12, fontWeight: FontWeight.bold)),
                                      const SizedBox(height: 8),
                                      SelectableText(
                                        '$dbErr',
                                        style: const TextStyle(color: Colors.redAccent, fontSize: 11),
                                      ),
                                      const SizedBox(height: 16),
                                      const Text('Data Sent:', style: TextStyle(color: Colors.white70, fontSize: 12, fontWeight: FontWeight.bold)),
                                      const SizedBox(height: 8),
                                      SelectableText(
                                        json.encode(dataMap),
                                        style: const TextStyle(color: Colors.white38, fontSize: 9),
                                      ),
                                    ],
                                  ),
                                ),
                                actions: [
                                  TextButton(
                                    onPressed: () => Navigator.pop(ctx),
                                    child: const Text('OK'),
                                  ),
                                ],
                              ),
                            );
                          }
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Theme.of(context).primaryColor,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                        child: Text(
                          isEdit ? 'Update Details' : 'Publish Lesson',
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

    return Scaffold(
      appBar: AppBar(
        title: Text(widget.book.title, style: const TextStyle(fontFamily: 'Outfit', fontWeight: FontWeight.bold)),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => _showChapterForm(context),
        backgroundColor: accentColor,
        child: const Icon(Icons.add, color: Color(0xFF0B1325)),
      ),
      body: Column(
        children: [
          // Book Header Card
          Container(
            padding: const EdgeInsets.all(16),
            color: const Color(0xFF070B16),
            child: Row(
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(8),
                  child: widget.book.coverImage.startsWith('http')
                      ? Image.network(
                          widget.book.coverImage,
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
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(widget.book.title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: Colors.white)),
                      const SizedBox(height: 4),
                      Text('By ${widget.book.author}', style: TextStyle(fontSize: 11, color: Colors.white.withOpacity(0.5))),
                      const SizedBox(height: 6),
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                            decoration: BoxDecoration(
                              color: accentColor.withOpacity(0.08),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Text(widget.book.subject, style: TextStyle(color: accentColor, fontSize: 9, fontWeight: FontWeight.bold)),
                          ),
                          const SizedBox(width: 12),
                          Text('${state.chapters.length} Units Mapped', style: TextStyle(color: Colors.white38, fontSize: 10)),
                        ],
                      )
                    ],
                  ),
                ),
              ],
            ),
          ),
          const Divider(height: 1, color: Colors.white10),

          // Chapters/Lessons List
          Expanded(
            child: state.isLoading
                ? const Center(child: CircularProgressIndicator())
                : state.chapters.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.collections_bookmark_rounded, size: 48, color: Colors.white.withOpacity(0.12)),
                            const SizedBox(height: 12),
                            const Text('No lessons created for this book yet', style: TextStyle(color: Colors.white30, fontSize: 12)),
                            const SizedBox(height: 4),
                            const Text('Tap "+" to publish the first chapter', style: TextStyle(color: Colors.white24, fontSize: 10)),
                          ],
                        ),
                      )
                    : ListView.builder(
                        padding: const EdgeInsets.all(16),
                        itemCount: state.chapters.length,
                        itemBuilder: (context, idx) {
                          final ch = state.chapters[idx];
                          
                          int playlistSize = 0;
                          if (ch.audioUrl.isNotEmpty) {
                            if (ch.audioUrl.startsWith('[')) {
                              try {
                                playlistSize = (json.decode(ch.audioUrl) as List).length;
                              } catch (_) {
                                playlistSize = 1;
                              }
                            } else {
                              playlistSize = 1;
                            }
                          }

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
                                    builder: (context) => DataManager(chapter: ch, subject: widget.book.subject),
                                  ),
                                );
                              },
                              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                              
                              // Play/Pause button on lesson card leading
                              leading: GestureDetector(
                                onTap: ch.audioUrl.isEmpty ? null : () => _toggleChapterAudio(ch),
                                child: CircleAvatar(
                                  backgroundColor: accentColor.withOpacity(0.1),
                                  child: _playingChapterId == ch.id
                                      ? Icon(
                                          _isPlaying ? Icons.pause_rounded : Icons.play_arrow_rounded,
                                          color: accentColor,
                                          size: 20,
                                        )
                                      : ch.audioUrl.isNotEmpty
                                          ? Icon(Icons.play_arrow_rounded, color: accentColor, size: 20)
                                          : Text(
                                              '${ch.chapterNumber}',
                                              style: TextStyle(color: accentColor, fontWeight: FontWeight.bold, fontSize: 13),
                                            ),
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
                                      if (playlistSize > 0) ...[
                                        Icon(Icons.playlist_play, size: 14, color: accentColor),
                                        const SizedBox(width: 4),
                                        Text('$playlistSize clips (${ch.durationSeconds}s)', style: TextStyle(fontSize: 9, color: accentColor)),
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
                                    onPressed: () => _showChapterForm(context, chapter: ch),
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

class R2Signer {
  final String accessKey;
  final String secretKey;
  final String endpoint;
  final String region = "auto";
  final String service = "s3";

  R2Signer({
    required this.accessKey,
    required this.secretKey,
    required this.endpoint,
  });

  List<int> hmacSHA256(List<int> key, List<int> data) {
    final hmac = Hmac(sha256, key);
    return hmac.convert(data).bytes;
  }

  String getSignature({
    required String method,
    required String path,
    required String amzDate,
    required String dateStamp,
    required String payloadHash,
    required Map<String, String> headers,
  }) {
    final signedHeaders = headers.keys.map((k) => k.toLowerCase()).toList()..sort();
    final signedHeadersStr = signedHeaders.join(';');
    
    final canonicalHeaders = signedHeaders.map((k) {
      return '$k:${headers[k]!.trim()}';
    }).join('\n') + '\n';

    final canonicalRequest = [
      method,
      Uri.encodeFull(path),
      '', // query string
      canonicalHeaders,
      signedHeadersStr,
      payloadHash,
    ].join('\n');

    final canonicalRequestHash = sha256.convert(utf8.encode(canonicalRequest)).toString();

    final credentialScope = '$dateStamp/$region/$service/aws4_request';
    final stringToSign = [
      'AWS4-HMAC-SHA256',
      amzDate,
      credentialScope,
      canonicalRequestHash,
    ].join('\n');

    final kDate = hmacSHA256(utf8.encode('AWS4$secretKey'), utf8.encode(dateStamp));
    final kRegion = hmacSHA256(kDate, utf8.encode(region));
    final kService = hmacSHA256(kRegion, utf8.encode(service));
    final kSigning = hmacSHA256(kService, utf8.encode('aws4_request'));
    
    final signatureBytes = hmacSHA256(kSigning, utf8.encode(stringToSign));
    final signature = signatureBytes.map((b) => b.toRadixString(16).padLeft(2, '0')).join();

    return signature;
  }
}
