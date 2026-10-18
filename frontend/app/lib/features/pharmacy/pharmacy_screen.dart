import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:go_router/go_router.dart';

import '../../core/api_client.dart';
import '../../core/theme.dart';
import '../../core/widgets.dart';

class PharmacyListScreen extends StatefulWidget {
  const PharmacyListScreen({super.key, this.nearby = false, this.latitude, this.longitude, this.selectedMedicines = const []});

  final bool nearby;
  final double? latitude;
  final double? longitude;
  final List<String> selectedMedicines;

  @override
  State<PharmacyListScreen> createState() => _PharmacyListScreenState();
}

class _PharmacyListScreenState extends State<PharmacyListScreen> {
  bool _loading = true;
  String? _error;
  List<Map<String, dynamic>> _pharmacies = [];
  double? _originLatitude;
  double? _originLongitude;

  @override
  void initState() {
    super.initState();
    _originLatitude = widget.latitude;
    _originLongitude = widget.longitude;
    _load();
  }

  Future<void> _load() async {
    setState(() { _loading = true; _error = null; });
    try {
      if (_originLatitude == null || _originLongitude == null) {
        if (!await Geolocator.isLocationServiceEnabled()) {
          throw Exception('กรุณาเปิด Location เพื่อค้นหาร้านขายยาในระยะจัดส่ง');
        }
        var permission = await Geolocator.checkPermission();
        if (permission == LocationPermission.denied) {
          permission = await Geolocator.requestPermission();
        }
        if (permission == LocationPermission.denied || permission == LocationPermission.deniedForever) {
          throw Exception('ต้องอนุญาต Location เพื่อแสดงร้านขายยาภายในระยะจัดส่ง');
        }
        final position = await Geolocator.getCurrentPosition(
          locationSettings: const LocationSettings(
            accuracy: LocationAccuracy.high,
            timeLimit: Duration(seconds: 10),
          ),
        );
        _originLatitude = position.latitude;
        _originLongitude = position.longitude;
      }

      final response = await ApiClient.instance.get('/pharmacies/verified');
      final pharmacies = asMapList(response['data']);
      pharmacies.sort((first, second) {
        final firstDistance = _distanceTo(first);
        final secondDistance = _distanceTo(second);
        if (firstDistance == null && secondDistance == null) return 0;
        if (firstDistance == null) return 1;
        if (secondDistance == null) return -1;
        return firstDistance.compareTo(secondDistance);
      });
      final pharmaciesInRange = pharmacies
          .where((pharmacy) => (_distanceTo(pharmacy) ?? double.infinity) <= 5)
          .toList();
      setState(() => _pharmacies = widget.nearby ? pharmaciesInRange.take(3).toList() : pharmaciesInRange);
    } catch (error) {
      if (mounted) setState(() => _error = apiError(error).replaceFirst('Exception: ', ''));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  double? _distanceTo(Map<String, dynamic> pharmacy) {
    if (_originLatitude == null || _originLongitude == null) return null;
    final pharmacyLatitude = double.tryParse('${pharmacy['latitude']}');
    final pharmacyLongitude = double.tryParse('${pharmacy['longitude']}');
    if (pharmacyLatitude == null || pharmacyLongitude == null) return null;

    const earthRadius = 6371.0;
    double toRadians(double value) => value * math.pi / 180;
    final latitudeDifference = toRadians(pharmacyLatitude - _originLatitude!);
    final longitudeDifference = toRadians(pharmacyLongitude - _originLongitude!);
    final haversine = math.pow(math.sin(latitudeDifference / 2), 2) +
      math.cos(toRadians(_originLatitude!)) *
            math.cos(toRadians(pharmacyLatitude)) *
            math.pow(math.sin(longitudeDifference / 2), 2);
    return earthRadius * 2 * math.atan2(math.sqrt(haversine), math.sqrt(1 - haversine));
  }

  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: AppBar(title: Text(widget.nearby ? 'ร้านขายยาใกล้บาดแผล' : 'ร้านขายยาใกล้ฉัน'), actions: [IconButton(onPressed: _load, icon: const Icon(Icons.refresh))]),
        body: _loading
            ? const PageLoading()
            : _error != null
                ? ErrorMessage(_error!, onRetry: _load)
                : _pharmacies.isEmpty
                    ? Center(
                        child: Text(
                            widget.nearby
                              ? 'ไม่พบร้านขายยาภายในระยะ 5 กม. จากตำแหน่งบาดแผล'
                              : 'ไม่พบร้านขายยาภายในระยะจัดส่ง 5 กม. จากตำแหน่งปัจจุบัน',
                          textAlign: TextAlign.center,
                        ),
                      )
                    : RefreshIndicator(
                        onRefresh: _load,
                        child: ListView.separated(
                          padding: const EdgeInsets.all(18),
                          itemCount: _pharmacies.length,
                          separatorBuilder: (_, __) => const SizedBox(height: 12),
                          itemBuilder: (context, index) {
                            final pharmacy = _pharmacies[index];
                            final distance = _distanceTo(pharmacy);
                            return Card(child: ListTile(
                              contentPadding: const EdgeInsets.all(14),
                              leading: Container(width: 48, height: 48, decoration: BoxDecoration(color: AppColors.pinkSoft, borderRadius: BorderRadius.circular(15)), child: const Icon(Icons.local_pharmacy, color: AppColors.pink)),
                              title: Text(pharmacy['pharmacy_name']?.toString() ?? 'ร้านขายยา', style: const TextStyle(fontWeight: FontWeight.w800)),
                              subtitle: Text([
                                pharmacy['phone']?.toString() ?? 'ดูสินค้าในร้าน',
                                if (distance != null) 'ห่างจากตำแหน่งแผล ${distance.toStringAsFixed(2)} กม.',
                              ].join(' • ')),
                              trailing: const Icon(Icons.chevron_right),
                              onTap: () => context.push('/pharmacies/${pharmacy['pharmacy_id']}/products', extra: {
                                'pharmacy': pharmacy,
                                'selectedMedicines': widget.selectedMedicines,
                              }),
                            ));
                          },
                        ),
                      ),
      );
}

class PharmacyProductsScreen extends StatefulWidget {
  const PharmacyProductsScreen({super.key, required this.pharmacyId, this.pharmacy = const {}, this.selectedMedicines = const []});
  final String pharmacyId;
  final Map<String, dynamic> pharmacy;
  final List<String> selectedMedicines;

