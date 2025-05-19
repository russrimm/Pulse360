export interface Message {
  id: string;
  title: string;
  service: string[];
  lastUpdated: string;
  published: string;
  tags: string[];
  content: string;
  summary: string;
  details: {
    name: string;
    value: string;
  }[];
  isMajorChange: boolean;
  actionRequiredByDateTime?: string;
  severity: string;
}

export interface MessageResponse {
  messages: Message[];
  total: number;
}

export interface AzureUpdate {
  id: string;
  title: string;
  description: string;
  productCategories: string[];
  tags: string[];
  products: string[];
  generalAvailabilityDate: string | null;
  previewAvailabilityDate: string | null;
  privatePreviewAvailabilityDate: string | null;
  status: string;
  created: string;
  modified: string;
}

export interface M365Update {
  id: string;
  title: string;
  content: string;
  product: string;
  status: string;
  published: string;
  lastUpdated: string;
  tags: string[];
  service: string[];
  generalAvailabilityDate: string;
  previewAvailabilityDate: string;
  cloudInstances: string[];
  platforms: string[];
  releaseRings: string[];
} 