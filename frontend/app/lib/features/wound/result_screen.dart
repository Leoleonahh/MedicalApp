import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/api_client.dart';
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

  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    try {
      final response = await ApiClient.instance.get('/api/wound/detail/${widget.imageId}');
      setState(() => _result = Map<String, dynamic>.from(response['data'] as Map? ?? {}));
    } catch (error) { setState(() => _error = apiError(error)); }
    finally { if (mounted) setState(() => _loading = false); }
  }

  void _openNearbyPharmacies(Map<String, dynamic> wound) {
    final queryParameters = <String, String>{'nearby': 'true'};
    if (wound['latitude'] != null && wound['longitude'] != null) {
      queryParameters['latitude'] = wound['latitude'].toString();
      queryParameters['longitude'] = wound['longitude'].toString();
    }
    context.go(Uri(path: '/shop', queryParameters: queryParameters).toString());
  }

  @override
  Widget build(BuildContext context) {
    final wound = Map<String, dynamic>.from(_result['wound'] as Map? ?? {});
    final prediction = Map<String, dynamic>.from(_result['prediction'] as Map? ?? {});
    final recommendation = Map<String, dynamic>.from(_result['recommendation'] as Map? ?? {});
    final image = wound['image_path']?.toString();
    final apiRoot = ApiClient.instance.dio.options.baseUrl;
    final medicines = (recommendation['pro_reccom']?.toString() ?? '').split(',').map((value) => value.trim()).where((value) => value.isNotEmpty).toList();
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
        Text('ความมั่นใจ ${prediction['confidence'] ?? '-'}% • ความเสี่ยง ${recommendation['risk'] ?? 'ไม่ระบุ'}'),
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
        for (final medicine in medicines) ListTile(contentPadding: EdgeInsets.zero, leading: const Icon(Icons.medication_outlined), title: Text(medicine)),
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
      const SizedBox(height: 12),
      OutlinedButton.icon(onPressed: () => _openNearbyPharmacies(wound), icon: const Icon(Icons.local_pharmacy_outlined), label: const Text('ร้านขายยาใกล้เคียง')),
      OutlinedButton.icon(onPressed: () => context.push('/hospital'), icon: const Icon(Icons.local_hospital_outlined), label: const Text('สถานพยาบาลใกล้เคียง')),
      OutlinedButton.icon(onPressed: () => launchUrl(Uri.parse('tel:1669')), icon: const Icon(Icons.call_outlined), label: const Text('โทรสายด่วน 1669')),
    ]));
  }
}
