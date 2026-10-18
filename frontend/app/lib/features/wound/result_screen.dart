import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:geolocator/geolocator.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/api_client.dart';
import '../../core/theme.dart';
import '../../core/widgets.dart';

class ResultScreen extends StatefulWidget {
  const ResultScreen({super.key, required this.imageId});
  final String imageId;
  @override
  State<ResultScreen> createState() => _ResultScreenState();
}

class _ResultScreenState extends State<ResultScreen> {
  bool _loading = true;
  String? _error;
  Map<String, dynamic> _result = {};
  final Set<String> _selectedMedicines = {};

  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    try {
      final response = await ApiClient.instance.get('/api/wound/detail/${widget.imageId}');
      setState(() => _result = Map<String, dynamic>.from(response['data'] as Map? ?? {}));
    } catch (error) { setState(() => _error = apiError(error)); }
    finally { if (mounted) setState(() => _loading = false); }
  }

  Future<void> _openNearbyPharmacies(Map<String, dynamic> wound) async {
    final queryParameters = <String, dynamic>{'nearby': 'true'};
    var latitude = double.tryParse('${wound['latitude']}');
    var longitude = double.tryParse('${wound['longitude']}');
    if (latitude == null || longitude == null) {
      try {
        if (!await Geolocator.isLocationServiceEnabled()) {
          throw Exception('กรุณาเปิด Location เพื่อค้นหาร้านขายยาใกล้เคียง');
        }
        var permission = await Geolocator.checkPermission();
        if (permission == LocationPermission.denied) {
          permission = await Geolocator.requestPermission();
        }
        if (permission == LocationPermission.denied || permission == LocationPermission.deniedForever) {
          throw Exception('ไม่ได้รับอนุญาตให้เข้าถึงตำแหน่ง');
        }
        final position = await Geolocator.getCurrentPosition();
        latitude = position.latitude;
        longitude = position.longitude;
      } catch (error) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(error.toString().replaceFirst('Exception: ', ''))),
          );
        }
        return;
      }
    }
    queryParameters['latitude'] = latitude.toString();
    queryParameters['longitude'] = longitude.toString();
    if (_selectedMedicines.isNotEmpty) {
      queryParameters['medicine'] = _selectedMedicines.toList();
    }
    if (!mounted) return;
    context.go(Uri(path: '/shop', queryParameters: queryParameters).toString());
  }

  Future<void> _showHotlines() async {
    await showDialog<void>(
      context: context,
      builder: (dialogContext) => Dialog(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(children: [
                const Expanded(child: Text('สายด่วนฉุกเฉิน', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800))),
                IconButton(onPressed: () => Navigator.pop(dialogContext), tooltip: 'ปิด', icon: const Icon(Icons.close)),
              ]),
              const SizedBox(height: 8),
              const Text('อุบัติเหตุ เจ็บป่วยฉุกเฉิน'),
              const SizedBox(height: 18),
              SizedBox(
                width: double.infinity,
                child: FilledButton.icon(
                  onPressed: () => launchUrl(Uri(scheme: 'tel', path: '1669')),
                  icon: const Icon(Icons.call_outlined),
                  label: const Text('โทร 1669'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final wound = Map<String, dynamic>.from(_result['wound'] as Map? ?? {});
    final prediction = Map<String, dynamic>.from(_result['prediction'] as Map? ?? {});
    final recommendation = Map<String, dynamic>.from(_result['recommendation'] as Map? ?? {});
    final image = wound['image_path']?.toString();
    final apiRoot = ApiClient.instance.dio.options.baseUrl;
    final medicines = (recommendation['pro_reccom']?.toString() ?? '').split(',').map((value) => value.trim()).where((value) => value.isNotEmpty).toList();
    final confidence = double.tryParse('${prediction['confidence']}');
    final label = prediction['predict_label']?.toString() ?? '';
    final isLargeCut = prediction['length'] == 'ยาว' && prediction['depth'] == 'ลึก';
    final references = label.contains('แผลฉีกขาด')
      ? [
        ['NHS: Cuts and grazes', 'https://www.nhs.uk/conditions/cuts-and-grazes/'],
        ['MedlinePlus: Cuts and puncture wounds', 'https://medlineplus.gov/ency/article/000043.htm'],
        if (isLargeCut) ['American Red Cross: Wounds', 'https://www.redcross.org/take-a-class/resources/learn-first-aid/wounds'],
        ]
      : label.contains('แผลถลอก')
        ? [['NHS: Cuts and grazes', 'https://www.nhs.uk/conditions/cuts-and-grazes/'], ['MedlinePlus: Cuts and puncture wounds', 'https://medlineplus.gov/ency/article/000043.htm']]
        : label.contains('แผลน้ำร้อนลวก')
          ? [['NHS: Burns and scalds', 'https://www.nhs.uk/conditions/burns-and-scalds/'], ['ศิริราชพยาบาล: แผลไฟไหม้น้ำร้อนลวก', 'https://www.si.mahidol.ac.th/sirirajdoctor/article_detail.aspx?ID=911']]
          : label.contains('แผลฟกช้ำ')
            ? [['MedlinePlus: Bruises', 'https://medlineplus.gov/woundsandinjuries.html'], ['American Red Cross: Wounds', 'https://www.redcross.org/take-a-class/resources/learn-first-aid/wounds']]
            : <List<String>>[];

    return Scaffold(appBar: AppBar(title: const Text('ผลวิเคราะห์')), body: _loading ? const PageLoading() : _error != null ? ErrorMessage(_error!, onRetry: _load) : ListView(padding: const EdgeInsets.all(18), children: [
      if (image != null) ClipRRect(borderRadius: BorderRadius.circular(18), child: Image.network('$apiRoot/wounds/$image', height: 220, fit: BoxFit.contain, errorBuilder: (_, __, ___) => const SizedBox(height: 100, child: Icon(Icons.image_not_supported_outlined)))),
      const SizedBox(height: 16),
      Card(child: Padding(padding: const EdgeInsets.all(18), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(prediction['predict_label']?.toString() ?? 'ไม่พบผลประเมิน', style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 21)),
        const SizedBox(height: 6),
        Text('ความเชื่อมั่น ${confidence?.toStringAsFixed(2) ?? '-'}%'),
      ]))),
      const SizedBox(height: 14),
      Card(child: Padding(padding: const EdgeInsets.all(18), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        const Text('วิธีปฐมพยาบาล', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800)),
        const SizedBox(height: 8),
        for (final step in (recommendation['recommend_text']?.toString() ?? '').split('\n').where((line) => line.trim().isNotEmpty)) Padding(padding: const EdgeInsets.symmetric(vertical: 4), child: Text('• $step')),
        if (recommendation['warning_note'] != null) Padding(padding: const EdgeInsets.only(top: 10), child: Text(recommendation['warning_note'].toString(), style: const TextStyle(color: Colors.black54))),
      ]))),
      const SizedBox(height: 14),
      Card(child: Padding(padding: const EdgeInsets.all(18), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        const Text('ยาและเวชภัณฑ์แนะนำ', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800)),
        if (medicines.isEmpty) const Text('ไม่มีข้อมูลยาที่แนะนำ')
        else for (final medicine in medicines) CheckboxListTile(
          contentPadding: EdgeInsets.zero,
          controlAffinity: ListTileControlAffinity.leading,
          value: _selectedMedicines.contains(medicine),
          title: Text(medicine),
          onChanged: (selected) => setState(() {
            if (selected == true) {
              _selectedMedicines.add(medicine);
            } else {
              _selectedMedicines.remove(medicine);
            }
          }),
        ),
      ]))),
      if (references.isNotEmpty) ...[
        const SizedBox(height: 14),
        Card(child: Padding(padding: const EdgeInsets.all(18), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          const Text('แหล่งอ้างอิง', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800)),
          for (final reference in references) ListTile(
            contentPadding: EdgeInsets.zero,
            leading: const Icon(Icons.open_in_new),
            title: Text(reference[0]),
            onTap: () => launchUrl(Uri.parse(reference[1]), mode: LaunchMode.externalApplication),
          ),
        ]))),
      ],
      const SizedBox(height: 8),
      const Text('ความช่วยเหลือเพิ่มเติม', style: TextStyle(fontSize: 17, fontWeight: FontWeight.w800)),
      const SizedBox(height: 12),
      SizedBox(
        width: double.infinity,
        height: 54,
        child: FilledButton.icon(
          onPressed: () => _openNearbyPharmacies(wound),
          icon: const Icon(Icons.local_pharmacy_outlined),
          label: const Text('ค้นหาร้านขายยาใกล้เคียง'),
        ),
      ),
      const SizedBox(height: 10),
      SizedBox(
        width: double.infinity,
        height: 54,
        child: OutlinedButton.icon(
          onPressed: () => context.push('/hospital'),
          icon: const Icon(Icons.local_hospital_outlined),
          label: const Text('ค้นหาสถานพยาบาลใกล้เคียง'),
        ),
      ),
      const SizedBox(height: 10),
      SizedBox(
        width: double.infinity,
        height: 54,
        child: FilledButton.icon(
          style: FilledButton.styleFrom(backgroundColor: AppColors.danger, foregroundColor: Colors.white),
          onPressed: _showHotlines,
          icon: const Icon(Icons.call_outlined),
          label: const Text('สายด่วนฉุกเฉิน 1669'),
        ),
      ),
    ]));
  }
}
