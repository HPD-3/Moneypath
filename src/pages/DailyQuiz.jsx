import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api.js";
import Navbar from "../components/Navbar.jsx";
import Sidebar from "../components/Sidebar.jsx";

function calcLevel(totalExp) {
    const level = Math.floor(totalExp / 100) + 1;
    const currentExp = totalExp % 100;
    return { level, currentExp, expToNext: 100, progress: currentExp };
}

// ── Level Badge ───────────────────────────────────────────────
function LevelBadge({ level, totalExp, streak }) {
    const { currentExp, expToNext, progress } = calcLevel(totalExp);
    return (
        <div style={{ background: "linear-gradient(135deg, #1a3a1f, #0f2a18)", borderRadius: 16, padding: 20, color: "white", marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div>
                    <p style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginBottom: 4, textTransform: "uppercase", letterSpacing: 1 }}>Level kamu</p>
                    <p style={{ fontSize: 36, fontWeight: 700, color: "#9FF782", lineHeight: 1 }}>Lv. {level}</p>
                    <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 4 }}>{totalExp} total EXP</p>
                </div>
                <div style={{ textAlign: "center" }}>
                    <p style={{ fontSize: 28 }}>🔥</p>
                    <p style={{ fontSize: 20, fontWeight: 700, color: "#9FF782" }}>{streak}</p>
                    <p style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>Hari streak</p>
                </div>
            </div>
            <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "rgba(255,255,255,0.5)", marginBottom: 6 }}>
                    <span>{currentExp} / {expToNext} EXP</span>
                    <span>Level {level + 1}</span>
                </div>
                <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: 4, height: 8 }}>
                    <div style={{ width: `${progress}%`, height: 8, borderRadius: 4, background: "#9FF782", transition: "width 0.5s ease" }} />
                </div>
            </div>
        </div>
    );
}

