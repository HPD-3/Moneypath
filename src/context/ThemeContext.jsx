import { createContext, useContext, useEffect, useMemo, useState } from "react";
import API from "../services/api.js";
import { useAuth } from "./AuthContext.jsx";
import {
    DEFAULT_THEME_STATE,
    THEME_PRESETS,
    buildThemeVariables,
    getRandomThemePreset,
    getThemePresetById,
    getThemeStateFromUserData,
    normalizeThemeState,
} from "../../server/themePresets.shared.js";

const ThemeContext = createContext(null);

function getStorageKey(uid) {
    return uid ? `moneypath-theme:${uid}` : "moneypath-theme:guest";
}

function applyCssVariables(themeVariables) {
    if (typeof document === "undefined") return;

    const root = document.documentElement;
    Object.entries(themeVariables || {}).forEach(([key, value]) => {
        root.style.setProperty(key, String(value));
    });

    const background = themeVariables?.["--theme-page-bg"] || DEFAULT_THEME_STATE.customColors.background;
    const text = themeVariables?.["--theme-text"] || DEFAULT_THEME_STATE.customColors.text;
    root.style.setProperty("color-scheme", themeVariables?.["--theme-mode"] === "dark" ? "dark" : "light");
    document.body.style.background = background;
    document.body.style.color = text;
}

export function ThemeProvider({ children }) {
    const { user, loading } = useAuth();
    const [themeState, setThemeState] = useState(DEFAULT_THEME_STATE);
    const [themeVariables, setThemeVariables] = useState(buildThemeVariables(getThemePresetById(DEFAULT_THEME_STATE.activeTheme), DEFAULT_THEME_STATE));
    const [themeLoading, setThemeLoading] = useState(true);
    const [themeError, setThemeError] = useState("");
    const [themeMeta, setThemeMeta] = useState({
        level: 1,
        coins: 0,
        themeAccessUnlocked: false,
        customThemeCount: 0,
    });

    const persistLocalTheme = (uid, nextState) => {
        try {
            localStorage.setItem(getStorageKey(uid), JSON.stringify(nextState));
        } catch {
            // Ignore localStorage failures in private mode.
        }
    };

    const updateTheme = (nextState, source = null) => {
        const normalized = normalizeThemeState(nextState);
        const preset = getThemePresetById(normalized.activeTheme);
        const variables = buildThemeVariables(preset, normalized);

        setThemeState(normalized);
        setThemeVariables(variables);
        applyCssVariables(variables);
        if (source) persistLocalTheme(source, normalized);
        return { normalized, preset, variables };
    };

    const loadFromLocalCache = () => {
        try {
            const raw = localStorage.getItem(getStorageKey(user?.uid));
            if (!raw) return null;
            const parsed = JSON.parse(raw);
            return normalizeThemeState(parsed);
        } catch {
            return null;
        }
    };

    const refreshTheme = async () => {
        if (!user) {
            const cached = loadFromLocalCache();
            if (cached) updateTheme(cached);
            setThemeLoading(false);
            return cached;
        }

        try {
            setThemeLoading(true);
            const res = await API.get("/settings/themes");
            const nextState = getThemeStateFromUserData(res.data?.themeState || res.data || {});
            const { normalized } = updateTheme(nextState, user.uid);
            persistLocalTheme(user.uid, normalized);
            setThemeMeta({
                level: res.data?.level ?? themeMeta.level,
                coins: res.data?.coins ?? themeMeta.coins,
                themeAccessUnlocked: Boolean(res.data?.themeAccessUnlocked),
                customThemeCount: res.data?.customThemeCount ?? themeMeta.customThemeCount,
                ownedThemes: res.data?.ownedThemes || normalized.purchasedThemes || [],
            });
            setThemeError("");
            return normalized;
        } catch (err) {
            const cached = loadFromLocalCache();
            if (cached) {
                updateTheme(cached);
            }
            setThemeError(err.response?.data?.message || err.message || "Failed to load theme settings");
            return cached;
        } finally {
            setThemeLoading(false);
        }
    };

    useEffect(() => {
        if (loading) return;
        refreshTheme();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loading, user?.uid]);

    const applyTheme = async (themeId) => {
        const res = await API.post("/settings/themes/apply", { themeId });
        const nextState = getThemeStateFromUserData(res.data?.themeState || { activeTheme: themeId });
        const { normalized } = updateTheme(nextState, user?.uid);
        persistLocalTheme(user?.uid, normalized);
        return res.data;
    };

    const saveTheme = async (payload = {}) => {
        const nextState = normalizeThemeState({
            ...themeState,
            ...payload,
            activeTheme: payload.activeTheme || themeState.activeTheme,
        });
        const res = await API.post("/settings/themes", nextState);
        const updatedState = getThemeStateFromUserData(res.data?.themeState || nextState);
        const { normalized } = updateTheme(updatedState, user?.uid);
        persistLocalTheme(user?.uid, normalized);
        return res.data;
    };

    const toggleFavoriteTheme = async (themeId) => {
        const favoriteThemes = themeState.favoriteThemes || [];
        const nextFavorites = favoriteThemes.includes(themeId)
            ? favoriteThemes.filter((id) => id !== themeId)
            : [...favoriteThemes, themeId];
        return saveTheme({ favoriteThemes: nextFavorites });
    };

    const randomizeTheme = async () => {
        const ownedOnly = Boolean(user);
        const picked = getRandomThemePreset(ownedOnly, {
            purchasedThemes: themeState.purchasedThemes,
            ownedThemes: themeState.purchasedThemes,
        });
        if (picked?.id) {
            return applyTheme(picked.id);
        }
        return null;
    };

    const exportTheme = () => JSON.stringify(themeState, null, 2);

    const importTheme = async (themeJson) => {
        const parsed = typeof themeJson === "string" ? JSON.parse(themeJson) : themeJson;
        return saveTheme(parsed);
    };

    const value = useMemo(() => ({
        themeState,
        themeVariables,
        themeLoading,
        themeError,
            themeMeta,
        currentPreset: getThemePresetById(themeState.activeTheme),
        presets: THEME_PRESETS,
        refreshTheme,
        applyTheme,
        saveTheme,
        toggleFavoriteTheme,
        randomizeTheme,
        exportTheme,
        importTheme,
        setThemeState: (nextState) => updateTheme(nextState, user?.uid),
    }), [themeState, themeVariables, themeLoading, themeError, themeMeta, user?.uid]);

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
    return useContext(ThemeContext);
}
