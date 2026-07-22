import React from 'react'
import Image from 'next/image'

export default function AboutPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-12 sm:py-20 flex flex-col items-center">
      <div className="bg-white/80 dark:bg-gray-900/80 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8 w-full">
        <div className="flex flex-col items-center mb-6">
          <Image src="/icons/azure/general/10005-icon-service-Information.svg" alt="About" width={48} height={48} className="mb-2" />
          <h1 className="text-3xl font-bold text-primary-700 dark:text-primary-300 mb-1 text-center">Welcome to Pulse 360°</h1>
          <p className="text-gray-600 dark:text-gray-300 text-center text-lg">Your unified Microsoft update dashboard</p>
        </div>
        <div className="prose dark:prose-invert max-w-none text-gray-800 dark:text-gray-200">

          <p>
            Pulse 360° is a single-pane-of-glass dashboard that aggregates Microsoft&apos;s official update streams — Microsoft 365, Azure, Fabric, Power Platform, Dynamics 365, Copilot, security advisories, and more — into one fast, searchable, filterable interface with full dark-mode support.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-3">Capabilities</h2>

          <h3 className="text-lg font-semibold mt-6 mb-2">📬 Message Center</h3>
          <p>
            Live Microsoft 365 tenant messages pulled directly from Microsoft Graph. Search and filter by product, service area, or impact level. Each message drills through to a full detail view with action type, impact, and last-updated timestamps.
          </p>

          <h3 className="text-lg font-semibold mt-6 mb-2">🔵 Azure Updates</h3>
          <p>
            The complete Azure product update feed with per-item detail pages. Filter by product tag, search by keyword, and sort by publish date.
          </p>

          <h3 className="text-lg font-semibold mt-6 mb-2">🟦 Microsoft 365 Updates</h3>
          <p>
            M365 service update announcements with the same search-and-filter experience as Azure Updates. Covers Exchange, Teams, SharePoint, and all M365 services.
          </p>

          <h3 className="text-lg font-semibold mt-6 mb-2">🛡️ MSRC Security Updates</h3>
          <p>
            The Microsoft Security Response Center CVRF feed with a month picker. Browse every published CVE by month, expand individual entries to see affected products, max severity, CVSS score, KB article links, downloadable patches, weakness (CWE) info, and full revision history.
          </p>

          <h3 className="text-lg font-semibold mt-6 mb-2">🗺️ Release Plans</h3>
          <p>
            Forward-looking release planners for four product families — Azure, Microsoft 365, Microsoft Fabric, and Dynamics 365 / Power Platform — plus a combined roadmap view. Each plan item links to a detail page with full description, timeline, and product context.
          </p>

          <h3 className="text-lg font-semibold mt-6 mb-2">🧵 Fabric &amp; Power Platform Roadmap</h3>
          <p>
            The official Fabric and Power Platform roadmap grouped by product area with collapsible sections and drill-through detail pages.
          </p>

          <h3 className="text-lg font-semibold mt-6 mb-2">📰 Product News</h3>
          <p>
            Aggregated blog and RSS feeds from across the Microsoft ecosystem, all in one hub. Individual sub-feeds include:
          </p>
          <ul>
            <li>Azure AI Foundry</li>
            <li>Azure AI / Machine Learning</li>
            <li>Copilot &amp; Copilot Studio</li>
            <li>Microsoft Fabric Blog</li>
            <li>Power BI, Power Apps, Power Automate &amp; Power Platform</li>
            <li>Semantic Kernel</li>
            <li>Microsoft Learn Blog</li>
            <li>Microsoft News &amp; Tech Community</li>
            <li>VS Code &amp; Windows Blogs</li>
            <li>All Things Azure</li>
          </ul>

          <h3 className="text-lg font-semibold mt-6 mb-2">🕒 Microsoft Product Lifecycle</h3>
          <p>
            End-of-support and retirement dates for Microsoft products, sourced from the official Microsoft Lifecycle export on learn.microsoft.com. Search and filter to track when products in your environment reach end-of-support.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-3">Data Sources</h2>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-2 pr-4 font-semibold">Feature</th>
                <th className="text-left py-2 font-semibold">Source</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-100 dark:border-gray-800">
                <td className="py-2 pr-4 align-top">Message Center</td>
                <td className="py-2 align-top">Microsoft Graph API — <code>serviceAnnouncement/messages</code> (app-only OAuth, requires your tenant credentials)</td>
              </tr>
              <tr className="border-b border-gray-100 dark:border-gray-800">
                <td className="py-2 pr-4 align-top">MSRC Security Updates</td>
                <td className="py-2 align-top">MSRC CVRF API — <code>api.msrc.microsoft.com/cvrf/v3.0</code> (public)</td>
              </tr>
              <tr className="border-b border-gray-100 dark:border-gray-800">
                <td className="py-2 pr-4 align-top">Azure &amp; M365 Updates</td>
                <td className="py-2 align-top">Microsoft RSS feeds via a server-side allowlisted proxy</td>
              </tr>
              <tr className="border-b border-gray-100 dark:border-gray-800">
                <td className="py-2 pr-4 align-top">Fabric / Power Platform Roadmap</td>
                <td className="py-2 align-top">Release Planner API — <code>releaseplanner.azure-api.net</code> (public)</td>
              </tr>
              <tr className="border-b border-gray-100 dark:border-gray-800">
                <td className="py-2 pr-4 align-top">Release Plans</td>
                <td className="py-2 align-top">Release Planner API for Azure, M365, Fabric &amp; Dynamics / Power Platform (public)</td>
              </tr>
              <tr className="border-b border-gray-100 dark:border-gray-800">
                <td className="py-2 pr-4 align-top">Product News</td>
                <td className="py-2 align-top">Public RSS / Atom feeds from <code>devblogs.microsoft.com</code>, <code>techcommunity.microsoft.com</code>, <code>powerplatform.microsoft.com</code>, and other <code>*.microsoft.com</code> blog domains</td>
              </tr>
              <tr>
                <td className="py-2 pr-4 align-top">Microsoft Product Lifecycle</td>
                <td className="py-2 align-top">Microsoft Lifecycle export on <code>learn.microsoft.com</code> (public)</td>
              </tr>
            </tbody>
          </table>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            All public feeds are cached server-side (1–24 hours depending on source). The RSS proxy only fetches from an allowlisted set of <code>*.microsoft.com</code> hosts. No personal data is collected or stored.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-3">Deploy It in Your Own Tenant</h2>
          <p>
            Pulse 360° is open source. If you&apos;d like to run your own instance — pointed at your organization&apos;s tenant for live Message Center data — clone the repo, create an Entra app registration with the <code>ServiceMessage.Read.All</code> permission, add your credentials to <code>.env.local</code>, and deploy to Vercel or any Node.js host.
          </p>
          <p className="mt-2">
            <a
              href="https://github.com/russrimm/Pulse360"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-600 dark:text-primary-400 underline font-medium"
            >
              github.com/russrimm/Pulse360
            </a>
            {' '}— full setup instructions, environment variable reference, and deployment guide are in the README.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-3">How This Site Was Made</h2>
          <p>
            This is a vibe coding project — built entirely through prompt-driven development with GitHub Copilot, without memorizing syntax or spending hours on Stack Overflow. The stack is Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4, and Radix UI. Server Components do the heavy lifting; client components add interactivity.
          </p>
          <p className="mt-2">
            If you&apos;re curious about the approach, reach out to your Microsoft CSAM and ask to schedule a call. Happy to share everything learned along the way — including all the mistakes.
          </p>
          <p className="mt-2">
            For more articles and perspectives, stop by{' '}
            <a
              href="https://www.russrimmerman.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-600 dark:text-primary-400 underline font-medium"
            >
              my blog
            </a>
            .
          </p>

          <p className="mt-8">Thanks for visiting! Feedback, ideas, or just want to say hi — <a href="mailto:russ.rimmerman@microsoft.com?subject=Pulse 360 Feedback" className="text-primary-600 dark:text-primary-400 underline">email me</a>.</p>
        </div>
      </div>
    </main>
  )
}
