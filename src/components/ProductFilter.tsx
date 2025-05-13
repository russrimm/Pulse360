'use client';

import { useState, useEffect } from 'react';

interface ProductFilterProps {
  services: string[];
  onFilterChange: (selectedService: string | null) => void;
}

export function ProductFilter({ services, onFilterChange }: ProductFilterProps) {
  const [selectedService, setSelectedService] = useState<string | null>(null);

  const handleChange = (service: string | null) => {
    setSelectedService(service);
    onFilterChange(service);
  };

  return (
    <div className="mb-6">
      <label htmlFor="service-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Filter by Product
      </label>
      <select
        id="service-filter"
        value={selectedService || ''}
        onChange={(e) => handleChange(e.target.value || null)}
        className="block w-auto min-w-[200px] rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
      >
        <option value="">All Products</option>
        {services.map((service) => (
          <option key={service} value={service}>
            {service}
          </option>
        ))}
      </select>
    </div>
  );
} 