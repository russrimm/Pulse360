import { FabricRoadmapContent } from '@/components/FabricRoadmapContent';
import Image from 'next/image';
import { getFabricRoadmaps, type FabricRoadmapItem } from '@/lib/fabricApi';

function mapToReleasePlan(item: FabricRoadmapItem) {
  return {
    id: item.ReleaseItemID,
    title: item.FeatureName,
    content: item.FeatureDescription,
    product: item.ProductName,
    investmentArea: '',
    businessValue: item.FeatureDescription,
    enabledFor: '',
    publicPreviewDate: item.ReleaseDate,
    gaDate: item.ReleaseDate,
    publicPreviewWave: item.ReleaseType,
    gaWave: item.ReleaseType,
    published: item.ReleaseDate,
    lastUpdated: item.ReleaseDate,
    tags: [item.ReleaseType, item.ReleaseStatus].filter(Boolean),
    service: [item.ProductName].filter(Boolean),
  };
}

export const metadata = { title: 'Microsoft Fabric Roadmap | Pulse 360', description: 'Browse upcoming and shipped features from the Microsoft Fabric public roadmap.' };

export default async function FabricReleasePlansPage() {
  const fabricProductId = '796a0af7-2dc7-ee11-9079-000d3a3419a8';
  const dataEngineeringProductId = 'a731518f-36ca-ee11-9079-000d3a341a60';
  const dataFactoryProductId = 'a821f83f-dbd6-ee11-9079-000d3a310f67';
  const dataScienceProductId = '0522b590-dcd6-ee11-9079-000d3a310f67';
  const dataWarehouseProductId = 'fa3a73cd-dcd6-ee11-9079-000d3a310f67';
  const oneLakeProductId = '338c69fe-dcd6-ee11-9079-000d3a310f67';
  const powerBiProductId = '642a8375-05fc-ee11-a1ff-000d3a341a60';
  const fabricDevExpProductId = 'c6da6b3b-ded6-ee11-9079-000d3a310f67';
  const realTimeIntelligenceProductId = '58cb90aa-4203-ef11-a1fd-000d3a36eea4';
  const sqlDatabaseProductId = '347da228-ea54-ef11-a317-0022480a694f';
  const adminGovSecProductId = 'b6e2a7e2-2dc7-ee11-9079-000d3a3419a8';

  const { items, failedProductIds } = await getFabricRoadmaps([
    fabricProductId,
    dataEngineeringProductId,
    dataFactoryProductId,
    dataScienceProductId,
    dataWarehouseProductId,
    oneLakeProductId,
    powerBiProductId,
    fabricDevExpProductId,
    realTimeIntelligenceProductId,
    sqlDatabaseProductId,
    adminGovSecProductId,
  ]);
  const allPlans = items.map(mapToReleasePlan);

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col items-center justify-center mb-8 gap-4">
          <Image src="/icons/fabric_48_color.svg" alt="Fabric" width={48} height={48} className="w-12 h-12 mb-2" loading="lazy" />
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Microsoft Fabric Roadmap</h1>
            <p className="text-gray-600 dark:text-gray-400">Browse upcoming and shipped features from the Microsoft Fabric public roadmap.</p>
          </div>
        </div>
        {failedProductIds.length > 0 && (
          <p
            role="status"
            className="mb-6 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200"
          >
            Some Fabric roadmap product areas are temporarily unavailable. Showing data from the
            remaining sources.
          </p>
        )}
        <FabricRoadmapContent allPlans={allPlans} />
      </div>
    </div>
  );
}
