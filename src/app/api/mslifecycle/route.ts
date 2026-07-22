import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';
import ExcelJS from 'exceljs';

const LEARN_EXPORT_PAGE = 'https://learn.microsoft.com/en-us/lifecycle/products/export/';
// Cache TTL: 24 hours (in seconds)
const CACHE_TTL = 60 * 60 * 24;
// Path to persistent data file
const DATA_FILE = join(process.cwd(), 'public', 'data', 'lifecycle.json');

let cachedData: { rows: LifecycleRow[]; fetchedAt: number; sourceUrl: string } | null = null;

export interface LifecycleRow {
  product: string;
  edition: string;
  release: string;
  category: string;
  supportPolicy: string;
  startDate: string | null;
  mainStreamEndDate: string | null;
  extendedEndDate: string | null;
  retirementDate: string | null;
  releaseStartDate: string | null;
  releaseEndDate: string | null;
  docsUrl: string;
  endOfSupportDate: string | null;
}

interface LegacyLifecycleRow {
  product: string;
  edition?: string;
  release?: string;
  category: string;
  supportPolicy?: string;
  startDate: string | null;
  mainStreamEndDate?: string | null;
  extendedEndDate: string | null;
  retirementDate: string | null;
  releaseStartDate?: string | null;
  releaseEndDate?: string | null;
  docsUrl?: string;
  endOfSupportDate: string | null;
}

function normalizeLifecycleRow(row: LegacyLifecycleRow): LifecycleRow {
  return {
    product: row.product,
    edition: row.edition ?? '',
    release: row.release ?? '',
    category: row.category,
    supportPolicy: row.supportPolicy ?? '',
    startDate: row.startDate,
    mainStreamEndDate: row.mainStreamEndDate ?? null,
    extendedEndDate: row.extendedEndDate,
    retirementDate: row.retirementDate,
    releaseStartDate: row.releaseStartDate ?? null,
    releaseEndDate: row.releaseEndDate ?? null,
    docsUrl: row.docsUrl ?? '',
    endOfSupportDate: row.endOfSupportDate,
  };
}

async function getXlsxUrl(): Promise<string> {
  const res = await fetch(LEARN_EXPORT_PAGE, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Pulse360/1.0)' },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`Failed to fetch lifecycle export page: ${res.status}`);
  const html = await res.text();

  // Find the .xlsx download link on the page
  const match = html.match(/href="(https:\/\/download\.microsoft\.com\/[^"]+\.xlsx)"/i);
  if (!match) throw new Error('Could not find .xlsx download link on the lifecycle export page');
  return match[1];
}

type CellVal = ExcelJS.CellValue;

function cellToString(value: CellVal): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === 'object') {
    if ('richText' in value && Array.isArray(value.richText)) {
      return (value.richText as Array<{ text: string }>).map(r => r.text).join('').trim();
    }
    if ('text' in value) return String((value as { text: unknown }).text).trim();
    if ('result' in value) return cellToString((value as { result: CellVal }).result);
  }
  return '';
}

function cellToISO(value: CellVal): string | null {
  if (value === null || value === undefined || value === '') return null;
  // Unwrap formula cells to their result
  if (typeof value === 'object' && !(value instanceof Date) && 'result' in value) {
    return cellToISO((value as { result: CellVal }).result);
  }
  if (value instanceof Date) {
    if (isNaN(value.getTime())) return null;
    return value.toISOString().slice(0, 10);
  }
  if (typeof value === 'number') {
    // Excel serial date: epoch is Dec 30, 1899
    const date = new Date((value - 25569) * 86400 * 1000);
    if (isNaN(date.getTime())) return null;
    return date.toISOString().slice(0, 10);
  }
  if (typeof value === 'string' && value.trim()) {
    const d = new Date(value);
    if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
    return value;
  }
  return null;
}

