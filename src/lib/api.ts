import { Message, M365Update, ProductNews } from './types';
import { XMLParser } from 'fast-xml-parser';

if (process.env.NODE_ENV === 'production') {
  console.log = function () {}
  console.warn = function () {}
  console.error = function () {}
  console.info = function () {}
  console.debug = function () {}
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://graphapirim.azure-api.net/v1.0';
const API_KEY = process.env.NEXT_PUBLIC_API_KEY;
const TENANT_ID = process.env.NEXT_PUBLIC_TENANT_ID;
const CLIENT_ID = process.env.NEXT_PUBLIC_CLIENT_ID;

// Debug environment variables
console.log('Environment variables:', {
  hasApiUrl: !!API_BASE_URL,
  hasApiKey: !!API_KEY,
  hasTenantId: !!TENANT_ID,
  hasClientId: !!CLIENT_ID,
  tenantId: TENANT_ID,
  clientId: CLIENT_ID,
  environment: process.env.NODE_ENV
});

// Only throw in development
if (process.env.NODE_ENV === 'development' && (!API_KEY || !TENANT_ID || !CLIENT_ID)) {
  throw new Error('Missing required environment variables. Please check your .env.local file.');
}

// In production, return empty data instead of throwing
const hasRequiredEnvVars = API_KEY && TENANT_ID && CLIENT_ID;

async function getToken(): Promise<string> {
  if (!hasRequiredEnvVars) {
    throw new Error('Missing required environment variables');
  }

  try {
    const tokenEndpoint = `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`;
    console.log('Getting token from:', tokenEndpoint);
    
    const params = new URLSearchParams();
    if (CLIENT_ID) params.append('client_id', CLIENT_ID);
    params.append('scope', 'https://graph.microsoft.com/.default');
    if (API_KEY) params.append('client_secret', API_KEY);
    params.append('grant_type', 'client_credentials');

    console.log('Token request params:', {
      client_id: CLIENT_ID,
      scope: 'https://graph.microsoft.com/.default',
      grant_type: 'client_credentials',
      has_client_secret: !!API_KEY
    });
    
    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Token request failed:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
        endpoint: tokenEndpoint,
        params: Object.fromEntries(params.entries())
      });
      throw new Error(`Failed to get token: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error('Error getting token:', error);
    throw error;
  }
}

interface GraphApiMessage {
  id: string;
  title: string;
  startDateTime: string;
  lastModifiedDateTime: string;
  category: string;
  severity: string;
  tags: string[];
  services: string[];
  details: {
    name: string;
    value: string;
  }[];
  body: {
    contentType: string;
    content: string;
  };
  isMajorChange: boolean;
  actionRequiredByDateTime?: string;
}

interface GraphApiResponse {
  '@odata.context': string;
  '@odata.nextLink'?: string;
  value: GraphApiMessage[];
}

export async function getMessages(): Promise<Message[]> {
  if (!hasRequiredEnvVars) {
    console.error('Missing required environment variables in production');
    return [];
  }

  try {
    const token = await getToken();
    let allMessages: GraphApiMessage[] = [];
    let nextLink: string | undefined = `${API_BASE_URL}/admin/serviceAnnouncement/messages`;

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'Ocp-Apim-Subscription-Key': API_KEY || ''
    };

    console.log('Making API call to:', nextLink);
    console.log('With headers:', {
      ...headers,
      'Authorization': 'Bearer ***',
      'Ocp-Apim-Subscription-Key': '***'
    });

    while (nextLink) {
      const response = await fetch(nextLink, {
        headers: {
          ...headers,
          'Cache-Control': 'public, max-age=604800' // 7 days in seconds
        }
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', {
          status: response.status,
          statusText: response.statusText,
          url: nextLink,
          errorBody: errorText
        });
        throw new Error(`Failed to fetch messages: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data: GraphApiResponse = await response.json();
      allMessages = [...allMessages, ...data.value];
      nextLink = data['@odata.nextLink'];
    }

    return allMessages.map(message => ({
      id: message.id,
      title: message.title,
      service: message.services,
      lastUpdated: message.lastModifiedDateTime,
      published: message.startDateTime,
      tags: message.tags,
      content: message.body.content,
      summary: message.details?.find(v => v.name === 'Summary')?.value || '',
      details: message.details || [],
      isMajorChange: message.isMajorChange || false,
      actionRequiredByDateTime: message.actionRequiredByDateTime,
      severity: message.severity
    }));
  } catch (error) {
    console.error('Error fetching messages:', error);
    throw error;
  }
}

