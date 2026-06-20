import { XMLParser } from 'fast-xml-parser';
import { ProductNews } from './types';

export async function getPowerAppsNews(): Promise<ProductNews[]> {
  try {
    const response = await fetch('/api/power-apps-news', {
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
      return [];
    }

    const xmlText = await response.text();
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
    });
    const result = parser.parse(xmlText);
    const items = result.rss.channel.item;

    const news: ProductNews[] = items.map((item: any) => ({
      id: item.guid?.['#text'] || item.link,
      title: item.title,
      link: item.link,
      description: item.description,
      publishDate: item.pubDate,
      author: item['dc:creator'] || '',
      categories: Array.isArray(item.category) ? item.category : [item.category].filter(Boolean),
    }));

    return news.sort(
      (a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime()
    );
  } catch (error) {
    return [];
  }
}

export async function getPowerPlatformNews(): Promise<ProductNews[]> {
  try {
    const response = await fetch('/api/power-platform-news', {
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
      return [];
    }

    const xmlText = await response.text();
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
    });
    const result = parser.parse(xmlText);
    const items = result.rss.channel.item;

    const news: ProductNews[] = items.map((item: any) => ({
      id: item.guid?.['#text'] || item.link,
      title: item.title,
      link: item.link,
      description: item.description,
      publishDate: item.pubDate,
      author: item['dc:creator'] || '',
      categories: Array.isArray(item.category) ? item.category : [item.category].filter(Boolean),
    }));

    return news.sort(
      (a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime()
    );
  } catch (error) {
    return [];
  }
}

export async function getPowerAutomateNews(): Promise<ProductNews[]> {
  try {
    const response = await fetch('/api/power-automate-news', {
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
      return [];
    }

    const xml = await response.text();
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
    });
    const result = parser.parse(xml);

    if (!result.rss?.channel?.item) {
      return [];
    }

    return result.rss.channel.item
      .map((item: any) => ({
        id: item.guid?.['#text'] || item.link,
        title: item.title,
        description: item.description,
        link: item.link,
        publishDate: item.pubDate,
        author: item['dc:creator'] || 'Microsoft Power Automate',
        categories: Array.isArray(item.category) ? item.category : [item.category].filter(Boolean),
      }))
      .sort(
        (a: ProductNews, b: ProductNews) =>
          new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime()
      );
  } catch (error) {
    return [];
  }
}

export async function getPowerBINews(): Promise<ProductNews[]> {
  try {
    const response = await fetch('/api/power-bi-news', {
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
      return [];
    }

    const xml = await response.text();
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
    });
    const result = parser.parse(xml);

    if (!result.rss?.channel?.item) {
      return [];
    }

    return result.rss.channel.item
      .map((item: any) => ({
        id: item.guid?.['#text'] || item.link,
        title: item.title,
        description: item.description,
        link: item.link,
        publishDate: item.pubDate,
        author: item['dc:creator'] || 'Microsoft Power BI',
        categories: Array.isArray(item.category) ? item.category : [item.category].filter(Boolean),
      }))
      .sort(
        (a: ProductNews, b: ProductNews) =>
          new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime()
      );
  } catch (error) {
    return [];
  }
}

export async function getCopilotStudioNews(): Promise<ProductNews[]> {
  try {
    const response = await fetch('/api/copilot-studio-news', {
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
      return [];
    }

    const html = await response.text();

    // Extract the table data using regex
    const tableRegex = /<table[^>]*>([\s\S]*?)<\/table>/g;
    const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/g;
    const cellRegex = /<td[^>]*>([\s\S]*?)<\/td>/g;

    const tables = html.match(tableRegex) || [];
    const features: ProductNews[] = [];

    for (const table of tables) {
      const rows = table.match(rowRegex) || [];

      // Skip header row
      for (let i = 1; i < rows.length; i++) {
        const cells = rows[i].match(cellRegex);
        if (cells && cells.length >= 4) {
          const featureCell = cells[0];
          const enabledFor = cells[1].replace(/<[^>]*>/g, '').trim();
          const publicPreview = cells[2].replace(/<[^>]*>/g, '').trim();
          const generalAvailability = cells[3].replace(/<[^>]*>/g, '').trim();

          // Extract feature name and link
          let feature = featureCell.replace(/<[^>]*>/g, '').trim();
          let link =
            'https://learn.microsoft.com/en-us/power-platform/release-plan/2024wave2/microsoft-copilot-studio/planned-features';

          // Try to find a link in the feature cell
          const linkMatch = featureCell.match(/<a[^>]*href="([^"]*)"[^>]*>([^<]*)<\/a>/);
          if (linkMatch && linkMatch[1]) {
            const href = linkMatch[1];
            if (href.startsWith('/')) {
              link = `https://learn.microsoft.com${href}`;
            } else if (href.startsWith('http')) {
              link = href;
            }
            // Update feature name to match the link text
            feature = linkMatch[2].trim();
          }

          features.push({
            id: `feature-${features.length + 1}`,
            title: feature,
            description: `Enabled for: ${enabledFor}\nPublic Preview: ${publicPreview}\nGeneral Availability: ${generalAvailability}`,
            link: link,
            publishDate: new Date().toISOString(), // Use current date since these are planned features
            author: '', // Remove author information
            categories: ['Release Plan', '2024 Wave 2'],
          });
        }
      }
    }

    return features;
  } catch (error) {
    return [];
  }
}

