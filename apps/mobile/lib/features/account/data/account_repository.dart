import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:komplekku/core/errors/api_exception.dart';
import 'package:komplekku/features/account/domain/account_snapshot.dart';
import 'package:komplekku/features/auth/data/session_api_service.dart';

final accountRepositoryProvider = Provider<AccountRepository>((ref) {
  return AccountRepository(ref.watch(sessionApiServiceProvider));
});

final accountSnapshotProvider =
    FutureProvider.autoDispose<AccountSnapshot>((ref) {
  return ref.watch(accountRepositoryProvider).load();
});

class AccountRepository {
  AccountRepository(this._service);

  final SessionApiService _service;

  Future<AccountSnapshot> load() async {
    final data = await _service.loadMe();
    try {
      return AccountSnapshot.fromJson(data);
    } on TypeError {
      throw ApiException.malformedResponse();
    }
  }
}
