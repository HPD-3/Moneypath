import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api.js";
import { AdminStyles, Sidebar, Topbar } from "./admin/adminShared.jsx";
import AdminBeranda from "./admin/AdminBeranda.jsx";
import AdminVideoEdukasi from "./admin/AdminVideoEdukasi.jsx";
import AdminLearningPath from "./admin/AdminLearningPath.jsx";
import AdminKontenEdukasi from "./admin/AdminKontenEdukasi.jsx";

const PAGE_TITLES = {
    beranda: "Dashboard Admin",
    video: "Vidio Edukasi",
    learning: "Learning Path",
    konten: "Konten Edukasi",
};

export default function AdminDashboard() {
    const navigate = useNavigate();
    const [active, setActive] = useState("beranda");
    const [users, setUsers] = useState([]);
    const [modules, setModules] = useState([]);
    const [videos, setVideos] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [denied, setDenied] = useState(false);
    const [adminEmail, setAdminEmail] = useState("Admin");

    useEffect(() => { fetchAll(); }, []);

    const fetchAll = async () => {
        setLoading(true);
        try {
            const [uRes, tRes, mRes, vRes, pRes] = await Promise.all([
                API.get("/admin/users"),
                API.get("/admin/transactions"),
                API.get("/admin/learning"),
                API.get("/video"),
                API.get("/auth/profile"),
            ]);
            setUsers(uRes.data);
            setTransactions(tRes.data);
            setModules(mRes.data);
            setVideos(vRes.data);
            setAdminEmail(pRes.data.email?.split("@")[0] || "Admin");
        } catch (err) {
            if (err.response?.status === 403) setDenied(true);
        } finally {
            setLoading(false);
        }
    };

    if (denied) return (
        <>
            <AdminStyles />
            <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Plus Jakarta Sans, sans-serif" }}>
                <div style={{ textAlign: "center" }}>
                    <p style={{ fontSize: 48, marginBottom: 12 }}>🚫</p>
                    <h2 style={{ fontWeight: 700, marginBottom: 8 }}>Akses Ditolak</h2>
                    <p style={{ color: "#6b7280", marginBottom: 20, fontSize: 14 }}>Anda tidak memiliki akses admin.</p>
                    <button className="btn-save" onClick={() => navigate("/dashboard")}>← Kembali</button>
                </div>
            </div>
        </>
    );

    return (
        <>
            <AdminStyles />
            <div className="admin-root">
                <Sidebar active={active} setActive={setActive} onLogout={() => navigate("/")} />
                <div className="main-content">
                    <Topbar title={PAGE_TITLES[active]} adminEmail={adminEmail} />

                    {active === "beranda" && (
                        <AdminBeranda
                            users={users} modules={modules}
                            videos={videos} transactions={transactions}
                            setActive={setActive}
                        />
                    )}
                    {active === "video" && (
                        <AdminVideoEdukasi videos={videos} loading={loading} onRefresh={fetchAll} />
                    )}
                    {active === "learning" && (
                        <AdminLearningPath modules={modules} loading={loading} onRefresh={fetchAll} />
                    )}
                    {active === "konten" && (
                        <AdminKontenEdukasi modules={modules} loading={loading} onRefresh={fetchAll} />
                    )}
                </div>
            </div>
        </>
    );
}