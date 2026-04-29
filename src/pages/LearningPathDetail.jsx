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
                            style = "bg-yellow-100 border border-yellow-400 text-yellow-800";
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
    const [currentModuleIndex, setCurrentModuleIndex] = useState(0);
    const [completed, setCompleted] = useState([]);
    const [lockedMsg, setLockedMsg] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [lockedModuleInfo, setLockedModuleInfo] = useState(null);
    const [pathCompleted, setPathCompleted] = useState(false);
    const [showCompletionModal, setShowCompletionModal] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [pathRes, progressRes] = await Promise.all([
                    API.get(`/learningpath/${pathId}`),
                    API.get(`/learningpath/${pathId}/progress`)
                ]);

                setPath(pathRes.data);
                setCompleted(progressRes.data.completedModules || []);
                setPathCompleted(progressRes.data.isCompleted || false);
                setCurrentModuleIndex(0);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [pathId]);

    const handleComplete = async (id) => {
        const updatedCompleted = [...new Set([...completed, id])];
        setCompleted(updatedCompleted);

        // Check if all modules are completed
        if (updatedCompleted.length === path.modules.length) {
            // Award 100 XP for completing full path
            try {
                await API.post(`/learningpath/${pathId}/complete`, { 
                    xpReward: 100,
                    activityType: "Selesai Full Path"
                });
                setPathCompleted(true);
                setShowCompletionModal(true);
            } catch (err) {
                console.error("Error completing path:", err);
            }
        }
    };

    const isUnlocked = (index) => {
        if (index === 0) return true;
        return completed.includes(path.modules[index - 1].id);
    };

    const loadMateri = (index) => {
        if (!isUnlocked(index)) {
            setLockedModuleInfo({
                currentModule: path.modules[index - 1].title,
                lockedModule: path.modules[index].title
            });
            setShowModal(true);
            return;
        }
        setCurrentModuleIndex(index);
    };

    const nextMateri = () => {
        if (currentModuleIndex < path.modules.length - 1) {
            setCurrentModuleIndex(currentModuleIndex + 1);
        }
    };

    const prevMateri = () => {
        if (currentModuleIndex > 0) {
            setCurrentModuleIndex(currentModuleIndex - 1);
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">Loading...</div>;
    if (!path) return <div className="min-h-screen flex items-center justify-center">Not found</div>;

    const totalModules = path.modules.length;
    const progressPercent = Math.round((completed.length / totalModules) * 100);
    const currentPercent = Math.round(((currentModuleIndex + 1) / totalModules) * 100);
    const activeModule = path.modules[currentModuleIndex];

    // If path is already completed (100%), show completion page
    if (pathCompleted || progressPercent === 100) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-[#1a3a1f] to-[#0f2a18] flex items-center justify-center p-4">
                <div className="text-center max-w-md">
                    <div className="text-8xl mb-6 animate-bounce">🏆</div>
                    
                    <h1 className="text-4xl font-bold text-white mb-4">Selamat!</h1>
                    <p className="text-[#9FF782] text-xl font-semibold mb-3">Learning Path Selesai</p>
                    
                    <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-2xl p-8 mb-6 border border-[#9FF782] border-opacity-30">
                        <p className="text-white text-lg mb-4">
                            Kamu telah menyelesaikan <span className="font-bold">{path.title}</span>
                        </p>
                        
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="bg-[#9FF782] bg-opacity-20 rounded-xl p-4 border border-[#9FF782]">
                                <p className="text-[#9FF782] text-2xl font-bold">{totalModules}</p>
                                <p className="text-white text-sm">Modul Selesai</p>
                            </div>
                            <div className="bg-orange-400 bg-opacity-20 rounded-xl p-4 border border-orange-400">
                                <p className="text-orange-300 text-2xl font-bold">100%</p>
                                <p className="text-white text-sm">Progres</p>
                            </div>
                        </div>

                        <div className="bg-[#9FF782] bg-opacity-20 rounded-xl p-4 border border-[#9FF782] mb-4">
                            <p className="text-white text-sm mb-2">Bonus XP Diterima</p>
                            <p className="text-[#9FF782] text-3xl font-bold">+100 XP 🔥</p>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        <button
                            onClick={() => navigate("/learning")}
                            className="w-full bg-[#9FF782] hover:bg-[#7fd952] text-[#1a3a1f] font-bold py-3 rounded-lg transition"
                        >
                            ← Kembali ke Learning Path
                        </button>
                        <button
                            onClick={() => navigate("/dashboard")}
                            className="w-full bg-white bg-opacity-20 hover:bg-opacity-30 text-white font-semibold py-3 rounded-lg transition border border-white border-opacity-30"
                        >
                            📊 Ke Dashboard
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-gray-100">
            <style>{`
                body { font-family: 'Plus Jakarta Sans', sans-serif; }
                .active {
                  background: linear-gradient(to right, #bbf7d0, #86efac);
                  color: #14532d;
                }
                .fade {
                  animation: fade 0.3s ease-in-out;
                }
                @keyframes fade {
                  from {opacity:0; transform: translateY(10px);}
                  to {opacity:1; transform: translateY(0);}
                }
                .modal-overlay {
                  animation: fadeIn 0.3s ease-in-out;
                }
                .modal-content {
                  animation: slideUp 0.3s ease-in-out;
                }
                @keyframes fadeIn {
                  from { opacity: 0; }
                  to { opacity: 1; }
                }
                @keyframes slideUp {
                  from { opacity: 0; transform: translateY(20px); }
                  to { opacity: 1; transform: translateY(0); }
                }
            `}</style>

            {/* LOCK MODAL */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 modal-overlay">
                    <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm mx-4 modal-content">
                        <div className="text-center">
                            <div className="text-6xl mb-4">🔒</div>
                            <h2 className="text-2xl font-bold text-[#1a3a1f] mb-3">Modul Terkunci</h2>
                            <p className="text-gray-600 mb-6">
                                Selesaikan modul <span className="font-semibold">"{lockedModuleInfo?.currentModule}"</span> terlebih dahulu untuk membuka <span className="font-semibold">"{lockedModuleInfo?.lockedModule}"</span>.
                            </p>
                            
                            <button
                                onClick={() => setShowModal(false)}
                                className="w-full bg-[#0f2e1c] hover:bg-[#174d2e] text-white font-semibold py-3 rounded-lg transition"
                            >
                                Mengerti
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* PATH COMPLETION MODAL */}
            {showCompletionModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 modal-overlay">
                    <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm mx-4 modal-content">
                        <div className="text-center">
                            <div className="text-6xl mb-4">🏆</div>
                            <h2 className="text-2xl font-bold text-[#1a3a1f] mb-2">Luar Biasa!</h2>
                            <p className="text-gray-600 mb-6">
                                Kamu telah menyelesaikan learning path <span className="font-semibold">"{path.title}"</span>
                            </p>
                            
                            <div className="bg-gradient-to-r from-orange-100 to-yellow-100 rounded-lg p-4 mb-6 border-2 border-orange-300">
                                <p className="text-sm text-gray-600 mb-2">Bonus XP</p>
                                <p className="text-3xl font-bold text-orange-600">+100 XP 🔥</p>
                            </div>

                            <p className="text-sm text-gray-500 mb-6">Selesai Full Path - XP reward</p>
                            
                            <button
                                onClick={() => {
                                    setShowCompletionModal(false);
                                    navigate("/learning");
                                }}
                                className="w-full bg-[#0f2e1c] hover:bg-[#174d2e] text-white font-semibold py-3 rounded-lg transition"
                            >
                                Kembali ke Learning Path
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ================= LEFT CONTENT ================= */}
            <div className="flex-1 flex flex-col bg-white">

                {/* HEADER */}
                <div className="flex justify-between items-center px-8 py-4 border-b bg-white shadow-sm">
                    <button onClick={() => navigate("/learning")} className="flex items-center gap-2 text-lg font-semibold hover:opacity-70 text-gray-700">
                        ← {path.title}
                    </button>

                    <div className="flex items-center gap-6">
                        <span className="text-sm font-medium text-gray-600">
                            {completed.length} / {totalModules}
                        </span>

                        <div className="flex items-center gap-2">
                            <div className="w-7 h-7 flex items-center justify-center rounded-full border-2 border-orange-400">
                                🔥
                            </div>
                            <span className="font-bold text-gray-700">{completed.length}</span>
                        </div>

                        <span className="font-semibold text-green-700">{progressPercent}%</span>

                        <div className="w-40 bg-gray-200 h-2 rounded-full overflow-hidden">
                            <div style={{ width: `${progressPercent}%` }} className="h-2 bg-gradient-to-r from-black via-green-900 to-green-400 transition-all duration-500"></div>
                        </div>
                    </div>
                </div>

                {/* CONTENT */}
                <div className="flex-1 p-10 text-gray-700 fade overflow-y-auto">
                    <h1 className="text-3xl font-bold mb-4">{activeModule.title}</h1>
                    <div className="whitespace-pre-wrap text-base leading-relaxed mb-8">
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

                    {!activeModule.quiz?.length && !completed.includes(activeModule.id) && (
                        <button
                            onClick={async () => {
                                await API.post(`/learningpath/${pathId}/progress`, {
                                    moduleId: activeModule.id
                                });
                                handleComplete(activeModule.id);
                            }}
                            className="w-full bg-[#0f2e1c] hover:bg-[#174d2e] text-white px-6 py-3 rounded-full font-semibold shadow transition"
                        >
                            Tandai Selesai
                        </button>
                    )}
                </div>

                {/* FOOTER */}
                <div className="flex justify-between items-center px-8 py-4 border-t bg-white">
                    <button onClick={prevMateri} className="text-gray-500 hover:text-black flex items-center gap-2">
                        ← Kembali
                    </button>

                    <button onClick={nextMateri}
                        className="bg-[#0f2e1c] hover:bg-[#174d2e] text-white px-6 py-2 rounded-full flex items-center gap-2 shadow transition">
                        Lanjut →
                    </button>
                </div>

            </div>

            {/* ================= SIDEBAR ================= */}
            <div className="w-80 bg-gray-50 border-l p-6 overflow-y-auto">
                <h2 className="font-bold mb-4 text-gray-700">Daftar Materi</h2>

                <div className="space-y-2 text-sm">
                    {path.modules.map((mod, i) => {
                        const isActive = i === currentModuleIndex;
                        const isDone = completed.includes(mod.id);
                        const unlocked = isUnlocked(i);

                        return (
                            <div
                                key={mod.id}
                                onClick={() => loadMateri(i)}
                                className={`menu-item px-4 py-2 rounded-lg transition ${
                                    unlocked ? "cursor-pointer" : "cursor-not-allowed opacity-50"
                                } ${
                                    isActive ? "active" : unlocked ? "hover:bg-gray-200" : ""
                                }`}
                            >
                                {unlocked ? (
                                    <>{isDone ? "✓ " : ""}{mod.title}</>
                                ) : (
                                    <>🔒 {mod.title}</>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}