export interface MsrcField {
  Value?: string;
}

export interface MsrcThreat {
  Type?: number | string;
  Description?: MsrcField | string;
}

export function getMsrcFieldValue(field: MsrcField | string | null | undefined): string {
  if (!field) return '';
  if (typeof field === 'string') return field;
  return typeof field.Value === 'string' ? field.Value : '';
}

export function getMsrcImpact(threats: MsrcThreat[] | undefined): string {
  if (!Array.isArray(threats)) return '';
  const impactThreat = threats.find(threat => threat.Type === 0 || threat.Type === '0');
  return getMsrcFieldValue(impactThreat?.Description);
}

export function getMsrcSeverity(threats: MsrcThreat[] | undefined): string {
  if (!Array.isArray(threats)) return '';
  const severityThreat = threats.find(threat => threat.Type === 3 || threat.Type === '3');
  return getMsrcFieldValue(severityThreat?.Description);
}
