import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth, signOut } from "firebase/auth";

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

    const handleResize = () => {
        setIsMobile(window.innerWidth < 768);
    };

    React.useEffect(() => {
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
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
            padding: "14px 24px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            position: "sticky",
            top: 0,
            zIndex: 50,
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            borderBottom: "1px solid #e5e7eb",
        }}>
            {/* Left: Hamburger + Greeting */}
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

                {/* Greeting Text */}
                <h1 style={{
                    fontSize: 18,
                    fontWeight: 700,
                    color: "#1a3a1f",
                    margin: 0,
                    whiteSpace: "nowrap",
                }}>
                    Halo {personal?.name?.split(" ")[0] || "Username"}! {greeting()}
                </h1>
            </div>

            {/* Right Actions */}
            <div style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
            }}>
                {/* User Avatar with Dropdown */}
                <div style={{ position: "relative" }}>
                    <button onClick={() => setShowDropdown(!showDropdown)}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            background: "#f3f4f6",
                            padding: "6px 12px",
                            borderRadius: 20,
                            border: "none",
                            cursor: "pointer",
                            transition: "background 0.2s",
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = "#e5e7eb"}
                        onMouseLeave={e => e.currentTarget.style.background = "#f3f4f6"}>
                        <div style={{
                            width: 32,
                            height: 32,
                            borderRadius: "50%",
                            background: "#9FF782",
                            color: "#0a1f10",
                            border: "none",
                            fontWeight: 700,
                            fontSize: 13,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}>
                            {(personal?.name || profile?.email || "U")[0].toUpperCase()}
                        </div>
                        <span style={{
                            fontSize: 13,
                            fontWeight: 500,
                            color: "#4b5563",
                        }}>
                            {personal?.name?.split(" ")[0] || "User"}
                        </span>
                        <span style={{
                            color: "#9ca3af",
                            fontSize: 12,
                        }}>▾</span>
                    </button>

                    {/* Dropdown Menu */}
                    {showDropdown && (
                        <div style={{
                            position: "absolute",
                            right: 0,
                            top: 44,
                            background: "white",
                            border: "1px solid #e5e7eb",
                            borderRadius: 10,
                            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                            minWidth: 180,
                            zIndex: 100,
                        }}>
                            <button onClick={() => { navigate("/profile"); setShowDropdown(false); }}
                                style={{
                                    width: "100%",
                                    padding: "12px 16px",
                                    textAlign: "left",
                                    background: "none",
                                    border: "none",
                                    cursor: "pointer",
                                    fontSize: 13,
                                    color: "#1a3a1f",
                                    borderBottom: "1px solid #f0f0f0",
                                    transition: "background 0.2s",
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = "#f9fafb"}
                                onMouseLeave={e => e.currentTarget.style.background = "none"}>
                                👤 Profil Saya
                            </button>
                            <button onClick={() => { navigate("/settings"); setShowDropdown(false); }}
                                style={{
                                    width: "100%",
                                    padding: "12px 16px",
                                    textAlign: "left",
                                    background: "none",
                                    border: "none",
                                    cursor: "pointer",
                                    fontSize: 13,
                                    color: "#1a3a1f",
                                    borderBottom: "1px solid #f0f0f0",
                                    transition: "background 0.2s",
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = "#f9fafb"}
                                onMouseLeave={e => e.currentTarget.style.background = "none"}>
                                ⚙️ Pengaturan
                            </button>
                            <button onClick={handleLogout}
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
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = "#fef2f2"}
                                onMouseLeave={e => e.currentTarget.style.background = "none"}>
                                ⬅️ Logout
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
}