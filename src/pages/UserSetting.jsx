import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase.js";
import { sendPasswordResetEmail, deleteUser } from "firebase/auth";
import { doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import API from "../services/api.js";
import Sidebar from "../components/Sidebar.jsx";
import Navbar from "../components/Navbar.jsx";
import "../Profile.css";

export default function UserSetting() {
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [personal, setPersonal] = useState(null);
    const [error, setError] = useState(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Forgot password state
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
    const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
    const [forgotPasswordMessage, setForgotPasswordMessage] = useState("");
    const [forgotPasswordError, setForgotPasswordError] = useState("");

    // Edit username state
    const [showEditUsername, setShowEditUsername] = useState(false);
    const [newUsername, setNewUsername] = useState("");
    const [editUsernameLoading, setEditUsernameLoading] = useState(false);
    const [editUsernameError, setEditUsernameError] = useState("");
    const [editUsernameMessage, setEditUsernameMessage] = useState("");

    // Delete account state
    const [showDeleteAccount, setShowDeleteAccount] = useState(false);
    const [deleteConfirmPassword, setDeleteConfirmPassword] = useState("");
    const [deleteAccountLoading, setDeleteAccountLoading] = useState(false);
    const [deleteAccountError, setDeleteAccountError] = useState("");

    // Fetch profile and personal data
    useEffect(() => {
        const fetchData = async () => {
            try {
                const user = auth.currentUser;
                if (!user) {
                    navigate("/login");
                    return;
                }

                // Fetch profile from API
                const profileRes = await API.get("/personal/profile");
                setProfile(profileRes.data);
                setNewUsername(profileRes.data?.name || "");
                setForgotPasswordEmail(user.email || "");

            } catch (err) {
                console.error("Error fetching data:", err);
                setError(err.response?.data?.message || "Failed to load settings");
            }
        };

        fetchData();
    }, [navigate]);

    // Handle forgot password
    const handleForgotPassword = async (e) => {
        e.preventDefault();
        setForgotPasswordError("");
        setForgotPasswordMessage("");

        if (!forgotPasswordEmail) {
            setForgotPasswordError("Please enter your email address");
            return;
        }

        try {
            setForgotPasswordLoading(true);
            await sendPasswordResetEmail(auth, forgotPasswordEmail);
            setForgotPasswordMessage("Password reset email sent! Check your inbox.");
            setShowForgotPassword(false);
            setTimeout(() => {
                setForgotPasswordMessage("");
            }, 3000);
        } catch (err) {
            setForgotPasswordError(err.message || "Failed to send password reset email");
        } finally {
            setForgotPasswordLoading(false);
        }
    };

    // Handle edit username
    const handleEditUsername = async (e) => {
        e.preventDefault();
        setEditUsernameError("");
        setEditUsernameMessage("");

        if (!newUsername.trim()) {
            setEditUsernameError("Username cannot be empty");
            return;
        }

        try {
            setEditUsernameLoading(true);
            await API.post("/settings/update-username", { name: newUsername });
            setProfile({ ...profile, name: newUsername });
            setEditUsernameMessage("Username updated successfully!");
            setShowEditUsername(false);
            setTimeout(() => {
                setEditUsernameMessage("");
            }, 3000);
        } catch (err) {
            setEditUsernameError(err.response?.data?.message || "Failed to update username");
        } finally {
            setEditUsernameLoading(false);
        }
    };

    // Handle delete account
    const handleDeleteAccount = async (e) => {
        e.preventDefault();
        setDeleteAccountError("");

        if (!deleteConfirmPassword) {
            setDeleteAccountError("Please enter your password to confirm deletion");
            return;
        }

        try {
            setDeleteAccountLoading(true);
            
            // Call backend to delete account
            await API.post("/settings/delete-account", { password: deleteConfirmPassword });
            
            // Delete user from Firebase
            const user = auth.currentUser;
            if (user) {
                await deleteUser(user);
            }

            // Redirect to login
            navigate("/login");
        } catch (err) {
            setDeleteAccountError(err.response?.data?.message || "Failed to delete account");
        } finally {
            setDeleteAccountLoading(false);
        }
    };

    const handleLogout = async () => {
        await auth.signOut();
        navigate("/login");
    };

    return (
        <div className="flex h-screen bg-gray-100">
            <Sidebar
                active="settings"
                setActive={() => { }}
                handleLogout={handleLogout}
                isOpen={isSidebarOpen}
                setOpen={setIsSidebarOpen}
            />
            <div className="flex-1 overflow-auto">
                <Navbar
                    profile={profile}
                    personal={personal}
                    isSidebarOpen={isSidebarOpen}
                    setSidebarOpen={setIsSidebarOpen}
                />

                <div className="p-4 md:p-8 max-w-4xl mx-auto">
                    {/* Success Messages */}
                    {forgotPasswordMessage && (
                        <div className="mb-4 p-4 bg-green-100 text-green-800 rounded-lg border border-green-300 text-sm">
                            ✓ {forgotPasswordMessage}
                        </div>
                    )}
                    {editUsernameMessage && (
                        <div className="mb-4 p-4 bg-green-100 text-green-800 rounded-lg border border-green-300 text-sm">
                            ✓ {editUsernameMessage}
                        </div>
                    )}

                    {/* Error Messages */}
                    {error && (
                        <div className="mb-4 p-4 bg-red-100 text-red-800 rounded-lg border border-red-300 text-sm">
                            ✕ {error}
                        </div>
                    )}
                    {forgotPasswordError && (
                        <div className="mb-4 p-4 bg-red-100 text-red-800 rounded-lg border border-red-300 text-sm">
                            ✕ {forgotPasswordError}
                        </div>
                    )}
                    {editUsernameError && (
                        <div className="mb-4 p-4 bg-red-100 text-red-800 rounded-lg border border-red-300 text-sm">
                            ✕ {editUsernameError}
                        </div>
                    )}
                    {deleteAccountError && (
                        <div className="mb-4 p-4 bg-red-100 text-red-800 rounded-lg border border-red-300 text-sm">
                            ✕ {deleteAccountError}
                        </div>
                    )}

                    <h1 className="text-3xl md:text-4xl font-bold mb-8 text-[#1a3a1f]">Settings</h1>

                    {/* Account Information Section */}
                    {profile && (
                        <div className="bg-white rounded-xl shadow-md p-6 mb-6 border-l-4 border-[#9FF782]">
                            <h2 className="text-xl font-bold mb-6 text-[#1a3a1f] flex items-center gap-2">
                                <span>👤</span> Account Information
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <div className="md:col-span-2">
                                    <label className="text-sm font-medium text-gray-600 mb-2 block">Username</label>
                                    <div className="flex gap-2 items-end">
                                        <div className="flex-1">
                                            <p className="font-semibold text-lg text-gray-800 bg-gray-50 p-3 rounded-lg">{profile?.name || "N/A"}</p>
                                        </div>
                                        <button
                                            onClick={() => setShowEditUsername(!showEditUsername)}
                                            className="px-4 py-2 bg-[#9FF782] hover:bg-[#7dd65f] text-[#1a3a1f] rounded-lg font-semibold transition whitespace-nowrap"
                                        >
                                            {showEditUsername ? "Cancel" : "Edit"}
                                        </button>
                                    </div>

                                    {showEditUsername && (
                                        <form onSubmit={handleEditUsername} className="bg-gray-50 p-4 rounded-lg space-y-4 mt-4">
                                            <input
                                                type="text"
                                                value={newUsername}
                                                onChange={(e) => setNewUsername(e.target.value)}
                                                placeholder="Enter new username"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9FF782]"
                                            />
                                            <button
                                                type="submit"
                                                disabled={editUsernameLoading}
                                                className="w-full px-4 py-2 bg-[#9FF782] hover:bg-[#7dd65f] text-[#1a3a1f] rounded-lg font-semibold transition disabled:opacity-50"
                                            >
                                                {editUsernameLoading ? "Saving..." : "Save Username"}
                                            </button>
                                        </form>
                                    )}
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-600 mb-2 block">Email</label>
                                    <p className="font-semibold text-gray-800 bg-gray-50 p-3 rounded-lg">{auth.currentUser?.email}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-600 mb-2 block">Phone</label>
                                    <p className="font-semibold text-gray-800 bg-gray-50 p-3 rounded-lg">{profile?.phoneNumber || "N/A"}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-600 mb-2 block">Gender</label>
                                    <p className="font-semibold text-gray-800 bg-gray-50 p-3 rounded-lg">{profile?.gender || "N/A"}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Account Security Section */}
                    <div className="bg-white rounded-xl shadow-md p-6 mb-6 border-l-4 border-[#0f2e1c]">
                        <h2 className="text-xl font-bold mb-4 text-[#1a3a1f] flex items-center gap-2">
                            <span>🔒</span> Account Security
                        </h2>

                        <div className="space-y-4">
                            <button
                                onClick={() => setShowForgotPassword(!showForgotPassword)}
                                className="w-full px-4 py-3 bg-[#0f2e1c] hover:bg-[#174d2e] text-[#9FF782] rounded-lg font-semibold transition"
                            >
                                {showForgotPassword ? "Cancel" : "Reset Password"}
                            </button>

                            {showForgotPassword && (
                                <form onSubmit={handleForgotPassword} className="bg-gray-50 p-4 rounded-lg space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-2 text-gray-700">Email Address</label>
                                        <input
                                            type="email"
                                            value={forgotPasswordEmail}
                                            onChange={(e) => setForgotPasswordEmail(e.target.value)}
                                            placeholder="your@email.com"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9FF782]"
                                        />
                                    </div>
                                    <p className="text-sm text-gray-600">
                                        We'll send a password reset link to your email address.
                                    </p>
                                    <button
                                        type="submit"
                                        disabled={forgotPasswordLoading}
                                        className="w-full px-4 py-2 bg-[#0f2e1c] hover:bg-[#174d2e] text-[#9FF782] rounded-lg font-semibold transition disabled:opacity-50"
                                    >
                                        {forgotPasswordLoading ? "Sending..." : "Send Reset Email"}
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>

                    {/* Danger Zone */}
                    <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-red-500">
                        <h2 className="text-xl font-bold mb-6 text-red-600 flex items-center gap-2">
                            <span>⚠️</span> Danger Zone
                        </h2>

                        <div className="space-y-4">
                            <button
                                onClick={() => setShowDeleteAccount(!showDeleteAccount)}
                                className="w-full px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition"
                            >
                                {showDeleteAccount ? "Cancel" : "Delete Account"}
                            </button>

                            {showDeleteAccount && (
                                <form onSubmit={handleDeleteAccount} className="bg-red-50 p-4 rounded-lg space-y-4 border border-red-200">
                                    <p className="text-sm text-red-700 font-semibold">
                                        ⚠️ This action cannot be undone. All your data will be permanently deleted.
                                    </p>
                                    <div>
                                        <label className="block text-sm font-medium mb-2 text-gray-700">Enter your password to confirm</label>
                                        <input
                                            type="password"
                                            value={deleteConfirmPassword}
                                            onChange={(e) => setDeleteConfirmPassword(e.target.value)}
                                            placeholder="••••••••"
                                            className="w-full px-3 py-2 border border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={deleteAccountLoading || !deleteConfirmPassword}
                                        className="w-full px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition disabled:opacity-50"
                                    >
                                        {deleteAccountLoading ? "Deleting..." : "Confirm Delete Account"}
                                    </button>
                                </form>
                            )}
                        </div>

                        {/* Logout Button */}
                        <button
                            onClick={handleLogout}
                            className="w-full mt-4 px-4 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-semibold transition"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
