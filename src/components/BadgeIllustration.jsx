import React from "react";

const palette = {
  emerald: ["#34d399", "#059669", "#064e3b"],
  gold: ["#fde68a", "#f59e0b", "#92400e"],
  slate: ["#e2e8f0", "#94a3b8", "#0f172a"],
  rose: ["#fda4af", "#f43f5e", "#881337"],
};

export default function BadgeIllustration({ tone = "emerald", active = false, size = 88 }) {
  const colors = palette[tone] || palette.emerald;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 96 96"
      className={`block ${active ? "drop-shadow-[0_0_18px_rgba(16,185,129,0.45)]" : ""}`}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`badge-${tone}-ring`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={colors[0]} />
          <stop offset="55%" stopColor={colors[1]} />
          <stop offset="100%" stopColor={colors[2]} />
        </linearGradient>
        <radialGradient id={`badge-${tone}-glow`} cx="50%" cy="40%" r="70%">
          <stop offset="0%" stopColor={colors[0]} stopOpacity="0.95" />
          <stop offset="100%" stopColor={colors[2]} stopOpacity="0.2" />
        </radialGradient>
      </defs>
      <circle cx="48" cy="48" r="41" fill={`url(#badge-${tone}-glow)`} opacity="0.16" />
      <circle cx="48" cy="48" r="36" fill="#fff" opacity="0.08" />
      <path
        d="M48 8 59 24l18-2-2 18 15 10-15 10 2 18-18-2-11 16-11-16-18 2 2-18-15-10 15-10-2-18 18 2z"
        fill={`url(#badge-${tone}-ring)`}
        opacity="0.97"
      />
      <path d="M48 22l7 14 15 2-11 11 3 15-14-7-14 7 3-15-11-11 15-2z" fill="#fff" opacity="0.88" />
      <circle cx="48" cy="48" r="9" fill={`url(#badge-${tone}-ring)`} />
      <path d="M34 66h28" stroke="#fff" strokeOpacity="0.7" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
