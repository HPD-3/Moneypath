import express from "express";
import { verifyToken } from "../middleware/verifyToken.js";
import { getTransactions } from "../controllers/transactionsController.js";

const router = express.Router();

router.get("/", verifyToken, getTransactions);

export default router;