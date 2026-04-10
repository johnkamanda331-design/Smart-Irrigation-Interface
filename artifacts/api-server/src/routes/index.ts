import { Router, type IRouter } from "express";
import healthRouter from "./health";
import sensorRouter from "./sensor-data";

const router: IRouter = Router();

router.use(healthRouter);
router.use(sensorRouter);

export default router;
