import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api.js";

export default function Dashboard() {
    const [profile, setProfile] = useState(null);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

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

        const checkPersonalDocument = async () => {
            try {
                await API.get("/personal/profile");
            } catch (err) {
                if (err.response?.status === 404) {
                    navigate("/personal");
                }
            }
        };

        checkPersonalDocument();
    }, [profile]);

    if (error) return <p>Error: {error}</p>;
    if (!profile) return <p>Loading...</p>;

    return (
        <div>
            <p>UID: {profile.uid}</p>
            <p>Email: {profile.email}</p>
        </div>
    );
}