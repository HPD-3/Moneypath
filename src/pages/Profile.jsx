import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api.js";

export default function Profile() {
    const [profile, setProfile] = useState(null);
    const [personal, setPersonal] = useState(null);
    const [error, setError] = useState(null);
    const [loadingPersonal, setLoadingPersonal] = useState(true);
    const [showEdit, setShowEdit] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showAll, setShowAll] = useState(false);
    const [balances, setBalances] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [tabungan, setTabungan] = useState([]);

    const navigate = useNavigate();

    // 🔹 Fetch Auth Profile
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await API.get("/auth/profile");
                setProfile(res.data);
            } catch (err) {
                setError(err.message);
            }
        };

        fetchProfile();
    }, []);

    // 🔹 Fetch Personal Profile
    useEffect(() => {
        if (!profile) return;

        const fetchPersonal = async () => {
            try {
                const res = await API.get("/personal/profile");
                setPersonal(res.data);
            } catch (err) {
                if (err.response?.status === 404) {
                    navigate("/personal");
                } else {
                    console.error(err);
                }
            } finally {
                setLoadingPersonal(false);
            }
        };

        fetchPersonal();
    }, [profile, navigate]);

    // 🔹 Fetch Financial Data
    useEffect(() => {
        const fetchFinancialData = async () => {
            try {
                const [balRes, txRes, tabRes] = await Promise.all([
                    API.get("/balance"),
                    API.get("/balance/transactions"),
                    API.get("/tabungan")
                ]);
                setBalances(balRes.data || []);
                setTransactions(txRes.data || []);
                setTabungan(tabRes.data || []);
            } catch (err) {
                console.error("Error fetching financial data:", err);
            }
        };

        if (profile) {
            fetchFinancialData();
        }
    }, [profile]);

    // 📊 Calculate Statistics
    const calculateStats = () => {
        const totalBalance = balances.reduce((sum, b) => sum + (b.balance || 0), 0);
        const totalTabungan = tabungan.reduce((sum, t) => sum + (t.terkumpul || 0), 0);
        const totalPemasukan = transactions
            .filter(tx => tx.type === "income")
            .reduce((sum, tx) => sum + (tx.amount || 0), 0);
        const totalPengeluaran = transactions
            .filter(tx => tx.type === "expense")
            .reduce((sum, tx) => sum + (tx.amount || 0), 0);
        const completedTabungan = tabungan.filter(t => t.isCompleted).length;

        return { totalBalance, totalTabungan, totalPemasukan, totalPengeluaran, completedTabungan };
    };

    const { totalBalance, totalTabungan, totalPemasukan, totalPengeluaran, completedTabungan } = calculateStats();

    const fmt = (n) => `Rp ${(n || 0).toLocaleString("id-ID")}`;

    // Get recent transactions
    const recentActivities = transactions.slice(0, 4).map(tx => ({
        amount: tx.amount,
        description: tx.description,
        type: tx.type
    }));

    if (error) return <div className="text-center p-5 text-red-600">Error: {error}</div>;

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-7xl mx-auto">

                {/* PROFILE HEADER CARD */}
                {profile && (
                    <div className="bg-gradient-to-r from-green-900 to-green-800 text-white rounded-3xl p-8 mb-8 flex justify-between items-center shadow-lg">
                        <div className="flex gap-6 items-center">
                            {/* Avatar */}
                            <div className="w-24 h-24 bg-gradient-to-br from-orange-300 to-orange-400 rounded-full flex-shrink-0 flex items-center justify-center text-4xl font-bold">
                                👤
                            </div>

                            <div>
                                <h2 className="text-2xl font-bold m-0">{personal?.name || "Full Name User"}</h2>
                                <p className="text-gray-200 m-0 text-base">{profile.email}</p>
                                <div className="flex items-center gap-2 mt-2">
                                    <span className="inline-block w-2 h-2 bg-green-400 rounded-full"></span>
                                    <span className="text-sm text-green-200">Level 2 - Saving & Budgeting</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3">
                            <button 
                                onClick={() => setShowEdit(true)}
                                className="px-4 py-2 rounded-full bg-green-400 text-green-900 font-semibold hover:bg-green-300 transition-all text-sm flex items-center gap-2"
                            >
                                ✏️ Edit Profil
                            </button>

                            <button 
                                onClick={() => setShowPassword(true)}
                                className="px-4 py-2 rounded-full bg-green-400 text-green-900 font-semibold hover:bg-green-300 transition-all text-sm flex items-center gap-2"
                            >
                                🔒 Ubah Password
                            </button>
                        </div>
                    </div>
                )}

                {/* THREE COLUMN LAYOUT */}
                <div className="grid grid-cols-3 gap-6">

                    {/* LEFT: INFORMASI PRIBADI */}
                    {personal && (
                        <div className="bg-white p-6 rounded-2xl shadow-md">
                            <h3 className="text-xl font-bold text-gray-900 mb-6">Informasi Pribadi</h3>
                            
                            <div className="space-y-4">
                                <div className="flex items-center gap-4 pb-4 border-b border-gray-200">
                                    <span className="text-2xl">👤</span>
                                    <div>
                                        <p className="text-xs text-gray-500 font-semibold">Nama</p>
                                        <p className="text-gray-900 font-medium">{personal.name || "-"}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 pb-4 border-b border-gray-200">
                                    <span className="text-2xl">📅</span>
                                    <div>
                                        <p className="text-xs text-gray-500 font-semibold">Tanggal Lahir</p>
                                        <p className="text-gray-900 font-medium">{personal.dateOfBirth || "-"}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 pb-4 border-b border-gray-200">
                                    <span className="text-2xl">📞</span>
                                    <div>
                                        <p className="text-xs text-gray-500 font-semibold">Nomor HP</p>
                                        <p className="text-gray-900 font-medium">{personal.phoneNumber || "-"}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 pb-4 border-b border-gray-200">
                                    <span className="text-2xl">⚥</span>
                                    <div>
                                        <p className="text-xs text-gray-500 font-semibold">Jenis Kelamin</p>
                                        <p className="text-gray-900 font-medium">{personal.gender || "-"}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <span className="text-2xl">📍</span>
                                    <div>
                                        <p className="text-xs text-gray-500 font-semibold">Alamat</p>
                                        <p className="text-gray-900 font-medium">{personal.address || "-"}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* MIDDLE: STATISTIK KEUANGAN */}
                    <div className="bg-white p-6 rounded-2xl shadow-md">
                        <h3 className="text-xl font-bold text-gray-900 mb-6">Statistik Keuangan</h3>

                        <div className="grid grid-cols-2 gap-4 mb-6">
                            {/* Total Tabungan */}
                            <div className="bg-green-900 text-white p-4 rounded-xl flex flex-col gap-2">
                                <span className="text-xs font-semibold bg-green-400 text-green-900 px-3 py-1 rounded-full w-fit">
                                    Total Tabungan
                                </span>
                                <p className="text-lg font-bold">💰 {fmt(totalTabungan)}</p>
                            </div>

                            {/* Total Pengeluaran */}
                            <div className="bg-green-900 text-white p-4 rounded-xl flex flex-col gap-2">
                                <span className="text-xs font-semibold bg-green-400 text-green-900 px-3 py-1 rounded-full w-fit">
                                    Total Pengeluaran
                                </span>
                                <p className="text-lg font-bold">📉 {fmt(totalPengeluaran)}</p>
                            </div>

                            {/* Total Pemasukan */}
                            <div className="bg-green-900 text-white p-4 rounded-xl flex flex-col gap-2">
                                <span className="text-xs font-semibold bg-green-400 text-green-900 px-3 py-1 rounded-full w-fit">
                                    Total Pemasukan
                                </span>
                                <p className="text-lg font-bold">📈 {fmt(totalPemasukan)}</p>
                            </div>

                            {/* Target Keuangan */}
                            <div className="bg-green-900 text-white p-4 rounded-xl flex flex-col gap-2">
                                <span className="text-xs font-semibold bg-green-400 text-green-900 px-3 py-1 rounded-full w-fit">
                                    Target Keuangan
                                </span>
                                <p className="text-lg font-bold">🎯 {completedTabungan} Tercapai</p>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div>
                            <div className="h-2 bg-gray-300 rounded-full overflow-hidden mb-2">
                                <div 
                                    className="h-full bg-gradient-to-r from-green-900 to-green-400 transition-all duration-500"
                                    style={{ width: totalBalance > 0 ? `${Math.min((totalBalance / (totalPemasukan || 1)) * 100, 100)}%` : "0%" }}
                                ></div>
                            </div>
                            <p className="text-xs text-gray-600 font-medium">
                                {fmt(totalBalance)} - {fmt(totalPemasukan)}
                            </p>
                        </div>
                    </div>

                    {/* RIGHT: AKTIVITAS TERAKHIR */}
                    <div className="bg-white p-6 rounded-2xl shadow-md">
                        <h3 className="text-xl font-bold text-gray-900 mb-6">Aktivitas Terakhir</h3>

                        <div className="space-y-3 mb-4">
                            {(showAll ? transactions : transactions.slice(0, 4)).map((tx, i) => (
                                <div key={i} className="pb-3 border-b border-gray-200 last:border-b-0">
                                    <p className="text-sm text-gray-900 font-medium">
                                        {fmt(tx.amount)} - {tx.description?.substring(0, 20)}...
                                    </p>
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={() => setShowAll(!showAll)}
                            className="text-green-700 font-semibold text-sm hover:text-green-900 transition-all"
                        >
                            {showAll ? "Tutup" : "Lihat Semua >"}
                        </button>
                    </div>

                </div>
            </div>

            {/* MODAL EDIT PROFIL */}
            {showEdit && (
                <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 backdrop-blur-sm">
                    <div className="bg-white p-8 rounded-2xl w-full max-w-sm shadow-2xl">
                        <h3 className="text-lg font-bold text-green-900 mb-5">Edit Profil</h3>
                        <input 
                            type="text" 
                            placeholder={personal?.name || "Nama Baru"}
                            className="w-full p-3 border border-gray-300 rounded-lg mb-3 text-sm focus:outline-none focus:border-green-300 focus:ring-4 focus:ring-green-100"
                        />
                        <input 
                            type="email" 
                            placeholder={profile?.email || "Email Baru"}
                            className="w-full p-3 border border-gray-300 rounded-lg mb-5 text-sm focus:outline-none focus:border-green-300 focus:ring-4 focus:ring-green-100"
                        />
                        <button 
                            onClick={() => setShowEdit(false)}
                            className="w-full p-3 bg-green-900 text-green-300 font-semibold rounded-lg hover:bg-green-800 transition-all"
                        >
                            Simpan
                        </button>
                    </div>
                </div>
            )}

            {/* MODAL PASSWORD */}
            {showPassword && (
                <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 backdrop-blur-sm">
                    <div className="bg-white p-8 rounded-2xl w-full max-w-sm shadow-2xl">
                        <h3 className="text-lg font-bold text-green-900 mb-5">Ubah Password</h3>
                        <input 
                            type="password" 
                            placeholder="Password Lama"
                            className="w-full p-3 border border-gray-300 rounded-lg mb-3 text-sm focus:outline-none focus:border-green-300 focus:ring-4 focus:ring-green-100"
                        />
                        <input 
                            type="password" 
                            placeholder="Password Baru"
                            className="w-full p-3 border border-gray-300 rounded-lg mb-5 text-sm focus:outline-none focus:border-green-300 focus:ring-4 focus:ring-green-100"
                        />
                        <button 
                            onClick={() => setShowPassword(false)}
                            className="w-full p-3 bg-green-900 text-green-300 font-semibold rounded-lg hover:bg-green-800 transition-all"
                        >
                            Simpan
                        </button>
                    </div>
                </div>
            )}

        </div>
    );
}