import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';

import '../../core/api_client.dart';
import '../../core/widgets.dart';

class StoreOwnerScreen extends StatefulWidget {
  const StoreOwnerScreen({super.key});
  @override
  State<StoreOwnerScreen> createState() => _StoreOwnerScreenState();
}

class _StoreOwnerScreenState extends State<StoreOwnerScreen> {
  bool _loading = true;
  String? _error;
  List<Map<String, dynamic>> _stores = [];

  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    try {
      final response = await ApiClient.instance.get('/pharmacies/my/verified');
      setState(() => _stores = asMapList(response['data']));
    } catch (error) {
      setState(() => _error = apiError(error));
    } finally { if (mounted) setState(() => _loading = false); }
  }

  Future<void> _editPromptPay(Map<String, dynamic> store) async {
    final controller = TextEditingController(text: store['promptpay_number']?.toString() ?? '');
    final save = await showDialog<bool>(context: context, builder: (context) => AlertDialog(
      title: Text('PromptPay • ${store['pharmacy_name'] ?? 'ร้านยา'}'),
      content: TextField(controller: controller, keyboardType: TextInputType.phone, decoration: const InputDecoration(labelText: 'เบอร์ PromptPay')),
      actions: [TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('ยกเลิก')), FilledButton(onPressed: () => Navigator.pop(context, true), child: const Text('บันทึก'))],
    ));
    if (save == true && controller.text.trim().isNotEmpty) {
      try {
        await ApiClient.instance.put('/pharmacies/${store['pharmacy_id']}/promptpay', data: {'promptpay_number': controller.text.trim()});
        await _load();
      } catch (error) {
        if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(apiError(error))));
      }
    }
    controller.dispose();
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text('จัดการร้านของฉัน'), actions: [IconButton(onPressed: () => context.push('/pharmacy/register'), icon: const Icon(Icons.add_business_outlined))]),
    body: _loading ? const PageLoading() : _error != null ? ErrorMessage(_error!, onRetry: _load) : _stores.isEmpty ? Center(child: Column(mainAxisSize: MainAxisSize.min, children: [const Text('ยังไม่มีร้านที่เปิดใช้งาน'), const SizedBox(height: 12), FilledButton(onPressed: () => context.push('/pharmacy/register'), child: const Text('ลงทะเบียนร้าน'))])) : ListView.separated(
      padding: const EdgeInsets.all(16), itemCount: _stores.length,
      separatorBuilder: (_, __) => const SizedBox(height: 10),
      itemBuilder: (context, index) {
        final store = _stores[index];
        return Card(child: Column(children: [
          ListTile(title: Text(store['pharmacy_name']?.toString() ?? 'ร้านยา', style: const TextStyle(fontWeight: FontWeight.w800)), subtitle: Text(store['phone']?.toString() ?? ''), leading: const Icon(Icons.storefront_outlined)),
          const Divider(height: 1),
          Wrap(spacing: 8, children: [
            TextButton.icon(onPressed: () => context.push('/pharmacy/${store['pharmacy_id']}/dashboard'), icon: const Icon(Icons.insights_outlined), label: const Text('แดชบอร์ด')),
            TextButton.icon(onPressed: () => context.push('/pharmacy/${store['pharmacy_id']}/manage-products'), icon: const Icon(Icons.inventory_2_outlined), label: const Text('สินค้า')),
            TextButton.icon(onPressed: () => context.push('/pharmacy/${store['pharmacy_id']}/orders'), icon: const Icon(Icons.receipt_long_outlined), label: const Text('คำสั่งซื้อ')),
            TextButton.icon(onPressed: () => _editPromptPay(store), icon: const Icon(Icons.qr_code_2), label: const Text('PromptPay')),
          ]),
        ]));
      },
    ),
  );
}

class PharmacyRegistrationScreen extends StatefulWidget {
  const PharmacyRegistrationScreen({super.key});
  @override
  State<PharmacyRegistrationScreen> createState() => _PharmacyRegistrationScreenState();
}

class _PharmacyRegistrationScreenState extends State<PharmacyRegistrationScreen> {
  final _name = TextEditingController();
  final _email = TextEditingController();
  final _phone = TextEditingController();
  final _latitude = TextEditingController();
  final _longitude = TextEditingController();
  bool _loading = false;
  bool _locating = false;
  Uint8List? _licenseBytes;
  String? _licenseName;
  String? _error;

  @override
  void dispose() { _name.dispose(); _email.dispose(); _phone.dispose(); _latitude.dispose(); _longitude.dispose(); super.dispose(); }

