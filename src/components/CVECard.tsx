"use client";
import React, { useState } from 'react';
import { getProductIcon } from '@/lib/getProductIcon';

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
  month: string;
  releaseDate: string;
  revisionHistory: any[] | undefined;
  productTree?: ProductTree;
}

function getFieldValue(field: any): string {
  if (!field) return '';
  if (typeof field === 'string') return field;
  if (typeof field === 'object' && 'Value' in field) return field.Value;
  return '';
}

function formatDate(date: string | undefined) {
  if (!date) return '-';
  // Handle YYYYMMDD format
  if (/^\d{8}$/.test(date)) {
    date = date.slice(0, 4) + '-' + date.slice(4, 6) + '-' + date.slice(6, 8);
  }
  const d = new Date(date);
  return isNaN(d.getTime()) ? '-' : d.toLocaleDateString();
}

function getProductName(productId: string, productTree?: ProductTree): string {
  if (!productTree || !productTree.FullProductName) return productId;
  const found = productTree.FullProductName.find(p => p.ProductID === productId);
  return found ? found.Value : productId;
}

function formatProductStatuses(statuses: any[] | undefined, productTree?: ProductTree) {
  if (!statuses || !Array.isArray(statuses)) return null;
  return statuses.map((status, idx) => (
    <div key={JSON.stringify(status) + '-' + idx} className="mb-1">
      <span className="font-semibold">{status.Type ? status.Type : ''}:</span> {Array.isArray(status.ProductID)
        ? status.ProductID.map((id: string) => getProductName(id, productTree)).join(', ')
        : getProductName(status.ProductID, productTree)}
    </div>
  ));
}

function formatThreats(threats: any[] | undefined, productTree?: ProductTree) {
  if (!threats || !Array.isArray(threats)) return null;
  return threats.map((threat, idx) => (
    <div key={JSON.stringify(threat) + '-' + idx} className="mb-1">
      <span className="font-semibold">{threat.Type ? threat.Type : ''}:</span> {getFieldValue(threat.Description)}
      {threat.ProductID && (
        <span> (<span className="italic">Products:</span> {Array.isArray(threat.ProductID)
          ? threat.ProductID.map((id: string) => getProductName(id, productTree)).join(', ')
          : getProductName(threat.ProductID, productTree)})</span>
      )}
    </div>
  ));
}

function formatRemediations(remediations: any[] | undefined) {
  if (!remediations || !Array.isArray(remediations)) return null;
  return remediations.map((rem, idx) => {
    let label = 'Remediation Link';
    if (rem.URL && rem.URL.includes('support.microsoft.com')) label = 'KB Article';
    if (rem.URL && rem.URL.includes('catalog.update.microsoft.com')) label = 'Download Security Update';
    return (
      <div key={JSON.stringify(rem) + '-' + idx} className="mb-2">
        <span className="font-semibold">{rem.Type ? rem.Type : String(rem)}:</span> {getFieldValue(rem.Description)}
        {rem.URL && (
          <span> [<a href={rem.URL} target="_blank" rel="noopener noreferrer" className="underline text-primary-700 dark:text-primary-400">{label}</a>]</span>
        )}
      </div>
    );
  });
}

function formatReferences(refs: any[] | undefined) {
  if (!refs || !Array.isArray(refs)) return null;
  return refs.map((ref, idx) => {
    let label = getFieldValue(ref.Description) || ref.URL;
    if (ref.URL && ref.URL.includes('support.microsoft.com')) label = 'KB Article';
    if (ref.URL && ref.URL.includes('catalog.update.microsoft.com')) label = 'Download Security Update';
    return (
      <div key={JSON.stringify(ref) + '-' + idx} className="mb-1">
        <a href={ref.URL} target="_blank" rel="noopener noreferrer" className="underline text-primary-700 dark:text-primary-400">
          {label}
        </a>
      </div>
    );
  });
}

function formatAcknowledgments(acks: any[] | undefined) {
  if (!acks || !Array.isArray(acks)) return null;
  return acks.map((ack, idx) => (
    <div key={JSON.stringify(ack) + '-' + idx} className="mb-1">
      {getFieldValue(ack.Name)}{ack.Organization ? ` (${ack.Organization})` : ''}
      {ack.URL && (
        <span> [<a href={ack.URL} target="_blank" rel="noopener noreferrer" className="underline text-primary-700 dark:text-primary-400">Link</a>]</span>
      )}
    </div>
  ));
}

function formatRevisionHistory(revs: any[] | undefined) {
  if (!revs || !Array.isArray(revs)) return null;
  return revs.map((rev, idx) => (
    <div key={JSON.stringify(rev) + '-' + idx} className="mb-1">
      <span className="font-semibold">{formatDate(rev.Date)}:</span> {getFieldValue(rev.Description)}
    </div>
  ));
}

function getValidDate(...dates: (string | undefined)[]) {
  for (const date of dates) {
    if (date && !isNaN(new Date(date).getTime())) return date;
    // Try to handle YYYYMMDD
    if (date && /^\d{8}$/.test(date)) {
      const iso = date.slice(0, 4) + '-' + date.slice(4, 6) + '-' + date.slice(6, 8);
      if (!isNaN(new Date(iso).getTime())) return iso;
    }
  }
  return undefined;
}

