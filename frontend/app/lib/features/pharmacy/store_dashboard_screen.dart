import 'package:flutter/material.dart';

import '../../core/api_client.dart';
import '../../core/widgets.dart';

class StoreDashboardScreen extends StatefulWidget {
  const StoreDashboardScreen({super.key, required this.pharmacyId});

  final String pharmacyId;

  @override
  State<StoreDashboardScreen> createState() => _StoreDashboardScreenState();
}

class _StoreDashboardScreenState extends State<StoreDashboardScreen> {
  bool _loading = true;
  String? _error;
  double _totalSales = 0;
  List<Map<String, dynamic>> _monthlySales = [];
  List<Map<String, dynamic>> _bestSellingProducts = [];

  @override
  void initState() {
    super.initState();
    _load();
  }

  double _number(Object? value) => double.tryParse('$value') ?? 0;

  Future<void> _load() async {
    setState(() { _loading = true; _error = null; });
    try {
      final response = await ApiClient.instance.get('/orders/pharmacy/${widget.pharmacyId}/orders');
      final deliveredOrders = asMapList(response['data'])
          .where((order) => order['order_status'] == 'DELIVERED')
          .toList();
      final ordersWithItems = await Future.wait(deliveredOrders.map((order) async {
        final detail = await ApiClient.instance.get('/orders/pharmacy/orders/${order['order_id']}');
        final data = Map<String, dynamic>.from(detail['data'] as Map? ?? {});
        return {
          ...order,
          'items': asMapList(data['items']),
        };
      }));

      var totalSales = 0.0;
      final monthlySales = <String, double>{};
      final productSales = <String, Map<String, num>>{};
      for (final order in ordersWithItems) {
        final orderTotal = _number(order['grand_total']);
        totalSales += orderTotal;
        final createdAt = DateTime.tryParse(order['created_at']?.toString() ?? '');
        if (createdAt != null) {
          final monthKey = '${createdAt.year}-${createdAt.month.toString().padLeft(2, '0')}';
          monthlySales.update(monthKey, (sales) => sales + orderTotal, ifAbsent: () => orderTotal);
        }

        for (final item in asMapList(order['items'])) {
          final name = item['product_name']?.toString() ?? 'ไม่ระบุชื่อสินค้า';
          final quantity = _number(item['quantity']);
          final product = productSales.putIfAbsent(name, () => {'quantity': 0, 'sales': 0});
          product['quantity'] = (product['quantity'] ?? 0) + quantity;
          product['sales'] = (product['sales'] ?? 0) + _number(item['subtotal']);
        }
      }

      final monthlySummary = monthlySales.entries.toList()
        ..sort((first, second) => second.key.compareTo(first.key));
      final bestSelling = productSales.entries.map((entry) => {
        'name': entry.key,
        ...entry.value,
      }).toList()
        ..sort((first, second) => _number(second['quantity']).compareTo(_number(first['quantity'])));

      if (!mounted) return;
      setState(() {
        _totalSales = totalSales;
        _monthlySales = monthlySummary.map((entry) => {
          'month': '${entry.key.substring(5)}/${entry.key.substring(0, 4)}',
          'sales': entry.value,
        }).toList();
        _bestSellingProducts = bestSelling.take(5).toList();
      });
    } catch (error) {
      if (mounted) setState(() => _error = apiError(error));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  String _money(Object? value) => _number(value).toStringAsFixed(2);

  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: AppBar(
          title: const Text('แดชบอร์ดร้านค้า'),
          actions: [IconButton(onPressed: _load, tooltip: 'รีเฟรช', icon: const Icon(Icons.refresh))],
        ),
        body: _loading
            ? const PageLoading()
            : _error != null
                ? ErrorMessage(_error!, onRetry: _load)
                : RefreshIndicator(
                    onRefresh: _load,
                    child: ListView(
                      physics: const AlwaysScrollableScrollPhysics(),
                      padding: const EdgeInsets.all(16),
                      children: [
                        Card(child: Padding(
                          padding: const EdgeInsets.all(18),
                          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                            const Text('ยอดขายรวมจากคำสั่งซื้อที่จัดส่งแล้ว'),
                            const SizedBox(height: 8),
                            Text('฿${_money(_totalSales)}', style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w800)),
                          ]),
                        )),
                        const SizedBox(height: 18),
                        Text('ยอดขายรายเดือน', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w800)),
                        const SizedBox(height: 8),
                        if (_monthlySales.isEmpty)
                          const ListTile(title: Text('ยังไม่มีข้อมูลยอดขาย'))
                        else
                          for (final month in _monthlySales)
                            ListTile(
                              contentPadding: EdgeInsets.zero,
                              title: Text(month['month'].toString()),
                              trailing: Text('฿${_money(month['sales'])}', style: const TextStyle(fontWeight: FontWeight.w700)),
                            ),
                        const SizedBox(height: 16),
                        Text('สินค้าที่ขายดีที่สุด', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w800)),
                        const SizedBox(height: 8),
                        if (_bestSellingProducts.isEmpty)
                          const ListTile(title: Text('ยังไม่มีข้อมูลสินค้า'))
                        else
                          for (var index = 0; index < _bestSellingProducts.length; index++)
                            ListTile(
                              contentPadding: EdgeInsets.zero,
                              leading: CircleAvatar(child: Text('${index + 1}')),
                              title: Text(_bestSellingProducts[index]['name'].toString()),
                              subtitle: Text('ขายแล้ว ${_number(_bestSellingProducts[index]['quantity']).toStringAsFixed(0)} ชิ้น'),
                              trailing: Text('฿${_money(_bestSellingProducts[index]['sales'])}'),
                            ),
                      ],
                    ),
                  ),
      );
}
