import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../core/api_client.dart';
import '../../core/theme.dart';
import '../../core/widgets.dart';

class PharmacyListScreen extends StatefulWidget {
  const PharmacyListScreen({super.key, this.nearby = false, this.latitude, this.longitude});

  final bool nearby;
  final double? latitude;
  final double? longitude;

  @override
  State<PharmacyListScreen> createState() => _PharmacyListScreenState();
}

class _PharmacyListScreenState extends State<PharmacyListScreen> {
  bool _loading = true;
  String? _error;
  List<Map<String, dynamic>> _pharmacies = [];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() { _loading = true; _error = null; });
    try {
      final response = await ApiClient.instance.get('/pharmacies/verified');
      final pharmacies = asMapList(response['data']);
      if (widget.nearby) {
        pharmacies.sort((first, second) {
          final firstDistance = _distanceTo(first);
          final secondDistance = _distanceTo(second);
          if (firstDistance == null && secondDistance == null) return 0;
          if (firstDistance == null) return 1;
          if (secondDistance == null) return -1;
          return firstDistance.compareTo(secondDistance);
        });
      }
      setState(() => _pharmacies = widget.nearby ? pharmacies.take(3).toList() : pharmacies);
    } catch (error) {
      setState(() => _error = apiError(error));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  double? _distanceTo(Map<String, dynamic> pharmacy) {
    if (widget.latitude == null || widget.longitude == null) return null;
    final pharmacyLatitude = double.tryParse('${pharmacy['latitude']}');
    final pharmacyLongitude = double.tryParse('${pharmacy['longitude']}');
    if (pharmacyLatitude == null || pharmacyLongitude == null) return null;

    const earthRadius = 6371.0;
    double toRadians(double value) => value * math.pi / 180;
    final latitudeDifference = toRadians(pharmacyLatitude - widget.latitude!);
    final longitudeDifference = toRadians(pharmacyLongitude - widget.longitude!);
    final haversine = math.pow(math.sin(latitudeDifference / 2), 2) +
        math.cos(toRadians(widget.latitude!)) *
            math.cos(toRadians(pharmacyLatitude)) *
            math.pow(math.sin(longitudeDifference / 2), 2);
    return earthRadius * 2 * math.atan2(math.sqrt(haversine), math.sqrt(1 - haversine));
  }

  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: AppBar(title: Text(widget.nearby ? 'ร้านขายยาใกล้เคียง' : 'ร้านขายยา'), actions: [IconButton(onPressed: _load, icon: const Icon(Icons.refresh))]),
        body: _loading
            ? const PageLoading()
            : _error != null
                ? ErrorMessage(_error!, onRetry: _load)
                : _pharmacies.isEmpty
                    ? const Center(child: Text('ยังไม่มีร้านขายยาที่เปิดให้บริการ'))
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
                              onTap: () => context.push('/pharmacies/${pharmacy['pharmacy_id']}/products', extra: pharmacy),
                            ));
                          },
                        ),
                      ),
      );
}

class PharmacyProductsScreen extends StatefulWidget {
  const PharmacyProductsScreen({super.key, required this.pharmacyId, this.pharmacy = const {}});
  final String pharmacyId;
  final Map<String, dynamic> pharmacy;

  @override
  State<PharmacyProductsScreen> createState() => _PharmacyProductsScreenState();
}

class _PharmacyProductsScreenState extends State<PharmacyProductsScreen> {
  bool _loading = true;
  String? _error;
  Map<String, dynamic> _pharmacy = {};
  List<Map<String, dynamic>> _products = [];
  String? _woundType;
  List<String> _recommendedNames = [];
  bool _loadingRecommendations = false;

  @override
  void initState() {
    super.initState();
    _pharmacy = widget.pharmacy;
    _load();
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
    if (_woundType == null) return _products;
    String normalize(String value) => value.toLowerCase().replaceAll(RegExp(r'[\s/.-]+'), '');
    return _products.where((product) {
      final name = normalize(product['product_name']?.toString() ?? '');
      return _recommendedNames.any((medicine) {
        final recommended = normalize(medicine);
        return name.contains(recommended) || recommended.contains(name);
      });
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
              icon: const Icon(Icons.shopping_cart_outlined),
            ),
          ],
        ),
        body: _loading
            ? const PageLoading()
            : _error != null
                ? ErrorMessage(_error!, onRetry: _load)
                : Column(children: [
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
                            subtitle: Text('${product['type'] ?? 'สินค้า'} • คงเหลือ $stock ชิ้น\n฿${product['price'] ?? 0}'),
                            isThreeLine: true,
                            trailing: IconButton(onPressed: stock > 0 ? () => _addToCart(product) : null, icon: const Icon(Icons.add_shopping_cart)),
                          ));
                        },
                          )),
                      ]),
      );
}
