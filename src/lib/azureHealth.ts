import { Client } from '@microsoft/microsoft-graph-client';
import { getGraphClient } from './auth';
import { AzureServiceHealth } from './types';

export async function getAzureHealthData(): Promise<AzureServiceHealth[]> {
  try {
    console.log('Initializing Graph client...');
    const client = await getGraphClient();
    console.log('Graph client initialized');

    console.log('Fetching health data...');
    const response = await client
      .api('/admin/serviceAnnouncement/healthOverviews')
      .get();
    
    console.log('Raw API response:', response);

    if (!response || !response.value) {
      console.error('Invalid response format:', response);
      return [];
    }

    console.log('Mapping health data...');
    const healthData = response.value.map((item: any) => ({
      id: item.id,
      name: item.service,
      status: mapHealthStatus(item.status),
      services: item.issues?.map((issue: any) => ({
        id: issue.id,
        name: issue.title,
        status: mapHealthStatus(issue.status)
      })) || []
    }));

    console.log('Mapped health data:', healthData);
    return healthData;
  } catch (error) {
    console.error('Error in getAzureHealthData:', error);
    throw error;
  }
}

function mapHealthStatus(status: string): 'healthy' | 'degraded' | 'unhealthy' {
  switch (status?.toLowerCase()) {
    case 'serviceoperational':
      return 'healthy';
    case 'investigating':
    case 'serviceinterruption':
      return 'degraded';
    default:
      return 'unhealthy';
  }
}

export interface AzureServiceHealth {
  id: string;
  name: string;
  status: string;
  services: Array<{
    id: string;
    name: string;
    status: string;
  }>;
} 