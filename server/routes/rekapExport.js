import { Router } from "express";
import PDFDocument from "pdfkit";
import ExcelJS from "exceljs";
import { db } from "../firebaseAdmin.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = Router();
const MONTHS = ["", "Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

function getMonthRange(year, month) {
    return {
        start: new Date(year, month - 1, 1).toISOString(),
        end: new Date(year, month, 0, 23, 59, 59).toISOString(),
    };
}

function fmtRp(value = 0) {
    return `Rp ${(Number(value) || 0).toLocaleString("id-ID")}`;
}

async function loadRekapData(uid, year, month) {
    const { start, end } = getMonthRange(year, month);

    const [txSnap, balSnap, tabSnap, userDoc] = await Promise.all([
        db.collection("users").doc(uid).collection("transactions").get(),
        db.collection("users").doc(uid).collection("balances").get(),
        db.collection("users").doc(uid).collection("tabungan").get(),
        db.collection("users").doc(uid).get(),
    ]);

    const email = userDoc.exists ? userDoc.data().email : "";

    const transactions = txSnap.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((tx) => {
            const date = tx.date || tx.createdAt || "";
            return date >= start && date <= end;
        })
        .sort((a, b) => new Date(b.date) - new Date(a.date));

    const byCategory = {};
    transactions.forEach((tx) => {
        const category = tx.balanceName || "Lainnya";
        if (!byCategory[category]) byCategory[category] = { income: 0, expense: 0 };
        if (tx.type === "income") byCategory[category].income += tx.amount || 0;
        if (tx.type === "expense") byCategory[category].expense += tx.amount || 0;
    });

    const balances = balSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    const tabungan = await Promise.all(
        tabSnap.docs.map(async (tabDoc) => {
            const riwayatSnap = await tabDoc.ref.collection("riwayat").get();
            const riwayat = riwayatSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
            const monthRiwayat = riwayat.filter((item) => {
                const date = item.date || "";
                return date >= start && date <= end;
            });

            return {
                id: tabDoc.id,
                name: tabDoc.data().name,
                targetAmount: tabDoc.data().targetAmount,
                terkumpul: tabDoc.data().terkumpul,
                isCompleted: tabDoc.data().isCompleted,
                setoranBulanIni: monthRiwayat.reduce((sum, item) => sum + (item.amount || 0), 0),
            };
        })
    );

    return {
        year,
        month,
        email,
        summary: {
            totalIncome: transactions.filter((t) => t.type === "income").reduce((sum, t) => sum + (t.amount || 0), 0),
            totalExpense: transactions.filter((t) => t.type === "expense").reduce((sum, t) => sum + (t.amount || 0), 0),
            totalTransaksi: transactions.length,
            totalSetoran: tabungan.reduce((sum, item) => sum + (item.setoranBulanIni || 0), 0),
        },
        byCategory,
        balances,
        tabungan,
        transactions,
    };
}

function applySectionHeader(sheet, rowIndex, title, columns) {
    sheet.mergeCells(rowIndex, 1, rowIndex, columns);
    const cell = sheet.getCell(rowIndex, 1);
    cell.value = title;
    cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 12 };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0F2A18" } };
    cell.alignment = { horizontal: "left", vertical: "middle" };
    sheet.getRow(rowIndex).height = 20;
}

function styleHeaderRow(row, startCol, endCol) {
    for (let col = startCol; col <= endCol; col += 1) {
        const cell = row.getCell(col);
        cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2F6B3E" } };
        cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
        cell.border = {
            top: { style: "thin", color: { argb: "FFD1D5DB" } },
            left: { style: "thin", color: { argb: "FFD1D5DB" } },
            bottom: { style: "thin", color: { argb: "FFD1D5DB" } },
            right: { style: "thin", color: { argb: "FFD1D5DB" } },
        };
    }
}

