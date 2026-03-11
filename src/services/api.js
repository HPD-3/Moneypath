import axios from "axios";
import { auth } from "../firebase";

const API = axios.create({
    baseURL: "http://localhost:3000"
});

// Automatically attach token to every request
API.interceptors.request.use(async (config) => {
    const user = auth.currentUser;
    if (user) {
        const token = await user.getIdToken();
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default API;