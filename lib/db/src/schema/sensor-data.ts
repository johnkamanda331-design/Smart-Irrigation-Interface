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

export const insertSensorDataSchema = createInsertSchema(sensorDataTable)
  .omit({ id: true, timestamp: true })
  .extend({
    batteryVoltage: z.string().or(z.number()),
    solarVoltage: z.string().or(z.number()),
    flowRate: z.string().or(z.number()),
  });

export const pumpControlTable = pgTable("pump_control", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  deviceId: text("device_id").notNull(),
  command: text("command", { enum: ["ON", "OFF"] }).notNull(),
  executed: boolean("executed").notNull().default(false),
  timestamp: timestamp("timestamp", { withTimezone: true }).notNull().defaultNow(),
});

export const insertPumpControlSchema = createInsertSchema(pumpControlTable)
  .omit({ id: true, timestamp: true, executed: true });

export type InsertPumpControl = z.infer<typeof insertPumpControlSchema>;
export type PumpControl = typeof pumpControlTable.$inferSelect;