async function fetchAndParseLifecycle(): Promise<{ rows: LifecycleRow[]; sourceUrl: string }> {
  const sourceUrl = await getXlsxUrl();

  const xlsxRes = await fetch(sourceUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Pulse360/1.0)' },
  });
  if (!xlsxRes.ok) throw new Error(`Failed to download lifecycle XLSX: ${xlsxRes.status}`);

  const buffer = await xlsxRes.arrayBuffer();
  const workbook = new ExcelJS.Workbook();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await workbook.xlsx.load(Buffer.from(buffer) as any);

  const worksheet = workbook.worksheets[0];
  if (!worksheet) throw new Error('No worksheets found in lifecycle XLSX');

  // Convert to array-of-arrays (0-indexed) to detect the header row dynamically
  const raw: CellVal[][] = [];
  worksheet.eachRow({ includeEmpty: false }, (row) => {
    // ExcelJS row.values is 1-indexed (index 0 is undefined), slice to 0-indexed
    raw.push((row.values as CellVal[]).slice(1));
  });

  // Find the header row (first row containing 'Product', 'ListingName', or similar)
  let headerIdx = 0;
  for (let i = 0; i < Math.min(10, raw.length); i++) {
    const row = raw[i];
    if (row.some(c => {
      const v = cellToString(c).toLowerCase();
      return v.includes('product') || v.includes('listingname') || v.includes('listing name');
    })) {
      headerIdx = i;
      break;
    }
  }

  const headers = raw[headerIdx].map(h => cellToString(h).toLowerCase());

  const colIdx = (candidates: string[]): number => {
    for (const c of candidates) {
      const idx = headers.findIndex(h => h.includes(c));
      if (idx !== -1) return idx;
    }
    return -1;
  };

  const iProduct = colIdx(['product listing name', 'product name', 'listingname', 'listing name', 'product']);
  const iEdition = colIdx(['edition']);
  const iRelease = colIdx(['release']);
  const iCategory = colIdx(['azure feature', 'azurefeature', 'category', 'type', 'family']);
  const iSupportPolicy = colIdx(['support policy', 'supportpolicy']);
  const iStart = colIdx(['start date', 'general availability', 'launch date']);
  const iMainStream = colIdx(['mainstream end date', 'mainstream end']);
  const iExtended = colIdx(['extended end date', 'extended end', 'extended']);
  const iRetirement = colIdx(['retirement date', 'retirement', 'retired']);
  const iReleaseStart = colIdx(['release start date', 'release start']);
  const iReleaseEnd = colIdx(['release end date', 'release end']);
  const iDocsUrl = colIdx(['docsurl', 'docs url', 'documentation url', 'url']);
  const iEOS = colIdx(['end of support', 'support end', 'enddate', 'end date']);

  const rows: LifecycleRow[] = [];

  for (let i = headerIdx + 1; i < raw.length; i++) {
    const row = raw[i];
    const product = iProduct >= 0 ? cellToString(row[iProduct]) : '';
    if (!product) continue; // skip blank rows

    rows.push({
      product,
      edition: iEdition >= 0 ? cellToString(row[iEdition]) : '',
      release: iRelease >= 0 ? cellToString(row[iRelease]) : '',
      category: iCategory >= 0 ? cellToString(row[iCategory]) : '',
      supportPolicy: iSupportPolicy >= 0 ? cellToString(row[iSupportPolicy]) : '',
      startDate: iStart >= 0 ? cellToISO(row[iStart]) : null,
      mainStreamEndDate: iMainStream >= 0 ? cellToISO(row[iMainStream]) : null,
      extendedEndDate: iExtended >= 0 ? cellToISO(row[iExtended]) : null,
      retirementDate: iRetirement >= 0 ? cellToISO(row[iRetirement]) : null,
      releaseStartDate: iReleaseStart >= 0 ? cellToISO(row[iReleaseStart]) : null,
      releaseEndDate: iReleaseEnd >= 0 ? cellToISO(row[iReleaseEnd]) : null,
      docsUrl: iDocsUrl >= 0 ? cellToString(row[iDocsUrl]) : '',
      endOfSupportDate: iEOS >= 0 ? cellToISO(row[iEOS]) : null,
    });
  }

  return { rows, sourceUrl };
}

export async function GET() {
  try {
    const now = Date.now();

    // Return in-memory cache if still fresh
    if (cachedData && now - cachedData.fetchedAt < CACHE_TTL * 1000) {
      return NextResponse.json({
        rows: cachedData.rows,
        sourceUrl: cachedData.sourceUrl,
        cachedAt: new Date(cachedData.fetchedAt).toISOString(),
        fromCache: true,
        source: 'memory',
      });
    }

    // Try to load from persistent file
    try {
      const fileContent = readFileSync(DATA_FILE, 'utf-8');
      const data = JSON.parse(fileContent);

      if (data.rows && Array.isArray(data.rows)) {
        const hasReleaseField = data.rows.length === 0 || data.rows.some((row: LegacyLifecycleRow) => 'release' in row);
        if (!hasReleaseField) {
          throw new Error('Lifecycle cache uses legacy schema without release field');
        }

        const normalizedRows = (data.rows as LegacyLifecycleRow[]).map(normalizeLifecycleRow);
        cachedData = {
          rows: normalizedRows,
          fetchedAt: new Date(data.fetchedAt).getTime(),
          sourceUrl: data.sourceUrl,
        };

        return NextResponse.json({
          rows: normalizedRows,
          sourceUrl: data.sourceUrl,
          cachedAt: data.fetchedAt,
          fromCache: true,
          source: 'file',
        });
      }
    } catch (fileError) {
      // File doesn't exist or is invalid, fall back to fetching
      console.warn('Could not read lifecycle data file, fetching fresh data:', fileError);
    }

    // Fall back to fetching fresh data if file doesn't exist or is invalid
    const { rows, sourceUrl } = await fetchAndParseLifecycle();
    cachedData = { rows, fetchedAt: now, sourceUrl };

    return NextResponse.json({
      rows,
      sourceUrl,
      cachedAt: new Date(now).toISOString(),
      fromCache: false,
      source: 'live-fetch',
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
