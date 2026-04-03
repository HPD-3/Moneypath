import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth, signOut } from "firebase/auth";
import API from "../services/api.js";

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

// ── Nav Card ──────────────────────────────────────────────────
function NavCard({ icon, label, sub, onClick, accent = "#9FF782", dark = false }) {
    const [hovered, setHovered] = useState(false);
    return (
        <div
            onClick={onClick}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                background: dark
                    ? `linear-gradient(135deg, #1a3a1f, #0f2a18)`
                    : "white",
                borderRadius: 16,
                padding: "18px 20px",
                cursor: "pointer",
                border: dark ? "none" : "1px solid #f0f0f0",
                boxShadow: hovered
                    ? "0 8px 24px rgba(15,42,24,0.15)"
                    : "0 2px 8px rgba(0,0,0,0.05)",
                transform: hovered ? "translateY(-3px)" : "none",
                transition: "all 0.2s ease",
                display: "flex",
                flexDirection: "column",
                gap: 12,
                minHeight: 110,
            }}>
            <span style={{ fontSize: 26 }}>{icon}</span>
            <div>
                <p style={{ fontWeight: 700, fontSize: 14, color: dark ? "#9FF782" : "#1a3a1f", marginBottom: 2 }}>{label}</p>
                {sub && <p style={{ fontSize: 11, color: dark ? "rgba(255,255,255,0.5)" : "#9ca3af" }}>{sub}</p>}
            </div>
        </div>
    );
}

// ── EXP Bar ───────────────────────────────────────────────────
function ExpBar({ totalExp = 0, level, streak = 0 }) {
    const { currentExp, expToNext, progress } = calcLevel(totalExp);
    return (
        <div style={{ background: "linear-gradient(135deg, #1a3a1f 0%, #0f2a18 100%)", borderRadius: 20, padding: "20px 24px", color: "white", position: "relative", overflow: "hidden" }}>
            {/* Decorative circle */}
            <div style={{ position: "absolute", right: -30, top: -30, width: 120, height: 120, borderRadius: "50%", background: "rgba(159,247,130,0.07)" }} />
            <div style={{ position: "absolute", right: 20, top: 20, width: 60, height: 60, borderRadius: "50%", background: "rgba(159,247,130,0.05)" }} />

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, position: "relative" }}>
                <div>
                    <p style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 4 }}>Level kamu</p>
                    <p style={{ fontSize: 40, fontWeight: 800, color: "#9FF782", lineHeight: 1 }}>Lv.{level}</p>
                    <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 4 }}>{totalExp} total EXP</p>
                </div>
                <div style={{ textAlign: "center", background: "rgba(255,255,255,0.06)", borderRadius: 12, padding: "10px 14px" }}>
                    <p style={{ fontSize: 22 }}>🔥</p>
                    <p style={{ fontSize: 18, fontWeight: 700, color: "#9FF782", lineHeight: 1.1 }}>{streak}</p>
                    <p style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>Streak</p>
                </div>
            </div>

            <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 6 }}>
                    <span>{currentExp} / {expToNext} EXP</span>
                    <span>Level {level + 1}</span>
                </div>
                <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: 6, height: 8, overflow: "hidden" }}>
                    <div style={{ width: `${progress}%`, height: "100%", borderRadius: 6, background: "linear-gradient(90deg, #9FF782, #5dd672)", transition: "width 0.8s ease" }} />
                </div>
            </div>
        </div>
    );
}

