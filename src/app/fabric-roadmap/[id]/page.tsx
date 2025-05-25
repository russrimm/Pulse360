import { notFound } from 'next/navigation'
import { ReleasePlanDetail } from '@/components/ReleasePlanDetail'
import { getFabricRoadmap } from '@/lib/fabricApi' // You may need to create this helper if not present

interface PageProps {
  params: Promise<{ id: string }>
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function FabricRoadmapDetailPage({ params }: PageProps) {
  const resolvedParams = await params
  // Fetch all productIds used in fabric-roadmap
  const productIds = [
    '796a0af7-2dc7-ee11-9079-000d3a3419a8', // Fabric
    'a731518f-36ca-ee11-9079-000d3a341a60', // Data Engineering
    'a821f83f-dbd6-ee11-9079-000d3a310f67', // Data Factory
    '0522b590-dcd6-ee11-9079-000d3a310f67', // Data Science
    'fa3a73cd-dcd6-ee11-9079-000d3a310f67', // Data Warehouse
    '338c69fe-dcd6-ee11-9079-000d3a310f67', // OneLake
    '642a8375-05fc-ee11-a1ff-000d3a341a60', // Power BI
    'c6da6b3b-ded6-ee11-9079-000d3a310f67', // Fabric Developer Experiences
    '58cb90aa-4203-ef11-a1fd-000d3a36eea4', // Real-Time Intelligence
    '347da228-ea54-ef11-a317-0022480a694f', // SQL Database
  ]

  // Fetch all plans from all productIds
  const allPlans = (
    await Promise.all(productIds.map(getFabricRoadmap))
  ).flat()

  const plan = allPlans.find(p => p.ReleaseItemID === resolvedParams.id)
  if (!plan) return notFound()

  // Map to ReleasePlanDetail shape if needed
  return (
    <div className="min-h-screen bg-gray-900 dark:bg-black">
      <ReleasePlanDetail plan={{
        id: plan.ReleaseItemID,
        title: plan.FeatureName,
        content: plan.FeatureDescription,
        product: plan.ProductName,
        investmentArea: '',
        businessValue: plan.FeatureDescription,
        enabledFor: '',
        publicPreviewDate: plan.ReleaseDate,
        gaDate: plan.ReleaseDate,
        publicPreviewWave: plan.ReleaseType,
        gaWave: plan.ReleaseType,
        published: plan.ReleaseDate,
        lastUpdated: plan.ReleaseDate,
        tags: [plan.ReleaseType, plan.ReleaseStatus].filter(Boolean),
        service: [plan.ProductName].filter(Boolean),
      }} />
    </div>
  )
} 