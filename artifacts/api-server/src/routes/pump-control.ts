import { Router, type Request, type Response } from "express";
import { insertPumpControlSchema } from "@workspace/db";
import { logger } from "../lib/logger";

const pumpRouter = Router();

// POST /api/pump-control - Send pump control command
pumpRouter.post("/pump-control", async (req: Request, res: Response) => {
  try {
    const validation = insertPumpControlSchema.safeParse(req.body);

    if (!validation.success) {
      logger.error({ error: validation.error }, "Invalid pump control request");
      return res.status(400).json({
        error: "Invalid pump control request",
        details: validation.error.errors,
      });
    }

    const pumpControl = validation.data;

    // TODO: Save to database using Drizzle ORM
    // For now, we'll store in memory or return success
    logger.info(
      { deviceId: pumpControl.deviceId, command: pumpControl.command },
      "Pump control command received"
    );

    // Simulate command ID
    const commandId = Date.now();

    res.status(201).json({
      message: "Pump control command queued",
      commandId,
    });
  } catch (error) {
    logger.error({ error }, "Error processing pump control request");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default pumpRouter;