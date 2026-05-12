import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import API from "../../services/api.js";
import RichTextEditor from "../../components/RichTextEditor.jsx";
import StyledAlert, { useAlert, useConfirm, ConfirmDialog } from "../../components/StyledAlert.jsx";

const CATEGORIES = ["budgeting", "investing", "saving", "debt"];
const DIFFICULTIES = ["beginner", "intermediate", "advanced"];

const DIFF_COLORS = {
    beginner: { bg: "#dcfce7", color: "#166534" },
    intermediate: { bg: "#fef9c3", color: "#854d0e" },
    advanced: { bg: "#fee2e2", color: "#991b1b" },
};

function Badge({ value, map }) {
    const s = map[value] || { bg: "#f3f4f6", color: "#374151" };
    return <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 20, background: s.bg, color: s.color, textTransform: "capitalize" }}>{value}</span>;
}

export default function AdminLearningPathDetail() {
    const { pathId } = useParams();
    const navigate = useNavigate();
    const [path, setPath] = useState(null);
    const [loading, setLoading] = useState(true);
    const [pathForm, setPathForm] = useState({});
    const [editingPath, setEditingPath] = useState(false);
    const [saving, setSaving] = useState(false);
    const { alert, showAlert, hideAlert } = useAlert();
    const { confirm, showConfirm, hideConfirm } = useConfirm();

    useEffect(() => {
        fetchPathDetail();
    }, [pathId]);

    const fetchPathDetail = async () => {
        try {
            setLoading(true);
            const response = await API.get(`/learningpath/${pathId}`);
            setPath(response.data);
            setPathForm({
                title: response.data.title,
                description: response.data.description,
                category: response.data.category,
                difficulty: response.data.difficulty,
                estimatedTime: response.data.estimatedTime || "",
                photoUrl: response.data.photoUrl || "",
            });
        } catch (err) {
            console.error("Error fetching path:", err);
            showAlert("Gagal memuat learning path", "error");
            setTimeout(() => navigate(-1), 1500);
        } finally {
            setLoading(false);
        }
    };

    const handlePathSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await API.put(`/learningpath/${pathId}`, pathForm);
            showAlert("Learning path berhasil diperbarui", "success");
            fetchPathDetail();
            setEditingPath(false);
        } catch (err) {
            console.error("Error updating path:", err);
            showAlert("Gagal memperbarui path: " + err.message, "error");
        } finally {
            setSaving(false);
        }
    };

    const handleDeletePath = () => {
        showConfirm(
            "Hapus learning path ini beserta semua modulnya?",
            async () => {
                try {
                    await API.delete(`/learningpath/${pathId}`);
                    showAlert("Learning path berhasil dihapus", "success");
                    setTimeout(() => navigate(-1), 1500);
                } catch (err) {
                    showAlert("Gagal menghapus path: " + err.message, "error");
                }
            }
        );
    };

    if (loading) return (
        <div className="p-3 sm:p-6">
            <div style={{ textAlign: "center", padding: "20px sm:40px", color: "#9ca3af" }}>
                <p className="text-sm">Loading...</p>
            </div>
        </div>
    );

    if (!path) return (
        <div className="p-3 sm:p-6">
            <div style={{ textAlign: "center", padding: "20px sm:40px", color: "#9ca3af" }}>
                <p className="text-sm">Learning path tidak ditemukan</p>
            </div>
        </div>
    );

    const modules = Array.isArray(path.modules) ? path.modules : [];

    return (
        <div className="p-3 sm:p-6">
            <StyledAlert message={alert?.message} type={alert?.type} onClose={hideAlert} />
            <ConfirmDialog 
                message={confirm?.message} 
                onConfirm={confirm?.onConfirm}
                onCancel={confirm?.onCancel}
                onClose={hideConfirm}
            />

            <div className="panel">
                {/* Header */}
                <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24, paddingBottom: 20, borderBottom: "1px solid #e5e7eb" }}>
                    <button 
                        onClick={() => navigate(-1)}
                        className="text-xs sm:text-sm text-blue-600 hover:underline font-semibold self-start"
                    >
                        ← Kembali
                    </button>
                    <div>
                        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                            {path.title}
                        </h1>
                        <div className="flex flex-wrap gap-2">
                            <Badge value={path.difficulty} map={DIFF_COLORS} />
                            <span className="text-xs font-semibold text-green-700 bg-green-100 px-2 py-1 rounded-full capitalize">
                                {path.category}
                            </span>
                            <span className="text-xs font-semibold text-gray-600">
                                📦 {path.totalModules || 0} modul
                            </span>
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <button 
                            onClick={() => setEditingPath(!editingPath)}
                            className="px-4 py-2 rounded-lg font-semibold text-xs sm:text-sm transition-all"
                            style={{ background: editingPath ? "#fee2e2" : "#eff6ff", color: editingPath ? "#991b1b" : "#0369a1", border: editingPath ? "1px solid #fecaca" : "1px solid #cffafe" }}
                        >
                            {editingPath ? "✕ Batal" : "✏️ Edit Info"}
                        </button>
                        <button 
                            onClick={handleDeletePath}
                            className="px-4 py-2 rounded-lg font-semibold text-xs sm:text-sm bg-red-100 text-red-700 border border-red-300"
                        >
                            🗑️ Hapus
                        </button>
                    </div>
                </div>

                {/* Edit Path Form */}
                {editingPath && (
                    <form onSubmit={handlePathSubmit} style={{ background: "#f8fdf8", border: "2px solid #d1fae5", borderRadius: 12, padding: 20, marginBottom: 24 }}>
                        <h3 style={{ fontSize: 16, fontWeight: 700, color: "#1a3a1f", marginBottom: 16 }}>Edit Informasi Learning Path</h3>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                            <div>
                                <label style={{ fontSize: 12, fontWeight: 600, color: "#4b5563", display: "block", marginBottom: 4 }}>Judul *</label>
                                <input 
                                    type="text"
                                    value={pathForm.title} 
                                    onChange={e => setPathForm({ ...pathForm, title: e.target.value })}
                                    className="form-input"
                                    placeholder="Judul learning path"
                                    style={{ fontSize: 13, width: "100%", padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 8, fontFamily: "Plus Jakarta Sans, sans-serif" }}
                                    required
                                />
                            </div>
                            <div>
                                <label style={{ fontSize: 12, fontWeight: 600, color: "#4b5563", display: "block", marginBottom: 4 }}>Estimasi Waktu</label>
                                <input 
                                    type="text"
                                    value={pathForm.estimatedTime} 
                                    onChange={e => setPathForm({ ...pathForm, estimatedTime: e.target.value })}
                                    className="form-input"
                                    placeholder="Contoh: 3 jam"
                                    style={{ fontSize: 13, width: "100%", padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 8, fontFamily: "Plus Jakarta Sans, sans-serif" }}
                                />
                            </div>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                            <div>
                                <label style={{ fontSize: 12, fontWeight: 600, color: "#4b5563", display: "block", marginBottom: 4 }}>Kategori</label>
                                <select 
                                    value={pathForm.category} 
                                    onChange={e => setPathForm({ ...pathForm, category: e.target.value })}
                                    style={{ fontSize: 13, width: "100%", padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 8, fontFamily: "Plus Jakarta Sans, sans-serif" }}
                                >
                                    {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                                </select>
                            </div>
                            <div>
                                <label style={{ fontSize: 12, fontWeight: 600, color: "#4b5563", display: "block", marginBottom: 4 }}>Tingkat Kesulitan</label>
                                <select 
                                    value={pathForm.difficulty} 
                                    onChange={e => setPathForm({ ...pathForm, difficulty: e.target.value })}
                                    style={{ fontSize: 13, width: "100%", padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 8, fontFamily: "Plus Jakarta Sans, sans-serif" }}
                                >
                                    {DIFFICULTIES.map(d => <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
                                </select>
                            </div>
                        </div>

                        <div style={{ marginBottom: 16 }}>
                            <label style={{ fontSize: 12, fontWeight: 600, color: "#4b5563", display: "block", marginBottom: 4 }}>Deskripsi</label>
                            <textarea 
                                value={pathForm.description} 
                                onChange={e => setPathForm({ ...pathForm, description: e.target.value })}
                                placeholder="Deskripsi singkat learning path ini"
                                rows={4}
                                style={{ fontSize: 13, width: "100%", padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 8, fontFamily: "Plus Jakarta Sans, sans-serif", resize: "none" }}
                            />
                        </div>

                        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
                            <button 
                                type="button"
                                onClick={() => setEditingPath(false)}
                                style={{ fontSize: 12, background: "#f3f4f6", color: "#6b7280", border: "none", borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontWeight: 600, fontFamily: "Plus Jakarta Sans, sans-serif" }}
                            >
                                Batal
                            </button>
                            <button 
                                type="submit"
                                disabled={saving}
                                style={{ fontSize: 12, background: saving ? "#d1d5db" : "#9FF782", color: saving ? "#9ca3af" : "#0a1f10", border: "none", borderRadius: 8, padding: "8px 16px", cursor: saving ? "not-allowed" : "pointer", fontWeight: 600, fontFamily: "Plus Jakarta Sans, sans-serif" }}
                            >
                                {saving ? "⏳ Menyimpan..." : "💾 Simpan Perubahan"}
                            </button>
                        </div>
                    </form>
                )}

                {/* Modules Section */}
                <div style={{ marginTop: 24 }}>
                    <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1a3a1f", marginBottom: 16 }}>Modul Pembelajaran ({modules.length})</h2>
                    
                    {modules.length > 0 ? (
                        <div style={{ display: "grid", gap: 12 }}>
                            {modules.map((module, idx) => (
                                <div key={module.id} style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 10, padding: 16, overflow: "hidden" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                                        <span style={{ width: 32, height: 32, borderRadius: "8px", background: "#1a3a1f", color: "#9FF782", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                                            {module.order}
                                        </span>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: 14, fontWeight: 600, color: "#1a3a1f" }}>{module.title}</div>
                                            <div style={{ fontSize: 11, color: "#9ca3af" }}>
                                                {module.quiz?.length > 0 && `📝 ${module.quiz.length} kuis`}
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.6, background: "#f9fafb", padding: 12, borderRadius: 8, border: "1px solid #f3f4f6" }} dangerouslySetInnerHTML={{ __html: module.content }} />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{ textAlign: "center", padding: 32, background: "#f9fafb", borderRadius: 10, border: "1px dashed #d1d5db" }}>
                            <p style={{ fontSize: 12, color: "#9ca3af", marginBottom: 8 }}>📭 Belum ada modul</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
