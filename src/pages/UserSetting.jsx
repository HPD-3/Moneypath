import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase.js";
import { sendPasswordResetEmail } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
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

    // Settings form state
    const [settingsForm, setSettingsForm] = useState({
        notificationsEmail: true,
        notificationsInApp: true,
        privacyLevel: "private", // private, friends, public
        language: "id", // id, en
        theme: "light", // light, dark
    });

    // Forgot password state
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
    const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
    const [forgotPasswordMessage, setForgotPasswordMessage] = useState("");
    const [forgotPasswordError, setForgotPasswordError] = useState("");

    // Change password state
    const [showChangePassword, setShowChangePassword] = useState(false);
    const [changePasswordForm, setChangePasswordForm] = useState({
        oldPassword: "",
        newPassword: "",
        confirmPassword: ""
    });
    const [changePasswordLoading, setChangePasswordLoading] = useState(false);
    const [changePasswordMessage, setChangePasswordMessage] = useState("");
    const [changePasswordError, setChangePasswordError] = useState("");

    // Settings update state
    const [settingsLoading, setSettingsLoading] = useState(false);
    const [settingsMessage, setSettingsMessage] = useState("");
    const [settingsError, setSettingsError] = useState("");

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
                setForgotPasswordEmail(user.email || "");

                // Fetch settings from server
                const settingsRes = await API.get("/settings");
                if (settingsRes.data) {
                    setSettingsForm(prev => ({
                        ...prev,
                        ...settingsRes.data
                    }));
                }
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

    // Handle change password
    const handleChangePassword = async (e) => {
        e.preventDefault();
        setChangePasswordError("");
        setChangePasswordMessage("");

        if (!changePasswordForm.newPassword || !changePasswordForm.confirmPassword) {
            setChangePasswordError("Please fill in all password fields");
            return;
        }

        if (changePasswordForm.newPassword !== changePasswordForm.confirmPassword) {
            setChangePasswordError("New passwords do not match");
            return;
        }

        if (changePasswordForm.newPassword.length < 6) {
            setChangePasswordError("Password must be at least 6 characters");
            return;
        }

        try {
            setChangePasswordLoading(true);
            const response = await API.post("/settings/change-password", {
                oldPassword: changePasswordForm.oldPassword,
                newPassword: changePasswordForm.newPassword
            });

            setChangePasswordMessage(response.data.message || "Password changed successfully!");
            setChangePasswordForm({
                oldPassword: "",
                newPassword: "",
                confirmPassword: ""
            });
            setShowChangePassword(false);
            
            setTimeout(() => {
                setChangePasswordMessage("");
            }, 3000);
        } catch (err) {
            setChangePasswordError(err.response?.data?.message || "Failed to change password");
        } finally {
            setChangePasswordLoading(false);
        }
    };

    // Handle settings update
    const handleSettingsUpdate = async (e) => {
        e.preventDefault();
        setSettingsError("");
        setSettingsMessage("");

        try {
            setSettingsLoading(true);
            const response = await API.post("/settings/update", settingsForm);
            setSettingsMessage(response.data.message || "Settings updated successfully!");
            
            setTimeout(() => {
                setSettingsMessage("");
            }, 3000);
        } catch (err) {
            setSettingsError(err.response?.data?.message || "Failed to update settings");
        } finally {
            setSettingsLoading(false);
        }
    };

    const handleLogout = async () => {
        await auth.signOut();
        navigate("/login");
    };

    return (
        <div className="flex h-screen bg-[#f3f3f3]">
            <Sidebar
                active="settings"
                setActive={() => {}}
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

                <div className="p-6 max-w-4xl mx-auto">
                    {/* Success Messages */}
                    {forgotPasswordMessage && (
                        <div className="mb-4 p-4 bg-green-100 text-green-800 rounded-lg border border-green-300">
                            {forgotPasswordMessage}
                        </div>
                    )}
                    {changePasswordMessage && (
                        <div className="mb-4 p-4 bg-green-100 text-green-800 rounded-lg border border-green-300">
                            {changePasswordMessage}
                        </div>
                    )}
                    {settingsMessage && (
                        <div className="mb-4 p-4 bg-green-100 text-green-800 rounded-lg border border-green-300">
                            {settingsMessage}
                        </div>
                    )}

                    {/* Error Messages */}
                    {error && (
                        <div className="mb-4 p-4 bg-red-100 text-red-800 rounded-lg border border-red-300">
                            {error}
                        </div>
                    )}
                    {forgotPasswordError && (
                        <div className="mb-4 p-4 bg-red-100 text-red-800 rounded-lg border border-red-300">
                            {forgotPasswordError}
                        </div>
                    )}
                    {changePasswordError && (
                        <div className="mb-4 p-4 bg-red-100 text-red-800 rounded-lg border border-red-300">
                            {changePasswordError}
                        </div>
                    )}
                    {settingsError && (
                        <div className="mb-4 p-4 bg-red-100 text-red-800 rounded-lg border border-red-300">
                            {settingsError}
                        </div>
                    )}

                    <h1 className="text-3xl font-bold mb-8">Settings</h1>

                    {/* Account Security Section */}
                    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                        <h2 className="text-xl font-bold mb-4">🔒 Account Security</h2>
                        
                        <div className="space-y-4">
                            <button
                                onClick={() => setShowForgotPassword(!showForgotPassword)}
                                className="w-full px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition"
                            >
                                {showForgotPassword ? "Cancel" : "Reset Password"}
                            </button>

                            {showForgotPassword && (
                                <form onSubmit={handleForgotPassword} className="bg-gray-50 p-4 rounded-lg space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Email Address</label>
                                        <input
                                            type="email"
                                            value={forgotPasswordEmail}
                                            onChange={(e) => setForgotPasswordEmail(e.target.value)}
                                            placeholder="your@email.com"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <p className="text-sm text-gray-600">
                                        We'll send a password reset link to your email address.
                                    </p>
                                    <button
                                        type="submit"
                                        disabled={forgotPasswordLoading}
                                        className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition disabled:opacity-50"
                                    >
                                        {forgotPasswordLoading ? "Sending..." : "Send Reset Email"}
                                    </button>
                                </form>
                            )}

                            <button
                                onClick={() => setShowChangePassword(!showChangePassword)}
                                className="w-full px-4 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-semibold transition"
                            >
                                {showChangePassword ? "Cancel" : "Change Password"}
                            </button>

                            {showChangePassword && (
                                <form onSubmit={handleChangePassword} className="bg-gray-50 p-4 rounded-lg space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Current Password</label>
                                        <input
                                            type="password"
                                            value={changePasswordForm.oldPassword}
                                            onChange={(e) => setChangePasswordForm({...changePasswordForm, oldPassword: e.target.value})}
                                            placeholder="Enter your current password"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">New Password</label>
                                        <input
                                            type="password"
                                            value={changePasswordForm.newPassword}
                                            onChange={(e) => setChangePasswordForm({...changePasswordForm, newPassword: e.target.value})}
                                            placeholder="Enter new password"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Confirm New Password</label>
                                        <input
                                            type="password"
                                            value={changePasswordForm.confirmPassword}
                                            onChange={(e) => setChangePasswordForm({...changePasswordForm, confirmPassword: e.target.value})}
                                            placeholder="Confirm new password"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={changePasswordLoading}
                                        className="w-full px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-semibold transition disabled:opacity-50"
                                    >
                                        {changePasswordLoading ? "Updating..." : "Update Password"}
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>

                    {/* Notification Settings */}
                    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                        <h2 className="text-xl font-bold mb-4">🔔 Notifications</h2>
                        
                        <form onSubmit={handleSettingsUpdate} className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <label className="font-medium">Email Notifications</label>
                                    <p className="text-sm text-gray-600">Receive updates via email</p>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={settingsForm.notificationsEmail}
                                    onChange={(e) => setSettingsForm({...settingsForm, notificationsEmail: e.target.checked})}
                                    className="w-5 h-5 cursor-pointer"
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <label className="font-medium">In-App Notifications</label>
                                    <p className="text-sm text-gray-600">Show notifications in the app</p>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={settingsForm.notificationsInApp}
                                    onChange={(e) => setSettingsForm({...settingsForm, notificationsInApp: e.target.checked})}
                                    className="w-5 h-5 cursor-pointer"
                                />
                            </div>

                            <hr className="my-4" />

                            <div>
                                <label className="block text-sm font-medium mb-2">Privacy Level</label>
                                <select
                                    value={settingsForm.privacyLevel}
                                    onChange={(e) => setSettingsForm({...settingsForm, privacyLevel: e.target.value})}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="private">Private (Only you)</option>
                                    <option value="friends">Friends Only</option>
                                    <option value="public">Public</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Language</label>
                                <select
                                    value={settingsForm.language}
                                    onChange={(e) => setSettingsForm({...settingsForm, language: e.target.value})}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="id">Bahasa Indonesia</option>
                                    <option value="en">English</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Theme</label>
                                <select
                                    value={settingsForm.theme}
                                    onChange={(e) => setSettingsForm({...settingsForm, theme: e.target.value})}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="light">Light</option>
                                    <option value="dark">Dark</option>
                                </select>
                            </div>

                            <button
                                type="submit"
                                disabled={settingsLoading}
                                className="w-full px-4 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold transition disabled:opacity-50"
                            >
                                {settingsLoading ? "Saving..." : "Save Settings"}
                            </button>
                        </form>
                    </div>

                    {/* User Info */}
                    {profile && (
                        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                            <h2 className="text-xl font-bold mb-4">👤 Account Information</h2>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm text-gray-600">Name</label>
                                    <p className="font-semibold">{profile?.name || "N/A"}</p>
                                </div>
                                <div>
                                    <label className="text-sm text-gray-600">Email</label>
                                    <p className="font-semibold">{auth.currentUser?.email}</p>
                                </div>
                                <div>
                                    <label className="text-sm text-gray-600">Phone</label>
                                    <p className="font-semibold">{profile?.phoneNumber || "N/A"}</p>
                                </div>
                                <div>
                                    <label className="text-sm text-gray-600">Gender</label>
                                    <p className="font-semibold">{profile?.gender || "N/A"}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Logout Button */}
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <button
                            onClick={handleLogout}
                            className="w-full px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
