'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { format } from 'date-fns';
import Image from 'next/image';
import Link from 'next/link';
import { getM365Update } from '@/lib/api';

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

const serviceIcons: Record<string, string> = {
  'Microsoft 365': '/icons/m365.svg',
  'Microsoft Teams': '/icons/Teams_scalable.svg',
  'Microsoft Outlook': '/icons/Outlook_scalable.svg',
  'Microsoft Word': '/icons/Word_scalable.svg',
  'Microsoft Excel': '/icons/Excel_scalable.svg',
  'Microsoft PowerPoint': '/icons/PowerPoint_scalable.svg',
  'Microsoft OneNote': '/icons/OneNote_scalable.svg',
  'Microsoft OneDrive': '/icons/OneDrive_scalable.svg',
  'Microsoft SharePoint': '/icons/SharePoint_scalable.svg',
  'Microsoft Viva': '/icons/Viva_scalable.svg',
  'Microsoft Purview': '/icons/Purview_scalable.svg',
  'Microsoft Entra ID': '/icons/EntraID_scalable.svg',
  'Microsoft Defender': '/icons/Defender_scalable.svg',
  'Microsoft Intune': '/icons/Intune_scalable.svg',
  'Microsoft Power Platform': '/icons/PowerPlatform_scalable.svg',
  'Microsoft Power Apps': '/icons/PowerApps_scalable.svg',
  'Microsoft Power Automate': '/icons/PowerAutomate_scalable.svg',
  'Microsoft Power BI': '/icons/PowerBI_scalable.svg',
  'Microsoft Power Pages': '/icons/PowerPages_scalable.svg',
  'Microsoft Dataverse': '/icons/Dataverse_scalable.svg',
  'Microsoft Copilot (Microsoft 365)': '/icons/Copilot_scalable.svg',
};

export default function M365UpdatePage() {
  const params = useParams();
  const [update, setUpdate] = useState<M365Update | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUpdate = async () => {
      try {
        const data = await getM365Update(params.id as string);
        setUpdate(data);
      } catch (error) {
        console.error('Error fetching update:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUpdate();
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-8"></div>
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!update) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Update not found</h1>
            <Link
              href="/m365-updates"
              className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
            >
              Return to Microsoft 365 Updates
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Deduplicate and normalize services
  const uniqueServices = Array.from(new Set(update.service));

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Link
            href="/m365-updates"
            className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 mb-4 inline-block"
          >
            ← Back to Microsoft 365 Updates
          </Link>
          <div className="flex flex-wrap gap-2 mb-4">
            {uniqueServices.map((service) => {
              const iconPath = serviceIcons[service];
              return (
                <div
                  key={service}
                  className="inline-flex items-center px-3 py-1.5 rounded-xl text-sm font-medium bg-blue-50 text-blue-700 dark:bg-transparent dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                >
                  {iconPath && (
                    <Image
                      src={iconPath}
                      alt={service}
                      width={16}
                      height={16}
                      className="mr-1.5 w-4 h-4"
                    />
                  )}
                  <span>{service}</span>
                </div>
              );
            })}
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">{update.title}</h1>
          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 gap-4">
            <div>
              <span className="font-medium">Published:</span>{' '}
              {format(new Date(update.published), 'MMMM d, yyyy')}
            </div>
            {format(new Date(update.published), 'MMM d, yyyy') !== format(new Date(update.lastUpdated), 'MMM d, yyyy') && (
              <div>
                <span className="font-medium">Updated:</span>{' '}
                {format(new Date(update.lastUpdated), 'MMMM d, yyyy')}
              </div>
            )}
          </div>
        </div>
        <div className="prose dark:prose-invert max-w-none">
          <div dangerouslySetInnerHTML={{ __html: update.content }} />
        </div>
        {update.tags.length > 0 && (
          <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Tags</h2>
            <div className="flex flex-wrap gap-2">
              {update.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 