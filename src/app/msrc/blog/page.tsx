import React from 'react';
import { XMLParser } from 'fast-xml-parser';

export const dynamic = 'force-dynamic';

interface RssItem {
  title: string;
  link: string;
  pubDate: string;
  description?: string;
}

async function getFeed(): Promise<RssItem[]> {
  try {
    const response = await fetch('https://msrc.microsoft.com/blog/feed', { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const xml = await response.text();
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
    });
    
    const result = parser.parse(xml) as any;
    const items = result.rss?.channel?.item || [];
    
    // Normalize to array
    return Array.isArray(items) ? items : [items];
  } catch (error) {
    return [];
  }
}

export default async function MSRCBlogPage() {
  let items: any[] = [];
  try {
    items = await getFeed();
  } catch (e) {
    return <div className="max-w-2xl mx-auto py-8 px-4"><h1 className="text-2xl font-bold mb-6">MSRC Blog</h1><p className="text-red-600">Failed to load RSS feed.</p></div>;
  }
  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white dark:drop-shadow-md">Microsoft Security Response Center Blog</h1>
      <ul className="space-y-6">
        {items.map((item, index) => (
          <li key={item.guid || item.link || index} className="border-b pb-4">
            <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-lg font-semibold text-primary-700 dark:text-primary-200 hover:underline">{item.title}</a>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{item.pubDate && new Date(item.pubDate).toLocaleDateString()}</div>
            {item.description && <p className="mt-2 text-gray-700 dark:text-gray-300 text-sm">{item.description}</p>}
          </li>
        ))}
      </ul>
    </div>
  );
} 