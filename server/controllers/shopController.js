import { db } from "../firebaseAdmin.js";

// Simple shop catalog (could be moved to DB later)
const CATALOG = [
    { id: "theme_ocean", title: "Ocean Emerald Theme", type: "theme", price: 200, description: "Unlock Ocean Emerald profile theme" },
    { id: "border_gold", title: "Gold Avatar Border", type: "avatarBorder", price: 150, description: "Decorative gold border for avatar" },
    { id: "streak_protector", title: "Streak Protector", type: "streakProtector", price: 300, description: "Protect your streak for one missed day" },
    { id: "cosmetic_confetti", title: "Confetti Effect", type: "cosmetic", price: 500, description: "Purchase confetti animation for level-ups" }
];

export async function getCatalog(req, res) {
    try {
        res.json({ items: CATALOG });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

export async function purchaseItem(req, res) {
    try {
        const uid = req.user.uid;
        const { itemId } = req.body;
        if (!itemId) return res.status(400).json({ error: "itemId required" });

        const item = CATALOG.find(i => i.id === itemId);
        if (!item) return res.status(404).json({ error: "Item not found" });

        const userRef = db.collection("users").doc(uid);
        const userDoc = await userRef.get();
        const userData = userDoc.exists ? userDoc.data() : {};

        const coins = userData.coins || 0;
        if (coins < item.price) return res.status(400).json({ error: "Not enough coins" });

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

        res.json({ message: "Purchase successful", item: itemId, coins: updates.coins, updates });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

export default { getCatalog, purchaseItem };
