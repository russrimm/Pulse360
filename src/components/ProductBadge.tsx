'use client';

import Image from 'next/image';
import { getProductIcon } from './AzureUpdateCard';

interface ProductBadgeProps {
  product: string;
}

export function ProductBadge({ product }: ProductBadgeProps) {
  if (!product) return null;

  return (
    <div className="mb-4">
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium tracking-wide whitespace-nowrap shrink-0 bg-gray-50/90 text-gray-700 dark:bg-gray-800/20 dark:text-gray-200 border border-gray-200/30 dark:border-gray-700/20">
        {getProductIcon(product) && (
          <Image
            src={getProductIcon(product) || ''}
            alt=""
            width={16}
            height={16}
            className="w-4 h-4"
          />
        )}
        {product}
      </span>
    </div>
  );
} 