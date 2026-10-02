import Image from "next/image";

/** Inline SVG mark — crisp at any size; PNG fallback in /public/logo.jpg */
export function LogoMark({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <rect width="64" height="64" rx="12" fill="#0a0a0a" />
      <path
        d="M8 44h48v4H8v-4zm4-28h40a4 4 0 0 1 4 4v22H8V20a4 4 0 0 1 4-4z"
        fill="#FFB612"
      />
      <path d="M12 24h8v8h-8v-8zm16 0h8v8h-8v-8zm16 0h8v8h-8v-8z" fill="#1a1a1a" />
      <path
        d="M14 48h6v6h-6v-6zm30 0h6v6h-6v-6z"
        fill="#52525b"
        stroke="#FFB612"
        strokeWidth="1.5"
      />
      <path d="M4 12h12v4H4v-4zm44 0h12v4H48v-4z" fill="#71717a" />
    </svg>
  );
}

export function LogoWithImage({ showRaster = false }: { showRaster?: boolean }) {
  if (showRaster) {
    return (
      <Image
        src="/logo.jpg"
        alt=""
        width={36}
        height={36}
        className="rounded-lg object-cover"
      />
    );
  }
  return <LogoMark />;
}
