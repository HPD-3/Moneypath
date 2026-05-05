import { useState } from "react";
import API from "../../services/api.js";
import RichTextEditor from "../../components/RichTextEditor.jsx";

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
        if (!confirm("Hapus modul ini? Semua konten dan kuis akan dihapus.")) return;
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
        <div style={{ marginTop: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "#1a3a1f" }}>📦 Modul Pembelajaran</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#9ca3af", marginLeft: 8 }}>({modules.length} modul)</span>
                </div>
                <button onClick={() => { setForm({ ...EMPTY_M, order: modules.length + 1 }); setEditId(null); setShow(!show); }}
                    style={{ fontSize: 12, background: show ? "#fee2e2" : "#dcfce7", color: show ? "#991b1b" : "#166534", border: "none", borderRadius: 8, padding: "6px 14px", cursor: "pointer", fontWeight: 600, fontFamily: "Plus Jakarta Sans, sans-serif", transition: "all 0.3s ease" }}>
                    {show ? "✕ Batal" : "+ Tambah Modul Baru"}
                </button>
            </div>

            {show && (
                <div style={{ background: "#f8fdf8", border: "2px solid #d1fae5", borderRadius: 12, padding: 16, marginBottom: 14 }}>
                    <h4 style={{ fontSize: 13, fontWeight: 700, color: "#1a3a1f", marginBottom: 14 }}>
                        {editId ? "✏️ Edit Modul" : "➕ Tambah Modul Baru"}
                    </h4>
                    <form onSubmit={handleSubmit}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 100px", gap: 10, marginBottom: 12 }}>
                            <div>
                                <label style={{ fontSize: 12, fontWeight: 600, color: "#4b5563", display: "block", marginBottom: 4 }}>Judul Modul *</label>
                                <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required
                                    className="form-input" placeholder="Contoh: Pengenalan Budgeting" style={{ fontSize: 13 }} />
                            </div>
                            <div>
                                <label style={{ fontSize: 12, fontWeight: 600, color: "#4b5563", display: "block", marginBottom: 4 }}>Urutan</label>
                                <input type="number" value={form.order} onChange={e => setForm({ ...form, order: parseInt(e.target.value) })}
                                    className="form-input" style={{ fontSize: 13 }} min={1} max={modules.length + 1} />
                            </div>
                        </div>
                        <div style={{ marginBottom: 12 }}>
                            <label style={{ fontSize: 12, fontWeight: 600, color: "#4b5563", display: "block", marginBottom: 4 }}>Konten Materi *</label>
                            <RichTextEditor
                                value={form.content}
                                onChange={(html) => setForm({ ...form, content: html })}
                                placeholder="Tulis materi pembelajaran di sini... Anda dapat menggunakan formatting teks, bullet points, dan lainnya."
                            />
                        </div>
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                            <button type="button" style={{ fontSize: 12, background: "#f3f4f6", color: "#6b7280", border: "none", borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontWeight: 600, fontFamily: "Plus Jakarta Sans, sans-serif", transition: "all 0.2s ease" }} 
                                onClick={() => { setShow(false); setEditId(null); }}>Batal</button>
                            <button type="submit" disabled={saving} style={{ fontSize: 12, background: saving ? "#d1d5db" : "#9FF782", color: saving ? "#9ca3af" : "#0a1f10", border: "none", borderRadius: 8, padding: "8px 16px", cursor: saving ? "not-allowed" : "pointer", fontWeight: 600, fontFamily: "Plus Jakarta Sans, sans-serif", transition: "all 0.2s ease" }}>
                                {saving ? "⏳ Menyimpan..." : editId ? "💾 Update Modul" : "💾 Simpan Modul"}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {modules.length === 0 ? (
                <div style={{ textAlign: "center", padding: 32, background: "#f9fafb", borderRadius: 10, border: "1px dashed #d1d5db" }}>
                    <p style={{ fontSize: 12, color: "#9ca3af", marginBottom: 8 }}>📭 Belum ada modul</p>
                    <p style={{ fontSize: 11, color: "#d1d5db" }}>Klik tombol "Tambah Modul Baru" di atas untuk memulai</p>
                </div>
            ) : (
                <div style={{ display: "grid", gap: 10 }}>
                    {modules.map((m, idx) => (
                        <div key={m.id} style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 10, overflow: "hidden", transition: "all 0.3s ease", boxShadow: expanded === m.id ? "0 4px 12px rgba(0,0,0,0.08)" : "none" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: expanded === m.id ? "#f8fdf8" : "white", cursor: "pointer", transition: "all 0.2s ease" }}
                                onClick={() => setExpanded(expanded === m.id ? null : m.id)}>
                                <span style={{ width: 32, height: 32, borderRadius: "8px", background: "#1a3a1f", color: "#9FF782", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                                    {m.order}
                                </span>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 13, fontWeight: 600, color: "#1a3a1f", marginBottom: 2 }}>{m.title}</div>
                                    <div style={{ fontSize: 11, color: "#9ca3af" }}>
                                        {m.quiz?.length > 0 && `📝 ${m.quiz.length} kuis • `}
                                        Klik untuk melihat detail
                                    </div>
                                </div>
                                <div style={{ display: "flex", gap: 8 }}>
                                    <button 
                                        style={{ background: "#eff6ff", color: "#0369a1", border: "1px solid #cffafe", borderRadius: 6, padding: "6px 10px", cursor: "pointer", fontSize: 11, fontWeight: 600, fontFamily: "Plus Jakarta Sans, sans-serif", transition: "all 0.2s ease" }}
                                        onMouseEnter={e => { e.target.style.background = "#0369a1"; e.target.style.color = "white"; }}
                                        onMouseLeave={e => { e.target.style.background = "#eff6ff"; e.target.style.color = "#0369a1"; }}
                                        onClick={e => { e.stopPropagation(); handleEdit(m); }}>✏️ Edit</button>
                                    <button 
                                        style={{ background: "#fee2e2", color: "#991b1b", border: "1px solid #fecaca", borderRadius: 6, padding: "6px 10px", cursor: "pointer", fontSize: 11, fontWeight: 600, fontFamily: "Plus Jakarta Sans, sans-serif", transition: "all 0.2s ease" }}
                                        onMouseEnter={e => { e.target.style.background = "#991b1b"; e.target.style.color = "white"; }}
                                        onMouseLeave={e => { e.target.style.background = "#fee2e2"; e.target.style.color = "#991b1b"; }}
                                        onClick={e => { e.stopPropagation(); handleDelete(m.id); }}>🗑️ Hapus</button>
                                </div>
                                <span style={{ color: "#9ca3af", fontSize: 14, marginLeft: 4, transition: "transform 0.2s ease", transform: expanded === m.id ? "rotate(0deg)" : "rotate(0deg)" }}>{expanded === m.id ? "▲" : "▼"}</span>
                            </div>

                            {expanded === m.id && (
                                <div style={{ padding: "14px", borderTop: "1px solid #f3f4f6", background: "#fafbf9" }}>
                                    <div style={{ marginBottom: 12 }}>
                                        <h5 style={{ fontSize: 12, fontWeight: 700, color: "#4b5563", marginBottom: 8 }}>📖 Konten Materi</h5>
                                        <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.8, background: "white", padding: 10, borderRadius: 8, border: "1px solid #e5e7eb" }} dangerouslySetInnerHTML={{ __html: m.content }} />
                                    </div>
                                    <QuizEditor pathId={pathId} moduleId={m.id} quiz={m.quiz || []} onRefresh={onRefresh} />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ── Main Admin Learning Path ──────────────────────────────────
export default function AdminLearningPath({ paths = [], loading, onRefresh }) {
    const EMPTY_P = { title: "", description: "", category: "budgeting", difficulty: "beginner", estimatedTime: "", photoUrl: "" };
    const [form, setForm] = useState(EMPTY_P);
    const [editId, setEditId] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving] = useState(false);
    const [expanded, setExpanded] = useState(null);

    const handleEdit = p => {
        setForm({ title: p.title, description: p.description, category: p.category, difficulty: p.difficulty, estimatedTime: p.estimatedTime || "", photoUrl: p.photoUrl || "" });
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
            const payload = { ...form };
            if (editId) {
                const response = await API.put(`/learningpath/${editId}`, payload);
                console.log("Update response:", response.data);
            } else {
                const response = await API.post("/learningpath", payload);
                console.log("Create response:", response.data);
            }
            setForm(EMPTY_P); setEditId(null); setShowForm(false);
            onRefresh();
        } catch (err) { 
            console.error("Submit error:", err);
            alert("Gagal menyimpan: " + err.message);
        }
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
                    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8 mb-8">
                        <h3 className="text-2xl font-bold text-gray-900 mb-6">{editId ? "Edit Learning Path" : "Buat Learning Path Baru"}</h3>
                        
                        <div className="grid grid-cols-1 gap-6 mb-6">
                            <div>
                                <label className="text-sm font-semibold text-gray-700 mb-2 block">Judul Learning Path *</label>
                                <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required
                                    className="w-full px-4 py-3 rounded-xl border border-gray-300 text-gray-900 text-sm outline-none focus:border-[#9FF782] focus:ring-2 focus:ring-[#9FF782]/20 transition-all"
                                    placeholder="Contoh: Panduan Budgeting untuk Pemula" />
                            </div>

                            <div>
                                <label className="text-sm font-semibold text-gray-700 mb-2 block">URL Foto</label>
                                <input value={form.photoUrl} onChange={e => setForm({ ...form, photoUrl: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-300 text-gray-900 text-sm outline-none focus:border-[#9FF782] focus:ring-2 focus:ring-[#9FF782]/20 transition-all"
                                    placeholder="https://..." />
                                {form.photoUrl && (
                                    <div className="mt-4 rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
                                        <img src={form.photoUrl} alt="Preview" className="w-full h-48 object-cover" 
                                            onError={e => { e.target.style.display = "none"; }} />
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                            <div>
                                <label className="text-sm font-semibold text-gray-700 mb-2 block">Kategori</label>
                                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} 
                                    className="w-full px-4 py-3 rounded-xl border border-gray-300 text-gray-900 text-sm outline-none focus:border-[#9FF782] focus:ring-2 focus:ring-[#9FF782]/20 transition-all">
                                    {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="text-sm font-semibold text-gray-700 mb-2 block">Tingkat Kesulitan</label>
                                <select value={form.difficulty} onChange={e => setForm({ ...form, difficulty: e.target.value })} 
                                    className="w-full px-4 py-3 rounded-xl border border-gray-300 text-gray-900 text-sm outline-none focus:border-[#9FF782] focus:ring-2 focus:ring-[#9FF782]/20 transition-all">
                                    {DIFFICULTIES.map(d => <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="text-sm font-semibold text-gray-700 mb-2 block">Estimasi Waktu</label>
                                <input value={form.estimatedTime} onChange={e => setForm({ ...form, estimatedTime: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-300 text-gray-900 text-sm outline-none focus:border-[#9FF782] focus:ring-2 focus:ring-[#9FF782]/20 transition-all"
                                    placeholder="Contoh: 3 jam" />
                            </div>
                        </div>

                        <div className="mb-6">
                            <label className="text-sm font-semibold text-gray-700 mb-2 block">Deskripsi</label>
                            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl border border-gray-300 text-gray-900 text-sm outline-none focus:border-[#9FF782] focus:ring-2 focus:ring-[#9FF782]/20 transition-all resize-none"
                                rows={4} placeholder="Deskripsi singkat learning path ini" />
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 justify-end">
                            <button type="button" className="px-6 py-3 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-all"
                                onClick={() => { setShowForm(false); setEditId(null); }}>Batal</button>
                            <button type="submit" disabled={saving} 
                                className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#9FF782] to-[#7dd65f] text-gray-900 font-semibold hover:shadow-lg hover:shadow-[#9FF782]/30 disabled:opacity-50 transition-all flex items-center justify-center gap-2">
                                {saving && <iconify-icon icon="mdi:loading" className="animate-spin"></iconify-icon>}
                                {saving ? "Menyimpan..." : editId ? "Update Path" : "Buat Path"}
                            </button>
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