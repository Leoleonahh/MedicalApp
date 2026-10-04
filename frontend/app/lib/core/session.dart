import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class AppSession extends ChangeNotifier {
  AppSession._();

  static final AppSession instance = AppSession._();
  static const _storage = FlutterSecureStorage();
  static const _tokenKey = 'access_token';
  static const _userKey = 'user_profile';

  String? token;
  Map<String, dynamic> user = {};

  bool get isAuthenticated => token != null && token!.isNotEmpty;

  Future<void> restore() async {
    token = await _storage.read(key: _tokenKey);
    final savedUser = await _storage.read(key: _userKey);
    if (savedUser != null) {
      final decoded = jsonDecode(savedUser);
      if (decoded is Map<String, dynamic>) user = decoded;
    }
  }

  Future<void> signIn(String accessToken, Map<String, dynamic> profile) async {
    token = accessToken;
    user = profile;
    await _storage.write(key: _tokenKey, value: accessToken);
    await _storage.write(key: _userKey, value: jsonEncode(profile));
    notifyListeners();
  }

  Future<void> updateUser(Map<String, dynamic> profile) async {
    user = profile;
    await _storage.write(key: _userKey, value: jsonEncode(profile));
    notifyListeners();
  }

  Future<void> signOut() async {
    token = null;
    user = {};
    await _storage.delete(key: _tokenKey);
    await _storage.delete(key: _userKey);
    notifyListeners();
  }
}
