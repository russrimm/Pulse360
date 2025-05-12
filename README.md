# M365 Message Center Viewer

A modern web application for viewing Microsoft 365 Message Center messages.

## Features

- Modern, responsive design
- Server-side rendering with Next.js
- TypeScript for type safety
- Tailwind CSS for styling
- Azure Static Web Apps hosting

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/yourusername/mcviewer.git
cd mcviewer
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment

This project is configured to deploy automatically to Azure Static Web Apps when changes are pushed to the main branch.

1. Create an Azure Static Web App
2. Connect it to your GitHub repository
3. Add the `AZURE_STATIC_WEB_APPS_API_TOKEN` secret to your GitHub repository

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## License

MIT 