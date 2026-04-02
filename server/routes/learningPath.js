import { Router } from "express";
import { db } from "../firebaseAdmin.js";
import { verifyAdmin } from "../middleware/verifyAdmin.js";
import { verifyToken } from "../middleware/verifyToken.js";
import { awardExp, EXP_REWARDS } from "../utils/expSystem.js";

const router = Router();

// ══════════════════════════════════════════════
//  LEARNING PATHS
// ══════════════════════════════════════════════

router.get("/", verifyToken, async (req, res) => {
    try {
        const snap  = await db.collection("learningPaths").get();
        const paths = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        paths.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        res.json(paths);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── PROGRESS routes MUST come before /:pathId ────────────────
// GET progress
router.get("/:pathId/progress", verifyToken, async (req, res) => {
    try {
        const uid = req.user.uid;
        const doc = await db.collection("users").doc(uid)
            .collection("progress").doc(req.params.pathId).get();
        res.json(doc.exists ? doc.data() : { completedModules: [] });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST progress (mark module complete + award EXP)
router.post("/:pathId/progress", verifyToken, async (req, res) => {
    try {
        const uid = req.user.uid;
        const { moduleId, passedQuiz } = req.body;

        const progressRef = db.collection("users").doc(uid)
            .collection("progress").doc(req.params.pathId);
        const progressDoc = await progressRef.get();
        const existing    = progressDoc.exists
            ? progressDoc.data().completedModules || [] : [];

        const isNew = !existing.includes(moduleId);
        if (isNew) existing.push(moduleId);

        const modulesSnap = await db.collection("learningPaths")
            .doc(req.params.pathId).collection("modules").get();
        const isCompleted = existing.length >= modulesSnap.size;

        await progressRef.set({
            completedModules: existing,
            startedAt: progressDoc.exists
                ? progressDoc.data().startedAt : new Date().toISOString(),
            completedAt: isCompleted ? new Date().toISOString() : null,
            isCompleted
        }, { merge: true });

        // Award EXP
        let expEarned = 0, levelUp = false, newLevel = 1;
        if (isNew) {
            expEarned += EXP_REWARDS.FINISH_MODULE;
            if (passedQuiz)   expEarned += EXP_REWARDS.PASS_MODULE_QUIZ;
            if (isCompleted)  expEarned += EXP_REWARDS.FINISH_PATH;

            const expResult = await awardExp(db, uid, expEarned,
                `Module complete: ${moduleId}${isCompleted ? " (PATH COMPLETE!)" : ""}`);
            levelUp  = expResult.levelUp;
            newLevel = expResult.level;
        }

        res.json({ completedModules: existing, isCompleted, expEarned, levelUp, newLevel });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET single path with modules — AFTER progress routes
router.get("/:pathId", verifyToken, async (req, res) => {
    try {
        const pathDoc = await db.collection("learningPaths").doc(req.params.pathId).get();
        if (!pathDoc.exists) return res.status(404).json({ error: "Path not found" });

        const modulesSnap = await db.collection("learningPaths")
            .doc(req.params.pathId).collection("modules").get();

        const modules = await Promise.all(
            modulesSnap.docs.map(async (modDoc) => {
                const quizSnap = await modDoc.ref.collection("quiz").get();
                return { id: modDoc.id, ...modDoc.data(), quiz: quizSnap.docs.map(q => ({ id: q.id, ...q.data() })) };
            })
        );
        modules.sort((a, b) => (a.order || 0) - (b.order || 0));
        res.json({ id: pathDoc.id, ...pathDoc.data(), modules });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post("/", verifyAdmin, async (req, res) => {
    try {
        const { title, description, category, difficulty, estimatedTime } = req.body;
        const ref = await db.collection("learningPaths").add({
            title, description, category, difficulty, estimatedTime,
            totalModules: 0, createdAt: new Date().toISOString(), createdBy: req.user.uid
        });
        res.json({ id: ref.id, title });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put("/:pathId", verifyAdmin, async (req, res) => {
    try {
        const { title, description, category, difficulty, estimatedTime } = req.body;
        await db.collection("learningPaths").doc(req.params.pathId)
            .update({ title, description, category, difficulty, estimatedTime, updatedAt: new Date().toISOString() });
        res.json({ message: "Path updated" });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete("/:pathId", verifyAdmin, async (req, res) => {
    try {
        await db.collection("learningPaths").doc(req.params.pathId).delete();
        res.json({ message: "Path deleted" });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ══════════════════════════════════════════════
//  MODULES
// ══════════════════════════════════════════════

router.post("/:pathId/modules", verifyAdmin, async (req, res) => {
    try {
        const { title, content, order } = req.body;
        const ref = await db.collection("learningPaths")
            .doc(req.params.pathId).collection("modules")
            .add({ title, content, order: order || 1, createdAt: new Date().toISOString() });

        const modulesSnap = await db.collection("learningPaths")
            .doc(req.params.pathId).collection("modules").get();
        await db.collection("learningPaths").doc(req.params.pathId)
            .update({ totalModules: modulesSnap.size });

        res.json({ id: ref.id, title, order });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put("/:pathId/modules/:moduleId", verifyAdmin, async (req, res) => {
    try {
        const { title, content, order } = req.body;
        await db.collection("learningPaths")
            .doc(req.params.pathId).collection("modules").doc(req.params.moduleId)
            .update({ title, content, order, updatedAt: new Date().toISOString() });
        res.json({ message: "Module updated" });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete("/:pathId/modules/:moduleId", verifyAdmin, async (req, res) => {
    try {
        await db.collection("learningPaths")
            .doc(req.params.pathId).collection("modules").doc(req.params.moduleId).delete();
        const modulesSnap = await db.collection("learningPaths")
            .doc(req.params.pathId).collection("modules").get();
        await db.collection("learningPaths").doc(req.params.pathId)
            .update({ totalModules: modulesSnap.size });
        res.json({ message: "Module deleted" });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ══════════════════════════════════════════════
//  QUIZ
// ══════════════════════════════════════════════

router.post("/:pathId/modules/:moduleId/quiz", verifyAdmin, async (req, res) => {
    try {
        const { question, options, correctIndex } = req.body;
        const ref = await db.collection("learningPaths")
            .doc(req.params.pathId).collection("modules").doc(req.params.moduleId)
            .collection("quiz")
            .add({ question, options, correctIndex, createdAt: new Date().toISOString() });
        res.json({ id: ref.id });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete("/:pathId/modules/:moduleId/quiz/:quizId", verifyAdmin, async (req, res) => {
    try {
        await db.collection("learningPaths")
            .doc(req.params.pathId).collection("modules").doc(req.params.moduleId)
            .collection("quiz").doc(req.params.quizId).delete();
        res.json({ message: "Quiz deleted" });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

export default router;