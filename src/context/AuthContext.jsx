import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser]       = useState(undefined); // undefined = still loading
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // onAuthStateChanged persists across refreshes
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            setUser(firebaseUser);   // null = logged out, object = logged in
            setLoading(false);
        });

        return () => unsubscribe(); // cleanup on unmount
    }, []);

    return (
        <AuthContext.Provider value={{ user, loading }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}