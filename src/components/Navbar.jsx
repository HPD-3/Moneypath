import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth, signOut } from "firebase/auth";
import API from "../services/api.js";

function greeting() {
    const h = new Date().getHours();
    if (h < 12) return "Selamat Pagi";
    if (h < 17) return "Selamat Siang";
    return "Selamat Malam";
}

export default function Navbar({ profile, personal, isSidebarOpen, setSidebarOpen }) {
    const navigate = useNavigate();
    const [showDropdown, setShowDropdown] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [quizStats, setQuizStats] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [showSearchResults, setShowSearchResults] = useState(false);
    const [showMobileSearch, setShowMobileSearch] = useState(false);
    const [isOnDashboard, setIsOnDashboard] = useState(window.location.pathname === "/dashboard");

    const features = [
        { name: "Beranda", path: "/dashboard", icon: "🏠", category: "Navigation" },
        { name: "Belajar", path: "/learning", icon: "📚", category: "Learning" },
        { name: "Edukasi", path: "/video", icon: "🎬", category: "Learning" },
        { name: "Kuis", path: "/quiz", icon: "🧠", category: "Quiz" },
        { name: "Tabungan", path: "/tabungan", icon: "🏦", category: "Finance" },
        { name: "Tabungan Bersama", path: "/shared-tabungan", icon: "👥", category: "Finance" },
        { name: "Saldo Bersama", path: "/shared-balance", icon: "💰", category: "Finance" },
        { name: "Target Tabungan", path: "/tabungan", icon: "🎯", category: "Finance" },
        { name: "Profil", path: "/profile", icon: "👤", category: "Account" },
        { name: "Pengaturan", path: "/settings", icon: "⚙️", category: "Account" },
    ];

    const handleResize = () => {
        setIsMobile(window.innerWidth < 768);
    };

    React.useEffect(() => {
        window.addEventListener("resize", handleResize);
        // Check if on dashboard
        const checkDashboard = () => {
            setIsOnDashboard(window.location.pathname === "/dashboard");
        };
        window.addEventListener("popstate", checkDashboard);
        return () => {
            window.removeEventListener("resize", handleResize);
            window.removeEventListener("popstate", checkDashboard);
        };
    }, []);

    // Fetch quiz stats for XP and streak
    useEffect(() => {
        const fetchQuizStats = async () => {
            try {
                const res = await API.get("/quiz/stats");
                setQuizStats(res.data);

                // Get XP history from expLog (last 5 entries)
                if (res.data.expLog && res.data.expLog.length > 0) {
                    const processedHistory = res.data.expLog
                        .slice()
                        .reverse()
                        .slice(0, 5)
                        .map((log) => {
                            let activity = log.reason || "Activity";

                            if (activity.includes("Daily quiz")) {
                                activity = "🧠 Daily Quiz";
                            } else if (activity.includes("PATH COMPLETE")) {
                                activity = "🏆 Path Completed";
                            } else if (activity.match(/^[a-zA-Z0-9]{20,}/)) {
                                activity = "📦 Module Completed";
                            }

                            return {
                                activity,
                                exp: log.amount || 0,
                                date: log.timestamp || new Date().toISOString()
                            };
                        });
                    setNotifications(processedHistory);
                }
            } catch (err) {
                console.error("Error fetching quiz stats:", err);
            }
        };
        fetchQuizStats();
    }, []);

    const handleSearch = (e) => {
        const query = e.target.value;
        setSearchQuery(query);

        if (query.trim() === "") {
            setSearchResults([]);
            setShowSearchResults(false);
            return;
        }

        const filtered = features.filter(feature =>
            feature.name.toLowerCase().includes(query.toLowerCase()) ||
            feature.category.toLowerCase().includes(query.toLowerCase())
        );

        setSearchResults(filtered);
        setShowSearchResults(true);
    };

    const handleResultClick = (feature) => {
        navigate(feature.path);
        setSearchQuery("");
        setShowSearchResults(false);
    };

    const handleLogout = async () => {
        try {
            await signOut(getAuth());
            navigate("/");
        } catch (err) {
            console.error("Logout error:", err);
        }
    };

    return (
        <nav style={{
            background: "white",
            padding: "12px 16px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            position: "sticky",
            top: 0,
            zIndex: 50,
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            borderBottom: "1px solid #e5e7eb",
            gap: 12,
            flexWrap: "wrap",
        }}>
            <style>{`
                @media (max-width: 768px) {
                    nav { padding: 8px 12px !important; gap: 8px !important; }
                    [data-navbar-right] { gap: 8px !important; }
                    [data-navbar-streak-label] { display: none !important; }
                    [data-navbar-xp-label] { display: none !important; }
                    [data-navbar-streak-icon] { display: none !important; }
                    [data-navbar-xp-icon] { display: none !important; }
                    [data-navbar-streak-number] { display: block !important; }
                    [data-navbar-xp-number] { display: block !important; }
                    [data-navbar-streak] { gap: 0 !important; }
                    [data-navbar-xp] { gap: 0 !important; }
                    [data-navbar-profile] button { width: 32px !important; height: 32px !important; }
                    [data-navbar-profile] button iconify-icon { font-size: 18px !important; }
                    [data-navbar-profile] [data-chevron] { display: none !important; }
                }
            `}</style>

            {/* Left: Hamburger */}
            <div style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                flex: isMobile ? "1 1 auto" : "1 1 auto",
                minWidth: 0,
            }}>
                {/* Hamburger Button - Mobile Only */}
                <button
                    onClick={() => setSidebarOpen(!isSidebarOpen)}
                    style={{
                        display: isMobile ? "flex" : "none",
                        alignItems: "center",
                        justifyContent: "center",
                        width: 36,
                        height: 36,
                        borderRadius: 8,
                        background: "#f3f4f6",
                        border: "none",
                        cursor: "pointer",
                        transition: "background 0.2s",
                        flexShrink: 0,
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = "#e5e7eb"}
                    onMouseLeave={e => e.currentTarget.style.background = "#f3f4f6"}>
                    <span style={{
                        width: 20,
                        height: 14,
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                    }}>
                        <span style={{
                            width: "100%",
                            height: 2,
                            background: "#1a3a1f",
                            borderRadius: 1,
                            transition: "all 0.3s",
                        }}></span>
                        <span style={{
                            width: "100%",
                            height: 2,
                            background: "#1a3a1f",
                            borderRadius: 1,
                            transition: "all 0.3s",
                        }}></span>
                        <span style={{
                            width: "100%",
                            height: 2,
                            background: "#1a3a1f",
                            borderRadius: 1,
                            transition: "all 0.3s",
                        }}></span>
                    </span>
                </button>

                {/* Search Icon - Mobile Only (Dashboard) */}
                {isOnDashboard && isMobile && (
                    <button
                        onClick={() => setShowMobileSearch(true)}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: 36,
                            height: 36,
                            borderRadius: 8,
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            transition: "background 0.2s",
                            flexShrink: 0,
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = "#f3f4f6"}
                        onMouseLeave={e => e.currentTarget.style.background = "none"}>
                        <iconify-icon icon="mdi:magnify" style={{
                            fontSize: 20,
                            color: "#374151",
                        }}></iconify-icon>
                    </button>
                )}

                {/* Search Bar - Dashboard Only (Desktop) */}
                {isOnDashboard && !isMobile && (
                    <div style={{
                        position: "relative",
                        flex: "0 1 300px",
                        minWidth: 200,
                    }}>
                        <input 
                            type="text"
                            placeholder={isMobile ? "Cari..." : "Cari Fitur..."}
                            value={searchQuery}
                            onChange={handleSearch}
                            style={{
                                width: "100%",
                                border: "1px solid #d1d5db",
                                borderRadius: 8,
                                padding: "8px 12px 8px 36px",
                                fontSize: 13,
                                color: "#374151",
                                outline: "none",
                                transition: "border-color 0.2s",
                                fontFamily: "Plus Jakarta Sans, sans-serif",
                            }}
                            onFocus={e => e.currentTarget.style.borderColor = "#9FF782"}
                            onBlur={(e) => {
                                e.currentTarget.style.borderColor = "#d1d5db";
                                setTimeout(() => setShowSearchResults(false), 200);
                            }}
                        />
                        <iconify-icon 
                            icon="mdi:magnify"
                            style={{
                                position: "absolute",
                                left: 12,
                                top: "50%",
                                transform: "translateY(-50%)",
                                fontSize: 18,
                                color: "#9ca3af",
                                pointerEvents: "none",
                            }}>
                        </iconify-icon>

                        {/* Search Results Popup */}
                        {showSearchResults && searchResults.length > 0 && (
                            <div style={{
                                position: "absolute",
                                top: "100%",
                                left: 0,
                                right: 0,
                                background: "white",
                                border: "1px solid #e5e7eb",
                                borderRadius: 8,
                                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                                marginTop: 4,
                                maxHeight: 300,
                                overflowY: "auto",
                                zIndex: 1000,
                            }}>
                                {searchResults.map((feature, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => handleResultClick(feature)}
                                        style={{
                                            width: "100%",
                                            padding: "12px 16px",
                                            textAlign: "left",
                                            background: "none",
                                            border: "none",
                                            cursor: "pointer",
                                            fontSize: 13,
                                            color: "#374151",
                                            transition: "background 0.2s",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 12,
                                            borderBottom: idx < searchResults.length - 1 ? "1px solid #f3f4f6" : "none",
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.background = "#f9fafb"}
                                        onMouseLeave={e => e.currentTarget.style.background = "none"}>
                                        <span style={{ fontSize: 16 }}>{feature.icon}</span>
                                        <div style={{ flex: 1 }}>
                                            <p style={{ margin: "0 0 2px 0", fontWeight: 600, color: "#1a3a1f" }}>
                                                {feature.name}
                                            </p>
                                            <p style={{ margin: 0, fontSize: 11, color: "#9ca3af" }}>
                                                {feature.category}
                                            </p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* No Results Message */}
                        {showSearchResults && searchResults.length === 0 && searchQuery.trim() !== "" && (
                            <div style={{
                                position: "absolute",
                                top: "100%",
                                left: 0,
                                right: 0,
                                background: "white",
                                border: "1px solid #e5e7eb",
                                borderRadius: 8,
                                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                                marginTop: 4,
                                padding: "16px",
                                textAlign: "center",
                                color: "#9ca3af",
                                fontSize: 13,
                                zIndex: 1000,
                            }}>
                                Fitur tidak ditemukan
                            </div>
                        )}
                    </div>
                )}

            </div>

            {/* Right: XP + Streak + Profile Menu + Notifications */}
            <div data-navbar-right style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                flexShrink: 0,
            }}>
                {/* Streak Display - Fire Icon - Shows number on mobile */}
                {quizStats?.streak !== undefined && (
                    <div data-navbar-streak style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                    }}>
                        <div style={{
                            width: 44,
                            height: 44,
                            borderRadius: "50%",
                            border: "2px solid #FFB02E",
                            background: "white",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                        }}>
                            <iconify-icon data-navbar-streak-icon icon="mdi:fire" style={{
                                fontSize: 22,
                                color: "#FF6B00",
                            }}></iconify-icon>
                            <span data-navbar-streak-number style={{
                                display: "none",
                                fontWeight: 700,
                                color: "#FF6B00",
                                fontSize: 18,
                            }}>
                                {quizStats?.streak || 0}
                            </span>
                        </div>
                        <div data-navbar-streak-label style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 2,
                        }}>
                            <span style={{
                                fontWeight: 700,
                                color: "#374151",
                                fontSize: 13,
                            }}>
                                {quizStats?.streak || 0}
                            </span>
                            <span style={{
                                fontSize: 10,
                                color: "#9ca3af",
                            }}>
                                Streak
                            </span>
                        </div>
                    </div>
                )}

                {/* XP Display - Lightning Icon - Shows number on mobile */}
                <div data-navbar-xp style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                }}>
                    <div style={{
                        width: 44,
                        height: 44,
                        borderRadius: "50%",
                        border: "2px solid #10b981",
                        background: "white",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                    }}>
                        <iconify-icon data-navbar-xp-icon icon="mdi:lightning-bolt" style={{
                            fontSize: 22,
                            color: "#059669",
                        }}></iconify-icon>
                        <span data-navbar-xp-number style={{
                            display: "none",
                            fontWeight: 700,
                            color: "#059669",
                            fontSize: 16,
                        }}>
                            {quizStats?.totalExp || 0}
                        </span>
                    </div>
                    <div data-navbar-xp-label style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 2,
                    }}>
                        <span style={{
                            fontWeight: 700,
                            color: "#374151",
                            fontSize: 13,
                        }}>
                            {quizStats?.totalExp || 0}
                        </span>
                        <span style={{
                            fontSize: 10,
                            color: "#9ca3af",
                        }}>
                            XP
                        </span>
                    </div>
                </div>

                {/* Profile Menu - Smaller on mobile */}
                <div data-navbar-profile style={{ position: "relative" }}>
                    <button
                        onClick={() => setShowDropdown(!showDropdown)}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            padding: 0,
                        }}>
                        <div style={{
                            width: 40,
                            height: 40,
                            borderRadius: "50%",
                            border: "2px solid #06b6d4",
                            background: "white",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                        }}>
                            <iconify-icon icon="mdi:account" style={{
                                fontSize: 20,
                                color: "#9ca3af",
                            }}></iconify-icon>
                        </div>
                        <iconify-icon data-chevron icon="mdi:chevron-down" style={{
                            fontSize: 20,
                            color: "#4b5563",
                        }}></iconify-icon>
                    </button>

                    {/* Dropdown Menu */}
                    {showDropdown && (
                        <div style={{
                            position: "absolute",
                            right: 0,
                            top: 48,
                            background: "white",
                            border: "1px solid #e5e7eb",
                            borderRadius: 12,
                            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                            minWidth: 200,
                            zIndex: 100,
                            overflow: "hidden",
                        }}>
                            <button
                                onClick={() => { navigate("/profile"); setShowDropdown(false); }}
                                style={{
                                    width: "100%",
                                    padding: "12px 16px",
                                    textAlign: "left",
                                    background: "none",
                                    border: "none",
                                    cursor: "pointer",
                                    fontSize: 13,
                                    color: "#374151",
                                    transition: "background 0.2s",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 12,
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = "#f9fafb"}
                                onMouseLeave={e => e.currentTarget.style.background = "none"}>
                                <iconify-icon icon="mdi:account" style={{ fontSize: 16 }}></iconify-icon>
                                Profil
                            </button>
                            <button
                                onClick={() => { navigate(profile?.role === "admin" ? "/admin" : "/settings"); setShowDropdown(false); }}
                                style={{
                                    width: "100%",
                                    padding: "12px 16px",
                                    textAlign: "left",
                                    background: "none",
                                    border: "none",
                                    cursor: "pointer",
                                    fontSize: 13,
                                    color: "#374151",
                                    transition: "background 0.2s",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 12,
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = "#f9fafb"}
                                onMouseLeave={e => e.currentTarget.style.background = "none"}>
                                <iconify-icon icon={profile?.role === "admin" ? "mdi:shield-admin" : "mdi:cog"} style={{ fontSize: 16 }}></iconify-icon>
                                {profile?.role === "admin" ? "Admin Dashboard" : "Pengaturan"}
                            </button>
                            <button
                                onClick={handleLogout}
                                style={{
                                    width: "100%",
                                    padding: "12px 16px",
                                    textAlign: "left",
                                    background: "none",
                                    border: "none",
                                    cursor: "pointer",
                                    fontSize: 13,
                                    color: "#ef4444",
                                    transition: "background 0.2s",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 12,
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = "#fef2f2"}
                                onMouseLeave={e => e.currentTarget.style.background = "none"}>
                                <iconify-icon icon="mdi:logout" style={{ fontSize: 16 }}></iconify-icon>
                                Logout
                            </button>
                        </div>
                    )}
                </div>

                {/* Notification Bell */}
                <div style={{ position: "relative" }}>
                    <button
                        onClick={() => setShowNotifications(!showNotifications)}
                        style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            padding: 0,
                            transition: "transform 0.2s",
                            position: "relative",
                        }}
                        onMouseEnter={e => e.currentTarget.style.transform = "scale(1.1)"}
                        onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}>
                        <iconify-icon icon="mdi:bell-outline" style={{
                            fontSize: 28,
                            color: "#374151",
                        }}></iconify-icon>
                        {notifications.length > 0 && (
                            <span style={{
                                position: "absolute",
                                top: -4,
                                right: -4,
                                background: "#ef4444",
                                color: "white",
                                borderRadius: "50%",
                                width: 20,
                                height: 20,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: 11,
                                fontWeight: 700,
                            }}>
                                {Math.min(notifications.length, 9)}
                            </span>
                        )}
                    </button>

                    {/* Notifications Dropdown */}
                    {showNotifications && (
                        <div style={{
                            position: "absolute",
                            right: 0,
                            top: 48,
                            background: "white",
                            border: "1px solid #e5e7eb",
                            borderRadius: 12,
                            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                            minWidth: 320,
                            maxHeight: 400,
                            overflowY: "auto",
                            zIndex: 100,
                        }}>
                            <div style={{
                                padding: "12px 16px",
                                borderBottom: "1px solid #f0f0f0",
                                fontWeight: 700,
                                color: "#1a3a1f",
                                fontSize: 13,
                            }}>
                                Notifikasi Terbaru
                            </div>
                            {notifications.length === 0 ? (
                                <div style={{
                                    padding: "24px 16px",
                                    textAlign: "center",
                                    color: "#9ca3af",
                                    fontSize: 13,
                                }}>
                                    Belum ada notifikasi
                                </div>
                            ) : (
                                notifications.map((notif, idx) => (
                                    <div key={idx} style={{
                                        padding: "12px 16px",
                                        borderBottom: idx < notifications.length - 1 ? "1px solid #f9fafb" : "none",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 12,
                                        transition: "background 0.2s",
                                    }}
                                        onMouseEnter={e => e.currentTarget.style.background = "#f9fafb"}
                                        onMouseLeave={e => e.currentTarget.style.background = "white"}>
                                        <iconify-icon icon="mdi:lightning-bolt" style={{
                                            fontSize: 18,
                                            color: "#059669",
                                            flexShrink: 0,
                                        }}></iconify-icon>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <p style={{
                                                fontSize: 13,
                                                fontWeight: 600,
                                                color: "#1a3a1f",
                                                margin: "0 0 4px 0",
                                            }}>
                                                +{notif.exp || 0} XP
                                            </p>
                                            <p style={{
                                                fontSize: 11,
                                                color: "#9ca3af",
                                                margin: 0,
                                            }}>
                                                {notif.activity || "Quiz selesai"}
                                            </p>
                                            <p style={{
                                                fontSize: 10,
                                                color: "#d1d5db",
                                                margin: "4px 0 0 0",
                                            }}>
                                                {notif.date ? new Date(notif.date).toLocaleDateString("id-ID", {
                                                    month: "short",
                                                    day: "numeric",
                                                    hour: "2-digit",
                                                    minute: "2-digit"
                                                }) : ""}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Mobile Search Modal */}
            {showMobileSearch && (
                <div style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: "rgba(0,0,0,0.5)",
                    display: "flex",
                    flexDirection: "column",
                    zIndex: 200,
                    animation: "fadeIn 0.2s ease-in-out",
                }}>
                    <style>{`
                        @keyframes fadeIn {
                            from { opacity: 0; }
                            to { opacity: 1; }
                        }
                    `}</style>
                    
                    {/* Header */}
                    <div style={{
                        background: "white",
                        padding: "16px",
                        borderBottom: "1px solid #e5e7eb",
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                    }}>
                        <button
                            onClick={() => {
                                setShowMobileSearch(false);
                                setSearchQuery("");
                                setShowSearchResults(false);
                            }}
                            style={{
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                padding: 0,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                            }}>
                            <iconify-icon icon="mdi:close" style={{
                                fontSize: 24,
                                color: "#374151",
                            }}></iconify-icon>
                        </button>
                        
                        <div style={{
                            position: "relative",
                            flex: 1,
                        }}>
                            <input 
                                type="text"
                                placeholder="Cari Fitur..."
                                value={searchQuery}
                                onChange={handleSearch}
                                autoFocus
                                style={{
                                    width: "100%",
                                    border: "1px solid #d1d5db",
                                    borderRadius: 8,
                                    padding: "10px 12px 10px 36px",
                                    fontSize: 14,
                                    color: "#374151",
                                    outline: "none",
                                    transition: "border-color 0.2s",
                                    fontFamily: "Plus Jakarta Sans, sans-serif",
                                }}
                                onFocus={e => e.currentTarget.style.borderColor = "#9FF782"}
                                onBlur={e => e.currentTarget.style.borderColor = "#d1d5db"}
                            />
                            <iconify-icon 
                                icon="mdi:magnify"
                                style={{
                                    position: "absolute",
                                    left: 12,
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    fontSize: 18,
                                    color: "#9ca3af",
                                    pointerEvents: "none",
                                }}>
                            </iconify-icon>
                        </div>
                    </div>

                    {/* Results */}
                    <div style={{
                        flex: 1,
                        overflowY: "auto",
                        background: "white",
                    }}>
                        {searchQuery.trim() === "" ? (
                            <div style={{
                                padding: "24px 16px",
                                textAlign: "center",
                                color: "#9ca3af",
                                fontSize: 13,
                            }}>
                                Mulai ketik untuk mencari fitur
                            </div>
                        ) : searchResults.length === 0 ? (
                            <div style={{
                                padding: "24px 16px",
                                textAlign: "center",
                                color: "#9ca3af",
                                fontSize: 13,
                            }}>
                                Fitur tidak ditemukan
                            </div>
                        ) : (
                            <div>
                                {searchResults.map((feature, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => handleResultClick(feature)}
                                        style={{
                                            width: "100%",
                                            padding: "16px",
                                            textAlign: "left",
                                            background: "none",
                                            border: "none",
                                            borderBottom: "1px solid #f3f4f6",
                                            cursor: "pointer",
                                            fontSize: 14,
                                            color: "#374151",
                                            transition: "background 0.2s",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 12,
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.background = "#f9fafb"}
                                        onMouseLeave={e => e.currentTarget.style.background = "white"}>
                                        <span style={{ fontSize: 20 }}>{feature.icon}</span>
                                        <div style={{ flex: 1 }}>
                                            <p style={{ margin: "0 0 4px 0", fontWeight: 600, color: "#1a3a1f" }}>
                                                {feature.name}
                                            </p>
                                            <p style={{ margin: 0, fontSize: 12, color: "#9ca3af" }}>
                                                {feature.category}
                                            </p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
}