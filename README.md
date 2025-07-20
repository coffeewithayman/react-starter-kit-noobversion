# React Starter Kit (RSK)

A modern, production-ready SaaS starter template for building full-stack React applications using React Router v7, Convex, Clerk, and Polar.sh. Ready for Vercel deployment with built-in AI chat capabilities and Google Drive security auditing.

## Features

- 🚀 **React Router v7** - Modern full-stack React framework with SSR
- ⚡️ **Hot Module Replacement (HMR)** - Fast development experience
- 📦 **Asset bundling and optimization** - Production-ready builds
- 🔄 **Data loading and mutations** - Built-in loader/action patterns
- 🔒 **TypeScript by default** - Type safety throughout
- 🎨 **TailwindCSS v4** - Modern utility-first CSS
- 🔐 **Authentication with Clerk** - Complete user management
- 💳 **Subscription management with Polar.sh** - Billing and payments
- 🗄️ **Real-time database with Convex** - Serverless backend
- 🤖 **AI Chat Integration** - OpenAI-powered chat functionality
- 📊 **Interactive Dashboard** - User management and analytics
- 🛡️ **Google Drive Security Audit** - Domain-wide audit for publicly shared files
- 🎯 **Webhook handling** - Payment and subscription events
- 📱 **Responsive Design** - Mobile-first approach
- 🚢 **Vercel Deployment Ready** - One-click deployment

## Tech Stack

### Frontend
- **React Router v7** - Full-stack React framework
- **TailwindCSS v4** - Utility-first CSS framework
- **shadcn/ui** - Modern component library with Radix UI
- **Lucide React & Tabler Icons** - Beautiful icon libraries
- **Recharts** - Data visualization
- **Motion** - Smooth animations

### Backend & Services
- **Convex** - Real-time database and serverless functions
- **Clerk** - Authentication and user management
- **Polar.sh** - Subscription billing and payments
- **OpenAI** - AI chat capabilities
- **Google Drive API** - Domain-wide security auditing

### Development & Deployment
- **Vite** - Fast build tool
- **TypeScript** - Type safety
- **Vercel** - Deployment platform

## Getting Started

### Prerequisites

- Node.js 18+ 
- Clerk account for authentication
- Convex account for database
- Polar.sh account for subscriptions (optional)
- OpenAI API key (optional, for AI chat features)
- Google Cloud Project with Google Drive API enabled (optional, for domain audit features)

### Installation

1. Clone the repository and install dependencies:

```bash
npm install
```

2. Copy the environment file and configure your credentials:

```bash
cp .env.example .env.local
```

3. Set up your environment variables in `.env.local`:

```bash
# Convex Configuration
CONVEX_DEPLOYMENT=your_convex_deployment_here
VITE_CONVEX_URL=your_convex_url_here

# Clerk Authentication
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key_here
CLERK_SECRET_KEY=your_clerk_secret_key_here

# Google Drive API Configuration (optional, for domain audit features)
GOOGLE_SERVICE_ACCOUNT_KEY=your_service_account_json_key_here

# Polar.sh Configuration (optional, for payments)
POLAR_ACCESS_TOKEN=your_polar_access_token_here
POLAR_ORGANIZATION_ID=your_polar_organization_id_here
POLAR_WEBHOOK_SECRET=your_polar_webhook_secret_here
POLAR_SERVER=sandbox  # Use "production" for live payments, "sandbox" for testing

# OpenAI Configuration (optional, for AI chat)
OPENAI_API_KEY=your_openai_api_key_here

# Frontend URL for redirects
FRONTEND_URL=http://localhost:5173
```

4. Initialize Convex:

```bash
npx convex dev --configure
```

This will create your Convex deployment and automatically update your `.env.local` with the deployment URL.

5. Configure Convex environment variables:

After running `npx convex dev`, you'll need to set the Clerk environment variable in your Convex dashboard:

- Go to your Convex dashboard at: `https://dashboard.convex.dev/d/YOUR_DEPLOYMENT_NAME/settings/environment-variables`
- Add the environment variable:
  - Key: `VITE_CLERK_FRONTEND_API_URL`
  - Value: Your Clerk Frontend API URL (e.g., `https://your-app-name.clerk.accounts.dev`)

**Note:** The Convex dashboard URL will be displayed in your terminal after running `npx convex dev`. Look for a message like "View the Convex dashboard at https://dashboard.convex.dev/d/your-deployment-name".

6. Set up your Polar.sh webhook endpoint:
   - URL: `{your_domain}/webhook/polar`
   - Events: All subscription events

## Payment Mode Configuration

The application supports both sandbox (testing) and production payment modes:

### Sandbox Mode (Default)
For development and testing, the app uses Polar.sh sandbox mode by default:
```bash
POLAR_SERVER=sandbox  # or omit this variable entirely
```

### Production Mode
To enable live payments, set the environment variable to production:
```bash
POLAR_SERVER=production
```

**Important:** When switching to production mode, ensure you're using:
- Production Polar.sh credentials (access token, organization ID, webhook secret)
- Production webhook endpoints
- Production Clerk domain settings

## Google Drive Security Audit Setup (Optional)

The application includes a powerful Google Drive security audit feature that can scan your entire Google Workspace domain for publicly shared files. This is useful for security compliance and data governance.

### Setting up Google Drive API

