import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api.js";

const CATEGORIES = ["semua", "budgeting", "investing", "saving", "debt"];

function VideoCard({ video, onClick }) {
    return (
        <div
            onClick={() => onClick(video)}
            style={{ background: "white", borderRadius: 12, overflow: "hidden", cursor: "pointer", boxShadow: "0 1px 6px rgba(0,0,0,0.07)", transition: "transform 0.2s, box-shadow 0.2s" }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 8px 20px rgba(0,0,0,0.1)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 1px 6px rgba(0,0,0,0.07)"; }}>

            {/* Thumbnail */}
            <div style={{ position: "relative" }}>
                <img
                    src={video.thumbnail}
                    alt={video.title}
                    style={{ width: "100%", aspectRatio: "16/9", objectFit: "cover", display: "block" }}
                />
                <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ width: 40, height: 40, background: "rgba(255,255,255,0.92)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>▶</div>
                </div>
                {video.duration && (
                    <span style={{ position: "absolute", bottom: 8, right: 8, background: "rgba(0,0,0,0.75)", color: "white", fontSize: 10, padding: "2px 7px", borderRadius: 4, fontWeight: 600 }}>
                        {video.duration}
                    </span>
                )}
            </div>

            {/* Info */}
            <div style={{ padding: "12px 14px" }}>
                <span style={{ fontSize: 10, fontWeight: 600, color: "#166534", background: "#e8fce0", padding: "2px 8px", borderRadius: 20, textTransform: "capitalize", display: "inline-block", marginBottom: 6 }}>
                    {video.category}
                </span>
                <p style={{ fontWeight: 600, fontSize: 13, color: "#1a3a1f", lineHeight: 1.4, marginBottom: 4 }}>{video.title}</p>
                <p style={{ fontSize: 11, color: "#9ca3af", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
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

    useEffect(() => {
        const fetchVideos = async () => {
            try {
                const res = await API.get("/video");
                setVideos(res.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchVideos();
    }, []);

    const filtered = videos.filter(v => {
        const matchCat   = activeCategory === "semua" || v.category === activeCategory;
        const matchSearch = v.title?.toLowerCase().includes(search.toLowerCase()) ||
                            v.description?.toLowerCase().includes(search.toLowerCase());
        return matchCat && matchSearch;
    });

    return (
        <div style={{ minHeight: "100vh", background: "#f0f4f0", fontFamily: "Plus Jakarta Sans, sans-serif" }}>

            {/* Import font */}
            <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');`}</style>

            {/* Navbar */}
            <nav style={{ background: "linear-gradient(90deg, #1a3a1f, #0f2a18)", padding: "12px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: 700, color: "#9FF782", fontSize: 18 }}>MoneyPath</span>
                <button
                    onClick={() => navigate("/dashboard")}
                    style={{ background: "#9FF782", color: "#0a1f10", border: "none", borderRadius: 8, padding: "7px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "Plus Jakarta Sans, sans-serif" }}>
                    ← Dashboard
                </button>
            </nav>

            {/* Hero */}
            <div style={{ background: "linear-gradient(135deg, #1a3a1f, #0f2a18)", padding: "36px 24px", textAlign: "center" }}>
                <h1 style={{ color: "#9FF782", fontSize: 28, fontWeight: 700, marginBottom: 8 }}>📹 Vidio Edukasi</h1>
                <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 14, marginBottom: 20 }}>
                    Tingkatkan literasi finansialmu dengan video edukasi pilihan
                </p>
                {/* Search */}
                <div style={{ maxWidth: 400, margin: "0 auto", position: "relative" }}>
                    <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: "#9ca3af" }}>🔍</span>
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Cari video..."
                        style={{ width: "100%", padding: "10px 12px 10px 36px", borderRadius: 8, border: "none", fontSize: 14, outline: "none", fontFamily: "Plus Jakarta Sans, sans-serif" }}
                    />
                </div>
            </div>

            {/* Category Filter */}
            <div style={{ padding: "16px 24px", display: "flex", gap: 8, overflowX: "auto", background: "white", borderBottom: "1px solid #f3f4f6" }}>
                {CATEGORIES.map(cat => (
                    <button key={cat} onClick={() => setActive(cat)}
                        style={{
                            padding: "6px 16px", borderRadius: 20, border: "none",
                            fontSize: 13, fontWeight: 500, cursor: "pointer",
                            textTransform: "capitalize", whiteSpace: "nowrap",
                            fontFamily: "Plus Jakarta Sans, sans-serif",
                            background: activeCategory === cat ? "#1a3a1f" : "#f3f4f6",
                            color: activeCategory === cat ? "#9FF782" : "#6b7280",
                            transition: "all 0.2s"
                        }}>
                        {cat}
                    </button>
                ))}
                <span style={{ marginLeft: "auto", fontSize: 12, color: "#9ca3af", alignSelf: "center", whiteSpace: "nowrap" }}>
                    {filtered.length} video
                </span>
            </div>

            {/* Video Grid */}
            <div style={{ padding: 24 }}>
                {loading ? (
                    <div style={{ textAlign: "center", padding: 60, color: "#9ca3af" }}>Loading video...</div>
                ) : filtered.length === 0 ? (
                    <div style={{ textAlign: "center", padding: 60, color: "#9ca3af" }}>
                        <p style={{ fontSize: 40, marginBottom: 10 }}>🎬</p>
                        <p>Tidak ada video ditemukan.</p>
                    </div>
                ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
                        {filtered.map(v => (
                            <VideoCard key={v.id} video={v} onClick={setPlaying} />
                        ))}
                    </div>
                )}
            </div>

            {/* Player Modal */}
            {playing && (
                <div
                    onClick={() => setPlaying(null)}
                    style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
                    <div
                        onClick={e => e.stopPropagation()}
                        style={{ background: "white", borderRadius: 14, overflow: "hidden", width: "100%", maxWidth: 760 }}>

                        {/* Embedded YouTube player */}
                        <div style={{ position: "relative", paddingBottom: "56.25%", height: 0 }}>
                            <iframe
                                src={`https://www.youtube.com/embed/${playing.youtubeId}?autoplay=1&rel=0`}
                                style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: "none" }}
                                allow="autoplay; encrypted-media; fullscreen"
                                allowFullScreen
                                title={playing.title}
                            />
                        </div>

                        {/* Video Info */}
                        <div style={{ padding: 20 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                <div style={{ flex: 1 }}>
                                    <h2 style={{ fontWeight: 700, color: "#1a3a1f", fontSize: 17, marginBottom: 8 }}>{playing.title}</h2>
                                    <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                                        <span style={{ fontSize: 11, fontWeight: 600, color: "#166534", background: "#e8fce0", padding: "2px 8px", borderRadius: 20, textTransform: "capitalize" }}>
                                            {playing.category}
                                        </span>
                                        {playing.duration && (
                                            <span style={{ fontSize: 11, fontWeight: 600, color: "#374151", background: "#f3f4f6", padding: "2px 8px", borderRadius: 20 }}>
                                                ⏱ {playing.duration}
                                            </span>
                                        )}
                                    </div>
                                    <p style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.6 }}>{playing.description}</p>
                                </div>
                                <button
                                    onClick={() => setPlaying(null)}
                                    style={{ background: "#f3f4f6", border: "none", borderRadius: "50%", width: 32, height: 32, cursor: "pointer", fontSize: 16, flexShrink: 0, marginLeft: 16 }}>
                                    ✕
                                </button>
                            </div>

                            {/* Related videos */}
                            {videos.filter(v => v.id !== playing.id && v.category === playing.category).length > 0 && (
                                <div style={{ marginTop: 16, borderTop: "1px solid #f3f4f6", paddingTop: 16 }}>
                                    <p style={{ fontSize: 12, fontWeight: 600, color: "#6b7280", marginBottom: 10 }}>VIDEO TERKAIT</p>
                                    <div style={{ display: "flex", gap: 10, overflowX: "auto" }}>
                                        {videos.filter(v => v.id !== playing.id && v.category === playing.category).slice(0, 4).map(v => (
                                            <div key={v.id} onClick={() => setPlaying(v)} style={{ cursor: "pointer", flexShrink: 0, width: 140 }}>
                                                <img src={v.thumbnail} alt={v.title} style={{ width: "100%", borderRadius: 6, marginBottom: 4, aspectRatio: "16/9", objectFit: "cover" }} />
                                                <p style={{ fontSize: 11, fontWeight: 600, color: "#1a3a1f", lineHeight: 1.3 }}>{v.title}</p>
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
    );
}