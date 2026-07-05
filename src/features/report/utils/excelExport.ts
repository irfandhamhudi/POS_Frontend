import type { Transaction } from '../../order/types';

interface PopularItem {
  name: string;
  category: string;
  qty: number;
  revenue: number;
}

/**
 * Dynamically loads the ExcelJS library from a CDN if it's not already available on the window.
 */
const loadExcelJS = (): Promise<any> => {
  return new Promise((resolve, reject) => {
    if ((window as any).ExcelJS) {
      resolve((window as any).ExcelJS);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/exceljs@4.4.0/dist/exceljs.min.js';
    script.async = true;
    script.onload = () => {
      if ((window as any).ExcelJS) {
        resolve((window as any).ExcelJS);
      } else {
        reject(new Error('ExcelJS object not found on window after loading script.'));
      }
    };
    script.onerror = (err) => {
      reject(new Error('Failed to load ExcelJS library from CDN: ' + err));
    };
    document.head.appendChild(script);
  });
};

/**
 * Exports Today's Transaction Report to an Excel file (.xlsx) spanning columns A to S.
 * Uses ExcelJS loaded dynamically from CDN to generate standard, warning-free, styled
 * worksheets starting from cell A1.
 */
interface CashoutItem {
  amount: number;
  description: string;
  createdAt: string;
}

export const exportToExcel = async (
  transactions: Transaction[],
  popularItems: PopularItem[],
  lang: 'en' | 'id' = 'en',
  cashouts: CashoutItem[] = [],
  dateLabel?: string,
  filenameLabel?: string
) => {
  try {
    const ExcelJS = await loadExcelJS();

    const isId = lang === 'id';

    const formatExcelTime = (createdAtStr: string, timestampFallback: string) => {
      if (createdAtStr) {
        const date = new Date(createdAtStr);
        if (!isNaN(date.getTime())) {
          if (isId) {
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            return `${hours}:${minutes} WIB`;
          } else {
            let hours = date.getHours();
            const minutes = String(date.getMinutes()).padStart(2, '0');
            const ampm = hours >= 12 ? 'PM' : 'AM';
            hours = hours % 12;
            hours = hours ? hours : 12;
            return `${hours}:${minutes} ${ampm}`;
          }
        }
      }
      return isId ? `${timestampFallback} WIB` : timestampFallback;
    };

    const formatExcelDate = (createdAtStr: string) => {
      if (createdAtStr) {
        const date = new Date(createdAtStr);
        if (!isNaN(date.getTime())) {
          const day = date.getDate();
          const monthsEn = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
          const monthsId = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
          const month = isId ? monthsId[date.getMonth()] : monthsEn[date.getMonth()];
          const year = date.getFullYear();
          return `${day} ${month} ${year}`;
        }
      }
      const fallbackDate = new Date();
      const day = fallbackDate.getDate();
      const monthsEn = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      const monthsId = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
      const month = isId ? monthsId[fallbackDate.getMonth()] : monthsEn[fallbackDate.getMonth()];
      const year = fallbackDate.getFullYear();
      return `${day} ${month} ${year}`;
    };

    const formatExcelDateTime = (createdAtStr: string) => {
      const date = new Date(createdAtStr);
      if (isNaN(date.getTime())) return '-';

      const day = date.getDate();
      const monthsEn = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      const monthsId = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
      const month = isId ? monthsId[date.getMonth()] : monthsEn[date.getMonth()];
      const year = date.getFullYear();

      if (isId) {
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${day} ${month} ${year}, ${hours}:${minutes} WIB`;
      } else {
        let hours = date.getHours();
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12;
        return `${day} ${month} ${year}, ${hours}:${minutes} ${ampm}`;
      }
    };

    const formatExcelDateTimeWithLongMonth = (date: Date) => {
      const day = date.getDate();
      const monthsEn = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      const monthsId = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
      const month = isId ? monthsId[date.getMonth()] : monthsEn[date.getMonth()];
      const year = date.getFullYear();

      if (isId) {
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${day} ${month} ${year} ${hours}:${minutes} WIB`;
      } else {
        let hours = date.getHours();
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12;
        return `${month} ${day}, ${year} ${hours}:${minutes} ${ampm}`;
      }
    };

    const now = new Date();
    const dateStr = filenameLabel || now.toISOString().split('T')[0];
    const formattedDate = formatExcelDateTimeWithLongMonth(now);

    // Localized strings
    const L = {
      title: isId
        ? (dateLabel ? `LAPORAN TRANSAKSI PERIODE ${dateLabel.toUpperCase()}` : 'LAPORAN TRANSAKSI HARI INI')
        : (dateLabel ? `TRANSACTION REPORT FOR ${dateLabel.toUpperCase()}` : "TODAY'S TRANSACTION REPORT"),
      subtitle: isId ? `Dibuat: ${formattedDate} | Green Grounds Coffee POS System` : `Generated: ${formattedDate} | Green Grounds Coffee POS System`,
      summaryTitle: isId ? 'RINGKASAN METRIK' : 'SUMMARY METRICS',
      totalRevenue: isId ? 'TOTAL PENDAPATAN' : 'TOTAL REVENUE',
      totalDiscount: isId ? 'TOTAL DISKON' : 'TOTAL DISCOUNT',
      completedOrders: isId ? 'PESANAN SELESAI' : 'COMPLETED ORDERS',
      avgOrderValue: isId ? 'RATA-RATA NILAI PESANAN' : 'AVG ORDER VALUE',
      receiptId: isId ? 'No. Struk' : 'Receipt ID',
      date: isId ? 'Tanggal' : 'Date',
      time: isId ? 'Waktu' : 'Time',
      timestamp: isId ? 'Waktu' : 'Timestamp',
      customerName: isId ? 'Nama Pelanggan' : 'Customer Name',
      orderType: isId ? 'Tipe Pesanan' : 'Order Type',
      status: isId ? 'Status' : 'Status',
      discount: isId ? 'Diskon' : 'Discount',
      subtotal: isId ? 'Subtotal' : 'Subtotal',
      tax: isId ? 'Pajak (10%)' : 'Tax (10%)',
      total: isId ? 'Total' : 'Total',
      completed: isId ? 'SELESAI' : 'COMPLETED',
      cancelled: isId ? 'DIBATALKAN' : 'CANCELLED',
      dineIn: isId ? 'Makan di Tempat' : 'Dine In',
      takeAway: isId ? 'Bawa Pulang' : 'Take Away',
      online: isId ? 'Pesanan Online' : 'Online',
      noData: isId ? 'Belum ada transaksi tercatat.' : 'No transactions recorded yet.',
      totalLabel: 'TOTAL',
      // Product Performance tab
      productTitle: isId ? 'LAPORAN KINERJA PRODUK' : 'PRODUCT PERFORMANCE REPORT',
      productSubtitle: isId ? 'Peringkat item menu berdasarkan jumlah terjual' : 'Ranking of menu items by quantity sold',
      productName: isId ? 'Nama Produk' : 'Product Name',
      category: isId ? 'Kategori' : 'Category',
      qtySold: isId ? 'Jumlah Terjual' : 'Quantity Sold',
      totalRevenue2: isId ? 'Total Pendapatan' : 'Total Revenue',
      noProducts: isId ? 'Belum ada detail penjualan tercatat.' : 'No sales details recorded yet.',
    };

    // Show ALL transactions, but metrics only count completed
    const completedTransactions = transactions.filter(tx => tx.status !== 'cancelled');

    const totalRevenue = completedTransactions.reduce((sum, tx) => sum + tx.total, 0);
    const totalDiscount = completedTransactions.reduce((sum, tx) => sum + (tx.discount || 0), 0);
    const totalOrders = completedTransactions.length;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    const workbook = new ExcelJS.Workbook();

    // Configure default properties
    workbook.creator = 'Green Grounds Coffee POS System';
    workbook.created = now;

    // Standard Styles Definitions
    const fontSegoeUI = (size: number, bold = false, italic = false, colorHex = 'FF1F2937') => ({
      name: 'Segoe UI',
      size,
      bold,
      italic,
      color: { argb: colorHex }
    });

    const fillSolid = (colorHex: string) => ({
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: colorHex }
    });

    const borderThin = (colorHex = 'FF9CA3AF') => ({
      top: { style: 'thin', color: { argb: colorHex } },
      left: { style: 'thin', color: { argb: colorHex } },
      bottom: { style: 'thin', color: { argb: colorHex } },
      right: { style: 'thin', color: { argb: colorHex } }
    });

    // const borderDoubleBottom = (colorHex = 'FF9CA3AF', bottomColorHex = 'FF0A422D') => ({
    //   top: { style: 'thin', color: { argb: colorHex } },
    //   left: { style: 'thin', color: { argb: colorHex } },
    //   bottom: { style: 'double', color: { argb: bottomColorHex } },
    //   right: { style: 'thin', color: { argb: colorHex } }
    // });

    // Range styling helper to cleanly apply styles across merged cells
    const styleRange = (
      ws: any,
      row: number,
      startCol: number,
      endCol: number,
      font: any,
      fill: any,
      border: any,
      alignment: any,
      numFmt?: string
    ) => {
      for (let c = startCol; c <= endCol; c++) {
        const cell = ws.getCell(row, c);
        if (font) cell.font = font;
        if (fill) cell.fill = fill;
        if (border) cell.border = border;
        if (alignment) cell.alignment = alignment;
        if (numFmt) cell.numFmt = numFmt;
      }
    };

    const colWidths = Array(19).fill(10); // A to S (19 columns, width 10 each for full screen)
    colWidths[6] = 8.5; // Column G (Customer Name part 1) width to approx 67 pixels
    colWidths[7] = 8.5; // Column H (Customer Name part 2) width to approx 67 pixels
    colWidths[8] = 9; // Column I (Total Revenue part 1 / Customer Name part 3) width to approx 71 pixels
    colWidths[9] = 9; // Column J (Total Revenue part 2) width to approx 71 pixels
    colWidths[10] = 9; // Column K (Total Revenue part 3) width to approx 71 pixels
    colWidths[11] = 22; // Extend Column L (Status) width to 22 (approx 174 pixels)
    colWidths[14] = 9; // Column O (Subtotal part 1) width to approx 71 pixels
    colWidths[15] = 9; // Column P (Subtotal part 2) width to approx 71 pixels
    colWidths[16] = 18; // Column Q (Tax) width to approx 141 pixels

    // ----------------------------------------------------
    // TAB 1: TRANSACTIONS SUMMARY
    // ----------------------------------------------------
    const ws1 = workbook.addWorksheet('Transactions Summary', {
      views: [{ showGridLines: true }]
    });

    colWidths.forEach((w, idx) => {
      ws1.getColumn(idx + 1).width = w;
    });

    // Row 1: Centered Title (merged A1:S1)
    ws1.mergeCells('A1:S1');
    const r1 = ws1.getRow(1);
    r1.height = 40;
    const c1 = ws1.getCell('A1');
    c1.value = L.title;
    c1.font = fontSegoeUI(16, true, false, 'FF0A422D');
    c1.alignment = { vertical: 'middle', horizontal: 'center' };

    // Row 2: Centered Subtitle (merged A2:S2)
    ws1.mergeCells('A2:S2');
    const r2 = ws1.getRow(2);
    r2.height = 20;
    const c2 = ws1.getCell('A2');
    c2.value = L.subtitle;
    c2.font = fontSegoeUI(10, false, true, 'FF6B7280');
    c2.alignment = { vertical: 'middle', horizontal: 'center' };

    // Row 3: Spacer
    ws1.getRow(3).height = 10;

    // Row 4: Summary Metrics Title (merged A4:S4)
    ws1.mergeCells('A4:S4');
    const r4 = ws1.getRow(4);
    r4.height = 22;
    const c4 = ws1.getCell('A4');
    c4.value = L.summaryTitle;
    c4.font = fontSegoeUI(11, true, false, 'FF374151');
    c4.alignment = { vertical: 'middle', horizontal: 'center' };

    // Row 5: Metrics Headers (Adjacent A5:S5, no gaps)
    const r5 = ws1.getRow(5);
    r5.height = 20;

    ws1.mergeCells('A5:E5');
    const metricH1 = ws1.getCell('A5');
    metricH1.value = L.totalRevenue;

    ws1.mergeCells('F5:J5');
    const metricH1b = ws1.getCell('F5');
    metricH1b.value = L.totalDiscount;

    ws1.mergeCells('K5:O5');
    const metricH2 = ws1.getCell('K5');
    metricH2.value = L.completedOrders;

    ws1.mergeCells('P5:S5');
    const metricH3 = ws1.getCell('P5');
    metricH3.value = L.avgOrderValue;

    // Style Metrics Headers (cols A to S)
    const alignCenter = { vertical: 'middle', horizontal: 'center' };

    styleRange(ws1, 5, 1, 5, fontSegoeUI(9, true, false, 'FF047857'), fillSolid('FFECFDF5'), borderThin('FFA7F3D0'), alignCenter);
    styleRange(ws1, 5, 6, 10, fontSegoeUI(9, true, false, 'FFDC2626'), fillSolid('FEF2F2'), borderThin('FECACA'), alignCenter);
    styleRange(ws1, 5, 11, 15, fontSegoeUI(9, true, false, 'FF374151'), fillSolid('FFF3F4F6'), borderThin('FFE5E7EB'), alignCenter);
    styleRange(ws1, 5, 16, 19, fontSegoeUI(9, true, false, 'FF92400E'), fillSolid('FFFEF3C7'), borderThin('FFFDE68A'), alignCenter);

    // Row 6: Metrics Values (cols A to S)
    const r6 = ws1.getRow(6);
    r6.height = 28;

    ws1.mergeCells('A6:E6');
    const metricV1 = ws1.getCell('A6');
    metricV1.value = totalRevenue;
    metricV1.numFmt = '"Rp "#,##0';

    ws1.mergeCells('F6:J6');
    const metricV1b = ws1.getCell('F6');
    metricV1b.value = totalDiscount;
    metricV1b.numFmt = '"Rp "#,##0';

    ws1.mergeCells('K6:O6');
    const metricV2 = ws1.getCell('K6');
    metricV2.value = totalOrders;
    metricV2.numFmt = '#,##0';

    ws1.mergeCells('P6:S6');
    const metricV3 = ws1.getCell('P6');
    metricV3.value = averageOrderValue;
    metricV3.numFmt = '"Rp "#,##0';

    styleRange(ws1, 6, 1, 5, fontSegoeUI(13, true, false, 'FF047857'), fillSolid('FFECFDF5'), borderThin('FFA7F3D0'), alignCenter);
    styleRange(ws1, 6, 6, 10, fontSegoeUI(13, true, false, 'FFDC2626'), fillSolid('FEF2F2'), borderThin('FECACA'), alignCenter);
    styleRange(ws1, 6, 11, 15, fontSegoeUI(13, true, false, 'FF111827'), fillSolid('FFF3F4F6'), borderThin('FFE5E7EB'), alignCenter);
    styleRange(ws1, 6, 16, 19, fontSegoeUI(13, true, false, 'FF92400E'), fillSolid('FFFEF3C7'), borderThin('FFFDE68A'), alignCenter);

    // Row 7: Spacer
    ws1.getRow(7).height = 15;

    // Row 8: Table Header (spanning A8 to S8)
    const r8 = ws1.getRow(8);
    r8.height = 26;

    ws1.mergeCells('A8:B8');
    ws1.getCell('A8').value = L.receiptId;
    ws1.mergeCells('C8:D8');
    ws1.getCell('C8').value = L.date;
    ws1.mergeCells('E8:F8');
    ws1.getCell('E8').value = L.time;
    ws1.mergeCells('G8:I8');
    ws1.getCell('G8').value = L.customerName;
    ws1.mergeCells('J8:K8');
    ws1.getCell('J8').value = L.orderType;
    ws1.getCell('L8').value = L.status;
    ws1.mergeCells('M8:N8');
    ws1.getCell('M8').value = L.discount;
    ws1.mergeCells('O8:P8');
    ws1.getCell('O8').value = L.subtotal;
    ws1.getCell('Q8').value = L.tax;
    ws1.mergeCells('R8:S8');
    ws1.getCell('R8').value = L.total;

    styleRange(ws1, 8, 1, 19, fontSegoeUI(10, true, false, 'FFFFFFFF'), fillSolid('FF0A422D'), borderThin(), alignCenter);

    // Dynamic rows: render ALL transactions
    let totalSubtotal = 0;
    let totalTax = 0;
    const DATA_START_ROW = 9;

    if (transactions.length === 0) {
      ws1.mergeCells(`A${DATA_START_ROW}:S${DATA_START_ROW}`);
      const rEmpty = ws1.getRow(DATA_START_ROW);
      rEmpty.height = 22;
      const cellEmpty = ws1.getCell(`A${DATA_START_ROW}`);
      cellEmpty.value = L.noData;
      cellEmpty.font = fontSegoeUI(10, false, true, 'FF6B7280');
      cellEmpty.alignment = alignCenter;
      styleRange(ws1, DATA_START_ROW, 1, 19, null, fillSolid('FFFFFFFF'), borderThin(), alignCenter);
    }

    // Render ALL transactions (completed + cancelled)
    transactions.forEach((tx, txIdx) => {
      const sub = tx.subtotal || (tx.total / 1.1);
      const tax = tx.tax || (tx.total - sub);
      const isCancelled = tx.status === 'cancelled';

      if (!isCancelled) {
        totalSubtotal += sub;
        totalTax += tax;
      }

      const rowNum = DATA_START_ROW + txIdx;
      const rData = ws1.getRow(rowNum);
      rData.height = 22;

      const isEvenRow = txIdx % 2 === 0;
      const rowBgHex = isCancelled ? 'FFFEF2F2' : (isEvenRow ? 'FFFFFFFF' : 'FFF9FAFB');
      const fill = fillSolid(rowBgHex);
      const border = borderThin();
      const rowFontColor = isCancelled ? 'FFDC2626' : 'FF1F2937';

      // Receipt ID (Col A to B)
      ws1.mergeCells(`A${rowNum}:B${rowNum}`);
      const cID = ws1.getCell(rowNum, 1);
      cID.value = tx.id;
      styleRange(ws1, rowNum, 1, 2, fontSegoeUI(10, false, false, rowFontColor), fill, border, alignCenter);

      // Tanggal (Col C to D)
      ws1.mergeCells(`C${rowNum}:D${rowNum}`);
      const cDate = ws1.getCell(rowNum, 3);
      cDate.value = formatExcelDate(tx.createdAt);
      styleRange(ws1, rowNum, 3, 4, fontSegoeUI(10, false, false, rowFontColor), fill, border, alignCenter);

      // Waktu (Col E to F)
      ws1.mergeCells(`E${rowNum}:F${rowNum}`);
      const cTime = ws1.getCell(rowNum, 5);
      cTime.value = formatExcelTime(tx.createdAt, tx.timestamp);
      styleRange(ws1, rowNum, 5, 6, fontSegoeUI(10, false, false, rowFontColor), fill, border, alignCenter);

      // Customer Name (Cols G to I)
      ws1.mergeCells(`G${rowNum}:I${rowNum}`);
      const cCust = ws1.getCell(rowNum, 7);
      cCust.value = tx.customerName;
      styleRange(ws1, rowNum, 7, 9, fontSegoeUI(10, false, false, rowFontColor), fill, border, { vertical: 'middle', horizontal: 'center' });

      // Order Type (Cols J to K)
      ws1.mergeCells(`J${rowNum}:K${rowNum}`);
      const cType = ws1.getCell(rowNum, 10);
      cType.value = tx.orderType === 'dine_in' ? L.dineIn : tx.orderType === 'take_away' ? L.takeAway : tx.orderType === 'order_online' ? L.online : tx.orderType;
      styleRange(ws1, rowNum, 10, 11, fontSegoeUI(10, false, false, rowFontColor), fill, border, alignCenter);

      // Status (Col L)
      const cStatus = ws1.getCell(rowNum, 12);
      cStatus.value = isCancelled ? L.cancelled : L.completed;
      const statusFontColor = isCancelled ? 'FFDC2626' : 'FF16A34A';
      styleRange(ws1, rowNum, 12, 12, fontSegoeUI(10, isCancelled, false, statusFontColor), fill, border, alignCenter);

      // Discount (Col M to N)
      ws1.mergeCells(`M${rowNum}:N${rowNum}`);
      const cDiscount = ws1.getCell(rowNum, 13);
      const txDiscount = tx.discount || 0;
      cDiscount.value = txDiscount > 0 ? txDiscount : 0;
      styleRange(ws1, rowNum, 13, 14, fontSegoeUI(10, false, false, rowFontColor), fill, border, { vertical: 'middle', horizontal: 'right' }, '"Rp "#,##0');

      // Subtotal (Col O to P)
      ws1.mergeCells(`O${rowNum}:P${rowNum}`);
      const cSub = ws1.getCell(rowNum, 15);
      cSub.value = isCancelled ? 0 : sub;
      styleRange(ws1, rowNum, 15, 16, fontSegoeUI(10, false, false, rowFontColor), fill, border, { vertical: 'middle', horizontal: 'right' }, '"Rp "#,##0');

      // Tax (Col Q)
      const cTax = ws1.getCell(rowNum, 17);
      cTax.value = isCancelled ? 0 : tax;
      styleRange(ws1, rowNum, 17, 17, fontSegoeUI(10, false, false, rowFontColor), fill, border, { vertical: 'middle', horizontal: 'right' }, '"Rp "#,##0');

      // Total (Cols R to S merged)
      ws1.mergeCells(`R${rowNum}:S${rowNum}`);
      const cTot = ws1.getCell(rowNum, 18);
      cTot.value = isCancelled ? 0 : tx.total;
      styleRange(ws1, rowNum, 18, 19, fontSegoeUI(10, false, false, rowFontColor), fill, border, { vertical: 'middle', horizontal: 'right' }, '"Rp "#,##0');
    });

    // Dynamic TOTAL_ROW after all data rows
    const TOTAL_ROW = transactions.length > 0 ? DATA_START_ROW + transactions.length : DATA_START_ROW + 1;

    // Totals Footer Row — always at row 13
    ws1.mergeCells(`A${TOTAL_ROW}:N${TOTAL_ROW}`);
    const rTotal = ws1.getRow(TOTAL_ROW);
    rTotal.height = 24;

    const cellTotalLabel = ws1.getCell(`A${TOTAL_ROW}`);
    cellTotalLabel.value = L.totalLabel;

    // Style merged label cells (A to N)
    styleRange(ws1, TOTAL_ROW, 1, 14, fontSegoeUI(10, true), fillSolid('FFF9FAFB'), borderThin(), { vertical: 'middle', horizontal: 'center' });

    // Subtotal total (Col O to P)
    ws1.mergeCells(`O${TOTAL_ROW}:P${TOTAL_ROW}`);
    const cellTotalSub = ws1.getCell(TOTAL_ROW, 15);
    cellTotalSub.value = totalSubtotal;
    styleRange(ws1, TOTAL_ROW, 15, 16, fontSegoeUI(10, true, false, 'FF0A422D'), fillSolid('FFF9FAFB'), borderThin(), { vertical: 'middle', horizontal: 'right' }, '"Rp "#,##0');

    // Tax total (Col Q)
    const cellTotalTax = ws1.getCell(TOTAL_ROW, 17);
    cellTotalTax.value = totalTax;
    styleRange(ws1, TOTAL_ROW, 17, 17, fontSegoeUI(10, true, false, 'FF0A422D'), fillSolid('FFF9FAFB'), borderThin(), { vertical: 'middle', horizontal: 'right' }, '"Rp "#,##0');

    // Revenue total (Cols R & S merged)
    ws1.mergeCells(`R${TOTAL_ROW}:S${TOTAL_ROW}`);
    const cellTotalRev = ws1.getCell(TOTAL_ROW, 18);
    cellTotalRev.value = totalRevenue;
    styleRange(ws1, TOTAL_ROW, 18, 19, fontSegoeUI(10, true, false, 'FF0A422D'), fillSolid('FFF9FAFB'), borderThin(), { vertical: 'middle', horizontal: 'right' }, '"Rp "#,##0');


    // ----------------------------------------------------
    // PRODUCT PERFORMANCE SECTION (Embedded in ws1)
    // ----------------------------------------------------
    const PRODUCT_START = TOTAL_ROW + 3;    // --- 1. Titles ---
    if (cashouts.length > 0) {
      // Product Performance Title (Left)
      ws1.mergeCells(`A${PRODUCT_START}:K${PRODUCT_START}`);
      const cTitleProd = ws1.getCell(PRODUCT_START, 1);
      cTitleProd.value = L.productTitle;
      cTitleProd.font = fontSegoeUI(11, true, false, 'FF0A422D');
      cTitleProd.alignment = { vertical: 'middle', horizontal: 'left' };

      // Cashouts Title (Right)
      ws1.mergeCells(`M${PRODUCT_START}:S${PRODUCT_START}`);
      const cTitleCash = ws1.getCell(PRODUCT_START, 13);
      cTitleCash.value = isId ? 'KASBON (PENGELUARAN)' : 'CASHOUTS (EXPENSES)';
      cTitleCash.font = fontSegoeUI(11, true, false, 'FFDC2626');
      cTitleCash.alignment = { vertical: 'middle', horizontal: 'left' };
    } else {
      // Single Product Performance Title across all columns
      ws1.mergeCells(`A${PRODUCT_START}:S${PRODUCT_START}`);
      const cTitleProd = ws1.getCell(PRODUCT_START, 1);
      cTitleProd.value = L.productTitle;
      cTitleProd.font = fontSegoeUI(11, true, false, 'FF0A422D');
      cTitleProd.alignment = { vertical: 'middle', horizontal: 'left' };
    }
    ws1.getRow(PRODUCT_START).height = 24;

    // --- 2. Table Headers ---
    const hRow = PRODUCT_START + 1;
    ws1.getRow(hRow).height = 26;

    // Product Performance Header
    ws1.mergeCells(`A${hRow}:C${hRow}`);
    ws1.getCell(hRow, 1).value = L.productName;

    ws1.mergeCells(`D${hRow}:F${hRow}`);
    ws1.getCell(hRow, 4).value = L.category;

    ws1.mergeCells(`G${hRow}:H${hRow}`);
    ws1.getCell(hRow, 7).value = L.qtySold;

    ws1.mergeCells(`I${hRow}:K${hRow}`);
    ws1.getCell(hRow, 9).value = L.totalRevenue2;

    styleRange(ws1, hRow, 1, 11, fontSegoeUI(10, true, false, 'FFFFFFFF'), fillSolid('FF0A422D'), borderThin(), alignCenter);

    // Cashouts Header (if active)
    if (cashouts.length > 0) {
      ws1.mergeCells(`M${hRow}:N${hRow}`);
      ws1.getCell(hRow, 13).value = isId ? 'Tanggal' : 'Date';

      ws1.mergeCells(`O${hRow}:Q${hRow}`);
      ws1.getCell(hRow, 15).value = isId ? 'Keterangan' : 'Description';

      ws1.mergeCells(`R${hRow}:S${hRow}`);
      ws1.getCell(hRow, 18).value = isId ? 'Jumlah' : 'Amount';

      styleRange(ws1, hRow, 13, 19, fontSegoeUI(10, true, false, 'FFFFFFFF'), fillSolid('FFDC2626'), borderThin(), alignCenter);
    }

    // --- 3. Data Rows & Totals for Product Performance ---
    let totalQtySold = 0;
    let totalProductRevenue = 0;
    let currentProductRow = hRow + 1;

    const translateCategory = (cat: string) => {
      const c = cat.trim().toLowerCase();
      if (isId) {
        if (c === 'coffee' || c === 'kopi') return 'Kopi';
        if (c === 'tea' || c === 'teh') return 'Teh';
        if (c === 'snack' || c === 'camilan' || c === 'cemilan') return 'Camilan';
        if (c === 'main_course' || c === 'main course' || c === 'makanan utama') return 'Makanan Utama';
        return cat;
      } else {
        if (c === 'coffee' || c === 'kopi') return 'Coffee';
        if (c === 'tea' || c === 'teh') return 'Tea';
        if (c === 'snack' || c === 'camilan' || c === 'cemilan') return 'Snack';
        if (c === 'main_course' || c === 'main course' || c === 'makanan utama') return 'Main Course';
        return cat;
      }
    };

    if (popularItems.length === 0) {
      ws1.mergeCells(`A${currentProductRow}:K${currentProductRow}`);
      const rEmptyProduct = ws1.getRow(currentProductRow);
      rEmptyProduct.height = 22;
      const cellEmptyProduct = ws1.getCell(`A${currentProductRow}`);
      cellEmptyProduct.value = L.noProducts;
      cellEmptyProduct.font = fontSegoeUI(10, false, true, 'FF6B7280');
      cellEmptyProduct.alignment = alignCenter;

      styleRange(ws1, currentProductRow, 1, 11, null, null, borderThin(), alignCenter);
      currentProductRow++;
    } else {
      popularItems.forEach((item, itemIdx) => {
        totalQtySold += item.qty;
        totalProductRevenue += item.revenue;

        const rowNum = hRow + 1 + itemIdx;
        ws1.getRow(rowNum).height = 22;

        const isEvenRow = itemIdx % 2 === 0;
        const rowBgHex = isEvenRow ? 'FFFFFFFF' : 'FFF9FAFB';
        const fill = fillSolid(rowBgHex);
        const border = borderThin();

        // Product Name (Cols A to C merged)
        ws1.mergeCells(`A${rowNum}:C${rowNum}`);
        const cName = ws1.getCell(rowNum, 1);
        cName.value = item.name;
        styleRange(ws1, rowNum, 1, 3, fontSegoeUI(10), fill, border, { vertical: 'middle', horizontal: 'left' });

        // Category (Cols D to F merged)
        ws1.mergeCells(`D${rowNum}:F${rowNum}`);
        const cCat = ws1.getCell(rowNum, 4);
        cCat.value = translateCategory(item.category).toUpperCase();
        styleRange(ws1, rowNum, 4, 6, fontSegoeUI(10), fill, border, alignCenter);

        // Quantity Sold (Cols G to H merged)
        ws1.mergeCells(`G${rowNum}:H${rowNum}`);
        const cQty = ws1.getCell(rowNum, 7);
        cQty.value = item.qty;
        styleRange(ws1, rowNum, 7, 8, fontSegoeUI(10), fill, border, alignCenter, '#,##0');

        // Total Revenue (Cols I to K merged)
        ws1.mergeCells(`I${rowNum}:K${rowNum}`);
        const cRev = ws1.getCell(rowNum, 9);
        cRev.value = item.revenue;
        styleRange(ws1, rowNum, 9, 11, fontSegoeUI(10), fill, border, { vertical: 'middle', horizontal: 'right' }, '"Rp "#,##0');

        currentProductRow = rowNum + 1;
      });
    }

    // Totals Footer Row Product Performance
    ws1.mergeCells(`A${currentProductRow}:F${currentProductRow}`);
    ws1.getRow(currentProductRow).height = 24;

    const cellTotalLabelProduct = ws1.getCell(`A${currentProductRow}`);
    cellTotalLabelProduct.value = L.totalLabel;
    styleRange(ws1, currentProductRow, 1, 6, fontSegoeUI(10, true), fillSolid('FFF9FAFB'), borderThin(), { vertical: 'middle', horizontal: 'right' });

    // Qty total (Cols G to H merged)
    ws1.mergeCells(`G${currentProductRow}:H${currentProductRow}`);
    const cellTotalQty = ws1.getCell(currentProductRow, 7);
    cellTotalQty.value = totalQtySold;
    styleRange(ws1, currentProductRow, 7, 8, fontSegoeUI(10, true), fillSolid('FFF9FAFB'), borderThin(), alignCenter, '#,##0');

    // Revenue total (Cols I to K merged)
    ws1.mergeCells(`I${currentProductRow}:K${currentProductRow}`);
    const cellTotalRevenueProduct = ws1.getCell(currentProductRow, 9);
    cellTotalRevenueProduct.value = totalProductRevenue;
    styleRange(ws1, currentProductRow, 9, 11, fontSegoeUI(10, true, false, 'FF0A422D'), fillSolid('FFF9FAFB'), borderThin(), { vertical: 'middle', horizontal: 'right' }, '"Rp "#,##0');

    const PRODUCT_END_ROW = currentProductRow;

    // --- 4. Data Rows & Totals for Cashouts (if active) ---
    let cashoutEndRow = hRow;
    let totalCashout = 0;

    if (cashouts.length > 0) {
      totalCashout = cashouts.reduce((s, c) => s + c.amount, 0);

      cashouts.forEach((co, idx) => {
        const rowNum = hRow + 1 + idx;
        ws1.getRow(rowNum).height = 22;

        const isEvenRow = idx % 2 === 0;
        const rowBgHex = isEvenRow ? 'FFFFFFFF' : 'FFFEF2F2';
        const fill = fillSolid(rowBgHex);
        const border = borderThin();

        // Date Time (M-N merged)
        ws1.mergeCells(`M${rowNum}:N${rowNum}`);
        const cDate = ws1.getCell(rowNum, 13);
        cDate.value = formatExcelDateTime(co.createdAt);
        styleRange(ws1, rowNum, 13, 14, fontSegoeUI(9), fill, border, alignCenter);

        // Description (O-Q merged)
        ws1.mergeCells(`O${rowNum}:Q${rowNum}`);
        const cDesc = ws1.getCell(rowNum, 15);
        cDesc.value = co.description || '-';
        styleRange(ws1, rowNum, 15, 17, fontSegoeUI(9), fill, border, { vertical: 'middle', horizontal: 'left' });

        // Amount (R-S merged)
        ws1.mergeCells(`R${rowNum}:S${rowNum}`);
        const cAmt = ws1.getCell(rowNum, 18);
        cAmt.value = co.amount;
        styleRange(ws1, rowNum, 18, 19, fontSegoeUI(9, false, false, 'FFDC2626'), fill, border, { vertical: 'middle', horizontal: 'right' }, '"Rp "#,##0');

        cashoutEndRow = rowNum + 1;
      });

      // Totals Footer Row Cashouts
      ws1.mergeCells(`M${cashoutEndRow}:Q${cashoutEndRow}`);
      ws1.getRow(cashoutEndRow).height = 24;

      const cellTotalLabel3 = ws1.getCell(`M${cashoutEndRow}`);
      cellTotalLabel3.value = isId ? 'TOTAL KASBON' : 'TOTAL CASHOUTS';
      styleRange(ws1, cashoutEndRow, 13, 17, fontSegoeUI(10, true, false, 'FFDC2626'), fillSolid('FFFEF2F2'), borderThin(), { vertical: 'middle', horizontal: 'right' });

      ws1.mergeCells(`R${cashoutEndRow}:S${cashoutEndRow}`);
      const cellTotalQty3 = ws1.getCell(cashoutEndRow, 18);
      cellTotalQty3.value = totalCashout;
      styleRange(ws1, cashoutEndRow, 18, 19, fontSegoeUI(10, true, false, 'FFDC2626'), fillSolid('FFFEF2F2'), borderThin(), { vertical: 'middle', horizontal: 'right' }, '"Rp "#,##0');
    }

    const BOTTOM_ROW = Math.max(PRODUCT_END_ROW, cashoutEndRow);

    // --- 5. Net Income Row (if active) ---
    if (cashouts.length > 0) {
      const netRow = BOTTOM_ROW + 2;

      // Label box: columns O to P merged
      ws1.mergeCells(`O${netRow}:P${netRow}`);
      const cellNetLabel = ws1.getCell(netRow, 15);
      cellNetLabel.value = isId ? 'Pendapatan Bersih' : 'Net Income';
      cellNetLabel.font = fontSegoeUI(10, true, false, 'FF1F2937');
      cellNetLabel.alignment = { vertical: 'middle', horizontal: 'center' };
      ws1.getRow(netRow).height = 24;

      // Value box: columns Q to S merged
      ws1.mergeCells(`Q${netRow}:S${netRow}`);
      const cellNetValue = ws1.getCell(netRow, 17);
      const netVal = totalRevenue - totalCashout;
      cellNetValue.value = netVal;
      cellNetValue.font = fontSegoeUI(12, true, false, 'FF1F2937');
      cellNetValue.numFmt = '"Rp "#,##0';
      cellNetValue.alignment = { vertical: 'middle', horizontal: 'right' };

      styleRange(ws1, netRow, 15, 16, null, null, borderThin(), null);
      styleRange(ws1, netRow, 17, 19, null, null, borderThin(), null);
    }

    // --- WRITE WORKBOOK BUFFER & DOWNLOAD ---
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `Transaction_Report_${dateStr}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error generating Excel file:', error);
    alert('Failed to export Excel report. Please check your internet connection and try again.');
  }
};
