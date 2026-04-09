export default function Sidebar({ active, setActive, handleLogout }) {
    const NAV_ITEMS = [
        { id: "beranda", icon: "mdi:home-outline", label: "Beranda" },
        { id: "video", icon: "mdi:play-circle", label: "Vidio Edukasi" },
        { id: "learning", icon: "mdi:chart-timeline-variant", label: "Learning Path" },
        { id: "dailyquiz", icon: "mdi:brain", label: "Daily Quiz" },
    ];

    return (
        <aside className="w-64 h-screen bg-gradient-to-b from-[#0b2a17] to-[#123d23] text-white flex flex-col flex-shrink-0">
            <div className="px-6 py-4">
                {/* LOGO */}
                <img src={logo2} className="h-10 mb-8" alt="Logo" />

                <nav className="space-y-5 text-sm">
                    {NAV_ITEMS.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActive(item.id)}
                            className={`flex items-center w-full gap-3 px-4 py-2 transition-all duration-200
                                ${active === item.id
                                    ? "hover:bg-white/10 text-white border border-white/40"
                                    : "bg-[#9FF782] text-black font-semibold"}`}
                        >
                            <iconify-icon icon={item.icon} className="w-4 h-4"></iconify-icon>
                            {item.label}
                        </button>
                    ))}
                </nav>
            </div>

            <div className="flex-1"></div>

            {/* LOGOUT */}
            <div className="px-6 py-4 border-t border-white/20 flex justify-center">
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 text-sm hover:text-red-400 transition-colors"
                >
                    <iconify-icon icon="mdi:logout-variant"></iconify-icon>
                    Logout
                </button>
            </div>
        </aside>
    );
}