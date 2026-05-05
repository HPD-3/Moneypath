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
    const [searchTerm, setSearchTerm] = useState("");
    const [filterCategory, setFilterCategory] = useState("all");

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

    // Filter videos based on search and category
    const filteredVideos = videos.filter(v => {
        const matchesSearch = v.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            v.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = filterCategory === "all" || v.category === filterCategory;
        
        return matchesSearch && matchesCategory;
    });

    if (loading) return <div className="p-6"><p className="text-gray-400">Loading...</p></div>;

    return (
        <div className="p-4 sm:p-6 bg-gray-50 min-h-screen">
            {/* HEADER */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-1">Manajemen Video Edukasi</h1>
                    <p className="text-gray-600 text-sm">Kelola semua video pembelajaran investasi</p>
                </div>

                <button
                    onClick={() => { setForm(EMPTY); setEditId(null); setShowForm(!showForm); setError(null); }}
                    className="w-full sm:w-auto bg-gradient-to-r from-[#9FF782] to-[#7dd65f] text-gray-900 px-6 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 shadow-sm hover:shadow-md transition-all"
                >
                    <iconify-icon icon="mdi:plus" className="text-lg"></iconify-icon>
                    {showForm ? "Batal" : "Tambah Video"}
                </button>
            </div>

            {/* SEARCH + FILTER */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
                {/* Search */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6">
                    <input 
                        type="text"
                        placeholder="Cari judul atau deskripsi video..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-xl text-sm outline-none focus:border-[#9FF782] focus:ring-2 focus:ring-[#9FF782]/20 transition-all"
                    />
                    <button 
                        onClick={() => setSearchTerm("")}
                        className="px-6 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-semibold transition-all whitespace-nowrap"
                    >
                        Reset
                    </button>
                </div>

                {/* Category Filter */}
                <div>
                    <label className="text-sm font-semibold text-gray-700 mb-3 block">Filter Kategori</label>
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => setFilterCategory("all")}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                filterCategory === "all" 
                                    ? "bg-[#0f2e1c] text-white shadow-md" 
                                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            }`}
                        >
                            Semua
                        </button>
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setFilterCategory(cat)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                    filterCategory === cat 
                                        ? "bg-[#0f2e1c] text-white shadow-md" 
                                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                }`}
                            >
                                {cat.charAt(0).toUpperCase() + cat.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* FORM */}
            {showForm && (
                <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100 mb-6">
                    <h3 className="text-2xl font-bold text-gray-900 mb-6">{editId ? "Edit Video" : "Tambah Video Edukasi"}</h3>

                    <div className="mb-6">
                        <label className="text-sm font-semibold text-gray-700 mb-2 block">Judul Video *</label>
                        <input
                            type="text"
                            name="title"
                            value={form.title}
                            onChange={handleChange}
                            placeholder="Masukkan judul video"
                            required
                            className="w-full px-4 py-3 rounded-xl border border-gray-300 text-gray-900 text-sm outline-none focus:border-[#9FF782] focus:ring-2 focus:ring-[#9FF782]/20 transition-all"
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                        <div>
                            <label className="text-sm font-semibold text-gray-700 mb-2 block">Link YouTube</label>
                            <input
                                type="text"
                                name="youtubeUrl"
                                value={form.youtubeUrl}
                                onChange={handleChange}
                                placeholder="https://youtube.com/watch?v=..."
                                required
                                className="w-full px-4 py-3 rounded-xl border border-gray-300 text-gray-900 text-sm outline-none focus:border-[#9FF782] focus:ring-2 focus:ring-[#9FF782]/20 transition-all"
                            />
                        </div>

                        <div>
                            <label className="text-sm font-semibold text-gray-700 mb-2 block">Durasi (Menit)</label>
                            <input
                                type="text"
                                name="duration"
                                value={form.duration}
                                onChange={handleChange}
                                placeholder="00:00"
                                className="w-full px-4 py-3 rounded-xl border border-gray-300 text-gray-900 text-sm outline-none focus:border-[#9FF782] focus:ring-2 focus:ring-[#9FF782]/20 transition-all"
                            />
                        </div>
                    </div>

                    <div className="mb-6">
                        <label className="text-sm font-semibold text-gray-700 mb-2 block">Kategori</label>
                        <select
                            name="category"
                            value={form.category}
                            onChange={handleChange}
                            className="w-full px-4 py-3 rounded-xl border border-gray-300 text-gray-900 text-sm outline-none focus:border-[#9FF782] focus:ring-2 focus:ring-[#9FF782]/20 transition-all"
                        >
                            {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                        </select>
                    </div>

                    <div className="mb-6">
                        <label className="text-sm font-semibold text-gray-700 mb-2 block">Deskripsi</label>
                        <textarea
                            name="description"
                            value={form.description}
                            onChange={handleChange}
                            placeholder="Tulis deskripsi singkat tentang video..."
                            className="w-full px-4 py-3 rounded-xl border border-gray-300 text-gray-900 text-sm outline-none focus:border-[#9FF782] focus:ring-2 focus:ring-[#9FF782]/20 transition-all resize-none"
                            rows={4}
                        ></textarea>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 flex items-start gap-3">
                            <iconify-icon icon="mdi:alert-circle" className="text-xl flex-shrink-0 mt-0.5"></iconify-icon>
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="flex flex-col sm:flex-row gap-3 justify-end">
                        <button
                            type="button"
                            onClick={() => { setShowForm(false); setEditId(null); setError(null); }}
                            className="px-6 py-3 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-all"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#9FF782] to-[#7dd65f] text-gray-900 font-semibold hover:shadow-lg hover:shadow-[#9FF782]/30 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                        >
                            {saving && <iconify-icon icon="mdi:loading" className="animate-spin"></iconify-icon>}
                            {saving ? "Menyimpan..." : editId ? "Update" : "Simpan"}
                        </button>
                    </div>
                </form>
            )}

            {/* CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredVideos.map(v => (
                    <div key={v.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all overflow-hidden group">
                        <div className="relative overflow-hidden">
                            <img src={v.thumbnail} alt={v.title} className="w-full aspect-video object-cover group-hover:scale-105 transition-transform duration-300" />
                            <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm px-3 py-1 rounded-full text-white text-xs font-semibold">
                                {v.duration}
                            </div>
                        </div>

                        <div className="p-4">
                            <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 mb-2">{v.title}</h3>
                            <p className="text-xs text-gray-500 mb-3 line-clamp-2">{v.description}</p>
                            
                            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
                                <span className="text-xs bg-[#9FF782]/10 text-[#0f2e1c] px-2 py-1 rounded-full font-medium capitalize">{v.category}</span>
                            </div>

                            {/* ACTION BUTTONS */}
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleEdit(v)}
                                    className="flex-1 px-3 py-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-xs flex items-center justify-center gap-1 transition-all"
                                >
                                    <iconify-icon icon="mdi:pencil" className="text-sm"></iconify-icon>
                                    Edit
                                </button>

                                <button
                                    onClick={() => handleDelete(v.id)}
                                    className="flex-1 px-3 py-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 font-semibold text-xs flex items-center justify-center gap-1 transition-all"
                                >
                                    <iconify-icon icon="mdi:trash-can" className="text-sm"></iconify-icon>
                                    Hapus
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {videos.length === 0 && (
                <div className="col-span-full text-center py-12">
                    <p className="text-gray-500 text-sm">Belum ada video. Tambahkan video pertama!</p>
                </div>
            )}

            {videos.length > 0 && filteredVideos.length === 0 && (
                <div className="col-span-full text-center py-12">
                    <p className="text-gray-500 text-sm">Tidak ada video yang sesuai dengan filter pencarian Anda.</p>
                </div>
            )}
        </div>
    );
}