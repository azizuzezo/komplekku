import 'package:flutter/material.dart';
import 'package:komplekku/core/theme/app_colors.dart';
import 'package:komplekku/core/theme/app_radius.dart';
import 'package:komplekku/core/theme/app_spacing.dart';
import 'package:komplekku/core/theme/app_typography.dart';

export 'package:komplekku/core/theme/app_colors.dart';
export 'package:komplekku/core/theme/app_radius.dart';
export 'package:komplekku/core/theme/app_shadows.dart';
export 'package:komplekku/core/theme/app_spacing.dart';
export 'package:komplekku/core/theme/app_typography.dart';

/// Builds the single `ThemeData` for the app — `/design.md` is the locked
/// source of truth for every value below; do not invent a per-route theme.
/// Button/card radii here match the doc's caps (8/12/14 px), reconciling a
/// prior drift where the implementation had grown to 14/16 px.
ThemeData buildAppTheme() {
  final scheme =
      ColorScheme.fromSeed(
        seedColor: AppColors.primary,
        brightness: Brightness.light,
        surface: AppColors.surface,
        error: AppColors.danger,
      ).copyWith(
        primary: AppColors.primary,
        onPrimary: AppColors.surface,
        primaryContainer: AppColors.surfaceSoft,
        onPrimaryContainer: AppColors.primaryDark,
        secondary: AppColors.accent,
        onSecondary: AppColors.textPrimary,
        onSurface: AppColors.textPrimary,
        outline: AppColors.border,
        outlineVariant: AppColors.borderStrong,
      );

  return ThemeData(
    useMaterial3: true,
    colorScheme: scheme,
    scaffoldBackgroundColor: AppColors.background,
    fontFamily: 'Plus Jakarta Sans',
    splashFactory: InkSparkle.splashFactory,
    appBarTheme: const AppBarThemeData(
      backgroundColor: AppColors.background,
      foregroundColor: AppColors.textPrimary,
      surfaceTintColor: Colors.transparent,
      elevation: 0,
      titleTextStyle: AppTypography.title,
    ),
    textTheme: TextTheme(
      displayLarge: AppTypography.display,
      displayMedium: AppTypography.heading,
      displaySmall: AppTypography.title,
      headlineLarge: AppTypography.heading,
      headlineMedium: AppTypography.heading.copyWith(fontSize: 30, height: 1.15),
      headlineSmall: AppTypography.title,
      titleLarge: AppTypography.title,
      titleMedium: AppTypography.bodyLarge.copyWith(
        fontSize: 15,
        fontWeight: FontWeight.w700,
        height: 1.35,
      ),
      titleSmall: AppTypography.label,
      bodyLarge: AppTypography.bodyLarge,
      bodyMedium: AppTypography.body,
      bodySmall: AppTypography.caption,
      labelLarge: AppTypography.label,
      labelMedium: AppTypography.label.copyWith(fontSize: 12),
      labelSmall: AppTypography.caption,
    ),
    inputDecorationTheme: InputDecorationThemeData(
      filled: true,
      fillColor: AppColors.surface,
      errorMaxLines: 3,
      labelStyle: AppTypography.body,
      hintStyle: AppTypography.body,
      border: const OutlineInputBorder(
        borderRadius: BorderRadius.all(Radius.circular(AppRadius.input)),
        borderSide: BorderSide(color: AppColors.border),
      ),
      enabledBorder: const OutlineInputBorder(
        borderRadius: BorderRadius.all(Radius.circular(AppRadius.input)),
        borderSide: BorderSide(color: AppColors.border),
      ),
      focusedBorder: const OutlineInputBorder(
        borderRadius: BorderRadius.all(Radius.circular(AppRadius.input)),
        borderSide: BorderSide(color: AppColors.primary, width: 2),
      ),
      errorBorder: const OutlineInputBorder(
        borderRadius: BorderRadius.all(Radius.circular(AppRadius.input)),
        borderSide: BorderSide(color: AppColors.danger),
      ),
      focusedErrorBorder: const OutlineInputBorder(
        borderRadius: BorderRadius.all(Radius.circular(AppRadius.input)),
        borderSide: BorderSide(color: AppColors.danger, width: 2),
      ),
      contentPadding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.base,
        vertical: AppSpacing.md,
      ),
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        minimumSize: const Size.fromHeight(52),
        backgroundColor: AppColors.primary,
        foregroundColor: AppColors.surface,
        textStyle: AppTypography.label,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppRadius.button),
        ),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        minimumSize: const Size.fromHeight(52),
        foregroundColor: AppColors.primary,
        side: const BorderSide(color: AppColors.borderStrong),
        textStyle: AppTypography.label,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppRadius.button),
        ),
      ),
    ),
    textButtonTheme: TextButtonThemeData(
      style: TextButton.styleFrom(
        minimumSize: const Size(0, 44),
        foregroundColor: AppColors.primary,
        textStyle: AppTypography.label.copyWith(fontWeight: FontWeight.w600),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppRadius.button),
        ),
      ),
    ),
    cardTheme: const CardThemeData(
      color: AppColors.surface,
      elevation: 0,
      margin: EdgeInsets.zero,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.all(Radius.circular(AppRadius.card)),
        side: BorderSide(color: AppColors.border),
      ),
    ),
    dividerTheme: const DividerThemeData(
      color: AppColors.border,
      thickness: 1,
      space: 1,
    ),
    snackBarTheme: SnackBarThemeData(
      behavior: SnackBarBehavior.floating,
      backgroundColor: AppColors.primaryDark,
      contentTextStyle: AppTypography.bodyLarge.copyWith(color: AppColors.surface),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppRadius.modal),
      ),
    ),
  );
}
