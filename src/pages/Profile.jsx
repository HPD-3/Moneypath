import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase.js";
import API from "../services/api.js";
import Sidebar from "../components/Sidebar.jsx";
import Navbar from "../components/Navbar.jsx";

export default function Profile() {
    const navigate = useNavigate();
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
    
    // New state for sidebar and navbar
    const [activeNav, setActiveNav] = useState("profil");
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
        <div className="flex h-screen bg-gray-50 font-sans overflow-hidden">
            <Sidebar active={activeNav} setActive={(navId) => { setActiveNav(navId); handleNavigation(navId); }} handleLogout={handleLogout} isOpen={isSidebarOpen} setOpen={setIsSidebarOpen} />
            
            <div className="flex-1 flex flex-col overflow-hidden w-full">
                <Navbar profile={profile} personal={personal} isOpen={isProfileOpen} setOpen={setIsProfileOpen} isSidebarOpen={isSidebarOpen} setSidebarOpen={setIsSidebarOpen} />
                
                <div className="flex-1 overflow-y-auto">
                    <div className="min-h-screen bg-gray-50 p-4 md:p-8 pt-20 md:pt-8">
                        <div className="max-w-7xl mx-auto">

                {/* PROFILE HEADER CARD */}
                {profile && (
                    <div className="bg-gradient-to-r from-green-900 to-green-800 text-white rounded-3xl p-4 md:p-8 mb-8 flex flex-col md:flex-row md:justify-between md:items-center gap-4 shadow-lg">
                        <div className="flex gap-4 md:gap-6 items-center flex-col sm:flex-row">
                            {/* Avatar */}
                            <div className="w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-orange-300 to-orange-400 rounded-full flex-shrink-0 flex items-center justify-center text-3xl md:text-4xl font-bold">
                                <iconify-icon icon="mdi:account" className="text-3xl md:text-4xl"></iconify-icon>
                            </div>

                            <div className="text-center sm:text-left">
                                <h2 className="text-xl md:text-2xl font-bold m-0">{personal?.name || "Full Name User"}</h2>
                                <p className="text-gray-200 m-0 text-sm md:text-base">{profile.email}</p>
                                <div className="flex items-center gap-2 mt-2 justify-center sm:justify-start">
                                    <span className="inline-block w-2 h-2 bg-green-400 rounded-full"></span>
                                    <span className="text-xs md:text-sm text-green-200">Level 2 - Saving & Budgeting</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-row md:flex-col gap-2 md:gap-3 w-full sm:w-auto">
                            <button 
                                onClick={() => setShowEdit(true)}
                                className="flex-1 md:flex-none px-3 md:px-4 py-2 rounded-full bg-green-400 text-green-900 font-semibold hover:bg-green-300 transition-all text-xs md:text-sm flex items-center gap-2 justify-center"
                            >
                                <iconify-icon icon="mdi:pencil"></iconify-icon> Edit Profil
                            </button>

                            <button 
                                onClick={() => setShowPassword(true)}
                                className="flex-1 md:flex-none px-3 md:px-4 py-2 rounded-full bg-green-400 text-green-900 font-semibold hover:bg-green-300 transition-all text-xs md:text-sm flex items-center gap-2 justify-center"
                            >
                                <iconify-icon icon="mdi:lock"></iconify-icon> Ubah Password
                            </button>
                        </div>
                    </div>
                )}

                {/* THREE COLUMN LAYOUT */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">

                    {/* LEFT: INFORMASI PRIBADI */}
                    {personal && (
                        <div className="bg-white p-6 rounded-2xl shadow-md">
                            <h3 className="text-xl font-bold text-gray-900 mb-6">Informasi Pribadi</h3>
                            
                            <div className="space-y-4">
                                <div className="flex items-center gap-4 pb-4 border-b border-gray-200">
                                    <iconify-icon icon="mdi:account" className="text-2xl"></iconify-icon>
                                    <div>
                                        <p className="text-xs text-gray-500 font-semibold">Nama</p>
                                        <p className="text-gray-900 font-medium">{personal.name || "-"}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 pb-4 border-b border-gray-200">
                                    <iconify-icon icon="mdi:calendar" className="text-2xl"></iconify-icon>
                                    <div>
                                        <p className="text-xs text-gray-500 font-semibold">Tanggal Lahir</p>
                                        <p className="text-gray-900 font-medium">{personal.dateOfBirth || "-"}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 pb-4 border-b border-gray-200">
                                    <iconify-icon icon="mdi:phone" className="text-2xl"></iconify-icon>
                                    <div>
                                        <p className="text-xs text-gray-500 font-semibold">Nomor HP</p>
                                        <p className="text-gray-900 font-medium">{personal.phoneNumber || "-"}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 pb-4 border-b border-gray-200">
                                    <iconify-icon icon="mdi:gender-female" className="text-2xl"></iconify-icon>
                                    <div>
                                        <p className="text-xs text-gray-500 font-semibold">Jenis Kelamin</p>
                                        <p className="text-gray-900 font-medium">{personal.gender || "-"}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <iconify-icon icon="mdi:map-marker" className="text-2xl"></iconify-icon>
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
                                <p className="text-lg font-bold"><iconify-icon icon="mdi:wallet" style={{ marginRight: "6px" }}></iconify-icon>{fmt(totalTabungan)}</p>
                            </div>

                            {/* Total Pengeluaran */}
                            <div className="bg-green-900 text-white p-4 rounded-xl flex flex-col gap-2">
                                <span className="text-xs font-semibold bg-green-400 text-green-900 px-3 py-1 rounded-full w-fit">
                                    Total Pengeluaran
                                </span>
                                <p className="text-lg font-bold"><iconify-icon icon="mdi:trending-down" style={{ marginRight: "6px" }}></iconify-icon>{fmt(totalPengeluaran)}</p>
                            </div>

                            {/* Total Pemasukan */}
                            <div className="bg-green-900 text-white p-4 rounded-xl flex flex-col gap-2">
                                <span className="text-xs font-semibold bg-green-400 text-green-900 px-3 py-1 rounded-full w-fit">
                                    Total Pemasukan
                                </span>
                                <p className="text-lg font-bold"><iconify-icon icon="mdi:trending-up" style={{ marginRight: "6px" }}></iconify-icon>{fmt(totalPemasukan)}</p>
                            </div>

                            {/* Target Keuangan */}
                            <div className="bg-green-900 text-white p-4 rounded-xl flex flex-col gap-2">
                                <span className="text-xs font-semibold bg-green-400 text-green-900 px-3 py-1 rounded-full w-fit">
                                    Target Keuangan
                                </span>
                                <p className="text-lg font-bold"><iconify-icon icon="mdi:target" style={{ marginRight: "6px" }}></iconify-icon>{completedTabungan} Tercapai</p>
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

                        <div className="overflow-y-auto max-h-96">
                            <table className="w-full text-sm">
                                <thead className="sticky top-0 bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="text-left font-semibold text-gray-700 py-3 px-4">Deskripsi</th>
                                        <th className="text-right font-semibold text-gray-700 py-3 px-4">Jumlah</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(showAll ? transactions : transactions.slice(0, 4)).map((tx, i) => (
                                        <tr key={i} className="border-b border-gray-100 hover:bg-gray-50 transition">
                                            <td className="py-3 px-4 text-gray-700">{tx.description || "-"}</td>
                                            <td className={`py-3 px-4 text-right font-medium ${tx.type === "income" ? "text-green-600" : "text-red-600"}`}>
                                                {tx.type === "income" ? "+" : "-"}{fmt(tx.amount)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <button
                            onClick={() => setShowAll(!showAll)}
                            className="text-green-700 font-semibold text-sm hover:text-green-900 transition-all mt-4 inline-block"
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
                </div>
            </div>
        </div>
    );
}