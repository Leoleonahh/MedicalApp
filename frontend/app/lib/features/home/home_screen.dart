import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../core/session.dart';
import '../../core/theme.dart';
import '../../core/widgets.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final username = AppSession.instance.user['username']?.toString() ?? 'ผู้ใช้';
    return Scaffold(
      appBar: AppBar(title: const Text('MedicalApp'), actions: [
        IconButton(onPressed: () => context.push('/profile'), icon: const Icon(Icons.account_circle_outlined)),
      ]),
      body: ListView(padding: const EdgeInsets.fromLTRB(20, 8, 20, 26), children: [
        Text('สวัสดี, $username', style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w800)),
        const SizedBox(height: 6),
        const Text('ดูแลสุขภาพและจัดการข้อมูลของคุณได้ในที่เดียว', style: TextStyle(color: AppColors.muted)),
        const SizedBox(height: 22),
        _HeroAction(
          title: 'วิเคราะห์บาดแผล',
          subtitle: 'ถ่ายหรือเลือกรูปเพื่อรับผลประเมินและคำแนะนำเบื้องต้น',
          icon: Icons.add_a_photo_outlined,
          onTap: () => context.push('/predict'),
        ),
        const SizedBox(height: 22),
        const SectionTitle('บริการสุขภาพ'),
        const SizedBox(height: 12),
        _ActionTile(icon: Icons.history, title: 'ประวัติบาดแผล', subtitle: 'ดูผลประเมินย้อนหลัง', onTap: () => context.go('/history')),
        const SizedBox(height: 10),
        _ActionTile(icon: Icons.local_pharmacy_outlined, title: 'ร้านขายยา', subtitle: 'ค้นหาร้านและสินค้าใกล้คุณ', onTap: () => context.go('/shop')),
        const SizedBox(height: 10),
        _ActionTile(icon: Icons.local_hospital_outlined, title: 'สถานพยาบาลใกล้เคียง', subtitle: 'ดูตำแหน่งบนแผนที่', onTap: () => context.push('/hospital')),
        const SizedBox(height: 10),
        _ActionTile(icon: Icons.receipt_long_outlined, title: 'คำสั่งซื้อ', subtitle: 'ติดตามสถานะและการชำระเงิน', onTap: () => context.push('/orders')),
      ]),
    );
  }
}

class _HeroAction extends StatelessWidget {
  const _HeroAction({required this.title, required this.subtitle, required this.icon, required this.onTap});
  final String title;
  final String subtitle;
  final IconData icon;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => Material(
        color: AppColors.ink,
        borderRadius: BorderRadius.circular(22),
        child: InkWell(
          borderRadius: BorderRadius.circular(22),
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.all(22),
            child: Row(children: [
              Container(width: 56, height: 56, decoration: BoxDecoration(color: AppColors.pink, borderRadius: BorderRadius.circular(17)), child: Icon(icon, color: Colors.white, size: 28)),
              const SizedBox(width: 16),
              Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(title, style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w800)),
                const SizedBox(height: 5),
                Text(subtitle, style: const TextStyle(color: Colors.white70, height: 1.35)),
              ])),
              const Icon(Icons.arrow_forward_ios, color: Colors.white70, size: 16),
            ]),
          ),
        ),
      );
}

class _ActionTile extends StatelessWidget {
  const _ActionTile({required this.icon, required this.title, required this.subtitle, required this.onTap});
  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => Card(
        child: ListTile(
          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 7),
          leading: Icon(icon, color: AppColors.pink, size: 26),
          title: Text(title, style: const TextStyle(fontWeight: FontWeight.w700)),
          subtitle: Text(subtitle),
          trailing: const Icon(Icons.chevron_right),
          onTap: onTap,
        ),
      );
}
