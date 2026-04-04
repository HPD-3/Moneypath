import React, { useState } from "react";
import Sidebar from "../components/Sidebar";
import "../styles/Profile.css";

function Profil() {
    const [showEdit, setShowEdit] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showAll, setShowAll] = useState(false);

    const activities = [
        "RP. 500.000 - Pemasukan",
        "RP. 50.000 - Makan",
        "Buat Target : Laptop Baru!",
        "RP. 200.000 - Belanja",
        "RP. 100.000 - Transport",
        "RP. 300.000 - Freelance"
    ];

    return (
        <div className="container">

            {/* SIDEBAR */}
            <Sidebar />

            {/* MAIN */}
            <div className="main">

                {/* TOPBAR */}
                <div className="topbar">
                    <div className="user-box">UserName 👤</div>
                </div>

                {/* PROFILE HEADER */}
                <div className="profile-card">
                    <div className="profile-left">
                        <div className="avatar"></div>

                        <div>
                            <h2>Full Name User</h2>
                            <p>Usermail@gmail.com</p>
                            <span className="level">Level 2 - Saving & Budgeting</span>
                        </div>
                    </div>

                    <div className="profile-buttons">
                        <button onClick={() => setShowEdit(true)}>
                            Edit Profil
                        </button>

                        <button onClick={() => setShowPassword(true)}>
                            Ubah Password
                        </button>
                    </div>
                </div>

                {/* CONTENT */}
                <div className="content">

                    {/* INFORMASI */}
                    <div className="card info">
                        <h3>Informasi Pribadi</h3>
                        <p>👤 Full Name User</p>
                        <p>📅 24-11-2009</p>
                        <p>📞 089687432567</p>
                        <p>⚥ Perempuan</p>
                        <p>📍 Alamat</p>
                    </div>

                    {/* STATISTIK */}
                    <div className="card stats">
                        <h3>Statistik Keuangan</h3>

                        <div className="stat-box">Total Tabungan: RP. 5.000.000</div>
                        <div className="stat-box">Total Pengeluaran: RP. 2.500.000</div>
                        <div className="stat-box">Total Pemasukan: RP. 6.000.000</div>
                        <div className="stat-box">Target: Liburan ke Bali</div>

                        <div className="progress">
                            <div className="bar"></div>
                        </div>
                    </div>

                    {/* AKTIVITAS */}
                    <div className="card activity">
                        <h3>Aktivitas Terakhir</h3>

                        {(showAll ? activities : activities.slice(0, 4)).map((item, i) => (
                            <p key={i}>{item}</p>
                        ))}

                        <span
                            className="see-all"
                            onClick={() => setShowAll(!showAll)}
                        >
                            {showAll ? "Tutup" : "Lihat Semua >"}
                        </span>
                    </div>

                </div>
            </div>

            {/* MODAL EDIT PROFIL */}
            {showEdit && (
                <div className="modal">
                    <div className="modal-box">
                        <h3>Edit Profil</h3>
                        <input type="text" placeholder="Nama Baru" />
                        <input type="email" placeholder="Email Baru" />
                        <button onClick={() => setShowEdit(false)}>
                            Simpan
                        </button>
                    </div>
                </div>
            )}

            {/* MODAL PASSWORD */}
            {showPassword && (
                <div className="modal">
                    <div className="modal-box">
                        <h3>Ubah Password</h3>
                        <input type="password" placeholder="Password Lama" />
                        <input type="password" placeholder="Password Baru" />
                        <button onClick={() => setShowPassword(false)}>
                            Simpan
                        </button>
                    </div>
                </div>
            )}

        </div>
    );
}

export default Profil;