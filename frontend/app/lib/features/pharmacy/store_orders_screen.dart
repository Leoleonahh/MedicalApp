import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';

import '../../core/api_client.dart';
import '../../core/session.dart';
import '../../core/theme.dart';
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
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final response = await ApiClient.instance.get(
        '/orders/pharmacy/${widget.pharmacyId}/orders',
      );
      setState(() => _orders = asMapList(response['data']));
    } catch (error) {
      setState(() => _error = apiError(error));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _confirmPayment(String id) async {
    setState(() => _confirmingOrderId = id);
    try {
      await ApiClient.instance.put(
        '/orders/$id/confirm-payment',
        data: {'verified_by': AppSession.instance.user['user_id']},
      );
      await _load();
    } catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text(apiError(error))));
      }
    } finally {
      if (mounted) setState(() => _confirmingOrderId = null);
    }
  }

  bool _isPaid(Map<String, dynamic> order) =>
      order['payment_method'] == 'COD' ||
      order['payment_status'] == 'PAID' ||
      order['ocr_match'] == true ||
      order['ocr_match'] == 1 ||
      order['ocr_match'] == '1';

  Widget _buildOrderCard(Map<String, dynamic> order) {
    final id = '${order['order_id']}';
    final isCod = order['payment_method'] == 'COD';
    final isPaid = _isPaid(order);
    final paymentStatus = order['payment_status']?.toString();
    final isConfirming = _confirmingOrderId == id;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            ListTile(
              contentPadding: EdgeInsets.zero,
              title: Text(
                'ออเดอร์${id.padLeft(3, '0')}',
                style: const TextStyle(fontWeight: FontWeight.w800),
              ),
              subtitle: Text('สถานะ: ${order['order_status'] ?? '-'}'),
              trailing: const Icon(Icons.chevron_right),
              onTap: () => context.push('/pharmacy/orders/$id'),
            ),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              decoration: BoxDecoration(
                color: isPaid
                    ? const Color(0xFFE9FBEA)
                    : const Color(0xFFFFEEEE),
                border: Border.all(
                  color: isPaid
                      ? const Color(0xFFC8EEC9)
                      : const Color(0xFFF2CCCC),
                ),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Column(
                children: [
                  Text(
                    isCod ? 'เก็บเงินปลายทาง' : 'PromptPay',
                    style: TextStyle(
                      fontWeight: FontWeight.w700,
                      color: isPaid
                          ? Colors.green.shade800
                          : Colors.red.shade800,
                    ),
                  ),
                  Text(
                    isPaid ? 'ชำระเงินแล้ว' : 'ยังไม่ชำระเงิน',
                    style: TextStyle(
                      color: isPaid
                          ? Colors.green.shade800
                          : Colors.red.shade800,
                    ),
                  ),
                  Text(
                    isPaid ? 'เรียบร้อย' : 'ไม่เรียบร้อย',
                    style: TextStyle(
                      color: isPaid
                          ? Colors.green.shade800
                          : Colors.red.shade800,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 10),
            SizedBox(
              width: double.infinity,
              child: OutlinedButton(
                onPressed: isCod || paymentStatus == 'PAID' || isConfirming
                    ? null
                    : () => _confirmPayment(id),
                child: Text(
                  isConfirming
                      ? 'กำลังยืนยัน...'
                      : paymentStatus == 'PAID'
                      ? 'ยืนยันแล้ว'
                      : 'ยืนยันการชำระเงิน',
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final inProgressOrders = _orders
        .where(
          (order) =>
              !['DELIVERED', 'CANCELLED'].contains(order['order_status']),
        )
        .toList();
    final deliveredOrders = _orders
        .where((order) => order['order_status'] == 'DELIVERED')
        .toList();
    final cancelledOrders = _orders
        .where((order) => order['order_status'] == 'CANCELLED')
        .toList();

    Widget buildSection(
      String title,
      List<Map<String, dynamic>> orders,
      String emptyMessage,
    ) => Padding(
      padding: const EdgeInsets.only(bottom: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  title,
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ),
              Text(
                '${orders.length} รายการ',
                style: Theme.of(context).textTheme.bodySmall,
              ),
            ],
          ),
          const SizedBox(height: 10),
          if (orders.isEmpty)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 12),
              child: Text(
                emptyMessage,
                style: const TextStyle(color: Colors.black54),
              ),
            )
          else
            for (final order in orders) ...[
              _buildOrderCard(order),
              const SizedBox(height: 10),
            ],
        ],
      ),
    );

    return Scaffold(
      appBar: AppBar(title: const Text('คำสั่งซื้อของร้าน')),
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
                  buildSection(
                    'กำลังดำเนินการ',
                    inProgressOrders,
                    'ไม่มีออเดอร์ที่กำลังดำเนินการ',
                  ),
                  buildSection(
                    'ส่งเรียบร้อยแล้ว',
                    deliveredOrders,
                    'ยังไม่มีออเดอร์ที่ส่งเรียบร้อย',
                  ),
                  buildSection(
                    'ยกเลิก',
                    cancelledOrders,
                    'ยังไม่มีออเดอร์ที่ถูกยกเลิก',
                  ),
                ],
              ),
            ),
    );
  }
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
  String? _actionError;
  Map<String, dynamic> _order = {};
  List<Map<String, dynamic>> _items = [];
  XFile? _deliveryProof;
  Uint8List? _deliveryProofBytes;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final response = await ApiClient.instance.get(
        '/orders/pharmacy/orders/${widget.orderId}',
      );
      final data = Map<String, dynamic>.from(response['data'] as Map? ?? {});
      setState(() {
        _order = Map<String, dynamic>.from(data['order'] as Map? ?? {});
        _items = asMapList(data['items']);
      });
    } catch (error) {
      setState(() => _error = apiError(error));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  List<String> get _nextStatuses {
    switch (_order['order_status']) {
      case 'PENDING':
        return _order['payment_status'] == 'PAID'
            ? const ['PREPARING']
            : const ['PREPARING', 'CANCELLED'];
      case 'PREPARING':
        return const ['SHIPPING'];
      case 'SHIPPING':
        return const ['DELIVERED'];
      default:
        return const [];
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

  Widget? _deliveryProofCard() {
    final fileName = _order['delivery_proof']?.toString();
    if (fileName == null || fileName.isEmpty) return null;
    return DeliveryProofCard(
      fileName: fileName,
      apiRoot: ApiClient.instance.dio.options.baseUrl,
    );
  }

  Future<void> _pickDeliveryProof() async {
    final file = await ImagePicker().pickImage(
      source: ImageSource.gallery,
      imageQuality: 85,
    );
    if (file == null || !mounted) {
      return;
    }
    final bytes = await file.readAsBytes();
    if (!mounted) return;
    if (bytes.length > 5 * 1024 * 1024) {
      setState(() => _actionError = 'รูปหลักฐานต้องมีขนาดไม่เกิน 5 MB');
      return;
    }
    setState(() {
      _deliveryProof = file;
      _deliveryProofBytes = bytes;
      _actionError = null;
    });
  }

  Future<void> _confirmCancel() async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('ยกเลิกคำสั่งซื้อ?'),
        content: const Text('ต้องการยกเลิกคำสั่งซื้อนี้หรือไม่'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('กลับ'),
          ),
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: AppColors.danger),
            onPressed: () => Navigator.pop(context, true),
            child: const Text('ยืนยันยกเลิก'),
          ),
        ],
      ),
    );
    if (confirm == true) await _updateStatus('CANCELLED');
  }

  Future<void> _updateStatus(String status) async {
    if (status == 'DELIVERED' && _deliveryProof == null) {
      setState(() => _actionError = 'กรุณาแนบรูปหลักฐานการจัดส่งก่อน');
      return;
    }

    setState(() {
      _updating = true;
      _actionError = null;
      _error = null;
    });
    try {
      if (status == 'DELIVERED') {
        await ApiClient.instance.uploadBytes(
          '/orders/${widget.orderId}/status',
          fieldName: 'delivery_proof',
          bytes: _deliveryProofBytes!,
          filename: _deliveryProof!.name,
          fields: {'order_status': status},
          method: 'PUT',
        );
      } else {
        await ApiClient.instance.put(
          '/orders/${widget.orderId}/status',
          data: {'order_status': status},
        );
      }
      await _load();
      if (status == 'DELIVERED' && mounted) {
        setState(() {
          _deliveryProof = null;
          _deliveryProofBytes = null;
        });
      }
    } catch (error) {
      setState(() => _actionError = apiError(error));
    } finally {
      if (mounted) setState(() => _updating = false);
    }
  }

  Widget _statusAction(String status) {
    if (status == 'CANCELLED') {
      return SizedBox(
        width: double.infinity,
        child: OutlinedButton.icon(
          onPressed: _updating ? null : _confirmCancel,
          style: OutlinedButton.styleFrom(
            foregroundColor: AppColors.danger,
            side: const BorderSide(color: AppColors.danger),
            minimumSize: const Size.fromHeight(50),
          ),
          icon: const Icon(Icons.cancel_outlined),
          label: const Text('ยกเลิกคำสั่งซื้อ'),
        ),
      );
    }

    final isDelivered = status == 'DELIVERED';
    final icon = switch (status) {
      'PREPARING' => Icons.inventory_2_outlined,
      'SHIPPING' => Icons.local_shipping_outlined,
      'DELIVERED' => Icons.check_circle_outline,
      _ => Icons.sync,
    };
    return SizedBox(
      width: double.infinity,
      child: FilledButton.icon(
        onPressed: _updating || (isDelivered && _deliveryProof == null)
            ? null
            : () => _updateStatus(status),
        icon: Icon(icon),
        label: Text(
          _updating
              ? 'กำลังอัปเดต...'
              : '${isDelivered ? 'ยืนยัน' : 'เปลี่ยนเป็น'} ${_statusLabel(status)}',
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: Text('คำสั่งซื้อ #${widget.orderId}')),
    body: _loading
        ? const PageLoading()
        : _error != null && _order.isEmpty
        ? ErrorMessage(_error!, onRetry: _load)
        : ListView(
            padding: const EdgeInsets.all(18),
            children: [
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          const Icon(
                            Icons.person_outline,
                            color: AppColors.pink,
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Text(
                              _order['receiver_name']?.toString() ?? 'ผู้รับ',
                              style: const TextStyle(
                                fontWeight: FontWeight.w800,
                                fontSize: 17,
                              ),
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 10,
                              vertical: 6,
                            ),
                            decoration: BoxDecoration(
                              color: AppColors.pinkSoft,
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: Text(
                              _statusLabel('${_order['order_status'] ?? ''}'),
                              style: const TextStyle(
                                color: AppColors.ink,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Text('โทร ${_order['receiver_phone'] ?? '-'}'),
                      const SizedBox(height: 5),
                      Text(
                        'ที่อยู่จัดส่ง: ${_order['delivery_address'] ?? '-'}',
                      ),
                      const Divider(height: 24),
                      Row(
                        children: [
                          const Icon(
                            Icons.payments_outlined,
                            size: 20,
                            color: AppColors.muted,
                          ),
                          const SizedBox(width: 8),
                          Text(
                            '${_order['payment_method'] ?? '-'} • ${_order['payment_status'] ?? '-'}',
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
              if (_deliveryProofCard() case final proof?) proof,
              const SizedBox(height: 22),
              const Text(
                'รายการสินค้า',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800),
              ),
              const SizedBox(height: 8),
              for (final item in _items)
                ListTile(
                  contentPadding: const EdgeInsets.symmetric(horizontal: 4),
                  title: Text(item['product_name']?.toString() ?? '-'),
                  subtitle: Text('จำนวน ${item['quantity'] ?? 0}'),
                  trailing: Text(
                    '฿${item['subtotal'] ?? 0}',
                    style: const TextStyle(fontWeight: FontWeight.w700),
                  ),
                ),
              const Divider(),
              ListTile(
                contentPadding: const EdgeInsets.symmetric(horizontal: 4),
                title: const Text(
                  'ยอดรวม',
                  style: TextStyle(fontWeight: FontWeight.w800),
                ),
                trailing: Text(
                  '฿${_order['grand_total'] ?? 0}',
                  style: const TextStyle(fontWeight: FontWeight.w800),
                ),
              ),
              if (_order['order_status'] == 'SHIPPING') ...[
                const SizedBox(height: 14),
                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: AppColors.pinkSoft,
                    border: Border.all(color: AppColors.border),
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'หลักฐานการจัดส่ง',
                        style: TextStyle(fontWeight: FontWeight.w800),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        _deliveryProof == null
                            ? 'แนบรูปก่อนยืนยันสถานะจัดส่งแล้ว'
                            : _deliveryProof!.name,
                        style: const TextStyle(color: AppColors.muted),
                      ),
                      if (_deliveryProofBytes != null) ...[
                        const SizedBox(height: 12),
                        ClipRRect(
                          borderRadius: BorderRadius.circular(10),
                          child: Image.memory(
                            _deliveryProofBytes!,
                            height: 190,
                            width: double.infinity,
                            fit: BoxFit.cover,
                          ),
                        ),
                      ],
                      const SizedBox(height: 10),
                      OutlinedButton.icon(
                        onPressed: _updating ? null : _pickDeliveryProof,
                        icon: const Icon(Icons.add_a_photo_outlined),
                        label: Text(
                          _deliveryProof == null
                              ? 'เลือกรูปหลักฐาน'
                              : 'เปลี่ยนรูป',
                        ),
                      ),
                    ],
                  ),
                ),
              ],
              if (_nextStatuses.isNotEmpty) ...[
                const SizedBox(height: 22),
                const Text(
                  'จัดการสถานะ',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800),
                ),
                const SizedBox(height: 10),
                for (final status in _nextStatuses) ...[
                  _statusAction(status),
                  const SizedBox(height: 10),
                ],
              ],
              if (_actionError != null)
                Padding(
                  padding: const EdgeInsets.only(top: 8),
                  child: Text(
                    _actionError!,
                    style: const TextStyle(color: AppColors.danger),
                  ),
                ),
              if (_error != null)
                Text(_error!, style: const TextStyle(color: AppColors.danger)),
            ],
          ),
  );
}
