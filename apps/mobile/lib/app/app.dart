import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:komplekku/app/router.dart';
import 'package:komplekku/app/theme/app_theme.dart';

class KomplekkuApp extends ConsumerWidget {
  const KomplekkuApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(routerProvider);

    return MaterialApp.router(
      title: 'Komplekku',
      debugShowCheckedModeBanner: false,
      theme: buildKomplekkuTheme(),
      routerConfig: router,
    );
  }
}