// ── Question Card ─────────────────────────────────────────────
function QuestionCard({ question, index, total, selectedAnswer, onAnswer, submitted, correctIndex }) {
    return (
        <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <span style={{ fontSize: 12, color: "#9ca3af", fontWeight: 500 }}>Soal {index + 1} dari {total}</span>
                <div style={{ display: "flex", gap: 4 }}>
                    {Array.from({ length: total }).map((_, i) => (
                        <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: i === index ? "#1a3a1f" : i < index ? "#9FF782" : "#e5e7eb" }} />
                    ))}
                </div>
            </div>

            <h3 style={{ fontWeight: 700, fontSize: 16, color: "#1a3a1f", marginBottom: 20, lineHeight: 1.5 }}>{question.question}</h3>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {question.options?.map((opt, j) => {
                    let bg = "white", border = "1px solid #e5e7eb", color = "#374151";
                    if (submitted) {
                        if (j === correctIndex) { bg = "#dcfce7"; border = "1px solid #86efac"; color = "#166534"; }
                        else if (selectedAnswer === j) { bg = "#fee2e2"; border = "1px solid #fca5a5"; color = "#991b1b"; }
                    } else if (selectedAnswer === j) {
                        bg = "#e8fce0"; border = "2px solid #1a3a1f"; color = "#1a3a1f";
                    }
                    return (
                        <div key={j} onClick={() => !submitted && onAnswer(j)}
                            style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderRadius: 10, background: bg, border, color, cursor: submitted ? "default" : "pointer", transition: "all 0.15s" }}>
                            <span style={{ width: 28, height: 28, borderRadius: "50%", border: `1.5px solid ${color}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                                {String.fromCharCode(65 + j)}
                            </span>
                            <span style={{ fontSize: 14 }}>{opt}</span>
                            {submitted && j === correctIndex && <span style={{ marginLeft: "auto", fontWeight: 700, fontSize: 13 }}>✓</span>}
                            {submitted && selectedAnswer === j && j !== correctIndex && <span style={{ marginLeft: "auto", fontWeight: 700, fontSize: 13 }}>✗</span>}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ── Result Screen ─────────────────────────────────────────────
function ResultScreen({ score, correct, total, expEarned, streak, levelUp, newLevel, onClose }) {
    const passed = score >= 60;
    return (
        <div style={{ textAlign: "center", padding: "20px 0" }}>
            <p style={{ fontSize: 52, marginBottom: 12 }}>{passed ? "🎉" : "😔"}</p>
            <h2 style={{ fontWeight: 700, fontSize: 24, color: "#1a3a1f", marginBottom: 4 }}>
                {passed ? "Luar Biasa!" : "Jangan Menyerah!"}
            </h2>
            <p style={{ color: "#6b7280", fontSize: 14, marginBottom: 24 }}>
                {passed ? "Kamu berhasil menyelesaikan daily quiz!" : "Coba lagi besok ya!"}
            </p>

            {/* Score */}
            <div style={{ background: passed ? "#f0fdf4" : "#fef2f2", borderRadius: 12, padding: 20, marginBottom: 16 }}>
                <p style={{ fontSize: 48, fontWeight: 800, color: passed ? "#166534" : "#991b1b" }}>{score}</p>
                <p style={{ fontSize: 13, color: "#6b7280" }}>{correct} benar dari {total} soal</p>
            </div>

            {/* EXP gained */}
            {expEarned > 0 && (
                <div style={{ background: "#1a3a1f", borderRadius: 12, padding: 16, marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
                    <span style={{ fontSize: 24 }}>⚡</span>
                    <div style={{ textAlign: "left" }}>
                        <p style={{ color: "#9FF782", fontWeight: 700, fontSize: 18 }}>+{expEarned} EXP</p>
                        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 11 }}>
                            Daily Quiz (+50) {streak > 1 ? `+ Streak Bonus (+10)` : ""}
                        </p>
                    </div>
                </div>
            )}

            {/* Streak */}
            {passed && streak > 0 && (
                <div style={{ background: "#fff7ed", borderRadius: 12, padding: 16, marginBottom: 16, display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontSize: 28 }}>🔥</span>
                    <div style={{ textAlign: "left" }}>
                        <p style={{ color: "#c2410c", fontWeight: 700 }}>{streak} Hari Beruntun!</p>
                        <p style={{ color: "#9a3412", fontSize: 12 }}>{streak > 1 ? `+10 Streak Bonus EXP!` : "Mulai streak kamu!"}</p>
                    </div>
                </div>
            )}

            {/* Level Up */}
            {levelUp && (
                <div style={{ background: "linear-gradient(135deg, #1a3a1f, #0f2a18)", borderRadius: 12, padding: 16, marginBottom: 16, textAlign: "center" }}>
                    <p style={{ fontSize: 28, marginBottom: 4 }}>🆙</p>
                    <p style={{ color: "#9FF782", fontWeight: 700, fontSize: 18 }}>Level Up! Sekarang Level {newLevel}</p>
                </div>
            )}

            <button onClick={onClose}
                style={{ width: "100%", background: "#1a3a1f", color: "#9FF782", border: "none", borderRadius: 10, padding: "14px", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "Plus Jakarta Sans, sans-serif" }}>
                Kembali ke Dashboard
            </button>
        </div>
    );
}

// ── Main Daily Quiz Page ──────────────────────────────────────
export default function DailyQuiz() {
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [currentQ, setCurrentQ] = useState(0);
    const [answers, setAnswers] = useState({});
    const [currentAnswer, setCurrent] = useState(null);
    const [submitted, setSubmitted] = useState(false);
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(true);
    const [phase, setPhase] = useState("stats"); // stats | quiz | result
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [active, setActive] = useState("quiz");
    const [profile, setProfile] = useState(null);
    const [personal, setPersonal] = useState(null);

    useEffect(() => {
        const fetchAll = async () => {
            try {
                const [statsRes, quizRes, profileRes, personalRes] = await Promise.all([
                    API.get("/quiz/stats"),
                    API.get("/quiz/today"),
                    API.get("/auth/profile").catch(() => ({ data: null })),
                    API.get("/personal/profile").catch(() => ({ data: null })),
                ]);
                setStats(statsRes.data);
                setProfile(profileRes.data);
                setPersonal(personalRes.data);
                if (quizRes.data.alreadyCompleted) {
                    setResult({ alreadyCompleted: true, score: quizRes.data.score });
                } else {
                    setQuestions(quizRes.data.questions || []);
                }
            } catch (err) { console.error(err); }
            finally { setLoading(false); }
        };
        fetchAll();
    }, []);

    const handleAnswer = (optIdx) => setCurrent(optIdx);

    const handleNext = () => {
        if (currentAnswer === null) return;
        const newAnswers = { ...answers, [questions[currentQ].id]: currentAnswer };
        setAnswers(newAnswers);
        setSubmitted(true);

        setTimeout(() => {
            if (currentQ < questions.length - 1) {
                setCurrentQ(currentQ + 1);
                setCurrent(null);
                setSubmitted(false);
            } else {
                submitQuiz(newAnswers);
            }
        }, 1200);
    };

    const submitQuiz = async (finalAnswers) => {
        try {
            const res = await API.post("/quiz/submit", { answers: finalAnswers });
            setResult(res.data);
            setPhase("result");
            // Refresh stats
            const statsRes = await API.get("/quiz/stats");
            setStats(statsRes.data);
        } catch (err) { console.error(err); }
    };

    if (loading) return (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Plus Jakarta Sans, sans-serif", color: "#9ca3af" }}>
            Loading...
        </div>
    );

    const q = questions[currentQ];

    return (
        <div className="flex h-screen bg-white overflow-hidden w-full" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
                @media (max-width: 768px) {
                    aside.fixed { top: 56px !important; height: calc(100vh - 56px) !important; }
                }
            `}</style>

            <Sidebar active={active} setActive={setActive} handleLogout={() => navigate("/")} isOpen={isSidebarOpen} setOpen={setIsSidebarOpen} />

            <main className="flex-1 flex flex-col h-screen overflow-hidden w-full">
                <Navbar profile={profile} personal={personal} isSidebarOpen={isSidebarOpen} setSidebarOpen={setIsSidebarOpen} />

                <div className="flex-1 overflow-y-auto bg-gray-50">
                    <div style={{ maxWidth: 1400, margin: "0 auto", padding: "16px", paddingTop: "20px" }}>

                        {/* Stats / Level Card */}
                        {stats && (
                            <LevelBadge level={stats.level} totalExp={stats.totalExp} streak={stats.streak} />
                        )}

                        {/* Main Card */}
                        <div style={{ background: "white", borderRadius: 16, padding: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}>

                            {/* Already completed today */}
                            {result?.alreadyCompleted && (
                                <div style={{ textAlign: "center", padding: "20px 0" }}>
                                    <p style={{ fontSize: 48, marginBottom: 12 }}>✅</p>
                                    <h2 style={{ fontWeight: 700, color: "#1a3a1f", marginBottom: 8 }}>Sudah Selesai Hari Ini!</h2>
                                    <p style={{ color: "#6b7280", fontSize: 14, marginBottom: 20 }}>
                                        Nilai kamu hari ini: <strong>{result.score}</strong>
                                    </p>
                                    <p style={{ color: "#9ca3af", fontSize: 13, marginBottom: 20 }}>Kembali besok untuk quiz baru 🌅</p>

                                    {/* EXP log */}
                                    {stats?.expLog?.length > 0 && (
                                        <div style={{ background: "#f8fdf8", borderRadius: 10, padding: 14, marginBottom: 16, textAlign: "left" }}>
                                            <p style={{ fontSize: 12, fontWeight: 600, color: "#1a3a1f", marginBottom: 8 }}>📜 Riwayat EXP Terakhir</p>
                                            {stats.expLog.slice().reverse().map((log, i) => (
                                                <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#6b7280", marginBottom: 4 }}>
                                                    <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{log.reason}</span>
                                                    <span style={{ color: "#166534", fontWeight: 600, marginLeft: 8 }}>+{log.amount} EXP</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <button onClick={() => navigate("/learning")}
                                        style={{ width: "100%", background: "#1a3a1f", color: "#9FF782", border: "none", borderRadius: 10, padding: 14, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "Plus Jakarta Sans, sans-serif", marginBottom: 10 }}>
                                        📚 Lanjut Belajar
                                    </button>
                                    <button onClick={() => navigate("/dashboard")}
                                        style={{ width: "100%", background: "#f3f4f6", color: "#374151", border: "none", borderRadius: 10, padding: 14, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "Plus Jakarta Sans, sans-serif" }}>
                                        ← Dashboard
                                    </button>
                                </div>
                            )}

                            {/* Result Screen */}
                            {phase === "result" && result && !result.alreadyCompleted && (
                                <ResultScreen
                                    score={result.score}
                                    correct={result.correct}
                                    total={result.total}
                                    expEarned={result.expEarned}
                                    streak={result.streak}
                                    levelUp={result.levelUp}
                                    newLevel={result.newLevel}
                                    onClose={() => navigate("/dashboard")}
                                />
                            )}

                            {/* Quiz Start / No Questions */}
                            {!result?.alreadyCompleted && phase === "stats" && (
                                <>
                                    {questions.length > 0 ? (
                                        <div>
                                            <div style={{ textAlign: "center", marginBottom: 24 }}>
                                                <h2 style={{ fontWeight: 700, fontSize: 20, color: "#1a3a1f", marginBottom: 4 }}>🧠 Daily Quiz</h2>
                                                <p style={{ fontSize: 13, color: "#9ca3af" }}>{questions.length} soal • Minimal 60 untuk lulus</p>
                                            </div>

                                            {/* EXP preview */}
                                            <div style={{ background: "#f8fdf8", border: "1px solid #d1fae5", borderRadius: 10, padding: 14, marginBottom: 20 }}>
                                                <p style={{ fontSize: 12, fontWeight: 600, color: "#166534", marginBottom: 8 }}>Hadiah hari ini:</p>
                                                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                                    {[{ icon: "⚡", label: "+50 EXP Daily Quiz" }, { icon: "🔥", label: `+10 EXP Streak (${(stats?.streak || 0) + 1} hari)` }].map((r, i) => (
                                                        <span key={i} style={{ fontSize: 11, fontWeight: 600, color: "#166534", background: "#e8fce0", padding: "3px 8px", borderRadius: 20 }}>
                                                            {r.icon} {r.label}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>

                                            <button onClick={() => setPhase("quiz")}
                                                style={{ width: "100%", background: "#1a3a1f", color: "#9FF782", border: "none", borderRadius: 10, padding: 14, fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: "Plus Jakarta Sans, sans-serif" }}>
                                                Mulai Quiz →
                                            </button>
                                        </div>
                                    ) : (
                                        <div style={{ textAlign: "center", padding: "20px 0" }}>
                                            <p style={{ fontSize: 40, marginBottom: 12 }}>📭</p>
                                            <p style={{ color: "#6b7280" }}>Belum ada soal tersedia. Admin belum menambahkan soal quiz.</p>
                                        </div>
                                    )}
                                </>
                            )}

                            {/* Active Quiz */}
                            {phase === "quiz" && q && (
                                <div>
                                    <QuestionCard
                                        question={q}
                                        index={currentQ}
                                        total={questions.length}
                                        selectedAnswer={currentAnswer}
                                        onAnswer={handleAnswer}
                                        submitted={submitted}
                                        correctIndex={submitted ? q.correctIndex : undefined}
                                    />

                                    <button
                                        onClick={handleNext}
                                        disabled={currentAnswer === null}
                                        style={{ width: "100%", marginTop: 20, background: currentAnswer === null ? "#e5e7eb" : "#1a3a1f", color: currentAnswer === null ? "#9ca3af" : "#9FF782", border: "none", borderRadius: 10, padding: 14, fontSize: 14, fontWeight: 600, cursor: currentAnswer === null ? "not-allowed" : "pointer", fontFamily: "Plus Jakarta Sans, sans-serif", transition: "all 0.2s" }}>
                                        {currentQ < questions.length - 1 ? "Jawab & Lanjut →" : "Kumpulkan Jawaban ✓"}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}