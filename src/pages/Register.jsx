import { useState } from "react";
import { auth, googleProvider, db } from "../firebase";
import { createUserWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { useNavigate, Link } from "react-router-dom";

import loginImg from "../assets/image.jpg";
import logo3 from "../assets/logo3.png";

export default function Register() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();

    const register = async (e) => {
        e.preventDefault();
        try {
            const result = await createUserWithEmailAndPassword(auth, email, password);
            const user = result.user;
            await setDoc(doc(db, "users", user.uid), {
                email: user.email,
                createdAt: new Date(),
            }, { merge: true });
            navigate("/dashboard");
        } catch (error) {
            alert(error.message);
        }
    };

    const googleRegister = async () => {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;
            await setDoc(doc(db, "users", user.uid), {
                name: user.displayName,
                email: user.email,
                createdAt: new Date(),
            }, { merge: true });
            navigate("/dashboard");
        } catch (error) {
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
                    <img
                        src={logo3}
                        alt="MoneyPath Logo"
                        className="h-[45px] md:h-[55px] w-auto object-contain"
                    />
                </h2>

                <div className="w-[320px]">
                    <h1 className="text-[26px] font-semibold text-center">Create Account</h1>
                    <p className="text-[12px] text-center text-[#666] mb-[25px]">
                        Join us to start your journey
                    </p>

                    {/* TABS (Styled like Login) */}
                    <div className="flex border-2 border-[#1a1a1a] mb-5">
                        <Link to="/login" className="flex-1 py-3 text-[13px] text-center bg-[#1f1f1f] text-white no-underline hover:bg-[#333]">
                            Login
                        </Link>
                        <div className="flex-1 py-3 text-[13px] text-center bg-[#7ED957] text-black cursor-default">
                            Register
                        </div>
                    </div>

                    <form onSubmit={register}>
                        {/* EMAIL INPUT */}
                        <div>
                            <label className="text-[10px] text-[#7ED957]">Email Address</label>
                            <div className="flex items-center border border-[#ddd] rounded-xl px-3 py-[10px] mt-[5px] mb-[15px] bg-white">
                                <span className="mr-2 text-[#7ED957]">✉</span>
                                <input
                                    type="email"
                                    placeholder="UserEmailRegister@Gmail.com"
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
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="flex-1 border-none outline-none text-[13px]"
                                />
                            </div>
                        </div>

                        {/* REGISTER BUTTON */}
                        <button
                            type="submit"
                            className="w-full py-3 bg-[#7ED957] border-none text-[13px] font-semibold cursor-pointer"
                        >
                            Register
                        </button>
                    </form>

                    {/* DIVIDER */}
                    <div className="flex items-center my-5">
                        <span className="flex-1 h-[1.5px] bg-black" />
                        <p className="text-[10px] mx-[10px]">Or Continue With</p>
                        <span className="flex-1 h-[1.5px] bg-black" />
                    </div>

                    {/* GOOGLE BUTTON (Exact Login Style) */}
                    <button
                        type="button"
                        onClick={googleRegister}
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
                <button
                    onClick={() => navigate("/login")}
                    className="absolute top-[30px] right-[40px] bg-[#7ED957] border-none py-3 px-7 text-[13px] font-semibold cursor-pointer"
                >
                    Login
                </button>
            </div>
        </div>
    );
}