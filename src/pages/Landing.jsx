import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

// ── Image Imports ─────────────────────────────────────────────
import logo2 from "../assets/logo2.png";
import phonemockup from "../assets/phone-mockup (2).png";
import budget from "../assets/budget.png";
import lingkaran from "../assets/lingkaran.png";

// ── Global Styles ─────────────────────────────────────────────
function GlobalStyles() {
    return (
        <style>{`
            @import url('https://fonts.googleapis.com/css2?family=Libre+Caslon+Text:wght@400;700&display=swap');
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap');
            @import url('https://fonts.googleapis.com/css2?family=Lilita+One&display=swap');

            body { font-family: 'Inter', sans-serif; }
            h1, h2, h3 { font-family: 'Libre Caslon Text', serif; }

            html { scroll-behavior: smooth; }

            .fade-up {
                opacity: 0;
                transform: translateY(40px);
                transition: all 0.7s ease;
            }
            .fade-up.show {
                opacity: 1;
                transform: translateY(0);
            }

            .nav-link {
                position: relative;
                padding-bottom: 6px;
                transition: color 0.3s;
            }

            .nav-link::after {
                content: "";
                position: absolute;
                left: 0;
                bottom: 0;
                width: 0%;
                height: 3px;
                background-color: #B7FF9F;
                transition: 0.3s ease;
                border-radius: 2px;
            }

            .nav-link:hover::after {
                width: 100%;
            }

            .nav-link.active::after {
                width: 100%;
            }

            .nav-link.active {
                color: #B7FF9F;
            }

            .navbar-bg {
                backdrop-filter: blur(10px);
                background: rgba(23, 38, 25, 0.7);
                border-bottom: 1px solid rgba(183, 255, 159, 0.1);
            }

            .feature-card {
                background: white;
                padding: 40px 24px;
                border-radius: 10px;
                cursor: pointer;
                transition: all 0.25s ease;
                border: 1px solid #e5e7eb;
                text-align: center;
            }

            .feature-card:hover {
                background: #f9fafb;
            }

            .icon-box {
                width: 64px;
                height: 64px;
                border-radius: 999px;
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 0 auto;
                box-shadow: 0 8px 20px rgba(0,0,0,0.05);
            }

            .feature-card h4 {
                margin-top: 16px;
                font-weight: 600;
                font-size: 16px;
            }

            .feature-card p {
                margin-top: 8px;
                font-size: 13px;
                color: #6b7280;
            }

            .feature-card.active {
                background: linear-gradient(135deg, #1E5B3A, #0B2E1E);
                color: white;
                transform: scale(1.02);
                box-shadow: 0 20px 40px rgba(0,0,0,0.15);
            }

            .feature-card.active .icon-box {
                background: rgba(255,255,255,0.15);
            }

            .feature-card.active i {
                color: white !important;
            }

            .feature-card.active p {
                color: rgba(255,255,255,0.85);
            }
        `}</style>
    );
}

