import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api.js";
import Navbar from "../components/Navbar.jsx";
import Sidebar from "../components/Sidebar.jsx";

const fmt = (n) => `Rp ${(n || 0).toLocaleString("id-ID")}`;
const pct = (terkumpul, target) => Math.min(Math.round((terkumpul / target) * 100), 100);
const CATS = ["umum", "liburan", "elektronik", "kendaraan", "pendidikan", "darurat", "lainnya"];
const CAT_ICONS = { umum: "🎯", liburan: "✈️", elektronik: "💻", kendaraan: "🚗", pendidikan: "📚", darurat: "🏥", lainnya: "📦" };

// ── Target Card ───────────────────────────────────────────────
function TargetCard({ group, uid, onClick }) {
    const progress = pct(group.terkumpul, group.targetAmount);
    const [hov, setHov] = useState(false);

    return (
        <div onClick={() => onClick(group)}
            onMouseEnter={() => setHov(true)}
            onMouseLeave={() => setHov(false)}
            style={{ background: "white", borderRadius: 12, overflow: "hidden", cursor: "pointer", border: "1px solid #e5e7eb", boxShadow: hov ? "0 8px 20px rgba(0,0,0,0.12)" : "0 2px 8px rgba(0,0,0,0.05)", transform: hov ? "translateY(-4px)" : "none", transition: "all 0.3s" }}>

            {/* Image / Icon */}
            <div style={{ height: 180, background: group.imageUrl ? `url(${group.imageUrl}) center/cover` : "linear-gradient(135deg,#1a3a1f,#0f2a18)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
                {!group.imageUrl && <span style={{ fontSize: 48 }}>{CAT_ICONS[group.category] || "🎯"}</span>}
                {group.isCompleted && (
                    <div style={{ position: "absolute", top: 8, right: 8, background: "#9FF782", color: "#0a1f10", borderRadius: 20, padding: "4px 12px", fontSize: 11, fontWeight: 700 }}>
                        ✓ Tercapai!
                    </div>
                )}
            </div>

            <div style={{ padding: "16px" }}>
                <p style={{ fontWeight: 700, fontSize: 14, color: "#1a3a1f", marginBottom: 10 }}>{group.name}</p>

                {/* Amount and Progress */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                    <div>
                        <p style={{ fontSize: 12, color: "#9ca3af", marginBottom: 2 }}>{fmt(group.terkumpul)} / {fmt(group.targetAmount)}</p>
                        <p style={{ fontSize: 11, color: "#9ca3af" }}>{progress}% Terkumpul</p>
                    </div>
                </div>

                {/* Progress bar */}
                <div style={{ background: "#f3f4f6", borderRadius: 4, height: 6, marginBottom: 12, overflow: "hidden" }}>
                    <div style={{ width: `${progress}%`, height: "100%", borderRadius: 4, background: group.isCompleted ? "#9FF782" : "#1a3a1f", transition: "width 0.5s" }} />
                </div>

                {/* Click Button */}
                <button
                    style={{ width: "100%", background: "#1a3a1f", color: "white", border: "none", borderRadius: 8, padding: "10px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "Plus Jakarta Sans, sans-serif", transition: "background 0.2s" }}
                    onMouseEnter={e => e.target.style.background = "#0f2a18"}
                    onMouseLeave={e => e.target.style.background = "#1a3a1f"}>
                    Click
                </button>
            </div>
        </div>
    );
}

// ── Create Modal ──────────────────────────────────────────────
function CreateModal({ onClose, onCreate }) {
    const EMPTY = { name: "", description: "", targetAmount: "", deadline: "", imageUrl: "", category: "umum" };
    const [form, setForm] = useState(EMPTY);
    const [saving, setSaving] = useState(false);

    const handleSubmit = async e => {
        e.preventDefault();
        setSaving(true);
        try { await onCreate(form); onClose(); }
        catch (err) { console.error(err); }
        finally { setSaving(false); }
    };

    return (
        <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 100, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
            <div onClick={e => e.stopPropagation()} style={{ background: "white", borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 520, padding: "20px 20px 32px", maxHeight: "85vh", overflowY: "auto" }}>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}><div style={{ width: 40, height: 4, borderRadius: 2, background: "#e5e7eb" }} /></div>
                <h2 style={{ fontWeight: 700, fontSize: 18, color: "#1a3a1f", marginBottom: 20 }}>🤝 Buat Target Tabungan Bersama</h2>
                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <div>
                        <label style={{ fontSize: 11, fontWeight: 600, color: "#4b5563", display: "block", marginBottom: 4 }}>Nama Target *</label>
                        <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required
                            placeholder="cth: Liburan Bareng ke Bali" style={{ width: "100%", border: "1px solid #d1d5db", borderRadius: 8, padding: "10px 12px", fontSize: 13, outline: "none", fontFamily: "Plus Jakarta Sans, sans-serif" }} />
                    </div>
                    <div>
                        <label style={{ fontSize: 11, fontWeight: 600, color: "#4b5563", display: "block", marginBottom: 4 }}>Kategori</label>
                        <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                            style={{ width: "100%", border: "1px solid #d1d5db", borderRadius: 8, padding: "10px 12px", fontSize: 13, outline: "none", fontFamily: "Plus Jakarta Sans, sans-serif" }}>
                            {CATS.map(c => <option key={c} value={c}>{CAT_ICONS[c]} {c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={{ fontSize: 11, fontWeight: 600, color: "#4b5563", display: "block", marginBottom: 4 }}>Target Jumlah (Rp) *</label>
                        <div style={{ position: "relative" }}>
                            <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: "#9ca3af" }}>Rp</span>
                            <input type="number" value={form.targetAmount} onChange={e => setForm({ ...form, targetAmount: e.target.value })} required min={1}
                                placeholder="0" style={{ width: "100%", border: "1px solid #d1d5db", borderRadius: 8, padding: "10px 12px 10px 36px", fontSize: 13, outline: "none", fontFamily: "Plus Jakarta Sans, sans-serif" }} />
                        </div>
                    </div>
                    <div>
                        <label style={{ fontSize: 11, fontWeight: 600, color: "#4b5563", display: "block", marginBottom: 4 }}>Deadline (opsional)</label>
                        <input type="date" value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })}
                            style={{ width: "100%", border: "1px solid #d1d5db", borderRadius: 8, padding: "10px 12px", fontSize: 13, outline: "none", fontFamily: "Plus Jakarta Sans, sans-serif" }} />
                    </div>
                    <div>
                        <label style={{ fontSize: 11, fontWeight: 600, color: "#4b5563", display: "block", marginBottom: 4 }}>Deskripsi (opsional)</label>
                        <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                            placeholder="Ceritakan tujuan tabungan bersama ini..." rows={2} style={{ width: "100%", border: "1px solid #d1d5db", borderRadius: 8, padding: "10px 12px", fontSize: 13, outline: "none", fontFamily: "Plus Jakarta Sans, sans-serif", resize: "none" }} />
                    </div>
                    <div>
                        <label style={{ fontSize: 11, fontWeight: 600, color: "#4b5563", display: "block", marginBottom: 4 }}>URL Gambar (opsional)</label>
                        <input value={form.imageUrl} onChange={e => setForm({ ...form, imageUrl: e.target.value })}
                            placeholder="https://..." style={{ width: "100%", border: "1px solid #d1d5db", borderRadius: 8, padding: "10px 12px", fontSize: 13, outline: "none", fontFamily: "Plus Jakarta Sans, sans-serif" }} />
                    </div>
                    <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                        <button type="button" onClick={onClose} style={{ flex: 1, background: "#f3f4f6", color: "#374151", border: "none", borderRadius: 10, padding: "12px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "Plus Jakarta Sans, sans-serif" }}>Batal</button>
                        <button type="submit" disabled={saving} style={{ flex: 2, background: "#1a3a1f", color: "#9FF782", border: "none", borderRadius: 10, padding: "12px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "Plus Jakarta Sans, sans-serif" }}>
                            {saving ? "Membuat..." : "Buat Target"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ── Join Modal ────────────────────────────────────────────────
function JoinModal({ onClose, onJoin }) {
    const [code, setCode] = useState("");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async e => {
        e.preventDefault();
        setError(null);
        setSaving(true);
        try { await onJoin(code.trim().toUpperCase()); onClose(); }
        catch (err) { setError(err.response?.data?.error || err.message); }
        finally { setSaving(false); }
    };

    return (
        <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 100, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
            <div onClick={e => e.stopPropagation()} style={{ background: "white", borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 520, padding: "20px 20px 32px" }}>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}><div style={{ width: 40, height: 4, borderRadius: 2, background: "#e5e7eb" }} /></div>
                <h2 style={{ fontWeight: 700, fontSize: 18, color: "#1a3a1f", marginBottom: 20 }}>🔑 Masukkan Kode Undangan</h2>
                <form onSubmit={handleSubmit}>
                    <input value={code} onChange={e => setCode(e.target.value.toUpperCase())} required maxLength={8}
                        placeholder="cth: A1B2C3D4" style={{ width: "100%", border: "1px solid #d1d5db", borderRadius: 8, padding: "14px 16px", fontSize: 20, fontWeight: 700, letterSpacing: 4, textAlign: "center", outline: "none", fontFamily: "monospace", marginBottom: 12 }} />
                    {error && <p style={{ fontSize: 12, color: "#ef4444", marginBottom: 10 }}>⚠️ {error}</p>}
                    <div style={{ display: "flex", gap: 10 }}>
                        <button type="button" onClick={onClose} style={{ flex: 1, background: "#f3f4f6", color: "#374151", border: "none", borderRadius: 10, padding: "12px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "Plus Jakarta Sans, sans-serif" }}>Batal</button>
                        <button type="submit" disabled={saving || code.length < 4} style={{ flex: 2, background: "#1a3a1f", color: "#9FF782", border: "none", borderRadius: 10, padding: "12px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "Plus Jakarta Sans, sans-serif", opacity: code.length < 4 ? 0.5 : 1 }}>
                            {saving ? "Bergabung..." : "Bergabung"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ── Group Detail Modal ────────────────────────────────────────
function GroupDetail({ group, uid, personalBalances, sharedBalances, onClose, onRefresh }) {
    const [tab, setTab] = useState("setor");
    const [amount, setAmount] = useState("");
    const [sourceType, setSourceType] = useState("personal");
    const [sourceId, setSourceId] = useState("");
    const [inviteEmail, setInviteEmail] = useState("");
    const [saving, setSaving] = useState(false);
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    const members = Object.values(group.members || {});
    const myRole = group.members?.[uid]?.role;
    const isAdmin = myRole === "admin";
    const progress = pct(group.terkumpul, group.targetAmount);
    const sisaTarget = group.targetAmount - group.terkumpul;

    // Current source options
    const sourceOptions = sourceType === "personal"
        ? personalBalances
        : sharedBalances;

    const selectedSource = sourceOptions.find(s => s.id === sourceId);

    const handleCopyCode = () => {
        navigator.clipboard.writeText(group.inviteCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleSetor = async e => {
        e.preventDefault();
        setError(null);
        const amt = parseFloat(amount);
        if (!amt || amt <= 0) return setError("Masukkan jumlah yang valid");
        if (!sourceId) return setError("Pilih sumber saldo");
        if (amt > (selectedSource?.balance || 0)) return setError("Saldo tidak mencukupi");
        if (amt > sisaTarget) return setError(`Maksimal setor: ${fmt(sisaTarget)}`);

        setSaving(true);
        try {
            await API.post(`/shared-tabungan/${group.id}/setor`, {
                amount: amt, sourceType, sourceId, sourceName: selectedSource?.name
            });
            setAmount("");
            setSuccess(`+${fmt(amt)} berhasil disetor!`);
            setTimeout(() => setSuccess(null), 3000);
            onRefresh(group.id);
        } catch (err) {
            setError(err.response?.data?.error || err.message);
        } finally { setSaving(false); }
    };

    const handleInvite = async e => {
        e.preventDefault();
        setError(null);
        setSaving(true);
        try {
            await API.post(`/shared-tabungan/${group.id}/invite`, { email: inviteEmail });
            setSuccess(`Undangan dikirim ke ${inviteEmail}`);
            setInviteEmail("");
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            setError(err.response?.data?.error || err.message);
        } finally { setSaving(false); }
    };

    return (
        <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 100, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
            <div onClick={e => e.stopPropagation()} style={{ background: "white", borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 520, maxHeight: "92vh", overflowY: "auto" }}>

                <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 0" }}>
                    <div style={{ width: 40, height: 4, borderRadius: 2, background: "#e5e7eb" }} />
                </div>

                {/* Header */}
                <div style={{ margin: "12px 16px", background: group.imageUrl ? `url(${group.imageUrl}) center/cover` : "linear-gradient(135deg,#1a3a1f,#0f2a18)", borderRadius: 14, padding: "20px", minHeight: 120, display: "flex", flexDirection: "column", justifyContent: "flex-end", position: "relative" }}>
                    <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)", borderRadius: 14 }} />
                    <div style={{ position: "relative" }}>
                        <h2 style={{ fontWeight: 700, fontSize: 18, color: "white", marginBottom: 4 }}>{group.name}</h2>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>{members.length} anggota · {group.category}</p>
                            {group.isCompleted && <span style={{ background: "#9FF782", color: "#0a1f10", borderRadius: 20, padding: "2px 10px", fontSize: 10, fontWeight: 700 }}>🎉 Tercapai!</span>}
                        </div>
                    </div>
                </div>

                <div style={{ padding: "0 16px 24px" }}>
                    {/* Progress */}
                    <div style={{ background: "#f8fdf8", borderRadius: 12, padding: 16, marginBottom: 16 }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 12 }}>
                            {[
                                { label: "Target", value: fmt(group.targetAmount), color: "#1a3a1f" },
                                { label: "Terkumpul", value: fmt(group.terkumpul), color: "#166534" },
                                { label: "Sisa", value: fmt(Math.max(sisaTarget, 0)), color: group.isCompleted ? "#166534" : "#b45309" },
                            ].map((s, i) => (
                                <div key={i} style={{ textAlign: "center" }}>
                                    <p style={{ fontSize: 10, color: "#9ca3af", marginBottom: 2 }}>{s.label}</p>
                                    <p style={{ fontSize: 12, fontWeight: 700, color: s.color }}>{s.value}</p>
                                </div>
                            ))}
                        </div>
                        <div style={{ background: "#e5e7eb", borderRadius: 6, height: 10, overflow: "hidden" }}>
                            <div style={{ width: `${progress}%`, height: "100%", borderRadius: 6, background: group.isCompleted ? "#9FF782" : "linear-gradient(90deg,#1a3a1f,#9FF782)", transition: "width 0.5s" }} />
                        </div>
                        <p style={{ fontSize: 11, color: "#9ca3af", textAlign: "right", marginTop: 4 }}>{progress}%</p>
                    </div>

                    {/* Invite code */}
                    <div style={{ background: "#1a3a1f", borderRadius: 12, padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                        <div>
                            <p style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginBottom: 2 }}>Kode Undangan</p>
                            <p style={{ fontSize: 20, fontWeight: 800, color: "#9FF782", letterSpacing: 3, fontFamily: "monospace" }}>{group.inviteCode}</p>
                        </div>
                        <button onClick={handleCopyCode}
                            style={{ background: copied ? "#9FF782" : "rgba(255,255,255,0.15)", color: copied ? "#0a1f10" : "white", border: "none", borderRadius: 8, padding: "7px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "Plus Jakarta Sans, sans-serif" }}>
                            {copied ? "✓ Disalin!" : "Copy"}
                        </button>
                    </div>

                    {/* Alerts */}
                    {error && <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "#991b1b", marginBottom: 12 }}>⚠️ {error}</div>}
                    {success && <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "#166534", marginBottom: 12 }}>✅ {success}</div>}

                    {/* Tabs */}
                    <div style={{ display: "flex", background: "#f3f4f6", borderRadius: 10, padding: 3, marginBottom: 16 }}>
                        {["setor", "riwayat", "anggota", "undang"].map(t => (
                            <button key={t} onClick={() => setTab(t)}
                                style={{ flex: 1, padding: "7px 4px", borderRadius: 8, border: "none", fontSize: 10, fontWeight: 600, cursor: "pointer", fontFamily: "Plus Jakarta Sans, sans-serif", background: tab === t ? "white" : "transparent", color: tab === t ? "#1a3a1f" : "#9ca3af", boxShadow: tab === t ? "0 1px 4px rgba(0,0,0,0.08)" : "none", transition: "all 0.2s", textTransform: "capitalize" }}>
                                {t === "setor" ? "💰 Setor" : t === "riwayat" ? "📋 Riwayat" : t === "anggota" ? "👥 Anggota" : "📨 Undang"}
                            </button>
                        ))}
                    </div>

                    {/* ── SETOR TAB ─────────────────────────── */}
                    {tab === "setor" && !group.isCompleted && (
                        <form onSubmit={handleSetor}>
                            {/* Source Type Selector */}
                            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                                {[
                                    { val: "personal", label: "💳 Saldo Pribadi" },
                                    { val: "shared", label: "🤝 Saldo Bersama" },
                                ].map(opt => (
                                    <button key={opt.val} type="button" onClick={() => { setSourceType(opt.val); setSourceId(""); }}
                                        style={{ flex: 1, padding: "10px", borderRadius: 10, border: "none", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "Plus Jakarta Sans, sans-serif", background: sourceType === opt.val ? "#1a3a1f" : "#f3f4f6", color: sourceType === opt.val ? "#9FF782" : "#6b7280", transition: "all 0.2s" }}>
                                        {opt.label}
                                    </button>
                                ))}
                            </div>

                            {/* Source Selector */}
                            <div style={{ marginBottom: 12 }}>
                                <label style={{ fontSize: 11, fontWeight: 600, color: "#4b5563", display: "block", marginBottom: 4 }}>
                                    {sourceType === "personal" ? "Pilih Saldo Pribadi" : "Pilih Saldo Bersama"}
                                </label>
                                <select value={sourceId} onChange={e => setSourceId(e.target.value)} required
                                    style={{ width: "100%", border: "1px solid #d1d5db", borderRadius: 8, padding: "10px 12px", fontSize: 13, outline: "none", fontFamily: "Plus Jakarta Sans, sans-serif" }}>
                                    <option value="">-- Pilih sumber saldo --</option>
                                    {sourceOptions.map(s => (
                                        <option key={s.id} value={s.id}>
                                            {s.name} — {fmt(s.balance)}
                                        </option>
                                    ))}
                                </select>
                                {sourceOptions.length === 0 && (
                                    <p style={{ fontSize: 11, color: "#ef4444", marginTop: 4 }}>
                                        {sourceType === "shared" ? "Kamu belum punya saldo bersama." : "Kamu belum punya saldo pribadi."}
                                    </p>
                                )}
                            </div>

                            {/* Amount */}
                            <div style={{ marginBottom: 12 }}>
                                <label style={{ fontSize: 11, fontWeight: 600, color: "#4b5563", display: "block", marginBottom: 4 }}>Jumlah Setoran</label>
                                <div style={{ position: "relative" }}>
                                    <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: "#9ca3af" }}>Rp</span>
                                    <input type="number" value={amount} onChange={e => setAmount(e.target.value)} required min={1}
                                        placeholder="0" style={{ width: "100%", border: "1px solid #d1d5db", borderRadius: 8, padding: "10px 12px 10px 36px", fontSize: 13, outline: "none", fontFamily: "Plus Jakarta Sans, sans-serif" }} />
                                </div>
                                {selectedSource && (
                                    <p style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}>Tersedia: {fmt(selectedSource.balance)}</p>
                                )}
                            </div>

                            {/* Quick amounts */}
                            <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
                                {[50000, 100000, 250000, 500000].map(v => (
                                    <button key={v} type="button" onClick={() => setAmount(String(v))}
                                        style={{ background: amount == v ? "#1a3a1f" : "#f3f4f6", color: amount == v ? "#9FF782" : "#374151", border: "none", borderRadius: 8, padding: "5px 10px", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "Plus Jakarta Sans, sans-serif" }}>
                                        +{v / 1000}rb
                                    </button>
                                ))}
                            </div>

                            <button type="submit" disabled={saving || !sourceId}
                                style={{ width: "100%", background: saving || !sourceId ? "#9ca3af" : "#1a3a1f", color: "#9FF782", border: "none", borderRadius: 10, padding: "13px", fontSize: 14, fontWeight: 700, cursor: saving || !sourceId ? "not-allowed" : "pointer", fontFamily: "Plus Jakarta Sans, sans-serif" }}>
                                {saving ? "Menyetor..." : "💰 Setor ke Target"}
                            </button>
                        </form>
                    )}

                    {tab === "setor" && group.isCompleted && (
                        <div style={{ textAlign: "center", padding: "24px 0" }}>
                            <p style={{ fontSize: 48, marginBottom: 12 }}>🎉</p>
                            <p style={{ fontWeight: 700, color: "#166534", fontSize: 16 }}>Target Tercapai!</p>
                            <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 8 }}>Selamat! Semua anggota berhasil mencapai target ini.</p>
                        </div>
                    )}

                    {/* ── RIWAYAT TAB ───────────────────────── */}
                    {tab === "riwayat" && (
                        <div>
                            {(group.setoran || []).length === 0 ? (
                                <p style={{ textAlign: "center", color: "#9ca3af", fontSize: 13, padding: "20px 0" }}>Belum ada setoran</p>
                            ) : (group.setoran || []).map((s, i) => (
                                <div key={s.id} style={{ padding: "12px 0", borderBottom: "1px solid #f3f4f6" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                        <div>
                                            <p style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>{s.addedByName}</p>
                                            <div style={{ display: "flex", gap: 8, marginTop: 2 }}>
                                                <span style={{ fontSize: 10, background: s.sourceType === "shared" ? "#e8fce0" : "#dbeafe", color: s.sourceType === "shared" ? "#166534" : "#1d4ed8", padding: "1px 6px", borderRadius: 10, fontWeight: 600 }}>
                                                    {s.sourceType === "shared" ? "🤝 Saldo Bersama" : "💳 Pribadi"}
                                                </span>
                                                <p style={{ fontSize: 11, color: "#9ca3af" }}>{s.sourceName}</p>
                                            </div>
                                            <p style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>
                                                {s.date ? new Date(s.date).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }) : ""}
                                            </p>
                                        </div>
                                        <p style={{ fontSize: 14, fontWeight: 700, color: "#166534" }}>+{fmt(s.amount)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* ── ANGGOTA TAB ───────────────────────── */}
                    {tab === "anggota" && (
                        <div>
                            {members.map(m => (
                                <div key={m.uid} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: "1px solid #f3f4f6" }}>
                                    <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#1a3a1f", color: "#9FF782", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, flexShrink: 0 }}>
                                        {(m.name || "?")[0].toUpperCase()}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                            <p style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>{m.name}</p>
                                            <span style={{ fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 10, background: m.role === "admin" ? "#fef9c3" : "#e8fce0", color: m.role === "admin" ? "#854d0e" : "#166534" }}>{m.role}</span>
                                            {m.uid === uid && <span style={{ fontSize: 10, color: "#9ca3af" }}>(kamu)</span>}
                                        </div>
                                        <p style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>Kontribusi: {fmt(m.contributed)}</p>
                                    </div>
                                    {/* Contribution bar */}
                                    <div style={{ width: 60, textAlign: "right" }}>
                                        <p style={{ fontSize: 11, fontWeight: 700, color: "#1a3a1f" }}>
                                            {group.terkumpul > 0 ? Math.round((m.contributed / group.terkumpul) * 100) : 0}%
                                        </p>
                                    </div>
                                </div>
                            ))}
                            {isAdmin && (
                                <button onClick={async () => { if (!confirm("Hapus grup ini?")) return; await API.delete(`/shared-tabungan/${group.id}`); onClose(); onRefresh(null); }}
                                    style={{ width: "100%", marginTop: 20, background: "none", border: "1px solid #fca5a5", borderRadius: 10, padding: "12px", fontSize: 13, fontWeight: 600, color: "#ef4444", cursor: "pointer", fontFamily: "Plus Jakarta Sans, sans-serif" }}>
                                    🗑️ Hapus Target
                                </button>
                            )}
                        </div>
                    )}

                    {/* ── UNDANG TAB ────────────────────────── */}
                    {tab === "undang" && (
                        <div>
                            <div style={{ background: "#f8fdf8", border: "1px solid #d1fae5", borderRadius: 12, padding: 16, marginBottom: 16, textAlign: "center" }}>
                                <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 8 }}>Bagikan kode ke teman</p>
                                <p style={{ fontSize: 28, fontWeight: 800, letterSpacing: 6, color: "#1a3a1f", fontFamily: "monospace" }}>{group.inviteCode}</p>
                                <button onClick={handleCopyCode}
                                    style={{ marginTop: 12, background: "#1a3a1f", color: "#9FF782", border: "none", borderRadius: 8, padding: "8px 24px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "Plus Jakarta Sans, sans-serif" }}>
                                    {copied ? "✓ Disalin!" : "📋 Salin Kode"}
                                </button>
                            </div>
                            {isAdmin && (
                                <form onSubmit={handleInvite}>
                                    <p style={{ fontSize: 12, fontWeight: 700, color: "#1a3a1f", marginBottom: 8 }}>Atau undang lewat email:</p>
                                    <div style={{ display: "flex", gap: 8 }}>
                                        <input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} required
                                            placeholder="email@contoh.com" style={{ flex: 1, border: "1px solid #d1d5db", borderRadius: 8, padding: "10px 12px", fontSize: 13, outline: "none", fontFamily: "Plus Jakarta Sans, sans-serif" }} />
                                        <button type="submit" disabled={saving}
                                            style={{ background: "#1a3a1f", color: "#9FF782", border: "none", borderRadius: 8, padding: "10px 16px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "Plus Jakarta Sans, sans-serif" }}>
                                            Kirim
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ── Main Page ─────────────────────────────────────────────────
export default function SharedTabungan() {
    const navigate = useNavigate();
    const [groups, setGroups] = useState([]);
    const [invites, setInvites] = useState([]);
    const [personalBal, setPersonalBal] = useState([]);
    const [sharedBal, setSharedBal] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState(null);
    const [showCreate, setShowCreate] = useState(false);
    const [showJoin, setShowJoin] = useState(false);
    const [uid, setUid] = useState(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [active, setActive] = useState("tabungan");
    const [profile, setProfile] = useState(null);
    const [personal, setPersonal] = useState(null);

    useEffect(() => { fetchAll(); }, []);

    const fetchAll = async () => {
        setLoading(true);
        try {
            const [profileRes, groupsRes, invitesRes, personalRes, sharedRes] = await Promise.all([
                API.get("/auth/profile"),
                API.get("/shared-tabungan"),
                API.get("/shared-tabungan/invites/pending"),
                API.get("/balance"),
                API.get("/shared-balance"),
            ]);
            setUid(profileRes.data.uid);
            setProfile(profileRes.data);
            setPersonal(personalRes.data);
            setGroups(groupsRes.data);
            setInvites(invitesRes.data);
            setPersonalBal(personalRes.data);
            setSharedBal(sharedRes.data);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const handleRefreshGroup = async (groupId) => {
        if (!groupId) { fetchAll(); return; }
        try {
            const [groupRes, personalRes, sharedRes] = await Promise.all([
                API.get(`/shared-tabungan/${groupId}`),
                API.get("/balance"),
                API.get("/shared-balance"),
            ]);
            setSelected(groupRes.data);
            setGroups(prev => prev.map(g => g.id === groupId ? { ...g, ...groupRes.data } : g));
            setPersonalBal(personalRes.data);
            setSharedBal(sharedRes.data);
        } catch (err) { console.error(err); }
    };

    return (
        <div className="flex h-screen bg-white overflow-hidden w-full" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap'); * { box-sizing: border-box; margin: 0; padding: 0; }
                @media (max-width: 768px) {
                    aside.fixed { top: 56px !important; height: calc(100vh - 56px) !important; }
                }
            `}</style>

            <Sidebar active={active} setActive={setActive} handleLogout={() => navigate("/")} isOpen={isSidebarOpen} setOpen={setIsSidebarOpen} />

            <main className="flex-1 flex flex-col h-screen overflow-hidden w-full">
                <Navbar profile={profile} personal={personal} isSidebarOpen={isSidebarOpen} setSidebarOpen={setIsSidebarOpen} />

                <div style={{ flex: 1, padding: "40px 40px", overflowY: "auto", width: "100%", background: "#f5f5f5" }}>

                        {/* Header with Back Button */}
                        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
                            <button onClick={() => navigate("/")} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", padding: 0 }}>←</button>
                            <div>
                                <h1 style={{ fontSize: 28, fontWeight: 800, color: "#1a3a1f", marginBottom: 4 }}>Tabungan Bersama</h1>
                                <p style={{ fontSize: 13, color: "#6b7280" }}>Buat Taget sekarang bersama teman-teman mu!</p>
                            </div>
                        </div>

                        {/* Daftar Target Section with Action Buttons */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                            <h2 style={{ fontSize: 14, fontWeight: 700, color: "#1a3a1f" }}>Daftar Target ({groups.length})</h2>
                            <div style={{ display: "flex", gap: 10 }}>
                                <button onClick={() => setShowCreate(true)}
                                    style={{ background: "#1a3a1f", color: "white", border: "none", borderRadius: 8, padding: "10px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "Plus Jakarta Sans, sans-serif", display: "flex", alignItems: "center", gap: 6, transition: "background 0.2s" }}
                                    onMouseEnter={e => e.target.style.background = "#0f2a18"}
                                    onMouseLeave={e => e.target.style.background = "#1a3a1f"}>
                                    + Buat Target
                                </button>
                                <button onClick={() => setShowJoin(true)}
                                    style={{ background: "white", color: "#f59e0b", border: "2px solid #fbbf24", borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "Plus Jakarta Sans, sans-serif", display: "flex", alignItems: "center", gap: 6, transition: "all 0.2s" }}
                                    onMouseEnter={e => { e.target.style.background = "#fef3c7"; }}
                                    onMouseLeave={e => { e.target.style.background = "white"; }}>
                                    🔑 Masukan Kode
                                </button>
                            </div>
                        </div>

                        {loading ? (
                            <div style={{ textAlign: "center", padding: 48, color: "#9ca3af" }}>Loading...</div>
                        ) : groups.length === 0 ? (
                            <div style={{ textAlign: "center", padding: 48, color: "#9ca3af", background: "white", borderRadius: 12 }}>
                                <p style={{ fontSize: 40, marginBottom: 12 }}>🤝</p>
                                <p style={{ fontSize: 14, marginBottom: 16 }}>Belum ada tabungan bersama.</p>
                                <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                                    <button onClick={() => setShowCreate(true)} style={{ background: "#1a3a1f", color: "white", border: "none", borderRadius: 8, padding: "10px 16px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "Plus Jakarta Sans, sans-serif" }}>+ Buat Target</button>
                                    <button onClick={() => setShowJoin(true)} style={{ background: "white", color: "#f59e0b", border: "2px solid #fbbf24", borderRadius: 8, padding: "8px 16px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "Plus Jakarta Sans, sans-serif" }}>🔑 Masukan Kode</button>
                                </div>
                            </div>
                        ) : (
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 }}>
                                {groups.map(g => (
                                    <TargetCard key={g.id} group={g} uid={uid} onClick={setSelected} />
                                ))}
                            </div>
                        )}

                    {selected && uid && (
                        <GroupDetail
                            group={selected} uid={uid}
                            personalBalances={personalBal}
                            sharedBalances={sharedBal}
                            onClose={() => setSelected(null)}
                            onRefresh={handleRefreshGroup}
                        />
                    )}
                     {showCreate && <CreateModal onClose={() => setShowCreate(false)} onCreate={async (form) => { await API.post("/shared-tabungan", form); fetchAll(); }} />}
                    {showJoin && <JoinModal onClose={() => setShowJoin(false)} onJoin={async (code) => { await API.post("/shared-tabungan/join", { inviteCode: code }); fetchAll(); }} />}
                </div>
            </main>
        </div>
    );
}