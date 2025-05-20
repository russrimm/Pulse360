import { format } from 'date-fns';
import Image from 'next/image';
import Link from 'next/link';
import { getM365Update } from '@/lib/api';
import { notFound } from 'next/navigation';

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
  'Microsoft Copilot (Microsoft 365)': '/icons/CopilotStudio_scalable.svg',
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
  'Power Platform': '/icons/PowerPlatform_scalable.svg',
  'Power Apps': '/icons/PowerApps_scalable.svg',
  'Power Automate': '/icons/PowerAutomate_scalable.svg',
  'Power BI': '/icons/PowerBI_scalable.svg',
  'Power Pages': '/icons/PowerPages_scalable.svg',
  'Dataverse': '/icons/Dataverse_scalable.svg',
  'Copilot': '/icons/CopilotStudio_scalable.svg',
};

export default async function M365UpdatePage({ params }: { params: { id: string } }) {
  try {
    const update = await getM365Update(params.id);

    if (!update) {
      notFound();
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
  } catch (error) {
    console.error('Error fetching update:', error);
    notFound();
  }
} 