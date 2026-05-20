import React, { useEffect, useState } from "react";
import API from "../services/api";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase.js";
import Sidebar from "../components/Sidebar.jsx";
import Navbar from "../components/Navbar.jsx";

const DEFAULT_LEVELS = [
  { id: 1, key: "Beginner Saver", xp: 0, reward: { type: "badge", name: "Beginner Saver Badge", description: "Unlock basic badge" }, badgeFeatures: ["Basic badge unlocked"] },
  { id: 2, key: "Budget Rookie", xp: 100, reward: { type: "coins", amount: 50, description: "+50 coins" }, badgeFeatures: ["+50 coins reward", "Starter budgeting tips"] },
  { id: 3, key: "Smart Spender", xp: 250, reward: { type: "theme", name: "New profile theme", description: "Unlock a themed profile" }, badgeFeatures: ["New profile theme", "Spending insights unlocked"] },
  { id: 4, key: "Expense Tracker", xp: 500, reward: { type: "streak", name: "Daily streak boost", description: "Boost daily streak rewards" }, badgeFeatures: ["Daily XP streak boost", "Tracker widgets unlocked"] },
  { id: 5, key: "Goal Hunter", xp: 900, reward: { type: "avatar", name: "Custom avatar", description: "Unlock custom avatar" }, badgeFeatures: ["Custom avatar unlocked", "Goal templates"] },
  { id: 6, key: "Money Planner", xp: 1400, reward: { type: "coins", amount: 150, description: "+150 coins" }, badgeFeatures: ["+150 coins reward", "Planner templates"] },
  { id: 7, key: "Wealth Builder", xp: 2000, reward: { type: "trial", name: "Premium analytics trial", description: "Access premium analytics for a limited time" }, badgeFeatures: ["Premium analytics trial", "Extended reports"] },
  { id: 8, key: "Investment Explorer", xp: 2800, reward: { type: "rareBadge", name: "Rare badge", description: "Unlock a rare badge" }, badgeFeatures: ["Rare badge unlocked", "Investment learning bundle"] },
  { id: 9, key: "Financial Strategist", xp: 3800, reward: { type: "theme", name: "Advanced dashboard theme", description: "Unlock advanced dashboard theme" }, badgeFeatures: ["Advanced dashboard theme", "Strategy templates"] },
  { id: 10, key: "MoneyPath Master", xp: 5000, reward: { type: "legend", name: "Legendary badge + exclusive title", description: "Legendary badge and exclusive title" }, badgeFeatures: ["Legendary badge", "Exclusive title", "Priority support"] },
];

function ProgressBar({ progress }) {
  return (
    <div className="w-full bg-emerald-100 rounded-full h-3 overflow-hidden">
      <div
        className="h-full bg-gradient-to-r from-emerald-500 to-emerald-300 transition-all"
        style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
      />
    </div>
  );
}

