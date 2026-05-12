import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import SEO from "../components/SEO";
import seoConfig from "../seo.config";
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
                if (err?.response?.status !== 404) {
                    console.error(err);
                }
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
        <>
            <SEO {...seoConfig["/personal"]} />
            <style>{`
                .personal-hero-image {
                    display: none;
                }
                @media (min-width: 1024px) {
                    .personal-hero-image {
                        display: flex !important;
                    }
                }
            `}</style>
            <div className="min-h-screen bg-[#eef2ee]">

                <div className="w-full min-h-screen bg-white grid grid-cols-1 lg:grid-cols-[360px_1fr]">

                    {/* LEFT SIDE */}
                    <div className="relative bg-gradient-to-br from-[#041b0f] via-[#0c2b18] to-[#123d23] text-white p-8 lg:p-10 flex flex-col overflow-hidden lg:min-h-screen lg:sticky lg:top-0">

                        {/* Glow */}
                        <div className="absolute -top-20 -left-20 w-72 h-72 bg-green-500/20 blur-3xl rounded-full"></div>
                        <div className="absolute bottom-0 right-0 w-72 h-72 bg-green-400/10 blur-3xl rounded-full"></div>

                        <div className="relative z-10">
                            <img
                                src={logo2}
                                alt="logo"
                                className="h-8 lg:h-10 mb-6 lg:mb-14"
                            />

                            <h1 className="text-2xl lg:text-4xl font-bold leading-tight">
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

                        <div className="personal-hero-image relative z-10 justify-center py-8">
                            <img
                                src={formdata}
                                alt="form"
                                className="w-64 drop-shadow-2xl"
                            />
                        </div>


                    </div>

                    {/* RIGHT SIDE */}
                    <div className="p-6 sm:p-8 md:p-12 lg:p-16 bg-white min-h-screen">

                        <div className="mb-8">
                            <h2 className="text-3xl font-bold text-gray-900">Form Data</h2>
                            <div className="w-12 h-1 bg-green-500 rounded-full mt-3"></div>
                            <p className="text-gray-400 mt-4 text-sm">
                                Lengkapi informasi berikut untuk memulai perjalanan finansialmu bersama MoneyPath.
                            </p>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">

                                {/* Nama */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Nama Lengkap</label>
                                    <input
                                        type="text"
                                        name="name"
                                        placeholder="Masukkan nama lengkap"
                                        value={form.name}
                                        onChange={handleChange}
                                        required
                                        className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white outline-none focus:border-green-400 focus:ring-1 focus:ring-green-400 transition text-sm"
                                    />
                                </div>

                                {/* Tanggal Lahir */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Tanggal Lahir</label>
                                    <input
                                        type="date"
                                        name="dateOfBirth"
                                        value={form.dateOfBirth}
                                        onChange={handleChange}
                                        required
                                        className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white outline-none focus:border-green-400 focus:ring-1 focus:ring-green-400 transition text-sm"
                                    />
                                </div>

                                {/* No HP */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">No. Telepon</label>
                                    <input
                                        type="text"
                                        name="phoneNumber"
                                        placeholder="08xxxxxxxxxx"
                                        value={form.phoneNumber}
                                        onChange={handleChange}
                                        required
                                        className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white outline-none focus:border-green-400 focus:ring-1 focus:ring-green-400 transition text-sm"
                                    />
                                </div>

                                {/* Gender */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Jenis Kelamin</label>
                                    <div className="h-12 px-4 rounded-xl border border-gray-200 bg-white flex items-center gap-6">
                                        <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-600">
                                            <input type="radio" name="gender" value="female" checked={form.gender === "female"} onChange={() => handleGenderChange("female")} className="accent-green-500 w-4 h-4" required />
                                            Perempuan
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-600">
                                            <input type="radio" name="gender" value="male" checked={form.gender === "male"} onChange={() => handleGenderChange("male")} className="accent-green-500 w-4 h-4" />
                                            Laki-laki
                                        </label>
                                    </div>
                                </div>

                                {/* Alamat — full width */}
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Alamat</label>
                                    <textarea
                                        name="address"
                                        placeholder="Masukkan alamat lengkap"
                                        value={form.address}
                                        onChange={handleChange}
                                        required
                                        rows={4}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white outline-none resize-none focus:border-green-400 focus:ring-1 focus:ring-green-400 transition text-sm"
                                    />
                                </div>
                            </div>

                            {/* Success */}
                            {saved && (
                                <div className="mt-5 bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 text-sm">
                                    ✓ Data berhasil disimpan! Mengalihkan...
                                </div>
                            )}

                            {/* Info box */}
                            <div className="mt-6 bg-gray-50 border border-gray-100 rounded-xl p-4 flex gap-3 items-start">
                                <div className="w-6 h-6 rounded-md bg-blue-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5">i</div>
                                <div>
                                    <p className="text-sm font-semibold text-gray-800">Pastikan data yang kamu isi sudah benar.</p>
                                    <p className="text-xs text-gray-400 mt-0.5">Kamu dapat mengubahnya kapan saja di pengaturan akun.</p>
                                </div>
                            </div>

                            {/* Buttons */}
                            <div className="flex gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => navigate(-1)}
                                    className="px-6 h-12 rounded-xl border border-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 h-12 rounded-xl bg-green-500 hover:bg-green-600 text-white font-semibold text-sm transition disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    {loading ? "Menyimpan..." : "Simpan Data"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Footer */}
                <div className="bg-[#0c2b18] px-6 py-4 flex items-center justify-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#7CFF6B]/20 flex items-center justify-center text-[#7CFF6B] flex-shrink-0">
                        🛡️
                    </div>
                    <p className="text-sm text-gray-300">
                        <span className="font-semibold text-white">Data kamu aman bersama kami.</span>{" "}
                        Kami menggunakan enkripsi tingkat tinggi untuk melindungi data pribadimu.
                    </p>
                </div>
            </div>
        </>
    );
}