// ── Daily Quiz Banner ─────────────────────────────────────────
function DailyQuizBanner({ completed, score, onClick }) {
    return (
        <div onClick={onClick} style={{ background: completed ? "#f0fdf4" : "linear-gradient(135deg, #fef9c3, #fef3c7)", borderRadius: 14, padding: "14px 18px", border: completed ? "1px solid #bbf7d0" : "1px solid #fde68a", cursor: "pointer", display: "flex", alignItems: "center", gap: 14, transition: "transform 0.2s" }}
            onMouseEnter={e => e.currentTarget.style.transform = "scale(1.01)"}
            onMouseLeave={e => e.currentTarget.style.transform = "none"}>
            <span style={{ fontSize: 28, flexShrink: 0 }}>{completed ? "✅" : "🧠"}</span>
            <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 700, fontSize: 13, color: completed ? "#166534" : "#92400e", marginBottom: 2 }}>
                    {completed ? "Daily Quiz Selesai!" : "Daily Quiz Tersedia!"}
                </p>
                <p style={{ fontSize: 11, color: completed ? "#4ade80" : "#b45309" }}>
                    {completed ? `Nilai hari ini: ${score} • Kembali besok` : "Dapatkan +50 EXP + Streak bonus"}
                </p>
            </div>
            {!completed && (
                <div style={{ background: "#1a3a1f", color: "#9FF782", borderRadius: 8, padding: "6px 14px", fontSize: 12, fontWeight: 600, flexShrink: 0 }}>
                    Mulai →
                </div>
            )}
        </div>
    );
}

