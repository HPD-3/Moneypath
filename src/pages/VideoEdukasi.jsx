import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase.js";
import API from "../services/api.js";
import Sidebar from "../components/Sidebar.jsx";
import Navbar from "../components/Navbar.jsx";

const CATEGORIES = ["semua", "budgeting", "investing", "saving", "debt"];

const PAGE_FONT = "'Plus Jakarta Sans', sans-serif";
const HERO_BG = "linear-gradient(135deg, #18331e 0%, #102416 100%)";
const PAGE_BG = "#eef2eb";
const BORDER = "#d7ddd6";

function VideoCard({ video, onClick }) {
    return (
        <div
            onClick={() => onClick(video)}
            style={{ background: "white", borderRadius: 14, overflow: "hidden", cursor: "pointer", boxShadow: "0 2px 10px rgba(16, 24, 40, 0.12)", transition: "transform 0.2s ease, box-shadow 0.2s ease", display: "flex", gap: 16, padding: 12, border: `1px solid ${BORDER}` }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 12px 26px rgba(16, 24, 40, 0.14)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 2px 10px rgba(16, 24, 40, 0.12)"; }}>

            <div style={{ position: "relative", flexShrink: 0, width: 170, height: 100, borderRadius: 10, overflow: "hidden", background: "#dfe6de" }}>
                <img
                    src={video.thumbnail}
                    alt={video.title}
                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                />
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(0,0,0,0.1), rgba(0,0,0,0.16))", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ width: 42, height: 42, background: "rgba(255,255,255,0.92)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, boxShadow: "0 6px 14px rgba(0,0,0,0.12)" }}>
                        <iconify-icon icon="mdi:play" style={{ color: "black", fontSize: 20 }}></iconify-icon>
                    </div>
                </div>
                {video.duration && (
                    <span style={{ position: "absolute", bottom: 8, right: 8, background: "rgba(0,0,0,0.75)", color: "white", fontSize: 10, padding: "2px 7px", borderRadius: 4, fontWeight: 600 }}>
                        {video.duration}
                    </span>
                )}
            </div>

            <div style={{ flex: 1 }}>
                <span style={{ fontSize: 10, fontWeight: 600, color: "#2f5f3a", background: "#e6f4e9", padding: "3px 10px", borderRadius: 20, textTransform: "capitalize", display: "inline-block", marginBottom: 8, border: "1px solid #b9dfc0" }}>
                    {video.category}
                </span>
                <p style={{ fontWeight: 700, fontSize: 14, color: "#1f2d21", lineHeight: 1.35, marginBottom: 4 }}>{video.title}</p>
                <p style={{ fontSize: 11.5, color: "#7b867d", lineHeight: 1.55, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {video.description}
                </p>
            </div>
        </div>
    );
}

