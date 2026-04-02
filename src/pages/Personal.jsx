import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import formdata from "../assets/formdata.png";
import logo2 from "../assets/logo2.png";

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
    const navigate = useNavigate();

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

    const handleGenderChange = (value) => {
        setForm({ ...form, gender: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await API.post("/personal/profile", form);
            setSaved(true);
            setTimeout(() => {
                navigate("/dashboard");
            }, 1500);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (fetching) return (
        <div className="min-h-screen bg-gray-200 flex items-center justify-center">
            <p className="text-gray-600 text-lg">Loading...</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-200 font-sans">

            {/* NAVBAR */}
            <div className="flex items-center justify-between px-8 py-4 bg-gradient-to-r from-[#0c2b18] to-[#123d23]">
                <img
                    src={logo2}
                    alt="MONEYPATH"
                    className="h-10"
                />
                <button
                    onClick={() => navigate(-1)}
                    className="bg-[#9FF782] text-black px-4 py-1 rounded font-bold hover:scale-105 transition">
                    ← Back
                </button>
            </div>

            {/* HEADER */}
            <div className="flex flex-col items-center justify-center mt-10 px-4">
                <h2 className="text-2xl font-semibold text-center">Isi Data Pribadi</h2>
                <p className="text-gray-700 mt-2 text-center max-w-md">
                    Lengkapi data pribadi mu untuk menggunakan fitur tabungan Moneypath
                </p>
            </div>

            {/* FORM CARD */}
            <div className="flex justify-center mt-10 px-4 pb-12">
                <div className="w-full max-w-[900px] bg-gradient-to-br from-[#0c2b18] to-[#123d23] rounded-3xl shadow-lg p-6 md:p-10 flex flex-col md:flex-row gap-6 text-white">

                    {/* LEFT IMAGE */}
                    <div className="hidden md:flex items-center justify-center flex-shrink-0">
                        <img src={formdata} className="w-56 opacity-90" alt="form illustration" />
                    </div>

                    {/* FORM */}
                    <div className="flex-1">
                        <form onSubmit={handleSubmit}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                                {/* Nama */}
                                <div>
                                    <label className="block mb-1">Nama</label>
                                    <input
                                        type="text"
                                        name="name"
                                        placeholder="Nama Lengkap mu"
                                        value={form.name}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-4 py-2 rounded bg-gray-200 text-black outline-none"
                                    />
                                </div>

                                {/* Tanggal Lahir */}
                                <div>
                                    <label className="block mb-1">Tanggal Lahir</label>
                                    <input
                                        type="date"
                                        name="dateOfBirth"
                                        value={form.dateOfBirth}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-4 py-2 rounded bg-gray-200 text-black outline-none"
                                    />
                                </div>

                                {/* No HP */}
                                <div>
                                    <label className="block mb-1">No Handphone</label>
                                    <input
                                        type="text"
                                        name="phoneNumber"
                                        placeholder="No Handphone mu"
                                        value={form.phoneNumber}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-4 py-2 rounded bg-gray-200 text-black outline-none"
                                    />
                                </div>

                                {/* Gender */}
                                <div>
                                    <label className="block mb-1">Jenis Kelamin</label>
                                    <div className="flex gap-6 mt-2">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="gender"
                                                value="female"
                                                checked={form.gender === "female"}
                                                onChange={() => handleGenderChange("female")}
                                                className="accent-green-400"
                                                required
                                            />
                                            Perempuan
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="gender"
                                                value="male"
                                                checked={form.gender === "male"}
                                                onChange={() => handleGenderChange("male")}
                                                className="accent-green-400"
                                            />
                                            Laki - Laki
                                        </label>
                                    </div>
                                </div>

                                {/* Alamat */}
                                <div className="col-span-1 md:col-span-2">
                                    <label className="block mb-1">Alamat</label>
                                    <input
                                        type="text"
                                        name="address"
                                        placeholder="Alamat Lengkap"
                                        value={form.address}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-4 py-2 rounded bg-gray-200 text-black outline-none"
                                    />
                                </div>

                            </div>

                            {/* Success Message */}
                            {saved && (
                                <p className="mt-4 text-[#9FF782] font-semibold text-center">
                                    ✓ Data berhasil disimpan! Mengalihkan...
                                </p>
                            )}

                            {/* BUTTONS */}
                            <div className="flex justify-end gap-4 mt-8 border-t border-white/20 pt-6">
                                <button
                                    type="button"
                                    onClick={() => navigate(-1)}
                                    className="bg-gray-200 text-black px-6 py-2 rounded hover:scale-105 transition">
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="bg-[#9FF782] text-black px-6 py-2 rounded font-semibold hover:scale-105 transition disabled:opacity-60 disabled:cursor-not-allowed">
                                    {loading ? "Menyimpan..." : "Simpan"}
                                </button>
                            </div>

                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}