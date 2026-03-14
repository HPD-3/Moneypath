import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";  // ← add this
import API from "../services/api";

export default function Personal() {
    const [form, setForm] = useState({
        name: "",
        dateOfBirth: "",
        phoneNumber: "",
        address: "",
        gender: ""
    });
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [saved, setSaved] = useState(false);
    const navigate = useNavigate();  // ← add this

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await API.get("/personal/profile");
                if (res.data) setForm(res.data);
            } catch (err) {
                console.log("No existing data");
            } finally {
                setFetching(false);
            }
        };
        fetchProfile();
    }, []);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await API.post("/personal/profile", form);
            setSaved(true);
            setTimeout(() => {
                navigate("/dashboard");  // ← redirect after save
            }, 1500);                   // ← small delay so user sees "Saved!"
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (fetching) return <p>Loading...</p>;

    return (
        <form onSubmit={handleSubmit}>
            <input
                name="name"
                placeholder="Full Name"
                value={form.name}
                onChange={handleChange}
                required
            />
            <input
                name="dateOfBirth"
                type="date"
                value={form.dateOfBirth}
                onChange={handleChange}
                required
            />
            <input
                name="phoneNumber"
                placeholder="Phone Number"
                value={form.phoneNumber}
                onChange={handleChange}
                required
            />
            <input
                name="address"
                placeholder="Address"
                value={form.address}
                onChange={handleChange}
                required
            />
            <select name="gender" value={form.gender} onChange={handleChange} required>
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
            </select>

            <button type="submit" disabled={loading}>
                {loading ? "Saving..." : "Save"}
            </button>

            {saved && <p>Saved successfully!</p>}
        </form>
    );
}
