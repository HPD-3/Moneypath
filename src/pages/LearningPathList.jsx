import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api.js";

const CATEGORIES = ["semua", "budgeting", "investing", "saving", "debt"];
const DIFF_COLORS = {
    beginner:     { bg: "#dcfce7", color: "#166534" },
    intermediate: { bg: "#fef9c3", color: "#854d0e" },
    advanced:     { bg: "#fee2e2", color: "#991b1b" },
};

function PathCard({ path, onClick }) {
    return (
        <div onClick={() => onClick(path.id)}
            style={{ background: "white", borderRadius: 14, padding: 20, cursor: "pointer", boxShadow: "0 1px 6px rgba(0,0,0,0.07)", border: "1px solid #f3f4f6", transition: "transform 0.2s, box-shadow 0.2s" }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.1)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 1px 6px rgba(0,0,0,0.07)"; }}>

            {/* Icon */}
            <div style={{ width: 48, height: 48, borderRadius: 12, background: "linear-gradient(135deg, #1a3a1f, #0f2a18)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, marginBottom: 14 }}>
                {path.category === "budgeting" ? "📊" : path.category === "investing" ? "📈" : path.category === "saving" ? "🐷" : "💳"}
            </div>

            {/* Badges */}
            <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
                <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 20, background: "#e8fce0", color: "#166534", textTransform: "capitalize" }}>
                    {path.category}
                </span>
                <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 20, background: DIFF_COLORS[path.difficulty]?.bg, color: DIFF_COLORS[path.difficulty]?.color, textTransform: "capitalize" }}>
                    {path.difficulty}
                </span>
            </div>

            <h3 style={{ fontWeight: 700, fontSize: 15, color: "#1a3a1f", marginBottom: 8, lineHeight: 1.4 }}>{path.title}</h3>
            <p style={{ fontSize: 12, color: "#9ca3af", lineHeight: 1.6, marginBottom: 14, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                {path.description}
            </p>

            {/* Footer */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 12, borderTop: "1px solid #f3f4f6" }}>
                <div style={{ display: "flex", gap: 12, fontSize: 11, color: "#6b7280" }}>
                    <span>📦 {path.totalModules || 0} modul</span>
                    {path.estimatedTime && <span>⏱ {path.estimatedTime}</span>}
                </div>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#1a3a1f" }}>Mulai →</span>
            </div>
        </div>
    );
}

export default function LearningPathList() {
    const navigate                    = useNavigate();
    const [paths, setPaths]           = useState([]);
    const [loading, setLoading]       = useState(true);
    const [activeCategory, setActive] = useState("semua");

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

    const filtered = paths.filter(p =>
        activeCategory === "semua" || p.category === activeCategory
    );

    return (
        <div style={{ minHeight: "100vh", background: "#f0f4f0", fontFamily: "Plus Jakarta Sans, sans-serif" }}>
            <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');`}</style>

            {/* Navbar */}
            <nav style={{ background: "linear-gradient(90deg, #1a3a1f, #0f2a18)", padding: "12px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: 700, color: "#9FF782", fontSize: 18 }}>MoneyPath</span>
                <button onClick={() => navigate("/dashboard")}
                    style={{ background: "#9FF782", color: "#0a1f10", border: "none", borderRadius: 8, padding: "7px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "Plus Jakarta Sans, sans-serif" }}>
                    ← Dashboard
                </button>
            </nav>

            {/* Hero */}
            <div style={{ background: "linear-gradient(135deg, #1a3a1f, #0f2a18)", padding: "36px 24px", textAlign: "center" }}>
                <h1 style={{ color: "#9FF782", fontSize: 28, fontWeight: 700, marginBottom: 8 }}>📚 Learning Path</h1>
                <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 14 }}>
                    Belajar finansial secara terstruktur seperti kursus profesional
                </p>
            </div>

            {/* Category Filter */}
            <div style={{ padding: "16px 24px", display: "flex", gap: 8, overflowX: "auto", background: "white", borderBottom: "1px solid #f3f4f6" }}>
                {CATEGORIES.map(cat => (
                    <button key={cat} onClick={() => setActive(cat)}
                        style={{ padding: "6px 16px", borderRadius: 20, border: "none", fontSize: 13, fontWeight: 500, cursor: "pointer", textTransform: "capitalize", whiteSpace: "nowrap", fontFamily: "Plus Jakarta Sans, sans-serif", background: activeCategory === cat ? "#1a3a1f" : "#f3f4f6", color: activeCategory === cat ? "#9FF782" : "#6b7280", transition: "all 0.2s" }}>
                        {cat}
                    </button>
                ))}
                <span style={{ marginLeft: "auto", fontSize: 12, color: "#9ca3af", alignSelf: "center", whiteSpace: "nowrap" }}>
                    {filtered.length} path
                </span>
            </div>

            {/* Grid */}
            <div style={{ padding: 24 }}>
                {loading ? (
                    <div style={{ textAlign: "center", padding: 60, color: "#9ca3af" }}>Loading...</div>
                ) : filtered.length === 0 ? (
                    <div style={{ textAlign: "center", padding: 60, color: "#9ca3af" }}>
                        <p style={{ fontSize: 40, marginBottom: 10 }}>📚</p>
                        <p>Belum ada learning path tersedia.</p>
                    </div>
                ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
                        {filtered.map(p => <PathCard key={p.id} path={p} onClick={id => navigate(`/learning/${id}`)} />)}
                    </div>
                )}
            </div>
        </div>
    );
}