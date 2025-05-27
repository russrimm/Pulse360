# Microsoft Pulse 360°

A modern, filterable, multi-product roadmap and message center for Microsoft Fabric, Power Platform, and Microsoft 365. Built with Next.js App Router, TypeScript, Tailwind CSS, Shadcn UI, and Radix UI.

## Features

### Core Functionality
- Real-time updates and release plans for Microsoft 365, Fabric, Power Platform, Azure, and more
- Unified, filterable roadmap and message center UI
- Responsive, mobile-first design
- Dark/Light mode with system preference
- Accessible, modern design system (Shadcn UI, Radix, Tailwind)
- Product icons and badges for all major Microsoft services

### Pages & Navigation
- **/message-center**: Microsoft 365 Message Center with global search/filter, product badges, impact pills, and drillthrough detail pages
- **/fabric-roadmap**: Fabric and Power Platform roadmap, grouped by product, with collapsible sections and filter/search
- **/release-plans**: Release planner for all products, grouped and filterable
- **/product-news**: Aggregated product news, with subpages for Power Platform, Power BI, Power Automate, Microsoft News, Tech Community, Learn Blog, Copilot, and Copilot Studio
- **/m365-updates**: Microsoft 365 update feed
- **/azure-updates**: Azure update feed
- **/map** and **/test-map**: (Experimental) Map-based visualizations
- **/message/[id]**: Message Center detail page with product tab, message ID badge, impact pills, and meta info
- **/fabric-roadmap/[id]**, **/release-plan/[id]**, **/m365-update/[id]**, **/azure-update/[id]**: Drillthrough detail pages for roadmap, release, and update items

### Filtering & Search
- Global search bar with hint text ("Search by Title, Product, or Message ID..." on /message-center)
- Dynamic filters for Product, Area, Date, and Major Changes (pulsing red when active)
- Case- and whitespace-insensitive filtering
- Filter buttons styled for mobile/desktop, equal widths on mobile
- "Showing X" label after Filters heading

### Message Center & Card UI
- Message cards: compact, modern, with product badges, message ID badge, impact pills (User/Admin), and "New"/"Updated" pills
- Impact pills: squared, neon borders, always left-justified, with vertical divider
- Product badges: fixed width, never truncated, always aligned
- Message ID: always in its own badge at the top left of the detail page
- Major Change: pulsing red bar when applicable
- Drillthrough pages: consistent layout, product tab, meta info, and seamless backgrounds

### Roadmap & Release Planner
- Accordion/collapsible sections per product, only shown if data exists
- Product names always centered in accordion trigger
- Consistent, modern accordion styles (Radix UI)
- Drillthrough for each roadmap/release item

### Product News
- Product-news cards: centered titles, dates, and descriptions
- No tag/category label at lower left; entire card is clickable
- "New" and "Updated" indicators below message ID
- Product buttons: equal size, grid layout on mobile

### Design & UX
- Modern navigation with Radix Popover, icons, and responsive layout
- Footer with branding
- All pills and badges: consistent size, spacing, and style
- All UI/UX tweaks from iterative feedback

### Technical Stack
- **Framework**: Next.js 15 App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS, Shadcn UI, Radix UI
- **Icons**: @fabric-msft/svg-icons, custom SVGs
- **State Management**: React Hooks, RSC
- **Data Fetching**: Server Components, Next.js caching (disabled for large API responses)
- **Validation**: Zod, next-safe-action

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser

## API Integration
- Data fetched from Microsoft Fabric, Power Platform, and M365 public APIs
- Server-side proxy for bot-protected endpoints
- ProductId GUIDs mapped to ProductName
- Handles large API responses (Next.js cache disabled if >2MB)

## Development
- Modern React patterns, functional components, RORO pattern
- TypeScript for type safety
- Tailwind CSS, Shadcn UI, Radix UI for styling
- Server-side rendering and RSC for performance
- Error boundaries and user-friendly error handling
- Responsive, accessible, and mobile-first

## Contributing
Feel free to submit issues and enhancement requests!

## License
MIT License - see the LICENSE file for details.

## Contact
- **Author**: Russ Rimmerman
- **Role**: Cloud Solution Architect
- **Email**: russ.rimmerman@microsoft.com
- **LinkedIn**: [russrimm](https://www.linkedin.com/in/russrimm)
- **GitHub**: [russrimm](https://github.com/russrimm) 