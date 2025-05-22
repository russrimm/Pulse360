'use client';

import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { AzureServiceHealth } from '@/lib/types';

// Fix for default marker icons in Leaflet with Next.js
let customIcon: any;
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

interface MapComponentProps {
  regions: AzureServiceHealth[];
}

// Create a wrapper component that will handle the map lifecycle
const MapWrapper = ({ regions }: MapComponentProps) => {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const containerId = useRef(`map-${Math.random().toString(36).substr(2, 9)}`);

  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, []);

  return (
    <div className="w-full h-full min-h-[400px]">
      <div 
        id={containerId.current}
        ref={containerRef}
        className="w-full h-full"
      >
        <MapContainer 
          center={[20, 0]} 
          zoom={2} 
          style={{ width: '100%', height: '100%' }}
          ref={mapRef}
          container={containerId.current}
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
                <Popup maxWidth={150} minWidth={100}>
                  <div className="p-0.5 text-[10px]">
                    <h3 className="font-semibold text-[11px]">{region.name}</h3>
                    <p className={`text-[10px] ${
                      region.status === 'healthy' ? 'text-green-500' :
                      region.status === 'degraded' ? 'text-yellow-500' :
                      'text-red-500'
                    }`}>
                      Status: {region.status}
                    </p>
                    {region.services.length > 0 && (
                      <div className="mt-0.5">
                        <p className="text-[10px] font-semibold">Services:</p>
                        <ul className="text-[10px]">
                          {region.services.map((service) => (
                            <li key={service.id} className="flex items-center gap-0.5">
                              <span className={`w-1 h-1 rounded-full ${
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
      </div>
    </div>
  );
};

// Export the wrapper component
export default MapWrapper; 