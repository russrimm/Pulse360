import { FuturePastReleasePlanList } from '@/components/FuturePastReleasePlanList';
import { getReleasePlans } from '@/lib/api';
import { releasePlanServiceIcons } from '@/lib/releasePlanIcons';
import Image from 'next/image';
import Link from 'next/link';

export const metadata = {
  title: 'Dynamics & Power Platform Release Plans | Pulse 360',
  description: 'Dynamics 365 & Power Platform public release wave features grouped by product.',
};

interface ReleasePlanIndexItem {
  id: string;
  title: string;
  product: string;
  tags: string[];
  investmentArea: string;
  publicPreviewDate: string;
  gaDate: string;
}

function formatDate(value?: string) {
  if (!value) return '';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

// Map specific product names to preferred display labels
function getDisplayProductName(product: string) {
  if (product === 'Microsoft Copilot Studio') return 'Copilot Studio';
  return product;
}

export default async function DynamicsPowerReleasePlansPage() {
  const plans = await getReleasePlans();

  if (!plans || plans.length === 0) {
    return (
      <main className="w-full flex flex-col items-center bg-white dark:bg-black pt-10 pb-24">
        <div className="w-full max-w-5xl px-4 md:px-8">
          <header className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-50">
              Dynamics & Power Platform Release Plans
            </h1>
            <p className="mt-3 max-w-2xl text-sm md:text-base text-gray-600 dark:text-gray-400">
              Unable to load release plan data at this time. Please try again later.
            </p>
          </header>
          <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/30 p-6 text-sm text-red-700 dark:text-red-300">
            The upstream Microsoft release plans feed returned no data. This can happen temporarily
            if their API changes or rate limits. We automatically fall back once data is available
            again.
          </div>
          <div className="mt-10">
            <Link
              href="/release-plans"
              className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:underline"
            >
              ← Back to Release Plans Hub
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // Group plans by product
  const groups: Record<string, ReleasePlanIndexItem[]> = {};
  for (const p of plans) {
    const item: ReleasePlanIndexItem = {
      id: p.id,
      title: p.title,
      product: p.product,
      tags: p.tags || [],
      investmentArea: p.investmentArea || p.tags?.[0] || '',
      publicPreviewDate: p.publicPreviewDate,
      gaDate: p.gaDate,
    };
    groups[p.product] = groups[p.product] || [];
    groups[p.product].push(item);
  }

  // Sort products by descending number of updates, then alphabetically
  const orderedProducts = Object.keys(groups).sort((a, b) => {
    const diff = groups[b].length - groups[a].length;
    return diff !== 0 ? diff : a.localeCompare(b);
  });

  // Split into two macro groups (Dynamics vs Power Platform)
  // Override: certain products belong with Dynamics although name lacks the word 'Dynamics'
  const dynamicsOverride = new Set<string>(['Finance and Operations cross-app capabilities']);
  const isDynamics = (p: string) => /dynamics/i.test(p) || dynamicsOverride.has(p);
  const dynamicsProducts = orderedProducts.filter(p => isDynamics(p));
  const powerProducts = orderedProducts.filter(p => !isDynamics(p));

  const renderProductAccordion = (product: string) => {
    const productPlans = groups[product];
    const displayName = getDisplayProductName(product);
    return (
      <details
        key={product}
        className="group bg-white/70 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm backdrop-blur-sm overflow-hidden open:shadow-md transition-all"
      >
        <summary className="cursor-pointer list-none flex items-center gap-4 px-5 py-4 sm:py-5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {releasePlanServiceIcons[product] && (
              <Image
                src={releasePlanServiceIcons[product]}
                alt=""
                width={32}
                height={32}
                className="w-8 h-8"
              />
            )}
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
                {displayName}
              </h3>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                {productPlans.length} update{productPlans.length !== 1 && 's'}
              </p>
            </div>
          </div>
          <svg
            className="w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform group-open:rotate-180"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </summary>
        <div className="px-5 pb-5 sm:pb-6 pt-0">
          {(() => {
            const sorted = productPlans.slice().sort((a, b) => {
              const aTime = a.gaDate ? new Date(a.gaDate).getTime() : Number.POSITIVE_INFINITY;
              const bTime = b.gaDate ? new Date(b.gaDate).getTime() : Number.POSITIVE_INFINITY;
              if (aTime !== bTime) return aTime - bTime;
              const aPP = a.publicPreviewDate
                ? new Date(a.publicPreviewDate).getTime()
                : Number.POSITIVE_INFINITY;
              const bPP = b.publicPreviewDate
                ? new Date(b.publicPreviewDate).getTime()
                : Number.POSITIVE_INFINITY;
              if (aPP !== bPP) return aPP - bPP;
              return a.title.localeCompare(b.title);
            });
            // Normalize to start of today for day-level comparison
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const todayTime = today.getTime();
            const future = sorted.filter(p => {
              if (!p.gaDate) return true;
              const gaDate = new Date(p.gaDate);
              gaDate.setHours(0, 0, 0, 0);
              const t = gaDate.getTime();
              return !isNaN(t) && t >= todayTime;
            });
            const past = sorted.filter(p => {
              if (!p.gaDate) return false;
              const gaDate = new Date(p.gaDate);
              gaDate.setHours(0, 0, 0, 0);
              const t = gaDate.getTime();
              return !isNaN(t) && t < todayTime;
            });
            return <FuturePastReleasePlanList future={future} past={past} />;
          })()}
        </div>
      </details>
    );
  };

  const powerCount = powerProducts.reduce((acc, p) => acc + groups[p].length, 0);
  const dynamicsCount = dynamicsProducts.reduce((acc, p) => acc + groups[p].length, 0);

  return (
    <main className="w-full flex flex-col items-center bg-gradient-to-b from-white via-gray-50 to-white dark:from-black dark:via-gray-900 dark:to-black pt-10 pb-24">
      <div className="w-full max-w-7xl px-4 md:px-8">
        <header className="mb-10">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-50">
            Dynamics & Power Platform Roadmap
          </h1>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10">
          {powerProducts.length > 0 && (
            <section
              aria-labelledby="power-platform-group"
              className="flex flex-col rounded-3xl border border-gray-200/60 dark:border-gray-800/70 bg-white/80 dark:bg-gray-900/60 backdrop-blur-lg shadow-[0_4px_18px_-6px_rgba(0,0,0,0.20)] dark:shadow-[0_6px_30px_-10px_rgba(0,0,0,0.70)] p-5 md:p-6 transition-all"
            >
              <div className="flex items-center justify-between mb-2">
                <h2
                  id="power-platform-group"
                  className="text-base md:text-lg font-semibold tracking-tight text-gray-900 dark:text-gray-100"
                >
                  Power Platform
                  <span className="ml-2 text-xs md:text-sm font-medium text-gray-500 dark:text-gray-400">
                    {powerCount} update{powerCount !== 1 && 's'}
                  </span>
                </h2>
              </div>
              <div className="mt-3 space-y-5">{powerProducts.map(renderProductAccordion)}</div>
            </section>
          )}

          {dynamicsProducts.length > 0 && (
            <section
              aria-labelledby="dynamics-group"
              className="flex flex-col rounded-3xl border border-gray-200/60 dark:border-gray-800/70 bg-white/80 dark:bg-gray-900/60 backdrop-blur-lg shadow-[0_4px_18px_-6px_rgba(0,0,0,0.20)] dark:shadow-[0_6px_30px_-10px_rgba(0,0,0,0.70)] p-5 md:p-6 transition-all"
            >
              <div className="flex items-center justify-between mb-2">
                <h2
                  id="dynamics-group"
                  className="text-base md:text-lg font-semibold tracking-tight text-gray-900 dark:text-gray-100"
                >
                  Dynamics 365
                  <span className="ml-2 text-xs md:text-sm font-medium text-gray-500 dark:text-gray-400">
                    {dynamicsCount} update{dynamicsCount !== 1 && 's'}
                  </span>
                </h2>
              </div>
              <div className="mt-3 space-y-5">{dynamicsProducts.map(renderProductAccordion)}</div>
            </section>
          )}
        </div>

        <div className="mt-14 flex items-center gap-6 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
          <Link
            href="/release-plans"
            className="font-medium text-primary-600 dark:text-primary-400 hover:underline"
          >
            ← Back to Release Plans Hub
          </Link>
          <a
            href="https://learn.microsoft.com/dynamics365/release-plans/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
          >
            Official Release Plans
          </a>
        </div>
      </div>
    </main>
  );
}
