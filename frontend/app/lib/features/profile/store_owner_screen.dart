import 'dart:typed_data';

import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:geolocator/geolocator.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:latlong2/latlong.dart';

import '../../core/api_client.dart';
import '../../core/widgets.dart';

class StoreOwnerScreen extends StatefulWidget {
  const StoreOwnerScreen({super.key});
  @override
  State<StoreOwnerScreen> createState() => _StoreOwnerScreenState();
}

class _StoreOwnerScreenState extends State<StoreOwnerScreen> {
  bool _loading = true;
  String? _error;
  List<Map<String, dynamic>> _stores = [];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final response = await ApiClient.instance.get('/pharmacies/my/verified');
      setState(() => _stores = asMapList(response['data']));
    } catch (error) {
      setState(() => _error = apiError(error));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _editPromptPay(Map<String, dynamic> store) async {
    final controller = TextEditingController(
      text: store['promptpay_number']?.toString() ?? '',
    );
    final save = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('PromptPay • ${store['pharmacy_name'] ?? 'ร้านยา'}'),
        content: TextField(
          controller: controller,
          keyboardType: TextInputType.phone,
          decoration: const InputDecoration(labelText: 'เบอร์ PromptPay'),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('ยกเลิก'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('บันทึก'),
          ),
        ],
      ),
    );
    if (save == true && controller.text.trim().isNotEmpty) {
      try {
        await ApiClient.instance.put(
          '/pharmacies/${store['pharmacy_id']}/promptpay',
          data: {'promptpay_number': controller.text.trim()},
        );
        await _load();
      } catch (error) {
        if (mounted) {
          ScaffoldMessenger.of(
            context,
          ).showSnackBar(SnackBar(content: Text(apiError(error))));
        }
      }
    }
    controller.dispose();
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(
      title: const Text('จัดการร้านของฉัน'),
      actions: [
        IconButton(
          onPressed: () => context.push('/pharmacy/register'),
          icon: const Icon(Icons.add_business_outlined),
        ),
      ],
    ),
    body: _loading
        ? const PageLoading()
        : _error != null
        ? ErrorMessage(_error!, onRetry: _load)
        : _stores.isEmpty
        ? Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Text('ยังไม่มีร้านที่เปิดใช้งาน'),
                const SizedBox(height: 12),
                FilledButton(
                  onPressed: () => context.push('/pharmacy/register'),
                  child: const Text('ลงทะเบียนร้าน'),
                ),
              ],
            ),
          )
        : ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: _stores.length,
            separatorBuilder: (_, __) => const SizedBox(height: 10),
            itemBuilder: (context, index) {
              final store = _stores[index];
              return Card(
                child: Column(
                  children: [
                    ListTile(
                      title: Text(
                        store['pharmacy_name']?.toString() ?? 'ร้านยา',
                        style: const TextStyle(fontWeight: FontWeight.w800),
                      ),
                      subtitle: Text(store['phone']?.toString() ?? ''),
                      leading: const Icon(Icons.storefront_outlined),
                    ),
                    const Divider(height: 1),
                    Wrap(
                      spacing: 8,
                      children: [
                        TextButton.icon(
                          onPressed: () => context.push(
                            '/pharmacy/${store['pharmacy_id']}/dashboard',
                          ),
                          icon: const Icon(Icons.insights_outlined),
                          label: const Text('แดชบอร์ด'),
                        ),
                        TextButton.icon(
                          onPressed: () => context.push(
                            '/pharmacy/${store['pharmacy_id']}/manage-products',
                          ),
                          icon: const Icon(Icons.inventory_2_outlined),
                          label: const Text('สินค้า'),
                        ),
                        TextButton.icon(
                          onPressed: () => context.push(
                            '/pharmacy/${store['pharmacy_id']}/orders',
                          ),
                          icon: const Icon(Icons.receipt_long_outlined),
                          label: const Text('คำสั่งซื้อ'),
                        ),
                        TextButton.icon(
                          onPressed: () => _editPromptPay(store),
                          icon: const Icon(Icons.qr_code_2),
                          label: const Text('PromptPay'),
                        ),
                      ],
                    ),
                  ],
                ),
              );
            },
          ),
  );
}

