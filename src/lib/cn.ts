export type ClassValue = string | false | null | undefined;

/**
 * Joins conditional class names. Deliberately dependency-free: the codebase
 * composes static Tailwind strings, so merge-aware resolution is not needed.
 */
export function cn(...values: ClassValue[]): string {
  return values.filter(Boolean).join(' ');
}
