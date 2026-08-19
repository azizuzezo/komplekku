import 'package:flutter/material.dart';
import 'package:komplekku/core/theme/app_colors.dart';

/// Display/Heading/Title/Body/Label/Caption hierarchy for `/design.md`'s
/// one-family (Plus Jakarta Sans) discipline. Headings stay 700–800 weight,
/// body stays 400–500 — never the weak 400/600 pairing the doc warns against.
abstract final class AppTypography {
  static const _family = 'Plus Jakarta Sans';

  static const display = TextStyle(
    fontFamily: _family,
    fontSize: 34,
    height: 1.15,
    fontWeight: FontWeight.w800,
    letterSpacing: -0.8,
    color: AppColors.textPrimary,
  );

  static const heading = TextStyle(
    fontFamily: _family,
    fontSize: 26,
    height: 1.2,
    fontWeight: FontWeight.w800,
    letterSpacing: -0.6,
    color: AppColors.textPrimary,
  );

  static const title = TextStyle(
    fontFamily: _family,
    fontSize: 20,
    height: 1.3,
    fontWeight: FontWeight.w700,
    letterSpacing: -0.25,
    color: AppColors.textPrimary,
  );

  static const bodyLarge = TextStyle(
    fontFamily: _family,
    fontSize: 16,
    height: 1.55,
    fontWeight: FontWeight.w500,
    color: AppColors.textPrimary,
  );

  static const body = TextStyle(
    fontFamily: _family,
    fontSize: 14,
    height: 1.5,
    fontWeight: FontWeight.w400,
    color: AppColors.textSecondary,
  );

  static const label = TextStyle(
    fontFamily: _family,
    fontSize: 13,
    height: 1.3,
    fontWeight: FontWeight.w700,
    letterSpacing: 0.1,
    color: AppColors.textPrimary,
  );

  static const caption = TextStyle(
    fontFamily: _family,
    fontSize: 12,
    height: 1.35,
    fontWeight: FontWeight.w500,
    color: AppColors.textSecondary,
  );

  /// House codes, dates, times, and money — `/design.md` requires tabular
  /// numerals so digits align down a list instead of jittering column widths.
  static TextStyle tabular(TextStyle base) =>
      base.copyWith(fontFeatures: const [FontFeature.tabularFigures()]);
}