class PharmacyRegistrationScreen extends StatefulWidget {
  const PharmacyRegistrationScreen({super.key});
  @override
  State<PharmacyRegistrationScreen> createState() =>
      _PharmacyRegistrationScreenState();
}

class _PharmacyRegistrationScreenState
    extends State<PharmacyRegistrationScreen> {
  final _name = TextEditingController();
  final _email = TextEditingController();
  final _phone = TextEditingController();
  final _latitude = TextEditingController();
  final _longitude = TextEditingController();
  final _locationSearch = TextEditingController();
  final _geocoder = Dio();
  final _mapController = MapController();
  bool _loading = false;
  bool _locating = false;
  bool _mapReady = false;
  LatLng _mapCenter = const LatLng(13.7563, 100.5018);
  LatLng? _selectedPosition;
  String? _locationLabel;
  String? _locationSearchError;
  bool _searchingLocation = false;
  List<Map<String, dynamic>> _locationResults = [];
  DateTime? _lastLocationSearchAt;
  Uint8List? _licenseBytes;
  String? _licenseName;
  String? _error;

  @override
  void dispose() {
    _name.dispose();
    _email.dispose();
    _phone.dispose();
    _latitude.dispose();
    _longitude.dispose();
    _locationSearch.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_licenseBytes == null || _licenseName == null) {
      setState(() => _error = 'กรุณาแนบใบประกอบวิชาชีพ');
      return;
    }
    final latitude = double.tryParse(_latitude.text.trim());
    final longitude = double.tryParse(_longitude.text.trim());
    if ((_latitude.text.trim().isNotEmpty ||
            _longitude.text.trim().isNotEmpty) &&
        (latitude == null ||
            longitude == null ||
            latitude < -90 ||
            latitude > 90 ||
            longitude < -180 ||
            longitude > 180)) {
      setState(
        () => _error =
            'กรุณาระบุละติจูด (-90 ถึง 90) และลองจิจูด (-180 ถึง 180) ให้ถูกต้อง',
      );
      return;
    }
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      await ApiClient.instance.uploadBytes(
        '/pharmacies/register',
        fieldName: 'license',
        bytes: _licenseBytes!,
        filename: _licenseName!,
        fields: {
          'pharmacy_name': _name.text.trim(),
          'email': _email.text.trim(),
          'phone': _phone.text.trim(),
          if (latitude != null && longitude != null)
            'latitude': latitude.toString(),
          if (latitude != null && longitude != null)
            'longitude': longitude.toString(),
        },
      );
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('ส่งคำขอลงทะเบียนแล้ว รอ Admin อนุมัติ'),
          ),
        );
        context.pop();
      }
    } catch (error) {
      setState(() => _error = apiError(error));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _pickLicense() async {
    final image = await ImagePicker().pickImage(
      source: ImageSource.gallery,
      imageQuality: 85,
    );
    if (image != null) {
      final bytes = await image.readAsBytes();
      if (mounted) {
        setState(() {
          _licenseBytes = bytes;
          _licenseName = image.name;
          _error = null;
        });
      }
    }
  }

  Future<void> _locate() async {
    setState(() {
      _locating = true;
      _error = null;
    });
    try {
      if (!await Geolocator.isLocationServiceEnabled()) {
        throw Exception('กรุณาเปิด Location');
      }
      var permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
      }
      if (permission == LocationPermission.denied ||
          permission == LocationPermission.deniedForever) {
        throw Exception('ไม่ได้รับอนุญาตให้เข้าถึงตำแหน่ง');
      }
      final position = await Geolocator.getCurrentPosition();
      if (mounted) {
        final point = LatLng(position.latitude, position.longitude);
        setState(() {
          _latitude.text = position.latitude.toStringAsFixed(6);
          _longitude.text = position.longitude.toStringAsFixed(6);
          _mapCenter = point;
          _selectedPosition = point;
          _locationLabel = 'ตำแหน่งปัจจุบัน';
          _locationSearch.clear();
          _locationResults = [];
          _locationSearchError = null;
        });
        if (_mapReady) {
          _mapController.move(point, 15);
        }
      }
    } catch (error) {
      if (mounted) {
        setState(
          () => _error = error.toString().replaceFirst('Exception: ', ''),
        );
      }
    } finally {
      if (mounted) setState(() => _locating = false);
    }
  }

  void _selectMapPosition(LatLng point) {
    setState(() {
      _selectedPosition = point;
      _latitude.text = point.latitude.toStringAsFixed(6);
      _longitude.text = point.longitude.toStringAsFixed(6);
      _locationLabel = 'ตำแหน่งที่เลือกบนแผนที่';
      _locationSearch.clear();
      _locationResults = [];
      _locationSearchError = null;
      _error = null;
    });
  }

  Future<void> _searchLocation() async {
    if (_searchingLocation) return;
    final query = _locationSearch.text.trim();
    if (query.isEmpty) {
      setState(() => _locationSearchError = 'กรุณาพิมพ์ชื่อสถานที่หรือที่อยู่');
      return;
    }

    setState(() {
      _searchingLocation = true;
      _locationSearchError = null;
      _locationResults = [];
    });
    try {
      final lastSearchAt = _lastLocationSearchAt;
      if (lastSearchAt != null) {
        final elapsed = DateTime.now().difference(lastSearchAt);
        const minimumInterval = Duration(seconds: 1);
        if (elapsed < minimumInterval) {
          await Future<void>.delayed(minimumInterval - elapsed);
        }
      }
      if (!mounted) return;
      _lastLocationSearchAt = DateTime.now();
      final response = await _geocoder.get<List<dynamic>>(
        'https://nominatim.openstreetmap.org/search',
        queryParameters: {
          'q': query,
          'format': 'jsonv2',
          'addressdetails': '1',
          'countrycodes': 'th',
          'limit': '5',
        },
        options: Options(
          headers: {
            'User-Agent': 'MedicalApp/1.0 (pharmacy location search)',
            'Accept': 'application/json',
          },
        ),
      );
      final results = (response.data ?? const [])
          .whereType<Map>()
          .map((item) => Map<String, dynamic>.from(item))
          .toList();
      if (!mounted) return;
      setState(() {
        _locationResults = results;
        if (results.isEmpty) {
          _locationSearchError = 'ไม่พบสถานที่นี้ ลองระบุชื่อหรือที่อยู่ใหม่';
        }
      });
    } catch (_) {
      if (mounted) {
        setState(
          () => _locationSearchError = 'ค้นหาตำแหน่งไม่สำเร็จ กรุณาลองใหม่',
        );
      }
    } finally {
      if (mounted) setState(() => _searchingLocation = false);
    }
  }

  void _selectSearchResult(Map<String, dynamic> result) {
    final latitude = double.tryParse(result['lat']?.toString() ?? '');
    final longitude = double.tryParse(result['lon']?.toString() ?? '');
    if (latitude == null || longitude == null) return;

    final point = LatLng(latitude, longitude);
    setState(() {
      _selectedPosition = point;
      _mapCenter = point;
      _latitude.text = latitude.toStringAsFixed(6);
      _longitude.text = longitude.toStringAsFixed(6);
      _locationLabel = result['display_name']?.toString() ?? 'ตำแหน่งที่ค้นหา';
      _locationSearch.text = _locationLabel!;
      _locationResults = [];
      _locationSearchError = null;
      _error = null;
    });
    if (_mapReady) _mapController.move(point, 15);
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text('ลงทะเบียนร้านยา')),
    body: ListView(
      padding: const EdgeInsets.all(20),
      children: [
        TextField(
          controller: _name,
          decoration: const InputDecoration(labelText: 'ชื่อร้าน'),
        ),
        const SizedBox(height: 12),
        TextField(
          controller: _phone,
          keyboardType: TextInputType.phone,
          decoration: const InputDecoration(labelText: 'เบอร์โทร'),
        ),
        const SizedBox(height: 12),
        TextField(
          controller: _email,
          keyboardType: TextInputType.emailAddress,
          decoration: const InputDecoration(labelText: 'อีเมล'),
        ),
        const SizedBox(height: 12),
        OutlinedButton.icon(
          onPressed: _pickLicense,
          icon: const Icon(Icons.upload_file),
          label: Text(
            _licenseBytes == null
                ? 'แนบใบประกอบวิชาชีพ'
                : 'เลือกรูปใบอนุญาตใหม่',
          ),
        ),
        if (_licenseName != null)
          Padding(
            padding: const EdgeInsets.only(top: 8),
            child: Text(_licenseName!),
          ),
        const SizedBox(height: 8),
        OutlinedButton.icon(
          onPressed: _locating ? null : _locate,
          icon: const Icon(Icons.my_location),
          label: Text(
            _locating
                ? 'กำลังค้นหาตำแหน่ง...'
                : _latitude.text.isEmpty || _longitude.text.isEmpty
                ? 'ใช้ตำแหน่งปัจจุบัน'
                : 'อัปเดตตำแหน่งปัจจุบัน',
          ),
        ),
        const SizedBox(height: 8),
        TextField(
          controller: _locationSearch,
          textInputAction: TextInputAction.search,
          onSubmitted: (_) => _searchLocation(),
          decoration: InputDecoration(
            labelText: 'ค้นหาชื่อสถานที่หรือที่อยู่',
            prefixIcon: const Icon(Icons.search),
            suffixIcon: IconButton(
              tooltip: 'ค้นหาบนแผนที่',
              onPressed: _searchingLocation ? null : _searchLocation,
              icon: _searchingLocation
                  ? const SizedBox.square(
                      dimension: 20,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Icon(Icons.arrow_forward),
            ),
          ),
        ),
        if (_locationSearchError != null)
          Padding(
            padding: const EdgeInsets.only(top: 6),
            child: Text(
              _locationSearchError!,
              style: const TextStyle(color: Colors.red),
            ),
          ),
        if (_locationResults.isNotEmpty)
          Card(
            child: Column(
              children: [
                for (final result in _locationResults)
                  ListTile(
                    leading: const Icon(Icons.location_on_outlined),
                    title: Text(
                      result['display_name']?.toString() ?? 'สถานที่',
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    onTap: () => _selectSearchResult(result),
                  ),
              ],
            ),
          ),
        const SizedBox(height: 8),
        Text(
          _locationLabel ?? 'แตะบนแผนที่เพื่อเลือกตำแหน่งร้าน',
          style: const TextStyle(fontWeight: FontWeight.w600),
        ),
        const SizedBox(height: 8),
        ClipRRect(
          borderRadius: BorderRadius.circular(14),
          child: SizedBox(
            height: 280,
            child: FlutterMap(
              mapController: _mapController,
              options: MapOptions(
                initialCenter: _mapCenter,
                initialZoom: 12,
                onTap: (_, point) => _selectMapPosition(point),
                onMapReady: () {
                  _mapReady = true;
                  if (_selectedPosition != null) {
                    _mapController.move(_selectedPosition!, 15);
                  }
                },
              ),
              children: [
                TileLayer(
                  urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                  userAgentPackageName: 'com.medicalapp.mobile_app',
                ),
                if (_selectedPosition != null)
                  MarkerLayer(
                    markers: [
                      Marker(
                        point: _selectedPosition!,
                        width: 44,
                        height: 44,
                        child: const Icon(
                          Icons.location_pin,
                          color: Colors.red,
                          size: 42,
                        ),
                      ),
                    ],
                  ),
                const RichAttributionWidget(
                  attributions: [
                    TextSourceAttribution('© OpenStreetMap contributors'),
                  ],
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 8),
        TextField(
          controller: _latitude,
          readOnly: true,
          decoration: const InputDecoration(labelText: 'ละติจูด'),
        ),
        const SizedBox(height: 8),
        TextField(
          controller: _longitude,
          readOnly: true,
          decoration: const InputDecoration(labelText: 'ลองจิจูด'),
        ),
        if (_error != null)
          Padding(
            padding: const EdgeInsets.only(top: 12),
            child: Text(_error!, style: const TextStyle(color: Colors.red)),
          ),
        const SizedBox(height: 16),
        FilledButton(
          onPressed: _loading ? null : _submit,
          child: Text(_loading ? 'กำลังส่ง...' : 'ส่งคำขอ'),
        ),
      ],
    ),
  );
}
