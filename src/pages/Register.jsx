import { useState } from "react";
import { auth, googleProvider, db } from "../firebase";
import { createUserWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { useNavigate, Link } from "react-router-dom";

import loginImg from "../assets/image.jpg";
import logo3 from "../assets/logo3.png";
import SEO from "../components/SEO";
import seoConfig from "../seo.config";

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
            await setDoc(doc(db, "users", result.user.uid), {
                name: result.user.displayName,
                email: result.user.email,
                createdAt: new Date(),
            }, { merge: true });
        } catch (error) {
            alert(error.message);
        }
    };

    return (
        <>
        <SEO {...seoConfig["/register"]} />
        <div className="flex flex-col md:flex-row h-screen">
            {/* LEFT */}
            <div className="flex-1 bg-[#f3f3f3] flex flex-col items-center justify-center relative px-4 md:px-6 py-6 md:py-0 overflow-y-auto md:overflow-y-hidden">

                {/* LOGO */}
                <img
                    src={logo3}
                    alt="MoneyPath Logo"
                    className="absolute top-4 left-4 md:top-[30px] md:left-[40px] h-[35px] md:h-[45px] lg:h-[55px] w-auto object-contain"
                />

                <div className="w-full max-w-xs md:max-w-sm lg:max-w-sm">
                    <h1 className="text-xl md:text-2xl lg:text-[26px] font-semibold text-center">Create Account</h1>
                    <p className="text-[11px] md:text-[12px] text-center text-[#666] mb-5 md:mb-[25px]">
                        Join us to start your journey
                    </p>

                    {/* TABS (Styled like Login) */}
                    <div className="flex border-2 border-[#1a1a1a] mb-4 md:mb-5">
                        <Link to="/login" className="flex-1 py-2 md:py-3 text-[12px] md:text-[13px] text-center bg-[#1f1f1f] text-white no-underline hover:bg-[#333] font-medium transition">
                            Login
                        </Link>
                        <div className="flex-1 py-2 md:py-3 text-[12px] md:text-[13px] text-center bg-[#7ED957] text-black cursor-default font-medium">
                            Register
                        </div>
                    </div>

                    <form onSubmit={register} className="space-y-3 md:space-y-4">
                        {/* EMAIL INPUT */}
                        <div>
                            <label className="text-[10px] md:text-[11px] text-[#7ED957] font-medium">Email Address</label>
                            <div className="flex items-center border border-[#ddd] rounded-lg md:rounded-xl px-2 md:px-3 py-2 md:py-[10px] mt-1 md:mt-[5px] bg-white focus-within:border-[#7ED957] transition">
                                <span className="mr-2 text-[#7ED957] text-sm">✉</span>
                                <input
                                    type="email"
                                    placeholder="UserEmailRegister@Gmail.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="flex-1 border-none outline-none text-[12px] md:text-[13px]"
                                />
                                <span className="text-sm md:text-base text-[#7ED957]">✔</span>
                            </div>
                        </div>

                        {/* PASSWORD INPUT */}
                        <div>
                            <label className="text-[10px] md:text-[11px] text-[#7ED957] font-medium">Password</label>
                            <div className="flex items-center border border-[#ddd] rounded-lg md:rounded-xl px-2 md:px-3 py-2 md:py-[10px] mt-1 md:mt-[5px] bg-white focus-within:border-[#7ED957] transition">
                                <span className="mr-2 text-[#7ED957] text-sm">🔒</span>
                                <input
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="flex-1 border-none outline-none text-[12px] md:text-[13px]"
                                />
                            </div>
                        </div>

                        {/* REGISTER BUTTON */}
                        <button
                            type="submit"
                            className="w-full py-2 md:py-3 bg-[#7ED957] border-none text-[12px] md:text-[13px] font-semibold cursor-pointer rounded-lg md:rounded-none hover:bg-[#6bc946] transition mt-4 md:mt-0"
                        >
                            Register
                        </button>
                    </form>

                    {/* DIVIDER */}
                    <div className="flex items-center my-4 md:my-5">
                        <span className="flex-1 h-[1.5px] bg-black" />
                        <p className="text-[10px] md:text-[11px] mx-2 md:mx-[10px]">Or Continue With</p>
                        <span className="flex-1 h-[1.5px] bg-black" />
                    </div>

                    {/* GOOGLE BUTTON (Exact Login Style) */}
                    <div className="flex justify-center mb-6 md:mb-8">
                        <button onClick={googleRegister} className="flex items-center gap-2 md:gap-3 border border-gray-300 px-4 md:px-6 py-2 rounded-full bg-white shadow-sm hover:shadow-md hover:border-gray-400 transition text-[12px] md:text-[13px]">
                            <img src="https://www.svgrepo.com/show/355037/google.svg" className="w-4 md:w-5" />
                            Sign in with google
                        </button>
                    </div>

                    {/* DESC */}
                    <p className="text-[10px] text-center text-[#222] leading-relaxed md:leading-[1.6] max-w-xs mx-auto">
                        Pantau, rencanakan, dan tumbuhkan keuanganmu bersama MoneyPath.
                        Kelola uang bulanan dengan lebih terarah, susun tujuan finansialmu,
                        dan tingkatkan literasi lewat learning path terstruktur serta video
                        edukasi dalam satu platform.
                    </p>
                </div>
            </div>

            {/* RIGHT */}
            <div className="flex-1 relative hidden lg:block">
                <img
                    src={loginImg}
                    alt="illustration"
                    className="w-full h-full object-cover opacity-55"
                />
                <button
                    onClick={() => navigate("/login")}
                    className="absolute top-6 md:top-[30px] right-6 md:right-[40px] bg-[#7ED957] border-none py-2 md:py-3 px-6 md:px-7 text-[12px] md:text-[13px] font-semibold cursor-pointer hover:bg-[#6bc946] transition rounded-lg md:rounded-none"
                >
                    Login
                </button>
            </div>
        </div>
        </>
    );
}