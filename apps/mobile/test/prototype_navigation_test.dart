import 'dart:io';

import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:komplekku/app/theme/app_theme.dart';
import 'package:komplekku/features/community_admin/data/community_admin_repository.dart';
import 'package:komplekku/features/community_admin/domain/community_detail.dart';
import 'package:komplekku/features/prayer/presentation/shalat_screen.dart';
import 'package:shared_preferences_platform_interface/in_memory_shared_preferences_async.dart';
import 'package:shared_preferences_platform_interface/shared_preferences_async_platform_interface.dart';

class _OfflineCommunityAdminRepository extends CommunityAdminRepository {
  _OfflineCommunityAdminRepository() : super(Dio());

  @override
  Future<CommunityDetail> getCurrentCommunity() {
    // ShalatScreen's iqomah countdown falls back to its cached/default delay
    // when the community fetch fails — this keeps the widget test off the
    // network instead of leaving a Dio timer pending after tester teardown.
    throw Exception('offline in test');
  }
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  setUp(() {
    SharedPreferencesAsyncPlatform.instance =
        InMemorySharedPreferencesAsync.empty();
  });

  testWidgets('Shalat header follows the owner prototype hierarchy', (
    tester,
  ) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          communityAdminRepositoryProvider.overrideWithValue(
            _OfflineCommunityAdminRepository(),
          ),
        ],
        child: MaterialApp(
          theme: buildKomplekkuTheme(),
          home: const ShalatScreen(),
        ),
      ),
    );
    await tester.pump();

    expect(find.text('Jadwal Shalat'), findsOneWidget);
    expect(find.text('RT 05 / RW 03 • Billabong'), findsOneWidget);
    expect(find.text('Hari ini'), findsOneWidget);
    expect(find.text('Bulanan'), findsOneWidget);
  });

  test('Flutter source has five prototype destinations and no manual replay', () {
    final shell = File('lib/app/shell/main_shell.dart').readAsStringSync();
    final prayer = Directory('lib/features/prayer/presentation')
        .listSync()
        .whereType<File>()
        .map((file) => file.readAsStringSync())
        .join('\n');

    for (final label in const [
      'Beranda',
      'Shalat',
      'Pengumuman',
      'Forum',
      'Layanan',
    ]) {
      expect(shell, contains("label: '$label'"));
    }
    expect(RegExp("label: '").allMatches(shell), hasLength(5));
    expect(prayer, isNot(contains('Putar Adzan')));
    expect(prayer, isNot(contains("AssetSource('audio/adzan.mp3')")));
  });
}
