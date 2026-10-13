import { format, parseISO } from 'date-fns';
import { arSA } from 'date-fns/locale';

export function formatGregorian(input?: string | Date | null, pattern = 'yyyy/MM/dd') {
  if (!input) return '-';
  const d = new Date(input);
  if (isNaN(d.getTime())) return '-';
  return format(d, pattern, { locale: arSA });
}

export function formatISODate(iso?: string | null, pattern = 'yyyy/MM/dd') {
  if (!iso) return '-';
  try {
    return format(parseISO(iso), pattern, { locale: arSA });
  } catch {
    return '-';
  }
}