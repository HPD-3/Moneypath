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


    // Forgot password state
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
    const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
    const [forgotPasswordMessage, setForgotPasswordMessage] = useState("");
    const [forgotPasswordError, setForgotPasswordError] = useState("");



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




    const handleLogout = async () => {
        await auth.signOut();
        navigate("/login");
    };

    return (
        <div className="flex h-screen bg-[#f3f3f3]">
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

                <div className="p-6 max-w-4xl mx-auto">
                    {/* Success Messages */}
                    {forgotPasswordMessage && (
                        <div className="mb-4 p-4 bg-green-100 text-green-800 rounded-lg border border-green-300">
                            {forgotPasswordMessage}
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


                        </div>
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
