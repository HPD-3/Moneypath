import { createContext, useContext, useEffect, useState } from "react";
import { getRedirectResult, onAuthStateChanged } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth } from "../firebase.js";
import { db } from "../firebase.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser]       = useState(undefined);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getRedirectResult(auth)
            .then((result) => {
                const user = result?.user;

                if (!user) {
                    return;
                }

                return setDoc(doc(db, "users", user.uid), {
                    name: user.displayName,
                    email: user.email,
                    lastLogin: new Date(),
                    createdAt: new Date(),
                }, { merge: true });
            })
            .catch((error) => {
                console.error("Google redirect sign-in failed:", error);
            });

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