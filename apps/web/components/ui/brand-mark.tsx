import Link from "next/link";

type BrandMarkProps = {
  variant?: "lockup" | "mark";
  tone?: "default" | "light";
  href?: string | null;
  priority?: boolean;
  className?: string;
  showTagline?: boolean;
};

export function BrandMark({
  variant = "lockup",
  tone = "default",
  href = "/",
  showTagline = true,
  className,
}: BrandMarkProps) {
  const rootClassName = [
    "brand-lockup",
    `brand-lockup--${variant}`,
    tone === "light" ? "brand-lockup--light" : null,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const isLight = tone === "light";
  const cyanColor = isLight ? "#FFFFFF" : "#00ACC1";
  const cyanLight = isLight ? "#E0F7FA" : "#4DD0E1";
  const darkTextColor = isLight ? "#FFFFFF" : "#1E293B";
  const taglineColor = isLight ? "#B2EBF2" : "#64748B";

  // Standalone House Logo (Image 1) - House silhouette + 4-pane window + tree + curved ground line
  const exactHouseMarkIcon = (
    <svg
      width="36"
      height="36"
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0"
    >
      {/* Main Front House */}
      <path d="M 12,82 L 12,44 L 46,20 L 70,38 L 70,82 Z" fill={cyanColor} />

      {/* 4-Pane Square Window Cutout */}
      <rect x="25" y="48" width="7" height="7" fill={isLight ? "#00ACC1" : "#FFFFFF"} rx="1" />
      <rect x="34" y="48" width="7" height="7" fill={isLight ? "#00ACC1" : "#FFFFFF"} rx="1" />
      <rect x="25" y="57" width="7" height="7" fill={isLight ? "#00ACC1" : "#FFFFFF"} rx="1" />
      <rect x="34" y="57" width="7" height="7" fill={isLight ? "#00ACC1" : "#FFFFFF"} rx="1" />

      {/* Secondary House (Right Background) */}
      <path d="M 62,82 L 62,48 L 78,36 L 90,45 L 90,82 Z" fill={cyanColor} opacity="0.45" />

      {/* Round Tree Icon with Trunk */}
      <circle cx="68" cy="60" r="7" fill={cyanColor} />
      <rect x="67" y="65" width="2.5" height="17" fill={cyanColor} />

      {/* Curved Hill Base Line */}
      <path d="M 4,85 C 30,79 70,79 96,85 C 96,90 4,90 4,85 Z" fill={cyanColor} />
    </svg>
  );

  // Full Stylized 'K' Icon (Image 2)
  const fullKIcon = (
    <svg
      width="42"
      height="42"
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0"
    >
      <defs>
        <linearGradient
          id="k-grad-full-lockup"
          x1="0"
          y1="0"
          x2="120"
          y2="120"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor={cyanColor} />
          <stop offset="100%" stopColor={cyanLight} />
        </linearGradient>
      </defs>

      {/* Stylized 'K' Shape */}
      <path
        d="M 12,12 L 34,12 L 34,50 L 85,14 L 110,14 L 56,58 L 112,108 L 86,108 L 34,64 L 34,108 L 12,108 Z"
        fill="url(#k-grad-full-lockup)"
      />

      {/* Curved Ground Base */}
      <path d="M 10,104 C 35,92 85,92 114,104 C 114,112 10,112 10,104 Z" fill={cyanColor} />

      {/* Main White House Silhouette */}
      <path d="M 22,102 L 22,60 L 52,40 L 74,58 L 74,102 Z" fill="#FFFFFF" />
      {/* 4-Pane Window on Main House */}
      <rect x="34" y="66" width="6" height="6" fill={cyanColor} rx="1" />
      <rect x="42" y="66" width="6" height="6" fill={cyanColor} rx="1" />
      <rect x="34" y="74" width="6" height="6" fill={cyanColor} rx="1" />
      <rect x="42" y="74" width="6" height="6" fill={cyanColor} rx="1" />

      {/* Secondary Medium House Silhouette */}
      <path d="M 64,102 L 64,68 L 84,54 L 96,64 L 96,102 Z" fill="#FFFFFF" opacity="0.9" />

      {/* Tree Icon beside main house */}
      <circle cx="86" cy="80" r="7" fill={cyanColor} />
      <rect x="85" y="85" width="2" height="12" fill={cyanColor} />

      {/* Third Small House Silhouette */}
      <path d="M 92,102 L 92,78 L 106,68 L 112,74 L 112,102 Z" fill="#FFFFFF" opacity="0.75" />
    </svg>
  );

  let content: React.ReactNode;

  if (variant === "mark") {
    content = exactHouseMarkIcon;
  } else {
    content = (
      <span className="inline-flex items-center gap-2.5">
        {fullKIcon}
        <span className="flex flex-col justify-center text-left">
          <span className="font-extrabold text-2xl tracking-tight leading-none">
            <span style={{ color: darkTextColor }}>Komplek</span>
            <span style={{ color: cyanColor }}>Ku</span>
          </span>
          {showTagline && (
            <span
              className="text-[9px] font-medium tracking-normal mt-0.5 whitespace-nowrap"
              style={{ color: taglineColor }}
            >
              Modern living. Seamlessly connected.
            </span>
          )}
        </span>
      </span>
    );
  }

  if (href === null) {
    return <span className={rootClassName}>{content}</span>;
  }

  return (
    <Link className={rootClassName} href={href} aria-label="KomplekKu, ke beranda">
      {content}
    </Link>
  );
}
