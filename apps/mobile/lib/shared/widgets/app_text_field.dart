import 'package:flutter/material.dart';
import 'package:komplekku/core/theme/app_theme.dart';

/// Thin wrapper over `TextFormField` — decoration/border/radius already come
/// from `InputDecorationThemeData`, so this only adds the one piece every
/// screen otherwise reimplements by hand: a password-visibility toggle.
/// Validation/`onChanged`/`onFieldSubmitted` pass straight through.
class AppTextField extends StatefulWidget {
  const AppTextField({
    super.key,
    this.controller,
    this.label,
    this.hint,
    this.helperText,
    this.errorText,
    this.keyboardType,
    this.textInputAction,
    this.obscureText = false,
    this.enabled = true,
    this.autofocus = false,
    this.readOnly = false,
    this.prefixIcon,
    this.maxLines = 1,
    this.validator,
    this.onChanged,
    this.onFieldSubmitted,
    this.onTap,
  });

  final TextEditingController? controller;
  final String? label;
  final String? hint;
  final String? helperText;
  final String? errorText;
  final TextInputType? keyboardType;
  final TextInputAction? textInputAction;
  final bool obscureText;
  final bool enabled;
  final bool autofocus;
  final bool readOnly;
  final IconData? prefixIcon;
  final int? maxLines;
  final FormFieldValidator<String>? validator;
  final ValueChanged<String>? onChanged;
  final ValueChanged<String>? onFieldSubmitted;
  final VoidCallback? onTap;

  @override
  State<AppTextField> createState() => _AppTextFieldState();
}

class _AppTextFieldState extends State<AppTextField> {
  late bool _obscured = widget.obscureText;

  @override
  Widget build(BuildContext context) {
    return TextFormField(
      controller: widget.controller,
      keyboardType: widget.keyboardType,
      textInputAction: widget.textInputAction,
      obscureText: widget.obscureText && _obscured,
      enabled: widget.enabled,
      autofocus: widget.autofocus,
      readOnly: widget.readOnly,
      maxLines: widget.obscureText ? 1 : widget.maxLines,
      validator: widget.validator,
      onChanged: widget.onChanged,
      onFieldSubmitted: widget.onFieldSubmitted,
      onTap: widget.onTap,
      style: AppTypography.bodyLarge,
      decoration: InputDecoration(
        labelText: widget.label,
        hintText: widget.hint,
        helperText: widget.helperText,
        errorText: widget.errorText,
        prefixIcon: widget.prefixIcon == null ? null : Icon(widget.prefixIcon),
        suffixIcon: widget.obscureText
            ? IconButton(
                tooltip: _obscured ? 'Tampilkan' : 'Sembunyikan',
                icon: Icon(_obscured ? Icons.visibility_outlined : Icons.visibility_off_outlined),
                onPressed: () => setState(() => _obscured = !_obscured),
              )
            : null,
      ),
    );
  }
}