export async function getMessage(id: string): Promise<Message> {
  if (!hasRequiredEnvVars) {
    throw new Error('Message not found');
  }

  try {
    const token = await getToken();
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'Ocp-Apim-Subscription-Key': API_KEY || '',
      'Cache-Control': 'public, max-age=86400' // Cache for 24 hours
    };

    const response = await fetch(`${API_BASE_URL}/admin/serviceAnnouncement/messages?$filter=id eq '${id}'`, {
      headers,
      next: { revalidate: 86400 } // Enable Next.js cache for 24 hours
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch message: ${response.status} ${response.statusText}`);
    }

    const data: GraphApiResponse = await response.json();
    if (!data.value || data.value.length === 0) {
      throw new Error(`Message not found: ${id}`);
    }

    const message = data.value[0];
    return {
      id: message.id,
      title: message.title,
      service: message.services,
      lastUpdated: message.lastModifiedDateTime,
      published: message.startDateTime,
      tags: message.tags,
      content: message.body.content,
      summary: message.details?.find(v => v.name === 'Summary')?.value || '',
      details: message.details?.filter(detail => !['RoadmapIds', 'FeatureStatusJson'].includes(detail.name)) || [],
      isMajorChange: message.isMajorChange || false,
      actionRequiredByDateTime: message.actionRequiredByDateTime,
      severity: message.severity
    };
  } catch (error) {
    console.error('Error fetching message:', error);
    throw error;
  }
}

export async function getReleasePlans() {
  try {
    const response = await fetch('https://releaseplans.microsoft.com/en-US/allreleaseplans/');
    if (!response.ok) {
      throw new Error('Failed to fetch release plans');
    }
    const data = await response.json();
    return data.results.map((plan: any) => ({
      id: plan['Release Plan ID'],
      title: plan['Feature name'],
      content: plan['Feature details'],
      product: plan['Product name'],
      investmentArea: plan['Investment area'],
      businessValue: plan['Business value'],
      enabledFor: plan['Enabled for'],
      publicPreviewDate: plan['Public preview date'],
      gaDate: plan['GA date'],
      publicPreviewWave: plan['Public Preview Release Wave'],
      gaWave: plan['GA Release Wave'],
      published: plan['Last Gitcommit date'],
      lastUpdated: plan['Last Gitcommit date'],
      tags: [plan['Investment area']],
      service: [plan['Product name']]
    }));
  } catch (error) {
    console.error('Error fetching release plans:', error);
    return [];
  }
}

export interface AzureUpdate {
  id: string;
  title: string;
  description: string;
  productCategories: string[];
  tags: string[];
  products: string[];
  generalAvailabilityDate: string | null;
  previewAvailabilityDate: string | null;
  privatePreviewAvailabilityDate: string | null;
  status: string;
  created: string;
  modified: string;
}

export async function getAzureUpdates(): Promise<AzureUpdate[]> {
  try {
    const response = await fetch('https://www.microsoft.com/releasecommunications/api/v2/azure', {
      next: { revalidate: 3600 } // Revalidate every hour
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.value;
  } catch (error) {
    console.error('Error fetching Azure updates:', error);
    throw error;
  }
}

export async function getM365Updates(): Promise<M365Update[]> {
  try {
    const response = await fetch('https://www.microsoft.com/releasecommunications/api/v2/m365', {
      next: { revalidate: 60 }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.value.map((update: any) => ({
      id: update.id.toString(),
      title: update.title,
      content: update.description,
      product: update.products?.[0] || '',
      status: update.status,
      published: update.created,
      lastUpdated: update.modified,
      tags: update.tags || [],
      service: update.products || [],
      generalAvailabilityDate: update.generalAvailabilityDate,
      previewAvailabilityDate: update.previewAvailabilityDate,
      cloudInstances: update.cloudInstances || [],
      platforms: update.platforms || [],
      releaseRings: update.releaseRings || [],
    }));
  } catch (error) {
    console.error('Error fetching Microsoft 365 updates:', error);
    throw error;
  }
}

export async function getM365Update(id: string): Promise<M365Update> {
  try {
    const response = await fetch(`https://www.microsoft.com/releasecommunications/api/v2/m365/rss/${id}`, {
      next: { revalidate: 3600 } // Revalidate every hour
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const xmlText = await response.text();
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_",
      textNodeName: "#text"
    });
    const result = parser.parse(xmlText);
    const item = result.rss.channel.item;

    // Extract the content from the description
    const content = item.description || '';
    
    // Extract services from the content
    const servicesMatch = content.match(/<strong>Services<\/strong>: (.*?)(?:<br>|<\/p>)/);
    const services = servicesMatch ? 
      servicesMatch[1].replace(/<[^>]*>/g, '').split(',').map((s: string) => s.trim()) : 
      [];

    // Extract status from the content
    const statusMatch = content.match(/<strong>Status<\/strong>: (.*?)(?:<br>|<\/p>)/);
    const status = statusMatch ? statusMatch[1].replace(/<[^>]*>/g, '').trim() : '';

    // Extract dates from the content
    const gaDateMatch = content.match(/<strong>GA date<\/strong>: (.*?)(?:<br>|<\/p>)/);
    const previewDateMatch = content.match(/<strong>Preview date<\/strong>: (.*?)(?:<br>|<\/p>)/);
    const gaDate = gaDateMatch ? gaDateMatch[1].replace(/<[^>]*>/g, '').trim() : '';
    const previewDate = previewDateMatch ? previewDateMatch[1].replace(/<[^>]*>/g, '').trim() : '';

    // Extract tags from the content
    const tagsMatch = content.match(/<strong>Tags<\/strong>: (.*?)(?:<br>|<\/p>)/);
    const tags = tagsMatch ? 
      tagsMatch[1].replace(/<[^>]*>/g, '').split(',').map((tag: string) => tag.trim()) : 
      [];

    // Extract platforms from the content
    const platformsMatch = content.match(/<strong>Platforms<\/strong>: (.*?)(?:<br>|<\/p>)/);
    const platforms = platformsMatch ? 
      platformsMatch[1].replace(/<[^>]*>/g, '').split(',').map((p: string) => p.trim()) : 
      [];

    // Extract cloud instances from the content
    const cloudInstancesMatch = content.match(/<strong>Cloud Instances<\/strong>: (.*?)(?:<br>|<\/p>)/);
    const cloudInstances = cloudInstancesMatch ? 
      cloudInstancesMatch[1].replace(/<[^>]*>/g, '').split(',').map((c: string) => c.trim()) : 
      [];

    // Extract release rings from the content
    const releaseRingsMatch = content.match(/<strong>Release Rings<\/strong>: (.*?)(?:<br>|<\/p>)/);
    const releaseRings = releaseRingsMatch ? 
      releaseRingsMatch[1].replace(/<[^>]*>/g, '').split(',').map((r: string) => r.trim()) : 
      [];

    // Extract the actual content by removing all metadata sections
    const metadataSections = [
      /<strong>Services<\/strong>:.*?(?:<br>|<\/p>)/,
      /<strong>Status<\/strong>:.*?(?:<br>|<\/p>)/,
      /<strong>GA date<\/strong>:.*?(?:<br>|<\/p>)/,
      /<strong>Preview date<\/strong>:.*?(?:<br>|<\/p>)/,
      /<strong>Tags<\/strong>:.*?(?:<br>|<\/p>)/,
      /<strong>Platforms<\/strong>:.*?(?:<br>|<\/p>)/,
      /<strong>Cloud Instances<\/strong>:.*?(?:<br>|<\/p>)/,
      /<strong>Release Rings<\/strong>:.*?(?:<br>|<\/p>)/
    ];

    let finalContent = content;
    metadataSections.forEach(section => {
      finalContent = finalContent.replace(section, '');
    });
    finalContent = finalContent.replace(/<[^>]*>/g, '').trim();

    return {
      id: id,
      title: item.title,
      content: finalContent,
      product: services[0] || '',
      status: status,
      published: item.pubDate,
      lastUpdated: item.pubDate,
      tags: tags,
      service: services,
      generalAvailabilityDate: gaDate,
      previewAvailabilityDate: previewDate,
      cloudInstances: cloudInstances,
      platforms: platforms,
      releaseRings: releaseRings,
    };
  } catch (error) {
    console.error('Error fetching Microsoft 365 update:', error);
    throw error;
  }
}

