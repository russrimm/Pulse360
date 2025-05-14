# Microsoft Pulse 360°

A modern, responsive web application that provides real-time updates and announcements from Microsoft's product ecosystem. Built with Next.js, TypeScript, and Tailwind CSS.

## Features

### Core Functionality
- Real-time message updates from Microsoft's product ecosystem
- Dark/Light mode support with system preference detection
- Responsive design for all device sizes
- Automatic revalidation of content every 7 days

### Message Display
- Clean, modern card-based layout for messages
- Support for major change indicators
- Publication and last update timestamps
- Tag-based categorization
- Service/product association with icons

### Product Integration
Supports the following Microsoft products with custom icons:
- Microsoft 365 (including all M365 products)
- Power Platform
  - Power Apps
  - Power Automate
  - Power BI
  - Microsoft Dataverse
- Microsoft Teams
- SharePoint Online
- OneDrive for Business
- Microsoft Stream
- Exchange Online
- Microsoft Forms
- Microsoft Intune
- Microsoft Planner
- Microsoft Entra
- Dynamics 365 Apps
- Microsoft Viva
- Microsoft Purview
- Microsoft Defender XDR

### Filtering Capabilities
- Product-based filtering with persistent selections
- Visual filter indicator showing number of active filters
- Clear all filters option
- Local storage for filter preferences

### UI/UX Features
- Smooth animations and transitions
- Hover effects on interactive elements
- Accessible design with proper ARIA labels
- Responsive navigation
- Dot pattern background with blur effects
- Transparent product pills with outline styling

### Contact & Social
- Direct email contact
- LinkedIn profile integration
- GitHub repository link

## Technical Stack
- **Framework**: Next.js 14
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: SVG-based product icons
- **Font**: Inter (Google Fonts)
- **State Management**: React Hooks
- **Data Fetching**: Server Components with revalidation

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

## Development

- Built with modern React patterns and best practices
- TypeScript for type safety
- Tailwind CSS for styling
- Server-side rendering for optimal performance
- Automatic dark mode support
- Responsive design principles

## Contributing

Feel free to submit issues and enhancement requests!

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contact

- **Author**: Russ Rimmerman
- **Role**: Cloud Solution Architect
- **Email**: russ.rimmerman@microsoft.com
- **LinkedIn**: [russrimm](https://www.linkedin.com/in/russrimm)
- **GitHub**: [russrimm](https://github.com/russrimm) 