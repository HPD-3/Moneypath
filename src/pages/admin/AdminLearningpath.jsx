import { useState } from "react";
import API from "../../services/api.js";

const CATEGORIES = ["budgeting", "investing", "saving", "debt"];
const DIFFICULTIES = ["beginner", "intermediate", "advanced"];

const DIFF_COLORS = {
    beginner: { bg: "#dcfce7", color: "#166534" },
    intermediate: { bg: "#fef9c3", color: "#854d0e" },
    advanced: { bg: "#fee2e2", color: "#991b1b" },
};

// ── Small reusable badge ──────────────────────────────────────
function Badge({ value, map }) {
    const s = map[value] || { bg: "#f3f4f6", color: "#374151" };
    return <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 20, background: s.bg, color: s.color, textTransform: "capitalize" }}>{value}</span>;
}

// ── Quiz Editor ───────────────────────────────────────────────
function QuizEditor({ pathId, moduleId, quiz, onRefresh }) {
    const EMPTY_Q = { question: "", options: ["", "", "", ""], correctIndex: 0 };
    const [form, setForm] = useState(EMPTY_Q);
    const [show, setShow] = useState(false);
    const [saving, setSaving] = useState(false);

    const handleOption = (i, val) => {
        const opts = [...form.options]; opts[i] = val;
        setForm({ ...form, options: opts });
    };

    const handleSubmit = async e => {
        e.preventDefault();
        setSaving(true);
        try {
            await API.post(`/learningpath/${pathId}/modules/${moduleId}/quiz`, form);
            setForm(EMPTY_Q); setShow(false);
            onRefresh();
        } catch (err) { console.error(err); }
        finally { setSaving(false); }
    };

    const handleDelete = async quizId => {
        if (!confirm("Hapus soal ini?")) return;
        await API.delete(`/learningpath/${pathId}/modules/${moduleId}/quiz/${quizId}`);
        onRefresh();
    };

    return (
        <div style={{ marginTop: 12, background: "#f8fdf8", borderRadius: 8, padding: 12, border: "1px solid #d1fae5" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#166534" }}>📝 Quiz ({quiz.length} soal)</span>
                <button onClick={() => setShow(!show)} style={{ fontSize: 11, background: "#9FF782", color: "#0a1f10", border: "none", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontFamily: "Plus Jakarta Sans, sans-serif", fontWeight: 600 }}>
                    {show ? "✕ Batal" : "+ Tambah Soal"}
                </button>
            </div>

            {show && (
                <form onSubmit={handleSubmit} style={{ marginBottom: 10 }}>
                    <div style={{ marginBottom: 8 }}>
                        <label style={{ fontSize: 11, fontWeight: 600, color: "#4b5563", display: "block", marginBottom: 3 }}>Pertanyaan *</label>
                        <input value={form.question} onChange={e => setForm({ ...form, question: e.target.value })} required
                            className="form-input" placeholder="Tulis pertanyaan..." style={{ fontSize: 12 }} />
                    </div>
                    {form.options.map((opt, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                            <input type="radio" name="correct" checked={form.correctIndex === i}
                                onChange={() => setForm({ ...form, correctIndex: i })} />
                            <input value={opt} onChange={e => handleOption(i, e.target.value)}
                                className="form-input" placeholder={`Pilihan ${String.fromCharCode(65 + i)}`}
                                style={{ fontSize: 12, flex: 1 }} required />
                            {form.correctIndex === i && <span style={{ fontSize: 10, color: "#166534", fontWeight: 600 }}>✓ Benar</span>}
                        </div>
                    ))}
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 8 }}>
                        <button type="submit" disabled={saving} style={{ fontSize: 11, background: "#9FF782", color: "#0a1f10", border: "none", borderRadius: 6, padding: "5px 12px", cursor: "pointer", fontWeight: 600, fontFamily: "Plus Jakarta Sans, sans-serif" }}>
                            {saving ? "..." : "Simpan Soal"}
                        </button>
                    </div>
                </form>
            )}

            {quiz.map((q, i) => (
                <div key={q.id} style={{ fontSize: 12, background: "white", borderRadius: 6, padding: "8px 10px", marginBottom: 6, border: "1px solid #e5e7eb" }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ fontWeight: 600, color: "#374151" }}>Q{i + 1}: {q.question}</span>
                        <button onClick={() => handleDelete(q.id)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 12 }}>🗑️</button>
                    </div>
                    {q.options?.map((opt, j) => (
                        <div key={j} style={{ marginTop: 3, color: j === q.correctIndex ? "#166534" : "#6b7280", fontWeight: j === q.correctIndex ? 600 : 400 }}>
                            {String.fromCharCode(65 + j)}. {opt} {j === q.correctIndex && "✓"}
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );
}

// ── Module Editor ─────────────────────────────────────────────
function ModuleEditor({ pathId, modules, onRefresh }) {
    const EMPTY_M = { title: "", content: "", order: modules.length + 1 };
    const [form, setForm] = useState(EMPTY_M);
    const [editId, setEditId] = useState(null);
    const [show, setShow] = useState(false);
    const [saving, setSaving] = useState(false);
    const [expanded, setExpanded] = useState(null);

    const handleEdit = m => {
        setForm({ title: m.title, content: m.content, order: m.order });
        setEditId(m.id); setShow(true);
    };

    const handleDelete = async id => {
        if (!confirm("Hapus modul ini?")) return;
        await API.delete(`/learningpath/${pathId}/modules/${id}`);
        onRefresh();
    };

    const handleSubmit = async e => {
        e.preventDefault();
        setSaving(true);
        try {
            editId
                ? await API.put(`/learningpath/${pathId}/modules/${editId}`, form)
                : await API.post(`/learningpath/${pathId}/modules`, form);
            setForm({ ...EMPTY_M, order: modules.length + 2 });
            setEditId(null); setShow(false);
            onRefresh();
        } catch (err) { console.error(err); }
        finally { setSaving(false); }
    };

    return (
        <div style={{ marginTop: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#1a3a1f" }}>📦 Modul ({modules.length})</span>
                <button onClick={() => { setForm({ ...EMPTY_M, order: modules.length + 1 }); setEditId(null); setShow(!show); }}
                    style={{ fontSize: 11, background: "#e8fce0", color: "#166534", border: "none", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontWeight: 600, fontFamily: "Plus Jakarta Sans, sans-serif" }}>
                    {show ? "✕" : "+ Tambah Modul"}
                </button>
            </div>

            {show && (
                <form onSubmit={handleSubmit} style={{ background: "#f8fdf8", border: "1px solid #d1fae5", borderRadius: 8, padding: 12, marginBottom: 10 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 80px", gap: 8, marginBottom: 8 }}>
                        <div>
                            <label style={{ fontSize: 11, fontWeight: 600, color: "#4b5563", display: "block", marginBottom: 3 }}>Judul Modul *</label>
                            <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required
                                className="form-input" placeholder="Judul modul" style={{ fontSize: 12 }} />
                        </div>
                        <div>
                            <label style={{ fontSize: 11, fontWeight: 600, color: "#4b5563", display: "block", marginBottom: 3 }}>Urutan</label>
                            <input type="number" value={form.order} onChange={e => setForm({ ...form, order: parseInt(e.target.value) })}
                                className="form-input" style={{ fontSize: 12 }} min={1} />
                        </div>
                    </div>
                    <div>
                        <label style={{ fontSize: 11, fontWeight: 600, color: "#4b5563", display: "block", marginBottom: 3 }}>Konten Materi *</label>
                        <textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} required
                            className="form-input" rows={5} placeholder="Tulis materi pembelajaran di sini..." style={{ fontSize: 12 }} />
                    </div>
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 10 }}>
                        <button type="button" className="btn-cancel" style={{ fontSize: 12 }} onClick={() => { setShow(false); setEditId(null); }}>Batal</button>
                        <button type="submit" disabled={saving} className="btn-save" style={{ fontSize: 12 }}>
                            {saving ? "Menyimpan..." : editId ? "Update Modul" : "Simpan Modul"}
                        </button>
                    </div>
                </form>
            )}

            {modules.map(m => (
                <div key={m.id} style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 8, marginBottom: 8, overflow: "hidden" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", cursor: "pointer" }}
                        onClick={() => setExpanded(expanded === m.id ? null : m.id)}>
                        <span style={{ width: 22, height: 22, borderRadius: "50%", background: "#1a3a1f", color: "#9FF782", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, flexShrink: 0 }}>
                            {m.order}
                        </span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "#1a3a1f", flex: 1 }}>{m.title}</span>
                        <div style={{ display: "flex", gap: 6 }}>
                            <button className="btn-edit" style={{ fontSize: 11 }} onClick={e => { e.stopPropagation(); handleEdit(m); }}>✏️</button>
                            <button className="btn-delete" style={{ fontSize: 11 }} onClick={e => { e.stopPropagation(); handleDelete(m.id); }}>🗑️</button>
                        </div>
                        <span style={{ color: "#9ca3af", fontSize: 12 }}>{expanded === m.id ? "▲" : "▼"}</span>
                    </div>

                    {expanded === m.id && (
                        <div style={{ padding: "0 12px 12px", borderTop: "1px solid #f3f4f6" }}>
                            <p style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.7, marginTop: 10, whiteSpace: "pre-wrap" }}>{m.content}</p>
                            <QuizEditor pathId={pathId} moduleId={m.id} quiz={m.quiz || []} onRefresh={onRefresh} />
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}

// ── Main Admin Learning Path ──────────────────────────────────
export default function AdminLearningPath({ paths = [], loading, onRefresh }) {
    const EMPTY_P = { title: "", description: "", category: "budgeting", difficulty: "beginner", estimatedTime: "" };
    const [form, setForm] = useState(EMPTY_P);
    const [editId, setEditId] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving] = useState(false);
    const [expanded, setExpanded] = useState(null);

    const handleEdit = p => {
        setForm({ title: p.title, description: p.description, category: p.category, difficulty: p.difficulty, estimatedTime: p.estimatedTime || "" });
        setEditId(p.id); setShowForm(true);
    };

    const handleDelete = async id => {
        if (!confirm("Hapus learning path ini?")) return;
        await API.delete(`/learningpath/${id}`);
        onRefresh();
    };

    const handleSubmit = async e => {
        e.preventDefault();
        setSaving(true);
        try {
            editId
                ? await API.put(`/learningpath/${editId}`, form)
                : await API.post("/learningpath", form);
            setForm(EMPTY_P); setEditId(null); setShowForm(false);
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
                    <button className="btn-add" onClick={() => { setForm(EMPTY_P); setEditId(null); setShowForm(!showForm); }}>
                        {showForm ? "✕ Batal" : "+ Buat Path Baru"}
                    </button>
                </div>

                {/* Create/Edit Path Form */}
                {showForm && (
                    <form onSubmit={handleSubmit} style={{ background: "#f8fdf8", border: "1px solid #d1fae5", borderRadius: 10, padding: 16, marginBottom: 20 }}>
                        <div className="form-grid">
                            <div className="form-group full">
                                <label className="form-label">Judul Learning Path *</label>
                                <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required
                                    className="form-input" placeholder="cth: Panduan Budgeting untuk Pemula" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Kategori</label>
                                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="form-input">
                                    {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Tingkat Kesulitan</label>
                                <select value={form.difficulty} onChange={e => setForm({ ...form, difficulty: e.target.value })} className="form-input">
                                    {DIFFICULTIES.map(d => <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Estimasi Waktu</label>
                                <input value={form.estimatedTime} onChange={e => setForm({ ...form, estimatedTime: e.target.value })}
                                    className="form-input" placeholder="cth: 3 jam" />
                            </div>
                            <div className="form-group full">
                                <label className="form-label">Deskripsi</label>
                                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                                    className="form-input" rows={3} placeholder="Deskripsi singkat learning path ini" />
                            </div>
                        </div>
                        <div className="form-actions">
                            <button type="button" className="btn-cancel" onClick={() => { setShowForm(false); setEditId(null); }}>Batal</button>
                            <button type="submit" disabled={saving} className="btn-save">{saving ? "Menyimpan..." : editId ? "Update Path" : "Buat Path"}</button>
                        </div>
                    </form>
                )}

                {/* Path List */}
                {paths.map(p => (
                    <div key={p.id} style={{ border: "1px solid #e5e7eb", borderRadius: 10, marginBottom: 12, overflow: "hidden" }}>
                        {/* Path Header */}
                        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", background: expanded === p.id ? "#f8fdf8" : "white", cursor: "pointer" }}
                            onClick={() => setExpanded(expanded === p.id ? null : p.id)}>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                                    <span style={{ fontWeight: 700, fontSize: 14, color: "#1a3a1f" }}>{p.title}</span>
                                    <Badge value={p.difficulty} map={DIFF_COLORS} />
                                    <span style={{ fontSize: 10, fontWeight: 600, color: "#166534", background: "#e8fce0", padding: "2px 8px", borderRadius: 20, textTransform: "capitalize" }}>{p.category}</span>
                                </div>
                                <div style={{ display: "flex", gap: 16, fontSize: 11, color: "#9ca3af" }}>
                                    <span>📦 {p.totalModules || 0} modul</span>
                                    {p.estimatedTime && <span>⏱ {p.estimatedTime}</span>}
                                </div>
                            </div>
                            <div style={{ display: "flex", gap: 6 }}>
                                <button className="btn-edit" onClick={e => { e.stopPropagation(); handleEdit(p); }}>✏️ Edit</button>
                                <button className="btn-delete" onClick={e => { e.stopPropagation(); handleDelete(p.id); }}>🗑️</button>
                            </div>
                            <span style={{ color: "#9ca3af", fontSize: 14 }}>{expanded === p.id ? "▲" : "▼"}</span>
                        </div>

                        {/* Expandable Module Editor */}
                        {expanded === p.id && (
                            <div style={{ padding: "0 16px 16px", borderTop: "1px solid #f3f4f6" }}>
                                <p style={{ fontSize: 12, color: "#6b7280", marginTop: 10, marginBottom: 10 }}>{p.description}</p>
                                <ModuleEditor pathId={p.id} modules={p.modules || []} onRefresh={onRefresh} />
                            </div>
                        )}
                    </div>
                ))}

                {paths.length === 0 && (
                    <div style={{ textAlign: "center", padding: 48, color: "#9ca3af" }}>
                        <p style={{ fontSize: 36, marginBottom: 10 }}>📚</p>
                        <p>Belum ada learning path. Buat yang pertama!</p>
                    </div>
                )}
            </div>
        </div>
    );
}