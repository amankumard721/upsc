import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:crypto/crypto.dart';

class R2Service {
  static const String accessKey = "f1f229805186d8a98e05beff34164638";
  static const String secretKey = "e8d24cb0a633a2ffd2c20f86a9db212999419dbc6cd637038bfe328aeec86f90";
  static const String endpoint = "6743ea22b860660512156b0dbe7638d7.r2.cloudflarestorage.com";
  static const String bucketName = "audiopodcast";
  static const String publicBaseUrl = "https://pub-00ab21363ea74b46a5d0555ad4f47b47.r2.dev";

  // Deletes a file or playlist of files from R2 by their public URLs
  static Future<void> deleteAudio(String audioUrl) async {
    if (audioUrl.isEmpty) return;

    List<String> urlsToDelete = [];
    if (audioUrl.startsWith('[')) {
      try {
        final parsed = json.decode(audioUrl) as List;
        urlsToDelete = parsed.map((e) => e.toString()).toList();
      } catch (e) {
        print('R2Service: Error parsing audio playlist JSON: $e');
        urlsToDelete = [audioUrl];
      }
    } else {
      urlsToDelete = [audioUrl];
    }

    for (final url in urlsToDelete) {
      if (!url.startsWith(publicBaseUrl)) {
        print('R2Service: URL does not belong to R2 bucket, skipping: $url');
        continue;
      }

      try {
        // Extract R2 key
        final uri = Uri.parse(url);
        final key = Uri.decodeComponent(uri.path.startsWith('/') ? uri.path.substring(1) : uri.path);
        
        final path = "/$bucketName/$key";
        final requestUri = Uri.parse("https://$endpoint$path");

        final now = DateTime.now().toUtc();
        final amzDate = now.toIso8601String().replaceAll('-', '').replaceAll(':', '').split('.').first + 'Z';
        final dateStamp = amzDate.substring(0, 8);

        // Empty body SHA256 payload hash for DELETE request
        final payloadHash = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";

        final headers = {
          'host': endpoint,
          'x-amz-content-sha256': payloadHash,
          'x-amz-date': amzDate,
        };

        final signature = _getSignature(
          method: 'DELETE',
          path: path,
          amzDate: amzDate,
          dateStamp: dateStamp,
          payloadHash: payloadHash,
          headers: headers,
        );

        final credentialScope = '$dateStamp/auto/s3/aws4_request';
        final authHeader = 'AWS4-HMAC-SHA256 Credential=$accessKey/$credentialScope, SignedHeaders=host;x-amz-content-sha256;x-amz-date, Signature=$signature';

        print('R2Service: Deleting from R2: $key');
        final response = await http.delete(
          requestUri,
          headers: {
            'host': endpoint,
            'x-amz-content-sha256': payloadHash,
            'x-amz-date': amzDate,
            'Authorization': authHeader,
          },
        );

        if (response.statusCode == 200 || response.statusCode == 204) {
          print('R2Service: Successfully deleted R2 file: $key');
        } else {
          print('R2Service: Failed to delete R2 file: $key. Status: ${response.statusCode}, Body: ${response.body}');
        }
      } catch (e) {
        print('R2Service: Error deleting R2 file: $e');
      }
    }
  }

  static String _getSignature({
    required String method,
    required String path,
    required String amzDate,
    required String dateStamp,
    required String payloadHash,
    required Map<String, String> headers,
  }) {
    const region = "auto";
    const service = "s3";

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

    List<int> hmacSHA256(List<int> key, List<int> data) {
      final hmac = Hmac(sha256, key);
      return hmac.convert(data).bytes;
    }

    final kDate = hmacSHA256(utf8.encode('AWS4$secretKey'), utf8.encode(dateStamp));
    final kRegion = hmacSHA256(kDate, utf8.encode(region));
    final kService = hmacSHA256(kRegion, utf8.encode(service));
    final kSigning = hmacSHA256(kService, utf8.encode('aws4_request'));
    
    final signatureBytes = hmacSHA256(kSigning, utf8.encode(stringToSign));
    return signatureBytes.map((b) => b.toRadixString(16).padLeft(2, '0')).join();
  }
}