  Future<void> _submit() async {
    if (_licenseBytes == null || _licenseName == null) { setState(() => _error = 'กรุณาแนบใบประกอบวิชาชีพ'); return; }
    final latitude = double.tryParse(_latitude.text.trim());
    final longitude = double.tryParse(_longitude.text.trim());
    if ((_latitude.text.trim().isNotEmpty || _longitude.text.trim().isNotEmpty) &&
        (latitude == null || longitude == null || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180)) {
      setState(() => _error = 'กรุณาระบุละติจูด (-90 ถึง 90) และลองจิจูด (-180 ถึง 180) ให้ถูกต้อง');
      return;
    }
    setState(() { _loading = true; _error = null; });
    try {
      await ApiClient.instance.uploadBytes('/pharmacies/register', fieldName: 'license', bytes: _licenseBytes!, filename: _licenseName!, fields: {
        'pharmacy_name': _name.text.trim(),
        'email': _email.text.trim(),
        'phone': _phone.text.trim(),
        if (latitude != null && longitude != null) 'latitude': latitude.toString(),
        if (latitude != null && longitude != null) 'longitude': longitude.toString(),
      });
      if (mounted) { ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('ส่งคำขอลงทะเบียนแล้ว รอ Admin อนุมัติ'))); context.pop(); }
    } catch (error) { setState(() => _error = apiError(error)); }
    finally { if (mounted) setState(() => _loading = false); }
  }

  Future<void> _pickLicense() async {
    final image = await ImagePicker().pickImage(source: ImageSource.gallery, imageQuality: 85);
    if (image != null) {
      final bytes = await image.readAsBytes();
      if (mounted) setState(() { _licenseBytes = bytes; _licenseName = image.name; _error = null; });
    }
  }

  Future<void> _locate() async {
    setState(() { _locating = true; _error = null; });
    try {
      if (!await Geolocator.isLocationServiceEnabled()) throw Exception('กรุณาเปิด Location');
      var permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied || permission == LocationPermission.deniedForever) throw Exception('ไม่ได้รับอนุญาตให้เข้าถึงตำแหน่ง');
      final position = await Geolocator.getCurrentPosition();
      if (mounted) {
        setState(() {
          _latitude.text = position.latitude.toStringAsFixed(6);
          _longitude.text = position.longitude.toStringAsFixed(6);
        });
      }
    } catch (error) { if (mounted) setState(() => _error = error.toString().replaceFirst('Exception: ', '')); }
    finally { if (mounted) setState(() => _locating = false); }
  }

  @override
  Widget build(BuildContext context) => Scaffold(appBar: AppBar(title: const Text('ลงทะเบียนร้านยา')), body: ListView(padding: const EdgeInsets.all(20), children: [
    TextField(controller: _name, decoration: const InputDecoration(labelText: 'ชื่อร้าน')),
    const SizedBox(height: 12), TextField(controller: _phone, keyboardType: TextInputType.phone, decoration: const InputDecoration(labelText: 'เบอร์โทร')),
    const SizedBox(height: 12), TextField(controller: _email, keyboardType: TextInputType.emailAddress, decoration: const InputDecoration(labelText: 'อีเมล')),
    const SizedBox(height: 12), OutlinedButton.icon(onPressed: _pickLicense, icon: const Icon(Icons.upload_file), label: Text(_licenseBytes == null ? 'แนบใบประกอบวิชาชีพ' : 'เลือกรูปใบอนุญาตใหม่')),
    if (_licenseName != null) Padding(padding: const EdgeInsets.only(top: 8), child: Text(_licenseName!)),
    const SizedBox(height: 8), OutlinedButton.icon(onPressed: _locating ? null : _locate, icon: const Icon(Icons.my_location), label: Text(_locating ? 'กำลังค้นหาตำแหน่ง...' : _latitude.text.isEmpty || _longitude.text.isEmpty ? 'ใช้ตำแหน่งปัจจุบัน' : 'อัปเดตตำแหน่งปัจจุบัน')),
    const SizedBox(height: 8), TextField(controller: _latitude, keyboardType: const TextInputType.numberWithOptions(decimal: true, signed: true), decoration: const InputDecoration(labelText: 'ละติจูด')),
    const SizedBox(height: 8), TextField(controller: _longitude, keyboardType: const TextInputType.numberWithOptions(decimal: true, signed: true), decoration: const InputDecoration(labelText: 'ลองจิจูด')),
    if (_error != null) Padding(padding: const EdgeInsets.only(top: 12), child: Text(_error!, style: const TextStyle(color: Colors.red))),
    const SizedBox(height: 16), FilledButton(onPressed: _loading ? null : _submit, child: Text(_loading ? 'กำลังส่ง...' : 'ส่งคำขอ')),
  ]));
}
