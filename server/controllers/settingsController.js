import { db } from "../firebaseAdmin.js";
import { getAuth } from "firebase-admin/auth";
import { LEVELS } from "./levelsController.js";
import { calcLevel } from "../utils/expSystem.js";
import supabase from "../supabase.js";
import path from "path";
import {
    DEFAULT_THEME_ID,
    THEME_LEVEL_UNLOCK,
    THEME_PRESETS,
    buildThemeVariables,
    getThemePresetById,
    getThemeStateFromUserData,
    normalizeThemeState,
} from "./themePresets.shared.js";

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
        const themeState = getThemeStateFromUserData(userData);
        const settings = {
            notificationsEmail: userData.settings?.notificationsEmail ?? true,
            notificationsInApp: userData.settings?.notificationsInApp ?? true,
            privacyLevel: userData.settings?.privacyLevel ?? "private",
            language: userData.settings?.language ?? "id",
            theme: userData.settings?.theme ?? userData.themeMode ?? "light",
            themeMode: userData.themeMode ?? userData.settings?.theme ?? "light",
            activeTheme: themeState.activeTheme,
            themeAccessUnlocked: calcLevel(userData.totalExp || 0).level >= THEME_LEVEL_UNLOCK,
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
        const { notificationsEmail, notificationsInApp, privacyLevel, language, theme, themeMode } = req.body;

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

        const resolvedTheme = themeMode || theme;

        if (resolvedTheme && !['light', 'dark'].includes(resolvedTheme)) {
            return res.status(400).json({ message: "Invalid theme" });
        }

        // Update settings in Firestore
        await db.collection("users").doc(uid).update({
            settings: {
                notificationsEmail: notificationsEmail ?? true,
                notificationsInApp: notificationsInApp ?? true,
                privacyLevel: privacyLevel ?? "private",
                language: language ?? "id",
                theme: resolvedTheme ?? "light",
                themeMode: resolvedTheme ?? "light",
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
            dateOfBirth: userData.dateOfBirth || "",
            avatarUrl: userData.avatarUrl || "",
            avatarBorder: userData.avatarBorder || "",
            avatarStoragePath: userData.avatarStoragePath || ""
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

/**
 * Update user name
 * POST /settings/update-username
 */
export async function updateUsername(req, res) {
    try {
        const uid = req.user.uid;
        const { name } = req.body;

        if (!name || name.trim().length === 0) {
            return res.status(400).json({ message: "Name is required" });
        }

        // Update name in Firestore
        await db.collection("users").doc(uid).update({
            name: name,
            updatedAt: new Date().toISOString()
        });

        res.json({ message: "Name updated successfully", name: name });
    } catch (err) {
        res.status(500).json({ message: err.message || "Failed to update name" });
    }
}

/**
 * Delete user account
 * POST /settings/delete-account
 */
export async function deleteAccount(req, res) {
    try {
        const uid = req.user.uid;
        const { password } = req.body;

        if (!password) {
            return res.status(400).json({ message: "Password is required for account deletion" });
        }

        const auth = getAuth();

        // Delete user from Firebase Authentication
        await auth.deleteUser(uid);

        // Delete user document from Firestore
        await db.collection("users").doc(uid).delete();

        res.json({ message: "Account deleted successfully" });
    } catch (err) {
        if (err.code === "auth/user-not-found") {
            res.status(404).json({ message: "User not found" });
        } else {
            res.status(500).json({ message: err.message || "Failed to delete account" });
        }
    }
}

/**
 * Get badge showcase and active badge settings
 * GET /settings/badges
 */
export async function getBadgeSettings(req, res) {
    try {
        const uid = req.user.uid;
        const userDoc = await db.collection("users").doc(uid).get();

        if (!userDoc.exists) {
            return res.status(404).json({ message: "User not found" });
        }

        const userData = userDoc.data();
        const totalExp = userData.totalExp || 0;
        const levelInfo = calcLevel(totalExp);

        const badgeCatalog = LEVELS
            .filter((level) => level.reward?.type === "badge" || level.reward?.type === "legendary")
            .map((level) => ({
                id: level.id,
                name: level.reward.name || level.key,
                title: level.key,
                xp: level.xp,
                rewardType: level.reward.type,
                rewardText: level.reward.title || level.reward.name || level.key,
            }));

        res.json({
            totalExp,
            coins: userData.coins || 0,
            level: levelInfo.level,
            levelProgress: levelInfo.progress,
            activeBadge: userData.activeBadge || "",
            unlockedBadges: userData.badges || [],
            badgeCatalog,
        });
    } catch (err) {
        res.status(500).json({ message: err.message || "Failed to fetch badge settings" });
    }
}

/**
 * Update active badge selection
 * POST /settings/badges
 */
export async function updateBadgeSettings(req, res) {
    try {
        const uid = req.user.uid;
        const { activeBadge } = req.body;

        const userDoc = await db.collection("users").doc(uid).get();
        if (!userDoc.exists) {
            return res.status(404).json({ message: "User not found" });
        }

        const userData = userDoc.data();
        const unlockedBadges = userData.badges || [];

        if (activeBadge && !unlockedBadges.includes(activeBadge)) {
            return res.status(400).json({ message: "Badge is not unlocked" });
        }

        await db.collection("users").doc(uid).update({
            activeBadge: activeBadge || "",
            updatedAt: new Date().toISOString(),
        });

        res.json({ message: "Badge settings updated successfully", activeBadge: activeBadge || "" });
    } catch (err) {
        res.status(500).json({ message: err.message || "Failed to update badge settings" });
    }
}

/**
 * Update avatar URL and avatar border
 * POST /settings/avatar
 */
export async function updateAvatar(req, res) {
    try {
        const uid = req.user.uid;
        const { avatarUrl, avatarBorder, storagePath } = req.body;

        if (!avatarUrl) return res.status(400).json({ message: "avatarUrl is required" });

        const updateData = {
            avatarUrl,
            updatedAt: new Date().toISOString()
        };

        if (avatarBorder !== undefined) updateData.avatarBorder = avatarBorder;
        if (storagePath) updateData.avatarStoragePath = storagePath;

        await db.collection("users").doc(uid).update(updateData);

        res.json({ message: "Avatar updated", avatarUrl, avatarBorder, storagePath });
    } catch (err) {
        res.status(500).json({ message: err.message || "Failed to update avatar" });
    }
}

/**
 * Upload avatar through Supabase service role
 * POST /settings/avatar/upload
 */
export async function uploadAvatar(req, res) {
    try {
        const uid = req.user.uid;
        const { avatarBase64, fileName, mimeType } = req.body;

        if (!avatarBase64 || !fileName || !mimeType) {
            return res.status(400).json({ message: "avatarBase64, fileName, and mimeType are required" });
        }

        const bucket = process.env.SUPABASE_STORAGE_BUCKET || "Moneypath";
        const safeName = path.basename(fileName).replace(/\s+/g, "_");
        const storagePath = `${uid}/${Date.now()}_${safeName}`;
        const buffer = Buffer.from(avatarBase64, "base64");

        const { error: uploadError } = await supabase.storage
            .from(bucket)
            .upload(storagePath, buffer, {
                contentType: mimeType,
                upsert: false,
            });

        if (uploadError) {
            return res.status(400).json({ message: uploadError.message || "Failed to upload avatar" });
        }

        const { data } = supabase.storage.from(bucket).getPublicUrl(storagePath);
        const avatarUrl = data.publicUrl;

        await db.collection("users").doc(uid).update({
            avatarUrl,
            avatarStoragePath: `${bucket}/${storagePath}`,
            updatedAt: new Date().toISOString(),
        });

        res.json({ message: "Avatar uploaded", avatarUrl, storagePath: `${bucket}/${storagePath}` });
    } catch (err) {
        res.status(500).json({ message: err.message || "Failed to upload avatar" });
    }
}

/**
 * Delete avatar URL and optionally remove storage object
 * POST /settings/avatar/delete
 */
export async function deleteAvatar(req, res) {
    try {
        const uid = req.user.uid;

        const userDocRef = db.collection("users").doc(uid);
        const userDoc = await userDocRef.get();
        if (!userDoc.exists) return res.status(404).json({ message: "User not found" });

        const userData = userDoc.data();
        const storagePath = userData?.avatarStoragePath;

        // Attempt to delete from Supabase storage if storagePath present
        if (storagePath) {
            try {
                const parts = storagePath.split('/');
                const bucket = parts.shift();
                const filePath = parts.join('/');
                if (bucket && filePath) {
                    await supabase.storage.from(bucket).remove([filePath]).catch(() => null);
                }
            } catch (e) {
                // ignore storage delete errors
            }
        }

        // Clear avatar fields in user doc
        await userDocRef.update({
            avatarUrl: "",
            avatarStoragePath: "",
            updatedAt: new Date().toISOString()
        });

        res.json({ message: "Avatar removed" });
    } catch (err) {
        res.status(500).json({ message: err.message || "Failed to delete avatar" });
    }
}

/**
 * Get theme presets + user theme state
 * GET /settings/themes
 */
export async function getThemeSettings(req, res) {
    try {
        const uid = req.user.uid;
        const userDoc = await db.collection("users").doc(uid).get();

        if (!userDoc.exists) {
            return res.status(404).json({ message: "User not found" });
        }

        const userData = userDoc.data();
        const totalExp = userData.totalExp || 0;
        const levelInfo = calcLevel(totalExp);
        const themeState = getThemeStateFromUserData(userData);
        const ownedThemes = new Set([...(userData.purchasedThemes || []), ...(userData.ownedThemes || [])]);

        const presets = THEME_PRESETS.map((preset) => ({
            ...preset,
            owned: preset.isFree || ownedThemes.has(preset.id),
            equipped: themeState.activeTheme === preset.id,
        }));

        res.json({
            level: levelInfo.level,
            totalExp,
            coins: userData.coins || 0,
            themeAccessUnlocked: levelInfo.level >= THEME_LEVEL_UNLOCK,
            themeState,
            activePreset: getThemePresetById(themeState.activeTheme),
            presets,
            customThemeCount: (themeState.customThemes || []).length,
            themeVariables: buildThemeVariables(getThemePresetById(themeState.activeTheme), themeState),
            ownedThemes: Array.from(ownedThemes),
        });
    } catch (err) {
        res.status(500).json({ message: err.message || "Failed to fetch theme settings" });
    }
}

/**
 * Save theme customization
 * POST /settings/themes
 */
export async function updateThemeSettings(req, res) {
    try {
        const uid = req.user.uid;
        const userDoc = await db.collection("users").doc(uid).get();

        if (!userDoc.exists) {
            return res.status(404).json({ message: "User not found" });
        }

        const userData = userDoc.data();
        const levelInfo = calcLevel(userData.totalExp || 0);
        const themeAccessUnlocked = levelInfo.level >= THEME_LEVEL_UNLOCK;
        const payload = normalizeThemeState(req.body || {});
        const ownedThemes = new Set([...(userData.purchasedThemes || []), ...(userData.ownedThemes || [])]);
        const activePreset = getThemePresetById(payload.activeTheme || DEFAULT_THEME_ID);

        if (!themeAccessUnlocked) {
            return res.status(403).json({ message: `Theme customization unlocks at level ${THEME_LEVEL_UNLOCK}.` });
        }

        if (!activePreset.isFree && !ownedThemes.has(activePreset.id)) {
            return res.status(403).json({ message: "You must own this theme before applying it." });
        }

        const themeState = {
            ...payload,
            activeTheme: activePreset.id,
            purchasedThemes: Array.from(new Set([...(payload.purchasedThemes || []), ...(userData.purchasedThemes || []), ...(userData.ownedThemes || [])])),
            recentThemes: [activePreset.id, ...(payload.recentThemes || [])].filter(Boolean).filter((value, index, array) => array.indexOf(value) === index).slice(0, 8),
            favoriteThemes: Array.from(new Set(payload.favoriteThemes || [])),
        };

        await db.collection("users").doc(uid).set({
            activeTheme: activePreset.id,
            profileTheme: activePreset.id,
            themeMode: payload.themeMode,
            customColors: payload.customColors,
            sidebarSettings: payload.sidebarSettings,
            dashboardSettings: payload.dashboardSettings,
            purchasedThemes: themeState.purchasedThemes,
            ownedThemes: themeState.purchasedThemes,
            favoriteThemes: themeState.favoriteThemes,
            recentThemes: themeState.recentThemes,
            customThemes: payload.customThemes || [],
            theme: themeState,
            themeUpdatedAt: new Date().toISOString(),
        }, { merge: true });

        res.json({
            message: "Theme saved",
            themeState,
            activePreset,
            themeVariables: buildThemeVariables(activePreset, themeState),
        });
    } catch (err) {
        res.status(500).json({ message: err.message || "Failed to save theme settings" });
    }
}

/**
 * Apply theme preset without changing customization metadata
 * POST /settings/themes/apply
 */
export async function applyThemePreset(req, res) {
    try {
        const uid = req.user.uid;
        const { themeId } = req.body;

        if (!themeId) {
            return res.status(400).json({ message: "themeId is required" });
        }

        const userDoc = await db.collection("users").doc(uid).get();
        if (!userDoc.exists) {
            return res.status(404).json({ message: "User not found" });
        }

        const userData = userDoc.data();
        const levelInfo = calcLevel(userData.totalExp || 0);
        const themeAccessUnlocked = levelInfo.level >= THEME_LEVEL_UNLOCK;
        const themePreset = getThemePresetById(themeId);
        const ownedThemes = new Set([...(userData.purchasedThemes || []), ...(userData.ownedThemes || [])]);

        if (!themeAccessUnlocked) {
            return res.status(403).json({ message: `Theme customization unlocks at level ${THEME_LEVEL_UNLOCK}.` });
        }

        if (!themePreset.isFree && !ownedThemes.has(themePreset.id)) {
            return res.status(403).json({ message: "This theme is locked. Purchase it first." });
        }

        const themeState = getThemeStateFromUserData(userData);
        themeState.activeTheme = themePreset.id;
        themeState.customColors = { ...themePreset.colors };
        themeState.recentThemes = [themePreset.id, ...(themeState.recentThemes || [])]
            .filter(Boolean)
            .filter((value, index, array) => array.indexOf(value) === index)
            .slice(0, 8);

        await db.collection("users").doc(uid).set({
            activeTheme: themePreset.id,
            profileTheme: themePreset.id,
            recentThemes: themeState.recentThemes,
            theme: themeState,
            themeUpdatedAt: new Date().toISOString(),
        }, { merge: true });

        res.json({
            message: "Theme applied",
            themeState,
            activePreset: themePreset,
            themeVariables: buildThemeVariables(themePreset, themeState),
        });
    } catch (err) {
        res.status(500).json({ message: err.message || "Failed to apply theme" });
    }
}
