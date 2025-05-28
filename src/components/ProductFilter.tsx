'use client';

import { useState, useRef, useEffect, useMemo, useCallback } from 'react';

interface ProductFilterProps {
  services: string[];
  selectedServices: string[];
  onFilterChange: (services: string[]) => void;
}

// Map of service names to their icons
const serviceIconMap: Record<string, string> = {
  'Power Apps': '/icons/PowerApps_scalable.svg',
  'Power Automate': '/icons/PowerAutomate_scalable.svg',
  'Microsoft Power Automate': '/icons/PowerAutomate_scalable.svg',
  'Power Platform': '/icons/PowerPlatform_scalable.svg',
  'Power Platform Governance and Administration': '/icons/PowerPlatform_scalable.svg',
  'Power Pages': '/icons/PowerPages_scalable.svg',
  'Microsoft Dataverse': '/icons/Dataverse_scalable.svg',
  'Power BI': '/icons/PowerBI_scalable.svg',
  'Microsoft Teams': '/icons/teams.svg',
  'SharePoint Online': '/icons/sharepoint.svg',
  'Microsoft 365': '/icons/m365.svg',
  'Microsoft 365 Apps': '/icons/m365.svg',
  'Microsoft 365 for Business': '/icons/m365.svg',
  'Microsoft 365 for Enterprise': '/icons/m365.svg',
  'Microsoft 365 for Education': '/icons/m365.svg',
  'Microsoft 365 for Government': '/icons/m365.svg',
  'OneDrive for Business': '/icons/onedrive.svg',
  'Microsoft OneDrive': '/icons/onedrive.svg',
  'Microsoft Stream': '/icons/stream.svg',
  'Exchange Online': '/icons/exchange.svg',
  'Microsoft Forms': '/icons/forms.svg',
  'Microsoft Intune': '/icons/intune.svg',
  'Planner': '/icons/planner.svg',
  'Microsoft Entra': '/icons/entra.svg',
  'Microsoft Bookings': '/icons/Bookings.svg',
  'Excel': '/icons/Excel.svg',
  'Exchange': '/icons/exchange.svg',
  'Forms': '/icons/forms.svg',
  'Bookings': '/icons/Bookings.svg',
  'Access': '/icons/Access.svg',
  'Azure Information Protection': '/icons/azure/security/10229-icon-service-Azure-Information-Protection.svg',
  'Dynamics 365 Apps': '/icons/Dynamics365_scalable.svg',
  'Dynamics 365 Sales': '/icons/Sales_scalable.svg',
  'Dynamics 365 Marketing': '/icons/Marketing_scalable.svg',
  'Dynamics 365 Customer Service': '/icons/CustomerService_scalable.svg',
  'Dynamics 365 Field Service': '/icons/FieldService_scalable.svg',
  'Dynamics 365 Finance': '/icons/Finance_scalable.svg',
  'Dynamics 365 Supply Chain Management': '/icons/SupplyChainManagement_scalable.svg',
  'Dynamics 365 Project Operations': '/icons/ProjectOperations_scalable.svg',
  'Dynamics 365 Business Central': '/icons/BusinessCentral_scalable.svg',
  'Dynamics 365 Commerce': '/icons/Commerce_scalable.svg',
  'Dynamics 365 Customer Insights': '/icons/CustomerInsights_scalable.svg',
  'Dynamics 365 Customer Voice': '/icons/CustomerVoice_scalable.svg',
  'Dynamics 365 Fraud Protection': '/icons/FraudProtection_scalable.svg',
  'Dynamics 365 Human Resources': '/icons/CoreHR_scalable.svg',
  'Dynamics 365 Intelligent Order Management': '/icons/IntelligentOrderManagement_scalable (1).svg',
  'Dynamics 365 Project Service Automation': '/icons/ProjectServiceAutomation_scalable.svg',
  'Dynamics 365 Sales Insights': '/icons/SalesInsights_scalable.svg',
  'Dynamics 365 Customer Service Insights': '/icons/CustomerServiceInsights_scalable.svg',
  'Dynamics 365 Market Insights': '/icons/MarketInsights_scalable.svg',
  'Dynamics 365 Product Insights': '/icons/Product_Insights__scalable.svg',
  'Dynamics 365 Sustainability Calculator': '/icons/SustainabilityCalculator_scalable.svg',
  'Dynamics 365 Talent': '/icons/Talent_scalable.svg',
  'Dynamics 365 Talent Attract': '/icons/TalentAttract_scalable.svg',
  'Dynamics 365 Talent Onboard': '/icons/TalentOnboard_scalable.svg',
  'Dynamics 365 Contact Center': '/icons/ContactCenter_scalable.svg',
  'Microsoft Viva': '/icons/viva.svg',
  'Microsoft Purview': '/icons/purview.svg',
  'Microsoft Defender XDR': '/icons/defender.svg',
  'Windows': '/icons/Windows.svg',
  'Windows 365': '/icons/Windows.svg',
  'Microsoft Power Automate in Microsoft 365': '/icons/PowerAutomate_scalable.svg',
  'Power Apps in Microsoft 365': '/icons/PowerApps_scalable.svg',
  'Microsoft Copilot Studio': '/icons/CopilotStudio_scalable.svg',
  'AI Builder': '/icons/AIBuilder_scalable.svg',
  'OneDrive': '/icons/onedrive.svg',
  'Outlook': '/icons/Outlook.svg',
  'OneNote': '/icons/OneNote.svg',
  'PowerApps': '/icons/PowerApps_scalable.svg',
  'PowerPoint': '/icons/PowerPoint.svg',
  'SharePoint': '/icons/sharepoint.svg',
  'Visio': '/icons/Visio.svg',
  'Word': '/icons/Word.svg',
  'Microsoft Project': '/icons/Project.svg',
  'Microsoft Purview compliance portal': '/icons/purview.svg',
  'Microsoft Edge': '/icons/edge.svg',
  'Microsoft Defender for Office 365': '/icons/defender.svg',
  'Microsoft Defender for Cloud Apps': '/icons/defender.svg',
  'Microsoft Clipchamp': '/icons/clipchamp.svg',
  'Microsoft Copilot (Microsoft 365)': '/icons/copilot.svg',
  'Microsoft 365 Copilot App': '/icons/copilot.svg',
};

