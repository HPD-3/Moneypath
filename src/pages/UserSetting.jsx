import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase.js";
import { sendPasswordResetEmail, deleteUser, reauthenticateWithCredential, EmailAuthProvider, signOut } from "firebase/auth";
import { motion, AnimatePresence } from "framer-motion";
import API from "../services/api.js";
import Sidebar from "../components/Sidebar.jsx";
import Navbar from "../components/Navbar.jsx";
import BadgeIllustration from "../components/BadgeIllustration.jsx";
import { useTheme } from "../context/ThemeContext.jsx";
import {
    DEFAULT_THEME_ID,
    THEME_LEVEL_UNLOCK,
    THEME_PRESETS,
    buildThemePreviewStyle,
    buildThemeVariables,
    getThemePresetById,
    normalizeThemeState,
} from "../../server/themePresets.shared.js";
import "../Profile.css";

function SectionShell({ title, eyebrow, children, className = "" }) {
    return (
        <section className={`theme-panel rounded-[28px] p-5 md:p-6 ${className}`}>
            <div className="mb-5">
                {eyebrow && <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-[var(--theme-surface-muted)] mb-2">{eyebrow}</p>}
                <h2 className="text-xl md:text-2xl font-bold text-[var(--theme-surface-text)]">{title}</h2>
            </div>
            {children}
        </section>
    );
}

function Field({ label, children, hint }) {
    return (
        <label className="block space-y-2">
            <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-[var(--theme-surface-text)]">{label}</span>
                {hint && <span className="text-[11px] text-[var(--theme-surface-muted)]">{hint}</span>}
            </div>
            {children}
        </label>
    );
}

function Toggle({ checked, onChange, label, description, disabled = false }) {
    return (
        <button
            type="button"
            onClick={() => !disabled && onChange(!checked)}
            className={`w-full rounded-2xl border p-4 text-left transition bg-[var(--theme-surface)] ${checked ? "border-[var(--theme-accent)]" : "border-[var(--theme-card-border)]"} ${disabled ? "opacity-50 cursor-not-allowed" : "hover:-translate-y-0.5"}`}
            disabled={disabled}
        >
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="font-semibold text-[var(--theme-surface-text)]">{label}</p>
                    <p className="text-sm text-[var(--theme-surface-muted)] mt-1">{description}</p>
                </div>
                <span className={`h-6 w-11 rounded-full border p-1 transition ${checked ? "bg-[var(--theme-accent)] border-[var(--theme-accent)]" : "bg-gray-200 border-gray-300"}`}>
                    <span className={`block h-4 w-4 rounded-full bg-white transition ${checked ? "translate-x-5" : "translate-x-0"}`} />
                </span>
            </div>
        </button>
    );
}

export default function UserSetting() {
    const navigate = useNavigate();
    const { themeState, themeMeta, themeLoading, themeError, currentPreset, presets, applyTheme, saveTheme, toggleFavoriteTheme, randomizeTheme, refreshTheme, exportTheme, importTheme } = useTheme();

    const [profile, setProfile] = useState(null);
    const [badgeSettings, setBadgeSettings] = useState(null);
    const [badgeLoading, setBadgeLoading] = useState(false);
    const [badgeError, setBadgeError] = useState("");
    const [selectedBadge, setSelectedBadge] = useState("");

    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [toast, setToast] = useState(null);
    const [showEditProfile, setShowEditProfile] = useState(false);
    const [editProfileLoading, setEditProfileLoading] = useState(false);
    const [editForm, setEditForm] = useState({ name: "", phoneNumber: "", dateOfBirth: "", gender: "", address: "" });
    const [avatarLoading, setAvatarLoading] = useState(false);

    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
    const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);

    const [showDeleteAccount, setShowDeleteAccount] = useState(false);
    const [deleteConfirmPassword, setDeleteConfirmPassword] = useState("");
    const [deleteAccountLoading, setDeleteAccountLoading] = useState(false);

    const [themeDraft, setThemeDraft] = useState(themeState);
    const [themeSearch, setThemeSearch] = useState("");
    const [themeImportText, setThemeImportText] = useState("");
    const [showPurchaseModal, setShowPurchaseModal] = useState(false);
    const [purchaseCandidate, setPurchaseCandidate] = useState(null);
    const [purchaseLoading, setPurchaseLoading] = useState(false);
    const [purchaseSuccess, setPurchaseSuccess] = useState("");
    const [showThemeStudio, setShowThemeStudio] = useState(false);

    const avatarInputRef = useRef(null);
    const importInputRef = useRef(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [personalRes, settingsRes, badgeRes] = await Promise.all([
                    API.get("/personal/profile"),
                    API.get("/settings/profile"),
                    API.get("/settings/badges"),
                ]);

                setProfile({ ...personalRes.data, ...settingsRes.data });
                setEditForm({
                    name: personalRes.data?.name || settingsRes.data?.name || "",
                    phoneNumber: personalRes.data?.phoneNumber || settingsRes.data?.phoneNumber || "",
                    dateOfBirth: personalRes.data?.dateOfBirth || settingsRes.data?.dateOfBirth || "",
                    gender: personalRes.data?.gender || settingsRes.data?.gender || "",
                    address: personalRes.data?.address || settingsRes.data?.address || "",
                });
                setForgotPasswordEmail(auth.currentUser?.email || "");

                setBadgeSettings(badgeRes.data);
                setSelectedBadge(badgeRes.data?.activeBadge || "");
            } catch (err) {
                showToast("error", err.response?.data?.message || "Failed to load settings");
            }
        };

        fetchData();
    }, []);

    useEffect(() => {
        setThemeDraft(themeState);
    }, [themeState]);

    const showToast = (type, message) => {
        setToast({ type, message });
        window.clearTimeout(showToast.timer);
        showToast.timer = window.setTimeout(() => setToast(null), 4000);
    };

    const availablePresets = useMemo(() => {
        const query = themeSearch.trim().toLowerCase();
        return presets.filter((preset) => !query || [preset.name, preset.rarity, preset.description].some((value) => String(value || "").toLowerCase().includes(query)));
    }, [presets, themeSearch]);

    const ownedPresets = useMemo(() => {
        const owned = new Set([...(themeState.purchasedThemes || []), ...(themeState.ownedThemes || [])]);
        return presets.filter((preset) => preset.isFree || owned.has(preset.id));
    }, [presets, themeState.purchasedThemes, themeState.ownedThemes]);

    const themeAccessLocked = !themeMeta.themeAccessUnlocked;
    const currentPreviewPreset = getThemePresetById(themeDraft.activeTheme || currentPreset?.id);
    const previewStyles = buildThemeVariables(currentPreviewPreset, themeDraft);
    const previewPanelStyle = {
        ...buildThemePreviewStyle(currentPreviewPreset, themeDraft),
        background: currentPreviewPreset.gradients.hero,
        color: currentPreviewPreset.colors.text,
        overflow: "hidden",
    };

    const updateDraft = (patch) => setThemeDraft((prev) => normalizeThemeState({ ...prev, ...patch }));

    const handleSaveTheme = async () => {
        try {
            await saveTheme(themeDraft);
            showToast("success", "Theme saved and synced.");
        } catch (err) {
            showToast("error", err.response?.data?.message || err.message || "Failed to save theme");
        }
    };

    const handleApplyPreset = async (preset) => {
        try {
            const result = await applyTheme(preset.id);
            const appliedState = normalizeThemeState(result?.themeState || {
                ...themeDraft,
                activeTheme: preset.id,
                customColors: { ...preset.colors },
            });
            setThemeDraft(appliedState);
            showToast("success", `${preset.name} equipped.`);
        } catch (err) {
            showToast("error", err.response?.data?.message || err.message || "Failed to apply theme");
        }
    };

    const handleResetDefaultTheme = async () => {
        const defaultPreset = getThemePresetById(DEFAULT_THEME_ID);
        await handleApplyPreset(defaultPreset);
    };

    const handlePurchaseTheme = async () => {
        if (!purchaseCandidate) return;
        setPurchaseLoading(true);
        try {
            const res = await API.post("/shop/purchase", { itemId: purchaseCandidate.id });
            await refreshTheme();
            setThemeDraft((prev) => normalizeThemeState({ ...prev, activeTheme: purchaseCandidate.id }));
            setPurchaseSuccess(`${purchaseCandidate.name} unlocked.`);
            showToast("success", res.data?.message || `${purchaseCandidate.name} purchased`);
            window.setTimeout(() => setPurchaseSuccess(""), 2200);
            setShowPurchaseModal(false);
            setPurchaseCandidate(null);
        } catch (err) {
            showToast("error", err.response?.data?.error || err.response?.data?.message || err.message || "Purchase failed");
        } finally {
            setPurchaseLoading(false);
        }
    };

    const handleRandomize = async () => {
        try {
            await randomizeTheme();
            await refreshTheme();
            showToast("success", "Theme randomized.");
        } catch (err) {
            showToast("error", err.response?.data?.message || err.message || "Failed to randomize theme");
        }
    };

    const handleExportTheme = () => {
        const blob = new Blob([exportTheme()], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = `moneypath-theme-${themeDraft.activeTheme}.json`;
        anchor.click();
        URL.revokeObjectURL(url);
        showToast("success", "Theme exported.");
    };

    const handleImportTheme = async (payloadText) => {
        try {
            await importTheme(payloadText || themeImportText);
            await refreshTheme();
            showToast("success", "Theme imported.");
            setThemeImportText("");
        } catch (err) {
            showToast("error", err.message || "Failed to import theme");
        }
    };

    const handleBadgeSave = async () => {
        try {
            setBadgeLoading(true);
            await API.post("/settings/badges", { activeBadge: selectedBadge });
            const res = await API.get("/settings/badges");
            setBadgeSettings(res.data);
            showToast("success", "Badge saved.");
        } catch (err) {
            setBadgeError(err.response?.data?.message || "Failed to save badge settings");
        } finally {
            setBadgeLoading(false);
        }
    };

    const handleEditProfileChange = (e) => {
        const { name, value } = e.target;
        setEditForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleEditProfileSubmit = async (e) => {
        e.preventDefault();
        try {
            setEditProfileLoading(true);
            await API.post("/personal/profile", editForm);
            setProfile({ ...profile, ...editForm });
            showToast("success", "Profile updated successfully.");
            setShowEditProfile(false);
        } catch (err) {
            showToast("error", err.response?.data?.message || "Failed to update profile");
        } finally {
            setEditProfileLoading(false);
        }
    };

    const handleAvatarFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            showToast("error", "Please choose an image file.");
            e.target.value = "";
            return;
        }

        try {
            setAvatarLoading(true);
            const base64 = await fileToBase64(file);
            const payload = {
                avatarBase64: base64,
                fileName: file.name,
                mimeType: file.type,
            };

            const res = await API.post("/settings/avatar/upload", payload);
            setProfile((prev) => ({
                ...(prev || {}),
                avatarUrl: res.data?.avatarUrl || "",
                avatarStoragePath: res.data?.storagePath || "",
            }));
            showToast("success", "Avatar updated.");
        } catch (err) {
            showToast("error", err.response?.data?.message || err.message || "Failed to upload avatar");
        } finally {
            setAvatarLoading(false);
            e.target.value = "";
        }
    };

    const handleRemoveAvatar = async () => {
        try {
            setAvatarLoading(true);
            await API.post("/settings/avatar/delete");
            setProfile((prev) => ({
                ...(prev || {}),
                avatarUrl: "",
                avatarStoragePath: "",
            }));
            showToast("success", "Avatar removed.");
        } catch (err) {
            showToast("error", err.response?.data?.message || err.message || "Failed to remove avatar");
        } finally {
            setAvatarLoading(false);
        }
    };

    const handleForgotPassword = async (e) => {
        e.preventDefault();
        try {
            setForgotPasswordLoading(true);
            await sendPasswordResetEmail(auth, forgotPasswordEmail);
            setShowForgotPassword(false);
            showToast("success", "Password reset email sent.");
        } catch (err) {
            showToast("error", err.message || "Failed to send password reset email");
        } finally {
            setForgotPasswordLoading(false);
        }
    };

    const handleDeleteAccount = async (e) => {
        e.preventDefault();

        if (!deleteConfirmPassword) {
            showToast("error", "Please enter your password to confirm deletion");
            return;
        }

        try {
            setDeleteAccountLoading(true);
            const currentUser = auth.currentUser;
            if (!currentUser?.email) {
                showToast("error", "No authenticated user found.");
                return;
            }

            const credential = EmailAuthProvider.credential(currentUser.email, deleteConfirmPassword);
            await reauthenticateWithCredential(currentUser, credential);
            await API.post("/settings/delete-account", { password: deleteConfirmPassword });
            await deleteUser(currentUser);
            await signOut(auth);
            navigate("/login");
        } catch (err) {
            showToast("error", err.response?.data?.message || err.message || "Failed to delete account");
        } finally {
            setDeleteAccountLoading(false);
        }
    };

    const handleLogout = async () => {
        await signOut(auth);
        navigate("/login");
    };

    function fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const result = String(reader.result || "");
                resolve(result.includes(",") ? result.split(",")[1] : result);
            };
            reader.onerror = () => reject(new Error("Failed to read image file"));
            reader.readAsDataURL(file);
        });
    }

    if (themeLoading && !profile) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--theme-page-bg)] text-[var(--theme-text)]">
                <p className="text-sm text-[var(--theme-muted)]">Loading theme settings...</p>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-[var(--theme-page-bg)] overflow-hidden">
            <Sidebar active="settings" setActive={() => {}} handleLogout={handleLogout} isOpen={isSidebarOpen} setOpen={setIsSidebarOpen} />
            <div className="flex-1 overflow-auto">
                <Navbar profile={profile} personal={profile} isSidebarOpen={isSidebarOpen} setSidebarOpen={setIsSidebarOpen} />

                <div className="mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-8 space-y-6">
                    <div className="theme-hero-bg relative overflow-hidden rounded-[32px] p-6 md:p-8 text-white shadow-2xl">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.22),transparent_40%)]" />
                        <div className="relative flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                            <div>
                                <p className="text-[11px] uppercase tracking-[0.3em] text-white/65">Advanced Dashboard Theme Customization</p>
                                <h1 className="mt-2 text-3xl md:text-5xl font-bold">Settings</h1>
                                <p className="mt-3 max-w-2xl text-sm md:text-base text-white/75">Build, save, purchase, and equip fintech themes with persistent inventory support and instant CSS variable updates.</p>
                            </div>
                            <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                                <div className="rounded-2xl bg-white/10 px-4 py-3 backdrop-blur-md border border-white/15">
                                    <p className="text-white/60 text-xs uppercase tracking-[0.2em]">Level</p>
                                    <p className="text-lg font-semibold">{themeMeta.level || 1}</p>
                                </div>
                                <div className="rounded-2xl bg-white/10 px-4 py-3 backdrop-blur-md border border-white/15">
                                    <p className="text-white/60 text-xs uppercase tracking-[0.2em]">Coins</p>
                                    <p className="text-lg font-semibold">{themeMeta.coins || 0} 🪙</p>
                                </div>
                                <div className="rounded-2xl bg-white/10 px-4 py-3 backdrop-blur-md border border-white/15">
                                    <p className="text-white/60 text-xs uppercase tracking-[0.2em]">Owned Themes</p>
                                    <p className="text-lg font-semibold">{ownedPresets.length}</p>
                                </div>
                                <div className="rounded-2xl bg-white/10 px-4 py-3 backdrop-blur-md border border-white/15">
                                    <p className="text-white/60 text-xs uppercase tracking-[0.2em]">Status</p>
                                    <p className="text-lg font-semibold">{themeAccessLocked ? `Locked until level ${THEME_LEVEL_UNLOCK}` : "Unlocked"}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {themeError && <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{themeError}</div>}

                    <div className="space-y-6">
                        <SectionShell title="Dashboard Theme" eyebrow="Theme Engine">
                            <div className="rounded-[24px] border border-[var(--theme-card-border)] bg-[var(--theme-surface)] p-4 backdrop-blur-lg space-y-4">
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <p className="text-sm font-semibold text-[var(--theme-surface-text)]">{currentPreviewPreset.name}</p>
                                        <p className="text-xs text-[var(--theme-surface-muted)]">Open the theme studio to edit colors and preview changes in a popup.</p>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        <button onClick={() => setShowThemeStudio(true)} className="rounded-2xl bg-[var(--theme-accent)] px-4 py-3 text-sm font-semibold text-[var(--theme-accent-contrast)]">Open Theme Studio</button>
                                        <button onClick={handleResetDefaultTheme} disabled={themeAccessLocked} className="rounded-2xl border border-[var(--theme-accent)] px-4 py-3 text-sm font-semibold text-[var(--theme-accent)] disabled:opacity-50">Default Theme</button>
                                    </div>
                                </div>

                                <div className="rounded-[20px] border border-[var(--theme-card-border)] bg-[var(--theme-surface-solid)] p-4">
                                    <p className="text-sm font-semibold text-[var(--theme-surface-text)]">Inventory</p>
                                    <p className="text-xs text-[var(--theme-surface-muted)]">Equipped themes and favorites stay accessible here.</p>
                                    <div className="mt-3">
                                        <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--theme-surface-muted)]">Owned themes</p>
                                        <p className="mt-1 text-lg font-semibold text-[var(--theme-surface-text)]">{ownedPresets.length}</p>
                                    </div>
                                </div>
                            </div>
                        </SectionShell>

                            <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
                                <SectionShell title="Theme Shop Access" eyebrow="Unlock Gate">
                                    <div className="rounded-[24px] border border-[var(--theme-card-border)] bg-[var(--theme-surface)] p-4">
                                        <p className="text-sm text-[var(--theme-surface-muted)]">Advanced theme customization unlocks at Level {THEME_LEVEL_UNLOCK}. Premium presets remain purchasable only after the gate is opened.</p>
                                        <div className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                                            <div className="rounded-2xl bg-[var(--theme-surface-solid)] p-3 border border-[var(--theme-card-border)]">
                                                <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--theme-surface-muted)]">Your Level</p>
                                                <p className="mt-1 text-lg font-semibold text-[var(--theme-surface-text)]">{themeMeta.level || 1}</p>
                                            </div>
                                            <div className="rounded-2xl bg-[var(--theme-surface-solid)] p-3 border border-[var(--theme-card-border)]">
                                                <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--theme-surface-muted)]">Shop Coins</p>
                                                <p className="mt-1 text-lg font-semibold text-[var(--theme-surface-text)]">{themeMeta.coins || 0} 🪙</p>
                                            </div>
                                        </div>
                                        <button onClick={() => navigate("/shop")} className="mt-4 w-full rounded-2xl bg-[var(--theme-gradient)] px-4 py-3 font-semibold text-black">Open Theme Shop</button>
                                    </div>
                                </SectionShell>

                                <SectionShell title="Purchased Themes" eyebrow="Inventory">
                                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3 max-h-[420px] overflow-y-auto pr-1">
                                        {ownedPresets.map((preset) => {
                                            const isActive = themeDraft.activeTheme === preset.id;
                                            return (
                                                <div key={preset.id} className="rounded-[22px] border border-[var(--theme-card-border)] bg-[var(--theme-surface)] p-3 h-full">
                                                    <div className="flex flex-col gap-3">
                                                        <img src={preset.previewImage} alt={preset.name} className="h-32 w-full rounded-2xl object-cover border border-[var(--theme-card-border)]" />
                                                        <div className="min-w-0 flex-1">
                                                            <div className="flex flex-wrap items-center gap-2">
                                                                <h3 className="font-semibold text-[var(--theme-surface-text)]">{preset.name}</h3>
                                                                <span className="rounded-full bg-black/5 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--theme-surface-muted)]">{preset.rarity}</span>
                                                                {isActive && <span className="rounded-full bg-[var(--theme-accent)] px-2 py-1 text-[10px] font-semibold text-white">Equipped</span>}
                                                                <button type="button" onClick={() => toggleFavoriteTheme(preset.id)} className="ml-auto text-xs font-semibold text-[var(--theme-accent)]">{themeState.favoriteThemes?.includes(preset.id) ? "★ Favorite" : "☆ Favorite"}</button>
                                                            </div>
                                                            <p className="mt-1 text-sm text-[var(--theme-surface-muted)]">{preset.description}</p>
                                                            <div className="mt-3 flex flex-wrap gap-2">
                                                                <button onClick={() => handleApplyPreset(preset)} className="rounded-full bg-[var(--theme-accent)] px-4 py-2 text-xs font-semibold text-[var(--theme-accent-contrast)]">Quick Apply</button>
                                                                {!preset.isFree && <span className="rounded-full border border-[var(--theme-card-border)] px-3 py-2 text-xs font-semibold text-[var(--theme-surface-muted)]">Owned</span>}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </SectionShell>
                            </div>
                    </div>

                    <SectionShell title="Layout Customization" eyebrow="Dashboard Behavior">
                        <div className="grid gap-3 md:grid-cols-3">
                            <Toggle checked={Boolean(themeDraft.sidebarSettings?.compact)} onChange={(next) => updateDraft({ sidebarSettings: { ...themeDraft.sidebarSettings, compact: next } })} label="Compact Sidebar" description="Tightens navigation spacing for dense dashboard workspaces." disabled={themeAccessLocked} />
                            <Toggle checked={themeDraft.dashboardSettings?.density === "compact"} onChange={(next) => updateDraft({ dashboardSettings: { ...themeDraft.dashboardSettings, density: next ? "compact" : "comfortable" } })} label="Compact Density" description="Use tighter cards and padding for power users." disabled={themeAccessLocked} />
                            <Toggle checked={Boolean(themeDraft.dashboardSettings?.animationsEnabled)} onChange={(next) => updateDraft({ dashboardSettings: { ...themeDraft.dashboardSettings, animationsEnabled: next } })} label="Theme Animations" description="Enable smoother transitions between theme states." disabled={themeAccessLocked} />
                        </div>
                    </SectionShell>

                    <SectionShell title="Badge Settings" eyebrow="Legacy Progress">
                        {badgeSettings ? (
                            <div className="space-y-4">
                                <div className="rounded-[24px] bg-[var(--theme-gradient)] p-4 text-white flex items-center gap-4">
                                    <BadgeIllustration tone="gold" active size={72} />
                                    <div>
                                        <p className="text-xs uppercase tracking-[0.3em] text-white/60">Active badge</p>
                                        <p className="text-lg font-semibold">{badgeSettings.activeBadge || "None selected"}</p>
                                    </div>
                                </div>
                                <div className="grid gap-3 md:grid-cols-2">
                                    {(badgeSettings.badgeCatalog || []).map((badge) => {
                                        const unlocked = (badgeSettings.unlockedBadges || []).includes(badge.name);
                                        const selected = selectedBadge === badge.name;
                                        return (
                                            <button key={badge.id} type="button" onClick={() => unlocked && setSelectedBadge(badge.name)} className={`rounded-2xl border p-4 text-left transition ${selected ? "border-[var(--theme-accent)] bg-[var(--theme-surface-solid)]" : unlocked ? "border-[var(--theme-card-border)] bg-[var(--theme-surface)]" : "border-gray-200 bg-gray-100 opacity-60"}`}>
                                                <div className="flex items-center gap-3">
                                                    <BadgeIllustration tone="emerald" active={selected} size={56} />
                                                    <div>
                                                        <p className="font-semibold text-[var(--theme-surface-text)]">{badge.title}</p>
                                                        <p className="text-sm text-[var(--theme-surface-muted)]">{badge.rewardText}</p>
                                                    </div>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                                {badgeError && <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{badgeError}</div>}
                                <button onClick={handleBadgeSave} disabled={badgeLoading} className="rounded-2xl bg-[var(--theme-accent)] px-4 py-3 font-semibold text-[var(--theme-accent-contrast)] disabled:opacity-50">{badgeLoading ? "Saving..." : "Save Badge"}</button>
                            </div>
                        ) : <p className="text-sm text-[var(--theme-surface-muted)]">Loading badges...</p>}
                    </SectionShell>

                    <SectionShell title="Account Information" eyebrow="Profile">
                        <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarFileChange} />
                        <div className="mb-5 flex flex-col gap-4 rounded-[24px] border border-[var(--theme-card-border)] bg-[var(--theme-surface)] p-4 md:flex-row md:items-center md:justify-between">
                            <div className="flex items-center gap-4">
                                <div
                                    className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-[var(--theme-surface-solid)]"
                                    style={{
                                        border: profile?.avatarBorder === "border_gold" ? "3px solid #d4af37" : "2px solid var(--theme-card-border)",
                                        boxShadow: profile?.avatarBorder === "border_gold" ? "0 4px 18px rgba(212,175,55,0.25)" : "none",
                                    }}
                                >
                                    {profile?.avatarUrl ? (
                                        <img src={profile.avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                                    ) : (
                                        <span className="text-xl font-bold text-[var(--theme-surface-muted)]">{(profile?.name || auth.currentUser?.email || "U").slice(0, 1).toUpperCase()}</span>
                                    )}
                                </div>
                                <div>
                                    <p className="text-xs uppercase tracking-[0.24em] text-[var(--theme-surface-muted)]">Avatar</p>
                                    <p className="mt-1 font-semibold text-[var(--theme-surface-text)]">Upload or replace your profile picture</p>
                                    <p className="text-sm text-[var(--theme-surface-muted)]">Used in the navbar and your profile card.</p>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-3">
                                <button type="button" onClick={() => avatarInputRef.current?.click()} disabled={avatarLoading} className="rounded-2xl bg-[var(--theme-accent)] px-4 py-3 font-semibold text-[var(--theme-accent-contrast)] disabled:opacity-50">{avatarLoading ? "Uploading..." : "Change Avatar"}</button>
                                <button type="button" onClick={handleRemoveAvatar} disabled={avatarLoading || !profile?.avatarUrl} className="rounded-2xl border border-[var(--theme-card-border)] px-4 py-3 font-semibold text-[var(--theme-text)] disabled:opacity-50">Remove Avatar</button>
                            </div>
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="rounded-[22px] border border-[var(--theme-card-border)] bg-[var(--theme-surface)] p-4 md:col-span-2">
                                <p className="text-xs uppercase tracking-[0.24em] text-[var(--theme-surface-muted)]">Name</p>
                                <p className="mt-1 font-semibold text-[var(--theme-surface-text)]">{profile?.name || "N/A"}</p>
                            </div>
                            <div className="rounded-[22px] border border-[var(--theme-card-border)] bg-[var(--theme-surface)] p-4">
                                <p className="text-xs uppercase tracking-[0.24em] text-[var(--theme-surface-muted)]">Email</p>
                                <p className="mt-1 font-semibold text-[var(--theme-surface-text)]">{auth.currentUser?.email || "N/A"}</p>
                            </div>
                            <div className="rounded-[22px] border border-[var(--theme-card-border)] bg-[var(--theme-surface)] p-4">
                                <p className="text-xs uppercase tracking-[0.24em] text-[var(--theme-surface-muted)]">Phone</p>
                                <p className="mt-1 font-semibold text-[var(--theme-surface-text)]">{profile?.phoneNumber || "N/A"}</p>
                            </div>
                            <div className="rounded-[22px] border border-[var(--theme-card-border)] bg-[var(--theme-surface)] p-4">
                                <p className="text-xs uppercase tracking-[0.24em] text-[var(--theme-surface-muted)]">Gender</p>
                                <p className="mt-1 font-semibold text-[var(--theme-surface-text)]">{profile?.gender || "N/A"}</p>
                            </div>
                            <div className="rounded-[22px] border border-[var(--theme-card-border)] bg-[var(--theme-surface)] p-4">
                                <p className="text-xs uppercase tracking-[0.24em] text-[var(--theme-surface-muted)]">Birth Date</p>
                                <p className="mt-1 font-semibold text-[var(--theme-surface-text)]">{profile?.dateOfBirth || "N/A"}</p>
                            </div>
                            <div className="rounded-[22px] border border-[var(--theme-card-border)] bg-[var(--theme-surface)] p-4 md:col-span-2">
                                <p className="text-xs uppercase tracking-[0.24em] text-[var(--theme-surface-muted)]">Address</p>
                                <p className="mt-1 font-semibold text-[var(--theme-surface-text)]">{profile?.address || "N/A"}</p>
                            </div>
                        </div>

                        <div className="mt-4 flex gap-3">
                            <button onClick={() => setShowEditProfile((prev) => !prev)} className="rounded-2xl border border-[var(--theme-card-border)] px-4 py-3 font-semibold text-[var(--theme-text)]">{showEditProfile ? "Close" : "Edit Profile"}</button>
                        </div>

                        <AnimatePresence>
                            {showEditProfile && (
                                <motion.form initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} onSubmit={handleEditProfileSubmit} className="mt-4 grid gap-4 rounded-[24px] border border-[var(--theme-card-border)] bg-[var(--theme-surface)] p-4 md:grid-cols-2">
                                    <Field label="Full Name"><input name="name" value={editForm.name} onChange={handleEditProfileChange} className="w-full rounded-2xl border border-[var(--theme-card-border)] bg-[var(--theme-surface-solid)] px-4 py-3 text-[var(--theme-surface-text)] outline-none focus:ring-2 focus:ring-[var(--theme-accent)]" /></Field>
                                    <Field label="Phone Number"><input name="phoneNumber" value={editForm.phoneNumber} onChange={handleEditProfileChange} className="w-full rounded-2xl border border-[var(--theme-card-border)] bg-[var(--theme-surface-solid)] px-4 py-3 text-[var(--theme-surface-text)] outline-none focus:ring-2 focus:ring-[var(--theme-accent)]" /></Field>
                                    <Field label="Date of Birth"><input type="date" name="dateOfBirth" value={editForm.dateOfBirth} onChange={handleEditProfileChange} className="w-full rounded-2xl border border-[var(--theme-card-border)] bg-[var(--theme-surface-solid)] px-4 py-3 text-[var(--theme-surface-text)] outline-none focus:ring-2 focus:ring-[var(--theme-accent)]" /></Field>
                                    <Field label="Gender"><select name="gender" value={editForm.gender} onChange={handleEditProfileChange} className="w-full rounded-2xl border border-[var(--theme-card-border)] bg-[var(--theme-surface-solid)] px-4 py-3 text-[var(--theme-surface-text)] outline-none focus:ring-2 focus:ring-[var(--theme-accent)]"><option value="">Select Gender</option><option value="Male">Male</option><option value="Female">Female</option></select></Field>
                                    <Field label="Address" hint="Visible in your profile"><textarea name="address" value={editForm.address} onChange={handleEditProfileChange} rows={3} className="md:col-span-2 w-full rounded-2xl border border-[var(--theme-card-border)] bg-[var(--theme-surface-solid)] px-4 py-3 text-[var(--theme-surface-text)] outline-none focus:ring-2 focus:ring-[var(--theme-accent)]" /></Field>
                                    <button type="submit" disabled={editProfileLoading} className="md:col-span-2 rounded-2xl bg-[var(--theme-accent)] px-4 py-3 font-semibold text-[var(--theme-accent-contrast)] disabled:opacity-50">{editProfileLoading ? "Saving..." : "Save Profile"}</button>
                                </motion.form>
                            )}
                        </AnimatePresence>
                    </SectionShell>

                    <SectionShell title="Account Security" eyebrow="Recovery">
                        <button onClick={() => setShowForgotPassword((prev) => !prev)} className="rounded-2xl border border-[var(--theme-card-border)] px-4 py-3 font-semibold text-[var(--theme-text)]">{showForgotPassword ? "Cancel" : "Reset Password"}</button>
                        <AnimatePresence>
                            {showForgotPassword && (
                                <motion.form initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} onSubmit={handleForgotPassword} className="mt-4 space-y-4 rounded-[24px] border border-[var(--theme-card-border)] bg-[var(--theme-surface)] p-4">
                                    <Field label="Email Address"><input type="email" value={forgotPasswordEmail} onChange={(e) => setForgotPasswordEmail(e.target.value)} className="w-full rounded-2xl border border-[var(--theme-card-border)] bg-[var(--theme-surface-solid)] px-4 py-3 text-[var(--theme-surface-text)] outline-none focus:ring-2 focus:ring-[var(--theme-accent)]" /></Field>
                                    <button type="submit" disabled={forgotPasswordLoading} className="rounded-2xl bg-[var(--theme-accent)] px-4 py-3 font-semibold text-[var(--theme-accent-contrast)] disabled:opacity-50">{forgotPasswordLoading ? "Sending..." : "Send Reset Link"}</button>
                                </motion.form>
                            )}
                        </AnimatePresence>
                    </SectionShell>

                    <SectionShell title="Danger Zone" eyebrow="Irreversible Actions">
                        <button onClick={() => setShowDeleteAccount((prev) => !prev)} className="rounded-2xl bg-red-500 px-4 py-3 font-semibold text-white">{showDeleteAccount ? "Cancel" : "Delete Account"}</button>
                        <AnimatePresence>
                            {showDeleteAccount && (
                                <motion.form initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} onSubmit={handleDeleteAccount} className="mt-4 space-y-4 rounded-[24px] border border-red-200 bg-red-50 p-4">
                                    <p className="text-sm font-semibold text-red-700">This action cannot be undone. All your data will be permanently deleted.</p>
                                    <Field label="Password"><input type="password" value={deleteConfirmPassword} onChange={(e) => setDeleteConfirmPassword(e.target.value)} className="w-full rounded-2xl border border-red-200 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-red-500" /></Field>
                                    <button type="submit" disabled={deleteAccountLoading} className="rounded-2xl bg-red-600 px-4 py-3 font-semibold text-white disabled:opacity-50">{deleteAccountLoading ? "Deleting..." : "Confirm Delete"}</button>
                                </motion.form>
                            )}
                        </AnimatePresence>
                    </SectionShell>
                </div>
            </div>

            <AnimatePresence>
                {showThemeStudio && (
                    <motion.div className="fixed inset-0 z-[9997] flex items-center justify-center bg-black/60 px-4 py-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <motion.div initial={{ scale: 0.96, y: 12 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, y: 12 }} className="w-full max-w-6xl max-h-[92vh] overflow-y-auto rounded-[32px] border border-[var(--theme-card-border)] bg-[var(--theme-surface-solid)] p-5 md:p-6 shadow-2xl">
                            <div className="flex items-start justify-between gap-4 mb-5">
                                <div>
                                    <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--theme-surface-muted)]">Theme Studio</p>
                                    <h3 className="mt-1 text-2xl md:text-3xl font-bold text-[var(--theme-surface-text)]">Live Preview and Custom Settings</h3>
                                </div>
                                <button onClick={() => setShowThemeStudio(false)} className="rounded-2xl border border-[var(--theme-card-border)] px-4 py-3 text-sm font-semibold text-[var(--theme-surface-text)]">Close</button>
                            </div>

                            <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
                                <motion.div layout className="rounded-[28px] p-4 md:p-5" style={previewPanelStyle}>
                                    <div className="flex items-center justify-between gap-4 mb-4">
                                        <div>
                                            <p className="text-[11px] uppercase tracking-[0.24em] text-white/65">Live preview</p>
                                            <h3 className="text-2xl font-bold">{currentPreviewPreset.name}</h3>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {currentPreviewPreset.isFree ? <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white">Free</span> : <span className="rounded-full bg-black/20 px-3 py-1 text-xs font-semibold text-white">{currentPreviewPreset.rarity}</span>}
                                        </div>
                                    </div>

                                    <div className="grid gap-4 md:grid-cols-3">
                                        <div className="rounded-3xl border border-white/20 bg-white/12 p-4 backdrop-blur-xl">
                                            <p className="text-xs uppercase tracking-[0.24em] text-white/65">Sidebar</p>
                                            <div className="mt-3 h-24 rounded-2xl" style={{ background: previewStyles["--theme-sidebar-bg"] }} />
                                        </div>
                                        <div className="rounded-3xl border border-white/20 bg-white/12 p-4 backdrop-blur-xl">
                                            <p className="text-xs uppercase tracking-[0.24em] text-white/65">Cards</p>
                                            <div className="mt-3 h-24 rounded-2xl" style={{ background: previewStyles["--theme-card-bg"] }} />
                                        </div>
                                        <div className="rounded-3xl border border-white/20 bg-white/12 p-4 backdrop-blur-xl">
                                            <p className="text-xs uppercase tracking-[0.24em] text-white/65">Accent</p>
                                            <div className="mt-3 h-24 rounded-2xl theme-accent-bg" />
                                        </div>
                                    </div>

                                    <div className="mt-4 rounded-[24px] border border-white/20 bg-white/12 p-4 backdrop-blur-xl">
                                        <div className="flex items-center justify-between gap-4">
                                            <div>
                                                <p className="text-sm font-semibold text-white">Glassmorphism</p>
                                                <p className="text-xs text-white/65">{themeDraft.dashboardSettings?.glassmorphism ? "Enabled" : "Disabled"}</p>
                                            </div>
                                            <div className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white">{themeDraft.themeMode === "dark" ? "Dark" : "Light"} mode</div>
                                        </div>
                                        <div className="mt-4 grid gap-3 md:grid-cols-3">
                                            <Toggle checked={themeDraft.themeMode === "dark"} onChange={(next) => updateDraft({ themeMode: next ? "dark" : "light" })} label="Dark mode" description="Switch the dashboard into the night-friendly surface palette." disabled={themeAccessLocked} />
                                            <Toggle checked={Boolean(themeDraft.dashboardSettings?.glassmorphism)} onChange={(next) => updateDraft({ dashboardSettings: { ...themeDraft.dashboardSettings, glassmorphism: next } })} label="Glassmorphism" description="Create translucent, premium surfaces across the dashboard." disabled={themeAccessLocked} />
                                            <Toggle checked={Boolean(themeDraft.dashboardSettings?.gradientsEnabled)} onChange={(next) => updateDraft({ dashboardSettings: { ...themeDraft.dashboardSettings, gradientsEnabled: next } })} label="Gradients" description="Use premium gradient accents and hero surfaces." disabled={themeAccessLocked} />
                                        </div>
                                    </div>
                                </motion.div>

                                <div className="space-y-4">
                                    <div className="rounded-[24px] border border-[var(--theme-card-border)] bg-[var(--theme-surface)] p-4 backdrop-blur-lg">
                                        <div className="flex items-center justify-between gap-3 mb-3">
                                            <div>
                                                <p className="text-sm font-semibold text-[var(--theme-surface-text)]">Custom Colors</p>
                                                <p className="text-xs text-[var(--theme-surface-muted)]">Your saved colors sync to Firestore and localStorage.</p>
                                            </div>
                                            {themeAccessLocked && <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">Locked</span>}
                                        </div>

                                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                            <Field label="Accent"><input type="color" value={themeDraft.customColors?.accent || "#15a34a"} onChange={(e) => updateDraft({ customColors: { ...themeDraft.customColors, accent: e.target.value } })} className="h-11 w-full rounded-xl border border-[var(--theme-card-border)] bg-white p-1" disabled={themeAccessLocked} /></Field>
                                            <Field label="Accent 2"><input type="color" value={themeDraft.customColors?.accent2 || "#9ff782"} onChange={(e) => updateDraft({ customColors: { ...themeDraft.customColors, accent2: e.target.value } })} className="h-11 w-full rounded-xl border border-[var(--theme-card-border)] bg-white p-1" disabled={themeAccessLocked} /></Field>
                                            <Field label="Sidebar"><input type="color" value={themeDraft.customColors?.sidebar || currentPreviewPreset.colors.sidebar} onChange={(e) => updateDraft({ customColors: { ...themeDraft.customColors, sidebar: e.target.value } })} className="h-11 w-full rounded-xl border border-[var(--theme-card-border)] bg-white p-1" disabled={themeAccessLocked} /></Field>
                                            <Field label="Card"><input type="color" value={themeDraft.customColors?.card || currentPreviewPreset.colors.card} onChange={(e) => updateDraft({ customColors: { ...themeDraft.customColors, card: e.target.value } })} className="h-11 w-full rounded-xl border border-[var(--theme-card-border)] bg-white p-1" disabled={themeAccessLocked} /></Field>
                                            <Field label="Background"><input type="color" value={themeDraft.customColors?.background || currentPreviewPreset.colors.background} onChange={(e) => updateDraft({ customColors: { ...themeDraft.customColors, background: e.target.value } })} className="h-11 w-full rounded-xl border border-[var(--theme-card-border)] bg-white p-1" disabled={themeAccessLocked} /></Field>
                                            <Field label="Background Alt"><input type="color" value={themeDraft.customColors?.backgroundAlt || currentPreviewPreset.colors.backgroundAlt} onChange={(e) => updateDraft({ customColors: { ...themeDraft.customColors, backgroundAlt: e.target.value } })} className="h-11 w-full rounded-xl border border-[var(--theme-card-border)] bg-white p-1" disabled={themeAccessLocked} /></Field>
                                        </div>
                                    </div>

                                    <div className="rounded-[24px] border border-[var(--theme-card-border)] bg-[var(--theme-surface)] p-4 backdrop-blur-lg space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-semibold text-[var(--theme-surface-text)]">Theme Actions</p>
                                                <p className="text-xs text-[var(--theme-surface-muted)]">Save, randomize, export, or import a theme preset.</p>
                                            </div>
                                            {purchaseSuccess && <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">{purchaseSuccess}</span>}
                                        </div>
                                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                                            <button onClick={handleSaveTheme} disabled={themeAccessLocked} className="rounded-2xl bg-[var(--theme-accent)] px-4 py-3 font-semibold text-[var(--theme-accent-contrast)] transition hover:opacity-90 disabled:opacity-50">Save Theme</button>
                                            <button onClick={handleRandomize} disabled={themeAccessLocked} className="rounded-2xl border border-[var(--theme-card-border)] px-4 py-3 font-semibold text-[var(--theme-text)] transition hover:bg-white disabled:opacity-50">Randomize</button>
                                            <button onClick={handleExportTheme} className="rounded-2xl border border-[var(--theme-card-border)] px-4 py-3 font-semibold text-[var(--theme-text)] transition hover:bg-white">Export</button>
                                            <button onClick={() => importInputRef.current?.click()} className="rounded-2xl border border-[var(--theme-card-border)] px-4 py-3 font-semibold text-[var(--theme-text)] transition hover:bg-white">Import File</button>
                                            <button onClick={handleResetDefaultTheme} disabled={themeAccessLocked} className="rounded-2xl border border-[var(--theme-accent)] px-4 py-3 font-semibold text-[var(--theme-accent)] transition hover:bg-[var(--theme-accent)] hover:text-[var(--theme-accent-contrast)] disabled:opacity-50">Default Theme</button>
                                        </div>
                                        <input ref={importInputRef} type="file" accept="application/json" className="hidden" onChange={async (e) => {
                                            const file = e.target.files?.[0];
                                            if (!file) return;
                                            const text = await file.text();
                                            setThemeImportText(text);
                                            await handleImportTheme(text);
                                        }} />
                                        <textarea value={themeImportText} onChange={(e) => setThemeImportText(e.target.value)} placeholder="Paste a saved theme JSON here, then click Import..." rows={4} className="w-full rounded-2xl border border-[var(--theme-card-border)] bg-[var(--theme-surface-solid)] p-3 text-sm text-[var(--theme-surface-text)] outline-none focus:ring-2 focus:ring-[var(--theme-accent)]" />
                                        <button onClick={() => handleImportTheme()} className="w-full rounded-2xl bg-[var(--theme-surface-solid)] px-4 py-3 font-semibold text-[var(--theme-text)] border border-[var(--theme-card-border)] transition hover:shadow-lg">Import Theme JSON</button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}

                {toast && (
                    <motion.div initial={{ opacity: 0, x: 24, y: -10 }} animate={{ opacity: 1, x: 0, y: 0 }} exit={{ opacity: 0, x: 24, y: -10 }} className={`fixed right-4 top-4 z-[9999] min-w-[280px] max-w-sm rounded-2xl border p-4 shadow-2xl ${toast.type === "success" ? "border-emerald-200 bg-emerald-50" : "border-red-200 bg-red-50"}`}>
                        <p className={`text-sm font-semibold ${toast.type === "success" ? "text-emerald-700" : "text-red-700"}`}>{toast.type === "success" ? "Success" : "Error"}</p>
                        <p className={`mt-1 text-sm ${toast.type === "success" ? "text-emerald-700" : "text-red-700"}`}>{toast.message}</p>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showPurchaseModal && purchaseCandidate && (
                    <motion.div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/50 px-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <motion.div initial={{ scale: 0.96, y: 12 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, y: 12 }} className="w-full max-w-md rounded-[28px] border border-[var(--theme-card-border)] bg-[var(--theme-surface-solid)] p-6 shadow-2xl">
                            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--theme-surface-muted)]">Purchase confirmation</p>
                            <h3 className="mt-2 text-2xl font-bold text-[var(--theme-surface-text)]">{purchaseCandidate.name}</h3>
                            <p className="mt-2 text-sm text-[var(--theme-surface-muted)]">Unlock this preset permanently for {purchaseCandidate.price} coins. It will appear in your Purchased Themes inventory immediately after purchase.</p>
                            <div className="mt-4 flex items-center justify-between rounded-2xl bg-black/5 px-4 py-3 text-sm">
                                <span>Rarity</span>
                                <span className="font-semibold">{purchaseCandidate.rarity}</span>
                            </div>
                            <div className="mt-5 flex gap-3">
                                <button onClick={() => { setShowPurchaseModal(false); setPurchaseCandidate(null); }} className="flex-1 rounded-2xl border border-[var(--theme-card-border)] px-4 py-3 font-semibold text-[var(--theme-text)]">Cancel</button>
                                <button onClick={handlePurchaseTheme} disabled={purchaseLoading} className="flex-1 rounded-2xl bg-[var(--theme-accent)] px-4 py-3 font-semibold text-[var(--theme-accent-contrast)] disabled:opacity-50">{purchaseLoading ? "Buying..." : "Buy Theme"}</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
