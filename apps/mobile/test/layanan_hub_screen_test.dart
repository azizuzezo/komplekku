import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:komplekku/app/shell/layanan_hub_screen.dart';
import 'package:komplekku/app/theme/app_theme.dart';
import 'package:komplekku/core/auth/permissions_provider.dart';

void main() {
  Widget wrap({required List<String> permissions}) {
    final router = GoRouter(
      initialLocation: '/layanan',
      routes: [
        GoRoute(
          path: '/layanan',
          builder: (context, state) => const LayananHubScreen(),
        ),
      ],
    );
    return ProviderScope(
      overrides: [currentPermissionsProvider.overrideWithValue(permissions)],
      child: MaterialApp.router(
        theme: buildKomplekkuTheme(),
        routerConfig: router,
      ),
    );
  }

  testWidgets('shows Warga and Keamanan but hides Pengurus with no admin permission', (
    tester,
  ) async {
    await tester.pumpWidget(wrap(permissions: const ['invoice.read']));
    await tester.pumpAndSettle();

    expect(find.text('Layanan'), findsOneWidget);
    expect(find.text('Warga'), findsOneWidget);
    expect(find.text('Iuran'), findsOneWidget);
    expect(find.text('Lapor Masalah'), findsNothing); // gated by report.create
    expect(find.text('Keamanan'), findsWidgets);
    expect(find.text('Pengurus'), findsNothing);
  });

  testWidgets('hides every section when the account holds no permissions', (
    tester,
  ) async {
    await tester.pumpWidget(wrap(permissions: const []));
    await tester.pumpAndSettle();

    expect(find.text('Layanan'), findsOneWidget);
    expect(find.text('Warga'), findsNothing);
    expect(find.text('Keuangan'), findsNothing);
    expect(find.text('Pengurus'), findsNothing);
    // Keamanan carries no permission of its own, so it always stays visible.
    expect(find.text('Keamanan'), findsWidgets);
  });

  testWidgets('shows the Pengurus section once the account holds an admin permission', (
    tester,
  ) async {
    await tester.pumpWidget(
      wrap(permissions: const ['resident.manage', 'community.manage']),
    );
    await tester.pumpAndSettle();

    expect(find.text('Pengurus'), findsOneWidget);
    expect(find.text('Permohonan Warga'), findsOneWidget);
    expect(find.text('Kelola Komunitas'), findsOneWidget);
    expect(find.text('Kelola Rumah'), findsOneWidget);
    expect(find.text('Kelola Pengguna'), findsOneWidget);
  });
}
