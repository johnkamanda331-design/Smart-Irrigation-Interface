import { VercelRequest, VercelResponse } from '@vercel/node';
import { insertSensorDataSchema, sensorDataTable } from '@workspace/db';
import { db } from '../lib/db';
import { desc, eq } from 'drizzle-orm';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'POST') {
    try {
      const validation = insertSensorDataSchema.safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({
          error: 'Invalid sensor data',
          details: validation.error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        });
      }

      const sensorData = validation.data;

      // Save to database
      const result = await db
        .insert(sensorDataTable)
        .values({
          ...sensorData,
          timestamp: new Date(),
        })
        .returning();

      return res.status(201).json({
        message: 'Sensor data received',
        data: result[0],
      });
    } catch (error) {
      console.error('[POST /api/sensor-data] Error:', error);
      return res.status(500).json({
        error: 'Failed to save sensor data',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  if (req.method === 'GET') {
    try {
      const { deviceId } = req.query;

      if (!deviceId || typeof deviceId !== 'string') {
        return res.status(400).json({ error: 'deviceId is required' });
      }

      // Fetch latest sensor data
      const result = await db
        .select()
        .from(sensorDataTable)
        .where(eq(sensorDataTable.deviceId, deviceId))
        .orderBy(desc(sensorDataTable.timestamp))
        .limit(1);

      return res.status(200).json({
        data: result[0] || null,
        timestamp: new Date(),
      });
    } catch (error) {
      console.error('[GET /api/sensor-data] Error:', error);
      return res.status(500).json({
        error: 'Failed to fetch sensor data',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
