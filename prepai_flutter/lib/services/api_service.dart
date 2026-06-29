import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/models.dart';

class ApiService {
  final String baseUrl = 'https://upsc-roan-pi.vercel.app';

  // 1. Generate MCQ via Vercel Endpoint
  Future<List<MCQ>> generateMCQ(String chapterId, String text) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/api/generate-mcq'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'chapterId': chapterId,
          'text': text,
        }),
      );

      if (response.statusCode == 200) {
        final List<dynamic> body = json.decode(response.body);
        return body.map((json) => MCQ.fromJson(json)).toList();
      } else {
        throw Exception('Server returned status code: ${response.statusCode}');
      }
    } catch (e) {
      print('API generateMCQ error: $e. Returning mock generated MCQ.');
      // Return a simulated generated MCQ
      return [
        MCQ(
          id: 'gen-m-${DateTime.now().millisecondsSinceEpoch}',
          chapterId: chapterId,
          question: 'Which historical event of British India led directly to the introduction of the Regulating Act of 1773?',
          optionA: 'The Battle of Plassey (1757) and Battle of Buxar (1764) causing financial trouble for the East India Company',
          optionB: 'The Great Revolt of 1857',
          optionC: 'The partition of Bengal in 1905',
          optionD: 'The signing of the Lucknow Pact in 1916',
          correctOption: 'A',
          explanation: 'The financial distress of the East India Company and the need to regulate its administration led the British parliament to pass the Regulating Act of 1773.',
          subject: 'Polity',
        ),
      ];
    }
  }

  // 2. Generate Flashcard via Vercel Endpoint
  Future<List<Flashcard>> generateFlashcards(String chapterId, String text) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/api/generate-flashcards'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'chapterId': chapterId,
          'text': text,
        }),
      );

      if (response.statusCode == 200) {
        final List<dynamic> body = json.decode(response.body);
        return body.map((json) => Flashcard.fromJson(json)).toList();
      } else {
        throw Exception('Server returned status code: ${response.statusCode}');
      }
    } catch (e) {
      print('API generateFlashcards error: $e. Returning mock generated flashcards.');
      // Return a simulated generated flashcard
      return [
        Flashcard(
          id: 'gen-f-${DateTime.now().millisecondsSinceEpoch}',
          chapterId: chapterId,
          question: 'What is the primary significance of the Regulating Act of 1773?',
          answer: 'It was the first step by the British government to regulate the East India Company and laid the foundations of central administration.',
          difficultyLevel: 'Medium',
        ),
      ];
    }
  }
}
