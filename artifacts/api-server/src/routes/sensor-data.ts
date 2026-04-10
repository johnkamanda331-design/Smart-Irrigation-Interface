import { Router, type Request, type Response } from "express";
import { insertSensorDataSchema } from "@workspace/db";
import { logger } from "../lib/logger";

const sensorRouter = Router();

// POST /api/sensor-data - ESP32 sends sensor data
sensorRouter.post("/sensor-data", async (req: Request, res: Response) => {
  try {
    const validation = insertSensorDataSchema.safeParse(req.body);

    if (!validation.success) {
      logger.error({ error: validation.error }, "Invalid sensor data");
      return res.status(400).json({
        error: "Invalid sensor data",
        details: validation.error.errors,
      });
    }

    const sensorData = validation.data;

    // TODO: Save to database using Drizzle ORM
    // For now, we'll store in memory or return success
    logger.info(
      { deviceId: sensorData.deviceId, timestamp: new Date() },
      "Sensor data received"
    );

    res.status(201).json({
      message: "Sensor data received",
      data: sensorData,
    });
  } catch (error) {
    logger.error({ error }, "Error processing sensor data");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/sensor-data - App polls latest sensor data
sensorRouter.get("/sensor-data", async (req: Request, res: Response) => {
  try {
    const deviceId = req.query.deviceId as string;

    if (!deviceId) {
      return res.status(400).json({ error: "deviceId is required" });
    }

    // TODO: Fetch latest sensor data from database
    // For now, return empty data
    logger.info({ deviceId }, "Fetching sensor data");

    res.json({
      data: null, // TODO: Replace with actual data from DB
      timestamp: new Date(),
    });
  } catch (error) {
    logger.error({ error }, "Error fetching sensor data");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/sensor-data/history - App polls historical sensor data
sensorRouter.get("/sensor-data/history", async (req: Request, res: Response) => {
  try {
    const deviceId = req.query.deviceId as string;
    const limit = parseInt(req.query.limit as string) || 24;

    if (!deviceId) {
      return res.status(400).json({ error: "deviceId is required" });
    }

    // TODO: Fetch historical sensor data from database
    logger.info({ deviceId, limit }, "Fetching sensor history");

    res.json({
      data: [], // TODO: Replace with actual history from DB
      timestamp: new Date(),
    });
  } catch (error) {
    logger.error({ error }, "Error fetching sensor history");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default sensorRouter;
