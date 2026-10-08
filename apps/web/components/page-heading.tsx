import type { ReactNode } from "react";

type Props = {
  title: string;
  subtitle?: ReactNode;
  meta?: ReactNode;
  actions?: ReactNode;
};

export function PageHeading({ title, subtitle, meta, actions }: Props) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4">
      <div className="min-w-0">
        <h1 className="pgh-page-title">{title}</h1>
        {subtitle && <p className="mt-2 max-w-2xl text-sm text-zinc-400">{subtitle}</p>}
        {meta && <p className="mt-1 text-xs text-zinc-500">{meta}</p>}
      </div>
      {actions && <div className="shrink-0">{actions}</div>}
    </header>
  );
}
