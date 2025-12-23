/**
 * Monthly Performance Report Service
 *
 * Generates auto-monthly PDF reports for premium subscribers including:
 * - Portfolio performance summary
 * - Market analysis and trends
 * - Personalized insights and recommendations
 * - Historical performance charts data
 *
 * Delivered via email at the start of each month.
 */

import type { Portfolio } from '../types';
import { sendEmail } from './email';
import { hasMonthlyPerformanceReport } from './subscriptionLimits';

// ==================== Types ====================

export interface MonthlyReportData {
  portfolio: Portfolio;
  reportMonth: Date;
  marketData?: MarketSummary;
  insights?: PersonalizedInsights;
}

export interface MarketSummary {
  btcChange: number;
  ethChange: number;
  totalMarketCap: number;
  marketCapChange: number;
  topGainers: { symbol: string; name: string; change: number }[];
  topLosers: { symbol: string; name: string; change: number }[];
  dominance: { btc: number; eth: number; other: number };
}

export interface PersonalizedInsights {
  diversificationScore: number; // 0-100
  riskLevel: 'low' | 'medium' | 'high';
  recommendations: string[];
  achievements: string[];
  alerts: string[];
}

export interface MonthlyReportResult {
  success: boolean;
  pdfBlob?: Blob;
  filename?: string;
  error?: string;
}

// ==================== Report Generation ====================

/**
 * Generate monthly performance report PDF
 */
export async function generateMonthlyReport(
  data: MonthlyReportData
): Promise<MonthlyReportResult> {
  try {
    const { jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');

    const doc = new jsPDF();
    const { portfolio, reportMonth, marketData, insights } = data;

    const monthName = reportMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    // Header
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('Monthly Performance Report', 105, 20, { align: 'center' });

    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.text(monthName, 105, 28, { align: 'center' });

    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 105, 35, { align: 'center' });

    let yPos = 50;

    // Portfolio Summary Section
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Portfolio Summary', 14, yPos);
    yPos += 10;

    const summaryData = [
      ['Total Value', formatCurrency(portfolio.total_value_usd)],
      ['Cost Basis', formatCurrency(portfolio.total_cost_basis)],
      ['Total Return', formatCurrency(portfolio.total_profit_loss)],
      ['Return %', `${portfolio.total_profit_loss >= 0 ? '+' : ''}${portfolio.total_profit_loss_percentage.toFixed(2)}%`],
      ['Holdings Count', portfolio.holdings.length.toString()],
    ];

    autoTable(doc, {
      startY: yPos,
      head: [['Metric', 'Value']],
      body: summaryData,
      theme: 'grid',
      headStyles: { fillColor: [249, 115, 22] }, // Orange
      styles: { fontSize: 10 },
      columnStyles: {
        0: { cellWidth: 60 },
        1: { cellWidth: 50, halign: 'right' },
      },
      margin: { left: 14, right: 120 },
    });

    yPos = (doc as any).lastAutoTable.finalY + 15;

    // Holdings Performance
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Holdings Performance', 14, yPos);
    yPos += 10;

    const holdingsData = portfolio.holdings.map(h => [
      h.symbol,
      truncateText(h.name, 18),
      formatCurrency(h.current_value),
      `${h.profit_loss >= 0 ? '+' : ''}${h.profit_loss_percentage.toFixed(2)}%`,
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['Symbol', 'Name', 'Value', 'Return']],
      body: holdingsData.slice(0, 10), // Show top 10
      theme: 'striped',
      headStyles: { fillColor: [51, 51, 51] },
      styles: { fontSize: 9 },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 50 },
        2: { cellWidth: 35, halign: 'right' },
        3: { cellWidth: 30, halign: 'right' },
      },
    });

    if (portfolio.holdings.length > 10) {
      yPos = (doc as any).lastAutoTable.finalY + 3;
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.text(`Showing top 10 of ${portfolio.holdings.length} holdings.`, 14, yPos);
    }

    yPos = (doc as any).lastAutoTable.finalY + 15;

    // Market Summary (if available)
    if (marketData) {
      if (yPos > 200) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Market Summary', 14, yPos);
      yPos += 10;

      const marketDataRows = [
        ['Bitcoin (BTC)', `${marketData.btcChange >= 0 ? '+' : ''}${marketData.btcChange.toFixed(2)}%`],
        ['Ethereum (ETH)', `${marketData.ethChange >= 0 ? '+' : ''}${marketData.ethChange.toFixed(2)}%`],
        ['Total Market Cap', formatCurrency(marketData.totalMarketCap)],
        ['Market Cap Change', `${marketData.marketCapChange >= 0 ? '+' : ''}${marketData.marketCapChange.toFixed(2)}%`],
      ];

      autoTable(doc, {
        startY: yPos,
        head: [['Indicator', 'Monthly Change']],
        body: marketDataRows,
        theme: 'grid',
        headStyles: { fillColor: [51, 51, 51] },
        styles: { fontSize: 10 },
        margin: { left: 14, right: 120 },
      });

      yPos = (doc as any).lastAutoTable.finalY + 15;
    }

    // Personalized Insights (if available)
    if (insights) {
      if (yPos > 200) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Personalized Insights', 14, yPos);
      yPos += 10;

      // Diversification Score
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`Diversification Score: ${insights.diversificationScore}/100`, 14, yPos);
      yPos += 6;
      doc.text(`Risk Level: ${insights.riskLevel.charAt(0).toUpperCase() + insights.riskLevel.slice(1)}`, 14, yPos);
      yPos += 10;

      // Recommendations
      if (insights.recommendations.length > 0) {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Recommendations:', 14, yPos);
        yPos += 6;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        for (const rec of insights.recommendations.slice(0, 3)) {
          doc.text(`• ${rec}`, 18, yPos);
          yPos += 5;
        }
        yPos += 5;
      }

      // Achievements
      if (insights.achievements.length > 0) {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Achievements This Month:', 14, yPos);
        yPos += 6;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        for (const ach of insights.achievements.slice(0, 3)) {
          doc.text(`🏆 ${ach}`, 18, yPos);
          yPos += 5;
        }
      }
    }

    // Allocation Chart Data (for reference)
    if (yPos < 240) {
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Portfolio Allocation', 14, yPos + 10);

      const allocationData = portfolio.holdings
        .map(h => [
          h.symbol,
          formatCurrency(h.current_value),
          portfolio.total_value_usd > 0
            ? `${((h.current_value / portfolio.total_value_usd) * 100).toFixed(1)}%`
            : '0%',
        ])
        .sort((a, b) => parseFloat(b[2]) - parseFloat(a[2]))
        .slice(0, 8);

      autoTable(doc, {
        startY: yPos + 15,
        head: [['Asset', 'Value', 'Allocation']],
        body: allocationData,
        theme: 'striped',
        headStyles: { fillColor: [51, 51, 51] },
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
        'This report is for informational purposes only. Past performance does not guarantee future results.',
        105,
        285,
        { align: 'center' }
      );
      doc.text(`Page ${i} of ${pageCount}`, 195, 285, { align: 'right' });
      doc.text('Bitcoin Investments Premium', 14, 285);
    }

    const pdfBlob = doc.output('blob');
    const filename = `Monthly_Report_${monthName.replace(' ', '_')}.pdf`;

    return {
      success: true,
      pdfBlob,
      filename,
    };
  } catch (error) {
    console.error('Error generating monthly report:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate report',
    };
  }
}

