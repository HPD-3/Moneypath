import admin from "firebase-admin";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

function loadServiceAccount() {
    const rawEnv = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (rawEnv) {
        return JSON.parse(rawEnv);
    }

    const currentDir = path.dirname(fileURLToPath(import.meta.url));
    const fallbackPath = path.join(currentDir, "serviceAccountKey.json");

    if (fs.existsSync(fallbackPath)) {
        return JSON.parse(fs.readFileSync(fallbackPath, "utf8"));
    }

    throw new Error("Missing Firebase service account. Set FIREBASE_SERVICE_ACCOUNT or provide server/serviceAccountKey.json.");
}

if (!admin.apps.length) {
    const serviceAccount = loadServiceAccount();

    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();
const auth = admin.auth();

export { db, auth };