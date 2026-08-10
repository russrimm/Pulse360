'use client';

import { SafeHtml } from '@/components/SafeHtml';
import Link from 'next/link';
import Image from 'next/image';
import { formatCalendarDate } from '@/lib/date';
import { SurfaceCard } from './SurfaceCard';
import { StatusChip } from './StatusChip';

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
  Windows: '/icons/Windows.svg',
  'Azure Databricks': '/icons/databricks.svg',
  'Microsoft Copilot Studio': '/icons/CopilotStudio_scalable.svg',
  'AI Builder': '/icons/AIBuilder_scalable.svg',
};

export const ReleasePlanCard: React.FC<ReleasePlanCardProps> = ({
  plan,
  onClick,
  drillthroughBasePath = '/release-plan',
}) => {
  const handleClick = () => {
    onClick(plan.id);
  };

  // Deduplicate and normalize services
  const uniqueServices = Array.from(new Set(plan.service));

  const kindTags = plan.tags.filter(tag => {
    const tagLower = tag.toLowerCase();
    return tagLower.includes('new feature') || tagLower.includes('update');
  });
  const impactTags = plan.tags.filter(tag => {
    const tagLower = tag.toLowerCase();
    return tagLower.includes('user impact') || tagLower.includes('admin impact');
  });

  // Map service names to their display names
  const getDisplayName = (service: string) => {
    if (
      service === 'Microsoft Power Platform governance and administration' ||
      service === 'Power Platform Governance and Administration'
    ) {
      return 'Power Platform Governance and Administration';
    }
    return service;
  };

  return (
    <Link href={`${drillthroughBasePath}/${plan.id}`} className="group block h-full min-w-0">
      <SurfaceCard interactive className="gap-2.5" onClick={handleClick}>
        {kindTags.length > 0 || impactTags.length > 0 ? (
          <div className="flex flex-wrap items-center gap-1.5">
            {kindTags.map(tag => (
              <StatusChip key={tag} tone="ok">
                {tag}
              </StatusChip>
            ))}
            {impactTags.map(tag => (
              <StatusChip
                key={tag}
                tone={tag.toLowerCase().includes('user impact') ? 'warn' : 'critical'}
              >
                {tag}
              </StatusChip>
            ))}
          </div>
        ) : null}

        <h3 className="type-card-title line-clamp-3 break-words text-ink transition-colors group-hover:text-accent">
          {plan.title}
        </h3>

        {uniqueServices.length > 0 ? (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            {uniqueServices.slice(0, 3).map(service => {
              const iconPath = serviceIcons[service];
              const label = getDisplayName(service);
              return (
                <span
                  key={service}
                  title={label}
                  className="type-meta inline-flex min-w-0 items-center gap-1 text-ink-muted"
                >
                  {iconPath ? (
                    <Image
                      src={iconPath}
                      alt=""
                      width={14}
                      height={14}
                      className="h-3.5 w-3.5 shrink-0"
                    />
                  ) : null}
                  <span className="truncate">{label}</span>
                </span>
              );
            })}
          </div>
        ) : null}

        {plan.businessValue ? (
          <SafeHtml
            html={plan.businessValue}
            className="type-body-sm prose prose-sm dark:prose-invert line-clamp-3 max-w-none text-ink-muted"
          />
        ) : null}

        <p className="type-meta mt-auto pt-1 text-ink-subtle">
          {formatCalendarDate(plan.published) !== formatCalendarDate(plan.lastUpdated)
            ? `Updated ${formatCalendarDate(plan.lastUpdated)}`
            : `Published ${formatCalendarDate(plan.published)}`}
        </p>
      </SurfaceCard>
    </Link>
  );
};
