import { NextResponse } from 'next/server';
import Parser from 'rss-parser';

const parser = new Parser({
  customFields: {
    item: ['description', 'content:encoded', 'author', 'category']
  }
});

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
    const feed = await parser.parseURL('https://azure.microsoft.com/en-us/blog/category/ai-machine-learning/feed/');
    
    const news = feed.items.map((item: any, index: number) => ({
      id: item.guid || item.link || createUniqueId(item, index),
      title: item.title || '',
      description: item.description || item.contentSnippet || '',
      content: item['content:encoded'] || item.content || item.description || '',
      link: item.link || '',
      publishDate: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
      author: item.author || item.creator || 'Azure Team',
      categories: Array.isArray(item.category) ? item.category : (item.category ? [item.category] : ['AI + Machine Learning']),
      image: null
    }));

    return NextResponse.json(news);
  } catch (error) {
    console.error('Error fetching Azure AI + ML news:', error);
    return NextResponse.json({ error: 'Failed to fetch news' }, { status: 500 });
  }
} 