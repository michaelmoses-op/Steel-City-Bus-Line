"use client";

import type { GeocodeResult } from "@steel-city/shared";
import { useCallback, useEffect, useId, useState } from "react";
import { getApi } from "@/lib/api";

type SelectedPlace = GeocodeResult;

type Props = {
  label: string;
  value: SelectedPlace | null;
  onChange: (place: SelectedPlace | null) => void;
  placeholder?: string;
};

export function PlaceSearchField({ label, value, onChange, placeholder }: Props) {
  const inputId = useId();
  const listId = `${inputId}-suggestions`;
  const [text, setText] = useState(value?.displayName ?? "");
  const [suggestions, setSuggestions] = useState<GeocodeResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setText(value?.displayName ?? "");
  }, [value]);

  const search = useCallback(async (q: string) => {
    const term = q.trim();
    if (term.length < 3) {
      setSuggestions([]);
      return;
    }
    setLoading(true);
    try {
      const { results } = await getApi().geocode(term);
      setSuggestions(results);
    } catch {
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (value && text === value.displayName) return;
    const t = window.setTimeout(() => void search(text), 350);
    return () => window.clearTimeout(t);
  }, [text, search, value]);

  function pick(place: GeocodeResult) {
    onChange(place);
    setText(place.displayName);
    setSuggestions([]);
  }

  return (
    <div className="relative">
      <label htmlFor={inputId} className="mb-1 block text-sm font-medium text-zinc-300">
        {label}
      </label>
      <input
        id={inputId}
        type="search"
        value={text}
        placeholder={placeholder}
        autoComplete="off"
        role="combobox"
        aria-expanded={suggestions.length > 0}
        aria-controls={listId}
        onChange={(e) => {
          setText(e.target.value);
          onChange(null);
        }}
        className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
      />
      {loading && <p className="mt-1 text-xs text-zinc-500">Searching…</p>}
      {suggestions.length > 0 && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-20 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-zinc-700 bg-zinc-950 py-1 shadow-lg"
        >
          {suggestions.map((s) => (
            <li key={`${s.lat}-${s.lon}-${s.displayName}`}>
              <button
                type="button"
                role="option"
                className="w-full px-3 py-2 text-left text-sm text-zinc-200 hover:bg-zinc-800"
                onClick={() => pick(s)}
              >
                {s.displayName}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
