import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase.js";
import API from "../services/api.js";
import Sidebar from "../components/Sidebar.jsx";
import Navbar from "../components/Navbar.jsx";

const CATEGORIES = ["semua", "budgeting", "investing", "saving", "debt"];
const DIFF_COLORS = {
    beginner: { bg: "#dcfce7", color: "#166534" },
    intermediate: { bg: "#fef9c3", color: "#854d0e" },
    advanced: { bg: "#fee2e2", color: "#991b1b" },
};

const PAGE_FONT = "'Plus Jakarta Sans', sans-serif";
const HERO_BG = "linear-gradient(135deg, #18331e 0%, #102416 100%)";
const PAGE_BG = "#eef2eb";
const BORDER = "#d7ddd6";

function PathCard({ path, onClick }) {
    return (
        <div
            onClick={() => onClick(path.id)}
            style={{
                background: "#fff",
                borderRadius: 14,
                padding: 12,
                cursor: "pointer",
                boxShadow: "0 2px 10px rgba(16, 24, 40, 0.12)",
                border: `1px solid ${BORDER}`,
                transition: "transform 0.2s ease, box-shadow 0.2s ease",
                overflow: "hidden",
            }}
            onMouseEnter={e => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = "0 12px 26px rgba(16, 24, 40, 0.14)";
            }}
            onMouseLeave={e => {
                e.currentTarget.style.transform = "none";
                e.currentTarget.style.boxShadow = "0 2px 10px rgba(16, 24, 40, 0.12)";
            }}
        >
            <div style={{ position: "relative", borderRadius: 10, overflow: "hidden", marginBottom: 10, background: "#dfe6de" }}>
                <img
                    src={path.thumbnail}
                    alt={path.title}
                    style={{ width: "100%", height: 90, objectFit: "cover", display: "block" }}
                />
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(0,0,0,0.1), rgba(0,0,0,0.08))" }} />
                <div style={{ position: "absolute", left: 10, top: 10, width: 42, height: 42, borderRadius: 12, background: "rgba(255,255,255,0.88)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, boxShadow: "0 6px 14px rgba(0,0,0,0.12)" }}>
                    {path.category === "budgeting" ? "📊" : path.category === "investing" ? "📈" : path.category === "saving" ? "🐷" : "💳"}
                </div>
            </div>

            <div style={{ display: "flex", gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
                <span style={{ fontSize: 10, fontWeight: 600, padding: "3px 10px", borderRadius: 20, background: "#e6f4e9", color: "#2f5f3a", textTransform: "capitalize", border: "1px solid #b9dfc0" }}>
                    {path.category}
                </span>
                <span style={{ fontSize: 10, fontWeight: 600, padding: "3px 10px", borderRadius: 20, background: DIFF_COLORS[path.difficulty]?.bg, color: DIFF_COLORS[path.difficulty]?.color, textTransform: "capitalize", border: "1px solid rgba(0,0,0,0.06)" }}>
                    {path.difficulty}
                </span>
            </div>

            <h3 style={{ fontWeight: 700, fontSize: 15, color: "#1f2d21", marginBottom: 4, lineHeight: 1.35 }}>{path.title}</h3>
            <p style={{ fontSize: 12, color: "#7b867d", lineHeight: 1.55, marginBottom: 14, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                {path.description}
            </p>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 12, borderTop: `1px solid ${BORDER}` }}>
                <div style={{ display: "flex", gap: 12, fontSize: 11, color: "#526157", fontWeight: 600 }}>
                    <span>📦 {path.totalModules || 0} Modul</span>
                    {path.estimatedTime && <span>⏱ {path.estimatedTime}</span>}
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#30533a" }}>Mulai</span>
            </div>
        </div>
    );
}

export default function LearningPathList() {
    const navigate = useNavigate();
    const [paths, setPaths] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActive] = useState("semua");

    // New state for sidebar and navbar
    const [profile, setProfile] = useState(null);
    const [personal, setPersonal] = useState(null);
    const [activeNav, setActiveNav] = useState("learning");
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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

    useEffect(() => {
        const fetchPaths = async () => {
            try {
                const res = await API.get("/learningpath");
                setPaths(res.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchPaths();
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

    const filtered = paths.filter(p =>
        activeCategory === "semua" || p.category === activeCategory
    );

    return (
        <div className="flex h-screen bg-gray-50 font-sans overflow-hidden">
            <Sidebar active={activeNav} setActive={(navId) => { setActiveNav(navId); handleNavigation(navId); }} handleLogout={handleLogout} isOpen={isSidebarOpen} setOpen={setIsSidebarOpen} />

            <div className="flex-1 flex flex-col overflow-hidden w-full">
                <Navbar profile={profile} personal={personal} isOpen={isProfileOpen} setOpen={setIsProfileOpen} isSidebarOpen={isSidebarOpen} setSidebarOpen={setIsSidebarOpen} />

                <div className="flex-1 overflow-y-auto bg-gray-100">
                    <div style={{ minHeight: "100vh", background: PAGE_BG, fontFamily: PAGE_FONT, paddingTop: "60px" }}>
                        <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');`}</style>
                        <div style={{ background: HERO_BG, padding: "28px 24px 30px", textAlign: "center", boxShadow: "0 1px 0 rgba(255,255,255,0.04) inset" }}>
                            <h1 style={{ color: "#f4f7f2", fontSize: 30, fontWeight: 800, marginBottom: 6, letterSpacing: "-0.02em" }}>Learning Path</h1>
                            <p style={{ color: "rgba(255,255,255,0.76)", fontSize: 13, margin: 0 }}>Tingkatkan Literasi Finansial mu dengan edukasi pilihan</p>
                        </div>

                        <div style={{ padding: "22px 24px 14px" }}>
                            <div style={{ maxWidth: 540, margin: "0 auto", background: "#f8faf8", border: `1px solid ${BORDER}`, borderRadius: 14, padding: 4, display: "grid", gridTemplateColumns: `repeat(${CATEGORIES.length}, minmax(0, 1fr))`, gap: 4, boxShadow: "0 4px 16px rgba(16, 24, 40, 0.08)" }}>
                                {CATEGORIES.map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setActive(cat)}
                                        style={{
                                            padding: "8px 12px",
                                            borderRadius: 10,
                                            border: "none",
                                            fontSize: 13,
                                            fontWeight: 700,
                                            cursor: "pointer",
                                            textTransform: "capitalize",
                                            whiteSpace: "nowrap",
                                            fontFamily: PAGE_FONT,
                                            background: activeCategory === cat ? "#314d36" : "transparent",
                                            color: activeCategory === cat ? "#f4f7f2" : "#2f4034",
                                            transition: "all 0.2s ease",
                                            boxShadow: activeCategory === cat ? "0 4px 12px rgba(49, 77, 54, 0.25)" : "none",
                                        }}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14, color: "#66756b", fontSize: 12, fontWeight: 600 }}>
                                <span>Daftar Materi</span>
                                <span>{filtered.length} path</span>
                            </div>
                        </div>

                        <div style={{ padding: "6px 24px 24px" }}>
                            {loading ? (
                                <div style={{ textAlign: "center", padding: 60, color: "#9ca3af" }}>Loading...</div>
                            ) : filtered.length === 0 ? (
                                <div style={{ textAlign: "center", padding: 60, color: "#9ca3af" }}>
                                    <p style={{ fontSize: 40, marginBottom: 10 }}>📚</p>
                                    <p>Belum ada learning path tersedia.</p>
                                </div>
                            ) : (
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(255px, 1fr))", gap: 16, alignItems: "start" }}>
                                    {filtered.map(p => <PathCard key={p.id} path={p} onClick={id => navigate(`/learning/${id}`)} />)}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}