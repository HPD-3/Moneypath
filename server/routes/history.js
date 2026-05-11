import { Router } from "express";
import { db } from "../firebaseAdmin.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = Router();

// GET all transactions (riwayat) with pagination and filtering
router.get("/", verifyToken, async (req, res) => {
    try {
        const uid = req.user.uid;
        const { month, year, page = 1, limit = 10, type } = req.query;
        
        // Fetch all transactions ordered by date
        const snapshot = await db.collection("users").doc(uid)
            .collection("transactions")
            .orderBy("date", "desc")
            .get();
        
        let transactions = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        // Filter by month/year if provided
        if (month && year) {
            const monthNum = parseInt(month);
            const yearNum = parseInt(year);
            transactions = transactions.filter(tx => {
                if (!tx.date) return false;
                const txDate = new Date(tx.date);
                return txDate.getMonth() + 1 === monthNum && txDate.getFullYear() === yearNum;
            });
        }

        // Filter by type if provided
        if (type && (type === "income" || type === "expense")) {
            transactions = transactions.filter(tx => tx.type === type);
        }

        // Pagination
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const startIdx = (pageNum - 1) * limitNum;
        const endIdx = startIdx + limitNum;
        const paginatedTransactions = transactions.slice(startIdx, endIdx);

        // Calculate summary
        const totalIncome = transactions
            .filter(t => t.type === "income")
            .reduce((sum, t) => sum + (t.amount || 0), 0);

        const totalExpense = transactions
            .filter(t => t.type === "expense")
            .reduce((sum, t) => sum + (t.amount || 0), 0);

        res.json({
            transactions: paginatedTransactions,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total: transactions.length,
                totalPages: Math.ceil(transactions.length / limitNum)
            },
            summary: {
                totalIncome,
                totalExpense,
                netBalance: totalIncome - totalExpense
            }
        });
    } catch (err) {
        console.error("Error fetching history:", err);
        res.status(500).json({ error: err.message });
    }
});

// GET summary stats for history
router.get("/stats", verifyToken, async (req, res) => {
    try {
        const uid = req.user.uid;
        const { month, year } = req.query;

        // Fetch all transactions ordered by date
        const snapshot = await db.collection("users").doc(uid)
            .collection("transactions")
            .orderBy("date", "desc")
            .get();
        
        let transactions = snapshot.docs.map(doc => doc.data());

        // Filter by month/year if provided
        if (month && year) {
            const monthNum = parseInt(month);
            const yearNum = parseInt(year);
            transactions = transactions.filter(tx => {
                if (!tx.date) return false;
                const txDate = new Date(tx.date);
                return txDate.getMonth() + 1 === monthNum && txDate.getFullYear() === yearNum;
            });
        }

        // Group by category
        const byCategory = {};
        transactions.forEach(tx => {
            const category = tx.balanceName || "Lainnya";
            if (!byCategory[category]) {
                byCategory[category] = { income: 0, expense: 0 };
            }
            if (tx.type === "income") {
                byCategory[category].income += tx.amount || 0;
            } else {
                byCategory[category].expense += tx.amount || 0;
            }
        });

        // Group by date
        const byDate = {};
        transactions.forEach(tx => {
            const date = tx.date ? new Date(tx.date).toLocaleDateString("id-ID") : "Unknown";
            if (!byDate[date]) {
                byDate[date] = { income: 0, expense: 0, count: 0 };
            }
            if (tx.type === "income") {
                byDate[date].income += tx.amount || 0;
            } else {
                byDate[date].expense += tx.amount || 0;
            }
            byDate[date].count += 1;
        });

        res.json({
            byCategory,
            byDate,
            total: transactions.length
        });
    } catch (err) {
        console.error("Error fetching stats:", err);
        res.status(500).json({ error: err.message });
    }
});

export default router;