function styleDataRow(row, startCol, endCol, alt = false) {
    for (let col = startCol; col <= endCol; col += 1) {
        const cell = row.getCell(col);
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: alt ? "FFF8FAFC" : "FFFFFFFF" } };
        cell.border = {
            top: { style: "thin", color: { argb: "FFD1D5DB" } },
            left: { style: "thin", color: { argb: "FFD1D5DB" } },
            bottom: { style: "thin", color: { argb: "FFD1D5DB" } },
            right: { style: "thin", color: { argb: "FFD1D5DB" } },
        };
        cell.alignment = { vertical: "middle", wrapText: true, horizontal: col === endCol ? "right" : col === 1 ? "center" : "left" };
    }
}

router.get("/export/excel", verifyToken, async (req, res) => {
    try {
        const uid = req.user.uid;
        const now = new Date();
        const year = parseInt(req.query.year, 10) || now.getFullYear();
        const month = parseInt(req.query.month, 10) || now.getMonth() + 1;
        const data = await loadRekapData(uid, year, month);
        const monthName = MONTHS[month];

        const workbook = new ExcelJS.Workbook();
        workbook.creator = "MoneyPath";
        workbook.created = new Date();

        const sheet = workbook.addWorksheet(`Rekap ${monthName}`, {
            views: [{ showGridLines: false }],
        });

        sheet.pageSetup = {
            paperSize: 9,
            orientation: "landscape",
            fitToPage: true,
            fitToWidth: 1,
            fitToHeight: 0,
            horizontalCentered: false,
            verticalCentered: false,
            margins: {
                left: 0.25,
                right: 0.25,
                top: 0.5,
                bottom: 0.5,
                header: 0.2,
                footer: 0.2,
            },
        };

        sheet.columns = [
            { width: 8 },
            { width: 18 },
            { width: 30 },
            { width: 20 },
            { width: 18 },
            { width: 16 },
        ];

        let rowIndex = 1;
        sheet.mergeCells(rowIndex, 1, rowIndex, 6);
        const titleCell = sheet.getCell(rowIndex, 1);
        titleCell.value = `Rekap Bulanan ${monthName} ${year}`;
        titleCell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 14 };
        titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0F2A18" } };
        titleCell.alignment = { horizontal: "center", vertical: "middle" };
        sheet.getRow(rowIndex).height = 22;
        rowIndex += 1;

        sheet.mergeCells(rowIndex, 1, rowIndex, 3);
        sheet.getCell(rowIndex, 1).value = `Email: ${data.email || "-"}`;
        sheet.getCell(rowIndex, 1).font = { bold: true, color: { argb: "FF0F2A18" } };
        sheet.getCell(rowIndex, 1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFEAF7E6" } };
        sheet.mergeCells(rowIndex, 4, rowIndex, 6);
        sheet.getCell(rowIndex, 4).value = `Periode: ${monthName} ${year}`;
        sheet.getCell(rowIndex, 4).font = { bold: true, color: { argb: "FF0F2A18" } };
        sheet.getCell(rowIndex, 4).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFEAF7E6" } };
        rowIndex += 1;

        sheet.mergeCells(rowIndex, 1, rowIndex, 6);
        sheet.getCell(rowIndex, 1).value = `Dicetak: ${new Date().toLocaleString("id-ID")}`;
        sheet.getCell(rowIndex, 1).font = { italic: true, color: { argb: "FF6B7280" } };
        rowIndex += 2;

        applySectionHeader(sheet, rowIndex, "Ringkasan", 6);
        rowIndex += 1;
        const summaryHeader = sheet.getRow(rowIndex);
        summaryHeader.values = ["Keterangan", "Nilai"];
        styleHeaderRow(summaryHeader, 1, 2);
        rowIndex += 1;

        [
            ["Total Pemasukan", data.summary.totalIncome, true],
            ["Total Pengeluaran", data.summary.totalExpense, true],
            ["Selisih Bersih", data.summary.netBalance, true],
            ["Total Transaksi", data.summary.totalTransaksi, false],
        ].forEach(([label, value, useCurrency], index) => {
            const row = sheet.getRow(rowIndex);
            row.values = [label, value];
            styleDataRow(row, 1, 2, index % 2 === 1);
            row.getCell(2).numFmt = useCurrency ? '"Rp" #,##0;[Red]-"Rp" #,##0' : "0";
            rowIndex += 1;
        });
        rowIndex += 1;

        applySectionHeader(sheet, rowIndex, "Transaksi", 6);
        rowIndex += 1;
        let header = sheet.getRow(rowIndex);
        header.values = ["No", "Tanggal", "Deskripsi", "Kategori", "Tipe", "Jumlah"];
        styleHeaderRow(header, 1, 6);
        rowIndex += 1;

        if (data.transactions.length === 0) {
            sheet.mergeCells(rowIndex, 1, rowIndex, 6);
            const cell = sheet.getCell(rowIndex, 1);
            cell.value = "Tidak ada transaksi bulan ini";
            cell.font = { italic: true, color: { argb: "FF6B7280" } };
            cell.alignment = { horizontal: "center" };
            rowIndex += 1;
        } else {
            data.transactions.forEach((tx, index) => {
                const row = sheet.getRow(rowIndex);
                row.values = [index + 1, tx.date ? new Date(tx.date).toLocaleDateString("id-ID") : "-", tx.description || "-", tx.balanceName || "-", tx.type === "income" ? "Pemasukan" : "Pengeluaran", tx.amount || 0];
                styleDataRow(row, 1, 6, index % 2 === 1);
                row.getCell(6).numFmt = '"Rp" #,##0;[Red]-"Rp" #,##0';
                rowIndex += 1;
            });
        }
        rowIndex += 1;

        applySectionHeader(sheet, rowIndex, "Kategori", 6);
        rowIndex += 1;
        header = sheet.getRow(rowIndex);
        header.values = ["No", "Kategori", "Pemasukan", "Pengeluaran", "Bersih"];
        styleHeaderRow(header, 1, 5);
        rowIndex += 1;

        const categories = Object.entries(data.byCategory);
        if (categories.length === 0) {
            sheet.mergeCells(rowIndex, 1, rowIndex, 5);
            const cell = sheet.getCell(rowIndex, 1);
            cell.value = "Tidak ada data kategori";
            cell.font = { italic: true, color: { argb: "FF6B7280" } };
            cell.alignment = { horizontal: "center" };
            rowIndex += 1;
        } else {
            categories.forEach(([category, value], index) => {
                const row = sheet.getRow(rowIndex);
                row.values = [index + 1, category, value.income || 0, value.expense || 0, (value.income || 0) - (value.expense || 0)];
                styleDataRow(row, 1, 5, index % 2 === 1);
                row.getCell(3).numFmt = '"Rp" #,##0;[Red]-"Rp" #,##0';
                row.getCell(4).numFmt = '"Rp" #,##0;[Red]-"Rp" #,##0';
                row.getCell(5).numFmt = '"Rp" #,##0;[Red]-"Rp" #,##0';
                rowIndex += 1;
            });
        }
        rowIndex += 1;

        applySectionHeader(sheet, rowIndex, "Saldo", 6);
        rowIndex += 1;
        header = sheet.getRow(rowIndex);
        header.values = ["No", "Nama", "Tipe", "Saldo"];
        styleHeaderRow(header, 1, 4);
        rowIndex += 1;

        if (data.balances.length === 0) {
            sheet.mergeCells(rowIndex, 1, rowIndex, 4);
            const cell = sheet.getCell(rowIndex, 1);
            cell.value = "Tidak ada saldo";
            cell.font = { italic: true, color: { argb: "FF6B7280" } };
            cell.alignment = { horizontal: "center" };
            rowIndex += 1;
        } else {
            data.balances.forEach((balance, index) => {
                const row = sheet.getRow(rowIndex);
                row.values = [index + 1, balance.name || "-", balance.type || "-", balance.balance || 0];
                styleDataRow(row, 1, 4, index % 2 === 1);
                row.getCell(4).numFmt = '"Rp" #,##0;[Red]-"Rp" #,##0';
                rowIndex += 1;
            });
        }
        rowIndex += 1;

        applySectionHeader(sheet, rowIndex, "Tabungan", 6);
        rowIndex += 1;
        header = sheet.getRow(rowIndex);
        header.values = ["No", "Nama", "Target", "Terkumpul", "Setoran Bulan Ini", "Status"];
        styleHeaderRow(header, 1, 6);
        rowIndex += 1;

        if (data.tabungan.length === 0) {
            sheet.mergeCells(rowIndex, 1, rowIndex, 6);
            const cell = sheet.getCell(rowIndex, 1);
            cell.value = "Tidak ada tabungan";
            cell.font = { italic: true, color: { argb: "FF6B7280" } };
            cell.alignment = { horizontal: "center" };
        } else {
            data.tabungan.forEach((item, index) => {
                const row = sheet.getRow(rowIndex);
                row.values = [index + 1, item.name || "-", item.targetAmount || 0, item.terkumpul || 0, item.setoranBulanIni || 0, item.isCompleted ? "Selesai" : "Berjalan"];
                styleDataRow(row, 1, 6, index % 2 === 1);
                row.getCell(3).numFmt = '"Rp" #,##0;[Red]-"Rp" #,##0';
                row.getCell(4).numFmt = '"Rp" #,##0;[Red]-"Rp" #,##0';
                row.getCell(5).numFmt = '"Rp" #,##0;[Red]-"Rp" #,##0';
                rowIndex += 1;
            });
        }

        const buffer = await workbook.xlsx.writeBuffer();
        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.setHeader("Content-Disposition", `attachment; filename=rekap-${monthName.toLowerCase()}-${year}.xlsx`);
        res.send(Buffer.from(buffer));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get("/export/pdf", verifyToken, async (req, res) => {
    try {
        const uid = req.user.uid;
        const now = new Date();
        const year = parseInt(req.query.year, 10) || now.getFullYear();
        const month = parseInt(req.query.month, 10) || now.getMonth() + 1;
        const data = await loadRekapData(uid, year, month);
        const monthName = MONTHS[month];

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename=rekap-${monthName.toLowerCase()}-${year}.pdf`);

        const doc = new PDFDocument({ size: "A4", margin: 32, bufferPages: true });
        doc.pipe(res);
        const marginLeft = 32;
        const marginRight = 32;
        const contentWidth = doc.page.width - marginLeft - marginRight;
        const bottomY = doc.page.height - 48;

        const resetCursor = (y) => {
            doc.x = marginLeft;
            doc.y = y;
        };

        const ensureSpace = (neededHeight) => {
            if (doc.y + neededHeight > bottomY) {
                doc.addPage();
                resetCursor(32);
            }
        };

        const drawSection = (title) => {
            ensureSpace(28);
            const y = doc.y;
            resetCursor(y);
            doc.rect(marginLeft, y, contentWidth, 20).fill("#1a3a1f");
            doc.fillColor("#ffffff").fontSize(11).text(title, marginLeft + 8, y + 5, { width: contentWidth - 16 });
            resetCursor(y + 26);
        };

        const drawTable = (headers, rows) => {
            const rowHeight = 20;
            const tableWidth = contentWidth;
            const colWidth = tableWidth / headers.length;
            const startX = marginLeft;

            const drawHeader = () => {
                ensureSpace(rowHeight + 4);
                const headerY = doc.y;
                resetCursor(headerY);
                headers.forEach((header, index) => {
                    doc.rect(startX + index * colWidth, headerY, colWidth, rowHeight).fillAndStroke("#2f6b3e", "#d1d5db");
                    doc.fillColor("#ffffff").fontSize(9).text(header, startX + index * colWidth + 4, headerY + 6, { width: colWidth - 8, align: "center" });
                });
                resetCursor(headerY + rowHeight);
            };

            drawHeader();

            if (rows.length === 0) {
                ensureSpace(rowHeight + 12);
                doc.fillColor("#6b7280").fontSize(10).text("Tidak ada data", marginLeft, doc.y + 6, { align: "center", width: contentWidth });
                resetCursor(doc.y + 18);
                return;
            }

            rows.forEach((row, rowIndex) => {
                if (doc.y + rowHeight > bottomY) {
                    doc.addPage();
                    resetCursor(32);
                    drawHeader();
                }

                const rowY = doc.y;
                resetCursor(rowY);
                row.forEach((cell, index) => {
                    const fill = rowIndex % 2 === 0 ? "#ffffff" : "#f8fafc";
                    doc.rect(startX + index * colWidth, rowY, colWidth, rowHeight).fillAndStroke(fill, "#d1d5db");
                    doc.fillColor("#111827").fontSize(8.5).text(String(cell), startX + index * colWidth + 4, rowY + 6, {
                        width: colWidth - 8,
                        align: index === 0 ? "center" : index === row.length - 1 ? "right" : "left",
                    });
                });
                resetCursor(rowY + rowHeight);
            });
            resetCursor(doc.y + 10);
        };

        resetCursor(32);
        doc.fillColor("#0f2a18").fontSize(18).text(`Rekap Bulanan ${monthName} ${year}`, marginLeft, doc.y, { align: "center", width: contentWidth });
        doc.moveDown(0.5);
        doc.fontSize(10).fillColor("#374151").text(`Email: ${data.email || "-"}`, marginLeft, doc.y, { width: contentWidth });
        doc.text(`Dicetak: ${new Date().toLocaleString("id-ID")}`, marginLeft, doc.y, { width: contentWidth });
        doc.moveDown(1);

        drawSection("Ringkasan");
        doc.fontSize(10).fillColor("#111827");
        doc.text(`Total Pemasukan: ${fmtRp(data.summary.totalIncome)}`);
        doc.text(`Total Pengeluaran: ${fmtRp(data.summary.totalExpense)}`);
        doc.text(`Selisih Bersih: ${fmtRp(data.summary.netBalance)}`);
        doc.text(`Total Transaksi: ${data.summary.totalTransaksi}`);
        doc.moveDown(1);

        drawSection("Transaksi");
        drawTable(["No", "Tanggal", "Deskripsi", "Kategori", "Tipe", "Jumlah"], data.transactions.map((tx, index) => [
            index + 1,
            tx.date ? new Date(tx.date).toLocaleDateString("id-ID") : "-",
            tx.description || "-",
            tx.balanceName || "-",
            tx.type === "income" ? "Pemasukan" : "Pengeluaran",
            fmtRp(tx.amount || 0),
        ]));

        drawSection("Kategori");
        drawTable(["No", "Kategori", "Pemasukan", "Pengeluaran", "Bersih"], Object.entries(data.byCategory).map(([category, value], index) => [
            index + 1,
            category,
            fmtRp(value.income || 0),
            fmtRp(value.expense || 0),
            fmtRp((value.income || 0) - (value.expense || 0)),
        ]));

        drawSection("Saldo");
        drawTable(["No", "Nama", "Tipe", "Saldo"], data.balances.map((balance, index) => [
            index + 1,
            balance.name || "-",
            balance.type || "-",
            fmtRp(balance.balance || 0),
        ]));

        drawSection("Tabungan");
        drawTable(["No", "Nama", "Target", "Terkumpul", "Setoran Bulan Ini", "Status"], data.tabungan.map((item, index) => [
            index + 1,
            item.name || "-",
            fmtRp(item.targetAmount || 0),
            fmtRp(item.terkumpul || 0),
            fmtRp(item.setoranBulanIni || 0),
            item.isCompleted ? "Selesai" : "Berjalan",
        ]));

        doc.end();
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
