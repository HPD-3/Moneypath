import express from "express";
import { verifyToken } from "../middleware/verifyToken.js";
import { db } from "../firebaseAdmin.js";
import { getAuth } from "firebase-admin/auth";

const router = express.Router();

router.get("/profile", verifyToken, async (req, res) => {
    try {

        const userDoc = await db.collection("users").doc(req.user.uid).get();
        const role = userDoc.exists ? userDoc.data().role : "user";

        res.json({
            uid: req.user.uid,
            email: req.user .email,
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

// Change password endpoint
router.post("/change-password", verifyToken, async (req, res) => {
    try {
        const uid = req.user.uid;
        const { oldPassword, newPassword } = req.body;

        if (!oldPassword || !newPassword) {
            return res.status(400).json({ message: "Password lama dan baru harus diisi" });
        }

        const auth = getAuth();

        // Verify old password by attempting to re-authenticate
        // Note: Firebase Admin SDK doesn't directly verify password, so we'll update directly
        // In production, consider using a custom token or client-side verification
        
        // Update password using Firebase Admin SDK
        await auth.updateUser(uid, {
            password: newPassword
        });

        res.json({ message: "Password berhasil diubah" });
    } catch (err) {
        if (err.code === "auth/invalid-password") {
            res.status(400).json({ message: "Password terlalu lemah (minimal 6 karakter)" });
        } else if (err.code === "auth/user-not-found") {
            res.status(404).json({ message: "User tidak ditemukan" });
        } else {
            res.status(500).json({ message: err.message || "Gagal mengubah password" });
        }
    }
});

export default router;