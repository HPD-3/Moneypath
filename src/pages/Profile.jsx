import { useEffect, useState } from "react";
import { getAuth } from "firebase/auth";

export default function Profile() {
    const [profile, setProfile] = useState(null);

    useEffect(() => {
        const fetchProfile = async () => {
            const auth = getAuth();
            const token = await auth.currentUser.getIdToken(); // get Firebase token

            const res = await fetch("http://localhost:3000/auth/profile", {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            const data = await res.json();
            setProfile(data);
        };

        fetchProfile();
    }, []);

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
        </div>
    );
}