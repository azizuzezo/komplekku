import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:komplekku/core/theme/app_theme.dart';
import 'package:komplekku/features/onboarding/domain/community_option.dart';
import 'package:komplekku/features/onboarding/domain/residency_request.dart';
import 'package:komplekku/features/onboarding/presentation/community_selection_screen.dart';
import 'package:komplekku/features/onboarding/presentation/residency_request_screen.dart';

void main() {
  const community = CommunityOption(
    id: '00000000-0000-4000-8000-000000000001',
    name: 'Billabong Blok F',
    slug: 'billabong-blok-f',
    timezone: 'Asia/Jakarta',
    rts: [
      RtOption(
        id: '00000000-0000-4000-8000-000000000f01',
        code: 'RT 01',
        name: 'RT 01',
      ),
    ],
  );

  testWidgets('community selection exposes a real selectable option', (
    tester,
  ) async {
    _usePhoneViewport(tester);
    CommunityOption? selected;
    await tester.pumpWidget(
      _TestApp(
        child: CommunitySelectionScreen(
          communities: const [community],
          selectedCommunity: null,
          onSelect: (value) => selected = value,
          onContinue: () {},
          onRetry: () {},
          onLogout: () {},
          isLoggingOut: false,
        ),
      ),
    );

    expect(find.text('Langkah 1 dari 2'.toUpperCase()), findsOneWidget);
    expect(find.text('Billabong Blok F'), findsOneWidget);
    await tester.tap(find.text('Billabong Blok F'));
    expect(selected, same(community));
  });

  testWidgets('residency request submits manual house data', (tester) async {
    _usePhoneViewport(tester);
    String? submittedName;
    String? submittedRtId;
    String? submittedHouseCode;
    HouseholdRelationship? submittedRelationship;
    await tester.pumpWidget(
      _TestApp(
        child: ResidencyRequestScreen(
          community: community,
          isSubmitting: false,
          submissionError: null,
          onSubmit: ({
            required fullName,
            required rtId,
            required houseCode,
            required relationship,
          }) async {
            submittedName = fullName;
            submittedRtId = rtId;
            submittedHouseCode = houseCode;
            submittedRelationship = relationship;
          },
          onBack: () {},
          onLogout: () {},
          isLoggingOut: false,
        ),
      ),
    );

    expect(
      find.textContaining('tidak menampilkan daftar rumah'),
      findsOneWidget,
    );
    await tester.enterText(
      find.byKey(const ValueKey('resident-full-name')),
      'Ayu Pratama',
    );
    await tester.ensureVisible(find.byKey(const ValueKey('rt')));
    await tester.tap(find.byKey(const ValueKey('rt')));
    await tester.pumpAndSettle();
    await tester.tap(find.text('RT 01').last);
    await tester.pumpAndSettle();
    await tester.enterText(
      find.byKey(const ValueKey('house-code')),
      'F01',
    );
    await tester.ensureVisible(find.byKey(const ValueKey('relationship')));
    await tester.tap(find.byKey(const ValueKey('relationship')));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Penyewa').last);
    await tester.pumpAndSettle();
    await tester.ensureVisible(
      find.byKey(const ValueKey('submit-residency')),
    );
    await tester.tap(find.byKey(const ValueKey('submit-residency')));
    await tester.pump();

    expect(submittedName, 'Ayu Pratama');
    expect(submittedRtId, '00000000-0000-4000-8000-000000000f01');
    expect(submittedHouseCode, 'F01');
    expect(submittedRelationship, HouseholdRelationship.tenant);
  });
}

void _usePhoneViewport(WidgetTester tester) {
  tester.view.physicalSize = const Size(360, 800);
  tester.view.devicePixelRatio = 1;
  addTearDown(tester.view.resetPhysicalSize);
  addTearDown(tester.view.resetDevicePixelRatio);
}

class _TestApp extends StatelessWidget {
  const _TestApp({required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    return MaterialApp(theme: buildAppTheme(), home: child);
  }
}
