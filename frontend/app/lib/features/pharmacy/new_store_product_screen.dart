import 'dart:typed_data';

import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';

import '../../core/api_client.dart';
import '../../core/widgets.dart';

class NewStoreProductScreen extends StatefulWidget {
  const NewStoreProductScreen({super.key, required this.pharmacyId});
  final String pharmacyId;
  @override
  State<NewStoreProductScreen> createState() => _NewStoreProductScreenState();
}

class _NewStoreProductScreenState extends State<NewStoreProductScreen> {
  final _name = TextEditingController();
  final _description = TextEditingController();
  final _price = TextEditingController();
  final _stock = TextEditingController();
  List<Map<String, dynamic>> _types = [];
  String? _typeId;
  Uint8List? _imageBytes;
  String? _imageName;
  bool _loading = false;
  bool _saving = false;
  String? _error;

  @override
  void initState() { super.initState(); _loadTypes(); }
  @override
  void dispose() { _name.dispose(); _description.dispose(); _price.dispose(); _stock.dispose(); super.dispose(); }

  Future<void> _loadTypes() async {
    try { final response = await ApiClient.instance.get('/pharmacies/products/types'); setState(() => _types = asMapList(response['data'])); }
    catch (error) { setState(() => _error = apiError(error)); }
    finally { if (mounted) setState(() => _loading = false); }
  }

  Future<void> _pickImage() async {
    final picked = await ImagePicker().pickImage(source: ImageSource.gallery, imageQuality: 85);
    if (picked != null) {
      final bytes = await picked.readAsBytes();
      if (mounted) setState(() { _imageBytes = bytes; _imageName = picked.name; _error = null; });
    }
  }

  Future<void> _save() async {
    if (_name.text.trim().isEmpty || _typeId == null || _price.text.isEmpty || _stock.text.isEmpty) { setState(() => _error = 'กรอกข้อมูลที่จำเป็นให้ครบ'); return; }
    setState(() { _saving = true; _error = null; });
    try {
      final form = FormData.fromMap({
        'product_name': _name.text.trim(),
        'description': _description.text.trim(),
        'typepro_id': _typeId,
        'price': _price.text,
        'stock': _stock.text,
        if (_imageBytes != null && _imageName != null)
          'image': MultipartFile.fromBytes(_imageBytes!, filename: _imageName!),
      });
      await ApiClient.instance.dio.post('/pharmacies/${widget.pharmacyId}/products', data: form);
      if (mounted) context.pop();
    } catch (error) { setState(() => _error = apiError(error)); }
    finally { if (mounted) setState(() => _saving = false); }
  }

  @override
  Widget build(BuildContext context) => Scaffold(appBar: AppBar(title: const Text('เพิ่มสินค้า')),
    body: _loading ? const PageLoading() : ListView(padding: const EdgeInsets.all(18), children: [
      TextField(controller: _name, maxLength: 150, decoration: const InputDecoration(labelText: 'ชื่อสินค้า')),
      const SizedBox(height: 12),
      DropdownButtonFormField<String>(initialValue: _typeId, decoration: const InputDecoration(labelText: 'ประเภทสินค้า'), items: _types.map((type) => DropdownMenuItem(value: '${type['typepro_id']}', child: Text('${type['type_name']}'))).toList(), onChanged: (value) => setState(() => _typeId = value)),
      const SizedBox(height: 12),
      TextField(controller: _description, minLines: 2, maxLines: 4, decoration: const InputDecoration(labelText: 'รายละเอียด')),
      const SizedBox(height: 12),
      TextField(controller: _price, keyboardType: const TextInputType.numberWithOptions(decimal: true), decoration: const InputDecoration(labelText: 'ราคา')),
      const SizedBox(height: 12),
      TextField(controller: _stock, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'จำนวนสินค้า (ชิ้น)')),
      const SizedBox(height: 12),
      OutlinedButton.icon(onPressed: _pickImage, icon: const Icon(Icons.image_outlined), label: Text(_imageBytes == null ? 'เลือกรูปสินค้า' : 'เลือกรูปใหม่')),
      if (_imageBytes != null) Padding(padding: const EdgeInsets.only(top: 12), child: ClipRRect(borderRadius: BorderRadius.circular(12), child: Image.memory(_imageBytes!, height: 180, fit: BoxFit.contain))),
      if (_error != null) Padding(padding: const EdgeInsets.only(top: 12), child: Text(_error!, style: const TextStyle(color: Colors.red))),
      const SizedBox(height: 18), FilledButton(onPressed: _saving ? null : _save, child: Text(_saving ? 'กำลังบันทึก...' : 'เพิ่มสินค้า')),
    ]));
}
