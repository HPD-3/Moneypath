import { Router } from "express";
import { db } from "../firebaseAdmin.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = Router();

// ── Helper: get month range ───────────────────────────────────
function getMonthRange(year, month) {
    const start = new Date(year, month - 1, 1).toISOString();
    const end   = new Date(year, month, 0, 23, 59, 59).toISOString();
    return { start, end };
}

// ── GET rekap data for a specific month ───────────────────────
// GET /rekap?year=2026&month=3
router.get("/", verifyToken, async (req, res) => {
    try {
        const uid   = req.user.uid;
        const now   = new Date();
        const year  = parseInt(req.query.year)  || now.getFullYear();
        const month = parseInt(req.query.month) || now.getMonth() + 1;

        const { start, end } = getMonthRange(year, month);

        // ── 1. Fetch all transactions ─────────────────────────
        const txSnap = await db.collection("users").doc(uid)
            .collection("transactions").get();

        const allTx = txSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Filter by month
        const monthTx = allTx.filter(tx => {
            const d = tx.date || tx.createdAt || "";
            return d >= start && d <= end;
        });

        // Total income & expense
        const totalIncome  = monthTx.filter(t => t.type === "income")
            .reduce((s, t) => s + (t.amount || 0), 0);
        const totalExpense = monthTx.filter(t => t.type === "expense")
            .reduce((s, t) => s + (t.amount || 0), 0);

        // Group by balance category
        const byCategory = {};
        monthTx.forEach(tx => {
            const cat = tx.balanceName || "Lainnya";
            if (!byCategory[cat]) byCategory[cat] = { income: 0, expense: 0, transactions: [] };
            if (tx.type === "income")  byCategory[cat].income  += tx.amount || 0;
            if (tx.type === "expense") byCategory[cat].expense += tx.amount || 0;
            byCategory[cat].transactions.push(tx);
        });

        // ── 2. Fetch all balances (current state) ─────────────
        const balSnap = await db.collection("users").doc(uid)
            .collection("balances").get();
        const balances = balSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // ── 3. Fetch tabungan & riwayat setoran ───────────────
        const tabSnap = await db.collection("users").doc(uid)
            .collection("tabungan").get();

        const tabungan = await Promise.all(
            tabSnap.docs.map(async (tabDoc) => {
                const riwayatSnap = await tabDoc.ref.collection("riwayat").get();
                const riwayat     = riwayatSnap.docs.map(r => ({ id: r.id, ...r.data() }));

                // Filter riwayat by month
                const monthRiwayat = riwayat.filter(r => {
                    const d = r.date || "";
                    return d >= start && d <= end;
                });

                const setoranBulanIni = monthRiwayat.reduce((s, r) => s + (r.amount || 0), 0);

                return {
                    id:            tabDoc.id,
                    name:          tabDoc.data().name,
                    targetAmount:  tabDoc.data().targetAmount,
                    terkumpul:     tabDoc.data().terkumpul,
                    isCompleted:   tabDoc.data().isCompleted,
                    category:      tabDoc.data().category,
                    setoranBulanIni,
                    riwayatBulanIni: monthRiwayat,
                };
            })
        );

        const totalSetoran = tabungan.reduce((s, t) => s + t.setoranBulanIni, 0);

        // ── 4. Fetch user personal info ───────────────────────
        const personalDoc = await db.collection("personalDocuments").doc(uid).get();
        const personal    = personalDoc.exists ? personalDoc.data() : {};

        // ── 5. Get user email ─────────────────────────────────
        const userDoc = await db.collection("users").doc(uid).get();
        const email   = userDoc.exists ? userDoc.data().email : "";

        res.json({
            year,
            month,
            email,
            personal,
            summary: {
                totalIncome,
                totalExpense,
                netBalance:   totalIncome - totalExpense,
                totalSetoran,
                totalTransaksi: monthTx.length,
            },
            byCategory,
            balances,
            tabungan,
            transactions: monthTx.sort((a, b) =>
                new Date(b.date) - new Date(a.date)
            ).slice(0, 50), // max 50 for email
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── POST send rekap email manually ───────────────────────────
router.post("/send", verifyToken, async (req, res) => {
    try {
        const uid   = req.user.uid;
        const now   = new Date();
        const year  = req.body.year  || now.getFullYear();
        const month = req.body.month || now.getMonth() + 1;

        // Get rekap data by calling the logic internally
        const { start, end } = getMonthRange(year, month);

        const [txSnap, balSnap, tabSnap, personalDoc, userDoc] = await Promise.all([
            db.collection("users").doc(uid).collection("transactions").get(),
            db.collection("users").doc(uid).collection("balances").get(),
            db.collection("users").doc(uid).collection("tabungan").get(),
            db.collection("personalDocuments").doc(uid).get(),
            db.collection("users").doc(uid).get(),
        ]);

        const email    = userDoc.exists ? userDoc.data().email : null;
        const personal = personalDoc.exists ? personalDoc.data() : {};

        if (!email) return res.status(400).json({ error: "Email pengguna tidak ditemukan" });

        // Process transactions
        const allTx   = txSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const monthTx = allTx.filter(tx => {
            const d = tx.date || "";
            return d >= start && d <= end;
        });

        const totalIncome  = monthTx.filter(t => t.type === "income").reduce((s, t) => s + (t.amount || 0), 0);
        const totalExpense = monthTx.filter(t => t.type === "expense").reduce((s, t) => s + (t.amount || 0), 0);

        const byCategory = {};
        monthTx.forEach(tx => {
            const cat = tx.balanceName || "Lainnya";
            if (!byCategory[cat]) byCategory[cat] = { income: 0, expense: 0 };
            if (tx.type === "income")  byCategory[cat].income  += tx.amount || 0;
            if (tx.type === "expense") byCategory[cat].expense += tx.amount || 0;
        });

        const balances = balSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const tabungan = await Promise.all(
            tabSnap.docs.map(async (tabDoc) => {
                const riwayatSnap  = await tabDoc.ref.collection("riwayat").get();
                const monthRiwayat = riwayatSnap.docs
                    .map(r => ({ id: r.id, ...r.data() }))
                    .filter(r => r.date >= start && r.date <= end);
                return {
                    name:           tabDoc.data().name,
                    targetAmount:   tabDoc.data().targetAmount,
                    terkumpul:      tabDoc.data().terkumpul,
                    isCompleted:    tabDoc.data().isCompleted,
                    setoranBulanIni: monthRiwayat.reduce((s, r) => s + (r.amount || 0), 0),
                };
            })
        );

        // Import and send email
        const { sendRekapEmail } = await import("../utils/sendRekapEmail.js");
        await sendRekapEmail({
            to: email,
            name: personal.name || email.split("@")[0],
            year,
            month,
            summary: { totalIncome, totalExpense, netBalance: totalIncome - totalExpense },
            byCategory,
            balances,
            tabungan,
            transactions: monthTx.slice(0, 20),
        });

        res.json({ message: "Rekap berhasil dikirim ke " + email });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;