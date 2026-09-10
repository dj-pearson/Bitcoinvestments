/**
 * Holding period classification.
 *
 * Shared because this test was previously reimplemented in three places
 * (calculateCapitalGainsTax, findTaxLossHarvestingOpportunities and the tax
 * report generator) and all three carried the same defect. Fixing one left the
 * others wrong, and the report generator feeds numbers users file from.
 */

/**
 * Classify a disposal as short- or long-term under the IRS holding-period rule.
 *
 * The test is calendar-based, not a day count. A gain is long-term only when the
 * asset was held MORE than one year, so a sale on the one-year anniversary is
 * still short-term and the qualifying sale is one year and a day after
 * acquisition.
 *
 * Counting days and comparing against 365 gets this wrong whenever the holding
 * period spans a leap day: buy 2024-01-01 and sell 2025-01-01 is 366 calendar
 * days but exactly one year, and was classified long-term a day early. For a
 * filer in the 37% bracket that roughly halves the tax reported on the gain.
 *
 * Comparing against the anniversary handles leap years without special cases. A
 * Feb 29 purchase rolls to Mar 1 in a non-leap year, which is the date the IRS
 * uses as well.
 *
 * @param acquiredDate - When the asset was acquired.
 * @param disposedDate - When it was sold or otherwise disposed of.
 * @returns 'long_term' only if held strictly more than one year.
 */
export function classifyHoldingPeriod(
  acquiredDate: Date,
  disposedDate: Date
): 'short_term' | 'long_term' {
  const oneYearAfterAcquisition = new Date(acquiredDate);
  oneYearAfterAcquisition.setFullYear(oneYearAfterAcquisition.getFullYear() + 1);

  return disposedDate.getTime() > oneYearAfterAcquisition.getTime()
    ? 'long_term'
    : 'short_term';
}
