import 'package:flutter/material.dart';
import 'package:video_player/video_player.dart';
import 'package:provider/provider.dart';
import '../providers/app_state.dart';
import 'lesson_screen.dart';
import 'quiz_screen.dart';

class SampleVideoItem {
  final String id;
  final String videoUrl;
  final String title;
  final String description;
  final String bookName;
  final String chapterId;
  int likes;
  bool isLiked;

  SampleVideoItem({
    required this.id,
    required this.videoUrl,
    required this.title,
    required this.description,
    required this.bookName,
    required this.chapterId,
    this.likes = 142,
    this.isLiked = false,
  });
}

class SamplesScreen extends StatefulWidget {
  const SamplesScreen({super.key});

  @override
  State<SamplesScreen> createState() => _SamplesScreenState();
}

class _SamplesScreenState extends State<SamplesScreen> {
  late PageController _pageController;
  int _focusedIndex = 0;

  final List<SampleVideoItem> _samples = [
    SampleVideoItem(
      id: "1",
      videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-man-holding-a-globe-in-his-hands-4050-large.mp4",
      title: "झारखंड का भूगोल: नदियों की स्थिति",
      description: "दामोदर नदी झारखंड की सबसे लंबी और सबसे बड़ी नदी है। यह पलामू के तोरी क्षेत्र (लातेहार) से निकलती है और इसे 'देव नद' भी कहा जाता है।",
      bookName: "झारखंड का भूगोल",
      chapterId: "46af8ec4-9c17-4029-86d1-b4e56c1027b7", // Real chapter ID from DB or default
      likes: 284,
    ),
    SampleVideoItem(
      id: "2",
      videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-spinning-political-globe-2022-large.mp4",
      title: "झारखंड का इतिहास: राज्य गठन",
      description: "15 नवंबर 2000 को भगवान बिरसा मुंडा की जयंती के दिन बिहार से अलग होकर झारखंड भारत का 28वां राज्य बना था। इसमें कुल 18 जिले शामिल थे।",
      bookName: "झारखंड का इतिहास",
      chapterId: "65ea2e3f-91f8-4d3b-bb87-0dc3e54097b8",
      likes: 512,
    ),
    SampleVideoItem(
      id: "3",
      videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-hand-writing-in-a-notebook-42289-large.mp4",
      title: "शिक्षा एवं मनोविज्ञान: थार्नडाइक के नियम",
      description: "थार्नडाइक ने सीखने के तीन मुख्य नियम दिए: तत्परता का नियम (Law of Readiness), अभ्यास का नियम (Law of Exercise) और प्रभाव का नियम (Law of Effect)।",
      bookName: "Child Development & Pedagogy",
      chapterId: "46af8ec4-9c17-4029-86d1-b4e56c1027b7",
      likes: 198,
    ),
    SampleVideoItem(
      id: "4",
      videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-forest-stream-in-the-sunlight-529-large.mp4",
      title: "पर्यावरण अध्ययन: हाथियों का झुंड",
      description: "हाथियों के झुंड की नेता सबसे बुजुर्ग हथिनी होती है। एक झुंड में केवल हथिनियां और उनके बच्चे ही रहते हैं। हाथी 14-15 साल की उम्र में झुंड छोड़ देते हैं।",
      bookName: "Environmental Studies",
      chapterId: "46af8ec4-9c17-4029-86d1-b4e56c1027b7",
      likes: 341,
    ),
  ];

  @override
  void initState() {
    super.initState();
    _pageController = PageController();
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: PageView.builder(
        controller: _pageController,
        scrollDirection: Axis.vertical,
        itemCount: _samples.length,
        onPageChanged: (index) {
          setState(() {
            _focusedIndex = index;
          });
        },
        itemBuilder: (context, index) {
          return KeepAliveVideoPlayer(
            item: _samples[index],
            isFocused: index == _focusedIndex,
          );
        },
      ),
    );
  }
}

class KeepAliveVideoPlayer extends StatefulWidget {
  final SampleVideoItem item;
  final bool isFocused;

  const KeepAliveVideoPlayer({
    super.key,
    required this.item,
    required this.isFocused,
  });

  @override
  State<KeepAliveVideoPlayer> createState() => _KeepAliveVideoPlayerState();
}

class _KeepAliveVideoPlayerState extends State<KeepAliveVideoPlayer> {
  VideoPlayerController? _controller;
  bool _initialized = false;
  bool _playIconVisible = false;

  @override
  void initState() {
    super.initState();
    _initializePlayer();
  }

  void _initializePlayer() async {
    _controller = VideoPlayerController.networkUrl(Uri.parse(widget.item.videoUrl));
    try {
      await _controller!.initialize();
      _controller!.setLooping(true);
      if (mounted) {
        setState(() {
          _initialized = true;
        });
        if (widget.isFocused) {
          _controller!.play();
        }
      }
    } catch (e) {
      print("Error loading video: $e");
    }
  }

  @override
  void didUpdateWidget(KeepAliveVideoPlayer oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (_controller == null || !_initialized) return;

    if (widget.isFocused) {
      _controller!.play();
    } else {
      _controller!.pause();
    }
  }

