import { format } from 'date-fns';
import { arSA } from 'date-fns/locale';

export function formatGregorian(input?: string | Date | null, pattern = 'yyyy/MM/dd') {
  if (!input) return '-';
  const d = new Date(input);
  if (isNaN(d.getTime())) return '-';
  return format(d, pattern, { locale: arSA });
}

/**
 * Returns the correctly inflected Arabic word for a counted noun.
 * Arabic pluralization:
 *   1        → singular  (يوم / سنة / شهر / دقيقة / ساعة)
 *   2        → dual      (يومان / سنتان / شهران / دقيقتان / ساعتان)
 *   3–10     → plural    (أيام / سنوات / أشهر / دقائق / ساعات)
 *   11+      → singular  (يوم / سنة / شهر / دقيقة / ساعة)
 */
export function arabicUnit(
  n: number,
  forms: { singular: string; dual: string; plural: string }
): string {
  const abs = Math.abs(n)
  if (abs === 1) return forms.singular
  if (abs === 2) return forms.dual
  if (abs >= 3 && abs <= 10) return forms.plural
  return forms.singular
}

export const AR_DAYS    = { singular: 'يوم',    dual: 'يومان',    plural: 'أيام'    }
export const AR_YEARS   = { singular: 'سنة',    dual: 'سنتان',    plural: 'سنوات'   }
export const AR_MONTHS  = { singular: 'شهر',    dual: 'شهران',    plural: 'أشهر'    }
export const AR_MINUTES = { singular: 'دقيقة',  dual: 'دقيقتان',  plural: 'دقائق'   }
export const AR_HOURS   = { singular: 'ساعة',   dual: 'ساعتان',   plural: 'ساعات'   }

export function formatISODate(date: string | Date | null | undefined) {
  if (!date) return '-'
  try {
    const d = typeof date === 'string' ? new Date(date) : date
    if (isNaN(d.getTime())) return '-'
    return d.toISOString().split('T')[0]
  } catch {
    return '-'
  }
}

