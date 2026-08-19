/// Corner radius tokens. The per-component values are hard caps from
/// `/design.md` ("These are caps, not a reason to box every section") — the
/// generic scale below is for one-off surfaces (thumbnails, avatars, pills)
/// that aren't a themed button/input/card and should still stay restrained.
abstract final class AppRadius {
  static const small = 8.0;
  static const medium = 12.0;
  static const large = 16.0;
  static const pill = 999.0;

  static const button = 8.0;
  static const input = 10.0;
  static const card = 12.0;
  static const modal = 14.0;
}
