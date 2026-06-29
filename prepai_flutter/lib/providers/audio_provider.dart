import 'package:flutter/material.dart';
import 'package:just_audio/just_audio.dart';
import 'dart:async';
import '../models/models.dart';

/// Global audio provider that persists playback across screen navigation.
/// Works like YouTube's background player — audio keeps playing when you leave the screen.
class AudioProvider extends ChangeNotifier {
  // ── Player Core ──
  AudioPlayer? _audioPlayer;
  bool _isPlaying = false;
  double _playbackSpeed = 1.0;
  Duration _duration = Duration.zero;
  Duration _position = Duration.zero;

  // ── Current Track Info ──
  Chapter? _currentChapter;
  Book? _currentBook;
  List<String> _sentences = [];
  int _activeSentenceIndex = 0;

  // ── Stream Subscriptions ──
  StreamSubscription<PlayerState>? _playerStateSub;
  StreamSubscription<Duration>? _positionSub;
  StreamSubscription<Duration?>? _durationSub;

  // ── Simulated playback timer (fallback when no audio_url) ──
  Timer? _simTimer;

  // ── Getters ──
  bool get isPlaying => _isPlaying;
  bool get hasTrack => _currentChapter != null;
  double get playbackSpeed => _playbackSpeed;
  Duration get duration => _duration;
  Duration get position => _position;
  Chapter? get currentChapter => _currentChapter;
  Book? get currentBook => _currentBook;
  List<String> get sentences => _sentences;
  int get activeSentenceIndex => _activeSentenceIndex;
  AudioPlayer? get audioPlayer => _audioPlayer;

  double get progressPercent {
    final totalSecs = _audioPlayer != null ? _duration.inSeconds : (_sentences.length * 4);
    final elapsedSecs = _audioPlayer != null ? _position.inSeconds : (_activeSentenceIndex * 4);
    return totalSecs > 0 ? (elapsedSecs / totalSecs).clamp(0.0, 1.0) : 0.0;
  }

  String get elapsedString {
    final secs = _audioPlayer != null ? _position.inSeconds : (_activeSentenceIndex * 4);
    return '${secs ~/ 60}:${(secs % 60).toString().padLeft(2, "0")}';
  }

  String get totalDurationString {
    final secs = _audioPlayer != null ? _duration.inSeconds : (_sentences.length * 4);
    return '${secs ~/ 60}:${(secs % 60).toString().padLeft(2, "0")}';
  }

  /// Start playing a lesson. If the same chapter is already loaded, do nothing.
  Future<void> startLesson(Chapter chapter, Book? book) async {
    // If same chapter is already loaded, just resume if needed
    if (_currentChapter?.id == chapter.id) {
      if (!_isPlaying) togglePlay();
      return;
    }

    // Stop any existing playback
    await _cleanupPlayer();

    _currentChapter = chapter;
    _currentBook = book;
    _activeSentenceIndex = 0;
    _position = Duration.zero;
    _duration = Duration.zero;
    _playbackSpeed = 1.0;

    // Parse content into sentences
    _sentences = chapter.contentText
        .split(RegExp(r'(?<=[.!?])\s+'))
        .where((s) => s.isNotEmpty)
        .toList();

    if (chapter.audioUrl.isNotEmpty) {
      // ── Real Audio via just_audio ──
      _audioPlayer = AudioPlayer();
      try {
        await _audioPlayer!.setUrl(chapter.audioUrl);

        _playerStateSub = _audioPlayer!.playerStateStream.listen((state) {
          _isPlaying = state.playing;
          if (state.processingState == ProcessingState.completed) {
            _isPlaying = false;
            _activeSentenceIndex = _sentences.length - 1;
          }
          notifyListeners();
        });

        _positionSub = _audioPlayer!.positionStream.listen((pos) {
          _position = pos;
          if (_duration.inMilliseconds > 0 && _sentences.isNotEmpty) {
            final percent = pos.inMilliseconds / _duration.inMilliseconds;
            _activeSentenceIndex = (percent * _sentences.length).floor().clamp(0, _sentences.length - 1);
          }
          notifyListeners();
        });

        _durationSub = _audioPlayer!.durationStream.listen((dur) {
          if (dur != null) {
            _duration = dur;
            notifyListeners();
          }
        });

        _audioPlayer!.play();
      } catch (e) {
        print('Audio load error: $e — falling back to simulated reader.');
        _audioPlayer?.dispose();
        _audioPlayer = null;
        _startSimulatedPlayback();
      }
    } else {
      // ── Simulated reader ──
      _duration = Duration(seconds: _sentences.length * 4);
      _isPlaying = true;
      _startSimulatedPlayback();
    }

    notifyListeners();
  }

