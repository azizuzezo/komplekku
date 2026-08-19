import 'package:flutter/material.dart';

/// Shadows are a last resort, not a default — `/design.md` prefers a rule,
/// negative space, or one strong surface over drop shadows. Reach for these
/// only where a surface must visibly float above the page (bottom nav, a
/// raised sheet), never on ordinary cards, which use a 1px border instead.
abstract final class AppShadows {
  static const List<BoxShadow> raised = [
    BoxShadow(color: Color(0x14000000), blurRadius: 16, offset: Offset(0, -2)),
  ];

  static const List<BoxShadow> floating = [
    BoxShadow(color: Color(0x0A101119), blurRadius: 12, offset: Offset(0, 4)),
  ];
}
