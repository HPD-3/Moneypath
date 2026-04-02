import { Router } from "express";
import { db } from "../firebaseAdmin.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = Router();

// ── GET all savings targets ───────────────────────────────────
router.get("/", verifyToken, async (req, res) => {
    try {
        const uid  = req.user.uid;
        const snap = await db.collection("users").doc(uid)
            .collection("tabungan").get();
        const targets = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        targets.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        res.json(targets);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── GET single target ─────────────────────────────────────────
router.get("/:id", verifyToken, async (req, res) => {
    try {
        const uid = req.user.uid;
        const doc = await db.collection("users").doc(uid)
            .collection("tabungan").doc(req.params.id).get();
        if (!doc.exists) return res.status(404).json({ error: "Target tidak ditemukan" });
        res.json({ id: doc.id, ...doc.data() });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── POST create savings target ────────────────────────────────
router.post("/", verifyToken, async (req, res) => {
    try {
        const uid = req.user.uid;
        const { name, targetAmount, deadline, imageUrl, category } = req.body;

        const ref = await db.collection("users").doc(uid)
            .collection("tabungan").add({
                name,
                targetAmount,
                terkumpul: 0,           // amount collected so far
                deadline: deadline || null,
                imageUrl: imageUrl || null,
                category: category || "umum",
                isCompleted: false,
                createdAt: new Date().toISOString(),
            });

        res.json({ id: ref.id, name, targetAmount, terkumpul: 0 });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── PUT update target info ────────────────────────────────────
router.put("/:id", verifyToken, async (req, res) => {
    try {
        const uid = req.user.uid;
        const { name, targetAmount, deadline, imageUrl, category } = req.body;

        await db.collection("users").doc(uid)
            .collection("tabungan").doc(req.params.id)
            .update({ name, targetAmount, deadline, imageUrl, category,
                updatedAt: new Date().toISOString() });

        res.json({ message: "Target diperbarui" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── POST alokasikan saldo ke tabungan ─────────────────────────
router.post("/:id/alokasi", verifyToken, async (req, res) => {
    try {
        const uid = req.user.uid;
        const { amount, balanceId, balanceName } = req.body;
        // balanceId = which balance category to deduct from

        const tabRef = db.collection("users").doc(uid)
            .collection("tabungan").doc(req.params.id);
        const tabDoc = await tabRef.get();
        if (!tabDoc.exists) return res.status(404).json({ error: "Target tidak ditemukan" });

        const tab         = tabDoc.data();
        const newTerkumpul = (tab.terkumpul || 0) + amount;
        const isCompleted  = newTerkumpul >= tab.targetAmount;

        // Deduct from balance
        const balRef  = db.collection("users").doc(uid)
            .collection("balances").doc(balanceId);
        const balDoc  = await balRef.get();
        if (!balDoc.exists) return res.status(404).json({ error: "Saldo tidak ditemukan" });

        const currentBalance = balDoc.data().balance || 0;
        if (currentBalance < amount) {
            return res.status(400).json({ error: "Saldo tidak mencukupi" });
        }

        // Update balance
        await balRef.update({ balance: currentBalance - amount });

        // Update tabungan
        await tabRef.update({
            terkumpul: newTerkumpul,
            isCompleted,
            completedAt: isCompleted ? new Date().toISOString() : null,
        });

        // Log the transaction in balance transactions
        await db.collection("users").doc(uid)
            .collection("transactions").add({
                balanceId,
                balanceName,
                amount,
                type: "expense",
                description: `Alokasi tabungan: ${tab.name}`,
                date: new Date().toISOString(),
            });

        // Log in tabungan riwayat
        await tabRef.collection("riwayat").add({
            amount,
            balanceName,
            date: new Date().toISOString(),
            type: "setoran",
        });

        res.json({ newTerkumpul, isCompleted });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── GET riwayat setoran per target ───────────────────────────
router.get("/:id/riwayat", verifyToken, async (req, res) => {
    try {
        const uid  = req.user.uid;
        const snap = await db.collection("users").doc(uid)
            .collection("tabungan").doc(req.params.id)
            .collection("riwayat").get();
        const riwayat = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        riwayat.sort((a, b) => new Date(b.date) - new Date(a.date));
        res.json(riwayat);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── DELETE target ─────────────────────────────────────────────
router.delete("/:id", verifyToken, async (req, res) => {
    try {
        const uid = req.user.uid;
        await db.collection("users").doc(uid)
            .collection("tabungan").doc(req.params.id).delete();
        res.json({ message: "Target dihapus" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;