  @override
  void dispose() {
    _controller?.dispose();
    super.dispose();
  }

  void _togglePlay() {
    if (_controller == null || !_initialized) return;
    setState(() {
      if (_controller!.value.isPlaying) {
        _controller!.pause();
      } else {
        _controller!.play();
      }
      _playIconVisible = true;
    });
    Future.delayed(const Duration(milliseconds: 600), () {
      if (mounted) {
        setState(() {
          _playIconVisible = false;
        });
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final accentColor = const Color(0xFF10B981);
    
    return Stack(
      children: [
        // ── Video Player ──
        GestureDetector(
          onTap: _togglePlay,
          child: SizedBox.expand(
            child: _initialized && _controller != null
                ? FittedBox(
                    fit: BoxFit.cover,
                    clipBehavior: Clip.hardEdge,
                    child: SizedBox(
                      width: _controller!.value.size.width,
                      height: _controller!.value.size.height,
                      child: VideoPlayer(_controller!),
                    ),
                  )
                : const Center(
                    child: CircularProgressIndicator(color: Color(0xFF10B981)),
                  ),
          ),
        ),

        // ── Play/Pause Icon Overlay ──
        if (_playIconVisible && _controller != null)
          Center(
            child: Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.black.withOpacity(0.5),
                shape: BoxShape.circle,
              ),
              child: Icon(
                _controller!.value.isPlaying ? Icons.play_arrow_rounded : Icons.pause_rounded,
                size: 40,
                color: Colors.white,
              ),
            ),
          ),

        // ── Dark Gradient Bottom Vignette ──
        Positioned.fill(
          child: DecoratedBox(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  Colors.black.withOpacity(0.6),
                  Colors.transparent,
                  Colors.transparent,
                  Colors.black.withOpacity(0.85),
                ],
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                stops: const [0.0, 0.25, 0.6, 1.0],
              ),
            ),
          ),
        ),

        // ── Left Info Details Overlay ──
        Positioned(
          left: 16,
          bottom: 24,
          right: 80,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Book Subject tag
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: accentColor,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  widget.item.bookName,
                  style: const TextStyle(
                    color: Color(0xFF0B1325),
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                    fontFamily: 'Inter',
                  ),
                ),
              ),
              const SizedBox(height: 8),
              // Chapter Title
              Text(
                widget.item.title,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  fontFamily: 'Outfit',
                ),
              ),
              const SizedBox(height: 6),
              // Chapter description
              Text(
                widget.item.description,
                maxLines: 3,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  color: Colors.white.withOpacity(0.7),
                  fontSize: 12,
                  height: 1.4,
                  fontFamily: 'Inter',
                ),
              ),
            ],
          ),
        ),

        // ── Right Side Action Icons Overlay ──
        Positioned(
          right: 12,
          bottom: 24,
          child: Column(
            children: [
              // Like Action
              IconButton(
                icon: Icon(
                  widget.item.isLiked ? Icons.favorite_rounded : Icons.favorite_border_rounded,
                  color: widget.item.isLiked ? Colors.redAccent : Colors.white,
                  size: 28,
                ),
                onPressed: () {
                  setState(() {
                    widget.item.isLiked = !widget.item.isLiked;
                    if (widget.item.isLiked) {
                      widget.item.likes++;
                    } else {
                      widget.item.likes--;
                    }
                  });
                },
              ),
              Text(
                "${widget.item.likes}",
                style: const TextStyle(color: Colors.white70, fontSize: 10, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 18),

              // Comment Action
              IconButton(
                icon: const Icon(Icons.mode_comment_outlined, color: Colors.white, size: 26),
                onPressed: () {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text("Comments section coming soon!"),
                      backgroundColor: Color(0xFF070B16),
                      duration: Duration(seconds: 2),
                    ),
                  );
                },
              ),
              const Text(
                "32",
                style: TextStyle(color: Colors.white70, fontSize: 10, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 18),

              // Play Lesson Action
              IconButton(
                icon: Icon(Icons.play_circle_fill_rounded, color: accentColor, size: 38),
                onPressed: () {
                  _controller?.pause();
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => LessonScreen(chapterId: widget.item.chapterId),
                    ),
                  ).then((_) {
                    if (widget.isFocused && _controller != null) {
                      _controller!.play();
                    }
                  });
                },
              ),
              const Text(
                "Play Lesson",
                style: TextStyle(color: Colors.white70, fontSize: 8, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 18),

              // Practice Quiz Action
              IconButton(
                icon: const Icon(Icons.assignment_turned_in_rounded, color: Colors.amberAccent, size: 30),
                onPressed: () {
                  _controller?.pause();
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => QuizScreen(chapterId: widget.item.chapterId),
                    ),
                  ).then((_) {
                    if (widget.isFocused && _controller != null) {
                      _controller!.play();
                    }
                  });
                },
              ),
              const Text(
                "Practice",
                style: TextStyle(color: Colors.white70, fontSize: 8, fontWeight: FontWeight.bold),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
