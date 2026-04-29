import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase.js";
import API from "../services/api";
import Sidebar from "../components/Sidebar.jsx";
import Navbar from "../components/Navbar.jsx";
import {
    fetchBalances,
    fetchTransactions,
    fetchSummary,
    addBalanceCategory,
    deleteBalanceCategory,
    addTransaction,
    deleteTransaction,
    updateBudgetLimit,
    formatRupiah,
    getCurrentMonth
} from "../services/balance";
import { PieChart } from '@mui/x-charts/PieChart';
import { BarChart } from '@mui/x-charts/BarChart';
import { LineChart } from '@mui/x-charts/LineChart';

const CATEGORY_TYPES = [
    { value: "cash", label: "Cash", icon: "mdi:cash-multiple" },
    { value: "bank", label: "Bank", icon: "mdi:bank" },
    { value: "ewallet", label: "E-Wallet", icon: "mdi:wallet-outline" },
    { value: "savings", label: "Savings", icon: "mdi:piggy-bank-outline" },
    { value: "investment", label: "Investment", icon: "mdi:trending-up" },
    { value: "income", label: "Income", icon: "mdi:plus-circle-outline" },
    { value: "expenses", label: "Expenses", icon: "mdi:receipt" },
];

const MONTHS = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(2024, i, 1);
    return {
        value: `${new Date().getFullYear()}-${String(i + 1).padStart(2, "0")}`,
        label: d.toLocaleString("id-ID", { month: "long" })
    };
});

const currentMonth = getCurrentMonth;

const formatRp = formatRupiah;

function BudgetBar({ spent, limit }) {
    if (!limit || limit <= 0) return null;
    const pct = Math.min((spent / limit) * 100, 100);
    const color = pct >= 90 ? "bg-red-500" : pct >= 70 ? "bg-amber-400" : "bg-emerald-500";
    return (
        <div className="mt-2">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Spent: {formatRp(spent)}</span>
                <span>Limit: {formatRp(limit)}</span>
            </div>
            <div className="h-1.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all duration-500 ${color}`}
                    style={{ width: `${pct}%` }}
                />
            </div>
            {pct >= 90 && (
                <p className="text-xs text-red-500 mt-1 font-medium">
                    ⚠ Mendekati batas anggaran
                </p>
            )}
        </div>
    );
}

function Toast({ message, type, onClose }) {
    useEffect(() => {
        const t = setTimeout(onClose, 3000);
        return () => clearTimeout(t);
    }, [onClose]);

    const colors = type === "error"
        ? "bg-red-50 border-red-300 text-red-700 dark:bg-red-900/30 dark:text-red-300"
        : "bg-emerald-50 border-emerald-300 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300";

    return (
        <div className={`fixed bottom-6 right-6 z-50 border rounded-xl px-4 py-3 text-sm shadow-lg max-w-xs ${colors}`}>
            {message}
        </div>
    );
}

function Modal({ title, onClose, children }) {
    return (
        <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-black/40 px-4 pb-4 sm:pb-0">
            <div style={{ background: "#172619" }} className="rounded-2xl w-full max-w-md shadow-2xl border border-9FF782">
                <div style={{ borderBottomColor: "#9FF782" }} className="flex items-center justify-between px-5 pt-5 pb-3 border-b">
                    <h3 style={{ color: "#9FF782" }} className="font-semibold">{title}</h3>
                    <button
                        onClick={onClose}
                        style={{ color: "#9FF782" }}
                        className="hover:opacity-70 text-xl leading-none transition"
                    >×</button>
                </div>
                <div className="px-5 py-4">{children}</div>
            </div>
        </div>
    );
}

