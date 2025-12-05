/**
 * Transaction Import Component
 *
 * Modal for importing transactions from CSV files.
 * Supports multiple exchange formats with preview and confirmation.
 */

import { useState, useRef, useCallback } from 'react';
import {
  importTransactionsFromCSV,
  getSupportedExchanges,
  getCSVTemplate,
  type ImportResult,
  type ImportedTransaction,
} from '../services/transactionImport';

interface TransactionImportProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (transactions: ImportedTransaction[]) => Promise<void>;
}

export function TransactionImport({ isOpen, onClose, onImport }: TransactionImportProps) {
  const [step, setStep] = useState<'upload' | 'preview' | 'importing' | 'complete'>('upload');
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [selectedTransactions, setSelectedTransactions] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    if (!file.name.endsWith('.csv')) {
      setError('Please select a CSV file');
      return;
    }

    setError(null);
    const result = await importTransactionsFromCSV(file);
    setImportResult(result);

    if (result.success) {
      // Select all transactions by default
      setSelectedTransactions(new Set(result.transactions.map((_, i) => i)));
      setStep('preview');
    } else {
      setError(result.errors.join('. '));
    }
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const toggleTransaction = (index: number) => {
    const newSelected = new Set(selectedTransactions);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedTransactions(newSelected);
  };

  const toggleAll = () => {
    if (!importResult) return;
    if (selectedTransactions.size === importResult.transactions.length) {
      setSelectedTransactions(new Set());
    } else {
      setSelectedTransactions(new Set(importResult.transactions.map((_, i) => i)));
    }
  };

  const handleImport = async () => {
    if (!importResult) return;

    const transactionsToImport = importResult.transactions.filter((_, i) => selectedTransactions.has(i));
    if (transactionsToImport.length === 0) {
      setError('Please select at least one transaction to import');
      return;
    }

    setStep('importing');
    try {
      await onImport(transactionsToImport);
      setStep('complete');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
      setStep('preview');
    }
  };

  const downloadTemplate = () => {
    const template = getCSVTemplate();
    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'transaction-import-template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleClose = () => {
    setStep('upload');
    setImportResult(null);
    setSelectedTransactions(new Set());
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white">Import Transactions</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {/* Upload Step */}
          {step === 'upload' && (
            <div className="space-y-6">
              {/* Drop Zone */}
              <div
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                  dragActive
                    ? 'border-orange-500 bg-orange-500/10'
                    : 'border-gray-600 hover:border-gray-500'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <p className="text-white font-medium mb-2">
                  Drop your CSV file here, or{' '}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-orange-500 hover:text-orange-400"
                  >
                    browse
                  </button>
                </p>
                <p className="text-gray-400 text-sm">
                  Supports Coinbase, Kraken, Binance, Gemini, and generic CSV formats
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleInputChange}
                  className="hidden"
                />
              </div>

              {error && (
                <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 text-red-400">
                  {error}
                </div>
              )}

              {/* Supported Exchanges */}
              <div>
                <h3 className="text-white font-medium mb-3">Supported Exchanges</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {getSupportedExchanges().map((exchange) => (
                    <div
                      key={exchange.name}
                      className="bg-gray-700/50 rounded-lg p-3"
                    >
                      <p className="text-white font-medium text-sm">{exchange.name}</p>
                      <p className="text-gray-400 text-xs">{exchange.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Download Template */}
              <div className="flex items-center justify-between bg-gray-700/30 rounded-lg p-4">
                <div>
                  <p className="text-white font-medium">Need a template?</p>
                  <p className="text-gray-400 text-sm">Download our CSV template for manual entry</p>
                </div>
                <button
                  onClick={downloadTemplate}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm"
                >
                  Download Template
                </button>
              </div>
            </div>
          )}

          {/* Preview Step */}
          {step === 'preview' && importResult && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">
                    {importResult.transactions.length} transactions found
                  </p>
                  {importResult.exchangeDetected && (
                    <p className="text-gray-400 text-sm">
                      Detected format: {importResult.exchangeDetected}
                    </p>
                  )}
                </div>
                <label className="flex items-center gap-2 text-sm text-gray-400">
                  <input
                    type="checkbox"
                    checked={selectedTransactions.size === importResult.transactions.length}
                    onChange={toggleAll}
                    className="rounded bg-gray-700 border-gray-600 text-orange-500 focus:ring-orange-500"
                  />
                  Select All
                </label>
              </div>

              {/* Warnings */}
              {importResult.warnings.length > 0 && (
                <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-3">
                  <p className="text-yellow-400 font-medium text-sm mb-1">
                    {importResult.warnings.length} warning(s)
                  </p>
                  <ul className="text-yellow-400/80 text-xs space-y-1">
                    {importResult.warnings.slice(0, 5).map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                    {importResult.warnings.length > 5 && (
                      <li>...and {importResult.warnings.length - 5} more</li>
                    )}
                  </ul>
                </div>
              )}

              {error && (
                <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-red-400 text-sm">
                  {error}
                </div>
              )}

              {/* Transaction Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-700/50">
                    <tr>
                      <th className="px-3 py-2 text-left"></th>
                      <th className="px-3 py-2 text-left text-gray-400 font-medium">Date</th>
                      <th className="px-3 py-2 text-left text-gray-400 font-medium">Type</th>
                      <th className="px-3 py-2 text-left text-gray-400 font-medium">Asset</th>
                      <th className="px-3 py-2 text-right text-gray-400 font-medium">Amount</th>
                      <th className="px-3 py-2 text-right text-gray-400 font-medium">Price</th>
                      <th className="px-3 py-2 text-right text-gray-400 font-medium">Total</th>
                      <th className="px-3 py-2 text-left text-gray-400 font-medium">Exchange</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {importResult.transactions.slice(0, 100).map((tx, i) => (
                      <tr
                        key={i}
                        className={`hover:bg-gray-700/30 ${
                          selectedTransactions.has(i) ? '' : 'opacity-50'
                        }`}
                      >
                        <td className="px-3 py-2">
                          <input
                            type="checkbox"
                            checked={selectedTransactions.has(i)}
                            onChange={() => toggleTransaction(i)}
                            className="rounded bg-gray-700 border-gray-600 text-orange-500 focus:ring-orange-500"
                          />
                        </td>
                        <td className="px-3 py-2 text-white">{formatDate(tx.date)}</td>
                        <td className="px-3 py-2">
                          <TypeBadge type={tx.type} />
                        </td>
                        <td className="px-3 py-2 text-white font-medium">{tx.symbol}</td>
                        <td className="px-3 py-2 text-right text-white">{tx.amount.toFixed(6)}</td>
                        <td className="px-3 py-2 text-right text-gray-300">
                          {tx.pricePerUnit > 0 ? `$${tx.pricePerUnit.toFixed(2)}` : '-'}
                        </td>
                        <td className="px-3 py-2 text-right text-white">
                          {tx.totalValue > 0 ? `$${tx.totalValue.toFixed(2)}` : '-'}
                        </td>
                        <td className="px-3 py-2 text-gray-400">{tx.exchange}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {importResult.transactions.length > 100 && (
                  <p className="text-center text-gray-400 text-sm py-3">
                    Showing first 100 of {importResult.transactions.length} transactions
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Importing Step */}
          {step === 'importing' && (
            <div className="text-center py-12">
              <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-white font-medium">Importing transactions...</p>
              <p className="text-gray-400 text-sm">This may take a moment</p>
            </div>
          )}

          {/* Complete Step */}
          {step === 'complete' && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-white font-medium mb-2">Import Complete!</p>
              <p className="text-gray-400 text-sm mb-6">
                {selectedTransactions.size} transactions have been imported successfully
              </p>
              <button
                onClick={handleClose}
                className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg transition-colors"
              >
                Done
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        {step === 'preview' && (
          <div className="flex items-center justify-between p-6 border-t border-gray-700">
            <button
              onClick={() => setStep('upload')}
              className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
            >
              Back
            </button>
            <div className="flex items-center gap-3">
              <span className="text-gray-400 text-sm">
                {selectedTransactions.size} selected
              </span>
              <button
                onClick={handleImport}
                disabled={selectedTransactions.size === 0}
                className="px-6 py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
              >
                Import Selected
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ==================== Helper Components ====================

function TypeBadge({ type }: { type: ImportedTransaction['type'] }) {
  const styles: Record<ImportedTransaction['type'], string> = {
    buy: 'bg-green-500/20 text-green-400',
    sell: 'bg-red-500/20 text-red-400',
    transfer_in: 'bg-blue-500/20 text-blue-400',
    transfer_out: 'bg-orange-500/20 text-orange-400',
    staking_reward: 'bg-purple-500/20 text-purple-400',
  };

  const labels: Record<ImportedTransaction['type'], string> = {
    buy: 'Buy',
    sell: 'Sell',
    transfer_in: 'Transfer In',
    transfer_out: 'Transfer Out',
    staking_reward: 'Staking',
  };

  return (
    <span className={`px-2 py-1 rounded text-xs font-medium ${styles[type]}`}>
      {labels[type]}
    </span>
  );
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
