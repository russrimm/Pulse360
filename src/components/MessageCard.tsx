import { format } from 'date-fns';
import Link from 'next/link';
import Image from 'next/image';
import { Message } from '@/lib/types';
import { decodeHtmlEntities } from '@/lib/feed/normalize';
import { SurfaceCard, type SurfaceTone } from './SurfaceCard';
import { StatusChip, type ChipTone } from './StatusChip';

interface MessageCardProps {
  message: Message;
}

// Map of service names to their icon paths
const serviceIcons: Record<string, string> = {
  'Power Apps': '/icons/PowerApps_scalable.svg',
  'Microsoft Power Automate': '/icons/PowerAutomate_scalable.svg',
  'Power Platform': '/icons/PowerPlatform_scalable.svg',
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
  Planner: '/icons/planner.svg',
  'Microsoft Entra': '/icons/entra.svg',
  'Microsoft Bookings': '/icons/Bookings.svg',
  'Dynamics 365 Apps': '/icons/Dynamics365_scalable.svg',
  'Microsoft Viva': '/icons/viva.svg',
  'Microsoft Purview': '/icons/purview.svg',
  'Microsoft Defender XDR': '/icons/defender.svg',
  Windows: '/icons/Windows.svg',
  'Microsoft Power Automate in Microsoft 365': '/icons/PowerAutomate_scalable.svg',
  'Power Apps in Microsoft 365': '/icons/PowerApps_scalable.svg',
  'Microsoft Defender for Cloud Apps': '/icons/defender.svg',
  'Microsoft Clipchamp': '/icons/clipchamp.svg',
  'Microsoft Copilot (Microsoft 365)': '/icons/copilot.svg',
  'Azure Databricks': '/icons/databricks.svg',
  'Microsoft Loop': '/icons/loop.svg',
};

/**
 * Plain-text excerpt for the card body. The value is rendered as a text node,
 * so React escapes it — stripping tags here is about readability, not safety.
 */
function toExcerpt(html: string): string {
  return decodeHtmlEntities(html.replace(/<[^>]*>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim();
}

function serviceIcon(service: string): string | undefined {
  return service.startsWith('Microsoft 365') ? '/icons/m365.svg' : serviceIcons[service];
}

interface StatusFlag {
  label: string;
  tone: ChipTone;
  title?: string;
}

function getStatusFlags(message: Message): StatusFlag[] {
  const flags: StatusFlag[] = [];
  const tags = message.tags.map(tag => tag.toLowerCase());

  if (message.isMajorChange) {
    flags.push({ label: 'Major change', tone: 'critical' });
  }
  if (message.severity && message.severity.toLowerCase() !== 'normal') {
    flags.push({ label: 'Critical', tone: 'critical', title: 'Critical alert' });
  }
  if (tags.some(tag => tag.includes('retirement'))) {
    flags.push({ label: 'Deprecation', tone: 'critical' });
  }
  if (message.status === 'expired') {
    flags.push({
      label: 'Expired',
      tone: 'warn',
      title: 'The action-required date on this message has passed.',
    });
  }
  if (message.status === 'archived') {
    flags.push({
      label: 'Archived',
      tone: 'neutral',
      title: "Removed from Microsoft's live feed but preserved here for reference.",
    });
  }
  if (tags.some(tag => tag.includes('new feature'))) {
    flags.push({ label: 'New', tone: 'ok' });
  }
  if (tags.some(tag => tag.includes('update'))) {
    flags.push({ label: 'Updated', tone: 'info' });
  }
  return flags;
}

function getCardTone(message: Message): SurfaceTone {
  if (message.isMajorChange) return 'critical';
  if (message.severity && message.severity.toLowerCase() !== 'normal') return 'critical';
  if (message.status === 'expired') return 'warn';
  if (message.status === 'archived') return 'neutral';
  if (message.tags.some(tag => tag.toLowerCase().includes('retirement'))) return 'critical';
  return 'accent';
}

const IMPACT_TONES: { match: string; label: string; tone: ChipTone }[] = [
  { match: 'admin impact', label: 'Admin impact', tone: 'critical' },
  { match: 'user impact', label: 'User impact', tone: 'warn' },
];

export function MessageCard({ message }: MessageCardProps) {
  const uniqueServices = Array.from(new Set(message.service));
  const flags = getStatusFlags(message);
  const excerpt = toExcerpt(message.summary || message.content);
  const publishedDay = format(new Date(message.published), 'yyyy-MM-dd');
  const updatedDay = format(new Date(message.lastUpdated), 'yyyy-MM-dd');
  const wasUpdated = publishedDay !== updatedDay;
  const impacts = IMPACT_TONES.filter(impact =>
    message.tags.some(tag => tag.toLowerCase().includes(impact.match))
  );

  return (
    <SurfaceCard
      as="article"
      accent={getCardTone(message)}
      interactive
      muted={message.status === 'archived'}
      className="group gap-2.5"
    >
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="type-meta rounded bg-surface-sunken px-1.5 py-0.5 font-semibold text-ink-muted">
          {message.id}
        </span>
        {flags.map(flag => (
          <StatusChip key={flag.label} tone={flag.tone} title={flag.title}>
            {flag.label}
          </StatusChip>
        ))}
      </div>

      <h3 className="type-card-title text-ink transition-colors group-hover:text-accent">
        <Link
          href={`/message/${message.id}`}
          className="rounded after:absolute after:inset-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <span className="line-clamp-3 break-words">{message.title}</span>
        </Link>
      </h3>

      {excerpt ? (
        <p className="type-body-sm line-clamp-3 break-words text-ink-muted">{excerpt}</p>
      ) : null}

      {uniqueServices.length > 0 ? (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          {uniqueServices.slice(0, 3).map(service => {
            const iconPath = serviceIcon(service);
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
            <span
              className="type-meta text-ink-subtle"
              title={uniqueServices.slice(3).join(', ')}
            >
              +{uniqueServices.length - 3} more
            </span>
          ) : null}
        </div>
      ) : null}

      <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1.5 pt-1">
        <p className="type-meta text-ink-subtle">
          {wasUpdated ? 'Updated' : 'Published'}{' '}
          <time dateTime={wasUpdated ? message.lastUpdated : message.published}>
            {format(new Date(wasUpdated ? message.lastUpdated : message.published), 'MMM d, yyyy')}
          </time>
        </p>
        {impacts.length > 0 ? (
          <div className="ml-auto flex items-center gap-1">
            {impacts.map(impact => (
              <StatusChip key={impact.match} tone={impact.tone}>
                {impact.label}
              </StatusChip>
            ))}
          </div>
        ) : null}
      </div>
    </SurfaceCard>
  );
}