function InputField({ label, error, ...props }) {
    return (
        <div>
            {label && <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>}
            <input
                {...props}
                style={{ background: "white", borderColor: "#9FF782", color: "#1a3a1f" }}
                className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus:ring-2 transition
                    ${error
                        ? "focus:ring-red-200 dark:focus:ring-red-900"
                        : "focus:ring-emerald-200 dark:focus:ring-emerald-900"
                    }`}
            />
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        </div>
    );
}

function SelectField({ label, children, ...props }) {
    return (
        <div>
            {label && <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>}
            <select
                {...props}
                style={{ background: "white", borderColor: "#9FF782", color: "#1a3a1f" }}
                className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-200 dark:focus:ring-emerald-900 transition"
            >
                {children}
            </select>
        </div>
    );
}

export default function Balance() {
    const navigate = useNavigate();
    const [balances, setBalances] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("overview");
    const [selectedMonth, setSelectedMonth] = useState(currentMonth());
    const [selectedBalanceFilter, setSelectedBalanceFilter] = useState("all");
    const [currentPage, setCurrentPage] = useState(1);
    const [toast, setToast] = useState(null);

    // New state for sidebar and navbar
    const [profile, setProfile] = useState(null);
    const [personal, setPersonal] = useState(null);
    const [activeNav, setActiveNav] = useState("saldo");
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Modals
    const [showAddCategory, setShowAddCategory] = useState(false);
    const [showAddTx, setShowAddTx] = useState(false);
    const [editLimitId, setEditLimitId] = useState(null);

    // Forms
    const [newCategory, setNewCategory] = useState({ name: "", type: "cash", balance: "", budgetLimit: "" });
    const [txForm, setTxForm] = useState({ balanceId: "", amount: "", type: "expense", description: "" });
    const [limitValue, setLimitValue] = useState("");
    const [formErrors, setFormErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);

    const showToast = (message, type = "success") => setToast({ message, type });

    const fetchAll = useCallback(async () => {
        try {
            const [balRes, txRes, sumRes] = await Promise.all([
                fetchBalances(),
                fetchTransactions(selectedMonth),
                fetchSummary(selectedMonth)
            ]);
            setBalances(balRes);
            setTransactions(txRes);
            setSummary(sumRes);
        } catch (err) {
            showToast("Gagal memuat data", "error");
        } finally {
            setLoading(false);
        }
    }, [selectedMonth]);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (user) => {
            if (user) {
                Promise.all([
                    API.get("/auth/profile"),
                    API.get("/personal/profile"),
                ]).then(([pRes, perRes]) => {
                    setProfile(pRes.data);
                    setPersonal(perRes.data);
                }).catch(console.error);
            }
        });
        return () => unsub();
    }, []);

    const handleNavigation = (navId) => {
        const routes = {
            beranda: "/dashboard",
            edukasi: "/video",
            tabungan: "/tabungan",
            profil: "/profile",
        };
        if (routes[navId]) navigate(routes[navId]);
    };

    const handleLogout = async () => {
        await auth.signOut();
        navigate("/login");
    };

    // ── Add Category ──────────────────────────────────────────────
    const validateCategory = () => {
        const errors = {};
        if (!newCategory.name.trim()) errors.name = "Nama kategori wajib diisi";
        if (newCategory.balance !== "" && isNaN(newCategory.balance)) errors.balance = "Harus berupa angka";
        if (newCategory.budgetLimit !== "" && isNaN(newCategory.budgetLimit)) errors.budgetLimit = "Harus berupa angka";
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleAddCategory = async (e) => {
        e.preventDefault();
        if (!validateCategory()) return;
        setSubmitting(true);
        try {
            const res = await addBalanceCategory(
                newCategory.name.trim(),
                newCategory.type,
                newCategory.balance,
                newCategory.budgetLimit
            );
            setBalances(prev => [...prev, res]);
            setNewCategory({ name: "", type: "cash", balance: "", budgetLimit: "" });
            setShowAddCategory(false);
            showToast("Kategori berhasil ditambahkan");
        } catch (err) {
            showToast(err.response?.data?.error || "Gagal menambah kategori", "error");
        } finally {
            setSubmitting(false);
        }
    };

    // ── Delete Category ───────────────────────────────────────────
    const handleDeleteCategory = async (id) => {
        if (!window.confirm("Hapus kategori ini?")) return;
        try {
            await deleteBalanceCategory(id);
            setBalances(prev => prev.filter(b => b.id !== id));
            showToast("Kategori dihapus");
        } catch (err) {
            showToast("Gagal menghapus kategori", "error");
        }
    };

    // ── Add Transaction ───────────────────────────────────────────
    const validateTx = () => {
        const errors = {};
        if (!txForm.balanceId) errors.balanceId = "Pilih kategori";
        if (!txForm.amount || isNaN(txForm.amount) || parseFloat(txForm.amount) <= 0)
            errors.amount = "Masukkan jumlah yang valid";
        if (!txForm.description.trim()) errors.description = "Deskripsi wajib diisi";
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleTransaction = async (e) => {
        e.preventDefault();
        if (!validateTx()) return;
        setSubmitting(true);
        try {
            await addTransaction(
                txForm.balanceId,
                txForm.amount,
                txForm.type,
                txForm.description.trim()
            );
            setTxForm({ balanceId: "", amount: "", type: "expense", description: "" });
            setShowAddTx(false);
            showToast("Transaksi berhasil ditambahkan");
            fetchAll();
        } catch (err) {
            showToast(err.response?.data?.error || "Gagal menambah transaksi", "error");
        } finally {
            setSubmitting(false);
        }
    };

    // ── Delete Transaction ────────────────────────────────────────
    const handleDeleteTx = async (tx) => {
        if (!window.confirm("Hapus transaksi ini?")) return;
        try {
            await deleteTransaction(tx.balanceId, tx.id);
            setTransactions(prev => prev.filter(t => t.id !== tx.id));
            showToast("Transaksi dihapus");
            fetchAll();
        } catch (err) {
            showToast("Gagal menghapus transaksi", "error");
        }
    };

    // ── Update Budget Limit ───────────────────────────────────────
    const handleUpdateLimit = async (id) => {
        if (!limitValue || isNaN(limitValue)) {
            showToast("Masukkan angka yang valid", "error");
            return;
        }
        try {
            await updateBudgetLimit(id, limitValue);
            setBalances(prev => prev.map(b =>
                b.id === id ? { ...b, budgetLimit: parseFloat(limitValue) } : b
            ));
            setEditLimitId(null);
            setLimitValue("");
            showToast("Batas anggaran diperbarui");
        } catch (err) {
            showToast("Gagal memperbarui batas anggaran", "error");
        }
    };

    const totalBalance = balances.reduce((s, b) => s + (b.balance || 0), 0);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-gray-500">Memuat data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-gray-50 font-sans overflow-hidden">
            <Sidebar active={activeNav} setActive={(navId) => { setActiveNav(navId); handleNavigation(navId); }} handleLogout={handleLogout} isOpen={isSidebarOpen} setOpen={setIsSidebarOpen} />

            <main className="flex-1 flex flex-col h-screen overflow-hidden w-full">
                <Navbar profile={profile} personal={personal} isOpen={isProfileOpen} setOpen={setIsProfileOpen} isSidebarOpen={isSidebarOpen} setSidebarOpen={setIsSidebarOpen} />

                <div className="flex-1 overflow-y-auto bg-gray-50">
                    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "24px 16px 40px", paddingTop: "80px" }}>

                        {/* Total Saldo Card */}
                        <div style={{ background: "linear-gradient(135deg, #1a3a1f 0%, #0f2a18 100%)", borderRadius: 20, padding: 24, marginBottom: 24, color: "white" }}>
                            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>Total Saldo Anda</p>
                            <p style={{ fontSize: 32, fontWeight: 800, color: "#9FF782", marginBottom: 20 }}>{formatRp(totalBalance)}</p>

                            {summary && (
                                <div style={{ borderTop: "1px solid rgba(255,255,255,0.2)", paddingTop: 16, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
                                    <div>
                                        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", marginBottom: 4 }}>Pemasukan</p>
                                        <p style={{ fontSize: 16, fontWeight: 700, color: "#9FF782" }}>+{formatRp(summary.totalIncome)}</p>
                                    </div>
                                    <div>
                                        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", marginBottom: 4 }}>Pengeluaran</p>
                                        <p style={{ fontSize: 16, fontWeight: 700, color: "white" }}>-{formatRp(summary.totalExpense)}</p>
                                    </div>
                                    <div>
                                        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", marginBottom: 4 }}>Net</p>
                                        <p style={{ fontSize: 16, fontWeight: 700, color: summary.net >= 0 ? "#9FF782" : "#ff6b6b" }}>
                                            {summary.net >= 0 ? "+" : ""}{formatRp(summary.net)}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Month picker and action buttons */}
                        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
                            <label style={{ fontSize: 13, color: "#6b7280", whiteSpace: "nowrap" }}>Bulan :</label>
                            <select
                                value={selectedMonth}
                                onChange={e => setSelectedMonth(e.target.value)}
                                style={{ fontSize: 13, border: "1px solid #1a3a1f", borderRadius: 8, padding: "8px 12px", background: "white", color: "#1a3a1f", fontWeight: 600, cursor: "pointer" }}
                            >
                                {MONTHS.map(m => (
                                    <option key={m.value} value={m.value}>{m.label}</option>
                                ))}
                            </select>

                            <button
                                onClick={() => { setShowAddTx(true); setFormErrors({}); }}
                                style={{ display: "flex", alignItems: "center", gap: 6, background: "#1a3a1f", color: "white", border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer", marginLeft: "auto" }}
                            >
                                <span style={{ fontSize: 16 }}>+</span> Transaksi
                            </button>

                            <button
                                onClick={() => { setShowAddCategory(true); setFormErrors({}); }}
                                style={{ display: "flex", alignItems: "center", gap: 6, background: "white", color: "#1a3a1f", border: "1px solid #e5e7eb", borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
                            >
                                <span style={{ fontSize: 16 }}>+</span> Sumber Dana
                            </button>
                        </div>

                        {/* Tabs */}
                        <div style={{ display: "flex", gap: 0, borderBottom: "1px solid #e5e7eb", marginBottom: 24 }}>
                            {["history", "overview", "rekap"].map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    style={{
                                        padding: "12px 24px",
                                        fontSize: 14,
                                        fontWeight: activeTab === tab ? 700 : 500,
                                        color: activeTab === tab ? "#1a3a1f" : "#9ca3af",
                                        background: "none",
                                        border: "none",
                                        cursor: "pointer",
                                        borderBottom: activeTab === tab ? "3px solid #1a3a1f" : "none",
                                        transition: "all 0.2s"
                                    }}
                                >
                                    {tab === "overview" ? "Ringkasan" : tab === "history" ? "Riwayat" : "Rekap"}
                                </button>
                            ))}
                        </div>

                        {/* ── OVERVIEW ── */}
                        {activeTab === "overview" && (
                            <div>
                                {balances.length === 0 ? (
                                    <div style={{ textAlign: "center", paddingTop: 64, paddingBottom: 64, color: "#9ca3af" }}>
                                        <iconify-icon icon="mdi:folder-outline" style={{ fontSize: 48, marginBottom: 12, color: "#9ca3af", display: "block" }}></iconify-icon>
                                        <p style={{ fontWeight: 600, color: "#4b5563", marginBottom: 8 }}>Belum ada kategori</p>
                                        <p style={{ fontSize: 12 }}>Tambahkan kategori untuk mulai mencatat saldo</p>
                                    </div>
                                ) : (
                                    <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 20 }}>
                                        {balances.map(b => {
                                            const typeInfo = CATEGORY_TYPES.find(t => t.value === b.type);
                                            const isEditingLimit = editLimitId === b.id;
                                            const pct = b.budgetLimit ? Math.min((b.totalSpent / b.budgetLimit) * 100, 100) : 0;

                                            return (
                                                <div
                                                    key={b.id}
                                                    style={{ background: "white", borderRadius: 16, padding: 20, border: "1px solid #e5e7eb", cursor: "pointer", transition: "all 0.2s" }}
                                                >
                                                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
                                                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                                            <iconify-icon icon={typeInfo?.icon} style={{ fontSize: 32, color: "#1a3a1f" }}></iconify-icon>
                                                            <div>
                                                                <p style={{ fontWeight: 600, color: "#1a3a1f", fontSize: 14, marginBottom: 2 }}>{b.name}</p>
                                                                <p style={{ fontSize: 12, color: "#9ca3af", textTransform: "capitalize" }}>{typeInfo?.label}</p>
                                                            </div>
                                                        </div>
                                                        <div style={{ textAlign: "right" }}>
                                                            <p style={{ fontWeight: 700, color: "#1a3a1f", fontSize: 16, marginBottom: 4 }}>{formatRp(b.balance)}</p>
                                                            <button
                                                                onClick={() => handleDeleteCategory(b.id)}
                                                                style={{ fontSize: 11, color: "#ef4444", fontWeight: 600, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                                                                Hapus
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* Edit Budget Limit Mode */}
                                                    {isEditingLimit ? (
                                                        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                                                            <input
                                                                type="number"
                                                                value={limitValue}
                                                                onChange={e => setLimitValue(e.target.value)}
                                                                placeholder="Masukkan batas anggaran"
                                                                style={{ flex: 1, borderRadius: 8, border: "1px solid #d1d5db", padding: "8px 12px", fontSize: 13, outline: "none" }}
                                                            />
                                                            <button
                                                                onClick={() => handleUpdateLimit(b.id)}
                                                                style={{ padding: "8px 16px", borderRadius: 8, background: "#10b981", color: "white", border: "none", cursor: "pointer", fontWeight: 600, fontSize: 12 }}>
                                                                Simpan
                                                            </button>
                                                            <button
                                                                onClick={() => { setEditLimitId(null); setLimitValue(""); }}
                                                                style={{ padding: "8px 16px", borderRadius: 8, background: "#e5e7eb", color: "#6b7280", border: "none", cursor: "pointer", fontWeight: 600, fontSize: 12 }}>
                                                                Batal
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16, fontSize: 12 }}>
                                                            {b.budgetLimit ? (
                                                                <>
                                                                    <span style={{ color: "#9ca3af" }}>Limit: {formatRp(b.budgetLimit)}</span>
                                                                    <button
                                                                        onClick={() => { setEditLimitId(b.id); setLimitValue(b.budgetLimit || ""); }}
                                                                        style={{ color: "#0ea5e9", fontWeight: 600, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                                                                        Edit Limit
                                                                    </button>
                                                                </>
                                                            ) : (
                                                                <button
                                                                    onClick={() => { setEditLimitId(b.id); setLimitValue(""); }}
                                                                    style={{ color: "#9ca3af", fontWeight: 600, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                                                                    + Tambah Limit Anggaran
                                                                </button>
                                                            )}
                                                        </div>
                                                    )}

                                                    {/* Budget bar */}
                                                    {b.budgetLimit && b.budgetLimit > 0 && (
                                                        <div>
                                                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#9ca3af", marginBottom: 8 }}>
                                                                <span>Spent: {formatRp(b.totalSpent || 0)}</span>
                                                                <span>Limit: {formatRp(b.budgetLimit)}</span>
                                                            </div>
                                                            <div style={{ height: 6, borderRadius: 3, background: "#e5e7eb", overflow: "hidden" }}>
                                                                <div
                                                                    style={{
                                                                        height: "100%",
                                                                        borderRadius: 3,
                                                                        background: pct >= 90 ? "#ef4444" : pct >= 70 ? "#f59e0b" : "#10b981",
                                                                        width: `${pct}%`,
                                                                        transition: "width 0.5s ease"
                                                                    }}
                                                                />
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* Action buttons — only show if empty or after list */}
                                {balances.length > 0 && (
                                    <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
                                        <button
                                            onClick={() => { setShowAddTx(true); setFormErrors({}); }}
                                            style={{ flex: 1, background: "#1a3a1f", color: "white", border: "none", borderRadius: 12, padding: "12px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
                                        >
                                            + Transaksi
                                        </button>
                                        <button
                                            onClick={() => { setShowAddCategory(true); setFormErrors({}); }}
                                            style={{ flex: 1, background: "white", color: "#1a3a1f", border: "1px solid #e5e7eb", borderRadius: 12, padding: "12px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
                                        >
                                            + Sumber Dana
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ── HISTORY ── */}
                        {activeTab === "history" && (
                            <div>
                                {/* Filter by Balance Category */}
                                <div style={{ marginBottom: 24, paddingBottom: 16, borderBottom: "1px solid #e5e7eb" }}>
                                    <p style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", marginBottom: 12, textTransform: "uppercase", letterSpacing: 1 }}>Filter Sumber Dana</p>
                                    <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 8 }}>
                                        <button
                                            onClick={() => setSelectedBalanceFilter("all")}
                                            style={{
                                                padding: "8px 16px",
                                                borderRadius: 8,
                                                whiteSpace: "nowrap",
                                                fontWeight: 600,
                                                fontSize: 13,
                                                border: "none",
                                                cursor: "pointer",
                                                background: selectedBalanceFilter === "all" ? "#1a3a1f" : "#f3f4f6",
                                                color: selectedBalanceFilter === "all" ? "white" : "#374151",
                                                transition: "all 0.2s"
                                            }}
                                        >
                                            Semua
                                        </button>
                                        {balances.map(balance => (
                                            <button
                                                key={balance.id}
                                                onClick={() => setSelectedBalanceFilter(balance.id)}
                                                style={{
                                                    padding: "8px 16px",
                                                    borderRadius: 8,
                                                    whiteSpace: "nowrap",
                                                    fontWeight: 600,
                                                    fontSize: 13,
                                                    border: "none",
                                                    cursor: "pointer",
                                                    background: selectedBalanceFilter === balance.id ? "#1a3a1f" : "#f3f4f6",
                                                    color: selectedBalanceFilter === balance.id ? "white" : "#374151",
                                                    transition: "all 0.2s"
                                                }}
                                            >
                                                {balance.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Transactions Table */}
                                {(() => {
                                    const filteredTx = selectedBalanceFilter === "all"
                                        ? transactions
                                        : transactions.filter(tx => tx.balanceId === selectedBalanceFilter);

                                    const itemsPerPage = 5;
                                    const totalPages = Math.ceil(filteredTx.length / itemsPerPage);
                                    const startIdx = (currentPage - 1) * itemsPerPage;
                                    const paginatedTx = filteredTx.slice(startIdx, startIdx + itemsPerPage);

                                    return filteredTx.length === 0 ? (
                                        <div style={{ textAlign: "center", paddingTop: 64, paddingBottom: 64, color: "#9ca3af" }}>
                                            <iconify-icon icon="mdi:inbox-outline" style={{ fontSize: 48, marginBottom: 12, color: "#9ca3af", display: "block" }}></iconify-icon>
                                            <p style={{ fontWeight: 600, color: "#4b5563", marginBottom: 8 }}>Belum ada transaksi</p>
                                            <p style={{ fontSize: 12 }}>Transaksi yang kamu catat akan muncul di sini</p>
                                        </div>
                                    ) : (
                                        <div>
                                            <div style={{ overflowX: "auto", marginBottom: 20 }}>
                                                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                                    <thead>
                                                        <tr style={{ background: "#f9fafb", borderBottom: "2px solid #e5e7eb" }}>
                                                            <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.5 }}>Tanggal</th>
                                                            <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.5 }}>Deskripsi</th>
                                                            <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.5 }}>Sumber</th>
                                                            <th style={{ padding: "12px 16px", textAlign: "right", fontSize: 12, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.5 }}>Jumlah</th>
                                                            <th style={{ padding: "12px 16px", textAlign: "center", fontSize: 12, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.5 }}>Aksi</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {paginatedTx.map((tx, idx) => (
                                                            <tr
                                                                key={tx.id}
                                                                style={{
                                                                    borderBottom: "1px solid #e5e7eb",
                                                                    background: idx % 2 === 0 ? "white" : "#f9fafb",
                                                                    transition: "background 0.2s"
                                                                }}
                                                                onMouseEnter={(e) => e.currentTarget.style.background = "#f3f4f6"}
                                                                onMouseLeave={(e) => e.currentTarget.style.background = idx % 2 === 0 ? "white" : "#f9fafb"}
                                                            >
                                                                <td style={{ padding: "12px 16px", fontSize: 13, color: "#374151" }}>
                                                                    {new Date(tx.date).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}
                                                                </td>
                                                                <td style={{ padding: "12px 16px", fontSize: 13, color: "#1a3a1f", fontWeight: 500 }}>
                                                                    {tx.description}
                                                                </td>
                                                                <td style={{ padding: "12px 16px", fontSize: 13, color: "#6b7280" }}>
                                                                    {tx.balanceName}
                                                                </td>
                                                                <td style={{
                                                                    padding: "12px 16px",
                                                                    textAlign: "right",
                                                                    fontSize: 13,
                                                                    fontWeight: 700,
                                                                    color: tx.type === "income" ? "#059669" : "#dc2626"
                                                                }}>
                                                                    {tx.type === "income" ? "+" : "-"}{formatRp(tx.amount)}
                                                                </td>
                                                                <td style={{ padding: "12px 16px", textAlign: "center" }}>
                                                                    <button
                                                                        onClick={() => handleDeleteTx(tx)}
                                                                        style={{
                                                                            background: "none",
                                                                            border: "none",
                                                                            color: "#ef4444",
                                                                            fontSize: 16,
                                                                            cursor: "pointer",
                                                                            fontWeight: 700,
                                                                            transition: "color 0.2s"
                                                                        }}
                                                                        onMouseEnter={(e) => e.currentTarget.style.color = "#b91c1c"}
                                                                        onMouseLeave={(e) => e.currentTarget.style.color = "#ef4444"}
                                                                        title="Hapus transaksi"
                                                                    >
                                                                        ×
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>

                                            {/* Pagination */}
                                            {totalPages > 1 && (
                                                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 20 }}>
                                                    <button
                                                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                                        disabled={currentPage === 1}
                                                        style={{
                                                            padding: "8px 12px",
                                                            background: currentPage === 1 ? "#f3f4f6" : "#1a3a1f",
                                                            color: currentPage === 1 ? "#9ca3af" : "white",
                                                            border: "none",
                                                            borderRadius: 6,
                                                            cursor: currentPage === 1 ? "not-allowed" : "pointer",
                                                            fontSize: 13,
                                                            fontWeight: 600,
                                                            transition: "all 0.2s"
                                                        }}
                                                    >
                                                        ← Sebelumnya
                                                    </button>

                                                    <div style={{ display: "flex", gap: 4 }}>
                                                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                                            <button
                                                                key={page}
                                                                onClick={() => setCurrentPage(page)}
                                                                style={{
                                                                    padding: "6px 10px",
                                                                    background: currentPage === page ? "#1a3a1f" : "#f3f4f6",
                                                                    color: currentPage === page ? "white" : "#6b7280",
                                                                    border: "none",
                                                                    borderRadius: 4,
                                                                    cursor: "pointer",
                                                                    fontSize: 12,
                                                                    fontWeight: 600,
                                                                    transition: "all 0.2s"
                                                                }}
                                                            >
                                                                {page}
                                                            </button>
                                                        ))}
                                                    </div>

                                                    <button
                                                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                                        disabled={currentPage === totalPages}
                                                        style={{
                                                            padding: "8px 12px",
                                                            background: currentPage === totalPages ? "#f3f4f6" : "#1a3a1f",
                                                            color: currentPage === totalPages ? "#9ca3af" : "white",
                                                            border: "none",
                                                            borderRadius: 6,
                                                            cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                                                            fontSize: 13,
                                                            fontWeight: 600,
                                                            transition: "all 0.2s"
                                                        }}
                                                    >
                                                        Selanjutnya →
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })()}
                            </div>
                        )}

                        {/* ── REKAP (Summary/Chart) ── */}
                        {activeTab === "rekap" && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Pie Chart - Spending by Category */}
                                    <div className="bg-gradient-to-b from-[#0b2a17] to-[#123d23] rounded-2xl p-6 shadow-lg">
                                        <h3 className="font-semibold text-white dark:text-white mb-4">Pengeluaran per Kategori</h3>
                                        {(() => {
                                            const categorySpending = balances.map(b => ({
                                                name: b.name,
                                                spent: b.totalSpent || 0,
                                                color: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'][balances.indexOf(b) % 7]
                                            })).filter(c => c.spent > 0);

                                            if (categorySpending.length === 0) {
                                                return (
                                                    <div className="text-center py-8 text-gray-400">
                                                        <iconify-icon icon="mdi:chart-box-outline" style={{ fontSize: 32, marginBottom: 8, color: "#9ca3af", display: "block" }}></iconify-icon>
                                                        <p className="text-sm">Belum ada data pengeluaran</p>
                                                    </div>
                                                );
                                            }

                                            return (
                                                <div style={{ display: 'flex', justifyContent: 'center', width: '100%', height: 400 }}>
                                                    <PieChart
                                                        series={[
                                                            {
                                                                data: categorySpending.map((c, idx) => ({
                                                                    id: idx,
                                                                    value: c.spent,
                                                                    label: c.name,
                                                                    color: ['#10b981', '#34d399', '#6ee7b7', '#a7f3d0', '#d1fae5', '#06b6d4', '#0ea5e9'][idx % 7]
                                                                })),
                                                                innerRadius: 50,
                                                                outerRadius: 120,
                                                                paddingAngle: 2,
                                                                cornerRadius: 5,
                                                                arcLabel: (item) => {
                                                                    const total = categorySpending.reduce((sum, c) => sum + c.spent, 0);
                                                                    const pct = ((item.value / total) * 100).toFixed(0);
                                                                    return `${pct}%`;
                                                                },
                                                                valueFormatter: ({ value }) => {
                                                                    const total = categorySpending.reduce((sum, c) => sum + c.spent, 0);
                                                                    const pct = ((value / total) * 100).toFixed(1);
                                                                    return `${formatRp(value)} (${pct}%)`;
                                                                },
                                                                highlightScope: { fade: 'global', highlight: 'item' },
                                                                highlighted: { additionalRadius: 3 },
                                                            }
                                                        ]}
                                                        width={550}
                                                        height={400}
                                                        margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                                                        slotProps={{
                                                            legend: {
                                                                direction: 'row',
                                                                position: { vertical: 'bottom', horizontal: 'middle' },
                                                                padding: 20,
                                                            }
                                                        }}
                                                        sx={{
                                                            '& text': {
                                                                fill: '#ffffff !important',
                                                                fontSize: '14px',
                                                                fontWeight: 'bold',
                                                            }
                                                        }}
                                                    />
                                                </div>
                                            );
                                        })()}
                                    </div>

                                    {/* Bar Chart - Category Spending */}
                                    <div className="bg-gradient-to-b from-[#0b2a17] to-[#123d23] rounded-2xl p-6 shadow-lg">
                                        <h3 className="font-semibold text-white dark:text-white mb-4">Rincian Pengeluaran</h3>
                                        {(() => {
                                            const categorySpending = balances.map(b => ({
                                                name: b.name,
                                                spent: b.totalSpent || 0,
                                                color: ['#00d084', '#0066ff', '#ff8c00', '#ff3333', '#9d00ff', '#ff1493', '#00ccff'][balances.indexOf(b) % 7]
                                            })).filter(c => c.spent > 0).sort((a, b) => b.spent - a.spent);

                                            if (categorySpending.length === 0) {
                                                return (
                                                    <div className="text-center py-8 text-gray-400">
                                                        <iconify-icon icon="mdi:chart-box-outline" style={{ fontSize: 32, marginBottom: 8, color: "#9ca3af", display: "block" }}></iconify-icon>
                                                        <p className="text-sm">Belum ada data pengeluaran</p>
                                                    </div>
                                                );
                                            }

                                            return (
                                                <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                                                    <BarChart
                                                        layout="vertical"
                                                        series={[
                                                            {
                                                                data: categorySpending.map(c => c.spent),
                                                                label: 'Pengeluaran'
                                                            }
                                                        ]}
                                                        xAxis={[{
                                                            data: categorySpending.map(c => c.name),
                                                            scaleType: 'band',
                                                            categoryGapRatio: 0.5
                                                        }]}
                                                        yAxis={[{ type: 'linear' }]}
                                                        slotProps={{
                                                            legend: {
                                                                hidden: true
                                                            }
                                                        }}
                                                        width={500}
                                                        height={300}
                                                        margin={{ top: 10, right: 20, bottom: 10, left: 100 }}
                                                        colors={categorySpending.map(c => c.color)}
                                                        sx={{
                                                            '& text': {
                                                                fill: '#ffffff !important',
                                                                fontSize: '13px',
                                                            }
                                                        }}
                                                    />
                                                </div>
                                            );
                                        })()}
                                    </div>
                                </div>

                                {/* Summary Stats */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {(() => {
                                        const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
                                        const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
                                        const netFlow = totalIncome - totalExpense;

                                        return [
                                            { label: 'Pemasukan', value: totalIncome, color: 'bg-emerald-600 dark:bg-emerald-700', textColor: 'text-white dark:text-emerald-100' },
                                            { label: 'Pengeluaran', value: totalExpense, color: 'bg-red-600 dark:bg-red-700', textColor: 'text-white dark:text-red-100' },
                                            { label: 'Arus Bersih', value: netFlow, color: netFlow >= 0 ? 'bg-blue-600 dark:bg-blue-700' : 'bg-orange-600 dark:bg-orange-700', textColor: netFlow >= 0 ? 'text-white dark:text-blue-100' : 'text-white dark:text-orange-100' },
                                            { label: 'Total Saldo', value: balances.reduce((sum, b) => sum + (b.balance || 0), 0), color: 'bg-purple-600 dark:bg-purple-700', textColor: 'text-white dark:text-purple-100' }
                                        ].map((stat, idx) => (
                                            <div key={idx} className={`${stat.color} border border-gray-100 dark:border-gray-800 rounded-2xl p-4`}>
                                                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">{stat.label}</p>
                                                <p className={`font-bold text-lg ${stat.textColor}`}>{formatRp(stat.value)}</p>
                                            </div>
                                        ));
                                    })()}
                                </div>
                            </div>
                        )}

                        {/* ── LINE CHART: Transaction History Trend ──────────────────────── */}
                        <div className="bg-gradient-to-b from-[#0b2a17] to-[#123d23] rounded-2xl p-6 shadow-lg mt-6 w-full">
                            <h3 className="font-semibold text-white dark:text-white mb-4">Riwayat Transaksi Trend</h3>
                            {(() => {
                                // Group transactions by date
                                const txByDate = {};
                                transactions.forEach(tx => {
                                    const date = new Date(tx.date).toLocaleDateString('id-ID');
                                    if (!txByDate[date]) txByDate[date] = { income: 0, expense: 0 };
                                    if (tx.type === 'income') txByDate[date].income += tx.amount;
                                    else txByDate[date].expense += tx.amount;
                                });

                                const chartData = Object.keys(txByDate).sort().map(date => ({
                                    date,
                                    income: txByDate[date].income,
                                    expense: txByDate[date].expense,
                                    net: txByDate[date].income - txByDate[date].expense
                                }));

                                if (chartData.length === 0) {
                                    return (
                                        <div className="text-center py-8 text-gray-400">
                                            <iconify-icon icon="mdi:chart-box-outline" style={{ fontSize: 32, marginBottom: 8, color: "#9ca3af", display: "block" }}></iconify-icon>
                                            <p className="text-sm">Belum ada data transaksi</p>
                                        </div>
                                    );
                                }

                                return (
                                    <div style={{ width: '100%', height: 400, display: 'flex', justifyContent: 'center' }}>
                                        <LineChart
                                            series={[
                                                {
                                                    data: chartData.map(d => d.income),
                                                    label: 'Pemasukan',
                                                    color: '#10b981',
                                                    valueFormatter: (value) => `Rp ${value.toLocaleString('id-ID')}`,
                                                },
                                                {
                                                    data: chartData.map(d => d.expense),
                                                    label: 'Pengeluaran',
                                                    color: '#ef4444',
                                                    valueFormatter: (value) => `Rp ${value.toLocaleString('id-ID')}`,
                                                },
                                                {
                                                    data: chartData.map(d => d.net),
                                                    label: 'Arus Bersih',
                                                    color: '#0ea5e9',
                                                    valueFormatter: (value) => `Rp ${value.toLocaleString('id-ID')}`,
                                                }
                                            ]}
                                            xAxis={[{
                                                scaleType: 'point',
                                                data: chartData.map(d => d.date)
                                            }]}
                                            width={1000}
                                            height={400}
                                            margin={{ top: 20, right: 20, bottom: 60, left: 80 }}
                                            slotProps={{
                                                legend: {
                                                    direction: 'row',
                                                    position: { vertical: 'bottom', horizontal: 'middle' },
                                                    padding: 20,
                                                }
                                            }}
                                            sx={{
                                                '& text': {
                                                    fill: '#ffffff !important',
                                                    fontSize: '13px',
                                                }
                                            }}
                                        />
                                    </div>
                                );
                            })()}
                        </div>

                        {/* ── MODAL: Add Transaction ── */}
                        {showAddTx && (
                            <Modal title="Tambah Transaksi" onClose={() => { setShowAddTx(false); setFormErrors({}); }}>
                                <form onSubmit={handleTransaction} className="space-y-4">
                                    <SelectField
                                        label="Sumber Dana"
                                        value={txForm.balanceId}
                                        onChange={e => setTxForm({ ...txForm, balanceId: e.target.value })}
                                    >
                                        <option value="">Pilih sumber dana...</option>
                                        {balances.map(b => (
                                            <option key={b.id} value={b.id}>{b.name}</option>
                                        ))}
                                    </SelectField>
                                    {formErrors.balanceId && <p className="text-xs text-red-500 -mt-3">{formErrors.balanceId}</p>}

                                    <SelectField
                                        label="Tipe"
                                        value={txForm.type}
                                        onChange={e => setTxForm({ ...txForm, type: e.target.value })}
                                    >
                                        <option value="income">+ Pemasukan</option>
                                        <option value="expense">- Pengeluaran</option>
                                    </SelectField>

                                    <InputField
                                        label="Jumlah (Rp)"
                                        type="number"
                                        placeholder="0"
                                        value={txForm.amount}
                                        onChange={e => setTxForm({ ...txForm, amount: e.target.value })}
                                        error={formErrors.amount}
                                    />
                                    <InputField
                                        label="Deskripsi"
                                        placeholder="Contoh: Makan siang, Gaji, dll"
                                        value={txForm.description}
                                        onChange={e => setTxForm({ ...txForm, description: e.target.value })}
                                        error={formErrors.description}
                                    />

                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        style={{ background: "white", color: "#172619" }}
                                        className="w-full disabled:opacity-60 text-white py-3 rounded-xl font-semibold text-sm transition hover:opacity-90"
                                    >
                                        {submitting ? "Menyimpan..." : "Simpan Transaksi"}
                                    </button>
                                </form>
                            </Modal>
                        )}

                        {/* ── MODAL: Add Category ── */}
                        {showAddCategory && (
                            <Modal title="Tambah Sumber Dana" onClose={() => { setShowAddCategory(false); setFormErrors({}); }}>
                                <form onSubmit={handleAddCategory} className="space-y-4">
                                    <InputField
                                        label="Nama Sumber Dana"
                                        placeholder="Contoh: BCA, GoPay, Dana"
                                        value={newCategory.name}
                                        onChange={e => setNewCategory({ ...newCategory, name: e.target.value })}
                                        error={formErrors.name}
                                    />
                                    <SelectField
                                        label="Tipe"
                                        value={newCategory.type}
                                        onChange={e => setNewCategory({ ...newCategory, type: e.target.value })}
                                    >
                                        {CATEGORY_TYPES.map(t => (
                                            <option key={t.value} value={t.value}>{t.emoji} {t.label}</option>
                                        ))}
                                    </SelectField>
                                    <InputField
                                        label="Saldo Awal (opsional)"
                                        type="number"
                                        placeholder="0"
                                        value={newCategory.balance}
                                        onChange={e => setNewCategory({ ...newCategory, balance: e.target.value })}
                                        error={formErrors.balance}
                                    />
                                    <InputField
                                        label="Batas Anggaran (opsional)"
                                        type="number"
                                        placeholder="0"
                                        value={newCategory.budgetLimit}
                                        onChange={e => setNewCategory({ ...newCategory, budgetLimit: e.target.value })}
                                        error={formErrors.budgetLimit}
                                    />
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        style={{ background: "white", color: "#172619" }}
                                        className="w-full disabled:opacity-60 text-white py-3 rounded-xl font-semibold text-sm transition hover:opacity-90"
                                    >
                                        {submitting ? "Menyimpan..." : "Buat Sumber Dana"}
                                    </button>
                                </form>
                            </Modal>
                        )}

                        {/* Toast */}
                        {toast && (
                            <Toast
                                message={toast.message}
                                type={toast.type}
                                onClose={() => setToast(null)}
                            />
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}