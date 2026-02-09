# Frontend Deployment Guide

## Overview
This is a Next.js 16 application with App Router that needs to be deployed to Vercel.

## Tech Stack
- **Framework**: Next.js 16.1.6 with App Router
- **Language**: TypeScript 5.x
- **Styling**: Tailwind CSS v4
- **Authentication**: Better Auth with JWT
- **Database**: Neon PostgreSQL (serverless)
- **API**: Backend hosted externally

## Required Environment Variables

Set these environment variables in your Vercel project settings:

```bash
# Application URLs (update after deployment)
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
BETTER_AUTH_URL=https://your-app.vercel.app

# Backend API URL
NEXT_PUBLIC_API_URL=<your-backend-api-url>

# Better Auth Secret (generate with: openssl rand -base64 32)
BETTER_AUTH_SECRET=<your-secret-here>

# Database Connection
DATABASE_URL=<your-neon-database-url>
```

**IMPORTANT SECURITY NOTES:**
- ⚠️ Copy the actual values from your local `.env.local` file
- ⚠️ NEVER commit `.env.local` or files containing actual secrets to Git
- ⚠️ Add these variables directly in Vercel Dashboard under Project Settings > Environment Variables
- ⚠️ Generate a new `BETTER_AUTH_SECRET` using: `openssl rand -base64 32`

## Deployment Steps

### Option 1: Using Vercel CLI (Recommended)

1. Install Vercel CLI globally:
   ```bash
   npm install -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Deploy to production:
   ```bash
   cd frontend
   vercel --prod
   ```

4. Follow the prompts to link or create a new project

### Option 2: Using Vercel Dashboard (Easiest)

1. Go to https://vercel.com/new
2. Import the Git repository
3. Select the `frontend` directory as the root
4. Framework Preset: Next.js
5. Build Command: `npm run build`
6. Output Directory: `.next`
7. Install Command: `npm install`
8. Add all environment variables listed above
9. Click "Deploy"

### Option 3: Using GitHub Integration

1. Push your code to GitHub
2. Connect your GitHub repository to Vercel
3. Configure the project settings to point to the `frontend` directory
4. Add environment variables in Vercel dashboard
5. Vercel will automatically deploy on every push to main branch

## Post-Deployment Steps

1. After deployment, update these environment variables with your actual Vercel URL:
   - `NEXT_PUBLIC_APP_URL`
   - `BETTER_AUTH_URL`

2. Verify the deployment:
   - Check that the login page loads correctly
   - Test authentication flow
   - Verify API connection to the backend

## Features

- **Authentication**: Email/password authentication with Better Auth
- **Protected Routes**: Dashboard requires authentication
- **Task Management**: Full CRUD operations for tasks
- **User Isolation**: Tasks are user-specific
- **Responsive Design**: Mobile-first design with Tailwind CSS
- **Theme Support**: Light/dark mode toggle

## Project Structure

```
frontend/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Public auth routes (login, signup)
│   ├── (dashboard)/       # Protected dashboard routes
│   └── api/auth/          # Better Auth API routes
├── components/            # React components
├── lib/                   # Utilities and configurations
├── hooks/                 # Custom React hooks
└── types/                 # TypeScript type definitions
```

## Troubleshooting

### Build Failures
- Ensure all dependencies are installed: `npm install`
- Check Node.js version compatibility (18+)
- Verify environment variables are set correctly

### Authentication Issues
- Ensure `BETTER_AUTH_SECRET` is set
- Verify `BETTER_AUTH_URL` matches your deployment URL
- Check database connection string is correct

### API Connection Issues
- Verify `NEXT_PUBLIC_API_URL` points to your backend
- Check CORS settings on the backend
- Ensure backend is accessible from Vercel's servers

## Notes

- The frontend communicates with a FastAPI backend
- Database is hosted on Neon (PostgreSQL)
- Better Auth handles JWT-based authentication
- All routes except `/login` and `/signup` require authentication
