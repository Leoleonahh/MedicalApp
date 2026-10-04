import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../core/api_client.dart';
import '../../core/session.dart';

class EditProfileScreen extends StatefulWidget {
  const EditProfileScreen({super.key});
  @override
  State<EditProfileScreen> createState() => _EditProfileScreenState();
}

class _EditProfileScreenState extends State<EditProfileScreen> {
  late final TextEditingController _birthday = TextEditingController(text: AppSession.instance.user['birthday']?.toString() ?? '');
  late final TextEditingController _email = TextEditingController(text: AppSession.instance.user['email']?.toString() ?? '');
  late final TextEditingController _address = TextEditingController(text: AppSession.instance.user['address']?.toString() ?? '');
  bool _loading = false;
  String? _error;

  @override
  void dispose() { _birthday.dispose(); _email.dispose(); _address.dispose(); super.dispose(); }

  Future<void> _save() async {
    setState(() { _loading = true; _error = null; });
    try {
      final response = await ApiClient.instance.put('/api/auth/profile', data: {
        'birthday': _birthday.text.trim(),
        'email': _email.text.trim(),
        'address': _address.text.trim(),
      });
      final user = Map<String, dynamic>.from(response['user'] as Map? ?? AppSession.instance.user);
      await AppSession.instance.updateUser(user);
      if (mounted) context.pop();
    } catch (error) {
      setState(() => _error = apiError(error));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: AppBar(title: const Text('แก้ไขโปรไฟล์')),
        body: ListView(padding: const EdgeInsets.all(20), children: [
          TextField(controller: _birthday, readOnly: true, decoration: const InputDecoration(labelText: 'วันเกิด (YYYY-MM-DD)'), onTap: () async {
            final initial = DateTime.tryParse(_birthday.text) ?? DateTime(2000);
            final selected = await showDatePicker(context: context, initialDate: initial, firstDate: DateTime(1900), lastDate: DateTime.now());
            if (selected != null) _birthday.text = selected.toIso8601String().split('T').first;
          }),
          const SizedBox(height: 12),
          TextField(controller: _email, keyboardType: TextInputType.emailAddress, decoration: const InputDecoration(labelText: 'อีเมล')),
          const SizedBox(height: 12),
          TextField(controller: _address, minLines: 2, maxLines: 4, decoration: const InputDecoration(labelText: 'ที่อยู่')),
          if (_error != null) Padding(padding: const EdgeInsets.only(top: 12), child: Text(_error!, style: const TextStyle(color: Colors.red))),
          const SizedBox(height: 18),
          FilledButton(onPressed: _loading ? null : _save, child: Text(_loading ? 'กำลังบันทึก...' : 'บันทึก')),
        ]),
      );
}

class ChangePasswordScreen extends StatefulWidget {
  const ChangePasswordScreen({super.key});
  @override
  State<ChangePasswordScreen> createState() => _ChangePasswordScreenState();
}

class _ChangePasswordScreenState extends State<ChangePasswordScreen> {
  final _oldPassword = TextEditingController();
  final _newPassword = TextEditingController();
  final _confirmPassword = TextEditingController();
  bool _loading = false;
  String? _error;

  @override
  void dispose() { _oldPassword.dispose(); _newPassword.dispose(); _confirmPassword.dispose(); super.dispose(); }

  Future<void> _save() async {
    setState(() { _loading = true; _error = null; });
    try {
      await ApiClient.instance.post('/api/auth/change-password', data: {
        'oldPassword': _oldPassword.text,
        'newPassword': _newPassword.text,
        'confirmPassword': _confirmPassword.text,
      });
      if (mounted) { ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('เปลี่ยนรหัสผ่านสำเร็จ'))); context.pop(); }
    } catch (error) { setState(() => _error = apiError(error)); }
    finally { if (mounted) setState(() => _loading = false); }
  }

  @override
  Widget build(BuildContext context) => Scaffold(appBar: AppBar(title: const Text('เปลี่ยนรหัสผ่าน')), body: ListView(padding: const EdgeInsets.all(20), children: [
    TextField(controller: _oldPassword, obscureText: true, decoration: const InputDecoration(labelText: 'รหัสผ่านเดิม')),
    const SizedBox(height: 12),
    TextField(controller: _newPassword, obscureText: true, decoration: const InputDecoration(labelText: 'รหัสผ่านใหม่')),
    const SizedBox(height: 12),
    TextField(controller: _confirmPassword, obscureText: true, decoration: const InputDecoration(labelText: 'ยืนยันรหัสผ่านใหม่')),
    if (_error != null) Padding(padding: const EdgeInsets.only(top: 12), child: Text(_error!, style: const TextStyle(color: Colors.red))),
    const SizedBox(height: 18),
    FilledButton(onPressed: _loading ? null : _save, child: Text(_loading ? 'กำลังบันทึก...' : 'เปลี่ยนรหัสผ่าน')),
  ]));
}