// ── Navbar ────────────────────────────────────────────────────
function Navbar({ onLogin, onRegister }) {
    const [activeNav, setActiveNav] = useState(null);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const handleNavClick = (target) => {
        setActiveNav(target);
        setMobileMenuOpen(false);
    };

    const handleLoginClick = () => {
        onLogin();
        setMobileMenuOpen(false);
    };

    const handleRegisterClick = () => {
        onRegister();
        setMobileMenuOpen(false);
    };

    return (
        <nav className="fixed w-full z-50 px-10 md:px-20 py-5 text-white navbar-bg">
            <div className="flex justify-between items-center">
                <a href="#" className="flex items-center">
                    <img src={logo2} className="h-8 md:h-10 object-contain" alt="MoneyPath" />
                </a>

                <ul className="hidden md:flex gap-10 text-sm">
                    <li>
                        <a
                            href="#features"
                            className={`nav-link ${activeNav === "features" ? "active" : ""}`}
                            onClick={() => handleNavClick("features")}>
                            Features
                        </a>
                    </li>
                    <li>
                        <a
                            href="#testimonial"
                            className={`nav-link ${activeNav === "testimonial" ? "active" : ""}`}
                            onClick={() => handleNavClick("testimonial")}>
                            Testimonial
                        </a>
                    </li>
                    <li>
                        <a
                            href="#information"
                            className={`nav-link ${activeNav === "information" ? "active" : ""}`}
                            onClick={() => handleNavClick("information")}>
                            Information
                        </a>
                    </li>
                </ul>

                <div className="hidden md:flex gap-3">
                    <button
                        onClick={onLogin}
                        className="bg-[#9FF782] text-black px-5 py-2  font-medium">
                        login
                    </button>
                    <button
                        onClick={onRegister}
                        className="border border-white px-4 py-2 ">
                        Register
                    </button>
                </div>

                {/* Mobile Menu Button */}
                <button
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="md:hidden flex flex-col gap-1.5 w-8 h-8 items-center justify-center">
                    <span
                        className={`w-6 h-0.5 bg-white transition-all duration-300 ${mobileMenuOpen ? "rotate-45 translate-y-2" : ""
                            }`}></span>
                    <span
                        className={`w-6 h-0.5 bg-white transition-all duration-300 ${mobileMenuOpen ? "opacity-0" : ""
                            }`}></span>
                    <span
                        className={`w-6 h-0.5 bg-white transition-all duration-300 ${mobileMenuOpen ? "-rotate-45 -translate-y-2" : ""
                            }`}></span>
                </button>
            </div>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
                <div className="md:hidden absolute top-full left-0 w-full bg-gradient-to-b from-[#172619] to-[#0f2a18] py-6 px-6 animate-in fade-in slide-in-from-top-2 duration-300">
                    <ul className="flex flex-col gap-4">
                        <li>
                            <a
                                href="#features"
                                className={`block py-2 px-3 rounded-md transition-colors ${activeNav === "features"
                                    ? "bg-[#9FF782] text-black font-medium"
                                    : "text-white hover:bg-white/10"
                                    }`}
                                onClick={() => handleNavClick("features")}>
                                Features
                            </a>
                        </li>
                        <li>
                            <a
                                href="#testimonial"
                                className={`block py-2 px-3 rounded-md transition-colors ${activeNav === "testimonial"
                                    ? "bg-[#9FF782] text-black font-medium"
                                    : "text-white hover:bg-white/10"
                                    }`}
                                onClick={() => handleNavClick("testimonial")}>
                                Testimonial
                            </a>
                        </li>
                        <li>
                            <a
                                href="#information"
                                className={`block py-2 px-3 rounded-md transition-colors ${activeNav === "information"
                                    ? "bg-[#9FF782] text-black font-medium"
                                    : "text-white hover:bg-white/10"
                                    }`}
                                onClick={() => handleNavClick("information")}>
                                Information
                            </a>
                        </li>
                    </ul>

                    <div className="flex flex-col gap-3 mt-6 pt-6 border-t border-white/20">
                        <button
                            onClick={handleLoginClick}
                            className="bg-[#9FF782] text-black px-4 py-2 rounded-md font-medium w-full">
                            Login
                        </button>
                        <button
                            onClick={handleRegisterClick}
                            className="border border-white px-4 py-2 rounded-md text-white w-full">
                            Register
                        </button>
                    </div>
                </div>
            )}
        </nav>
    );
}

