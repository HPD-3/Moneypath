export default function AdminBeranda({ users, modules, videos = [], paths = [], transactions, setActive }) {
    const recentActivity = [
        ...(Array.isArray(videos) ? videos.map(v => ({
            text: "Admin menambahkan video edukasi",
            highlight: v.title,
            date: v.createdAt
                ? new Date(v.createdAt).toLocaleDateString("id-ID", {
                    day: "2-digit", month: "2-digit", year: "numeric"
                }).replace(/\//g, "-")
                : "—",
        })) : []),
        ...(Array.isArray(paths) ? paths.map(p => ({
            text: "Admin menambahkan learning path",
            highlight: p.title,
            date: p.createdAt
                ? new Date(p.createdAt).toLocaleDateString("id-ID", {
                    day: "2-digit", month: "2-digit", year: "numeric"
                }).replace(/\//g, "-")
                : "—",
        })) : []),
        ...(Array.isArray(modules) ? modules.map(m => ({
            text: "Admin menambahkan konten edukasi",
            highlight: m.title,
            date: m.createdAt
                ? new Date(m.createdAt).toLocaleDateString("id-ID", {
                    day: "2-digit", month: "2-digit", year: "numeric"
                }).replace(/\//g, "-")
                : "—",
        })) : []),
    ].sort((a, b) => {
        const dateA = new Date(a.date.replace(/-/g, '/'));
        const dateB = new Date(b.date.replace(/-/g, '/'));
        return dateB - dateA;
    }).slice(0, 5);

    return (
        <div className="p-6">
            {/* HERO */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <p className="text-black text-base mb-4">
                        Kelola fitur edukasi yang ada dengan mudah di dashboard admin ini
                    </p>

                    {/* STATS */}
                    <div className="flex gap-4">
                        <div className="bg-white p-4 rounded-xl shadow flex items-center gap-3 w-60">
                            <div className="bg-[#9FF782] w-10 h-10 rounded-full flex items-center justify-center">
                                <iconify-icon icon="mdi:play-circle" className="text-black text-xl"></iconify-icon>
                            </div>
                            <div>
                                <h2 className="text-xl font-bold">{Array.isArray(videos) ? videos.length : 0}</h2>
                                <p className="text-xs text-gray-600">Video Edukasi</p>
                            </div>
                        </div>

                        <div className="bg-white p-4 rounded-xl shadow flex items-center gap-3 w-60">
                            <div className="bg-[#9FF782] w-10 h-10 rounded-full flex items-center justify-center">
                                <iconify-icon icon="mdi:chart-timeline-variant" className="text-black text-xl"></iconify-icon>
                            </div>
                            <div>
                                <h2 className="text-xl font-bold">{Array.isArray(paths) ? paths.length : 0}</h2>
                                <p className="text-xs text-gray-600">Learning Path</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* IMAGE PLACEHOLDER */}
                <div className="w-80 h-48 bg-gradient-to-br from-[#9FF782]/20 to-[#5f8f4f]/10 rounded-2xl flex items-center justify-center border-2 border-[#9FF782]/30">
                    <div className="text-center">
                        <div className="text-6xl mb-2">📊</div>
                        <div className="text-sm font-semibold text-gray-700">Analytics</div>
                    </div>
                </div>
            </div>

            {/* MANAJEMEN */}
            <h2 className="text-lg font-bold mb-4 text-gray-900">Manajemen Fitur Edukasi</h2>

            <div className="grid grid-cols-3 gap-4 mb-6">
                {[
                    { id: "video", icon: "mdi:play-circle", label: "Mengelola Video Edukasi" },
                    { id: "learning", icon: "mdi:chart-timeline-variant", label: "Mengelola Learning Path" },
                    { id: "konten", icon: "mdi:file-document", label: "Mengelola Konten Edukasi" },
                ].map(item => (
                    <div key={item.id} className="bg-white p-5 rounded-2xl shadow-md">
                        {/* ICON + TEXT */}
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 bg-[#9FF782] rounded-full flex items-center justify-center">
                                <iconify-icon icon={item.icon} className="text-black text-2xl"></iconify-icon>
                            </div>
                            <p className="text-sm font-medium text-gray-900">{item.label}</p>
                        </div>

                        {/* BUTTON */}
                        <button
                            onClick={() => setActive(item.id)}
                            className="w-full py-2 rounded flex justify-between items-center px-4 text-black bg-gradient-to-r from-[#9FF782] to-[#5f8f4f] hover:from-[#85e66d] hover:to-[#4f7642] transition-all font-semibold"
                        >
                            Kelola
                            <iconify-icon icon="mdi:chevron-right" className="text-lg"></iconify-icon>
                        </button>
                    </div>
                ))}
            </div>

            {/* AKTIVITAS */}
            <div className="bg-white rounded-xl shadow p-4">
                <div className="flex justify-between mb-3">
                    <h3 className="font-bold text-gray-900">Aktivitas Terbaru</h3>
                    <button 
                        onClick={() => setActive("aktivitas")}
                        className="text-red-500 text-sm flex items-center gap-1 hover:underline cursor-pointer"
                    >
                        Lihat Semua
                        <iconify-icon icon="mdi:chevron-right"></iconify-icon>
                    </button>
                </div>

                <table className="w-full text-sm">
                    <thead>
                        <tr className="text-gray-500 text-left border-b">
                            <th className="pb-2">Aktivitas</th>
                            <th className="pb-2">Tanggal</th>
                            <th className="pb-2">Aksi</th>
                        </tr>
                    </thead>

                    <tbody>
                        {recentActivity.length === 0 ? (
                            <tr>
                                <td colSpan={3} className="text-center py-8 text-gray-500 text-sm">
                                    Belum ada aktivitas
                                </td>
                            </tr>
                        ) : (
                            recentActivity.map((a, i) => (
                                <tr key={i} className="border-t">
                                    <td className="py-2">
                                        {a.text} <b>{a.highlight}</b>
                                    </td>
                                    <td className="py-2">{a.date}</td>
                                    <td 
                                        onClick={() => setActive("aktivitas")}
                                        className="text-red-500 flex items-center gap-1 cursor-pointer hover:underline"
                                    >
                                        Lihat
                                        <iconify-icon icon="mdi:chevron-right"></iconify-icon>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}