import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../services/api.js";

// ── Quiz Component ────────────────────────────────────────────
function Quiz({ questions, moduleId, pathId, onComplete }) {
    const [answers, setAnswers]  = useState({});
    const [submitted, setSubmit] = useState(false);
    const [score, setScore]      = useState(0);

    const handleAnswer = (qIdx, optIdx) => {
        if (submitted) return;
        setAnswers({ ...answers, [qIdx]: optIdx });
    };

    const handleSubmit = async () => {
        let correct = 0;
        questions.forEach((q, i) => {
            if (answers[i] === q.correctIndex) correct++;
        });
        const finalScore = Math.round((correct / questions.length) * 100);
        setScore(finalScore);
        setSubmit(true);

        if (finalScore >= 70) {
            try {
                await API.post(`/learningpath/${pathId}/progress`, { moduleId });
                onComplete(moduleId);
            } catch (err) { console.error(err); }
        }
    };

    const passed = score >= 70;

    return (
        <div style={{ marginTop: 24, background: "#f8fdf8", borderRadius: 12, padding: 20, border: "1px solid #d1fae5" }}>
            <h3 style={{ fontWeight: 700, color: "#1a3a1f", marginBottom: 4, fontSize: 15 }}>📝 Quiz Modul</h3>
            <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 16 }}>
                ⚠️ Kamu harus lulus quiz ini (min. 70) untuk membuka modul berikutnya.
            </p>

            {questions.map((q, i) => (
                <div key={q.id} style={{ marginBottom: 20 }}>
                    <p style={{ fontWeight: 600, fontSize: 14, color: "#1a3a1f", marginBottom: 10 }}>
                        {i + 1}. {q.question}
                    </p>
                    {q.options?.map((opt, j) => {
                        let bg = "white", border = "1px solid #e5e7eb", color = "#374151";
                        if (submitted) {
                            if (j === q.correctIndex)            { bg = "#dcfce7"; border = "1px solid #86efac"; color = "#166534"; }
                            else if (answers[i] === j)           { bg = "#fee2e2"; border = "1px solid #fca5a5"; color = "#991b1b"; }
                        } else if (answers[i] === j) {
                            bg = "#e8fce0"; border = "1px solid #9FF782"; color = "#1a3a1f";
                        }
                        return (
                            <div key={j} onClick={() => handleAnswer(i, j)}
                                style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 8, marginBottom: 6, background: bg, border, color, cursor: submitted ? "default" : "pointer", transition: "all 0.15s" }}>
                                <span style={{ width: 22, height: 22, borderRadius: "50%", border: `1px solid ${color}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                                    {String.fromCharCode(65 + j)}
                                </span>
                                <span style={{ fontSize: 13 }}>{opt}</span>
                                {submitted && j === q.correctIndex && <span style={{ marginLeft: "auto", fontSize: 12, fontWeight: 700 }}>✓</span>}
                            </div>
                        );
                    })}
                </div>
            ))}

            {!submitted ? (
                <button
                    onClick={handleSubmit}
                    disabled={Object.keys(answers).length < questions.length}
                    style={{ width: "100%", background: Object.keys(answers).length < questions.length ? "#e5e7eb" : "#1a3a1f", color: Object.keys(answers).length < questions.length ? "#9ca3af" : "#9FF782", border: "none", borderRadius: 8, padding: "12px", fontSize: 14, fontWeight: 600, cursor: Object.keys(answers).length < questions.length ? "not-allowed" : "pointer", fontFamily: "Plus Jakarta Sans, sans-serif", transition: "all 0.2s" }}>
                    Kumpulkan Jawaban ({Object.keys(answers).length}/{questions.length})
                </button>
            ) : (
                <div style={{ textAlign: "center", padding: 16, background: passed ? "#dcfce7" : "#fee2e2", borderRadius: 10 }}>
                    <p style={{ fontSize: 28, marginBottom: 6 }}>{passed ? "🎉" : "😔"}</p>
                    <p style={{ fontWeight: 700, fontSize: 18, color: passed ? "#166534" : "#991b1b" }}>
                        Nilai: {score}/100
                    </p>
                    <p style={{ fontSize: 13, color: passed ? "#166534" : "#991b1b", marginTop: 4 }}>
                        {passed
                            ? "Selamat! Modul berikutnya sekarang terbuka. 🔓"
                            : "Nilai minimal 70. Pelajari lagi materinya dan coba lagi!"}
                    </p>
                    {!passed && (
                        <button
                            onClick={() => { setAnswers({}); setSubmit(false); setScore(0); }}
                            style={{ marginTop: 12, background: "#1a3a1f", color: "#9FF782", border: "none", borderRadius: 8, padding: "8px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "Plus Jakarta Sans, sans-serif" }}>
                            Coba Lagi
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

// ── Main Detail Page ──────────────────────────────────────────
export default function LearningPathDetail() {
    const { pathId }                = useParams();
    const navigate                  = useNavigate();
    const [path, setPath]           = useState(null);
    const [loading, setLoading]     = useState(true);
    const [activeModule, setActive] = useState(null);
    const [completed, setCompleted] = useState([]);
    const [lockedMsg, setLockedMsg] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [pathRes, progressRes] = await Promise.all([
                    API.get(`/learningpath/${pathId}`),
                    API.get(`/learningpath/${pathId}/progress`),
                ]);
                setPath(pathRes.data);
                setCompleted(progressRes.data.completedModules || []);
                if (pathRes.data.modules?.length > 0) {
                    setActive(pathRes.data.modules[0]);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [pathId]);

    const handleComplete = moduleId => {
        setCompleted(prev => [...new Set([...prev, moduleId])]);
    };

    // ── A module is unlocked if it's the first OR the previous is completed ──
    const isUnlocked = (index) => {
        if (index === 0) return true;
        const prevModule = path.modules[index - 1];
        return completed.includes(prevModule.id);
    };

    const handleModuleClick = (mod, index) => {
        if (!isUnlocked(index)) {
            setLockedMsg(`Selesaikan modul "${path.modules[index - 1].title}" terlebih dahulu.`);
            setTimeout(() => setLockedMsg(null), 3000);
            return;
        }
        setLockedMsg(null);
        setActive(mod);
    };

    if (loading) return (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Plus Jakarta Sans, sans-serif", color: "#9ca3af" }}>
            Loading...
        </div>
    );

    if (!path) return (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Plus Jakarta Sans, sans-serif" }}>
            <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: 40, marginBottom: 10 }}>😕</p>
                <p>Learning path tidak ditemukan.</p>
                <button onClick={() => navigate("/learning")} style={{ marginTop: 12, background: "#9FF782", color: "#0a1f10", border: "none", borderRadius: 8, padding: "8px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                    ← Kembali
                </button>
            </div>
        </div>
    );

    const totalModules   = path.modules?.length || 0;
    const totalCompleted = completed.length;
    const progress       = totalModules > 0 ? Math.round((totalCompleted / totalModules) * 100) : 0;
    const isFinished     = progress === 100;

    return (
        <div style={{ minHeight: "100vh", background: "#f0f4f0", fontFamily: "Plus Jakarta Sans, sans-serif" }}>
            <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');`}</style>

            {/* Topbar */}
            <nav style={{ background: "linear-gradient(90deg, #1a3a1f, #0f2a18)", padding: "12px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <button onClick={() => navigate("/learning")}
                    style={{ background: "none", border: "none", color: "#9FF782", fontSize: 14, cursor: "pointer", fontFamily: "Plus Jakarta Sans, sans-serif", fontWeight: 600 }}>
                    ← Learning Path
                </button>
                <span style={{ color: "white", fontSize: 13, fontWeight: 500, flex: 1, textAlign: "center", margin: "0 16px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{path.title}</span>
                <span style={{ color: "#9FF782", fontSize: 13, fontWeight: 600, whiteSpace: "nowrap" }}>{progress}% selesai</span>
            </nav>

            <div style={{ display: "flex", height: "calc(100vh - 48px)" }}>

                {/* ── SIDEBAR: Module List ─────────────────── */}
                <aside style={{ width: 280, background: "white", borderRight: "1px solid #f3f4f6", overflowY: "auto", flexShrink: 0, display: "flex", flexDirection: "column" }}>

                    {/* Path Info + Progress */}
                    <div style={{ padding: 16, borderBottom: "1px solid #f3f4f6" }}>
                        <h2 style={{ fontWeight: 700, fontSize: 14, color: "#1a3a1f", marginBottom: 8 }}>{path.title}</h2>
                        <div style={{ background: "#f3f4f6", borderRadius: 4, height: 6, marginBottom: 6 }}>
                            <div style={{ width: `${progress}%`, height: 6, borderRadius: 4, background: isFinished ? "#9FF782" : "#1a3a1f", transition: "width 0.4s ease" }} />
                        </div>
                        <p style={{ fontSize: 11, color: "#9ca3af" }}>{totalCompleted}/{totalModules} modul selesai</p>
                    </div>

                    {/* Lock toast */}
                    {lockedMsg && (
                        <div style={{ margin: "8px 12px", background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: 8, padding: "10px 12px", fontSize: 12, color: "#991b1b", display: "flex", alignItems: "center", gap: 6 }}>
                            🔒 {lockedMsg}
                        </div>
                    )}

                    {/* Module Items */}
                    <div style={{ padding: "8px 0", flex: 1 }}>
                        {path.modules?.map((mod, i) => {
                            const isDone     = completed.includes(mod.id);
                            const isActive   = activeModule?.id === mod.id;
                            const unlocked   = isUnlocked(i);
                            const hasQuiz    = mod.quiz?.length > 0;

                            return (
                                <div key={mod.id}
                                    onClick={() => handleModuleClick(mod, i)}
                                    style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", cursor: unlocked ? "pointer" : "not-allowed", background: isActive ? "#e8fce0" : "transparent", borderLeft: isActive ? "3px solid #1a3a1f" : "3px solid transparent", opacity: unlocked ? 1 : 0.55, transition: "all 0.15s" }}>

                                    {/* Status icon */}
                                    <div style={{ width: 26, height: 26, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: unlocked ? 11 : 13, fontWeight: 700, background: isDone ? "#1a3a1f" : unlocked ? (isActive ? "#e8fce0" : "#f3f4f6") : "#f3f4f6", border: isDone ? "none" : `2px solid ${isActive ? "#1a3a1f" : "#d1d5db"}`, color: isDone ? "#9FF782" : unlocked ? (isActive ? "#1a3a1f" : "#9ca3af") : "#d1d5db" }}>
                                        {isDone ? "✓" : !unlocked ? "🔒" : i + 1}
                                    </div>

                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <p style={{ fontSize: 13, fontWeight: isActive ? 600 : 500, color: unlocked ? (isActive ? "#1a3a1f" : "#374151") : "#9ca3af", lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                            {mod.title}
                                        </p>
                                        <p style={{ fontSize: 10, marginTop: 2, color: isDone ? "#9FF782" : !unlocked ? "#d1d5db" : "#9ca3af" }}>
                                            {isDone ? "✓ Selesai" : !unlocked ? "🔒 Terkunci" : hasQuiz ? "📝 Ada quiz" : "📄 Baca materi"}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Completion Banner */}
                    {isFinished && (
                        <div style={{ margin: 12, background: "linear-gradient(135deg, #1a3a1f, #0f2a18)", borderRadius: 10, padding: 14, textAlign: "center" }}>
                            <p style={{ fontSize: 20, marginBottom: 6 }}>🏆</p>
                            <p style={{ color: "#9FF782", fontWeight: 700, fontSize: 13 }}>Path Selesai!</p>
                            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 11, marginTop: 4 }}>Kamu telah menyelesaikan semua modul</p>
                        </div>
                    )}
                </aside>

                {/* ── MAIN: Module Content ─────────────────── */}
                <main style={{ flex: 1, overflowY: "auto", padding: 32 }}>
                    {activeModule ? (
                        <div style={{ maxWidth: 720, margin: "0 auto" }}>

                            {/* Module Header */}
                            <div style={{ marginBottom: 24 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                                    <div style={{ width: 28, height: 28, borderRadius: "50%", background: completed.includes(activeModule.id) ? "#1a3a1f" : "#e5e7eb", color: completed.includes(activeModule.id) ? "#9FF782" : "#9ca3af", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700 }}>
                                        {completed.includes(activeModule.id) ? "✓" : activeModule.order}
                                    </div>
                                    <span style={{ fontSize: 12, color: "#9ca3af", fontWeight: 500 }}>Modul {activeModule.order}</span>
                                    {completed.includes(activeModule.id) && (
                                        <span style={{ fontSize: 11, fontWeight: 600, color: "#166534", background: "#dcfce7", padding: "2px 8px", borderRadius: 20 }}>✓ Selesai</span>
                                    )}
                                </div>
                                <h1 style={{ fontWeight: 700, fontSize: 22, color: "#1a3a1f", lineHeight: 1.3 }}>{activeModule.title}</h1>
                            </div>

                            <div style={{ height: 1, background: "#f3f4f6", marginBottom: 24 }} />

                            {/* Content */}
                            <div style={{ fontSize: 15, color: "#374151", lineHeight: 1.9, whiteSpace: "pre-wrap", marginBottom: 32 }}>
                                {activeModule.content}
                            </div>

                            {/* Quiz — REQUIRED to unlock next */}
                            {activeModule.quiz?.length > 0 && !completed.includes(activeModule.id) && (
                                <Quiz
                                    questions={activeModule.quiz}
                                    moduleId={activeModule.id}
                                    pathId={pathId}
                                    onComplete={handleComplete}
                                />
                            )}

                            {/* Already passed quiz */}
                            {activeModule.quiz?.length > 0 && completed.includes(activeModule.id) && (
                                <div style={{ background: "#dcfce7", borderRadius: 10, padding: "14px 18px", display: "flex", alignItems: "center", gap: 10 }}>
                                    <span style={{ fontSize: 20 }}>✅</span>
                                    <p style={{ fontSize: 13, fontWeight: 600, color: "#166534" }}>Quiz sudah lulus! Modul berikutnya terbuka.</p>
                                </div>
                            )}

                            {/* No quiz — manual complete button */}
                            {(!activeModule.quiz || activeModule.quiz.length === 0) && !completed.includes(activeModule.id) && (
                                <button
                                    onClick={async () => {
                                        try {
                                            await API.post(`/learningpath/${pathId}/progress`, { moduleId: activeModule.id });
                                            handleComplete(activeModule.id);
                                        } catch (err) { console.error(err); }
                                    }}
                                    style={{ background: "#1a3a1f", color: "#9FF782", border: "none", borderRadius: 10, padding: "14px 28px", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "Plus Jakarta Sans, sans-serif", width: "100%" }}>
                                    ✓ Tandai Selesai & Lanjut
                                </button>
                            )}

                            {/* Next module button — only if completed */}
                            {completed.includes(activeModule.id) && (() => {
                                const currentIdx = path.modules.findIndex(m => m.id === activeModule.id);
                                const nextModule = path.modules[currentIdx + 1];
                                return nextModule ? (
                                    <button onClick={() => setActive(nextModule)}
                                        style={{ marginTop: 16, background: "#9FF782", color: "#0a1f10", border: "none", borderRadius: 10, padding: "14px 28px", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "Plus Jakarta Sans, sans-serif", width: "100%" }}>
                                        Modul Berikutnya: {nextModule.title} →
                                    </button>
                                ) : null;
                            })()}
                        </div>
                    ) : (
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#9ca3af" }}>
                            <p>Pilih modul untuk mulai belajar</p>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}