// ── Hero ──────────────────────────────────────────────────────
function Hero() {
    return (
        <section className="bg-gradient-to-b from-[#172619] via-[#36593B] to-[#558C5C] text-white pt-36 pb-16 md:pb-10 px-6 md:px-20 flex flex-col md:flex-row items-center justify-between overflow-visible">
            <div className="max-w-2xl fade-up">
                <h1 className="text-5xl md:text-6xl font-semibold leading-tight">
                    Your Smart <span className="text-[#9FF782]">Financial</span>
                    <br />
                    Journey Starts Here
                </h1>

                <p className="mt-6 text-gray-200 text-lg leading-relaxed">
                    MoneyPath membantu kamu mengelola keuangan bulanan,
                    merencanakan tujuan finansial, dan meningkatkan literasi lewat
                    materi serta video edukasi dalam satu platform.
                </p>
            </div>

            <div className="relative fade-up mt-10 md:mt-0">
                <div className="absolute w-[400px] h-[400px] bg-green-400 opacity-20 blur-3xl rounded-full top-10 left-10"></div>
                <img
                    src={phonemockup}
                    className="w-[360px] md:w-[500px] relative z-10 translate-y-10 md:translate-y-18"
                    alt="Phone mockup"
                />
            </div>
        </section>
    );
}

// ── Feature Card ──────────────────────────────────────────────
function FeatureCard({ icon: Icon, title, description, isActive = false, onClick }) {
    return (
        <div
            className={`feature-card fade-up border cursor-pointer ${isActive ? "active" : ""}`}
            onClick={onClick}>
            <div className={`icon-box ${isActive ? "" : Icon.bgColor}`}>
                {Icon.element}
            </div>
            <h4>{title}</h4>
            <p>{description}</p>
        </div>
    );
}

// ── Features Section ──────────────────────────────────────────
function Features() {
    const [activeCard, setActiveCard] = useState(2);

    const featureCards = [
        {
            title: "Saldo",
            description:
                "Halaman ini menampilkan total saldo, ringkasan pemasukan dan pengeluaran bulanan, daftar sumber dana (bank, e-wallet, cash), serta fitur untuk melihat riwayat, mengatur anggaran, dan menambah transaksi.",
            icon: {
                bgColor: "bg-green-100",
                element: (
                    <svg
                        className="w-7 h-7 text-green-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                    </svg>
                ),
            },
        },
        {
            title: "Video Edukasi",
            description: "Halaman ini adalah fitur video edukasi yang membantu pembelajaran dalam bentuk video.",
            icon: {
                bgColor: "bg-red-100",
                element: (
                    <div className="w-14 h-14 bg-red-500 rounded-full flex items-center justify-center shadow-md">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="w-6 h-6 text-white"
                            fill="currentColor"
                            viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                        </svg>
                    </div>
                ),
            },
        },
        {
            title: "Learning Path",
            description:
                "Halaman ini menampilkan daftar modul belajar keuangan berdasarkan kategori dan tingkat kesulitan, lengkap dengan jumlah materi dan durasi, serta fitur untuk memilih dan memulai pembelajaran.",
            icon: {
                bgColor: "bg-white/20",
                element: (
                    <svg
                        className="w-7 h-7 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                        />
                    </svg>
                ),
            },
        },
        {
            title: "Quiz",
            description:
                "Halaman ini adalah halaman kuis yang menampilkan progres belajar (level, EXP, streak) serta notifikasi bahwa kuis hari ini sudah selesai, dengan opsi lanjut belajar atau kembali ke dashboard.",
            icon: {
                bgColor: "bg-yellow-100",
                element: (
                    <svg
                        className="w-7 h-7 text-yellow-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5h.01v.01H12v-.01z"
                        />
                    </svg>
                ),
            },
        },
        {
            title: "Rekap",
            description:
                "Halaman ini menampilkan rekap bulanan keuangan, termasuk selisih, total pemasukan dan pengeluaran, saldo, serta opsi kirim laporan ke email.",
            icon: {
                bgColor: "bg-blue-100",
                element: (
                    <svg
                        className="w-7 h-7 text-blue-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                        />
                    </svg>
                ),
            },
        },
        {
            title: "Tabungan",
            description:
                "Halaman ini menampilkan informasi saldo, jumlah dan status target tabungan, serta progres tabungan. Pengguna juga bisa melihat saldo dari beberapa sumber dan menambah atau mengelola target tabungan.",
            icon: {
                bgColor: "bg-green-100",
                element: (
                    <svg
                        className="w-7 h-7 text-green-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                        />
                    </svg>
                ),
            },
        },
    ];

    return (
        <section id="features" className="scroll-mt-24 py-20 px-6 md:px-16 text-center">
            <h2 className="text-gray-600 text-sm font-medium fade-up">Features</h2>

            <h3 className="text-3xl mt-2 fade-up">
                MoneyPath App — Your Smart Financial Companion
            </h3>

            <p className="mt-4 text-gray-500 text-sm md:text-base font-medium max-w-xl mx-auto leading-relaxed fade-up">
                MoneyPath is a modern finance app to manage your money.
                <br />
                It helps track expenses and plan budgets easily.
                <br />
                Take control of your financial future with simplicity.
            </p>

            <div className="grid md:grid-cols-3 gap-0 mt-16 max-w-5xl mx-auto border rounded-xl overflow-hidden">
                {featureCards.map((card, index) => (
                    <FeatureCard
                        key={index}
                        icon={card.icon}
                        title={card.title}
                        description={card.description}
                        isActive={index === activeCard}
                        onClick={() => setActiveCard(index)}
                    />
                ))}
            </div>
        </section>
    );
}

