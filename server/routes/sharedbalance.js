import { Router } from "express";
import { db } from "../firebaseAdmin.js";
import { verifyToken } from "../middleware/verifyToken.js";
import crypto from "crypto";

const router = Router();


// ══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ══════════════════════════════════════════════════════════════

async function getUserBalanceRef(uid, balanceId = null) {
    const userRef = db.collection("users").doc(uid);

    if (!balanceId) {
        const snap = await userRef.collection("balances").limit(1).get();
        if (snap.empty) {
            const ref = await userRef.collection("balances").add({
                name: "Default",
                type: "general",
                balance: 0,
                budgetLimit: 0,
                totalSpent: 0,
                createdAt: new Date().toISOString()
            });
            return ref;
        }
        return snap.docs[0].ref;
    }

    const ref = userRef.collection("balances").doc(balanceId);
    const doc = await ref.get();

    if (!doc.exists) return null;
    return ref;
}

async function updateUserBalance(uid, amount, type, description, balanceId = null) {
    const balanceRef = await getUserBalanceRef(uid, balanceId);
    if (!balanceRef) throw new Error("Balance category not found");

    const balanceDoc = await balanceRef.get();
    const data = balanceDoc.data();

    const newBalance = type === "income"
        ? data.balance + amount
        : data.balance - amount;

    const spentDelta = type === "expense" ? amount : 0;
    const now = new Date();

    await balanceRef.update({
        balance: newBalance,
        totalSpent: (data.totalSpent || 0) + spentDelta
    });

    const txRef = await db.collection("users").doc(uid)
        .collection("transactions").add({
            balanceId: balanceRef.id,
            balanceName: data.name,
            balanceType: data.type,
            amount,
            type,
            description,
            category: "shared-group",
            date: now.toISOString(),
            month: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
        });

    return {
        newBalance,
        txId: txRef.id,
        balanceName: data.name
    };
}

async function reverseUserBalance(uid, txId, amount, type, balanceId = null) {
    const balanceRef = await getUserBalanceRef(uid, balanceId);
    if (!balanceRef) throw new Error("Balance category not found");

    const balanceDoc = await balanceRef.get();
    const data = balanceDoc.data();

    const reversedBalance = type === "income"
        ? data.balance - amount
        : data.balance + amount;

    const reversedSpent = type === "expense"
        ? Math.max(0, (data.totalSpent || 0) - amount)
        : data.totalSpent || 0;

    await balanceRef.update({
        balance: reversedBalance,
        totalSpent: reversedSpent
    });

    await db.collection("users").doc(uid)
        .collection("transactions").doc(txId).delete();
}


// ══════════════════════════════════════════════════════════════
// GROUP ROUTES
// ══════════════════════════════════════════════════════════════

// GET all groups
router.get("/", verifyToken, async (req, res) => {
    try {
        const uid = req.user.uid;

        const snap = await db.collection("sharedBalances")
            .where(`members.${uid}.uid`, "==", uid)
            .get();

        const groups = snap.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        res.json(groups);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET single group
router.get("/:groupId", verifyToken, async (req, res) => {
    try {
        const uid = req.user.uid;

        const doc = await db.collection("sharedBalances")
            .doc(req.params.groupId)
            .get();

        if (!doc.exists) {
            return res.status(404).json({ error: "Group not found" });
        }

        const data = doc.data();

        if (!data.members?.[uid]) {
            return res.status(403).json({ error: "Not a member" });
        }

        const txSnap = await doc.ref.collection("transactions").get();

        const transactions = txSnap.docs.map(d => ({
            id: d.id,
            ...d.data()
        })).sort((a, b) => new Date(b.date) - new Date(a.date));

        res.json({ id: doc.id, ...data, transactions });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// CREATE group
router.post("/", verifyToken, async (req, res) => {
    try {
        const uid = req.user.uid;
        const { name, description } = req.body;

        const inviteCode = crypto.randomBytes(4).toString("hex").toUpperCase();

        const ref = await db.collection("sharedBalances").add({
            name,
            description: description || "",
            balance: 0,
            inviteCode,
            createdBy: uid,
            createdAt: new Date().toISOString(),
            members: {
                [uid]: {
                    uid,
                    role: "admin",
                    joinedAt: new Date().toISOString(),
                    contributed: 0
                }
            }
        });

        res.json({ id: ref.id, inviteCode });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// JOIN via code
router.post("/join", verifyToken, async (req, res) => {
    try {
        const uid = req.user.uid;
        const { inviteCode } = req.body;

        const snap = await db.collection("sharedBalances")
            .where("inviteCode", "==", inviteCode)
            .limit(1)
            .get();

        if (snap.empty) {
            return res.status(404).json({ error: "Invalid code" });
        }

        const groupDoc = snap.docs[0];

        await groupDoc.ref.update({
            [`members.${uid}`]: {
                uid,
                role: "member",
                joinedAt: new Date().toISOString(),
                contributed: 0
            }
        });

        res.json({ message: "Joined" });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// ══════════════════════════════════════════════════════════════
// INVITES
// ══════════════════════════════════════════════════════════════

// GET pending invites
router.get("/invites/pending", verifyToken, async (req, res) => {
    try {
        const uid = req.user.uid;

        const snap = await db.collection("users")
            .doc(uid)
            .collection("invites")
            .where("status", "==", "pending")
            .get();

        const invites = snap.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        res.json(invites);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// ══════════════════════════════════════════════════════════════
// TRANSACTIONS
// ══════════════════════════════════════════════════════════════

// ADD transaction
router.post("/:groupId/transaction", verifyToken, async (req, res) => {
    try {
        const uid = req.user.uid;
        const { amount, type, description, personalBalanceId } = req.body;

        const groupRef = db.collection("sharedBalances").doc(req.params.groupId);
        const groupDoc = await groupRef.get();

        if (!groupDoc.exists) {
            return res.status(404).json({ error: "Group not found" });
        }

        const groupData = groupDoc.data();

        const newBalance = type === "income"
            ? groupData.balance + amount
            : groupData.balance - amount;

        const txRef = await groupRef.collection("transactions").add({
            amount,
            type,
            description,
            personalBalanceId,
            addedBy: uid,
            date: new Date().toISOString()
        });

        await groupRef.update({ balance: newBalance });

        const { txId } = await updateUserBalance(
            uid,
            amount,
            type,
            `[${groupData.name}] ${description}`,
            personalBalanceId
        );

        await txRef.update({ linkedPersonalTxId: txId });

        res.json({ success: true });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE transaction
router.delete("/:groupId/transaction/:txId", verifyToken, async (req, res) => {
    try {
        const uid = req.user.uid;
        const { groupId, txId } = req.params;

        const groupRef = db.collection("sharedBalances").doc(groupId);
        const groupDoc = await groupRef.get();

        const txRef = groupRef.collection("transactions").doc(txId);
        const txDoc = await txRef.get();

        if (!txDoc.exists) {
            return res.status(404).json({ error: "Transaction not found" });
        }

        const tx = txDoc.data();

        const newBalance = tx.type === "income"
            ? groupDoc.data().balance - tx.amount
            : groupDoc.data().balance + tx.amount;

        await groupRef.update({ balance: newBalance });

        if (tx.linkedPersonalTxId) {
            await reverseUserBalance(
                uid,
                tx.linkedPersonalTxId,
                tx.amount,
                tx.type,
                tx.personalBalanceId
            );
        }

        await txRef.delete();

        res.json({ message: "Deleted" });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;