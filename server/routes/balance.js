import { Router } from "express";
import { db } from "../firebaseAdmin.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = Router();

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


router.post("/", verifyToken, async (req, res) => {
    try {
        const uid = req.user.uid;
        const { name, type, balance = 0, budgetLimit = 0 } = req.body;

        const ref = await db.collection("users").doc(uid)
            .collection("balances").add({
                name,
                type,
                balance,
                budgetLimit,
                createdAt: new Date().toISOString()
            });

        res.json({ id: ref.id, name, type, balance, budgetLimit });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.patch("/:id/limit", verifyToken, async (req, res) => {
    try {
        const uid = req.user.uid;
        const { budgetLimit } = req.body;

        await db.collection("users").doc(uid)
            .collection("balances").doc(req.params.id)
            .update({ budgetLimit });

        res.json({ message: "Budget limit updated" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


router.post("/:id/transaction", verifyToken, async (req, res) => {
    try {
        const uid = req.user.uid;
        const { amount, type, description } = req.body;


        const balanceRef = db.collection("users").doc(uid)
            .collection("balances").doc(req.params.id);

        const balanceDoc = await balanceRef.get();
        if (!balanceDoc.exists) return res.status(404).json({ error: "Category not found" });

        const currentBalance = balanceDoc.data().balance;
        const newBalance = type === "income"
            ? currentBalance + amount
            : currentBalance - amount;


        await balanceRef.update({ balance: newBalance });


        await db.collection("users").doc(uid)
            .collection("transactions").add({
                balanceId: req.params.id,
                balanceName: balanceDoc.data().name,
                amount,
                type,
                description,
                date: new Date().toISOString()
            });

        res.json({ newBalance });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


router.get("/transactions", verifyToken, async (req, res) => {
    try {
        const uid = req.user.uid;
        const snap = await db.collection("users").doc(uid)
            .collection("transactions")
            .orderBy("date", "desc")
            .limit(50)
            .get();

        const transactions = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.json(transactions);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;