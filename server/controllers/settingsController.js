import { db } from "../firebaseAdmin.js";
import { getAuth } from "firebase-admin/auth";

/**
 * Get user settings
 * GET /settings
 */
export async function getUserSettings(req, res) {
    try {
        const uid = req.user.uid;

        const userDoc = await db.collection("users").doc(uid).get();
        
        if (!userDoc.exists) {
            return res.status(404).json({ message: "User not found" });
        }

        const userData = userDoc.data();
        const settings = {
            notificationsEmail: userData.settings?.notificationsEmail ?? true,
            notificationsInApp: userData.settings?.notificationsInApp ?? true,
            privacyLevel: userData.settings?.privacyLevel ?? "private",
            language: userData.settings?.language ?? "id",
            theme: userData.settings?.theme ?? "light"
        };

        res.json(settings);
    } catch (err) {
        res.status(500).json({ message: err.message || "Failed to fetch settings" });
    }
}

/**
 * Update user settings
 * POST /settings/update
 */
export async function updateUserSettings(req, res) {
    try {
        const uid = req.user.uid;
        const { notificationsEmail, notificationsInApp, privacyLevel, language, theme } = req.body;

        // Validate settings
        if (notificationsEmail !== undefined && typeof notificationsEmail !== 'boolean') {
            return res.status(400).json({ message: "notificationsEmail must be boolean" });
        }

        if (notificationsInApp !== undefined && typeof notificationsInApp !== 'boolean') {
            return res.status(400).json({ message: "notificationsInApp must be boolean" });
        }

        if (privacyLevel && !['private', 'friends', 'public'].includes(privacyLevel)) {
            return res.status(400).json({ message: "Invalid privacy level" });
        }

        if (language && !['id', 'en'].includes(language)) {
            return res.status(400).json({ message: "Invalid language" });
        }

        if (theme && !['light', 'dark'].includes(theme)) {
            return res.status(400).json({ message: "Invalid theme" });
        }

        // Update settings in Firestore
        await db.collection("users").doc(uid).update({
            settings: {
                notificationsEmail: notificationsEmail ?? true,
                notificationsInApp: notificationsInApp ?? true,
                privacyLevel: privacyLevel ?? "private",
                language: language ?? "id",
                theme: theme ?? "light",
                updatedAt: new Date().toISOString()
            }
        });

        res.json({ message: "Settings updated successfully" });
    } catch (err) {
        res.status(500).json({ message: err.message || "Failed to update settings" });
    }
}

/**
 * Change password
 * POST /settings/change-password
 */
export async function changePassword(req, res) {
    try {
        const uid = req.user.uid;
        const { oldPassword, newPassword } = req.body;

        if (!oldPassword || !newPassword) {
            return res.status(400).json({ message: "Old password and new password are required" });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ message: "New password must be at least 6 characters" });
        }

        const auth = getAuth();

        // Update password using Firebase Admin SDK
        await auth.updateUser(uid, {
            password: newPassword
        });

        // Log the password change
        await db.collection("users").doc(uid).update({
            lastPasswordChange: new Date().toISOString()
        });

        res.json({ message: "Password changed successfully" });
    } catch (err) {
        if (err.code === "auth/invalid-password") {
            res.status(400).json({ message: "Password too weak (minimum 6 characters)" });
        } else if (err.code === "auth/user-not-found") {
            res.status(404).json({ message: "User not found" });
        } else {
            res.status(500).json({ message: err.message || "Failed to change password" });
        }
    }
}

/**
 * Get user profile for settings view
 * GET /settings/profile
 */
export async function getSettingsProfile(req, res) {
    try {
        const uid = req.user.uid;

        const userDoc = await db.collection("users").doc(uid).get();
        
        if (!userDoc.exists) {
            return res.status(404).json({ message: "User not found" });
        }

        const userData = userDoc.data();
        const profile = {
            name: userData.name || "",
            email: userData.email || "",
            phoneNumber: userData.phoneNumber || "",
            gender: userData.gender || "",
            address: userData.address || "",
            dateOfBirth: userData.dateOfBirth || ""
        };

        res.json(profile);
    } catch (err) {
        res.status(500).json({ message: err.message || "Failed to fetch profile" });
    }
}

/**
 * Update user profile from settings
 * POST /settings/profile
 */
export async function updateSettingsProfile(req, res) {
    try {
        const uid = req.user.uid;
        const { name, phoneNumber, gender, address, dateOfBirth } = req.body;

        // Update profile in Firestore
        const updateData = {};
        
        if (name !== undefined) updateData.name = name;
        if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;
        if (gender !== undefined) updateData.gender = gender;
        if (address !== undefined) updateData.address = address;
        if (dateOfBirth !== undefined) updateData.dateOfBirth = dateOfBirth;
        
        updateData.updatedAt = new Date().toISOString();

        await db.collection("users").doc(uid).update(updateData);

        res.json({ message: "Profile updated successfully" });
    } catch (err) {
        res.status(500).json({ message: err.message || "Failed to update profile" });
    }
}
