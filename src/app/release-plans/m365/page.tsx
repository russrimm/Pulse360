import { M365UpdateCard } from '@/components/M365UpdateCard';
import { UpdatesExplorer } from '@/components/UpdatesExplorer';
import { parseListParams, queryList, type ListQueryConfig } from '@/lib/list-query';
import type { M365Update } from '@/lib/types';
import { getM365UpdateSummaries } from '@/lib/update-summaries';

export const metadata = {
  title: 'Microsoft 365 Updates | Pulse 360',
  description: 'Latest Microsoft 365 feature updates and change insights.',
};

const BASE_PATH = '/release-plans/m365';
const FACET_KEYS = ['product', 'status'];

const listConfig: ListQueryConfig<M365Update> = {
  pageSize: 12,
  getDate: update => update.published,
  getSearchText: update =>
    [update.id, update.title, update.product, ...update.service, ...update.tags].join(' '),
  facets: [
    { key: 'product', label: 'Products', getValues: update => update.service },
    {
      key: 'status',
      label: 'Status',
      getValues: update => (update.status ? [update.status] : []),
    },
  ],
};

interface M365UpdatesPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function M365UpdatesEmbeddedPage({ searchParams }: M365UpdatesPageProps) {
  const params = parseListParams(await searchParams, FACET_KEYS);
  const updates = await getM365UpdateSummaries();
  const result = queryList(updates, params, listConfig);

  return (
    <UpdatesExplorer
      title="Microsoft 365 Release Plans"
      description="Stay informed about the latest Microsoft 365 updates and changes."
      basePath={BASE_PATH}
      params={params}
      result={result}
      renderItem={update => (
        <li key={update.id} className="min-w-0">
          <M365UpdateCard update={update} />
        </li>
      )}
    />
  );
}
