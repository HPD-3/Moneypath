import { Router } from "express";
import { db } from "../firebaseAdmin.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = Router();

router.get("/profile", verifyToken, async (req, res) => {
    try {
        const uid = req.user.uid;
        const doc = await db.collection("personalDocuments").doc(uid).get();

        if (!doc.exists) {
            return res.status(404).json({ message: "No profile found" });
        }

        res.json(doc.data());
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


router.post("/profile", verifyToken, async (req, res) => {
    try {
        const uid = req.user.uid;
        const { name, dateOfBirth, phoneNumber, address, gender } = req.body;

        await db.collection("personalDocuments").doc(uid).set({
            name,
            dateOfBirth,
            phoneNumber,
            address,
            gender,
            updatedAt: new Date().toISOString()
        }, { merge: true });

        res.json({ message: "Profile saved", uid });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;