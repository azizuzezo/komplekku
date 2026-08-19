import 'package:flutter/material.dart';
import 'package:komplekku/core/theme/app_theme.dart';

/// One tab in [AppBottomNavigation] — icon pair (outline/filled), label, and
/// an optional unread badge count.
class AppNavDestination {
  const AppNavDestination({
    required this.icon,
    required this.selectedIcon,
    required this.label,
    this.badgeCount = 0,
  });

  final IconData icon;
  final IconData selectedIcon;
  final String label;
  final int badgeCount;
}

/// The bottom dock: `/design.md` calls for "weight plus a small geometric
/// indicator, not a large rounded tile" — a flat surface with a hairline top
/// rule (no drop shadow, no floating pill) and a small active-state indicator
/// bar above the icon.
///
/// Purely presentational: the caller owns the actual tab index and what
/// tapping one does (`onTap`) — here that stays `StatefulNavigationShell`'s
/// `goBranch`, unchanged by this restyle.
class AppBottomNavigation extends StatelessWidget {
  const AppBottomNavigation({
    super.key,
    required this.destinations,
    required this.currentIndex,
    required this.onTap,
  });

  final List<AppNavDestination> destinations;
  final int currentIndex;
  final ValueChanged<int> onTap;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: const BoxDecoration(
        color: AppColors.surface,
        border: Border(top: BorderSide(color: AppColors.border)),
      ),
      child: SafeArea(
        top: false,
        child: SizedBox(
          height: 68,
          child: Row(
            children: [
              for (var i = 0; i < destinations.length; i++)
                Expanded(
                  child: _AppNavTab(
                    destination: destinations[i],
                    selected: i == currentIndex,
                    onTap: () => onTap(i),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

class _AppNavTab extends StatelessWidget {
  const _AppNavTab({
    required this.destination,
    required this.selected,
    required this.onTap,
  });

  final AppNavDestination destination;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final color = selected ? AppColors.primary : AppColors.textSecondary;
    Widget icon = Icon(
      selected ? destination.selectedIcon : destination.icon,
      color: color,
      size: 24,
    );
    if (destination.badgeCount > 0) {
      icon = Badge(label: Text('${destination.badgeCount}'), child: icon);
    }

    return Semantics(
      button: true,
      selected: selected,
      label: destination.label,
      child: InkWell(
        onTap: onTap,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            AnimatedContainer(
              duration: const Duration(milliseconds: 180),
              curve: Curves.easeOut,
              width: selected ? 20 : 0,
              height: 3,
              margin: const EdgeInsets.only(bottom: 6),
              decoration: BoxDecoration(
                color: AppColors.primary,
                borderRadius: BorderRadius.circular(AppRadius.pill),
              ),
            ),
            icon,
            const SizedBox(height: 4),
            SizedBox(
              width: 64,
              child: FittedBox(
                fit: BoxFit.scaleDown,
                child: Text(
                  destination.label,
                  maxLines: 1,
                  style: AppTypography.caption.copyWith(
                    color: color,
                    fontWeight: selected ? FontWeight.w800 : FontWeight.w600,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