/**
 * Generate insights based on portfolio data
 */
export function generatePortfolioInsights(portfolio: Portfolio): PersonalizedInsights {
  const recommendations: string[] = [];
  const achievements: string[] = [];
  const alerts: string[] = [];

  // Calculate diversification score
  const holdingsCount = portfolio.holdings.length;
  let diversificationScore = Math.min(100, holdingsCount * 10);

  // Check if any single holding is > 50% of portfolio
  const maxAllocation = Math.max(
    ...portfolio.holdings.map(h =>
      portfolio.total_value_usd > 0 ? (h.current_value / portfolio.total_value_usd) * 100 : 0
    )
  );

  if (maxAllocation > 50) {
    diversificationScore = Math.max(20, diversificationScore - 30);
    recommendations.push(`Consider diversifying - one asset represents ${maxAllocation.toFixed(0)}% of your portfolio`);
  }

  // Risk level based on portfolio composition
  let riskLevel: 'low' | 'medium' | 'high' = 'medium';
  const hasBtc = portfolio.holdings.some(h => h.symbol === 'BTC');
  const hasEth = portfolio.holdings.some(h => h.symbol === 'ETH');
  const altcoinsPercentage = portfolio.holdings
    .filter(h => h.symbol !== 'BTC' && h.symbol !== 'ETH')
    .reduce((sum, h) => sum + (portfolio.total_value_usd > 0 ? (h.current_value / portfolio.total_value_usd) * 100 : 0), 0);

  if (altcoinsPercentage > 70) {
    riskLevel = 'high';
    recommendations.push('High altcoin exposure - consider adding Bitcoin or Ethereum for stability');
  } else if (hasBtc && hasEth && altcoinsPercentage < 30) {
    riskLevel = 'low';
  }

  // Achievements
  if (portfolio.total_profit_loss > 0) {
    achievements.push(`Portfolio is in profit: ${formatCurrency(portfolio.total_profit_loss)}`);
  }

  if (holdingsCount >= 5) {
    achievements.push('Diversified portfolio with 5+ assets');
  }

  if (portfolio.total_profit_loss_percentage > 10) {
    achievements.push(`Outstanding returns: +${portfolio.total_profit_loss_percentage.toFixed(1)}%`);
  }

  // Alerts for underperformers
  const underperformers = portfolio.holdings.filter(h => h.profit_loss_percentage < -20);
  if (underperformers.length > 0) {
    alerts.push(`${underperformers.length} holding(s) down more than 20% - review your positions`);
  }

  return {
    diversificationScore: Math.round(diversificationScore),
    riskLevel,
    recommendations,
    achievements,
    alerts,
  };
}

