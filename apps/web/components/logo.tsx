import Image from "next/image";

/** Brand bus mark — PNG matches signage proportions (square, not stretched). */
export function LogoMark({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <span className={`relative inline-block shrink-0 ${className}`}>
      <Image
        src="/branding/logo-mark.png"
        alt=""
        fill
        sizes="48px"
        className="object-contain object-left"
        priority
      />
    </span>
  );
}

export function LogoWithImage({ showRaster = false }: { showRaster?: boolean }) {
  if (showRaster) {
    return (
      <Image
        src="/branding/logo-mark.png"
        alt=""
        width={40}
        height={40}
        className="object-contain"
      />
    );
  }
  return <LogoMark />;
}
