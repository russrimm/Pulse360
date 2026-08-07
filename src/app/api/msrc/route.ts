import { NextRequest, NextResponse } from 'next/server';

const API_URL = 'https://api.msrc.microsoft.com/cvrf/v3.0/updates';
const CVRF_URL = 'https://api.msrc.microsoft.com/cvrf/v3.0/cvrf/';
const MONTH_ID_PATTERN = /^\d{4}-(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)$/;
const REQUEST_TIMEOUT_MS = 30_000;

export const DEFAULT_PAGE_SIZE = 25;
export const MAX_PAGE_SIZE = 100;

// Only impact (0) and severity (3) threats are rendered; the rest are dropped to keep
// the response well under the 4.5 MB serverless response limit.
const RENDERED_THREAT_TYPES = new Set([0, 3]);

// A Patch Tuesday CVRF document is up to ~12 MB and has to be re-read for every page,
// so keep a couple of trimmed months in instance memory instead of refetching each time.
const MONTH_CACHE_TTL_MS = 15 * 60 * 1000;
const MONTH_CACHE_MAX_ENTRIES = 2;

const RESPONSE_HEADERS = {
  'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=3600',
  'X-Content-Type-Options': 'nosniff',
};

interface CvrfValue {
  Value?: string;
}

interface CvrfFullProductName {
  ProductID?: string;
  Value?: string;
}

interface CvrfProductStatus {
  ProductID?: string[] | string;
  Type?: number;
}

interface CvrfThreat {
  Type?: number;
  Description?: CvrfValue;
  ProductID?: string[] | string;
}

interface CvrfRemediation {
  ProductID?: string[] | string;
  URL?: string;
  Description?: CvrfValue;
  Type?: number;
  SubType?: string;
}

interface CvrfVulnerability {
  Title?: CvrfValue;
  CVE?: string;
  Ordinal?: string | number;
  ProductStatuses?: CvrfProductStatus[];
  Threats?: CvrfThreat[];
  Remediations?: CvrfRemediation[];
}

interface CvrfDocument {
  DocumentTracking?: { CurrentReleaseDate?: string; InitialReleaseDate?: string };
  ProductTree?: { FullProductName?: CvrfFullProductName[] };
  Vulnerability?: CvrfVulnerability[];
}

interface TrimmedVulnerability {
  ID: string;
  Title?: CvrfValue;
  CVE?: string;
  ProductStatuses: { ProductID: string[]; Type?: number }[];
  Threats: { Type?: number; Description?: CvrfValue; ProductID: string[] }[];
  Remediations: {
    ProductID: string[];
    URL?: string;
    Description?: CvrfValue;
    Type?: number;
    SubType?: string;
  }[];
}

interface TrimmedMonth {
  releaseDate: string;
  products: CvrfFullProductName[];
  vulnerabilities: TrimmedVulnerability[];
}

const monthCache = new Map<string, { expiresAt: number; month: TrimmedMonth }>();

function toProductIds(value: string[] | string | undefined): string[] {
  if (Array.isArray(value)) return value.filter((id): id is string => typeof id === 'string');
  return typeof value === 'string' ? [value] : [];
}

function trimVulnerability(vulnerability: CvrfVulnerability, index: number): TrimmedVulnerability {
  const ordinal = vulnerability.Ordinal;
  return {
    // CVRF vulnerabilities have no ID field, so fall back to the ordinal to keep React keys unique.
    ID: vulnerability.CVE || (ordinal !== undefined ? String(ordinal) : `vuln-${index}`),
    Title: vulnerability.Title,
    CVE: vulnerability.CVE,
    ProductStatuses: (vulnerability.ProductStatuses ?? []).map(status => ({
      ProductID: toProductIds(status.ProductID),
      Type: status.Type,
    })),
    Threats: (vulnerability.Threats ?? [])
      .filter(threat => RENDERED_THREAT_TYPES.has(Number(threat.Type)))
      .map(threat => ({
        Type: threat.Type,
        Description: threat.Description,
        ProductID: toProductIds(threat.ProductID),
      })),
    Remediations: (vulnerability.Remediations ?? []).map(remediation => ({
      ProductID: toProductIds(remediation.ProductID),
      URL: remediation.URL,
      Description: remediation.Description,
      Type: remediation.Type,
      SubType: remediation.SubType,
    })),
  };
}

