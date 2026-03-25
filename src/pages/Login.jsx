import { useState } from "react";
import { auth, googleProvider, db } from "../firebase";
import { signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import loginImg from "../assets/image.jpg";
import logo2 from "../assets/logo2.png";
export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [activeTab, setActiveTab] = useState("login");

    const navigate = useNavigate();

    const login = async (e) => {
        e.preventDefault();
        if (!email || !password) {
            alert("Email and password required");
            return;
        }
        try {
            const result = await signInWithEmailAndPassword(auth, email, password);
            const user = result.user;
            await setDoc(doc(db, "users", user.uid), {
                email: user.email,
                createdAt: new Date(),
            }, { merge: true });
            navigate("/dashboard");
        } catch (error) {
            console.log(error.message);
            alert(error.message);
        }
    };

    const googleLogin = async () => {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;
            await setDoc(doc(db, "users", user.uid), {
                name: user.displayName,
                email: user.email,
                createdAt: new Date(),
            }, { merge: true });
            console.log("LOGIN SUCCESS");
            navigate("/dashboard");
        } catch (error) {
            console.log(error.message);
            alert(error.message);
        }
    };

    return (
        <div className="flex h-screen">

            {/* LEFT */}
            <div className="flex-1 bg-[#f3f3f3] flex items-center justify-center relative">

                {/* LOGO */}
                <h2
                    className="absolute top-[30px] left-[40px] text-[18px] tracking-[3px]"
                    style={{ fontFamily: "'Major Mono Display', monospace" }}
                >
                    <img src={logo2} alt="MoneyPath Logo" className="h-[32px] md:h-[40px]" />
                </h2>

                {/* FORM WRAPPER */}
                <div className="w-[320px]">
                    <h1 className="text-[26px] font-semibold text-center">Welcome Back</h1>
                    <p className="text-[12px] text-center text-[#666] mb-[25px]">
                        Welcome Back... Please enter your detail
                    </p>

                    {/* TABS */}
                    <div className="flex border-2 border-[#1a1a1a] mb-5">
                        <button
                            type="button"
                            onClick={() => setActiveTab("login")}
                            className={`flex-1 py-3 text-[13px] border-none cursor-pointer transition-colors ${activeTab === "login"
                                ? "bg-[#7ED957] text-black"
                                : "bg-[#1f1f1f] text-white"
                                }`}
                        >
                            Login
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab("register")}
                            className={`flex-1 py-3 text-[13px] border-none cursor-pointer transition-colors ${activeTab === "register"
                                ? "bg-[#7ED957] text-black"
                                : "bg-[#1f1f1f] text-white"
                                }`}
                        >
                            Register
                        </button>
                    </div>

                    <form onSubmit={login}>
                        {/* EMAIL INPUT */}
                        <div>
                            <label className="text-[10px] text-[#7ED957]">Email Address</label>
                            <div className="flex items-center border border-[#ddd] rounded-xl px-3 py-[10px] mt-[5px] mb-[15px] bg-white">
                                <span className="mr-2 text-[#7ED957]">✉</span>
                                <input
                                    type="email"
                                    placeholder="UserEmailLogin@Gmail.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="flex-1 border-none outline-none text-[13px]"
                                />
                                <span className="text-base text-[#7ED957]">✔</span>
                            </div>
                        </div>

                        {/* PASSWORD INPUT */}
                        <div>
                            <label className="text-[10px] text-[#7ED957]">Password</label>
                            <div className="flex items-center border border-[#ddd] rounded-xl px-3 py-[10px] mt-[5px] mb-[15px] bg-white">
                                <span className="mr-2 text-[#7ED957]">🔒</span>
                                <input
                                    type="password"
                                    placeholder="••••••••"
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="flex-1 border-none outline-none text-[13px]"
                                />
                            </div>
                        </div>

                        {/* LOGIN BUTTON */}
                        <button
                            type="submit"
                            className="w-full py-3 bg-[#7ED957] border-none text-[13px] font-semibold cursor-pointer"
                        >
                            Login
                        </button>
                    </form>

                    {/* DIVIDER */}
                    <div className="flex items-center my-5">
                        <span className="flex-1 h-[1.5px] bg-black" />
                        <p className="text-[10px] mx-[10px]">Or Continue With</p>
                        <span className="flex-1 h-[1.5px] bg-black" />
                    </div>

                    {/* GOOGLE */}
                    <button
                        type="button"
                        onClick={googleLogin}
                        className="w-full text-center text-[22px] mb-[35px] cursor-pointer bg-transparent border-none"
                        style={{ fontFamily: "Arial, sans-serif" }}
                    >
                        <span className="text-[#4285F4]">G</span>
                        <span className="text-[#EA4335]">o</span>
                        <span className="text-[#FBBC05]">o</span>
                        <span className="text-[#4285F4]">g</span>
                        <span className="text-[#34A853]">l</span>
                        <span className="text-[#EA4335]">e</span>
                    </button>

                    {/* DESC */}
                    <p className="text-[10px] text-center text-[#222] leading-[1.6] mt-[50px] max-w-[240px] mx-auto">
                        Pantau, rencanakan, dan tumbuhkan keuanganmu bersama MoneyPath.
                        Kelola uang bulanan dengan lebih terarah, susun tujuan finansialmu,
                        dan tingkatkan literasi lewat learning path terstruktur serta video
                        edukasi dalam satu platform.
                    </p>
                </div>
            </div>

            {/* RIGHT */}
            <div className="flex-1 relative hidden md:block">
                <img
                    src={loginImg}
                    alt="illustration"
                    className="w-full h-full object-cover opacity-55"
                />
                <button className="absolute top-[30px] right-[40px] bg-[#7ED957] border-none py-3 px-7 text-[13px] font-semibold cursor-pointer">
                    Register
                </button>
            </div>

        </div>
    );
}