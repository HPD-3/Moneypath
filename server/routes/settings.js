import express from "express";
import { verifyToken } from "../middleware/verifyToken.js";
import {
    getUserSettings,
    updateUserSettings,
    changePassword,
    getSettingsProfile,
    updateSettingsProfile,
    updateUsername,
    deleteAccount,
    getBadgeSettings,
    updateBadgeSettings,
    updateAvatar,
    uploadAvatar,
    deleteAvatar
} from "../controllers/settingsController.js";

const router = express.Router();

// Settings routes - all require authentication
router.get("/", verifyToken, getUserSettings);
router.post("/update", verifyToken, updateUserSettings);
router.post("/change-password", verifyToken, changePassword);

// Profile routes
router.get("/profile", verifyToken, getSettingsProfile);
router.post("/profile", verifyToken, updateSettingsProfile);

// Badge routes
router.get("/badges", verifyToken, getBadgeSettings);
router.post("/badges", verifyToken, updateBadgeSettings);

// Avatar upload/save
router.post("/avatar", verifyToken, updateAvatar);
router.post("/avatar/upload", verifyToken, uploadAvatar);
// Avatar delete
router.post("/avatar/delete", verifyToken, deleteAvatar);

// Username update
router.post("/update-username", verifyToken, updateUsername);

// Delete account
router.post("/delete-account", verifyToken, deleteAccount);

export default router;
