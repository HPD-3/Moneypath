import { useState } from "react";
import API from "../../services/api.js";

const EMPTY = {
    title: "", description: "", category: "budgeting",
    youtubeUrl: "", duration: ""
};

const CATEGORIES = ["budgeting", "investing", "saving", "debt"];

function getYouTubeId(url) {
    const regex = /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const match = url?.match(regex);
    return match ? match[1] : null;
}

export default function AdminVideoEdukasi({ loading, onRefresh, videos = [] }) {
    const [form, setForm]         = useState(EMPTY);
    const [editId, setEditId]     = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving]     = useState(false);
    const [error, setError]       = useState(null);
    const [preview, setPreview]   = useState(null);

    const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

    const previewId = getYouTubeId(form.youtubeUrl);

    const handleEdit = v => {
        setForm({
            title: v.title || "", description: v.description || "",
            category: v.category || "budgeting",
            youtubeUrl: v.youtubeUrl || "", duration: v.duration || ""
        });
        setEditId(v.id);
        setShowForm(true);
        setError(null);
    };

    const handleDelete = async id => {
        if (!confirm("Hapus video ini?")) return;
        try {
            await API.delete(`/video/${id}`);
            onRefresh();
        } catch (err) {
            alert("Gagal menghapus: " + err.message);
        }
    };

    const handleSubmit = async e => {
        e.preventDefault();
        setError(null);
        if (!getYouTubeId(form.youtubeUrl)) {
            setError("URL YouTube tidak valid. Contoh: https://youtube.com/watch?v=xxxxx");
            return;
        }
        setSaving(true);
        try {
            editId
                ? await API.put(`/video/${editId}`, form)
                : await API.post("/video", form);
            setForm(EMPTY); setEditId(null); setShowForm(false);
            onRefresh();
        } catch (err) {
            setError(err.response?.data?.error || err.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="page"><p style={{ color: "#9ca3af" }}>Loading...</p></div>;

    return (
        <div className="page">

            {/* Preview Modal */}
            {preview && (
                <div onClick={() => setPreview(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
                    <div onClick={e => e.stopPropagation()} style={{ background: "white", borderRadius: 14, overflow: "hidden", width: "100%", maxWidth: 700 }}>
                        {/* YouTube embed */}
                        <div style={{ position: "relative", paddingBottom: "56.25%", height: 0 }}>
                            <iframe
                                src={`https://www.youtube.com/embed/${preview.youtubeId}?autoplay=1`}
                                style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: "none" }}
                                allow="autoplay; encrypted-media"
                                allowFullScreen
                                title={preview.title}
                            />
                        </div>
                        <div style={{ padding: 18 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                                <div>
                                    <h3 style={{ fontWeight: 700, color: "#1a3a1f", marginBottom: 4 }}>{preview.title}</h3>
                                    <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                                        <span className="badge" style={{ background: "#e8fce0", color: "#166534" }}>{preview.category}</span>
                                        {preview.duration && <span className="badge" style={{ background: "#f3f4f6", color: "#374151" }}>⏱ {preview.duration}</span>}
                                    </div>
                                </div>
                                <button onClick={() => setPreview(null)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#9ca3af" }}>✕</button>
                            </div>
                            <p style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.6 }}>{preview.description}</p>
                        </div>
                    </div>
                </div>
            )}

            <div className="panel">
                <div className="panel-header">
                    <p className="section-title" style={{ margin: 0 }}>Kelola Vidio Edukasi</p>
                    <button className="btn-add" onClick={() => { setForm(EMPTY); setEditId(null); setShowForm(!showForm); setError(null); }}>
                        {showForm ? "✕ Batal" : "+ Tambah Video"}
                    </button>
                </div>

                {/* Form */}
                {showForm && (
                    <form onSubmit={handleSubmit} style={{ background: "#f8fdf8", border: "1px solid #d1fae5", borderRadius: 10, padding: 16, marginBottom: 20 }}>
                        <div className="form-grid">

                            <div className="form-group full">
                                <label className="form-label">Judul Video *</label>
                                <input name="title" value={form.title} onChange={handleChange} required className="form-input" placeholder="Judul video edukasi" />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Kategori</label>
                                <select name="category" value={form.category} onChange={handleChange} className="form-input">
                                    {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Durasi (opsional)</label>
                                <input name="duration" value={form.duration} onChange={handleChange} className="form-input" placeholder="cth: 12:34" />
                            </div>

                            <div className="form-group full">
                                <label className="form-label">URL YouTube *</label>
                                <input name="youtubeUrl" value={form.youtubeUrl} onChange={handleChange} required className="form-input" placeholder="https://youtube.com/watch?v=..." />
                                <span style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>Thumbnail akan otomatis diambil dari YouTube</span>
                            </div>

                            {/* Live thumbnail preview */}
                            {previewId && (
                                <div className="form-group full">
                                    <label className="form-label">Preview Thumbnail</label>
                                    <img
                                        src={`https://img.youtube.com/vi/${previewId}/hqdefault.jpg`}
                                        alt="thumbnail"
                                        style={{ width: 240, borderRadius: 8, border: "1px solid #e5e7eb" }}
                                    />
                                </div>
                            )}

                            <div className="form-group full">
                                <label className="form-label">Deskripsi</label>
                                <textarea name="description" value={form.description} onChange={handleChange} className="form-input" rows={3} placeholder="Deskripsi singkat video" />
                            </div>
                        </div>

                        {error && (
                            <div style={{ background: "#fee2e2", color: "#991b1b", borderRadius: 8, padding: "10px 14px", fontSize: 13, marginTop: 12 }}>
                                ⚠️ {error}
                            </div>
                        )}

                        <div className="form-actions">
                            <button type="button" className="btn-cancel" onClick={() => { setShowForm(false); setEditId(null); setError(null); }}>Batal</button>
                            <button type="submit" disabled={saving} className="btn-save">{saving ? "Menyimpan..." : editId ? "Update Video" : "Simpan Video"}</button>
                        </div>
                    </form>
                )}

                {/* Video Grid */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 14 }}>
                    {videos.map(v => (
                        <div key={v.id} style={{ background: "white", border: "1px solid #f3f4f6", borderRadius: 10, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
                            {/* Thumbnail */}
                            <div style={{ position: "relative", cursor: "pointer" }} onClick={() => setPreview(v)}>
                                <img
                                    src={v.thumbnail}
                                    alt={v.title}
                                    style={{ width: "100%", aspectRatio: "16/9", objectFit: "cover", display: "block" }}
                                />
                                {/* Play overlay */}
                                <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.2)", display: "flex", alignItems: "center", justifyContent: "center", opacity: 0, transition: "opacity 0.2s" }}
                                    onMouseEnter={e => e.currentTarget.style.opacity = 1}
                                    onMouseLeave={e => e.currentTarget.style.opacity = 0}>
                                    <div style={{ width: 44, height: 44, background: "rgba(255,255,255,0.9)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>▶</div>
                                </div>
                                {v.duration && (
                                    <span style={{ position: "absolute", bottom: 6, right: 6, background: "rgba(0,0,0,0.75)", color: "white", fontSize: 10, padding: "2px 6px", borderRadius: 4, fontWeight: 600 }}>
                                        {v.duration}
                                    </span>
                                )}
                            </div>

                            <div style={{ padding: 12 }}>
                                <span className="badge" style={{ background: "#e8fce0", color: "#166534", marginBottom: 6, display: "inline-block" }}>{v.category}</span>
                                <p style={{ fontWeight: 600, fontSize: 13, color: "#1a3a1f", marginBottom: 4, lineHeight: 1.4 }}>{v.title}</p>
                                <p style={{ fontSize: 11, color: "#9ca3af", marginBottom: 10, lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{v.description}</p>
                                <div style={{ display: "flex", gap: 6 }}>
                                    <button className="btn-edit" style={{ flex: 1 }} onClick={() => handleEdit(v)}>✏️ Edit</button>
                                    <button className="btn-delete" onClick={() => handleDelete(v.id)}>🗑️</button>
                                </div>
                            </div>
                        </div>
                    ))}

                    {videos.length === 0 && (
                        <div style={{ gridColumn: "1/-1", textAlign: "center", padding: 48, color: "#9ca3af" }}>
                            <p style={{ fontSize: 40, marginBottom: 10 }}>🎬</p>
                            <p>Belum ada video. Tambahkan video pertama!</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}