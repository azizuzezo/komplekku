import 'package:flutter/material.dart';
import 'package:komplekku/app/theme/app_theme.dart';

class KomplekMapScreen extends StatelessWidget {
  const KomplekMapScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Peta Billabong Blok F'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Map Canvas Container
            Container(
              height: 380,
              width: double.infinity,
              decoration: BoxDecoration(
                color: KomplekkuColors.surfaceSoft,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: KomplekkuColors.border),
              ),
              child: Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(
                      Icons.map_outlined,
                      size: 48,
                      color: KomplekkuColors.primary,
                    ),
                    const SizedBox(height: 12),
                    const Text(
                      'PETA DIGITAL BILLABONG BLOK F',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                        color: KomplekkuColors.primary,
                        letterSpacing: 1.2,
                      ),
                    ),
                    const SizedBox(height: 6),
                    const Text(
                      'GPS: -6.509707, 106.772959',
                      style: TextStyle(
                        fontSize: 12,
                        fontFamily: 'monospace',
                        color: KomplekkuColors.textSecondary,
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
            const Card(
              elevation: 0,
              child: Padding(
                padding: EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Informasi Wilayah',
                      style: TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.bold,
                        color: KomplekkuColors.textPrimary,
                      ),
                    ),
                    SizedBox(height: 8),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('Komunitas', style: TextStyle(fontSize: 13, color: KomplekkuColors.textSecondary)),
                        Text('Billabong Blok F', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
                      ],
                    ),
                    SizedBox(height: 6),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('Koordinat Pusat', style: TextStyle(fontSize: 13, color: KomplekkuColors.textSecondary)),
                        Text('-6.509707, 106.772959', style: TextStyle(fontSize: 13, fontFamily: 'monospace')),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
