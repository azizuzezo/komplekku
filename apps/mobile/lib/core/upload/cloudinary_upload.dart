import 'package:dio/dio.dart';

/// Client-side Cloudinary unsigned upload — the Flutter counterpart of
/// `apps/web/lib/cloudinary-upload.ts`. Configured the same way as
/// `API_BASE_URL` (see `core/api/api_client.dart`): pass
/// `--dart-define=CLOUDINARY_CLOUD_NAME=... --dart-define=CLOUDINARY_UPLOAD_PRESET=...`
/// at build/run time. The preset must be set to "Unsigned" in the Cloudinary
/// dashboard (Settings → Upload → Upload Presets).
const _cloudName = String.fromEnvironment('CLOUDINARY_CLOUD_NAME');
const _uploadPreset = String.fromEnvironment('CLOUDINARY_UPLOAD_PRESET');

class CloudinaryConfigError implements Exception {
  const CloudinaryConfigError();

  @override
  String toString() =>
      'Cloudinary belum dikonfigurasi. Jalankan dengan --dart-define=CLOUDINARY_CLOUD_NAME=... '
      '--dart-define=CLOUDINARY_UPLOAD_PRESET=...';
}

bool get isCloudinaryConfigured => _cloudName.isNotEmpty && _uploadPreset.isNotEmpty;

/// Uploads a single image file to Cloudinary using unsigned upload and
/// returns its `secure_url`.
Future<String> uploadImageToCloudinary(String filePath) async {
  if (!isCloudinaryConfigured) throw const CloudinaryConfigError();

  final dio = Dio();
  final form = FormData.fromMap({
    'file': await MultipartFile.fromFile(filePath),
    'upload_preset': _uploadPreset,
    'folder': 'komplekku/forum',
  });

  final response = await dio.post<Map<String, dynamic>>(
    'https://api.cloudinary.com/v1_1/$_cloudName/image/upload',
    data: form,
  );
  final url = response.data?['secure_url'];
  if (url is! String) {
    throw DioException(
      requestOptions: response.requestOptions,
      error: 'Cloudinary tidak mengembalikan secure_url.',
    );
  }
  return url;
}
