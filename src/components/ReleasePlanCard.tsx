'use client';

import { format } from 'date-fns';
import { SafeHtml } from '@/components/SafeHtml';
import Link from 'next/link';
import Image from 'next/image';

interface ReleasePlan {
  id: string;
  title: string;
  content: string;
  product: string;
  investmentArea: string;
  businessValue: string;
  enabledFor: string;
  publicPreviewDate: string;
  gaDate: string;
  publicPreviewWave: string;
  gaWave: string;
  published: string;
  lastUpdated: string;
  tags: string[];
  service: string[];
}

interface ReleasePlanCardProps {
  plan: ReleasePlan;
  onClick: (id: string) => void;
  drillthroughBasePath?: string;
}

// Map of service names to their icon paths
const serviceIcons: Record<string, string> = {
  'Power Apps': '/icons/PowerApps_scalable.svg',
  'Power Automate': '/icons/PowerAutomate_scalable.svg',
  'Microsoft Power Automate': '/icons/PowerAutomate_scalable.svg',
  'Power Platform': '/icons/PowerPlatform_scalable.svg',
  'Power Platform Governance and Administration': '/icons/PowerPlatform_scalable.svg',
  'Microsoft Power Platform governance and administration': '/icons/PowerPlatform_scalable.svg',
  'Power Pages': '/icons/PowerPages_scalable.svg',
  'Microsoft Dataverse': '/icons/Dataverse_scalable.svg',
  'Power BI': '/icons/PowerBI_scalable.svg',
  'Microsoft Teams': '/icons/teams.svg',
  'SharePoint Online': '/icons/sharepoint.svg',
  'Microsoft 365': '/icons/m365.svg',
  'OneDrive for Business': '/icons/onedrive.svg',
  'Microsoft Stream': '/icons/stream.svg',
  'Exchange Online': '/icons/exchange.svg',
  'Microsoft Forms': '/icons/forms.svg',
  'Microsoft Intune': '/icons/intune.svg',
  'Microsoft Planner': '/icons/planner.svg',
  'Microsoft Entra': '/icons/entra.svg',
  'Microsoft Bookings': '/icons/Bookings.svg',
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
  'Azure Databricks': '/icons/databricks.svg',
  'Microsoft Copilot Studio': '/icons/CopilotStudio_scalable.svg',
  'AI Builder': '/icons/AIBuilder_scalable.svg'
};

export const ReleasePlanCard: React.FC<ReleasePlanCardProps> = ({ plan, onClick, drillthroughBasePath = '/release-plan' }) => {
  const handleClick = () => {
    onClick(plan.id);
  };

  // Deduplicate and normalize services
  const uniqueServices = Array.from(new Set(plan.service));

  // Map service names to their display names
  const getDisplayName = (service: string) => {
    if (service === 'Microsoft Power Platform governance and administration' || 
        service === 'Power Platform Governance and Administration') {
      return 'Power Platform Governance and Administration';
    }
    return service;
  };

  return (
    <Link href={`${drillthroughBasePath}/${plan.id}`}>
      <div 
        className="group bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700/50 hover:border-primary-200 dark:hover:border-primary-800 hover:-translate-y-1 h-full cursor-pointer flex flex-col"
        onClick={handleClick}
      >
        <div className="flex flex-col">
          <div className="flex flex-col w-full bg-gradient-to-b from-gray-50 to-transparent dark:from-gray-900/50 dark:to-transparent py-3 px-4 gap-1">
            <div className="flex flex-wrap gap-2 justify-start w-full">
              {plan.tags.filter(tag => {
                const tagLower = tag.toLowerCase()
                return tagLower.includes('new feature') || tagLower.includes('update')
              }).map(tag => (
                <span
                  key={tag}
                  className="inline-flex items-center px-3 py-1.5 rounded-xl text-sm font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-200 border border-emerald-200/30 dark:border-emerald-700/20 min-w-[120px] justify-center"
                >
                  {tag}
                </span>
              ))}
            </div>
            <div className="flex flex-wrap gap-2 justify-end w-full">
              {plan.tags.filter(tag => {
                const tagLower = tag.toLowerCase()
                return tagLower.includes('user impact') || tagLower.includes('admin impact')
              }).map(tag => (
                <span
                  key={tag}
                  className={`inline-flex items-center px-3 py-1.5 rounded-xl text-sm font-medium ${tag.toLowerCase().includes('user impact') ? 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-200 border border-yellow-200/30 dark:border-yellow-700/20' : 'bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-200 border border-orange-200/30 dark:border-orange-700/20'} min-w-[120px] justify-center`}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-center text-[10px] text-gray-500 dark:text-gray-400 gap-1.5 py-1.5">
            <span className="font-medium">Published</span>
            <span>{format(new Date(plan.published), 'MMM d, yyyy')}</span>
            {format(new Date(plan.published), 'MMM d, yyyy') !== format(new Date(plan.lastUpdated), 'MMM d, yyyy') && (
              <>
                <span>•</span>
                <span className="font-medium">Updated</span>
                <span>{format(new Date(plan.lastUpdated), 'MMM d, yyyy')}</span>
              </>
            )}
          </div>
        </div>
        <div className="p-6 pt-4 flex flex-col flex-grow">
          <div className="flex flex-col flex-grow justify-start">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-base font-medium text-gray-900 dark:text-white group-hover:text-primary-700 dark:group-hover:text-primary-400 transition-colors tracking-tight text-center">{plan.title}</h3>
            </div>
            <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              <SafeHtml html={plan.businessValue} className="line-clamp-3 prose dark:prose-invert prose-sm max-w-none" />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}; 