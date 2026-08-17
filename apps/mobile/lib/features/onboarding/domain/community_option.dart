class RtOption {
  const RtOption({required this.id, required this.code, required this.name});

  final String id;
  final String code;
  final String name;
}

class CommunityOption {
  const CommunityOption({
    required this.id,
    required this.name,
    required this.slug,
    required this.timezone,
    this.rts = const [],
  });

  final String id;
  final String name;
  final String slug;
  final String timezone;
  final List<RtOption> rts;
}
