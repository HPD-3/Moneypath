import { db } from "../firebaseAdmin.js";

// Levels definition
export const LEVELS = [
  { id: 1, key: "Beginner Saver", xp: 0, reward: { type: "badge", name: "Beginner Saver Badge" } },
  { id: 2, key: "Budget Rookie", xp: 100, reward: { type: "coins", amount: 50 } },
  { id: 3, key: "Smart Spender", xp: 250, reward: { type: "theme", name: "Smart Spender Theme" } },
  { id: 4, key: "Expense Tracker", xp: 500, reward: { type: "streakBoost", days: 1 } },
  { id: 5, key: "Goal Hunter", xp: 900, reward: { type: "badge", name: "Custom Avatar Unlock" } },
  { id: 6, key: "Money Planner", xp: 1400, reward: { type: "coins", amount: 150 } },
  { id: 7, key: "Wealth Builder", xp: 2000, reward: { type: "trial", name: "Premium Analytics Trial", days: 14 } },
  { id: 8, key: "Investment Explorer", xp: 2800, reward: { type: "badge", name: "Rare Investor Badge" } },
  { id: 9, key: "Financial Strategist", xp: 3800, reward: { type: "theme", name: "Advanced Dashboard" } },
  { id: 10, key: "MoneyPath Master", xp: 5000, reward: { type: "legendary", name: "MoneyPath Master", title: "MoneyPath Master" } },
];

const getUserDoc = async (uid) => {
  const ref = db.collection("users").doc(uid);
  const doc = await ref.get();
  return { ref, data: doc.exists ? doc.data() : {} };
};

export const getLevels = async (req, res) => {
  try {
    const uid = req.user.uid;
    const { data } = await getUserDoc(uid);

    const totalExp = data.totalExp || 0;
    const coins = data.coins || 0;
    const streak = data.currentStreak || 0;
    const badges = data.badges || [];
    const claimed = data.claimedLevels || [];

    const items = LEVELS.map((lvl) => ({
      ...lvl,
      unlocked: totalExp >= lvl.xp,
      claimed: claimed.includes(lvl.id),
    }));

    res.json({ levels: items, totalExp, coins, streak, badges });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const claimLevelReward = async (req, res) => {
  try {
    const uid = req.user.uid;
    const { levelId } = req.body;
    if (!levelId) return res.status(400).json({ error: "levelId required" });

    const { ref, data } = await getUserDoc(uid);
    const totalExp = data.totalExp || 0;
    const claimed = new Set(data.claimedLevels || []);

    const lvl = LEVELS.find((l) => l.id === Number(levelId));
    if (!lvl) return res.status(404).json({ error: "Level not found" });
    if (totalExp < lvl.xp) return res.status(400).json({ error: "Level locked" });
    if (claimed.has(lvl.id)) return res.status(400).json({ error: "Reward already claimed" });

    // Apply reward
    const updates = {};
    switch (lvl.reward.type) {
      case "coins":
        updates.coins = (data.coins || 0) + (lvl.reward.amount || 0);
        break;
      case "badge":
        updates.badges = Array.from(new Set([...(data.badges || []), lvl.reward.name]));
        break;
      case "theme":
        updates.profileTheme = lvl.reward.name;
        break;
      case "streakBoost":
        updates.streakBoost = (data.streakBoost || 0) + (lvl.reward.days || 0);
        break;
      case "trial":
        updates.premiumTrial = { active: true, days: lvl.reward.days || 7, startedAt: new Date().toISOString() };
        break;
      case "legendary":
        updates.badges = Array.from(new Set([...(data.badges || []), lvl.reward.name]));
        updates.title = lvl.reward.title || lvl.key;
        break;
      default:
        break;
    }

    // mark claimed
    const newClaimed = Array.from(new Set([...(data.claimedLevels || []), lvl.id]));
    updates.claimedLevels = newClaimed;

    await ref.set(updates, { merge: true });

    res.json({ message: "Reward claimed", updates });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export default { getLevels, claimLevelReward };
