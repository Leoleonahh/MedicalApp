import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../core/api_client.dart';
import '../../core/session.dart';
import '../../core/theme.dart';

class AuthScreen extends StatefulWidget {
  const AuthScreen({super.key, this.registerMode = false});
  final bool registerMode;

  @override
  State<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends State<AuthScreen> {
  final _formKey = GlobalKey<FormState>();
  final _username = TextEditingController();
  final _password = TextEditingController();
  final _confirmPassword = TextEditingController();
  bool _loading = false;
  bool _obscure = true;
  String? _error;

  @override
  void dispose() {
    _username.dispose();
    _password.dispose();
    _confirmPassword.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() { _loading = true; _error = null; });
    try {
      if (widget.registerMode) {
        await ApiClient.instance.post('/api/auth/register', data: {
          'username': _username.text.trim(),
          'password': _password.text,
        });
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('สมัครสมาชิกสำเร็จ กรุณาเข้าสู่ระบบ')));
        context.go('/login');
      } else {
        final result = await ApiClient.instance.post('/api/auth/login', data: {
          'username': _username.text.trim(),
          'password': _password.text,
        });
        await AppSession.instance.signIn(
          result['token'].toString(),
          Map<String, dynamic>.from(result['user'] as Map),
        );
        if (mounted) context.go('/home');
      }
    } catch (error) {
      if (mounted) setState(() => _error = apiError(error));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isRegister = widget.registerMode;
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 440),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Container(
                  width: 58,
                  height: 58,
                  decoration: BoxDecoration(color: AppColors.pinkSoft, borderRadius: BorderRadius.circular(18)),
                  child: const Icon(Icons.health_and_safety_outlined, color: AppColors.pink, size: 32),
                ),
                const SizedBox(height: 26),
                Text(isRegister ? 'สร้างบัญชี MedicalApp' : 'ยินดีต้อนรับกลับ', style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w800)),
                const SizedBox(height: 8),
                Text(isRegister ? 'สมัครเพื่อบันทึกประวัติสุขภาพและใช้บริการร้านยา' : 'เข้าสู่ระบบเพื่อใช้งานบริการสุขภาพของคุณ', style: const TextStyle(color: AppColors.muted)),
                const SizedBox(height: 26),
                Form(
                  key: _formKey,
                  child: Column(children: [
                    TextFormField(
                      controller: _username,
                      textInputAction: TextInputAction.next,
                      decoration: const InputDecoration(labelText: 'ชื่อผู้ใช้'),
                      validator: (value) => value == null || value.trim().isEmpty ? 'กรุณากรอกชื่อผู้ใช้' : null,
                    ),
                    const SizedBox(height: 14),
                    TextFormField(
                      controller: _password,
                      obscureText: _obscure,
                      textInputAction: isRegister ? TextInputAction.next : TextInputAction.done,
                      onFieldSubmitted: (_) { if (!isRegister) _submit(); },
                      decoration: InputDecoration(
                        labelText: 'รหัสผ่าน',
                        suffixIcon: IconButton(icon: Icon(_obscure ? Icons.visibility_outlined : Icons.visibility_off_outlined), onPressed: () => setState(() => _obscure = !_obscure)),
                      ),
                      validator: (value) {
                        if (value == null || value.isEmpty) return 'กรุณากรอกรหัสผ่าน';
                        if (isRegister && !RegExp(r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$').hasMatch(value)) return 'ต้องมีพิมพ์ใหญ่ พิมพ์เล็ก ตัวเลข และอย่างน้อย 8 ตัว';
                        return null;
                      },
                    ),
                    if (isRegister) ...[
                      const SizedBox(height: 14),
                      TextFormField(
                        controller: _confirmPassword,
                        obscureText: _obscure,
                        decoration: const InputDecoration(labelText: 'ยืนยันรหัสผ่าน'),
                        validator: (value) => value != _password.text ? 'รหัสผ่านไม่ตรงกัน' : null,
                      ),
                    ],
                    if (_error != null) ...[
                      const SizedBox(height: 14),
                      Align(alignment: Alignment.centerLeft, child: Text(_error!, style: const TextStyle(color: AppColors.danger))),
                    ],
                    const SizedBox(height: 22),
                    FilledButton(onPressed: _loading ? null : _submit, child: _loading ? const SizedBox.square(dimension: 22, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)) : Text(isRegister ? 'สมัครสมาชิก' : 'เข้าสู่ระบบ')),
                  ]),
                ),
                const SizedBox(height: 12),
                if (!isRegister) Align(alignment: Alignment.centerRight, child: TextButton(onPressed: () => context.push('/forgot-password'), child: const Text('ลืมรหัสผ่าน?'))),
                Center(
                  child: TextButton(
                    onPressed: () => context.go(isRegister ? '/login' : '/register'),
                    child: Text(isRegister ? 'มีบัญชีอยู่แล้ว? เข้าสู่ระบบ' : 'ยังไม่มีบัญชี? สมัครสมาชิก'),
                  ),
                ),
              ]),
            ),
          ),
        ),
      ),
    );
  }
}

