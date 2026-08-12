import 'package:flutter_test/flutter_test.dart';
import 'package:komplekku/features/auth/domain/auth_state.dart';
import 'package:komplekku/features/onboarding/presentation/account_status_screen.dart';

void main() {
  test('context-required copy never invents a selector', () {
    final copy = AccountStatusCopy.forState(AuthState.contextRequired);

    expect(copy.title, contains('konteks rumahmu'));
    expect(copy.description, contains('belum tersedia'));
  });

  test('rejected state truthfully allows a corrected request', () {
    final copy = AccountStatusCopy.forState(AuthState.rejected);

    expect(copy.title, 'Permohonan belum disetujui');
    expect(copy.description, contains('mengajukan kembali'));
  });
}