export default function CVECard({ vuln, month, releaseDate, revisionHistory, productTree }: CVECardProps) {
  // Always show detailed table for each CVE
  return (
    <div className="bg-white/80 dark:bg-gray-800/50 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700/50 p-6 mb-4">
      <div className="mb-2 text-xl font-bold text-gray-900 dark:text-white">
        {getFieldValue(vuln.Title)}
      </div>
      <div className="mb-2 text-xs text-gray-700 dark:text-gray-300">
        {Array.isArray(vuln.CVE) ? vuln.CVE.join(', ') : vuln.CVE || vuln.ID}
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-xs border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100">
          <thead className="bg-gray-100 dark:bg-gray-900">
            <tr>
              {/* <th className="px-2 py-2 text-left">Release Date</th> */}
              <th className="px-2 py-2 text-left">Product</th>
              <th className="px-2 py-2 text-left">Platform</th>
              <th className="px-2 py-2 text-left">Impact</th>
              <th className="px-2 py-2 text-left">Max Severity</th>
              <th className="px-2 py-2 text-left">Article</th>
              <th className="px-2 py-2 text-left">Download</th>
              <th className="px-2 py-2 text-left">Build Number</th>
            </tr>
          </thead>
          <tbody>
            {Array.isArray(vuln.ProductStatuses) && vuln.ProductStatuses.length > 0 && vuln.ProductStatuses.map((status, idx) => {
              const productIds = Array.isArray(status.ProductID) ? status.ProductID : [status.ProductID];
              return productIds.map((pid: string, pidx: number) => {
                let productName = getProductName(pid, productTree);
                let buildMatch = productName.match(/(\d+\.\d+\.\d+\.\d+)/);
                let buildNumber = buildMatch ? buildMatch[1] : '';
                // Find remediation for this product
                const remediation = Array.isArray(vuln.Remediations)
                  ? vuln.Remediations.find(rem => {
                      if (!rem.ProductID) return false;
                      if (Array.isArray(rem.ProductID)) return rem.ProductID.includes(pid);
                      return rem.ProductID === pid;
                    })
                  : null;
                // Use the first valid date from all possible fields
                const rowReleaseDate = formatDate(getValidDate(
                  remediation?.Date,
                  remediation?.InitialReleaseDate,
                  remediation?.ReleaseDate,
                  status?.InitialReleaseDate,
                  status?.ReleaseDate,
                  vuln.ReleaseDate,
                  releaseDate
                ));
                // Build Number: try product name, then remediation/refs description
                if (!buildNumber && remediation && remediation.Description) {
                  buildMatch = getFieldValue(remediation.Description).match(/(\d+\.\d+\.\d+\.\d+)/);
                  if (buildMatch) buildNumber = buildMatch[1];
                }
                if (!buildNumber && Array.isArray(vuln.References)) {
                  for (const ref of vuln.References) {
                    buildMatch = getFieldValue(ref.Description).match(/(\d+\.\d+\.\d+\.\d+)/);
                    if (buildMatch) { buildNumber = buildMatch[1]; break; }
                  }
                }
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
                let impact = '';
                let severity = '';
                if (Array.isArray(vuln.Threats)) {
                  const impactThreat = vuln.Threats.find(t => typeof t.Type === 'string' && t.Type.toLowerCase().includes('impact'));
                  if (impactThreat) impact = getFieldValue(impactThreat.Description);
                  if (!impact && vuln.Threats.length > 0) impact = getFieldValue(vuln.Threats[0].Description);
                  const sevThreat = vuln.Threats.find(t => t.Severity);
                  if (sevThreat) severity = sevThreat.Severity;
                }
                if (!severity && Array.isArray(vuln.CVSSScoreSets) && vuln.CVSSScoreSets.length > 0) {
                  severity = vuln.CVSSScoreSets[0].BaseSeverity || vuln.CVSSScoreSets[0].BaseScore || '';
                }
                // Platform: try to extract from product name or status
                let platform = status.Platform || '';
                if (!platform && productName.match(/ARM|x64|x86|Itanium|Server Core|Datacenter|Essentials|Standard|Pro|Enterprise|Education|LTSC|LTSB|IoT|Azure|Core/)) {
                  platform = productName.match(/ARM|x64|x86|Itanium|Server Core|Datacenter|Essentials|Standard|Pro|Enterprise|Education|LTSC|LTSB|IoT|Azure|Core/)?.[0] || '';
                }
                return (
                  <tr key={pid + '-' + idx + '-' + pidx} className="border-t border-gray-200 dark:border-gray-700">
                    {/* <td className="px-2 py-2 whitespace-nowrap text-gray-900 dark:text-gray-100">{rowReleaseDate}</td> */}
                    <td className="px-2 py-2 whitespace-nowrap text-gray-900 dark:text-gray-100">
                      {getProductIcon(productName) && productName.toLowerCase().includes('microsoft graph') && (
                        <img src={getProductIcon(productName) || ''} alt="Microsoft Graph" className="inline w-5 h-5 mr-1 align-text-bottom" />
                      )}
                      {productName}
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap text-gray-900 dark:text-gray-100">{platform || '-'}</td>
                    <td className="px-2 py-2 whitespace-nowrap text-gray-900 dark:text-gray-100">{impact || '-'}</td>
                    <td className="px-2 py-2 whitespace-nowrap text-gray-900 dark:text-gray-100">{severity || '-'}</td>
                    <td className="px-2 py-2 whitespace-nowrap text-gray-900 dark:text-gray-100">{articleUrl ? (<a href={articleUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">{articleLabel || 'KB Article'}</a>) : '-'}</td>
                    <td className="px-2 py-2 whitespace-nowrap text-gray-900 dark:text-gray-100">{downloadUrl ? (<a href={downloadUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Security Update</a>) : '-'}</td>
                    <td className="px-2 py-2 whitespace-nowrap text-gray-900 dark:text-gray-100">{buildNumber || '-'}</td>
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