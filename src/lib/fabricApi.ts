export interface FabricRoadmapItem {
  ReleaseItemID: string
  FeatureName: string
  FeatureDescription: string
  ReleaseDate: string
  ReleaseType: string
  ReleaseStatus: string
  ProductName: string
}

const FABRIC_API_BASE = 'https://releaseplanner.azure-api.net/fabric/fabric-json/?productId='

export async function getFabricRoadmap(productId: string): Promise<FabricRoadmapItem[]> {
  const res = await fetch(`${FABRIC_API_BASE}${productId}`, { cache: 'no-store' })
  const text = await res.text()
  try {
    const data = JSON.parse(text)
    return data.results
  } catch (e) {
    // Not valid JSON, probably an error page or empty
    return []
  }
} 