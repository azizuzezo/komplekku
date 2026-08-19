import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:komplekku/shared/widgets/app_empty_state.dart';

class NotFoundScreen extends StatelessWidget {
  const NotFoundScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: AppEmptyState(
          icon: Icons.location_off_outlined,
          title: 'Halaman tidak ditemukan',
          message: 'Alamat ini belum tersedia di aplikasi Komplekku.',
          actionLabel: 'Kembali ke beranda',
          onAction: () => context.go('/beranda'),
        ),
      ),
    );
  }
}
