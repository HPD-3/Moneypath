// ── EXP Rewards ───────────────────────────────────────────────
export const EXP_REWARDS = {
    FINISH_MODULE:       20,   // finish reading a module
    PASS_MODULE_QUIZ:    30,   // pass a module quiz ≥70
    FINISH_PATH:        100,   // finish entire learning path
    DAILY_QUIZ:          50,   // complete daily quiz
    STREAK_BONUS:        10,   // per consecutive day streak
};

// ── Level formula: infinite levels, 100 EXP per level ─────────
export function calcLevel(totalExp) {
    const level       = Math.floor(totalExp / 100) + 1;
    const currentExp  = totalExp % 100;
    const expToNext   = 100;
    const progress    = Math.round((currentExp / expToNext) * 100);
    return { level, currentExp, expToNext, progress };
}

// ── Award EXP to a user in Firestore ──────────────────────────
export async function awardExp(db, uid, amount, reason) {
    const userRef  = db.collection("users").doc(uid);
    const userDoc  = await userRef.get();
    const userData = userDoc.exists ? userDoc.data() : {};

    const oldExp  = userData.totalExp  || 0;
    const newExp  = oldExp + amount;
    const oldInfo = calcLevel(oldExp);
    const newInfo = calcLevel(newExp);
    const levelUp = newInfo.level > oldInfo.level;

    await userRef.set({
        totalExp: newExp,
        level: newInfo.level,
        expLog: [
            ...(userData.expLog || []).slice(-49),  // keep last 50 logs
            { amount, reason, date: new Date().toISOString() }
        ]
    }, { merge: true });

    return { newExp, level: newInfo.level, levelUp, ...newInfo };
}