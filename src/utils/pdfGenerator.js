import { formatCurrency } from './formatCurrency';

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
  summary = []
}) => {
  const dateStr = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow pop-ups to download PDF statement');
    return;
  }

  const columnsHtml = columns
    .map(
      (col) =>
        `<th style="padding: 10px 12px; border-bottom: 2px solid #cbd5e1; text-align: ${
          col.align || 'left'
        }; font-size: 11px; font-weight: 800; color: #334155; text-transform: uppercase;">${
          col.header
        }</th>`
    )
    .join('');

  const rowsHtml = data
    .map((row, idx) => {
      const bg = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
      const cells = columns
        .map((col) => {
          const val = row[col.key] !== undefined && row[col.key] !== null ? row[col.key] : '';
          return `<td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 12px; text-align: ${
            col.align || 'left'
          }; font-weight: ${col.bold ? '700' : '500'}; color: ${col.color || '#1e293b'};">${val}</td>`;
        })
        .join('');
      return `<tr style="background-color: ${bg};">${cells}</tr>`;
    })
    .join('');

  const summaryHtml = summary
    .map(
      (s) => `
    <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #f1f5f9;">
      <span style="font-size: 12px; font-weight: 700; color: #64748b;">${s.label}:</span>
      <span style="font-size: 14px; font-weight: 900; color: ${s.color || '#0f172a'};">${s.value}</span>
    </div>
  `
    )
    .join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title} - ${customerName || filename}</title>
        <meta charset="utf-8" />
        <style>
          @page { size: A4; margin: 0; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a; margin: 0; padding: 15mm 15mm; background: #fff; box-sizing: border-box; }
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
          table { width: 100%; border-collapse: collapse; margin-bottom: 25px; }
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
            <h2 class="doc-title">${title}</h2>
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
                <div class="info-val">${customerName}</div>
              </div>
            `
                : ''
            }
            ${
              phone
                ? `
              <div>
                <div class="info-label">Mobile Number</div>
                <div class="info-val">${phone}</div>
              </div>
            `
                : ''
            }
            ${
              address
                ? `
              <div>
                <div class="info-label">Address / Location</div>
                <div class="info-val">${address}</div>
              </div>
            `
                : ''
            }
            ${
              subtitle
                ? `
              <div>
                <div class="info-label">Filter / Scope</div>
                <div class="info-val">${subtitle}</div>
              </div>
            `
                : ''
            }
          </div>
        `
            : ''
        }

        <table>
          <thead>
            <tr>${columnsHtml}</tr>
          </thead>
          <tbody>
            ${rowsHtml.length > 0 ? rowsHtml : `<tr><td colspan="${columns.length}" style="text-align: center; padding: 20px; color: #94a3b8;">No entries found</td></tr>`}
          </tbody>
        </table>

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

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          };
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
};

/**
 * Business PDF Statement Downloader
 */
export const exportBusinessStatementPdf = ({ title, businessName, transactions = [], metrics = {} }) => {
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
    columns: [
      { header: 'Date', key: 'displayDate' },
      { header: 'Customer Name', key: 'customerName', bold: true },
      { header: 'Phone', key: 'phone' },
      { header: 'Service / Item', key: 'itemService' },
      { header: 'Bill Amount', key: 'formattedAmount', align: 'right', bold: true },
      { header: 'Amount Paid', key: 'formattedPaid', align: 'right', color: '#15803d', bold: true },
      { header: 'Remaining Due', key: 'formattedDue', align: 'right', color: '#b91c1c', bold: true }
    ],
    data: transactions.map((t) => ({
      displayDate: t.displayDate || t.date || 'N/A',
      customerName: t.customerName || 'N/A',
      phone: t.phone || 'N/A',
      itemService: t.itemService || t.description || 'Delivery',
      formattedAmount: formatCurrency(t.amount || 0),
      formattedPaid: `+${formatCurrency(t.paid || 0)}`,
      formattedDue: formatCurrency(t.due || 0)
    })),
    summary: [
      { label: 'Total Business Sales', value: formatCurrency(totalSales) },
      { label: 'Total Amount Received / Paid', value: formatCurrency(totalPaid), color: '#15803d' },
      { label: 'Net Outstanding Balance Due', value: formatCurrency(totalDue), color: '#b91c1c' }
    ]
  });
};
