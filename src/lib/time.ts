import { formatDistanceToNow, format, parseISO } from "date-fns";

export function relativeTime(iso?: string): { rel: string; full: string } | null {
  if (!iso) return null;
  try {
    const d = parseISO(iso);
    if (isNaN(d.getTime())) return null;
    return {
      rel: formatDistanceToNow(d, { addSuffix: true }),
      full: format(d, "PPpp"),
    };
  } catch {
    return null;
  }
}
