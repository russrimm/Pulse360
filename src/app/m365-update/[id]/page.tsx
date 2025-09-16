import { getM365Updates } from '@/lib/api';
import { notFound } from 'next/navigation';
import { format } from 'date-fns';
import Image from 'next/image';
import Link from 'next/link';

// Service icon map (copy from M365UpdateCard)
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
};

interface PageProps {
  params: { id: string };
  searchParams?: { [key: string]: string | string[] | undefined };
}

export default async function M365UpdatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const updates = await getM365Updates();
  const update = updates.find(u => u.id === id);

  if (!update) {
    notFound();
  }

  const uniqueServices = Array.from(new Set(update.service));

  return (
    <div className="min-h-screen bg-gray-900 dark:bg-black">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link
            href="/release-plans/m365"
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Microsoft 365 Updates
          </Link>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex flex-col flex-grow">
            {/* Service badges row */}
            <div className="flex items-center justify-center w-full bg-gradient-to-b from-gray-50 to-transparent dark:from-gray-900/50 dark:to-transparent py-3 px-4">
              <div className="flex flex-wrap gap-2 justify-center">
                {uniqueServices.map(service => {
                  const iconPath = serviceIcons[service];
                  return (
                    <div
                      key={service}
                      className="inline-flex items-center px-3 py-1.5 rounded-xl text-sm font-medium bg-blue-50 text-blue-700 dark:bg-transparent dark:text-blue-300 border border-blue-200 dark:border-blue-800 min-w-[160px] justify-center"
                    >
                      {iconPath && (
                        <Image src={iconPath} alt={service} width={16} height={16} className="mr-1.5 w-4 h-4" />
                      )}
                      <span className="truncate">{service}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            {/* Published/Updated row */}
            <div className="flex items-center justify-center text-[10px] text-gray-500 dark:text-gray-400 gap-1.5 py-1.5">
              <span className="font-medium">Published</span>
              <span>{format(new Date(update.published), 'MMM d, yyyy')}</span>
              {format(new Date(update.published), 'MMM d, yyyy') !== format(new Date(update.lastUpdated), 'MMM d, yyyy') && (
                <>
                  <span>•</span>
                  <span className="font-medium">Updated</span>
                  <span>{format(new Date(update.lastUpdated), 'MMM d, yyyy')}</span>
                </>
              )}
            </div>
            {/* Status and GA/Preview above Title */}
            {(update.status || update.generalAvailabilityDate || update.previewAvailabilityDate) && (
              <div className="px-6 pt-2 pb-2">
                {update.status && (
                  <div className="mb-1 text-xs text-gray-700 dark:text-gray-300"><span className="font-semibold">Status:</span> {update.status}</div>
                )}
                {(update.generalAvailabilityDate || update.previewAvailabilityDate) && (
                  <div className="mb-1 text-xs text-gray-700 dark:text-gray-300 flex gap-4">
                    {update.generalAvailabilityDate && <span><span className="font-semibold">GA:</span> {format(new Date(update.generalAvailabilityDate), 'MMM d, yyyy')}</span>}
                    {update.previewAvailabilityDate && <span><span className="font-semibold">Preview:</span> {format(new Date(update.previewAvailabilityDate), 'MMM d, yyyy')}</span>}
                  </div>
                )}
              </div>
            )}
            {/* Title and content */}
            <div className="p-6 pt-4 flex flex-col flex-grow">
              <div className="flex flex-col flex-grow">
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-base font-medium text-gray-900 dark:text-white tracking-tight text-center">{update.title}</h1>
                </div>
                <div className="mt-2 text-sm text-gray-600 dark:text-gray-400 flex-grow">
                  <div className="prose dark:prose-invert prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: update.content }} />
                </div>
              </div>
            </div>
            {/* Tags at the bottom */}
            <div className="px-6 pb-6">
              {update.tags && update.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {update.tags.map(tag => (
                    <span key={tag} className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium bg-gray-50 text-gray-700 dark:bg-gray-700/50 dark:text-gray-300 border border-gray-200 dark:border-gray-600">{tag}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 