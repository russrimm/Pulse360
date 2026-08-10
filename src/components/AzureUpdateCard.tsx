'use client';

import { AzureUpdate } from '@/lib/types';
import { format } from 'date-fns';
import Link from 'next/link';
import Image from 'next/image';
import { getProductIcon } from '@/lib/getProductIcon';
import { SafeHtml } from '@/components/SafeHtml';
import { SurfaceCard } from './SurfaceCard';
import { StatusChip } from './StatusChip';

interface AzureUpdateCardProps {
  update: AzureUpdate;
  onClick: (id: string) => void;
}

export function AzureUpdateCard({ update, onClick }: AzureUpdateCardProps) {
  const handleClick = () => {
    onClick(update.id);
  };

  const isUpdated =
    format(new Date(update.created), 'yyyy-MM-dd') !==
    format(new Date(update.modified), 'yyyy-MM-dd');

  return (
    <Link href={`/azure-update/${update.id}`} className="group block h-full min-w-0">
      <SurfaceCard interactive className="gap-2.5" onClick={handleClick}>
        {update.products.length > 0 ? (
          <div className="flex flex-wrap items-center gap-1.5">
            {update.products.slice(0, 3).map(product => {
              const iconPath = getProductIcon(product);
              return (
                <StatusChip
                  key={product}
                  icon={
                    iconPath ? (
                      <Image src={iconPath} alt="" width={14} height={14} className="h-3.5 w-3.5" />
                    ) : undefined
                  }
                >
                  {product}
                </StatusChip>
              );
            })}
            {update.products.length > 3 ? (
              <span className="type-meta text-ink-subtle">+{update.products.length - 3} more</span>
            ) : null}
          </div>
        ) : null}

        <h3 className="type-card-title line-clamp-3 break-words text-ink transition-colors group-hover:text-accent">
          {update.title}
        </h3>

        <SafeHtml
          html={update.description}
          className="type-body-sm prose prose-sm dark:prose-invert line-clamp-3 max-w-none text-ink-muted"
        />

        <p className="type-meta mt-auto pt-1 text-ink-subtle">
          {isUpdated
            ? `Updated ${format(new Date(update.modified), 'MMM d, yyyy')}`
            : `Created ${format(new Date(update.created), 'MMM d, yyyy')}`}
        </p>
      </SurfaceCard>
    </Link>
  );
}