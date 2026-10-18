import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:geolocator/geolocator.dart';
import 'package:dio/dio.dart';

import '../../core/api_client.dart';
import '../../core/theme.dart';
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
      if (_items.length == 1) {
        if (mounted) setState(() { _cart = {}; _items = []; _error = null; });
      } else {
        await _load();
      }
    } catch (error) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(apiError(error))));
    }
  }

  Future<void> _clearCart() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('ล้างตะกร้าสินค้า?'),
        content: const Text('สินค้าทั้งหมดจะถูกนำออกจากตะกร้า'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('ยกเลิก')),
          FilledButton(onPressed: () => Navigator.pop(context, true), child: const Text('ล้างตะกร้า')),
        ],
      ),
    );
    if (confirmed != true) return;

    try {
      await ApiClient.instance.delete('/cart/clear');
      if (mounted) setState(() { _cart = {}; _items = []; _error = null; });
    } catch (error) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(apiError(error))));
    }
  }

  @override
  Widget build(BuildContext context) {
    final pharmacy = Map<String, dynamic>.from(_cart['pharmacy'] as Map? ?? {});
    final apiRoot = ApiClient.instance.dio.options.baseUrl;
    return Scaffold(
      appBar: AppBar(
        title: const Text('ตะกร้าสินค้า'),
        actions: [
          IconButton(onPressed: _load, tooltip: 'รีเฟรช', icon: const Icon(Icons.refresh)),
          if (_items.isNotEmpty)
            IconButton(
              onPressed: _clearCart,
              tooltip: 'ล้างตะกร้า',
              icon: const Icon(Icons.delete_sweep_outlined, color: AppColors.danger),
            ),
        ],
      ),
      body: _loading
          ? const PageLoading()
          : _error != null && _items.isEmpty
              ? ErrorMessage(_error!, onRetry: _load)
              : _items.isEmpty
                  ? Center(
                      child: Column(mainAxisSize: MainAxisSize.min, children: [
                        Container(
                          width: 76,
                          height: 76,
                          decoration: BoxDecoration(color: AppColors.pinkSoft, borderRadius: BorderRadius.circular(24)),
                          child: const Icon(Icons.shopping_bag_outlined, size: 38, color: AppColors.pink),
                        ),
                        const SizedBox(height: 16),
                        const Text('ตะกร้าของคุณยังว่าง', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 17)),
                        const SizedBox(height: 12),
                        OutlinedButton.icon(
                          onPressed: () => context.go('/shop'),
                          icon: const Icon(Icons.local_pharmacy_outlined),
                          label: const Text('เลือกร้านขายยา'),
                        ),
                      ]),
                    )
                  : Column(children: [
                      if (pharmacy.isNotEmpty)
                        Container(
                          width: double.infinity,
                          margin: const EdgeInsets.fromLTRB(16, 12, 16, 0),
                          padding: const EdgeInsets.all(14),
                          decoration: BoxDecoration(color: AppColors.pinkSoft, borderRadius: BorderRadius.circular(12)),
                          child: Row(children: [
                            const Icon(Icons.storefront_outlined, color: AppColors.pink),
                            const SizedBox(width: 10),
                            Expanded(child: Text(pharmacy['pharmacy_name']?.toString() ?? 'ร้านขายยา', style: const TextStyle(fontWeight: FontWeight.w700))),
                            Text('${_cart['total_quantity'] ?? _items.length} ชิ้น', style: const TextStyle(color: AppColors.muted)),
                          ]),
                        ),
                      Expanded(
                        child: ListView.separated(
                          padding: const EdgeInsets.all(16),
                          itemCount: _items.length,
                          separatorBuilder: (_, __) => const SizedBox(height: 10),
                          itemBuilder: (context, index) {
                            final item = _items[index];
                            final image = item['image']?.toString();
                            final quantity = int.tryParse('${item['quantity']}') ?? 1;
                            final stock = int.tryParse('${item['stock']}') ?? 0;
                            return Card(
                              child: Padding(
                                padding: const EdgeInsets.all(14),
                                child: Column(children: [
                                  Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                                    ClipRRect(
                                      borderRadius: BorderRadius.circular(10),
                                      child: image == null || image.isEmpty
                                          ? Container(width: 76, height: 76, color: AppColors.pinkSoft, child: const Icon(Icons.medication_outlined, color: AppColors.pink))
                                          : Image.network(
                                              '$apiRoot/uploads/products/${Uri.encodeComponent(image)}',
                                              width: 76,
                                              height: 76,
                                              fit: BoxFit.cover,
                                              errorBuilder: (_, __, ___) => Container(width: 76, height: 76, color: AppColors.pinkSoft, child: const Icon(Icons.image_not_supported_outlined)),
                                            ),
                                    ),
                                    const SizedBox(width: 12),
                                    Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                                      Text(item['product_name']?.toString() ?? '-', style: const TextStyle(fontWeight: FontWeight.w700)),
                                      if (item['type'] != null) ...[
                                        const SizedBox(height: 4),
                                        Text(item['type'].toString(), style: const TextStyle(color: AppColors.muted)),
                                      ],
                                      const SizedBox(height: 6),
                                      Text('฿${item['price'] ?? 0} / ชิ้น', style: const TextStyle(fontWeight: FontWeight.w600)),
                                    ])),
                                    IconButton(onPressed: () => _remove(item), tooltip: 'นำออก', icon: const Icon(Icons.delete_outline, color: AppColors.danger)),
                                  ]),
                                  const Divider(height: 22),
                                  Row(children: [
                                    const Text('จำนวน'),
                                    const SizedBox(width: 8),
                                    IconButton(
                                      onPressed: quantity > 1 ? () => _changeQuantity(item, -1) : null,
                                      tooltip: 'ลดจำนวน',
                                      icon: const Icon(Icons.remove_circle_outline),
                                    ),
                                    Container(
                                      constraints: const BoxConstraints(minWidth: 34),
                                      alignment: Alignment.center,
                                      child: Text('$quantity', style: const TextStyle(fontWeight: FontWeight.w700)),
                                    ),
                                    IconButton(
                                      onPressed: quantity < stock ? () => _changeQuantity(item, 1) : null,
                                      tooltip: 'เพิ่มจำนวน',
                                      icon: const Icon(Icons.add_circle_outline),
                                    ),
                                    const Spacer(),
                                    Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
                                      const Text('รวม'),
                                      Text('฿${item['subtotal'] ?? 0}', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800)),
                                    ]),
                                  ]),
                                ]),
                              ),
                            );
                          },
                        ),
                      ),
                      SafeArea(
                        top: false,
                        child: Container(
                          width: double.infinity,
                          padding: const EdgeInsets.fromLTRB(18, 14, 18, 16),
                          decoration: const BoxDecoration(
                            color: Colors.white,
                            border: Border(top: BorderSide(color: AppColors.border)),
                          ),
                          child: Column(children: [
                            Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                              const Text('ยอดรวม', style: TextStyle(fontWeight: FontWeight.w600)),
                              Text('฿${_cart['total_price'] ?? _cart['total'] ?? 0}', style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w800)),
                            ]),
                            const SizedBox(height: 12),
                            FilledButton(onPressed: () => context.push('/checkout', extra: _cart), child: const Text('ไปยืนยันคำสั่งซื้อ')),
                          ]),
                        ),
                      ),
                    ]),
    );
  }
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
  Map<String, dynamic> _pharmacy = {};
  double _total = 0;
  bool _locationLoading = false;
  String? _locationError;
  double? _deliveryLatitude;
  double? _deliveryLongitude;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final extra = GoRouterState.of(context).extra;
    if (extra is Map && _items.isEmpty) {
      final data = Map<String, dynamic>.from(extra);
      _items = asMapList(data['items']);
      _total = double.tryParse('${data['total_price'] ?? 0}') ?? 0;
      _pharmacy = Map<String, dynamic>.from(data['pharmacy'] as Map? ?? {});
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
      _deliveryLatitude = position.latitude;
      _deliveryLongitude = position.longitude;
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

  Future<({double latitude, double longitude})> _geocodeDeliveryAddress(String address) async {
    final response = await Dio().get<dynamic>(
      'https://nominatim.openstreetmap.org/search',
      queryParameters: {
        'countrycodes': 'th',
        'format': 'jsonv2',
        'limit': 1,
        'q': address,
      },
    );
    if (response.data is! List || (response.data as List).isEmpty) {
      throw Exception('ไม่พบพิกัดที่อยู่จัดส่ง กรุณาระบุที่อยู่ให้ชัดเจน');
    }
    final result = (response.data as List).first;
    if (result is! Map) throw Exception('ไม่พบพิกัดที่อยู่จัดส่ง กรุณาระบุที่อยู่ให้ชัดเจน');
    final latitude = double.tryParse('${result['lat']}');
    final longitude = double.tryParse('${result['lon']}');
    if (latitude == null || longitude == null) {
      throw Exception('ไม่พบพิกัดที่อยู่จัดส่ง กรุณาระบุที่อยู่ให้ชัดเจน');
    }
    return (latitude: latitude, longitude: longitude);
  }

  double _distanceInKilometers(double firstLatitude, double firstLongitude, double secondLatitude, double secondLongitude) {
    double toRadians(double degrees) => degrees * math.pi / 180;
    final latitudeDifference = toRadians(secondLatitude - firstLatitude);
    final longitudeDifference = toRadians(secondLongitude - firstLongitude);
    final haversine = math.pow(math.sin(latitudeDifference / 2), 2) +
        math.cos(toRadians(firstLatitude)) *
            math.cos(toRadians(secondLatitude)) *
            math.pow(math.sin(longitudeDifference / 2), 2);
    return 6371 * 2 * math.atan2(math.sqrt(haversine), math.sqrt(1 - haversine));
  }

  Future<void> _placeOrder() async {
    final address = _address.text.trim();
    final delivery = [address, _details.text.trim()].where((part) => part.isNotEmpty).join(' ');
    if (_name.text.trim().isEmpty || _phone.text.trim().isEmpty || address.isEmpty) {
      setState(() => _error = 'กรุณากรอกชื่อ เบอร์โทร และที่อยู่จัดส่ง'); return;
    }
    if (_items.isEmpty) {
      setState(() => _error = 'ตะกร้าว่าง'); return;
    }
    setState(() { _loading = true; _error = null; });
    try {
      final storeLatitude = double.tryParse('${_pharmacy['latitude']}');
      final storeLongitude = double.tryParse('${_pharmacy['longitude']}');
      if (storeLatitude == null || storeLongitude == null ||
          !storeLatitude.isFinite || !storeLongitude.isFinite) {
        throw Exception('ร้านค้าไม่มีพิกัดที่อยู่ จึงไม่สามารถตรวจสอบระยะจัดส่งได้');
      }

      final destination = _deliveryLatitude != null && _deliveryLongitude != null
          ? (latitude: _deliveryLatitude!, longitude: _deliveryLongitude!)
          : await _geocodeDeliveryAddress(address);
      final deliveryDistance = _distanceInKilometers(
        storeLatitude,
        storeLongitude,
        destination.latitude,
        destination.longitude,
      );
      if (deliveryDistance > 5) {
        throw Exception('ที่อยู่จัดส่งอยู่ห่างจากร้าน ${deliveryDistance.toStringAsFixed(2)} กม. ร้านจัดส่งได้ไม่เกิน 5 กม.');
      }

      final response = await ApiClient.instance.post('/orders/checkout', data: {
        'receiver_name': _name.text.trim(),
        'receiver_phone': _phone.text.trim(),
        'delivery_address': delivery,
        'delivery_latitude': destination.latitude,
        'delivery_longitude': destination.longitude,
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
      if (mounted) setState(() => _error = apiError(error));
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
            onChanged: (_) {
              _deliveryLatitude = null;
              _deliveryLongitude = null;
            },
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