export async function getPowerAppsNews(): Promise<ProductNews[]> {
  try {
    const response = await fetch('/api/power-apps-news', {
      next: { revalidate: 3600 } // Cache for 1 hour
    });

    if (!response.ok) {
      console.error('Failed to fetch Power Apps news:', {
        status: response.status,
        statusText: response.statusText,
        url: response.url
      });
      return [];
    }

    const xmlText = await response.text();
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_'
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
      categories: Array.isArray(item.category) ? item.category : [item.category].filter(Boolean)
    }));

    // Sort by publish date, newest first
    return news.sort((a, b) => 
      new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime()
    );
  } catch (error) {
    console.error('Error fetching Power Apps news:', error);
    return [];
  }
}

export async function getPowerPlatformNews(): Promise<ProductNews[]> {
  try {
    const response = await fetch('/api/power-platform-news', {
      next: { revalidate: 3600 } // Cache for 1 hour
    });

    if (!response.ok) {
      console.error('Failed to fetch Power Platform news:', {
        status: response.status,
        statusText: response.statusText,
        url: response.url
      });
      return [];
    }

    const xmlText = await response.text();
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_'
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
      categories: Array.isArray(item.category) ? item.category : [item.category].filter(Boolean)
    }));

    // Sort by publish date, newest first
    return news.sort((a, b) => 
      new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime()
    );
  } catch (error) {
    console.error('Error fetching Power Platform news:', error);
    return [];
  }
}

