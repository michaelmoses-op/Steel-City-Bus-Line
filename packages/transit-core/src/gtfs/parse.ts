import { parse } from "csv-parse/sync";

export type GtfsRow = Record<string, string>;

export function parseGtfsCsv(content: string): GtfsRow[] {
  return parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    relax_column_count: true,
  }) as GtfsRow[];
}

export function required(row: GtfsRow, key: string): string {
  const value = row[key]?.trim();
  if (!value) {
    throw new Error(`GTFS row missing required field "${key}"`);
  }
  return value;
}

export function optional(row: GtfsRow, key: string): string | null {
  const value = row[key]?.trim();
  return value ? value : null;
}

export function parseIntField(row: GtfsRow, key: string): number {
  return Number.parseInt(required(row, key), 10);
}

export function parseOptionalInt(row: GtfsRow, key: string): number | null {
  const raw = optional(row, key);
  if (raw === null) return null;
  const n = Number.parseInt(raw, 10);
  return Number.isNaN(n) ? null : n;
}

export function parseFloatField(row: GtfsRow, key: string): number {
  return Number.parseFloat(required(row, key));
}
