import { ReleasePlansContent } from '@/components/ReleasePlansContent'
import Link from 'next/link'
import { FabricRoadmapContent } from '@/components/FabricRoadmapContent'
import Image from 'next/image';

interface FabricRoadmapItem {
  ReleaseItemID: string
  FeatureName: string
  FeatureDescription: string
  ReleaseDate: string
  ReleaseType: string
  ReleaseStatus: string
  ProductName: string
}

const FABRIC_API_BASE = 'https://releaseplanner.azure-api.net/fabric/fabric-json/?productId='
async function getFabricRoadmap(productId: string): Promise<FabricRoadmapItem[]> {
  const res = await fetch(`${FABRIC_API_BASE}${productId}`, { cache: 'no-store' })
  const text = await res.text()
  if (productId === 'fa3a73cd-dcd6-ee11-9079-000d3a310f67') {
    // console.log('Raw response for Data Warehouse:', text)
  }
  try {
    const data = JSON.parse(text)
    return data.results
  } catch (e) {
    // Not valid JSON, probably an error page or empty
    return []
  }
}

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
  }
}

export default async function FabricRoadmapPage() {
  const fabricProductId = '796a0af7-2dc7-ee11-9079-000d3a3419a8'
  const dataEngineeringProductId = 'a731518f-36ca-ee11-9079-000d3a341a60'
  const dataFactoryProductId = 'a821f83f-dbd6-ee11-9079-000d3a310f67'
  const dataScienceProductId = '0522b590-dcd6-ee11-9079-000d3a310f67'
  const dataWarehouseProductId = 'fa3a73cd-dcd6-ee11-9079-000d3a310f67'
  const oneLakeProductId = '338c69fe-dcd6-ee11-9079-000d3a310f67'
  const powerBiProductId = '642a8375-05fc-ee11-a1ff-000d3a341a60'
  const fabricDevExpProductId = 'c6da6b3b-ded6-ee11-9079-000d3a310f67'
  const realTimeIntelligenceProductId = '58cb90aa-4203-ef11-a1fd-000d3a36eea4'
  const sqlDatabaseProductId = '347da228-ea54-ef11-a317-0022480a694f'
  const adminGovSecProductId = 'b6e2a7e2-2dc7-ee11-9079-000d3a3419a8'
  const [roadmap, dataEngineeringRoadmap, dataFactoryRoadmap, dataScienceRoadmap, dataWarehouseRoadmap, oneLakeRoadmap, powerBiRoadmap, fabricDevExpRoadmap, realTimeIntelligenceRoadmap, sqlDatabaseRoadmap, adminGovSecRoadmap] = await Promise.all([
    getFabricRoadmap(fabricProductId),
    getFabricRoadmap(dataEngineeringProductId),
    getFabricRoadmap(dataFactoryProductId),
    getFabricRoadmap(dataScienceProductId),
    getFabricRoadmap(dataWarehouseProductId),
    getFabricRoadmap(oneLakeProductId),
    getFabricRoadmap(powerBiProductId),
    getFabricRoadmap(fabricDevExpProductId),
    getFabricRoadmap(realTimeIntelligenceProductId),
    getFabricRoadmap(sqlDatabaseProductId),
    getFabricRoadmap(adminGovSecProductId)
  ])
  // console.log('Fetched dataEngineeringRoadmap', dataEngineeringRoadmap)
  // console.log('Fetched dataFactoryRoadmap', dataFactoryRoadmap)
  // console.log('Fetched dataScienceRoadmap', dataScienceRoadmap)
  // console.log('Fetched dataWarehouseRoadmap', dataWarehouseRoadmap)
  const allPlans = [
    ...roadmap.map(mapToReleasePlan),
    ...dataEngineeringRoadmap.map(mapToReleasePlan),
    ...dataFactoryRoadmap.map(mapToReleasePlan),
    ...dataScienceRoadmap.map(mapToReleasePlan),
    ...dataWarehouseRoadmap.map(mapToReleasePlan),
    ...oneLakeRoadmap.map(mapToReleasePlan),
    ...powerBiRoadmap.map(mapToReleasePlan),
    ...fabricDevExpRoadmap.map(mapToReleasePlan),
    ...realTimeIntelligenceRoadmap.map(mapToReleasePlan),
    ...sqlDatabaseRoadmap.map(mapToReleasePlan),
    ...adminGovSecRoadmap.map(mapToReleasePlan),
  ]
  // console.log('Mapped dataEngineeringPlans', dataEngineeringRoadmap)
  // console.log('Mapped dataFactoryPlans', dataFactoryRoadmap)
  // console.log('Mapped dataSciencePlans', dataScienceRoadmap)
  // console.log('Mapped dataWarehousePlans', dataWarehouseRoadmap)

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col items-center justify-center mb-8 gap-4">
          <Image src="/icons/fabric_48_color.svg" alt="Fabric" width={48} height={48} className="w-12 h-12 mb-2" loading="lazy" />
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Microsoft Fabric Roadmap
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Browse upcoming and shipped features from the Microsoft Fabric public roadmap.
            </p>
          </div>
        </div>
        <FabricRoadmapContent allPlans={allPlans} />
      </div>
    </div>
  )
} 