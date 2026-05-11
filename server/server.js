import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.js";
import personalRoutes from "./routes/personal.js";
import balanceRoutes from "./routes/balance.js";
import adminRoutes from "./routes/admin.js";
import videoRoutes from "./routes/video.js";
import learningPathRoutes from "./routes/learningPath.js";
import quizRoutes from "./routes/quiz.js";
import tabunganRoutes from "./routes/tabungan.js";
import settingsRoutes from "./routes/settings.js";
import historyRoutes from "./routes/history.js";
import { sendEmailHandler } from "./api/send-email.js";
import rekapRoutes from "./routes/rekap.js";
import cronRoutes from "./routes/cron.js";
import sharedBalanceRoutes from "./routes/sharedbalance.js";
import sharedTabunganRoutes from "./routes/sharedTabungan.js";
import analyticsRoutes from "./routes/analytics.js";
import rekapExportRoutes from "./routes/rekapExport.js";


const app = express();

app.get("/", (req, res) => {
    res.send("Welcome to the Moneypath backend side.");
});

const allowedOrigins = new Set([
    "https://moneypath-7777.firebaseapp.com",
    "https://moneypath-7777.web.app",
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
]);

const corsOptions = {
    origin: (origin, callback) => {
        // Non-browser clients (curl/server-to-server) may not send Origin
        if (!origin) return callback(null, true);
        return callback(null, allowedOrigins.has(origin));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
// Express v5's path-to-regexp doesn't accept "*" as a path pattern.
app.options(/.*/, cors(corsOptions));

app.use(express.json());
app.use("/auth", authRoutes);
app.use("/personal", personalRoutes);
app.use("/balance", balanceRoutes);
app.use("/admin", adminRoutes);
app.use("/video", videoRoutes);
app.use("/learningpath", learningPathRoutes);
app.use("/quiz", quizRoutes);
app.use("/tabungan", tabunganRoutes);
app.use("/settings", settingsRoutes);
app.use("/history", historyRoutes);
app.post("/api/send-email", sendEmailHandler);
app.use("/rekap", rekapRoutes);
app.use("/rekap", rekapExportRoutes);
app.use("/cron", cronRoutes);
app.use("/shared-balance", sharedBalanceRoutes);
app.use("/shared-tabungan", sharedTabunganRoutes);
app.use("/analytics", analyticsRoutes);

export default app;