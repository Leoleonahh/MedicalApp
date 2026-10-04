import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../core/api_client.dart';
import '../../core/widgets.dart';

class StoreProductsScreen extends StatefulWidget {
  const StoreProductsScreen({super.key, required this.pharmacyId});
  final String pharmacyId;
  @override
  State<StoreProductsScreen> createState() => _StoreProductsScreenState();
}

class _StoreProductsScreenState extends State<StoreProductsScreen> {
  bool _loading = true;
  String? _error;
  List<Map<String, dynamic>> _products = [];

  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    try {
      final response = await ApiClient.instance.get('/pharmacies/${widget.pharmacyId}/products');
      setState(() => _products = asMapList(response['products'] ?? response['data']));
    } catch (error) { setState(() => _error = apiError(error)); }
    finally { if (mounted) setState(() => _loading = false); }
  }

  Future<void> _editProduct(Map<String, dynamic> product) async {
    final priceController = TextEditingController(text: '${product['price'] ?? 0}');
    final stockController = TextEditingController(text: '${product['stock'] ?? 0}');
    final shouldSave = await showDialog<bool>(context: context, builder: (context) => AlertDialog(
      title: Text('แก้ไข ${product['product_name'] ?? 'สินค้า'}'),
      content: Column(mainAxisSize: MainAxisSize.min, children: [
        TextField(controller: priceController, keyboardType: const TextInputType.numberWithOptions(decimal: true), decoration: const InputDecoration(labelText: 'ราคา')),
        const SizedBox(height: 12),
        TextField(controller: stockController, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'จำนวน (ชิ้น)')),
      ]),
      actions: [TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('ยกเลิก')), FilledButton(onPressed: () => Navigator.pop(context, true), child: const Text('บันทึก'))],
    ));

    if (shouldSave != true) {
      priceController.dispose();
      stockController.dispose();
      return;
    }

    try {
      final updated = await ApiClient.instance.put('/pharmacies/${widget.pharmacyId}/products/${product['pharmacy_product_id']}', data: {
        'price': double.tryParse(priceController.text) ?? 0,
        'stock': int.tryParse(stockController.text) ?? 0,
      });
      final data = Map<String, dynamic>.from(updated['data'] as Map? ?? {});
      setState(() => _products = _products.map((item) => item['pharmacy_product_id'] == product['pharmacy_product_id']
          ? {...item, 'price': data['price'] ?? priceController.text, 'stock': data['stock'] ?? stockController.text}
          : item).toList());
    } catch (error) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(apiError(error))));
    } finally {
      priceController.dispose();
      stockController.dispose();
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text('จัดการสินค้า'), actions: [IconButton(onPressed: () => context.push('/pharmacy/${widget.pharmacyId}/manage-products/new'), icon: const Icon(Icons.add))]),
    body: _loading ? const PageLoading() : _error != null ? ErrorMessage(_error!, onRetry: _load) : ListView.separated(
      padding: const EdgeInsets.all(16), itemCount: _products.length,
      separatorBuilder: (_, __) => const SizedBox(height: 8),
      itemBuilder: (context, index) { final item = _products[index]; return Card(child: ListTile(
        title: Text(item['product_name']?.toString() ?? '-', style: const TextStyle(fontWeight: FontWeight.w700)),
        subtitle: Text('${item['type'] ?? ''} • stock ${item['stock'] ?? 0} ชิ้น'),
        trailing: Row(mainAxisSize: MainAxisSize.min, children: [Text('฿${item['price'] ?? 0}'), IconButton(onPressed: () => _editProduct(item), icon: const Icon(Icons.edit_outlined))]),
      )); },
    ),
  );
}
