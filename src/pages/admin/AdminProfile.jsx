import { useEffect, useState } from "react";
import { getAuth, signOut, updateProfile } from "firebase/auth";
import { getFirestore, doc, getDoc, updateDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import API from "../../services/api.js";

export default function AdminProfile() {
    const navigate = useNavigate();
    const auth = getAuth();
    const db = getFirestore();
    const [profile, setProfile] = useState(null);
    const [personal, setPersonal] = useState(null);
    const [stats, setStats] = useState(null);
    const [editingName, setEditingName] = useState(false);
    const [newName, setNewName] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchAdminData = async () => {
            try {
                const [profileRes, personalRes] = await Promise.allSettled([
                    API.get("/auth/profile"),
                    API.get("/personal/profile"),
                ]);

                if (profileRes.status === "fulfilled") {
                    setProfile(profileRes.value.data);
                    setNewName(profileRes.value.data.name);
                }

                if (personalRes.status === "fulfilled") {
                    setPersonal(personalRes.value.data);
                }

                // Fetch admin statistics from Firestore
                const adminDocRef = doc(db, "admins", auth.currentUser?.uid);
                const adminDoc = await getDoc(adminDocRef);
                if (adminDoc.exists()) {
                    setStats(adminDoc.data());
                }
            } catch (err) {
                setError(err.message);
                console.error("Error fetching admin data:", err);
            } finally {
                setLoading(false);
            }
        };

        if (auth.currentUser) {
            fetchAdminData();
        }
    }, []);

    const handleUpdateName = async () => {
        try {
            await updateProfile(auth.currentUser, { displayName: newName });
            await updateDoc(doc(db, "users", auth.currentUser.uid), { name: newName });
            setProfile({ ...profile, name: newName });
            setEditingName(false);
        } catch (err) {
            setError(err.message);
        }
    };

    const handleLogout = async () => {
        try {
            await signOut(auth);
            navigate("/login");
        } catch (err) {
            setError(err.message);
        }
    };

    if (loading) {
        return <div className="p-3 sm:p-6 text-center text-sm">Loading...</div>;
    }

    return (
        <div className="p-3 sm:p-6 bg-white min-h-screen">
            {/* Header */}
            <div className="mb-6 sm:mb-8">
                <h1 className="text-2xl sm:text-3xl font-bold text-black mb-2">Admin Profile</h1>
                <p className="text-xs sm:text-sm text-gray-600">Kelola data profil admin dan lihat statistik</p>
            </div>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-3 sm:px-4 py-3 rounded mb-6 text-xs sm:text-sm">
                    {error}
                </div>
            )}

            {/* Profile Card */}
            <div className="bg-white border-2 border-[#d1d5db] rounded-xl shadow-lg p-4 sm:p-8 mb-8">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-6">
                    <div className="flex items-center gap-4 sm:gap-6 w-full sm:w-auto">
                        <div className="w-16 sm:w-24 h-16 sm:h-24 bg-[#9FF782] rounded-full flex items-center justify-center flex-shrink-0">
                            <iconify-icon icon="mdi:account-circle" className="text-3xl sm:text-5xl text-black"></iconify-icon>
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                {editingName ? (
                                    <div className="flex gap-2 w-full">
                                        <input
                                            type="text"
                                            value={newName}
                                            onChange={(e) => setNewName(e.target.value)}
                                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-xs sm:text-sm"
                                        />
                                        <button
                                            onClick={handleUpdateName}
                                            className="px-3 py-2 bg-[#9FF782] text-black rounded-lg font-semibold text-xs"
                                        >
                                            ✓
                                        </button>
                                        <button
                                            onClick={() => setEditingName(false)}
                                            className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg text-xs"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ) : (
                                    <div className="w-full">
                                        <h2 className="text-lg sm:text-2xl font-bold text-black">{profile?.name || "Admin"}</h2>
                                        <button
                                            onClick={() => setEditingName(true)}
                                            className="text-xs text-blue-600 hover:underline"
                                        >
                                            Edit Nama
                                        </button>
                                    </div>
                                )}
                            </div>
                            <p className="text-xs sm:text-sm text-gray-600">{profile?.email}</p>
                        </div>
                    </div>

                    <button
                        onClick={handleLogout}
                        className="w-full sm:w-auto px-4 sm:px-6 py-2 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 text-xs sm:text-sm"
                    >
                        Keluar
                    </button>
                </div>
            </div>

            {/* Stats */}
            {stats && (
                <div className="bg-white border border-gray-200 rounded-xl shadow p-4 sm:p-6">
                    <h3 className="text-lg sm:text-xl font-bold text-black mb-4">Statistik Admin</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="p-4 bg-blue-50 rounded-lg">
                            <p className="text-xs sm:text-sm text-gray-600 mb-1">Total Users</p>
                            <p className="text-2xl sm:text-3xl font-bold text-blue-600">{stats.totalUsers || 0}</p>
                        </div>
                        <div className="p-4 bg-green-50 rounded-lg">
                            <p className="text-xs sm:text-sm text-gray-600 mb-1">Content Created</p>
                            <p className="text-2xl sm:text-3xl font-bold text-green-600">{stats.contentCreated || 0}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}