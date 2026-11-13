import type { ProductNews } from '@/lib/types';

/**
 * Browser-side RSS/Atom parser shared by feeds that are fetched through
 * `/api/proxy-rss`. Tries RSS <item> first, then Atom <entry>.
 */
export function parseGenericFeed(xml: string, defaultAuthor: string): ProductNews[] {
  const doc = new window.DOMParser().parseFromString(xml, 'application/xml');
  let items = Array.from(doc.getElementsByTagName('item'));
  if (items.length === 0) {
    items = Array.from(doc.getElementsByTagName('entry'));
  }

  return items.map((item, index) => {
    function getText(tag: string): string {
      let element = item.getElementsByTagName(tag)[0];
      if (element?.textContent) return element.textContent;
      element = item.getElementsByTagNameNS('*', tag)[0];
      if (element?.textContent) return element.textContent;
      element = item.getElementsByTagName('content:encoded')[0];
      if (element?.textContent) return element.textContent;
      element = item.getElementsByTagName('dc:creator')[0];
      if (element?.textContent) return element.textContent;
      return '';
    }

    // Atom <link> is an element with an href attribute instead of text.
    let link = getText('link');
    if (!link) {
      link = item.getElementsByTagName('link')[0]?.getAttribute('href') || '';
    }

    return {
      id: `${index}-${getText('guid') || getText('id') || link}`,
      title: getText('title'),
      link,
      publishDate: getText('pubDate') || getText('updated') || getText('published'),
      description: getText('description') || getText('content') || getText('content:encoded'),
      author: getText('creator') || getText('author') || getText('dc:creator') || defaultAuthor,
      categories: Array.from(item.getElementsByTagName('category')).map(
        category => category.textContent || ''
      ),
    };
  });
}

export async function fetchProxiedFeed(
  feedUrl: string,
  label: string,
  defaultAuthor: string
): Promise<ProductNews[]> {
  const response = await fetch(`/api/proxy-rss?url=${encodeURIComponent(feedUrl)}`);
  if (!response.ok) throw new Error(`Failed to fetch ${label} feed`);
  return parseGenericFeed(await response.text(), defaultAuthor);
}
