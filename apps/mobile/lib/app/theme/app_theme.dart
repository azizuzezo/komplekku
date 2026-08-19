import 'package:flutter/material.dart';

abstract final class KomplekkuColors {
  static const primary = Color(0xFF008A52);
  static const primaryDark = Color(0xFF006B3F);
  static const background = Color(0xFFFFFFFF);
  static const brandCanvas = Color(0xFFFFFFFF);
  static const surface = Color(0xFFFFFFFF);
  static const surfaceSoft = Color(0xFFF7FAF8);
  static const surfaceMuted = Color(0xFFEEF8F2);
  static const textPrimary = Color(0xFF101119);
  static const textSecondary = Color(0xFF666A73);
  static const border = Color(0xFFE0E4E2);
  static const borderStrong = Color(0xFFC9D2CD);
  static const accent = Color(0xFF0AA6A6);
  static const danger = Color(0xFFE51D3F);
  static const success = Color(0xFF008A52);
}

ThemeData buildKomplekkuTheme() {
  final scheme =
      ColorScheme.fromSeed(
        seedColor: KomplekkuColors.primary,
        brightness: Brightness.light,
        surface: KomplekkuColors.surface,
        error: KomplekkuColors.danger,
      ).copyWith(
        primary: KomplekkuColors.primary,
        onPrimary: KomplekkuColors.surface,
        primaryContainer: KomplekkuColors.surfaceSoft,
        onPrimaryContainer: KomplekkuColors.primaryDark,
        secondary: KomplekkuColors.accent,
        onSecondary: KomplekkuColors.textPrimary,
        onSurface: KomplekkuColors.textPrimary,
        outline: KomplekkuColors.border,
        outlineVariant: KomplekkuColors.borderStrong,
      );

  return ThemeData(
    useMaterial3: true,
    colorScheme: scheme,
    scaffoldBackgroundColor: KomplekkuColors.background,
    fontFamily: 'Plus Jakarta Sans',
    appBarTheme: const AppBarThemeData(
      backgroundColor: KomplekkuColors.background,
      foregroundColor: KomplekkuColors.textPrimary,
      surfaceTintColor: Colors.transparent,
      elevation: 0,
    ),
    textTheme: const TextTheme(
      headlineMedium: TextStyle(
        color: KomplekkuColors.textPrimary,
        fontSize: 30,
        height: 1.15,
        fontWeight: FontWeight.w700,
        letterSpacing: -0.7,
      ),
      titleLarge: TextStyle(
        color: KomplekkuColors.textPrimary,
        fontSize: 20,
        height: 1.3,
        fontWeight: FontWeight.w700,
        letterSpacing: -0.25,
      ),
      bodyLarge: TextStyle(
        color: KomplekkuColors.textPrimary,
        fontSize: 16,
        height: 1.55,
      ),
      bodyMedium: TextStyle(
        color: KomplekkuColors.textSecondary,
        fontSize: 14,
        height: 1.5,
      ),
    ),
    inputDecorationTheme: const InputDecorationThemeData(
      filled: true,
      fillColor: KomplekkuColors.surface,
      errorMaxLines: 3,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.all(Radius.circular(10)),
        borderSide: BorderSide(color: KomplekkuColors.border),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.all(Radius.circular(10)),
        borderSide: BorderSide(color: KomplekkuColors.border),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.all(Radius.circular(10)),
        borderSide: BorderSide(color: KomplekkuColors.primary, width: 2),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.all(Radius.circular(10)),
        borderSide: BorderSide(color: KomplekkuColors.danger),
      ),
      focusedErrorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.all(Radius.circular(10)),
        borderSide: BorderSide(color: KomplekkuColors.danger, width: 2),
      ),
      contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 14),
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        minimumSize: const Size.fromHeight(52),
        backgroundColor: KomplekkuColors.primary,
        foregroundColor: KomplekkuColors.surface,
        textStyle: const TextStyle(fontWeight: FontWeight.w700),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        minimumSize: const Size.fromHeight(52),
        foregroundColor: KomplekkuColors.primary,
        side: const BorderSide(color: KomplekkuColors.borderStrong),
        textStyle: const TextStyle(fontWeight: FontWeight.w700),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      ),
    ),
    textButtonTheme: TextButtonThemeData(
      style: TextButton.styleFrom(
        minimumSize: const Size(0, 44),
        foregroundColor: KomplekkuColors.primary,
        textStyle: const TextStyle(fontWeight: FontWeight.w600),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
      ),
    ),
    cardTheme: const CardThemeData(
      color: KomplekkuColors.surface,
      elevation: 0,
      margin: EdgeInsets.zero,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.all(Radius.circular(16)),
        side: BorderSide(color: KomplekkuColors.border),
      ),
    ),
    dividerTheme: const DividerThemeData(
      color: KomplekkuColors.border,
      thickness: 1,
      space: 1,
    ),
    snackBarTheme: SnackBarThemeData(
      behavior: SnackBarBehavior.floating,
      backgroundColor: KomplekkuColors.primaryDark,
      contentTextStyle: const TextStyle(color: KomplekkuColors.surface),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
    ),
  );
}
