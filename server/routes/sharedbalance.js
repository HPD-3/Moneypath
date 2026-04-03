import { Router } from "express";
import { db } from "../firebaseAdmin.js";
import { verifyToken } from "../middleware/verifyToken.js";
import crypto from "crypto";

const router = Router();

// ══════════════════════════════════════════════
//  SHARED BALANCE ROUTES
//  Collection: sharedBalances/{groupId}
//  Members:    sharedBalances/{groupId}/members/{uid}
//  Txs:        sharedBalances/{groupId}/transactions/{txId}
// ══════════════════════════════════════════════

// ── GET all shared balances for current user ──────────────────
router.get("/", verifyToken, async (req, res) => {
    try {
        const uid  = req.user.uid;
        // Find all groups where user is a member
        const snap = await db.collection("sharedBalances")
            .where(`members.${uid}.uid`, "==", uid)
            .get();

        const groups = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.json(groups);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── GET single shared balance ─────────────────────────────────
router.get("/:groupId", verifyToken, async (req, res) => {
    try {
        const uid = req.user.uid;
        const doc = await db.collection("sharedBalances").doc(req.params.groupId).get();
        if (!doc.exists) return res.status(404).json({ error: "Group not found" });

        const data = doc.data();
        // Check if user is a member
        if (!data.members?.[uid]) {
            return res.status(403).json({ error: "You are not a member of this group" });
        }

        // Get transactions
        const txSnap = await db.collection("sharedBalances")
            .doc(req.params.groupId)
            .collection("transactions")
            .get();

        const transactions = txSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        transactions.sort((a, b) => new Date(b.date) - new Date(a.date));

        res.json({ id: doc.id, ...data, transactions });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── POST create shared balance ────────────────────────────────
router.post("/", verifyToken, async (req, res) => {
    try {
        const uid = req.user.uid;
        const { name, description, category } = req.body;

        // Get creator's personal info
        const personalDoc = await db.collection("personalDocuments").doc(uid).get();
        const creatorName = personalDoc.exists
            ? personalDoc.data().name
            : req.user.email?.split("@")[0] || "Unknown";

        // Generate invite code
        const inviteCode = crypto.randomBytes(4).toString("hex").toUpperCase();

        const ref = await db.collection("sharedBalances").add({
            name,
            description: description || "",
            category:    category || "umum",
            balance:     0,
            inviteCode,
            createdBy:   uid,
            createdAt:   new Date().toISOString(),
            members: {
                [uid]: {
                    uid,
                    name:        creatorName,
                    email:       req.user.email,
                    role:        "admin",      // creator is admin
                    joinedAt:    new Date().toISOString(),
                    contributed: 0,
                }
            }
        });

        res.json({ id: ref.id, name, inviteCode });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── POST join via invite code ─────────────────────────────────
router.post("/join", verifyToken, async (req, res) => {
    try {
        const uid        = req.user.uid;
        const { inviteCode } = req.body;

        // Find group by invite code
        const snap = await db.collection("sharedBalances")
            .where("inviteCode", "==", inviteCode.toUpperCase())
            .limit(1)
            .get();

        if (snap.empty) return res.status(404).json({ error: "Kode undangan tidak ditemukan" });

        const groupDoc  = snap.docs[0];
        const groupData = groupDoc.data();

        // Already a member?
        if (groupData.members?.[uid]) {
            return res.status(400).json({ error: "Kamu sudah bergabung di grup ini" });
        }

        // Get user's personal info
        const personalDoc = await db.collection("personalDocuments").doc(uid).get();
        const userName = personalDoc.exists
            ? personalDoc.data().name
            : req.user.email?.split("@")[0] || "Unknown";

        // Add as member
        await groupDoc.ref.update({
            [`members.${uid}`]: {
                uid,
                name:        userName,
                email:       req.user.email,
                role:        "member",
                joinedAt:    new Date().toISOString(),
                contributed: 0,
            }
        });

        res.json({ id: groupDoc.id, name: groupData.name });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── POST invite by email ──────────────────────────────────────
router.post("/:groupId/invite", verifyToken, async (req, res) => {
    try {
        const uid   = req.user.uid;
        const { email } = req.body;

        const groupDoc = await db.collection("sharedBalances").doc(req.params.groupId).get();
        if (!groupDoc.exists) return res.status(404).json({ error: "Group not found" });

        // Only admin can invite
        const groupData = groupDoc.data();
        if (groupData.members?.[uid]?.role !== "admin") {
            return res.status(403).json({ error: "Hanya admin yang bisa mengundang" });
        }

        // Find user by email in users collection
        const userSnap = await db.collection("users")
            .where("email", "==", email)
            .limit(1)
            .get();

        if (userSnap.empty) {
            return res.status(404).json({ error: "Pengguna dengan email tersebut tidak ditemukan" });
        }

        const invitedUser = userSnap.docs[0];
        const invitedUid  = invitedUser.id;

        if (groupData.members?.[invitedUid]) {
            return res.status(400).json({ error: "Pengguna ini sudah bergabung" });
        }

        // Store pending invite
        await db.collection("sharedBalances").doc(req.params.groupId)
            .collection("invites").doc(invitedUid).set({
                email,
                invitedBy: uid,
                invitedAt: new Date().toISOString(),
                status:    "pending",
                groupName: groupData.name,
            });

        // Also store on user's side for notification
        await db.collection("users").doc(invitedUid)
            .collection("invites").doc(req.params.groupId).set({
                groupId:   req.params.groupId,
                groupName: groupData.name,
                invitedBy: uid,
                inviteCode: groupData.inviteCode,
                invitedAt: new Date().toISOString(),
                status:    "pending",
            });

        res.json({ message: `Undangan dikirim ke ${email}` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── GET my pending invites ────────────────────────────────────
router.get("/invites/pending", verifyToken, async (req, res) => {
    try {
        const uid  = req.user.uid;
        const snap = await db.collection("users").doc(uid)
            .collection("invites")
            .where("status", "==", "pending")
            .get();

        const invites = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.json(invites);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── POST accept invite ────────────────────────────────────────
router.post("/invites/:groupId/accept", verifyToken, async (req, res) => {
    try {
        const uid      = req.user.uid;
        const groupDoc = await db.collection("sharedBalances").doc(req.params.groupId).get();
        if (!groupDoc.exists) return res.status(404).json({ error: "Group not found" });

        const personalDoc = await db.collection("personalDocuments").doc(uid).get();
        const userName    = personalDoc.exists
            ? personalDoc.data().name
            : req.user.email?.split("@")[0] || "Unknown";

        // Add to members
        await groupDoc.ref.update({
            [`members.${uid}`]: {
                uid,
                name:        userName,
                email:       req.user.email,
                role:        "member",
                joinedAt:    new Date().toISOString(),
                contributed: 0,
            }
        });

        // Update invite status
        await db.collection("users").doc(uid)
            .collection("invites").doc(req.params.groupId)
            .update({ status: "accepted" });

        res.json({ message: "Berhasil bergabung!", groupName: groupDoc.data().name });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── POST add transaction to shared balance ────────────────────
router.post("/:groupId/transaction", verifyToken, async (req, res) => {
    try {
        const uid   = req.user.uid;
        const { amount, type, description, note } = req.body;

        const groupRef = db.collection("sharedBalances").doc(req.params.groupId);
        const groupDoc = await groupRef.get();
        if (!groupDoc.exists) return res.status(404).json({ error: "Group not found" });

        const groupData = groupDoc.data();

        // Check member
        if (!groupData.members?.[uid]) {
            return res.status(403).json({ error: "Kamu bukan anggota grup ini" });
        }

        // Only admin can add transactions (or all members — configurable)
        // Current: all members can add
        const memberName = groupData.members[uid].name;

        const newBalance = type === "income"
            ? (groupData.balance || 0) + amount
            : (groupData.balance || 0) - amount;

        if (newBalance < 0 && type === "expense") {
            return res.status(400).json({ error: "Saldo grup tidak mencukupi" });
        }

        // Add transaction
        const txRef = await groupRef.collection("transactions").add({
            amount,
            type,
            description,
            note:       note || "",
            addedBy:    uid,
            addedByName: memberName,
            date:       new Date().toISOString(),
        });

        // Update group balance & member contribution
        await groupRef.update({
            balance: newBalance,
            [`members.${uid}.contributed`]:
                (groupData.members[uid].contributed || 0) + (type === "income" ? amount : 0),
        });

        res.json({ newBalance, txId: txRef.id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── DELETE member (admin only) ────────────────────────────────
router.delete("/:groupId/members/:memberId", verifyToken, async (req, res) => {
    try {
        const uid      = req.user.uid;
        const groupDoc = await db.collection("sharedBalances").doc(req.params.groupId).get();
        if (!groupDoc.exists) return res.status(404).json({ error: "Group not found" });

        const groupData = groupDoc.data();
        if (groupData.members?.[uid]?.role !== "admin") {
            return res.status(403).json({ error: "Hanya admin yang bisa mengeluarkan anggota" });
        }

        // Can't remove self if admin
        if (req.params.memberId === uid) {
            return res.status(400).json({ error: "Admin tidak bisa mengeluarkan diri sendiri" });
        }

        const updatedMembers = { ...groupData.members };
        delete updatedMembers[req.params.memberId];

        await groupDoc.ref.update({ members: updatedMembers });
        res.json({ message: "Anggota dihapus" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── DELETE group (admin only) ─────────────────────────────────
router.delete("/:groupId", verifyToken, async (req, res) => {
    try {
        const uid      = req.user.uid;
        const groupDoc = await db.collection("sharedBalances").doc(req.params.groupId).get();
        if (!groupDoc.exists) return res.status(404).json({ error: "Group not found" });

        if (groupDoc.data().createdBy !== uid) {
            return res.status(403).json({ error: "Hanya pembuat grup yang bisa menghapus" });
        }

        await groupDoc.ref.delete();
        res.json({ message: "Grup dihapus" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── POST regenerate invite code ───────────────────────────────
router.post("/:groupId/regenerate-code", verifyToken, async (req, res) => {
    try {
        const uid      = req.user.uid;
        const groupDoc = await db.collection("sharedBalances").doc(req.params.groupId).get();
        if (!groupDoc.exists) return res.status(404).json({ error: "Group not found" });

        if (groupDoc.data().members?.[uid]?.role !== "admin") {
            return res.status(403).json({ error: "Hanya admin yang bisa generate ulang kode" });
        }

        const newCode = crypto.randomBytes(4).toString("hex").toUpperCase();
        await groupDoc.ref.update({ inviteCode: newCode });
        res.json({ inviteCode: newCode });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;