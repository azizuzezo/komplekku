import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:komplekku/app/theme/app_theme.dart';

void main() {
  test('Flutter uses the owner-approved Komplekku brand palette', () {
    expect(KomplekkuColors.primary.toARGB32(), 0xFF4B2DA1);
    expect(KomplekkuColors.primaryDark.toARGB32(), 0xFF32178F);
    expect(KomplekkuColors.surfaceMuted.toARGB32(), 0xFFEEE9FF);
    expect(KomplekkuColors.accent.toARGB32(), 0xFF32BCE3);
    expect(KomplekkuColors.logoAccent.toARGB32(), 0xFFFFEB22);
    expect(KomplekkuColors.success.toARGB32(), 0xFF20A464);
    expect(KomplekkuColors.danger.toARGB32(), 0xFFE5484D);
    expect(KomplekkuColors.background.toARGB32(), 0xFFFFFFFF);
  });

  test('prototype theme keeps Plus Jakarta Sans and compact card geometry', () {
    final theme = buildKomplekkuTheme();

    expect(theme.textTheme.bodyMedium?.fontFamily, 'Plus Jakarta Sans');
    final shape = theme.cardTheme.shape! as RoundedRectangleBorder;
    final radius = shape.borderRadius.resolve(null).topLeft.x;
    expect(radius, 16);
  });
}
