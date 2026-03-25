import { Router } from "express";
import { db } from "../firebaseAdmin.js";
import { verifyAdmin } from "../middleware/verifyAdmin.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = Router();

// ══════════════════════════════════════════════
//  LEARNING PATHS (Admin)
// ══════════════════════════════════════════════

// GET all paths
router.get("/", verifyToken, async (req, res) => {
    try {
        const snap = await db.collection("learningPaths").get();
        const paths = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        paths.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        res.json(paths);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET single path with modules
router.get("/:pathId", verifyToken, async (req, res) => {
    try {
        const pathDoc = await db.collection("learningPaths").doc(req.params.pathId).get();
        if (!pathDoc.exists) return res.status(404).json({ error: "Path not found" });

        const modulesSnap = await db.collection("learningPaths")
            .doc(req.params.pathId)
            .collection("modules")
            .get();

        const modules = await Promise.all(
            modulesSnap.docs.map(async (modDoc) => {
                const quizSnap = await modDoc.ref.collection("quiz").get();
                const quiz = quizSnap.docs.map(q => ({ id: q.id, ...q.data() }));
                return { id: modDoc.id, ...modDoc.data(), quiz };
            })
        );

        modules.sort((a, b) => (a.order || 0) - (b.order || 0));

        res.json({ id: pathDoc.id, ...pathDoc.data(), modules });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST create path (admin)
router.post("/", verifyAdmin, async (req, res) => {
    try {
        const { title, description, category, difficulty, estimatedTime } = req.body;
        const ref = await db.collection("learningPaths").add({
            title, description, category, difficulty,
            estimatedTime,   // e.g. "3 jam"
            totalModules: 0,
            createdAt: new Date().toISOString(),
            createdBy: req.user.uid
        });
        res.json({ id: ref.id, title });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT update path (admin)
router.put("/:pathId", verifyAdmin, async (req, res) => {
    try {
        const { title, description, category, difficulty, estimatedTime } = req.body;
        await db.collection("learningPaths").doc(req.params.pathId).update({
            title, description, category, difficulty, estimatedTime,
            updatedAt: new Date().toISOString()
        });
        res.json({ message: "Path updated" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE path (admin)
router.delete("/:pathId", verifyAdmin, async (req, res) => {
    try {
        await db.collection("learningPaths").doc(req.params.pathId).delete();
        res.json({ message: "Path deleted" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ══════════════════════════════════════════════
//  MODULES inside a path (Admin)
// ══════════════════════════════════════════════

// POST create module
router.post("/:pathId/modules", verifyAdmin, async (req, res) => {
    try {
        const { title, content, order } = req.body;

        const ref = await db.collection("learningPaths")
            .doc(req.params.pathId)
            .collection("modules")
            .add({ title, content, order: order || 1, createdAt: new Date().toISOString() });

        // Update totalModules count
        const modulesSnap = await db.collection("learningPaths")
            .doc(req.params.pathId).collection("modules").get();
        await db.collection("learningPaths").doc(req.params.pathId)
            .update({ totalModules: modulesSnap.size });

        res.json({ id: ref.id, title, order });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT update module
router.put("/:pathId/modules/:moduleId", verifyAdmin, async (req, res) => {
    try {
        const { title, content, order } = req.body;
        await db.collection("learningPaths")
            .doc(req.params.pathId)
            .collection("modules")
            .doc(req.params.moduleId)
            .update({ title, content, order, updatedAt: new Date().toISOString() });
        res.json({ message: "Module updated" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE module
router.delete("/:pathId/modules/:moduleId", verifyAdmin, async (req, res) => {
    try {
        await db.collection("learningPaths")
            .doc(req.params.pathId)
            .collection("modules")
            .doc(req.params.moduleId)
            .delete();

        const modulesSnap = await db.collection("learningPaths")
            .doc(req.params.pathId).collection("modules").get();
        await db.collection("learningPaths").doc(req.params.pathId)
            .update({ totalModules: modulesSnap.size });

        res.json({ message: "Module deleted" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ══════════════════════════════════════════════
//  QUIZ inside a module (Admin)
// ══════════════════════════════════════════════

// POST add quiz question
router.post("/:pathId/modules/:moduleId/quiz", verifyAdmin, async (req, res) => {
    try {
        const { question, options, correctIndex } = req.body;
        // options: ["A", "B", "C", "D"]
        // correctIndex: 0-3
        const ref = await db.collection("learningPaths")
            .doc(req.params.pathId)
            .collection("modules").doc(req.params.moduleId)
            .collection("quiz")
            .add({ question, options, correctIndex, createdAt: new Date().toISOString() });
        res.json({ id: ref.id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE quiz question
router.delete("/:pathId/modules/:moduleId/quiz/:quizId", verifyAdmin, async (req, res) => {
    try {
        await db.collection("learningPaths")
            .doc(req.params.pathId)
            .collection("modules").doc(req.params.moduleId)
            .collection("quiz").doc(req.params.quizId)
            .delete();
        res.json({ message: "Quiz deleted" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ══════════════════════════════════════════════
//  USER PROGRESS
// ══════════════════════════════════════════════

// GET user progress for a path
router.get("/:pathId/progress", verifyToken, async (req, res) => {
    try {
        const uid = req.user.uid;
        const doc = await db.collection("users").doc(uid)
            .collection("progress").doc(req.params.pathId).get();
        res.json(doc.exists ? doc.data() : { completedModules: [] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST mark module as complete
router.post("/:pathId/progress", verifyToken, async (req, res) => {
    try {
        const uid = req.user.uid;
        const { moduleId } = req.body;

        const progressRef = db.collection("users").doc(uid)
            .collection("progress").doc(req.params.pathId);
        const progressDoc = await progressRef.get();

        const existing = progressDoc.exists ? progressDoc.data().completedModules || [] : [];

        if (!existing.includes(moduleId)) {
            existing.push(moduleId);
        }

        // Get total modules to check completion
        const modulesSnap = await db.collection("learningPaths")
            .doc(req.params.pathId).collection("modules").get();
        const isCompleted = existing.length >= modulesSnap.size;

        await progressRef.set({
            completedModules: existing,
            startedAt: progressDoc.exists ? progressDoc.data().startedAt : new Date().toISOString(),
            completedAt: isCompleted ? new Date().toISOString() : null,
            isCompleted
        }, { merge: true });

        res.json({ completedModules: existing, isCompleted });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;