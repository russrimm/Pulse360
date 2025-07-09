"use client";
import React, { useState } from 'react';

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
  const [open, setOpen] = useState(false);
  const cveId = Array.isArray(vuln.CVE) ? vuln.CVE[0] : typeof vuln.CVE === 'string' ? vuln.CVE : vuln.ID;
  const msrcUrl = cveId ? `https://msrc.microsoft.com/update-guide/vulnerability/${cveId}` : undefined;
  const cveOrgUrl = cveId ? `https://cve.org/CVERecord?id=${cveId}` : undefined;
  return (
    <div className="bg-white/80 dark:bg-gray-800/50 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700/50 p-6 mb-4">
      {/* Summary Row */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-2 gap-2">
        {/* Large Title */}
        <div className="mb-2 text-xl font-bold text-gray-900 dark:text-white">
          {getFieldValue(vuln.Title)}
        </div>
        <div className="flex items-center gap-2">
          <a href={msrcUrl} target="_blank" rel="noopener noreferrer" className="text-lg font-semibold text-primary-700 dark:text-primary-400 hover:underline">
            {cveId}
          </a>
        </div>
      </div>
      {cveOrgUrl && (
        <div className="mb-2 text-xs text-gray-700 dark:text-gray-300">
          CVE.org link: <a href={cveOrgUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline hover:text-blue-800">{cveId}</a>
        </div>
      )}
      {/* Weakness (CWE) info */}
      {Array.isArray(vuln?.ProblemTypes) && vuln.ProblemTypes.length > 0 &&
        Array.isArray(vuln.ProblemTypes[0]?.Description) && vuln.ProblemTypes[0].Description.length > 0 && (
          <div className="mb-2 text-xs text-gray-700 dark:text-gray-300">
            Weakness{' '}
            {vuln.ProblemTypes[0].Description[0].Type && (
              <span>{vuln.ProblemTypes[0].Description[0].Type}: </span>
            )}
            {vuln.ProblemTypes[0].Description[0].Value}
          </div>
      )}
      <div className="flex flex-wrap gap-4 text-xs text-gray-500 dark:text-gray-400 mb-2">
        {revisionHistory && revisionHistory.length > 0 && (
          <span><span className="font-semibold">Last Updated:</span> {formatDate(revisionHistory[revisionHistory.length - 1].Date)}</span>
        )}
        {vuln.Threats && vuln.Threats.length > 0 && vuln.Threats[0].Severity && (
          <span><span className="font-semibold">Severity:</span> {vuln.Threats[0].Severity}</span>
        )}
      </div>
      <div className="mb-2 text-sm text-gray-700 dark:text-gray-300 line-clamp-3">{getFieldValue(vuln.Description)}</div>
      <button
        className="mt-2 mb-2 px-4 py-1 rounded bg-primary-600 text-white text-xs font-semibold hover:bg-primary-700 transition"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={`cve-details-${vuln.ID}`}
        type="button"
      >
        {open ? 'Hide Details' : 'Show Details'}
      </button>
      {open && (
        <div id={`cve-details-${vuln.ID}`} className="mt-4 space-y-4">
          {/* Table-style details layout */}
          {Array.isArray(vuln.ProductStatuses) && vuln.ProductStatuses.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100">
                <thead className="bg-gray-100 dark:bg-gray-900">
                  <tr>
                    <th className="px-2 py-2 text-left">Product</th>
                    <th className="px-2 py-2 text-left">Impact</th>
                    <th className="px-2 py-2 text-left">Max Severity</th>
                    <th className="px-2 py-2 text-left">Article</th>
                    <th className="px-2 py-2 text-left">Download</th>
                  </tr>
                </thead>
                <tbody>
                  {vuln.ProductStatuses.map((status, idx) => {
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
                      // DEBUG: log all possible date fields
                      console.log('remediation.Date', remediation?.Date, 'remediation.InitialReleaseDate', remediation?.InitialReleaseDate, 'remediation.ReleaseDate', remediation?.ReleaseDate, 'status.InitialReleaseDate', status?.InitialReleaseDate, 'status.ReleaseDate', status?.ReleaseDate, 'vuln.ReleaseDate', vuln.ReleaseDate, 'releaseDate', releaseDate);
                      // Use the first valid date from all possible fields
                      const rowReleaseDate = getValidDate(
                        remediation?.Date,
                        remediation?.InitialReleaseDate,
                        remediation?.ReleaseDate,
                        status?.InitialReleaseDate,
                        status?.ReleaseDate,
                        vuln.ReleaseDate,
                        releaseDate
                      );
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
                      return (
                        <tr key={pid + '-' + idx + '-' + pidx} className="border-t border-gray-200 dark:border-gray-700">
                          <td className="px-2 py-2 whitespace-nowrap text-gray-900 dark:text-gray-100">{productName}</td>
                          <td className="px-2 py-2 whitespace-nowrap text-gray-900 dark:text-gray-100">{impact || '-'}</td>
                          <td className="px-2 py-2 whitespace-nowrap text-gray-900 dark:text-gray-100">{severity || '-'}</td>
                          <td className="px-2 py-2 whitespace-nowrap text-gray-900 dark:text-gray-100">
                            {articleUrl ? (
                              <a href={articleUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">{articleLabel || 'KB Article'}</a>
                            ) : '-'}</td>
                          <td className="px-2 py-2 whitespace-nowrap text-gray-900 dark:text-gray-100">
                            {downloadUrl ? (
                              <a href={downloadUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Security Update</a>
                            ) : '-'}</td>
                        </tr>
                      );
                    });
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            // fallback: old details layout
            <>
              {vuln.CVE && (
                <div className="text-xs text-gray-700 dark:text-gray-300"><span className="font-semibold">CVE(s):</span>{' '}
                  {Array.isArray(vuln.CVE)
                    ? vuln.CVE.join(', ')
                    : typeof vuln.CVE === 'string'
                      ? vuln.CVE
                      : ''}
                </div>
              )}
              {vuln.ProductStatuses && (
                <div className="text-xs text-gray-700 dark:text-gray-300">
                  <span className="font-semibold">Affected Products:</span>
                  {formatProductStatuses(vuln.ProductStatuses, productTree)}
                </div>
              )}
              {vuln.Remediations && (
                <div className="text-xs text-gray-700 dark:text-gray-300">
                  <span className="font-semibold">Remediations:</span>
                  {formatRemediations(vuln.Remediations)}
                </div>
              )}
              {vuln.Threats && (
                <div className="text-xs text-gray-700 dark:text-gray-300">
                  <span className="font-semibold">Threats:</span>
                  {formatThreats(vuln.Threats, productTree)}
                </div>
              )}
              {vuln.References && (
                <div className="text-xs text-gray-700 dark:text-gray-300">
                  <span className="font-semibold">References:</span>
                  {formatReferences(vuln.References)}
                </div>
              )}
              {/* Support Article Link */}
              {Array.isArray(vuln.References) && (() => {
                const supportRef = vuln.References.find(ref => ref.URL && ref.URL.includes('support.microsoft.com'));
                return supportRef ? (
                  <div className="mb-2">
                    <a
                      href={supportRef.URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block px-3 py-1 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
                    >
                      View Microsoft Support Article
                    </a>
                  </div>
                ) : null;
              })()}
              {vuln.Acknowledgments && (
                <div className="text-xs text-gray-700 dark:text-gray-300">
                  <span className="font-semibold">Acknowledgments:</span>
                  {formatAcknowledgments(vuln.Acknowledgments)}
                </div>
              )}
              {revisionHistory && (
                <div className="text-xs text-gray-700 dark:text-gray-300">
                  <span className="font-semibold">Revision History:</span>
                  {formatRevisionHistory(revisionHistory)}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
} 