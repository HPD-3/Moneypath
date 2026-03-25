import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api.js";

export default function Dashboard() {
    const [profile, setProfile] = useState(null);
    const [personal, setPersonal] = useState(null);
    const [error, setError] = useState(null);
    const [loadingPersonal, setLoadingPersonal] = useState(true);

    const navigate = useNavigate();

    // 🔹 Fetch Auth Profile
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await API.get("/auth/profile");
                setProfile(res.data);
            } catch (err) {
                setError(err.message);
            }
        };

        fetchProfile();
    }, []);


    useEffect(() => {
        if (!profile) return;

        const fetchPersonal = async () => {
            try {
                const res = await API.get("/personal/profile");
                setPersonal(res.data);
            } catch (err) {
                if (err.response?.status === 404) {
                    navigate("/personal");
                } else {
                    console.error(err);
                }
            } finally {
                setLoadingPersonal(false);
            }
        };

        fetchPersonal();
    }, [profile, navigate]);


    if (error) return <p>Error: {error}</p>;
    if (!profile || loadingPersonal) return (
        <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-gray-500">Memuat data...</p>
            </div>
        </div>
    );

    return (
        <div>

            {personal && (
                <div>
                    <p>Nama: {personal.name}</p>
                    <p>Tanggal Lahir: {personal.dateOfBirth}</p>
                    <p>No HP: {personal.phoneNumber}</p>
                    <p>Gender: {personal.gender}</p>
                    <p>Alamat: {personal.address}</p>
                </div>
            )}

            {/* NAVIGATION */}
            <button onClick={() => navigate("/balance")}>
                💰 My Balance
            </button>

            <button onClick={() => navigate("/video")}>
                Video Edukasi
            </button>

            <button onClick={() => navigate("/learning")}>
                Learning Path
            </button>

            <button onClick={() => navigate("/profile")}>
                Profile
            </button>
            {/* ADMIN ONLY */}
            {profile.role === "admin" && (
                <button onClick={() => navigate("/admin")}>
                    🛠️ Admin Dashboard
                </button>
            )}
        </div>
    );
}