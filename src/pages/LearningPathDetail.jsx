import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../services/api.js";

// ── Quiz Component ────────────────────────────────────────────
function Quiz({ questions, moduleId, pathId, onComplete }) {
    const [answers, setAnswers] = useState({});
    const [submitted, setSubmit] = useState(false);
    const [score, setScore] = useState(0);

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
        <div className="mt-6 bg-green-50 border border-green-200 rounded-xl p-5">
            <h3 className="font-bold text-[#1a3a1f] text-sm mb-1">📝 Quiz Modul</h3>
            <p className="text-xs text-gray-500 mb-4">
                ⚠️ Kamu harus lulus quiz ini (min. 70) untuk membuka modul berikutnya.
            </p>

            {questions.map((q, i) => (
                <div key={q.id} className="mb-5">
                    <p className="font-semibold text-sm text-[#1a3a1f] mb-2">
                        {i + 1}. {q.question}
                    </p>

                    {q.options?.map((opt, j) => {
                        let base = "flex items-center gap-2 px-4 py-2 rounded-lg mb-1 cursor-pointer transition text-sm";
                        let style = "bg-white border border-gray-200 text-gray-700";

                        if (submitted) {
                            if (j === q.correctIndex) style = "bg-green-100 border border-green-400 text-green-800";
                            else if (answers[i] === j) style = "bg-red-100 border border-red-400 text-red-800";
                        } else if (answers[i] === j) {
                            style = "bg-green-100 border border-[#9FF782] text-[#1a3a1f]";
                        }

                        return (
                            <div key={j} onClick={() => handleAnswer(i, j)} className={`${base} ${style}`}>
                                <span className="w-5 h-5 flex items-center justify-center rounded-full border text-xs font-bold">
                                    {String.fromCharCode(65 + j)}
                                </span>
                                <span>{opt}</span>
                                {submitted && j === q.correctIndex && (
                                    <span className="ml-auto text-xs font-bold">✓</span>
                                )}
                            </div>
                        );
                    })}
                </div>
            ))}

            {!submitted ? (
                <button
                    onClick={handleSubmit}
                    disabled={Object.keys(answers).length < questions.length}
                    className={`w-full rounded-lg py-3 text-sm font-semibold transition
                        ${Object.keys(answers).length < questions.length
                            ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                            : "bg-[#1a3a1f] text-[#9FF782]"}`}
                >
                    Kumpulkan Jawaban ({Object.keys(answers).length}/{questions.length})
                </button>
            ) : (
                <div className={`text-center p-4 rounded-lg ${passed ? "bg-green-100" : "bg-red-100"}`}>
                    <p className="text-2xl">{passed ? "🎉" : "😔"}</p>
                    <p className={`font-bold text-lg ${passed ? "text-green-800" : "text-red-800"}`}>
                        Nilai: {score}/100
                    </p>
                    <p className="text-sm mt-1">
                        {passed
                            ? "Selamat! Modul berikutnya sekarang terbuka."
                            : "Nilai minimal 70. Coba lagi!"}
                    </p>

                    {!passed && (
                        <button
                            onClick={() => { setAnswers({}); setSubmit(false); setScore(0); }}
                            className="mt-3 bg-[#1a3a1f] text-[#9FF782] px-4 py-2 rounded-lg text-sm"
                        >
                            Coba Lagi
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

// ── Main Page ──────────────────────────────────────────
export default function LearningPathDetail() {
    const { pathId } = useParams();
    const navigate = useNavigate();

    const [path, setPath] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeModule, setActive] = useState(null);
    const [completed, setCompleted] = useState([]);
    const [lockedMsg, setLockedMsg] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [pathRes, progressRes] = await Promise.all([
                    API.get(`/learningpath/${pathId}`),
                    API.get(`/learningpath/${pathId}/progress`)
                ]);

                setPath(pathRes.data);
                setCompleted(progressRes.data.completedModules || []);
                setActive(pathRes.data.modules[0]);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [pathId]);

    const handleComplete = (id) => {
        setCompleted(prev => [...new Set([...prev, id])]);
    };

    const isUnlocked = (index) => {
        if (index === 0) return true;
        return completed.includes(path.modules[index - 1].id);
    };

    const handleModuleClick = (mod, index) => {
        if (!isUnlocked(index)) {
            setLockedMsg(`Selesaikan modul "${path.modules[index - 1].title}" terlebih dahulu.`);
            setTimeout(() => setLockedMsg(null), 3000);
            return;
        }
        setActive(mod);
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">Loading...</div>;
    if (!path) return <div className="min-h-screen flex items-center justify-center">Not found</div>;

    const progress = Math.round((completed.length / path.modules.length) * 100);

    return (
        <div className="min-h-screen bg-[#f0f4f0] font-sans">

            {/* TOPBAR */}
            <nav className="bg-gradient-to-r from-[#1a3a1f] to-[#0f2a18] px-6 py-3 flex justify-between items-center">
                <button onClick={() => navigate("/learning")} className="text-[#9FF782] font-semibold text-sm">
                    ← Learning Path
                </button>

                <span className="text-white text-sm text-center flex-1 truncate">
                    {path.title}
                </span>

                <span className="text-[#9FF782] text-sm font-semibold">
                    {progress}%
                </span>
            </nav>

            <div className="flex h-[calc(100vh-48px)]">

                {/* SIDEBAR */}
                <aside className="w-[280px] bg-white border-r overflow-y-auto flex flex-col">

                    <div className="p-4 border-b">
                        <h2 className="font-bold text-sm mb-2">{path.title}</h2>

                        <div className="bg-gray-200 h-1.5 rounded mb-1">
                            <div
                                className="bg-[#1a3a1f] h-1.5 rounded"
                                style={{ width: `${progress}%` }}
                            />
                        </div>

                        <p className="text-xs text-gray-400">
                            {completed.length}/{path.modules.length} selesai
                        </p>
                    </div>

                    {lockedMsg && (
                        <div className="m-2 bg-red-100 text-red-700 text-xs p-2 rounded">
                            🔒 {lockedMsg}
                        </div>
                    )}

                    <div className="p-2 space-y-1">
                        {path.modules.map((mod, i) => {
                            const unlocked = isUnlocked(i);
                            const active = activeModule?.id === mod.id;
                            const done = completed.includes(mod.id);

                            return (
                                <div
                                    key={mod.id}
                                    onClick={() => handleModuleClick(mod, i)}
                                    className={`px-3 py-2 rounded cursor-pointer text-sm
                                        ${active ? "bg-green-100" : ""}
                                        ${!unlocked ? "opacity-40 cursor-not-allowed" : "hover:bg-gray-100"}
                                    `}
                                >
                                    {done ? "✓ " : ""}
                                    {mod.title}
                                </div>
                            );
                        })}
                    </div>
                </aside>

                {/* MAIN */}
                <main className="flex-1 overflow-y-auto p-8">
                    <div className="max-w-2xl mx-auto">

                        <h1 className="text-2xl font-bold mb-4">{activeModule.title}</h1>

                        <div className="text-gray-700 whitespace-pre-wrap mb-6">
                            {activeModule.content}
                        </div>

                        {activeModule.quiz?.length > 0 &&
                            !completed.includes(activeModule.id) && (
                                <Quiz
                                    questions={activeModule.quiz}
                                    moduleId={activeModule.id}
                                    pathId={pathId}
                                    onComplete={handleComplete}
                                />
                            )}

                        {/* COMPLETE BUTTON */}
                        {!activeModule.quiz?.length && !completed.includes(activeModule.id) && (
                            <button
                                onClick={async () => {
                                    await API.post(`/learningpath/${pathId}/progress`, {
                                        moduleId: activeModule.id
                                    });
                                    handleComplete(activeModule.id);
                                }}
                                className="w-full bg-[#1a3a1f] text-[#9FF782] py-3 rounded-lg"
                            >
                                Tandai Selesai
                            </button>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}