import { useState } from "react";
import API from "../../services/api.js";

const EMPTY = { question: "", options: ["", "", "", ""], correctIndex: 0, category: "general" };
const CATEGORIES = ["general", "budgeting", "investing", "saving", "debt"];

export default function AdminDailyQuiz({ questions = [], loading, onRefresh }) {
    const [form, setForm]         = useState(EMPTY);
    const [editId, setEditId]     = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving]     = useState(false);

    const handleOption = (i, val) => {
        const opts = [...form.options]; opts[i] = val;
        setForm({ ...form, options: opts });
    };

    const handleEdit = q => {
        setForm({ question: q.question, options: [...q.options], correctIndex: q.correctIndex, category: q.category || "general" });
        setEditId(q.id); setShowForm(true);
    };

    const handleDelete = async id => {
        if (!confirm("Hapus soal ini?")) return;
        await API.delete(`/quiz/questions/${id}`);
        onRefresh();
    };

    const handleSubmit = async e => {
        e.preventDefault();
        setSaving(true);
        try {
            editId
                ? await API.put(`/quiz/questions/${editId}`, form)
                : await API.post("/quiz/questions", form);
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
                    <div>
                        <p className="section-title" style={{ margin: 0 }}>Kelola Soal Daily Quiz</p>
                        <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>{questions.length} soal tersedia dalam pool</p>
                    </div>
                    <button className="btn-add" onClick={() => { setForm(EMPTY); setEditId(null); setShowForm(!showForm); }}>
                        {showForm ? "✕ Batal" : "+ Tambah Soal"}
                    </button>
                </div>

                {/* EXP Info */}
                <div style={{ background: "#f8fdf8", border: "1px solid #d1fae5", borderRadius: 10, padding: 14, marginBottom: 20, display: "flex", gap: 20, flexWrap: "wrap" }}>
                    {[
                        { icon: "⚡", label: "Daily Quiz Selesai", exp: "+50 EXP" },
                        { icon: "🔥", label: "Streak Bonus", exp: "+10 EXP/hari" },
                        { icon: "📦", label: "Selesai Modul", exp: "+20 EXP" },
                        { icon: "📝", label: "Lulus Quiz Modul", exp: "+30 EXP" },
                        { icon: "🏆", label: "Selesai Full Path", exp: "+100 EXP" },
                    ].map((r, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span>{r.icon}</span>
                            <div>
                                <p style={{ fontSize: 11, color: "#374151", fontWeight: 600 }}>{r.label}</p>
                                <p style={{ fontSize: 11, color: "#166534", fontWeight: 700 }}>{r.exp}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Form */}
                {showForm && (
                    <form onSubmit={handleSubmit} style={{ background: "#f8fdf8", border: "1px solid #d1fae5", borderRadius: 10, padding: 16, marginBottom: 20 }}>
                        <div className="form-group full" style={{ marginBottom: 12 }}>
                            <label className="form-label">Pertanyaan *</label>
                            <textarea value={form.question} onChange={e => setForm({ ...form, question: e.target.value })}
                                required className="form-input" rows={2} placeholder="Tulis pertanyaan quiz..." />
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                            <div className="form-group">
                                <label className="form-label">Kategori</label>
                                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="form-input">
                                    {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Jawaban Benar</label>
                                <select value={form.correctIndex} onChange={e => setForm({ ...form, correctIndex: parseInt(e.target.value) })} className="form-input">
                                    {["A", "B", "C", "D"].map((l, i) => <option key={i} value={i}>Pilihan {l}</option>)}
                                </select>
                            </div>
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
                            {form.options.map((opt, i) => (
                                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                    <span style={{ width: 28, height: 28, borderRadius: "50%", background: form.correctIndex === i ? "#1a3a1f" : "#f3f4f6", color: form.correctIndex === i ? "#9FF782" : "#9ca3af", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                                        {String.fromCharCode(65 + i)}
                                    </span>
                                    <input value={opt} onChange={e => handleOption(i, e.target.value)}
                                        required className="form-input" placeholder={`Pilihan ${String.fromCharCode(65 + i)}`} />
                                    {form.correctIndex === i && <span style={{ fontSize: 11, color: "#166534", fontWeight: 700, whiteSpace: "nowrap" }}>✓ Benar</span>}
                                </div>
                            ))}
                        </div>

                        <div className="form-actions">
                            <button type="button" className="btn-cancel" onClick={() => { setShowForm(false); setEditId(null); }}>Batal</button>
                            <button type="submit" disabled={saving} className="btn-save">{saving ? "Menyimpan..." : editId ? "Update Soal" : "Simpan Soal"}</button>
                        </div>
                    </form>
                )}

                {/* Question List */}
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {questions.map((q, i) => (
                        <div key={q.id} style={{ background: "white", border: "1px solid #f3f4f6", borderRadius: 10, padding: 14 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 10 }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: "flex", gap: 8, marginBottom: 6 }}>
                                        <span style={{ fontSize: 11, color: "#9ca3af" }}>#{i + 1}</span>
                                        <span style={{ fontSize: 10, fontWeight: 600, background: "#e8fce0", color: "#166534", padding: "1px 6px", borderRadius: 20, textTransform: "capitalize" }}>{q.category}</span>
                                    </div>
                                    <p style={{ fontWeight: 600, fontSize: 14, color: "#1a3a1f" }}>{q.question}</p>
                                </div>
                                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                                    <button className="btn-edit" onClick={() => handleEdit(q)}>✏️ Edit</button>
                                    <button className="btn-delete" onClick={() => handleDelete(q.id)}>🗑️</button>
                                </div>
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                                {q.options?.map((opt, j) => (
                                    <div key={j} style={{ fontSize: 12, padding: "6px 10px", borderRadius: 6, background: j === q.correctIndex ? "#dcfce7" : "#f9fafb", color: j === q.correctIndex ? "#166534" : "#6b7280", border: j === q.correctIndex ? "1px solid #86efac" : "1px solid #f3f4f6", fontWeight: j === q.correctIndex ? 600 : 400, display: "flex", gap: 6 }}>
                                        <span style={{ flexShrink: 0 }}>{String.fromCharCode(65 + j)}.</span>
                                        <span>{opt}</span>
                                        {j === q.correctIndex && <span style={{ marginLeft: "auto" }}>✓</span>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                    {questions.length === 0 && (
                        <div style={{ textAlign: "center", padding: 40, color: "#9ca3af" }}>
                            <p style={{ fontSize: 36, marginBottom: 10 }}>📭</p>
                            <p>Belum ada soal. Tambahkan soal pertama!</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}