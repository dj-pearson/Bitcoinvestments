/**
 * Excel (.xlsx) writer
 *
 * Thin adapter over `write-excel-file`, which replaced SheetJS (`xlsx`).
 * SheetJS's npm releases carry two unfixed high-severity advisories
 * (GHSA-4r6h-8v6p-xvw6 prototype pollution, GHSA-5pgg-2g8v-p4x9 ReDoS) and the
 * project no longer publishes fixes to the npm registry. Both advisories are
 * parser-side and this app only ever wrote spreadsheets, so nothing was
 * exploitable — but the dependency would have become dangerous the moment an
 * import feature landed, and it kept `npm audit` permanently red.
 *
 * The adapter keeps the old SheetJS-shaped call sites intact: callers still
 * hand over an array of plain row objects per sheet and get a Blob back.
 */

import type { Row, SheetData } from 'write-excel-file/browser';

/** A value we know how to put in a cell. Anything else is stringified. */
type CellValue = string | number | boolean | Date | null | undefined;

export interface ExcelSheet {
  /** Tab name shown in Excel. */
  name: string;
  /**
   * Rows as plain objects. Column order and headers are taken from the keys,
   * in first-seen order across all rows — matching how `XLSX.utils.json_to_sheet`
   * behaved, so existing row builders did not have to change.
   */
  rows: Array<Record<string, CellValue>>;
  /** Optional per-column widths, in characters, positionally matching the headers. */
  columnWidths?: number[];
}

/** MIME type for .xlsx, used for the download Blob. */
export const XLSX_MIME =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

/**
 * Collect column headers across every row, preserving first-seen order.
 * Rows in this codebase are built from object literals so they are uniform,
 * but a totals row can legitimately omit keys.
 */
function collectHeaders(rows: Array<Record<string, CellValue>>): string[] {
  const headers: string[] = [];
  const seen = new Set<string>();
  for (const row of rows) {
    for (const key of Object.keys(row)) {
      if (!seen.has(key)) {
        seen.add(key);
        headers.push(key);
      }
    }
  }
  return headers;
}

/**
 * Coerce one value into a cell. Numbers, booleans and dates keep their type so
 * Excel can sort and format them; everything else becomes text. `null` and
 * `undefined` become an empty cell rather than the string "null".
 */
function toCell(value: CellValue) {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value === 'number') {
    // Excel has no representation for NaN/Infinity — write those as text so the
    // file stays valid rather than silently corrupting the cell.
    return Number.isFinite(value)
      ? { value, type: Number }
      : { value: String(value), type: String };
  }
  if (typeof value === 'boolean') {
    return { value, type: Boolean };
  }
  if (value instanceof Date) {
    return { value, type: Date, format: 'mm/dd/yyyy' };
  }
  return { value: String(value), type: String };
}

/** Build the header + body matrix for a single sheet. */
function toSheetData(sheet: ExcelSheet): SheetData {
  const headers = collectHeaders(sheet.rows);

  const headerRow: Row = headers.map((header) => ({
    value: header,
    type: String,
    fontWeight: 'bold' as const,
  }));

  const bodyRows: Row[] = sheet.rows.map((row) =>
    headers.map((header) => toCell(row[header]))
  );

  return [headerRow, ...bodyRows];
}

/**
 * Write one or more sheets to an .xlsx Blob.
 *
 * Sheets with no rows are skipped: Excel rejects a workbook with zero sheets,
 * so an all-empty input yields a single empty sheet rather than an invalid file.
 */
export async function writeWorkbook(sheets: ExcelSheet[]): Promise<Blob> {
  // Loaded on demand — this keeps the Excel writer out of the main bundle, the
  // same reason the previous implementation dynamically imported SheetJS.
  const { default: writeXlsxFile } = await import('write-excel-file/browser');

  const populated = sheets.filter((sheet) => sheet.rows.length > 0);
  const effective: ExcelSheet[] = populated.length > 0
    ? populated
    : [{ name: sheets[0]?.name || 'Sheet1', rows: [] }];

  return writeXlsxFile(
    effective.map((sheet) => ({
      data: toSheetData(sheet),
      sheet: sheet.name,
      columns: sheet.columnWidths?.map((width) => ({ width })),
    }))
  ).toBlob();
}
