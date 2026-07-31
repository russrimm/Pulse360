#!/usr/bin/env node
/**
 * Script to fetch and parse Microsoft Lifecycle XLSX data
 * Runs as part of the GitHub workflow or can be run manually
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import ExcelJS from 'exceljs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');
const dataDir = path.join(rootDir, 'public', 'data');
const dataFile = path.join(dataDir, 'lifecycle.json');

const LEARN_EXPORT_PAGE = 'https://learn.microsoft.com/en-us/lifecycle/products/export/';

/**
 * Fetch the XLSX download URL from the Microsoft Lifecycle export page
 */
async function getXlsxUrl() {
  console.log('🔍 Fetching lifecycle export page...');
  const res = await fetch(LEARN_EXPORT_PAGE, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Pulse360/1.0)' },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch lifecycle export page: ${res.status}`);
  }

  const html = await res.text();
  const match = html.match(/href="(https:\/\/download\.microsoft\.com\/[^"]+\.xlsx)"/i);

  if (!match) {
    throw new Error('Could not find .xlsx download link on the lifecycle export page');
  }

  return match[1];
}

/**
 * Convert ExcelJS cell value to string
 */
function cellToString(value) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === 'object') {
    if ('richText' in value && Array.isArray(value.richText)) {
      return value.richText
        .map(r => r.text)
        .join('')
        .trim();
    }
    if ('text' in value) return String(value.text).trim();
    if ('result' in value) return cellToString(value.result);
  }
  return '';
}

/**
 * Convert ExcelJS cell value to ISO date string
 */
function cellToISO(value) {
  if (value === null || value === undefined || value === '') return null;
  // Unwrap formula cells to their result
  if (typeof value === 'object' && !(value instanceof Date) && 'result' in value) {
    return cellToISO(value.result);
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
    return null;
  }
  return null;
}

/**
 * Fetch and parse the lifecycle XLSX
 */
async function fetchAndParseLifecycle() {
  const sourceUrl = await getXlsxUrl();
  console.log(`📥 Downloading XLSX from: ${sourceUrl.substring(0, 60)}...`);

  const xlsxRes = await fetch(sourceUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Pulse360/1.0)' },
  });

  if (!xlsxRes.ok) {
    throw new Error(`Failed to download lifecycle XLSX: ${xlsxRes.status}`);
  }

  const buffer = await xlsxRes.arrayBuffer();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(Buffer.from(buffer));

  const worksheet = workbook.worksheets[0];
  if (!worksheet) {
    throw new Error('No worksheets found in lifecycle XLSX');
  }

  console.log('📊 Parsing XLSX data...');

  // Convert to array-of-arrays (0-indexed)
  const raw = [];
  worksheet.eachRow({ includeEmpty: false }, row => {
    raw.push(row.values.slice(1));
  });

  // Find the header row
  let headerIdx = -1;
  for (let i = 0; i < Math.min(10, raw.length); i++) {
    const row = raw[i];
    if (
      row.some(c => {
        const v = cellToString(c).toLowerCase();
        return v.includes('product') || v.includes('listingname') || v.includes('listing name');
      })
    ) {
      headerIdx = i;
      break;
    }
  }

  if (headerIdx < 0) {
    throw new Error('Could not find a lifecycle worksheet header row');
  }

  const headers = raw[headerIdx].map(h => cellToString(h).toLowerCase());

  const colIdx = candidates => {
    for (const c of candidates) {
      const idx = headers.findIndex(h => h.includes(c));
      if (idx !== -1) return idx;
    }
    return -1;
  };

  const iProduct = colIdx([
    'product listing name',
    'product name',
    'listingname',
    'listing name',
    'product',
  ]);
  const iEdition = colIdx(['edition']);
  const iRelease = colIdx(['release', 'version']);
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

  if (iProduct < 0) {
    throw new Error('Lifecycle worksheet is missing the product column');
  }

  const rows = [];

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

/**
 * Main function
 */
async function main() {
  try {
    console.log('🚀 Starting Microsoft Lifecycle data update...\n');

    // Ensure data directory exists
    if (!fs.existsSync(dataDir)) {
      console.log(`📁 Creating directory: ${dataDir}`);
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // Fetch and parse data
    const { rows, sourceUrl } = await fetchAndParseLifecycle();
    console.log(`✅ Parsed ${rows.length} product lifecycle entries\n`);

    // Write to file
    const output = {
      version: 2,
      fetchedAt: new Date().toISOString(),
      sourceUrl,
      rows,
    };

    fs.writeFileSync(dataFile, JSON.stringify(output, null, 2));
    console.log(`✨ Data saved to ${dataFile}`);
    console.log(`📍 Source: ${sourceUrl}`);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
