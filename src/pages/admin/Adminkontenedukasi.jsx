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

    if (loading) return <div className="p-6"><p style={{ color: "#9ca3af" }}>Loading...</p></div>;

    return (
        <div className="p-6">
            {/* TITLE */}
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h2 className="heading text-lg">Manajemen Konten Edukasi</h2>
                    <p className="text-sm text-gray-600">Kelola semua konten pembelajaran investasi</p>
                </div>

                <button
                    onClick={() => { setForm(EMPTY); setEditId(null); setShowForm(!showForm); setPreview(null); }}
                    className="bg-[#0f2e1c] text-white px-5 py-2 rounded-lg flex items-center gap-2 shadow hover:opacity-90"
                >
                    <iconify-icon icon="mdi:plus"></iconify-icon>
                    {showForm ? "Batal" : "Tambah Konten"}
                </button>
            </div>

            {/* SEARCH */}
            <div className="flex mb-6">
                <div className="flex border rounded-xl overflow-hidden bg-white w-[350px] shadow">
                    <input type="text"
                        placeholder="cari artikel atau sumber belajar"
                        className="flex-1 px-4 py-2 text-sm outline-none" />

                    <button className="bg-[#0f2e1c] text-white px-4">Cari</button>
                </div>
            </div>

            {/* FORM */}
            {showForm && (
                <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow p-6 mb-6">
                    <h3 className="text-lg font-bold mb-4">{editId ? "Edit Konten" : "Tambah Konten Edukasi"}</h3>

                    <div className="mb-4">
                        <label className="text-sm font-semibold text-gray-900">Judul Konten *</label>
                        <input
                            type="text"
                            name="title"
                            value={form.title}
                            onChange={handleChange}
                            placeholder="Judul artikel / konten edukasi"
                            required
                            className="w-full mt-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-900 text-sm outline-none focus:ring-2 focus:ring-green-500"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="text-sm font-semibold text-gray-900">Kategori</label>
                            <select
                                name="category"
                                value={form.category}
                                onChange={handleChange}
                                className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg text-gray-900 text-sm"
                            >
                                <option value="budgeting">Budgeting</option>
                                <option value="investing">Investing</option>
                                <option value="saving">Saving</option>
                                <option value="debt">Debt</option>
                            </select>
                        </div>

                        <div>
                            <label className="text-sm font-semibold text-gray-900">Tingkat Kesulitan</label>
                            <select
                                name="difficulty"
                                value={form.difficulty}
                                onChange={handleChange}
                                className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg text-gray-900 text-sm"
                            >
                                <option value="beginner">Beginner</option>
                                <option value="intermediate">Intermediate</option>
                                <option value="advanced">Advanced</option>
                            </select>
                        </div>
                    </div>

                    <div className="mb-4">
                        <label className="text-sm font-semibold text-gray-900">Deskripsi Singkat</label>
                        <textarea
                            name="description"
                            value={form.description}
                            onChange={handleChange}
                            placeholder="Ringkasan konten"
                            className="w-full mt-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-900 text-sm outline-none focus:ring-2 focus:ring-green-500"
                            rows={2}
                        ></textarea>
                    </div>

                    <div className="mb-4">
                        <label className="text-sm font-semibold text-gray-900">Isi Konten *</label>
                        <textarea
                            name="content"
                            value={form.content}
                            onChange={handleChange}
                            placeholder="Tulis isi artikel / konten edukasi di sini..."
                            required
                            className="w-full mt-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-900 text-sm outline-none focus:ring-2 focus:ring-green-500"
                            rows={5}
                        ></textarea>
                    </div>

                    <div className="flex gap-3">
                        <button
                            type="submit"
                            disabled={saving}
                            className="bg-[#0f2e1c] text-white px-6 py-2 rounded-lg font-semibold hover:opacity-90"
                        >
                            {saving ? "Menyimpan..." : editId ? "Update" : "Simpan"}
                        </button>

                        <button
                            type="button"
                            onClick={() => { setShowForm(false); setEditId(null); }}
                            className="border border-gray-300 px-6 py-2 rounded-lg text-gray-900 hover:bg-gray-100"
                        >
                            Batal
                        </button>
                    </div>
                </form>
            )}

            {/* TABLE */}
            <div className="bg-white rounded-xl shadow overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-[#0f2e1c] text-white">
                        <tr>
                            <th className="text-left px-4 py-3">Judul Artikel</th>
                            <th className="text-left px-4 py-3">Kategori</th>
                            <th className="text-left px-4 py-3">Tanggal</th>
                            <th className="text-left px-4 py-3">Aksi</th>
                        </tr>
                    </thead>

                    <tbody>
                        {modules.map((mod, i) => (
                            <tr key={mod.id} className="border-t hover:bg-gray-50">
                                <td className="px-4 py-3 font-semibold">{mod.title}</td>
                                <td className="px-4 py-3">
                                    <span className="text-xs bg-[#e8fce0] text-[#166534] px-2 py-1 rounded">{mod.category}</span>
                                </td>
                                <td className="px-4 py-3 text-gray-600">{mod.createdAt?.split('T')[0] || "—"}</td>
                                <td className="px-4 py-3 flex gap-2">
                                    <button
                                        onClick={() => handleEdit(mod)}
                                        className="text-blue-500 hover:text-blue-700 font-semibold text-xs"
                                    >
                                        ✏️ Edit
                                    </button>

                                    <button
                                        onClick={() => handleDelete(mod.id)}
                                        className="text-red-500 hover:text-red-700 font-semibold text-xs"
                                    >
                                        🗑️ Hapus
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {modules.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                        Belum ada konten. Tambahkan konten pertama!
                    </div>
                )}
            </div>
        </div>
    );
}