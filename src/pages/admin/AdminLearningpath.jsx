import { useState } from "react";
import API from "../../services/api.js";

const EMPTY = { title: "", description: "", category: "budgeting", videoUrl: "", content: "", difficulty: "beginner" };

export default function AdminLearningPath({ modules, loading, onRefresh }) {
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
                    <p className="section-title" style={{ margin: 0 }}>Kelola Learning Path</p>
                    <button className="btn-add" onClick={() => { setForm(EMPTY); setEditId(null); setShowForm(!showForm); }}>
                        {showForm ? "✕ Batal" : "+ Tambah Modul"}
                    </button>
                </div>

                {showForm && (
                    <form onSubmit={handleSubmit} style={{ background: "#f8fdf8", border: "1px solid #d1fae5", borderRadius: 10, padding: 16, marginBottom: 20 }}>
                        <div className="form-grid">
                            <div className="form-group full">
                                <label className="form-label">Judul Modul *</label>
                                <input name="title" value={form.title} onChange={handleChange} required className="form-input" placeholder="Judul modul pembelajaran" />
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
                                <label className="form-label">Deskripsi</label>
                                <textarea name="description" value={form.description} onChange={handleChange} className="form-input" rows={2} placeholder="Deskripsi singkat modul" />
                            </div>
                            <div className="form-group full">
                                <label className="form-label">Konten Pembelajaran</label>
                                <textarea name="content" value={form.content} onChange={handleChange} className="form-input" rows={4} placeholder="Isi materi pembelajaran lengkap..." />
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
                                <th>Judul Modul</th>
                                <th>Kategori</th>
                                <th>Tingkat</th>
                                <th>Video</th>
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
                                        {mod.videoUrl
                                            ? <a href={mod.videoUrl} target="_blank" rel="noreferrer" style={{ color: "#3b82f6", fontSize: 12 }}>🎬 Lihat</a>
                                            : <span style={{ color: "#d1d5db", fontSize: 12 }}>—</span>}
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
                                <tr><td colSpan={6} style={{ textAlign: "center", color: "#9ca3af", padding: 24 }}>Belum ada modul.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}