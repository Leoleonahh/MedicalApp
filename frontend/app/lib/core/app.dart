import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../features/auth/auth_screen.dart';
import '../features/cart/cart_screen.dart';
import '../features/home/home_screen.dart';
import '../features/history/history_screen.dart';
import '../features/hospital/hospital_screen.dart';
import '../features/orders/orders_screen.dart';
import '../features/pharmacy/pharmacy_screen.dart';
import '../features/pharmacy/store_dashboard_screen.dart';
import '../features/pharmacy/new_store_product_screen.dart';
import '../features/pharmacy/store_orders_screen.dart';
import '../features/pharmacy/store_products_screen.dart';
import '../features/profile/edit_profile_screen.dart';
import '../features/profile/profile_screen.dart';
import '../features/profile/store_owner_screen.dart';
import '../features/wound/predict_screen.dart';
import '../features/wound/result_screen.dart';
import 'session.dart';
import 'theme.dart';

class MedicalApp extends StatefulWidget {
  const MedicalApp({super.key});

  @override
  State<MedicalApp> createState() => _MedicalAppState();
}

class _MedicalAppState extends State<MedicalApp> {
  late final GoRouter _router = GoRouter(
    initialLocation: AppSession.instance.isAuthenticated ? '/home' : '/login',
    refreshListenable: AppSession.instance,
    redirect: (context, state) {
      final isAuthRoute = state.matchedLocation == '/login' ||
          state.matchedLocation == '/register' ||
          state.matchedLocation == '/forgot-password';
      if (!AppSession.instance.isAuthenticated && !isAuthRoute) return '/login';
      if (AppSession.instance.isAuthenticated && isAuthRoute) return '/home';
      return null;
    },
    routes: [
      GoRoute(path: '/login', builder: (_, __) => const AuthScreen()),
      GoRoute(path: '/register', builder: (_, __) => const AuthScreen(registerMode: true)),
      GoRoute(path: '/forgot-password', builder: (_, __) => const ForgotPasswordScreen()),
      ShellRoute(
        builder: (context, state, child) => AppShell(location: state.matchedLocation, child: child),
        routes: [
          GoRoute(path: '/home', builder: (_, __) => const HomeScreen()),
          GoRoute(path: '/shop', builder: (_, state) => PharmacyListScreen(
            nearby: state.uri.queryParameters['nearby'] == 'true',
            latitude: double.tryParse(state.uri.queryParameters['latitude'] ?? ''),
            longitude: double.tryParse(state.uri.queryParameters['longitude'] ?? ''),
          )),
          GoRoute(path: '/history', builder: (_, __) => const HistoryScreen()),
          GoRoute(path: '/profile', builder: (_, __) => const ProfileScreen()),
        ],
      ),
      GoRoute(path: '/predict', builder: (_, __) => const PredictScreen()),
      GoRoute(path: '/result/:imageId', builder: (_, state) => ResultScreen(imageId: state.pathParameters['imageId']!)),
      GoRoute(path: '/hospital', builder: (_, __) => const HospitalScreen()),
      GoRoute(path: '/pharmacies/:id/products', builder: (_, state) => PharmacyProductsScreen(
        pharmacyId: state.pathParameters['id']!,
        pharmacy: state.extra is Map ? Map<String, dynamic>.from(state.extra as Map) : const {},
      )),
      GoRoute(path: '/cart', builder: (_, __) => const CartScreen()),
      GoRoute(path: '/checkout', builder: (_, __) => const CheckoutScreen()),
      GoRoute(path: '/orders', builder: (_, __) => const OrdersScreen()),
      GoRoute(path: '/orders/:id', builder: (_, state) => OrderDetailScreen(orderId: state.pathParameters['id']!)),
      GoRoute(path: '/payment/:id', builder: (_, state) => PaymentScreen(orderId: state.pathParameters['id']!)),
      GoRoute(path: '/pharmacy/register', builder: (_, __) => const PharmacyRegistrationScreen()),
      GoRoute(path: '/pharmacy/manage', builder: (_, __) => const StoreOwnerScreen()),
      GoRoute(path: '/pharmacy/:id/dashboard', builder: (_, state) => StoreDashboardScreen(pharmacyId: state.pathParameters['id']!)),
      GoRoute(path: '/profile/edit', builder: (_, __) => const EditProfileScreen()),
      GoRoute(path: '/profile/password', builder: (_, __) => const ChangePasswordScreen()),
      GoRoute(path: '/pharmacy/:id/manage-products', builder: (_, state) => StoreProductsScreen(pharmacyId: state.pathParameters['id']!)),
      GoRoute(path: '/pharmacy/:id/manage-products/new', builder: (_, state) => NewStoreProductScreen(pharmacyId: state.pathParameters['id']!)),
      GoRoute(path: '/pharmacy/:id/orders', builder: (_, state) => StoreOrdersScreen(pharmacyId: state.pathParameters['id']!)),
      GoRoute(path: '/pharmacy/orders/:id', builder: (_, state) => StoreOrderDetailScreen(orderId: state.pathParameters['id']!)),
    ],
  );

  @override
  Widget build(BuildContext context) => MaterialApp.router(
        title: 'MedicalApp',
        debugShowCheckedModeBanner: false,
        theme: buildAppTheme(),
        routerConfig: _router,
      );
}

class AppShell extends StatelessWidget {
  const AppShell({super.key, required this.location, required this.child});

  final String location;
  final Widget child;

  int get _selectedIndex {
    if (location.startsWith('/shop')) return 1;
    if (location.startsWith('/history')) return 2;
    if (location.startsWith('/profile')) return 3;
    return 0;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: child,
      bottomNavigationBar: NavigationBar(
        selectedIndex: _selectedIndex,
        onDestinationSelected: (index) {
          const paths = ['/home', '/shop', '/history', '/profile'];
          context.go(paths[index]);
        },
        destinations: const [
          NavigationDestination(icon: Icon(Icons.home_outlined), selectedIcon: Icon(Icons.home), label: 'หน้าหลัก'),
          NavigationDestination(icon: Icon(Icons.local_pharmacy_outlined), selectedIcon: Icon(Icons.local_pharmacy), label: 'ร้านยา'),
          NavigationDestination(icon: Icon(Icons.history), label: 'ประวัติ'),
          NavigationDestination(icon: Icon(Icons.person_outline), selectedIcon: Icon(Icons.person), label: 'โปรไฟล์'),
        ],
      ),
    );
  }
}
