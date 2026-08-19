import 'package:flutter/material.dart';

/// Color tokens locked in `/design.md` (owner direction, 2026-08-19: purple
/// `brand` + cyan `accent` + yellow `logoAccent`, forest-green retired).
/// Every screen must read from here — never hardcode a hex value inline.
abstract final class AppColors {
  // Surfaces
  static const background = Color(0xFFFFFFFF);
  static const brandCanvas = Color(0xFFFFFFFF);
  static const surface = Color(0xFFFFFFFF);
  static const surfaceSoft = Color(0xFFF6F6F8);
  static const surfaceMuted = Color(0xFFEEE9FF);

  // Ink
  static const textPrimary = Color(0xFF25232B);
  static const textSecondary = Color(0xFF777480);

  // Structure
  static const border = Color(0xFFDEDCE4);
  static const borderStrong = Color(0xFFC9C5D2);

  // Brand
  static const primary = Color(0xFF4B2DA1);
  static const primaryDark = Color(0xFF32178F);
  static const accent = Color(0xFF32BCE3);
  static const logoAccent = Color(0xFFFFEB22);

  // Status — reserved for IMPORTANT/URGENT notices and operational state,
  // never as decoration (design.md "Content rules").
  static const danger = Color(0xFFE5484D);
  static const success = Color(0xFF20A464);
  static const warning = Color(0xFFDD8214);
}
