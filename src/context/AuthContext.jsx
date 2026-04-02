import { createContext, useContext, useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser]       = useState(undefined); // undefined = still loading
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const auth = getAuth();

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