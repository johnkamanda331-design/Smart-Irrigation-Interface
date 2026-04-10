import { VercelRequest, VercelResponse } from '@vercel/node';
import { sensorDataTable } from '@workspace/db';
import { db } from '../../lib/db';
import { desc, eq } from 'drizzle-orm';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'GET') {
    try {
      const { deviceId, limit = '24' } = req.query;

      if (!deviceId || typeof deviceId !== 'string') {
        return res.status(400).json({ error: 'deviceId is required' });
      }

      const limitNum = Math.min(parseInt(limit as string) || 24, 1000);

      // Fetch historical sensor data
      const results = await db
        .select()
        .from(sensorDataTable)
        .where(eq(sensorDataTable.deviceId, deviceId))
        .orderBy(desc(sensorDataTable.timestamp))
        .limit(limitNum);

      return res.status(200).json({
        data: results,
        timestamp: new Date(),
        count: results.length,
      });
    } catch (error) {
      console.error('[GET /api/sensor-data/history] Error:', error);
      return res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