1. **Create a Google Cloud Project:**
   - Go to the [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one
   - Enable the Google Drive API and Admin SDK API

2. **Create a Service Account:**
   - Navigate to "IAM & Admin" > "Service Accounts"
   - Click "Create Service Account"
   - Give it a name like "drive-audit-service"
   - Grant it the "Project Editor" role

3. **Generate Service Account Key:**
   - Click on the created service account
   - Go to "Keys" tab
   - Click "Add Key" > "Create new key"
   - Choose JSON format and download

4. **Enable Domain-wide Delegation:**
   - In the service account details, check "Enable Google Workspace Domain-wide Delegation"
   - Note the Client ID

5. **Configure Google Workspace Admin:**
   - Go to [Google Admin Console](https://admin.google.com/)
   - Navigate to Security > API Controls > Domain-wide Delegation
   - Add the Client ID from step 4
   - Add these OAuth scopes:
     ```
     https://www.googleapis.com/auth/admin.directory.users.readonly
     https://www.googleapis.com/auth/drive.metadata.readonly
     https://www.googleapis.com/auth/drive.readonly
     https://www.googleapis.com/auth/spreadsheets
     https://www.googleapis.com/auth/drive.file
     ```

6. **Configure Environment Variable:**
   - Convert the JSON key file content to a single line string
   - Set `GOOGLE_SERVICE_ACCOUNT_KEY` to this JSON string

### Using the Drive Audit Feature

1. Navigate to "Drive Audit" in the dashboard
2. Create a connection with your domain and admin email
3. Run security audits to find publicly shared files
4. View detailed reports and take action on vulnerable files

**Security Note:** The service account credentials provide domain-wide access. Store them securely and never commit them to version control.

### Development

Start the development server with HMR:

```bash
npm run dev
```

Your application will be available at `http://localhost:5173`.

## Building for Production

Create a production build:

```bash
npm run build
```

## Deployment

### Vercel Deployment (Recommended)

This starter kit is optimized for Vercel deployment with the `@vercel/react-router` preset:

1. Connect your repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

The `react-router.config.ts` includes the Vercel preset for seamless deployment.

### Docker Deployment

To build and run using Docker:

```bash
docker build -t my-app .

# Run the container
docker run -p 3000:3000 my-app
```

The containerized application can be deployed to any platform that supports Docker:

- AWS ECS
- Google Cloud Run
- Azure Container Apps
- Digital Ocean App Platform
- Fly.io
- Railway

### DIY Deployment

If you're familiar with deploying Node applications, the built-in app server is production-ready.

Make sure to deploy the output of `npm run build`

```
├── package.json
├── package-lock.json
├── build/
│   ├── client/    # Static assets
│   └── server/    # Server-side code
```

## Architecture

### Key Routes
- `/` - Homepage with pricing
- `/pricing` - Dynamic pricing page
- `/dashboard` - Protected user dashboard
- `/dashboard/chat` - AI-powered chat interface
- `/dashboard/settings` - User settings
- `/success` - Subscription success page
- `/webhook/polar` - Polar.sh webhook handler

### Key Components

#### Authentication & Authorization
- Protected routes with Clerk authentication
- Server-side user data loading with loaders
- Automatic user synchronization

#### Subscription Management
- Dynamic pricing cards fetched from Polar.sh
- Secure checkout flow with redirect handling
- Real-time subscription status updates
- Customer portal for subscription management
- Webhook handling for payment events

#### Dashboard Features
- Interactive sidebar navigation
- Real-time data updates
- User profile management
- AI chat functionality
- Subscription status display

#### AI Chat Integration
- OpenAI-powered conversations
- Real-time message streaming
- Chat history persistence
- Responsive chat interface

## Environment Variables

### Required for Production

- `CONVEX_DEPLOYMENT` - Your Convex deployment URL
- `VITE_CONVEX_URL` - Your Convex client URL
- `VITE_CLERK_PUBLISHABLE_KEY` - Clerk publishable key
- `CLERK_SECRET_KEY` - Clerk secret key
- `GOOGLE_SERVICE_ACCOUNT_KEY` - Google service account JSON key for domain-wide Drive access (optional)
- `POLAR_ACCESS_TOKEN` - Polar.sh API access token (optional)
- `POLAR_ORGANIZATION_ID` - Your Polar.sh organization ID (optional)
- `POLAR_WEBHOOK_SECRET` - Polar.sh webhook secret (optional)
- `POLAR_SERVER` - Set to "production" for live payments, "sandbox" for testing (defaults to sandbox)
- `OPENAI_API_KEY` - OpenAI API key for chat features (optional)
- `FRONTEND_URL` - Your production frontend URL

## Project Structure

```
├── app/
│   ├── components/         # Reusable UI components
│   │   ├── ui/            # shadcn/ui components
│   │   ├── homepage/      # Homepage sections
│   │   └── dashboard/     # Dashboard components
│   ├── routes/            # React Router routes
│   └── utils/             # Utility functions
├── convex/                # Convex backend functions
│   ├── googleDrive.ts     # Google Drive audit functionality
├── public/                # Static assets
└── docs/                  # Documentation
```

## Key Dependencies

- `react` & `react-dom` v19 - Latest React
- `react-router` v7 - Full-stack React framework
- `@clerk/react-router` - Authentication
- `convex` - Real-time database
- `@polar-sh/sdk` - Subscription management
- `googleapis` - Google Drive API integration
- `@ai-sdk/openai` & `ai` - AI chat capabilities
- `@vercel/react-router` - Vercel deployment
- `tailwindcss` v4 - Styling
- `@radix-ui/*` - UI primitives

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run typecheck` - Run TypeScript checks

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## License

This project is licensed under the MIT License.

---

**Stop rebuilding the same foundation over and over.** RSK eliminates months of integration work by providing a complete, production-ready SaaS template with authentication, payments, AI chat, and real-time data working seamlessly out of the box.

Built with ❤️ using React Router v7, Convex, Clerk, Polar.sh, and OpenAI.