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

## Development Workflow: From Zero to Production

This guide walks you through setting up and building this project using GitHub, GitHub Copilot, VS Code, Node.js, and related tools.

### 1. Prerequisites
- [Git](https://git-scm.com/) installed
- [Node.js](https://nodejs.org/) (v18+ recommended)
- [VS Code](https://code.visualstudio.com/)
- [GitHub Copilot extension for VS Code](https://marketplace.visualstudio.com/items?itemName=GitHub.copilot)
- A [GitHub account](https://github.com/)

### 2. Create a New Repository on GitHub
- Go to [github.com](https://github.com/) and log in.
- Click the **+** (top right) → **New repository**.
- Name your repo (e.g., `microsoft-pulse-360`), add a description, and choose visibility.
- (Optional) Initialize with a README, .gitignore, and license.
- Click **Create repository**.

### 3. Clone the Repository Locally
- Copy the repository URL (e.g., `https://github.com/yourusername/microsoft-pulse-360.git`).
- Open VS Code.
- Open the Command Palette (`Cmd+Shift+P` / `Ctrl+Shift+P`).
- Type `Git: Clone`, select it, and paste the repo URL.
- Choose a local folder and open it in VS Code.

### 4. Install Dependencies
```bash
npm install
```

### 5. Set Up GitHub Copilot
- Install the GitHub Copilot extension in VS Code.
- Sign in with your GitHub account.
- Start typing code—Copilot will suggest completions and snippets.

### 6. Develop Your Application
- Use Copilot to scaffold components, pages, and logic.
- Example: Create a new file, start typing a React component, and accept Copilot suggestions.
- Use VS Code features: IntelliSense, formatting, debugging, etc.

### 7. Run the App Locally
```bash
npm run dev
```
- Open [http://localhost:3000](http://localhost:3000) in your browser.

### 8. Commit and Push Changes
- Use the Source Control panel in VS Code to stage, commit, and push changes:
```bash
git add .
git commit -m "Your commit message"
git push
```

### 9. (Optional) Add Screenshots and Documentation
- Take screenshots of your running app (Cmd+Shift+4 on macOS).
- Save them in `Resources/Assets/Screenshots/`.
- Embed them in your README.md using Markdown:
  ```markdown
  ![Home Screen](Resources/Assets/Screenshots/home.png)
  ```

### 10. (Optional) Deploy
- Deploy to an Azure Static Web App or similar offering.

### Making Microsoft Graph API Calls for M365 Message Center

To view Microsoft 365 Message Center messages via the Graph API, follow these steps:

#### 1. Register an Azure AD Application
- Go to the [Azure Portal](https://portal.azure.com/).
- Navigate to **Azure Active Directory** > **App registrations** > **New registration**.
- Enter a name (e.g., `Pulse360GraphApp`).
- Set the redirect URI (for web apps, e.g., `http://localhost:3000/api/auth/callback`).
- Click **Register**.

#### 2. Configure API Permissions
- In your app registration, go to **API permissions** > **Add a permission**.
- Select **Microsoft Graph** > **Application permissions**.
- Add `ServiceMessage.Read.All` (required for Message Center).
- Click **Grant admin consent** for your tenant.

#### 3. Create a Client Secret
- Go to **Certificates & secrets** > **New client secret**.
- Add a description and set an expiry.
- Copy the secret value (you will not see it again).

#### 4. Gather Required Values
- **Tenant ID**: Found in Azure AD overview.
- **Client ID**: From your app registration.
- **Client Secret**: From the previous step.

#### 5. Set Environment Variables
Add these to your `.env.local`:
```env
NEXT_PUBLIC_TENANT_ID=your-tenant-id
NEXT_PUBLIC_CLIENT_ID=your-client-id
NEXT_PUBLIC_CLIENT_SECRET=your-client-secret
```

#### 6. Obtain an Access Token
Use the OAuth 2.0 client credentials flow to get a token:
```bash
curl -X POST -H "Content-Type: application/x-www-form-urlencoded" \
  -d "client_id=YOUR_CLIENT_ID" \
  -d "scope=https://graph.microsoft.com/.default" \
  -d "client_secret=YOUR_CLIENT_SECRET" \
  -d "grant_type=client_credentials" \
  https://login.microsoftonline.com/YOUR_TENANT_ID/oauth2/v2.0/token
```

#### 7. Call the Message Center API
Use the access token to call the endpoint:
```bash
curl -H "Authorization: Bearer ACCESS_TOKEN" \
  https://graph.microsoft.com/v1.0/admin/serviceAnnouncement/messages
```

#### 8. Integrate in Your App
- Use these credentials and flows in your backend or API routes to fetch and cache messages.
- Never expose secrets in client-side code.
- Use libraries like `@microsoft/microsoft-graph-client` or `msal` for easier integration.

**References:**
- [Microsoft Graph Docs: serviceAnnouncement](https://learn.microsoft.com/en-us/graph/api/resources/serviceannouncement?view=graph-rest-1.0)
- [Azure AD App Registration](https://learn.microsoft.com/en-us/azure/active-directory/develop/quickstart-register-app)

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