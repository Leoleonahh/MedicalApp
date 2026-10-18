import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:qr_flutter/qr_flutter.dart';

import '../../core/api_client.dart';
import '../../core/theme.dart';
import '../../core/widgets.dart';

class OrdersScreen extends StatefulWidget {
  const OrdersScreen({super.key});
  @override
  State<OrdersScreen> createState() => _OrdersScreenState();
}

class _OrdersScreenState extends State<OrdersScreen> {
  bool _loading = true;
  String? _error;
  List<Map<String, dynamic>> _orders = [];

  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    setState(() { _loading = true; _error = null; });
    try {
      final response = await ApiClient.instance.get('/orders/my-orders');
      setState(() => _orders = asMapList(response['data']));
    } catch (error) {
      setState(() => _error = apiError(error));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Widget _orderCard(Map<String, dynamic> order) => Card(child: ListTile(
        title: Text('คำสั่งซื้อ #${order['order_id']}', style: const TextStyle(fontWeight: FontWeight.w800)),
        subtitle: Text('${order['pharmacy_name'] ?? 'ร้านยา'} • ${order['order_status'] ?? ''}\nชำระเงิน: ${order['payment_status'] ?? ''} • ฿${order['grand_total'] ?? 0}'),
        isThreeLine: true,
        trailing: const Icon(Icons.chevron_right),
        onTap: () => context.push('/orders/${order['order_id']}'),
      ));

  @override
  Widget build(BuildContext context) {
    final inProgressOrders = _orders.where((order) => !['DELIVERED', 'CANCELLED'].contains(order['order_status'])).toList();
    final deliveredOrders = _orders.where((order) => order['order_status'] == 'DELIVERED').toList();
    final cancelledOrders = _orders.where((order) => order['order_status'] == 'CANCELLED').toList();

    Widget buildSection(String title, List<Map<String, dynamic>> orders, String emptyMessage) => Padding(
      padding: const EdgeInsets.only(bottom: 20),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Expanded(child: Text(title, style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w800))),
          Text('${orders.length} รายการ', style: Theme.of(context).textTheme.bodySmall),
        ]),
        const SizedBox(height: 10),
        if (orders.isEmpty)
          Padding(padding: const EdgeInsets.symmetric(vertical: 12), child: Text(emptyMessage, style: const TextStyle(color: Colors.black54)))
        else
          for (final order in orders) ...[
            _orderCard(order),
            const SizedBox(height: 9),
          ],
      ]),
    );

    return Scaffold(
      appBar: AppBar(title: const Text('คำสั่งซื้อ'), actions: [IconButton(onPressed: _load, tooltip: 'รีเฟรช', icon: const Icon(Icons.refresh))]),
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
                      buildSection('กำลังดำเนินการ', inProgressOrders, 'ไม่มีคำสั่งซื้อที่กำลังดำเนินการ'),
                      buildSection('สำเร็จแล้ว', deliveredOrders, 'ยังไม่มีคำสั่งซื้อที่สำเร็จ'),
                      buildSection('ยกเลิก', cancelledOrders, 'ยังไม่มีคำสั่งซื้อที่ถูกยกเลิก'),
                    ],
                  ),
                ),
    );
  }
}

class OrderDetailScreen extends StatefulWidget {
  const OrderDetailScreen({super.key, required this.orderId});
  final String orderId;
  @override
  State<OrderDetailScreen> createState() => _OrderDetailScreenState();
}

class _OrderDetailScreenState extends State<OrderDetailScreen> {
  bool _loading = true;
  String? _error;
  Map<String, dynamic> _order = {};
  List<Map<String, dynamic>> _items = [];

  bool get _ocrMatched =>
      _order['ocr_match'] == true ||
      _order['ocr_match'] == 1 ||
      _order['ocr_match'] == '1';

  bool get _canCancelOrder =>
      _order['order_status'] == 'PENDING' &&
      _order['payment_status'] != 'PAID' &&
      !(_order['payment_method'] == 'PROMPTPAY' && _ocrMatched);

