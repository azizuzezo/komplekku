import Image from "next/image";
import Link from "next/link";

import lockupSrc from "@/public/brand/komplekku-lockup.png";
import markSrc from "@/public/brand/komplekku-mark.png";
import markLightSrc from "@/public/brand/komplekku-mark-light.png";

type BrandMarkProps = {
  variant?: "lockup" | "mark";
  tone?: "default" | "light";
  href?: string | null;
  priority?: boolean;
  className?: string;
};

export function BrandMark({
  variant = "lockup",
  tone = "default",
  href = "/",
  priority = false,
  className,
}: BrandMarkProps) {
  const isLight = tone === "light";
  const rootClassName = [
    "brand-lockup",
    `brand-lockup--${variant}`,
    isLight ? "brand-lockup--light" : null,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  let content: React.ReactNode;

  if (variant === "mark") {
    content = (
      <Image
        className="brand-lockup__image"
        src={isLight ? markLightSrc : markSrc}
        alt="Komplekku"
        priority={priority}
      />
    );
  } else if (isLight) {
    // No dedicated light-panel lockup raster exists — the source lockup has an
    // opaque light background (assets/brand/README.md), so on the dark identity
    // panel we compose the real light mark with plain wordmark text instead of
    // generating a new logo asset.
    content = (
      <span className="brand-lockup__wordmark">
        <Image
          className="brand-lockup__wordmark-icon"
          src={markLightSrc}
          alt=""
          priority={priority}
        />
        <span className="brand-lockup__wordmark-text">Komplekku</span>
      </span>
    );
  } else {
    content = (
      <Image
        className="brand-lockup__image"
        src={lockupSrc}
        alt="Komplekku"
        priority={priority}
      />
    );
  }

  if (href === null) {
    return <span className={rootClassName}>{content}</span>;
  }

  return (
    <Link className={rootClassName} href={href} aria-label="Komplekku, ke beranda">
      {content}
    </Link>
  );
}
