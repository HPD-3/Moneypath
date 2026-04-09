import API from "./api";

/**
 * Balance Service - Centralized module for all balance and transaction operations
 * Ensures consistent data syncing across all pages (Balance, SharedTabungan, Tabungan, etc)
 */

// ── Balance Categories ─────────────────────────────────────────
export const fetchBalances = async () => {
    const res = await API.get("/balance");
    return res.data;
};

export const addBalanceCategory = async (name, type, balance = 0, budgetLimit = 0) => {
    const res = await API.post("/balance", {
        name,
        type,
        balance: parseFloat(balance) || 0,
        budgetLimit: parseFloat(budgetLimit) || 0
    });
    return res.data;
};

export const deleteBalanceCategory = async (balanceId) => {
    const res = await API.delete(`/balance/${balanceId}`);
    return res.data;
};

export const updateBudgetLimit = async (balanceId, budgetLimit) => {
    const res = await API.patch(`/balance/${balanceId}/limit`, {
        budgetLimit: parseFloat(budgetLimit)
    });
    return res.data;
};

// ── Transactions ───────────────────────────────────────────────
export const addTransaction = async (balanceId, amount, type, description, category = null) => {
    const res = await API.post(`/balance/${balanceId}/transaction`, {
        amount: parseFloat(amount),
        type,
        description: description.trim(),
        ...(category && { category })
    });
    return res.data;
};

export const deleteTransaction = async (balanceId, txId) => {
    const res = await API.delete(`/balance/${balanceId}/transaction/${txId}`);
    return res.data;
};

export const fetchTransactions = async (month, limit = 50, type = null) => {
    const params = new URLSearchParams();
    if (month) params.append("month", month);
    if (limit) params.append("limit", limit);
    if (type) params.append("type", type);
    
    const queryString = params.toString();
    const res = await API.get(`/balance/transactions?${queryString}`);
    return res.data;
};

// ── Summary & Analytics ───────────────────────────────────────
export const fetchSummary = async (month) => {
    const params = month ? `?month=${month}` : "";
    const res = await API.get(`/balance/summary${params}`);
    return res.data;
};

// ── Helper Functions ──────────────────────────────────────────
export const formatRupiah = (amount) => {
    return `Rp ${(amount || 0).toLocaleString("id-ID")}`;
};

export const getCurrentMonth = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
};

/**
 * Batch fetch multiple data sources in parallel
 * Returns: { balances, transactions, summary }
 */
export const fetchAllBalanceData = async (month) => {
    try {
        const [balances, transactions, summary] = await Promise.all([
            fetchBalances(),
            fetchTransactions(month),
            fetchSummary(month)
        ]);
        
        return { balances, transactions, summary };
    } catch (error) {
        console.error("Error fetching balance data:", error);
        throw error;
    }
};

/**
 * Force refresh transaction history (useful after shared balance operations)
 * This ensures personal balance transactions from shared deposits appear
 */
export const refreshTransactionHistory = async (month) => {
    try {
        const transactions = await fetchTransactions(month);
        return transactions;
    } catch (error) {
        console.error("Error refreshing transaction history:", error);
        throw error;
    }
};
