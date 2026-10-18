import 'dart:math' as math;

import 'package:flutter/material.dart';

import '../../core/api_client.dart';
import '../../core/theme.dart';
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

  static const _thaiMonthAbbreviations = [
    'ม.ค.',
    'ก.พ.',
    'มี.ค.',
    'เม.ย.',
    'พ.ค.',
    'มิ.ย.',
    'ก.ค.',
    'ส.ค.',
    'ก.ย.',
    'ต.ค.',
    'พ.ย.',
    'ธ.ค.',
  ];

  @override
  void initState() {
    super.initState();
    _load();
  }

  double _number(Object? value) => double.tryParse('$value') ?? 0;

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final response = await ApiClient.instance.get(
        '/orders/pharmacy/${widget.pharmacyId}/orders',
      );
      final deliveredOrders = asMapList(
        response['data'],
      ).where((order) => order['order_status'] == 'DELIVERED').toList();
      final ordersWithItems = await Future.wait(
        deliveredOrders.map((order) async {
          final detail = await ApiClient.instance.get(
            '/orders/pharmacy/orders/${order['order_id']}',
          );
          final data = Map<String, dynamic>.from(detail['data'] as Map? ?? {});
          return {...order, 'items': asMapList(data['items'])};
        }),
      );

      var totalSales = 0.0;
      final monthlySales = <String, double>{};
      final productSales = <String, Map<String, num>>{};
      for (final order in ordersWithItems) {
        final orderTotal = _number(order['grand_total']);
        totalSales += orderTotal;
        final createdAt = DateTime.tryParse(
          order['created_at']?.toString() ?? '',
        );
        if (createdAt != null) {
          final monthKey =
              '${createdAt.year}-${createdAt.month.toString().padLeft(2, '0')}';
          monthlySales.update(
            monthKey,
            (sales) => sales + orderTotal,
            ifAbsent: () => orderTotal,
          );
        }

        for (final item in asMapList(order['items'])) {
          final name = item['product_name']?.toString() ?? 'ไม่ระบุชื่อสินค้า';
          final quantity = _number(item['quantity']);
          final product = productSales.putIfAbsent(
            name,
            () => {'quantity': 0, 'sales': 0},
          );
          product['quantity'] = (product['quantity'] ?? 0) + quantity;
          product['sales'] =
              (product['sales'] ?? 0) + _number(item['subtotal']);
        }
      }

      final monthlySummary = monthlySales.entries.toList()
        ..sort((first, second) => second.key.compareTo(first.key));
      final bestSelling =
          productSales.entries
              .map((entry) => {'name': entry.key, ...entry.value})
              .toList()
            ..sort(
              (first, second) => _number(
                second['quantity'],
              ).compareTo(_number(first['quantity'])),
            );

      if (!mounted) return;
      setState(() {
        _totalSales = totalSales;
        _monthlySales = monthlySummary
            .map(
              (entry) => {
                'month':
                    '${_thaiMonthAbbreviations[int.parse(entry.key.substring(5)) - 1]} ${int.parse(entry.key.substring(0, 4)) + 543}',
                'sales': entry.value,
              },
            )
            .toList();
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
  Widget build(BuildContext context) {
    final maxMonthlySales = _monthlySales.fold<double>(
      0,
      (maximum, month) => math.max(maximum, _number(month['sales'])).toDouble(),
    );

    return Scaffold(
      appBar: AppBar(
        title: const Text('แดชบอร์ดร้านค้า'),
        actions: [
          IconButton(
            onPressed: _load,
            tooltip: 'รีเฟรช',
            icon: const Icon(Icons.refresh),
          ),
        ],
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
                  Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: AppColors.ink,
                      borderRadius: BorderRadius.circular(18),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Row(
                          children: [
                            Icon(
                              Icons.storefront_outlined,
                              color: AppColors.pinkSoft,
                            ),
                            SizedBox(width: 9),
                            Text(
                              'ยอดขายรวม',
                              style: TextStyle(
                                color: Colors.white70,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Text(
                          '฿${_money(_totalSales)}',
                          style: Theme.of(context).textTheme.headlineMedium
                              ?.copyWith(
                                color: Colors.white,
                                fontWeight: FontWeight.w800,
                              ),
                        ),
                        const SizedBox(height: 4),
                        const Text(
                          'จากคำสั่งซื้อที่จัดส่งแล้ว',
                          style: TextStyle(color: Colors.white70),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),
                  const SectionTitle('ยอดขายรายเดือน'),
                  const SizedBox(height: 8),
                  if (_monthlySales.isEmpty)
                    const Padding(
                      padding: EdgeInsets.symmetric(vertical: 12),
                      child: Text(
                        'ยังไม่มีข้อมูลยอดขาย',
                        style: TextStyle(color: AppColors.muted),
                      ),
                    )
                  else
                    for (
                      var index = 0;
                      index < _monthlySales.length;
                      index++
                    ) ...[
                      Padding(
                        padding: const EdgeInsets.symmetric(vertical: 10),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Expanded(
                                  child: Text(
                                    _monthlySales[index]['month'].toString(),
                                    style: const TextStyle(
                                      fontWeight: FontWeight.w700,
                                    ),
                                  ),
                                ),
                                Text(
                                  '฿${_money(_monthlySales[index]['sales'])}',
                                  style: const TextStyle(
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 8),
                            ClipRRect(
                              borderRadius: BorderRadius.circular(6),
                              child: LinearProgressIndicator(
                                value: maxMonthlySales == 0
                                    ? 0
                                    : _number(_monthlySales[index]['sales']) /
                                          maxMonthlySales,
                                minHeight: 7,
                                backgroundColor: AppColors.pinkSoft,
                                valueColor: const AlwaysStoppedAnimation(
                                  AppColors.pink,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                      if (index < _monthlySales.length - 1)
                        const Divider(height: 1),
                    ],
                  const SizedBox(height: 24),
                  const SectionTitle('สินค้าที่ขายดีที่สุด'),
                  const SizedBox(height: 10),
                  if (_bestSellingProducts.isEmpty)
                    const Padding(
                      padding: EdgeInsets.symmetric(vertical: 12),
                      child: Text(
                        'ยังไม่มีข้อมูลสินค้า',
                        style: TextStyle(color: AppColors.muted),
                      ),
                    )
                  else
                    for (
                      var index = 0;
                      index < _bestSellingProducts.length;
                      index++
                    )
                      Card(
                        child: ListTile(
                          leading: CircleAvatar(
                            backgroundColor: index == 0
                                ? AppColors.pinkSoft
                                : AppColors.canvas,
                            child: Text(
                              '${index + 1}',
                              style: const TextStyle(
                                color: AppColors.ink,
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                          ),
                          title: Text(
                            _bestSellingProducts[index]['name'].toString(),
                            style: const TextStyle(fontWeight: FontWeight.w700),
                          ),
                          subtitle: Text(
                            'ขายแล้ว ${_number(_bestSellingProducts[index]['quantity']).toStringAsFixed(0)} ชิ้น',
                          ),
                          trailing: Text(
                            '฿${_money(_bestSellingProducts[index]['sales'])}',
                            style: const TextStyle(fontWeight: FontWeight.w700),
                          ),
                        ),
                      ),
                ],
              ),
            ),
    );
  }
}
