import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:geolocator/geolocator.dart';
import 'package:dio/dio.dart';

import '../../core/api_client.dart';
import '../../core/widgets.dart';

class CartScreen extends StatefulWidget {
  const CartScreen({super.key});
  @override
  State<CartScreen> createState() => _CartScreenState();
}

class _CartScreenState extends State<CartScreen> {
  bool _loading = true;
  String? _error;
  Map<String, dynamic> _cart = {};
  List<Map<String, dynamic>> _items = [];

  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    setState(() { _loading = true; _error = null; });
    try {
      final response = await ApiClient.instance.get('/cart');
      final data = Map<String, dynamic>.from(response['data'] as Map? ?? {});
      setState(() { _cart = data; _items = asMapList(data['items']); });
    } catch (error) {
      setState(() { _cart = {}; _items = []; _error = apiError(error); });
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _changeQuantity(Map<String, dynamic> item, int delta) async {
    final quantity = (int.tryParse('${item['quantity']}') ?? 1) + delta;
    if (quantity < 1 || quantity > (int.tryParse('${item['stock']}') ?? 0)) return;
    try {
      await ApiClient.instance.put('/cart/item/${item['cart_item_id']}', data: {'quantity': quantity});
      await _load();
    } catch (error) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(apiError(error))));
    }
  }

  Future<void> _remove(Map<String, dynamic> item) async {
    try {
      await ApiClient.instance.delete('/cart/item/${item['cart_item_id']}');
      await _load();
    } catch (error) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(apiError(error))));
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: AppBar(title: const Text('ตะกร้าสินค้า'), actions: [IconButton(onPressed: _load, icon: const Icon(Icons.refresh))]),
        body: _loading
            ? const PageLoading()
            : _error != null && _items.isEmpty
                ? ErrorMessage(_error!, onRetry: _load)
                : _items.isEmpty
                    ? const Center(child: Text('ตะกร้าของคุณยังว่าง'))
                    : Column(children: [
                        if (_cart['pharmacy_name'] != null) ListTile(title: Text(_cart['pharmacy_name'].toString(), style: const TextStyle(fontWeight: FontWeight.w800)), leading: const Icon(Icons.storefront_outlined)),
                        Expanded(child: ListView.separated(
                          padding: const EdgeInsets.all(16),
                          itemCount: _items.length,
                          separatorBuilder: (_, __) => const SizedBox(height: 9),
                          itemBuilder: (context, index) {
                            final item = _items[index];
                            return Card(child: Padding(
                              padding: const EdgeInsets.all(14),
                              child: Row(children: [
                                Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                                  Text(item['product_name']?.toString() ?? '-', style: const TextStyle(fontWeight: FontWeight.w700)),
                                  const SizedBox(height: 5),
                                  Text('฿${item['price']} • รวม ฿${item['subtotal']}'),
                                  Row(children: [
                                    IconButton(onPressed: () => _changeQuantity(item, -1), icon: const Icon(Icons.remove_circle_outline)),
                                    Text('${item['quantity']}'),
                                    IconButton(onPressed: () => _changeQuantity(item, 1), icon: const Icon(Icons.add_circle_outline)),
                                  ]),
                                ])),
                                IconButton(onPressed: () => _remove(item), icon: const Icon(Icons.delete_outline)),
                              ]),
                            ));
                          },
                        )),
                        SafeArea(top: false, child: Padding(
                          padding: const EdgeInsets.fromLTRB(18, 8, 18, 16),
                          child: Column(children: [
                            Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [const Text('รวมทั้งหมด'), Text('฿${_cart['total_price'] ?? _cart['total'] ?? 0}', style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w800))]),
                            const SizedBox(height: 12),
                            FilledButton(onPressed: () => context.push('/checkout', extra: _cart), child: const Text('ไปยืนยันคำสั่งซื้อ')),
                          ]),
                        )),
                      ]),
      );
}

class CheckoutScreen extends StatefulWidget {
  const CheckoutScreen({super.key});
  @override
  State<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends State<CheckoutScreen> {
  final _name = TextEditingController();
  final _phone = TextEditingController();
  final _address = TextEditingController();
  final _details = TextEditingController();
  String _payment = 'PROMPTPAY';
  bool _loading = false;
  String? _error;
  List<Map<String, dynamic>> _items = [];
  double _total = 0;
  bool _locationLoading = false;
  String? _locationError;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final extra = GoRouterState.of(context).extra;
    if (extra is Map && _items.isEmpty) {
      final data = Map<String, dynamic>.from(extra);
      _items = asMapList(data['items']);
      _total = double.tryParse('${data['total_price'] ?? 0}') ?? 0;
    }
  }

  @override
  void dispose() { _name.dispose(); _phone.dispose(); _address.dispose(); _details.dispose(); super.dispose(); }

