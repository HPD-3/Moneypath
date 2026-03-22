// ── Shared Admin Styles ───────────────────────────────────────
export function AdminStyles() {
    return (
        <style>{`
            @import url('https://fonts.googleapis.com/css2?family=Lilita+One&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');

            * { box-sizing: border-box; margin: 0; padding: 0; }
            .admin-root { font-family: 'Plus Jakarta Sans', sans-serif; display: flex; min-height: 100vh; background: #f0f4f0; }

            .sidebar {
                width: 160px; min-height: 100vh;
                background: linear-gradient(180deg, #1a3a1f 0%, #0f2a18 100%);
                display: flex; flex-direction: column;
                position: fixed; top: 0; left: 0; z-index: 30;
            }
            .sidebar-logo {
                font-family: 'Lilita One', cursive;
                color: #9FF782; font-size: 18px;
                padding: 18px 16px 14px;
                border-bottom: 1px solid rgba(255,255,255,0.08);
                letter-spacing: 1px;
            }
            .sidebar-logo span { color: white; }
            .sidebar-nav { flex: 1; padding: 10px 0; }
            .nav-item {
                display: flex; align-items: center; gap: 10px;
                padding: 10px 16px; font-size: 13px; font-weight: 500;
                color: rgba(255,255,255,0.65); cursor: pointer;
                transition: all 0.2s; border: none; background: none;
                width: 100%; text-align: left;
            }
            .nav-item:hover { color: white; background: rgba(255,255,255,0.06); }
            .nav-item.active { background: #9FF782; color: #0a1f10; font-weight: 600; }
            .sidebar-logout { padding: 14px 16px; border-top: 1px solid rgba(255,255,255,0.08); }
            .logout-btn {
                display: flex; align-items: center; gap: 8px;
                color: rgba(255,255,255,0.5); font-size: 13px;
                background: none; border: none; cursor: pointer;
                font-family: 'Plus Jakarta Sans', sans-serif; transition: color 0.2s;
            }
            .logout-btn:hover { color: #ff7b7b; }

            .main-content { margin-left: 160px; flex: 1; min-height: 100vh; }
            .topbar {
                background: #1a3a1f; padding: 10px 24px;
                display: flex; justify-content: space-between; align-items: center;
                font-size: 13px; color: #9FF782; font-weight: 600;
            }
            .user-badge {
                display: flex; align-items: center; gap: 6px;
                background: rgba(159,247,130,0.12);
                border: 1px solid rgba(159,247,130,0.25);
                border-radius: 20px; padding: 4px 12px 4px 6px;
                color: white; font-size: 12px;
            }
            .user-avatar {
                width: 26px; height: 26px; border-radius: 50%;
                background: #9FF782; color: #0a1f10;
                display: flex; align-items: center; justify-content: center;
                font-size: 12px; font-weight: 700;
            }
            .page { padding: 24px; }
            .page-title { font-size: 22px; font-weight: 700; color: #1a3a1f; margin-bottom: 4px; }
            .page-sub { font-size: 13px; color: #6b7280; margin-bottom: 20px; }
            .section-title { font-size: 16px; font-weight: 700; color: #1a3a1f; margin-bottom: 14px; }
            .panel { background: white; border-radius: 10px; padding: 20px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
            .panel-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }

            .data-table { width: 100%; border-collapse: collapse; font-size: 13px; }
            .data-table th { background: #1a3a1f; color: #9FF782; text-align: left; padding: 10px 14px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
            .data-table td { padding: 10px 14px; border-bottom: 1px solid #f3f4f6; color: #374151; }
            .data-table tr:hover td { background: #f8fdf8; }
            .badge { display: inline-block; font-size: 10px; font-weight: 600; padding: 2px 8px; border-radius: 20px; }

            .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
            .form-group { display: flex; flex-direction: column; gap: 4px; }
            .form-group.full { grid-column: 1 / -1; }
            .form-label { font-size: 11px; font-weight: 600; color: #4b5563; }
            .form-input { border: 1px solid #d1d5db; border-radius: 8px; padding: 8px 12px; font-size: 13px; outline: none; font-family: 'Plus Jakarta Sans', sans-serif; transition: border-color 0.2s; width: 100%; }
            .form-input:focus { border-color: #9FF782; box-shadow: 0 0 0 3px rgba(159,247,130,0.2); }
            .form-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 16px; padding-top: 14px; border-top: 1px solid #f3f4f6; }

            .btn-add { background: #9FF782; color: #0a1f10; border: none; border-radius: 8px; padding: 7px 16px; font-size: 12px; font-weight: 600; cursor: pointer; font-family: 'Plus Jakarta Sans', sans-serif; }
            .btn-save { background: #9FF782; color: #0a1f10; border: none; border-radius: 8px; padding: 8px 20px; font-size: 13px; font-weight: 600; cursor: pointer; font-family: 'Plus Jakarta Sans', sans-serif; transition: opacity 0.2s; }
            .btn-save:hover { opacity: 0.85; }
            .btn-save:disabled { opacity: 0.5; cursor: not-allowed; }
            .btn-cancel { background: #f3f4f6; color: #374151; border: none; border-radius: 8px; padding: 8px 20px; font-size: 13px; font-weight: 500; cursor: pointer; font-family: 'Plus Jakarta Sans', sans-serif; }
            .btn-cancel:hover { background: #e5e7eb; }
            .btn-edit { background: #f3f4f6; color: #374151; border: none; border-radius: 6px; padding: 4px 10px; font-size: 11px; cursor: pointer; font-family: 'Plus Jakarta Sans', sans-serif; }
            .btn-delete { background: #fee2e2; color: #ef4444; border: none; border-radius: 6px; padding: 4px 10px; font-size: 11px; cursor: pointer; font-family: 'Plus Jakarta Sans', sans-serif; }

            @media (max-width: 640px) {
                .sidebar { width: 0; overflow: hidden; }
                .main-content { margin-left: 0; }
            }
        `}</style>
    );
}


