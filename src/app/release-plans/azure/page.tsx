import { AzureUpdateCard } from '@/components/AzureUpdateCard';
import { UpdatesExplorer } from '@/components/UpdatesExplorer';
import { parseListParams, queryList, type ListQueryConfig } from '@/lib/list-query';
import type { AzureUpdate } from '@/lib/types';
import { getAzureUpdateSummaries } from '@/lib/update-summaries';

export const metadata = {
  title: 'Azure Updates | Pulse 360',
  description: 'Stay informed about the latest Azure platform changes and service feature updates.',
};

const BASE_PATH = '/release-plans/azure';
const FACET_KEYS = ['category', 'product', 'tag', 'status'];

const listConfig: ListQueryConfig<AzureUpdate> = {
  pageSize: 12,
  getDate: update => update.modified,
  getSearchText: update =>
    [
      update.id,
      update.title,
      update.description,
      ...update.products,
      ...update.productCategories,
      ...update.tags,
    ].join(' '),
  facets: [
    { key: 'category', label: 'Categories', getValues: update => update.productCategories },
    { key: 'product', label: 'Products', getValues: update => update.products },
    { key: 'tag', label: 'Tags', getValues: update => update.tags },
    {
      key: 'status',
      label: 'Status',
      getValues: update => (update.status ? [update.status] : []),
    },
  ],
};

interface AzureUpdatesPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function AzureUpdatesEmbeddedPage({ searchParams }: AzureUpdatesPageProps) {
  const params = parseListParams(await searchParams, FACET_KEYS);
  const updates = await getAzureUpdateSummaries();
  const result = queryList(updates, params, listConfig);

  return (
    <UpdatesExplorer
      title="Azure Release Plans"
      description="Stay informed about the latest Azure updates and changes."
      basePath={BASE_PATH}
      params={params}
      result={result}
      renderItem={update => (
        <li key={update.id} className="min-w-0">
          <AzureUpdateCard update={update} />
        </li>
      )}
    />
  );
}
