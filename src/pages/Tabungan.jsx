import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api.js";

// ── Helpers ───────────────────────────────────────────────────
const fmt = (n) => `Rp ${(n || 0).toLocaleString("id-ID")}`;
const pct = (terkumpul, target) => Math.min(Math.round((terkumpul / target) * 100), 100);

const CATEGORIES = ["umum", "liburan", "elektronik", "kendaraan", "pendidikan", "darurat", "lainnya"];
const CAT_ICONS  = { umum: "🎯", liburan: "✈️", elektronik: "💻", kendaraan: "🚗", pendidikan: "📚", darurat: "🏥", lainnya: "📦" };

// ── Target Card ───────────────────────────────────────────────
function TargetCard({ target, onClick }) {
    const progress = pct(target.terkumpul, target.targetAmount);
    const [hov, setHov] = useState(false);

    return (
        <div
            onClick={() => onClick(target)}
            onMouseEnter={() => setHov(true)}
            onMouseLeave={() => setHov(false)}
            style={{ background: "white", borderRadius: 14, overflow: "hidden", cursor: "pointer", boxShadow: hov ? "0 8px 24px rgba(0,0,0,0.12)" : "0 2px 8px rgba(0,0,0,0.06)", transform: hov ? "translateY(-2px)" : "none", transition: "all 0.2s", border: target.isCompleted ? "2px solid #9FF782" : "1px solid #f0f0f0" }}>

            {/* Image / Icon Area */}
            <div style={{ height: 110, background: target.imageUrl ? `url(${target.imageUrl}) center/cover` : "linear-gradient(135deg, #1a3a1f, #0f2a18)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                {!target.imageUrl && <span style={{ fontSize: 40 }}>{CAT_ICONS[target.category] || "🎯"}</span>}
                {target.isCompleted && (
                    <div style={{ position: "absolute", top: 8, right: 8, background: "#9FF782", color: "#0a1f10", borderRadius: 20, padding: "2px 10px", fontSize: 10, fontWeight: 700 }}>
                        ✓ Tercapai!
                    </div>
                )}
            </div>

            <div style={{ padding: "14px 16px" }}>
                <p style={{ fontWeight: 700, fontSize: 14, color: "#1a3a1f", marginBottom: 2 }}>{target.name}</p>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#9ca3af", marginBottom: 10 }}>
                    <span>Target</span>
                    <span style={{ fontWeight: 600, color: "#374151" }}>{fmt(target.targetAmount)}</span>
                </div>

                {/* Progress bar */}
                <div style={{ background: "#f3f4f6", borderRadius: 4, height: 6, marginBottom: 8, overflow: "hidden" }}>
                    <div style={{ width: `${progress}%`, height: "100%", borderRadius: 4, background: target.isCompleted ? "#9FF782" : "#1a3a1f", transition: "width 0.5s" }} />
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                        <p style={{ fontSize: 10, color: "#9ca3af" }}>Terkumpul</p>
                        <p style={{ fontSize: 13, fontWeight: 700, color: "#1a3a1f" }}>{fmt(target.terkumpul)}</p>
                    </div>
                    <div style={{ background: "#1a3a1f", color: "#9FF782", borderRadius: 8, padding: "5px 12px", fontSize: 11, fontWeight: 600 }}>
                        Detail ▶
                    </div>
                </div>
            </div>
        </div>
    );
}

// ── Detail / Alokasi Modal ────────────────────────────────────
function DetailModal({ target, balances, onClose, onAlokasi, onDelete }) {
    const [amount, setAmount]   = useState("");
    const [balId, setBalId]     = useState(balances[0]?.id || "");
    const [riwayat, setRiwayat] = useState([]);
    const [saving, setSaving]   = useState(false);
    const [error, setError]     = useState(null);
    const [tab, setTab]         = useState("detail"); // detail | riwayat

    const progress = pct(target.terkumpul, target.targetAmount);
    const sisaTarget = target.targetAmount - target.terkumpul;
    const selectedBal = balances.find(b => b.id === balId);

    useEffect(() => {
        API.get(`/tabungan/${target.id}/riwayat`)
            .then(res => setRiwayat(res.data))
            .catch(() => {});
    }, [target.id]);

    const handleAlokasi = async e => {
        e.preventDefault();
        setError(null);
        const amt = parseFloat(amount);
        if (!amt || amt <= 0) return setError("Masukkan jumlah yang valid");
        if (amt > (selectedBal?.balance || 0)) return setError("Saldo tidak mencukupi");
        if (amt > sisaTarget) return setError(`Maksimal alokasi: ${fmt(sisaTarget)}`);

        setSaving(true);
        try {
            await onAlokasi(target.id, amt, balId, selectedBal?.name);
            setAmount("");
            // Refresh riwayat
            const res = await API.get(`/tabungan/${target.id}/riwayat`);
            setRiwayat(res.data);
        } catch (err) {
            setError(err.response?.data?.error || err.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 100, display: "flex", alignItems: "flex-end", justifyContent: "center", padding: "0" }}>
            <div onClick={e => e.stopPropagation()} style={{ background: "white", borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 520, maxHeight: "90vh", overflowY: "auto" }}>

                {/* Handle */}
                <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 0" }}>
                    <div style={{ width: 40, height: 4, borderRadius: 2, background: "#e5e7eb" }} />
                </div>

                {/* Image Header */}
                <div style={{ height: 140, background: target.imageUrl ? `url(${target.imageUrl}) center/cover` : "linear-gradient(135deg, #1a3a1f, #0f2a18)", display: "flex", alignItems: "center", justifyContent: "center", margin: "12px 16px", borderRadius: 14, position: "relative" }}>
                    {!target.imageUrl && <span style={{ fontSize: 48 }}>{CAT_ICONS[target.category] || "🎯"}</span>}
                    {target.isCompleted && (
                        <div style={{ position: "absolute", top: 10, right: 10, background: "#9FF782", color: "#0a1f10", borderRadius: 20, padding: "4px 12px", fontSize: 11, fontWeight: 700 }}>
                            🎉 Tercapai!
                        </div>
                    )}
                </div>

                <div style={{ padding: "0 20px 24px" }}>
                    {/* Title */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                        <h2 style={{ fontWeight: 700, fontSize: 18, color: "#1a3a1f" }}>{target.name}</h2>
                        <button onClick={() => onDelete(target.id)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 13, fontFamily: "Plus Jakarta Sans, sans-serif" }}>Hapus</button>
                    </div>

                    {/* Progress Stats */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
                        {[
                            { label: "Target", value: fmt(target.targetAmount), color: "#1a3a1f" },
                            { label: "Terkumpul", value: fmt(target.terkumpul), color: "#166534" },
                            { label: "Sisa", value: fmt(Math.max(sisaTarget, 0)), color: target.isCompleted ? "#166534" : "#b45309" },
                        ].map((s, i) => (
                            <div key={i} style={{ background: "#f8fdf8", borderRadius: 10, padding: "10px 12px" }}>
                                <p style={{ fontSize: 10, color: "#9ca3af", marginBottom: 3 }}>{s.label}</p>
                                <p style={{ fontSize: 12, fontWeight: 700, color: s.color }}>{s.value}</p>
                            </div>
                        ))}
                    </div>

                    {/* Progress Bar */}
                    <div style={{ marginBottom: 20 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#9ca3af", marginBottom: 6 }}>
                            <span>Progress</span>
                            <span style={{ fontWeight: 700, color: "#1a3a1f" }}>{progress}%</span>
                        </div>
                        <div style={{ background: "#f3f4f6", borderRadius: 6, height: 10, overflow: "hidden" }}>
                            <div style={{ width: `${progress}%`, height: "100%", borderRadius: 6, background: target.isCompleted ? "#9FF782" : "linear-gradient(90deg, #1a3a1f, #9FF782)", transition: "width 0.5s" }} />
                        </div>
                    </div>

                    {/* Tabs */}
                    <div style={{ display: "flex", gap: 0, marginBottom: 16, background: "#f3f4f6", borderRadius: 10, padding: 3 }}>
                        {["detail", "riwayat"].map(t => (
                            <button key={t} onClick={() => setTab(t)}
                                style={{ flex: 1, padding: "8px", borderRadius: 8, border: "none", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "Plus Jakarta Sans, sans-serif", background: tab === t ? "white" : "transparent", color: tab === t ? "#1a3a1f" : "#9ca3af", boxShadow: tab === t ? "0 1px 4px rgba(0,0,0,0.08)" : "none", transition: "all 0.2s", textTransform: "capitalize" }}>
                                {t === "detail" ? "Alokasi Dana" : "Riwayat Setoran"}
                            </button>
                        ))}
                    </div>

                    {/* Alokasi Form */}
                    {tab === "detail" && !target.isCompleted && (
                        <form onSubmit={handleAlokasi}>
                            <div style={{ marginBottom: 12 }}>
                                <label style={{ fontSize: 11, fontWeight: 600, color: "#4b5563", display: "block", marginBottom: 4 }}>Sumber Saldo</label>
                                <select value={balId} onChange={e => setBalId(e.target.value)}
                                    style={{ width: "100%", border: "1px solid #d1d5db", borderRadius: 8, padding: "10px 12px", fontSize: 13, outline: "none", fontFamily: "Plus Jakarta Sans, sans-serif" }}>
                                    {balances.map(b => (
                                        <option key={b.id} value={b.id}>
                                            {b.name} — {fmt(b.balance)}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div style={{ marginBottom: 12 }}>
                                <label style={{ fontSize: 11, fontWeight: 600, color: "#4b5563", display: "block", marginBottom: 4 }}>Jumlah Setoran</label>
                                <div style={{ position: "relative" }}>
                                    <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: "#9ca3af" }}>Rp</span>
                                    <input
                                        type="number"
                                        value={amount}
                                        onChange={e => setAmount(e.target.value)}
                                        placeholder="0"
                                        min={1}
                                        style={{ width: "100%", border: "1px solid #d1d5db", borderRadius: 8, padding: "10px 12px 10px 36px", fontSize: 13, outline: "none", fontFamily: "Plus Jakarta Sans, sans-serif" }}
                                    />
                                </div>
                                {selectedBal && (
                                    <p style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}>
                                        Saldo tersedia: {fmt(selectedBal.balance)}
                                    </p>
                                )}
                            </div>

                            {/* Quick amount buttons */}
                            <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
                                {[50000, 100000, 250000, 500000].map(v => (
                                    <button key={v} type="button" onClick={() => setAmount(String(v))}
                                        style={{ background: amount == v ? "#1a3a1f" : "#f3f4f6", color: amount == v ? "#9FF782" : "#374151", border: "none", borderRadius: 8, padding: "5px 10px", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "Plus Jakarta Sans, sans-serif" }}>
                                        +{(v / 1000)}rb
                                    </button>
                                ))}
                            </div>

                            {error && <p style={{ fontSize: 12, color: "#ef4444", marginBottom: 10 }}>⚠️ {error}</p>}

                            <button type="submit" disabled={saving || balances.length === 0}
                                style={{ width: "100%", background: "#1a3a1f", color: "#9FF782", border: "none", borderRadius: 10, padding: "13px", fontSize: 14, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", fontFamily: "Plus Jakarta Sans, sans-serif", opacity: saving ? 0.7 : 1 }}>
                                {saving ? "Menyetor..." : "💰 Setor ke Tabungan"}
                            </button>
                        </form>
                    )}

                    {/* Completed state */}
                    {tab === "detail" && target.isCompleted && (
                        <div style={{ textAlign: "center", padding: "20px 0" }}>
                            <p style={{ fontSize: 40, marginBottom: 10 }}>🎉</p>
                            <p style={{ fontWeight: 700, color: "#166534", fontSize: 16 }}>Target Tercapai!</p>
                            <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 6 }}>Selamat! Kamu berhasil mencapai target tabungan ini.</p>
                        </div>
                    )}

                    {/* Riwayat */}
                    {tab === "riwayat" && (
                        <div>
                            {riwayat.length === 0 ? (
                                <p style={{ textAlign: "center", color: "#9ca3af", padding: "20px 0", fontSize: 13 }}>Belum ada setoran.</p>
                            ) : riwayat.map((r, i) => (
                                <div key={r.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: i < riwayat.length - 1 ? "1px solid #f3f4f6" : "none" }}>
                                    <div>
                                        <p style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>Setoran dari {r.balanceName}</p>
                                        <p style={{ fontSize: 10, color: "#9ca3af", marginTop: 2 }}>
                                            {new Date(r.date).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })}
                                        </p>
                                    </div>
                                    <p style={{ fontSize: 13, fontWeight: 700, color: "#166534" }}>+{fmt(r.amount)}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ── Create Target Modal ───────────────────────────────────────
function CreateModal({ onClose, onCreate }) {
    const EMPTY = { name: "", targetAmount: "", deadline: "", imageUrl: "", category: "umum" };
    const [form, setForm] = useState(EMPTY);
    const [saving, setSaving] = useState(false);

    const handleSubmit = async e => {
        e.preventDefault();
        setSaving(true);
        try {
            await onCreate({ ...form, targetAmount: parseFloat(form.targetAmount) });
            onClose();
        } catch (err) { console.error(err); }
        finally { setSaving(false); }
    };

    return (
        <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 100, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
            <div onClick={e => e.stopPropagation()} style={{ background: "white", borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 520, padding: "20px 20px 32px" }}>

                <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
                    <div style={{ width: 40, height: 4, borderRadius: 2, background: "#e5e7eb" }} />
                </div>

                <h2 style={{ fontWeight: 700, fontSize: 18, color: "#1a3a1f", marginBottom: 20 }}>+ Tambah Target Tabungan</h2>

                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <div>
                        <label style={{ fontSize: 11, fontWeight: 600, color: "#4b5563", display: "block", marginBottom: 4 }}>Nama Target *</label>
                        <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required
                            placeholder="cth: Liburan ke Bali" style={{ width: "100%", border: "1px solid #d1d5db", borderRadius: 8, padding: "10px 12px", fontSize: 13, outline: "none", fontFamily: "Plus Jakarta Sans, sans-serif" }} />
                    </div>

                    <div>
                        <label style={{ fontSize: 11, fontWeight: 600, color: "#4b5563", display: "block", marginBottom: 4 }}>Kategori</label>
                        <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                            style={{ width: "100%", border: "1px solid #d1d5db", borderRadius: 8, padding: "10px 12px", fontSize: 13, outline: "none", fontFamily: "Plus Jakarta Sans, sans-serif" }}>
                            {CATEGORIES.map(c => (
                                <option key={c} value={c}>{CAT_ICONS[c]} {c.charAt(0).toUpperCase() + c.slice(1)}</option>
                            ))}
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
                        <label style={{ fontSize: 11, fontWeight: 600, color: "#4b5563", display: "block", marginBottom: 4 }}>URL Gambar (opsional)</label>
                        <input value={form.imageUrl} onChange={e => setForm({ ...form, imageUrl: e.target.value })}
                            placeholder="https://..." style={{ width: "100%", border: "1px solid #d1d5db", borderRadius: 8, padding: "10px 12px", fontSize: 13, outline: "none", fontFamily: "Plus Jakarta Sans, sans-serif" }} />
                    </div>

                    <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                        <button type="button" onClick={onClose}
                            style={{ flex: 1, background: "#f3f4f6", color: "#374151", border: "none", borderRadius: 10, padding: "12px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "Plus Jakarta Sans, sans-serif" }}>
                            Batal
                        </button>
                        <button type="submit" disabled={saving}
                            style={{ flex: 2, background: "#1a3a1f", color: "#9FF782", border: "none", borderRadius: 10, padding: "12px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "Plus Jakarta Sans, sans-serif", opacity: saving ? 0.7 : 1 }}>
                            {saving ? "Menyimpan..." : "Buat Target"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ── Main Tabungan Page ────────────────────────────────────────
export default function Tabungan() {
    const navigate                      = useNavigate();
    const [targets, setTargets]         = useState([]);
    const [balances, setBalances]       = useState([]);
    const [loading, setLoading]         = useState(true);
    const [selected, setSelected]       = useState(null);
    const [showCreate, setShowCreate]   = useState(false);
    const [filterTab, setFilterTab]     = useState("semua"); // semua | aktif | tercapai

    useEffect(() => {
        fetchAll();
    }, []);

    const fetchAll = async () => {
        setLoading(true);
        try {
            const [tabRes, balRes] = await Promise.all([
                API.get("/tabungan"),
                API.get("/balance"),
            ]);
            setTargets(tabRes.data);
            setBalances(balRes.data);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const handleCreate = async (form) => {
        const res = await API.post("/tabungan", form);
        await fetchAll();
        return res.data;
    };

    const handleAlokasi = async (tabId, amount, balanceId, balanceName) => {
        const res = await API.post(`/tabungan/${tabId}/alokasi`, { amount, balanceId, balanceName });
        await fetchAll();
        // Update selected target
        const updated = await API.get(`/tabungan/${tabId}`);
        setSelected(updated.data);
        return res.data;
    };

    const handleDelete = async (tabId) => {
        if (!confirm("Hapus target tabungan ini?")) return;
        await API.delete(`/tabungan/${tabId}`);
        setSelected(null);
        fetchAll();
    };

    // Stats
    const totalTerkumpul = targets.reduce((s, t) => s + (t.terkumpul || 0), 0);
    const aktifCount     = targets.filter(t => !t.isCompleted).length;
    const bulanIni       = targets.reduce((s, t) => s + (t.terkumpul || 0), 0); // simplified

    const filtered = targets.filter(t => {
        if (filterTab === "aktif")   return !t.isCompleted;
        if (filterTab === "tercapai") return t.isCompleted;
        return true;
    });

    return (
        <div style={{ minHeight: "100vh", background: "#f0f4f0", fontFamily: "Plus Jakarta Sans, sans-serif" }}>
            <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap'); * { box-sizing: border-box; margin: 0; padding: 0; }`}</style>

            {/* Navbar */}
            <nav style={{ background: "linear-gradient(90deg, #1a3a1f, #0f2a18)", padding: "12px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, zIndex: 40 }}>
                <button onClick={() => navigate("/dashboard")}
                    style={{ background: "none", border: "none", color: "#9FF782", fontSize: 14, cursor: "pointer", fontFamily: "Plus Jakarta Sans, sans-serif", fontWeight: 600 }}>
                    ← Dashboard
                </button>
                <span style={{ color: "white", fontWeight: 700, fontSize: 15 }}>Tabungan</span>
                <button onClick={() => setShowCreate(true)}
                    style={{ background: "#9FF782", color: "#0a1f10", border: "none", borderRadius: 8, padding: "7px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "Plus Jakarta Sans, sans-serif" }}>
                    + Tambah
                </button>
            </nav>

            <div style={{ maxWidth: 520, margin: "0 auto", padding: "20px 16px 40px" }}>

                {/* Header */}
                <div style={{ marginBottom: 20 }}>
                    <h1 style={{ fontSize: 22, fontWeight: 800, color: "#1a3a1f", marginBottom: 4 }}>Tabungan</h1>
                    <p style={{ fontSize: 13, color: "#9ca3af" }}>Kelola dan Pantau Progres Menabungmu</p>
                </div>

                {/* Stats Cards */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 24 }}>
                    <div style={{ background: "white", borderRadius: 12, padding: "14px 14px", border: "1px solid #f0f0f0" }}>
                        <p style={{ fontSize: 10, color: "#9ca3af", marginBottom: 4 }}>Total Saldo</p>
                        <p style={{ fontSize: 13, fontWeight: 800, color: "#1a3a1f" }}>{fmt(totalTerkumpul)}</p>
                    </div>
                    <div style={{ background: "#1a3a1f", borderRadius: 12, padding: "14px 14px" }}>
                        <p style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", marginBottom: 4 }}>Target Aktif</p>
                        <p style={{ fontSize: 18, fontWeight: 800, color: "#9FF782" }}>{aktifCount} Target</p>
                    </div>
                    <div style={{ background: "#1a3a1f", borderRadius: 12, padding: "14px 14px" }}>
                        <p style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", marginBottom: 4 }}>Bulan Ini</p>
                        <p style={{ fontSize: 13, fontWeight: 800, color: "#9FF782" }}>+{fmt(bulanIni)}</p>
                    </div>
                </div>

                {/* Saldo Tersedia */}
                {balances.length > 0 && (
                    <div style={{ background: "white", borderRadius: 14, padding: "14px 16px", marginBottom: 20, border: "1px solid #f0f0f0" }}>
                        <p style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Saldo Tersedia</p>
                        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
                            {balances.map(b => (
                                <div key={b.id} style={{ flexShrink: 0, background: "#f8fdf8", borderRadius: 10, padding: "8px 14px", border: "1px solid #e8fce0" }}>
                                    <p style={{ fontSize: 10, color: "#9ca3af", marginBottom: 2 }}>{b.name}</p>
                                    <p style={{ fontSize: 12, fontWeight: 700, color: "#1a3a1f" }}>{fmt(b.balance)}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Filter Tabs */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                    <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1a3a1f" }}>Daftar Target Tabungan</h2>
                    <div style={{ display: "flex", gap: 6 }}>
                        {[
                            { key: "semua", label: "Semua" },
                            { key: "aktif", label: "Aktif" },
                            { key: "tercapai", label: "Tercapai" },
                        ].map(f => (
                            <button key={f.key} onClick={() => setFilterTab(f.key)}
                                style={{ padding: "5px 12px", borderRadius: 20, border: "none", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "Plus Jakarta Sans, sans-serif", background: filterTab === f.key ? "#1a3a1f" : "#f3f4f6", color: filterTab === f.key ? "#9FF782" : "#6b7280", transition: "all 0.2s" }}>
                                {f.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Target Grid */}
                {loading ? (
                    <div style={{ textAlign: "center", padding: 48, color: "#9ca3af" }}>Loading...</div>
                ) : filtered.length === 0 ? (
                    <div style={{ textAlign: "center", padding: 48, color: "#9ca3af" }}>
                        <p style={{ fontSize: 40, marginBottom: 12 }}>🎯</p>
                        <p style={{ fontSize: 14, marginBottom: 16 }}>Belum ada target tabungan.</p>
                        <button onClick={() => setShowCreate(true)}
                            style={{ background: "#1a3a1f", color: "#9FF782", border: "none", borderRadius: 10, padding: "12px 24px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "Plus Jakarta Sans, sans-serif" }}>
                            + Tambah Target Pertama
                        </button>
                    </div>
                ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                        {filtered.map(t => (
                            <TargetCard key={t.id} target={t} onClick={setSelected} />
                        ))}
                    </div>
                )}
            </div>

            {/* Detail Modal */}
            {selected && (
                <DetailModal
                    target={selected}
                    balances={balances}
                    onClose={() => setSelected(null)}
                    onAlokasi={handleAlokasi}
                    onDelete={handleDelete}
                />
            )}

            {/* Create Modal */}
            {showCreate && (
                <CreateModal
                    onClose={() => setShowCreate(false)}
                    onCreate={handleCreate}
                />
            )}
        </div>
    );
}