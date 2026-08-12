import 'package:flutter/material.dart';
import 'package:komplekku/app/theme/app_theme.dart';
import 'package:komplekku/core/widgets/komplekku_logo.dart';

class OnboardingScaffold extends StatelessWidget {
  const OnboardingScaffold({
    super.key,
    required this.eyebrow,
    required this.title,
    required this.description,
    required this.children,
    required this.onLogout,
    this.isLoggingOut = false,
  });

  final String eyebrow;
  final String title;
  final String description;
  final List<Widget> children;
  final VoidCallback onLogout;
  final bool isLoggingOut;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        toolbarHeight: 68,
        titleSpacing: 20,
        title: const KomplekkuLogo(width: 40),
        actions: [
          TextButton.icon(
            onPressed: isLoggingOut ? null : onLogout,
            icon: const Icon(Icons.logout, size: 19),
            label: Text(isLoggingOut ? 'Keluar…' : 'Keluar'),
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: SafeArea(
        top: false,
        child: Align(
          alignment: Alignment.topCenter,
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 560),
            child: ListView(
              padding: const EdgeInsets.fromLTRB(20, 20, 20, 40),
              children: [
                Text(
                  eyebrow.toUpperCase(),
                  style: Theme.of(context).textTheme.labelLarge?.copyWith(
                        color: KomplekkuColors.primary,
                        fontWeight: FontWeight.w700,
                        letterSpacing: 0.7,
                      ),
                ),
                const SizedBox(height: 10),
                Text(title, style: Theme.of(context).textTheme.headlineMedium),
                const SizedBox(height: 10),
                Text(
                  description,
                  style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                        color: KomplekkuColors.textSecondary,
                      ),
                ),
                const SizedBox(height: 28),
                ...children,
              ],
            ),
          ),
        ),
      ),
    );
  }
}
