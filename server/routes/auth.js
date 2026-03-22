import express from "express";
import { verifyToken } from "../middleware/verifyToken.js";
import { db } from "../firebaseAdmin.js";

const router = express.Router();

router.get("/profile", verifyToken, async (req, res) => {
    try {

        const userDoc = await db.collection("users").doc(req.user.uid).get();
        const role = userDoc.exists ? userDoc.data().role : "user";

        res.json({
            uid: req.user.uid,
            email: req.user.email,
            role
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post("/register", async (req, res) => {
    try {
        const { uid, email } = req.body;

        await db.collection("users").doc(uid).set({
            email,
            role: "user",
            createdAt: new Date().toISOString()
        });

        res.json({ message: "User saved", uid });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;