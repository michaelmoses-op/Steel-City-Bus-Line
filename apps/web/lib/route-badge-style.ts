/** GTFS route colors (no # prefix) — matches route list badges. */
export function getRouteBadgeStyle(
  routeColor: string | null | undefined,
  routeTextColor: string | null | undefined,
): { backgroundColor: string; color: string } {
  const bg = routeColor?.replace(/^#/, "") ?? "";
  const fg = routeTextColor?.replace(/^#/, "") ?? "";
  return {
    backgroundColor: bg ? `#${bg}` : "#FFB81C",
    color: fg ? `#${fg}` : "#0a0a0a",
  };
}
