'use client';

import { AzureUpdate } from '@/lib/types';
import { format } from 'date-fns';
import Link from 'next/link';
import Image from 'next/image';
import { getProductIcon } from '@/lib/getProductIcon';

interface AzureUpdateCardProps {
  update: AzureUpdate;
  onClick: (id: string) => void;
}

export function AzureUpdateCard({ update, onClick }: AzureUpdateCardProps) {
  const handleClick = () => {
    onClick(update.id);
  };

  return (
    <Link href={`/azure-update/${update.id}`}>
      <div 
        className="group bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700/50 hover:border-primary-200 dark:hover:border-primary-800 hover:-translate-y-1 h-full cursor-pointer flex flex-col"
        onClick={handleClick}
      >
        <div className="p-6 pb-2">
          <div className="flex flex-wrap gap-2 mb-3">
            {update.products.map((product) => {
              const iconPath = getProductIcon(product);
              return (
                <span
                  key={product}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-medium tracking-wide whitespace-nowrap shrink-0 bg-gray-50/90 text-gray-700 dark:bg-gray-800/20 dark:text-gray-200 border border-gray-200/30 dark:border-gray-700/20 group-hover:bg-primary-50/50 dark:group-hover:bg-primary-900/20 group-hover:border-primary-200/50 dark:group-hover:border-primary-800/50 transition-colors"
                >
                  {iconPath && (
                    <Image
                      src={iconPath}
                      alt=""
                      width={16}
                      height={16}
                      className="w-4 h-4"
                    />
                  )}
                  {product}
                </span>
              );
            })}
          </div>
          <h3 className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-primary-700 dark:group-hover:text-primary-400 transition-colors tracking-tight text-center">{update.title}</h3>
          <div className="flex justify-center items-center text-[10px] text-gray-500 dark:text-gray-400 gap-2 mb-1">
            <span>Created: {format(new Date(update.created), 'MMM d, yyyy')}</span>
            {format(new Date(update.created), 'yyyy-MM-dd') !== format(new Date(update.modified), 'yyyy-MM-dd') && (
              <>
                <span>•</span>
                <span>Last Modified: {format(new Date(update.modified), 'MMM d, yyyy')}</span>
              </>
            )}
          </div>
          <div className="mt-2 text-[10px] prose prose-tight dark:prose-invert max-w-none [&_*]:!text-gray-600 [&_*]:dark:!text-gray-300 [&_a]:!text-primary-600 [&_a]:dark:!text-primary-400 [&_a]:!no-underline [&_a:hover]:!text-primary-700 [&_a:hover]:dark:!text-primary-300 [&_strong]:!text-gray-900 [&_strong]:dark:!text-white [&_h1]:!text-gray-900 [&_h1]:dark:!text-white [&_h2]:!text-gray-900 [&_h2]:dark:!text-white [&_h3]:!text-gray-900 [&_h3]:dark:!text-white [&_h4]:!text-gray-900 [&_h4]:dark:!text-white [&_h5]:!text-gray-900 [&_h5]:dark:!text-white [&_h6]:!text-gray-900 [&_h6]:dark:!text-white [&_code]:!text-gray-900 [&_code]:dark:!text-gray-100 [&_code]:!bg-gray-100 [&_code]:dark:!bg-gray-800 [&_pre]:!text-gray-900 [&_pre]:dark:!text-gray-100 [&_pre]:!bg-gray-100 [&_pre]:dark:!bg-gray-800 [&_p]:!text-gray-600 [&_p]:dark:!text-gray-300 [&_ul]:!text-gray-600 [&_ul]:dark:!text-gray-300 [&_ol]:!text-gray-600 [&_ol]:dark:!text-gray-300 [&_li]:!text-gray-600 [&_li]:dark:!text-gray-300 [&_blockquote]:!text-gray-600 [&_blockquote]:dark:!text-gray-300 [&_blockquote]:!border-gray-200 [&_blockquote]:dark:!border-gray-700 [&_*]:!bg-transparent [&_*]:dark:!bg-transparent [&_p]:mb-1 [&_li]:mb-1">
            <div className="line-clamp-3" dangerouslySetInnerHTML={{ __html: update.description }} />
          </div>
        </div>
      </div>
    </Link>
  );
} 