export async function getPowerAutomateNews(): Promise<ProductNews[]> {
  try {
    const response = await fetch('/api/power-automate-news', {
      next: { revalidate: 3600 } // Cache for 1 hour
    });

    if (!response.ok) {
      console.error('Failed to fetch Power Automate news:', {
        status: response.status,
        statusText: response.statusText,
        url: response.url
      });
      return [];
    }

    const xml = await response.text();
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_'
    });
    const result = parser.parse(xml);

    if (!result.rss?.channel?.item) {
      console.error('Invalid RSS feed format for Power Automate news');
      return [];
    }

    return result.rss.channel.item.map((item: any) => ({
      id: item.guid?.['#text'] || item.link,
      title: item.title,
      description: item.description,
      link: item.link,
      publishDate: item.pubDate,
      author: item['dc:creator'] || 'Microsoft Power Automate',
      categories: Array.isArray(item.category) ? item.category : [item.category].filter(Boolean)
    })).sort((a: ProductNews, b: ProductNews) => 
      new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime()
    );
  } catch (error) {
    console.error('Error fetching Power Automate news:', error);
    return [];
  }
}

export async function getPowerBINews(): Promise<ProductNews[]> {
  try {
    const response = await fetch('/api/power-bi-news', {
      next: { revalidate: 3600 } // Cache for 1 hour
    });

    if (!response.ok) {
      console.error('Failed to fetch Power BI news:', {
        status: response.status,
        statusText: response.statusText,
        url: response.url
      });
      return [];
    }

    const xml = await response.text();
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_'
    });
    const result = parser.parse(xml);

    if (!result.rss?.channel?.item) {
      console.error('Invalid RSS feed format for Power BI news');
      return [];
    }

    return result.rss.channel.item.map((item: any) => ({
      id: item.guid?.['#text'] || item.link,
      title: item.title,
      description: item.description,
      link: item.link,
      publishDate: item.pubDate,
      author: item['dc:creator'] || 'Microsoft Power BI',
      categories: Array.isArray(item.category) ? item.category : [item.category].filter(Boolean)
    })).sort((a: ProductNews, b: ProductNews) => 
      new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime()
    );
  } catch (error) {
    console.error('Error fetching Power BI news:', error);
    return [];
  }
}

