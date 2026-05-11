import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase.js";
import API from "../services/api.js";
import Sidebar from "../components/Sidebar.jsx";
import Navbar from "../components/Navbar.jsx";

export default function ProfileHistory() {
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [personal, setPersonal] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Filter states
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [filterType, setFilterType] = useState("all"); // all, income, expense
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

    // UI states
    const [activeNav, setActiveNav] = useState("profil");
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    const MONTHS = [
        { value: 1, label: "Januari" },
        { value: 2, label: "Februari" },
        { value: 3, label: "Maret" },
        { value: 4, label: "April" },
        { value: 5, label: "Mei" },
        { value: 6, label: "Juni" },
        { value: 7, label: "Juli" },
        { value: 8, label: "Agustus" },
        { value: 9, label: "September" },
        { value: 10, label: "Oktober" },
        { value: 11, label: "November" },
        { value: 12, label: "Desember" }
    ];

    const fmt = (num) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(num);

    // Fetch data
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [profileRes, personalRes] = await Promise.all([
                    API.get("/auth/profile"),
                    API.get("/personal/profile")
                ]);
                setProfile(profileRes.data);
                setPersonal(personalRes.data);
            } catch (err) {
                setError(err.message);
            }
        };
        fetchData();
    }, []);

    // Fetch history and stats
    useEffect(() => {
        const fetchHistory = async () => {
            try {
                setLoading(true);
                setError(null);

                const queryParams = {
                    month: selectedMonth,
                    year: selectedYear,
                    page: currentPage,
                    limit: itemsPerPage
                };

                if (filterType !== "all") {
                    queryParams.type = filterType;
                }

                const historyRes = await API.get("/history", { params: queryParams });

                console.log("History response:", historyRes.data);

                setTransactions(historyRes.data.transactions || []);
                setStats(historyRes.data.summary);
            } catch (err) {
                console.error("Error fetching history:", err);
                setError(err.response?.data?.error || err.message);
                setTransactions([]);
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, [selectedMonth, selectedYear, filterType, currentPage]);

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

    if (loading && transactions.length === 0) {
        return (
            <div className="flex h-screen bg-gray-100">
                <Sidebar
                    active={activeNav}
                    setActive={handleNavigation}
                    handleLogout={handleLogout}
                    isOpen={isSidebarOpen}
                    setOpen={setIsSidebarOpen}
                />
                <div className="flex-1 overflow-auto">
                    <Navbar
                        profile={profile}
                        personal={personal}
                        isSidebarOpen={isSidebarOpen}
                        setSidebarOpen={setIsSidebarOpen}
                    />
                    <div className="p-6 max-w-7xl mx-auto">
                        <div className="text-center py-12">
                            <p className="text-gray-500">Memuat...</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-gray-100">
            <Sidebar
                active={activeNav}
                setActive={handleNavigation}
                handleLogout={handleLogout}
                isOpen={isSidebarOpen}
                setOpen={setIsSidebarOpen}
            />
            <div className="flex-1 overflow-auto">
                <Navbar
                    profile={profile}
                    personal={personal}
                    isSidebarOpen={isSidebarOpen}
                    setSidebarOpen={setIsSidebarOpen}
                />

                <div className="p-3 sm:p-6 max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="mb-8">
                        <button
                            onClick={() => navigate("/profile")}
                            className="text-sm text-blue-600 hover:text-blue-800 mb-4 flex items-center gap-1"
                        >
                            ← Kembali ke Profil
                        </button>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">📜 Riwayat Transaksi</h1>
                        <p className="text-gray-600 text-sm">Lihat semua riwayat transaksi keuangan Anda</p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg border border-red-300">
                            {error}
                        </div>
                    )}

                    {/* Stats Cards */}
                    {stats && (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                            <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
                                <p className="text-xs text-gray-600 font-semibold">Pemasukan</p>
                                <p className="text-lg sm:text-xl font-bold text-green-600">
                                    {fmt(stats.totalIncome || 0)}
                                </p>
                            </div>
                            <div className="bg-white rounded-lg shadow p-4 border-l-4 border-red-500">
                                <p className="text-xs text-gray-600 font-semibold">Pengeluaran</p>
                                <p className="text-lg sm:text-xl font-bold text-red-600">
                                    {fmt(stats.totalExpense || 0)}
                                </p>
                            </div>
                            <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
                                <p className="text-xs text-gray-600 font-semibold">Saldo Bersih</p>
                                <p className={`text-lg sm:text-xl font-bold ${stats.netBalance >= 0 ? "text-blue-600" : "text-red-600"}`}>
                                    {fmt(stats.netBalance || 0)}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Filters */}
                    <div className="bg-white rounded-lg shadow p-4 mb-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                                <label className="text-sm font-semibold text-gray-700 block mb-2">Bulan</label>
                                <select
                                    value={selectedMonth}
                                    onChange={(e) => {
                                        setSelectedMonth(Number(e.target.value));
                                        setCurrentPage(1);
                                    }}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                >
                                    {MONTHS.map(m => (
                                        <option key={m.value} value={m.value}>{m.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-sm font-semibold text-gray-700 block mb-2">Tahun</label>
                                <select
                                    value={selectedYear}
                                    onChange={(e) => {
                                        setSelectedYear(Number(e.target.value));
                                        setCurrentPage(1);
                                    }}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                >
                                    {[...Array(5)].map((_, i) => {
                                        const year = new Date().getFullYear() - i;
                                        return <option key={year} value={year}>{year}</option>;
                                    })}
                                </select>
                            </div>
                            <div>
                                <label className="text-sm font-semibold text-gray-700 block mb-2">Tipe</label>
                                <select
                                    value={filterType}
                                    onChange={(e) => {
                                        setFilterType(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                >
                                    <option value="all">Semua</option>
                                    <option value="income">Pemasukan</option>
                                    <option value="expense">Pengeluaran</option>
                                </select>
                            </div>
                            <div className="flex items-end">
                                <button
                                    onClick={() => {
                                        setCurrentPage(1);
                                        setFilterType("all");
                                    }}
                                    className="w-full px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-semibold transition"
                                >
                                    Reset
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Transactions Table */}
                    <div className="bg-white rounded-lg shadow overflow-x-auto">
                        {transactions.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                                <p className="text-sm">Belum ada transaksi untuk periode ini</p>
                            </div>
                        ) : (
                            <>
                                <table className="w-full min-w-[600px] text-sm">
                                    <thead>
                                        <tr className="bg-gray-50 border-b">
                                            <th className="px-3 sm:px-6 py-3 text-left font-semibold text-gray-700">Tanggal</th>
                                            <th className="px-3 sm:px-6 py-3 text-left font-semibold text-gray-700">Deskripsi</th>
                                            <th className="px-3 sm:px-6 py-3 text-left font-semibold text-gray-700 hidden sm:table-cell">Kategori</th>
                                            <th className="px-3 sm:px-6 py-3 text-left font-semibold text-gray-700">Tipe</th>
                                            <th className="px-3 sm:px-6 py-3 text-right font-semibold text-gray-700">Jumlah</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {transactions.map((tx, i) => (
                                            <tr key={tx.id} className={`border-b ${i % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-gray-100 transition`}>
                                                <td className="px-3 sm:px-6 py-3 text-gray-700 text-xs sm:text-sm">
                                                    {tx.date ? new Date(tx.date).toLocaleDateString("id-ID") : "-"}
                                                </td>
                                                <td className="px-3 sm:px-6 py-3 text-gray-700 text-xs sm:text-sm">
                                                    {tx.description || "-"}
                                                </td>
                                                <td className="px-3 sm:px-6 py-3 text-gray-600 text-xs hidden sm:table-cell">
                                                    {tx.balanceName || "-"}
                                                </td>
                                                <td className="px-3 sm:px-6 py-3 text-xs sm:text-sm">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                                        tx.type === "income"
                                                            ? "bg-green-100 text-green-800"
                                                            : "bg-red-100 text-red-800"
                                                    }`}>
                                                        {tx.type === "income" ? "Pemasukan" : "Pengeluaran"}
                                                    </span>
                                                </td>
                                                <td className={`px-3 sm:px-6 py-3 text-right font-medium text-xs sm:text-sm ${
                                                    tx.type === "income" ? "text-green-600" : "text-red-600"
                                                }`}>
                                                    {tx.type === "income" ? "+" : "-"}{fmt(tx.amount || 0)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                {/* Pagination */}
                                <div className="px-3 sm:px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                                    <p className="text-xs sm:text-sm text-gray-600">
                                        Menampilkan {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, transactions.length)} dari {transactions.length} transaksi
                                    </p>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                            disabled={currentPage === 1}
                                            className="px-3 py-2 border border-gray-300 rounded-lg text-xs sm:text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            ← Sebelumnya
                                        </button>
                                        <span className="px-3 py-2 text-xs sm:text-sm text-gray-600">
                                            Hal {currentPage}
                                        </span>
                                        <button
                                            onClick={() => setCurrentPage(prev => prev + 1)}
                                            disabled={transactions.length < itemsPerPage}
                                            className="px-3 py-2 border border-gray-300 rounded-lg text-xs sm:text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Berikutnya →
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
