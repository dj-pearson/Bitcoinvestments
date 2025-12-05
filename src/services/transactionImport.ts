/**
 * Transaction Import Service
 *
 * Parses CSV exports from popular cryptocurrency exchanges and converts
 * them to our internal transaction format. Supports:
 * - Coinbase / Coinbase Pro
 * - Kraken
 * - Binance
 * - Gemini
 * - Generic CSV format
 */

import type { Transaction } from '../types';

// ==================== Types ====================

export interface ImportedTransaction {
  date: string;
  type: 'buy' | 'sell' | 'transfer_in' | 'transfer_out' | 'staking_reward';
  asset: string;
  symbol: string;
  amount: number;
  pricePerUnit: number;
  totalValue: number;
  fee?: number;
  feeCurrency?: string;
  exchange: string;
  notes?: string;
  txHash?: string;
}

export interface ImportResult {
  success: boolean;
  transactions: ImportedTransaction[];
  errors: string[];
  warnings: string[];
  exchangeDetected: string | null;
  totalImported: number;
  skipped: number;
}

export type ExchangeFormat = 'coinbase' | 'coinbase_pro' | 'kraken' | 'binance' | 'gemini' | 'generic' | 'unknown';

// ==================== Main Import Function ====================

/**
 * Parse a CSV file and import transactions
 */
