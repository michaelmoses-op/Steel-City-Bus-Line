"use client";

type Option<T extends string> = { id: T; label: string };

type Props<T extends string> = {
  legend: string;
  name: string;
  value: T;
  onChange: (value: T) => void;
  options: Option<T>[];
};

export function PlanOptionGroup<T extends string>({
  legend,
  name,
  value,
  onChange,
  options,
}: Props<T>) {
  return (
    <div>
      <p className="mb-2 text-sm font-medium text-zinc-300">{legend}</p>
      <div
        className="inline-flex flex-wrap gap-1 rounded-lg border border-zinc-600/80 bg-zinc-950/80 p-1"
        role="radiogroup"
        aria-label={legend}
      >
        {options.map((opt) => {
          const selected = value === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              role="radio"
              aria-checked={selected}
              name={name}
              onClick={() => onChange(opt.id)}
              className={`rounded-md px-3 py-2 text-sm font-medium transition ${
                selected
                  ? "bg-[#FFB612] text-black shadow-sm"
                  : "text-zinc-400 hover:bg-zinc-800/80 hover:text-zinc-200"
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

type ToggleProps = {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
};

export function PlanToggle({ label, description, checked, onChange }: ToggleProps) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="text-sm font-medium text-zinc-200">{label}</p>
        {description && <p className="mt-0.5 text-xs text-zinc-500">{description}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 h-7 w-12 shrink-0 rounded-full border transition ${
          checked
            ? "border-[#FFB612]/60 bg-[#FFB612]/20"
            : "border-zinc-600 bg-zinc-800"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full shadow transition ${
            checked ? "translate-x-6 bg-[#FFB612]" : "translate-x-0 bg-zinc-400"
          }`}
        />
      </button>
    </div>
  );
}