class ForgotPasswordScreen extends StatefulWidget {
  const ForgotPasswordScreen({super.key});

  @override
  State<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends State<ForgotPasswordScreen> {
  final _username = TextEditingController();
  final _email = TextEditingController();
  final _otp = TextEditingController();
  final _password = TextEditingController();
  final _confirmPassword = TextEditingController();
  int _step = 0;
  bool _loading = false;
  String? _error;

  Future<void> _run(Future<Map<String, dynamic>> Function() request, int nextStep) async {
    setState(() { _loading = true; _error = null; });
    try {
      await request();
      if (mounted) setState(() => _step = nextStep);
    } catch (error) {
      if (mounted) setState(() => _error = apiError(error));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  void dispose() {
    _username.dispose(); _email.dispose(); _otp.dispose(); _password.dispose(); _confirmPassword.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('กู้คืนรหัสผ่าน')),
      body: ListView(padding: const EdgeInsets.all(22), children: [
        if (_step == 0) ...[
          TextField(controller: _username, decoration: const InputDecoration(labelText: 'ชื่อผู้ใช้')),
          const SizedBox(height: 12),
          TextField(controller: _email, keyboardType: TextInputType.emailAddress, decoration: const InputDecoration(labelText: 'อีเมล')),
          const SizedBox(height: 18),
          FilledButton(onPressed: _loading ? null : () => _run(() => ApiClient.instance.post('/api/auth/forgot-password', data: {'username': _username.text.trim(), 'email': _email.text.trim()}), 1), child: const Text('ส่งรหัส OTP')),
        ] else if (_step == 1) ...[
          TextField(controller: _otp, decoration: const InputDecoration(labelText: 'รหัส OTP')),
          const SizedBox(height: 18),
          FilledButton(onPressed: _loading ? null : () => _run(() => ApiClient.instance.post('/api/auth/verify-otp', data: {'username': _username.text.trim(), 'otp': _otp.text.trim()}), 2), child: const Text('ตรวจสอบ OTP')),
        ] else if (_step == 2) ...[
          TextField(controller: _password, obscureText: true, decoration: const InputDecoration(labelText: 'รหัสผ่านใหม่')),
          const SizedBox(height: 18),
          TextField(controller: _confirmPassword, obscureText: true, decoration: const InputDecoration(labelText: 'ยืนยันรหัสผ่านใหม่')),
          const SizedBox(height: 18),
          FilledButton(onPressed: _loading ? null : () => _run(() => ApiClient.instance.post('/api/auth/reset-password', data: {'username': _username.text.trim(), 'otp': _otp.text.trim(), 'newPassword': _password.text, 'confirmPassword': _confirmPassword.text}), 3), child: const Text('ตั้งรหัสผ่านใหม่')),
        ] else ...[
          const Text('ตั้งรหัสผ่านใหม่เรียบร้อยแล้ว'),
        ],
        if (_loading) const Padding(padding: EdgeInsets.all(16), child: Center(child: CircularProgressIndicator())),
        if (_error != null) Padding(padding: const EdgeInsets.only(top: 14), child: Text(_error!, style: const TextStyle(color: AppColors.danger))),
        if (_step == 3) TextButton(onPressed: () => context.go('/login'), child: const Text('กลับเข้าสู่ระบบ')),
      ]),
    );
  }
}
