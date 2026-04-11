import { useState } from "react";
import { useNavigate } from "react-router-dom";
import logo2 from "/src/assets/logo2.png";

export default function Sidebar({ active, setActive, handleLogout, isOpen, setOpen }) {
    const navigate = useNavigate();

    const NAV_ITEMS = [
        { id: "beranda", icon: "mdi:home-outline", label: "Beranda", path: "/dashboard" },
        { id: "edukasi", icon: "mdi:play-circle", label: "Edukasi", path: "/video" },
        { id: "tabungan", icon: "mdi:piggy-bank-outline", label: "Tabungan", path: "/tabungan" },
        { id: "balance", icon: "mdi:wallet-outline", label: "Saldo", path: "/balance" },
        { id: "rekap", icon: "mdi:chart-box-outline", label: "Rekap Bulanan", path: "/rekap" },
        { id: "profil", icon: "mdi:account-outline", label: "Profil", path: "/profile" },
    ];

    const handleNavClick = (id, path) => {
        setActive(id);
        setOpen(false);
        navigate(path);
    };

    const handleLogoutClick = () => {
        setOpen(false);
        handleLogout();
    };

    return (
        <>
            {/* Overlay for mobile */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 md:hidden z-40"
                    onClick={() => setOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed md:static w-64 h-screen bg-gradient-to-b from-[#0b2a17] to-[#123d23] text-white flex flex-col flex-shrink-0 transition-all duration-300 z-40
                    ${isOpen ? "left-0" : "-left-64 md:left-0"}`}
            >
                <div className="px-6 py-4">
                    {/* LOGO */}
                    <img src={logo2} className="h-10 mb-8" alt="Logo" />

                    <nav className="space-y-5 text-sm">
                        {NAV_ITEMS.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => handleNavClick(item.id, item.path)}
                                className={`flex items-center w-full gap-3 px-4 py-2 transition-all duration-200
                                    ${active === item.id
                                        ? "hover:bg-white/10 text-white border border-white/40 "
                                        : "bg-[#9FF782] text-black font-semibold "}`}
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
                        onClick={handleLogoutClick}
                        className="flex items-center gap-2 text-sm hover:text-red-400 transition-colors"
                    >
                        <iconify-icon icon="mdi:logout-variant"></iconify-icon>
                        Logout
                    </button>
                </div>
            </aside>
        </>
    );
}