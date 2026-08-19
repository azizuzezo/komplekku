import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:komplekku/core/theme/app_theme.dart';
import 'package:latlong2/latlong.dart';

class KomplekMapScreen extends StatefulWidget {
  const KomplekMapScreen({super.key});

  @override
  State<KomplekMapScreen> createState() => _KomplekMapScreenState();
}

class _KomplekMapScreenState extends State<KomplekMapScreen> {
  static final LatLng _center = const LatLng(-6.509706886903904, 106.77295885896154);
  final MapController _mapController = MapController();

  static final List<LatLng> _boundaryPoints = [
    const LatLng(-6.5088, 106.7718),
    const LatLng(-6.5086, 106.7738),
    const LatLng(-6.5105, 106.7742),
    const LatLng(-6.5112, 106.7725),
    const LatLng(-6.5102, 106.7716),
  ];

  void _recenter() {
    _mapController.move(_center, 17.0);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Peta Billabong Blok F'),
        actions: [
          IconButton(
            icon: const Icon(Icons.my_location),
            tooltip: _centerLocationTooltip,
            onPressed: _recenter,
          ),
        ],
      ),
      body: Column(
        children: [
          // Map Container
          Expanded(
            child: Stack(
              children: [
                FlutterMap(
                  mapController: _mapController,
                  options: MapOptions(
                    initialCenter: _center,
                    initialZoom: 17.0,
                    minZoom: 14.0,
                    maxZoom: 19.0,
                  ),
                  children: [
                    TileLayer(
                      urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                      userAgentPackageName: 'id.komplekku',
                    ),
                    PolygonLayer(
                      polygons: [
                        Polygon(
                          points: _boundaryPoints,
                          color: AppColors.primary.withValues(alpha: 0.15),
                          borderColor: AppColors.primary,
                          borderStrokeWidth: 2.5,
                        ),
                      ],
                    ),
                    MarkerLayer(
                      markers: [
                        Marker(
                          point: _center,
                          width: 44,
                          height: 44,
                          child: Container(
                            decoration: const BoxDecoration(
                              color: AppColors.danger,
                              shape: BoxShape.circle,
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black26,
                                  blurRadius: 6,
                                  offset: Offset(0, 3),
                                ),
                              ],
                            ),
                            child: const Icon(
                              Icons.security,
                              color: Colors.white,
                              size: 22,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
                // Recenter Floating Button
                Positioned(
                  bottom: AppSpacing.base,
                  right: AppSpacing.base,
                  child: FloatingActionButton.small(
                    onPressed: _recenter,
                    backgroundColor: AppColors.primary,
                    child: const Icon(Icons.center_focus_strong, color: AppColors.surface),
                  ),
                ),
              ],
            ),
          ),
          // Info Panel
          Container(
            padding: const EdgeInsets.all(AppSpacing.base),
            decoration: const BoxDecoration(
              color: AppColors.surface,
              border: Border(top: BorderSide(color: AppColors.border)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Row(
                  children: [
                    const Icon(Icons.location_on, color: AppColors.danger, size: 20),
                    const SizedBox(width: AppSpacing.sm),
                    Text(
                      'Pintu Gerbang Utama & Pos Security',
                      style: AppTypography.body.copyWith(
                        fontWeight: FontWeight.w700,
                        color: AppColors.textPrimary,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: AppSpacing.sm),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('Wilayah:', style: AppTypography.caption),
                    Text(
                      'Billabong Blok F',
                      style: AppTypography.caption.copyWith(fontWeight: FontWeight.w700),
                    ),
                  ],
                ),
                const SizedBox(height: AppSpacing.xs),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('Koordinat Pusat:', style: AppTypography.caption),
                    Text(
                      '-6.509707, 106.772959',
                      style: AppTypography.tabular(AppTypography.caption),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  static const String _centerLocationTooltip = 'Kembali ke Pusat Komplek';
}

