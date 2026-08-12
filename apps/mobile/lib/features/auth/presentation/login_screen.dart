import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:komplekku/app/theme/app_theme.dart';
import 'package:komplekku/core/widgets/komplekku_logo.dart';
import 'package:komplekku/features/auth/presentation/login_controller.dart';
import 'package:komplekku/features/auth/presentation/session_controller.dart';

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
      backgroundColor: KomplekkuColors.brandCanvas,
      body: SafeArea(
        child: Align(
          alignment: Alignment.topCenter,
          child: SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(24, 32, 24, 32),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 440),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const KomplekkuLogo(
                      variant: KomplekkuLogoVariant.lockup,
                      width: 246,
                    ),
                    const SizedBox(height: 36),
                    Text(
                      isOtpStep ? 'Masukkan kode OTP' : 'Masuk ke Komplekku',
                      style: Theme.of(context).textTheme.headlineMedium,
                    ),
                    const SizedBox(height: 8),
                    Text(
                      isOtpStep
                          ? 'Gunakan enam digit yang dikirim ke ${_phoneController.text.trim()}.'
                          : 'Gunakan nomor HP yang terdaftar di lingkunganmu.',
                      style: Theme.of(context).textTheme.bodyLarge,
                    ),
                    const SizedBox(height: 28),
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
                      const SizedBox(height: 12),
                      Semantics(
                        liveRegion: true,
                        child: Text(
                          loginState.errorMessage!,
                          style: const TextStyle(
                            color: KomplekkuColors.danger,
                            fontSize: 14,
                            height: 1.4,
                          ),
                        ),
                      ),
                    ],
                    const SizedBox(height: 20),
                    FilledButton(
                      onPressed: loginState.isSubmitting ? null : _submit,
                      child: Text(
                        loginState.isSubmitting
                            ? 'Memproses…'
                            : isOtpStep
                                ? 'Verifikasi kode'
                                : 'Kirim kode OTP',
                      ),
                    ),
                    if (isOtpStep) ...[
                      const SizedBox(height: 12),
                      TextButton(
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
                        child: const Text('Ganti nomor HP'),
                      ),
                    ],
                    const SizedBox(height: 24),
                    Text(
                      'Mode lokal memakai OTP development yang dikonfigurasi owner.',
                      style: Theme.of(context).textTheme.bodyMedium,
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
