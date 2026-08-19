import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:komplekku/core/theme/app_theme.dart';

void main() {
  test('Flutter uses the owner-approved Komplekku brand palette', () {
    expect(AppColors.primary.toARGB32(), 0xFF4B2DA1);
    expect(AppColors.primaryDark.toARGB32(), 0xFF32178F);
    expect(AppColors.surfaceMuted.toARGB32(), 0xFFEEE9FF);
    expect(AppColors.accent.toARGB32(), 0xFF32BCE3);
    expect(AppColors.logoAccent.toARGB32(), 0xFFFFEB22);
    expect(AppColors.success.toARGB32(), 0xFF20A464);
    expect(AppColors.danger.toARGB32(), 0xFFE5484D);
    expect(AppColors.background.toARGB32(), 0xFFFFFFFF);
  });

  test('prototype theme keeps Plus Jakarta Sans and compact card geometry', () {
    final theme = buildAppTheme();

    expect(theme.textTheme.bodyMedium?.fontFamily, 'Plus Jakarta Sans');
    final shape = theme.cardTheme.shape! as RoundedRectangleBorder;
    final radius = shape.borderRadius.resolve(null).topLeft.x;
    // design.md caps card radius at 12px; the implementation previously drifted to 16.
    expect(radius, 12);
  });
}
