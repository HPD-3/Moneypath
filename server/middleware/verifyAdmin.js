import { auth, db } from "../firebaseAdmin.js";

export const verifyAdmin = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "No token" });

    const token = authHeader.split(" ")[1];
    try {
        const decoded = await auth.verifyIdToken(token);
        const userDoc = await db.collection("users").doc(decoded.uid).get();

        if (!userDoc.exists || userDoc.data().role !== "admin") {
            return res.status(403).json({ error: "Access denied. Admins only." });
        }

        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ error: "Invalid token" });
    }
};