export async function importTransactionsFromCSV(file: File): Promise<ImportResult> {
  const result: ImportResult = {
    success: false,
    transactions: [],
    errors: [],
    warnings: [],
    exchangeDetected: null,
    totalImported: 0,
    skipped: 0,
  };

  try {
    const content = await readFileAsText(file);
    const lines = parseCSV(content);

    if (lines.length < 2) {
      result.errors.push('CSV file is empty or has no data rows');
      return result;
    }

    const headers = lines[0];
    const format = detectExchangeFormat(headers);
    result.exchangeDetected = format;

    if (format === 'unknown') {
      result.warnings.push('Could not detect exchange format. Attempting generic import.');
    }

    // Parse based on detected format
    for (let i = 1; i < lines.length; i++) {
      const row = lines[i];
      if (row.length === 0 || (row.length === 1 && row[0] === '')) {
        continue; // Skip empty rows
      }

      try {
        const transaction = parseRow(row, headers, format);
        if (transaction) {
          result.transactions.push(transaction);
          result.totalImported++;
        } else {
          result.skipped++;
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        result.warnings.push(`Row ${i + 1}: ${message}`);
        result.skipped++;
      }
    }

    result.success = result.transactions.length > 0;
    if (!result.success && result.errors.length === 0) {
      result.errors.push('No valid transactions found in the file');
    }
  } catch (err) {
    result.errors.push(err instanceof Error ? err.message : 'Failed to read file');
  }

  return result;
}

// ==================== CSV Parsing ====================

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

function parseCSV(content: string): string[][] {
  const lines: string[][] = [];
  const rows = content.split(/\r?\n/);

  for (const row of rows) {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < row.length; i++) {
      const char = row[i];

      if (char === '"') {
        if (inQuotes && row[i + 1] === '"') {
          current += '"';
          i++; // Skip next quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    values.push(current.trim());
    lines.push(values);
  }

  return lines;
}

// ==================== Exchange Detection ====================

function detectExchangeFormat(headers: string[]): ExchangeFormat {
  const headerStr = headers.join(',').toLowerCase();

  // Coinbase
  if (headerStr.includes('timestamp') && headerStr.includes('transaction type') && headerStr.includes('asset')) {
    return 'coinbase';
  }

  // Coinbase Pro
  if (headerStr.includes('portfolio') && headerStr.includes('trade id') && headerStr.includes('product')) {
    return 'coinbase_pro';
  }

  // Kraken
  if (headerStr.includes('txid') && headerStr.includes('refid') && headerStr.includes('pair')) {
    return 'kraken';
  }

  // Binance
  if (headerStr.includes('utc_time') && headerStr.includes('operation') && headerStr.includes('coin')) {
    return 'binance';
  }

  // Gemini
  if (headerStr.includes('date') && headerStr.includes('type') && headerStr.includes('symbol') && headerStr.includes('specification')) {
    return 'gemini';
  }

  // Generic - check for common column names
  if (
    (headerStr.includes('date') || headerStr.includes('time')) &&
    (headerStr.includes('type') || headerStr.includes('side')) &&
    (headerStr.includes('amount') || headerStr.includes('quantity'))
  ) {
    return 'generic';
  }

  return 'unknown';
}

// ==================== Row Parsing by Format ====================

function parseRow(row: string[], headers: string[], format: ExchangeFormat): ImportedTransaction | null {
  const rowData = createRowMap(row, headers);

  switch (format) {
    case 'coinbase':
      return parseCoinbaseRow(rowData);
    case 'coinbase_pro':
      return parseCoinbaseProRow(rowData);
    case 'kraken':
      return parseKrakenRow(rowData);
    case 'binance':
      return parseBinanceRow(rowData);
    case 'gemini':
      return parseGeminiRow(rowData);
    case 'generic':
    case 'unknown':
    default:
      return parseGenericRow(rowData);
  }
}

function createRowMap(row: string[], headers: string[]): Record<string, string> {
  const map: Record<string, string> = {};
  headers.forEach((header, i) => {
    map[header.toLowerCase().trim()] = row[i] || '';
  });
  return map;
}

// ==================== Coinbase Parser ====================

function parseCoinbaseRow(row: Record<string, string>): ImportedTransaction | null {
  const timestamp = row['timestamp'];
  const txType = row['transaction type']?.toLowerCase();
  const asset = row['asset'];
  const quantity = parseFloat(row['quantity received'] || row['quantity transacted'] || '0');
  const spotPrice = parseFloat(row['spot price at transaction'] || row['spot price'] || '0');
  const subtotal = parseFloat(row['subtotal'] || '0');
  const fees = parseFloat(row['fees'] || '0');
  const notes = row['notes'] || '';

  if (!timestamp || !asset || quantity === 0) {
    return null;
  }

  let type: ImportedTransaction['type'];
  switch (txType) {
    case 'buy':
    case 'advanced trade buy':
      type = 'buy';
      break;
    case 'sell':
    case 'advanced trade sell':
      type = 'sell';
      break;
    case 'receive':
    case 'deposit':
      type = 'transfer_in';
      break;
    case 'send':
    case 'withdrawal':
      type = 'transfer_out';
      break;
    case 'rewards income':
    case 'staking income':
    case 'coinbase earn':
      type = 'staking_reward';
      break;
    default:
      return null; // Skip unknown types
  }

  return {
    date: new Date(timestamp).toISOString(),
    type,
    asset,
    symbol: asset,
    amount: Math.abs(quantity),
    pricePerUnit: spotPrice || (subtotal / quantity) || 0,
    totalValue: Math.abs(subtotal) || Math.abs(quantity * spotPrice),
    fee: fees,
    feeCurrency: 'USD',
    exchange: 'Coinbase',
    notes,
  };
}

// ==================== Coinbase Pro Parser ====================

function parseCoinbaseProRow(row: Record<string, string>): ImportedTransaction | null {
  const time = row['time'] || row['created at'];
  const side = row['side']?.toLowerCase();
  const product = row['product'];
  const size = parseFloat(row['size'] || '0');
  const price = parseFloat(row['price'] || '0');
  const fee = parseFloat(row['fee'] || '0');

  if (!time || !product || size === 0) {
    return null;
  }

  // Product is like "BTC-USD"
  const [asset] = product.split('-');

  const type: ImportedTransaction['type'] = side === 'buy' ? 'buy' : 'sell';

  return {
    date: new Date(time).toISOString(),
    type,
    asset,
    symbol: asset,
    amount: Math.abs(size),
    pricePerUnit: price,
    totalValue: Math.abs(size * price),
    fee,
    feeCurrency: 'USD',
    exchange: 'Coinbase Pro',
  };
}

// ==================== Kraken Parser ====================

function parseKrakenRow(row: Record<string, string>): ImportedTransaction | null {
  const time = row['time'];
  const txType = row['type']?.toLowerCase();
  const pair = row['pair'];
  const vol = parseFloat(row['vol'] || '0');
  const price = parseFloat(row['price'] || '0');
  const fee = parseFloat(row['fee'] || '0');

  if (!time || !pair || vol === 0) {
    return null;
  }

  // Extract asset from pair (e.g., "XXBTZUSD" -> "BTC")
  let asset = pair;
  if (pair.startsWith('X')) {
    asset = pair.substring(1, 4);
  }
  // Map Kraken symbols
  const symbolMap: Record<string, string> = {
    'XBT': 'BTC',
    'XXBT': 'BTC',
  };
  asset = symbolMap[asset] || asset;

  let type: ImportedTransaction['type'];
  switch (txType) {
    case 'buy':
      type = 'buy';
      break;
    case 'sell':
      type = 'sell';
      break;
    case 'deposit':
      type = 'transfer_in';
      break;
    case 'withdrawal':
      type = 'transfer_out';
      break;
    case 'staking':
      type = 'staking_reward';
      break;
    default:
      return null;
  }

  return {
    date: new Date(time).toISOString(),
    type,
    asset,
    symbol: asset,
    amount: Math.abs(vol),
    pricePerUnit: price,
    totalValue: Math.abs(vol * price),
    fee,
    feeCurrency: 'USD',
    exchange: 'Kraken',
  };
}

// ==================== Binance Parser ====================

function parseBinanceRow(row: Record<string, string>): ImportedTransaction | null {
  const time = row['utc_time'];
  const operation = row['operation']?.toLowerCase();
  const coin = row['coin'];
  const change = parseFloat(row['change'] || '0');

  if (!time || !coin || change === 0) {
    return null;
  }

  let type: ImportedTransaction['type'];
  switch (operation) {
    case 'buy':
    case 'spot trading':
      type = change > 0 ? 'buy' : 'sell';
      break;
    case 'deposit':
      type = 'transfer_in';
      break;
    case 'withdraw':
    case 'withdrawal':
      type = 'transfer_out';
      break;
    case 'staking rewards':
    case 'pos savings interest':
    case 'eth 2.0 staking rewards':
      type = 'staking_reward';
      break;
    default:
      // Skip unknown operations
      return null;
  }

  return {
    date: new Date(time).toISOString(),
    type,
    asset: coin,
    symbol: coin,
    amount: Math.abs(change),
    pricePerUnit: 0, // Binance doesn't include price in basic exports
    totalValue: 0, // Will need to be filled in from price data
    exchange: 'Binance',
    notes: `Operation: ${operation}`,
  };
}

// ==================== Gemini Parser ====================

function parseGeminiRow(row: Record<string, string>): ImportedTransaction | null {
  const date = row['date'];
  const type = row['type']?.toLowerCase();
  const symbol = row['symbol'];
  const amount = parseFloat(row['amount'] || row['quantity'] || '0');
  const price = parseFloat(row['price'] || '0');
  const fee = parseFloat(row['fee (usd)'] || row['fee'] || '0');

  if (!date || !symbol || amount === 0) {
    return null;
  }

  let txType: ImportedTransaction['type'];
  switch (type) {
    case 'buy':
      txType = 'buy';
      break;
    case 'sell':
      txType = 'sell';
      break;
    case 'credit':
    case 'deposit':
      txType = 'transfer_in';
      break;
    case 'debit':
    case 'withdrawal':
      txType = 'transfer_out';
      break;
    case 'staking reward':
    case 'interest':
      txType = 'staking_reward';
      break;
    default:
      return null;
  }

  return {
    date: new Date(date).toISOString(),
    type: txType,
    asset: symbol,
    symbol: symbol,
    amount: Math.abs(amount),
    pricePerUnit: price,
    totalValue: Math.abs(amount * price),
    fee,
    feeCurrency: 'USD',
    exchange: 'Gemini',
  };
}

// ==================== Generic Parser ====================

function parseGenericRow(row: Record<string, string>): ImportedTransaction | null {
  // Try to find common column names
  const date = row['date'] || row['datetime'] || row['time'] || row['timestamp'];
  const type = row['type'] || row['side'] || row['transaction type'] || row['operation'];
  const asset = row['asset'] || row['symbol'] || row['coin'] || row['currency'];
  const amount = parseFloat(row['amount'] || row['quantity'] || row['size'] || row['volume'] || '0');
  const price = parseFloat(row['price'] || row['rate'] || row['price per unit'] || '0');
  const total = parseFloat(row['total'] || row['value'] || row['subtotal'] || '0');
  const fee = parseFloat(row['fee'] || row['fees'] || row['commission'] || '0');

  if (!date || !asset || amount === 0) {
    return null;
  }

  // Try to parse the type
  let txType: ImportedTransaction['type'] = 'buy';
  const typeLower = (type || '').toLowerCase();
  if (typeLower.includes('sell')) {
    txType = 'sell';
  } else if (typeLower.includes('buy')) {
    txType = 'buy';
  } else if (typeLower.includes('deposit') || typeLower.includes('receive') || typeLower.includes('transfer in')) {
    txType = 'transfer_in';
  } else if (typeLower.includes('withdraw') || typeLower.includes('send') || typeLower.includes('transfer out')) {
    txType = 'transfer_out';
  } else if (typeLower.includes('reward') || typeLower.includes('staking') || typeLower.includes('interest')) {
    txType = 'staking_reward';
  }

  return {
    date: new Date(date).toISOString(),
    type: txType,
    asset: asset.toUpperCase(),
    symbol: asset.toUpperCase(),
    amount: Math.abs(amount),
    pricePerUnit: price || (total / amount) || 0,
    totalValue: total || (amount * price) || 0,
    fee: fee || undefined,
    exchange: 'Unknown',
  };
}

// ==================== Export Helper ====================

/**
 * Convert ImportedTransaction to our internal Transaction format
 */
export function convertToTransaction(
  imported: ImportedTransaction,
  holdingId: string
): Omit<Transaction, 'id'> {
  return {
    holding_id: holdingId,
    type: imported.type,
    amount: imported.amount,
    price_per_unit: imported.pricePerUnit,
    total_value: imported.totalValue,
    fee: imported.fee,
    date: imported.date,
    exchange: imported.exchange,
    notes: imported.notes,
  };
}

/**
 * Get a sample CSV template for manual imports
 */
export function getCSVTemplate(): string {
  return `Date,Type,Asset,Amount,Price Per Unit,Total Value,Fee,Exchange,Notes
2024-01-15,buy,BTC,0.1,42000,4200,10,Coinbase,First BTC purchase
2024-02-20,sell,BTC,0.05,45000,2250,5,Coinbase,Taking profits
2024-03-10,staking_reward,ETH,0.01,3500,35,0,Kraken,Monthly staking reward`;
}

/**
 * Get supported exchange formats
 */
export function getSupportedExchanges(): { name: string; description: string }[] {
  return [
    { name: 'Coinbase', description: 'Standard Coinbase transaction history export' },
    { name: 'Coinbase Pro', description: 'Coinbase Pro/Advanced Trade fills export' },
    { name: 'Kraken', description: 'Kraken ledger or trades export' },
    { name: 'Binance', description: 'Binance transaction history export' },
    { name: 'Gemini', description: 'Gemini transaction history export' },
    { name: 'Generic CSV', description: 'Any CSV with Date, Type, Asset, Amount columns' },
  ];
}
