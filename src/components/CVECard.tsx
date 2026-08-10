"use client";
import Image from 'next/image';
import { getProductIcon } from '@/lib/getProductIcon';
import { getMsrcFieldValue, getMsrcImpact, getMsrcSeverity } from '@/lib/msrc';
import { SurfaceCard } from './SurfaceCard';
import { StatusChip, type ChipTone } from './StatusChip';

interface Vulnerability {
  ID: string;
  Title?: any;
  Description?: any;
  CVE?: string | string[];
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

const SEVERITY_TONES: Record<string, ChipTone> = {
  critical: 'critical',
  important: 'warn',
  moderate: 'info',
  low: 'neutral',
};

function severityTone(severity: string): ChipTone {
  return SEVERITY_TONES[severity.trim().toLowerCase()] ?? 'neutral';
}

export default function CVECard({ vuln, productTree }: CVECardProps) {
  // Stable identity for the card. Rendered table text repeats across CVEs, so
  // this is the only reliable way to tell two cards apart.
  const cveIdentifier = Array.isArray(vuln.CVE) ? vuln.CVE.join(', ') : vuln.CVE || vuln.ID;
  const cardSeverity = getMsrcSeverity(vuln.Threats);
  const cardImpact = getMsrcImpact(vuln.Threats);
  const tone = severityTone(cardSeverity);

  return (
    <SurfaceCard
      as="article"
      accent={tone}
      className="gap-3"
      data-testid="cve-card"
      data-cve={cveIdentifier}
    >
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <h3 className="type-h3 min-w-0 flex-1 text-ink [overflow-wrap:anywhere]">
          {getFieldValue(vuln.Title)}
        </h3>
        <div className="flex shrink-0 flex-wrap items-center gap-1.5">
          {cardSeverity ? (
            <StatusChip tone={tone} size="md" title="Maximum severity">
              {cardSeverity}
            </StatusChip>
          ) : null}
          {cardImpact ? (
            <StatusChip tone="neutral" size="md" title="Impact">
              {cardImpact}
            </StatusChip>
          ) : null}
        </div>
      </div>
      <p className="type-meta font-medium text-ink-subtle">{cveIdentifier}</p>
      <div className="-mr-4 -mb-4 mt-1 overflow-x-auto rounded-tl-lg border-t border-l border-line">
        <table className="min-w-full text-left text-xs text-ink">
          <thead className="bg-surface-sunken text-ink-muted">
            <tr>
              <th scope="col" className="px-3 py-2 font-semibold">
                Product
              </th>
              <th scope="col" className="px-3 py-2 font-semibold">
                Platform
              </th>
              <th scope="col" className="px-3 py-2 font-semibold">
                Impact
              </th>
              <th scope="col" className="px-3 py-2 font-semibold">
                Max Severity
              </th>
              <th scope="col" className="px-3 py-2 font-semibold">
                Article
              </th>
              <th scope="col" className="px-3 py-2 font-semibold">
                Download
              </th>
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
                        <tr key={pid + '-' + idx + '-' + pidx} className="border-t border-line">
                    <td className="px-3 py-2 text-ink">
                      {productIcon && productName.toLowerCase().includes('microsoft graph') && (
                        <Image src={productIcon} alt="" width={20} height={20} className="inline w-5 h-5 mr-1 align-text-bottom" />
                      )}
                      {productName}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-ink-muted">{platform || '—'}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-ink-muted">{impact || '—'}</td>
                          <td className="px-3 py-2 whitespace-nowrap">{severity ? <StatusChip tone={severityTone(severity)}>{severity}</StatusChip> : '—'}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{articleUrl ? (<a href={articleUrl} target="_blank" rel="noopener noreferrer" className="rounded text-accent hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-accent">{articleLabel || 'KB Article'}</a>) : <span className="text-ink-subtle">—</span>}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{downloadUrl ? (<a href={downloadUrl} target="_blank" rel="noopener noreferrer" className="rounded text-accent hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-accent">Security Update</a>) : <span className="text-ink-subtle">—</span>}</td>
                        </tr>
                      );
                    });
                  })}
                </tbody>
              </table>
            </div>
    </SurfaceCard>
  );
}