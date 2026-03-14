import axios from "axios";
import { auth } from "../firebase";

const API = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000"
});


API.interceptors.request.use(async (config) => {
    const user = auth.currentUser;
    if (user) {
        const token = await user.getIdToken();
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default API;