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
        <div className="space-y-6 sm:space-y-8 p-3 sm:p-6">
            {/* KEY METRICS */}
            <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">📊 Key Metrics</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
                    <div className="stat-card">
                        <div className="text-2xl sm:text-4xl mb-2 sm:mb-3">▶️</div>
                        <div className="stat-number">{Array.isArray(videos) ? videos.length : 0}</div>
                        <div className="stat-label">Videos</div>
                    </div>

                    <div className="stat-card">
                        <div className="text-2xl sm:text-4xl mb-2 sm:mb-3">📊</div>
                        <div className="stat-number">{Array.isArray(paths) ? paths.length : 0}</div>
                        <div className="stat-label">Learning Paths</div>
                    </div>

                    <div className="stat-card">
                        <div className="text-2xl sm:text-4xl mb-2 sm:mb-3">📚</div>
                        <div className="stat-number">{Array.isArray(modules) ? modules.length : 0}</div>
                        <div className="stat-label">Modules</div>
                    </div>

                    <div className="stat-card">
                        <div className="text-2xl sm:text-4xl mb-2 sm:mb-3">👥</div>
                        <div className="stat-number">{users.length}</div>
                        <div className="stat-label">Total Users</div>
                    </div>
                </div>
            </div>

            {/* QUICK ACTIONS */}
            <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">⚡ Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
                    {[
                        { id: "video", icon: "▶️", label: "Add Video", desc: "Create new educational video" },
                        { id: "learning", icon: "📊", label: "Add Learning Path", desc: "Create new learning path" },
                        { id: "konten", icon: "📋", label: "Add Module", desc: "Create new content module" },
                    ].map(item => (
                        <button
                            key={item.id}
                            onClick={() => setActive(item.id)}
                            className="admin-card text-left hover:border-green-500 group p-4 sm:p-6"
                        >
                            <div className="text-3xl sm:text-5xl mb-2 sm:mb-4 group-hover:scale-110 transition-transform">{item.icon}</div>
                            <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1 sm:mb-2">{item.label}</h3>
                            <p className="text-xs sm:text-sm text-gray-700">{item.desc}</p>
                        </button>
                    ))}
                </div>
            </div>

            {/* RECENT ACTIVITY */}
            <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">📝 Recent Activity</h2>
                <div className="panel overflow-x-auto">
                    <table className="admin-table w-full min-w-max">
                        <thead>
                            <tr className="bg-gray-900">
                                <th className="px-3 sm:px-7 py-4 sm:py-5 text-left text-xs font-bold text-white uppercase tracking-widest">Activity</th>
                                <th className="px-3 sm:px-7 py-4 sm:py-5 text-left text-xs font-bold text-white uppercase tracking-widest">Date</th>
                                <th className="px-3 sm:px-7 py-4 sm:py-5 text-left text-xs font-bold text-white uppercase tracking-widest">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentActivity.length === 0 ? (
                                <tr><td colSpan={3} className="px-3 sm:px-7 py-8 sm:py-12 text-center text-gray-600 font-bold text-sm">No recent activity</td></tr>
                            ) : recentActivity.map((a, i) => (
                                <tr key={i}>
                                    <td className="px-3 sm:px-7 py-3 sm:py-4 text-xs sm:text-sm text-gray-800 font-medium">
                                        {a.text} <span className="text-green-700 font-bold">"{a.highlight}"</span>
                                    </td>
                                    <td className="px-3 sm:px-7 py-3 sm:py-4 text-xs sm:text-sm text-gray-700 font-medium whitespace-nowrap">{a.date}</td>
                                    <td className="px-3 sm:px-7 py-3 sm:py-4 text-xs sm:text-sm">
                                        <button className="text-green-700 hover:text-green-900 font-bold hover:underline">View →</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
