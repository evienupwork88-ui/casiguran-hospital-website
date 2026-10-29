import { Router } from "express";
import { getServerTime } from "../controllers/health.controller";

const router = Router();

router.get("/", getServerTime);

export default router;
