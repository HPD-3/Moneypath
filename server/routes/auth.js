import express from "express";
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

router.get("/profile", verifyToken, (req, res) => {

    res.json({
        uid: req.user.uid,
        email: req.user.email
    });

});

export default router;