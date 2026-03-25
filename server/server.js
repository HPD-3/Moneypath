import express from "express";
import authRoutes from "./routes/auth.js";
import personalRoutes from "./routes/personal.js";
import balanceRoutes from "./routes/balance.js";
import adminRoutes from "./routes/admin.js";
import videoRoutes from "./routes/video.js";
import learningPathRoutes from "./routes/learningPath.js";

const app = express();

app.use((req, res, next) => {
    const allowedOrigins = [
        "https://moneypath-7777.firebaseapp.com",
        "https://moneypath-7777.web.app",
        "http://localhost:5173",
        "http://localhost:3000"
    ];

    const origin = req.headers.origin;

    if (allowedOrigins.includes(origin)) {
        res.setHeader("Access-Control-Allow-Origin", origin);
    }

    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.setHeader("Access-Control-Allow-Credentials", "true");

    if (req.method === "OPTIONS") {
        return res.sendStatus(204);
    }

    next();
});

app.use(express.json());
app.use("/auth", authRoutes);
app.use("/personal", personalRoutes);
app.use("/balance", balanceRoutes);
app.use("/admin", adminRoutes);
app.use("/video", videoRoutes);
app.use("/learningPath", learningPathRoutes);

export default app;