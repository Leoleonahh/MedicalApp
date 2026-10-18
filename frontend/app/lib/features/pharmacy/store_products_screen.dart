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
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final response = await ApiClient.instance.get(
        '/pharmacies/${widget.pharmacyId}/products',
      );
      setState(
        () => _products = asMapList(response['products'] ?? response['data']),
      );
    } catch (error) {
      setState(() => _error = apiError(error));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _editProduct(Map<String, dynamic> product) async {
    final canEditDescription =
        product['created_by_pharmacy_id']?.toString() == widget.pharmacyId;
    final values = await showDialog<_ProductEditValues>(
      context: context,
      builder: (_) => _EditProductDialog(
        product: product,
        canEditDescription: canEditDescription,
      ),
    );
    if (values == null) {
      return;
    }

    try {
      final updateData = <String, dynamic>{
        'price': double.tryParse(values.price) ?? 0,
        'stock': int.tryParse(values.stock) ?? 0,
      };
      if (canEditDescription) {
        updateData['description'] = values.description.trim();
      }
      final updated = await ApiClient.instance.put(
        '/pharmacies/${widget.pharmacyId}/products/${product['pharmacy_product_id']}',
        data: updateData,
      );
      final data = Map<String, dynamic>.from(updated['data'] as Map? ?? {});
      if (!mounted) {
        return;
      }
      setState(
        () => _products = _products
            .map(
              (item) =>
                  item['pharmacy_product_id'] == product['pharmacy_product_id']
                  ? {
                      ...item,
                      'price': data['price'] ?? values.price,
                      'stock': data['stock'] ?? values.stock,
                      if (canEditDescription)
                        'description':
                            data['description'] ?? values.description.trim(),
                    }
                  : item,
            )
            .toList(),
      );
    } catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text(apiError(error))));
      }
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(
      title: const Text('จัดการสินค้า'),
      actions: [
        IconButton(
          onPressed: () => context.push(
            '/pharmacy/${widget.pharmacyId}/manage-products/new',
          ),
          icon: const Icon(Icons.add),
        ),
      ],
    ),
    body: _loading
        ? const PageLoading()
        : _error != null
        ? ErrorMessage(_error!, onRetry: _load)
        : ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: _products.length,
            separatorBuilder: (_, __) => const SizedBox(height: 8),
            itemBuilder: (context, index) {
              final item = _products[index];
              final description = item['description']?.toString().trim();
              return Card(
                child: ListTile(
                  title: Text(
                    item['product_name']?.toString() ?? '-',
                    style: const TextStyle(fontWeight: FontWeight.w700),
                  ),
                  subtitle: Text(
                    '${description == null || description.isEmpty ? 'ไม่มีรายละเอียดสินค้า' : description}\n${item['type'] ?? ''} • stock ${item['stock'] ?? 0} ชิ้น',
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  isThreeLine: true,
                  trailing: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text('฿${item['price'] ?? 0}'),
                      IconButton(
                        onPressed: () => _editProduct(item),
                        icon: const Icon(Icons.edit_outlined),
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
  );
}

class _ProductEditValues {
  const _ProductEditValues({
    required this.description,
    required this.price,
    required this.stock,
  });

  final String description;
  final String price;
  final String stock;
}

class _EditProductDialog extends StatefulWidget {
  const _EditProductDialog({
    required this.product,
    required this.canEditDescription,
  });

  final Map<String, dynamic> product;
  final bool canEditDescription;

  @override
  State<_EditProductDialog> createState() => _EditProductDialogState();
}

class _EditProductDialogState extends State<_EditProductDialog> {
  late final TextEditingController _descriptionController;
  late final TextEditingController _priceController;
  late final TextEditingController _stockController;

  @override
  void initState() {
    super.initState();
    _descriptionController = TextEditingController(
      text: widget.product['description']?.toString() ?? '',
    );
    _priceController = TextEditingController(
      text: '${widget.product['price'] ?? 0}',
    );
    _stockController = TextEditingController(
      text: '${widget.product['stock'] ?? 0}',
    );
  }

  @override
  void dispose() {
    _descriptionController.dispose();
    _priceController.dispose();
    _stockController.dispose();
    super.dispose();
  }

  void _save() {
    Navigator.pop(
      context,
      _ProductEditValues(
        description: _descriptionController.text,
        price: _priceController.text,
        stock: _stockController.text,
      ),
    );
  }

  @override
  Widget build(BuildContext context) => AlertDialog(
    title: Text('แก้ไข ${widget.product['product_name'] ?? 'สินค้า'}'),
    content: SingleChildScrollView(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          TextField(
            controller: _descriptionController,
            minLines: 2,
            maxLines: 4,
            readOnly: !widget.canEditDescription,
            decoration: const InputDecoration(labelText: 'รายละเอียดสินค้า'),
          ),
          if (!widget.canEditDescription)
            const Padding(
              padding: EdgeInsets.only(top: 6),
              child: Text(
                'ร้านนี้ไม่ได้เป็นผู้สร้างสินค้า จึงแก้ไขรายละเอียดไม่ได้',
                style: TextStyle(color: Colors.black54),
              ),
            ),
          const SizedBox(height: 12),
          TextField(
            controller: _priceController,
            keyboardType: const TextInputType.numberWithOptions(decimal: true),
            decoration: const InputDecoration(labelText: 'ราคา'),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _stockController,
            keyboardType: TextInputType.number,
            decoration: const InputDecoration(labelText: 'จำนวน (ชิ้น)'),
          ),
        ],
      ),
    ),
    actions: [
      TextButton(
        onPressed: () => Navigator.pop(context),
        child: const Text('ยกเลิก'),
      ),
      FilledButton(onPressed: _save, child: const Text('บันทึก')),
    ],
  );
}
