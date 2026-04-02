import { Router } from "express";
import { db } from "../firebaseAdmin.js";
import { sendRekapEmail } from "../utils/sendRekapEmail.js";

const router = Router();

// ── This route is called by Vercel Cron every 28th at 7AM ────
// Schedule: "0 7 28 * *" = 7:00 AM every 28th of the month
router.get("/rekap-bulanan", async (req, res) => {
    try {
        // ── Security: only allow Vercel Cron calls ────────────
        const cronSecret = req.headers["x-vercel-cron-secret"] ||
            req.headers["authorization"];

        if (process.env.CRON_SECRET && cronSecret !== `Bearer ${process.env.CRON_SECRET}`) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1;

        console.log(`[CRON] Starting rekap for ${month}/${year}`);

        // ── Get all users ──────────────────────────────────────
        const usersSnap = await db.collection("users").get();
        const users = usersSnap.docs.map(doc => ({ uid: doc.id, ...doc.data() }));

        const results = { success: 0, failed: 0, skipped: 0, errors: [] };

        // ── Process each user ──────────────────────────────────
        for (const user of users) {
            if (!user.email) {
                results.skipped++;
                continue;
            }

            try {
                // Get month date range
                const start = new Date(year, month - 1, 1).toISOString();
                const end = new Date(year, month, 0, 23, 59, 59).toISOString();

                // Fetch all user data in parallel
                const [txSnap, balSnap, tabSnap, personalDoc] = await Promise.all([
                    db.collection("users").doc(user.uid).collection("transactions").get(),
                    db.collection("users").doc(user.uid).collection("balances").get(),
                    db.collection("users").doc(user.uid).collection("tabungan").get(),
                    db.collection("personalDocuments").doc(user.uid).get(),
                ]);

                const personal = personalDoc.exists ? personalDoc.data() : {};
                const name = personal.name || user.email.split("@")[0];

                // Process transactions
                const allTx = txSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                const monthTx = allTx.filter(tx => {
                    const d = tx.date || "";
                    return d >= start && d <= end;
                });

                // Skip users with no activity this month
                if (monthTx.length === 0) {
                    results.skipped++;
                    continue;
                }

                const totalIncome = monthTx.filter(t => t.type === "income")
                    .reduce((s, t) => s + (t.amount || 0), 0);
                const totalExpense = monthTx.filter(t => t.type === "expense")
                    .reduce((s, t) => s + (t.amount || 0), 0);

                const byCategory = {};
                monthTx.forEach(tx => {
                    const cat = tx.balanceName || "Lainnya";
                    if (!byCategory[cat]) byCategory[cat] = { income: 0, expense: 0 };
                    if (tx.type === "income") byCategory[cat].income += tx.amount || 0;
                    if (tx.type === "expense") byCategory[cat].expense += tx.amount || 0;
                });

                const balances = balSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

                const tabungan = await Promise.all(
                    tabSnap.docs.map(async (tabDoc) => {
                        const riwayatSnap = await tabDoc.ref.collection("riwayat").get();
                        const monthRiwayat = riwayatSnap.docs
                            .map(r => ({ id: r.id, ...r.data() }))
                            .filter(r => r.date >= start && r.date <= end);
                        return {
                            name: tabDoc.data().name,
                            targetAmount: tabDoc.data().targetAmount,
                            terkumpul: tabDoc.data().terkumpul,
                            isCompleted: tabDoc.data().isCompleted,
                            setoranBulanIni: monthRiwayat.reduce((s, r) => s + (r.amount || 0), 0),
                        };
                    })
                );

                // Send email
                await sendRekapEmail({
                    to: user.email,
                    name,
                    year,
                    month,
                    summary: {
                        totalIncome,
                        totalExpense,
                        netBalance: totalIncome - totalExpense,
                    },
                    byCategory,
                    balances,
                    tabungan,
                    transactions: monthTx.slice(0, 10),
                });

                // Log send record in Firestore
                await db.collection("users").doc(user.uid)
                    .collection("rekapLog").add({
                        year, month,
                        sentAt: new Date().toISOString(),
                        status: "sent",
                    });

                results.success++;
                console.log(`[CRON] ✅ Sent to ${user.email}`);

                // Small delay between emails to avoid rate limit
                await new Promise(r => setTimeout(r, 200));

            } catch (userErr) {
                results.failed++;
                results.errors.push({ email: user.email, error: userErr.message });
                console.error(`[CRON] ❌ Failed for ${user.email}:`, userErr.message);
            }
        }

        console.log(`[CRON] Done: ${results.success} sent, ${results.failed} failed, ${results.skipped} skipped`);
        res.json({ success: true, month, year, results });

    } catch (err) {
        console.error("[CRON] Fatal error:", err.message);
        res.status(500).json({ error: err.message });
    }
});

export default router;