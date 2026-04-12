import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// ── Helpers ───────────────────────────────────────────────────
const fmt  = (n) => `Rp ${(n || 0).toLocaleString("id-ID")}`;
const MONTHS = ["", "Januari", "Februari", "Maret", "April", "Mei", "Juni",
                "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

// ── Build chart HTML for email ───────────────────────────────
function buildChartHTML(transactions) {
    if (!transactions || transactions.length === 0) {
        return `<div style="background:white;border-radius:14px;border:1px solid #f0f0f0;margin-bottom:16px;padding:20px;text-align:center;color:#9ca3af;font-size:13px;">Belum ada data transaksi untuk chart</div>`;
    }

    // Group transactions by date
    const txByDate = {};
    transactions.forEach(tx => {
        const dateObj = new Date(tx.date);
        const dateStr = dateObj.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
        if (!txByDate[dateStr]) txByDate[dateStr] = { income: 0, expense: 0 };
        if (tx.type === 'income') txByDate[dateStr].income += tx.amount || 0;
        else txByDate[dateStr].expense += tx.amount || 0;
    });

    const dates = Object.keys(txByDate).sort();
    if (dates.length === 0) {
        return `<div style="background:white;border-radius:14px;border:1px solid #f0f0f0;margin-bottom:16px;padding:20px;text-align:center;color:#9ca3af;font-size:13px;">Belum ada data transaksi untuk chart</div>`;
    }

    // Find max value for scaling
    let maxValue = 0;
    dates.forEach(date => {
        const val = Math.max(txByDate[date].income, txByDate[date].expense);
        if (val > maxValue) maxValue = val;
    });

    // Create bar chart
    const chartRows = dates.map(date => {
        const income = txByDate[date].income;
        const expense = txByDate[date].expense;
        const incomeWidth = maxValue > 0 ? Math.ceil((income / maxValue) * 100) : 0;
        const expenseWidth = maxValue > 0 ? Math.ceil((expense / maxValue) * 100) : 0;

        return `
        <div style="margin-bottom:14px;">
            <div style="font-size:12px;color:#374151;font-weight:600;margin-bottom:4px;">${date}</div>
            <div style="display:flex;gap:4px;align-items:center;">
                <div style="flex:1;">
                    <div style="font-size:11px;color:#166534;margin-bottom:2px;">+${fmt(income)}</div>
                    <div style="background:#e8f5e9;border-radius:2px;height:8px;overflow:hidden;">
                        <div style="width:${incomeWidth}%;height:100%;background:#10b981;"></div>
                    </div>
                </div>
            </div>
            <div style="display:flex;gap:4px;align-items:center;margin-top:4px;">
                <div style="flex:1;">
                    <div style="font-size:11px;color:#991b1b;margin-bottom:2px;">-${fmt(expense)}</div>
                    <div style="background:#ffebee;border-radius:2px;height:8px;overflow:hidden;">
                        <div style="width:${expenseWidth}%;height:100%;background:#ef4444;"></div>
                    </div>
                </div>
            </div>
        </div>
        `;
    }).join('');

    return `
    <div style="background:white;border-radius:14px;border:1px solid #f0f0f0;margin-bottom:16px;overflow:hidden;">
        <div style="padding:16px 16px 12px;border-bottom:1px solid #f3f4f6;">
            <h2 style="margin:0;font-size:15px;font-weight:700;color:#1a3a1f;">📈 Riwayat Transaksi Trend</h2>
        </div>
        <div style="padding:16px;">
            ${chartRows}
        </div>
    </div>
    `;
}

// ── Build HTML Email ──────────────────────────────────────────
function buildEmailHTML({ name, year, month, summary, byCategory, balances, tabungan, transactions }) {
    const monthName  = MONTHS[month];
    const isPositive = summary.netBalance >= 0;

    // ── Category rows ─────────────────────────────────────────
    const categoryRows = Object.entries(byCategory).map(([cat, data]) => `
        <tr>
            <td style="padding:10px 16px;border-bottom:1px solid #f3f4f6;font-size:13px;color:#374151;">${cat}</td>
            <td style="padding:10px 16px;border-bottom:1px solid #f3f4f6;font-size:13px;color:#166534;font-weight:600;text-align:right;">${data.income > 0 ? fmt(data.income) : "—"}</td>
            <td style="padding:10px 16px;border-bottom:1px solid #f3f4f6;font-size:13px;color:#991b1b;font-weight:600;text-align:right;">${data.expense > 0 ? fmt(data.expense) : "—"}</td>
        </tr>
    `).join("");

    // ── Balance rows ──────────────────────────────────────────
    const balanceRows = balances.map(b => `
        <tr>
            <td style="padding:10px 16px;border-bottom:1px solid #f3f4f6;font-size:13px;color:#374151;">${b.name}</td>
            <td style="padding:10px 16px;border-bottom:1px solid #f3f4f6;font-size:13px;color:#374151;text-align:center;text-transform:capitalize;">${b.type || "—"}</td>
            <td style="padding:10px 16px;border-bottom:1px solid #f3f4f6;font-size:13px;font-weight:700;color:#1a3a1f;text-align:right;">${fmt(b.balance)}</td>
        </tr>
    `).join("");

    // ── Tabungan rows ─────────────────────────────────────────
    const tabunganRows = tabungan.filter(t => t.setoranBulanIni > 0).map(t => {
        const pct = Math.min(Math.round((t.terkumpul / t.targetAmount) * 100), 100);
        return `
        <tr>
            <td style="padding:10px 16px;border-bottom:1px solid #f3f4f6;">
                <div style="font-size:13px;font-weight:600;color:#374151;">${t.name}</div>
                <div style="margin-top:6px;background:#f3f4f6;border-radius:4px;height:6px;overflow:hidden;">
                    <div style="width:${pct}%;height:6px;border-radius:4px;background:${t.isCompleted ? "#9FF782" : "#1a3a1f"};"></div>
                </div>
                <div style="margin-top:4px;font-size:11px;color:#9ca3af;">${fmt(t.terkumpul)} / ${fmt(t.targetAmount)} (${pct}%)</div>
            </td>
            <td style="padding:10px 16px;border-bottom:1px solid #f3f4f6;font-size:13px;font-weight:700;color:#166534;text-align:right;vertical-align:top;">+${fmt(t.setoranBulanIni)}</td>
        </tr>
    `}).join("") || `<tr><td colspan="2" style="padding:16px;text-align:center;color:#9ca3af;font-size:13px;">Tidak ada setoran bulan ini</td></tr>`;

    // ── Transaction rows (last 10) ────────────────────────────
    const txRows = transactions.slice(0, 10).map(tx => {
        const isIncome = tx.type === "income";
        const date     = tx.date ? new Date(tx.date).toLocaleDateString("id-ID", { day: "2-digit", month: "short" }) : "—";
        return `
        <tr>
            <td style="padding:8px 16px;border-bottom:1px solid #f9fafb;font-size:12px;color:#6b7280;">${date}</td>
            <td style="padding:8px 16px;border-bottom:1px solid #f9fafb;font-size:12px;color:#374151;">${tx.balanceName || "—"}</td>
            <td style="padding:8px 16px;border-bottom:1px solid #f9fafb;font-size:12px;color:#374151;max-width:160px;">${tx.description || "—"}</td>
            <td style="padding:8px 16px;border-bottom:1px solid #f9fafb;font-size:12px;font-weight:600;color:${isIncome ? "#166534" : "#991b1b"};text-align:right;">${isIncome ? "+" : "−"}${fmt(tx.amount)}</td>
        </tr>
    `}).join("");

    return `
<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Rekap Keuangan ${monthName} ${year}</title>
</head>
<body style="margin:0;padding:0;background:#f0f4f0;font-family:'Segoe UI',Arial,sans-serif;">

<div style="max-width:600px;margin:0 auto;padding:24px 16px;">

    <!-- HEADER -->
    <div style="background:linear-gradient(135deg,#1a3a1f,#0f2a18);border-radius:16px;padding:32px 28px;margin-bottom:16px;text-align:center;">
        <p style="margin:0 0 4px;font-size:13px;color:rgba(255,255,255,0.4);letter-spacing:2px;text-transform:uppercase;">MoneyPath</p>
        <h1 style="margin:0 0 8px;font-size:26px;font-weight:800;color:#9FF782;">Rekap Keuangan</h1>
        <p style="margin:0;font-size:15px;color:rgba(255,255,255,0.7);">${monthName} ${year}</p>
        <div style="margin-top:20px;padding-top:20px;border-top:1px solid rgba(255,255,255,0.1);">
            <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.5);">Halo, <strong style="color:white;">${name}</strong> 👋</p>
            <p style="margin:6px 0 0;font-size:12px;color:rgba(255,255,255,0.35);">Berikut ringkasan keuanganmu bulan ini</p>
        </div>
    </div>

    <!-- SUMMARY CARDS -->
    <div style="display:grid;margin-bottom:16px;">
        <!-- Net Balance -->
        <div style="background:${isPositive ? "#f0fdf4" : "#fef2f2"};border:1px solid ${isPositive ? "#bbf7d0" : "#fecaca"};border-radius:14px;padding:20px 24px;margin-bottom:12px;text-align:center;">
            <p style="margin:0 0 4px;font-size:11px;color:${isPositive ? "#166534" : "#991b1b"};text-transform:uppercase;letter-spacing:1px;font-weight:600;">Selisih Bersih</p>
            <p style="margin:0;font-size:32px;font-weight:800;color:${isPositive ? "#166534" : "#991b1b"};">${isPositive ? "+" : ""}${fmt(summary.netBalance)}</p>
            <p style="margin:8px 0 0;font-size:12px;color:${isPositive ? "#4ade80" : "#f87171"};">${isPositive ? "✅ Pengeluaran terkontrol" : "⚠️ Pengeluaran melebihi pemasukan"}</p>
        </div>

        <!-- Income & Expense side by side -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:12px;">
            <tr>
                <td width="49%" style="vertical-align:top;">
                    <div style="background:white;border:1px solid #f0f0f0;border-radius:14px;padding:18px;text-align:center;">
                        <p style="margin:0 0 4px;font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:1px;">Total Pemasukan</p>
                        <p style="margin:0;font-size:20px;font-weight:800;color:#166534;">+${fmt(summary.totalIncome)}</p>
                        <p style="margin:6px 0 0;font-size:20px;">💰</p>
                    </div>
                </td>
                <td width="2%"></td>
                <td width="49%" style="vertical-align:top;">
                    <div style="background:white;border:1px solid #f0f0f0;border-radius:14px;padding:18px;text-align:center;">
                        <p style="margin:0 0 4px;font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:1px;">Total Pengeluaran</p>
                        <p style="margin:0;font-size:20px;font-weight:800;color:#991b1b;">-${fmt(summary.totalExpense)}</p>
                        <p style="margin:6px 0 0;font-size:20px;">💸</p>
                    </div>
                </td>
            </tr>
        </table>
    </div>

    <!-- TRANSACTION TREND CHART -->
    ${buildChartHTML(transactions)}

    <!-- PENGELUARAN PER KATEGORI -->
    <div style="background:white;border-radius:14px;border:1px solid #f0f0f0;margin-bottom:16px;overflow:hidden;">
        <div style="padding:16px 16px 12px;border-bottom:1px solid #f3f4f6;">
            <h2 style="margin:0;font-size:15px;font-weight:700;color:#1a3a1f;">📊 Per Kategori Balance</h2>
        </div>
        <table width="100%" cellpadding="0" cellspacing="0">
            <thead>
                <tr style="background:#f8fdf8;">
                    <th style="padding:10px 16px;text-align:left;font-size:11px;color:#9ca3af;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Kategori</th>
                    <th style="padding:10px 16px;text-align:right;font-size:11px;color:#9ca3af;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Masuk</th>
                    <th style="padding:10px 16px;text-align:right;font-size:11px;color:#9ca3af;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Keluar</th>
                </tr>
            </thead>
            <tbody>
                ${categoryRows || `<tr><td colspan="3" style="padding:16px;text-align:center;color:#9ca3af;font-size:13px;">Tidak ada transaksi bulan ini</td></tr>`}
            </tbody>
        </table>
    </div>

    <!-- SALDO SAAT INI -->
    <div style="background:white;border-radius:14px;border:1px solid #f0f0f0;margin-bottom:16px;overflow:hidden;">
        <div style="padding:16px 16px 12px;border-bottom:1px solid #f3f4f6;">
            <h2 style="margin:0;font-size:15px;font-weight:700;color:#1a3a1f;">💳 Saldo Saat Ini</h2>
        </div>
        <table width="100%" cellpadding="0" cellspacing="0">
            <thead>
                <tr style="background:#f8fdf8;">
                    <th style="padding:10px 16px;text-align:left;font-size:11px;color:#9ca3af;font-weight:600;text-transform:uppercase;">Akun</th>
                    <th style="padding:10px 16px;text-align:center;font-size:11px;color:#9ca3af;font-weight:600;text-transform:uppercase;">Tipe</th>
                    <th style="padding:10px 16px;text-align:right;font-size:11px;color:#9ca3af;font-weight:600;text-transform:uppercase;">Saldo</th>
                </tr>
            </thead>
            <tbody>
                ${balanceRows || `<tr><td colspan="3" style="padding:16px;text-align:center;color:#9ca3af;font-size:13px;">Belum ada saldo</td></tr>`}
            </tbody>
        </table>
    </div>

    <!-- TABUNGAN -->
    <div style="background:white;border-radius:14px;border:1px solid #f0f0f0;margin-bottom:16px;overflow:hidden;">
        <div style="padding:16px 16px 12px;border-bottom:1px solid #f3f4f6;">
            <h2 style="margin:0;font-size:15px;font-weight:700;color:#1a3a1f;">🐷 Setoran Tabungan Bulan Ini</h2>
        </div>
        <table width="100%" cellpadding="0" cellspacing="0">
            <tbody>${tabunganRows}</tbody>
        </table>
    </div>

    <!-- RIWAYAT TRANSAKSI -->
    <div style="background:white;border-radius:14px;border:1px solid #f0f0f0;margin-bottom:16px;overflow:hidden;">
        <div style="padding:16px 16px 12px;border-bottom:1px solid #f3f4f6;display:flex;justify-content:space-between;align-items:center;">
            <h2 style="margin:0;font-size:15px;font-weight:700;color:#1a3a1f;">🧾 10 Transaksi Terakhir</h2>
        </div>
        <table width="100%" cellpadding="0" cellspacing="0">
            <thead>
                <tr style="background:#f8fdf8;">
                    <th style="padding:8px 16px;text-align:left;font-size:11px;color:#9ca3af;font-weight:600;">Tgl</th>
                    <th style="padding:8px 16px;text-align:left;font-size:11px;color:#9ca3af;font-weight:600;">Akun</th>
                    <th style="padding:8px 16px;text-align:left;font-size:11px;color:#9ca3af;font-weight:600;">Keterangan</th>
                    <th style="padding:8px 16px;text-align:right;font-size:11px;color:#9ca3af;font-weight:600;">Jumlah</th>
                </tr>
            </thead>
            <tbody>
                ${txRows || `<tr><td colspan="4" style="padding:16px;text-align:center;color:#9ca3af;font-size:13px;">Tidak ada transaksi</td></tr>`}
            </tbody>
        </table>
    </div>

    <!-- FOOTER -->
    <div style="text-align:center;padding:20px 0;">
        <p style="margin:0 0 6px;font-size:13px;color:#9ca3af;">Email ini dikirim otomatis oleh <strong style="color:#1a3a1f;">MoneyPath</strong></p>
        <p style="margin:0;font-size:11px;color:#d1d5db;">© ${year} MoneyPath. All rights reserved.</p>
    </div>

</div>
</body>
</html>`;
}

// ── Main send function ────────────────────────────────────────
export async function sendRekapEmail({ to, name, year, month, summary, byCategory, balances, tabungan, transactions }) {
    const monthName = MONTHS[month];
    const html      = buildEmailHTML({ name, year, month, summary, byCategory, balances, tabungan, transactions });

    const { data, error } = await resend.emails.send({
        from:    "MoneyPath <onboarding@resend.dev>", // ← ganti dengan domain sendiri jika sudah verifikasi
        to:      [to],
        subject: `📊 Rekap Keuangan ${monthName} ${year} - MoneyPath`,
        html,
    });

    if (error) throw new Error(error.message);
    return data;
}