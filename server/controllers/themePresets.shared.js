export const THEME_LEVEL_UNLOCK = 9;

export const DEFAULT_THEME_ID = "emerald_finance";

function makePreviewDataUri(title, left, right, accent) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 200" preserveAspectRatio="none">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${left}" />
          <stop offset="100%" stop-color="${right}" />
        </linearGradient>
        <radialGradient id="glow" cx="72%" cy="28%" r="70%">
          <stop offset="0%" stop-color="${accent}" stop-opacity="0.75" />
          <stop offset="100%" stop-color="${accent}" stop-opacity="0" />
        </radialGradient>
      </defs>
      <rect width="320" height="200" rx="28" fill="url(#bg)" />
      <circle cx="252" cy="54" r="72" fill="url(#glow)" />
      <rect x="24" y="28" width="138" height="14" rx="7" fill="rgba(255,255,255,0.38)" />
      <rect x="24" y="54" width="88" height="10" rx="5" fill="rgba(255,255,255,0.22)" />
      <rect x="24" y="88" width="272" height="70" rx="18" fill="rgba(255,255,255,0.14)" stroke="rgba(255,255,255,0.24)" />
      <rect x="40" y="106" width="72" height="12" rx="6" fill="rgba(255,255,255,0.62)" />
      <rect x="40" y="130" width="116" height="10" rx="5" fill="rgba(255,255,255,0.28)" />
      <text x="24" y="184" fill="rgba(255,255,255,0.92)" font-size="18" font-family="Arial, sans-serif" font-weight="700">${title}</text>
    </svg>
  `;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

export const THEME_PRESETS = [
  {
    id: "emerald_finance",
    name: "Emerald Finance",
    rarity: "Free",
    price: 0,
    isFree: true,
    unlockLevel: THEME_LEVEL_UNLOCK,
    description: "Clean green fintech baseline with strong contrast and readable cards.",
    colors: {
      sidebar: "#0f2e1c",
      sidebarText: "#f5fff2",
      background: "#f3fbf5",
      backgroundAlt: "#e7f6eb",
      surface: "rgba(255,255,255,0.88)",
      surfaceElevated: "#ffffff",
      card: "rgba(255,255,255,0.94)",
      border: "rgba(39, 76, 52, 0.12)",
      accent: "#15a34a",
      accent2: "#9ff782",
      accentContrast: "#0b1f14",
      text: "#12301f",
      muted: "#5f7569",
      chart: ["#15a34a", "#22c55e", "#86efac", "#0f766e"],
    },
    gradients: {
      hero: "linear-gradient(135deg, #0f2e1c 0%, #174d2e 42%, #9ff782 160%)",
      accent: "linear-gradient(135deg, #9ff782 0%, #15a34a 100%)",
    },
    glassmorphism: { enabled: false, blur: 14, opacity: 0.82 },
    animations: { enabled: true, motion: "gentle", hoverLift: true },
    seasonal: false,
    limitedTime: false,
    previewImage: makePreviewDataUri("Emerald Finance", "#0f2e1c", "#1f5131", "#9ff782"),
  },
  {
    id: "midnight_black",
    name: "Midnight Black",
    rarity: "Free",
    price: 0,
    isFree: true,
    unlockLevel: THEME_LEVEL_UNLOCK,
    description: "Dark operational mode for late-night analysis and low-glare viewing.",
    colors: {
      sidebar: "#0b1220",
      sidebarText: "#edf2f7",
      background: "#050816",
      backgroundAlt: "#0d1324",
      surface: "rgba(15, 23, 42, 0.82)",
      surfaceElevated: "#0f172a",
      card: "rgba(15, 23, 42, 0.88)",
      border: "rgba(148, 163, 184, 0.15)",
      accent: "#60a5fa",
      accent2: "#22d3ee",
      accentContrast: "#eff6ff",
      text: "#e2e8f0",
      muted: "#94a3b8",
      chart: ["#60a5fa", "#22d3ee", "#a78bfa", "#34d399"],
    },
    gradients: {
      hero: "linear-gradient(135deg, #030712 0%, #0f172a 55%, #1e293b 100%)",
      accent: "linear-gradient(135deg, #22d3ee 0%, #60a5fa 100%)",
    },
    glassmorphism: { enabled: true, blur: 18, opacity: 0.6 },
    animations: { enabled: true, motion: "subtle", hoverLift: true },
    seasonal: false,
    limitedTime: false,
    previewImage: makePreviewDataUri("Midnight Black", "#0b1220", "#111827", "#38bdf8"),
  },
  {
    id: "ocean_blue",
    name: "Ocean Blue",
    rarity: "Free",
    price: 0,
    isFree: true,
    unlockLevel: THEME_LEVEL_UNLOCK,
    description: "Bright blue wave tones for a more energetic dashboard surface.",
    colors: {
      sidebar: "#0f2747",
      sidebarText: "#f8fbff",
      background: "#eff8ff",
      backgroundAlt: "#dbeafe",
      surface: "rgba(255,255,255,0.88)",
      surfaceElevated: "#ffffff",
      card: "rgba(255,255,255,0.94)",
      border: "rgba(37, 99, 235, 0.14)",
      accent: "#2563eb",
      accent2: "#38bdf8",
      accentContrast: "#eff6ff",
      text: "#10243c",
      muted: "#5b708b",
      chart: ["#2563eb", "#38bdf8", "#0ea5e9", "#7dd3fc"],
    },
    gradients: {
      hero: "linear-gradient(135deg, #0f2747 0%, #1d4ed8 42%, #7dd3fc 150%)",
      accent: "linear-gradient(135deg, #38bdf8 0%, #2563eb 100%)",
    },
    glassmorphism: { enabled: true, blur: 16, opacity: 0.72 },
    animations: { enabled: true, motion: "gentle", hoverLift: true },
    seasonal: false,
    limitedTime: false,
    previewImage: makePreviewDataUri("Ocean Blue", "#0f2747", "#1e40af", "#38bdf8"),
  },
  {
    id: "royal_gold",
    name: "Royal Gold",
    rarity: "Legendary",
    price: 380,
    description: "Premium metallic gold with executive-grade contrast.",
    colors: {
      sidebar: "#1d1306",
      sidebarText: "#fff8e7",
      background: "#fff8e6",
      backgroundAlt: "#f7e7bf",
      surface: "rgba(255,250,240,0.88)",
      surfaceElevated: "#fffdf8",
      card: "rgba(255,255,255,0.95)",
      border: "rgba(146, 104, 0, 0.16)",
      accent: "#d4a017",
      accent2: "#f7c948",
      accentContrast: "#281b05",
      text: "#2c2208",
      muted: "#6f5a2d",
      chart: ["#d4a017", "#f7c948", "#b8860b", "#f59e0b"],
    },
    gradients: {
      hero: "linear-gradient(135deg, #1d1306 0%, #6b4f12 45%, #f7c948 165%)",
      accent: "linear-gradient(135deg, #f7c948 0%, #d4a017 100%)",
    },
    glassmorphism: { enabled: true, blur: 16, opacity: 0.78 },
    animations: { enabled: true, motion: "premium", hoverLift: true },
    seasonal: false,
    limitedTime: false,
    previewImage: makePreviewDataUri("Royal Gold", "#1d1306", "#5f4305", "#f7c948"),
  },
  {
    id: "neon_future",
    name: "Neon Future",
    rarity: "Epic",
    price: 320,
    description: "Electric neon glow for power users and futuristic analytics.",
    colors: {
      sidebar: "#08111f",
      sidebarText: "#eef7ff",
      background: "#050816",
      backgroundAlt: "#101a35",
      surface: "rgba(10, 18, 36, 0.84)",
      surfaceElevated: "#0b1326",
      card: "rgba(15, 23, 42, 0.88)",
      border: "rgba(56, 189, 248, 0.18)",
      accent: "#a855f7",
      accent2: "#22d3ee",
      accentContrast: "#f5f3ff",
      text: "#edf2ff",
      muted: "#94a3b8",
      chart: ["#a855f7", "#22d3ee", "#38bdf8", "#f472b6"],
    },
    gradients: {
      hero: "linear-gradient(135deg, #050816 0%, #18122b 45%, #22d3ee 165%)",
      accent: "linear-gradient(135deg, #a855f7 0%, #22d3ee 100%)",
    },
    glassmorphism: { enabled: true, blur: 22, opacity: 0.52 },
    animations: { enabled: true, motion: "electric", hoverLift: true },
    seasonal: false,
    limitedTime: true,
    previewImage: makePreviewDataUri("Neon Future", "#050816", "#0f172a", "#22d3ee"),
  },
  {
    id: "crimson_elite",
    name: "Crimson Elite",
    rarity: "Epic",
    price: 310,
    description: "High-contrast crimson layout with sharp executive tone.",
    colors: {
      sidebar: "#24080c",
      sidebarText: "#fff3f4",
      background: "#fff1f2",
      backgroundAlt: "#ffe4e6",
      surface: "rgba(255, 255, 255, 0.9)",
      surfaceElevated: "#fffafa",
      card: "rgba(255, 255, 255, 0.95)",
      border: "rgba(190, 18, 60, 0.16)",
      accent: "#be123c",
      accent2: "#fb7185",
      accentContrast: "#fff1f2",
      text: "#32111a",
      muted: "#7f4957",
      chart: ["#be123c", "#fb7185", "#f97316", "#f43f5e"],
    },
    gradients: {
      hero: "linear-gradient(135deg, #24080c 0%, #7f1d1d 45%, #fb7185 160%)",
      accent: "linear-gradient(135deg, #fb7185 0%, #be123c 100%)",
    },
    glassmorphism: { enabled: false, blur: 14, opacity: 0.84 },
    animations: { enabled: true, motion: "crisp", hoverLift: true },
    seasonal: false,
    limitedTime: true,
    previewImage: makePreviewDataUri("Crimson Elite", "#24080c", "#7f1d1d", "#fb7185"),
  },
  {
    id: "cyber_mint",
    name: "Cyber Mint",
    rarity: "Rare",
    price: 260,
    description: "Mint green cyber panels with clean glow and crisp edges.",
    colors: {
      sidebar: "#08211b",
      sidebarText: "#effcf8",
      background: "#ecfdf5",
      backgroundAlt: "#d1fae5",
      surface: "rgba(255,255,255,0.9)",
      surfaceElevated: "#ffffff",
      card: "rgba(255,255,255,0.96)",
      border: "rgba(16, 185, 129, 0.14)",
      accent: "#10b981",
      accent2: "#34d399",
      accentContrast: "#04251b",
      text: "#0d2b22",
      muted: "#4f756c",
      chart: ["#10b981", "#34d399", "#22c55e", "#6ee7b7"],
    },
    gradients: {
      hero: "linear-gradient(135deg, #08211b 0%, #0f766e 45%, #34d399 160%)",
      accent: "linear-gradient(135deg, #34d399 0%, #10b981 100%)",
    },
    glassmorphism: { enabled: true, blur: 18, opacity: 0.74 },
    animations: { enabled: true, motion: "smooth", hoverLift: true },
    seasonal: false,
    limitedTime: false,
    previewImage: makePreviewDataUri("Cyber Mint", "#08211b", "#115e59", "#34d399"),
  },
  {
    id: "luxury_platinum",
    name: "Luxury Platinum",
    rarity: "Legendary",
    price: 420,
    description: "Refined platinum surfaces with polished luxury finish.",
    colors: {
      sidebar: "#111318",
      sidebarText: "#f8fafc",
      background: "#f8fafc",
      backgroundAlt: "#e5e7eb",
      surface: "rgba(255,255,255,0.9)",
      surfaceElevated: "#ffffff",
      card: "rgba(255,255,255,0.96)",
      border: "rgba(71, 85, 105, 0.15)",
      accent: "#64748b",
      accent2: "#94a3b8",
      accentContrast: "#111827",
      text: "#111827",
      muted: "#64748b",
      chart: ["#475569", "#64748b", "#94a3b8", "#cbd5e1"],
    },
    gradients: {
      hero: "linear-gradient(135deg, #111318 0%, #334155 45%, #cbd5e1 170%)",
      accent: "linear-gradient(135deg, #94a3b8 0%, #64748b 100%)",
    },
    glassmorphism: { enabled: true, blur: 16, opacity: 0.8 },
    animations: { enabled: true, motion: "luxury", hoverLift: true },
    seasonal: false,
    limitedTime: false,
    previewImage: makePreviewDataUri("Luxury Platinum", "#111318", "#334155", "#cbd5e1"),
  },
  {
    id: "dark_emerald_pro",
    name: "Dark Emerald Pro",
    rarity: "Legendary",
    price: 450,
    description: "Founder-grade emerald dark mode with premium glass surfaces.",
    colors: {
      sidebar: "#07160f",
      sidebarText: "#ecfdf3",
      background: "#04110a",
      backgroundAlt: "#0c2416",
      surface: "rgba(8, 23, 16, 0.84)",
      surfaceElevated: "#0a1f13",
      card: "rgba(9, 26, 18, 0.92)",
      border: "rgba(52, 211, 153, 0.18)",
      accent: "#34d399",
      accent2: "#9ff782",
      accentContrast: "#03150d",
      text: "#ecfdf3",
      muted: "#86b6a1",
      chart: ["#34d399", "#9ff782", "#10b981", "#6ee7b7"],
    },
    gradients: {
      hero: "linear-gradient(135deg, #04110a 0%, #0f2e1c 45%, #34d399 170%)",
      accent: "linear-gradient(135deg, #9ff782 0%, #34d399 100%)",
    },
    glassmorphism: { enabled: true, blur: 24, opacity: 0.5 },
    animations: { enabled: true, motion: "luxury", hoverLift: true },
    seasonal: true,
    limitedTime: true,
    previewImage: makePreviewDataUri("Dark Emerald Pro", "#04110a", "#0f2e1c", "#34d399"),
  },
];

function unique(values = []) {
  return [...new Set((values || []).filter(Boolean))];
}

export function getThemePresetById(themeId) {
  return THEME_PRESETS.find((preset) => preset.id === themeId) || THEME_PRESETS[0];
}

export function normalizeThemeState(input = {}) {
  const activeTheme = input.activeTheme || input.profileTheme || DEFAULT_THEME_ID;

  return {
    activeTheme,
    themeMode: input.themeMode === "dark" ? "dark" : "light",
    customColors: input.customColors || {},
    sidebarSettings: input.sidebarSettings || {},
    dashboardSettings: input.dashboardSettings || {},
    purchasedThemes: unique(input.purchasedThemes || input.ownedThemes || []),
    favoriteThemes: unique(input.favoriteThemes || []),
    recentThemes: unique(input.recentThemes || []),
    customThemes: Array.isArray(input.customThemes) ? input.customThemes : [],
  };
}

export function getThemeStateFromUserData(userData = {}) {
  return normalizeThemeState({
    activeTheme: userData.activeTheme || userData.profileTheme,
    themeMode: userData.themeMode || userData.settings?.theme || "light",
    customColors: userData.customColors,
    sidebarSettings: userData.sidebarSettings,
    dashboardSettings: userData.dashboardSettings,
    purchasedThemes: userData.purchasedThemes || userData.ownedThemes || [],
    favoriteThemes: userData.favoriteThemes || [],
    recentThemes: userData.recentThemes || [],
    customThemes: userData.customThemes || [],
  });
}

export function buildThemeVariables(themePreset, themeState = {}) {
  const preset = themePreset || getThemePresetById(themeState.activeTheme);
  const palette = { ...preset.colors, ...(themeState.customColors || {}) };

  return {
    "--theme-mode": themeState.themeMode || "light",
    "--theme-page-bg": palette.background,
    "--theme-page-bg-alt": palette.backgroundAlt,
    "--theme-surface": `rgba(255,255,255,${preset.glassmorphism?.opacity ?? 0.84})`,
    "--theme-surface-solid": palette.card,
    "--theme-sidebar-bg": palette.sidebar,
    "--theme-sidebar-text": palette.sidebarText,
    "--theme-card-bg": palette.card,
    "--theme-card-border": palette.border,
    "--theme-text": palette.text,
    "--theme-muted": palette.muted,
    "--theme-accent": palette.accent,
    "--theme-accent-2": palette.accent2,
    "--theme-accent-contrast": palette.accentContrast,
    "--theme-gradient": preset.gradients.hero,
    "--theme-gradient-accent": preset.gradients.accent,
    "--theme-shadow": palette.background === "#04110a" ? "0 24px 60px rgba(0,0,0,0.26)" : "0 24px 60px rgba(15, 23, 42, 0.1)",
  };
}

export function buildThemePreviewStyle(themePreset, themeState = {}) {
  const preset = themePreset || getThemePresetById(themeState.activeTheme);
  return {
    background: preset.gradients.hero,
    color: preset.colors.text,
    boxShadow: "var(--theme-shadow)",
    border: `1px solid ${preset.colors.border}`,
  };
}

export function isThemeOwned(themeId, userData = {}) {
  const preset = getThemePresetById(themeId);
  if (!preset || preset.isFree) return true;
  const purchased = new Set([...(userData.purchasedThemes || []), ...(userData.ownedThemes || [])]);
  return purchased.has(themeId);
}

export function getRandomThemePreset(ownedOnly = false, userData = {}) {
  const pool = ownedOnly ? THEME_PRESETS.filter((preset) => preset.isFree || isThemeOwned(preset.id, userData)) : THEME_PRESETS;
  return pool[Math.floor(Math.random() * pool.length)] || THEME_PRESETS[0];
}