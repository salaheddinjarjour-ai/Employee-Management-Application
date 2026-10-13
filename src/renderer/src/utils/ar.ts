// Returns "سنة" | "سنتان" | "سنوات" according to Arabic rules for small card text.
export function arabicYearsLabel(n: number): string {
  if (n === 1) return 'سنة';
  if (n === 2) return 'سنتان';
  // 3–10 سنوات (for our UI, this is what we care about: 4 → "سنوات")
  if (n >= 3 && n <= 10) return 'سنوات';
  // fallback (11+)
  return 'سنة';
}

