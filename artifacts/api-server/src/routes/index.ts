import { Router, type IRouter } from "express";
import healthRouter from "./health";
import sensorRouter from "./sensor-data";
import pumpRouter from "./pump-control";

const router: IRouter = Router();

router.use(healthRouter);
router.use(sensorRouter);
router.use(pumpRouter);

export default router;
