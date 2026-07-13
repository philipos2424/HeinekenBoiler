/**
 * Normalizes phone numbers to E.164. Ethiopian local formats (09..., 07...,
 * 2519..., 2517...) are the common case for this event, but any valid
 * international number is accepted as-is.
 */
export function normalizePhone(input) {
  const trimmed = input.trim().replace(/[\s\-().]/g, '');
  if (!trimmed) return null;

  if (trimmed.startsWith('+')) {
    const digits = trimmed.slice(1);
    if (!/^\d{8,15}$/.test(digits)) return null;
    return `+${digits}`;
  }

  // Ethiopian local mobile format: 0 + 9 digits (e.g. 0911234567)
  if (/^0\d{9}$/.test(trimmed)) {
    return `+251${trimmed.slice(1)}`;
  }

  // Ethiopian country code without plus: 251 + 9 digits
  if (/^251\d{9}$/.test(trimmed)) {
    return `+${trimmed}`;
  }

  // Bare 9-digit subscriber number, assume Ethiopia
  if (/^\d{9}$/.test(trimmed)) {
    return `+251${trimmed}`;
  }

  // Fallback: plausible international number missing a leading +
  if (/^\d{8,15}$/.test(trimmed)) {
    return `+${trimmed}`;
  }

  return null;
}
