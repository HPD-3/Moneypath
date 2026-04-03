import { Router } from "express";
import { db } from "../firebaseAdmin.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = Router();

// ── POST create a new shared balance ────────────────────────────────
router.post("/", verifyToken, async (req, res) => {
    try {
        const uid = req.user.uid;
        const { name, description = "", currency = "IDR" } = req.body;

        const ref = await db.collection("sharedBalances").add({
            name,
            description,
            currency,
            createdBy: uid,
            createdAt: new Date().toISOString(),
            totalBalance: 0,
            members: {
                [uid]: {
                    email: req.user.email,
                    role: "admin",
                    joinedAt: new Date().toISOString(),
                    contribution: 0,
                },
            },
        });

        // Initialize user's progress document
        await db
            .collection("sharedBalances")
            .doc(ref.id)
            .collection("memberProgress")
            .doc(uid)
            .set({
                memberId: uid,
                email: req.user.email,
                role: "admin",
                joinedAt: new Date().toISOString(),
            });

        res.json({ id: ref.id, name, description, currency });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── GET all shared balances for user ───────────────────────────────
router.get("/", verifyToken, async (req, res) => {
    try {
        const uid = req.user.uid;
        const snap = await db
            .collection("sharedBalances")
            .where(`members.${uid}`, "!=", null)
            .get();

        const balances = snap.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));

        res.json(balances);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── GET specific shared balance details ─────────────────────────────
router.get("/:balanceId", verifyToken, async (req, res) => {
    try {
        const uid = req.user.uid;
        const { balanceId } = req.params;

        const doc = await db.collection("sharedBalances").doc(balanceId).get();

        if (!doc.exists) {
            return res.status(404).json({ error: "Balance not found" });
        }

        const data = doc.data();

        // Check if user is member
        if (!data.members[uid]) {
            return res.status(403).json({ error: "Not a member" });
        }

        res.json({ id: balanceId, ...data });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── POST invite member by email ────────────────────────────────────
router.post("/:balanceId/invite", verifyToken, async (req, res) => {
    try {
        const uid = req.user.uid;
        const { balanceId } = req.params;
        const { email, inviteType } = req.body; // inviteType: "email" or "uid"

        const balanceRef = db.collection("sharedBalances").doc(balanceId);
        const balanceDoc = await balanceRef.get();

        if (!balanceDoc.exists) {
            return res.status(404).json({ error: "Balance not found" });
        }

        const data = balanceDoc.data();

        // Check if requester is admin
        if (data.members[uid]?.role !== "admin") {
            return res.status(403).json({ error: "Only admins can invite" });
        }

        // Create invitation (send to admin to approve or auto-add)
        const inviteRef = await db
            .collection("sharedBalances")
            .doc(balanceId)
            .collection("invitations")
            .add({
                email,
                role: "member",
                invitedBy: uid,
                status: "pending", // pending | accepted | rejected
                createdAt: new Date().toISOString(),
            });

        res.json({ inviteId: inviteRef.id, email, status: "pending" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── POST add member directly ───────────────────────────────────────
router.post("/:balanceId/members", verifyToken, async (req, res) => {
    try {
        const uid = req.user.uid;
        const { balanceId } = req.params;
        const { memberId, memberEmail, role = "member" } = req.body;

        const balanceRef = db.collection("sharedBalances").doc(balanceId);
        const balanceDoc = await balanceRef.get();

        if (!balanceDoc.exists) {
            return res.status(404).json({ error: "Balance not found" });
        }

        const data = balanceDoc.data();

        // Check if requester is admin
        if (data.members[uid]?.role !== "admin") {
            return res.status(403).json({ error: "Only admins can add members" });
        }

        // Add member
        await balanceRef.update({
            [`members.${memberId}`]: {
                email: memberEmail,
                role,
                joinedAt: new Date().toISOString(),
                contribution: 0,
            },
        });

        // Initialize member progress document
        await balanceRef
            .collection("memberProgress")
            .doc(memberId)
            .set({
                memberId,
                email: memberEmail,
                role,
                joinedAt: new Date().toISOString(),
            });

        res.json({ memberId, role, message: "Member added" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── PATCH update member role ───────────────────────────────────────
router.patch("/:balanceId/members/:memberId/role", verifyToken, async (req, res) => {
    try {
        const uid = req.user.uid;
        const { balanceId, memberId } = req.params;
        const { role } = req.body; // admin | member | viewer

        const balanceRef = db.collection("sharedBalances").doc(balanceId);
        const balanceDoc = await balanceRef.get();

        if (!balanceDoc.exists) {
            return res.status(404).json({ error: "Balance not found" });
        }

        const data = balanceDoc.data();

        // Check if requester is admin
        if (data.members[uid]?.role !== "admin") {
            return res.status(403).json({ error: "Only admins can change roles" });
        }

        // Update role
        const memberData = data.members[memberId];
        await balanceRef.update({
            [`members.${memberId}`]: {
                ...memberData,
                role,
            },
        });

        // Update member progress
        await balanceRef
            .collection("memberProgress")
            .doc(memberId)
            .update({ role });

        res.json({ memberId, role, message: "Role updated" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── DELETE remove member ───────────────────────────────────────────
router.delete("/:balanceId/members/:memberId", verifyToken, async (req, res) => {
    try {
        const uid = req.user.uid;
        const { balanceId, memberId } = req.params;

        const balanceRef = db.collection("sharedBalances").doc(balanceId);
        const balanceDoc = await balanceRef.get();

        if (!balanceDoc.exists) {
            return res.status(404).json({ error: "Balance not found" });
        }

        const data = balanceDoc.data();

        // Check if requester is admin
        if (data.members[uid]?.role !== "admin") {
            return res.status(403).json({ error: "Only admins can remove members" });
        }

        // Remove member
        const updateObj = {};
        updateObj[`members.${memberId}`] = db.FieldValue.delete();
        await balanceRef.update(updateObj);

        res.json({ message: "Member removed" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── POST add transaction to shared balance ──────────────────────────
router.post("/:balanceId/transactions", verifyToken, async (req, res) => {
    try {
        const uid = req.user.uid;
        const { balanceId } = req.params;
        const { amount, paidBy, description, category = "general", items = [] } = req.body;

        const balanceRef = db.collection("sharedBalances").doc(balanceId);
        const balanceDoc = await balanceRef.get();

        if (!balanceDoc.exists) {
            return res.status(404).json({ error: "Balance not found" });
        }

        const data = balanceDoc.data();

        // Check if user is member
        if (!data.members[uid]) {
            return res.status(403).json({ error: "Not a member" });
        }

        // Calculate split (equal split among all members by default)
        const memberIds = Object.keys(data.members);
        const perPersonAmount = amount / memberIds.length;

        const split = {};
        memberIds.forEach((mId) => {
            split[mId] = {
                amount: perPersonAmount,
                settled: mId === paidBy,
            };
        });

        // Add transaction
        const txRef = await balanceRef.collection("transactions").add({
            amount,
            paidBy,
            paidByEmail: data.members[paidBy]?.email,
            description,
            category,
            items,
            split,
            date: new Date().toISOString(),
            createdBy: uid,
            notes: [],
            settled: false,
        });

        // Update member's contribution
        const paidByContribution = data.members[paidBy]?.contribution || 0;
        await balanceRef.update({
            [`members.${paidBy}.contribution`]: paidByContribution + amount,
            totalBalance: (data.totalBalance || 0) + amount,
        });

        res.json({
            id: txRef.id,
            amount,
            paidBy,
            description,
            split,
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// ── POST accept invitation ───────────────────────────────────────
router.post("/:balanceId/invitations/:inviteId/accept", verifyToken, async (req, res) => {
    try {
        const uid = req.user.uid;
        const userEmail = req.user.email;
        const { balanceId, inviteId } = req.params;

        const balanceRef = db.collection("sharedBalances").doc(balanceId);
        const inviteRef = balanceRef.collection("invitations").doc(inviteId);

        const [balanceDoc, inviteDoc] = await Promise.all([
            balanceRef.get(),
            inviteRef.get(),
        ]);

        if (!balanceDoc.exists) {
            return res.status(404).json({ error: "Balance not found" });
        }

        if (!inviteDoc.exists) {
            return res.status(404).json({ error: "Invitation not found" });
        }

        const inviteData = inviteDoc.data();

        // Check email matches
        if (inviteData.email !== userEmail) {
            return res.status(403).json({ error: "This invite is not for you" });
        }

        if (inviteData.status !== "pending") {
            return res.status(400).json({ error: "Invite already processed" });
        }

        const balanceData = balanceDoc.data();

        // Add user to members
        await balanceRef.update({
            [`members.${uid}`]: {
                email: userEmail,
                role: inviteData.role || "member",
                joinedAt: new Date().toISOString(),
                contribution: 0,
            },
        });

        // Create member progress
        await balanceRef
            .collection("memberProgress")
            .doc(uid)
            .set({
                memberId: uid,
                email: userEmail,
                role: inviteData.role || "member",
                joinedAt: new Date().toISOString(),
            });

        // Update invitation status
        await inviteRef.update({
            status: "accepted",
            acceptedAt: new Date().toISOString(),
        });

        res.json({ message: "Invitation accepted", balanceId });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── GET invitations for current user ─────────────────────────────
router.get("/invitations/me", verifyToken, async (req, res) => {
    try {
        const userEmail = req.user.email;

        const balancesSnap = await db.collection("sharedBalances").get();

        let invites = [];

        for (const doc of balancesSnap.docs) {
            const invSnap = await doc.ref
                .collection("invitations")
                .where("email", "==", userEmail)
                .where("status", "==", "pending")
                .get();

            invSnap.forEach((inv) => {
                invites.push({
                    id: inv.id,
                    balanceId: doc.id,
                    ...inv.data(),
                });
            });
        }

        res.json(invites);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// ── GET transactions for shared balance ────────────────────────────
router.get("/:balanceId/transactions", verifyToken, async (req, res) => {
    try {
        const uid = req.user.uid;
        const { balanceId } = req.params;

        const balanceRef = db.collection("sharedBalances").doc(balanceId);
        const balanceDoc = await balanceRef.get();

        if (!balanceDoc.exists) {
            return res.status(404).json({ error: "Balance not found" });
        }

        const data = balanceDoc.data();

        // Check if user is member
        if (!data.members[uid]) {
            return res.status(403).json({ error: "Not a member" });
        }

        // Get transactions
        const txSnap = await balanceRef
            .collection("transactions")
            .orderBy("date", "desc")
            .get();

        const transactions = txSnap.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));

        res.json(transactions);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── POST add note to transaction ───────────────────────────────────
router.post("/:balanceId/transactions/:txId/notes", verifyToken, async (req, res) => {
    try {
        const uid = req.user.uid;
        const { balanceId, txId } = req.params;
        const { note } = req.body;

        const txRef = db
            .collection("sharedBalances")
            .doc(balanceId)
            .collection("transactions")
            .doc(txId);

        const txDoc = await txRef.get();
        if (!txDoc.exists) {
            return res.status(404).json({ error: "Transaction not found" });
        }

        const notes = txDoc.data().notes || [];
        notes.push({
            text: note,
            by: uid,
            date: new Date().toISOString(),
        });

        await txRef.update({ notes });

        res.json({ message: "Note added", notes });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── GET settlement summary ────────────────────────────────────────
router.get("/:balanceId/settlement", verifyToken, async (req, res) => {
    try {
        const uid = req.user.uid;
        const { balanceId } = req.params;

        const balanceRef = db.collection("sharedBalances").doc(balanceId);
        const balanceDoc = await balanceRef.get();

        if (!balanceDoc.exists) {
            return res.status(404).json({ error: "Balance not found" });
        }

        const data = balanceDoc.data();

        // Check if user is member
        if (!data.members[uid]) {
            return res.status(403).json({ error: "Not a member" });
        }

        // Get transactions
        const txSnap = await balanceRef.collection("transactions").get();
        const transactions = txSnap.docs.map((doc) => doc.data());

        // Calculate who owes whom
        const balances = {};
        const members = Object.keys(data.members);

        members.forEach((mId) => {
            balances[mId] = 0;
        });

        // Calculate each member's balance
        transactions.forEach((tx) => {
            members.forEach((mId) => {
                if (mId === tx.paidBy) {
                    balances[mId] += tx.amount; // They paid
                } else {
                    balances[mId] -= tx.split[mId]?.amount || 0; // They owe
                }
            });
        });

        // Create settlement transactions
        const settlements = [];
        const processed = new Set();

        members.forEach((mId) => {
            if (balances[mId] > 0.01) {
                // This person is owed
                members.forEach((otherId) => {
                    if (otherId !== mId && balances[otherId] < -0.01) {
                        // This person owes
                        const key = [mId, otherId].sort().join("-");
                        if (!processed.has(key)) {
                            const amount = Math.min(balances[mId], -balances[otherId]);
                            settlements.push({
                                from: otherId,
                                fromEmail: data.members[otherId].email,
                                to: mId,
                                toEmail: data.members[mId].email,
                                amount: Math.round(amount * 100) / 100,
                            });
                            processed.add(key);
                            balances[mId] -= amount;
                            balances[otherId] += amount;
                        }
                    }
                });
            }
        });

        res.json({
            balances,
            settlements,
            totalAmount: Object.values(data.members).reduce((sum, m) => sum + (m.contribution || 0), 0),
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;