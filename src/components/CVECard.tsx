"use client";
import React from 'react';
import Image from 'next/image';
import { getProductIcon } from '@/lib/getProductIcon';
import { getMsrcFieldValue, getMsrcImpact, getMsrcSeverity } from '@/lib/msrc';

interface Vulnerability {
  ID: string;
  Title?: any;
  Description?: any;
  CVE?: string[];
  ProductStatuses?: any[];
  Threats?: any[];
  Remediations?: any[];
  CVSSScoreSets?: any[];
  References?: any[];
  Acknowledgments?: any[];
  ReleaseDate?: string;
  RevisionHistory?: any[];
  ProblemTypes?: any[]; // Added for CWE
  [key: string]: any;
}

interface ProductTree {
  FullProductName?: { ProductID: string; Value: string }[];
}

interface CVECardProps {
  vuln: Vulnerability;
  productTree?: ProductTree;
}

function getFieldValue(field: any): string {
  return getMsrcFieldValue(field);
}

function getProductName(productId: string, productTree?: ProductTree): string {
  if (!productTree || !productTree.FullProductName) return productId;
  const found = productTree.FullProductName.find(p => p.ProductID === productId);
  return found ? found.Value : productId;
}

export default function CVECard({ vuln, productTree }: CVECardProps) {
  // Always show detailed table for each CVE
  return (
    <div className="bg-white/80 dark:bg-gray-800/50 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700/50 p-6 mb-4">
        <div className="mb-2 text-xl font-bold text-gray-900 dark:text-white">
          {getFieldValue(vuln.Title)}
      </div>
        <div className="mb-2 text-xs text-gray-700 dark:text-gray-300">
        {Array.isArray(vuln.CVE) ? vuln.CVE.join(', ') : vuln.CVE || vuln.ID}
      </div>
      <div className="w-full overflow-x-auto">
              <table className="min-w-full text-xs border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100">
                <thead className="bg-gray-100 dark:bg-gray-900">
                  <tr>
                    <th className="px-2 py-2 text-left">Product</th>
              <th className="px-2 py-2 text-left">Platform</th>
                    <th className="px-2 py-2 text-left">Impact</th>
                    <th className="px-2 py-2 text-left">Max Severity</th>
                    <th className="px-2 py-2 text-left">Article</th>
                    <th className="px-2 py-2 text-left">Download</th>
                  </tr>
                </thead>
                <tbody>
            {Array.isArray(vuln.ProductStatuses) && vuln.ProductStatuses.length > 0 && vuln.ProductStatuses.map((status, idx) => {
                    const productIds = Array.isArray(status.ProductID) ? status.ProductID : [status.ProductID];
                    return productIds.map((pid: string, pidx: number) => {
                      const productName = getProductName(pid, productTree);
                      const productIcon = getProductIcon(productName);
                      // Find remediation for this product
                      const remediation = Array.isArray(vuln.Remediations)
                        ? vuln.Remediations.find(rem => {
                            if (!rem.ProductID) return false;
                            if (Array.isArray(rem.ProductID)) return rem.ProductID.includes(pid);
                            return rem.ProductID === pid;
                          })
                        : null;
                      // Article: try URL, else try to extract KB from description
                      let articleUrl = '';
                      let articleLabel = '';
                      let kbNumber = '';
                      if (remediation && remediation.URL && remediation.URL.includes('support.microsoft.com')) {
                        articleUrl = remediation.URL;
                        articleLabel = 'KB Article';
                      }
                      if (!articleUrl && Array.isArray(vuln.References)) {
                        for (const ref of vuln.References) {
                          if (ref.URL && ref.URL.includes('support.microsoft.com')) {
                            articleUrl = ref.URL;
                            articleLabel = 'KB Article';
                            break;
                          }
                        }
                      }
                      // Try to extract KB number from remediation or reference description
                      if (!articleUrl) {
                        let desc = remediation && remediation.Description ? getFieldValue(remediation.Description) : '';
                        if (!desc && Array.isArray(vuln.References)) {
                          for (const ref of vuln.References) {
                            desc = getFieldValue(ref.Description);
                            if (desc) break;
                          }
                        }
                        const kbMatch = desc.match(/\b(\d{7,8})\b/); // KB numbers are usually 7-8 digits
                        if (kbMatch) {
                          kbNumber = kbMatch[1];
                          articleUrl = `https://support.microsoft.com/help/${kbNumber}`;
                          articleLabel = 'KB Article';
                        }
                      }
                      // Download: as before
                      let downloadUrl = '';
                      if (remediation && remediation.URL && remediation.URL.includes('catalog.update.microsoft.com')) {
                        downloadUrl = remediation.URL;
                      }
                      if (!downloadUrl && Array.isArray(vuln.References)) {
                        for (const ref of vuln.References) {
                          if (ref.URL && ref.URL.includes('catalog.update.microsoft.com')) {
                            downloadUrl = ref.URL;
                            break;
                          }
                        }
                      }
                      // Impact and Severity
                      const impact = getMsrcImpact(vuln.Threats);
                      const severity = getMsrcSeverity(vuln.Threats);
                // Platform: try to extract from product name or status
                let platform = status.Platform || '';
                if (!platform && productName.match(/ARM|x64|x86|Itanium|Server Core|Datacenter|Essentials|Standard|Pro|Enterprise|Education|LTSC|LTSB|IoT|Azure|Core/)) {
                  platform = productName.match(/ARM|x64|x86|Itanium|Server Core|Datacenter|Essentials|Standard|Pro|Enterprise|Education|LTSC|LTSB|IoT|Azure|Core/)?.[0] || '';
                }
                      return (
                        <tr key={pid + '-' + idx + '-' + pidx} className="border-t border-gray-200 dark:border-gray-700">
                    <td className="px-2 py-2 whitespace-nowrap text-gray-900 dark:text-gray-100">
                      {productIcon && productName.toLowerCase().includes('microsoft graph') && (
                        <Image src={productIcon} alt="" width={20} height={20} className="inline w-5 h-5 mr-1 align-text-bottom" />
                      )}
                      {productName}
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap text-gray-900 dark:text-gray-100">{platform || '-'}</td>
                          <td className="px-2 py-2 whitespace-nowrap text-gray-900 dark:text-gray-100">{impact || '-'}</td>
                          <td className="px-2 py-2 whitespace-nowrap text-gray-900 dark:text-gray-100">{severity || '-'}</td>
                    <td className="px-2 py-2 whitespace-nowrap text-gray-900 dark:text-gray-100">{articleUrl ? (<a href={articleUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">{articleLabel || 'KB Article'}</a>) : '-'}</td>
                    <td className="px-2 py-2 whitespace-nowrap text-gray-900 dark:text-gray-100">{downloadUrl ? (<a href={downloadUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Security Update</a>) : '-'}</td>
                        </tr>
                      );
                    });
                  })}
                </tbody>
              </table>
            </div>
      {/* Optionally, add a collapsible section for all other details */}
    </div>
  );
} 