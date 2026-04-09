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

        if (!amount || isNaN(amount) || amount <= 0) {
            return res.status(400).json({ error: "Jumlah alokasi harus lebih dari 0" });
        }

        // Get tabungan target
        const tabRef = db.collection("users").doc(uid)
            .collection("tabungan").doc(req.params.id);
        const tabDoc = await tabRef.get();
        if (!tabDoc.exists) return res.status(404).json({ error: "Target tidak ditemukan" });

        const tab = tabDoc.data();
        const parsedAmount = parseFloat(amount);
        const newTerkumpul = (tab.terkumpul || 0) + parsedAmount;
        const isCompleted = newTerkumpul >= tab.targetAmount;

        // Get balance category
        const balRef = db.collection("users").doc(uid)
            .collection("balances").doc(balanceId);
        const balDoc = await balRef.get();
        if (!balDoc.exists) return res.status(404).json({ error: "Saldo tidak ditemukan" });

        const balData = balDoc.data();
        const currentBalance = balData.balance || 0;
        if (currentBalance < parsedAmount) {
            return res.status(400).json({ error: "Saldo tidak mencukupi" });
        }

        const now = new Date();
        const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

        // Update balance
        const spentDelta = parsedAmount;
        await balRef.update({
            balance: currentBalance - parsedAmount,
            totalSpent: (balData.totalSpent || 0) + spentDelta
        });

        // Update tabungan
        await tabRef.update({
            terkumpul: newTerkumpul,
            isCompleted,
            completedAt: isCompleted ? now.toISOString() : null,
            updatedAt: now.toISOString()
        });

        // Log transaction in balance transactions (with consistent structure)
        const txRef = await db.collection("users").doc(uid)
            .collection("transactions").add({
                balanceId,
                balanceName: balanceName || balData.name,
                balanceType: balData.type,
                amount: parsedAmount,
                type: "expense",
                description: `Alokasi tabungan: ${tab.name}`,
                category: "tabungan",
                tabunganId: req.params.id,
                tabunganName: tab.name,
                date: now.toISOString(),
                month
            });

        // Log in tabungan riwayat
        await tabRef.collection("riwayat").add({
            transactionId: txRef.id,
            amount: parsedAmount,
            balanceId,
            balanceName: balanceName || balData.name,
            date: now.toISOString(),
            type: "setoran"
        });

        res.json({ newTerkumpul, isCompleted, transactionId: txRef.id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── POST checkout tabungan to personal balance ─────────────────
router.post("/:id/checkout", verifyToken, async (req, res) => {
    try {
        const uid = req.user.uid;
        const { personalBalanceId } = req.body;

        if (!personalBalanceId) {
            return res.status(400).json({ error: "Personal balance ID is required" });
        }

        // Get tabungan target
        const tabRef = db.collection("users").doc(uid)
            .collection("tabungan").doc(req.params.id);
        const tabDoc = await tabRef.get();
        if (!tabDoc.exists) {
            return res.status(404).json({ error: "Target tidak ditemukan" });
        }

        const tab = tabDoc.data();

        // Check if tabungan is completed
        if (!tab.isCompleted) {
            return res.status(400).json({ error: "Target belum selesai, tidak dapat checkout" });
        }

        // Check if already withdrawn
        if (tab.isWithdrawn) {
            return res.status(400).json({ error: "Target sudah di-checkout sebelumnya" });
        }

        const terkumpulAmount = tab.terkumpul || 0;
        if (terkumpulAmount <= 0) {
            return res.status(400).json({ error: "Tidak ada saldo untuk di-checkout" });
        }

        // Get personal balance
        const balRef = db.collection("users").doc(uid)
            .collection("balances").doc(personalBalanceId);
        const balDoc = await balRef.get();
        if (!balDoc.exists) {
            return res.status(404).json({ error: "Balance tidak ditemukan" });
        }

        const balData = balDoc.data();
        const now = new Date();
        const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

        // Add amount back to personal balance
        await balRef.update({
            balance: (balData.balance || 0) + terkumpulAmount
        });

        // Mark tabungan as withdrawn
        await tabRef.update({
            isWithdrawn: true,
            withdrawnAt: now.toISOString(),
            updatedAt: now.toISOString()
        });

        // Record income transaction in balance
        const txRef = await db.collection("users").doc(uid)
            .collection("transactions").add({
                balanceId: personalBalanceId,
                balanceName: balData.name,
                balanceType: balData.type,
                amount: terkumpulAmount,
                type: "income",
                description: `Checkout tabungan: ${tab.name}`,
                category: "tabungan",
                tabunganId: req.params.id,
                tabunganName: tab.name,
                date: now.toISOString(),
                month
            });

        // Log in tabungan riwayat
        await tabRef.collection("riwayat").add({
            transactionId: txRef.id,
            amount: terkumpulAmount,
            balanceId: personalBalanceId,
            balanceName: balData.name,
            date: now.toISOString(),
            type: "penarikan"
        });

        res.json({
            message: "Tabungan berhasil di-checkout",
            checkedOutAmount: terkumpulAmount,
            newBalance: (balData.balance || 0) + terkumpulAmount,
            transactionId: txRef.id
        });
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