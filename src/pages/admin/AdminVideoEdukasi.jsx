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

    if (loading) return <div className="p-6"><p className="text-gray-400">Loading...</p></div>;

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            {/* TITLE */}
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h2 className="heading text-lg">Manajemen Vidio Edukasi</h2>
                    <p className="text-sm">Kelola semua vidio pembelajaran investasi</p>
                </div>

                <button
                    onClick={() => { setForm(EMPTY); setEditId(null); setShowForm(!showForm); setError(null); }}
                    className="bg-[#0f2e1c] text-white px-5 py-2 rounded-lg flex items-center gap-2 shadow hover:opacity-90"
                >
                    <iconify-icon icon="mdi:plus"></iconify-icon>
                    {showForm ? "Batal" : "Tambah Vidio"}
                </button>
            </div>

            {/* SEARCH + FILTER */}
            <div className="flex justify-between mb-6">
                <div className="flex border rounded-xl overflow-hidden w-[350px] bg-white">
                    <input type="text" placeholder="cari vidio.." className="flex-1 px-4 py-2 text-sm outline-none" />
                    <button className="bg-[#0f2e1c] text-white px-4">Cari</button>
                </div>

                <div className="flex border rounded-full overflow-hidden bg-white text-sm">
                    <button className="filter-btn px-4 py-1 bg-[#0f2e1c] text-white">Semua</button>
                    <button className="filter-btn px-4 py-1 border-l hover:bg-gray-100">Investasi</button>
                    <button className="filter-btn px-4 py-1 border-l hover:bg-gray-100">Pengelolaan</button>
                </div>
            </div>

            {/* FORM */}
            {showForm && (
                <form onSubmit={handleSubmit} className="bg-[#0f2e1c] text-white rounded-xl p-6 shadow-lg mb-6">
                    <h3 className="text-lg font-bold mb-4">{editId ? "Edit Video" : "Tambah Video Edukasi"}</h3>

                    <div className="mb-4">
                        <label className="text-sm">Judul Vidio *</label>
                        <input
                            type="text"
                            name="title"
                            value={form.title}
                            onChange={handleChange}
                            placeholder="Masukkan judul video"
                            required
                            className="w-full mt-1 px-4 py-2 rounded bg-white text-black text-sm outline-none"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="text-sm">Link Video</label>
                            <input
                                type="text"
                                name="youtubeUrl"
                                value={form.youtubeUrl}
                                onChange={handleChange}
                                placeholder="Tuliskan link..."
                                required
                                className="w-full mt-1 px-3 py-2 rounded bg-white text-black text-sm outline-none"
                            />
                        </div>

                        <div>
                            <label className="text-sm">Durasi</label>
                            <div className="flex items-center gap-2 mt-1">
                                <input
                                    type="text"
                                    name="duration"
                                    value={form.duration}
                                    onChange={handleChange}
                                    placeholder="00:00"
                                    className="w-24 px-3 py-2 rounded bg-white text-black text-sm outline-none"
                                />
                                <span className="text-sm">Menit</span>
                            </div>
                        </div>
                    </div>

                    <div className="mb-4">
                        <label className="text-sm">Kategori</label>
                        <select
                            name="category"
                            value={form.category}
                            onChange={handleChange}
                            className="w-full mt-1 px-3 py-2 rounded bg-white text-black text-sm"
                        >
                            {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                        </select>
                    </div>

                    <div className="mb-6">
                        <label className="text-sm">Deskripsi</label>
                        <textarea
                            name="description"
                            value={form.description}
                            onChange={handleChange}
                            placeholder="Tulis deskripsi singkat"
                            className="w-full mt-1 px-3 py-2 rounded bg-white text-black text-sm outline-none"
                            rows={3}
                        ></textarea>
                    </div>

                    {error && (
                        <div className="bg-red-500/20 border border-red-500 text-red-300 px-4 py-2 rounded mb-4">
                            ⚠️ {error}
                        </div>
                    )}

                    <div className="flex gap-3">
                        <button
                            type="submit"
                            disabled={saving}
                            className="bg-[#9FF782] text-black px-6 py-2 rounded font-semibold hover:opacity-90"
                        >
                            {saving ? "Menyimpan..." : editId ? "Update" : "Simpan"}
                        </button>

                        <button
                            type="button"
                            onClick={() => { setShowForm(false); setEditId(null); setError(null); }}
                            className="border border-white px-6 py-2 rounded hover:bg-white/10"
                        >
                            Batal
                        </button>
                    </div>
                </form>
            )}

            {/* CARDS */}
            <div className="grid grid-cols-2 gap-6">
                {videos.map(v => (
                    <div key={v.id} className="bg-white p-4 rounded-xl shadow hover:shadow-lg transition">
                        <img src={v.thumbnail} alt={v.title} className="mb-3 rounded-lg w-full aspect-video object-cover" />

                        <h3 className="font-semibold">{v.title}</h3>
                        <p className="text-xs text-gray-500">Durasi : {v.duration || "—"}</p>
                        <p className="text-xs text-gray-500 mb-2">Kategori : {v.category}</p>

                        <p className="text-xs text-gray-600 mb-3">{v.description}</p>

                        {/* BUTTON */}
                        <div className="flex gap-2">
                            <button
                                onClick={() => handleEdit(v)}
                                className="bg-[#B7FF9F] px-3 py-1 text-sm rounded flex items-center gap-1 hover:opacity-80"
                            >
                                <iconify-icon icon="mdi:pencil"></iconify-icon> Edit
                            </button>

                            <button
                                onClick={() => handleDelete(v.id)}
                                className="bg-red-500 text-white px-3 py-1 text-sm rounded flex items-center gap-1 hover:bg-red-600"
                            >
                                <iconify-icon icon="mdi:trash-can"></iconify-icon> Hapus
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {videos.length === 0 && (
                <div className="col-span-full text-center py-12">
                    <p className="text-gray-500 text-sm">Belum ada video. Tambahkan video pertama!</p>
                </div>
            )}
        </div>
    );
}