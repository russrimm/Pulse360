'use client';

import { format } from 'date-fns';
import { SafeHtml } from '@/components/SafeHtml';
import Link from 'next/link';
import Image from 'next/image';
import { SurfaceCard } from './SurfaceCard';
import { StatusChip, type ChipTone } from './StatusChip';

interface M365Update {
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

interface M365UpdateCardProps {
  update: M365Update;
  onClick: (id: string) => void;
}

const serviceIcons: Record<string, string> = {
  'Microsoft 365': '/icons/m365.svg',
  'Microsoft Teams': '/icons/teams.svg',
  'Microsoft Outlook': '/icons/Outlook.svg',
  'Microsoft Word': '/icons/Word.svg',
  'Microsoft Excel': '/icons/Excel.svg',
  'Microsoft PowerPoint': '/icons/PowerPoint.svg',
  'Microsoft OneNote': '/icons/OneNote.svg',
  'Microsoft OneDrive': '/icons/onedrive.svg',
  'Microsoft SharePoint': '/icons/sharepoint.svg',
  'Microsoft Viva': '/icons/viva.svg',
  'Microsoft Purview': '/icons/purview.svg',
  'Microsoft Entra ID': '/icons/entra.svg',
  'Microsoft Defender': '/icons/defender.svg',
  'Microsoft Intune': '/icons/intune.svg',
  'Microsoft Power Platform': '/icons/PowerPlatform_scalable.svg',
  'Microsoft Power Apps': '/icons/PowerApps_scalable.svg',
  'Microsoft Power Automate': '/icons/PowerAutomate_scalable.svg',
  'Microsoft Power BI': '/icons/PowerBI_scalable.svg',
  'Microsoft Power Pages': '/icons/PowerPages_scalable.svg',
  'Microsoft Dataverse': '/icons/Dataverse_scalable.svg',
  'Microsoft Clipchamp': '/icons/clipchamp.svg',
  'Microsoft Copilot (Microsoft 365)': '/icons/copilot.svg',
  'Microsoft 365 Copilot App': '/icons/copilot.svg',
  'Outlook': '/icons/Outlook.svg',
  'OneDrive': '/icons/onedrive.svg',
  'OneDrive for Business': '/icons/onedrive.svg',
  'SharePoint': '/icons/sharepoint.svg',
  'SharePoint Online': '/icons/sharepoint.svg',
  'Teams': '/icons/teams.svg',
  'Word': '/icons/Word.svg',
  'Excel': '/icons/Excel.svg',
  'PowerPoint': '/icons/PowerPoint.svg',
  'OneNote': '/icons/OneNote.svg',
  'Viva': '/icons/viva.svg',
  'Purview': '/icons/purview.svg',
  'Entra ID': '/icons/entra.svg',
  'Defender': '/icons/defender.svg',
  'Intune': '/icons/intune.svg',
  'Power Apps': '/icons/PowerApps_scalable.svg',
  'Power Automate': '/icons/PowerAutomate_scalable.svg',
  'Power BI': '/icons/PowerBI_scalable.svg',
  'Power Pages': '/icons/PowerPages_scalable.svg',
  'Dataverse': '/icons/Dataverse_scalable.svg',
  'Microsoft Purview compliance portal': '/icons/purview.svg',
  'Microsoft Edge': '/icons/edge.svg',
  'Windows 365': '/icons/Windows.svg',
  'Microsoft Defender for Office 365': '/icons/defender.svg',
  'Microsoft Defender for Cloud Apps': '/icons/defender.svg',
  'Microsoft Defender XDR': '/icons/defender.svg',
  'Windows': '/icons/Windows.svg',
  'Azure Databricks': '/icons/databricks.svg',
  'Exchange': '/icons/exchange.svg',
  'Microsoft Exchange': '/icons/exchange.svg',
};

const STATUS_TONES: Array<{ match: string; tone: ChipTone }> = [
  { match: 'launched', tone: 'ok' },
  { match: 'rolling out', tone: 'info' },
  { match: 'in development', tone: 'accent' },
  { match: 'cancelled', tone: 'critical' },
];

function statusTone(status: string): ChipTone {
  const lower = status.toLowerCase();
  return STATUS_TONES.find(entry => lower.includes(entry.match))?.tone ?? 'neutral';
}

export const M365UpdateCard: React.FC<M365UpdateCardProps> = ({ update, onClick }) => {
  // Deduplicate and normalize services
  const uniqueServices = Array.from(new Set(update.service));
  const isUpdated =
    format(new Date(update.published), 'yyyy-MM-dd') !==
    format(new Date(update.lastUpdated), 'yyyy-MM-dd');

  return (
    <Link href={`/m365-update/${update.id}`} className="group block h-full min-w-0">
      <SurfaceCard interactive className="gap-2.5" onClick={() => onClick(update.id)}>
        {update.status || update.generalAvailabilityDate ? (
          <div className="flex flex-wrap items-center gap-1.5">
            {update.status ? (
              <StatusChip tone={statusTone(update.status)}>{update.status}</StatusChip>
            ) : null}
            {update.generalAvailabilityDate ? (
              <StatusChip>
                GA {format(new Date(update.generalAvailabilityDate), 'MMM yyyy')}
              </StatusChip>
            ) : null}
          </div>
        ) : null}

        <h3 className="type-card-title line-clamp-3 break-words text-ink transition-colors group-hover:text-accent">
          {update.title}
        </h3>

        {uniqueServices.length > 0 ? (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            {uniqueServices.slice(0, 3).map(service => {
              const iconPath = serviceIcons[service];
              return (
                <span
                  key={service}
                  title={service}
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
                  <span className="truncate">{service}</span>
                </span>
              );
            })}
            {uniqueServices.length > 3 ? (
              <span className="type-meta text-ink-subtle">+{uniqueServices.length - 3} more</span>
            ) : null}
          </div>
        ) : null}

        <SafeHtml
          html={update.content}
          className="type-body-sm prose prose-sm dark:prose-invert line-clamp-3 max-w-none text-ink-muted"
        />

        <p className="type-meta mt-auto pt-1 text-ink-subtle">
          {isUpdated
            ? `Updated ${format(new Date(update.lastUpdated), 'MMM d, yyyy')}`
            : `Published ${format(new Date(update.published), 'MMM d, yyyy')}`}
        </p>
      </SurfaceCard>
    </Link>
  );
};