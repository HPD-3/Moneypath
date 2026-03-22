export default function AdminBeranda({ users, modules, transactions, setActive }) {
    const recentActivity = modules.slice(0, 5).map(m => ({
        text: "Admin menambahkan learning path",
        highlight: m.title,
        date: m.createdAt
            ? new Date(m.createdAt).toLocaleDateString("id-ID", {
                day: "2-digit", month: "2-digit", year: "numeric"
              }).replace(/\//g, "-")
            : "—",
    }));

    return (
        <div className="page" style={{ position: "relative" }}>

            {/* Header */}
            <div style={{ maxWidth: "calc(100% - 240px)" }}>
                <h1 className="page-title">Selamat Datang, Admin</h1>
                <p className="page-sub">
                    Kelola fitur edukasi yang ada dengan mudah di dashboard admin ini
                </p>

                {/* Stat Cards */}
                <div style={{ display: "flex", gap: 14, marginBottom: 28, flexWrap: "wrap" }}>
                    <div style={{ background: "white", borderRadius: 10, padding: "14px 20px", display: "flex", alignItems: "center", gap: 12, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", minWidth: 130 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 8, background: "#e8fce0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>▶️</div>
                        <div>
                            <div style={{ fontSize: 26, fontWeight: 700, color: "#1a3a1f", lineHeight: 1 }}>
                                {modules.filter(m => m.videoUrl).length}
                            </div>
                            <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>Vidio Edukasi</div>
                        </div>
                    </div>

                    <div style={{ background: "white", borderRadius: 10, padding: "14px 20px", display: "flex", alignItems: "center", gap: 12, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", minWidth: 130 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 8, background: "#e8fce0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>📊</div>
                        <div>
                            <div style={{ fontSize: 26, fontWeight: 700, color: "#1a3a1f", lineHeight: 1 }}>
                                {modules.length}
                            </div>
                            <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>Learning Path</div>
                        </div>
                    </div>

                    <div style={{ background: "white", borderRadius: 10, padding: "14px 20px", display: "flex", alignItems: "center", gap: 12, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", minWidth: 130 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 8, background: "#e8fce0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>👥</div>
                        <div>
                            <div style={{ fontSize: 26, fontWeight: 700, color: "#1a3a1f", lineHeight: 1 }}>
                                {users.length}
                            </div>
                            <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>Total Users</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Hero graphic */}
            <div style={{
                position: "absolute", right: 0, top: 0,
                width: 220, height: 160,
                background: "linear-gradient(135deg, #e8fce0, #c6f5b0)",
                borderRadius: 12, display: "flex", alignItems: "center",
                justifyContent: "center", fontSize: 52
            }}>
                💻📈
            </div>

            {/* Manage Cards */}
            <p className="section-title">Menajemen Fitur Edukasi</p>
            <div style={{ display: "flex", gap: 14, marginBottom: 28, flexWrap: "wrap" }}>
                {[
                    { id: "video",    icon: "▶️",  label: "Mengelola Vidio Edukasi" },
                    { id: "learning", icon: "📊", label: "Mengelola Learning Path" },
                    { id: "konten",   icon: "📋", label: "Mengelola Konten Edukasi" },
                ].map(item => (
                    <div key={item.id} style={{ background: "white", borderRadius: 10, padding: 16, width: 170, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
                        <div style={{ width: 32, height: 32, borderRadius: 6, background: "#e8fce0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, marginBottom: 8 }}>
                            {item.icon}
                        </div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: "#1a3a1f", marginBottom: 10, lineHeight: 1.4 }}>
                            {item.label}
                        </div>
                        <button
                            onClick={() => setActive(item.id)}
                            style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#9FF782", color: "#0a1f10", border: "none", borderRadius: 6, padding: "6px 10px", fontSize: 11, fontWeight: 600, cursor: "pointer", width: "100%", fontFamily: "Plus Jakarta Sans, sans-serif" }}>
                            Kelola <span>›</span>
                        </button>
                    </div>
                ))}
            </div>

            {/* Activity Table */}
            <div style={{ background: "white", borderRadius: 10, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", overflow: "hidden" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 18px", borderBottom: "1px solid #f3f4f6" }}>
                    <span style={{ fontSize: 15, fontWeight: 700, color: "#1a3a1f" }}>Aktivitas Terbaru</span>
                    <span style={{ fontSize: 12, color: "#ef4444", fontWeight: 600, cursor: "pointer" }}>Lihat Semua &gt;</span>
                </div>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                    <thead>
                        <tr style={{ background: "#fafafa", borderBottom: "1px solid #f3f4f6" }}>
                            <th style={{ textAlign: "left", padding: "10px 18px", color: "#6b7280", fontWeight: 600, fontSize: 12 }}>Aktivitas</th>
                            <th style={{ textAlign: "left", padding: "10px 18px", color: "#6b7280", fontWeight: 600, fontSize: 12 }}>Tanggal</th>
                            <th style={{ textAlign: "left", padding: "10px 18px", color: "#6b7280", fontWeight: 600, fontSize: 12 }}>Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {recentActivity.length === 0 ? (
                            <tr><td colSpan={3} style={{ textAlign: "center", color: "#9ca3af", padding: 20 }}>Belum ada aktivitas</td></tr>
                        ) : recentActivity.map((a, i) => (
                            <tr key={i} style={{ borderBottom: "1px solid #f9fafb" }}>
                                <td style={{ padding: "12px 18px", color: "#374151" }}>
                                    {a.text} "<strong>{a.highlight}</strong>"
                                </td>
                                <td style={{ padding: "12px 18px", color: "#6b7280" }}>{a.date}</td>
                                <td style={{ padding: "12px 18px" }}>
                                    <span style={{ color: "#ef4444", fontWeight: 600, fontSize: 12, cursor: "pointer" }}>Lihat &gt;</span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}