import { formatCurrency } from './formatCurrency';
import { Capacitor, registerPlugin } from '@capacitor/core';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const escapeHtml = (value) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

const safeAlign = (value) => ['left', 'center', 'right'].includes(value) ? value : 'left';
const safeColor = (value, fallback) => /^#[0-9a-f]{3,8}$/i.test(String(value || '')) ? value : fallback;
const SaveAsPdf = registerPlugin('SaveAsPdf');

const nativeFileName = (filename) => String(filename || 'statement.pdf')
  .replace(/[^a-z0-9._-]+/gi, '_')
  .replace(/\.pdf$/i, '') + '.pdf';

const nativeCellValue = (row, column) => String(
  row[column.key] === undefined || row[column.key] === null ? '' : row[column.key]
).replace(/₹/g, 'Rs. ');
const nativeTextValue = (value) => String(value ?? '').replace(/₹/g, 'Rs. ');

const buildNativePdf = ({
  title,
  subtitle,
  columns,
  data,
  summary,
  sections,
  orientation
}) => {
  const maxColumnCount = Math.max(
    columns.length,
    ...sections.map((section) => (section.columns || []).length),
    0
  );
  const pdfOrientation = orientation === 'landscape' || maxColumnCount >= 6 ? 'landscape' : 'portrait';
  const doc = new jsPDF({
    orientation: pdfOrientation,
    unit: 'mm',
    format: 'a4'
  });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 12;
  let cursorY = 16;

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('LOGANATHAN EARTH MOVERS', margin, cursorY);
  cursorY += 7;
  doc.setTextColor(3, 105, 161);
  doc.setFontSize(12);
  doc.text(String(title || 'STATEMENT'), margin, cursorY);
  cursorY += 6;
  doc.setTextColor(71, 85, 105);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const headerSubtitle = doc.splitTextToSize(
    String(subtitle || `Generated: ${new Date().toLocaleDateString('en-IN')}`),
    pageWidth - (margin * 2)
  );
  doc.text(headerSubtitle, margin, cursorY);
  cursorY += (headerSubtitle.length - 1) * 4;
  doc.setDrawColor(2, 132, 199);
  doc.setLineWidth(0.8);
  doc.line(margin, cursorY + 4, pageWidth - margin, cursorY + 4);
  cursorY += 12;

  const addTable = (tableColumns, tableData, sectionTitle = '') => {
    if (sectionTitle) {
      if (cursorY > doc.internal.pageSize.getHeight() - 30) {
        doc.addPage();
        cursorY = 16;
      }
      doc.setFillColor(240, 249, 255);
      doc.setDrawColor(2, 132, 199);
      doc.rect(margin, cursorY - 4, pageWidth - (margin * 2), 8, 'F');
      doc.setFillColor(2, 132, 199);
      doc.rect(margin, cursorY - 4, 1.5, 8, 'F');
      doc.setTextColor(3, 105, 161);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text(sectionTitle, margin + 4, cursorY + 1.5);
      cursorY += 8;
    }

    const pdfColumns = [{ header: 'S.No.', key: '__serial', align: 'center' }, ...tableColumns];
    const pdfData = tableData.map((row, index) => ({ ...row, __serial: index + 1 }));
    const tableFontSize = maxColumnCount >= 9 ? 8 : maxColumnCount >= 7 ? 8.5 : maxColumnCount >= 6 ? 9 : 10;
    const tableColumnStyles = Object.fromEntries(pdfColumns.map((column, index) => {
      const key = String(column.key || '').toLowerCase();
      const header = String(column.header || '').toLowerCase();
      const style = { halign: safeAlign(column.align) };

      if (column.align === 'right' || /amount|balance|due|paid|total|principal|returned|credit|debit|income|expense|profit|revenue|cost|price|rate|tenure/.test(`${key} ${header}`)) {
        style.cellWidth = 25;
       } else if (/date/.test(`${key} ${header}`)) {
         style.cellWidth = 30;
         style.overflow = 'visible';
      } else if (/phone|mobile/.test(`${key} ${header}`)) {
        style.cellWidth = 28;
      } else if (/^id$|loan.?id|customer.?code|supplier.?code/.test(`${key} ${header}`)) {
        style.cellWidth = 20;
      }

      return [index, style];
    }));

    autoTable(doc, {
      startY: cursorY,
      margin: { left: margin, right: margin },
       head: [pdfColumns.map((column) => column.header)],
       body: pdfData.map((row) => pdfColumns.map((column) => nativeCellValue(row, column))),
      theme: 'grid',
      styles: { font: 'helvetica', fontSize: tableFontSize, cellPadding: [1.7, 2], minCellHeight: 6.5, valign: 'middle', textColor: [30, 41, 59], lineColor: [226, 232, 240], lineWidth: 0.15, overflow: 'ellipsize' },
      headStyles: { fillColor: [241, 245, 249], textColor: [51, 65, 85], fontStyle: 'bold', fontSize: tableFontSize },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: tableColumnStyles,
      didDrawPage: () => {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text('Computer Generated Official Statement', pageWidth / 2, doc.internal.pageSize.getHeight() - 7, { align: 'center' });
      }
    });
    cursorY = doc.lastAutoTable.finalY + 8;
  };

  if (columns.length) addTable(columns, data);
  sections.forEach((section) => addTable(section.columns || [], section.data || [], section.title));

  if (summary.length) {
    if (cursorY > doc.internal.pageSize.getHeight() - 45) {
      doc.addPage();
      cursorY = 16;
    }
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Summary', margin, cursorY);
    cursorY += 5;
    autoTable(doc, {
      startY: cursorY,
      margin: { left: pageWidth - 95, right: margin },
       body: summary.map((item) => [nativeTextValue(item.label), nativeTextValue(item.value)]),
      theme: 'grid',
      styles: { font: 'helvetica', fontSize: 10, cellPadding: [1.8, 2.5], minCellHeight: 6.5, valign: 'middle', textColor: [30, 41, 59], overflow: 'ellipsize' },
      columnStyles: { 1: { halign: 'right', fontStyle: 'bold' } }
    });
  }

  return doc.output('datauristring').split(',')[1];
};

