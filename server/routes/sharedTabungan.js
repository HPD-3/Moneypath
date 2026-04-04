import { Router } from "express";
import { db } from "../firebaseAdmin.js";
import { verifyToken } from "../middleware/verifyToken.js";
import crypto from "crypto";

const router = Router();

// ══════════════════════════════════════════════
//  SHARED TABUNGAN
//  Collection: sharedTabungan/{groupId}
//  Members stored as map: members.{uid}
//  Setoran: sharedTabungan/{groupId}/setoran/{id}
// ══════════════════════════════════════════════

// ── GET all shared tabungan for current user ──────────────────
router.get("/", verifyToken, async (req, res) => {
    try {
        const uid  = req.user.uid;
        const snap = await db.collection("sharedTabungan")
            .where(`members.${uid}.uid`, "==", uid)
            .get();
        const groups = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        groups.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        res.json(groups);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── GET single shared tabungan ────────────────────────────────
router.get("/:groupId", verifyToken, async (req, res) => {
    try {
        const uid = req.user.uid;
        const doc = await db.collection("sharedTabungan").doc(req.params.groupId).get();
        if (!doc.exists) return res.status(404).json({ error: "Target tidak ditemukan" });

        const data = doc.data();
        if (!data.members?.[uid]) {
            return res.status(403).json({ error: "Kamu bukan anggota grup ini" });
        }

        // Get setoran history
        const setoranSnap = await db.collection("sharedTabungan")
            .doc(req.params.groupId).collection("setoran").get();

        const setoran = setoranSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        setoran.sort((a, b) => new Date(b.date) - new Date(a.date));

        res.json({ id: doc.id, ...data, setoran });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── POST create shared tabungan ───────────────────────────────
router.post("/", verifyToken, async (req, res) => {
    try {
        const uid = req.user.uid;
        const { name, targetAmount, deadline, imageUrl, category, description } = req.body;

        const personalDoc = await db.collection("personalDocuments").doc(uid).get();
        const creatorName = personalDoc.exists
            ? personalDoc.data().name
            : req.user.email?.split("@")[0] || "Unknown";

        const inviteCode = crypto.randomBytes(4).toString("hex").toUpperCase();

        const ref = await db.collection("sharedTabungan").add({
            name,
            description:  description || "",
            targetAmount: parseFloat(targetAmount),
            terkumpul:    0,
            deadline:     deadline || null,
            imageUrl:     imageUrl || null,
            category:     category || "umum",
            inviteCode,
            isCompleted:  false,
            createdBy:    uid,
            createdAt:    new Date().toISOString(),
            members: {
                [uid]: {
                    uid,
                    name:        creatorName,
                    email:       req.user.email,
                    role:        "admin",
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
        const uid            = req.user.uid;
        const { inviteCode } = req.body;

        const snap = await db.collection("sharedTabungan")
            .where("inviteCode", "==", inviteCode.toUpperCase())
            .limit(1).get();

        if (snap.empty) return res.status(404).json({ error: "Kode undangan tidak ditemukan" });

        const groupDoc  = snap.docs[0];
        const groupData = groupDoc.data();

        if (groupData.members?.[uid]) {
            return res.status(400).json({ error: "Kamu sudah bergabung di grup ini" });
        }

        const personalDoc = await db.collection("personalDocuments").doc(uid).get();
        const userName = personalDoc.exists
            ? personalDoc.data().name
            : req.user.email?.split("@")[0] || "Unknown";

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

        const groupDoc = await db.collection("sharedTabungan").doc(req.params.groupId).get();
        if (!groupDoc.exists) return res.status(404).json({ error: "Group not found" });

        const groupData = groupDoc.data();
        if (groupData.members?.[uid]?.role !== "admin") {
            return res.status(403).json({ error: "Hanya admin yang bisa mengundang" });
        }

        const userSnap = await db.collection("users")
            .where("email", "==", email).limit(1).get();

        if (userSnap.empty) {
            return res.status(404).json({ error: "Pengguna tidak ditemukan" });
        }

        const invitedUid = userSnap.docs[0].id;
        if (groupData.members?.[invitedUid]) {
            return res.status(400).json({ error: "Pengguna sudah bergabung" });
        }

        await db.collection("users").doc(invitedUid)
            .collection("sharedTabunganInvites").doc(req.params.groupId).set({
                groupId:    req.params.groupId,
                groupName:  groupData.name,
                targetAmount: groupData.targetAmount,
                invitedBy:  uid,
                inviteCode: groupData.inviteCode,
                invitedAt:  new Date().toISOString(),
                status:     "pending",
            });

        res.json({ message: `Undangan dikirim ke ${email}` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── GET pending invites ───────────────────────────────────────
router.get("/invites/pending", verifyToken, async (req, res) => {
    try {
        const uid  = req.user.uid;
        const snap = await db.collection("users").doc(uid)
            .collection("sharedTabunganInvites")
            .where("status", "==", "pending").get();
        res.json(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── POST accept invite ────────────────────────────────────────
router.post("/invites/:groupId/accept", verifyToken, async (req, res) => {
    try {
        const uid      = req.user.uid;
        const groupDoc = await db.collection("sharedTabungan").doc(req.params.groupId).get();
        if (!groupDoc.exists) return res.status(404).json({ error: "Group not found" });

        const personalDoc = await db.collection("personalDocuments").doc(uid).get();
        const userName = personalDoc.exists
            ? personalDoc.data().name
            : req.user.email?.split("@")[0] || "Unknown";

        await groupDoc.ref.update({
            [`members.${uid}`]: {
                uid, name: userName, email: req.user.email,
                role: "member", joinedAt: new Date().toISOString(), contributed: 0,
            }
        });

        await db.collection("users").doc(uid)
            .collection("sharedTabunganInvites").doc(req.params.groupId)
            .update({ status: "accepted" });

        res.json({ message: "Berhasil bergabung!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── POST setor dari shared balance ATAU personal balance ──────
router.post("/:groupId/setor", verifyToken, async (req, res) => {
    try {
        const uid = req.user.uid;
        const {
            amount,
            sourceType,     // "shared" | "personal"
            sourceId,       // sharedBalanceId or personal balanceId
            sourceName,     // display name
        } = req.body;

        const tabRef = db.collection("sharedTabungan").doc(req.params.groupId);
        const tabDoc = await tabRef.get();
        if (!tabDoc.exists) return res.status(404).json({ error: "Target tidak ditemukan" });

        const tabData = tabDoc.data();
        if (!tabData.members?.[uid]) {
            return res.status(403).json({ error: "Kamu bukan anggota" });
        }
        if (tabData.isCompleted) {
            return res.status(400).json({ error: "Target sudah tercapai" });
        }

        const sisaTarget = tabData.targetAmount - tabData.terkumpul;
        if (amount > sisaTarget) {
            return res.status(400).json({ error: `Maksimal setor: Rp ${sisaTarget.toLocaleString("id-ID")}` });
        }

        // ── Deduct from source ────────────────────────────────
        if (sourceType === "shared") {
            // Deduct from shared balance group
            const balRef = db.collection("sharedBalances").doc(sourceId);
            const balDoc = await balRef.get();
            if (!balDoc.exists) return res.status(404).json({ error: "Saldo bersama tidak ditemukan" });

            const balData = balDoc.data();
            if (!balData.members?.[uid]) {
                return res.status(403).json({ error: "Kamu bukan anggota saldo bersama ini" });
            }
            if ((balData.balance || 0) < amount) {
                return res.status(400).json({ error: "Saldo bersama tidak mencukupi" });
            }

            await balRef.update({ balance: (balData.balance || 0) - amount });

            // Log in shared balance transactions
            await balRef.collection("transactions").add({
                amount, type: "expense",
                description: `Setor ke tabungan bersama: ${tabData.name}`,
                addedBy: uid,
                addedByName: tabData.members[uid].name,
                date: new Date().toISOString(),
            });

        } else if (sourceType === "personal") {
            // Deduct from personal balance
            const balRef = db.collection("users").doc(uid)
                .collection("balances").doc(sourceId);
            const balDoc = await balRef.get();
            if (!balDoc.exists) return res.status(404).json({ error: "Saldo tidak ditemukan" });

            if ((balDoc.data().balance || 0) < amount) {
                return res.status(400).json({ error: "Saldo pribadi tidak mencukupi" });
            }

            await balRef.update({ balance: (balDoc.data().balance || 0) - amount });

            // Log in personal transactions
            await db.collection("users").doc(uid).collection("transactions").add({
                balanceId: sourceId, balanceName: sourceName, amount,
                type: "expense",
                description: `Setor ke tabungan bersama: ${tabData.name}`,
                date: new Date().toISOString(),
            });
        }

        // ── Update tabungan ───────────────────────────────────
        const newTerkumpul = tabData.terkumpul + amount;
        const isCompleted  = newTerkumpul >= tabData.targetAmount;

        await tabRef.update({
            terkumpul:   newTerkumpul,
            isCompleted,
            completedAt: isCompleted ? new Date().toISOString() : null,
            [`members.${uid}.contributed`]:
                (tabData.members[uid].contributed || 0) + amount,
        });

        // Log setoran
        await tabRef.collection("setoran").add({
            amount, sourceType, sourceId, sourceName,
            addedBy:     uid,
            addedByName: tabData.members[uid].name,
            date:        new Date().toISOString(),
        });

        res.json({ newTerkumpul, isCompleted });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── PUT update target info ────────────────────────────────────
router.put("/:groupId", verifyToken, async (req, res) => {
    try {
        const uid      = req.user.uid;
        const groupDoc = await db.collection("sharedTabungan").doc(req.params.groupId).get();
        if (!groupDoc.exists) return res.status(404).json({ error: "Not found" });
        if (groupDoc.data().members?.[uid]?.role !== "admin") {
            return res.status(403).json({ error: "Hanya admin" });
        }
        const { name, targetAmount, deadline, imageUrl, category, description } = req.body;
        await groupDoc.ref.update({
            name, targetAmount, deadline, imageUrl, category, description,
            updatedAt: new Date().toISOString()
        });
        res.json({ message: "Target diperbarui" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── DELETE group ──────────────────────────────────────────────
router.delete("/:groupId", verifyToken, async (req, res) => {
    try {
        const uid      = req.user.uid;
        const groupDoc = await db.collection("sharedTabungan").doc(req.params.groupId).get();
        if (!groupDoc.exists) return res.status(404).json({ error: "Not found" });
        if (groupDoc.data().createdBy !== uid) {
            return res.status(403).json({ error: "Hanya pembuat yang bisa menghapus" });
        }
        await groupDoc.ref.delete();
        res.json({ message: "Target dihapus" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;