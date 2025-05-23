'use client';

import { format } from 'date-fns';
import Link from 'next/link';
import Image from 'next/image';

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

export const M365UpdateCard: React.FC<M365UpdateCardProps> = ({ update, onClick }) => {
  // Deduplicate and normalize services
  const uniqueServices = Array.from(new Set(update.service));

  return (
    <Link href={`/m365-update/${update.id}`}>
      <div 
        className="group bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700/50 hover:border-primary-200 dark:hover:border-primary-800 hover:-translate-y-1 h-full cursor-pointer flex flex-col"
      >
        <div className="flex flex-col flex-grow">
          <div className="flex items-center justify-center w-full bg-gradient-to-b from-gray-50 to-transparent dark:from-gray-900/50 dark:to-transparent py-3 px-4">
            <div className="flex flex-wrap gap-2 justify-center">
              {uniqueServices.map((service) => {
                const iconPath = serviceIcons[service];
                return (
                  <div
                    key={service}
                    className="inline-flex items-center px-3 py-1.5 rounded-xl text-sm font-medium bg-blue-50 text-blue-700 dark:bg-transparent dark:text-blue-300 border border-blue-200 dark:border-blue-800 min-w-[160px] justify-center"
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
                    <span className="truncate">{service}</span>
                  </div>
                );
              })}
            </div>
          </div>
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
          <div className="p-6 pt-4 flex flex-col flex-grow">
            <div className="flex flex-col flex-grow">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-base font-medium text-gray-900 dark:text-white group-hover:text-primary-700 dark:group-hover:text-primary-400 transition-colors tracking-tight">{update.title}</h3>
              </div>
              <div className="mt-2 text-sm text-gray-600 dark:text-gray-400 flex-grow">
                <div 
                  className="prose dark:prose-invert prose-sm max-w-none line-clamp-[8]"
                  dangerouslySetInnerHTML={{ __html: update.content }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}; 