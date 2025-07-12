"use client";
import React, { useEffect, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { Navigation, Pagination, Autoplay, Thumbs } from "swiper/modules";
import { format, isAfter, subDays, parseISO } from "date-fns";
import { ProductFilter } from "@/components/ProductFilter";
import { useRef } from "react";
import { createPortal } from "react-dom";
import { Dialog } from '@headlessui/react';
import { AdjustmentsHorizontalIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { usePathname } from 'next/navigation';

const FEEDS = [
  { name: "Semantic Kernel", url: "/api/semantic-kernel-news" },
  { name: "Power Platform", url: "/api/power-platform-news" },
  { name: "Power BI", url: "/api/power-bi-news" },
  { name: "Power Automate", url: "/api/power-automate-news" },
  { name: "Power Apps", url: "/api/power-apps-news" },
  { name: "Microsoft News", url: "/api/microsoft-news" },
  { name: "Learn Blog", url: "/api/learn-blog-news" },
  { name: "Fabric Blog", url: "/api/fabric-blog-news" },
  { name: "Azure AI Foundry", url: "/api/azure-ai-foundry-news" },
  { name: "Engineering@Microsoft", url: "https://devblogs.microsoft.com/engineering-at-microsoft/feed/" },
  { name: "VS Code", url: "https://devblogs.microsoft.com/vscode-blog/feed/", icon: "/icons/azure/devops/VisualStudioCode.svg" },
];

type Update = {
  title: string;
  link: string;
  pubDate: string;
  description: string;
  feed: string;
};

function parseFeed(xml: string, feedName: string): Update[] {
  const parser = new window.DOMParser();
  const doc = parser.parseFromString(xml, "application/xml");
  const items = Array.from(doc.querySelectorAll("item"));
  return items.map((item) => ({
    title: item.querySelector("title")?.textContent || "",
    link: item.querySelector("link")?.textContent || "",
    pubDate: item.querySelector("pubDate")?.textContent || "",
    description: item.querySelector("description")?.textContent || "",
    feed: feedName,
  }));
}

export default function HomePage() {
  const pathname = usePathname();
  const [updates, setUpdates] = useState<Update[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterBtnRef = useRef<HTMLButtonElement>(null);
  const [dialogPos, setDialogPos] = useState<{top: number, left: number}>({top: 0, left: 0});
  const [selectedFeeds, setSelectedFeeds] = useState<string[]>(FEEDS.map(f => f.name));
  const [pendingFeeds, setPendingFeeds] = useState<string[]>(selectedFeeds);
  const [thumbsSwiper, setThumbsSwiper] = useState<any>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    async function fetchFeeds() {
      let allUpdates: Update[] = [];
      for (const feed of FEEDS) {
        if (!selectedFeeds.includes(feed.name)) continue;
        try {
          const res = await fetch(feed.url);
          if (!res.ok) continue;
          const xml = await res.text();
          const feedUpdates = parseFeed(xml, feed.name);
          allUpdates = allUpdates.concat(feedUpdates);
        } catch (e) {
          // ignore
        }
      }
      // Filter to last 30 days
      const now = new Date();
      allUpdates = allUpdates.filter((u) => {
        const date = u.pubDate ? new Date(u.pubDate) : null;
        return date && isAfter(date, subDays(now, 30));
      });
      // Sort by date desc
      allUpdates.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
      // Remove duplicate titles (keep first occurrence)
      const seenTitles = new Set<string>();
      allUpdates = allUpdates.filter(u => {
        if (seenTitles.has(u.title)) return false;
        seenTitles.add(u.title);
        return true;
      });
      setUpdates(allUpdates);
      setLoading(false);
    }
    fetchFeeds();
  }, [selectedFeeds]);

  return (
    <main className="w-full flex flex-col items-center justify-center bg-white dark:bg-black pt-8" style={{ minWidth: 0, width: '100%', minHeight: 0 }}>
      {pathname === '/home' && (
        <>
          {/* Desktop: fixed top-right */}
          <div className="hidden lg:block fixed top-32 right-8 z-30">
            <button
              ref={filterBtnRef}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 text-white font-semibold shadow hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-400"
              onClick={() => {
                setPendingFeeds(selectedFeeds);
                setIsFilterOpen(true);
                if (filterBtnRef.current) {
                  const rect = filterBtnRef.current.getBoundingClientRect();
                  const dropdownWidth = 320; // approximate width of the dropdown
                  let left = rect.left + window.scrollX;
                  // On desktop, always align right; on mobile/tablet, clamp left
                  if (window.innerWidth >= 1024) { // lg breakpoint
                    left = rect.right + window.scrollX - dropdownWidth;
                    if (left < 16) left = 16;
                  } else {
                    const maxLeft = window.innerWidth - dropdownWidth - 16; // 16px margin
                    if (left > maxLeft) left = maxLeft;
                  }
                  setDialogPos({ top: rect.bottom + window.scrollY + 4, left });
                }
              }}
            >
              <AdjustmentsHorizontalIcon className="w-5 h-5" />
              Filter Feeds
            </button>
            {isFilterOpen && typeof window !== 'undefined' && createPortal(
              <Dialog
                open={isFilterOpen}
                onClose={() => setIsFilterOpen(false)}
                className="fixed z-50 w-80"
                style={{ top: dialogPos.top, left: dialogPos.left }}
              >
                <Dialog.Panel className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full p-8 border border-gray-200 dark:border-gray-700">
                  <button
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 dark:hover:text-white"
                    onClick={() => setIsFilterOpen(false)}
                    aria-label="Close"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                  <Dialog.Title className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Select Feeds to Display</Dialog.Title>
                  <div className="flex flex-col gap-3 mb-6">
                    {FEEDS.map(feed => (
                      <label key={feed.name} className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={pendingFeeds.includes(feed.name)}
                          onChange={e => {
                            if (e.target.checked) {
                              setPendingFeeds([...pendingFeeds, feed.name]);
                            } else {
                              setPendingFeeds(pendingFeeds.filter(f => f !== feed.name));
                            }
                          }}
                          className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                        />
                        <span className="text-gray-800 dark:text-gray-200 font-medium">{feed.name}</span>
                      </label>
                    ))}
                  </div>
                  <button
                    className="w-full px-4 py-2 rounded-lg bg-primary-600 text-white font-semibold shadow hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-400"
                    onClick={() => {
                      setSelectedFeeds(pendingFeeds);
                      setIsFilterOpen(false);
                    }}
                  >
                    Apply
                  </button>
                </Dialog.Panel>
              </Dialog>,
              document.body
            )}
          </div>
          {/* Mobile/Tablet: below nav links */}
          <div className="block lg:hidden w-full px-4 mt-4 mb-2">
            <button
              ref={filterBtnRef}
              className="flex items-center gap-2 w-full justify-center px-4 py-2 rounded-lg bg-primary-600 text-white font-semibold shadow hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-400"
              onClick={() => {
                setPendingFeeds(selectedFeeds);
                setIsFilterOpen(true);
                if (filterBtnRef.current) {
                  const rect = filterBtnRef.current.getBoundingClientRect();
                  const dropdownWidth = 320; // approximate width of the dropdown
                  let left = rect.left + window.scrollX;
                  // Clamp left so dropdown doesn't overflow right edge
                  const maxLeft = window.innerWidth - dropdownWidth - 16; // 16px margin
                  if (left > maxLeft) left = maxLeft;
                  setDialogPos({ top: rect.bottom + window.scrollY + 4, left });
                }
              }}
            >
              <AdjustmentsHorizontalIcon className="w-5 h-5" />
              Filter Feeds
            </button>
            {isFilterOpen && typeof window !== 'undefined' && createPortal(
              <Dialog
                open={isFilterOpen}
                onClose={() => setIsFilterOpen(false)}
                className="fixed z-50 w-80"
                style={{ top: dialogPos.top, left: dialogPos.left }}
              >
                <Dialog.Panel className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full p-8 border border-gray-200 dark:border-gray-700">
                  <button
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 dark:hover:text-white"
                    onClick={() => setIsFilterOpen(false)}
                    aria-label="Close"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                  <Dialog.Title className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Select Feeds to Display</Dialog.Title>
                  <div className="flex flex-col gap-3 mb-6">
                    {FEEDS.map(feed => (
                      <label key={feed.name} className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={pendingFeeds.includes(feed.name)}
                          onChange={e => {
                            if (e.target.checked) {
                              setPendingFeeds([...pendingFeeds, feed.name]);
                            } else {
                              setPendingFeeds(pendingFeeds.filter(f => f !== feed.name));
                            }
                          }}
                          className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                        />
                        <span className="text-gray-800 dark:text-gray-200 font-medium">{feed.name}</span>
                      </label>
                    ))}
                  </div>
                  <button
                    className="w-full px-4 py-2 rounded-lg bg-primary-600 text-white font-semibold shadow hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-400"
                    onClick={() => {
                      setSelectedFeeds(pendingFeeds);
                      setIsFilterOpen(false);
                    }}
                  >
                    Apply
                  </button>
                </Dialog.Panel>
              </Dialog>,
              document.body
            )}
          </div>
        </>
      )}
      {loading ? (
        null
      ) : updates.length === 0 ? (
        <div className="flex items-center justify-center w-full h-[60vh] text-lg text-gray-500 dark:text-gray-400">No updates found.</div>
      ) : (
        <>
          <Swiper
            modules={[Navigation, Pagination, Autoplay, Thumbs]}
            navigation
            pagination={{ clickable: true }}
            autoplay={{ delay: 5000, disableOnInteraction: false }}
            spaceBetween={48}
            slidesPerView={1}
            direction="horizontal"
            style={{ width: '90vw', height: '60vh', maxWidth: 1800, maxHeight: 700 }}
            thumbs={{ swiper: thumbsSwiper && !thumbsSwiper.destroyed ? thumbsSwiper : null }}
            onSlideChange={swiper => setActiveIndex(swiper.activeIndex)}
          >
            {updates.map((update, idx) => (
              <SwiperSlide key={idx} className="flex items-center justify-center h-[70vh]">
                <a
                  href={update.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block bg-white/95 dark:bg-gray-900/95 rounded-2xl shadow-xl hover:shadow-primary-400/40 transition-shadow border border-gray-200 dark:border-gray-700 p-14 max-w-3xl w-[70vw] max-h-[70vh] h-auto flex flex-col justify-center mx-auto"
                  style={{ minHeight: '420px' }}
                >
                  <div className="mb-2 text-xs text-primary-600 font-semibold uppercase tracking-wide text-center">
                    {update.feed}
                  </div>
                  <div className="font-bold text-3xl text-gray-900 dark:text-white mb-4 text-center"
                    style={{
                      display: '-webkit-box',
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      WebkitLineClamp: typeof window !== 'undefined' && window.innerWidth < 640 ? 'unset' : 2
                    }}
                  >
                    {update.title}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-6 text-center">
                    {update.pubDate ? format(new Date(update.pubDate), "MMM d, yyyy") : ""}
                  </div>
                  <div className="text-lg text-gray-700 dark:text-gray-300 line-clamp-6 text-center" dangerouslySetInnerHTML={{ __html: update.description }} />
                </a>
              </SwiperSlide>
            ))}
          </Swiper>
          <div className="w-full flex justify-center mt-2">
            <Swiper
              modules={[Thumbs]}
              onSwiper={setThumbsSwiper}
              spaceBetween={32}
              slidesPerView={Math.min(updates.length, 4)}
              watchSlidesProgress
              freeMode
              className="thumbs-swiper px-2 py-2"
              style={{ width: '90vw', minHeight: 100, height: 120, maxWidth: 1800 }}
            >
              {updates.map((update, idx) => (
                <SwiperSlide
                  key={idx}
                  className={`relative cursor-pointer rounded-2xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-md hover:shadow-xl transition-shadow px-2 py-1 flex flex-col items-start justify-between text-left h-[120px] w-[420px] max-w-full overflow-hidden${activeIndex === idx ? ' shadow-xl border-2 border-primary-400 dark:border-primary-300 z-30 animate-glow' : ''}`}
                  style={{ minWidth: 320, maxWidth: 420, maxHeight: 120, boxShadow: activeIndex === idx ? '0 8px 32px 0 rgba(59,130,246,0.25), 0 0 0 4px #60a5fa' : undefined }}
                >
                  <div className="mb-2 text-sm text-primary-700 dark:text-primary-400 font-semibold uppercase tracking-wide truncate w-full">
                    {update.feed}
                  </div>
                  <div className="font-bold text-lg text-gray-900 dark:text-white mb-2 line-clamp-3 w-full">
                    {update.title}
                  </div>
                  <div className="absolute top-2 right-3 text-xs text-gray-500 dark:text-gray-400">
                    {update.pubDate ? format(new Date(update.pubDate), "MMM d, yyyy") : ""}
                  </div>
                  <div className="text-base text-gray-700 dark:text-gray-300 line-clamp-4 w-full" dangerouslySetInnerHTML={{ __html: update.description }} />
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </>
      )}
      <style jsx global>{`
        @keyframes glow {
          0% { box-shadow: 0 0 0 0 #60a5fa, 0 8px 32px 0 rgba(59,130,246,0.25); }
          50% { box-shadow: 0 0 0 6px #60a5fa, 0 8px 32px 0 rgba(59,130,246,0.25); }
          100% { box-shadow: 0 0 0 0 #60a5fa, 0 8px 32px 0 rgba(59,130,246,0.25); }
        }
        .animate-glow {
          animation: glow 1.5s infinite;
        }
        .swiper-pagination-bullet {
          background: #9ca3af99 !important; /* bg-gray-400/60 */
          opacity: 1 !important;
        }
        .swiper-pagination-bullet-active {
          background: #3b82f6 !important; /* bg-primary-500 */
        }
        .swiper-pagination {
          margin-top: -180px !important;
        }
        .thumbs-swiper {
          margin-top: 32px !important;
        }
      `}</style>
    </main>
  );
} 