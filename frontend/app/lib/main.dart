import 'package:flutter/material.dart';

import 'core/app.dart';
import 'core/session.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await AppSession.instance.restore();
  runApp(const MedicalApp());
}
