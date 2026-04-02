import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api.js";

// Import Sub-komponen
import AdminBeranda from "./admin/AdminBeranda.jsx";
import AdminVideoEdukasi from "./admin/AdminVideoEdukasi.jsx";
import AdminLearningPath from "./admin/AdminLearningPath.jsx";
import AdminKontenEdukasi from "./admin/AdminKontenEdukasi.jsx";
import AdminDailyQuiz from "./admin/AdminDailyQuiz.jsx";
import Sidebar from "./admin/AdminShared.jsx";

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

    useEffect(() => { fetchAll(); }, []);

    const fetchAll = async () => {
        setLoading(true);
        try {
            const [uRes, mRes, vRes, pRes, pathRes, qRes] = await Promise.all([
                API.get("/admin/users"),
                API.get("/admin/learning"),
                API.get("/video"),
                API.get("/auth/profile"),
                API.get("/learningpath"),
                API.get("/quiz/questions"),
            ]);
            setUsers(uRes.data);
            setModules(mRes.data);
            setVideos(vRes.data);
            setAdminEmail(pRes.data.email?.split("@")[0] || "Admin");
            setPaths(pathRes.data);
            setQuizQuestions(qRes.data);
        } catch (err) {
            if (err.response?.status === 403) setDenied(true);
        }
        try {
            const tRes = await API.get("/admin/transactions");
            setTransactions(tRes.data);
        } catch (err) {
            setTransactions([]);
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
        <div className="flex h-screen bg-white-100 overflow-hidden" style={{ fontFamily: "'Open Sans', sans-serif" }}>
            {/* INJECT CUSTOM FONT STYLES */}
            <style>
                {`
                @import url('https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600&family=Libre+Caslon+Text:wght@400;600;700&display=swap');
                .heading { font-family: 'Libre Caslon Text', serif; font-weight: 700; }
                `}
            </style>

            {/* SIDEBAR */}
            <aside className="w-64 h-screen bg-gradient-to-b from-[#0b2a17] to-[#123d23] text-white flex flex-col flex-shrink-0">
                <Sidebar active={active} setActive={setActive} handleLogout={handleLogout} />
            </aside>

            {/* MAIN CONTENT AREA */}
            <main className="flex-1 p-4 overflow-y-auto bg-gray-100">
                <div className="bg-gray-50 rounded-xl overflow-hidden min-h-full shadow-sm">

                    {/* HEADER / TOPBAR */}
                    <div className="bg-white border-b px-6 py-3 flex justify-between items-center shadow-sm">
                        <h1 className="text-xl heading">
                            {active === "beranda" ? `Selamat Datang, ${adminEmail}` : active.charAt(0).toUpperCase() + active.slice(1).replace('_', ' ')}
                        </h1>

                        <div className="relative">
                            <div onClick={() => setIsProfileOpen(!isProfileOpen)}
                                className="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full cursor-pointer hover:bg-gray-200 transition-colors">
                                <div className="bg-green-500 text-white rounded-full p-1 flex items-center justify-center">
                                    <iconify-icon icon="mdi:account"></iconify-icon>
                                </div>
                                <span className="text-sm font-semibold">{adminEmail}</span>
                                <iconify-icon icon="mdi:chevron-down"></iconify-icon>
                            </div>

                            {isProfileOpen && (
                                <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-md border overflow-hidden z-50">
                                    <button onClick={() => navigate("/profil")} className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2 text-sm">
                                        <iconify-icon icon="mdi:account-cog"></iconify-icon>
                                        Kelola Profil
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* DYNAMIC CONTENT */}
                    <div className="p-6">
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
                    </div>
                </div>
            </main>
        </div>
    );
}