// ── Testimonial Card ──────────────────────────────────────────
function TestimonialCard({ quote, name, role }) {
    return (
        <div className="bg-white text-black p-6 rounded-xl shadow-lg w-[420px]">
            <p className="text-sm text-gray-700 leading-relaxed">{quote}</p>

            <div className="flex items-center gap-3 mt-6">
                <div className="w-12 h-12 rounded-full border-2 border-black flex items-center justify-center">
                    <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                    </svg>
                </div>

                <div>
                    <p className="font-semibold text-sm">{name}</p>
                    <p className="text-xs text-gray-500">{role}</p>
                </div>
            </div>
        </div>
    );
}

// ── Testimonial Section ───────────────────────────────────────
function Testimonial() {
    return (
        <section id="testimonial" className="relative bg-[#0B2E1E] text-white py-28 overflow-hidden">
            <img
                src={lingkaran}
                className="absolute w-[800px] md:w-[1000px] opacity-60 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                alt=""
            />

            <div className="text-center">
                <h2 className="text-sm text-green-300">Testimonial</h2>

                <h3 className="text-4xl mt-3 leading-tight">
                    Don't take our word for it.
                    <br />
                    Over 100+ people trust us
                </h3>
            </div>

            <div className="mt-20 relative">
                <div className="flex gap-8 w-[1400px] mx-auto overflow-x-auto pb-4">
                    <TestimonialCard
                        quote="Lebih terarah, bikin keuangan rapi sampai tujuan."
                        name="Nadia"
                        role="Student"
                    />
                    <TestimonialCard
                        quote="Aplikasinya sangat membantu buat ngatur keuangan harian. Jadi lebih sadar pengeluaran dan bisa mulai nabung dengan teratur."
                        name="Hannah"
                        role="Product engineer"
                    />
                    <TestimonialCard
                        quote="Web ini keren banget! Tampilannya simpel tapi fiturnya lengkap, mulai dari catat keuangan, tabungan, sampai learning path."
                        name="Ammar"
                        role="Programmer"
                    />
                    <TestimonialCard
                        quote="Rekap bulanan membantu memahami keuangan lebih baik."
                        name="Lilya"
                        role="Programmer"
                    />
                </div>
            </div>
        </section>
    );
}

