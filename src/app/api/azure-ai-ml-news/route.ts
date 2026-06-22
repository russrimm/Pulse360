import { NextResponse } from 'next/server';
import { XMLParser } from 'fast-xml-parser';

// Helper to create a guaranteed unique ID
function createUniqueId(item: any, index: number): string {
  const timestamp = Date.now();
  const titleHash = item.title ? 
    item.title.slice(0, 20).replace(/[^a-z0-9]/gi, '-').toLowerCase() : 
    'no-title';
  return `azure-ai-ml-${titleHash}-${index}-${timestamp}`;
}

export async function GET() {
  try {
    const response = await fetch('https://azure.microsoft.com/en-us/blog/category/ai-machine-learning/feed/', { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const xml = await response.text();
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      parseTagValue: false,
    });
    
    const result = parser.parse(xml) as any;
    const items = result.rss?.channel?.item || [];
    const itemArray = Array.isArray(items) ? items : [items];
    
    const news = itemArray.map((item: any, index: number) => ({
      id: item.guid || item.link || createUniqueId(item, index),
      title: item.title || '',
      description: item.description || '',
      content: item['content:encoded'] || item.description || '',
      link: item.link || '',
      publishDate: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
      author: item.author || item['dc:creator'] || 'Azure Team',
      categories: Array.isArray(item.category) ? item.category : (item.category ? [item.category] : ['AI + Machine Learning']),
      image: null
    }));

    return NextResponse.json(news);
  } catch (error) {
    console.error('Error fetching Azure AI + ML news:', error);
    return NextResponse.json({ error: 'Failed to fetch news' }, { status: 500 });
  }
} 