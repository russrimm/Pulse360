export type DateFilterType = 'all' | 'last30' | 'last14' | 'last7' | 'custom';

export interface MessageFilterState {
  searchQuery: string;
  selectedTags: string[];
  selectedServices: string[];
  selectedDateFilter: DateFilterType;
  customDateRange: { from: string; to: string };
  showMajorChangesOnly: boolean;
}

const DATE_FILTERS = new Set<DateFilterType>(['all', 'last30', 'last14', 'last7', 'custom']);
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function parseList(value: string | null): string[] {
  if (!value) return [];
  return value
    .split(',')
    .map(item => item.trim())
    .filter((item, index, values) => item.length > 0 && item.length <= 100 && values.indexOf(item) === index)
    .slice(0, 20);
}

function parseDate(value: string | null): string {
  return value && ISO_DATE_PATTERN.test(value) ? value : '';
}

export function parseMessageFilters(params: URLSearchParams): MessageFilterState {
  const requestedDateFilter = params.get('date') as DateFilterType | null;
  const selectedDateFilter =
    requestedDateFilter && DATE_FILTERS.has(requestedDateFilter) ? requestedDateFilter : 'all';

  return {
    searchQuery: (params.get('q') ?? '').slice(0, 200),
    selectedTags: parseList(params.get('tags')),
    selectedServices: parseList(params.get('services')),
    selectedDateFilter,
    customDateRange: {
      from: parseDate(params.get('from')),
      to: parseDate(params.get('to')),
    },
    showMajorChangesOnly: params.get('major') === '1',
  };
}

export function buildMessageFilterParams(
  currentParams: URLSearchParams,
  state: MessageFilterState
): URLSearchParams {
  const params = new URLSearchParams(currentParams);
  for (const key of ['q', 'tags', 'services', 'date', 'from', 'to', 'major']) {
    params.delete(key);
  }

  if (state.searchQuery.trim()) params.set('q', state.searchQuery.trim());
  if (state.selectedTags.length > 0) params.set('tags', state.selectedTags.join(','));
  if (state.selectedServices.length > 0) params.set('services', state.selectedServices.join(','));
  if (state.selectedDateFilter !== 'all') params.set('date', state.selectedDateFilter);
  if (state.selectedDateFilter === 'custom') {
    if (state.customDateRange.from) params.set('from', state.customDateRange.from);
    if (state.customDateRange.to) params.set('to', state.customDateRange.to);
  }
  if (state.showMajorChangesOnly) params.set('major', '1');

  return params;
}
