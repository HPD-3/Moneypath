import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase.js";
import { sendPasswordResetEmail, deleteUser, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";
import { doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import API from "../services/api.js";
import Sidebar from "../components/Sidebar.jsx";
import Navbar from "../components/Navbar.jsx";
import BadgeIllustration from "../components/BadgeIllustration.jsx";
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
    const [avatarUploading, setAvatarUploading] = useState(false);
    const [avatarUrl, setAvatarUrl] = useState(profile?.avatarUrl || "");
    const [pendingAvatarFile, setPendingAvatarFile] = useState(null);
    const [pendingAvatarPreview, setPendingAvatarPreview] = useState("");
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

    // Badge showcase state
    const [badgeSettings, setBadgeSettings] = useState(null);
    const [badgeLoading, setBadgeLoading] = useState(false);
    const [badgeMessage, setBadgeMessage] = useState("");
    const [badgeError, setBadgeError] = useState("");
    const [selectedBadge, setSelectedBadge] = useState("");
    const canEditAvatar = (badgeSettings?.unlockedBadges || []).includes("Custom Avatar Unlock");

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
                setAvatarUrl(user.photoURL || "");
                setAvatarUrl(profileRes.data?.avatarUrl || user.photoURL || "");

            } catch (err) {
                console.error("Error fetching data:", err);
                setError(err.response?.data?.message || "Failed to load settings");
                showToast("error", err.response?.data?.message || "Failed to load settings");
            }
        };

        fetchData();
    }, [navigate]);

    useEffect(() => {
        const fetchBadges = async () => {
            try {
                setBadgeLoading(true);
                const res = await API.get("/settings/badges");
                setBadgeSettings(res.data);
                setSelectedBadge(res.data?.activeBadge || "");
            } catch (err) {
                console.error("Error fetching badge settings:", err);
            } finally {
                setBadgeLoading(false);
            }
        };

        fetchBadges();
    }, []);

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

    // Save profile helper (callable from header Save button)
    const saveProfileNow = async () => {
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

    const handleBadgeSave = async (e) => {
        e.preventDefault();
        setBadgeError("");
        setBadgeMessage("");

        try {
            setBadgeLoading(true);
            await API.post("/settings/badges", { activeBadge: selectedBadge });
            setBadgeMessage("Badge aktif berhasil disimpan.");
            const res = await API.get("/settings/badges");
            setBadgeSettings(res.data);
        } catch (err) {
            setBadgeError(err.response?.data?.message || "Failed to save badge settings");
        } finally {
            setBadgeLoading(false);
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

                            <div className="flex gap-3">
                                {showEditProfile ? (
                                    <>
                                        <button
                                            onClick={saveProfileNow}
                                            disabled={editProfileLoading}
                                            className="flex-1 px-4 py-2 bg-[#0f2e1c] hover:bg-[#174d2e] text-[#9FF782] rounded-lg font-semibold transition disabled:opacity-50"
                                        >
                                            {editProfileLoading ? "Saving..." : "Save Profile"}
                                        </button>

                                        <button
                                            onClick={() => setShowEditProfile(false)}
                                            className="flex-1 px-4 py-2 bg-[#9FF782] hover:bg-[#7dd65f] text-[#1a3a1f] rounded-lg font-semibold transition"
                                        >
                                            Cancel
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        onClick={() => setShowEditProfile(true)}
                                        className="w-full px-4 py-2 bg-[#9FF782] hover:bg-[#7dd65f] text-[#1a3a1f] rounded-lg font-semibold transition"
                                    >
                                        Edit Profile
                                    </button>
                                )}
                            </div>

                            {/* Avatar Upload */}
                            <div className={`mt-6 bg-white/5 p-4 rounded-lg border border-gray-100 ${!canEditAvatar ? "opacity-70" : ""}`}>
                                <h3 className="font-semibold text-gray-900 mb-2">Avatar</h3>
                                <p className="text-sm text-gray-600 mb-3">Upload a custom avatar once you unlock the avatar reward.</p>
                                <div className="flex items-center gap-4">
                                    <div className="w-20 h-20 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center">
                                        {(pendingAvatarPreview || avatarUrl) ? <img src={pendingAvatarPreview || avatarUrl} alt="avatar" className="w-full h-full object-cover" /> : <iconify-icon icon="mdi:account" style={{ fontSize: 36 }}></iconify-icon>}
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        {!canEditAvatar ? (
                                            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                                                Locked until you claim Level 5, <strong>Goal Hunter</strong>.
                                            </div>
                                        ) : (
                                            <>
                                                <input type="file" accept="image/*" onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (!file) return;
                                                    // stage file preview, do not upload yet
                                                    const preview = URL.createObjectURL(file);
                                                    setPendingAvatarFile(file);
                                                    setPendingAvatarPreview(preview);
                                                }} />
                                                <div className="flex items-center gap-2">
                                                    <button disabled={avatarUploading || !pendingAvatarFile} onClick={async () => {
                                                        if (!pendingAvatarFile) return;
                                                        setAvatarUploading(true);
                                                        try {
                                                            const base64 = await new Promise((resolve, reject) => {
                                                                const reader = new FileReader();
                                                                reader.onload = () => {
                                                                    const result = reader.result || "";
                                                                    resolve(String(result).split(",")[1] || "");
                                                                };
                                                                reader.onerror = () => reject(new Error("Failed to read avatar file"));
                                                                reader.readAsDataURL(pendingAvatarFile);
                                                            });

                                                            const { data } = await API.post('/settings/avatar/upload', {
                                                                avatarBase64: base64,
                                                                fileName: pendingAvatarFile.name,
                                                                mimeType: pendingAvatarFile.type || 'image/jpeg',
                                                            });

                                                            const url = data?.avatarUrl;
                                                            setAvatarUrl(url);
                                                            showToast('success', 'Avatar uploaded and saved');
                                                        } catch (err) {
                                                            console.error(err);
                                                            showToast('error', err.response?.data?.message || err.message || 'Upload failed');
                                                        } finally {
                                                            setAvatarUploading(false);
                                                            // cleanup pending preview
                                                            if (pendingAvatarPreview) URL.revokeObjectURL(pendingAvatarPreview);
                                                            setPendingAvatarFile(null);
                                                            setPendingAvatarPreview("");
                                                        }
                                                    }} className="text-sm text-amber-500 bg-green-50 px-3 py-1 rounded">{avatarUploading ? 'Saving...' : 'Save Avatar'}</button>
                                                    <button disabled={avatarUploading || !pendingAvatarFile} onClick={() => {
                                                        if (pendingAvatarPreview) URL.revokeObjectURL(pendingAvatarPreview);
                                                        setPendingAvatarFile(null);
                                                        setPendingAvatarPreview("");
                                                    }} className="text-sm text-gray-600">Cancel</button>
                                                    <button disabled={avatarUploading} onClick={async () => {
                                                        // Remove avatar with server-side delete and confirmation
                                                        const ok = window.confirm('Remove avatar from your profile? This will also attempt to delete the uploaded file.');
                                                        if (!ok) return;
                                                        try {
                                                            await API.post('/settings/avatar/delete');
                                                            setAvatarUrl("");
                                                            showToast('success', 'Avatar removed');
                                                        } catch (err) {
                                                            showToast('error', err.response?.data?.message || err.message || 'Failed to remove avatar');
                                                        }
                                                    }} className="text-sm text-amber-500">Remove</button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>

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

                    {/* Badge Settings Section */}
                    <div className="bg-white rounded-xl shadow-md p-6 mb-6 border-l-4 border-amber-500">
                        <h2 className="text-xl font-bold mb-4 text-[#1a3a1f] flex items-center gap-2">
                            <span>🏅</span> Badge Settings
                        </h2>

                        {badgeLoading && !badgeSettings ? (
                            <div className="text-sm text-gray-500">Loading badges...</div>
                        ) : (
                            <>
                                <div className="mb-4 rounded-2xl bg-gradient-to-r from-[#0f2e1c] to-[#1d4b2e] text-white p-4 flex items-center gap-4">
                                    <div className="rounded-2xl bg-white/10 p-3 border border-white/10">
                                        <BadgeIllustration tone="gold" active size={72} />
                                    </div>
                                    <div>
                                        <p className="text-xs uppercase tracking-[0.28em] text-green-100/70">Active badge</p>
                                        <p className="text-lg font-semibold">{badgeSettings?.activeBadge || "None selected"}</p>
                                        <p className="text-sm text-green-100/70">Choose one unlocked badge to highlight on your profile.</p>
                                    </div>
                                </div>

                                <form onSubmit={handleBadgeSave} className="space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {(badgeSettings?.badgeCatalog || []).map((badge, index) => {
                                            const unlocked = (badgeSettings?.unlockedBadges || []).includes(badge.name);
                                            const tone = index % 3 === 0 ? "emerald" : index % 3 === 1 ? "gold" : "rose";
                                            const isSelected = selectedBadge === badge.name;

                                            return (
                                                <button
                                                    key={badge.id}
                                                    type="button"
                                                    onClick={() => unlocked && setSelectedBadge(badge.name)}
                                                    className={`text-left rounded-2xl border p-4 transition-all ${
                                                        isSelected
                                                            ? "border-emerald-500 bg-emerald-50 shadow-lg"
                                                            : unlocked
                                                                ? "border-gray-200 bg-gray-50 hover:border-emerald-300 hover:shadow"
                                                                : "border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed"
                                                    }`}
                                                >
                                                    <div className="flex items-start gap-3">
                                                        <div className="shrink-0 rounded-2xl bg-white p-2 shadow-sm border border-gray-100">
                                                            <BadgeIllustration tone={tone} active={isSelected} size={60} />
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <div className="flex items-center gap-2">
                                                                <h3 className="font-semibold text-gray-900 truncate">{badge.title}</h3>
                                                                {isSelected && <span className="text-[11px] px-2 py-1 rounded-full bg-emerald-500 text-white">Selected</span>}
                                                                {!unlocked && <span className="text-[11px] px-2 py-1 rounded-full bg-gray-200 text-gray-600">Locked</span>}
                                                            </div>
                                                            <p className="text-sm text-gray-600 mt-1">{badge.rewardText}</p>
                                                            <p className="text-xs text-gray-500 mt-2">{badge.xp} XP required</p>
                                                        </div>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {badgeError && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">{badgeError}</div>}
                                    {badgeMessage && <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg p-3">{badgeMessage}</div>}

                                    <button
                                        type="submit"
                                        disabled={badgeLoading || !selectedBadge}
                                        className="w-full px-4 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-semibold transition disabled:opacity-50"
                                    >
                                        {badgeLoading ? "Saving badge..." : "Save Active Badge"}
                                    </button>
                                </form>
                            </>
                        )}
                    </div>

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
