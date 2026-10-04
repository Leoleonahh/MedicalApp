import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:geolocator/geolocator.dart';
import 'package:image_picker/image_picker.dart';

import '../../core/api_client.dart';

class PredictScreen extends StatefulWidget {
  const PredictScreen({super.key});
  @override
  State<PredictScreen> createState() => _PredictScreenState();
}

class _PredictScreenState extends State<PredictScreen> {
  final _symptom = TextEditingController();
  final _site = TextEditingController();
  Uint8List? _imageBytes;
  String? _imageName;
  DateTime? _incidentDate;
  Position? _position;
  bool _loading = false;
  bool _locating = false;
  String? _error;

  @override
  void dispose() { _symptom.dispose(); _site.dispose(); super.dispose(); }

  Future<void> _pickImage() async {
    final picked = await ImagePicker().pickImage(source: ImageSource.gallery, imageQuality: 85);
    if (picked != null) {
      final bytes = await picked.readAsBytes();
      setState(() { _imageBytes = bytes; _imageName = picked.name; _error = null; });
    }
  }

  Future<void> _getLocation() async {
    setState(() { _locating = true; _error = null; });
    try {
      if (!await Geolocator.isLocationServiceEnabled()) throw Exception('กรุณาเปิด Location ของอุปกรณ์');
      var permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied || permission == LocationPermission.deniedForever) throw Exception('ไม่ได้รับอนุญาตให้เข้าถึงตำแหน่ง');
      final position = await Geolocator.getCurrentPosition();
      setState(() => _position = position);
    } catch (error) { setState(() => _error = error.toString().replaceFirst('Exception: ', '')); }
    finally { if (mounted) setState(() => _locating = false); }
  }

  Future<void> _submit() async {
    if (_imageBytes == null || _imageName == null) { setState(() => _error = 'กรุณาเลือกรูปบาดแผล'); return; }
    setState(() { _loading = true; _error = null; });
    try {
      final response = await ApiClient.instance.uploadBytes('/api/wound/upload', fieldName: 'image', bytes: _imageBytes!, filename: _imageName!, fields: {
        'associated_symptom': _symptom.text.trim(),
        'wound_site': _site.text.trim(),
        if (_incidentDate != null) 'incident_date': _incidentDate!.toIso8601String().split('T').first,
        if (_position != null) 'latitude': _position!.latitude.toString(),
        if (_position != null) 'longitude': _position!.longitude.toString(),
      });
      final data = Map<String, dynamic>.from(response['data'] as Map? ?? {});
      final imageId = data['image_id'];
      if (imageId == null) throw Exception('อัปโหลดสำเร็จแต่ไม่ได้รับ image_id');
      if (mounted) context.go('/result/$imageId');
    } catch (error) { setState(() => _error = apiError(error)); }
    finally { if (mounted) setState(() => _loading = false); }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text('วิเคราะห์บาดแผล')),
    body: ListView(padding: const EdgeInsets.all(18), children: [
      InkWell(onTap: _pickImage, borderRadius: BorderRadius.circular(18), child: Container(
        height: 230, decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(18), border: Border.all(color: const Color(0xFFEFE5EA))),
        child: _imageBytes == null ? const Column(mainAxisAlignment: MainAxisAlignment.center, children: [Icon(Icons.add_photo_alternate_outlined, size: 42), SizedBox(height: 8), Text('เลือกรูปบาดแผล')]) : ClipRRect(borderRadius: BorderRadius.circular(18), child: Image.memory(_imageBytes!, fit: BoxFit.contain)),
      )),
      const SizedBox(height: 18),
      TextField(controller: _symptom, decoration: const InputDecoration(labelText: 'อาการแทรกซ้อน (ไม่บังคับ)')),
      const SizedBox(height: 12),
      TextField(controller: _site, decoration: const InputDecoration(labelText: 'ตำแหน่งของบาดแผล (ไม่บังคับ)')),
      const SizedBox(height: 12),
      OutlinedButton.icon(onPressed: () async { final date = await showDatePicker(context: context, initialDate: DateTime.now(), firstDate: DateTime(1950), lastDate: DateTime.now()); if (date != null) setState(() => _incidentDate = date); }, icon: const Icon(Icons.calendar_today_outlined), label: Text(_incidentDate == null ? 'เลือกวันที่เกิดแผล' : '${_incidentDate!.day}/${_incidentDate!.month}/${_incidentDate!.year}')),
      OutlinedButton.icon(onPressed: _locating ? null : _getLocation, icon: const Icon(Icons.my_location), label: Text(_locating ? 'กำลังค้นหาตำแหน่ง...' : _position == null ? 'เพิ่มตำแหน่งปัจจุบัน (ไม่บังคับ)' : '${_position!.latitude.toStringAsFixed(5)}, ${_position!.longitude.toStringAsFixed(5)}')),
      if (_error != null) Padding(padding: const EdgeInsets.symmetric(vertical: 12), child: Text(_error!, style: const TextStyle(color: Colors.red))),
      const SizedBox(height: 10),
      FilledButton(onPressed: _loading ? null : _submit, child: Text(_loading ? 'กำลังวิเคราะห์...' : 'วิเคราะห์บาดแผล')),
    ]),
  );
}