function LevelCard({ level, currentExp, onClaim }) {
  const unlocked = level.unlocked;
  const isCurrent = currentExp >= level.xp && (!level.nextXp || currentExp < level.nextXp);

  return (
    <div
      className={`relative bg-white rounded-2xl p-4 md:p-6 shadow-sm border border-emerald-100 hover:shadow-md transition-transform transform hover:-translate-y-1 ${
        isCurrent ? "ring-2 ring-emerald-300 animate-pulse" : ""
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-xl font-bold ${unlocked ? "bg-gradient-to-br from-emerald-200 to-emerald-400 text-emerald-950" : "bg-gray-100 text-gray-400"}`}>
          {level.id}
        </div>

        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-semibold text-gray-900">{level.key}</h4>
              <p className="text-xs text-emerald-700">Requires {level.xp} XP</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-emerald-700">{level.reward.type === 'coins' ? `+${level.reward.amount} 🪙` : level.reward.name || 'Reward'}</span>
            </div>
          </div>

          <div className="mt-3">
            <ProgressBar progress={Math.min(100, (Math.max(0, (currentExp - level.xp)) / Math.max(1, (level.nextXp ? level.nextXp - level.xp : 1000))) * 100)} />
            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs text-gray-500">{unlocked ? "Unlocked" : "Locked"}</span>
              <div>
                <button
                  disabled={!unlocked || level.claimed}
                  onClick={() => onClaim(level.id)}
                  className={`px-3 py-1 rounded-full text-sm font-semibold transition ${unlocked ? "bg-emerald-500 text-white hover:bg-emerald-600" : "bg-gray-200 text-gray-500"}`}
                >
                  {level.claimed ? "Claimed" : unlocked ? "Claim Reward" : "Locked"}
                </button>
              </div>
            </div>
            {level.badgeFeatures && level.badgeFeatures.length > 0 && (
              <ul className="mt-3 text-xs text-gray-600 list-disc list-inside space-y-1">
                {level.badgeFeatures.map((f, idx) => (
                  <li key={idx}>{f}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LevelsRoadmap() {
  const [data, setData] = useState({ levels: [], totalExp: 0, coins: 0, streak: 0, badges: [] });
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [activeNav, setActiveNav] = useState("levels");
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const fetch = async () => {
    setLoading(true);
    try {
      const res = await API.get("/levels");
      const totalExp = res.data.totalExp || 0;
      const levelsSource = (res.data.levels && res.data.levels.length) ? res.data.levels : DEFAULT_LEVELS;
      const levels = levelsSource.map((l, i, arr) => {
        const base = DEFAULT_LEVELS.find((d) => d.id === l.id) || {};
        const merged = { ...base, ...l };
        return { ...merged, nextXp: arr[i + 1] ? arr[i + 1].xp : null, unlocked: totalExp >= merged.xp, claimed: !!l.claimed };
      });

      setData({ levels, totalExp, coins: res.data.coins || 0, streak: res.data.streak || 0, badges: res.data.badges || [] });
    } catch (err) {
      console.error(err);
      // fallback to defaults if API fails
      const totalExp = 0;
      const levels = DEFAULT_LEVELS.map((l, i, arr) => ({ ...l, nextXp: arr[i + 1] ? arr[i + 1].xp : null, unlocked: false, claimed: false }));
      setData({ levels, totalExp, coins: 0, streak: 0, badges: [] });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetch(); }, []);

  const handleClaim = async (levelId) => {
    setClaiming(true);
    try {
      await API.post("/levels/claim", { levelId });
      await fetch();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Claim failed");
    } finally {
      setClaiming(false);
    }
  };

  const handleNavigation = (navId) => {
    const routes = {
      beranda: "/dashboard",
      edukasi: "/video",
      belajar: "/learning",
      balance: "/balance",
      tabungan: "/tabungan",
      "shared-tabungan": "/shared-tabungan",
      "shared-balance": "/shared-balance",
      rekap: "/rekap",
      levels: "/levels",
      profil: "/profile",
      settings: "/settings",
    };

    if (routes[navId]) {
      setActiveNav(navId);
      navigate(routes[navId]);
    }
  };

  const handleLogout = async () => {
    await auth.signOut();
    navigate("/login");
  };

  return (
    <div className="flex h-screen bg-emerald-50 overflow-hidden">
      <Sidebar
        active={activeNav}
        setActive={handleNavigation}
        handleLogout={handleLogout}
        isOpen={isSidebarOpen}
        setOpen={setIsSidebarOpen}
      />

      <div className="flex-1 flex flex-col overflow-hidden w-full">
        <Navbar
          profile={null}
          personal={null}
          isOpen={isProfileOpen}
          setOpen={setIsProfileOpen}
          isSidebarOpen={isSidebarOpen}
          setSidebarOpen={setIsSidebarOpen}
        />

        <div className="flex-1 overflow-y-auto">
          <div className="min-h-screen bg-emerald-50 p-4 md:p-8 pt-20 md:pt-8">
            <div className="max-w-4xl mx-auto">
              <div className="mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Level Roadmap</h2>
                  <p className="text-sm text-emerald-700">Progress your financial journey — unlock rewards and titles.</p>
                </div>

                <div className="flex gap-3 items-center flex-wrap">
                  <div className="bg-white p-3 rounded-lg shadow-sm border border-emerald-100">
                    <p className="text-xs text-gray-500">Total XP</p>
                    <p className="font-semibold text-lg text-emerald-600">{data.totalExp}</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg shadow-sm border border-emerald-100">
                    <p className="text-xs text-gray-500">Coins</p>
                    <p className="font-semibold text-lg text-emerald-700">{data.coins} 🪙</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg shadow-sm border border-emerald-100">
                    <p className="text-xs text-gray-500">Streak</p>
                    <p className="font-semibold text-lg text-emerald-700">{data.streak} 🔥</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {loading ? (
                  <div className="p-6 bg-white rounded-2xl shadow-sm border border-emerald-100 animate-pulse text-gray-600">Loading roadmap...</div>
                ) : (
                  data.levels.map((lvl) => (
                    <LevelCard key={lvl.id} level={lvl} currentExp={data.totalExp} onClaim={handleClaim} />
                  ))
                )}
              </div>

              <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-emerald-100">
                  <h4 className="font-semibold text-gray-900">Daily Challenges</h4>
                  <p className="text-sm text-gray-500">Complete quizzes, track expenses, and finish modules to earn XP.</p>
                  <ul className="mt-3 space-y-2 text-sm text-gray-700">
                    <li>• Complete Daily Quiz (+50 XP)</li>
                    <li>• Log an expense (-)</li>
                    <li>• Finish a learning module (+20 XP)</li>
                  </ul>
                </div>

                <div className="bg-white p-4 rounded-2xl shadow-sm border border-emerald-100">
                  <h4 className="font-semibold text-gray-900">Achievements</h4>
                  <div className="mt-3 flex gap-2 flex-wrap">
                    {data.badges.length === 0 ? <span className="text-sm text-gray-500">No badges yet</span> : data.badges.map((b, i) => (
                      <div key={i} className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-sm font-semibold border border-emerald-200">{b}</div>
                    ))}
                  </div>
                </div>

                <div className="bg-white p-4 rounded-2xl shadow-sm border border-emerald-100">
                  <h4 className="font-semibold text-gray-900">Quick Actions</h4>
                  <div className="mt-3 flex flex-col gap-2">
                    <button onClick={() => navigate('/profile')} className="px-3 py-2 rounded-lg bg-emerald-500 text-white font-semibold">Back to Profile</button>
                    <button onClick={() => alert('Open challenges')} className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700">Open Challenges</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
