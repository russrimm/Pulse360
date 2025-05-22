'use client';

import { useState, useEffect } from 'react';
import { AzureServiceHealth } from '@/lib/types';
import { LoadingSpinner } from '@/components/LoadingSpinner';

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'healthy':
      return 'bg-green-500';
    case 'degraded':
      return 'bg-yellow-500';
    case 'unhealthy':
      return 'bg-red-500';
    default:
      return 'bg-gray-500';
  }
};

const getStatusText = (status: string) => {
  switch (status.toLowerCase()) {
    case 'healthy':
      return 'Healthy';
    case 'degraded':
      return 'Degraded';
    case 'unhealthy':
      return 'Unhealthy';
    default:
      return 'Unknown';
  }
};

export default function AzureHealthPage() {
  const [regions, setRegions] = useState<AzureServiceHealth[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHealthData = async () => {
      try {
        const res = await fetch('/api/azure-health');
        const data = await res.json();
        
        if (!res.ok) {
          throw new Error(data.details || data.error || `HTTP error! status: ${res.status}`);
        }

        if (!Array.isArray(data)) {
          throw new Error('Invalid data format received from API');
        }

        setRegions(data);
      } catch (err) {
        console.error('Error fetching health data:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch health data');
      } finally {
        setLoading(false);
      }
    };

    fetchHealthData();
    const interval = setInterval(fetchHealthData, 5 * 60 * 1000); // Refresh every 5 minutes
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500 p-4">
        <p className="font-semibold">Error loading Azure health data</p>
        <p className="text-sm mt-2">{error}</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
        {regions.map((region) => (
          <div
            key={region.id}
            className="bg-white rounded shadow-sm border border-gray-200"
          >
            <div className="p-2">
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-xs font-medium text-gray-900 truncate">
                  {region.name}
                </h2>
                <div className={`w-2 h-2 rounded-full ${getStatusColor(region.status)} ml-1 flex-shrink-0`} />
              </div>
              
              <div className="space-y-1">
                {region.services.map((service) => (
                  <div
                    key={service.id}
                    className="flex items-center justify-between text-xs"
                  >
                    <span className="text-gray-600 truncate">
                      {service.name}
                    </span>
                    <div className="flex items-center gap-1 ml-1">
                      <div className={`w-1.5 h-1.5 rounded-full ${getStatusColor(service.status)} flex-shrink-0`} />
                      <span className="text-gray-500 text-[10px] flex-shrink-0">
                        {getStatusText(service.status)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 