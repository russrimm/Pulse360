'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { LoadingSpinner } from './LoadingSpinner';
import { getAzureHealthData } from '@/lib/azureHealth';
import { AzureServiceHealth } from '@/lib/types';
import type { Icon as LeafletIcon } from 'leaflet';

// Dynamically import Leaflet components with no SSR
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
);

// Dynamically import the entire map component
const MapComponent = dynamic(
  () => import('./MapComponent'),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner />
      </div>
    )
  }
);

// Fix for default marker icons in Leaflet with Next.js
let customIcon: LeafletIcon;
if (typeof window !== 'undefined') {
  const L = require('leaflet');
  customIcon = new L.Icon({
    iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
    iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
    shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });
}

const getRegionCoordinates = (regionName: string): [number, number] => {
  const coordinates: Record<string, [number, number]> = {
    'East US': [37.0902, -95.7129],
    'West US': [37.0902, -122.4194],
    'Central US': [41.8781, -93.0977],
    'North Central US': [44.9778, -93.2650],
    'South Central US': [29.7604, -95.3698],
    'West US 2': [47.6062, -122.3321],
    'West US 3': [33.4484, -112.0740],
    'East US 2': [38.9072, -77.0369],
    'East Asia': [22.3193, 114.1694],
    'Southeast Asia': [1.3521, 103.8198],
    'Australia East': [-33.8688, 151.2093],
    'Australia Southeast': [-37.8136, 144.9631],
    'Japan East': [35.6762, 139.6503],
    'Japan West': [34.3853, 132.4553],
    'Korea Central': [37.5665, 126.9780],
    'North Europe': [59.3293, 18.0686],
    'West Europe': [52.3676, 4.9041],
    'France Central': [48.8566, 2.3522],
    'UK South': [51.5074, -0.1278],
    'Germany West Central': [50.1109, 8.6821],
    'Switzerland North': [47.3769, 8.5417],
    'UAE North': [25.2048, 55.2708],
    'South Africa North': [-33.9249, 18.4241],
    'Brazil South': [-23.5505, -46.6333],
    'Canada Central': [43.6532, -79.3832],
    'Canada East': [45.5017, -73.5673],
  };

  return coordinates[regionName] || [0, 0];
};

// Wrapper component for the map to prevent double initialization
function MapWrapper({ regions }: { regions: AzureServiceHealth[] }) {
  return (
    <MapContainer 
      center={[20, 0]} 
      zoom={2} 
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {regions.map((region) => {
        const coordinates = getRegionCoordinates(region.name);
        return (
          <Marker
            key={region.id}
            position={coordinates}
            icon={customIcon}
          >
            <Popup>
              <div className="p-2">
                <h3 className="font-semibold">{region.name}</h3>
                <p className={`text-sm ${
                  region.status === 'healthy' ? 'text-green-500' :
                  region.status === 'degraded' ? 'text-yellow-500' :
                  'text-red-500'
                }`}>
                  Status: {region.status}
                </p>
                {region.services.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm font-semibold">Services:</p>
                    <ul className="text-sm">
                      {region.services.map((service) => (
                        <li key={service.id} className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${
                            service.status === 'healthy' ? 'bg-green-500' :
                            service.status === 'degraded' ? 'bg-yellow-500' :
                            'bg-red-500'
                          }`} />
                          {service.name}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}

export function AzureHealthContent() {
  const [regions, setRegions] = useState<AzureServiceHealth[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mapKey, setMapKey] = useState(0);

  useEffect(() => {
    const fetchHealthData = async () => {
      try {
        const res = await fetch('/api/azure-health');
        const data = await res.json();
        
        if (!res.ok) {
          console.error('API error response:', data);
          throw new Error(data.details || data.error || `HTTP error! status: ${res.status}`);
        }

        if (!Array.isArray(data)) {
          console.error('Invalid data format:', data);
          throw new Error('Invalid data format received from API');
        }

        setRegions(data);
        setMapKey(prev => prev + 1); // Force remount of map component
      } catch (err) {
        console.error('Error fetching health data:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch health data');
        setRegions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchHealthData();
    const interval = setInterval(fetchHealthData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500 dark:text-red-400 p-4">
        <p className="font-semibold">Error loading Azure health data</p>
        <p className="text-sm mt-2">{error}</p>
      </div>
    );
  }

  if (!regions || regions.length === 0) {
    return (
      <div className="text-center text-gray-500 dark:text-gray-400 p-4">
        <p>No health data available</p>
        <p className="text-sm mt-2">Please check your Azure credentials and permissions</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Azure Service Health
        </h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">Healthy</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">Degraded</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">Unhealthy</span>
          </div>
        </div>
      </div>

      <div className="relative w-full h-[500px] bg-slate-50 rounded-lg overflow-hidden">
        <MapComponent key={mapKey} regions={regions} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {regions.map((region) => (
          <div
            key={region.id}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {region.name}
              </h3>
              <div
                className={`w-3 h-3 rounded-full ${
                  region.status === 'healthy'
                    ? 'bg-green-500'
                    : region.status === 'degraded'
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
                }`}
              />
            </div>
            <div className="space-y-2">
              {region.services.map((service) => (
                <div
                  key={service.id}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-gray-600 dark:text-gray-400">
                    {service.name}
                  </span>
                  <div
                    className={`w-2 h-2 rounded-full ${
                      service.status === 'healthy'
                        ? 'bg-green-500'
                        : service.status === 'degraded'
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                    }`}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 