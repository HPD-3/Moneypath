import { Router } from "express";
import { db } from "../firebaseAdmin.js";
import { verifyAdmin } from "../middleware/verifyAdmin.js";

const router = Router();

// ── GET all users ─────────────────────────────────────────────
router.get("/users", verifyAdmin, async (req, res) => {
    try {
        const usersSnap = await db.collection("users").get();

        const users = await Promise.all(
            usersSnap.docs.map(async (doc) => {
                const userData = doc.data();
                const personalDoc = await db.collection("personalDocuments").doc(doc.id).get();
                return {
                    uid: doc.id,
                    email: userData.email || "-",
                    role: userData.role || "user",
                    createdAt: userData.createdAt || "-",
                    personal: personalDoc.exists ? personalDoc.data() : null,
                };
            })
        );

        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── GET all transactions ──────────────────────────────────────
router.get("/transactions", verifyAdmin, async (req, res) => {
    try {
        const txSnap = await db.collectionGroup("transactions")
            .limit(100)
            .get();  // ← no orderBy

        const transactions = txSnap.docs.map(doc => ({
            id: doc.id,
            uid: doc.ref.parent.parent.id,
            ...doc.data()
        }));

        // Sort in memory instead
        transactions.sort((a, b) => new Date(b.date) - new Date(a.date));

        res.json(transactions);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── GET all learning modules ──────────────────────────────────
router.get("/learning", verifyAdmin, async (req, res) => {
    try {
        const snap = await db.collection("learningModules")
            .orderBy("createdAt", "desc").get();
        res.json(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── POST create learning module ───────────────────────────────
router.post("/learning", verifyAdmin, async (req, res) => {
    try {
        const { title, description, category, videoUrl, content, difficulty } = req.body;
        const ref = await db.collection("learningModules").add({
            title, description, category, videoUrl, content, difficulty,
            createdAt: new Date().toISOString(),
            createdBy: req.user.uid
        });
        res.json({ id: ref.id, title, category, difficulty });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── PUT update learning module ────────────────────────────────
router.put("/learning/:id", verifyAdmin, async (req, res) => {
    try {
        const { title, description, category, videoUrl, content, difficulty } = req.body;
        await db.collection("learningModules").doc(req.params.id).update({
            title, description, category, videoUrl, content, difficulty,
            updatedAt: new Date().toISOString()
        });
        res.json({ message: "Module updated" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── DELETE learning module ────────────────────────────────────
router.delete("/learning/:id", verifyAdmin, async (req, res) => {
    try {
        await db.collection("learningModules").doc(req.params.id).delete();
        res.json({ message: "Module deleted" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── GET all activities ───────────────────────────────────────
router.get("/activities", verifyAdmin, async (req, res) => {
    try {
        const activities = [];

        // Fetch all videos
        const videosSnap = await db.collection("videos").orderBy("createdAt", "desc").get();
        videosSnap.docs.forEach(doc => {
            const data = doc.data();
            activities.push({
                id: `video-${doc.id}`,
                type: "video",
                action: "Admin menambahkan video edukasi",
                title: data.title,
                date: data.createdAt || new Date().toISOString(),
                details: data
            });
        });

        // Fetch all learning paths
        const pathsSnap = await db.collection("learningPaths").orderBy("createdAt", "desc").get();
        pathsSnap.docs.forEach(doc => {
            const data = doc.data();
            activities.push({
                id: `path-${doc.id}`,
                type: "path",
                action: "Admin menambahkan learning path",
                title: data.title,
                date: data.createdAt || new Date().toISOString(),
                details: data
            });
        });

        // Fetch all learning modules
        const modulesSnap = await db.collection("learningModules").orderBy("createdAt", "desc").get();
        modulesSnap.docs.forEach(doc => {
            const data = doc.data();
            activities.push({
                id: `module-${doc.id}`,
                type: "module",
                action: "Admin menambahkan konten edukasi",
                title: data.title,
                date: data.createdAt || new Date().toISOString(),
                details: data
            });
        });

        // Sort by date descending
        activities.sort((a, b) => new Date(b.date) - new Date(a.date));

        res.json(activities);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;