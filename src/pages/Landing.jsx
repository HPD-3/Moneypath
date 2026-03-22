import { useNavigate } from "react-router-dom";

// ── Image Imports ─────────────────────────────────────────────
import logo2 from "../assets/logo2.png";
import logo from "../assets/logo.png";
import background from "../assets/backround.png";
import mask from "../assets/mask.png";

// ── Global Styles ─────────────────────────────────────────────
function GlobalStyles() {
    return (
        <style>{`
            @import url('https://fonts.googleapis.com/css2?family=Major+Mono+Display&family=Kumar+One&display=swap');
            @import url('https://fonts.googleapis.com/css2?family=Libre+Bodoni:wght@400&display=swap');
            @import url('https://fonts.googleapis.com/css2?family=Libre+Caslon+Text:wght@400;700&display=swap');
            @import url('https://fonts.googleapis.com/css2?family=Lilita+One&display=swap');
            @import url('https://fonts.googleapis.com/css2?family=Lisu+Bosa:wght@400;700&display=swap');
            @import url('https://fonts.googleapis.com/css2?family=Jersey+10&family=Major+Mono+Display&display=swap');

            .logo        { font-family: 'Jersey 10', cursive; }
            .hero-title  { font-family: 'Kumar One', serif; }
            .libre       { font-family: 'Libre Bodoni', serif; }
            .section-divider { position: relative; padding-top: 120px; }
        `}</style>
    );
}

// ── Navbar ────────────────────────────────────────────────────
function Navbar({ onLogin, onRegister }) {
    return (
        <nav className="bg-gradient-to-r from-[#172619] to-[#0f2a18] px-6 md:px-12 py-4 flex justify-between items-center">
            <img src={logo2} alt="MoneyPath Logo" className="h-[32px] md:h-[40px]" />
            <div className="flex items-center gap-2 md:gap-4">
                <button
                    onClick={onLogin}
                    className="bg-[#9FF782] px-4 md:px-6 py-2 rounded text-sm md:text-base font-['Lilita_One']">
                    Login
                </button>
                <button
                    onClick={onRegister}
                    className="border border-[#9FF782] text-[#9FF782] px-4 md:px-6 py-2 rounded text-sm md:text-base font-['Lilita_One']">
                    Register
                </button>
            </div>
        </nav>
    );
}

// ── Hero ──────────────────────────────────────────────────────
function Hero() {
    return (
        <section className="relative h-[500px] md:h-[720px] w-full overflow-hidden">
            <img
                src={background}
                className="absolute inset-0 w-full h-[120%] object-cover"
                style={{ top: 0, left: 0 }}
                alt="background"
            />
            <div className="absolute inset-0 bg-white/40" />
            <div className="relative z-20 px-6 md:px-16 py-12 md:py-20 max-w-xl">
                <h1 className="hero-title text-3xl md:text-5xl text-green-900 leading-snug mb-4 md:mb-6">
                    Your Smart <br />
                    Financial Journey <br />
                    Starts Here
                </h1>
                <p className="libre text-[15px] md:text-[18px] text-[#6b7280] leading-relaxed">
                    Pantau, rencanakan, dan tumbuhkan keuanganmu bersama MoneyPath.
                    Kelola uang bulanan dengan lebih terarah, susun tujuan finansialmu,
                    dan tingkatkan literasi lewat learning path terstruktur serta
                    video edukasi dalam satu platform.
                </p>
            </div>
            <div className="absolute bottom-0 left-0 w-full h-[40px] md:h-[60px] bg-gradient-to-r from-[#172619] to-[#0f2a18] z-10" />
        </section>
    );
}

// ── Feature Card ──────────────────────────────────────────────
function FeatureCard({ dark = false }) {
    if (dark) {
        return (
            <div className="bg-gradient-to-br from-[#172619] to-[#0f2a18] text-white p-6 md:p-8 rounded-lg text-center shadow-lg">
                <div className="w-10 h-10 border-2 border-green-300 rounded-full mx-auto mb-4" />
                <h3 className="font-['Lilita_One']">Features</h3>
                <p className="text-sm mt-2 font-['Open_Sans']">
                    Lorem Ipsum is simply dummy text of the printing and typesetting industry.
                    Lorem Ipsum has been the industry's standard
                </p>
            </div>
        );
    }
    return (
        <div className="text-center p-4">
            <div className="w-10 h-10 border-2 border-green-400 rounded-full mx-auto mb-4" />
            <h3 className="font-['Lilita_One']">Features</h3>
            <p className="text-sm text-gray-500 mt-2 font-['Open_Sans']">
                Lorem Ipsum is simply dummy text of the printing and typesetting industry.
                Lorem Ipsum has been the industry's standard
            </p>
        </div>
    );
}