  @override
  State<PharmacyProductsScreen> createState() => _PharmacyProductsScreenState();
}

class _PharmacyProductsScreenState extends State<PharmacyProductsScreen> {
  bool _loading = true;
  String? _error;
  Map<String, dynamic> _pharmacy = {};
  List<Map<String, dynamic>> _products = [];
  int _cartCount = 0;
  String? _woundType;
  List<String> _recommendedNames = [];
  bool _loadingRecommendations = false;

  @override
  void initState() {
    super.initState();
    _pharmacy = widget.pharmacy;
    _load();
    _loadCartCount();
  }

  Future<void> _loadCartCount() async {
    try {
      final response = await ApiClient.instance.get('/cart');
      final cart = Map<String, dynamic>.from(response['data'] as Map? ?? {});
      if (mounted) setState(() => _cartCount = int.tryParse('${cart['total_quantity']}') ?? 0);
    } catch (_) {}
  }

  Future<void> _load() async {
    try {
      final response = await ApiClient.instance.get('/pharmacies/${widget.pharmacyId}/products');
      setState(() {
        _pharmacy = Map<String, dynamic>.from(response['pharmacy'] as Map? ?? _pharmacy);
        _products = asMapList(response['products'] ?? response['data']);
      });
    } catch (error) {
      setState(() => _error = apiError(error));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _addToCart(Map<String, dynamic> product) async {
    try {
      await ApiClient.instance.post('/cart/add', data: {
        'pharmacy_product_id': product['pharmacy_product_id'],
        'quantity': 1,
      });
      await _loadCartCount();
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('เพิ่มสินค้าลงตะกร้าแล้ว')));
    } catch (error) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(apiError(error))));
    }
  }

  Future<void> _filterByWound(String? woundType) async {
    setState(() { _woundType = woundType; _recommendedNames = []; _loadingRecommendations = woundType != null; });
    if (woundType == null) return;
    try {
      final response = await ApiClient.instance.get('/api/medicines/wound-type/$woundType');
      setState(() => _recommendedNames = asMapList(response['data']).map((item) => item['medicine_name'].toString()).toList());
    } catch (error) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(apiError(error))));
    } finally { if (mounted) setState(() => _loadingRecommendations = false); }
  }

  List<Map<String, dynamic>> get _visibleProducts {
    String normalize(String value) => value.toLowerCase().replaceAll(RegExp(r'[\s/.-]+'), '');
    return _products.where((product) {
      final name = normalize(product['product_name']?.toString() ?? '');
      final matchesSelectedMedicine = widget.selectedMedicines.isEmpty || widget.selectedMedicines.any((medicine) {
        final selected = normalize(medicine);
        return name.contains(selected) || selected.contains(name);
      });
      final matchesWoundType = _woundType == null || _recommendedNames.any((medicine) {
        final recommended = normalize(medicine);
        return name.contains(recommended) || recommended.contains(name);
      });
      return matchesSelectedMedicine && matchesWoundType;
    }).toList();
  }

  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: AppBar(
          title: Text(_pharmacy['pharmacy_name']?.toString() ?? 'สินค้าในร้าน'),
          actions: [
            IconButton(
              onPressed: () => context.push('/cart'),
              tooltip: 'ตะกร้าสินค้า',
              icon: Badge(
                isLabelVisible: _cartCount > 0,
                label: Text(_cartCount > 99 ? '99+' : '$_cartCount'),
                child: const Icon(Icons.shopping_cart_outlined),
              ),
            ),
          ],
        ),
        body: _loading
            ? const PageLoading()
            : _error != null
                ? ErrorMessage(_error!, onRetry: _load)
                : Column(children: [
                    if (widget.selectedMedicines.isNotEmpty)
                      Padding(
                        padding: const EdgeInsets.fromLTRB(16, 10, 16, 0),
                        child: Align(
                          alignment: Alignment.centerLeft,
                          child: Text('ยาที่เลือก: ${widget.selectedMedicines.join(', ')}'),
                        ),
                      ),
                    Padding(padding: const EdgeInsets.fromLTRB(16, 10, 16, 6), child: DropdownButtonFormField<String>(
                      initialValue: _woundType,
                      decoration: const InputDecoration(labelText: 'กรองสินค้าตามบาดแผล'),
                      items: const [
                        DropdownMenuItem(value: null, child: Text('สินค้าทั้งหมด')),
                        DropdownMenuItem(value: 'cut_small', child: Text('แผลฉีกขาดขนาดเล็ก')),
                        DropdownMenuItem(value: 'cut_large', child: Text('แผลฉีกขาดขนาดใหญ่')),
                        DropdownMenuItem(value: 'abrasion', child: Text('แผลถลอก')),
                        DropdownMenuItem(value: 'burn', child: Text('แผลน้ำร้อนลวก')),
                        DropdownMenuItem(value: 'bruise', child: Text('แผลฟกช้ำ')),
                      ],
                      onChanged: _loadingRecommendations ? null : _filterByWound,
                    )),
                    Expanded(child: _products.isEmpty
                        ? const Center(child: Text('ร้านนี้ยังไม่มีสินค้า'))
                        : _visibleProducts.isEmpty
                            ? Center(child: Text(_loadingRecommendations ? 'กำลังโหลดรายการยา...' : 'ไม่พบสินค้าที่แนะนำสำหรับบาดแผลนี้'))
                            : ListView.separated(
                        padding: const EdgeInsets.all(16),
                        itemCount: _visibleProducts.length,
                        separatorBuilder: (_, __) => const SizedBox(height: 10),
                        itemBuilder: (context, index) {
                          final product = _visibleProducts[index];
                          final stock = int.tryParse('${product['stock']}') ?? 0;
                          final description = product['description']?.toString().trim();
                          final image = product['image']?.toString();
                          final apiRoot = ApiClient.instance.dio.options.baseUrl;
                          return Card(child: ListTile(
                            contentPadding: const EdgeInsets.all(14),
                            leading: image == null || image.isEmpty
                                ? const SizedBox(
                                    width: 56,
                                    height: 56,
                                    child: Icon(Icons.medication_outlined),
                                  )
                                : ClipRRect(
                                    borderRadius: BorderRadius.circular(8),
                                    child: Image.network(
                                      '$apiRoot/uploads/products/${Uri.encodeComponent(image)}',
                                      width: 56,
                                      height: 56,
                                      fit: BoxFit.cover,
                                      errorBuilder: (_, __, ___) => const SizedBox(
                                        width: 56,
                                        height: 56,
                                        child: Icon(Icons.image_not_supported_outlined),
                                      ),
                                    ),
                                  ),
                            title: Text(product['product_name']?.toString() ?? '-', style: const TextStyle(fontWeight: FontWeight.w700)),
                            subtitle: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Text(
                                  description == null || description.isEmpty ? 'ไม่มีรายละเอียดสินค้า' : description,
                                  maxLines: 2,
                                  overflow: TextOverflow.ellipsis,
                                ),
                                const SizedBox(height: 4),
                                Text('${product['type'] ?? 'สินค้า'} • คงเหลือ $stock ชิ้น • ฿${product['price'] ?? 0}'),
                              ],
                            ),
                            isThreeLine: true,
                            trailing: IconButton(onPressed: stock > 0 ? () => _addToCart(product) : null, icon: const Icon(Icons.add_shopping_cart)),
                          ));
                        },
                          )),
                      ]),
      );
}
