import { useEffect, useState, useCallback } from "react";
import API from "../services/api";
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
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

const CATEGORY_TYPES = [
    { value: "cash",       label: "Cash",       emoji: "💵" },
    { value: "bank",       label: "Bank",       emoji: "🏦" },
    { value: "ewallet",    label: "E-Wallet",   emoji: "📱" },
    { value: "savings",    label: "Savings",    emoji: "🐷" },
    { value: "investment", label: "Investment", emoji: "📈" },
    { value: "income",     label: "Income",     emoji: "💰" },
    { value: "expenses",   label: "Expenses",   emoji: "🧾" },
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
            <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md shadow-2xl">
                <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100 dark:border-gray-800">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xl leading-none"
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
                className={`w-full rounded-xl border px-3 py-2.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 transition
                    ${error
                        ? "border-red-400 focus:ring-red-200 dark:focus:ring-red-900"
                        : "border-gray-200 dark:border-gray-700 focus:ring-emerald-200 dark:focus:ring-emerald-900 focus:border-emerald-400"
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
                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 px-3 py-2.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-emerald-200 dark:focus:ring-emerald-900 focus:border-emerald-400 transition"
            >
                {children}
            </select>
        </div>
    );
}

export default function Balance() {
    const [balances, setBalances]         = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [summary, setSummary]           = useState(null);
    const [loading, setLoading]           = useState(true);
    const [activeTab, setActiveTab]       = useState("overview");
    const [selectedMonth, setSelectedMonth] = useState(currentMonth());
    const [selectedBalanceFilter, setSelectedBalanceFilter] = useState("all");
    const [toast, setToast]               = useState(null);

    // Modals
    const [showAddCategory, setShowAddCategory] = useState(false);
    const [showAddTx, setShowAddTx]             = useState(false);
    const [editLimitId, setEditLimitId]         = useState(null);

    // Forms
    const [newCategory, setNewCategory] = useState({ name: "", type: "cash", balance: "", budgetLimit: "" });
    const [txForm, setTxForm]           = useState({ balanceId: "", amount: "", type: "expense", description: "" });
    const [limitValue, setLimitValue]   = useState("");
    const [formErrors, setFormErrors]   = useState({});
    const [submitting, setSubmitting]   = useState(false);

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
        <div className="max-w-2xl mx-auto px-4 py-6 pb-24">

            {/* Header */}
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 mb-6 text-white shadow-lg">
                <p className="text-emerald-100 text-sm mb-1">Total Saldo</p>
                <h1 className="text-3xl font-bold tracking-tight">{formatRp(totalBalance)}</h1>
                {summary && (
                    <div className="flex gap-4 mt-4 pt-4 border-t border-white/20">
                        <div>
                            <p className="text-emerald-100 text-xs">Pemasukan bulan ini</p>
                            <p className="font-semibold">+{formatRp(summary.totalIncome)}</p>
                        </div>
                        <div>
                            <p className="text-emerald-100 text-xs">Pengeluaran bulan ini</p>
                            <p className="font-semibold">-{formatRp(summary.totalExpense)}</p>
                        </div>
                        <div>
                            <p className="text-emerald-100 text-xs">Net</p>
                            <p className={`font-semibold ${summary.net >= 0 ? "text-white" : "text-red-200"}`}>
                                {summary.net >= 0 ? "+" : ""}{formatRp(summary.net)}
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Month picker */}
            <div className="flex items-center gap-3 mb-5">
                <label className="text-sm text-gray-500 whitespace-nowrap">Bulan:</label>
                <select
                    value={selectedMonth}
                    onChange={e => setSelectedMonth(e.target.value)}
                    className="text-sm border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-1.5 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 outline-none focus:ring-2 focus:ring-emerald-200"
                >
                    {MONTHS.map(m => (
                        <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                </select>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 mb-6">
                {["overview", "history", "rekap"].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                            activeTab === tab
                                ? "bg-white dark:bg-gray-700 text-emerald-600 dark:text-emerald-400 shadow-sm"
                                : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                        }`}
                    >
                        {tab === "overview" ? "Ringkasan" : tab === "history" ? "Riwayat" : "Rekap"}
                    </button>
                ))}
            </div>

            {/* ── OVERVIEW ── */}
            {activeTab === "overview" && (
                <div>
                    {balances.length === 0 ? (
                        <div className="text-center py-16 text-gray-400">
                            <div className="text-5xl mb-3">🗂</div>
                            <p className="font-medium text-gray-600 dark:text-gray-300 mb-1">Belum ada kategori</p>
                            <p className="text-sm">Tambahkan kategori untuk mulai mencatat saldo</p>
                        </div>
                    ) : (
                        <div className="space-y-3 mb-5">
                            {balances.map(b => {
                                const typeInfo = CATEGORY_TYPES.find(t => t.value === b.type);
                                const isEditingLimit = editLimitId === b.id;

                                return (
                                    <div
                                        key={b.id}
                                        className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 shadow-sm"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className="text-2xl">{typeInfo?.emoji}</span>
                                                <div>
                                                    <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{b.name}</p>
                                                    <p className="text-xs text-gray-400 capitalize">{typeInfo?.label}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-gray-900 dark:text-gray-100">{formatRp(b.balance)}</p>
                                                <button
                                                    onClick={() => handleDeleteCategory(b.id)}
                                                    className="text-xs text-red-400 hover:text-red-600 mt-0.5"
                                                >
                                                    Hapus
                                                </button>
                                            </div>
                                        </div>

                                        {/* Budget bar — uses totalSpent, not balance */}
                                        <BudgetBar spent={b.totalSpent || 0} limit={b.budgetLimit} />

                                        {/* Edit limit inline */}
                                        {isEditingLimit ? (
                                            <div className="flex gap-2 mt-3">
                                                <input
                                                    type="number"
                                                    placeholder="Batas anggaran"
                                                    value={limitValue}
                                                    onChange={e => setLimitValue(e.target.value)}
                                                    className="flex-1 text-sm border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-1.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-emerald-200"
                                                />
                                                <button
                                                    onClick={() => handleUpdateLimit(b.id)}
                                                    className="text-sm bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-xl font-medium transition"
                                                >
                                                    Simpan
                                                </button>
                                                <button
                                                    onClick={() => { setEditLimitId(null); setLimitValue(""); }}
                                                    className="text-sm text-gray-500 hover:text-gray-700 px-2"
                                                >
                                                    Batal
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => { setEditLimitId(b.id); setLimitValue(b.budgetLimit || ""); }}
                                                className="mt-3 text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                                            >
                                                {b.budgetLimit > 0 ? "Ubah batas anggaran" : "+ Atur batas anggaran"}
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex gap-3">
                        <button
                            onClick={() => { setShowAddTx(true); setFormErrors({}); }}
                            className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-2xl font-semibold text-sm transition shadow-sm"
                        >
                            + Transaksi
                        </button>
                        <button
                            onClick={() => { setShowAddCategory(true); setFormErrors({}); }}
                            className="flex-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:border-emerald-400 py-3 rounded-2xl font-semibold text-sm transition"
                        >
                            + Sumber Dana
                        </button>
                    </div>
                </div>
            )}

            {/* ── HISTORY ── */}
            {activeTab === "history" && (
                <div>
                    {/* Filter by Balance Category */}
                    <div className="mb-4 pb-4 border-b border-gray-100 dark:border-gray-800">
                        <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-3 uppercase tracking-wide">Filter Sumber Dana</p>
                        <div className="flex gap-2 overflow-x-auto pb-2">
                            <button
                                onClick={() => setSelectedBalanceFilter("all")}
                                className={`px-4 py-2 rounded-xl whitespace-nowrap font-medium text-sm transition ${
                                    selectedBalanceFilter === "all"
                                        ? "bg-emerald-500 text-white"
                                        : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                                }`}
                            >
                                Semua
                            </button>
                            {balances.map(balance => (
                                <button
                                    key={balance.id}
                                    onClick={() => setSelectedBalanceFilter(balance.id)}
                                    className={`px-4 py-2 rounded-xl whitespace-nowrap font-medium text-sm transition ${
                                        selectedBalanceFilter === balance.id
                                            ? "bg-emerald-500 text-white"
                                            : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                                    }`}
                                >
                                    {balance.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Transactions List */}
                    {(() => {
                        const filteredTx = selectedBalanceFilter === "all" 
                            ? transactions 
                            : transactions.filter(tx => tx.balanceId === selectedBalanceFilter);

                        return filteredTx.length === 0 ? (
                            <div className="text-center py-16 text-gray-400">
                                <div className="text-5xl mb-3">📭</div>
                                <p className="font-medium text-gray-600 dark:text-gray-300 mb-1">Belum ada transaksi</p>
                                <p className="text-sm">Transaksi yang kamu catat akan muncul di sini</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {filteredTx.map(tx => (
                                    <div
                                        key={tx.id}
                                        className="flex items-center justify-between bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl px-4 py-3 shadow-sm group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg
                                                ${tx.type === "income" ? "bg-emerald-50 dark:bg-emerald-900/30" : "bg-red-50 dark:bg-red-900/30"}`}>
                                                {tx.type === "income" ? "💰" : "💸"}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 leading-tight">{tx.description}</p>
                                                <p className="text-xs text-gray-400">
                                                    {tx.balanceName} · {new Date(tx.date).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className={`font-bold text-sm ${tx.type === "income" ? "text-emerald-600" : "text-red-500"}`}>
                                                {tx.type === "income" ? "+" : "-"}{formatRp(tx.amount)}
                                            </span>
                                            <button
                                                onClick={() => handleDeleteTx(tx)}
                                                className="text-gray-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition text-lg leading-none"
                                                title="Hapus"
                                            >×</button>
                                        </div>
                                    </div>
                                ))}
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
                        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
                            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Pengeluaran per Kategori</h3>
                            {(() => {
                                const categorySpending = balances.map(b => ({
                                    name: b.name,
                                    spent: b.totalSpent || 0,
                                    color: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'][balances.indexOf(b) % 7]
                                })).filter(c => c.spent > 0);

                                if (categorySpending.length === 0) {
                                    return (
                                        <div className="text-center py-8 text-gray-400">
                                            <div className="text-3xl mb-2">📊</div>
                                            <p className="text-sm">Belum ada data pengeluaran</p>
                                        </div>
                                    );
                                }

                                const pieData = {
                                    labels: categorySpending.map(c => c.name),
                                    datasets: [{
                                        data: categorySpending.map(c => c.spent),
                                        backgroundColor: categorySpending.map(c => c.color),
                                        borderColor: 'rgba(255, 255, 255, 0.1)',
                                        borderWidth: 2
                                    }]
                                };

                                return (
                                    <Pie 
                                        data={pieData}
                                        options={{
                                            responsive: true,
                                            maintainAspectRatio: true,
                                            plugins: {
                                                legend: {
                                                    position: 'bottom',
                                                    labels: {
                                                        color: document.documentElement.classList.contains('dark') ? '#d1d5db' : '#374151',
                                                        padding: 15,
                                                        font: { size: 12 }
                                                    }
                                                },
                                                tooltip: {
                                                    callbacks: {
                                                        label: function(context) {
                                                            const label = context.label || '';
                                                            const value = formatRp(context.parsed);
                                                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                                            const percentage = ((context.parsed / total) * 100).toFixed(1);
                                                            return `${label}: ${value} (${percentage}%)`;
                                                        }
                                                    }
                                                }
                                            }
                                        }}
                                    />
                                );
                            })()}
                        </div>

                        {/* Bar Chart - Category Spending */}
                        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
                            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Rincian Pengeluaran</h3>
                            {(() => {
                                const categorySpending = balances.map(b => ({
                                    name: b.name,
                                    spent: b.totalSpent || 0,
                                    color: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'][balances.indexOf(b) % 7]
                                })).filter(c => c.spent > 0).sort((a, b) => b.spent - a.spent);

                                if (categorySpending.length === 0) {
                                    return (
                                        <div className="text-center py-8 text-gray-400">
                                            <div className="text-3xl mb-2">📊</div>
                                            <p className="text-sm">Belum ada data pengeluaran</p>
                                        </div>
                                    );
                                }

                                const barData = {
                                    labels: categorySpending.map(c => c.name),
                                    datasets: [{
                                        label: 'Pengeluaran',
                                        data: categorySpending.map(c => c.spent),
                                        backgroundColor: categorySpending.map(c => c.color),
                                        borderRadius: 8,
                                        borderSkipped: false
                                    }]
                                };

                                return (
                                    <Bar 
                                        data={barData}
                                        options={{
                                            indexAxis: 'y',
                                            responsive: true,
                                            maintainAspectRatio: true,
                                            plugins: {
                                                legend: {
                                                    display: false
                                                },
                                                tooltip: {
                                                    callbacks: {
                                                        label: function(context) {
                                                            return formatRp(context.parsed.x);
                                                        }
                                                    }
                                                }
                                            },
                                            scales: {
                                                x: {
                                                    ticks: {
                                                        color: document.documentElement.classList.contains('dark') ? '#d1d5db' : '#374151'
                                                    },
                                                    grid: {
                                                        color: document.documentElement.classList.contains('dark') ? 'rgba(107, 114, 128, 0.1)' : 'rgba(209, 213, 219, 0.5)'
                                                    }
                                                },
                                                y: {
                                                    ticks: {
                                                        color: document.documentElement.classList.contains('dark') ? '#d1d5db' : '#374151'
                                                    },
                                                    grid: {
                                                        display: false
                                                    }
                                                }
                                            }
                                        }}
                                    />
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
                                { label: 'Pemasukan', value: totalIncome, color: 'bg-emerald-50 dark:bg-emerald-900/30', textColor: 'text-emerald-600 dark:text-emerald-400' },
                                { label: 'Pengeluaran', value: totalExpense, color: 'bg-red-50 dark:bg-red-900/30', textColor: 'text-red-600 dark:text-red-400' },
                                { label: 'Arus Bersih', value: netFlow, color: netFlow >= 0 ? 'bg-blue-50 dark:bg-blue-900/30' : 'bg-orange-50 dark:bg-orange-900/30', textColor: netFlow >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-orange-600 dark:text-orange-400' },
                                { label: 'Total Saldo', value: balances.reduce((sum, b) => sum + (b.balance || 0), 0), color: 'bg-purple-50 dark:bg-purple-900/30', textColor: 'text-purple-600 dark:text-purple-400' }
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
                            <option value="income">💰 Pemasukan</option>
                            <option value="expense">💸 Pengeluaran</option>
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
                            className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white py-3 rounded-xl font-semibold text-sm transition"
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
                            className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white py-3 rounded-xl font-semibold text-sm transition"
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
    );
}