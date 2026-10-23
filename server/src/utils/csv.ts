export function escapeCsv(value: unknown): string {
  const text = value instanceof Date ? value.toISOString() : String(value ?? "");
  if (/[",\r\n]/.test(text)) return `"${text.replaceAll('"', '""')}"`;
  return text;
}
