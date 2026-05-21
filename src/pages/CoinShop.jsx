import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import API from "../services/api.js";
import Sidebar from "../components/Sidebar.jsx";
import Navbar from "../components/Navbar.jsx";
import { useTheme } from "../context/ThemeContext.jsx";

export default function CoinShop() {
    const navigate = useNavigate();
    const { themeState, refreshTheme, applyTheme } = useTheme();

    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [coins, setCoins] = useState(themeState?.coins || 0);
    const [buying, setBuying] = useState(null);
    const [search, setSearch] = useState("");
    const [purchaseCandidate, setPurchaseCandidate] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [toast, setToast] = useState(null);
    const [activeTab, setActiveTab] = useState("themes");

    const showToast = (type, message) => {
        setToast({ type, message });
        window.clearTimeout(showToast.timer);
        showToast.timer = window.setTimeout(() => setToast(null), 4000);
    };

    const fetchShop = async () => {
        setLoading(true);
        try {
            const [catRes, lvlRes] = await Promise.all([API.get("/shop/catalog"), API.get("/levels")]);
            setItems(catRes.data.items || []);
            setCoins(lvlRes.data.coins || 0);
        } catch (err) {
            showToast("error", err.response?.data?.error || err.message || "Failed to load shop");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchShop();
    }, []);

    const themeItems = useMemo(() => items.filter((item) => item.type === "themePreset"), [items]);
    const otherItems = useMemo(() => items.filter((item) => item.type !== "themePreset"), [items]);
    const filteredThemes = useMemo(() => {
        const query = search.trim().toLowerCase();
        return themeItems.filter((item) => !query || [item.title, item.rarity, item.description].some((value) => String(value || "").toLowerCase().includes(query)));
    }, [themeItems, search]);

    const handleBuy = async (item) => {
        if (item.type === "themePreset" && (item.owned || item.equipped)) {
            return handleEquip(item);
        }

        setBuying(item.id);
        try {
            const res = await API.post("/shop/purchase", { itemId: item.id });
            setCoins(res.data.coins ?? coins);
            showToast("success", res.data.message || "Purchased");
            await refreshTheme();
            await fetchShop();
        } catch (err) {
            showToast("error", err.response?.data?.error || err.response?.data?.message || err.message || "Purchase failed");
        } finally {
            setBuying(null);
        }
    };

    const handleEquip = async (item) => {
        try {
            await applyTheme(item.id);
            showToast("success", `${item.title} equipped.`);
            await refreshTheme();
            await fetchShop();
        } catch (err) {
            showToast("error", err.response?.data?.message || err.message || "Failed to equip theme");
        }
    };

    const handleOpenPurchase = (item) => {
        setPurchaseCandidate(item);
        setShowModal(true);
    };

    return (
        <div className="flex h-screen bg-[var(--theme-page-bg)] overflow-hidden">
            <Sidebar active="levels" setActive={() => {}} isOpen={false} setOpen={() => {}} handleLogout={() => {}} />
            <div className="flex-1 overflow-auto">
                <Navbar />
                <div className="mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-8 space-y-6">
                    <div className="theme-hero-bg rounded-[32px] p-6 md:p-8 text-white shadow-2xl">
                        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                            <div>
                                <p className="text-[11px] uppercase tracking-[0.3em] text-white/65">Coin Shop</p>
                                <h1 className="mt-2 text-3xl md:text-5xl font-bold">Theme Marketplace</h1>
                                <p className="mt-3 max-w-2xl text-sm md:text-base text-white/75">Buy premium presets, equip owned themes, and keep your dashboard inventory in sync with the settings page.</p>
                            </div>
                            <div className="rounded-3xl bg-white/10 px-5 py-4 backdrop-blur-md border border-white/15 min-w-[180px]">
                                <p className="text-xs uppercase tracking-[0.25em] text-white/60">Your coins</p>
                                <p className="mt-2 text-3xl font-bold">{coins} 🪙</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <button onClick={() => setActiveTab("themes")} className={`rounded-full px-4 py-2 text-sm font-semibold transition ${activeTab === "themes" ? "bg-[var(--theme-accent)] text-[var(--theme-accent-contrast)]" : "bg-white/70 text-[var(--theme-text)] border border-[var(--theme-card-border)]"}`}>Theme Presets</button>
                        <button onClick={() => setActiveTab("items")} className={`rounded-full px-4 py-2 text-sm font-semibold transition ${activeTab === "items" ? "bg-[var(--theme-accent)] text-[var(--theme-accent-contrast)]" : "bg-white/70 text-[var(--theme-text)] border border-[var(--theme-card-border)]"}`}>Other Items</button>
                        <button onClick={() => navigate("/settings")} className="rounded-full px-4 py-2 text-sm font-semibold bg-white/70 text-[var(--theme-text)] border border-[var(--theme-card-border)]">Back to Settings</button>
                    </div>

                    <div className="theme-panel rounded-[28px] p-5 md:p-6">
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <div>
                                <p className="text-sm font-semibold text-[var(--theme-text)]">Search themes</p>
                                <p className="text-xs text-[var(--theme-muted)]">Find presets by name or rarity.</p>
                            </div>
                            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search presets..." className="w-full md:max-w-md rounded-2xl border border-[var(--theme-card-border)] bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[var(--theme-accent)]" />
                        </div>
                    </div>

                    {loading ? (
                        <div className="theme-panel rounded-[28px] p-6 text-[var(--theme-muted)]">Loading shop...</div>
                    ) : (
                        <>
                            {activeTab === "themes" && (
                                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                                    {filteredThemes.map((item) => {
                                        const owned = Boolean(item.owned || item.equipped);
                                        return (
                                            <motion.div key={item.id} whileHover={{ y: -4 }} className="theme-panel overflow-hidden rounded-[28px] p-4">
                                                <img src={item.previewImage} alt={item.title} className="h-40 w-full rounded-[22px] object-cover border border-[var(--theme-card-border)]" />
                                                <div className="mt-4 flex items-start justify-between gap-3">
                                                    <div>
                                                        <h3 className="text-lg font-semibold text-[var(--theme-text)]">{item.title}</h3>
                                                        <p className="text-sm text-[var(--theme-muted)]">{item.description}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-sm font-semibold text-[var(--theme-accent)]">{item.rarity}</p>
                                                        <p className="text-xs text-[var(--theme-muted)]">{item.price} coins</p>
                                                    </div>
                                                </div>
                                                <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-[0.18em]">
                                                    {item.owned && <span className="rounded-full bg-blue-100 px-3 py-1 text-blue-700">Owned</span>}
                                                    {item.equipped && <span className="rounded-full bg-[var(--theme-accent)] px-3 py-1 text-white">Equipped</span>}
                                                    {item.locked && <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-800">Locked</span>}
                                                </div>
                                                <div className="mt-4 grid grid-cols-2 gap-2">
                                                    {owned ? (
                                                        <button onClick={() => handleEquip(item)} className="rounded-2xl bg-[var(--theme-accent)] px-4 py-3 text-sm font-semibold text-[var(--theme-accent-contrast)]">{item.equipped ? "Equipped" : "Equip"}</button>
                                                    ) : (
                                                        <button onClick={() => handleOpenPurchase(item)} disabled={buying === item.id || item.locked} className="rounded-2xl bg-amber-500 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">{buying === item.id ? "Buying..." : "Buy"}</button>
                                                    )}
                                                    <button onClick={() => handleOpenPurchase(item)} className="rounded-2xl border border-[var(--theme-card-border)] px-4 py-3 text-sm font-semibold text-[var(--theme-text)]">Preview</button>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            )}

                            {activeTab === "items" && (
                                <div className="grid gap-4 md:grid-cols-2">
                                    {otherItems.map((item) => (
                                        <div key={item.id} className="theme-panel rounded-[28px] p-5">
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <h3 className="text-lg font-semibold text-[var(--theme-text)]">{item.title}</h3>
                                                    <p className="text-sm text-[var(--theme-muted)]">{item.description}</p>
                                                </div>
                                                <p className="font-semibold text-[var(--theme-accent)]">{item.price} 🪙</p>
                                            </div>
                                            <div className="mt-4 flex justify-end">
                                                <button disabled={buying === item.id} onClick={() => handleBuy(item)} className="rounded-2xl bg-[var(--theme-accent)] px-4 py-3 text-sm font-semibold text-[var(--theme-accent-contrast)] disabled:opacity-50">{buying === item.id ? "Buying..." : "Buy"}</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            <AnimatePresence>
                {toast && (
                    <motion.div initial={{ opacity: 0, x: 24, y: -10 }} animate={{ opacity: 1, x: 0, y: 0 }} exit={{ opacity: 0, x: 24, y: -10 }} className={`fixed right-4 top-4 z-[9999] min-w-[260px] max-w-sm rounded-2xl border p-4 shadow-2xl ${toast.type === "success" ? "border-emerald-200 bg-emerald-50" : "border-red-200 bg-red-50"}`}>
                        <p className={`text-sm font-semibold ${toast.type === "success" ? "text-emerald-700" : "text-red-700"}`}>{toast.type === "success" ? "Success" : "Error"}</p>
                        <p className={`mt-1 text-sm ${toast.type === "success" ? "text-emerald-700" : "text-red-700"}`}>{toast.message}</p>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showModal && purchaseCandidate && (
                    <motion.div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/50 px-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <motion.div initial={{ scale: 0.96, y: 12 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, y: 12 }} className="w-full max-w-md rounded-[28px] bg-white p-6 shadow-2xl">
                            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--theme-muted)]">Purchase confirmation</p>
                            <h3 className="mt-2 text-2xl font-bold text-[var(--theme-text)]">{purchaseCandidate.title}</h3>
                            <p className="mt-2 text-sm text-[var(--theme-muted)]">This purchase unlocks the preset permanently and syncs it to your Purchased Themes inventory.</p>
                            <div className="mt-4 flex items-center justify-between rounded-2xl bg-black/5 px-4 py-3 text-sm">
                                <span>Price</span>
                                <span className="font-semibold">{purchaseCandidate.price} coins</span>
                            </div>
                            <div className="mt-5 flex gap-3">
                                <button onClick={() => { setShowModal(false); setPurchaseCandidate(null); }} className="flex-1 rounded-2xl border border-[var(--theme-card-border)] px-4 py-3 font-semibold text-[var(--theme-text)]">Cancel</button>
                                <button onClick={async () => {
                                    if (!purchaseCandidate) return;
                                    setBuying(purchaseCandidate.id);
                                    try {
                                        if (purchaseCandidate.owned || purchaseCandidate.equipped) {
                                            await handleEquip(purchaseCandidate);
                                        } else {
                                            await handleBuy(purchaseCandidate);
                                        }
                                        setShowModal(false);
                                        setPurchaseCandidate(null);
                                    } finally {
                                        setBuying(null);
                                    }
                                }} disabled={buying === purchaseCandidate.id} className="flex-1 rounded-2xl bg-[var(--theme-accent)] px-4 py-3 font-semibold text-[var(--theme-accent-contrast)] disabled:opacity-50">{purchaseCandidate.owned || purchaseCandidate.equipped ? "Equip Theme" : buying === purchaseCandidate.id ? "Buying..." : "Buy Theme"}</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
