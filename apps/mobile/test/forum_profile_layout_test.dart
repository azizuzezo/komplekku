import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:komplekku/app/theme/app_theme.dart';
import 'package:komplekku/core/auth/permissions_provider.dart';
import 'package:komplekku/features/account/data/account_repository.dart';
import 'package:komplekku/features/account/domain/account_snapshot.dart';
import 'package:komplekku/features/account/presentation/account_screen.dart';
import 'package:komplekku/features/forum/data/forum_repository.dart';
import 'package:komplekku/features/forum/domain/forum_channel.dart';
import 'package:komplekku/features/forum/domain/forum_message.dart';
import 'package:komplekku/features/forum/presentation/forum_screen.dart';
import 'package:komplekku/features/household/data/household_repository.dart';
import 'package:komplekku/features/household/domain/household.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('Profil presents resident identity as the primary page content', (
    tester,
  ) async {
    const snapshot = AccountSnapshot(
      id: 'resident-1',
      displayName: 'Aziz',
      phoneMasked: '0812••••1234',
      residentStatus: AccountResidentStatus.active,
      context: null,
      permissions: <String>[],
    );

    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          accountSnapshotProvider.overrideWith((ref) async => snapshot),
        ],
        child: MaterialApp(
          theme: buildKomplekkuTheme(),
          home: const AccountScreen(),
        ),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Profil'), findsOneWidget);
    expect(find.text('Akun warga'), findsNothing);
    expect(find.byType(CircleAvatar), findsOneWidget);
    expect(find.text('Aziz'), findsOneWidget);
    expect(find.text('Aktif'), findsOneWidget);
  });

  testWidgets('Buat Forum stays above the composer and Enter sends a message', (
    tester,
  ) async {
    await tester.binding.setSurfaceSize(const Size(360, 800));
    addTearDown(() => tester.binding.setSurfaceSize(null));
    final repository = _FakeForumRepository();
    const channel = ForumChannel(
      id: 'rt-03',
      rtId: 'rt-03',
      kind: ForumChannelKind.system,
      name: 'RT 03',
      description: null,
      createdByUserId: null,
      membershipStatus: null,
      isOwner: false,
      memberCount: 8,
    );

    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          currentPermissionsProvider.overrideWithValue(const ['forum.post']),
          forumRepositoryProvider.overrideWithValue(repository),
          forumChannelListProvider.overrideWith((ref) async => const [channel]),
          forumMessageListProvider.overrideWith(
            (ref, channelId) async => const [],
          ),
        ],
        child: MaterialApp(
          theme: buildKomplekkuTheme(),
          home: const ForumScreen(),
        ),
      ),
    );
    await tester.pumpAndSettle();
    await tester.tap(find.text('Obrolan'));
    await tester.pumpAndSettle();

    final createRect = tester.getRect(find.text('Buat Forum'));
    final composerRect = tester.getRect(find.byType(TextField));
    expect(createRect.bottom, lessThan(composerRect.top));
    expect(find.byTooltip('Kirim pesan'), findsOneWidget);

    await tester.enterText(find.byType(TextField), 'Halo warga');
    await tester.testTextInput.receiveAction(TextInputAction.send);
    await tester.pump();
    expect(repository.sentBodies, ['Halo warga']);
  });

  testWidgets('Profil household heading does not run underneath its action', (
    tester,
  ) async {
    await tester.binding.setSurfaceSize(const Size(360, 800));
    addTearDown(() => tester.binding.setSurfaceSize(null));
    const snapshot = AccountSnapshot(
      id: 'resident-1',
      displayName: 'Abdul Aziz Setiawan',
      phoneMasked: '+62••••0774',
      residentStatus: AccountResidentStatus.active,
      context: AccountContext(
        communityName: 'Rukun Warga 13',
        householdDisplayName: 'Keluarga Setiawan',
        house: AccountHouse(code: 'F2D2–17', addressLabel: 'Blok F2D2 No. 17'),
      ),
      permissions: <String>[],
    );
    const household = CurrentHousehold(
      displayName: 'Keluarga Setiawan',
      houseCode: 'F2D2–17',
      houseAddressLabel: 'Blok F2D2 No. 17',
      members: <HouseholdMember>[],
    );

    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          accountSnapshotProvider.overrideWith((ref) async => snapshot),
          currentHouseholdProvider.overrideWith((ref) async => household),
        ],
        child: MaterialApp(
          theme: buildKomplekkuTheme(),
          home: const AccountScreen(),
        ),
      ),
    );
    await tester.pumpAndSettle();

    final descriptionRect = tester.getRect(
      find.text('Penghuni rumah tangga ini'),
    );
    final actionRect = tester.getRect(find.text('Tambah'));
    expect(descriptionRect.right, lessThanOrEqualTo(actionRect.left));
  });
}

class _FakeForumRepository extends ForumRepository {
  _FakeForumRepository() : super(Dio());

  final sentBodies = <String>[];

  @override
  Future<ForumMessage> sendMessage({
    required String channelId,
    required String body,
    List<String> imageUrls = const [],
    String? replyToMessageId,
  }) async {
    sentBodies.add(body);
    return ForumMessage(
      id: 'message-1',
      channelId: channelId,
      authorUserId: 'resident-1',
      authorName: 'Aziz',
      body: body,
      imageUrls: imageUrls,
      createdAt: DateTime(2026, 8, 19),
      editedAt: null,
      replyToMessageId: replyToMessageId,
      replyToAuthorName: null,
      replyToBody: null,
    );
  }
}
