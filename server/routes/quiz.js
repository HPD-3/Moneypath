import { Router } from "express";
import { db } from "../firebaseAdmin.js";
import { verifyToken } from "../middleware/verifyToken.js";
import { verifyAdmin } from "../middleware/verifyAdmin.js";
import { awardExp, EXP_REWARDS } from "../utils/expSystem.js";

const router = Router();

// ── Helper: today's date string ───────────────────────────────
function todayStr() {
    return new Date().toISOString().split("T")[0]; // "2026-03-27"
}

// ── Helper: streak calculation ────────────────────────────────
function calcStreak(lastDate, currentStreak) {
    const today     = todayStr();
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

    if (lastDate === today)      return currentStreak;       // already done today
    if (lastDate === yesterday)  return currentStreak + 1;   // continued streak
    return 1;                                                // streak reset
}

// ══════════════════════════════════════════════
//  ADMIN — manage daily quiz questions
// ══════════════════════════════════════════════

// GET all daily quiz questions (pool)
router.get("/questions", verifyAdmin, async (req, res) => {
    try {
        const snap = await db.collection("dailyQuizPool").get();
        const questions = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.json(questions);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST add question to pool
router.post("/questions", verifyAdmin, async (req, res) => {
    try {
        const { question, options, correctIndex, category } = req.body;
        const ref = await db.collection("dailyQuizPool").add({
            question, options, correctIndex,
            category: category || "general",
            createdAt: new Date().toISOString(),
            createdBy: req.user.uid
        });
        res.json({ id: ref.id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT update question
router.put("/questions/:id", verifyAdmin, async (req, res) => {
    try {
        const { question, options, correctIndex, category } = req.body;
        await db.collection("dailyQuizPool").doc(req.params.id).update({
            question, options, correctIndex, category,
            updatedAt: new Date().toISOString()
        });
        res.json({ message: "Question updated" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE question
router.delete("/questions/:id", verifyAdmin, async (req, res) => {
    try {
        await db.collection("dailyQuizPool").doc(req.params.id).delete();
        res.json({ message: "Deleted" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ══════════════════════════════════════════════
//  USER — daily quiz flow
// ══════════════════════════════════════════════

// GET today's quiz (5 random questions)
router.get("/today", verifyToken, async (req, res) => {
    try {
        const uid      = req.user.uid;
        const today    = todayStr();

        // Check if user already completed today's quiz
        const userQuizRef = db.collection("users").doc(uid)
            .collection("dailyQuiz").doc(today);
        const userQuizDoc = await userQuizRef.get();

        if (userQuizDoc.exists) {
            return res.json({
                alreadyCompleted: true,
                score: userQuizDoc.data().score,
                expEarned: userQuizDoc.data().expEarned,
            });
        }

        // Get random 5 questions from pool
        const snap = await db.collection("dailyQuizPool").get();
        if (snap.empty) return res.status(404).json({ error: "No questions available" });

        const allQuestions = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const shuffled     = allQuestions.sort(() => Math.random() - 0.5).slice(0, 5);

        // Store which questions were assigned today (so same user gets same questions)
        await userQuizRef.set({
            questionIds: shuffled.map(q => q.id),
            assignedAt: new Date().toISOString(),
            completed: false
        });

        // Don't expose correctIndex to client
        const safeQuestions = shuffled.map(({ correctIndex, ...q }) => q);
        res.json({ questions: safeQuestions, alreadyCompleted: false });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST submit daily quiz answers
router.post("/submit", verifyToken, async (req, res) => {
    try {
        const uid    = req.user.uid;
        const today  = todayStr();
        const { answers } = req.body; // { questionId: selectedIndex, ... }

        // Check not already submitted
        const userQuizRef = db.collection("users").doc(uid)
            .collection("dailyQuiz").doc(today);
        const userQuizDoc = await userQuizRef.get();

        if (!userQuizDoc.exists) return res.status(400).json({ error: "Quiz not started" });
        if (userQuizDoc.data().completed) return res.status(400).json({ error: "Already submitted" });

        const questionIds = userQuizDoc.data().questionIds;

        // Fetch correct answers
        const questionDocs = await Promise.all(
            questionIds.map(id => db.collection("dailyQuizPool").doc(id).get())
        );

        let correct = 0;
        const results = questionDocs.map(doc => {
            const data        = doc.data();
            const userAnswer  = answers[doc.id];
            const isCorrect   = userAnswer === data.correctIndex;
            if (isCorrect) correct++;
            return { id: doc.id, correctIndex: data.correctIndex, userAnswer, isCorrect };
        });

        const score      = Math.round((correct / questionIds.length) * 100);
        const passed     = score >= 60; // daily quiz passes at 60%

        // Calculate EXP: base + streak bonus
        const userDoc    = await db.collection("users").doc(uid).get();
        const userData   = userDoc.exists ? userDoc.data() : {};
        const lastDate   = userData.lastQuizDate || "";
        const oldStreak  = userData.streak || 0;
        const newStreak  = passed ? calcStreak(lastDate, oldStreak) : oldStreak;

        let expEarned = 0;
        if (passed) {
            expEarned += EXP_REWARDS.DAILY_QUIZ;                          // +50
            if (newStreak > 1) expEarned += EXP_REWARDS.STREAK_BONUS;    // +10 per streak day
        }

        // Update quiz record
        await userQuizRef.set({
            questionIds, completed: true, score,
            answers, results, expEarned,
            completedAt: new Date().toISOString()
        }, { merge: true });

        // Update streak
        if (passed) {
            await db.collection("users").doc(uid).set({
                lastQuizDate: today,
                streak: newStreak,
                maxStreak: Math.max(newStreak, userData.maxStreak || 0)
            }, { merge: true });
        }

        // Award EXP
        let expResult = null;
        if (expEarned > 0) {
            expResult = await awardExp(db, uid, expEarned,
                `Daily quiz ${today} (streak: ${newStreak})`);
        }

        res.json({ score, passed, correct, total: questionIds.length, results, expEarned, streak: newStreak, levelUp: expResult?.levelUp || false, newLevel: expResult?.level });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET user stats (EXP, level, streak)
router.get("/stats", verifyToken, async (req, res) => {
    try {
        const uid     = req.user.uid;
        const userDoc = await db.collection("users").doc(uid).get();
        const data    = userDoc.exists ? userDoc.data() : {};

        const totalExp = data.totalExp || 0;
        const level    = data.level    || 1;
        const streak   = data.streak   || 0;
        const maxStreak = data.maxStreak || 0;

        // Check if completed today
        const today       = todayStr();
        const todayDocRef = db.collection("users").doc(uid).collection("dailyQuiz").doc(today);
        const todayDoc    = await todayDocRef.get();
        const completedToday = todayDoc.exists && todayDoc.data().completed;
        const todayScore     = completedToday ? todayDoc.data().score : null;

        res.json({
            totalExp, level, streak, maxStreak,
            completedToday, todayScore,
            expLog: (data.expLog || []).slice(-10)
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;