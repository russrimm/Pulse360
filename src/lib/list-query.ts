export const DATE_FILTER_OPTIONS = [
  { value: 'all', label: 'All dates', days: null },
  { value: 'last7', label: 'Last 7 days', days: 7 },
  { value: 'last14', label: 'Last 14 days', days: 14 },
  { value: 'last30', label: 'Last 30 days', days: 30 },
  { value: 'last60', label: 'Last 60 days', days: 60 },
  { value: 'custom', label: 'Custom range', days: null },
] as const;

export type DateFilterValue = (typeof DATE_FILTER_OPTIONS)[number]['value'];

export interface ListParams {
  q: string;
  date: DateFilterValue;
  from: string;
  to: string;
  page: number;
  facets: Record<string, string[]>;
}

export interface ListFacetDefinition<T> {
  key: string;
  label: string;
  getValues: (item: T) => string[];
}

export interface ListQueryConfig<T> {
  pageSize: number;
  getDate: (item: T) => string;
  getSearchText: (item: T) => string;
  facets: ListFacetDefinition<T>[];
  /** Newest first by default. */
  compare?: (a: T, b: T) => number;
}

export interface ListFacetResult {
  key: string;
  label: string;
  options: string[];
  selected: string[];
}

export interface ListQueryResult<T> {
  items: T[];
  totalCount: number;
  filteredCount: number;
  page: number;
  pageCount: number;
  facets: ListFacetResult[];
}

type RawSearchParams = Record<string, string | string[] | undefined>;

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;
const MAX_QUERY_LENGTH = 200;

function readAll(raw: RawSearchParams, key: string): string[] {
  const value = raw[key];
  if (value === undefined) return [];
  return (Array.isArray(value) ? value : [value]).filter(entry => entry.length > 0);
}

function readOne(raw: RawSearchParams, key: string): string {
  return readAll(raw, key)[0] ?? '';
}

export function parseListParams(raw: RawSearchParams, facetKeys: string[]): ListParams {
  const dateValue = readOne(raw, 'date');
  const date = DATE_FILTER_OPTIONS.some(option => option.value === dateValue)
    ? (dateValue as DateFilterValue)
    : 'all';
  const from = readOne(raw, 'from');
  const to = readOne(raw, 'to');
  const parsedPage = Number.parseInt(readOne(raw, 'page'), 10);

  const facets: Record<string, string[]> = {};
  for (const key of facetKeys) {
    facets[key] = readAll(raw, key).slice(0, 50);
  }

  return {
    q: readOne(raw, 'q').slice(0, MAX_QUERY_LENGTH),
    date,
    from: ISO_DAY.test(from) ? from : '',
    to: ISO_DAY.test(to) ? to : '',
    page: Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1,
    facets,
  };
}

/** Serializes params back to a query string, omitting defaults. */
export function buildListQuery(params: ListParams, overrides: Partial<ListParams> = {}): string {
  const merged = { ...params, ...overrides };
  const search = new URLSearchParams();
  if (merged.q.trim()) search.set('q', merged.q.trim());
  for (const [key, values] of Object.entries(merged.facets)) {
    for (const value of values) search.append(key, value);
  }
  if (merged.date !== 'all') search.set('date', merged.date);
  if (merged.date === 'custom') {
    if (merged.from) search.set('from', merged.from);
    if (merged.to) search.set('to', merged.to);
  }
  if (merged.page > 1) search.set('page', String(merged.page));
  const query = search.toString();
  return query ? `?${query}` : '';
}

export function hasActiveFilters(params: ListParams): boolean {
  return (
    params.q.trim().length > 0 ||
    params.date !== 'all' ||
    Object.values(params.facets).some(values => values.length > 0)
  );
}

function matchesDate(isoDate: string, params: ListParams, now: number): boolean {
  if (params.date === 'all') return true;
  const timestamp = Date.parse(isoDate);
  if (Number.isNaN(timestamp)) return false;

  if (params.date === 'custom') {
    const start = params.from ? Date.parse(`${params.from}T00:00:00`) : Number.NEGATIVE_INFINITY;
    const end = params.to ? Date.parse(`${params.to}T23:59:59.999`) : Number.POSITIVE_INFINITY;
    return timestamp >= start && timestamp <= end;
  }

  const days = DATE_FILTER_OPTIONS.find(option => option.value === params.date)?.days;
  if (!days) return true;
  return timestamp >= now - days * 24 * 60 * 60 * 1000;
}

export function queryList<T>(
  items: T[],
  params: ListParams,
  config: ListQueryConfig<T>,
  now: number = Date.now()
): ListQueryResult<T> {
  const needle = params.q.trim().toLowerCase();
  const compare =
    config.compare ?? ((a: T, b: T) => Date.parse(config.getDate(b)) - Date.parse(config.getDate(a)));

  const filtered = items
    .filter(item => {
      if (needle && !config.getSearchText(item).toLowerCase().includes(needle)) return false;
      if (!matchesDate(config.getDate(item), params, now)) return false;
      return config.facets.every(facet => {
        const selected = params.facets[facet.key] ?? [];
        if (selected.length === 0) return true;
        return facet.getValues(item).some(value => selected.includes(value));
      });
    })
    .sort(compare);

  const pageCount = Math.max(1, Math.ceil(filtered.length / config.pageSize));
  const page = Math.min(params.page, pageCount);
  const start = (page - 1) * config.pageSize;

  return {
    items: filtered.slice(start, start + config.pageSize),
    totalCount: items.length,
    filteredCount: filtered.length,
    page,
    pageCount,
    facets: config.facets.map(facet => ({
      key: facet.key,
      label: facet.label,
      options: Array.from(new Set(items.flatMap(facet.getValues))).sort((a, b) =>
        a.localeCompare(b)
      ),
      selected: params.facets[facet.key] ?? [],
    })),
  };
}
