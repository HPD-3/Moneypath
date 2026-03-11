import { useState } from "react";
import { auth } from "../firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { useNavigate } from "react-router-dom";

function Register() {

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const navigate = useNavigate();

    const register = async () => {
        await createUserWithEmailAndPassword(auth, email, password);
        navigate("/");
    };

    return (
        <div>

            <h2>Register</h2>

            <input
                placeholder="email"
                onChange={(e) => setEmail(e.target.value)}
            />

            <input
                type="password"
                onChange={(e) => setPassword(e.target.value)}
            />

            <button onClick={register}>Register</button>

        </div>
    );
}

export default Register;