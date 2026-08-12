import Image from "next/image";
import Link from "next/link";

type BrandMarkProps = {
  variant?: "lockup" | "mark";
  /**
   * "light" renders the white, fully transparent mark for placement directly on the
   * forest-green identity panels (auth/onboarding). It never uses the boxed light-surface
   * treatment, so it must not be combined with a card/background behind it.
   */
  tone?: "default" | "light";
  href?: string | null;
  priority?: boolean;
  className?: string;
};

const lockupAsset = { src: "/brand/komplekku-lockup.png", width: 1448, height: 1086 };
const markAsset = { src: "/brand/komplekku-mark.png", width: 1254, height: 1254 };
const markLightAsset = { src: "/brand/komplekku-mark-light.png", width: 1254, height: 1254 };

export function BrandMark({
  variant = "lockup",
  tone = "default",
  href = "/",
  priority = false,
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

  let content: React.ReactNode;

  if (variant === "mark") {
    const asset = tone === "light" ? markLightAsset : markAsset;
    content = (
      <Image
        className="brand-lockup__image"
        src={asset.src}
        width={asset.width}
        height={asset.height}
        sizes="48px"
        alt={href === null ? "Komplekku" : ""}
        priority={priority}
        draggable={false}
      />
    );
  } else if (tone === "light") {
    content = (
      <span className="brand-lockup__wordmark">
        <Image
          className="brand-lockup__wordmark-icon"
          src={markLightAsset.src}
          width={markLightAsset.width}
          height={markLightAsset.height}
          sizes="40px"
          alt=""
          priority={priority}
          draggable={false}
        />
        <span className="brand-lockup__wordmark-text">Komplekku</span>
      </span>
    );
  } else {
    content = (
      <Image
        className="brand-lockup__image"
        src={lockupAsset.src}
        width={lockupAsset.width}
        height={lockupAsset.height}
        sizes="(min-width: 1200px) 196px, 184px"
        alt={href === null ? "Komplekku" : ""}
        priority={priority}
        draggable={false}
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
