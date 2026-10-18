import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../core/api_client.dart';
import '../../core/widgets.dart';

class HistoryScreen extends StatefulWidget {
  const HistoryScreen({super.key});

  @override
  State<HistoryScreen> createState() => _HistoryScreenState();
}

class _HistoryScreenState extends State<HistoryScreen> {
  bool _loading = true;
  String? _error;
  List<Map<String, dynamic>> _records = [];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() { _loading = true; _error = null; });
    try {
      final response = await ApiClient.instance.get('/api/wound/history/list/all');
      final data = response['data'];
      setState(() => _records = asMapList(data is Map ? data['data'] : data));
    } catch (error) {
      setState(() => _error = apiError(error));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  String _formatDate(dynamic value) {
    if (value == null || value.toString().isEmpty) return '-';
    final date = DateTime.tryParse(value.toString());
    if (date == null) return '-';
    final buddhistYear = date.year + 543;
    return '${date.day.toString().padLeft(2, '0')}/${date.month.toString().padLeft(2, '0')}/$buddhistYear';
  }

  @override
  Widget build(BuildContext context) {
    final apiRoot = ApiClient.instance.dio.options.baseUrl;
    return Scaffold(
      appBar: AppBar(title: const Text('ประวัติบาดแผล'), actions: [IconButton(onPressed: _load, icon: const Icon(Icons.refresh))]),
      body: _loading
          ? const PageLoading()
          : _error != null
              ? ErrorMessage(_error!, onRetry: _load)
              : _records.isEmpty
                  ? const Center(child: Text('ยังไม่มีประวัติบาดแผล'))
                  : RefreshIndicator(
                      onRefresh: _load,
                      child: ListView.separated(
                        padding: const EdgeInsets.all(18),
                        itemCount: _records.length,
                        separatorBuilder: (_, __) => const SizedBox(height: 10),
                        itemBuilder: (context, index) {
                          final item = _records[index];
                          final imageId = item['image_id'] ?? item['id'];
                          final imagePath = item['image_path']?.toString();
                          final prediction = Map<String, dynamic>.from(item['latest_prediction'] as Map? ?? {});
                          final label = prediction['predict_label']?.toString();
                          final woundSite = item['wound_site']?.toString();
                          return Card(
                            child: InkWell(
                              borderRadius: BorderRadius.circular(18),
                              onTap: imageId == null ? null : () => context.push('/result/$imageId'),
                              child: Padding(
                                padding: const EdgeInsets.all(14),
                                child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                                  ClipRRect(
                                    borderRadius: BorderRadius.circular(10),
                                    child: imagePath == null || imagePath.isEmpty
                                        ? Container(width: 88, height: 88, color: Colors.black12, child: const Icon(Icons.healing_outlined))
                                        : Image.network(
                                            '$apiRoot/wounds/${Uri.encodeComponent(imagePath)}',
                                            width: 88,
                                            height: 88,
                                            fit: BoxFit.cover,
                                            errorBuilder: (_, __, ___) => Container(width: 88, height: 88, color: Colors.black12, child: const Icon(Icons.image_not_supported_outlined)),
                                          ),
                                  ),
                                  const SizedBox(width: 14),
                                  Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                                    if (label != null && label.isNotEmpty) ...[
                                      Text(label, style: const TextStyle(fontWeight: FontWeight.w800)),
                                      const SizedBox(height: 8),
                                    ],
                                    _HistoryDateRow(label: 'วันที่อัปโหลด', value: _formatDate(item['upload_date'])),
                                    const SizedBox(height: 4),
                                    _HistoryDateRow(
                                      label: 'วันที่เกิดบาดแผล',
                                      value: item['incident_date'] == null ? 'ไม่ได้ระบุ' : _formatDate(item['incident_date']),
                                    ),
                                    if (woundSite != null && woundSite.isNotEmpty) ...[
                                      const SizedBox(height: 6),
                                      Text('ตำแหน่ง: $woundSite', maxLines: 2, overflow: TextOverflow.ellipsis),
                                    ],
                                  ])),
                                  const Padding(padding: EdgeInsets.only(top: 30), child: Icon(Icons.chevron_right)),
                                ]),
                              ),
                            ),
                          );
                        },
                      ),
                    ),
    );
  }
}

class _HistoryDateRow extends StatelessWidget {
  const _HistoryDateRow({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) => Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: const TextStyle(color: Colors.black54, fontSize: 12)),
          Text(value, style: const TextStyle(fontWeight: FontWeight.w600)),
        ],
      );
}
