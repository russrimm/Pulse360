"use client"
import { useEffect, useState } from "react";
import { ProductNewsCard } from "@/components/ProductNewsCard";
import { ProductNewsLayout } from "@/components/ProductNewsLayout";

const FEED_URL = "https://blogs.windows.com/feed/";

function parseFeed(xml: string) {
  const parser = new window.DOMParser();
  const doc = parser.parseFromString(xml, "application/xml");
  let items = Array.from(doc.getElementsByTagName("item"));
  if (items.length === 0) {
    items = Array.from(doc.getElementsByTagName("entry"));
  }
  return items.map((item, idx) => {
    function getText(tag: string) {
      let el = item.getElementsByTagName(tag)[0];
      if (el && el.textContent) return el.textContent;
      el = item.getElementsByTagNameNS("*", tag)[0];
      if (el && el.textContent) return el.textContent;
      el = item.getElementsByTagName("content:encoded")[0];
      if (el && el.textContent) return el.textContent;
      el = item.getElementsByTagName("dc:creator")[0];
      if (el && el.textContent) return el.textContent;
      return "";
    }
    let link = getText("link");
    if (!link) {
      const linkEl = item.getElementsByTagName("link")[0];
      if (linkEl && linkEl.getAttribute) {
        link = linkEl.getAttribute("href") || "";
      }
    }
    return {
      id: idx + '-' + (getText("guid") || getText("id") || link),
      title: getText("title"),
      link,
      publishDate: getText("pubDate") || getText("updated") || getText("published"),
      description: getText("description") || getText("content") || getText("content:encoded"),
      author: getText("creator") || getText("author") || getText("dc:creator") || "Windows Blog Team",
      categories: Array.from(item.getElementsByTagName("category")).map(cat => cat.textContent || ""),
    };
  });
}

export default function WindowsNewsPage() {
  const [news, setNews] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFeed = async () => {
    setIsLoading(true);
    setIsError(false);
    setError(null);
    try {
      const res = await fetch(`/api/proxy-rss?url=${encodeURIComponent(FEED_URL)}`);
      if (!res.ok) throw new Error('Failed to fetch Windows blog feed');
      const xml = await res.text();
      const items = parseFeed(xml);
      setNews(items);
      if (items.length === 0) setError('No items found in feed.');
    } catch (e: any) {
      setIsError(true);
      setError(e.message || 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchFeed(); }, []);

  return (
    <ProductNewsLayout
      title="Windows"
      description="Latest updates from the Windows Blog."
      icon="https://winblogs.thesourcemediaassets.com/2022/09/cropped-Windows11IconTransparent512-32x32.png"
    >
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      ) : isError ? (
        <div className="text-center py-12">
          <p className="text-red-600 dark:text-red-400">{error || 'Failed to load news. Please try again later.'}</p>
          <button 
            onClick={fetchFeed}
            className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {news.map((item) => (
            <ProductNewsCard 
              key={item.id} 
              news={item} 
              productIcon="https://winblogs.thesourcemediaassets.com/2022/09/cropped-Windows11IconTransparent512-32x32.png"
            />
          ))}
        </div>
      )}
    </ProductNewsLayout>
  );
} 