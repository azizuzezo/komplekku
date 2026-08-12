import 'package:flutter/material.dart';

abstract final class KomplekkuColors {
  static const primary = Color(0xFF00ACC1);
  static const primaryDark = Color(0xFF00838F);
  static const background = Color(0xFFF3FBFC);
  static const brandCanvas = Color(0xFFF3FBFC);
  static const surface = Color(0xFFFFFFFF);
  static const surfaceSoft = Color(0xFFE0F7FA);
  static const surfaceMuted = Color(0xFFB2EBF2);
  static const textPrimary = Color(0xFF0F2F34);
  static const textSecondary = Color(0xFF376E76);
  static const border = Color(0xFF80DEEA);
  static const borderStrong = Color(0xFF4DD0E1);
  static const terracotta = Color(0xFF00ACC1);
  static const danger = Color(0xFFB54343);
  static const success = Color(0xFF00838F);
}

ThemeData buildKomplekkuTheme() {
  final scheme = ColorScheme.fromSeed(
    seedColor: KomplekkuColors.primary,
    brightness: Brightness.light,
    surface: KomplekkuColors.surface,
    error: KomplekkuColors.danger,
  ).copyWith(
    primary: KomplekkuColors.primary,
    onPrimary: KomplekkuColors.surface,
    primaryContainer: KomplekkuColors.surfaceSoft,
    onPrimaryContainer: KomplekkuColors.primaryDark,
    secondary: KomplekkuColors.terracotta,
    onSecondary: KomplekkuColors.surface,
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
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        minimumSize: const Size.fromHeight(52),
        foregroundColor: KomplekkuColors.primary,
        side: const BorderSide(color: KomplekkuColors.borderStrong),
        textStyle: const TextStyle(fontWeight: FontWeight.w700),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
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
        borderRadius: BorderRadius.all(Radius.circular(10)),
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
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
    ),
  );
}
