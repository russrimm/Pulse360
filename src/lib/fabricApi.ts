export interface FabricRoadmapItem {
  ReleaseItemID: string;
  FeatureName: string;
  FeatureDescription: string;
  ReleaseDate: string;
  ReleaseType: string;
  ReleaseStatus: string;
  ProductName: string;
}

export interface FabricRoadmapBatch {
  items: FabricRoadmapItem[];
  failedProductIds: string[];
}

const FABRIC_API_BASE = 'https://releaseplanner.azure-api.net/fabric/fabric-json/?productId=';

export async function getFabricRoadmap(productId: string): Promise<FabricRoadmapItem[]> {
  const res = await fetch(`${FABRIC_API_BASE}${productId}`, {
    next: { revalidate: 3600 },
  });
  if (!res.ok) {
    throw new Error(`Fabric roadmap request failed with status ${res.status}`);
  }

  return parseFabricRoadmapPayload(await res.text());
}

export async function getFabricRoadmaps(productIds: string[]): Promise<FabricRoadmapBatch> {
  const results = await Promise.allSettled(productIds.map(getFabricRoadmap));
  const failedProductIds: string[] = [];
  const items: FabricRoadmapItem[] = [];

  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      items.push(...result.value);
      return;
    }

    const productId = productIds[index];
    failedProductIds.push(productId);
    console.error(`Fabric roadmap request failed for product ${productId}:`, result.reason);
  });

  if (failedProductIds.length === productIds.length) {
    throw new AggregateError(
      results
        .filter((result): result is PromiseRejectedResult => result.status === 'rejected')
        .map(result => result.reason),
      'All Fabric roadmap requests failed'
    );
  }

  return { items, failedProductIds };
}

export function parseFabricRoadmapPayload(payload: string): FabricRoadmapItem[] {
  let data: unknown;
  try {
    data = JSON.parse(payload);
  } catch (error) {
    try {
      data = JSON.parse(repairInvalidJsonStringEscapes(payload));
    } catch {
      throw new Error('Fabric roadmap returned malformed JSON', { cause: error });
    }
  }

  if (!isFabricRoadmapResponse(data)) {
    throw new Error('Fabric roadmap returned an invalid response');
  }

  return data.results;
}

function isFabricRoadmapResponse(value: unknown): value is { results: FabricRoadmapItem[] } {
  return (
    typeof value === 'object' &&
    value !== null &&
    'results' in value &&
    Array.isArray(value.results)
  );
}

function repairInvalidJsonStringEscapes(payload: string): string {
  let repaired = '';
  let isInsideString = false;

  for (let index = 0; index < payload.length; index++) {
    const character = payload[index];

    if (!isInsideString) {
      repaired += character;
      if (character === '"') isInsideString = true;
      continue;
    }

    if (character === '\\') {
      const nextCharacter = payload[index + 1];
      const isValidSimpleEscape = Boolean(nextCharacter && '"\\/bfnrt'.includes(nextCharacter));
      const isValidUnicodeEscape =
        nextCharacter === 'u' && /^[0-9a-fA-F]{4}$/.test(payload.slice(index + 2, index + 6));

      if (isValidUnicodeEscape) {
        repaired += payload.slice(index, index + 6);
        index += 5;
      } else if (isValidSimpleEscape) {
        repaired += character + nextCharacter;
        index++;
      }
      continue;
    }

    if (character === '"') {
      repaired += character;
      isInsideString = false;
      continue;
    }

    const characterCode = character.charCodeAt(0);
    repaired +=
      characterCode <= 0x1f ? `\\u${characterCode.toString(16).padStart(4, '0')}` : character;
  }

  return repaired;
}