export async function getCopilotStudioNews(): Promise<ProductNews[]> {
  try {
    const response = await fetch('/api/copilot-studio-news', {
      next: { revalidate: 3600 } // Cache for 1 hour
    });

    if (!response.ok) {
      console.error('Failed to fetch Copilot Studio news:', {
        status: response.status,
        statusText: response.statusText,
        url: response.url
      });
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
          let link = 'https://learn.microsoft.com/en-us/power-platform/release-plan/2024wave2/microsoft-copilot-studio/planned-features';
          
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
            categories: ['Release Plan', '2024 Wave 2']
          });
        }
      }
    }

    return features;
  } catch (error) {
    console.error('Error fetching Copilot Studio news:', error);
    return [];
  }
}

export async function getLearnBlogNews(): Promise<ProductNews[]> {
  try {
    const response = await fetch('/api/learn-blog-news', {
      next: { revalidate: 3600 } // Cache for 1 hour
    });

    if (!response.ok) {
      console.error('Failed to fetch Learn Blog news:', {
        status: response.status,
        statusText: response.statusText,
        url: response.url
      });
      return [];
    }

    const xmlText = await response.text();
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_'
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
      categories: Array.isArray(item.category) ? item.category : [item.category].filter(Boolean)
    }));

    // Sort by publish date, newest first
    return news.sort((a, b) => 
      new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime()
    );
  } catch (error) {
    console.error('Error fetching Learn Blog news:', error);
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

    const news: ProductNews[] = Array.from(items).map((item) => {
      const title = item.querySelector('title')?.textContent || '';
      const link = item.querySelector('link')?.textContent || '';
      const description = item.querySelector('description')?.textContent || '';
      const pubDate = item.querySelector('pubDate')?.textContent || '';
      const author = item.getElementsByTagName('dc:creator')[0]?.textContent?.trim() || '';
      const categories = Array.from(item.querySelectorAll('category')).map(cat => cat.textContent || '');
      const publishDate = new Date(pubDate).toISOString();

      return {
        id: `${link}-${publishDate}`,
        title,
        link,
        description,
        publishDate,
        author,
        categories
      };
    });

    // Filter to only posts from the past 12 months
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
    const filteredNews = news.filter(n => {
      const date = new Date(n.publishDate)
      // Debug log
      if (date < twelveMonthsAgo) console.log('Filtered out (too old):', n.title, n.publishDate)
      return date >= twelveMonthsAgo
    });

    return filteredNews.sort((a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime());
  } catch (error) {
    console.error('Error fetching Microsoft Blog news:', error);
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
    
    const news: ProductNews[] = Array.from(items).map((item) => {
      const title = item.getElementsByTagName('title')[0]?.textContent || '';
      const link = item.getElementsByTagName('link')[0]?.textContent || '';
      const description = item.getElementsByTagName('description')[0]?.textContent || '';
      const pubDate = item.getElementsByTagName('pubDate')[0]?.textContent || '';
      const author = item.getElementsByTagName('dc:creator')[0]?.textContent || '';
      const categories = Array.from(item.getElementsByTagName('category')).map(cat => cat.textContent || '');
      
      return {
        id: `${link}-${pubDate}`,
        title,
        link,
        description,
        publishDate: new Date(pubDate).toISOString(),
        author,
        categories
      };
    });

    return news.sort((a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime());
  } catch (error) {
    console.error('Error fetching Tech Community news:', error);
    throw error;
  }
}

export async function getCopilotNews(): Promise<ProductNews[]> {
  try {
    const response = await fetch('/api/copilot-news', {
      next: { revalidate: 3600 } // Cache for 1 hour
    });

    if (!response.ok) {
      console.error('Failed to fetch Copilot news:', {
        status: response.status,
        statusText: response.statusText,
        url: response.url
      });
      return [];
    }

    const xmlText = await response.text();
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_'
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
      categories: Array.isArray(item.category) ? item.category : [item.category].filter(Boolean)
    }));

    return news.sort((a, b) => 
      new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime()
    );
  } catch (error) {
    console.error('Error fetching Copilot news:', error);
    return [];
  }
}