// ── Features Section ──────────────────────────────────────────
function Features() {
    return (
        <section className="relative bg-white py-12 md:py-20 -mt-[2px]">
            <svg
                className="absolute top-0 right-0 w-[200px] md:w-[420px] h-[100px] md:h-[180px]"
                viewBox="0 0 420 180"
                xmlns="http://www.w3.org/2000/svg">
                <path
                    fill="#0f2a18"
                    d="M0,0 L420,0 L420,90 C370,20 300,150 240,95 C180,50 120,130 60,85 C30,65 15,35 0,0 Z"
                />
            </svg>

            <div className="text-center relative z-10 px-4">
                <p className="text-green-700 font-semibold font-['Lilita_One']">Features</p>
                <h2 className="text-2xl md:text-3xl text-green-900 font-['Open_Sans'] mt-2">
                    Finance app Lorem ipsum Dolor amet
                </h2>
                <p className="text-gray-500 mt-3 font-['Open_Sans'] max-w-xl mx-auto text-sm md:text-base">
                    Lorem Ipsum is simply dummy text of the printing and typesetting industry.
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-10 max-w-5xl mx-auto mt-10 px-6 md:px-8">
                <FeatureCard />
                <FeatureCard />
                <FeatureCard dark />
                <FeatureCard />
                <FeatureCard />
                <FeatureCard />
            </div>
        </section>
    );
}

// ── Testimonial Card ──────────────────────────────────────────
function TestimonialCard({ name, role }) {
    return (
        <div className="bg-white text-black p-6 md:p-8 rounded shadow font-['Open_Sans'] w-full md:w-[420px]">
            <p className="text-base md:text-lg mb-6">
                Lorem Ipsum is simply dummy text of the printing and typesetting industry.
            </p>
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-300 rounded-full flex-shrink-0" />
                <div>
                    <p className="font-bold">{name}</p>
                    <p className="text-sm text-gray-500">{role}</p>
                </div>
            </div>
        </div>
    );
}

// ── Testimonial Section ───────────────────────────────────────
function Testimonial() {
    return (
        <section className="relative py-16 md:py-24 bg-[#0f1f14] text-white overflow-hidden">
            <img
                src={mask}
                className="absolute left-1/2 top-1/2 w-[300px] md:w-[500px] -translate-x-1/2 -translate-y-1/2 opacity-20 pointer-events-none"
                alt=""
            />
            <div className="text-center px-4">
                <h2 className="text-[20px] md:text-[25px] font-['Libre_Caslon_Text'] text-white mb-4">
                    Testimonial
                </h2>
                <p className="text-[22px] md:text-[35px] font-['Libre_Caslon_Text'] leading-tight text-[#9FF782]">
                    Don't take our word for it.
                    <br />
                    Over <span className="text-white">100+ people</span> trust us
                </p>
            </div>
            <div className="flex flex-col md:flex-row justify-center items-center gap-6 md:gap-10 mt-12 md:mt-16 px-6">
                <TestimonialCard name="Hannah" role="Product engineer" />
                <TestimonialCard name="Ammar" role="Programmer" />
            </div>
        </section>
    );
}

function ImportantStuff() {
    return (
        <section className="bg-gray-100 py-16 md:py-20 px-6 md:px-16">
            <div className="flex flex-col md:flex-row items-center justify-between gap-10">
                <div className="w-full md:w-auto">
                    <h2 className="text-4xl md:text-6xl lg:text-7xl font-['Open_Sans'] text-green-900 mb-8 md:mb-12 leading-tight">
                        Some more <br /> Important Stuff
                    </h2>

                    <div className="flex items-center gap-4 mb-6 opacity-40">
                        <div className="w-8 h-8 border rounded-full flex items-center justify-center text-xl font-['Lilita_One'] flex-shrink-0">+</div>
                        <p className="font-['Lilita_One'] font-semibold text-gray-500">Analytics that feels like and you</p>
                    </div>

                    <div className="flex items-center gap-4 mb-6 opacity-40">
                        <div className="w-8 h-8 border rounded-full flex items-center justify-center text-xl font-['Lilita_One'] flex-shrink-0">+</div>
                        <p className="font-['Lilita_One'] font-semibold text-gray-500">Analytics that feels like and you</p>
                    </div>

                    <div className="flex items-start gap-4">
                        <div className="w-8 h-8 border-2 border-green-900 rounded-full flex items-center justify-center text-xl flex-shrink-0">–</div>
                        <div>
                            <p className="font-['Lilita_One'] font-bold text-green-900">Analytics that feels like and you</p>
                            <p className="font-['Open_Sans'] text-sm text-gray-600 mt-2 max-w-sm">
                                Lorem Ipsum is simply dummy text of the printing and typesetting industry.
                            </p>
                        </div>
                    </div>
                </div>

                <img
                    src={logo}
                    className="hidden md:block w-[280px] lg:w-[500px] flex-shrink-0"
                    alt="MoneyPath"
                />
            </div>
        </section>
    );
}

function CTA({ onGetStarted }) {
    return (
        <section className="bg-gradient-to-r from-[#172619] to-[#0f2a18] py-16 md:py-20 text-center text-white px-4">
            <h2 className="text-3xl md:text-5xl lg:text-6xl font-extrabold text-[#9FF782] mb-4 font-['Lisu_Bosa']">
                Its easy to get started !
            </h2>
            <p className="text-gray-300 mb-8 font-['Open_Sans'] text-sm md:text-base">
                Lorem Ipsum is simply dummy text of the printing industry
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-3 md:gap-4">
                <button
                    onClick={onGetStarted}
                    className="bg-[#9FF782] text-black px-8 py-3 rounded font-['Lilita_One'] w-full sm:w-auto">
                    Get started
                </button>
                <button className="border border-gray-400 text-white px-8 py-3 rounded font-['Lilita_One'] w-full sm:w-auto">
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

    return (
        <>
            <GlobalStyles />
            <div className="bg-gray-100">
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