  Future<void> _useCurrentLocation() async {
    setState(() { _locationLoading = true; _locationError = null; });
    try {
      if (!await Geolocator.isLocationServiceEnabled()) {
        throw Exception('กรุณาเปิด Location ของอุปกรณ์');
      }
      var permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
      }
      if (permission == LocationPermission.denied || permission == LocationPermission.deniedForever) {
        throw Exception('ไม่ได้รับอนุญาตให้เข้าถึงตำแหน่ง');
      }

      final position = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.high,
          timeLimit: Duration(seconds: 10),
        ),
      );
      final coordinateAddress = 'ตำแหน่งปัจจุบัน: ${position.latitude.toStringAsFixed(6)}, ${position.longitude.toStringAsFixed(6)}';
      _address.text = coordinateAddress;

      try {
        final response = await Dio().get<dynamic>(
          'https://nominatim.openstreetmap.org/reverse',
          queryParameters: {
            'format': 'jsonv2',
            'lat': position.latitude,
            'lon': position.longitude,
          },
        );
        final displayName = response.data is Map
            ? (response.data as Map)['display_name']?.toString()
            : null;
        if (displayName != null && displayName.isNotEmpty) {
          _address.text = displayName;
        } else {
          throw Exception('ไม่พบที่อยู่จากพิกัด');
        }
      } catch (_) {
        if (mounted) {
          setState(() => _locationError = 'ค้นหาที่อยู่จากพิกัดไม่ได้ สามารถแก้ไขที่อยู่ด้วยตนเองได้');
        }
      }
    } catch (error) {
      if (mounted) {
        setState(() => _locationError = error.toString().replaceFirst('Exception: ', ''));
      }
    } finally {
      if (mounted) setState(() => _locationLoading = false);
    }
  }

  Future<void> _placeOrder() async {
    final delivery = [_address.text.trim(), _details.text.trim()].where((part) => part.isNotEmpty).join(' ');
    if (_name.text.trim().isEmpty || _phone.text.trim().isEmpty || delivery.isEmpty) {
      setState(() => _error = 'กรุณากรอกชื่อ เบอร์โทร และที่อยู่จัดส่ง'); return;
    }
    setState(() { _loading = true; _error = null; });
    try {
      final response = await ApiClient.instance.post('/orders/checkout', data: {
        'receiver_name': _name.text.trim(),
        'receiver_phone': _phone.text.trim(),
        'delivery_address': delivery,
        'payment_method': _payment,
      });
      final order = Map<String, dynamic>.from(response['data'] as Map? ?? {});
      if (!mounted) return;
      if (_payment == 'PROMPTPAY') {
        context.go('/payment/${order['order_id']}');
      } else {
        context.go('/orders');
      }
    } catch (error) {
      setState(() => _error = apiError(error));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: AppBar(title: const Text('ยืนยันคำสั่งซื้อ')),
        body: ListView(padding: const EdgeInsets.all(18), children: [
          const Text('ข้อมูลผู้รับ', style: TextStyle(fontSize: 19, fontWeight: FontWeight.w800)),
          const SizedBox(height: 12),
          TextField(controller: _name, decoration: const InputDecoration(labelText: 'ชื่อผู้รับ')),
          const SizedBox(height: 12),
          TextField(controller: _phone, keyboardType: TextInputType.phone, decoration: const InputDecoration(labelText: 'เบอร์โทรศัพท์')),
          const SizedBox(height: 12),
          TextField(
            controller: _address,
            minLines: 2,
            maxLines: 4,
            decoration: InputDecoration(
              labelText: 'ที่อยู่หลัก',
              alignLabelWithHint: true,
              suffixIcon: IconButton(
                onPressed: _locationLoading ? null : _useCurrentLocation,
                tooltip: 'ใช้ตำแหน่งปัจจุบัน',
                icon: _locationLoading
                    ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))
                    : const Icon(Icons.my_location_outlined),
              ),
            ),
          ),
          if (_locationError != null)
            Padding(
              padding: const EdgeInsets.only(top: 6),
              child: Text(_locationError!, style: const TextStyle(color: Colors.red)),
            ),
          const SizedBox(height: 12),
          TextField(controller: _details, minLines: 2, maxLines: 3, decoration: const InputDecoration(labelText: 'รายละเอียดเพิ่มเติม')),
          const SizedBox(height: 22),
          const Text('วิธีชำระเงิน', style: TextStyle(fontWeight: FontWeight.w800)),
          SegmentedButton<String>(
            segments: const [
              ButtonSegment(value: 'PROMPTPAY', label: Text('PromptPay'), icon: Icon(Icons.qr_code_2)),
              ButtonSegment(value: 'COD', label: Text('ปลายทาง'), icon: Icon(Icons.local_shipping_outlined)),
            ],
            selected: {_payment},
            onSelectionChanged: (selection) => setState(() => _payment = selection.first),
          ),
          Card(child: Padding(padding: const EdgeInsets.all(16), child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [const Text('ยอดรวม'), Text('฿${_total.toStringAsFixed(2)}', style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 18))]))),
          if (_error != null) Padding(padding: const EdgeInsets.only(top: 12), child: Text(_error!, style: const TextStyle(color: Colors.red))),
          const SizedBox(height: 16),
          FilledButton(onPressed: _loading ? null : _placeOrder, child: Text(_loading ? 'กำลังสั่งซื้อ...' : 'ยืนยันสั่งซื้อ')),
        ]),
      );
}
