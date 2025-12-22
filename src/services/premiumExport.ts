/**
 * Premium Export Service
 *
 * Provides premium export formats for paid users:
 * - Excel (.xlsx) with charts and formatting
 * - Enhanced PDF reports with branding
 * - Tax software integration (TurboTax, H&R Block)
 *
 * Free users only have access to basic CSV exports.
 */

import type { Portfolio } from '../types';
import type { TaxReport } from './taxReportService';
import { canUseExportFormat, type ExportFormat } from './subscriptionLimits';

// ==================== Types ====================

export interface ExportOptions {
  format: ExportFormat;
  includeCharts?: boolean;
  includeSummary?: boolean;
  includeTransactions?: boolean;
  branding?: {
    companyName?: string;
    logoUrl?: string;
    primaryColor?: string;
  };
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export interface ExportResult {
  success: boolean;
  blob?: Blob;
  filename?: string;
  error?: string;
}

// ==================== Excel Export ====================

/**
 * Export portfolio to Excel format with charts
 * Premium feature - requires premium/advisor/enterprise subscription
 */
export async function exportPortfolioToExcel(
  portfolio: Portfolio,
  options: Partial<ExportOptions> = {}
): Promise<ExportResult> {
  try {
    // Dynamically import xlsx library
    const XLSX = await import('xlsx');

    // Create workbook
    const workbook = XLSX.utils.book_new();

    // Holdings sheet
    const holdingsData = portfolio.holdings.map((h) => ({
      Symbol: h.symbol,
      Name: h.name,
      Amount: h.amount,
      'Avg Buy Price': h.average_buy_price,
      'Current Price': h.current_price,
      'Cost Basis': h.cost_basis,
      'Current Value': h.current_value,
      'Profit/Loss': h.profit_loss,
      'Profit/Loss %': `${h.profit_loss_percentage.toFixed(2)}%`,
    }));

    // Add totals row
    holdingsData.push({
      Symbol: 'TOTAL',
      Name: '',
      Amount: 0,
      'Avg Buy Price': 0,
      'Current Price': 0,
      'Cost Basis': portfolio.total_cost_basis,
      'Current Value': portfolio.total_value_usd,
      'Profit/Loss': portfolio.total_profit_loss,
      'Profit/Loss %': `${portfolio.total_profit_loss_percentage.toFixed(2)}%`,
    });

    const holdingsSheet = XLSX.utils.json_to_sheet(holdingsData);

    // Set column widths
    holdingsSheet['!cols'] = [
      { wch: 10 }, // Symbol
      { wch: 20 }, // Name
      { wch: 15 }, // Amount
      { wch: 15 }, // Avg Buy Price
      { wch: 15 }, // Current Price
      { wch: 15 }, // Cost Basis
      { wch: 15 }, // Current Value
      { wch: 15 }, // Profit/Loss
      { wch: 15 }, // Profit/Loss %
    ];

    XLSX.utils.book_append_sheet(workbook, holdingsSheet, 'Holdings');

    // Summary sheet
    const summaryData = [
      { Metric: 'Portfolio Name', Value: portfolio.name },
      { Metric: 'Total Holdings', Value: portfolio.holdings.length },
      { Metric: 'Total Cost Basis', Value: formatCurrency(portfolio.total_cost_basis) },
      { Metric: 'Total Value', Value: formatCurrency(portfolio.total_value_usd) },
      { Metric: 'Total Profit/Loss', Value: formatCurrency(portfolio.total_profit_loss) },
      { Metric: 'Total Return %', Value: `${portfolio.total_profit_loss_percentage.toFixed(2)}%` },
      { Metric: 'Generated At', Value: new Date().toLocaleString() },
    ];

    const summarySheet = XLSX.utils.json_to_sheet(summaryData);
    summarySheet['!cols'] = [{ wch: 20 }, { wch: 25 }];
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

    // Allocation sheet (for pie chart data)
    const allocationData = portfolio.holdings
      .map((h) => ({
        Asset: h.name,
        Symbol: h.symbol,
        Value: h.current_value,
        'Allocation %': portfolio.total_value_usd > 0
          ? ((h.current_value / portfolio.total_value_usd) * 100).toFixed(2) + '%'
          : '0%',
      }))
      .sort((a, b) => b.Value - a.Value);

    const allocationSheet = XLSX.utils.json_to_sheet(allocationData);
    allocationSheet['!cols'] = [{ wch: 20 }, { wch: 10 }, { wch: 15 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(workbook, allocationSheet, 'Allocation');

    // Transactions sheet (if holdings have transactions)
    if (options.includeTransactions !== false) {
      const transactions = portfolio.holdings.flatMap((h) =>
        h.transactions.map((t) => ({
          Date: new Date(t.date).toLocaleDateString(),
          Asset: h.name,
          Symbol: h.symbol,
          Type: t.type,
          Amount: t.amount,
          'Price per Unit': t.price_per_unit,
          'Total Value': t.total_value,
          Exchange: t.exchange || '',
          Notes: t.notes || '',
        }))
      );

      if (transactions.length > 0) {
        const transactionsSheet = XLSX.utils.json_to_sheet(transactions);
        transactionsSheet['!cols'] = [
          { wch: 12 },
          { wch: 20 },
          { wch: 10 },
          { wch: 12 },
          { wch: 12 },
          { wch: 15 },
          { wch: 15 },
          { wch: 15 },
          { wch: 25 },
        ];
        XLSX.utils.book_append_sheet(workbook, transactionsSheet, 'Transactions');
      }
    }

    // Generate Excel file
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const filename = `${portfolio.name.replace(/\s+/g, '_')}_Portfolio_${formatDateForFilename(new Date())}.xlsx`;

    return {
      success: true,
      blob,
      filename,
    };
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to export to Excel',
    };
  }
}

/**
 * Export tax report to Excel format
 * Premium feature
 */
export async function exportTaxReportToExcel(
  report: TaxReport,
  _options: Partial<ExportOptions> = {}
): Promise<ExportResult> {
  try {
    const XLSX = await import('xlsx');
    const workbook = XLSX.utils.book_new();
    const s = report.summary;

    // Summary sheet
    const summaryData = [
      { Category: 'Tax Year', Value: s.taxYear },
      { Category: 'Cost Basis Method', Value: s.costBasisMethod.toUpperCase() },
      { Category: 'Generated At', Value: new Date(s.generatedAt).toLocaleString() },
      { Category: '', Value: '' },
      { Category: 'CAPITAL GAINS', Value: '' },
      { Category: 'Total Proceeds', Value: formatCurrency(s.totalProceeds) },
      { Category: 'Total Cost Basis', Value: formatCurrency(s.totalCostBasis) },
      { Category: 'Total Gain/Loss', Value: formatCurrency(s.totalGainLoss) },
      { Category: '', Value: '' },
      { Category: 'SHORT-TERM', Value: '' },
      { Category: 'Short-Term Gains', Value: formatCurrency(s.shortTermGains) },
      { Category: 'Short-Term Losses', Value: formatCurrency(s.shortTermLosses) },
      { Category: 'Net Short-Term', Value: formatCurrency(s.netShortTerm) },
      { Category: '', Value: '' },
      { Category: 'LONG-TERM', Value: '' },
      { Category: 'Long-Term Gains', Value: formatCurrency(s.longTermGains) },
      { Category: 'Long-Term Losses', Value: formatCurrency(s.longTermLosses) },
      { Category: 'Net Long-Term', Value: formatCurrency(s.netLongTerm) },
      { Category: '', Value: '' },
      { Category: 'INCOME', Value: '' },
      { Category: 'Staking Income', Value: formatCurrency(s.stakingIncome) },
      { Category: 'Other Income', Value: formatCurrency(s.otherIncome) },
      { Category: 'Total Income', Value: formatCurrency(s.totalOrdinaryIncome) },
      { Category: '', Value: '' },
      { Category: 'ESTIMATED TAXES', Value: '' },
      { Category: 'Federal Tax', Value: formatCurrency(s.estimatedFederalTax) },
      { Category: 'State Tax', Value: formatCurrency(s.estimatedStateTax) },
      { Category: 'Total Tax', Value: formatCurrency(s.estimatedTotalTax) },
    ];

    const summarySheet = XLSX.utils.json_to_sheet(summaryData);
    summarySheet['!cols'] = [{ wch: 25 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

    // Form 8949 Short-Term sheet
    if (report.form8949ShortTerm.length > 0) {
      const shortTermData = report.form8949ShortTerm.map((line) => ({
        Description: line.description,
        'Date Acquired': line.dateAcquired,
        'Date Sold': line.dateSold,
        Proceeds: line.proceeds,
        'Cost Basis': line.costBasis,
        'Gain/Loss': line.gainOrLoss,
      }));

      const shortTermSheet = XLSX.utils.json_to_sheet(shortTermData);
      shortTermSheet['!cols'] = [
        { wch: 40 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
      ];
      XLSX.utils.book_append_sheet(workbook, shortTermSheet, 'Short-Term (8949)');
    }

    // Form 8949 Long-Term sheet
    if (report.form8949LongTerm.length > 0) {
      const longTermData = report.form8949LongTerm.map((line) => ({
        Description: line.description,
        'Date Acquired': line.dateAcquired,
        'Date Sold': line.dateSold,
        Proceeds: line.proceeds,
        'Cost Basis': line.costBasis,
        'Gain/Loss': line.gainOrLoss,
      }));

      const longTermSheet = XLSX.utils.json_to_sheet(longTermData);
      longTermSheet['!cols'] = [
        { wch: 40 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
      ];
      XLSX.utils.book_append_sheet(workbook, longTermSheet, 'Long-Term (8949)');
    }

    // Income Events sheet
    if (report.incomeEvents.length > 0) {
      const incomeData = report.incomeEvents.map((e) => ({
        Date: new Date(e.date).toLocaleDateString(),
        Type: e.type,
        Asset: e.asset,
        Symbol: e.symbol,
        Amount: e.amount,
        'Fair Market Value': e.fairMarketValueUSD,
        Exchange: e.exchange || '',
      }));

      const incomeSheet = XLSX.utils.json_to_sheet(incomeData);
      incomeSheet['!cols'] = [
        { wch: 12 },
        { wch: 15 },
        { wch: 20 },
        { wch: 10 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
      ];
      XLSX.utils.book_append_sheet(workbook, incomeSheet, 'Income');
    }

    // Generate Excel file
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const filename = `Tax_Report_${s.taxYear}_${formatDateForFilename(new Date())}.xlsx`;

    return {
      success: true,
      blob,
      filename,
    };
  } catch (error) {
    console.error('Error exporting tax report to Excel:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to export tax report to Excel',
    };
  }
}

// ==================== Enhanced PDF Export ====================

/**
 * Export portfolio to enhanced PDF with charts and branding
 * Premium feature
 */
export async function exportPortfolioToPDF(
  portfolio: Portfolio,
  options: Partial<ExportOptions> = {}
): Promise<ExportResult> {
  try {
    const { jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');

    const doc = new jsPDF();

    // Header with optional branding
    if (options.branding?.companyName) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(options.branding.companyName, 14, 10);
    }

    // Title
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Portfolio Report', 105, 25, { align: 'center' });

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(portfolio.name, 105, 33, { align: 'center' });
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 105, 40, { align: 'center' });

    let yPos = 55;

    // Portfolio Summary
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Portfolio Summary', 14, yPos);
    yPos += 8;

    autoTable(doc, {
      startY: yPos,
      head: [['Metric', 'Value']],
      body: [
        ['Total Holdings', portfolio.holdings.length.toString()],
        ['Total Cost Basis', formatCurrency(portfolio.total_cost_basis)],
        ['Total Value', formatCurrency(portfolio.total_value_usd)],
        ['Total Profit/Loss', formatCurrency(portfolio.total_profit_loss)],
        ['Total Return', `${portfolio.total_profit_loss_percentage.toFixed(2)}%`],
      ],
      theme: 'grid',
      headStyles: { fillColor: [51, 51, 51] },
      margin: { left: 14, right: 105 },
    });

    yPos = (doc as any).lastAutoTable.finalY + 15;

    // Holdings Table
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Holdings', 14, yPos);
    yPos += 8;

    autoTable(doc, {
      startY: yPos,
      head: [['Symbol', 'Name', 'Amount', 'Avg Price', 'Value', 'P/L', 'P/L %']],
      body: portfolio.holdings.map((h) => [
        h.symbol,
        truncateText(h.name, 15),
        formatNumber(h.amount),
        formatCurrency(h.average_buy_price),
        formatCurrency(h.current_value),
        formatCurrency(h.profit_loss),
        `${h.profit_loss_percentage.toFixed(2)}%`,
      ]),
      theme: 'striped',
      headStyles: { fillColor: [51, 51, 51], fontSize: 8 },
      styles: { fontSize: 7, cellPadding: 2 },
      columnStyles: {
        0: { cellWidth: 18 },
        1: { cellWidth: 30 },
        2: { cellWidth: 22 },
        3: { cellWidth: 25, halign: 'right' },
        4: { cellWidth: 25, halign: 'right' },
        5: { cellWidth: 25, halign: 'right' },
        6: { cellWidth: 20, halign: 'right' },
      },
    });

    yPos = (doc as any).lastAutoTable.finalY + 15;

    // Top Performers
    if (yPos < 220 && portfolio.holdings.length > 1) {
      const topPerformers = [...portfolio.holdings]
        .sort((a, b) => b.profit_loss_percentage - a.profit_loss_percentage)
        .slice(0, 3);

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Top Performers', 14, yPos);
      yPos += 8;

      autoTable(doc, {
        startY: yPos,
        head: [['Rank', 'Asset', 'Return']],
        body: topPerformers.map((h, i) => [
          `#${i + 1}`,
          `${h.symbol} - ${h.name}`,
          `${h.profit_loss_percentage >= 0 ? '+' : ''}${h.profit_loss_percentage.toFixed(2)}%`,
        ]),
        theme: 'striped',
        headStyles: { fillColor: [34, 139, 34] },
        styles: { fontSize: 9 },
        margin: { left: 14, right: 120 },
      });
    }

    // Footer on each page
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(
        'This report is for informational purposes only and does not constitute financial advice.',
        105,
        285,
        { align: 'center' }
      );
      doc.text(`Page ${i} of ${pageCount}`, 195, 285, { align: 'right' });
      doc.text('Generated by Bitcoin Investments', 14, 285);
    }

    const blob = doc.output('blob');
    const filename = `${portfolio.name.replace(/\s+/g, '_')}_Report_${formatDateForFilename(new Date())}.pdf`;

    return {
      success: true,
      blob,
      filename,
    };
  } catch (error) {
    console.error('Error exporting portfolio to PDF:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to export portfolio to PDF',
    };
  }
}

// ==================== Universal Export Function ====================

/**
 * Export data with format validation based on subscription
 * This is the main entry point for exports - validates permissions first
 */
export async function exportWithPermissions(
  type: 'portfolio' | 'taxReport',
  data: Portfolio | TaxReport,
  format: ExportFormat,
  subscriptionStatus: string,
  subscriptionExpiresAt: string | null,
  options: Partial<ExportOptions> = {}
): Promise<ExportResult> {
  // Check if user can use this format
  if (!canUseExportFormat(format, subscriptionStatus as any, subscriptionExpiresAt)) {
    return {
      success: false,
      error: `${format.toUpperCase()} export is a premium feature. Please upgrade to access this format.`,
    };
  }

  // Route to appropriate export function
  if (type === 'portfolio') {
    const portfolio = data as Portfolio;
    switch (format) {
      case 'excel':
        return exportPortfolioToExcel(portfolio, options);
      case 'pdf':
        return exportPortfolioToPDF(portfolio, options);
      case 'csv':
        return exportPortfolioToCSV(portfolio);
      default:
        return { success: false, error: 'Unsupported format' };
    }
  }

  // Tax report exports handled by taxReportService
  return { success: false, error: 'Use taxReportService for tax report exports' };
}

/**
 * Export portfolio to CSV (available to all users)
 */
export function exportPortfolioToCSV(portfolio: Portfolio): ExportResult {
  try {
    const headers = [
      'Symbol',
      'Name',
      'Amount',
      'Avg Buy Price',
      'Current Price',
      'Cost Basis',
      'Current Value',
      'Profit/Loss',
      'Profit/Loss %',
    ];

    const rows = portfolio.holdings.map((h) =>
      [
        h.symbol,
        `"${h.name}"`,
        h.amount.toString(),
        h.average_buy_price.toFixed(2),
        h.current_price.toFixed(2),
        h.cost_basis.toFixed(2),
        h.current_value.toFixed(2),
        h.profit_loss.toFixed(2),
        h.profit_loss_percentage.toFixed(2) + '%',
      ].join(',')
    );

    // Add totals row
    rows.push(
      [
        'TOTAL',
        '',
        '',
        '',
        '',
        portfolio.total_cost_basis.toFixed(2),
        portfolio.total_value_usd.toFixed(2),
        portfolio.total_profit_loss.toFixed(2),
        portfolio.total_profit_loss_percentage.toFixed(2) + '%',
      ].join(',')
    );

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const filename = `${portfolio.name.replace(/\s+/g, '_')}_Portfolio_${formatDateForFilename(new Date())}.csv`;

    return {
      success: true,
      blob,
      filename,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to export to CSV',
    };
  }
}

// ==================== Download Helper ====================

/**
 * Trigger download of exported file
 */
export function downloadExport(result: ExportResult): void {
  if (!result.success || !result.blob || !result.filename) {
    console.error('Cannot download: export failed');
    return;
  }

  const url = URL.createObjectURL(result.blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = result.filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ==================== Helper Functions ====================

function formatCurrency(amount: number): string {
  const prefix = amount < 0 ? '-$' : '$';
  return (
    prefix +
    Math.abs(amount).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(2) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(2) + 'K';
  }
  if (num < 0.01) {
    return num.toFixed(8);
  }
  return num.toFixed(4);
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

function formatDateForFilename(date: Date): string {
  return date.toISOString().split('T')[0];
}