function trimDocument(document: CvrfDocument): TrimmedMonth {
  const vulnerabilities = (document.Vulnerability ?? [])
    .map(trimVulnerability)
    .filter(vulnerability => (vulnerability.Title?.Value ?? '').trim() !== '');

  return {
    // InitialReleaseDate is the Patch Tuesday date; CurrentReleaseDate only tracks the latest revision.
    releaseDate:
      document.DocumentTracking?.InitialReleaseDate ??
      document.DocumentTracking?.CurrentReleaseDate ??
      '',
    products: (document.ProductTree?.FullProductName ?? []).map(product => ({
      ProductID: product.ProductID,
      Value: product.Value,
    })),
    vulnerabilities,
  };
}

function readCachedMonth(monthId: string): TrimmedMonth | undefined {
  const entry = monthCache.get(monthId);
  if (!entry) return undefined;
  if (entry.expiresAt <= Date.now()) {
    monthCache.delete(monthId);
    return undefined;
  }
  // Refresh recency so the least recently used month is the one evicted.
  monthCache.delete(monthId);
  monthCache.set(monthId, entry);
  return entry.month;
}

function writeCachedMonth(monthId: string, month: TrimmedMonth): void {
  monthCache.set(monthId, { expiresAt: Date.now() + MONTH_CACHE_TTL_MS, month });
  while (monthCache.size > MONTH_CACHE_MAX_ENTRIES) {
    const oldest = monthCache.keys().next();
    if (oldest.done) break;
    monthCache.delete(oldest.value);
  }
}

async function loadMonth(monthId: string): Promise<TrimmedMonth | null> {
  const cached = readCachedMonth(monthId);
  if (cached) return cached;

  const response = await fetch(CVRF_URL + encodeURIComponent(monthId), {
    headers: { Accept: 'application/json' },
    // Documents exceed the Next.js data cache entry limit, so cache the trimmed result instead.
    cache: 'no-store',
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!response.ok) return null;

  const month = trimDocument((await response.json()) as CvrfDocument);
  writeCachedMonth(monthId, month);
  return month;
}

function parsePageNumber(value: string | null): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
}

function parsePageSize(value: string | null): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) return DEFAULT_PAGE_SIZE;
  return Math.min(parsed, MAX_PAGE_SIZE);
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const monthId = searchParams.get('monthId');

  try {
    if (monthId) {
      if (!MONTH_ID_PATTERN.test(monthId)) {
        return NextResponse.json({ error: 'Invalid monthId format' }, { status: 400 });
      }

      const month = await loadMonth(monthId);
      if (!month) {
        return NextResponse.json({ error: 'Failed to fetch CVEs for month' }, { status: 502 });
      }

      const pageSize = parsePageSize(searchParams.get('pageSize'));
      const total = month.vulnerabilities.length;
      const totalPages = Math.max(1, Math.ceil(total / pageSize));
      const page = Math.min(parsePageNumber(searchParams.get('page')), totalPages);
      const start = (page - 1) * pageSize;
      const vulnerabilities = month.vulnerabilities.slice(start, start + pageSize);

      // Ship only the products referenced on this page so the payload stays small.
      const referencedProductIds = new Set(
        vulnerabilities.flatMap(vulnerability =>
          vulnerability.ProductStatuses.flatMap(status => status.ProductID)
        )
      );

      return NextResponse.json(
        {
          ReleaseDate: month.releaseDate,
          ProductTree: {
            FullProductName: month.products.filter(
              product =>
                product.ProductID !== undefined && referencedProductIds.has(product.ProductID)
            ),
          },
          Vulnerability: vulnerabilities,
          page,
          pageSize,
          totalPages,
          totalVulnerabilities: total,
        },
        { headers: RESPONSE_HEADERS }
      );
    }

    const response = await fetch(API_URL, {
      headers: { Accept: 'application/json' },
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch updates' }, { status: 502 });
    }
    return NextResponse.json(await response.json(), { headers: RESPONSE_HEADERS });
  } catch (error) {
    console.error('MSRC API error:', error);
    return NextResponse.json(
      { error: 'Security update data is temporarily unavailable' },
      { status: 502 }
    );
  }
}
