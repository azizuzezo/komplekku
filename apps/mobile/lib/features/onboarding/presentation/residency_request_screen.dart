import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:komplekku/core/theme/app_theme.dart';
import 'package:komplekku/core/errors/api_exception.dart';
import 'package:komplekku/features/onboarding/domain/community_option.dart';
import 'package:komplekku/features/onboarding/domain/residency_request.dart';
import 'package:komplekku/features/onboarding/presentation/widgets/onboarding_scaffold.dart';
import 'package:komplekku/shared/widgets/app_button.dart';
import 'package:komplekku/shared/widgets/app_card.dart';

typedef ResidencySubmitCallback = Future<void> Function({
  required String fullName,
  required String rtId,
  required String houseCode,
  required HouseholdRelationship relationship,
});

/// Step 2 of onboarding — the resident's house/household details form.
class ResidencyRequestScreen extends StatefulWidget {
  const ResidencyRequestScreen({
    super.key,
    required this.community,
    required this.isSubmitting,
    required this.submissionError,
    required this.onSubmit,
    required this.onBack,
    required this.onLogout,
    required this.isLoggingOut,
  });

  final CommunityOption community;
  final bool isSubmitting;
  final ApiException? submissionError;
  final ResidencySubmitCallback onSubmit;
  final VoidCallback onBack;
  final VoidCallback onLogout;
  final bool isLoggingOut;

  @override
  State<ResidencyRequestScreen> createState() =>
      _ResidencyRequestScreenState();
}

class _ResidencyRequestScreenState extends State<ResidencyRequestScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _houseCodeController = TextEditingController();
  HouseholdRelationship? _relationship;
  RtOption? _rt;

  @override
  void dispose() {
    _nameController.dispose();
    _houseCodeController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (widget.isSubmitting || !_formKey.currentState!.validate()) return;
    final relationship = _relationship;
    final rt = _rt;
    if (relationship == null || rt == null) return;
    await widget.onSubmit(
      fullName: _nameController.text,
      rtId: rt.id,
      houseCode: _houseCodeController.text,
      relationship: relationship,
    );
  }

  @override
  Widget build(BuildContext context) {
    return OnboardingScaffold(
      eyebrow: 'Langkah 2 dari 2',
      title: 'Kenalkan rumahmu',
      description:
          'Masukkan data yang akan diperiksa pengurus. Kami tidak menampilkan daftar rumah untuk menjaga privasi warga.',
      onLogout: widget.onLogout,
      isLoggingOut: widget.isLoggingOut,
      children: [
        AppCard(
          child: Row(
            children: [
              const Icon(
                Icons.holiday_village_outlined,
                size: 22,
                color: AppColors.primary,
              ),
              const SizedBox(width: AppSpacing.md),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Lingkungan', style: AppTypography.caption),
                    const SizedBox(height: 2),
                    Text(
                      widget.community.name,
                      style: AppTypography.bodyLarge.copyWith(
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: AppSpacing.xl),
        Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              TextFormField(
                key: const ValueKey('resident-full-name'),
                controller: _nameController,
                enabled: !widget.isSubmitting,
                autofillHints: const [AutofillHints.name],
                textCapitalization: TextCapitalization.words,
                textInputAction: TextInputAction.next,
                inputFormatters: [LengthLimitingTextInputFormatter(160)],
                decoration: const InputDecoration(
                  labelText: 'Nama lengkap',
                  hintText: 'Sesuai data pengurus',
                ),
                validator: (value) {
                  final name = value?.trim() ?? '';
                  if (name.length < 3) {
                    return 'Masukkan nama lengkap, minimal 3 karakter.';
                  }
                  return null;
                },
              ),
              const SizedBox(height: AppSpacing.base),
              DropdownButtonFormField<RtOption>(
                key: const ValueKey('rt'),
                initialValue: _rt,
                decoration: const InputDecoration(labelText: 'RT'),
                items: widget.community.rts
                    .map(
                      (rt) => DropdownMenuItem(
                        value: rt,
                        child: Text(rt.name),
                      ),
                    )
                    .toList(growable: false),
                onChanged: widget.isSubmitting
                    ? null
                    : (value) => setState(() => _rt = value),
                validator: (value) =>
                    value == null ? 'Pilih RT tempat rumahmu berada.' : null,
              ),
              const SizedBox(height: AppSpacing.base),
              TextFormField(
                key: const ValueKey('house-code'),
                controller: _houseCodeController,
                enabled: !widget.isSubmitting,
                textCapitalization: TextCapitalization.characters,
                textInputAction: TextInputAction.next,
                inputFormatters: [
                  FilteringTextInputFormatter.allow(
                    RegExp(r'[A-Za-z0-9 _./-]'),
                  ),
                  LengthLimitingTextInputFormatter(24),
                ],
                decoration: const InputDecoration(
                  labelText: 'Kode rumah',
                  hintText: 'Contoh: F01',
                  helperText: 'Gunakan kode rumah yang diberikan pengurus.',
                ),
                validator: (value) {
                  if ((value?.trim() ?? '').isEmpty) {
                    return 'Masukkan kode rumah.';
                  }
                  return null;
                },
              ),
              const SizedBox(height: AppSpacing.base),
              DropdownButtonFormField<HouseholdRelationship>(
                key: const ValueKey('relationship'),
                initialValue: _relationship,
                decoration: const InputDecoration(
                  labelText: 'Hubungan dengan rumah',
                ),
                items: HouseholdRelationship.values
                    .map(
                      (relationship) => DropdownMenuItem(
                        value: relationship,
                        child: Text(relationship.label),
                      ),
                    )
                    .toList(growable: false),
                onChanged: widget.isSubmitting
                    ? null
                    : (value) => setState(() => _relationship = value),
                validator: (value) => value == null
                    ? 'Pilih hubunganmu dengan rumah ini.'
                    : null,
              ),
              if (widget.submissionError != null) ...[
                const SizedBox(height: AppSpacing.md),
                Semantics(
                  liveRegion: true,
                  child: Text(
                    widget.submissionError!.message,
                    style: AppTypography.body.copyWith(
                      color: AppColors.danger,
                      height: 1.4,
                    ),
                  ),
                ),
              ],
              const SizedBox(height: AppSpacing.xl),
              AppButton(
                key: const ValueKey('submit-residency'),
                label: 'Kirim untuk diverifikasi',
                onPressed: _submit,
                isLoading: widget.isSubmitting,
              ),
              const SizedBox(height: AppSpacing.sm),
              AppButton(
                variant: AppButtonVariant.ghost,
                label: 'Kembali pilih lingkungan',
                onPressed: widget.isSubmitting ? null : widget.onBack,
              ),
            ],
          ),
        ),
      ],
    );
  }
}