const exportNativePdf = async ({
  title,
  subtitle,
  filename,
  columns,
  data,
  summary,
  sections,
  orientation
}) => {
  const base64 = buildNativePdf({ title, subtitle, filename, columns, data, summary, sections, orientation });
  await SaveAsPdf.save({
    filename: nativeFileName(filename),
    data: base64
  });
};

const shareNativePdf = async (options) => {
  const base64 = buildNativePdf(options);
  await SaveAsPdf.share({
    filename: nativeFileName(options.filename),
    data: base64
  });
};

const renderTable = ({ columns = [], data = [] }) => {
  const pdfColumns = [{ header: 'S.No.', key: '__serial', align: 'center' }, ...columns];
  const columnsHtml = pdfColumns
    .map(
      (col) =>
        `<th style="padding: 9px 10px; border-bottom: 2px solid #cbd5e1; text-align: ${safeAlign(col.align)}; white-space: ${/date/i.test(`${col.key} ${col.header}`) || col.align === 'right' ? 'nowrap' : 'normal'}; min-width: ${/date/i.test(`${col.key} ${col.header}`) ? '78px' : 'auto'}; font-size: 12px; font-weight: 800; color: #334155; text-transform: uppercase;">${escapeHtml(col.header)}</th>`
    )
    .join('');

  const rowsHtml = data
    .map((row, idx) => {
      const bg = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
       const cells = pdfColumns
         .map((col) => {
           const val = col.key === '__serial' ? idx + 1 : row[col.key] !== undefined && row[col.key] !== null ? row[col.key] : '';
          const formattedVal = escapeHtml(val).replace(/\n/g, '<br/>');
           return `<td style="padding: 9px 10px; border-bottom: 1px solid #e2e8f0; font-size: 12px; line-height: 1.35; text-align: ${safeAlign(col.align)}; white-space: ${/date/i.test(`${col.key} ${col.header}`) || col.align === 'right' ? 'nowrap' : 'normal'}; min-width: ${/date/i.test(`${col.key} ${col.header}`) ? '78px' : 'auto'}; font-weight: ${col.bold ? '700' : '500'}; color: ${safeColor(col.color, '#1e293b')};">${formattedVal}</td>`;
        })
        .join('');
      return `<tr style="background-color: ${bg};">${cells}</tr>`;
    })
    .join('');

  return `
    <table class="report-table">
      <thead><tr>${columnsHtml}</tr></thead>
       <tbody>${rowsHtml || `<tr><td colspan="${pdfColumns.length || 1}" class="empty-cell">No entries found</td></tr>`}</tbody>
    </table>
  `;
};

/**
 * Universal PDF / Print Statement Generator
 */
