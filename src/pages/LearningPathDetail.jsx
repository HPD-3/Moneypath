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
        <div className="mx-3 lg:mx-0 mt-4 lg:mt-6 bg-green-50 border border-green-200 rounded-lg lg:rounded-xl p-4 lg:p-5">
            <h3 className="font-bold text-[#1a3a1f] text-sm mb-1">📝 Quiz Modul</h3>
            <p className="text-xs text-gray-500 mb-3 lg:mb-4">
                ⚠️ Kamu harus lulus quiz ini (min. 70) untuk membuka modul berikutnya.
            </p>

            {questions.map((q, i) => (
                <div key={q.id} className="mb-4 lg:mb-5">
                    <p className="font-semibold text-xs lg:text-sm text-[#1a3a1f] mb-2">
                        {i + 1}. {q.question}
                    </p>

                    {q.options?.map((opt, j) => {
                        let base = "flex items-center gap-2 px-3 lg:px-4 py-2 rounded-lg mb-1 cursor-pointer transition text-xs lg:text-sm";
                        let style = "bg-white border border-gray-200 text-gray-700";

                        if (submitted) {
                            if (j === q.correctIndex) style = "bg-green-100 border border-green-400 text-green-800";
                            else if (answers[i] === j) style = "bg-red-100 border border-red-400 text-red-800";
                        } else if (answers[i] === j) {
                            style = "bg-yellow-100 border border-yellow-400 text-yellow-800";
                        }

                        return (
                            <div key={j} onClick={() => handleAnswer(i, j)} className={`${base} ${style}`}>
                                <span className="w-5 h-5 flex items-center justify-center rounded-full border text-xs font-bold flex-shrink-0">
                                    {String.fromCharCode(65 + j)}
                                </span>
                                <span className="flex-1">{opt}</span>
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
                    className={`w-full rounded-lg py-2 lg:py-3 text-xs lg:text-sm font-semibold transition
                        ${Object.keys(answers).length < questions.length
                            ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                            : "bg-[#1a3a1f] text-[#9FF782] hover:bg-[#0f2e1c]"}`}
                >
                    Kumpulkan Jawaban ({Object.keys(answers).length}/{questions.length})
                </button>
            ) : (
                <div className={`text-center p-3 lg:p-4 rounded-lg ${passed ? "bg-green-100" : "bg-red-100"}`}>
                    <p className="text-xl lg:text-2xl">{passed ? "🎉" : "😔"}</p>
                    <p className={`font-bold text-base lg:text-lg ${passed ? "text-green-800" : "text-red-800"}`}>
                        Nilai: {score}/100
                    </p>
                    <p className="text-xs lg:text-sm mt-1">
                        {passed
                            ? "Selamat! Modul berikutnya sekarang terbuka."
                            : "Nilai minimal 70. Coba lagi!"}
                    </p>

                    {!passed && (
                        <button
                            onClick={() => { setAnswers({}); setSubmit(false); setScore(0); }}
                            className="mt-3 bg-[#1a3a1f] text-[#9FF782] px-4 py-2 rounded-lg text-xs lg:text-sm hover:bg-[#0f2e1c]"
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
    const [sidebarOpen, setSidebarOpen] = useState(false);

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
            // Show completion modal when all modules are done
            setPathCompleted(true);
            setShowCompletionModal(true);
        }
    };

    const isUnlocked = (index) => {
        // If path is completed, all modules are unlocked for re-reading
        if (pathCompleted || progressPercent === 100) return true;

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

    // If path is already completed (100%), show completion page ONLY if user hasn't clicked "Baca Ulang Modul"
    if ((pathCompleted && progressPercent === 100) && showCompletionModal) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-[#0f2e1c] via-[#1a3a1f] to-[#051a10] flex items-center justify-center p-4 relative overflow-hidden">
                {/* Animated background glow */}
                <div className="absolute inset-0 opacity-30">
                    <div className="absolute top-20 left-10 w-96 h-96 bg-[#9FF782] rounded-full blur-3xl opacity-20 animate-pulse"></div>
                    <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#9FF782] rounded-full blur-3xl opacity-10 animate-pulse animation-delay-2000"></div>
                </div>

                <div className="text-center max-w-2xl z-10">
                    {/* Trophy Animation */}
                    <div className="mb-8 inline-block">
                        <iconify-icon icon="mdi:trophy" width="100" height="100" className="text-yellow-400 drop-shadow-lg" style={{ filter: 'drop-shadow(0 0 10px rgba(159, 247, 130, 0.3))' }}></iconify-icon>
                    </div>

                    {/* Main Title */}
                    <h1 className="text-6xl font-black text-white mb-2 drop-shadow-lg">Selamat!</h1>
                    <p className="text-2xl font-bold bg-gradient-to-r from-[#9FF782] to-[#7dd65f] bg-clip-text text-transparent mb-8">
                        Learning Path Selesai
                    </p>

                    {/* Glassmorphism Card */}
                    <div className="backdrop-blur-xl bg-white/10 rounded-3xl p-8 mb-8 border border-[#9FF782]/30 shadow-2xl">
                        <p className="text-white text-lg mb-8 leading-relaxed">
                            Kamu telah menyelesaikan <span className="font-bold text-[#9FF782]">{path.title}</span> dengan sempurna!
                        </p>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 gap-4 mb-8">
                            {/* Modules Completed */}
                            <div className="bg-gradient-to-br from-[#9FF782]/20 to-[#9FF782]/5 rounded-2xl p-6 border border-[#9FF782]/50 hover:border-[#9FF782] transition-all">
                                <div className="flex items-center justify-center mb-2">
                                    <iconify-icon icon="mdi:book-multiple" width="48" height="48" className="text-[#9FF782]"></iconify-icon>
                                </div>
                                <p className="text-[#9FF782] text-3xl font-bold">{totalModules}</p>
                                <p className="text-white text-sm font-medium mt-2">Modul Selesai</p>
                            </div>

                            {/* Progress */}
                            <div className="bg-gradient-to-br from-orange-400/20 to-orange-400/5 rounded-2xl p-6 border border-orange-400/50 hover:border-orange-400 transition-all">
                                <div className="flex items-center justify-center mb-2">
                                    <iconify-icon icon="mdi:chart-line" width="48" height="48" className="text-orange-400"></iconify-icon>
                                </div>
                                <p className="text-orange-300 text-3xl font-bold">100%</p>
                                <p className="text-white text-sm font-medium mt-2">Progres</p>
                            </div>
                        </div>

                        {/* XP Reward */}
                        <div className="bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-orange-500/20 rounded-2xl p-6 border-2 border-amber-400/50 mb-8">
                            <div className="flex items-center justify-center gap-2 mb-2">
                                <iconify-icon icon="mdi:fire" width="24" height="24" className="text-amber-400"></iconify-icon>
                                <p className="text-white text-sm font-semibold">Bonus XP Diterima</p>
                            </div>
                            <p className="text-amber-300 text-4xl font-bold">+100 XP</p>
                        </div>

                        {/* Achievement Message */}
                        <div className="bg-[#9FF782]/10 rounded-xl p-4 border border-[#9FF782]/30 mb-6">
                            <div className="flex items-center gap-2 mb-2">
                                <iconify-icon icon="mdi:star-four-points" width="20" height="20" className="text-[#9FF782]"></iconify-icon>
                                <p className="text-[#9FF782] text-sm font-semibold">Pencapaian Terbuka</p>
                            </div>
                            <p className="text-white text-xs mt-2">Kamu sekarang dapat membaca kembali semua modul kapan saja!</p>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button
                            onClick={() => {
                                setPathCompleted(false);
                                setShowCompletionModal(false);
                            }}
                            className="flex-1 bg-gradient-to-r from-[#9FF782] to-[#7dd65f] hover:shadow-lg hover:shadow-[#9FF782]/50 text-[#0f2e1c] font-bold py-4 rounded-xl transition-all duration-300 transform hover:scale-105 text-lg flex items-center justify-center gap-2"
                        >
                            <iconify-icon icon="mdi:book-open-page-variant" width="24" height="24"></iconify-icon>
                            Baca Ulang Modul
                        </button>
                        <button
                            onClick={() => navigate("/learning")}
                            className="flex-1 bg-white/10 hover:bg-white/20 text-white font-semibold py-4 rounded-xl transition-all border border-white/30 text-lg flex items-center justify-center gap-2 backdrop-blur-sm"
                        >
                            <iconify-icon icon="mdi:arrow-left" width="24" height="24"></iconify-icon>
                            Kembali ke Learning Path
                        </button>
                    </div>

                    <button
                        onClick={() => navigate("/dashboard")}
                        className="mt-4 w-full bg-white/5 hover:bg-white/10 text-white/80 font-medium py-3 rounded-lg transition border border-white/20 text-base flex items-center justify-center gap-2"
                    >
                        <iconify-icon icon="mdi:chart-box" width="20" height="20"></iconify-icon>
                        Ke Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col lg:flex-row min-h-screen bg-gray-100">
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
                .sidebar-mobile {
                  animation: slideInLeft 0.3s ease-in-out;
                }
                @keyframes slideInLeft {
                  from { transform: translateX(-100%); opacity: 0; }
                  to { transform: translateX(0); opacity: 1; }
                }
            `}</style>

            {/* LOCK MODAL */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 modal-overlay">
                    <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm mx-4 modal-content">
                        <div className="text-center">
                            <div className="flex justify-center mb-4">
                                <iconify-icon icon="mdi:lock" width="80" height="80" className="text-red-500"></iconify-icon>
                            </div>
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
                            <div className="flex justify-center mb-4">
                                <iconify-icon icon="mdi:trophy" width="80" height="80" className="text-yellow-500"></iconify-icon>
                            </div>
                            <h2 className="text-2xl font-bold text-[#1a3a1f] mb-2">Luar Biasa!</h2>
                            <p className="text-gray-600 mb-6">
                                Kamu telah menyelesaikan learning path <span className="font-semibold">"{path.title}"</span>
                            </p>

                            <div className="bg-gradient-to-r from-orange-100 to-yellow-100 rounded-lg p-4 mb-6 border-2 border-orange-300 flex items-center justify-center gap-2">
                                <iconify-icon icon="mdi:fire" width="24" height="24" className="text-orange-600"></iconify-icon>
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">Bonus XP</p>
                                    <p className="text-3xl font-bold text-orange-600">+100 XP</p>
                                </div>
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
                <div className="border-b bg-white shadow-sm">
                    {/* Top Row - Mobile */}
                    <div className="flex lg:hidden justify-between items-center px-3 py-3 gap-2">
                        <button onClick={() => navigate("/learning")} className="p-1 hover:opacity-70 text-gray-700">
                            <iconify-icon icon="mdi:arrow-left" width="24" height="24"></iconify-icon>
                        </button>
                        <h2 className="text-sm font-semibold text-gray-700 flex-1 truncate">{path.title}</h2>
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="p-1 rounded-lg hover:bg-gray-100 transition"
                        >
                            <iconify-icon icon={sidebarOpen ? "mdi:close" : "mdi:menu"} width="24" height="24"></iconify-icon>
                        </button>
                    </div>

                    {/* Progress Row - Mobile */}
                    <div className="flex lg:hidden justify-between items-center px-3 py-2 bg-gray-50 text-xs gap-2">
                        <span className="font-medium text-gray-700">{completed.length}/{totalModules}</span>
                        <span className="font-semibold text-green-700">{progressPercent}%</span>
                        <div className="flex-1 bg-gray-200 h-1.5 rounded-full overflow-hidden">
                            <div style={{ width: `${progressPercent}%` }} className="h-1.5 bg-gradient-to-r from-green-600 to-green-400"></div>
                        </div>
                    </div>

                    {/* Desktop Header */}
                    <div className="hidden lg:flex justify-between items-center px-8 py-4">
                        <button onClick={() => navigate("/learning")} className="flex items-center gap-2 text-lg font-semibold hover:opacity-70 text-gray-700">
                            <iconify-icon icon="mdi:arrow-left" width="24" height="24"></iconify-icon>
                            {path.title}
                        </button>

                        <div className="flex items-center gap-6">
                            <span className="text-sm font-medium text-gray-600">
                                {completed.length} / {totalModules}
                            </span>

                            <div className="flex items-center gap-2">
                                <div className="w-7 h-7 flex items-center justify-center rounded-full border-2 border-orange-400">
                                    <iconify-icon icon="mdi:fire" width="16" height="16" className="text-orange-500"></iconify-icon>
                                </div>
                                <span className="font-bold text-gray-700">{completed.length}</span>
                            </div>

                            <span className="font-semibold text-green-700">{progressPercent}%</span>

                            <div className="w-40 bg-gray-200 h-2 rounded-full overflow-hidden">
                                <div style={{ width: `${progressPercent}%` }} className="h-2 bg-gradient-to-r from-black via-green-900 to-green-400 transition-all duration-500"></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* CONTENT */}
                <div className="flex-1 px-3 lg:px-10 py-4 lg:py-6 text-gray-700 fade overflow-y-auto">
                    <h1 className="text-xl lg:text-3xl font-bold mb-3 lg:mb-4">{activeModule.title}</h1>
                    <div
                        className="text-sm lg:text-base leading-relaxed mb-6 lg:mb-8 prose prose-sm max-w-none"
                        style={{
                            fontSize: 'inherit',
                            lineHeight: '1.7',
                            color: '#374151'
                        }}
                        dangerouslySetInnerHTML={{ __html: activeModule.content }}
                    />

                    {/* Styling for rendered HTML content */}
                    <style>{`
                        .prose h1, .prose h2, .prose h3, .prose h4, .prose h5, .prose h6 {
                            margin-top: 1.5em;
                            margin-bottom: 0.5em;
                            font-weight: 700;
                        }
                        .prose h1 { font-size: 2em; }
                        .prose h2 { font-size: 1.5em; }
                        .prose h3 { font-size: 1.25em; }
                        .prose p {
                            margin-bottom: 1em;
                            line-height: 1.75;
                        }
                        .prose b, .prose strong {
                            font-weight: 700;
                            color: #1f2937;
                        }
                        .prose i, .prose em {
                            font-style: italic;
                            color: #4b5563;
                        }
                        .prose u {
                            text-decoration: underline;
                        }
                        .prose ul, .prose ol {
                            margin-left: 2em;
                            margin-bottom: 1em;
                        }
                        .prose ul li, .prose ol li {
                            margin-bottom: 0.5em;
                        }
                        .prose font {
                            font-family: inherit;
                        }
                        .prose div {
                            margin-bottom: 1em;
                        }
                    `}</style>
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
                    <div className="px-3 lg:px-10 pb-4 lg:pb-6">
                        <button
                            onClick={async () => {
                                await API.post(`/learningpath/${pathId}/progress`, {
                                    moduleId: activeModule.id
                                });
                                handleComplete(activeModule.id);
                            }}
                            className="w-full bg-gradient-to-r from-[#9FF782] to-[#7dd65f] hover:shadow-lg hover:shadow-[#9FF782]/40 text-[#0f2e1c] px-4 py-3 rounded-lg font-bold shadow transition-all flex items-center justify-center gap-2 text-sm"
                        >
                            <iconify-icon icon="mdi:check-circle" width="20" height="20"></iconify-icon>
                            Tandai Modul Selesai
                        </button>
                    </div>
                )}
            </div>

            {/* FOOTER - Only Mobile */}
            <div className="border-t bg-white shadow-sm p-3 lg:hidden">
                <div className="flex gap-2 justify-between items-center">
                    <button
                        onClick={prevMateri}
                        disabled={currentModuleIndex === 0}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg font-semibold transition-all text-gray-600 hover:text-gray-900 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-sm">
                        <iconify-icon icon="mdi:arrow-left" width="20" height="20"></iconify-icon>
                        <span className="hidden sm:inline">Kembali</span>
                    </button>

                    <button
                        onClick={nextMateri}
                        disabled={!completed.includes(activeModule.id) || currentModuleIndex === path.modules.length - 1}
                        className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg font-semibold transition-all text-sm ${!completed.includes(activeModule.id) || currentModuleIndex === path.modules.length - 1
                                ? 'bg-gray-300 text-gray-600 cursor-not-allowed opacity-60'
                                : 'bg-gradient-to-r from-[#0f2e1c] to-[#174d2e] text-white hover:shadow-lg hover:shadow-[#0f2e1c]/30'
                            }`}
                        title={!completed.includes(activeModule.id) ? "Tandai modul ini selesai terlebih dahulu" : currentModuleIndex === path.modules.length - 1 ? "Anda sudah di modul terakhir" : ""}>
                        <span className="hidden sm:inline">Lanjut</span>
                        <iconify-icon icon="mdi:arrow-right" width="20" height="20"></iconify-icon>
                    </button>
                </div>
            </div>


            {/* ================= SIDEBAR ================= */}
            {/* Mobile/Tablet Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 lg:hidden z-30"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar - Desktop: Always visible, Mobile: Slide-out drawer */}
            <div className={`fixed lg:static left-0 top-0 h-screen w-72 lg:w-80 bg-white lg:bg-gray-50 border-l p-3 lg:p-6 overflow-y-auto z-40 transition-transform duration-300 flex flex-col ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
                } sidebar-mobile`}>
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="font-bold text-gray-800 text-base lg:text-lg">Daftar Materi</h2>
                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="lg:hidden p-1 hover:bg-gray-200 rounded transition"
                        >
                            <iconify-icon icon="mdi:close" width="20" height="20"></iconify-icon>
                        </button>
                    </div>

                    <div className="space-y-1 text-sm">
                        {path.modules.map((mod, i) => {
                            const isActive = i === currentModuleIndex;
                            const isDone = completed.includes(mod.id);
                            const unlocked = isUnlocked(i);

                            return (
                                <div
                                    key={mod.id}
                                    onClick={() => {
                                        loadMateri(i);
                                        setSidebarOpen(false);
                                    }}
                                    className={`menu-item px-3 py-2 rounded-lg transition cursor-pointer ${!unlocked ? "opacity-50 cursor-not-allowed" : ""
                                        } ${isActive
                                            ? "bg-gradient-to-r from-green-200 to-green-100 border-l-4 border-green-600 text-gray-800 font-semibold"
                                            : unlocked
                                                ? "hover:bg-gray-100 text-gray-700"
                                                : "text-gray-600"
                                        }`}
                                >
                                    <div className="flex items-center gap-2">
                                        {isDone && <iconify-icon icon="mdi:check-circle" width="18" height="18" className="text-green-600 flex-shrink-0"></iconify-icon>}
                                        {!unlocked && !isDone && <iconify-icon icon="mdi:lock" width="18" height="18" className="text-gray-400 flex-shrink-0"></iconify-icon>}
                                        <span className="truncate">{mod.title}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Navigation Buttons removed from sidebar so they can be fixed globally */}
            </div>
            {/* Desktop fixed bottom-right action buttons (sibling of sidebar) */}
            <div className="hidden lg:flex fixed right-6 bottom-6 z-50 flex-col gap-3">
                <button
                    onClick={prevMateri}
                    disabled={currentModuleIndex === 0}
                    className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-semibold transition-all text-gray-600 hover:text-gray-900 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-sm shadow-sm bg-white border border-gray-200">
                    <iconify-icon icon="mdi:arrow-left" width="18" height="18"></iconify-icon>
                    Kembali
                </button>

                <button
                    onClick={nextMateri}
                    disabled={!completed.includes(activeModule.id) || currentModuleIndex === path.modules.length - 1}
                    className={`flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-semibold transition-all text-sm ${!completed.includes(activeModule.id) || currentModuleIndex === path.modules.length - 1
                            ? 'bg-gray-300 text-gray-600 cursor-not-allowed opacity-60'
                            : 'bg-gradient-to-r from-[#0f2e1c] to-[#174d2e] text-white hover:shadow-lg hover:shadow-[#0f2e1c]/30'
                        } shadow-lg`}
                    title={!completed.includes(activeModule.id) ? "Tandai modul ini selesai terlebih dahulu" : currentModuleIndex === path.modules.length - 1 ? "Anda sudah di modul terakhir" : ""}>
                    <span className="hidden sm:inline">Lanjut</span>
                    <iconify-icon icon="mdi:arrow-right" width="18" height="18"></iconify-icon>
                </button>
            </div>
        </div>
    );
}