import { db } from "../firebaseAdmin.js";
import { calcLevel } from "../utils/expSystem.js";
import {
    DEFAULT_THEME_ID,
    THEME_LEVEL_UNLOCK,
    THEME_PRESETS,
    getThemePresetById,
    getThemeStateFromUserData,
} from "./themePresets.shared.js";

// Simple shop catalog (could be moved to DB later)
const BASE_CATALOG = [
    { id: "theme_ocean", title: "Ocean Emerald Theme", type: "theme", price: 200, description: "Unlock Ocean Emerald profile theme" },
    { id: "border_gold", title: "Gold Avatar Border", type: "avatarBorder", price: 150, description: "Decorative gold border for avatar" },
    { id: "streak_protector", title: "Streak Protector", type: "streakProtector", price: 300, description: "Protect your streak for one missed day" },
    { id: "cosmetic_confetti", title: "Confetti Effect", type: "cosmetic", price: 500, description: "Purchase confetti animation for level-ups" }
];

const THEME_CATALOG = THEME_PRESETS.filter((preset) => !preset.isFree).map((preset) => ({
    id: preset.id,
    title: preset.name,
    type: "themePreset",
    price: preset.price,
    rarity: preset.rarity,
    description: preset.description,
    previewImage: preset.previewImage,
    preset,
}));

function buildCatalog(userData = {}) {
    const ownedThemes = new Set([...(userData.purchasedThemes || []), ...(userData.ownedThemes || [])]);
    const activeTheme = userData.activeTheme || userData.profileTheme || DEFAULT_THEME_ID;

    return [
        ...BASE_CATALOG,
        ...THEME_CATALOG.map((item) => ({
            ...item,
            owned: ownedThemes.has(item.id),
            equipped: activeTheme === item.id,
            locked: (calcLevel(userData.totalExp || 0).level < THEME_LEVEL_UNLOCK) && !item.preset.isFree,
        })),
    ];
}

export async function getCatalog(req, res) {
    try {
        const uid = req.user.uid;
        const userDoc = await db.collection("users").doc(uid).get();
        const userData = userDoc.exists ? userDoc.data() : {};

        res.json({
            items: buildCatalog(userData),
            themeUnlockLevel: THEME_LEVEL_UNLOCK,
            themeState: getThemeStateFromUserData(userData),
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

export async function purchaseItem(req, res) {
    try {
        const uid = req.user.uid;
        const { itemId } = req.body;
        if (!itemId) return res.status(400).json({ error: "itemId required" });

        const item = [...BASE_CATALOG, ...THEME_CATALOG].find(i => i.id === itemId);
        if (!item) return res.status(404).json({ error: "Item not found" });

        const userRef = db.collection("users").doc(uid);
        const userDoc = await userRef.get();
        const userData = userDoc.exists ? userDoc.data() : {};

        const currentLevel = calcLevel(userData.totalExp || 0).level;

        const coins = userData.coins || 0;
        if (coins < item.price) return res.status(400).json({ error: "Not enough coins" });

        if (item.type === "themePreset" && currentLevel < THEME_LEVEL_UNLOCK) {
            return res.status(403).json({ error: `Theme presets unlock at level ${THEME_LEVEL_UNLOCK}` });
        }

        const ownedThemes = new Set([...(userData.purchasedThemes || []), ...(userData.ownedThemes || [])]);
        if (item.type === "themePreset" && ownedThemes.has(item.id)) {
            const themeState = getThemeStateFromUserData({
                ...userData,
                activeTheme: item.id,
                profileTheme: item.id,
            });

            themeState.activeTheme = item.id;
            themeState.recentThemes = [item.id, ...(themeState.recentThemes || [])]
                .filter(Boolean)
                .filter((value, index, array) => array.indexOf(value) === index)
                .slice(0, 8);

            await userRef.set({
                activeTheme: item.id,
                profileTheme: item.id,
                recentThemes: themeState.recentThemes,
                theme: themeState,
                themeUpdatedAt: new Date().toISOString(),
            }, { merge: true });

            return res.json({
                message: "Theme equipped",
                item: itemId,
                coins,
                updates: { activeTheme: item.id, profileTheme: item.id, recentThemes: themeState.recentThemes },
                ownedThemes: Array.from(ownedThemes),
                activeTheme: item.id,
            });
        }

        const updates = { coins: coins - item.price };

        // Grant item
        switch (item.type) {
            case "theme":
                updates.ownedThemes = Array.from(new Set([...(userData.ownedThemes || []), item.id]));
                // auto-equip
                updates.profileTheme = item.id;
                break;
            case "avatarBorder":
                updates.avatarBorders = Array.from(new Set([...(userData.avatarBorders || []), item.id]));
                // Auto-equip the purchased avatar border
                updates.avatarBorder = item.id;
                break;
            case "themePreset": {
                const purchasedThemes = Array.from(new Set([...(userData.purchasedThemes || []), item.id]));
                updates.purchasedThemes = purchasedThemes;
                updates.ownedThemes = purchasedThemes;
                updates.activeTheme = item.id;
                updates.profileTheme = item.id;

                const themeState = getThemeStateFromUserData({
                    ...userData,
                    purchasedThemes,
                    activeTheme: item.id,
                    profileTheme: item.id,
                });

                themeState.activeTheme = item.id;
                themeState.purchasedThemes = purchasedThemes;
                themeState.recentThemes = [item.id, ...(themeState.recentThemes || [])]
                    .filter(Boolean)
                    .filter((value, index, array) => array.indexOf(value) === index)
                    .slice(0, 8);

                updates.theme = themeState;
                updates.recentThemes = themeState.recentThemes;
                break;
            }
            case "streakProtector":
                updates.streakProtectors = (userData.streakProtectors || 0) + 1;
                break;
            case "cosmetic":
                updates.cosmetics = Array.from(new Set([...(userData.cosmetics || []), item.id]));
                break;
            default:
                break;
        }

        await userRef.set(updates, { merge: true });

        res.json({
            message: "Purchase successful",
            item: itemId,
            coins: updates.coins,
            updates,
            ownedThemes: updates.ownedThemes || userData.ownedThemes || [],
            activeTheme: updates.activeTheme || userData.activeTheme || userData.profileTheme || DEFAULT_THEME_ID,
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

export default { getCatalog, purchaseItem };
