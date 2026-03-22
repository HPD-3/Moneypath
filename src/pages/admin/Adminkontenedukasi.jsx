import { useState } from "react";
import API from "../../services/api.js";

const EMPTY = { title: "", description: "", category: "budgeting", videoUrl: "", content: "", difficulty: "beginner" };

export default function AdminKontenEdukasi({ modules, loading, onRefresh }) {
    const [form, setForm]         = useState(EMPTY);
    const [editId, setEditId]     = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving]     = useState(false);
    const [preview, setPreview]   = useState(null);

    const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

    const handleEdit = mod => {
        setForm({ title: mod.title || "", description: mod.description || "", category: mod.category || "budgeting", videoUrl: mod.videoUrl || "", content: mod.content || "", difficulty: mod.difficulty || "beginner" });
        setEditId(mod.id);
        setShowForm(true);
        setPreview(null);
    };

    const handleDelete = async id => {
        if (!confirm("Hapus konten ini?")) return;
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

            {/* Preview Modal */}
            {preview && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
                    <div style={{ background: "white", borderRadius: 12, padding: 28, maxWidth: 560, width: "100%", maxHeight: "80vh", overflowY: "auto" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                            <h3 style={{ fontWeight: 700, color: "#1a3a1f" }}>{preview.title}</h3>
                            <button onClick={() => setPreview(null)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#9ca3af" }}>✕</button>
                        </div>
                        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                            <span className="badge" style={{ background: "#e8fce0", color: "#166534" }}>{preview.category}</span>
                            <span className="badge" style={{ background: "#dbeafe", color: "#1d4ed8" }}>{preview.difficulty}</span>
                        </div>
                        <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 14 }}>{preview.description}</p>
                        <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.7, whiteSpace: "pre-wrap", background: "#f9fafb", borderRadius: 8, padding: 14 }}>
                            {preview.content || "Tidak ada konten."}
                        </div>
                        {preview.videoUrl && (
                            <a href={preview.videoUrl} target="_blank" rel="noreferrer"
                                style={{ display: "inline-block", marginTop: 14, color: "#3b82f6", fontSize: 13 }}>
                                🎬 Tonton Video
                            </a>
                        )}
                    </div>
                </div>
            )}

            <div className="panel">
                <div className="panel-header">
                    <p className="section-title" style={{ margin: 0 }}>Kelola Konten Edukasi</p>
                    <button className="btn-add" onClick={() => { setForm(EMPTY); setEditId(null); setShowForm(!showForm); setPreview(null); }}>
                        {showForm ? "✕ Batal" : "+ Tambah Konten"}
                    </button>
                </div>

                {showForm && (
                    <form onSubmit={handleSubmit} style={{ background: "#f8fdf8", border: "1px solid #d1fae5", borderRadius: 10, padding: 16, marginBottom: 20 }}>
                        <div className="form-grid">
                            <div className="form-group full">
                                <label className="form-label">Judul Konten *</label>
                                <input name="title" value={form.title} onChange={handleChange} required className="form-input" placeholder="Judul artikel / konten edukasi" />
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
                                <label className="form-label">URL Video (opsional)</label>
                                <input name="videoUrl" value={form.videoUrl} onChange={handleChange} className="form-input" placeholder="https://youtube.com/..." />
                            </div>
                            <div className="form-group full">
                                <label className="form-label">Deskripsi Singkat</label>
                                <textarea name="description" value={form.description} onChange={handleChange} className="form-input" rows={2} placeholder="Ringkasan konten" />
                            </div>
                            <div className="form-group full">
                                <label className="form-label">Isi Konten *</label>
                                <textarea name="content" value={form.content} onChange={handleChange} required className="form-input" rows={5} placeholder="Tulis isi artikel / konten edukasi di sini..." />
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
                                <th>No</th>
                                <th>Judul</th>
                                <th>Kategori</th>
                                <th>Tingkat</th>
                                <th>Konten</th>
                                <th>Aksi</th>
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
                                    <td>
                                        <button onClick={() => setPreview(mod)}
                                            style={{ color: "#3b82f6", fontSize: 12, background: "none", border: "none", cursor: "pointer", fontFamily: "Plus Jakarta Sans, sans-serif" }}>
                                            📄 Lihat
                                        </button>
                                    </td>
                                    <td>
                                        <div style={{ display: "flex", gap: 6 }}>
                                            <button className="btn-edit" onClick={() => handleEdit(mod)}>✏️ Edit</button>
                                            <button className="btn-delete" onClick={() => handleDelete(mod.id)}>🗑️</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {modules.length === 0 && (
                                <tr><td colSpan={6} style={{ textAlign: "center", color: "#9ca3af", padding: 24 }}>Belum ada konten edukasi.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}