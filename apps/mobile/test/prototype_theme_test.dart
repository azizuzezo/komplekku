import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:komplekku/app/theme/app_theme.dart';

void main() {
  test('Flutter uses the owner-approved green prototype palette', () {
    expect(KomplekkuColors.primary.toARGB32(), 0xFF008A52);
    expect(KomplekkuColors.primaryDark.toARGB32(), 0xFF006B3F);
    expect(KomplekkuColors.surfaceMuted.toARGB32(), 0xFFEEF8F2);
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