/**
 * Send monthly performance report via email
 */
export async function sendMonthlyReportEmail(
  email: string,
  reportMonth: Date,
  _pdfBlob: Blob // Future: convert to base64 for email attachment
): Promise<{ success: boolean; error?: string }> {
  const monthName = reportMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // Note: For actual PDF attachment, we'd need to convert blob to base64
  // and use an email service that supports attachments
  // For now, we send a notification email with a link to download

  const subject = `📊 Your ${monthName} Portfolio Performance Report`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Monthly Performance Report</title>
</head>
<body style="margin: 0; padding: 0; font-family: sans-serif; background-color: #0f1419;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #1a1f2e; border-radius: 12px;">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #f97316 0%, #fb923c 100%); padding: 40px 30px; text-align: center; border-radius: 12px 12px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px;">
                📊 Monthly Performance Report
              </h1>
              <p style="margin: 10px 0 0; color: #ffffff; opacity: 0.9; font-size: 16px;">
                ${monthName}
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px; color: #d1d5db; font-size: 16px; line-height: 1.6;">
                Your monthly portfolio performance report is ready! This report includes:
              </p>

              <ul style="margin: 0 0 30px; padding: 0 0 0 20px; color: #9ca3af; font-size: 15px; line-height: 2;">
                <li>Complete portfolio performance summary</li>
                <li>Individual asset performance breakdown</li>
                <li>Market trends and analysis</li>
                <li>Personalized insights and recommendations</li>
                <li>Portfolio allocation overview</li>
              </ul>

              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 30px;">
                <tr>
                  <td align="center">
                    <a href="https://bitcoininvestments.com/profile#reports" style="display: inline-block; padding: 14px 32px; background-color: #f97316; color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600;">
                      View & Download Report →
                    </a>
                  </td>
                </tr>
              </table>

              <div style="background-color: #111827; border-radius: 8px; padding: 20px; margin: 0 0 30px;">
                <h3 style="margin: 0 0 12px; color: #ffffff; font-size: 16px;">
                  💡 Pro Tip
                </h3>
                <p style="margin: 0; color: #9ca3af; font-size: 14px; line-height: 1.6;">
                  Review your monthly reports to track your progress over time. Consistent monitoring helps you make better investment decisions.
                </p>
              </div>

              <p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                Thank you for being a Premium member! Your support helps us build better tools for crypto investors.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #111827; padding: 30px; text-align: center; border-radius: 0 0 12px 12px;">
              <p style="margin: 0 0 12px; color: #6b7280; font-size: 13px;">
                Bitcoin Investments Premium
              </p>
              <p style="margin: 0; color: #6b7280; font-size: 12px;">
                <a href="https://bitcoininvestments.com/profile#preferences" style="color: #9ca3af; text-decoration: underline;">Manage Report Preferences</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  return sendEmail({ to: email, subject, html });
}

/**
 * Check if user is eligible for monthly reports and generate if due
 */
export async function processMonthlyReportForUser(
  _userId: string, // Future: store report history per user
  email: string,
  subscriptionStatus: string,
  subscriptionExpiresAt: string | null,
  portfolio: Portfolio
): Promise<{ sent: boolean; error?: string }> {
  // Check if user has access to monthly reports
  if (!hasMonthlyPerformanceReport(subscriptionStatus as any, subscriptionExpiresAt)) {
    return { sent: false, error: 'Monthly reports require premium subscription' };
  }

  // Generate the report
  const reportMonth = new Date();
  reportMonth.setMonth(reportMonth.getMonth() - 1); // Previous month

  const insights = generatePortfolioInsights(portfolio);

  const reportResult = await generateMonthlyReport({
    portfolio,
    reportMonth,
    insights,
  });

  if (!reportResult.success || !reportResult.pdfBlob) {
    return { sent: false, error: reportResult.error || 'Failed to generate report' };
  }

  // Send email notification
  const emailResult = await sendMonthlyReportEmail(email, reportMonth, reportResult.pdfBlob);

  return { sent: emailResult.success, error: emailResult.error };
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

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}
