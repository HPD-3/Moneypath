import { useState } from "react";
import { auth, googleProvider, db } from "../firebase";
import {
    signInWithEmailAndPassword,
    signInWithPopup
} from "firebase/auth";

import { doc, setDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

function Login() {

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const navigate = useNavigate();

    const login = async () => {

        if (!email || !password) {
            alert("Email and password required");
            return;
        }

        try {

            const result = await signInWithEmailAndPassword(
                auth,
                email,
                password
            );

            const user = result.user;

            await setDoc(doc(db, "users", user.uid), {
                email: user.email,
                createdAt: new Date()
            }, { merge: true });

            navigate("/dashboard");

        } catch (error) {
            console.log(error.message);
            alert(error.message);
        }
    };

    const googleLogin = async () => {

        const result = await signInWithPopup(auth, googleProvider);

        const user = result.user;

        await setDoc(doc(db, "users", user.uid), {
            name: user.displayName,
            email: user.email,
            createdAt: new Date()
        }, { merge: true });
        console.log("LOGIN SUCCESS");
        navigate("/dashboard");
    };

    return (

        <div>

            <h2>Login</h2>

            <input
                placeholder="Email"
                onChange={(e) => setEmail(e.target.value)}
            />

            <input
                type="password"
                placeholder="Password"
                onChange={(e) => setPassword(e.target.value)}
            />

            <br /><br />

            <button onClick={login}>
                Login
            </button>

            <button onClick={googleLogin}>
                Login with Google
            </button>

        </div>

    );
}

export default Login;