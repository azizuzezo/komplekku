class CommunityDetail {
  const CommunityDetail({
    required this.id,
    required this.name,
    required this.slug,
    required this.timezone,
    required this.address,
    required this.rwLabel,
  });

  final String id;
  final String name;
  final String slug;
  final String timezone;
  final String? address;
  final String? rwLabel;

  factory CommunityDetail.fromJson(Map<String, dynamic> json) {
    return CommunityDetail(
      id: json['id'] as String,
      name: json['name'] as String,
      slug: json['slug'] as String,
      timezone: json['timezone'] as String,
      address: json['address'] as String?,
      rwLabel: json['rwLabel'] as String?,
    );
  }
}