// ── Main Dashboard ────────────────────────────────────────────
export default function Dashboard() {
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [personal, setPersonal] = useState(null);
    const [quizStats, setQuizStats] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);

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
        await signOut(getAuth());
        navigate("/");
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
        <div style={{ minHeight: "100vh", background: "#f0f4f0", fontFamily: "Plus Jakarta Sans, sans-serif" }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Lilita+One&display=swap');
                * { box-sizing: border-box; margin: 0; padding: 0; }
                body { background: #f0f4f0; }
            `}</style>

            {/* ── NAVBAR ──────────────────────────────────── */}
            <nav style={{ background: "linear-gradient(90deg, #1a3a1f, #0f2a18)", padding: "12px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, zIndex: 50 }}>
                <span style={{ fontFamily: "Lilita One, cursive", color: "#9FF782", fontSize: 20, letterSpacing: 1 }}>MoneyPath</span>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    {profile?.role === "admin" && (
                        <button onClick={() => navigate("/admin")}
                            style={{ background: "rgba(159,247,130,0.15)", color: "#9FF782", border: "1px solid rgba(159,247,130,0.3)", borderRadius: 8, padding: "6px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "Plus Jakarta Sans, sans-serif" }}>
                            🛠 Admin
                        </button>
                    )}
                    <button onClick={() => navigate("/profile")}
                        style={{ width: 34, height: 34, borderRadius: "50%", background: "#9FF782", color: "#0a1f10", border: "none", cursor: "pointer", fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {(personal?.name || profile?.email || "U")[0].toUpperCase()}
                    </button>
                </div>
            </nav>

            <div style={{ maxWidth: 480, margin: "0 auto", padding: "20px 16px 40px" }}>

                {/* ── GREETING ──────────────────────────── */}
                <div style={{ marginBottom: 20 }}>
                    <p style={{ fontSize: 13, color: "#9ca3af", marginBottom: 2 }}>{greeting()},</p>
                    <h1 style={{ fontSize: 24, fontWeight: 800, color: "#1a3a1f" }}>
                        {personal?.name?.split(" ")[0] || "Pengguna"} 👋
                    </h1>
                </div>

                {/* ── EXP / LEVEL CARD ──────────────────── */}
                <div style={{ marginBottom: 16 }}>
                    <ExpBar
                        totalExp={quizStats?.totalExp || 0}
                        level={quizStats?.level || 1}
                        streak={quizStats?.streak || 0}
                    />
                </div>

                {/* ── DAILY QUIZ BANNER ─────────────────── */}
                <div style={{ marginBottom: 24 }}>
                    <DailyQuizBanner
                        completed={quizStats?.completedToday}
                        score={quizStats?.todayScore}
                        onClick={() => navigate("/quiz")}
                    />
                </div>

                {/* ── MENU GRID ─────────────────────────── */}
                <p style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 12 }}>Menu Utama</p>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
                    <NavCard icon="💰" label="Saldo Saya" sub="Kelola keuangan" onClick={() => navigate("/balance")} />
                    <NavCard icon="📹" label="Video Edukasi" sub="Tonton & belajar" onClick={() => navigate("/video")} />
                    <NavCard icon="📚" label="Learning Path" sub="Belajar terstruktur" onClick={() => navigate("/learning")} dark />
                    <NavCard icon="🧠" label="Daily Quiz" sub={quizStats?.completedToday ? "✓ Selesai hari ini" : "Belum dimainkan"} onClick={() => navigate("/quiz")} />
                    <NavCard icon="🐷" label="Tabungan" sub="Kelola target menabung" onClick={() => navigate("/tabungan")} />
                    <NavCard icon="📊" label="Rekap" sub="Rekap Bulanan" onClick={() => navigate("/rekap")} />
                    <NavCard icon="👥" label="Shared Balance" sub="Shared Balance" onClick={() => navigate("/sharedbalance")} />
                    <NavCard icon="🤝" label="Saldo Bersama" sub="Kelola keuangan bareng" onClick={() => navigate("/shared-balance")} />
                </div>

                {/* ── QUICK STATS ───────────────────────── */}
                <p style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 12 }}>Statistik Kamu</p>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 24 }}>
                    {[
                        { label: "Level", value: `Lv.${quizStats?.level || 1}`, icon: "⚡" },
                        { label: "Streak", value: `${quizStats?.streak || 0} hari`, icon: "🔥" },
                        { label: "Max Streak", value: `${quizStats?.maxStreak || 0} hari`, icon: "🏆" },
                    ].map((s, i) => (
                        <div key={i} style={{ background: "white", borderRadius: 12, padding: "14px 12px", textAlign: "center", border: "1px solid #f0f0f0" }}>
                            <p style={{ fontSize: 18, marginBottom: 4 }}>{s.icon}</p>
                            <p style={{ fontSize: 16, fontWeight: 800, color: "#1a3a1f" }}>{s.value}</p>
                            <p style={{ fontSize: 10, color: "#9ca3af", marginTop: 2 }}>{s.label}</p>
                        </div>
                    ))}
                </div>

                {/* ── PROFILE SNIPPET ───────────────────── */}
                {personal && (
                    <div style={{ background: "white", borderRadius: 16, padding: "16px 20px", border: "1px solid #f0f0f0", marginBottom: 20 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                            <p style={{ fontWeight: 700, fontSize: 13, color: "#1a3a1f" }}>👤 Profil Saya</p>
                            <button onClick={() => navigate("/profile")}
                                style={{ fontSize: 11, color: "#9FF782", background: "none", border: "none", cursor: "pointer", fontWeight: 600, fontFamily: "Plus Jakarta Sans, sans-serif" }}>
                                Edit →
                            </button>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                            {[
                                { label: "Nama", value: personal.name },
                                { label: "Gender", value: personal.gender },
                                { label: "No HP", value: personal.phoneNumber },
                                { label: "Alamat", value: personal.address },
                            ].map((f, i) => (
                                <div key={i}>
                                    <p style={{ fontSize: 10, color: "#9ca3af", marginBottom: 2 }}>{f.label}</p>
                                    <p style={{ fontSize: 12, fontWeight: 600, color: "#374151", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.value || "—"}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── LOGOUT ────────────────────────────── */}
                <button onClick={handleLogout}
                    style={{ width: "100%", background: "none", border: "1px solid #e5e7eb", borderRadius: 12, padding: "12px", fontSize: 13, fontWeight: 600, color: "#9ca3af", cursor: "pointer", fontFamily: "Plus Jakarta Sans, sans-serif", transition: "all 0.2s" }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = "#fca5a5"; e.currentTarget.style.color = "#ef4444"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = "#e5e7eb"; e.currentTarget.style.color = "#9ca3af"; }}>
                    ⬅ Logout
                </button>
            </div>
        </div>
    );
}