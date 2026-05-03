import axios from "axios";
import { auth } from "../firebase";

const API = axios.create({
    baseURL: (import.meta.env.VITE_API_URL || "http://localhost:3000").replace(/\/$/, "")
});

console.log("[API] Base URL configured to:", API.defaults.baseURL);

API.interceptors.request.use(async (config) => {
    const user = auth.currentUser;
    if (user) {
        const token = await user.getIdToken();
        config.headers.Authorization = `Bearer ${token}`;
        console.log("[API] Authorization header added for user:", user.uid);
    } else {
        console.warn("[API] No authenticated user found");
    }
    return config;
});

export default API;