// Storage key for persisting filter settings
const STORAGE_KEY = 'message-center-filters';

// Get icon for a service, using m365.svg for any 'Microsoft 365' prefix
function getServiceIcon(service: string): string | undefined {
  if (service.startsWith('Microsoft 365')) return '/icons/m365.svg'
  return serviceIconMap[service]
}

export function ProductFilter({ services, selectedServices, onFilterChange }: ProductFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Log services for debugging
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      console.log('Available services:', services)
      console.log('Service icon mapping:', serviceIconMap)
    }
  }, [services])

  // Memoize selection check
  const isServiceSelected = useCallback(
    (service: string): boolean =>
      selectedServices.some(
        s => s.trim().toLowerCase() === service.trim().toLowerCase()
      ),
    [selectedServices]
  );

  // Memoize toggle function
  const toggleService = useCallback((service: string) => {
    if (isServiceSelected(service)) {
      // Remove the service
      const newSelection = selectedServices.filter(
        s => s.trim().toLowerCase() !== service.trim().toLowerCase()
      );
      onFilterChange(newSelection);
    } else {
      onFilterChange([...selectedServices, service]);
    }
  }, [selectedServices, onFilterChange, isServiceSelected]);

  // Clear all function
  const handleClearAll = useCallback(() => {
    onFilterChange([]);
    setIsOpen(false);
  }, [onFilterChange]);

  // Memoize sorted services
  const sortedServices = useMemo(() => 
    [...services].sort(),
    [services]
  );

  // Memoize click outside handler
  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
      setIsOpen(false);
    }
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!isOpen) return;
    
    if (event.key === 'Escape') {
      setIsOpen(false);
    } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const options = Array.from(document.querySelectorAll('[role="option"]'));
      const currentIndex = options.findIndex(option => option === document.activeElement);
      const nextIndex = event.key === 'ArrowDown' 
        ? Math.min(currentIndex + 1, options.length - 1)
        : Math.max(currentIndex - 1, 0);
      (options[nextIndex] as HTMLElement)?.focus();
    } else if (event.key === 'Enter' && document.activeElement?.getAttribute('role') === 'option') {
      const service = document.activeElement.getAttribute('data-service');
      if (service) {
        toggleService(service);
      }
    }
  }, [isOpen, toggleService]);

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleClickOutside, handleKeyDown]);

  // Load saved filters on mount
  useEffect(() => {
    try {
      const savedFilters = localStorage.getItem(STORAGE_KEY);
      if (savedFilters) {
        const parsedFilters = JSON.parse(savedFilters);
        // Only apply saved filters if they exist in current services
        const validFilters = parsedFilters.filter((filter: string) => 
          services.includes(filter)
        );
        if (
          validFilters.length > 0 &&
          selectedServices.length === 0
        ) {
          onFilterChange(validFilters);
        }
      }
    } catch (error) {
      console.error('Error loading saved filters:', error);
    }
  }, []);

  // Save filters with debounce
  useEffect(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      try {
        if (selectedServices.length > 0) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(selectedServices));
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      } catch (error) {
        console.error('Error saving filters:', error);
      }
    }, 300); // 300ms debounce

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [selectedServices]);

  // Memoize filtered services
  const filteredServices = useMemo(() => 
    sortedServices.filter(service => 
      service.toLowerCase().includes(searchQuery.toLowerCase())
    ),
    [sortedServices, searchQuery]
  );

  return (
    <div className="relative inline-block w-full md:w-auto" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center gap-2 px-4 h-8 text-gray-700 dark:text-gray-200 bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200 dark:border-gray-700/50 rounded-lg shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)] dark:shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)] hover:shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)] dark:hover:shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] hover:border-primary-200 dark:hover:border-primary-800 hover:shadow-[0_0_0_1px_rgba(59,130,246,0.5)] dark:hover:shadow-[0_0_0_1px_rgba(59,130,246,0.5)] transition-all duration-300 relative w-full md:w-auto min-h-[32px]"
        aria-label="Filter products"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
          />
        </svg>
        <span className="text-sm font-medium">Products</span>
        {selectedServices.length > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 text-xs font-medium text-white bg-primary-600 rounded-full">
            {selectedServices.length}
          </span>
        )}
      </button>

      {isOpen && (
        <div 
          className="absolute z-10 w-72 mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg"
          role="dialog"
          aria-label="Product filter options"
        >
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">Filter Products</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {selectedServices.length} product{selectedServices.length !== 1 ? 's' : ''} selected
            </p>
            <div className="mt-2">
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
          <div className="max-h-60 overflow-y-auto p-2" role="listbox">
            {filteredServices.map((service) => {
              const iconSrc = getServiceIcon(service)
                || (service === 'Microsoft Power Automate' ? '/icons/PowerAutomate_scalable.svg'
                : service.startsWith('Dynamics 365 Customer Insights') ? '/icons/CustomerInsights_scalable.svg'
                : undefined);
              return (
                <label
                  key={service}
                  className="flex items-center px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500"
                  role="option"
                >
                  <input
                    type="checkbox"
                    checked={isServiceSelected(service)}
                    onChange={() => toggleService(service)}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-200 flex items-center gap-2">
                    {iconSrc && (
                      <img 
                        src={iconSrc} 
                        alt={`${service} icon`}
                        className="w-4 h-4 object-contain"
                        width={16}
                        height={16}
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    )}
                    {service}
                  </span>
                </label>
              );
            })}
          </div>
          <div className="p-3 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleClearAll}
              className="w-full px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              Clear all
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 