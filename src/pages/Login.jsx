import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, googleProvider } from "../firebase";
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signInWithPopup
} from "firebase/auth";

function App() {

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const navigate = useNavigate();

    const register = async () => {
        await createUserWithEmailAndPassword(auth, email, password);
        alert("Registered");
    };

    const login = async () => {
        const user = await signInWithEmailAndPassword(auth, email, password);
        console.log(user);

        // redirect after login
        navigate("/dashboard");
    };

    const googleLogin = async () => {
        const result = await signInWithPopup(auth, googleProvider);
        console.log(result.user);

        // redirect after login
        navigate("/dashboard");
    };

    return (
        <div>

            <h2>Firebase Auth</h2>

            <input
                placeholder="email"
                onChange={(e) => setEmail(e.target.value)}
            />

            <input
                type="password"
                placeholder="password"
                onChange={(e) => setPassword(e.target.value)}
            />

            <br /><br />

            <button onClick={register}>Register</button>
            <button onClick={login}>Login</button>
            <button onClick={googleLogin}>Login with Google</button>

        </div>
    );
}

export default App;