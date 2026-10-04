import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../core/api_client.dart';
import '../../core/session.dart';
import '../../core/widgets.dart';

class StoreOrdersScreen extends StatefulWidget {
  const StoreOrdersScreen({super.key, required this.pharmacyId});
  final String pharmacyId;
  @override
  State<StoreOrdersScreen> createState() => _StoreOrdersScreenState();
}

class _StoreOrdersScreenState extends State<StoreOrdersScreen> {
  bool _loading = true;
  String? _error;
  String? _confirmingOrderId;
  List<Map<String, dynamic>> _orders = [];

  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    try {
      final response = await ApiClient.instance.get('/orders/pharmacy/${widget.pharmacyId}/orders');
      setState(() => _orders = asMapList(response['data']));
    } catch (error) { setState(() => _error = apiError(error)); }
    finally { if (mounted) setState(() => _loading = false); }
  }

  Future<void> _confirmPayment(String id) async {
    setState(() => _confirmingOrderId = id);
    try {
      await ApiClient.instance.put('/orders/$id/confirm-payment', data: {'verified_by': AppSession.instance.user['user_id']});
      await _load();
    } catch (error) { if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(apiError(error)))); }
    finally { if (mounted) setState(() => _confirmingOrderId = null); }
  }

  bool _isPaid(Map<String, dynamic> order) =>
      order['payment_method'] == 'COD' ||
      order['payment_status'] == 'PAID' ||
      order['ocr_match'] == true ||
      order['ocr_match'] == 1 ||
      order['ocr_match'] == '1';

  @override
  Widget build(BuildContext context) => Scaffold(appBar: AppBar(title: const Text('คำสั่งซื้อของร้าน')),
    body: _loading ? const PageLoading() : _error != null ? ErrorMessage(_error!, onRetry: _load) : ListView.separated(
      padding: const EdgeInsets.all(16), itemCount: _orders.length, separatorBuilder: (_, __) => const SizedBox(height: 9),
      itemBuilder: (context, index) {
        final order = _orders[index];
        final id = '${order['order_id']}';
        final isCod = order['payment_method'] == 'COD';
        final isPaid = _isPaid(order);
        final paymentStatus = order['payment_status']?.toString();
        final isConfirming = _confirmingOrderId == id;
        return Card(child: Padding(
          padding: const EdgeInsets.all(14),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            ListTile(
              contentPadding: EdgeInsets.zero,
              title: Text('ออเดอร์${id.padLeft(3, '0')}', style: const TextStyle(fontWeight: FontWeight.w800)),
              subtitle: Text('สถานะ: ${order['order_status'] ?? '-'}'),
              trailing: const Icon(Icons.chevron_right),
              onTap: () => context.push('/pharmacy/orders/$id'),
            ),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              decoration: BoxDecoration(
                color: isPaid ? const Color(0xFFE9FBEA) : const Color(0xFFFFEEEE),
                border: Border.all(color: isPaid ? const Color(0xFFC8EEC9) : const Color(0xFFF2CCCC)),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Column(children: [
                Text(isCod ? 'เก็บเงินปลายทาง' : 'PromptPay', style: TextStyle(fontWeight: FontWeight.w700, color: isPaid ? Colors.green.shade800 : Colors.red.shade800)),
                Text(isPaid ? 'ชำระเงินแล้ว' : 'ยังไม่ชำระเงิน', style: TextStyle(color: isPaid ? Colors.green.shade800 : Colors.red.shade800)),
                Text(isPaid ? 'เรียบร้อย' : 'ไม่เรียบร้อย', style: TextStyle(color: isPaid ? Colors.green.shade800 : Colors.red.shade800)),
              ]),
            ),
            const SizedBox(height: 10),
            SizedBox(
              width: double.infinity,
              child: OutlinedButton(
                onPressed: isCod || paymentStatus == 'PAID' || isConfirming ? null : () => _confirmPayment(id),
                child: Text(isConfirming ? 'กำลังยืนยัน...' : paymentStatus == 'PAID' ? 'ยืนยันแล้ว' : 'ยืนยันการชำระเงิน'),
              ),
            ),
          ]),
        ));
      },
    ));
}