export default function VideoEdukasi() {
    const navigate                    = useNavigate();
    const [videos, setVideos]         = useState([]);
    const [loading, setLoading]       = useState(true);
    const [activeCategory, setActive] = useState("semua");
    const [playing, setPlaying]       = useState(null);
    const [search, setSearch]         = useState("");
    
    // New state for sidebar and navbar
    const [profile, setProfile]         = useState(null);
    const [personal, setPersonal]       = useState(null);
    const [activeNav, setActiveNav]     = useState("edukasi");
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

    useEffect(() => {
        const fetchVideos = async () => {
            try {
                const res = await API.get("/video");
                console.log("Full response:", res);
                console.log("Response data:", res.data);
                
                // Handle both array and object responses
                let videoArray = [];
                if (Array.isArray(res.data)) {
                    videoArray = res.data;
                } else if (res.data && typeof res.data === 'object') {
                    // If data is an object, check for a videos property
                    videoArray = res.data.videos || [];
                }
                
                console.log("Final video array:", videoArray);
                setVideos(videoArray);
            } catch (err) {
                console.error("Error fetching videos:", err);
                setVideos([]);
            } finally {
                setLoading(false);
            }
        };
        fetchVideos();
    }, []);

    const filtered = videos.filter(v => {
        const matchCat   = activeCategory === "semua" || (v && v.category === activeCategory);
        const matchSearch = !search || 
                           (v && v.title && v.title.toLowerCase().includes(search.toLowerCase())) ||
                           (v && v.description && v.description.toLowerCase().includes(search.toLowerCase()));
        return matchCat && matchSearch;
    });

    return (
        <div className="flex h-screen bg-gray-50 font-sans overflow-hidden">
            <Sidebar active={activeNav} setActive={(navId) => { setActiveNav(navId); handleNavigation(navId); }} handleLogout={handleLogout} isOpen={isSidebarOpen} setOpen={setIsSidebarOpen} />

            <div className="flex-1 flex flex-col overflow-hidden w-full">
                <Navbar profile={profile} personal={personal} isOpen={isProfileOpen} setOpen={setIsProfileOpen} isSidebarOpen={isSidebarOpen} setSidebarOpen={setIsSidebarOpen} />

                <div className="flex-1 overflow-y-auto bg-gray-100">
                    <div style={{ minHeight: "100vh", background: PAGE_BG, fontFamily: PAGE_FONT, paddingTop: "60px" }}>
                        <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');`}</style>

                        <div style={{ background: HERO_BG, padding: "28px 24px 30px", textAlign: "center", boxShadow: "0 1px 0 rgba(255,255,255,0.04) inset" }}>
                            <h1 style={{ color: "#f4f7f2", fontSize: 30, fontWeight: 800, marginBottom: 6, letterSpacing: "-0.02em", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                                <iconify-icon icon="mdi:video-camera" style={{ fontSize: 28, color: "#9FF782" }}></iconify-icon>
                                Vidio Edukasi
                            </h1>
                            <p style={{ color: "rgba(255,255,255,0.76)", fontSize: 13, marginBottom: 20 }}>
                                Tingkatkan literasi finansialmu dengan video edukasi pilihan
                            </p>
                            <div style={{ maxWidth: 420, margin: "0 auto", position: "relative" }}>
                                <iconify-icon icon="mdi:magnify" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 18, color: "#9ca3af" }}></iconify-icon>
                                <input
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    placeholder="Cari video..."
                                    style={{ width: "100%", padding: "11px 12px 11px 36px", borderRadius: 12, border: "none", fontSize: 14, outline: "none", fontFamily: PAGE_FONT, boxShadow: "0 8px 20px rgba(0,0,0,0.12)" }}
                                />
                            </div>
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
                                <span>Daftar Vidio Edukasi</span>
                                <span>{filtered.length} video</span>
                            </div>
                        </div>

                        <div style={{ padding: "6px 24px 24px" }}>
                            {loading ? (
                                <div style={{ textAlign: "center", padding: 60, color: "#9ca3af" }}>Loading video...</div>
                            ) : filtered.length === 0 ? (
                                <div style={{ textAlign: "center", padding: 60, color: "#9ca3af" }}>
                                    <iconify-icon icon="mdi:film-reel" style={{ fontSize: 60, marginBottom: 10, display: "block", color: "#d1d5db" }}></iconify-icon>
                                    <p>Tidak ada video ditemukan.</p>
                                </div>
                            ) : (
                                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                                    {filtered.map(v => (
                                        <VideoCard key={v.id} video={v} onClick={setPlaying} />
                                    ))}
                                </div>
                            )}
                        </div>

                        {playing && (
                            <div onClick={() => setPlaying(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
                                <div onClick={e => e.stopPropagation()} style={{ background: "white", borderRadius: 14, overflow: "hidden", width: "100%", maxWidth: 760 }}>
                                    <div style={{ position: "relative", paddingBottom: "56.25%", height: 0 }}>
                                        <iframe
                                            src={`https://www.youtube.com/embed/${playing.youtubeId}?autoplay=1&rel=0`}
                                            style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: "none" }}
                                            allow="autoplay; encrypted-media; fullscreen"
                                            allowFullScreen
                                            title={playing.title}
                                        />
                                    </div>

                                    <div style={{ padding: 20 }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                            <div style={{ flex: 1 }}>
                                                <h2 style={{ fontWeight: 800, color: "#1f2d21", fontSize: 17, marginBottom: 8 }}>{playing.title}</h2>
                                                <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
                                                    <span style={{ fontSize: 11, fontWeight: 700, color: "#2f5f3a", background: "#e6f4e9", padding: "3px 10px", borderRadius: 20, textTransform: "capitalize", border: "1px solid #b9dfc0" }}>
                                                        {playing.category}
                                                    </span>
                                                    {playing.duration && (
                                                        <span style={{ fontSize: 11, fontWeight: 700, color: "#374151", background: "#f3f4f6", padding: "3px 10px", borderRadius: 20, display: "flex", alignItems: "center", gap: 4 }}>
                                                            <iconify-icon icon="mdi:clock" style={{ fontSize: 12 }}></iconify-icon>
                                                            {playing.duration}
                                                        </span>
                                                    )}
                                                </div>
                                                <p style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.6 }}>{playing.description}</p>
                                            </div>
                                            <button onClick={() => setPlaying(null)} style={{ background: "#f3f4f6", border: "none", borderRadius: "50%", width: 32, height: 32, cursor: "pointer", fontSize: 16, flexShrink: 0, marginLeft: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                <iconify-icon icon="mdi:close" style={{ fontSize: 18, color: "#6b7280" }}></iconify-icon>
                                            </button>
                                        </div>

                                        {videos.filter(v => v.id !== playing.id && v.category === playing.category).length > 0 && (
                                            <div style={{ marginTop: 16, borderTop: `1px solid ${BORDER}`, paddingTop: 16 }}>
                                                <p style={{ fontSize: 12, fontWeight: 700, color: "#6b7280", marginBottom: 10 }}>VIDEO TERKAIT</p>
                                                <div style={{ display: "flex", gap: 10, overflowX: "auto" }}>
                                                    {videos.filter(v => v.id !== playing.id && v.category === playing.category).slice(0, 4).map(v => (
                                                        <div key={v.id} onClick={() => setPlaying(v)} style={{ cursor: "pointer", flexShrink: 0, width: 140 }}>
                                                            <img src={v.thumbnail} alt={v.title} style={{ width: "100%", borderRadius: 6, marginBottom: 4, aspectRatio: "16/9", objectFit: "cover" }} />
                                                            <p style={{ fontSize: 11, fontWeight: 600, color: "#1f2d21", lineHeight: 1.3 }}>{v.title}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}