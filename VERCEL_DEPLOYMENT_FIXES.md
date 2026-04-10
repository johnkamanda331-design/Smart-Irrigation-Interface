# Vercel Deployment - Code Review & Fixes

## ✅ Critical Issues Fixed

### 1. **Server Architecture (FIXED)**
**Problem**: API server used `app.listen()` which is incompatible with Vercel's serverless architecture.

**Solution**: 
- Migrated from traditional Express server to Vercel serverless functions
- Created `/api` folder with individual route handlers:
  - `/api/sensor-data.ts` - POST (save) & GET (fetch latest)
  - `/api/sensor-data/history.ts` - GET historical data
  - `/api/health.ts` - Health check endpoint

**Files Changed**:
- ✅ Created `api/sensor-data.ts` (replaces artifacts/api-server routes)
- ✅ Created `api/sensor-data/history.ts`
- ✅ Created `api/health.ts`
- ✅ Updated `vercel.json` for serverless routing
- ✅ Removed old `artifacts/api-server` from build pipeline

### 2. **Database Operations (FIXED)**
**Problem**: Routes had TODO comments - data wasn't actually being saved or fetched.

**Solution**:
- Implemented actual database INSERT for POST `/api/sensor-data`
- Implemented database SELECT queries using Drizzle ORM
- Added proper error handling for database operations
- Used `eq()` and `desc()` from drizzle-orm for type-safe queries

**Key Database Changes**:
```typescript
// POST: Insert sensor data
const result = await db
  .insert(sensorDataTable)
  .values({ ...sensorData, timestamp: new Date() })
  .returning();

// GET: Fetch latest data
const result = await db
  .select()
  .from(sensorDataTable)
  .where(eq(sensorDataTable.deviceId, deviceId))
  .orderBy(desc(sensorDataTable.timestamp))
  .limit(1);

// GET: Fetch history  
const results = await db
  .select()
  .from(sensorDataTable)
  .where(eq(sensorDataTable.deviceId, deviceId))
  .orderBy(desc(sensorDataTable.timestamp))
  .limit(limitNum);
```

### 3. **Mobile App Environment Configuration (FIXED)**
**Problem**: Mobile app had hardcoded relative paths that only worked for localhost.

**Solution**:
- Updated `lib/sensor-api.ts` to use `EXPO_PUBLIC_API_URL` environment variable
- Created environment files:
  - `.env.development` → `http://localhost:3000`
  - `.env.production` → `https://your-project.vercel.app` (user to update)

**Files Changed**:
- ✅ Updated `artifacts/farm-dashboard/lib/sensor-api.ts`
- ✅ Created `.env.development`
- ✅ Created `.env.production`

### 4. **CORS Configuration (FIXED)**
**Problem**: No CORS headers in serverless functions.

**Solution**:
- Added comprehensive CORS headers to all Vercel API handlers
- Allows requests from all origins (production: restrict as needed)
- Supports OPTIONS preflight requests

### 5. **Error Handling (FIXED)**
**Problem**: Minimal error messages for debugging in production.

**Solution**:
- All endpoints now return structured error responses
- Proper HTTP status codes (400, 404, 500, etc.)
- Detailed error messages in development
- Safe error messages in production (no stack traces leaked)

### 6. **Validation Errors (FIXED)**
**Problem**: Error details weren't user-friendly.

**Solution**:
```typescript
details: validation.error.errors.map((e) => ({
  field: e.path.join('.'),
  message: e.message,
}))
```

## 📦 Dependencies Added

```json
{
  "@vercel/node": "^3.0.0",
  "@types/node": "^20.0.0"
}
```

## 🔧 Configuration Files Updated

1. **vercel.json**
   - Removed old artifacts/api-server config
   - Added serverless function configuration
   - Set memory limits (1024MB) and timeout (30s)
   - Added Cache-Control headers for API routes

2. **tsconfig.vercel.json**
   - New TypeScript config for API compilation
   - Includes necessary library references

3. **package.json**
   - Added build and typecheck scripts
   - Added @vercel/node dependency

## 🚀 Deployment Steps

1. **Install dependencies**:
   ```bash
   pnpm install
   ```

2. **Test locally**:
   ```bash
   vercel dev
   ```

3. **Set environment variables in Vercel dashboard**:
   - `DATABASE_URL` - Your Neon PostgreSQL connection string


4. **Deploy**:
   ```bash
   vercel --prod
   ```

## ✅ API Endpoints After Deployment

- `POST https://your-project.vercel.app/api/sensor-data` - Save sensor data
- `GET https://your-project.vercel.app/api/sensor-data?deviceId=xxx` - Get latest data
- `GET https://your-project.vercel.app/api/sensor-data/history?deviceId=xxx&limit=24` - Get history
- `GET https://your-project.vercel.app/api/health` - Health check

## 📝 Notes

- **Old artifacts/api-server**: Can be kept for local development with `pnpm --filter @workspace/api-server dev`, but won't be deployed to Vercel
- **Database connections**: Vercel handles connection pooling automatically
- **Cold starts**: First request may take 1-2 seconds (normal for serverless)
- **Scaling**: Vercel auto-scales based on demand

## ⚠️ Production Checklist

Before going live:

- [ ] Update Mobile App `.env.production` with actual Vercel URL
- [ ] Set `DATABASE_URL` in Vercel dashboard
- [ ] Test POST endpoint with actual ESP32 data
- [ ] Test GET endpoints from mobile app
- [ ] Monitor Vercel logs for errors
- [ ] Consider enabling observability (Vercel Analytics)
- [ ] Set up error tracking (Sentry, etc.)
- [ ] Restrict CORS in production (update `Access-Control-Allow-Origin` from `*` to your domain)

## 🐛 Testing

Test the API before deployment:

```bash
# Local testing
vercel dev

# Test POST (save data)
curl -X POST http://localhost:3000/api/sensor-data \
  -H "Content-Type: application/json" \
  -d '{"deviceId":"test1","batteryVoltage":3.82,"batteryPercent":72,"solarVoltage":14.3,"flowRate":3.2,"waterLevel":"OK","pumpStatus":true,"gsmSignal":3}'

# Test GET (fetch latest)
curl http://localhost:3000/api/sensor-data?deviceId=test1

# Test GET history
curl http://localhost:3000/api/sensor-data/history?deviceId=test1&limit=24

# Test health
curl http://localhost:3000/api/health
```
