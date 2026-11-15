export const DYNAMICS_FAMILY = 'Dynamics 365';
export const POWER_PLATFORM_FAMILY = 'Power Platform and Dataverse';
export const M365_FAMILY = 'Microsoft 365, Copilot & other';

const POWER_PLATFORM_PATTERN = /^(microsoft )?(power (platform|apps|automate|pages|bi)|dataverse)\b/i;

/**
 * Groups AI at Work roadmap products into the families Microsoft folded into the
 * roadmap in September 2026: Dynamics 365, Power Platform and Dataverse.
 */
export function getRoadmapFamily(product: string): string {
  if (/^dynamics 365\b/i.test(product)) return DYNAMICS_FAMILY;
  if (POWER_PLATFORM_PATTERN.test(product)) return POWER_PLATFORM_FAMILY;
  return M365_FAMILY;
}

export function getRoadmapFamilies(products: string[]): string[] {
  return Array.from(new Set(products.map(getRoadmapFamily)));
}