export function Sidebar({ active, setActive, onLogout }) {
    const items = [
        { id: "beranda",  icon: "🏠", label: "Beranda" },
        { id: "video",    icon: "▶️",  label: "Vidio Edukasi" },
        { id: "learning", icon: "📊", label: "Learning Path" },
        { id: "konten",   icon: "📋", label: "Konten Edukasi" },
    ];
    return (
        <aside className="sidebar">
            <div className="sidebar-logo">MONEY<span>PATH</span></div>
            <nav className="sidebar-nav">
                {items.map(item => (
                    <button key={item.id}
                        className={`nav-item ${active === item.id ? "active" : ""}`}
                        onClick={() => setActive(item.id)}>
                        <span>{item.icon}</span>
                        {item.label}
                    </button>
                ))}
            </nav>
            <div className="sidebar-logout">
                <button className="logout-btn" onClick={onLogout}>⬅ Logout</button>
            </div>
        </aside>
    );
}

// ── Shared Topbar ─────────────────────────────────────────────
export function Topbar({ title, adminEmail }) {
    return (
        <div className="topbar">
            <span>{title}</span>
            <div className="user-badge">
                <div className="user-avatar">{adminEmail?.[0]?.toUpperCase()}</div>
                {adminEmail}
                <span style={{ color: "rgba(255,255,255,0.4)" }}>▾</span>
            </div>
        </div>
    );
}

