import { Router } from "express";
import { verifyToken } from "../middleware/verifyToken.js";
import levelsController from "../controllers/levelsController.js";

const router = Router();

router.get("/", verifyToken, levelsController.getLevels);
router.post("/claim", verifyToken, levelsController.claimLevelReward);

export default router;