  void togglePlay() {
    if (_currentChapter == null) return;

    if (_audioPlayer != null) {
      if (_isPlaying) {
        _audioPlayer!.pause();
      } else {
        _audioPlayer!.play();
      }
    } else {
      _isPlaying = !_isPlaying;
      if (_isPlaying) {
        _startSimulatedPlayback();
      } else {
        _simTimer?.cancel();
      }
      notifyListeners();
    }
  }

  void seekRelative(int seconds) {
    if (_audioPlayer != null) {
      final newPos = _position + Duration(seconds: seconds);
      final targetPos = newPos < Duration.zero
          ? Duration.zero
          : (newPos > _duration ? _duration : newPos);
      _audioPlayer!.seek(targetPos);
    } else {
      final sentenceDelta = seconds ~/ 4;
      _activeSentenceIndex = (_activeSentenceIndex + sentenceDelta).clamp(0, _sentences.length - 1);
      _position = Duration(seconds: _activeSentenceIndex * 4);
      if (_isPlaying) _startSimulatedPlayback();
      notifyListeners();
    }
  }

  void seekToSentence(int index) {
    _activeSentenceIndex = index.clamp(0, _sentences.length - 1);
    _position = Duration(seconds: _activeSentenceIndex * 4);

    if (_audioPlayer != null) {
      final newMillis = (_activeSentenceIndex / _sentences.length) * _duration.inMilliseconds;
      _audioPlayer!.seek(Duration(milliseconds: newMillis.round()));
    } else if (_isPlaying) {
      _startSimulatedPlayback();
    }
    notifyListeners();
  }

  void seekToProgress(double val) {
    if (_audioPlayer != null) {
      final targetMillis = val * _duration.inMilliseconds;
      _audioPlayer!.seek(Duration(milliseconds: targetMillis.round()));
    } else {
      _activeSentenceIndex = (val * _sentences.length).floor().clamp(0, _sentences.length - 1);
      _position = Duration(seconds: _activeSentenceIndex * 4);
      notifyListeners();
    }
  }

  void changeSpeed(double speed) {
    _playbackSpeed = speed;
    if (_audioPlayer != null) {
      _audioPlayer!.setSpeed(speed);
    } else if (_isPlaying) {
      _startSimulatedPlayback();
    }
    notifyListeners();
  }

  /// Stop playback and dismiss the mini player.
  Future<void> stop() async {
    await _cleanupPlayer();
    _currentChapter = null;
    _currentBook = null;
    _sentences = [];
    _activeSentenceIndex = 0;
    _position = Duration.zero;
    _duration = Duration.zero;
    _isPlaying = false;
    notifyListeners();
  }

  // ── Private Helpers ──

  void _startSimulatedPlayback() {
    _simTimer?.cancel();
    final sentenceDurationMs = (4000 / _playbackSpeed).round();

    _simTimer = Timer.periodic(Duration(milliseconds: sentenceDurationMs), (timer) {
      if (_activeSentenceIndex + 1 < _sentences.length) {
        _activeSentenceIndex++;
        _position = Duration(seconds: _activeSentenceIndex * 4);
        notifyListeners();
      } else {
        _simTimer?.cancel();
        _isPlaying = false;
        notifyListeners();
      }
    });
  }

  Future<void> _cleanupPlayer() async {
    _simTimer?.cancel();
    _playerStateSub?.cancel();
    _positionSub?.cancel();
    _durationSub?.cancel();
    await _audioPlayer?.stop();
    await _audioPlayer?.dispose();
    _audioPlayer = null;
  }

  @override
  void dispose() {
    _cleanupPlayer();
    super.dispose();
  }
}
