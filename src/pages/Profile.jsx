import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api.js";

export default function Profile() {
    const [profile, setProfile] = useState(null);
    const [personal, setPersonal] = useState(null);

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


    return (
        <div>

            {profile ? (
                <>
                    <p>UID: {profile.uid}</p>
                    <p>Email: {profile.email}</p>
                </>
            ) : (
                <p>Loading...</p>
            )}
            {personal && (
                <div>
                    <p>Nama: {personal.name}</p>
                    <p>Tanggal Lahir: {personal.dateOfBirth}</p>
                    <p>No HP: {personal.phoneNumber}</p>
                    <p>Gender: {personal.gender}</p>
                    <p>Alamat: {personal.address}</p>
                </div>
            )}
        </div>
    );
}