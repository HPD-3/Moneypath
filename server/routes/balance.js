import { Router } from "express";
import { db } from "../firebaseAdmin.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = Router();

// GET all balance categories
router.get("/", verifyToken, async (req, res) => {
    try {
        const uid = req.user.uid;
        const snap = await db.collection("users").doc(uid)
            .collection("balances").get();
        const balances = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.json(balances);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST create new balance category
router.post("/", verifyToken, async (req, res) => {
    try {
        const uid = req.user.uid;
        const { name, type, balance = 0, budgetLimit = 0 } = req.body;

        if (!name || !type) {
            return res.status(400).json({ error: "Name and type are required" });
        }

        const ref = await db.collection("users").doc(uid)
            .collection("balances").add({
                name,
                type,
                balance,
                budgetLimit,
                totalSpent: 0,
                createdAt: new Date().toISOString()
            });

        res.json({ id: ref.id, name, type, balance, budgetLimit, totalSpent: 0 });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE a balance category
router.delete("/:id", verifyToken, async (req, res) => {
    try {
        const uid = req.user.uid;
        const balanceRef = db.collection("users").doc(uid)
            .collection("balances").doc(req.params.id);

        const doc = await balanceRef.get();
        if (!doc.exists) return res.status(404).json({ error: "Category not found" });

        await balanceRef.delete();
        res.json({ message: "Category deleted" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PATCH update budget limit
router.patch("/:id/limit", verifyToken, async (req, res) => {
    try {
        const uid = req.user.uid;
        const { budgetLimit } = req.body;

        if (budgetLimit === undefined || isNaN(budgetLimit)) {
            return res.status(400).json({ error: "Valid budgetLimit is required" });
        }

        await db.collection("users").doc(uid)
            .collection("balances").doc(req.params.id)
            .update({ budgetLimit: parseFloat(budgetLimit) });

        res.json({ message: "Budget limit updated" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST add a transaction
router.post("/:id/transaction", verifyToken, async (req, res) => {
    try {
        const uid = req.user.uid;
        const { amount, type, description, category } = req.body;

        if (!amount || isNaN(amount) || amount <= 0) {
            return res.status(400).json({ error: "Valid positive amount is required" });
        }
        if (!["income", "expense"].includes(type)) {
            return res.status(400).json({ error: "Type must be income or expense" });
        }
        if (!description?.trim()) {
            return res.status(400).json({ error: "Description is required" });
        }

        const balanceRef = db.collection("users").doc(uid)
            .collection("balances").doc(req.params.id);

        const balanceDoc = await balanceRef.get();
        if (!balanceDoc.exists) return res.status(404).json({ error: "Category not found" });

        const data = balanceDoc.data();
        const parsedAmount = parseFloat(amount);
        const newBalance = type === "income"
            ? data.balance + parsedAmount
            : data.balance - parsedAmount;

        // Track total spent for budget tracking (expenses only)
        const spentDelta = type === "expense" ? parsedAmount : 0;
        const now = new Date();

        await balanceRef.update({
            balance: newBalance,
            totalSpent: (data.totalSpent || 0) + spentDelta
        });

        const txRef = await db.collection("users").doc(uid)
            .collection("transactions").add({
                balanceId: req.params.id,
                balanceName: data.name,
                balanceType: data.type,
                amount: parsedAmount,
                type,
                description: description.trim(),
                category: category || null,
                date: now.toISOString(),
                month: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
            });

        res.json({ id: txRef.id, newBalance });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE a transaction (and reverse its effect on balance)
router.delete("/:balanceId/transaction/:txId", verifyToken, async (req, res) => {
    try {
        const uid = req.user.uid;
        const { balanceId, txId } = req.params;

        const txRef = db.collection("users").doc(uid)
            .collection("transactions").doc(txId);
        const txDoc = await txRef.get();

        if (!txDoc.exists) return res.status(404).json({ error: "Transaction not found" });

        const tx = txDoc.data();
        const balanceRef = db.collection("users").doc(uid)
            .collection("balances").doc(balanceId);
        const balanceDoc = await balanceRef.get();

        if (balanceDoc.exists) {
            const data = balanceDoc.data();
            // Reverse the transaction on the balance
            const reversedBalance = tx.type === "income"
                ? data.balance - tx.amount
                : data.balance + tx.amount;
            const reversedSpent = tx.type === "expense"
                ? Math.max(0, (data.totalSpent || 0) - tx.amount)
                : data.totalSpent || 0;

            await balanceRef.update({
                balance: reversedBalance,
                totalSpent: reversedSpent
            });
        }

        await txRef.delete();
        res.json({ message: "Transaction deleted" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET all transactions (SAFE VERSION - no index crash)
router.get("/transactions", verifyToken, async (req, res) => {
    try {
        const uid = req.user.uid;
        const { month, limit = 50, type } = req.query;

        // 🔥 SIMPLE QUERY (no where + order conflict)
        let query = db.collection("users")
            .doc(uid)
            .collection("transactions")
            .orderBy("date", "desc")
            .limit(parseInt(limit));

        const snap = await query.get();

        let transactions = snap.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        // ✅ FILTER IN MEMORY (SAFE)
        if (month) {
            transactions = transactions.filter(tx => tx.month === month);
        }

        if (type) {
            transactions = transactions.filter(tx => tx.type === type);
        }

        res.json(transactions);
    } catch (err) {
        console.error("🔥 TRANSACTION ERROR:", err);
        res.status(500).json({ error: err.message });
    }
});

// GET monthly summary (total income, expenses, net, per-category breakdown)
router.get("/summary", verifyToken, async (req, res) => {
    try {
        const uid = req.user.uid;
        const now = new Date();
        const month = req.query.month ||
            `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

        const snap = await db.collection("users").doc(uid)
            .collection("transactions")
            .where("month", "==", month)
            .get();

        const transactions = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        let totalIncome = 0;
        let totalExpense = 0;
        const byCategory = {};

        for (const tx of transactions) {
            if (tx.type === "income") totalIncome += tx.amount;
            else totalExpense += tx.amount;

            const key = tx.balanceName || "Other";
            if (!byCategory[key]) byCategory[key] = { income: 0, expense: 0 };
            byCategory[key][tx.type === "income" ? "income" : "expense"] += tx.amount;
        }

        res.json({
            month,
            totalIncome,
            totalExpense,
            net: totalIncome - totalExpense,
            byCategory,
            transactionCount: transactions.length
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;