class StoreOrderDetailScreen extends StatefulWidget {
  const StoreOrderDetailScreen({super.key, required this.orderId});
  final String orderId;
  @override
  State<StoreOrderDetailScreen> createState() => _StoreOrderDetailScreenState();
}

class _StoreOrderDetailScreenState extends State<StoreOrderDetailScreen> {
  bool _loading = true;
  bool _updating = false;
  String? _error;
  Map<String, dynamic> _order = {};
  List<Map<String, dynamic>> _items = [];

  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    try {
      final response = await ApiClient.instance.get('/orders/pharmacy/orders/${widget.orderId}');
      final data = Map<String, dynamic>.from(response['data'] as Map? ?? {});
      setState(() { _order = Map<String, dynamic>.from(data['order'] as Map? ?? {}); _items = asMapList(data['items']); });
    } catch (error) { setState(() => _error = apiError(error)); }
    finally { if (mounted) setState(() => _loading = false); }
  }

  List<String> get _nextStatuses {
    switch (_order['order_status']) {
      case 'PENDING': return const ['PREPARING', 'CANCELLED'];
      case 'PREPARING': return const ['SHIPPING', 'CANCELLED'];
      case 'SHIPPING': return const ['DELIVERED'];
      default: return const [];
    }
  }

  String _statusLabel(String status) => switch (status) {
    'PENDING' => 'รอจัดเตรียม',
    'PREPARING' => 'กำลังเตรียมสินค้า',
    'SHIPPING' => 'กำลังจัดส่ง',
    'DELIVERED' => 'จัดส่งแล้ว',
    'CANCELLED' => 'ยกเลิก',
    _ => status,
  };

  Future<void> _updateStatus(String status) async {
    setState(() { _updating = true; _error = null; });
    try {
      await ApiClient.instance.put('/orders/${widget.orderId}/status', data: {'order_status': status});
      await _load();
    } catch (error) { setState(() => _error = apiError(error)); }
    finally { if (mounted) setState(() => _updating = false); }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: Text('คำสั่งซื้อ #${widget.orderId}')),
    body: _loading ? const PageLoading() : _error != null && _order.isEmpty ? ErrorMessage(_error!, onRetry: _load) : ListView(padding: const EdgeInsets.all(18), children: [
      Card(child: Padding(padding: const EdgeInsets.all(16), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text('ผู้รับ: ${_order['receiver_name'] ?? '-'}', style: const TextStyle(fontWeight: FontWeight.w800)),
        Text('โทร: ${_order['receiver_phone'] ?? '-'}'),
        Text('ที่อยู่: ${_order['delivery_address'] ?? '-'}'),
        Text('ชำระเงิน: ${_order['payment_method'] ?? '-'} • ${_order['payment_status'] ?? '-'}'),
        Text('สถานะจัดส่ง: ${_statusLabel('${_order['order_status'] ?? ''}')}'),
      ]))),
      const SizedBox(height: 16),
      const Text('รายการสินค้า', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800)),
      for (final item in _items) ListTile(title: Text(item['product_name']?.toString() ?? '-'), subtitle: Text('จำนวน ${item['quantity'] ?? 0}'), trailing: Text('฿${item['subtotal'] ?? 0}')),
      ListTile(title: const Text('ยอดรวม', style: TextStyle(fontWeight: FontWeight.w800)), trailing: Text('฿${_order['grand_total'] ?? 0}')),
      if (_nextStatuses.isNotEmpty) ...[
        const SizedBox(height: 10),
        for (final status in _nextStatuses) Padding(padding: const EdgeInsets.only(bottom: 8), child: OutlinedButton(
          onPressed: _updating ? null : () => _updateStatus(status),
          child: Text(status == 'CANCELLED' ? 'ยกเลิกคำสั่งซื้อ' : 'เปลี่ยนเป็น ${_statusLabel(status)}'),
        )),
      ],
      if (_error != null) Text(_error!, style: const TextStyle(color: Colors.red)),
    ]),
  );
}