function ImportantStuff() {
    const [expandedItem, setExpandedItem] = useState(2);

    const items = [
        {
            title: "Take control of your financial journey",
            description: "Start managing your money effectively and build better financial habits.",
        },
        {
            title: "Smarter financial decisions start here",
            description: "Make informed decisions with our tools and educational resources.",
        },
        {
            title: "Understand your money. Grow your future",
            description:
                "Track, manage, and improve your financial habits for a better tomorrow. By understanding where your money goes, making smarter decisions, and building a strong foundation for long-term financial growth and stability.",
        },
    ];

    return (
        <section id="information" className="py-28 px-6 md:px-20 grid md:grid-cols-2 gap-20 items-center bg-[#F5F5F5]">
            <div>
                <h2 className="text-5xl md:text-6xl text-[#2F4F3E] leading-tight" style={{ fontFamily: "'Lilita One', cursive" }}>
                    Some more
                    <br />
                    Important Stuff
                </h2>

                <div className="mt-14 space-y-6">
                    {items.map((item, index) => (
                        <div key={index}>
                            <div
                                className={`flex items-center gap-4 cursor-pointer transition-opacity ${expandedItem === index ? "" : "opacity-40 hover:opacity-60"
                                    }`}
                                onClick={() => setExpandedItem(expandedItem === index ? -1 : index)}>
                                <div
                                    className={`w-10 h-10 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${expandedItem === index
                                        ? "border-[#2F4F3E] bg-white"
                                        : "border-gray-400 bg-white"
                                        }`}>
                                    <svg
                                        className={`w-5 h-5 ${expandedItem === index ? "text-[#2F4F3E]" : "text-gray-400"}`}
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24">
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d={expandedItem === index ? "M20 12H4" : "M12 4v16m8-8H4"}
                                        />
                                    </svg>
                                </div>
                                <p
                                    className={`text-lg transition-colors ${expandedItem === index ? "text-[#2F4F3E] font-bold" : "text-[#2F4F3E]"
                                        }`}
                                    style={{ fontFamily: "'Lilita One', cursive" }}>
                                    {item.title}
                                </p>
                            </div>

                            {expandedItem === index && (
                                <div className="ml-14 mt-3 animate-in fade-in">
                                    <p className="text-sm text-gray-500 leading-relaxed">{item.description}</p>
                                </div>
                            )}

                            {index < items.length - 1 && <div className="border-b border-gray-300 ml-14 mt-6"></div>}
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex justify-center">
                <img src={budget} className="w-[380px] md:w-[480px] rounded-sm" alt="Budget" />
            </div>
        </section>
    );
}

function CTA({ onGetStarted }) {
    return (
        <section className="bg-gradient-to-b from-[#0B2E1E] to-[#123524] text-center py-24 px-6">
            <h2 className="text-[#9FF782] text-4xl md:text-5xl font-serif leading-tight">
                It's easy to get started !
            </h2>

            <p className="text-white mt-6 max-w-2xl mx-auto text-sm md:text-base leading-relaxed font-semibold">
                "Start your financial journey with MoneyPath! Manage your money easily,
                achieve your saving goals, and improve your financial knowledge all in one
                place. Join and log in now for a smarter and more organized financial future!"
            </p>

            <div className="mt-10 flex justify-center gap-4">
                <button
                    onClick={onGetStarted}
                    className="bg-[#9FF782] text-black px-8 py-3 font-semibold rounded-sm">
                    Get started
                </button>

                <button className="border border-gray-400 text-gray-200 px-8 py-3 rounded-sm">
                    Learn more
                </button>
            </div>
        </section>
    );
}
function Footer() {
    return (
        <footer className="text-center text-gray-500 py-6 text-sm bg-white px-4">
            © 2026 MoneyPath. All rights reserved.
        </footer>
    );
}

export default function LandingPage() {
    const navigate = useNavigate();

    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add("show");
                }
            });
        });

        document.querySelectorAll(".fade-up").forEach((el) => observer.observe(el));

        return () => observer.disconnect();
    }, []);

    return (
        <>
            <GlobalStyles />
            <div className="bg-[#F7F7F7] text-gray-800">
                <Navbar
                    onLogin={() => navigate("/login")}
                    onRegister={() => navigate("/register")}
                />
                <Hero />
                <Features />
                <Testimonial />
                <ImportantStuff />
                <CTA onGetStarted={() => navigate("/register")} />
                <Footer />
            </div>
        </>
    );
}