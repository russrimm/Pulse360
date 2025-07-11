import React from 'react';
import Parser from 'rss-parser';

export const dynamic = 'force-dynamic';

async function getFeed() {
  const parser = new Parser();
  const feed = await parser.parseURL('https://msrc.microsoft.com/blog/feed');
  return feed.items;
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
        {items.map(item => (
          <li key={item.guid || item.link} className="border-b pb-4">
            <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-lg font-semibold text-primary-700 dark:text-primary-200 hover:underline">{item.title}</a>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{item.pubDate && new Date(item.pubDate).toLocaleDateString()}</div>
            {item.contentSnippet && <p className="mt-2 text-gray-700 dark:text-gray-300 text-sm">{item.contentSnippet}</p>}
          </li>
        ))}
      </ul>
    </div>
  );
} 