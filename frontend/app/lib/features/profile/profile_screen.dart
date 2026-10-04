import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../core/api_client.dart';
import '../../core/session.dart';
import '../../core/widgets.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});
  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  bool _loading = true;
  String? _error;
  Map<String, dynamic> _user = {};

  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    try {
      final response = await ApiClient.instance.get('/api/auth/profile');
      _user = Map<String, dynamic>.from(response['user'] as Map? ?? {});
      await AppSession.instance.updateUser(_user);
    } catch (error) {
      _error = apiError(error);
      _user = AppSession.instance.user;
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: AppBar(title: const Text('โปรไฟล์')),
        body: _loading ? const PageLoading() : _error != null && _user.isEmpty ? ErrorMessage(_error!, onRetry: _load) : ListView(padding: const EdgeInsets.all(18), children: [
          Card(child: Padding(padding: const EdgeInsets.all(20), child: Row(children: [
            const CircleAvatar(radius: 28, child: Icon(Icons.person_outline, size: 30)),
            const SizedBox(width: 14),
            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Text(_user['username']?.toString() ?? 'ผู้ใช้', style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 18)), Text(_user['email']?.toString() ?? 'ไม่มีอีเมล')])),
          ]))),
          const SizedBox(height: 14),
          ListTile(leading: const Icon(Icons.edit_outlined), title: const Text('แก้ไขโปรไฟล์'), onTap: () => context.push('/profile/edit')),
          ListTile(leading: const Icon(Icons.lock_outline), title: const Text('เปลี่ยนรหัสผ่าน'), onTap: () => context.push('/profile/password')),
          ListTile(leading: const Icon(Icons.storefront_outlined), title: const Text('ลงทะเบียนร้านขายยา'), onTap: () => context.push('/pharmacy/register')),
          ListTile(leading: const Icon(Icons.store_mall_directory_outlined), title: const Text('จัดการร้านของฉัน'), onTap: () => context.push('/pharmacy/manage')),
          ListTile(leading: const Icon(Icons.logout, color: Colors.red), title: const Text('ออกจากระบบ'), onTap: () async { await AppSession.instance.signOut(); if (context.mounted) context.go('/login'); }),
          if (_error != null) Padding(padding: const EdgeInsets.all(8), child: Text(_error!, style: const TextStyle(color: Colors.grey))),
        ]),
      );
}
