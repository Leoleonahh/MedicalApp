import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:geolocator/geolocator.dart';
import 'package:latlong2/latlong.dart';
import 'package:url_launcher/url_launcher.dart';

class HospitalScreen extends StatefulWidget {
  const HospitalScreen({super.key});
  @override
  State<HospitalScreen> createState() => _HospitalScreenState();
}

class _HospitalScreenState extends State<HospitalScreen> {
  LatLng _center = const LatLng(13.736717, 100.523186);
  bool _loading = true;
  String? _message;

  @override
  void initState() { super.initState(); _locate(); }

  Future<void> _locate() async {
    try {
      if (!await Geolocator.isLocationServiceEnabled()) throw Exception('กรุณาเปิด Location เพื่อดูบริเวณใกล้เคียง');
      var permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied || permission == LocationPermission.deniedForever) throw Exception('ไม่ได้รับอนุญาตให้เข้าถึงตำแหน่ง');
      final position = await Geolocator.getCurrentPosition();
      setState(() { _center = LatLng(position.latitude, position.longitude); _message = null; });
    } catch (error) { setState(() => _message = error.toString().replaceFirst('Exception: ', '')); }
    finally { if (mounted) setState(() => _loading = false); }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text('สถานพยาบาลใกล้เคียง'), actions: [IconButton(onPressed: () { setState(() => _loading = true); _locate(); }, icon: const Icon(Icons.my_location))]),
    body: Stack(children: [
      FlutterMap(options: MapOptions(initialCenter: _center, initialZoom: 14), children: [
        TileLayer(urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png', userAgentPackageName: 'com.medicalapp.mobile_app'),
        MarkerLayer(markers: [Marker(point: _center, width: 46, height: 46, child: const Icon(Icons.location_pin, color: Colors.red, size: 42))]),
      ]),
      Positioned(left: 14, right: 14, top: 14, child: Card(child: Padding(padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6), child: Row(children: [
        Expanded(child: Text(_message ?? 'ตำแหน่งปัจจุบันของคุณ')),
        IconButton(tooltip: 'ค้นหาโรงพยาบาลในแผนที่', onPressed: () => launchUrl(Uri.parse('https://www.google.com/maps/search/hospitals/@${_center.latitude},${_center.longitude},14z'), mode: LaunchMode.externalApplication), icon: const Icon(Icons.open_in_new)),
      ])))),
      if (_loading) const Positioned(top: 12, right: 12, child: Card(child: Padding(padding: EdgeInsets.all(10), child: SizedBox.square(dimension: 20, child: CircularProgressIndicator(strokeWidth: 2))))),
    ]),
  );
}
