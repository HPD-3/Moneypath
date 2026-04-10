import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase.js";
import API from "../services/api.js";
import Sidebar from "../components/Sidebar.jsx";
import Navbar from "../components/Navbar.jsx";

const fmt = (n) => `Rp ${(n || 0).toLocaleString("id-ID")}`;
const MONTHS = ["", "Januari", "Februari", "Maret", "April", "Mei",
    "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

export default function RekapBulanan() {
    const navigate = useNavigate();
    const now = new Date();
    const [year, setYear] = useState(now.getFullYear());
    const [month, setMonth] = useState(now.getMonth() + 1);
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState(null);
    const [ready, setReady] = useState(false);

    // New state for sidebar and navbar
    const [profile, setProfile] = useState(null);
    const [personal, setPersonal] = useState(null);
    const [activeNav, setActiveNav] = useState("rekap");
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (user) => {
            if (user) {
                setReady(true); // ✅ tandai siap
                Promise.all([
                    API.get("/auth/profile"),
                    API.get("/personal/profile"),
                ]).then(([pRes, perRes]) => {
                    setProfile(pRes.data);
                    setPersonal(perRes.data);
                }).catch(console.error);
            } else {
                setReady(false);
            }
        });

        return () => unsub(); // cleanup
    }, []);

    useEffect(() => {
        if (ready) {
            fetchRekap();
        }
    }, [ready, year, month]);

    const fetchRekap = async () => {
        setLoading(true);
        try {
            const user = auth.currentUser;

            if (!user) {
                console.warn("User belum ready");
                setLoading(false);
                return;
            }

            const res = await API.get(`/rekap?year=${year}&month=${month}`);
            setData(res.data);
            setError(null);
        } catch (err) {
            console.error("Error fetching rekap:", err);
            setError(err.response?.data?.error || err.message);
            setData(null);
        } finally {
            setLoading(false);
        }
    };

    const handleSend = async () => {
        setSending(true);
        setSent(false);
        try {
            await API.post("/rekap/send", { year, month });
            setSent(true);
            setTimeout(() => setSent(false), 5000);
        } catch (err) {
            setError(err.response?.data?.error || err.message);
        } finally {
            setSending(false);
        }
    };

    const handleNavigation = (navId) => {
        const routes = {
            beranda: "/dashboard",
            edukasi: "/video",
            tabungan: "/tabungan",
            profil: "/profile",
        };
        if (routes[navId]) navigate(routes[navId]);
    };

    const handleLogout = async () => {
        await auth.signOut();
        navigate("/login");
    };

    const isPositive = (data?.summary?.netBalance || 0) >= 0;

    return (
        <div className="flex h-screen bg-gray-50 font-sans overflow-hidden">
            <Sidebar active={activeNav} setActive={(navId) => { setActiveNav(navId); handleNavigation(navId); }} handleLogout={handleLogout} isOpen={isSidebarOpen} setOpen={setIsSidebarOpen} />

            <div className="flex-1 flex flex-col overflow-hidden w-full">
                <Navbar profile={profile} personal={personal} isOpen={isProfileOpen} setOpen={setIsProfileOpen} isSidebarOpen={isSidebarOpen} setSidebarOpen={setIsSidebarOpen} />

                <div className="flex-1 overflow-y-auto bg-gray-100">
                    <div style={{ minHeight: "100vh", background: "#f0f4f0", fontFamily: "Plus Jakarta Sans, sans-serif" }}>
                        <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap'); * { box-sizing: border-box; margin: 0; padding: 0; }`}</style>

                        <div style={{ maxWidth: 560, margin: "0 auto", padding: "20px 16px 48px", paddingTop: "60px" }}>

                            {/* Month Selector */}
                            <div style={{ background: "white", borderRadius: 14, padding: "16px 20px", marginBottom: 20, border: "1px solid #f0f0f0", display: "flex", gap: 10, alignItems: "center" }}>
                                <select value={month} onChange={e => setMonth(parseInt(e.target.value))}
                                    style={{ flex: 1, border: "1px solid #d1d5db", borderRadius: 8, padding: "9px 12px", fontSize: 13, outline: "none", fontFamily: "Plus Jakarta Sans, sans-serif", background: "white" }}>
                                    {MONTHS.slice(1).map((m, i) => (
                                        <option key={i + 1} value={i + 1}>{m}</option>
                                    ))}
                                </select>
                                <select value={year} onChange={e => setYear(parseInt(e.target.value))}
                                    style={{ width: 90, border: "1px solid #d1d5db", borderRadius: 8, padding: "9px 12px", fontSize: 13, outline: "none", fontFamily: "Plus Jakarta Sans, sans-serif", background: "white" }}>
                                    {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                                </select>
                                <button onClick={fetchRekap}
                                    style={{ background: "#1a3a1f", color: "#9FF782", border: "none", borderRadius: 8, padding: "9px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "Plus Jakarta Sans, sans-serif" }}>
                                    Lihat
                                </button>
                            </div>

                            {/* Send Email Button */}
                            {!loading && data && (
                                <div style={{ marginBottom: 20 }}>
                                    {sent ? (
                                        <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 12, padding: "14px 18px", display: "flex", alignItems: "center", gap: 10 }}>
                                            <span style={{ fontSize: 20 }}>✅</span>
                                            <div>
                                                <p style={{ fontWeight: 600, color: "#166534", fontSize: 13 }}>Rekap berhasil dikirim!</p>
                                                <p style={{ fontSize: 11, color: "#4ade80", marginTop: 2 }}>Cek inbox email kamu: {data.email}</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <button onClick={handleSend} disabled={sending}
                                            style={{ width: "100%", background: sending ? "#9ca3af" : "linear-gradient(135deg,#1a3a1f,#0f2a18)", color: "#9FF782", border: "none", borderRadius: 12, padding: "14px", fontSize: 14, fontWeight: 700, cursor: sending ? "not-allowed" : "pointer", fontFamily: "Plus Jakarta Sans, sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                                            {sending ? "Mengirim..." : `📧 Kirim Rekap ke ${data.email}`}
                                        </button>
                                    )}
                                </div>
                            )}

                            {error && (
                                <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: 10, padding: "12px 16px", marginBottom: 16, fontSize: 13, color: "#991b1b" }}>
                                    ⚠️ {error}
                                </div>
                            )}

                            {loading && (
                                <div style={{ textAlign: "center", padding: 48, color: "#9ca3af" }}>
                                    <div style={{ width: 32, height: 32, border: "3px solid #9FF782", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
                                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                                    <p style={{ fontSize: 13 }}>Memuat rekap...</p>
                                </div>
                            )}

                            {!loading && data && (
                                <>
                                    {/* Summary */}
                                    <div style={{ background: isPositive ? "#f0fdf4" : "#fef2f2", border: `1px solid ${isPositive ? "#bbf7d0" : "#fecaca"}`, borderRadius: 16, padding: "20px", marginBottom: 16, textAlign: "center" }}>
                                        <p style={{ fontSize: 11, color: isPositive ? "#166534" : "#991b1b", textTransform: "uppercase", letterSpacing: 1.5, fontWeight: 600, marginBottom: 6 }}>Selisih Bersih {MONTHS[month]} {year}</p>
                                        <p style={{ fontSize: 32, fontWeight: 800, color: isPositive ? "#166534" : "#991b1b" }}>
                                            {isPositive ? "+" : ""}{fmt(data.summary.netBalance)}
                                        </p>
                                        <p style={{ fontSize: 12, color: isPositive ? "#4ade80" : "#f87171", marginTop: 6 }}>
                                            {isPositive ? "✅ Keuangan sehat bulan ini!" : "⚠️ Pengeluaran melebihi pemasukan"}
                                        </p>
                                    </div>

                                    {/* Income vs Expense */}
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                                        <div style={{ background: "white", borderRadius: 14, padding: 16, border: "1px solid #f0f0f0", textAlign: "center" }}>
                                            <p style={{ fontSize: 11, color: "#9ca3af", marginBottom: 6 }}>💰 Total Pemasukan</p>
                                            <p style={{ fontSize: 16, fontWeight: 800, color: "#166534" }}>+{fmt(data.summary.totalIncome)}</p>
                                        </div>
                                        <div style={{ background: "white", borderRadius: 14, padding: 16, border: "1px solid #f0f0f0", textAlign: "center" }}>
                                            <p style={{ fontSize: 11, color: "#9ca3af", marginBottom: 6 }}>💸 Total Pengeluaran</p>
                                            <p style={{ fontSize: 16, fontWeight: 800, color: "#991b1b" }}>-{fmt(data.summary.totalExpense)}</p>
                                        </div>
                                    </div>

                                    {/* Per Category */}
                                    <div style={{ background: "white", borderRadius: 14, border: "1px solid #f0f0f0", marginBottom: 16, overflow: "hidden" }}>
                                        <div style={{ padding: "14px 16px", borderBottom: "1px solid #f3f4f6" }}>
                                            <p style={{ fontWeight: 700, fontSize: 14, color: "#1a3a1f" }}>📊 Per Kategori Balance</p>
                                        </div>
                                        {Object.entries(data.byCategory).length === 0 ? (
                                            <p style={{ padding: "16px", textAlign: "center", color: "#9ca3af", fontSize: 13 }}>Tidak ada transaksi bulan ini</p>
                                        ) : Object.entries(data.byCategory).map(([cat, d], i) => (
                                            <div key={cat} style={{ padding: "12px 16px", borderBottom: i < Object.keys(data.byCategory).length - 1 ? "1px solid #f9fafb" : "none", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                <p style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>{cat}</p>
                                                <div style={{ textAlign: "right" }}>
                                                    {d.income > 0 && <p style={{ fontSize: 12, color: "#166534", fontWeight: 600 }}>+{fmt(d.income)}</p>}
                                                    {d.expense > 0 && <p style={{ fontSize: 12, color: "#991b1b", fontWeight: 600 }}>-{fmt(d.expense)}</p>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Balances */}
                                    <div style={{ background: "white", borderRadius: 14, border: "1px solid #f0f0f0", marginBottom: 16, overflow: "hidden" }}>
                                        <div style={{ padding: "14px 16px", borderBottom: "1px solid #f3f4f6" }}>
                                            <p style={{ fontWeight: 700, fontSize: 14, color: "#1a3a1f" }}>💳 Saldo Saat Ini</p>
                                        </div>
                                        {data.balances.map((b, i) => (
                                            <div key={b.id} style={{ padding: "12px 16px", borderBottom: i < data.balances.length - 1 ? "1px solid #f9fafb" : "none", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                <div>
                                                    <p style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>{b.name}</p>
                                                    <p style={{ fontSize: 11, color: "#9ca3af", textTransform: "capitalize", marginTop: 2 }}>{b.type}</p>
                                                </div>
                                                <p style={{ fontSize: 13, fontWeight: 700, color: "#1a3a1f" }}>{fmt(b.balance)}</p>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Tabungan */}
                                    {data.tabungan.some(t => t.setoranBulanIni > 0) && (
                                        <div style={{ background: "white", borderRadius: 14, border: "1px solid #f0f0f0", marginBottom: 16, overflow: "hidden" }}>
                                            <div style={{ padding: "14px 16px", borderBottom: "1px solid #f3f4f6" }}>
                                                <p style={{ fontWeight: 700, fontSize: 14, color: "#1a3a1f" }}>🐷 Setoran Tabungan Bulan Ini</p>
                                            </div>
                                            {data.tabungan.filter(t => t.setoranBulanIni > 0).map((t, i, arr) => {
                                                const pct = Math.min(Math.round((t.terkumpul / t.targetAmount) * 100), 100);
                                                return (
                                                    <div key={t.id} style={{ padding: "12px 16px", borderBottom: i < arr.length - 1 ? "1px solid #f9fafb" : "none" }}>
                                                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                                                            <p style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>{t.name}</p>
                                                            <p style={{ fontSize: 13, fontWeight: 700, color: "#166534" }}>+{fmt(t.setoranBulanIni)}</p>
                                                        </div>
                                                        <div style={{ background: "#f3f4f6", borderRadius: 4, height: 5, overflow: "hidden" }}>
                                                            <div style={{ width: `${pct}%`, height: "100%", borderRadius: 4, background: t.isCompleted ? "#9FF782" : "#1a3a1f" }} />
                                                        </div>
                                                        <p style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}>{fmt(t.terkumpul)} / {fmt(t.targetAmount)} ({pct}%)</p>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {/* No activity */}
                                    {data.summary.totalTransaksi === 0 && (
                                        <div style={{ textAlign: "center", padding: "32px 0", color: "#9ca3af" }}>
                                            <p style={{ fontSize: 36, marginBottom: 10 }}>📭</p>
                                            <p style={{ fontSize: 14 }}>Tidak ada transaksi di {MONTHS[month]} {year}</p>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}