export async function getFabricBlogNews(): Promise<ProductNews[]> {
  try {
    const response = await fetch('https://blog.fabric.microsoft.com/en-us/blog/feed/', {
      next: { revalidate: 3600 } // Cache for 1 hour
    })
    if (!response.ok) {
      console.error('Failed to fetch Fabric Blog news:', {
        status: response.status,
        statusText: response.statusText,
        url: response.url
      })
      return []
    }
    const xmlText = await response.text()
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_'
    })
    const result = parser.parse(xmlText)
    const items = result.rss.channel.item
    const news: ProductNews[] = items.map((item: any) => ({
      id: item.guid?.['#text'] || item.link,
      title: item.title,
      link: item.link,
      description: item.description,
      publishDate: item.pubDate,
      author: item['dc:creator'] || '',
      categories: Array.isArray(item.category) ? item.category : [item.category].filter(Boolean)
    }))
    return news.sort((a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime())
  } catch (error) {
    console.error('Error fetching Fabric Blog news:', error)
    return []
  }
}

export async function getSemanticKernelNews(): Promise<ProductNews[]> {
  try {
    const response = await fetch('/api/semantic-kernel-news', {
      next: { revalidate: 3600 }
    })
    if (!response.ok) {
      console.error('Failed to fetch Semantic Kernel news:', {
        status: response.status,
        statusText: response.statusText,
        url: response.url
      })
      return []
    }
    const xmlText = await response.text()
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_'
    })
    const result = parser.parse(xmlText)
    const items = result.rss.channel.item
    const news: ProductNews[] = items.map((item: any) => ({
      id: item.guid?.['#text'] || item.link,
      title: item.title,
      link: item.link,
      description: item.description,
      publishDate: item.pubDate,
      author: item['dc:creator'] || '',
      categories: Array.isArray(item.category) ? item.category : [item.category].filter(Boolean)
    }))
    return news.sort((a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime())
  } catch (error) {
    console.error('Error fetching Semantic Kernel news:', error)
    return []
  }
}

export async function getAzureAIFoundryNews(): Promise<ProductNews[]> {
  try {
    const response = await fetch('/api/azure-ai-foundry-news', {
      next: { revalidate: 3600 }
    })
    if (!response.ok) {
      console.error('Failed to fetch Azure AI Foundry news:', {
        status: response.status,
        statusText: response.statusText,
        url: response.url
      })
      return []
    }
    const xmlText = await response.text()
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_'
    })
    const result = parser.parse(xmlText)
    const items = result.rss.channel.item
    const news: ProductNews[] = items.map((item: any) => ({
      id: item.guid?.['#text'] || item.link,
      title: item.title,
      link: item.link,
      description: item.description,
      publishDate: item.pubDate,
      author: item['dc:creator'] || '',
      categories: Array.isArray(item.category) ? item.category : [item.category].filter(Boolean)
    }))
    return news.sort((a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime())
  } catch (error) {
    console.error('Error fetching Azure AI Foundry news:', error)
    return []
  }
} 