import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:komplekku/core/widgets/entity_actions.dart';

void main() {
  testWidgets('delete stays busy until the async operation finishes', (
    tester,
  ) async {
    final completer = Completer<void>();
    var calls = 0;

    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: EntityActions(
            deleteTitle: 'Hapus item?',
            deleteMessage: 'Item akan dihapus.',
            onDelete: () {
              calls += 1;
              return completer.future;
            },
          ),
        ),
      ),
    );

    await tester.tap(find.byType(PopupMenuButton<String>));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Hapus').last);
    await tester.pumpAndSettle();
    await tester.tap(find.text('Hapus').last);
    await tester.pump();

    expect(calls, 1);
    expect(find.byType(CircularProgressIndicator), findsOneWidget);

    completer.complete();
    await tester.pumpAndSettle();

    expect(find.byType(CircularProgressIndicator), findsNothing);
  });
}
