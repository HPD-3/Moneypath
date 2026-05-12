import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase.js";
import { sendPasswordResetEmail, deleteUser, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";
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

    // Toast notification
    const [toast, setToast] = useState(null); // { type: 'success'|'error', message: string }
    const showToast = (type, message) => {
        setToast({ type, message });
        setTimeout(() => setToast(null), 4000);
    };

    // Forgot password state
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
    const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
    const [forgotPasswordMessage, setForgotPasswordMessage] = useState("");
    const [forgotPasswordError, setForgotPasswordError] = useState("");

    // Edit name state
    const [showEditName, setShowEditName] = useState(false);
    const [newName, setNewName] = useState("");
    const [editNameLoading, setEditNameLoading] = useState(false);
    const [editNameError, setEditNameError] = useState("");
    const [editNameMessage, setEditNameMessage] = useState("");

    // Edit profile form state
    const [showEditProfile, setShowEditProfile] = useState(false);
    const [editForm, setEditForm] = useState({
        name: "",
        phoneNumber: "",
        dateOfBirth: "",
        gender: "",
        address: ""
    });
    const [editProfileLoading, setEditProfileLoading] = useState(false);
    const [editProfileError, setEditProfileError] = useState("");
    const [editProfileMessage, setEditProfileMessage] = useState("");

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
                setNewName(profileRes.data?.name || "");
                setEditForm({
                    name: profileRes.data?.name || "",
                    phoneNumber: profileRes.data?.phoneNumber || "",
                    dateOfBirth: profileRes.data?.dateOfBirth || "",
                    gender: profileRes.data?.gender || "",
                    address: profileRes.data?.address || ""
                });
                setForgotPasswordEmail(user.email || "");

            } catch (err) {
                console.error("Error fetching data:", err);
                setError(err.response?.data?.message || "Failed to load settings");
                showToast("error", err.response?.data?.message || "Failed to load settings");
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
            showToast("error", "Please enter your email address");
            return;
        }

        try {
            setForgotPasswordLoading(true);
            await sendPasswordResetEmail(auth, forgotPasswordEmail);
            setShowForgotPassword(false);
            showToast("success", "Password reset email sent! Check your inbox.");
        } catch (err) {
            showToast("error", err.message || "Failed to send password reset email");
        } finally {
            setForgotPasswordLoading(false);
        }
    };

    // Handle edit profile form change
    const handleEditProfileChange = (e) => {
        const { name, value } = e.target;
        setEditForm((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    // Handle edit profile submit
    const handleEditProfileSubmit = async (e) => {
        e.preventDefault();
        setEditProfileError("");
        setEditProfileMessage("");

        try {
            setEditProfileLoading(true);
            await API.post("/personal/profile", editForm);
            setProfile({ ...profile, ...editForm });
            setShowEditProfile(false);
            showToast("success", "Profile updated successfully!");
        } catch (err) {
            showToast("error", err.response?.data?.message || "Failed to update profile");
        } finally {
            setEditProfileLoading(false);
        }
    };

    // Handle delete account
    const handleDeleteAccount = async (e) => {
        e.preventDefault();
        setDeleteAccountError("");

        if (!deleteConfirmPassword) {
            showToast("error", "Please enter your password to confirm deletion");
            return;
        }

        try {
            setDeleteAccountLoading(true);

            // Re-authenticate to verify password BEFORE deleting
            const user = auth.currentUser;
            if (!user || !user.email) {
                showToast("error", "No authenticated user found. Please log in again.");
                return;
            }

            const credential = EmailAuthProvider.credential(user.email, deleteConfirmPassword);
            await reauthenticateWithCredential(user, credential);

            // Password verified — delete from backend then Firebase
            await API.post("/settings/delete-account", { password: deleteConfirmPassword });
            await deleteUser(user);

            navigate("/login");
        } catch (err) {
            if (err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
                showToast("error", "Incorrect password. Account was not deleted.");
            } else if (err.code === "auth/too-many-requests") {
                showToast("error", "Too many attempts. Please try again later.");
            } else {
                showToast("error", err.response?.data?.message || err.message || "Failed to delete account");
            }
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
            {/* Toast Notification */}
            {toast && (
                <div
                    style={{
                        position: "fixed",
                        top: 24,
                        right: 24,
                        zIndex: 9999,
                        minWidth: 280,
                        maxWidth: 380,
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 12,
                        padding: "14px 18px",
                        borderRadius: 12,
                        boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
                        background: toast.type === "success" ? "#f0fdf4" : "#fff1f2",
                        border: `1.5px solid ${toast.type === "success" ? "#86efac" : "#fca5a5"}`,
                        animation: "slideIn 0.25s ease",
                    }}
                >
                    <span style={{ fontSize: 20, lineHeight: 1 }}>
                        {toast.type === "success" ? "✅" : "❌"}
                    </span>
                    <div style={{ flex: 1 }}>
                        <p style={{
                            margin: 0,
                            fontSize: 14,
                            fontWeight: 600,
                            color: toast.type === "success" ? "#166534" : "#991b1b",
                        }}>
                            {toast.type === "success" ? "Success" : "Error"}
                        </p>
                        <p style={{ margin: "2px 0 0", fontSize: 13, color: toast.type === "success" ? "#15803d" : "#b91c1c" }}>
                            {toast.message}
                        </p>
                    </div>
                    <button
                        onClick={() => setToast(null)}
                        style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "#9ca3af", lineHeight: 1, padding: 0 }}
                    >
                        ✕
                    </button>
                    <style>{`@keyframes slideIn { from { opacity: 0; transform: translateX(40px); } to { opacity: 1; transform: translateX(0); } }`}</style>
                </div>
            )}
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

                    <h1 className="text-3xl md:text-4xl font-bold mb-8 text-[#1a3a1f]">Settings</h1>

                    {/* Account Information Section */}
                    {profile && (
                        <div className="bg-white rounded-xl shadow-md p-6 mb-6 border-l-4 border-[#9FF782]">
                            <h2 className="text-xl font-bold mb-6 text-[#1a3a1f] flex items-center gap-2">
                                <span>👤</span> Account Information
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <div className="md:col-span-2">
                                    <label className="text-sm font-medium text-gray-600 mb-2 block">Name</label>
                                    <p className="font-semibold text-gray-800 bg-gray-50 p-3 rounded-lg">{profile?.name || "N/A"}</p>
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
                                <div>
                                    <label className="text-sm font-medium text-gray-600 mb-2 block">Date of Birth</label>
                                    <p className="font-semibold text-gray-800 bg-gray-50 p-3 rounded-lg">{profile?.dateOfBirth || "N/A"}</p>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="text-sm font-medium text-gray-600 mb-2 block">Address</label>
                                    <p className="font-semibold text-gray-800 bg-gray-50 p-3 rounded-lg">{profile?.address || "N/A"}</p>
                                </div>
                            </div>

                            <button
                                onClick={() => setShowEditProfile(!showEditProfile)}
                                className="w-full px-4 py-2 bg-[#9FF782] hover:bg-[#7dd65f] text-[#1a3a1f] rounded-lg font-semibold transition"
                            >
                                {showEditProfile ? "Cancel Edit Profile" : "Edit Profile"}
                            </button>

                            {showEditProfile && (
                                <form onSubmit={handleEditProfileSubmit} className="bg-gray-50 p-4 rounded-lg space-y-4 mt-4">
                                    <div>
                                        <label className="text-sm font-medium text-gray-600 mb-2 block">Full Name</label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={editForm.name}
                                            onChange={handleEditProfileChange}
                                            placeholder="Full Name"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9FF782]"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-600 mb-2 block">Phone Number</label>
                                        <input
                                            type="tel"
                                            name="phoneNumber"
                                            value={editForm.phoneNumber}
                                            onChange={handleEditProfileChange}
                                            placeholder="Phone Number"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9FF782]"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-600 mb-2 block">Date of Birth</label>
                                        <input
                                            type="date"
                                            name="dateOfBirth"
                                            value={editForm.dateOfBirth}
                                            onChange={handleEditProfileChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9FF782]"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-600 mb-2 block">Gender</label>
                                        <select
                                            name="gender"
                                            value={editForm.gender}
                                            onChange={handleEditProfileChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9FF782]"
                                        >
                                            <option value="">Select Gender</option>
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-600 mb-2 block">Address</label>
                                        <textarea
                                            name="address"
                                            value={editForm.address}
                                            onChange={handleEditProfileChange}
                                            placeholder="Address"
                                            rows="3"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9FF782]"
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={editProfileLoading}
                                        className="w-full px-4 py-2 bg-[#9FF782] hover:bg-[#7dd65f] text-[#1a3a1f] rounded-lg font-semibold transition disabled:opacity-50"
                                    >
                                        {editProfileLoading ? "Saving..." : "Save Profile"}
                                    </button>
                                </form>
                            )}
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
