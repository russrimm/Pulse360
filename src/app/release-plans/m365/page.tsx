import { M365UpdateCard } from '@/components/M365UpdateCard';
import { UpdatesExplorer } from '@/components/UpdatesExplorer';
import { parseListParams, queryList, type ListQueryConfig } from '@/lib/list-query';
import { getRoadmapFamilies } from '@/lib/roadmap-families';
import type { M365Update } from '@/lib/types';
import { getM365UpdateSummaries } from '@/lib/update-summaries';

export const metadata = {
  title: 'AI at Work Roadmap | Pulse 360',
  description:
    'The Microsoft AI at Work roadmap (formerly the Microsoft 365 roadmap): upcoming and rolling-out features across Microsoft 365, Copilot, Dynamics 365, Power Platform, and Dataverse.',
};

const BASE_PATH = '/release-plans/m365';
const FACET_KEYS = ['family', 'product', 'status'];

const listConfig: ListQueryConfig<M365Update> = {
  pageSize: 12,
  getDate: update => update.published,
  getSearchText: update =>
    [update.id, update.title, update.product, ...update.service, ...update.tags].join(' '),
  facets: [
    { key: 'family', label: 'Product family', getValues: update => getRoadmapFamilies(update.service) },
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
      title="AI at Work Roadmap"
      description="Upcoming and rolling-out features across Microsoft 365, Copilot, Dynamics 365, Power Platform, and Dataverse."
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
