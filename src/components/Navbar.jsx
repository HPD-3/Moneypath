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
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [quizStats, setQuizStats] = useState(null);

    const handleResize = () => {
        setIsMobile(window.innerWidth < 768);
    };

    React.useEffect(() => {
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    // Fetch quiz stats for XP and streak
    useEffect(() => {
        const fetchQuizStats = async () => {
            try {
                const res = await API.get("/quiz/stats");
                setQuizStats(res.data);
            } catch (err) {
                console.error("Error fetching quiz stats:", err);
            }
        };
        fetchQuizStats();
    }, []);

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
            padding: "12px 24px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            position: "sticky",
            top: 0,
            zIndex: 50,
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            borderBottom: "1px solid #e5e7eb",
            gap: 24,
        }}>
            {/* Left: Hamburger + Search */}
            <div style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
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

                {/* Search Bar */}
                <div style={{
                    position: "relative",
                    width: isMobile ? "100%" : "400px",
                }}>
                    <input 
                        type="text"
                        placeholder="Cari Topik..."
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
                        }}>
                    </iconify-icon>
                </div>
            </div>

            {/* Right: XP + Streak + Profile Menu + Notifications */}
            <div style={{
                display: "flex",
                alignItems: "center",
                gap: 20,
            }}>
                {/* Streak Display - Fire Icon */}
                {quizStats?.streak !== undefined && (
                    <div style={{
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
                            <iconify-icon icon="mdi:fire" style={{
                                fontSize: 22,
                                color: "#FF6B00",
                            }}></iconify-icon>
                        </div>
                        <div style={{
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

                {/* XP Display - Lightning Icon */}
                <div style={{
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
                        <iconify-icon icon="mdi:lightning-bolt" style={{
                            fontSize: 22,
                            color: "#059669",
                        }}></iconify-icon>
                    </div>
                    <div style={{
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

                {/* Profile Menu */}
                <div style={{ position: "relative" }}>
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
                        }}>
                            <iconify-icon icon="mdi:account" style={{
                                fontSize: 20,
                                color: "#9ca3af",
                            }}></iconify-icon>
                        </div>
                        <iconify-icon icon="mdi:chevron-down" style={{
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
                <button
                    style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: 0,
                        transition: "transform 0.2s",
                    }}
                    onMouseEnter={e => e.currentTarget.style.transform = "scale(1.1)"}
                    onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}>
                    <iconify-icon icon="mdi:bell-outline" style={{
                        fontSize: 28,
                        color: "#374151",
                    }}></iconify-icon>
                </button>
            </div>
        </nav>
    );
}