// ── Shared Module Form + Table ────────────────────────────────
export function ModuleManager({ title, modules, loading, onRefresh, API }) {
    const { useState } = require("react");
    const EMPTY = { title: "", description: "", category: "budgeting", videoUrl: "", content: "", difficulty: "beginner" };
    const [form, setForm]         = useState(EMPTY);
    const [editId, setEditId]     = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving]     = useState(false);

    const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

    const handleEdit = mod => {
        setForm({ title: mod.title || "", description: mod.description || "", category: mod.category || "budgeting", videoUrl: mod.videoUrl || "", content: mod.content || "", difficulty: mod.difficulty || "beginner" });
        setEditId(mod.id);
        setShowForm(true);
    };

    const handleDelete = async id => {
        if (!confirm("Hapus modul ini?")) return;
        await API.delete(`/admin/learning/${id}`);
        onRefresh();
    };

    const handleSubmit = async e => {
        e.preventDefault();
        setSaving(true);
        try {
            editId
                ? await API.put(`/admin/learning/${editId}`, form)
                : await API.post("/admin/learning", form);
            setForm(EMPTY); setEditId(null); setShowForm(false);
            onRefresh();
        } catch (err) { console.error(err); }
        finally { setSaving(false); }
    };

    if (loading) return <div className="page"><p style={{ color: "#9ca3af" }}>Loading...</p></div>;

    return (
        <div className="page">
            <div className="panel">
                <div className="panel-header">
                    <p className="section-title" style={{ margin: 0 }}>{title}</p>
                    <button className="btn-add" onClick={() => { setForm(EMPTY); setEditId(null); setShowForm(!showForm); }}>
                        {showForm ? "✕ Batal" : "+ Tambah"}
                    </button>
                </div>

                {showForm && (
                    <form onSubmit={handleSubmit} style={{ background: "#f8fdf8", border: "1px solid #d1fae5", borderRadius: 10, padding: 16, marginBottom: 20 }}>
                        <div className="form-grid">
                            <div className="form-group full">
                                <label className="form-label">Judul *</label>
                                <input name="title" value={form.title} onChange={handleChange} required className="form-input" placeholder="Judul modul" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Kategori</label>
                                <select name="category" value={form.category} onChange={handleChange} className="form-input">
                                    <option value="budgeting">Budgeting</option>
                                    <option value="investing">Investing</option>
                                    <option value="saving">Saving</option>
                                    <option value="debt">Debt</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Tingkat Kesulitan</label>
                                <select name="difficulty" value={form.difficulty} onChange={handleChange} className="form-input">
                                    <option value="beginner">Beginner</option>
                                    <option value="intermediate">Intermediate</option>
                                    <option value="advanced">Advanced</option>
                                </select>
                            </div>
                            <div className="form-group full">
                                <label className="form-label">URL Video</label>
                                <input name="videoUrl" value={form.videoUrl} onChange={handleChange} className="form-input" placeholder="https://youtube.com/..." />
                            </div>
                            <div className="form-group full">
                                <label className="form-label">Deskripsi</label>
                                <textarea name="description" value={form.description} onChange={handleChange} className="form-input" rows={2} placeholder="Deskripsi singkat" />
                            </div>
                            <div className="form-group full">
                                <label className="form-label">Konten</label>
                                <textarea name="content" value={form.content} onChange={handleChange} className="form-input" rows={3} placeholder="Isi konten lengkap..." />
                            </div>
                        </div>
                        <div className="form-actions">
                            <button type="button" className="btn-cancel" onClick={() => { setShowForm(false); setEditId(null); }}>Batal</button>
                            <button type="submit" disabled={saving} className="btn-save">{saving ? "Menyimpan..." : editId ? "Update" : "Simpan"}</button>
                        </div>
                    </form>
                )}

                <div style={{ overflowX: "auto" }}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>No</th><th>Judul</th><th>Kategori</th><th>Tingkat</th><th>Video</th><th>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {modules.map((mod, i) => (
                                <tr key={mod.id}>
                                    <td style={{ color: "#9ca3af" }}>{i + 1}</td>
                                    <td style={{ fontWeight: 600 }}>{mod.title}</td>
                                    <td><span className="badge" style={{ background: "#e8fce0", color: "#166534" }}>{mod.category}</span></td>
                                    <td>
                                        <span className="badge" style={{
                                            background: mod.difficulty === "beginner" ? "#dcfce7" : mod.difficulty === "intermediate" ? "#fef9c3" : "#fee2e2",
                                            color: mod.difficulty === "beginner" ? "#166534" : mod.difficulty === "intermediate" ? "#854d0e" : "#991b1b"
                                        }}>{mod.difficulty}</span>
                                    </td>
                                    <td>{mod.videoUrl ? <a href={mod.videoUrl} target="_blank" rel="noreferrer" style={{ color: "#3b82f6", fontSize: 12 }}>🎬 Lihat</a> : <span style={{ color: "#d1d5db" }}>—</span>}</td>
                                    <td>
                                        <div style={{ display: "flex", gap: 6 }}>
                                            <button className="btn-edit" onClick={() => handleEdit(mod)}>✏️ Edit</button>
                                            <button className="btn-delete" onClick={() => handleDelete(mod.id)}>🗑️</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {modules.length === 0 && (
                                <tr><td colSpan={6} style={{ textAlign: "center", color: "#9ca3af", padding: "24px" }}>Belum ada data.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}