import { useEffect, useState, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../services/api.js";

// Lazy-load admin subcomponents to reduce initial bundle size
const AdminBeranda = lazy(() => import("./AdminBeranda.jsx"));
const AdminVideoEdukasi = lazy(() => import("./AdminVideoEdukasi.jsx"));
const AdminLearningPath = lazy(() => import("./AdminLearningPath.jsx"));
const AdminKontenEdukasi = lazy(() => import("./AdminKontenEdukasi.jsx"));
const AdminDailyQuiz = lazy(() => import("./AdminDailyQuiz.jsx"));
const AdminReviews = lazy(() => import("./AdminReviews.jsx"));
const AdminAktivitas = lazy(() => import("./AdminAktivitas.jsx"));
const Sidebar = lazy(() => import("./AdminShared.jsx"));

export default function AdminDashboard() {
    const navigate = useNavigate();

    // State Logic
    const [active, setActive] = useState("beranda");
    const [users, setUsers] = useState([]);
    const [modules, setModules] = useState([]);
    const [paths, setPaths] = useState([]);
    const [videos, setVideos] = useState([]);
    const [quizQuestions, setQuizQuestions] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [denied, setDenied] = useState(false);
    const [adminEmail, setAdminEmail] = useState("Admin");
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    useEffect(() => { fetchAll(); }, []);

    const fetchAll = async () => {
        setLoading(true);
        try {
            const uRes = await API.get("/admin/users");
            const mRes = await API.get("/admin/learning");
            const vRes = await API.get("/video");
            const pRes = await API.get("/auth/profile");
            const pathRes = await API.get("/learningpath");

            setUsers(uRes.data);
            setModules(mRes.data);
            setVideos(vRes.data);
            setAdminEmail(pRes.data.email?.split("@")[0] || "Admin");
            setPaths(pathRes.data);
        } catch (err) {
            if (err.response?.status === 403) {
                setDenied(true);
                setLoading(false);
                return;
            }
            console.error("Error fetching admin data:", err.message);
        }

        try {
            const qRes = await API.get("/quiz/questions");
            setQuizQuestions(qRes.data);
        } catch (err) {
            console.error("Error fetching quiz questions:", err.message);
            setQuizQuestions([]);
        }

        try {
            const tRes = await API.get("/admin/transactions");
            setTransactions(tRes.data);
        } catch (err) {
            setTransactions([]);
            console.error("Error fetching transactions:", err.message);
        }

        setLoading(false);
    };

    const handleLogout = () => {
        if (confirm("Yakin mau keluar?")) {
            navigate("/");
        }
    };

    if (denied) return (
        <div className="h-screen flex items-center justify-center bg-gray-100 font-sans">
            <div className="text-center">
                <p className="text-6xl mb-4">🚫</p>
                <h2 className="text-2xl font-bold mb-4">Akses Ditolak</h2>
                <button className="bg-green-600 text-white px-6 py-2 rounded-lg" onClick={() => navigate("/dashboard")}>
                    ← Kembali
                </button>
            </div>
        </div>
    );

    return (
        <div className="flex h-screen bg-white overflow-hidden" style={{ fontFamily: "'Open Sans', sans-serif" }}>
            {/* INJECT CUSTOM FONT STYLES */}
            <style>
                {`
                @import url('https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600&family=Libre+Caslon+Text:wght@400;600;700&display=swap');
                .heading { font-family: 'Libre Caslon Text', serif; font-weight: 700; }
                `}
            </style>

            {/* MOBILE OVERLAY */}
            {isSidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* SIDEBAR */}
            <aside className={`fixed lg:static top-0 left-0 h-screen w-64 bg-gradient-to-b from-[#0b7a3a] to-[#0a5f2d] text-white flex flex-col flex-shrink-0 transition-transform duration-300 z-30 ${
                isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
            }`}>
                <Suspense fallback={<div className="p-4">Loading...</div>}>
                    <Sidebar active={active} setActive={(newActive) => {
                        setActive(newActive);
                        setIsSidebarOpen(false);
                    }} handleLogout={handleLogout} />
                </Suspense>
            </aside>

            {/* MAIN CONTENT AREA */}
            <main className="flex-1 overflow-hidden flex flex-col">
                <div className="bg-gray-50 rounded-none lg:rounded-xl overflow-hidden flex flex-col flex-1">

                    {/* HEADER ATAS */}
                    <div className="bg-white border-b px-3 sm:px-6 py-3 flex justify-between items-center shadow-sm">

                        {/* HAMBURGER MENU - Mobile only */}
                        <button 
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="lg:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:bg-gray-100"
                        >
                            <iconify-icon icon="mdi:menu" className="text-2xl"></iconify-icon>
                        </button>

                        <h1 className="text-base sm:text-xl font-bold text-gray-900">
                            Selamat Datang, Admin
                        </h1>

                        {/* PROFILE DROPDOWN */}
                        <div className="relative">

                            {/* BUTTON */}
                            <div onClick={() => setIsProfileOpen(!isProfileOpen)}
                                className="flex items-center gap-2 bg-gray-100 px-2 sm:px-3 py-1 rounded-full cursor-pointer">

                                {/* ICON */}
                                <div className="bg-green-500 text-white rounded-full p-1 flex items-center justify-center">
                                    <iconify-icon icon="mdi:account"></iconify-icon>
                                </div>

                                {/* TEXT - Hidden on small screens */}
                                <span className="text-xs sm:text-sm hidden sm:inline">Admin</span>

                                {/* ARROW */}
                                <iconify-icon icon="mdi:chevron-down"></iconify-icon>

                            </div>

                            {/* DROPDOWN */}
                            {isProfileOpen && (
                                <div className="absolute right-0 mt-2 w-48 sm:w-40 bg-white rounded-lg shadow-md overflow-hidden z-50">
                                    <button onClick={() => navigate("/dashboard")} className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2 text-gray-900 text-xs sm:text-sm">
                                        <iconify-icon icon="mdi:account-cog"></iconify-icon>
                                        Kembali Ke User Dashboard
                                    </button>
                                </div>
                            )}

                        </div>

                    </div>

                    {/* CONTENT */}
                    <div className="overflow-y-auto flex-1">
                        <Suspense fallback={<div className="p-6 text-center text-gray-500">Memuat konten admin...</div>}>
                            {active === "beranda" && (
                                <AdminBeranda
                                    users={users}
                                    modules={modules}
                                    videos={videos}
                                    transactions={transactions}
                                    paths={paths}
                                    setActive={setActive}
                                />
                            )}
                            {active === "video" && (
                                <AdminVideoEdukasi videos={videos} loading={loading} onRefresh={fetchAll} />
                            )}
                            {active === "learning" && (
                                <AdminLearningPath paths={paths} loading={loading} onRefresh={fetchAll} />
                            )}
                            {active === "konten" && (
                                <AdminKontenEdukasi modules={modules} loading={loading} onRefresh={fetchAll} />
                            )}
                            {active === "dailyquiz" && (
                                <AdminDailyQuiz questions={quizQuestions} loading={loading} onRefresh={fetchAll} />
                            )}
                            {active === "review" && (
                                <AdminReviews />
                            )}
                            {active === "aktivitas" && (
                                <AdminAktivitas />
                            )}
                        </Suspense>

                </div>
            </div>

            </main>
        </div>
    );
}