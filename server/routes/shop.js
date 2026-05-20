import express from "express";
import { verifyToken } from "../middleware/verifyToken.js";
import { getCatalog, purchaseItem } from "../controllers/shopController.js";

const router = express.Router();

router.get("/catalog", verifyToken, getCatalog);
router.post("/purchase", verifyToken, purchaseItem);

export default router;
