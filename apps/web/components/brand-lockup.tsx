import { LogoMark } from "./logo";

type Props = {
  className?: string;
  markClassName?: string;
};

/** Nav wordmark — Bebas title line + Barlow subtitle (matches page titles + nav). */
export function BrandLockup({ className = "", markClassName = "h-11 w-11" }: Props) {
  return (
    <div className={`flex min-w-0 items-center gap-2.5 sm:gap-3 ${className}`}>
      <LogoMark className={`${markClassName} shrink-0`} />
      <div className="min-w-0 leading-none">
        <span className="pgh-nav-title block">Steel City</span>
        <span className="pgh-nav-subtitle mt-1 block">Bus Tracker</span>
      </div>
    </div>
  );
}
