# Vercel Deployment Guide

## API Server Deployment

### 1. Connect to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel
```

### 2. Set Environment Variables in Vercel Dashboard

1. Go to your project on vercel.com
2. Settings → Environment Variables
3. Add:
   - **DATABASE_URL**: Your Neon PostgreSQL connection string
   - **PORT**: 3000 (optional, Vercel auto-assigns)

### 3. Project Settings

- **Root Directory**: `artifacts/api-server`
- **Build Command**: `pnpm run build`
- **Install Command**: `pnpm install`
- **Output Directory**: `dist`

## Mobile App Configuration

### Development
```env
# .env.local or .env.development
EXPO_PUBLIC_API_URL=http://localhost:3000
```

### Production
Update your Vercel API deployment URL in the app:

```bash
# After deployment, you'll get a URL like:
# https://your-project.vercel.app

# Update farm-dashboard .env:
EXPO_PUBLIC_API_URL=https://your-project.vercel.app
```

## Building Mobile App Locally

```bash
# Build for production
pnpm --filter @workspace/farm-dashboard run build

# Or use Expo EAS for cloud builds
pnpm --filter @workspace/farm-dashboard run eas:build
```

## Database Schema on Vercel

The schema is pushed automatically via `pnpm --filter @workspace/db push` before deployment.

If you need to run migrations manually on Vercel:

```bash
# Locally, with Vercel environment vars loaded
vercel env pull .env.production.local
DATABASE_URL=$(cat .env.production.local | grep DATABASE_URL) pnpm --filter @workspace/db push
```

## Troubleshooting

### "PORT not found" error
- Vercel sets `PORT` automatically
- Remove PORT requirement or set in Vercel dashboard

### Database connection timeout
- Ensure Neon IP whitelist includes Vercel IP ranges
- Or use Neon's "Allow all IPs" for development/testing

### CORS errors
- API server already has `cors()` middleware enabled
- If issues persist, check CORS configuration in `artifacts/api-server/src/app.ts`

## Monitoring

Track deployments and logs at:
- https://vercel.com/dashboard

Check API server logs:
```bash
vercel logs
```

## CI/CD

Vercel automatically deploys on git push to your main branch.
- Configure in Vercel dashboard → Git
- Link your GitHub/GitLab repo

## Performance Tips

1. **Enable caching** in Vercel dashboard
2. **Use Neon connection pooling** (already configured)
3. **Monitor database connections** via Neon dashboard
4. **Set up observability** with Vercel Analytics
