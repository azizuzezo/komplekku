import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:komplekku/features/account/data/account_repository.dart';

/// Current account's permission strings, mirroring the web sidebar's use of
/// `GET /me`'s `permissions` field to filter navigation. Defaults to an empty
/// list while loading or on error so gated entries stay hidden rather than
/// flashing visible, matching `desktop-sidebar.tsx`'s `permissions ?? []`.
final currentPermissionsProvider = Provider<List<String>>((ref) {
  return ref.watch(accountSnapshotProvider).maybeWhen(
        data: (account) => account.permissions,
        orElse: () => const [],
      );
});

bool hasPermission(List<String> permissions, String? required) {
  return required == null || permissions.contains(required);
}
