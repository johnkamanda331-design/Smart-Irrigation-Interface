import { pgTable, text, integer, numeric, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const sensorDataTable = pgTable("sensor_data", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  deviceId: text("device_id").notNull(),
  batteryVoltage: numeric("battery_voltage", { precision: 5, scale: 2 }).notNull(),
  batteryPercent: integer("battery_percent").notNull(),
  solarVoltage: numeric("solar_voltage", { precision: 5, scale: 2 }).notNull(),
  flowRate: numeric("flow_rate", { precision: 8, scale: 2 }).notNull(),
  waterLevel: text("water_level", { enum: ["OK", "LOW", "EMPTY"] }).notNull(),
  pumpStatus: boolean("pump_status").notNull(),
  gsmSignal: integer("gsm_signal").notNull(),
  deviceOnline: boolean("device_online").notNull().default(true),
  timestamp: timestamp("timestamp", { withTimezone: true }).notNull().defaultNow(),
});

// Manual schema that allows string or number inputs
export const insertSensorDataSchema = z.object({
  deviceId: z.string(),
  batteryVoltage: z.union([z.string(), z.number()]).pipe(z.coerce.number()),
  batteryPercent: z.number().int().min(0).max(100),
  solarVoltage: z.union([z.string(), z.number()]).pipe(z.coerce.number()),
  flowRate: z.union([z.string(), z.number()]).pipe(z.coerce.number()),
  waterLevel: z.enum(["OK", "LOW", "EMPTY"]),
  pumpStatus: z.boolean(),
  gsmSignal: z.number().int().min(0).max(31),
});

export type InsertSensorData = z.infer<typeof insertSensorDataSchema>;
export type SensorData = typeof sensorDataTable.$inferSelect;
