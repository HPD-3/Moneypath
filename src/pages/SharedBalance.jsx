import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api.js";
import Navbar from "../components/Navbar.jsx";
import Sidebar from "../components/Sidebar.jsx";

const fmt = (n) => `Rp ${(n || 0).toLocaleString("id-ID")}`;

// ── Role Badge ────────────────────────────────────────────────
function RoleBadge({ role }) {
    return (
        <span style={{
            fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20,
            background: role === "admin" ? "#fef9c3" : "#e8fce0",
            color: role === "admin" ? "#854d0e" : "#166534",
            textTransform: "capitalize"
        }}>{role}</span>
    );
}

// ── Group Card ────────────────────────────────────────────────
function GroupCard({ group, uid, onClick }) {
    const members = Object.values(group.members || {});
    const [hov, setHov] = useState(false);

    return (
        <div style={{ background: "white", borderRadius: 12, padding: "16px", border: "1px solid #e5e7eb", marginBottom: 12, cursor: "pointer", boxShadow: hov ? "0 4px 12px rgba(0,0,0,0.08)" : "0 1px 3px rgba(0,0,0,0.05)", transition: "all 0.2s", display: "flex", justifyContent: "space-between", alignItems: "center" }}
            onMouseEnter={() => setHov(true)}
            onMouseLeave={() => setHov(false)}>

            <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 700, fontSize: 14, color: "#1a3a1f", marginBottom: 8 }}>{group.name}</p>
                
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    {/* Member badge */}
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 11, fontWeight: 600, color: "#9ca3af" }}>Member</span>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 16, background: "#1a3a1f", color: "white" }}>{members.length} Anggota</span>
                    </div>

                    {/* Member avatars */}
                    <div style={{ display: "flex", alignItems: "center" }}>
                        {members.slice(0, 5).map((m, i) => (
                            <div key={m.uid} style={{ width: 28, height: 28, borderRadius: "50%", background: `hsl(${(i * 60) % 360}, 70%, 60%)`, color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, border: "2px solid white", marginLeft: i > 0 ? -8 : 0, zIndex: members.length - i }}>
                                {(m.name || m.email || "?")[0].toUpperCase()}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div style={{ textAlign: "right", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 10 }}>
                <div>
                    <p style={{ fontSize: 11, color: "#9ca3af", marginBottom: 2 }}>Saldo Grup</p>
                    <p style={{ fontSize: 16, fontWeight: 800, color: "#1a3a1f" }}>{fmt(group.balance)}</p>
                </div>
                <button onClick={() => onClick(group)}
                    style={{ background: "#1a3a1f", color: "white", border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "Plus Jakarta Sans, sans-serif", transition: "background 0.2s" }}
                    onMouseEnter={e => e.target.style.background = "#0f2a18"}
                    onMouseLeave={e => e.target.style.background = "#1a3a1f"}>
                    Click
                </button>
            </div>
        </div>
    );
}

// ── Create Group Modal ────────────────────────────────────────
function CreateModal({ onClose, onCreate }) {
    const [form, setForm] = useState({ name: "", description: "" });
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
            <div onClick={e => e.stopPropagation()} style={{ background: "white", borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 520, padding: "20px 20px 32px" }}>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
                    <div style={{ width: 40, height: 4, borderRadius: 2, background: "#e5e7eb" }} />
                </div>
                <h2 style={{ fontWeight: 700, fontSize: 18, color: "#1a3a1f", marginBottom: 20 }}>🤝 Buat Saldo Bersama</h2>
                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <div>
                        <label style={{ fontSize: 11, fontWeight: 600, color: "#4b5563", display: "block", marginBottom: 4 }}>Nama Grup *</label>
                        <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required
                            placeholder="cth: Kas Keluarga, Liburan Bareng" style={{ width: "100%", border: "1px solid #d1d5db", borderRadius: 8, padding: "10px 12px", fontSize: 13, outline: "none", fontFamily: "Plus Jakarta Sans, sans-serif" }} />
                    </div>
                    <div>
                        <label style={{ fontSize: 11, fontWeight: 600, color: "#4b5563", display: "block", marginBottom: 4 }}>Deskripsi (opsional)</label>
                        <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                            placeholder="Tujuan grup ini..." rows={2} style={{ width: "100%", border: "1px solid #d1d5db", borderRadius: 8, padding: "10px 12px", fontSize: 13, outline: "none", fontFamily: "Plus Jakarta Sans, sans-serif", resize: "none" }} />
                    </div>
                    <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                        <button type="button" onClick={onClose} style={{ flex: 1, background: "#f3f4f6", color: "#374151", border: "none", borderRadius: 10, padding: "12px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "Plus Jakarta Sans, sans-serif" }}>Batal</button>
                        <button type="submit" disabled={saving} style={{ flex: 2, background: "#1a3a1f", color: "#9FF782", border: "none", borderRadius: 10, padding: "12px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "Plus Jakarta Sans, sans-serif" }}>
                            {saving ? "Membuat..." : "Buat Grup"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ── Join Group Modal ──────────────────────────────────────────
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
                <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
                    <div style={{ width: 40, height: 4, borderRadius: 2, background: "#e5e7eb" }} />
                </div>
                <h2 style={{ fontWeight: 700, fontSize: 18, color: "#1a3a1f", marginBottom: 8 }}>🔑 Masukkan Kode Undangan</h2>
                <p style={{ fontSize: 13, color: "#9ca3af", marginBottom: 20 }}>Minta kode dari admin grup</p>
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
function GroupDetail({ group, uid, onClose, onRefresh, balanceCategories = [] }) {
    const [tab, setTab] = useState("transaksi");
    const [txForm, setTxForm] = useState({ amount: "", type: "income", description: "", note: "", personalBalanceCategory: null });
    const [inviteEmail, setInviteEmail] = useState("");
    const [saving, setSaving] = useState(false);
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    const members = Object.values(group.members || {});
    const myRole = group.members?.[uid]?.role;
    const isAdmin = myRole === "admin";

    const handleCopyCode = () => {
        navigator.clipboard.writeText(group.inviteCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleTransaction = async e => {
        e.preventDefault();
        setError(null);

        const amount = parseFloat(txForm.amount);
        if (isNaN(amount)) {
            setError("Jumlah tidak valid");
            return;
        }

        setSaving(true);
        try {
            await API.post(`/shared-balance/${group.id}/transaction`, {
                amount,
                type: txForm.type,
                description: txForm.description,
                note: txForm.note,
                personalBalanceId: txForm.personalBalanceCategory,
                userId: uid
            });

            setTxForm({
                amount: "",
                type: "income",
                description: "",
                note: "",
                personalBalanceCategory: null
            });

            onRefresh(group.id);
        } catch (err) {
            console.log(err.response?.data);
            setError(err.response?.data?.error || err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleInvite = async e => {
        e.preventDefault();
        setError(null);
        setSaving(true);
        try {
            await API.post(`/shared-balance/${group.id}/invite`, { email: inviteEmail });
            setSuccess(`Undangan dikirim ke ${inviteEmail}`);
            setInviteEmail("");
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            setError(err.response?.data?.error || err.message);
        } finally { setSaving(false); }
    };

    const handleRemoveMember = async (memberId) => {
        if (!confirm("Keluarkan anggota ini?")) return;
        try {
            await API.delete(`/shared-balance/${group.id}/members/${memberId}`);
            onRefresh(group.id);
        } catch (err) { setError(err.message); }
    };

    const handleRegenerateCode = async () => {
        if (!confirm("Generate kode undangan baru? Kode lama tidak bisa dipakai lagi.")) return;
        try {
            const res = await API.post(`/shared-balance/${group.id}/regenerate-code`);
            setSuccess(`Kode baru: ${res.data.inviteCode}`);
            onRefresh(group.id);
        } catch (err) { setError(err.message); }
    };

    const handleDeleteGroup = async () => {
        if (!confirm("Hapus grup ini? Semua data akan hilang.")) return;
        try {
            await API.delete(`/shared-balance/${group.id}`);
            onClose();
            onRefresh(null);
        } catch (err) { setError(err.message); }
    };

    return (
        <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 100, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
            <div onClick={e => e.stopPropagation()} style={{ background: "white", borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 520, maxHeight: "90vh", overflowY: "auto" }}>

                {/* Handle */}
                <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 0" }}>
                    <div style={{ width: 40, height: 4, borderRadius: 2, background: "#e5e7eb" }} />
                </div>

                {/* Header */}
                <div style={{ background: "linear-gradient(135deg,#1a3a1f,#0f2a18)", margin: 16, borderRadius: 14, padding: "20px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div>
                            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 4 }}>🤝 Saldo Bersama</p>
                            <h2 style={{ fontWeight: 700, fontSize: 18, color: "white", marginBottom: 4 }}>{group.name}</h2>
                            {group.description && <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>{group.description}</p>}
                        </div>
                        <div style={{ textAlign: "right" }}>
                            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 2 }}>Total Saldo</p>
                            <p style={{ fontSize: 22, fontWeight: 800, color: "#9FF782" }}>{fmt(group.balance)}</p>
                        </div>
                    </div>

                    {/* Invite Code */}
                    <div style={{ marginTop: 16, background: "rgba(255,255,255,0.08)", borderRadius: 10, padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                            <p style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginBottom: 2 }}>Kode Undangan</p>
                            <p style={{ fontSize: 18, fontWeight: 800, color: "#9FF782", letterSpacing: 3, fontFamily: "monospace" }}>{group.inviteCode}</p>
                        </div>
                        <div style={{ display: "flex", gap: 8 }}>
                            <button onClick={handleCopyCode}
                                style={{ background: copied ? "#9FF782" : "rgba(255,255,255,0.15)", color: copied ? "#0a1f10" : "white", border: "none", borderRadius: 8, padding: "6px 12px", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "Plus Jakarta Sans, sans-serif" }}>
                                {copied ? "✓ Copied!" : "Copy"}
                            </button>
                            {isAdmin && (
                                <button onClick={handleRegenerateCode}
                                    style={{ background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)", border: "none", borderRadius: 8, padding: "6px 10px", fontSize: 11, cursor: "pointer" }}>
                                    🔄
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <div style={{ padding: "0 16px 24px" }}>
                    {/* Alerts */}
                    {error && <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "#991b1b", marginBottom: 12 }}>⚠️ {error}</div>}
                    {success && <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "#166534", marginBottom: 12 }}>✅ {success}</div>}

                    {/* Tabs */}
                    <div style={{ display: "flex", gap: 0, marginBottom: 16, background: "#f3f4f6", borderRadius: 10, padding: 3 }}>
                        {["transaksi", "anggota", "undang"].map(t => (
                            <button key={t} onClick={() => setTab(t)}
                                style={{ flex: 1, padding: "8px", borderRadius: 8, border: "none", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "Plus Jakarta Sans, sans-serif", background: tab === t ? "white" : "transparent", color: tab === t ? "#1a3a1f" : "#9ca3af", textTransform: "capitalize", boxShadow: tab === t ? "0 1px 4px rgba(0,0,0,0.08)" : "none", transition: "all 0.2s" }}>
                                {t === "transaksi" ? "💸 Transaksi" : t === "anggota" ? "👥 Anggota" : "📨 Undang"}
                            </button>
                        ))}
                    </div>

                    {/* ── TRANSAKSI TAB ─────────────────────── */}
                    {tab === "transaksi" && (
                        <>
                            {/* Add Transaction */}
                            <form onSubmit={handleTransaction} style={{ background: "#f8fdf8", border: "1px solid #d1fae5", borderRadius: 12, padding: 14, marginBottom: 16 }}>
                                <p style={{ fontSize: 12, fontWeight: 700, color: "#1a3a1f", marginBottom: 10 }}>+ Tambah Transaksi</p>
                                <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                                    <select value={txForm.type} onChange={e => setTxForm({ ...txForm, type: e.target.value })}
                                        style={{ flex: 1, border: "1px solid #d1d5db", borderRadius: 8, padding: "9px 10px", fontSize: 12, outline: "none", fontFamily: "Plus Jakarta Sans, sans-serif" }}>
                                        <option value="income">💰 Pemasukan</option>
                                        <option value="expense">💸 Pengeluaran</option>
                                    </select>
                                    <div style={{ flex: 2, position: "relative" }}>
                                        <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: "#9ca3af" }}>Rp</span>
                                        <input type="number" value={txForm.amount} onChange={e => setTxForm({ ...txForm, amount: e.target.value })} required min={1}
                                            placeholder="0" style={{ width: "100%", border: "1px solid #d1d5db", borderRadius: 8, padding: "9px 10px 9px 28px", fontSize: 12, outline: "none", fontFamily: "Plus Jakarta Sans, sans-serif" }} />
                                    </div>
                                </div>
                                <input value={txForm.description} onChange={e => setTxForm({ ...txForm, description: e.target.value })} required
                                    placeholder="Keterangan transaksi..." style={{ width: "100%", border: "1px solid #d1d5db", borderRadius: 8, padding: "9px 10px", fontSize: 12, outline: "none", fontFamily: "Plus Jakarta Sans, sans-serif", marginBottom: 8 }} />
                                <input value={txForm.note} onChange={e => setTxForm({ ...txForm, note: e.target.value })}
                                    placeholder="Catatan (opsional)..." style={{ width: "100%", border: "1px solid #d1d5db", borderRadius: 8, padding: "9px 10px", fontSize: 12, outline: "none", fontFamily: "Plus Jakarta Sans, sans-serif", marginBottom: 10 }} />

                                {/* NEW: Personal Balance Category Selector */}
                                <div style={{ marginBottom: 10 }}>
                                    <label style={{ fontSize: 11, fontWeight: 600, color: "#4b5563", display: "block", marginBottom: 4 }}>Kategori Saldo Pribadi (opsional)</label>
                                    <select value={txForm.personalBalanceCategory || ""} onChange={e => setTxForm({ ...txForm, personalBalanceCategory: e.target.value || null })}
                                        style={{ width: "100%", border: "1px solid #d1d5db", borderRadius: 8, padding: "9px 10px", fontSize: 12, outline: "none", fontFamily: "Plus Jakarta Sans, sans-serif" }}>
                                        <option value="">-- Tidak ada (grup saja) --</option>
                                        {balanceCategories.map(cat => (
                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                        ))}
                                    </select>
                                    <p style={{ fontSize: 10, color: "#9ca3af", marginTop: 3 }}>💡 Pilih untuk sinkronisasi ke saldo pribadi Anda</p>
                                </div>

                                <button type="submit" disabled={saving}
                                    style={{ width: "100%", background: "#1a3a1f", color: "#9FF782", border: "none", borderRadius: 8, padding: "10px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "Plus Jakarta Sans, sans-serif" }}>
                                    {saving ? "Menyimpan..." : "Simpan Transaksi"}
                                </button>
                            </form>

                            {/* Transaction List */}
                            {(group.transactions || []).map((tx, i) => (
                                <div key={tx.id} style={{ padding: "12px 0", borderBottom: "1px solid #f3f4f6" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>

                                        {/* LEFT */}
                                        <div style={{ flex: 1 }}>
                                            <div>
                                                <p>{tx.description}</p>

                                                {tx.personalBalanceName && (
                                                    <p style={{ fontSize: "12px", color: "#888" }}>
                                                        Sumber dana: {tx.personalBalanceName}
                                                    </p>
                                                )}
                                            </div>

                                            {/* 🔥 CATEGORY BADGE */}
                                            {tx.personalBalanceCategory && (
                                                <span style={{
                                                    display: "inline-block",
                                                    marginTop: 4,
                                                    fontSize: 10,
                                                    fontWeight: 600,
                                                    padding: "2px 8px",
                                                    borderRadius: 20,
                                                    background: "#e0f2fe",
                                                    color: "#0369a1"
                                                }}>
                                                    {tx.personalBalanceCategory}
                                                </span>
                                            )}

                                            {/* META */}
                                            <div style={{ display: "flex", gap: 8, marginTop: 3 }}>
                                                <p style={{ fontSize: 11, color: "#9ca3af" }}>
                                                    oleh {(tx.addedByName && tx.addedByName.trim()) || "Unknown"}
                                                </p>
                                                <p style={{ fontSize: 11, color: "#9ca3af" }}>
                                                    {tx.date
                                                        ? new Date(tx.date).toLocaleDateString("id-ID", {
                                                            day: "2-digit",
                                                            month: "short",
                                                            year: "numeric"
                                                        })
                                                        : "-"}
                                                </p>
                                            </div>

                                            {tx.note && (
                                                <p style={{ fontSize: 11, color: "#9ca3af", marginTop: 2, fontStyle: "italic" }}>
                                                    📝 {tx.note}
                                                </p>
                                            )}

                                            {tx.personalBalanceCategory && (
                                                <p style={{ fontSize: 11, color: "#3b82f6", marginTop: 2 }}>
                                                    💳 Sumber dana: {tx.personalBalanceCategory}
                                                </p>
                                            )}

                                            {tx.linkedPersonalTxId && (
                                                <p style={{ fontSize: 10, color: "#10b981", marginTop: 2, fontWeight: 600 }}>
                                                    ✅ Tersinkronisasi ke saldo pribadi
                                                </p>
                                            )}
                                        </div>

                                        {/* RIGHT (AMOUNT) */}
                                        <p style={{
                                            fontSize: 14,
                                            fontWeight: 700,
                                            color: tx.type === "income" ? "#166534" : "#991b1b"
                                        }}>
                                            {tx.type === "income" ? "+" : "−"}
                                            {fmt(tx.amount)}
                                        </p>

                                    </div>
                                </div>
                            ))}
                        </>
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
                                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                                            <p style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>{m.name}</p>
                                            <RoleBadge role={m.role} />
                                            {m.uid === uid && <span style={{ fontSize: 10, color: "#9ca3af" }}>(kamu)</span>}
                                        </div>
                                        <p style={{ fontSize: 11, color: "#9ca3af" }}>Kontribusi: {fmt(m.contributed)}</p>
                                    </div>
                                    {isAdmin && m.uid !== uid && (
                                        <button onClick={() => handleRemoveMember(m.uid)}
                                            style={{ background: "#fee2e2", color: "#ef4444", border: "none", borderRadius: 6, padding: "4px 10px", fontSize: 11, cursor: "pointer", fontFamily: "Plus Jakarta Sans, sans-serif" }}>
                                            Keluar
                                        </button>
                                    )}
                                </div>
                            ))}

                            {/* Delete group */}
                            {isAdmin && (
                                <button onClick={handleDeleteGroup}
                                    style={{ width: "100%", marginTop: 20, background: "none", border: "1px solid #fca5a5", borderRadius: 10, padding: "12px", fontSize: 13, fontWeight: 600, color: "#ef4444", cursor: "pointer", fontFamily: "Plus Jakarta Sans, sans-serif" }}>
                                    🗑️ Hapus Grup
                                </button>
                            )}
                        </div>
                    )}

                    {/* ── UNDANG TAB ────────────────────────── */}
                    {tab === "undang" && (
                        <div>
                            {/* Invite code share */}
                            <div style={{ background: "#f8fdf8", border: "1px solid #d1fae5", borderRadius: 12, padding: 16, marginBottom: 16, textAlign: "center" }}>
                                <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 8 }}>Bagikan kode ini ke teman</p>
                                <p style={{ fontSize: 28, fontWeight: 800, letterSpacing: 6, color: "#1a3a1f", fontFamily: "monospace" }}>{group.inviteCode}</p>
                                <button onClick={handleCopyCode}
                                    style={{ marginTop: 12, background: "#1a3a1f", color: "#9FF782", border: "none", borderRadius: 8, padding: "8px 24px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "Plus Jakarta Sans, sans-serif" }}>
                                    {copied ? "✓ Disalin!" : "📋 Salin Kode"}
                                </button>
                            </div>

                            {/* Invite by email (admin only) */}
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

// ── Main Shared Balance Page ──────────────────────────────────
export default function SharedBalance() {
    const navigate = useNavigate();
    const [groups, setGroups] = useState([]);
    const [invites, setInvites] = useState([]);
    const [balances, setBalances] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState(null);
    const [showCreate, setShowCreate] = useState(false);
    const [showJoin, setShowJoin] = useState(false);
    const [uid, setUid] = useState(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [active, setActive] = useState("balance");
    const [profile, setProfile] = useState(null);
    const [personal, setPersonal] = useState(null);

    useEffect(() => { fetchAll(); }, []);

    const fetchAll = async () => {
        setLoading(true);
        try {
            const [profileRes, groupsRes, invitesRes, personalRes] = await Promise.all([
                API.get("/auth/profile"),
                API.get("/shared-balance"),
                API.get("/shared-balance/invites/pending"),
                API.get("/users/personal").catch(() => ({ data: null })),
            ]);
            setUid(profileRes.data.uid);
            setProfile(profileRes.data);
            setPersonal(personalRes.data);
            setGroups(groupsRes.data);
            setInvites(invitesRes.data);

            // NEW: Try to fetch personal balance categories (optional - doesn't block if fails)
            try {
                const balancesRes = await API.get("/balance");  // Fetch personal balance categories
                setBalances(balancesRes.data);
                console.log("✅ Fetched balance categories:", balancesRes.data);
            } catch (balanceErr) {
                console.warn("⚠️ Could not fetch balance categories:", balanceErr.message);
                setBalances([]);  // Fallback to empty array
            }
        } catch (err) {
            console.error(err);
        }
        finally {
            setLoading(false);
        }
    };

    const handleCreate = async (form) => {
        await API.post("/shared-balance", form);
        fetchAll();
    };

    const handleJoin = async (code) => {
        await API.post("/shared-balance/join", { inviteCode: code });
        fetchAll();
    };

    const handleAcceptInvite = async (groupId) => {
        await API.post(`/shared-balance/invites/${groupId}/accept`);
        fetchAll();
    };

    const handleRefreshGroup = async (groupId) => {
        if (!groupId) { fetchAll(); return; }
        try {
            const res = await API.get(`/shared-balance/${groupId}`);
            setSelected(res.data);
            setGroups(prev => prev.map(g => g.id === groupId ? { ...g, ...res.data } : g));
        } catch (err) { console.error(err); }
    };


    return (
        <div className="flex h-screen bg-white overflow-hidden w-full" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
                @media (max-width: 768px) {
                    aside.fixed { top: 56px !important; height: calc(100vh - 56px) !important; }
                }
            `}</style>

            <Sidebar active={active} setActive={setActive} handleLogout={() => navigate("/")} isOpen={isSidebarOpen} setOpen={setIsSidebarOpen} />

            <main className="flex-1 flex flex-col h-screen overflow-hidden w-full">
                <Navbar profile={profile} personal={personal} isSidebarOpen={isSidebarOpen} setSidebarOpen={setIsSidebarOpen} />

                <div className="flex-1 overflow-y-auto bg-gray-50">
                    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 20px" }}>

                        {/* Header Section */}
                        <div style={{ marginBottom: 32 }}>
                            <h1 style={{ fontSize: 28, fontWeight: 800, color: "#1a3a1f", marginBottom: 4 }}>Saldo Bersama</h1>
                            <p style={{ fontSize: 13, color: "#6b7280" }}>Buat grup sekarang dan capai target keuanganmu bersama-teman-teman!</p>
                        </div>

                        {/* Daftar Grup Section with Action Buttons */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                            <h2 style={{ fontSize: 14, fontWeight: 700, color: "#1a3a1f" }}>Daftar Grup ({groups.length})</h2>
                            <div style={{ display: "flex", gap: 10 }}>
                                <button onClick={() => setShowCreate(true)}
                                    style={{ background: "#1a3a1f", color: "white", border: "none", borderRadius: 8, padding: "10px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "Plus Jakarta Sans, sans-serif", display: "flex", alignItems: "center", gap: 6, transition: "background 0.2s" }}
                                    onMouseEnter={e => e.target.style.background = "#0f2a18"}
                                    onMouseLeave={e => e.target.style.background = "#1a3a1f"}>
                                    + Buat Grup
                                </button>
                                <button onClick={() => setShowJoin(true)}
                                    style={{ background: "white", color: "#f59e0b", border: "2px solid #fbbf24", borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "Plus Jakarta Sans, sans-serif", display: "flex", alignItems: "center", gap: 6, transition: "all 0.2s" }}
                                    onMouseEnter={e => { e.target.style.background = "#fef3c7"; }}
                                    onMouseLeave={e => { e.target.style.background = "white"; }}>
                                    🔑 Masukkan Kode
                                </button>
                            </div>
                        </div>

                        {/* Groups List */}
                        {loading ? (
                            <div style={{ textAlign: "center", padding: 48, color: "#9ca3af" }}>Loading...</div>
                        ) : groups.length === 0 ? (
                            <div style={{ textAlign: "center", padding: 48, color: "#9ca3af", background: "white", borderRadius: 12 }}>
                                <p style={{ fontSize: 40, marginBottom: 12 }}>🤝</p>
                                <p style={{ fontSize: 14, marginBottom: 16 }}>Belum ada saldo bersama.</p>
                                <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                                    <button onClick={() => setShowCreate(true)}
                                        style={{ background: "#1a3a1f", color: "white", border: "none", borderRadius: 8, padding: "10px 16px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "Plus Jakarta Sans, sans-serif" }}>
                                        + Buat Grup
                                    </button>
                                    <button onClick={() => setShowJoin(true)}
                                        style={{ background: "white", color: "#f59e0b", border: "2px solid #fbbf24", borderRadius: 8, padding: "8px 16px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "Plus Jakarta Sans, sans-serif" }}>
                                        🔑 Masukkan Kode
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                                {groups.map(g => (
                                    <GroupCard key={g.id} group={g} uid={uid} onClick={setSelected} />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
                {selected && uid && (
                    <GroupDetail group={selected} uid={uid} onClose={() => setSelected(null)} onRefresh={handleRefreshGroup} balanceCategories={balances} />
                )}
                {showCreate && <CreateModal onClose={() => setShowCreate(false)} onCreate={handleCreate} />}
                {showJoin && <JoinModal onClose={() => setShowJoin(false)} onJoin={handleJoin} />}
            </main>
        </div>
    );
}