import 'package:dio/dio.dart';

class ApiException implements Exception {
  const ApiException(this.code, this.message, {this.statusCode});

  final String code;
  final String message;
  final int? statusCode;

  bool get isNetworkError => code == 'NETWORK_ERROR';
  bool get isUnauthorized => statusCode == 401;
  bool get isForbidden => statusCode == 403;

  factory ApiException.malformedResponse() {
    return const ApiException(
      'INVALID_RESPONSE',
      'Data dari Komplekku belum dapat dibaca. Coba lagi.',
    );
  }

  factory ApiException.fromDio(DioException error) {
    final body = error.response?.data;
    if (body case {'error': final Map<String, dynamic> payload}) {
      final code = payload['code'];
      final message = payload['message'];
      return ApiException(
        code is String ? code : 'REQUEST_FAILED',
        message is String
            ? message
            : 'Permintaan belum bisa diproses. Coba lagi.',
        statusCode: error.response?.statusCode,
      );
    }

    if (error.response != null) {
      return ApiException(
        'REQUEST_FAILED',
        'Layanan Komplekku belum bisa memproses permintaan. Coba lagi.',
        statusCode: error.response?.statusCode,
      );
    }

    return const ApiException(
      'NETWORK_ERROR',
      'Tidak dapat terhubung ke Komplekku. Periksa koneksi lalu coba lagi.',
    );
  }

  @override
  String toString() => message;
}