export async function getLearnBlogNews(): Promise<ProductNews[]> {
  try {
    const response = await fetch('/api/learn-blog-news', {
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
      return [];
    }

    const xmlText = await response.text();
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
    });
    const result = parser.parse(xmlText);
    const items = result.rss.channel.item;

    const news: ProductNews[] = items.map((item: any) => ({
      id: item.guid?.['#text'] || item.link,
      title: item.title,
      link: item.link,
      description: item.description,
      publishDate: item.pubDate,
      author: item['dc:creator'] || '',
      categories: Array.isArray(item.category) ? item.category : [item.category].filter(Boolean),
    }));

    return news.sort(
      (a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime()
    );
  } catch (error) {
    return [];
  }
}

export async function getMicrosoftNews(): Promise<ProductNews[]> {
  try {
    const response = await fetch('/api/microsoft-news');
    if (!response.ok) {
      throw new Error('Failed to fetch Microsoft Blog news');
    }

    const xml = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, 'text/xml');
    const items = doc.querySelectorAll('item');

    const news: ProductNews[] = Array.from(items).map(item => {
      const title = item.querySelector('title')?.textContent || '';
      const link = item.querySelector('link')?.textContent || '';
      const description = item.querySelector('description')?.textContent || '';
      const pubDate = item.querySelector('pubDate')?.textContent || '';
      const author = item.getElementsByTagName('dc:creator')[0]?.textContent?.trim() || '';
      const categories = Array.from(item.querySelectorAll('category')).map(
        cat => cat.textContent || ''
      );
      const publishDate = new Date(pubDate).toISOString();

      return {
        id: `${link}-${publishDate}`,
        title,
        link,
        description,
        publishDate,
        author,
        categories,
      };
    });

    // Filter to only posts from the past 12 months
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
    const filteredNews = news.filter(n => {
      const date = new Date(n.publishDate);
      return date >= twelveMonthsAgo;
    });

    return filteredNews.sort(
      (a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime()
    );
  } catch (error) {
    throw error;
  }
}

export async function getTechCommunityNews(): Promise<ProductNews[]> {
  try {
    const response = await fetch('/api/tech-community-news');
    if (!response.ok) {
      throw new Error('Failed to fetch Tech Community news');
    }
    const xmlText = await response.text();
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
    const items = xmlDoc.getElementsByTagName('item');

    const news: ProductNews[] = Array.from(items).map(item => {
      const title = item.getElementsByTagName('title')[0]?.textContent || '';
      const link = item.getElementsByTagName('link')[0]?.textContent || '';
      const description = item.getElementsByTagName('description')[0]?.textContent || '';
      const pubDate = item.getElementsByTagName('pubDate')[0]?.textContent || '';
      const author = item.getElementsByTagName('dc:creator')[0]?.textContent || '';
      const categories = Array.from(item.getElementsByTagName('category')).map(
        cat => cat.textContent || ''
      );

      return {
        id: `${link}-${pubDate}`,
        title,
        link,
        description,
        publishDate: new Date(pubDate).toISOString(),
        author,
        categories,
      };
    });

    return news.sort(
      (a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime()
    );
  } catch (error) {
    throw error;
  }
}

export async function getCopilotNews(): Promise<ProductNews[]> {
  try {
    const response = await fetch('/api/copilot-news', {
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
      return [];
    }

    const xmlText = await response.text();
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
    });
    const result = parser.parse(xmlText);
    const items = result.rss.channel.item;

    const news: ProductNews[] = items.map((item: any) => ({
      id: item.guid?.['#text'] || item.link,
      title: item.title,
      link: item.link,
      description: item.description,
      publishDate: item.pubDate,
      author: item['dc:creator'] || 'Microsoft',
      categories: Array.isArray(item.category) ? item.category : [item.category].filter(Boolean),
    }));

    return news.sort(
      (a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime()
    );
  } catch (error) {
    return [];
  }
}

export async function getFabricBlogNews(): Promise<ProductNews[]> {
  const res = await fetch('/api/fabric-blog-news');
  if (!res.ok) throw new Error('Failed to fetch Fabric Blog news');
  return res.json();
}

export async function getSemanticKernelNews(): Promise<ProductNews[]> {
  try {
    const response = await fetch('/api/semantic-kernel-news', {
      next: { revalidate: 3600 },
    });
    if (!response.ok) {
      return [];
    }
    const xmlText = await response.text();
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
    });
    const result = parser.parse(xmlText);
    const items = result.rss.channel.item;
    const news: ProductNews[] = items.map((item: any) => ({
      id: item.guid?.['#text'] || item.link,
      title: item.title,
      link: item.link,
      description: item.description,
      publishDate: item.pubDate,
      author: item['dc:creator'] || '',
      categories: Array.isArray(item.category) ? item.category : [item.category].filter(Boolean),
    }));
    return news.sort(
      (a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime()
    );
  } catch (error) {
    return [];
  }
}

export async function getAzureAIFoundryNews(): Promise<ProductNews[]> {
  try {
    const response = await fetch('/api/azure-ai-foundry-news', {
      next: { revalidate: 3600 },
    });
    if (!response.ok) {
      return [];
    }
    const xmlText = await response.text();
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
    });
    const result = parser.parse(xmlText);
    const items = result.rss.channel.item;
    const news: ProductNews[] = items.map((item: any) => ({
      id: item.guid?.['#text'] || item.link,
      title: item.title,
      link: item.link,
      description: item.description,
      publishDate: item.pubDate,
      author: item['dc:creator'] || '',
      categories: Array.isArray(item.category) ? item.category : [item.category].filter(Boolean),
    }));
    return news.sort(
      (a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime()
    );
  } catch (error) {
    return [];
  }
}
