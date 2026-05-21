import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase.js";
import API from "../services/api.js";
import Sidebar from "../components/Sidebar.jsx";
import Navbar from "../components/Navbar.jsx";
import { ReviewForm } from "../components/ReviewForm.jsx";
import BadgeIllustration from "../components/BadgeIllustration.jsx";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { auth as firebaseAuth } from "../firebase.js";

// Custom Hook untuk Intersection Observer
const useIntersectionObserver = (ref) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                setIsVisible(true);
                observer.unobserve(entry.target);
            }
        }, { threshold: 0.1 });

        if (ref.current) {
            observer.observe(ref.current);
        }

        return () => {
            if (ref.current) {
                observer.unobserve(ref.current);
            }
        };
    }, [ref]);

    return isVisible;
};

export default function Profile() {
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [quizStats, setQuizStats] = useState(null);
    const [personal, setPersonal] = useState(null);
    const [error, setError] = useState(null);
    const [showEdit, setShowEdit] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [balances, setBalances] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [tabungan, setTabungan] = useState([]);
    const [badgeSettings, setBadgeSettings] = useState(null);

    // Refs untuk Intersection Observer
    const personalInfoRef = useRef(null);
    const financialStatsRef = useRef(null);
    const activityRef = useRef(null);

    // Lazy load sections
    const personalInfoVisible = useIntersectionObserver(personalInfoRef);
    const financialStatsVisible = useIntersectionObserver(financialStatsRef);
    const activityVisible = useIntersectionObserver(activityRef);

    // Loading states untuk financial data
    const [financialLoading, setFinancialLoading] = useState(false);
    const [personalLoading, setPersonalLoading] = useState(false);

    // New state for sidebar and navbar
    const [activeNav, setActiveNav] = useState("profil");
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Password form state
    const [passwordForm, setPasswordForm] = useState({
        oldPassword: "",
        newPassword: "",
        confirmPassword: ""
    });
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [passwordMessage, setPasswordMessage] = useState("");
    const [passwordError, setPasswordError] = useState("");

    // Review submission state
    const [reviewLoading, setReviewLoading] = useState(false);
    const [reviewMessage, setReviewMessage] = useState("");
    const [reviewError, setReviewError] = useState("");
    const [showReviewModal, setShowReviewModal] = useState(false);

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

    // Profile editing moved to UserSetting.jsx - no longer needed here
    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPasswordForm((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        setPasswordLoading(true);
        setPasswordError("");
        setPasswordMessage("");

        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            setPasswordError("Password baru dan konfirmasi password tidak cocok");
            setPasswordLoading(false);
            return;
        }

        if (passwordForm.newPassword.length < 6) {
            setPasswordError("Password baru minimal 6 karakter");
            setPasswordLoading(false);
            return;
        }

        try {
            await API.post("/auth/change-password", {
                oldPassword: passwordForm.oldPassword,
                newPassword: passwordForm.newPassword
            });

            setPasswordMessage("Password berhasil diubah!");
            setTimeout(() => {
                setShowPassword(false);
                setPasswordForm({
                    oldPassword: "",
                    newPassword: "",
                    confirmPassword: ""
                });
                setPasswordMessage("");
            }, 2000);
        } catch (err) {
            setPasswordError(err.response?.data?.message || "Gagal mengubah password");
        } finally {
            setPasswordLoading(false);
        }
    };

    // Handle review submission
    const handleReviewSubmit = async (reviewData) => {
        try {
            setReviewError("");
            setReviewMessage("");
            setReviewLoading(true);

            const user = auth.currentUser;
            if (!user) {
                setReviewError("Anda harus login untuk mengirim review");
                return;
            }

            // Add review to Firestore - requires admin approval
            await addDoc(collection(db, "reviews"), {
                name: reviewData.name,
                review: reviewData.review,
                rating: reviewData.rating,
                userId: user.uid,
                userEmail: user.email,
                createdAt: serverTimestamp(),
                approved: false,
                status: "pending",
            });

            setReviewMessage("✅ Review Anda berhasil dikirim! Review Anda akan ditampilkan setelah disetujui admin.");
            setTimeout(() => {
                setReviewMessage("");
            }, 3000);
        } catch (error) {
            console.error("Error submitting review:", error);
            setReviewError("❌ Gagal mengirim review. Silakan coba lagi.");
        } finally {
            setReviewLoading(false);
        }
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
                setPersonalLoading(true);
                const res = await API.get("/personal/profile");
                setPersonal(res.data);
            } catch (err) {
                if (err.response?.status === 404) {
                    navigate("/personal");
                } else {
                    console.error(err);
                }
            } finally {
                setPersonalLoading(false);
            }
        };

        fetchPersonal();
    }, [profile, navigate]);

    // 🔹 Refetch personal data when page comes into focus (after returning from Settings)
    useEffect(() => {
        const handleFocus = async () => {
            if (!profile) return;
            try {
                const res = await API.get("/personal/profile");
                setPersonal(res.data);
            } catch (err) {
                console.error("Error refetching personal data:", err);
            }
        };

        window.addEventListener("focus", handleFocus);
        return () => window.removeEventListener("focus", handleFocus);
    }, [profile]);

    // 🔹 Fetch Quiz Stats for XP
    useEffect(() => {
        if (!profile) return;

        const fetchQuizStats = async () => {
            try {
                const res = await API.get("/quiz/stats");
                setQuizStats(res.data);
            } catch (err) {
                console.error("Error fetching quiz stats:", err);
            }
        };

        fetchQuizStats();
    }, [profile]);

    // 🔹 Fetch Financial Data (Lazy load when visible)
    useEffect(() => {
        if (!profile || !financialStatsVisible) return;

        const fetchFinancialData = async () => {
            try {
                setFinancialLoading(true);
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
            } finally {
                setFinancialLoading(false);
            }
        };

        fetchFinancialData();
    }, [profile, financialStatsVisible]);

    // 🔹 Fetch active badge
    useEffect(() => {
        if (!profile) return;

        const fetchBadges = async () => {
            try {
                const res = await API.get("/settings/badges");
                setBadgeSettings(res.data);
            } catch (err) {
                console.error("Error fetching badges:", err);
            }
        };

        fetchBadges();
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

    const activeBadge = badgeSettings?.activeBadge || badgeSettings?.unlockedBadges?.[0] || "";
    const activeBadgeTitle = badgeSettings?.badgeCatalog?.find((badge) => badge.name === activeBadge)?.title || activeBadge || "No badge unlocked yet";

    const fmt = (n) => `Rp ${(n || 0).toLocaleString("id-ID")}`;

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
                                <div className="theme-hero-bg text-[var(--theme-accent-contrast)] rounded-3xl p-4 md:p-8 mb-8 flex flex-col md:flex-row md:justify-between md:items-center gap-6 shadow-lg">
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 md:gap-6 flex-1 min-w-0">
                                        {/* Avatar */}
                                        <div className="w-20 h-20 md:w-24 md:h-24 flex-shrink-0 overflow-hidden flex items-center justify-center text-3xl md:text-4xl font-bold"
                                            style={{
                                                borderRadius: "50%",
                                                background: "linear-gradient(135deg, #fb923c, #fb7185)",
                                                overflow: "hidden",
                                                border: profile?.avatarBorder === "border_gold" ? "3px solid #d4af37" : "2px solid rgba(255,255,255,0.12)",
                                                boxShadow: profile?.avatarBorder === "border_gold" ? "0 4px 18px rgba(212,175,55,0.25)" : undefined
                                            }}>
                                            {profile?.avatarUrl || firebaseAuth.currentUser?.photoURL ? (
                                                <img
                                                    src={profile.avatarUrl || firebaseAuth.currentUser.photoURL}
                                                    alt="Profile"
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <iconify-icon icon="mdi:account" className="text-3xl md:text-4xl"></iconify-icon>
                                            )}
                                        </div>

                                        <div className="text-center sm:text-left">
                                            <h2 className="text-xl md:text-2xl font-bold m-0">{personal?.name || "Full Name User"}</h2>
                                            <p className="text-gray-200 m-0 text-sm md:text-base">{profile.email}</p>
                                            <div className="flex items-center gap-2 mt-2 justify-center sm:justify-start">
                                                <span className="inline-block w-2 h-2 bg-green-400 rounded-full"></span>
                                                <span className="text-xs md:text-sm text-green-200">Total XP: {quizStats?.totalExp || 0}</span>
                                            </div>

                                            <div className="mt-4 flex items-center gap-3 rounded-2xl bg-white/10 border border-white/15 px-3 py-2 backdrop-blur-sm w-full sm:w-fit">
                                                <div className="shrink-0 rounded-2xl bg-white/10 p-2 border border-white/15">
                                                    <BadgeIllustration tone="emerald" active size={48} />
                                                </div>
                                                <div className="text-left min-w-0">
                                                    <p className="text-[11px] uppercase tracking-[0.25em] text-white/70">Current badge</p>
                                                    <p className="text-sm font-semibold text-[var(--theme-accent-contrast)] truncate">{activeBadgeTitle}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-row md:flex-col gap-2 md:gap-3 w-full sm:w-auto">
                                        <button
                                            onClick={() => navigate("/settings")}
                                            className="flex-1 md:flex-none px-3 md:px-4 py-2 rounded-full text-xs md:text-sm flex items-center gap-2 justify-center"
                                            style={{ background: "var(--theme-accent)", color: "var(--theme-accent-contrast)", fontWeight: 700 }}
                                        >
                                            <iconify-icon icon="mdi:pencil"></iconify-icon> Edit Profil
                                        </button>

                                        <button
                                            onClick={() => navigate("/settings")}
                                            className="flex-1 md:flex-none px-3 md:px-4 py-2 rounded-full text-xs md:text-sm flex items-center gap-2 justify-center"
                                            style={{ background: "var(--theme-accent)", color: "var(--theme-accent-contrast)", fontWeight: 700 }}
                                        >
                                            <iconify-icon icon="mdi:cog"></iconify-icon> Setting
                                        </button>

                                        <button
                                            onClick={() => {
                                                setReviewError("");
                                                setReviewMessage("");
                                                setShowReviewModal(true);
                                            }}
                                            className="flex-1 md:flex-none px-3 md:px-4 py-2 rounded-full text-xs md:text-sm flex items-center gap-2 justify-center"
                                            style={{ background: "var(--theme-accent)", color: "var(--theme-accent-contrast)", fontWeight: 700 }}
                                        >
                                            <iconify-icon icon="mdi:star"></iconify-icon> Bagikan Review
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* THREE COLUMN LAYOUT */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">

                                {/* LEFT: INFORMASI PRIBADI */}
                                <div ref={personalInfoRef}>
                                    {personalLoading ? (
                                        <div className="theme-card p-6 rounded-2xl shadow-md animate-pulse">
                                            <div className="h-6 bg-gray-300 rounded mb-6 w-32"></div>
                                            <div className="space-y-4">
                                                {[...Array(5)].map((_, i) => (
                                                    <div key={i} className="flex gap-4">
                                                        <div className="w-10 h-10 bg-gray-300 rounded-lg flex-shrink-0"></div>
                                                        <div className="flex-1">
                                                            <div className="h-3 bg-gray-300 rounded mb-2 w-16"></div>
                                                            <div className="h-4 bg-gray-200 rounded w-24"></div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ) : personal && (
                                        <div className="theme-card p-6 rounded-2xl shadow-md">
                                            <h3 className="text-xl font-bold text-[var(--theme-surface-text)] mb-6">Informasi Pribadi</h3>

                                            <div className="space-y-4">
                                                <div className="flex items-center gap-4 pb-4 border-b border-[var(--theme-card-border)]">
                                                    <iconify-icon icon="mdi:account" className="text-2xl"></iconify-icon>
                                                    <div>
                                                        <p className="text-xs text-[var(--theme-surface-muted)] font-semibold">Nama</p>
                                                        <p className="text-[var(--theme-surface-text)] font-medium">{personal.name || "-"}</p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-4 pb-4 border-b border-[var(--theme-card-border)]">
                                                    <iconify-icon icon="mdi:calendar" className="text-2xl"></iconify-icon>
                                                    <div>
                                                        <p className="text-xs text-[var(--theme-surface-muted)] font-semibold">Tanggal Lahir</p>
                                                        <p className="text-[var(--theme-surface-text)] font-medium">{personal.dateOfBirth || "-"}</p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-4 pb-4 border-b border-[var(--theme-card-border)]">
                                                    <iconify-icon icon="mdi:phone" className="text-2xl"></iconify-icon>
                                                    <div>
                                                        <p className="text-xs text-[var(--theme-surface-muted)] font-semibold">Nomor HP</p>
                                                        <p className="text-[var(--theme-surface-text)] font-medium">{personal.phoneNumber || "-"}</p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-4 pb-4 border-b border-[var(--theme-card-border)]">
                                                    <iconify-icon icon="mdi:gender-female" className="text-2xl"></iconify-icon>
                                                    <div>
                                                        <p className="text-xs text-[var(--theme-surface-muted)] font-semibold">Jenis Kelamin</p>
                                                        <p className="text-[var(--theme-surface-text)] font-medium">{personal.gender || "-"}</p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-4">
                                                    <iconify-icon icon="mdi:map-marker" className="text-2xl"></iconify-icon>
                                                    <div>
                                                        <p className="text-xs text-[var(--theme-surface-muted)] font-semibold">Alamat</p>
                                                        <p className="text-[var(--theme-surface-text)] font-medium">{personal.address || "-"}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* MIDDLE: STATISTIK KEUANGAN */}
                                <div ref={financialStatsRef}>
                                    {financialLoading ? (
                                        <div className="bg-white p-6 rounded-2xl shadow-md animate-pulse">
                                            <div className="h-6 bg-gray-300 rounded mb-6 w-40"></div>
                                            <div className="grid grid-cols-2 gap-4 mb-6">
                                                {[...Array(4)].map((_, i) => (
                                                    <div key={i} className="bg-gray-300 h-28 rounded-xl"></div>
                                                ))}
                                            </div>
                                            <div className="space-y-3">
                                                <div className="h-2 bg-gray-300 rounded-full"></div>
                                                <div className="h-3 bg-gray-200 rounded w-32"></div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="bg-white p-6 rounded-2xl shadow-md">
                                            <h3 className="text-xl font-bold text-gray-900 mb-6">Statistik Keuangan</h3>

                                            <div className="grid grid-cols-2 gap-4 mb-6">
                                                {/* Total Tabungan */}
                                                <div className="theme-panel text-[var(--theme-accent-contrast)] p-4 rounded-xl flex flex-col gap-2">
                                                    <span className="text-xs font-semibold bg-[var(--theme-accent)] text-[var(--theme-accent-contrast)] px-3 py-1 rounded-full w-fit">
                                                        Total Tabungan
                                                    </span>
                                                    <p className="text-lg font-bold"><iconify-icon icon="mdi:wallet" style={{ marginRight: "6px" }}></iconify-icon>{fmt(totalTabungan)}</p>
                                                </div>

                                                {/* Total Pengeluaran */}
                                                <div className="theme-panel text-[var(--theme-accent-contrast)] p-4 rounded-xl flex flex-col gap-2">
                                                    <span className="text-xs font-semibold bg-[var(--theme-accent)] text-[var(--theme-accent-contrast)] px-3 py-1 rounded-full w-fit">
                                                        Total Pengeluaran
                                                    </span>
                                                    <p className="text-lg font-bold"><iconify-icon icon="mdi:trending-down" style={{ marginRight: "6px" }}></iconify-icon>{fmt(totalPengeluaran)}</p>
                                                </div>

                                                {/* Total Pemasukan */}
                                                <div className="theme-panel text-[var(--theme-accent-contrast)] p-4 rounded-xl flex flex-col gap-2">
                                                    <span className="text-xs font-semibold bg-[var(--theme-accent)] text-[var(--theme-accent-contrast)] px-3 py-1 rounded-full w-fit">
                                                        Total Pemasukan
                                                    </span>
                                                    <p className="text-lg font-bold"><iconify-icon icon="mdi:trending-up" style={{ marginRight: "6px" }}></iconify-icon>{fmt(totalPemasukan)}</p>
                                                </div>

                                                {/* Target Keuangan */}
                                                <div className="theme-panel text-[var(--theme-accent-contrast)] p-4 rounded-xl flex flex-col gap-2">
                                                    <span className="text-xs font-semibold bg-[var(--theme-accent)] text-[var(--theme-accent-contrast)] px-3 py-1 rounded-full w-fit">
                                                        Target Keuangan
                                                    </span>
                                                    <p className="text-lg font-bold"><iconify-icon icon="mdi:target" style={{ marginRight: "6px" }}></iconify-icon>{completedTabungan} Tercapai</p>
                                                </div>
                                            </div>

                                            {/* Progress Bar */}
                                            <div>
                                                <div className="h-2 bg-[var(--theme-card-border)] rounded-full overflow-hidden mb-2">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-[var(--theme-accent)] to-[var(--theme-accent-2)] transition-all duration-500"
                                                        style={{ width: totalBalance > 0 ? `${Math.min((totalBalance / (totalPemasukan || 1)) * 100, 100)}%` : "0%" }}
                                                    ></div>
                                                </div>
                                                <p className="text-xs text-[var(--theme-surface-muted)] font-medium">
                                                    {fmt(totalBalance)} - {fmt(totalPemasukan)}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* RIGHT: AKTIVITAS TERAKHIR */}
                                <div ref={activityRef}>
                                    {financialLoading ? (
                                        <div className="bg-white p-6 rounded-2xl shadow-md animate-pulse">
                                            <div className="h-6 bg-gray-300 rounded mb-6 w-48"></div>
                                            <div className="space-y-3">
                                                {[...Array(5)].map((_, i) => (
                                                    <div key={i} className="flex justify-between gap-4 pb-3 border-b border-gray-100">
                                                        <div className="h-4 bg-gray-300 rounded flex-1"></div>
                                                        <div className="h-4 bg-gray-200 rounded w-24"></div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="bg-white p-6 rounded-2xl shadow-md">
                                            <div className="flex justify-between items-center mb-6">
                                                <h3 className="text-xl font-bold text-gray-900">Aktivitas Terakhir</h3>
                                                <button
                                                    onClick={() => navigate("/profile/history")}
                                                    className="text-blue-600 hover:text-blue-800 font-semibold text-sm"
                                                >
                                                    Lihat Semua →
                                                </button>
                                            </div>

                                            <div className="overflow-y-auto max-h-96">
                                                <table className="w-full text-sm">
                                                    <thead className="sticky top-0 bg-[var(--theme-page-bg-alt)] border-b border-[var(--theme-card-border)]">
                                                        <tr>
                                                            <th className="text-left font-semibold text-[var(--theme-surface-text)] py-3 px-4">Deskripsi</th>
                                                            <th className="text-right font-semibold text-[var(--theme-surface-text)] py-3 px-4">Jumlah</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {(transactions.slice(0, 4)).map((tx, i) => (
                                                            <tr key={i} className="border-b border-[var(--theme-card-border)] hover:bg-[var(--theme-page-bg-alt)] transition">
                                                                <td className="py-3 px-4 text-[var(--theme-text)]">{tx.description || "-"}</td>
                                                                <td className={`py-3 px-4 text-right font-medium ${tx.type === "income" ? "text-green-600" : "text-red-600"}`}>
                                                                    {tx.type === "income" ? "+" : "-"}{fmt(tx.amount)}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>

                                            <button
                                                onClick={() => navigate("/profile/history")}
                                                className="text-green-700 font-semibold text-sm hover:text-green-900 transition-all mt-4 inline-block"
                                            >
                                                Lihat Semua
                                            </button>
                                        </div>
                                    )}
                                </div>

                            </div>
                        </div>

                        {/* MODAL EDIT PROFIL - Removed, use UserSetting.jsx instead */}

                        {/* MODAL PASSWORD */}
                        {showPassword && (
                            <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 backdrop-blur-sm">
                                <div className="bg-white p-8 rounded-2xl w-full max-w-md shadow-2xl">
                                    <h3 className="text-lg font-bold text-green-900 mb-5">Ubah Password</h3>

                                    {passwordError && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">{passwordError}</div>}
                                    {passwordMessage && <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg text-sm">{passwordMessage}</div>}

                                    <form onSubmit={handlePasswordSubmit} className="space-y-3">
                                        <input
                                            type="password"
                                            name="oldPassword"
                                            value={passwordForm.oldPassword}
                                            onChange={handlePasswordChange}
                                            placeholder="Password Lama"
                                            className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-green-300 focus:ring-4 focus:ring-green-100"
                                        />
                                        <input
                                            type="password"
                                            name="newPassword"
                                            value={passwordForm.newPassword}
                                            onChange={handlePasswordChange}
                                            placeholder="Password Baru"
                                            className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-green-300 focus:ring-4 focus:ring-green-100"
                                        />
                                        <input
                                            type="password"
                                            name="confirmPassword"
                                            value={passwordForm.confirmPassword}
                                            onChange={handlePasswordChange}
                                            placeholder="Konfirmasi Password Baru"
                                            className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-green-300 focus:ring-4 focus:ring-green-100"
                                        />

                                        <div className="flex gap-3 pt-2">
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(false)}
                                                disabled={passwordLoading}
                                                className="flex-1 p-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-all disabled:opacity-50"
                                            >
                                                Batal
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={passwordLoading}
                                                className="flex-1 p-3 bg-green-900 text-white font-semibold rounded-lg hover:bg-green-800 transition-all disabled:opacity-50"
                                            >
                                                {passwordLoading ? "Mengubah..." : "Simpan"}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}

                        {/* MODAL REVIEW */}
                        {showReviewModal && (
                            <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 backdrop-blur-sm">
                                <div className="bg-[#0B2E1E] p-8 rounded-2xl w-full max-w-md shadow-2xl border border-white/10 text-white max-h-[90vh] overflow-y-auto">
                                    <h3 className="text-lg font-bold text-white mb-2">Bagikan Review Anda</h3>
                                    <p className="text-gray-300 text-sm mb-6">Bantu kami meningkatkan MoneyPath dengan review Anda</p>

                                    {reviewError && <div className="mb-4 p-3 bg-red-900/50 text-red-300 rounded-lg text-sm border border-red-500/30">{reviewError}</div>}
                                    {reviewMessage && <div className="mb-4 p-3 bg-green-900/50 text-green-300 rounded-lg text-sm border border-green-500/30">{reviewMessage}</div>}

                                    <div className="mb-4">
                                        <ReviewForm onSubmit={handleReviewSubmit} loading={reviewLoading} />
                                    </div>

                                    <button
                                        onClick={() => setShowReviewModal(false)}
                                        disabled={reviewLoading}
                                        className="w-full p-3 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-500 transition-all disabled:opacity-50"
                                    >
                                        Tutup
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* REMOVE OLD REVIEW SECTION */}

                    </div>
                </div>
            </div>
        </div>
    );
}