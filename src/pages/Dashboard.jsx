import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth, signOut } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import API from "../services/api.js";
import Sidebar from "../components/Sidebar.jsx";
import Navbar from "../components/Navbar.jsx";

// ── Helpers ───────────────────────────────────────────────────
function calcLevel(totalExp = 0) {
    const level = Math.floor(totalExp / 100) + 1;
    const currentExp = totalExp % 100;
    return { level, currentExp, expToNext: 100, progress: currentExp };
}

function greeting() {
    const h = new Date().getHours();
    if (h < 12) return "Selamat Pagi";
    if (h < 17) return "Selamat Siang";
    return "Selamat Malam";
}

// Fetch module details from Firestore
async function getModuleDetails(moduleId) {
    try {
        const db = getFirestore();
        const moduleRef = doc(db, "learningPaths", "modules", "modules", moduleId);
        const moduleSnap = await getDoc(moduleRef);
        if (moduleSnap.exists()) {
            return moduleSnap.data();
        }
        return null;
    } catch (error) {
        console.error("Error fetching module:", error);
        return null;
    }
}

export default function Dashboard() {
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [personal, setPersonal] = useState(null);
    const [quizStats, setQuizStats] = useState(null);
    const [xpHistory, setXpHistory] = useState([]);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeNav, setActiveNav] = useState("beranda");
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    useEffect(() => {
        const fetchAll = async () => {
            try {
                const res = await API.get("/auth/profile");
                setProfile(res.data);

                const [personalRes, quizRes] = await Promise.allSettled([
                    API.get("/personal/profile"),
                    API.get("/quiz/stats"),
                ]);

                if (personalRes.status === "fulfilled") {
                    setPersonal(personalRes.value.data);
                } else if (personalRes.reason?.response?.status === 404) {
                    navigate("/personal");
                    return;
                }

                if (quizRes.status === "fulfilled") {
                    setQuizStats(quizRes.value.data);
                    // Get XP history from expLog (last 5 entries)
                    if (quizRes.value.data.expLog && quizRes.value.data.expLog.length > 0) {
                        const processedHistory = await Promise.all(
                            quizRes.value.data.expLog
                                .slice()
                                .reverse()
                                .slice(0, 5)
                                .map(async (log) => {
                                    let activity = log.reason || "Activity";

                                    // Check if it's a module ID (all caps hex-like string)
                                    if (activity.match(/^[a-zA-Z0-9]{20,}(\s*\/\s*PATH COMPLETE!)?$/)) {
                                        // It's just a module ID, fetch its details
                                        const moduleId = activity.replace(/\s*\/\s*PATH COMPLETE!$/, "");
                                        const moduleData = await getModuleDetails(moduleId);
                                        if (moduleData) {
                                            activity = `📦 ${moduleData.title || "Module"} / ${moduleId}`;
                                        } else {
                                            activity = `📦 ${moduleId}`;
                                        }
                                        if (log.reason.includes("PATH COMPLETE")) {
                                            activity = activity.replace("📦", "🏆");
                                        }
                                    } else if (activity.includes("Daily quiz")) {
                                        activity = `🧠 Daily Quiz`;
                                    } else if (activity.includes("PATH COMPLETE")) {
                                        activity = `🏆 Full Path Completed`;
                                    }

                                    return {
                                        activity,
                                        xp: log.amount || 0
                                    };
                                })
                        );
                        setXpHistory(processedHistory);
                    }
                }
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
    }, [navigate]);

    const handleLogout = async () => {
        try {
            await signOut(getAuth());
            navigate("/");
        } catch (err) {
            console.error("Logout error:", err);
        }
    };

    const handleNavigation = (navId) => {
        setActiveNav(navId);
        const routes = {
            beranda: "/dashboard",
            edukasi: "/video",
            tabungan: "/tabungan",
            profil: "/profile",
        };
        navigate(routes[navId] || "/dashboard");
    };

    if (error) return (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Plus Jakarta Sans, sans-serif" }}>
            <p style={{ color: "#ef4444" }}>Error: {error}</p>
        </div>
    );

    if (loading) return (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f0f4f0", fontFamily: "Plus Jakarta Sans, sans-serif" }}>
            <div style={{ textAlign: "center" }}>
                <div style={{ width: 36, height: 36, border: "3px solid #9FF782", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
                <p style={{ color: "#9ca3af", fontSize: 13 }}>Memuat data...</p>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        </div>
    );

    const { level, currentExp, expToNext, progress } = calcLevel(quizStats?.totalExp || 0);

    return (
        <div className="flex h-screen bg-white overflow-hidden w-full" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Lilita+One&display=swap');
                
                @media (max-width: 768px) {
                    [data-responsive-grid-2] { display: grid !important; grid-template-columns: 1fr !important; }
                    [data-responsive-grid-3] { display: grid !important; grid-template-columns: 1fr !important; }
                    [data-responsive-flex] { flex-direction: column !important; }
                    [data-responsive-text-lg] { font-size: 28px !important; }
                    [data-responsive-text-md] { font-size: 14px !important; }
                    [data-responsive-padding] { padding: 16px !important; }
                }
            `}</style>

            {/* ── SIDEBAR ──────────────────────────────────── */}
            <Sidebar active={activeNav} setActive={handleNavigation} handleLogout={handleLogout} isOpen={isSidebarOpen} setOpen={setIsSidebarOpen} />

            {/* ── MAIN CONTENT AREA ──────────────────────────────────── */}
            <main className="flex-1 flex flex-col h-screen overflow-hidden w-full">
                {/* ── NAVBAR/HEADER ──────────────────────────────────── */}
                <Navbar profile={profile} personal={personal} isOpen={isProfileOpen} setOpen={setIsProfileOpen} isSidebarOpen={isSidebarOpen} setSidebarOpen={setIsSidebarOpen} />

                {/* ── MAIN CONTENT ──────────────────────────────────── */}
                <div className="flex-1 overflow-y-auto bg-gray-50">
                    <div style={{ maxWidth: 1400, margin: "0 auto", padding: "16px", paddingTop: "80px" }}>

                        {/* ── TOP SECTION: Level Card ──────────────────────── */}
                        <div data-responsive-padding style={{ background: "linear-gradient(135deg, #1a3a1f 0%, #0f2a18 100%)", borderRadius: 20, padding: "24px", color: "white", position: "relative", overflow: "hidden", marginBottom: 24 }}>
                            <div style={{ position: "absolute", right: -30, top: -30, width: 120, height: 120, borderRadius: "50%", background: "rgba(159,247,130,0.07)" }} />
                            <div style={{ position: "absolute", right: 20, top: 20, width: 60, height: 60, borderRadius: "50%", background: "rgba(159,247,130,0.05)" }} />

                            <div data-responsive-flex style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", position: "relative", flexWrap: "wrap", gap: 16 }}>
                                <div>
                                    <p style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 8 }}>Level Kamu</p>
                                    <p data-responsive-text-lg style={{ fontSize: 48, fontWeight: 800, color: "#9FF782", lineHeight: 1 }}>Lv. {quizStats?.level || 1}</p>
                                    <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginTop: 8 }}>{quizStats?.totalExp || 0}/100 xp</p>
                                </div>
                                <div style={{ textAlign: "center", background: "white", borderRadius: 12, padding: "12px 16px", flexShrink: 0 }}>
                                    <iconify-icon icon="mdi:fire" style={{ fontSize: 24, color: "#ff6b6b" }}></iconify-icon>
                                    <p style={{ fontSize: 20, fontWeight: 700, color: "#1a3a1f", lineHeight: 1.1 }}>{quizStats?.streak || 0}</p>
                                    <p style={{ fontSize: 10, color: "#6b7280" }}>streak</p>
                                </div>
                            </div>

                            <div style={{ marginTop: 16 }}>
                                <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: 6, height: 8, overflow: "hidden" }}>
                                    <div style={{ width: `${((quizStats?.totalExp || 0) % 100)}%`, height: "100%", borderRadius: 6, background: "linear-gradient(90deg, #9FF782, #5dd672)", transition: "width 0.8s ease" }} />
                                </div>
                            </div>
                        </div>

                        {/* ── DAILY QUIZ & LEARNING PATH CARDS ──────────────────────── */}
                        <div data-responsive-grid-2 style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
                            {/* Daily Quiz Card */}
                            <div style={{ background: "linear-gradient(135deg, #fef9c3, #fef3c7)", borderRadius: 20, padding: "24px", position: "relative", overflow: "hidden", border: "2px solid #fde68a", transition: "all 0.2s", display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 12, cursor: "pointer" }}
                                onClick={() => navigate("/quiz")}
                                onMouseEnter={e => {
                                    e.currentTarget.style.transform = "translateY(-2px)";
                                    e.currentTarget.style.boxShadow = "0 8px 20px rgba(253, 230, 138, 0.3)";
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.transform = "none";
                                    e.currentTarget.style.boxShadow = "none";
                                }}>
                                <iconify-icon icon="mdi:lightbulb-outline" style={{ fontSize: 40, color: "#92400e" }}></iconify-icon>
                                <div style={{ flex: 1 }}>
                                    <p style={{ fontWeight: 700, fontSize: 18, color: "#92400e", marginBottom: 4 }}>Daily Quiz Tersedia</p>
                                    <p style={{ fontSize: 12, color: "#b45309" }}>nyalakan streak mu dengan memulai kuis!</p>
                                </div>
                                <button style={{ background: "#1a3a1f", color: "#9FF782", borderRadius: 8, padding: "10px 20px", fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer", whiteSpace: "nowrap" }}>
                                    Mulai
                                </button>
                            </div>

                            {/* Learning Path Card */}
                            <div style={{ background: "linear-gradient(135deg, #fef9c3, #fef3c7)", borderRadius: 20, padding: "24px", position: "relative", overflow: "hidden", border: "2px solid #fde68a", transition: "all 0.2s", display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 12, cursor: "pointer" }}
                                onClick={() => navigate("/learning")}
                                onMouseEnter={e => {
                                    e.currentTarget.style.transform = "translateY(-2px)";
                                    e.currentTarget.style.boxShadow = "0 8px 20px rgba(253, 230, 138, 0.3)";
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.transform = "none";
                                    e.currentTarget.style.boxShadow = "none";
                                }}>
                                <iconify-icon icon="mdi:chart-box-outline" style={{ fontSize: 40, color: "#92400e" }}></iconify-icon>
                                <div>
                                    <p style={{ fontSize: 18, fontWeight: 800, color: "#92400e" }}>Learning</p>
                                    <p style={{ fontSize: 18, fontWeight: 800, color: "#92400e" }}>path</p>
                                </div>
                                <button style={{ background: "#1a3a1f", color: "#9FF782", borderRadius: 8, padding: "10px 20px", fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer", whiteSpace: "nowrap" }}>
                                    Mulai
                                </button>
                            </div>
                        </div>

                        {/* ── MAIN GRID: Features ──────────────────────── */}
                        <div data-responsive-grid-2 style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 16, marginBottom: 24 }}>
                            {/* Left Column: Video Edukasi */}
                            <div style={{ background: "white", borderRadius: 16, padding: "20px", border: "2px solid #d1d5db", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, transition: "all 0.2s", minHeight: 200 }}
                                onClick={() => navigate("/video")}
                                onMouseEnter={e => {
                                    e.currentTarget.style.borderColor = "#9FF782";
                                    e.currentTarget.style.boxShadow = "0 8px 16px rgba(159, 247, 130, 0.1)";
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.borderColor = "#d1d5db";
                                    e.currentTarget.style.boxShadow = "none";
                                }}>
                                <iconify-icon icon="mdi:play-circle-outline" style={{ fontSize: 56, color: "#1a3a1f" }}></iconify-icon>
                                <p style={{ fontSize: 16, fontWeight: 800, color: "#1a3a1f" }}>Video Edukasi</p>
                                <p style={{ fontSize: 12, color: "#9ca3af", textAlign: "center" }}>Tonton dan Belajar</p>
                                <button style={{ background: "#1a3a1f", color: "white", borderRadius: 8, padding: "6px 12px", fontSize: 11, fontWeight: 600, border: "none", cursor: "pointer", marginTop: 8 }}>
                                    Tonton Sekarang
                                </button>
                            </div>

                            {/* Right Column: Feature Grid */}
                            <div data-responsive-grid-3 style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                                {/* Saldo Saya */}
                                <div style={{ background: "white", borderRadius: 16, padding: "16px", border: "2px solid #d1d5db", cursor: "pointer", transition: "all 0.2s" }}
                                    onClick={() => navigate("/balance")}
                                    onMouseEnter={e => {
                                        e.currentTarget.style.borderColor = "#9FF782";
                                        e.currentTarget.style.boxShadow = "0 8px 16px rgba(159, 247, 130, 0.1)";
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.borderColor = "#d1d5db";
                                        e.currentTarget.style.boxShadow = "none";
                                    }}>
                                    <iconify-icon icon="mdi:home-outline" style={{ fontSize: 32, marginBottom: 8, color: "#1a3a1f" }}></iconify-icon>
                                    <p style={{ fontSize: 14, fontWeight: 800, color: "#1a3a1f", marginBottom: 2 }}>Saldo Saya</p>
                                    <p style={{ fontSize: 11, color: "#9ca3af", marginBottom: 12 }}>Kelola Keuangan Anda</p>
                                    <button style={{ background: "#1a3a1f", color: "white", borderRadius: 6, padding: "4px 10px", fontSize: 10, fontWeight: 600, border: "none", cursor: "pointer" }}>
                                        Click
                                    </button>
                                </div>

                                {/* Saldo Bersama */}
                                <div style={{ background: "white", borderRadius: 16, padding: "16px", border: "2px solid #d1d5db", cursor: "pointer", transition: "all 0.2s" }}
                                    onClick={() => navigate("/shared-balance")}
                                    onMouseEnter={e => {
                                        e.currentTarget.style.borderColor = "#9FF782";
                                        e.currentTarget.style.boxShadow = "0 8px 16px rgba(159, 247, 130, 0.1)";
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.borderColor = "#d1d5db";
                                        e.currentTarget.style.boxShadow = "none";
                                    }}>
                                    <iconify-icon icon="mdi:handshake-outline" style={{ fontSize: 32, marginBottom: 8, color: "#1a3a1f" }}></iconify-icon>
                                    <p style={{ fontSize: 14, fontWeight: 800, color: "#1a3a1f", marginBottom: 2 }}>Saldo Bersama</p>
                                    <p style={{ fontSize: 11, color: "#9ca3af", marginBottom: 12 }}>Kelola Bersama</p>
                                    <button style={{ background: "#1a3a1f", color: "white", borderRadius: 6, padding: "4px 10px", fontSize: 10, fontWeight: 600, border: "none", cursor: "pointer" }}>
                                        Click
                                    </button>
                                </div>

                                {/* Tabungan Bersama */}
                                <div style={{ background: "white", borderRadius: 16, padding: "16px", border: "2px solid #d1d5db", cursor: "pointer", transition: "all 0.2s" }}
                                    onClick={() => navigate("/shared-tabungan")}
                                    onMouseEnter={e => {
                                        e.currentTarget.style.borderColor = "#9FF782";
                                        e.currentTarget.style.boxShadow = "0 8px 16px rgba(159, 247, 130, 0.1)";
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.borderColor = "#d1d5db";
                                        e.currentTarget.style.boxShadow = "none";
                                    }}>
                                    <iconify-icon icon="mdi:wallet-outline" style={{ fontSize: 32, marginBottom: 8, color: "#1a3a1f" }}></iconify-icon>
                                    <p style={{ fontSize: 14, fontWeight: 800, color: "#1a3a1f", marginBottom: 2 }}>Tabungan Bersama</p>
                                    <p style={{ fontSize: 11, color: "#9ca3af", marginBottom: 12 }}>Nabung Bareng</p>
                                    <button style={{ background: "#1a3a1f", color: "white", borderRadius: 6, padding: "4px 10px", fontSize: 10, fontWeight: 600, border: "none", cursor: "pointer" }}>
                                        Click
                                    </button>
                                </div>

                                {/* Tabungan Target */}
                                <div style={{ background: "white", borderRadius: 16, padding: "16px", border: "2px solid #d1d5db", cursor: "pointer", transition: "all 0.2s" }}
                                    onClick={() => navigate("/tabungan")}
                                    onMouseEnter={e => {
                                        e.currentTarget.style.borderColor = "#9FF782";
                                        e.currentTarget.style.boxShadow = "0 8px 16px rgba(159, 247, 130, 0.1)";
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.borderColor = "#d1d5db";
                                        e.currentTarget.style.boxShadow = "none";
                                    }}>
                                    <iconify-icon icon="mdi:bullseye" style={{ fontSize: 32, marginBottom: 8, color: "#1a3a1f" }}></iconify-icon>
                                    <p style={{ fontSize: 14, fontWeight: 800, color: "#1a3a1f", marginBottom: 2 }}>Tabungan Saya</p>
                                    <p style={{ fontSize: 11, color: "#9ca3af", marginBottom: 12 }}>Kelola Target</p>
                                    <button style={{ background: "#1a3a1f", color: "white", borderRadius: 6, padding: "4px 10px", fontSize: 10, fontWeight: 600, border: "none", cursor: "pointer" }}>
                                        Click
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* ── BOTTOM GRID: Recap + Other Features ──────────────────────── */}
                        <div data-responsive-grid-2 style={{ display: "grid", gridTemplateColumns: "0.7fr 1.3fr", gap: 16, marginBottom: 24 }}>
                            {/* Recap Card */}
                            <div style={{ background: "white", borderRadius: 16, padding: "20px", border: "2px solid #d1d5db", cursor: "pointer", transition: "all 0.2s", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}
                                onClick={() => navigate("/rekap")}
                                onMouseEnter={e => {
                                    e.currentTarget.style.borderColor = "#9FF782";
                                    e.currentTarget.style.boxShadow = "0 8px 16px rgba(159, 247, 130, 0.1)";
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.borderColor = "#d1d5db";
                                    e.currentTarget.style.boxShadow = "none";
                                }}>
                                <iconify-icon icon="mdi:chart-box-outline" style={{ fontSize: 40, marginBottom: 12, color: "#1a3a1f" }}></iconify-icon>
                                <p style={{ fontSize: 16, fontWeight: 800, color: "#1a3a1f", marginBottom: 4 }}>Rekap</p>
                                <p style={{ fontSize: 12, color: "#9ca3af", marginBottom: 14 }}>Lihat Rekap Bulanan</p>
                                <button style={{ background: "#1a3a1f", color: "white", borderRadius: 8, padding: "6px 14px", fontSize: 11, fontWeight: 600, border: "none", cursor: "pointer" }}>
                                    Click
                                </button>
                            </div>

                            {/* Stats Section */}
                            <div style={{ display: "grid", gridTemplateRows: "1fr 1fr", gap: 16 }}>
                                {/* XP History */}
                                <div style={{ background: "#fff8e6", borderRadius: 16, padding: "16px", border: "2px solid #fde68a", cursor: "pointer", transition: "all 0.2s", minHeight: 180 }}
                                    onClick={() => navigate("/quiz")}
                                    onMouseEnter={e => {
                                        e.currentTarget.style.borderColor = "#f59e0b";
                                        e.currentTarget.style.boxShadow = "0 8px 16px rgba(245, 158, 11, 0.1)";
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.borderColor = "#fde68a";
                                        e.currentTarget.style.boxShadow = "none";
                                    }}>
                                    <p style={{ fontSize: 12, fontWeight: 700, color: "#b45309", marginBottom: 10 }}>📊 Riwayat XP Terakhir</p>
                                    <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 180, overflowY: "auto" }}>
                                        {xpHistory.length > 0 ? (
                                            xpHistory.slice(0, 5).map((item, idx) => (
                                                <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid #fcd34d", gap: 8 }}>
                                                    <span style={{ fontSize: 10, color: "#92400e", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                        {item.activity || "Activity"}
                                                    </span>
                                                    <span style={{ fontSize: 10, fontWeight: 700, color: "#f59e0b", flexShrink: 0 }}>
                                                        +{item.xp} XP
                                                    </span>
                                                </div>
                                            ))
                                        ) : (
                                            <p style={{ fontSize: 11, color: "#b45309", textAlign: "center", padding: "8px" }}>Belum ada riwayat XP</p>
                                        )}
                                    </div>
                                </div>

                                {/* Target Stats */}
                                <div style={{ background: "#f0f9ff", borderRadius: 16, padding: "16px", border: "2px solid #bfdbfe", cursor: "pointer", transition: "all 0.2s", minHeight: 180, display: "flex", flexDirection: "column", justifyContent: "center" }}
                                    onClick={() => navigate("/learning")}
                                    onMouseEnter={e => {
                                        e.currentTarget.style.borderColor = "#0284c7";
                                        e.currentTarget.style.boxShadow = "0 8px 16px rgba(2, 132, 199, 0.1)";
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.borderColor = "#bfdbfe";
                                        e.currentTarget.style.boxShadow = "none";
                                    }}>
                                    <iconify-icon icon="mdi:trending-up" style={{ fontSize: 32, marginBottom: 8, color: "#0c4a6e" }}></iconify-icon>
                                    <p style={{ fontSize: 14, fontWeight: 800, color: "#0c4a6e" }}>Belajar & Berkembang</p>
                                    <p style={{ fontSize: 11, color: "#0284c7" }}>Akses Learning Path</p>
                                </div>
                            </div>
                        </div>

                        {/* ── STATISTICS SECTION ──────────────────────── */}
                        <div style={{ marginBottom: 24 }}>
                            <p style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 12 }}>STATISTIK</p>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                                <div style={{ background: "white", borderRadius: 12, padding: "16px", textAlign: "center", border: "2px solid #fed7aa" }}>
                                    <iconify-icon icon="mdi:lightning-bolt" style={{ fontSize: 24, marginBottom: 8, color: "#1a3a1f" }}></iconify-icon>
                                    <p style={{ fontSize: 16, fontWeight: 800, color: "#1a3a1f" }}>Level {quizStats?.level || 1}</p>
                                    <p style={{ fontSize: 11, color: "#9ca3af" }}>level</p>
                                </div>
                                <div style={{ background: "white", borderRadius: 12, padding: "16px", textAlign: "center", border: "2px solid #fed7aa" }}>
                                    <iconify-icon icon="mdi:fire" style={{ fontSize: 24, marginBottom: 8, color: "#1a3a1f" }}></iconify-icon>
                                    <p style={{ fontSize: 16, fontWeight: 800, color: "#1a3a1f" }}>{quizStats?.streak || 0} hari</p>
                                    <p style={{ fontSize: 11, color: "#9ca3af" }}>streak</p>
                                </div>
                                <div style={{ background: "white", borderRadius: 12, padding: "16px", textAlign: "center", border: "2px solid #fed7aa" }}>
                                    <iconify-icon icon="mdi:trophy-outline" style={{ fontSize: 24, marginBottom: 8, color: "#1a3a1f" }}></iconify-icon>
                                    <p style={{ fontSize: 16, fontWeight: 800, color: "#1a3a1f" }}>{quizStats?.maxStreak || 0}</p>
                                    <p style={{ fontSize: 11, color: "#9ca3af" }}>champion</p>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </main>
        </div>
    );
}