export const exportToPdf = ({
  title = 'STATEMENT',
  subtitle = '',
  customerName = '',
  phone = '',
  address = '',
  filename = 'statement.pdf',
  columns = [],
  data = [],
  summary = [],
  sections = [],
  orientation = 'portrait',
  action = 'save'
}) => {
  if (Capacitor.isNativePlatform()) {
    const nativeExport = action === 'share' ? shareNativePdf : exportNativePdf;
    nativeExport({ title, subtitle, filename, columns, data, summary, sections, orientation })
      .catch(() => window.alert('Unable to create the PDF. Please try again.'));
    return;
  }

  const dateStr = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  const summaryHtml = summary
    .map(
      (s) => `
    <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #f1f5f9;">
       <span style="font-size: 12px; font-weight: 700; color: #64748b;">${escapeHtml(s.label)}:</span>
       <span style="font-size: 14px; font-weight: 900; color: ${safeColor(s.color, '#0f172a')};">${escapeHtml(s.value)}</span>
    </div>
  `
    )
    .join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${escapeHtml(title)} - ${escapeHtml(customerName || filename)}</title>
        <meta charset="utf-8" />
        <style>
          @page { size: A4 ${orientation === 'landscape' ? 'landscape' : 'portrait'}; margin: 12mm; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a; margin: 0; padding: 0; background: #fff; box-sizing: border-box; font-size: 13px; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #0284c7; padding-bottom: 14px; margin-bottom: 20px; }
          .brand-title { font-size: 20px; font-weight: 900; color: #0f172a; margin: 0; text-transform: uppercase; letter-spacing: 0.5px; }
          .brand-sub { font-size: 11px; font-weight: 700; color: #0284c7; margin-top: 4px; }
          .brand-contact { font-size: 11px; color: #475569; margin-top: 3px; font-weight: 500; }
          .doc-type { text-align: right; }
          .doc-title { font-size: 16px; font-weight: 900; color: #0369a1; text-transform: uppercase; margin: 0; }
          .doc-date { font-size: 11px; color: #64748b; font-weight: 600; margin-top: 4px; }
          .info-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px 16px; margin-bottom: 20px; display: flex; flex-wrap: wrap; gap: 24px; justify-content: space-between; }
          .info-item { font-size: 12px; }
          .info-label { font-size: 10px; text-transform: uppercase; font-weight: 800; color: #64748b; letter-spacing: 0.5px; }
          .info-val { font-size: 14px; font-weight: 800; color: #0f172a; margin-top: 2px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 26px; page-break-inside: auto; }
          .report-table { table-layout: auto; }
          .report-table thead { display: table-header-group; }
          .report-table tr { page-break-inside: avoid; }
           .report-table th, .report-table td { page-break-inside: avoid; overflow-wrap: break-word; word-break: normal; }
          .report-section { page-break-before: auto; margin-top: 30px; }
          .report-section h3 { color: #0369a1; font-size: 15px; margin: 0 0 10px; padding: 8px 10px; border-left: 4px solid #0284c7; background: #f0f9ff; page-break-after: avoid; }
          .empty-cell { text-align: center; padding: 18px; color: #94a3b8; font-size: 12px; }
          .summary-container { display: flex; justify-content: flex-end; margin-top: 15px; }
          .summary-card { width: 300px; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 10px; padding: 12px 16px; }
          .footer { margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 14px; text-align: center; font-size: 10px; color: #94a3b8; font-weight: 600; }
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1 class="brand-title">🚜 LOGANATHAN EARTH MOVERS</h1>
            <div class="brand-sub">JCB Rental • Earthmoving Services • Material Dispatch (Bricks, Sand, Jalli, Water)</div>
            <div class="brand-contact">Katpadi Main Road, Vellore, Tamil Nadu • Phone: +91 9876543210</div>
          </div>
          <div class="doc-type">
             <h2 class="doc-title">${escapeHtml(title)}</h2>
            <div class="doc-date">Generated: ${dateStr}</div>
          </div>
        </div>

        ${
          customerName || phone || address || subtitle
            ? `
          <div class="info-box">
            ${
              customerName
                ? `
              <div>
                <div class="info-label">${title.includes('SUPPLIER') ? 'Supplier Name' : 'Customer Name'}</div>
                <div class="info-val">${escapeHtml(customerName)}</div>
              </div>
            `
                : ''
            }
            ${
              phone
                ? `
              <div>
                <div class="info-label">Mobile Number</div>
                <div class="info-val">${escapeHtml(phone)}</div>
              </div>
            `
                : ''
            }
            ${
              address
                ? `
              <div>
                <div class="info-label">Address / Location</div>
                <div class="info-val">${escapeHtml(address)}</div>
              </div>
            `
                : ''
            }
            ${
              subtitle
                ? `
              <div>
                <div class="info-label">Filter / Scope</div>
                <div class="info-val">${escapeHtml(subtitle)}</div>
              </div>
            `
                : ''
            }
          </div>
        `
            : ''
        }

        ${columns.length ? renderTable({ columns, data }) : ''}

        ${sections.map((section) => `
          <section class="report-section">
            <h3>${escapeHtml(section.title)}</h3>
            ${renderTable(section)}
          </section>
        `).join('')}

        ${
          summary.length > 0
            ? `
          <div class="summary-container">
            <div class="summary-card">
              ${summaryHtml}
            </div>
          </div>
        `
            : ''
        }

        <div class="footer">
          Computer Generated Official Statement • Loganathan Earth Movers & Operations Management
        </div>

      </body>
    </html>
  `;

  const printFrame = document.createElement('iframe');
  printFrame.setAttribute('title', 'PDF export');
  printFrame.style.position = 'fixed';
  printFrame.style.right = '0';
  printFrame.style.bottom = '0';
  printFrame.style.width = '0';
  printFrame.style.height = '0';
  printFrame.style.border = '0';
  printFrame.style.visibility = 'hidden';
  document.body.appendChild(printFrame);

  const cleanup = () => {
    printFrame.remove();
  };
  printFrame.onload = () => {
    const printWindow = printFrame.contentWindow;
    if (!printWindow) {
      cleanup();
      return;
    }
    printWindow.addEventListener('afterprint', cleanup, { once: true });
    window.setTimeout(() => {
      printWindow.focus();
      printWindow.print();
      window.setTimeout(cleanup, 1000);
    }, 300);
  };

  const printDocument = printFrame.contentDocument;
  printDocument.open();
  printDocument.write(htmlContent);
  printDocument.close();
};

/**
 * Business PDF Statement Downloader
 */
export const exportBusinessStatementPdf = ({ title, businessName, transactions = [], metrics = {}, action = 'save' }) => {
  const dateStr = new Date().toISOString().split('T')[0];
  const totalSales = metrics.totalIncome !== undefined
    ? metrics.totalIncome
    : transactions.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  const totalPaid = metrics.totalPaid !== undefined
    ? metrics.totalPaid
    : transactions.reduce((sum, t) => sum + (Number(t.paid) || 0), 0);
  const totalDue = metrics.totalOutstanding !== undefined
    ? metrics.totalOutstanding
    : Math.max(0, totalSales - totalPaid);

  exportToPdf({
    title: `${title || businessName || 'BUSINESS'} STATEMENT`,
    subtitle: `Total Deliveries / Sales: ${transactions.length} | Total Business: ${formatCurrency(totalSales)}`,
    filename: `${(title || businessName || 'Business').replace(/\s+/g, '_')}_Statement_${dateStr}.pdf`,
    action,
    columns: [
      { header: 'Date', key: 'displayDate' },
      { header: 'Customer Name', key: 'customerName', bold: true },
      { header: 'Phone', key: 'phone' },
      { header: 'Service / Item', key: 'itemService' },
      { header: 'Bill Amount', key: 'formattedAmount', align: 'right', bold: true },
      { header: 'Amount Paid', key: 'formattedPaid', align: 'right', color: '#15803d', bold: true },
      { header: 'Remaining Due', key: 'formattedDue', align: 'right', color: '#b91c1c', bold: true }
    ],
    data: transactions.map((t) => {
      const baseItem = t.itemService || t.description || 'Delivery';
      const supplier = t.outsourcedSupplier || t.supplierName;
      const itemService = (t.isOutsourced && supplier)
        ? `${baseItem}\n(Outsourced from: ${supplier})`
        : baseItem;

      return {
        displayDate: t.displayDate || t.date || 'N/A',
        customerName: t.customerName || 'N/A',
        phone: t.phone || 'N/A',
        itemService,
        formattedAmount: formatCurrency(t.amount || 0),
        formattedPaid: `+${formatCurrency(t.paid || 0)}`,
        formattedDue: formatCurrency(t.due || 0)
      };
    }),
    summary: [
      { label: 'Total Business Sales', value: formatCurrency(totalSales) },
      { label: 'Total Amount Received / Paid', value: formatCurrency(totalPaid), color: '#15803d' },
      { label: 'Net Outstanding Balance Due', value: formatCurrency(totalDue), color: '#b91c1c' }
    ]
  });
};
