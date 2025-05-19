'use client';

import { format } from 'date-fns';
import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { LoadingSpinner } from './LoadingSpinner';

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

interface ReleasePlanDetailProps {
  plan: ReleasePlan;
}

// Map of service names to their icon paths
const serviceIcons: Record<string, string> = {
  'Power Apps': '/icons/PowerApps_scalable.svg',
  'Power Automate': '/icons/PowerAutomate_scalable.svg',
  'Power Platform': '/icons/PowerPlatform_scalable.svg',
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
  'Dynamics 365 Apps': '/icons/Dynamics365_scalable.svg',
  'Microsoft Viva': '/icons/viva.svg',
  'Microsoft Purview': '/icons/purview.svg',
  'Microsoft Defender XDR': '/icons/defender.svg',
  'Windows': '/icons/Windows.svg'
};

export function ReleasePlanDetail({ plan }: ReleasePlanDetailProps) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen">
      <div className="absolute inset-0 bg-[radial-gradient(#1f2937_1px,transparent_1px)] [background-size:16px_16px]" />
      <div className="relative px-3 sm:px-6 lg:px-8 pt-0 pb-2 sm:py-4">
        <div className="max-w-7xl mx-auto">
          <div className="mb-0.5 sm:mb-3">
            <Link
              href="/release-plans"
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300 transition-colors bg-white/50 dark:bg-gray-800/50 rounded-lg hover:bg-white/80 dark:hover:bg-gray-800/80"
            >
              <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to release plans
            </Link>
          </div>

          <article className="bg-white/90 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-1.5 sm:p-6">
              <div className="flex items-center justify-center mb-1.5 sm:mb-4">
                <div className="flex flex-col items-center">
                  <h1 className="text-xl sm:text-3xl font-bold bg-gradient-to-r from-primary-600 to-primary-400 dark:from-primary-400 dark:to-primary-300 bg-clip-text text-transparent text-center">
                    {plan.id} - {plan.title}
                  </h1>
                </div>
              </div>

              <div className="bg-white/70 dark:bg-gray-700/70 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-gray-600 overflow-hidden mb-4 sm:mb-6">
                <div className="p-3 sm:p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Left Column */}
                    <div className="space-y-4">
                      {/* Services */}
                      <div className="flex flex-wrap gap-2">
                        {plan.service.map((service) => {
                          const iconPath = service.startsWith('Microsoft 365') 
                            ? '/icons/m365.svg' 
                            : serviceIcons[service];
                          return (
                            <span
                              key={service}
                              className="inline-flex items-center px-2 py-1.5 rounded-lg text-sm font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800 shadow-sm"
                            >
                              {iconPath && (
                                <Image
                                  src={iconPath}
                                  alt={service}
                                  width={20}
                                  height={20}
                                  className="mr-2 w-5 h-5"
                                />
                              )}
                              <span className="truncate max-w-[200px]">{service}</span>
                            </span>
                          );
                        })}
                      </div>

                      {/* Tags */}
                      {plan.tags.length > 0 && (
                        <div>
                          <h3 className="text-base font-medium text-primary-600 dark:text-primary-400 mb-2">Investment Area</h3>
                          <div className="flex flex-wrap gap-1.5">
                            {plan.tags.map((tag) => (
                              <span
                                key={tag}
                                className="inline-flex items-center px-2 py-1 rounded-lg text-base font-medium bg-primary-50 text-primary-700 dark:bg-primary-900/50 dark:text-primary-300"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Right Column */}
                    <div className="space-y-4">
                      {/* Dates */}
                      <div>
                        <h3 className="text-base font-medium text-primary-600 dark:text-primary-400 mb-2">Timeline</h3>
                        <div className="space-y-2">
                          {plan.publicPreviewDate && (
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Public Preview:</span>
                              <span className="text-sm text-gray-600 dark:text-gray-400">{format(new Date(plan.publicPreviewDate), 'MMM d, yyyy')}</span>
                            </div>
                          )}
                          {plan.gaDate && (
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">General Availability:</span>
                              <span className="text-sm text-gray-600 dark:text-gray-400">{format(new Date(plan.gaDate), 'MMM d, yyyy')}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Release Waves */}
                      <div>
                        <h3 className="text-base font-medium text-primary-600 dark:text-primary-400 mb-2">Release Waves</h3>
                        <div className="space-y-2">
                          {plan.publicPreviewWave && (
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Public Preview:</span>
                              <span className="text-sm text-gray-600 dark:text-gray-400">{plan.publicPreviewWave}</span>
                            </div>
                          )}
                          {plan.gaWave && (
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">General Availability:</span>
                              <span className="text-sm text-gray-600 dark:text-gray-400">{plan.gaWave}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Dates Section */}
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400 mb-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium">Published</span>
                          <span>{format(new Date(plan.published), 'MMM d, yyyy')}</span>
                        </div>
                        {format(new Date(plan.published), 'MMM d, yyyy') !== format(new Date(plan.lastUpdated), 'MMM d, yyyy') && (
                          <div className="flex items-center gap-1.5">
                            <span className="font-medium">Updated</span>
                            <span>{format(new Date(plan.lastUpdated), 'MMM d, yyyy')}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Content Sections */}
              <div className="space-y-6">
                {/* Business Value */}
                <div className="bg-white/70 dark:bg-gray-700/70 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-gray-200 dark:border-gray-600">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4">Business Value</h2>
                  <div className="prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: plan.businessValue }} />
                </div>

                {/* Feature Details */}
                <div className="bg-white/70 dark:bg-gray-700/70 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-gray-200 dark:border-gray-600">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4">Feature Details</h2>
                  <div className="prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: plan.content }} />
                </div>

                {/* Enabled For */}
                <div className="bg-white/70 dark:bg-gray-700/70 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-gray-200 dark:border-gray-600">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4">Enabled For</h2>
                  <div className="prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: plan.enabledFor }} />
                </div>
              </div>
            </div>
          </article>
        </div>
      </div>
    </div>
  );
} 