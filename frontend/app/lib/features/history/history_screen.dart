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
                          final label = item['predict_label'] ?? item['wound_type'] ?? 'ผลประเมินบาดแผล';
                          final imagePath = item['image_path']?.toString();
                          return Card(child: ListTile(
                            leading: imagePath == null || imagePath.isEmpty
                                ? const CircleAvatar(child: Icon(Icons.healing_outlined))
                                : ClipRRect(
                                    borderRadius: BorderRadius.circular(8),
                                    child: Image.network(
                                      '$apiRoot/wounds/${Uri.encodeComponent(imagePath)}',
                                      width: 52,
                                      height: 52,
                                      fit: BoxFit.cover,
                                      errorBuilder: (_, __, ___) => const SizedBox(
                                        width: 52,
                                        height: 52,
                                        child: Icon(Icons.image_not_supported_outlined),
                                      ),
                                    ),
                                  ),
                            title: Text(label.toString(), style: const TextStyle(fontWeight: FontWeight.w700)),
                            subtitle: Text(item['created_at']?.toString() ?? item['upload_date']?.toString() ?? ''),
                            trailing: const Icon(Icons.chevron_right),
                            onTap: imageId == null ? null : () => context.push('/result/$imageId'),
                          ));
                        },
                      ),
                    ),
    );
  }
}
