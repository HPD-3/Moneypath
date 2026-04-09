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


        const userDoc = await db.collection("users").doc(uid).get();
        const userData = userDoc.data() || {};

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
                    name: userData.name ?? "Unknown", // ✅ FIX
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
        const userDoc = await db.collection("users").doc(uid).get();
        const userData = userDoc.data() || {};

        await groupDoc.ref.update({
            [`members.${uid}`]: {
                uid,
                name: userData.name ?? req.user.email?.split("@")[0] ?? "Unknown",
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

// SEND invite (POST)
router.post("/:groupId/invite", verifyToken, async (req, res) => {
    try {
        const uid = req.user.uid;
        const { groupId } = req.params;
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ error: "Email required" });
        }

        const groupRef = db.collection("sharedBalances").doc(groupId);
        const groupDoc = await groupRef.get();

        if (!groupDoc.exists) {
            return res.status(404).json({ error: "Group not found" });
        }

        const groupData = groupDoc.data();

        if (groupData.members?.[uid]?.role !== "admin") {
            return res.status(403).json({ error: "Only admins can invite" });
        }

        // Find user by email
        const userSnap = await db.collection("users")
            .where("email", "==", email)
            .limit(1)
            .get();

        if (userSnap.empty) {
            return res.status(404).json({ error: "User not found" });
        }

        const targetUid = userSnap.docs[0].id;

        if (groupData.members?.[targetUid]) {
            return res.status(400).json({ error: "Already a member" });
        }

        await db.collection("users")
            .doc(targetUid)
            .collection("invites")
            .add({
                groupId,
                groupName: groupData.name,
                invitedBy: uid,
                status: "pending",
                createdAt: new Date().toISOString()
            });

        res.json({ message: "Invite sent" });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ACCEPT invite (POST)
router.post("/invites/:groupId/accept", verifyToken, async (req, res) => {
    try {
        const uid = req.user.uid;
        const { groupId } = req.params;

        const groupRef = db.collection("sharedBalances").doc(groupId);
        const groupDoc = await groupRef.get();

        if (!groupDoc.exists) {
            return res.status(404).json({ error: "Group not found" });
        }

        const groupData = groupDoc.data();
        const userData = (await db.collection("users").doc(uid).get()).data() || {};

        // Add member to group
        await groupRef.update({
            [`members.${uid}`]: {
                uid,
                role: "member",
                name: userData.name ?? "Unknown",
                joinedAt: new Date().toISOString(),
                contributed: 0
            }
        });

        // Remove invite
        const inviteSnap = await db.collection("users")
            .doc(uid)
            .collection("invites")
            .where("groupId", "==", groupId)
            .limit(1)
            .get();

        if (!inviteSnap.empty) {
            await inviteSnap.docs[0].ref.delete();
        }

        res.json({ message: "Joined group" });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// REMOVE member (DELETE)
router.delete("/:groupId/members/:memberId", verifyToken, async (req, res) => {
    try {
        const uid = req.user.uid;
        const { groupId, memberId } = req.params;

        const groupRef = db.collection("sharedBalances").doc(groupId);
        const groupDoc = await groupRef.get();

        if (!groupDoc.exists) {
            return res.status(404).json({ error: "Group not found" });
        }

        const groupData = groupDoc.data();

        if (groupData.members?.[uid]?.role !== "admin") {
            return res.status(403).json({ error: "Only admins can remove members" });
        }

        if (memberId === uid) {
            return res.status(400).json({ error: "Cannot remove yourself. Delete group instead" });
        }

        const newMembers = { ...groupData.members };
        delete newMembers[memberId];

        await groupRef.update({
            members: newMembers
        });

        res.json({ message: "Member removed" });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// REGENERATE invite code (POST)
router.post("/:groupId/regenerate-code", verifyToken, async (req, res) => {
    try {
        const uid = req.user.uid;
        const { groupId } = req.params;

        const groupRef = db.collection("sharedBalances").doc(groupId);
        const groupDoc = await groupRef.get();

        if (!groupDoc.exists) {
            return res.status(404).json({ error: "Group not found" });
        }

        const groupData = groupDoc.data();

        if (groupData.members?.[uid]?.role !== "admin") {
            return res.status(403).json({ error: "Only admins can regenerate code" });
        }

        const newCode = crypto.randomBytes(4).toString("hex").toUpperCase();

        await groupRef.update({
            inviteCode: newCode
        });

        res.json({ inviteCode: newCode });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE group (DELETE)
router.delete("/:groupId", verifyToken, async (req, res) => {
    try {
        const uid = req.user.uid;
        const { groupId } = req.params;

        const groupRef = db.collection("sharedBalances").doc(groupId);
        const groupDoc = await groupRef.get();

        if (!groupDoc.exists) {
            return res.status(404).json({ error: "Group not found" });
        }

        const groupData = groupDoc.data();

        if (groupData.createdBy !== uid) {
            return res.status(403).json({ error: "Only creator can delete group" });
        }

        // Delete all transactions in the group
        const txSnap = await groupRef.collection("transactions").get();
        for (const doc of txSnap.docs) {
            await doc.ref.delete();
        }

        // Delete the group
        await groupRef.delete();

        res.json({ message: "Group deleted" });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// ══════════════════════════════════════════════════════════════
// TRANSACTIONS
// ══════════════════════════════════════════════════════════════

router.post("/:groupId/transaction", verifyToken, async (req, res) => {
    try {
        const uid = req.user.uid;

        // ✅ Ambil semua dari body
        const { amount, type, description, note, personalBalanceId } = req.body;

        // ✅ Validasi basic
        if (!amount || amount <= 0) {
            return res.status(400).json({ error: "Jumlah tidak valid" });
        }

        const groupRef = db.collection("sharedBalances").doc(req.params.groupId);
        const groupDoc = await groupRef.get();

        if (!groupDoc.exists) {
            return res.status(404).json({ error: "Group not found" });
        }

        const groupData = groupDoc.data();

        if (!groupData.members?.[uid]) {
            return res.status(403).json({ error: "Kamu bukan anggota grup ini" });
        }

        // ✅ Ambil nama user
        const personalDoc = await db.collection("personalDocuments").doc(uid).get();
        const memberName = personalDoc.exists
            ? personalDoc.data().name
            : req.user.email?.split("@")[0] || "Unknown";

        // ✅ Hitung saldo grup
        const newBalance = type === "income"
            ? (groupData.balance || 0) + amount
            : (groupData.balance || 0) - amount;

        if (newBalance < 0 && type === "expense") {
            return res.status(400).json({ error: "Saldo grup tidak mencukupi" });
        }

        // ════════════════════════════════
        // ✅ SYNC PERSONAL (FIX LOGIC)
        // ════════════════════════════════
        let personalTx = null;

        if (personalBalanceId && type === "income") {
            // 💡 Setor ke grup = uang keluar dari pribadi
            try {
                personalTx = await updateUserBalance(
                    uid,
                    amount,
                    "expense", // ✅ FIX: bukan type langsung
                    `${description} (Setor ke ${groupData.name})`,
                    personalBalanceId
                );
            } catch (txErr) {
                console.error("❌ Failed to create personal transaction:", txErr.message);
                // Continue anyway - the shared balance transaction is still valid
            }
        }

        // ════════════════════════════════
        // ✅ SIMPAN KE GROUP
        // ════════════════════════════════
        const txRef = await groupRef.collection("transactions").add({
            amount,
            type,
            description,
            note: note || "",
            addedBy: uid,
            addedByName: memberName,
            date: new Date().toISOString(),

            // ✅ LINK
            linkedPersonalTxId: personalTx?.txId || null,
            personalBalanceId: personalBalanceId || null
        });

        // ✅ Update saldo grup
        await groupRef.update({
            balance: newBalance,
            [`members.${uid}.contributed`]:
                (groupData.members[uid].contributed || 0) +
                (type === "income" ? amount : 0)
        });

        res.json({
            newBalance,
            txId: txRef.id,
            personalTxId: personalTx?.txId || null
        });
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