  String _orderStatusLabel(String status) => switch (status) {
    'PENDING' => 'รอจัดเตรียม',
    'PREPARING' => 'กำลังเตรียมสินค้า',
    'SHIPPING' => 'กำลังจัดส่ง',
    'DELIVERED' => 'จัดส่งแล้ว',
    'CANCELLED' => 'ยกเลิกแล้ว',
    _ => status,
  };

  String _paymentStatusLabel(String status) => switch (status) {
    'UNPAID' => 'ยังไม่ชำระ',
    'PENDING_VERIFY' => 'รอตรวจสอบ',
    'PAID' => 'ชำระแล้ว',
    _ => status,
  };

  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    try {
      final response = await ApiClient.instance.get('/orders/${widget.orderId}');
      final data = Map<String, dynamic>.from(response['data'] as Map? ?? {});
      setState(() { _order = data; _items = asMapList(data['items']); });
    } catch (error) {
      setState(() => _error = apiError(error));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _cancel() async {
    final confirm = await showDialog<bool>(context: context, builder: (context) => AlertDialog(
      title: const Text('ยกเลิกคำสั่งซื้อ?'),
      content: const Text('ต้องการยกเลิกคำสั่งซื้อนี้หรือไม่'),
      actions: [TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('กลับ')), FilledButton(onPressed: () => Navigator.pop(context, true), child: const Text('ยืนยัน'))],
    ));
    if (confirm != true) return;
    try {
      await ApiClient.instance.put('/orders/${widget.orderId}/cancel');
      await _load();
    } catch (error) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(apiError(error))));
    }
  }

  @override
  Widget build(BuildContext context) {
    final proofFileName = _order['delivery_proof']?.toString();
    final hasDeliveryProof = proofFileName != null && proofFileName.isNotEmpty;
    final orderStatus = _order['order_status']?.toString() ?? '';
    final paymentStatus = _order['payment_status']?.toString() ?? '';
    final isDelivered = orderStatus == 'DELIVERED';

    return Scaffold(
      appBar: AppBar(title: Text('คำสั่งซื้อ #${widget.orderId}')),
      body: _loading
          ? const PageLoading()
          : _error != null
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
                        Text(
                          _order['pharmacy_name']?.toString() ??
                              'รายละเอียดคำสั่งซื้อ',
                          style: const TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                        const SizedBox(height: 14),
                        Row(
                          children: [
                            const Icon(
                              Icons.local_shipping_outlined,
                              color: AppColors.pink,
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                _orderStatusLabel(orderStatus),
                                style: const TextStyle(
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                            ),
                            Icon(
                              isDelivered
                                  ? Icons.check_circle
                                  : Icons.circle_outlined,
                              color: isDelivered
                                  ? AppColors.green
                                  : AppColors.muted,
                            ),
                          ],
                        ),
                        const Divider(height: 24),
                        Row(
                          children: [
                            const Icon(
                              Icons.payments_outlined,
                              color: AppColors.muted,
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                '${_order['payment_method'] == 'PROMPTPAY' ? 'PromptPay' : 'เก็บเงินปลายทาง'} • ${_paymentStatusLabel(paymentStatus)}',
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Icon(
                              Icons.location_on_outlined,
                              color: AppColors.muted,
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                _order['delivery_address']?.toString() ?? '-',
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 22),
                Row(
                  children: [
                    const Expanded(
                      child: Text(
                        'รายการสินค้า',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ),
                    Text('${_items.length} รายการ'),
                  ],
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
                if (_order['payment_method'] == 'PROMPTPAY' &&
                    paymentStatus != 'PAID' &&
                    _order['payment_slip'] == null) ...[
                  const SizedBox(height: 8),
                  FilledButton.icon(
                    onPressed: () => context.go('/payment/${widget.orderId}'),
                    icon: const Icon(Icons.qr_code_2),
                    label: const Text('ไปชำระเงิน'),
                  ),
                ],
                if (hasDeliveryProof) ...[
                  const SizedBox(height: 10),
                  DeliveryProofCard(
                    fileName: proofFileName,
                    apiRoot: ApiClient.instance.dio.options.baseUrl,
                  ),
                ],
                if (_canCancelOrder) ...[
                  const SizedBox(height: 12),
                  FilledButton.icon(
                    onPressed: _cancel,
                    style: FilledButton.styleFrom(
                      backgroundColor: AppColors.danger,
                    ),
                    icon: const Icon(Icons.cancel_outlined),
                    label: const Text('ยกเลิกคำสั่งซื้อ'),
                  ),
                ],
              ],
            ),
    );
  }
}

class PaymentScreen extends StatefulWidget {
  const PaymentScreen({super.key, required this.orderId});
  final String orderId;
  @override
  State<PaymentScreen> createState() => _PaymentScreenState();
}

class _PaymentScreenState extends State<PaymentScreen> {
  bool _loading = true;
  bool _uploading = false;
  String? _error;
  String? _qrData;
  Map<String, dynamic> _ocr = {};

  @override
  void initState() { super.initState(); _loadQr(); }

  Future<void> _loadQr() async {
    try {
      final response = await ApiClient.instance.get('/orders/${widget.orderId}/qrcode');
      setState(() => _qrData = response['qr']?.toString());
    } catch (error) {
      setState(() => _error = apiError(error));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _uploadSlip() async {
    final file = await ImagePicker().pickImage(source: ImageSource.gallery, imageQuality: 85);
    if (file == null || !mounted) return;
    setState(() { _uploading = true; _error = null; });
    try {
      final response = await ApiClient.instance.uploadBytes(
        '/orders/${widget.orderId}/upload-slip',
        fieldName: 'slip',
        bytes: await file.readAsBytes(),
        filename: file.name,
      );
      if (!mounted) return;
      setState(() => _ocr = Map<String, dynamic>.from(response['data']?['ocr'] as Map? ?? {}));
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('แนบสลิปแล้ว รอร้านตรวจสอบ')));
    } catch (error) {
      if (mounted) setState(() => _error = apiError(error));
    } finally {
      if (mounted) setState(() => _uploading = false);
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: AppBar(
          automaticallyImplyLeading: false,
          leading: IconButton(
            tooltip: 'กลับ',
            onPressed: () => context.canPop() ? context.pop() : context.go('/orders'),
            icon: const Icon(Icons.arrow_back),
          ),
          title: Text('ชำระเงิน #${widget.orderId}'),
        ),
        body: _loading ? const PageLoading() : ListView(padding: const EdgeInsets.all(22), children: [
          const Text('สแกน QR ด้วยแอปธนาคารเพื่อชำระเงิน', textAlign: TextAlign.center),
          const SizedBox(height: 24),
          if (_qrData != null) Center(child: Container(padding: const EdgeInsets.all(18), decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(18)), child: _qrData!.startsWith('data:image') ? Image.memory(base64Decode(_qrData!.split(',').last), width: 240) : QrImageView(data: _qrData!, size: 240)))
          else if (_error != null) ErrorMessage(_error!),
          const SizedBox(height: 24),
          if (_ocr.isNotEmpty) Text('OCR ตรวจพบยอดเงิน ${_ocr['amount'] ?? '-'} • ${_ocr['match'] == true ? 'ตรงกับยอด' : 'โปรดตรวจสอบ'}'),
          FilledButton.icon(onPressed: _uploading ? null : _uploadSlip, icon: const Icon(Icons.upload_file), label: Text(_uploading ? 'กำลังอัปโหลด...' : 'แนบสลิปการโอน')),
          if (_error != null) Padding(padding: const EdgeInsets.only(top: 12), child: Text(_error!, style: const TextStyle(color: Colors.red))),
        ]),
      );
}
