/**
 * Generates a stable unique identifier.
 * Uses crypto.randomUUID() when available, with a reliable fallback.
 */
export function generateId(prefix = 'src'): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    try {
      return crypto.randomUUID();
    } catch {
      // Fall through to timestamp-random generator
    }
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}
