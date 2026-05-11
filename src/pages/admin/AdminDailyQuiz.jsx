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

    if (loading) return <div className="p-3 sm:p-6"><p className="text-gray-400 text-sm">Loading...</p></div>;

    return (
        <div className="p-3 sm:p-6">
            <div className="panel">
                <div className="panel-header flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center mb-6">
                    <div>
                        <p className="section-title text-base sm:text-lg" style={{ margin: 0 }}>Kelola Soal Daily Quiz</p>
                        <p className="text-xs sm:text-sm text-gray-600 mt-2">{questions.length} soal tersedia dalam pool</p>
                    </div>
                    <button className="btn-add whitespace-nowrap w-full sm:w-auto text-center sm:text-left" onClick={() => { setForm(EMPTY); setEditId(null); setShowForm(!showForm); }}>
                        {showForm ? "✕ Batal" : "+ Tambah Soal"}
                    </button>
                </div>

                {/* EXP Info */}
                <div className="bg-[#f8fdf8] border border-[#d1fae5] rounded-lg p-4 mb-6 overflow-x-auto">
                    <div className="flex gap-4 sm:gap-6 flex-nowrap min-w-min">
                        {[
                            { icon: "⚡", label: "Daily Quiz Selesai", exp: "+50 EXP" },
                            { icon: "🔥", label: "Streak Bonus", exp: "+10 EXP/hari" },
                            { icon: "📦", label: "Selesai Modul", exp: "+20 EXP" },
                            { icon: "📝", label: "Lulus Quiz Modul", exp: "+30 EXP" },
                            { icon: "🏆", label: "Selesai Full Path", exp: "+100 EXP" },
                        ].map((r, i) => (
                            <div key={i} className="flex items-center gap-2 flex-shrink-0">
                                <span className="text-base sm:text-lg">{r.icon}</span>
                                <div>
                                    <p className="text-xs sm:text-xs text-gray-700 font-semibold">{r.label}</p>
                                    <p className="text-xs text-green-700 font-bold">{r.exp}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Form */}
                {showForm && (
                    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-8 mb-8">
                        <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6">{editId ? "Edit Soal" : "Tambah Soal Baru"}</h3>

                        <div className="mb-6">
                            <label className="text-xs sm:text-sm font-semibold text-gray-700 mb-2 block">Pertanyaan *</label>
                            <textarea value={form.question} onChange={e => setForm({ ...form, question: e.target.value })}
                                required className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl border border-gray-300 text-gray-900 text-sm outline-none focus:border-[#9FF782] focus:ring-2 focus:ring-[#9FF782]/20 transition-all resize-none"
                                rows={3} placeholder="Tulis pertanyaan quiz..." />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                            <div>
                                <label className="text-xs sm:text-sm font-semibold text-gray-700 mb-2 block">Kategori</label>
                                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} 
                                    className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl border border-gray-300 text-gray-900 text-sm outline-none focus:border-[#9FF782] focus:ring-2 focus:ring-[#9FF782]/20 transition-all">
                                    {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs sm:text-sm font-semibold text-gray-700 mb-2 block">Jawaban Benar</label>
                                <select value={form.correctIndex} onChange={e => setForm({ ...form, correctIndex: parseInt(e.target.value) })} 
                                    className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl border border-gray-300 text-gray-900 text-sm outline-none focus:border-[#9FF782] focus:ring-2 focus:ring-[#9FF782]/20 transition-all">
                                    {["A", "B", "C", "D"].map((l, i) => <option key={i} value={i}>Pilihan {l}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="mb-6">
                            <label className="text-xs sm:text-sm font-semibold text-gray-700 mb-3 block">Pilihan Jawaban</label>
                            <div className="space-y-3">
                                {form.options.map((opt, i) => (
                                    <div key={i} className="flex items-center gap-3">
                                        <div className={`w-8 sm:w-10 h-8 sm:h-10 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-xs sm:text-sm ${
                                            form.correctIndex === i 
                                                ? 'bg-[#0f2e1c] text-[#9FF782]' 
                                                : 'bg-gray-100 text-gray-600'
                                        }`}>
                                            {String.fromCharCode(65 + i)}
                                        </div>
                                        <input value={opt} onChange={e => handleOption(i, e.target.value)}
                                            required className="flex-1 px-3 sm:px-4 py-2 sm:py-3 rounded-xl border border-gray-300 text-gray-900 text-xs sm:text-sm outline-none focus:border-[#9FF782] focus:ring-2 focus:ring-[#9FF782]/20 transition-all"
                                            placeholder={`Pilihan ${String.fromCharCode(65 + i)}`} />
                                        {form.correctIndex === i && (
                                            <span className="text-[#166534] font-bold text-xs sm:text-sm whitespace-nowrap">✓ Benar</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 justify-end">
                            <button type="button" className="px-4 sm:px-6 py-2 sm:py-3 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-all text-sm"
                                onClick={() => { setShowForm(false); setEditId(null); }}>Batal</button>
                            <button type="submit" disabled={saving} 
                                className="px-4 sm:px-6 py-2 sm:py-3 rounded-xl bg-gradient-to-r from-[#9FF782] to-[#7dd65f] text-gray-900 font-semibold hover:shadow-lg hover:shadow-[#9FF782]/30 disabled:opacity-50 transition-all flex items-center justify-center gap-2 text-sm">
                                {saving && <iconify-icon icon="mdi:loading" className="animate-spin"></iconify-icon>}
                                {saving ? "Menyimpan..." : editId ? "Update Soal" : "Simpan Soal"}
                            </button>
                        </div>
                    </form>
                )}

                {/* Question List */}
                <div className="space-y-4">
                    {questions.map((q, i) => (
                        <div key={q.id} className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-6 hover:border-gray-300 hover:shadow-md transition-all">
                            <div className="flex justify-between items-start gap-4 mb-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                                        <span className="text-xs font-semibold text-gray-500">#{i + 1}</span>
                                        <span className="px-3 py-1 text-xs font-semibold bg-[#e8fce0] text-[#166534] rounded-full capitalize">{q.category}</span>
                                    </div>
                                    <p className="font-bold text-sm sm:text-base text-gray-900 leading-relaxed">{q.question}</p>
                                </div>
                                <div className="flex gap-2 flex-shrink-0">
                                    <button onClick={() => handleEdit(q)} 
                                        className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 hover:text-gray-900 transition-all" title="Edit">
                                        <iconify-icon icon="mdi:pen"></iconify-icon>
                                    </button>
                                    <button onClick={() => handleDelete(q.id)} 
                                        className="p-2 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-600 transition-all" title="Delete">
                                        <iconify-icon icon="mdi:trash-can"></iconify-icon>
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {q.options?.map((opt, j) => (
                                    <div key={j} className={`px-3 sm:px-4 py-2 sm:py-3 rounded-lg border-2 text-xs sm:text-sm font-medium flex items-center gap-2 transition-all ${
                                        j === q.correctIndex 
                                            ? 'bg-[#dcfce7] border-[#86efac] text-[#166534]' 
                                            : 'bg-gray-50 border-gray-200 text-gray-700'
                                    }`}>
                                        <span className="flex-shrink-0 font-bold">{String.fromCharCode(65 + j)}.</span>
                                        <span className="flex-1">{opt}</span>
                                        {j === q.correctIndex && <span className="flex-shrink-0">✓</span>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                    {questions.length === 0 && (
                        <div className="text-center py-12 sm:py-16 text-gray-400">
                            <p className="text-3xl sm:text-5xl mb-4">📭</p>
                            <p className="text-sm sm:text-base">Belum ada soal. Tambahkan soal pertama!</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}