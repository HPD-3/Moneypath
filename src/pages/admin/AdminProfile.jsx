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
        return <div className="p-6 text-center">Loading...</div>;
    }

    return (
        <div className="p-6 bg-white min-h-screen">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-black mb-2">Admin Profile</h1>
                <p className="text-gray-600">Kelola data profil admin dan lihat statistik</p>
            </div>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
                    {error}
                </div>
            )}

            {/* Profile Card */}
            <div className="bg-white border-2 border-[#d1d5db] rounded-xl shadow-lg p-8 mb-8">
                <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-6">
                        <div className="w-24 h-24 bg-[#9FF782] rounded-full flex items-center justify-center">
                            <iconify-icon icon="mdi:account-circle" className="text-4xl text-black"></iconify-icon>
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-black">{profile?.name || "Admin"}</h2>
                            <p className="text-gray-600 text-sm">{profile?.email}</p>
                            <span className="inline-block mt-2 bg-[#9FF782] text-black px-3 py-1 rounded-full text-xs font-semibold">
                                🔐 Administrator
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-semibold transition"
                    >
                        Logout
                    </button>
                </div>

                {/* Edit Name Section */}
                <div className="border-t pt-6">
                    <h3 className="font-semibold text-black mb-4">Informasi Pribadi</h3>
                    <div className="mb-4">
                        <label className="block text-sm text-gray-700 mb-2">Nama</label>
                        {editingName ? (
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-black focus:outline-none focus:border-[#9FF782]"
                                />
                                <button
                                    onClick={handleUpdateName}
                                    className="bg-[#9FF782] text-black px-4 py-2 rounded-lg font-semibold hover:bg-[#7fdb6f] transition"
                                >
                                    Simpan
                                </button>
                                <button
                                    onClick={() => setEditingName(false)}
                                    className="bg-gray-300 text-black px-4 py-2 rounded-lg font-semibold hover:bg-gray-400 transition"
                                >
                                    Batal
                                </button>
                            </div>
                        ) : (
                            <div className="flex justify-between items-center">
                                <p className="text-black text-lg">{profile?.name}</p>
                                <button
                                    onClick={() => setEditingName(true)}
                                    className="text-[#1a3a1f] hover:text-[#9FF782] font-semibold transition"
                                >
                                    Edit
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm text-gray-700 mb-2">Email</label>
                        <p className="text-black text-lg">{profile?.email}</p>
                    </div>

                    <div>
                        <label className="block text-sm text-gray-700 mb-2">Role</label>
                        <p className="text-black text-lg font-semibold">Administrator</p>
                    </div>
                </div>
            </div>

            {/* Statistics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {/* Total Users */}
                <div className="bg-white border-2 border-[#bfdbfe] rounded-xl p-6 shadow">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-[#bfdbfe] rounded-full flex items-center justify-center">
                            <iconify-icon icon="mdi:account-multiple" className="text-xl text-[#0c4a6e]"></iconify-icon>
                        </div>
                        <h3 className="text-sm text-gray-600">Total Pengguna</h3>
                    </div>
                    <p className="text-3xl font-bold text-black">{stats?.totalUsers || 0}</p>
                    <p className="text-xs text-gray-500 mt-2">Pengguna terdaftar</p>
                </div>

                {/* Active Users */}
                <div className="bg-white border-2 border-[#dcfce7] rounded-xl p-6 shadow">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-[#dcfce7] rounded-full flex items-center justify-center">
                            <iconify-icon icon="mdi:check-circle" className="text-xl text-[#166534]"></iconify-icon>
                        </div>
                        <h3 className="text-sm text-gray-600">Pengguna Aktif</h3>
                    </div>
                    <p className="text-3xl font-bold text-black">{stats?.activeUsers || 0}</p>
                    <p className="text-xs text-gray-500 mt-2">Aktif bulan ini</p>
                </div>

                {/* Learning Paths */}
                <div className="bg-white border-2 border-[#fef3c7] rounded-xl p-6 shadow">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-[#fef3c7] rounded-full flex items-center justify-center">
                            <iconify-icon icon="mdi:school" className="text-xl text-[#b45309]"></iconify-icon>
                        </div>
                        <h3 className="text-sm text-gray-600">Learning Path</h3>
                    </div>
                    <p className="text-3xl font-bold text-black">{stats?.totalPaths || 0}</p>
                    <p className="text-xs text-gray-500 mt-2">Path yang tersedia</p>
                </div>

                {/* Total Modules */}
                <div className="bg-white border-2 border-[#f3e8ff] rounded-xl p-6 shadow">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-[#f3e8ff] rounded-full flex items-center justify-center">
                            <iconify-icon icon="mdi:book-multiple" className="text-xl text-[#6b21a8]"></iconify-icon>
                        </div>
                        <h3 className="text-sm text-gray-600">Total Module</h3>
                    </div>
                    <p className="text-3xl font-bold text-black">{stats?.totalModules || 0}</p>
                    <p className="text-xs text-gray-500 mt-2">Module tersedia</p>
                </div>
            </div>

            {/* Additional Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Account Created */}
                <div className="bg-white border-2 border-[#d1d5db] rounded-xl p-6 shadow">
                    <h3 className="font-semibold text-black mb-4">📅 Tanggal Pendaftaran</h3>
                    <p className="text-black text-lg">
                        {profile?.createdAt
                            ? new Date(profile.createdAt).toLocaleDateString("id-ID", {
                                  weekday: "long",
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                              })
                            : "—"}
                    </p>
                </div>

                {/* Last Activity */}
                <div className="bg-white border-2 border-[#d1d5db] rounded-xl p-6 shadow">
                    <h3 className="font-semibold text-black mb-4">⏱️ Aktivitas Terakhir</h3>
                    <p className="text-black text-lg">
                        {stats?.lastActivity
                            ? new Date(stats.lastActivity).toLocaleDateString("id-ID", {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                              })
                            : "—"}
                    </p>
                </div>
            </div>

            {/* Admin Actions */}
            <div className="mt-8 border-t pt-6">
                <h3 className="text-lg font-bold text-black mb-4">Aksi Admin</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                        onClick={() => navigate("/admin")}
                        className="flex items-center gap-3 bg-[#1a3a1f] hover:bg-[#2d5a33] text-white px-6 py-3 rounded-lg font-semibold transition"
                    >
                        <iconify-icon icon="mdi:dashboard" className="text-xl"></iconify-icon>
                        Kembali ke Dashboard
                    </button>
                    <button
                        onClick={() => navigate("/admin/learning-path")}
                        className="flex items-center gap-3 bg-[#0c4a6e] hover:bg-[#164e63] text-white px-6 py-3 rounded-lg font-semibold transition"
                    >
                        <iconify-icon icon="mdi:pencil" className="text-xl"></iconify-icon>
                        Kelola Learning Path
                    </button>
                </div>
            </div>
        </div>
    );
}