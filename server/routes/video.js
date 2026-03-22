import { Router } from "express";
import { db } from "../firebaseAdmin.js";
import { verifyAdmin } from "../middleware/verifyAdmin.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = Router();

// ── Helper: extract YouTube video ID ─────────────────────────
function getYouTubeId(url) {
    const regex = /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
}

// ── GET all videos (public — for users) ───────────────────────
router.get("/", verifyToken, async (req, res) => {
    try {
        const { category } = req.query;

        let snap;
        if (category) {
            snap = await db.collection("videos")
                .where("category", "==", category)
                .get();
        } else {
            snap = await db.collection("videos").get(); // ← no orderBy
        }

        const videos = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Sort in memory
        videos.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        res.json(videos);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── GET single video ──────────────────────────────────────────
router.get("/:id", verifyToken, async (req, res) => {
    try {
        const doc = await db.collection("videos").doc(req.params.id).get();
        if (!doc.exists) return res.status(404).json({ error: "Video not found" });
        res.json({ id: doc.id, ...doc.data() });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── POST create video (admin only) ────────────────────────────
router.post("/", verifyAdmin, async (req, res) => {
    try {
        const { title, description, category, youtubeUrl, duration } = req.body;

        const youtubeId = getYouTubeId(youtubeUrl);
        if (!youtubeId) return res.status(400).json({ error: "Invalid YouTube URL" });

        // Auto-generate thumbnail from YouTube
        const thumbnail = `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;

        const ref = await db.collection("videos").add({
            title,
            description,
            category,       // budgeting | investing | saving | debt
            youtubeUrl,
            youtubeId,
            thumbnail,
            duration,       // e.g. "12:34"
            createdAt: new Date().toISOString(),
            createdBy: req.user.uid
        });

        res.json({ id: ref.id, title, youtubeId, thumbnail });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put("/:id", verifyAdmin, async (req, res) => {
    try {
        const { title, description, category, youtubeUrl, duration } = req.body;

        const youtubeId = getYouTubeId(youtubeUrl);
        if (!youtubeId) return res.status(400).json({ error: "Invalid YouTube URL" });

        const thumbnail = `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;

        await db.collection("videos").doc(req.params.id).update({
            title, description, category,
            youtubeUrl, youtubeId, thumbnail, duration,
            updatedAt: new Date().toISOString()
        });

        res.json({ message: "Video updated", youtubeId, thumbnail });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


router.delete("/:id", verifyAdmin, async (req, res) => {
    try {
        await db.collection("videos").doc(req.params.id).delete();
        res.json({ message: "Video deleted" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;