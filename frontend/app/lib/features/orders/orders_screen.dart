import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:qr_flutter/qr_flutter.dart';

import '../../core/api_client.dart';
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

  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: AppBar(title: const Text('คำสั่งซื้อ'), actions: [IconButton(onPressed: _load, icon: const Icon(Icons.refresh))]),
        body: _loading
            ? const PageLoading()
            : _error != null
                ? ErrorMessage(_error!, onRetry: _load)
                : _orders.isEmpty
                    ? const Center(child: Text('ยังไม่มีคำสั่งซื้อ'))
                    : RefreshIndicator(onRefresh: _load, child: ListView.separated(
                        padding: const EdgeInsets.all(16), itemCount: _orders.length,
                        separatorBuilder: (_, __) => const SizedBox(height: 9),
                        itemBuilder: (context, index) {
                          final order = _orders[index];
                          return Card(child: ListTile(
                            title: Text('คำสั่งซื้อ #${order['order_id']}', style: const TextStyle(fontWeight: FontWeight.w800)),
                            subtitle: Text('${order['pharmacy_name'] ?? 'ร้านยา'} • ${order['order_status'] ?? ''}\nชำระเงิน: ${order['payment_status'] ?? ''}'),
                            isThreeLine: true,
                            trailing: const Icon(Icons.chevron_right),
                            onTap: () => context.push('/orders/${order['order_id']}'),
                          ));
                        },
                      )),
      );
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
  Widget build(BuildContext context) => Scaffold(
        appBar: AppBar(title: Text('คำสั่งซื้อ #${widget.orderId}')),
        body: _loading ? const PageLoading() : _error != null ? ErrorMessage(_error!, onRetry: _load) : ListView(padding: const EdgeInsets.all(18), children: [
          Card(child: Padding(padding: const EdgeInsets.all(16), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(_order['pharmacy_name']?.toString() ?? 'รายละเอียดคำสั่งซื้อ', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800)),
            const SizedBox(height: 8),
            Text('สถานะ: ${_order['order_status'] ?? '-'}'),
            Text('การชำระเงิน: ${_order['payment_status'] ?? '-'}'),
            Text('ที่อยู่: ${_order['delivery_address'] ?? '-'}'),
          ]))),
          const SizedBox(height: 16),
          const Text('รายการสินค้า', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800)),
          for (final item in _items) ListTile(title: Text(item['product_name']?.toString() ?? '-'), subtitle: Text('จำนวน ${item['quantity'] ?? 0}'), trailing: Text('฿${item['subtotal'] ?? 0}')),
          ListTile(title: const Text('ยอดรวม', style: TextStyle(fontWeight: FontWeight.w800)), trailing: Text('฿${_order['grand_total'] ?? 0}')),
          if (_order['payment_method'] == 'PROMPTPAY' && _order['payment_status'] != 'PAID' && _order['payment_slip'] == null)
            FilledButton(onPressed: () => context.push('/payment/${widget.orderId}'), child: const Text('ไปชำระเงิน')),
          if (_order['order_status'] == 'PENDING' && _order['payment_status'] != 'PAID') OutlinedButton(onPressed: _cancel, child: const Text('ยกเลิกคำสั่งซื้อ')),
        ]),
      );
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
        appBar: AppBar(title: Text('ชำระเงิน #${widget.orderId}')),
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
