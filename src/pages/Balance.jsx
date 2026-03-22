import { useEffect, useState } from "react";
import API from "../services/api";

const CATEGORY_TYPES = [
    { value: "cash", label: "Cash", emoji: "💵" },
    { value: "bank", label: "Bank", emoji: "🏦" },
    { value: "ewallet", label: "E-Wallet", emoji: "📱" },
    { value: "savings", label: "Savings", emoji: "🐷" },
    { value: "investment", label: "Investment", emoji: "📈" },
    { value: "income", label: "Income", emoji: "💰" },
    { value: "expenses", label: "Expenses", emoji: "🧾" },
];

export default function Balance() {
    const [balances, setBalances] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("overview");  // overview | history

    // Add category form
    const [showAddForm, setShowAddForm] = useState(false);
    const [newCategory, setNewCategory] = useState({ name: "", type: "cash", balance: 0, budgetLimit: 0 });

    // Transaction form
    const [txForm, setTxForm] = useState({ balanceId: "", amount: "", type: "income", description: "" });
    const [showTxForm, setShowTxForm] = useState(false);

    // Budget limit form
    const [editLimit, setEditLimit] = useState({ id: "", value: "" });

    useEffect(() => { fetchAll(); }, []);

    const fetchAll = async () => {
        try {
            const [balRes, txRes] = await Promise.all([
                API.get("/balance"),
                API.get("/balance/transactions")
            ]);
            setBalances(balRes.data);
            setTransactions(txRes.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddCategory = async (e) => {
        e.preventDefault();
        try {
            const res = await API.post("/balance", {
                ...newCategory,
                balance: parseFloat(newCategory.balance) || 0,
                budgetLimit: parseFloat(newCategory.budgetLimit) || 0
            });
            setBalances([...balances, res.data]);
            setNewCategory({ name: "", type: "cash", balance: 0, budgetLimit: 0 });
            setShowAddForm(false);
        } catch (err) {
            console.error(err);
        }
    };

    const handleTransaction = async (e) => {
        e.preventDefault();
        try {
            await API.post(`/balance/${txForm.balanceId}/transaction`, {
                amount: parseFloat(txForm.amount),
                type: txForm.type,
                description: txForm.description
            });
            setShowTxForm(false);
            setTxForm({ balanceId: "", amount: "", type: "income", description: "" });
            fetchAll();
        } catch (err) {
            console.error(err);
        }
    };

    const handleUpdateLimit = async (id) => {
        try {
            await API.patch(`/balance/${id}/limit`, {
                budgetLimit: parseFloat(editLimit.value)
            });
            setBalances(balances.map(b =>
                b.id === id ? { ...b, budgetLimit: parseFloat(editLimit.value) } : b
            ));
            setEditLimit({ id: "", value: "" });
        } catch (err) {
            console.error(err);
        }
    };

    const totalBalance = balances.reduce((sum, b) => sum + (b.balance || 0), 0);

    if (loading) return <p>Loading...</p>;

    return (
        <div style={{ padding: "1rem", maxWidth: 600, margin: "0 auto" }}>

            {/* Total */}
            <h2>Total Balance: Rp {totalBalance.toLocaleString("id-ID")}</h2>

            {/* Tabs */}
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                <button onClick={() => setActiveTab("overview")}
                    style={{ fontWeight: activeTab === "overview" ? "bold" : "normal" }}>
                    Overview
                </button>
                <button onClick={() => setActiveTab("history")}
                    style={{ fontWeight: activeTab === "history" ? "bold" : "normal" }}>
                    History
                </button>
            </div>

            {/* ── OVERVIEW TAB ── */}
            {activeTab === "overview" && (
                <>
                    {/* Balance Cards */}
                    {balances.map(b => {
                        const typeInfo = CATEGORY_TYPES.find(t => t.value === b.type);
                        const percentage = b.budgetLimit > 0
                            ? Math.min((b.balance / b.budgetLimit) * 100, 100)
                            : 0;

                        return (
                            <div key={b.id} style={{ border: "1px solid #ccc", borderRadius: 8, padding: 12, marginBottom: 12 }}>
                                <div style={{ display: "flex", justifyContent: "space-between" }}>
                                    <span>{typeInfo?.emoji} {b.name}</span>
                                    <strong>Rp {b.balance.toLocaleString("id-ID")}</strong>
                                </div>

                                {/* Budget limit bar */}
                                {b.budgetLimit > 0 && (
                                    <div style={{ marginTop: 8 }}>
                                        <div style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>
                                            Budget: Rp {b.balance.toLocaleString("id-ID")} / Rp {b.budgetLimit.toLocaleString("id-ID")}
                                        </div>
                                        <div style={{ background: "#eee", borderRadius: 4, height: 6 }}>
                                            <div style={{
                                                width: `${percentage}%`,
                                                height: 6,
                                                borderRadius: 4,
                                                background: percentage >= 90 ? "red" : percentage >= 70 ? "orange" : "green"
                                            }} />
                                        </div>
                                    </div>
                                )}

                                {/* Edit limit */}
                                {editLimit.id === b.id ? (
                                    <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
                                        <input
                                            type="number"
                                            value={editLimit.value}
                                            onChange={e => setEditLimit({ ...editLimit, value: e.target.value })}
                                            placeholder="Budget limit"
                                        />
                                        <button onClick={() => handleUpdateLimit(b.id)}>Save</button>
                                        <button onClick={() => setEditLimit({ id: "", value: "" })}>Cancel</button>
                                    </div>
                                ) : (
                                    <button style={{ marginTop: 8, fontSize: 12 }}
                                        onClick={() => setEditLimit({ id: b.id, value: b.budgetLimit })}>
                                        Set Budget Limit
                                    </button>
                                )}
                            </div>
                        );
                    })}


                    <button onClick={() => setShowTxForm(!showTxForm)}>
                        + Add Transaction
                    </button>


                    {showTxForm && (
                        <form onSubmit={handleTransaction} style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
                            <select value={txForm.balanceId} onChange={e => setTxForm({ ...txForm, balanceId: e.target.value })} required>
                                <option value="">Select Category</option>
                                {balances.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                            </select>
                            <select value={txForm.type} onChange={e => setTxForm({ ...txForm, type: e.target.value })}>
                                <option value="income">Income (+)</option>
                                <option value="expense">Expense (-)</option>
                            </select>
                            <input
                                type="number"
                                placeholder="Amount"
                                value={txForm.amount}
                                onChange={e => setTxForm({ ...txForm, amount: e.target.value })}
                                required
                            />
                            <input
                                placeholder="Description"
                                value={txForm.description}
                                onChange={e => setTxForm({ ...txForm, description: e.target.value })}
                                required
                            />
                            <button type="submit">Submit</button>
                        </form>
                    )}

                    {/* Add Category Button */}
                    <button style={{ marginTop: 12, marginLeft: 8 }} onClick={() => setShowAddForm(!showAddForm)}>
                        + Add Category
                    </button>

                    {/* Add Category Form */}
                    {showAddForm && (
                        <form onSubmit={handleAddCategory} style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
                            <input
                                placeholder="Category Name (e.g. BCA, GoPay)"
                                value={newCategory.name}
                                onChange={e => setNewCategory({ ...newCategory, name: e.target.value })}
                                required
                            />
                            <select value={newCategory.type} onChange={e => setNewCategory({ ...newCategory, type: e.target.value })}>
                                {CATEGORY_TYPES.map(t => (
                                    <option key={t.value} value={t.value}>{t.emoji} {t.label}</option>
                                ))}
                            </select>
                            <input
                                type="number"
                                placeholder="Initial Balance (optional)"
                                value={newCategory.balance}
                                onChange={e => setNewCategory({ ...newCategory, balance: e.target.value })}
                            />
                            <input
                                type="number"
                                placeholder="Budget Limit (optional)"
                                value={newCategory.budgetLimit}
                                onChange={e => setNewCategory({ ...newCategory, budgetLimit: e.target.value })}
                            />
                            <button type="submit">Create</button>
                        </form>
                    )}
                </>
            )}

            {/* ── HISTORY TAB ── */}
            {activeTab === "history" && (
                <div>
                    {transactions.length === 0 && <p>No transactions yet.</p>}
                    {transactions.map(tx => (
                        <div key={tx.id} style={{
                            display: "flex", justifyContent: "space-between",
                            padding: "8px 0", borderBottom: "1px solid #eee"
                        }}>
                            <div>
                                <strong>{tx.balanceName}</strong>
                                <p style={{ margin: 0, fontSize: 13, color: "#666" }}>{tx.description}</p>
                                <p style={{ margin: 0, fontSize: 11, color: "#999" }}>
                                    {new Date(tx.date).toLocaleDateString("id-ID")}
                                </p>
                            </div>
                            <span style={{ color: tx.type === "income" ? "green" : "red", fontWeight: "bold" }}>
                                {tx.type === "income" ? "+" : "-"}Rp {tx.amount.toLocaleString("id-ID")}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}