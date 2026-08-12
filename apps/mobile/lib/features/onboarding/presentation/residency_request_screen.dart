import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:komplekku/app/theme/app_theme.dart';
import 'package:komplekku/core/errors/api_exception.dart';
import 'package:komplekku/features/onboarding/domain/community_option.dart';
import 'package:komplekku/features/onboarding/domain/residency_request.dart';
import 'package:komplekku/features/onboarding/presentation/widgets/onboarding_scaffold.dart';

typedef ResidencySubmitCallback = Future<void> Function({
  required String fullName,
  required String houseCode,
  required HouseholdRelationship relationship,
});

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

  @override
  void dispose() {
    _nameController.dispose();
    _houseCodeController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (widget.isSubmitting || !_formKey.currentState!.validate()) return;
    final relationship = _relationship;
    if (relationship == null) return;
    await widget.onSubmit(
      fullName: _nameController.text,
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
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: KomplekkuColors.surfaceSoft,
            border: Border.all(color: KomplekkuColors.border),
            borderRadius: const BorderRadius.all(Radius.circular(10)),
          ),
          child: Row(
            children: [
              const Icon(Icons.holiday_village_outlined, size: 22),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Lingkungan',
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                    const SizedBox(height: 2),
                    Text(
                      widget.community.name,
                      style: const TextStyle(fontWeight: FontWeight.w700),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 22),
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
              const SizedBox(height: 16),
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
              const SizedBox(height: 16),
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
                const SizedBox(height: 14),
                Semantics(
                  liveRegion: true,
                  child: Text(
                    widget.submissionError!.message,
                    style: const TextStyle(
                      color: KomplekkuColors.danger,
                      height: 1.4,
                    ),
                  ),
                ),
              ],
              const SizedBox(height: 22),
              FilledButton(
                key: const ValueKey('submit-residency'),
                onPressed: widget.isSubmitting ? null : _submit,
                child: Text(
                  widget.isSubmitting
                      ? 'Mengirim permohonan…'
                      : 'Kirim untuk diverifikasi',
                ),
              ),
              const SizedBox(height: 10),
              TextButton(
                onPressed: widget.isSubmitting ? null : widget.onBack,
                child: const Text('Kembali pilih lingkungan'),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
