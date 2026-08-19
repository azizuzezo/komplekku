import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:komplekku/core/theme/app_theme.dart';
import 'package:komplekku/core/widgets/komplekku_logo.dart';
import 'package:komplekku/features/auth/presentation/login_controller.dart';
import 'package:komplekku/features/auth/presentation/session_controller.dart';
import 'package:komplekku/shared/widgets/app_button.dart';

/// Split Studio, collapsed to mobile: compact brand header (lockup + short
/// context), then the single current step's form, full width.
class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _phoneController = TextEditingController();
  final _otpController = TextEditingController();
  final _otpFocusNode = FocusNode();
  final _formKey = GlobalKey<FormState>();

  @override
  void dispose() {
    _phoneController.dispose();
    _otpController.dispose();
    _otpFocusNode.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    final state = ref.read(loginControllerProvider);
    final controller = ref.read(loginControllerProvider.notifier);

    if (state.challenge == null) {
      final challenge = await controller.requestOtp(_phoneController.text);
      if (challenge != null && mounted) {
        WidgetsBinding.instance.addPostFrameCallback((_) {
          if (mounted) _otpFocusNode.requestFocus();
        });
      }
      return;
    }

    final verified = await controller.verifyOtp(_otpController.text);
    if (verified == null || !mounted) return;
    ref
        .read(sessionControllerProvider.notifier)
        .acceptVerifiedSession(verified);
    context.go(verified.authState.route);
  }

  @override
  Widget build(BuildContext context) {
    final loginState = ref.watch(loginControllerProvider);
    final isOtpStep = loginState.challenge != null;

    return Scaffold(
      backgroundColor: AppColors.brandCanvas,
      body: SafeArea(
        child: Align(
          alignment: Alignment.topCenter,
          child: SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(
              AppSpacing.xl,
              AppSpacing.xxl,
              AppSpacing.xl,
              AppSpacing.xxl,
            ),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 440),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const Center(
                      child: KomplekkuLogo(
                        variant: KomplekkuLogoVariant.lockup,
                        width: 200,
                      ),
                    ),
                    const SizedBox(height: AppSpacing.xxl),
                    Text(
                      isOtpStep ? 'Masukkan kode OTP' : 'Masuk ke Komplekku',
                      style: AppTypography.heading,
                    ),
                    const SizedBox(height: AppSpacing.xs),
                    Text(
                      isOtpStep
                          ? 'Gunakan enam digit yang dikirim ke ${_phoneController.text.trim()}.'
                          : 'Gunakan nomor HP yang terdaftar di lingkunganmu.',
                      style: AppTypography.body,
                    ),
                    const SizedBox(height: AppSpacing.xl),
                    if (!isOtpStep)
                      TextFormField(
                        key: const ValueKey('phone-field'),
                        controller: _phoneController,
                        keyboardType: TextInputType.phone,
                        inputFormatters: [
                          FilteringTextInputFormatter.allow(
                            RegExp(r'[0-9+\s().-]'),
                          ),
                          LengthLimitingTextInputFormatter(24),
                        ],
                        autofillHints: const [AutofillHints.telephoneNumber],
                        textInputAction: TextInputAction.done,
                        decoration: const InputDecoration(
                          labelText: 'Nomor HP',
                          hintText: '0812 3456 7890',
                          prefixIcon: Icon(Icons.phone_outlined),
                        ),
                        validator: (value) {
                          final digits = value?.replaceAll(RegExp(r'\D'), '') ?? '';
                          if (digits.length < 10 || digits.length > 15) {
                            return 'Nomor belum lengkap. Masukkan 10–15 digit.';
                          }
                          return null;
                        },
                        onFieldSubmitted: (_) => _submit(),
                      )
                    else
                      TextFormField(
                        key: const ValueKey('otp-field'),
                        controller: _otpController,
                        focusNode: _otpFocusNode,
                        keyboardType: TextInputType.number,
                        inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                        autofillHints: const [AutofillHints.oneTimeCode],
                        maxLength: 6,
                        textInputAction: TextInputAction.done,
                        decoration: const InputDecoration(
                          labelText: 'Kode OTP',
                          hintText: '6 digit',
                          counterText: '',
                          prefixIcon: Icon(Icons.password_outlined),
                        ),
                        validator: (value) {
                          if (!RegExp(r'^\d{6}$').hasMatch(value ?? '')) {
                            return 'Kode harus terdiri dari enam digit.';
                          }
                          return null;
                        },
                        onFieldSubmitted: (_) => _submit(),
                      ),
                    if (loginState.errorMessage != null) ...[
                      const SizedBox(height: AppSpacing.md),
                      Semantics(
                        liveRegion: true,
                        child: Text(
                          loginState.errorMessage!,
                          style: AppTypography.body.copyWith(
                            color: AppColors.danger,
                            height: 1.4,
                          ),
                        ),
                      ),
                    ],
                    const SizedBox(height: AppSpacing.lg),
                    AppButton(
                      label: isOtpStep ? 'Verifikasi kode' : 'Kirim kode OTP',
                      onPressed: _submit,
                      isLoading: loginState.isSubmitting,
                    ),
                    if (isOtpStep) ...[
                      const SizedBox(height: AppSpacing.sm),
                      AppButton(
                        variant: AppButtonVariant.ghost,
                        label: 'Ganti nomor HP',
                        onPressed: loginState.isSubmitting
                            ? null
                            : () {
                                ref
                                    .read(loginControllerProvider.notifier)
                                    .resetPhone();
                                setState(() {
                                  _otpController.clear();
                                });
                              },
                      ),
                    ],
                    const SizedBox(height: AppSpacing.xl),
                    Text(
                      'Mode lokal memakai OTP development yang dikonfigurasi owner.',
                      style: AppTypography.caption,
                      textAlign: TextAlign.center,
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
