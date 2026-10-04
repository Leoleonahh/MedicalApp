import 'dart:io';
import 'dart:typed_data';

import 'package:dio/dio.dart';

import 'session.dart';

class ApiClient {
  ApiClient._() {
    dio = Dio(
      BaseOptions(
        baseUrl: const String.fromEnvironment(
          'API_BASE_URL',
          defaultValue: 'http://10.0.2.2:5000',
        ),
        connectTimeout: const Duration(seconds: 20),
        receiveTimeout: const Duration(seconds: 30),
        headers: {'Accept': 'application/json'},
      ),
    );
    dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) {
          final token = AppSession.instance.token;
          if (token != null && token.isNotEmpty) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          handler.next(options);
        },
      ),
    );
  }

  static final ApiClient instance = ApiClient._();
  late final Dio dio;

  Future<Map<String, dynamic>> get(String path, {Map<String, dynamic>? query}) async {
    final response = await dio.get<dynamic>(path, queryParameters: query);
    return _map(response.data);
  }

  Future<Map<String, dynamic>> post(String path, {Object? data}) async {
    final response = await dio.post<dynamic>(path, data: data);
    return _map(response.data);
  }

  Future<Map<String, dynamic>> put(String path, {Object? data}) async {
    final response = await dio.put<dynamic>(path, data: data);
    return _map(response.data);
  }

  Future<Map<String, dynamic>> patch(String path, {Object? data}) async {
    final response = await dio.patch<dynamic>(path, data: data);
    return _map(response.data);
  }

  Future<Map<String, dynamic>> delete(String path) async {
    final response = await dio.delete<dynamic>(path);
    return _map(response.data);
  }

  Future<Map<String, dynamic>> upload(
    String path, {
    required String fieldName,
    required File file,
    Map<String, dynamic> fields = const {},
  }) async {
    final form = FormData.fromMap({
      ...fields,
      fieldName: await MultipartFile.fromFile(file.path),
    });
    final response = await dio.post<dynamic>(path, data: form);
    return _map(response.data);
  }

  Future<Map<String, dynamic>> uploadBytes(
    String path, {
    required String fieldName,
    required Uint8List bytes,
    required String filename,
    Map<String, dynamic> fields = const {},
  }) async {
    final form = FormData.fromMap({
      ...fields,
      fieldName: MultipartFile.fromBytes(bytes, filename: filename),
    });
    final response = await dio.post<dynamic>(path, data: form);
    return _map(response.data);
  }

  static Map<String, dynamic> _map(dynamic value) {
    if (value is Map<String, dynamic>) return value;
    if (value is Map) return Map<String, dynamic>.from(value);
    return {'data': value};
  }
}

String apiError(Object error) {
  if (error is DioException) {
    final data = error.response?.data;
    if (data is Map && data['message'] != null) return data['message'].toString();
    if (data is Map && data['error'] != null) return data['error'].toString();
    return error.message ?? 'เชื่อมต่อระบบไม่สำเร็จ';
  }
  return error.toString();
}

List<Map<String, dynamic>> asMapList(dynamic value) {
  if (value is! List) return const [];
  return value
      .whereType<Map>()
      .map((item) => Map<String, dynamic>.from(item))
      .toList();
}
