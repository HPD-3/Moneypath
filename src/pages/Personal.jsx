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
        setForm({
            ...form,
            [e.target.name]: e.target.value
        });
    };

    const handleGenderChange = (value) => {
        setForm({
            ...form,
            gender: value
        });
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

    if (fetching) {
        return (
            <div className="min-h-screen bg-[#f5f7f5] flex items-center justify-center">
                <p className="text-gray-500 text-lg">Loading...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#eef2ee] flex items-center justify-center p-4 md:p-8">

            <div className="w-full max-w-7xl bg-white rounded-[28px] overflow-hidden shadow-2xl grid grid-cols-1 lg:grid-cols-[420px_1fr]">

                {/* LEFT SIDE */}
                <div className="relative bg-gradient-to-br from-[#041b0f] via-[#0c2b18] to-[#123d23] text-white p-10 flex flex-col justify-between overflow-hidden">

                    {/* Glow */}
                    <div className="absolute -top-20 -left-20 w-72 h-72 bg-green-500/20 blur-3xl rounded-full"></div>
                    <div className="absolute bottom-0 right-0 w-72 h-72 bg-green-400/10 blur-3xl rounded-full"></div>

                    <div className="relative z-10">
                        <img
                            src={logo2}
                            alt="logo"
                            className="h-10 mb-14"
                        />

                        <h1 className="text-4xl font-bold leading-tight">
                            Lengkapi Data,
                            <br />
                            Bangun Masa Depan
                            <br />
                            <span className="text-[#7CFF6B]">
                                Finansial
                            </span>{" "}
                            yang Lebih Baik
                        </h1>

                        <p className="text-gray-300 mt-6 leading-relaxed">
                            Isi informasi dirimu dengan benar agar kami
                            dapat memberikan pengalaman terbaik untukmu.
                        </p>
                    </div>

                    <div className="relative z-10 flex justify-center py-8">
                        <img
                            src={formdata}
                            alt="form"
                            className="w-64 drop-shadow-2xl"
                        />
                    </div>

                    <div className="relative z-10 bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-5">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-xl bg-[#7CFF6B]/20 flex items-center justify-center text-[#7CFF6B] text-2xl">
                                🛡️
                            </div>

                            <div>
                                <h3 className="font-semibold text-lg">
                                    Data kamu aman bersama kami
                                </h3>

                                <p className="text-sm text-gray-300 mt-1 leading-relaxed">
                                    Kami menggunakan enkripsi tingkat tinggi
                                    untuk melindungi data pribadimu.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT SIDE */}
                <div className="p-6 md:p-10 lg:p-14 bg-[#fcfcfc]">

                    <div className="mb-10">
                        <h2 className="text-4xl font-bold text-[#132418]">
                            Form Data
                        </h2>

                        <div className="w-20 h-1 bg-[#5DDB4D] rounded-full mt-4"></div>

                        <p className="text-gray-500 mt-5 leading-relaxed">
                            Lengkapi informasi berikut untuk memulai perjalanan
                            finansialmu bersama MoneyPath.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit}>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                            {/* Nama */}
                            <div>
                                <label className="block text-sm font-semibold text-[#1d2d22] mb-2">
                                    Nama Lengkap
                                </label>

                                <input
                                    type="text"
                                    name="name"
                                    placeholder="Masukkan nama lengkap"
                                    value={form.name}
                                    onChange={handleChange}
                                    required
                                    className="w-full h-14 px-5 rounded-2xl border border-gray-200 bg-white outline-none focus:ring-2 focus:ring-green-400 transition"
                                />
                            </div>

                            {/* Tanggal Lahir */}
                            <div>
                                <label className="block text-sm font-semibold text-[#1d2d22] mb-2">
                                    Tanggal Lahir
                                </label>

                                <input
                                    type="date"
                                    name="dateOfBirth"
                                    value={form.dateOfBirth}
                                    onChange={handleChange}
                                    required
                                    className="w-full h-14 px-5 rounded-2xl border border-gray-200 bg-white outline-none focus:ring-2 focus:ring-green-400 transition"
                                />
                            </div>

                            {/* No HP */}
                            <div>
                                <label className="block text-sm font-semibold text-[#1d2d22] mb-2">
                                    No. Telepon
                                </label>

                                <input
                                    type="text"
                                    name="phoneNumber"
                                    placeholder="08xxxxxxxxxx"
                                    value={form.phoneNumber}
                                    onChange={handleChange}
                                    required
                                    className="w-full h-14 px-5 rounded-2xl border border-gray-200 bg-white outline-none focus:ring-2 focus:ring-green-400 transition"
                                />
                            </div>

                            {/* Gender */}
                            <div>
                                <label className="block text-sm font-semibold text-[#1d2d22] mb-2">
                                    Jenis Kelamin
                                </label>

                                <div className="h-14 px-5 rounded-2xl border border-gray-200 bg-white flex items-center gap-8">
                                    <label className="flex items-center gap-2 cursor-pointer text-sm">
                                        <input
                                            type="radio"
                                            name="gender"
                                            value="female"
                                            checked={form.gender === "female"}
                                            onChange={() => handleGenderChange("female")}
                                            className="accent-green-500"
                                            required
                                        />
                                        Perempuan
                                    </label>

                                    <label className="flex items-center gap-2 cursor-pointer text-sm">
                                        <input
                                            type="radio"
                                            name="gender"
                                            value="male"
                                            checked={form.gender === "male"}
                                            onChange={() => handleGenderChange("male")}
                                            className="accent-green-500"
                                        />
                                        Laki-laki
                                    </label>
                                </div>
                            </div>

                            {/* Address */}
                            <div className="md:col-span-2">
                                <label className="block text-sm font-semibold text-[#1d2d22] mb-2">
                                    Alamat
                                </label>

                                <textarea
                                    name="address"
                                    placeholder="Masukkan alamat lengkap"
                                    value={form.address}
                                    onChange={handleChange}
                                    required
                                    rows={4}
                                    className="w-full px-5 py-4 rounded-2xl border border-gray-200 bg-white outline-none resize-none focus:ring-2 focus:ring-green-400 transition"
                                />
                            </div>
                        </div>

                        {/* Success */}
                        {saved && (
                            <div className="mt-6 bg-green-100 border border-green-200 text-green-700 rounded-2xl px-5 py-4">
                                ✓ Data berhasil disimpan! Mengalihkan...
                            </div>
                        )}

                        {/* Info */}
                        <div className="mt-8 bg-[#f3f8f2] border border-[#e4eee2] rounded-2xl p-5 flex gap-4">
                            <div className="text-green-600 text-xl">
                                ℹ️
                            </div>

                            <div>
                                <h4 className="font-semibold text-[#1c2c21]">
                                    Pastikan data yang kamu isi sudah benar.
                                </h4>

                                <p className="text-sm text-gray-500 mt-1">
                                    Kamu dapat mengubahnya kapan saja di pengaturan akun.
                                </p>
                            </div>
                        </div>

                        {/* Buttons */}
                        <div className="flex flex-col md:flex-row gap-4 mt-8">

                            <button
                                type="button"
                                onClick={() => navigate(-1)}
                                className="w-full md:w-auto px-8 h-14 rounded-2xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-100 transition"
                            >
                                Batal
                            </button>

                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 h-14 rounded-2xl bg-gradient-to-r from-[#1e9f22] to-[#35c72d] text-white font-semibold text-lg hover:scale-[1.01] transition disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {loading ? "Menyimpan..." : "Simpan Data"}
                            </button>
                        </div>

                    </form>
                </div>
            </div>
        </div>
    );
}