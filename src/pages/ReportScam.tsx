import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  AlertTriangle,
  Shield,
  ChevronLeft,
  Plus,
  X,
  Globe,
  Wallet,
  FileCode,
  Info,
  CheckCircle,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { createScamReport, SUPPORTED_BLOCKCHAINS } from '../services/scamDatabase';
import type { ScamType, ScamSeverity, InsertScamReport } from '../types/admin-database';

import { PageSEO } from '../components/PageSEO';
const SCAM_TYPES: { value: ScamType; label: string; description: string; icon: string }[] = [
  { value: 'phishing', label: 'Phishing', description: 'Fake websites/emails stealing credentials', icon: '🎣' },
  { value: 'ponzi', label: 'Ponzi Scheme', description: 'Fraudulent investment promising high returns', icon: '🔺' },
  { value: 'rug_pull', label: 'Rug Pull', description: 'Developers abandon project after raising funds', icon: '🧹' },
  { value: 'fake_ico', label: 'Fake ICO', description: 'Fraudulent initial coin offering', icon: '🪙' },
  { value: 'impersonation', label: 'Impersonation', description: 'Pretending to be a celebrity or company', icon: '🎭' },
  { value: 'fake_exchange', label: 'Fake Exchange', description: 'Fraudulent trading platform', icon: '🏦' },
  { value: 'pump_dump', label: 'Pump & Dump', description: 'Artificially inflating price then selling', icon: '📈' },
  { value: 'other', label: 'Other', description: 'Other types of cryptocurrency scams', icon: '⚠️' },
];

const SEVERITY_OPTIONS: { value: ScamSeverity; label: string; description: string; color: string }[] = [
  { value: 'low', label: 'Low', description: 'Minor risk, limited impact', color: 'bg-green-500' },
  { value: 'medium', label: 'Medium', description: 'Moderate risk, some victims', color: 'bg-yellow-500' },
  { value: 'high', label: 'High', description: 'Significant risk, many victims', color: 'bg-orange-500' },
  { value: 'critical', label: 'Critical', description: 'Active threat, major losses', color: 'bg-red-500' },
];

export function ReportScam() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<Partial<InsertScamReport>>({
    scam_type: undefined,
    severity: 'medium',
    title: '',
    description: '',
    website_url: '',
    blockchain: '',
    token_name: '',
    token_symbol: '',
    contract_address: '',
    wallet_addresses: [],
    email_addresses: [],
    phone_numbers: [],
    red_flags: [],
    victims_count: 0,
    estimated_loss_usd: undefined,
    evidence_links: [],
  });

  const [newWalletAddress, setNewWalletAddress] = useState('');
  const [newRedFlag, setNewRedFlag] = useState('');
  const [newEvidenceLink, setNewEvidenceLink] = useState('');

  function updateFormData(updates: Partial<InsertScamReport>) {
    setFormData((prev) => ({ ...prev, ...updates }));
  }

  function addToArray(field: 'wallet_addresses' | 'email_addresses' | 'red_flags' | 'evidence_links', value: string) {
    if (!value.trim()) return;
    const current = formData[field] || [];
    if (!current.includes(value.trim())) {
      updateFormData({ [field]: [...current, value.trim()] });
    }
  }

  function removeFromArray(field: 'wallet_addresses' | 'email_addresses' | 'red_flags' | 'evidence_links', index: number) {
    const current = formData[field] || [];
    updateFormData({ [field]: current.filter((_, i) => i !== index) });
  }

  function canProceed() {
    switch (step) {
      case 1:
        return !!formData.scam_type;
      case 2:
        return formData.title && formData.title.length >= 10 && formData.description && formData.description.length >= 50;
      case 3:
        return true; // Optional step
      case 4:
        return true; // Review step
      default:
        return false;
    }
  }

  async function handleSubmit() {
    if (!user) {
      navigate('/login?redirect=' + encodeURIComponent('/report-scam'));
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const reportData: InsertScamReport = {
        title: formData.title!,
        description: formData.description!,
        scam_type: formData.scam_type!,
        severity: formData.severity,
        website_url: formData.website_url || null,
        blockchain: formData.blockchain || null,
        token_name: formData.token_name || null,
        token_symbol: formData.token_symbol || null,
        contract_address: formData.contract_address || null,
        wallet_addresses: formData.wallet_addresses?.length ? formData.wallet_addresses : null,
        email_addresses: formData.email_addresses?.length ? formData.email_addresses : null,
        red_flags: formData.red_flags?.length ? formData.red_flags : null,
        victims_count: formData.victims_count || 0,
        estimated_loss_usd: formData.estimated_loss_usd || null,
        evidence_links: formData.evidence_links?.length ? formData.evidence_links : null,
      };

      const result = await createScamReport(reportData, user.id);

      if (result.error) {
        setError(result.error);
      } else {
        setSubmitted(true);
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
    }

    setSubmitting(false);
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
            <Shield className="w-16 h-16 text-orange-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Sign In Required</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              You need to be signed in to report a scam. This helps us maintain quality and prevent abuse.
            </p>
            <Link
              to="/login?redirect=/report-scam"
              className="inline-block px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium"
            >
              Sign In to Report
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Report Submitted!</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Thank you for helping protect the crypto community. Your report has been submitted and will be reviewed by our team.
            </p>
            <div className="flex justify-center gap-4">
              <Link
                to="/scam-database"
                className="px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium"
              >
                View Scam Database
              </Link>
              <button
                onClick={() => {
                  setSubmitted(false);
                  setStep(1);
                  setFormData({
                    scam_type: undefined,
                    severity: 'medium',
                    title: '',
                    description: '',
                    wallet_addresses: [],
                    email_addresses: [],
                    red_flags: [],
                    evidence_links: [],
                  });
                }}
                className="px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                Report Another
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <PageSEO pageKey="reportScam" urlPath="/report-scam" />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <Link
          to="/scam-database"
          className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 mb-6"
        >
          <ChevronLeft className="w-5 h-5" />
          Back to Scam Database
        </Link>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-500 to-red-500 p-6 text-white">
            <div className="flex items-center gap-3 mb-2">
              <AlertTriangle className="w-8 h-8" />
              <h1 className="text-2xl font-bold">Report a Scam</h1>
            </div>
            <p className="text-orange-100">Help protect the crypto community by reporting fraudulent projects</p>
          </div>

          {/* Progress Steps */}
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex justify-between">
              {['Type', 'Details', 'Evidence', 'Review'].map((label, index) => (
                <div key={label} className="flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-medium ${
                      step > index + 1
                        ? 'bg-green-500 text-white'
                        : step === index + 1
                        ? 'bg-orange-600 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    {step > index + 1 ? '✓' : index + 1}
                  </div>
                  <span className={`ml-2 text-sm hidden sm:inline ${
                    step >= index + 1 ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    {label}
                  </span>
                  {index < 3 && (
                    <div className={`w-12 sm:w-24 h-0.5 mx-2 ${
                      step > index + 1 ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Form Content */}
          <div className="p-6">
            {error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-800 dark:text-red-200">
                {error}
              </div>
            )}

            {/* Step 1: Scam Type */}
            {step === 1 && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">What type of scam is this?</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {SCAM_TYPES.map((type) => (
                    <button
                      key={type.value}
                      onClick={() => updateFormData({ scam_type: type.value })}
                      className={`p-4 rounded-lg border-2 text-left transition-all ${
                        formData.scam_type === type.value
                          ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-orange-300 dark:hover:border-orange-700'
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">{type.icon}</span>
                        <span className="font-medium text-gray-900 dark:text-white">{type.label}</span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{type.description}</p>
                    </button>
                  ))}
                </div>

                {/* Severity Selection */}
                <div className="mt-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">How severe is this scam?</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {SEVERITY_OPTIONS.map((sev) => (
                      <button
                        key={sev.value}
                        onClick={() => updateFormData({ severity: sev.value })}
                        className={`p-3 rounded-lg border-2 text-center transition-all ${
                          formData.severity === sev.value
                            ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-orange-300'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-full ${sev.color} mx-auto mb-2`} />
                        <div className="font-medium text-gray-900 dark:text-white">{sev.label}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{sev.description}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Basic Details */}
            {step === 2 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Describe the scam</h2>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => updateFormData({ title: e.target.value })}
                    placeholder="e.g., Fake MetaMask website stealing seed phrases"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Minimum 10 characters ({formData.title?.length || 0}/10)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => updateFormData({ description: e.target.value })}
                    placeholder="Describe how the scam works, what happened, and any other relevant details..."
                    rows={5}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                  />
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Minimum 50 characters ({formData.description?.length || 0}/50)
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <Globe className="w-4 h-4 inline mr-1" />
                      Website URL
                    </label>
                    <input
                      type="url"
                      value={formData.website_url ?? ''}
                      onChange={(e) => updateFormData({ website_url: e.target.value })}
                      placeholder="https://scam-website.com"
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Blockchain
                    </label>
                    <select
                      value={formData.blockchain ?? ''}
                      onChange={(e) => updateFormData({ blockchain: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="">Select blockchain...</option>
                      {SUPPORTED_BLOCKCHAINS.map((chain) => (
                        <option key={chain} value={chain}>{chain}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Token Name
                    </label>
                    <input
                      type="text"
                      value={formData.token_name ?? ''}
                      onChange={(e) => updateFormData({ token_name: e.target.value })}
                      placeholder="e.g., ScamCoin"
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Token Symbol
                    </label>
                    <input
                      type="text"
                      value={formData.token_symbol ?? ''}
                      onChange={(e) => updateFormData({ token_symbol: e.target.value.toUpperCase() })}
                      placeholder="e.g., SCAM"
                      maxLength={10}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white uppercase"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Evidence */}
            {step === 3 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Add evidence (optional)</h2>

                {/* Contract Address */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <FileCode className="w-4 h-4 inline mr-1" />
                    Contract Address
                  </label>
                  <input
                    type="text"
                    value={formData.contract_address ?? ''}
                    onChange={(e) => updateFormData({ contract_address: e.target.value })}
                    placeholder="0x..."
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono"
                  />
                </div>

                {/* Wallet Addresses */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Wallet className="w-4 h-4 inline mr-1" />
                    Known Scam Wallet Addresses
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={newWalletAddress}
                      onChange={(e) => setNewWalletAddress(e.target.value)}
                      placeholder="0x... or bc1..."
                      className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
                    />
                    <button
                      onClick={() => {
                        addToArray('wallet_addresses', newWalletAddress);
                        setNewWalletAddress('');
                      }}
                      className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                  {formData.wallet_addresses && formData.wallet_addresses.length > 0 && (
                    <div className="space-y-2">
                      {formData.wallet_addresses.map((addr, index) => (
                        <div key={index} className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded">
                          <code className="text-sm flex-1 truncate">{addr}</code>
                          <button onClick={() => removeFromArray('wallet_addresses', index)} className="text-red-500 hover:text-red-700">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Red Flags */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <AlertTriangle className="w-4 h-4 inline mr-1" />
                    Red Flags
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={newRedFlag}
                      onChange={(e) => setNewRedFlag(e.target.value)}
                      placeholder="e.g., Anonymous team, Unrealistic returns"
                      className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                    <button
                      onClick={() => {
                        addToArray('red_flags', newRedFlag);
                        setNewRedFlag('');
                      }}
                      className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                  {formData.red_flags && formData.red_flags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.red_flags.map((flag, index) => (
                        <span key={index} className="flex items-center gap-1 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 px-3 py-1 rounded-full text-sm">
                          {flag}
                          <button onClick={() => removeFromArray('red_flags', index)} className="hover:text-red-900">
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Evidence Links */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Evidence Links
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="url"
                      value={newEvidenceLink}
                      onChange={(e) => setNewEvidenceLink(e.target.value)}
                      placeholder="https://..."
                      className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                    <button
                      onClick={() => {
                        addToArray('evidence_links', newEvidenceLink);
                        setNewEvidenceLink('');
                      }}
                      className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                  {formData.evidence_links && formData.evidence_links.length > 0 && (
                    <div className="space-y-2">
                      {formData.evidence_links.map((link, index) => (
                        <div key={index} className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded">
                          <a href={link} target="_blank" rel="noopener noreferrer" className="text-orange-600 hover:underline flex-1 truncate text-sm">
                            {link}
                          </a>
                          <button onClick={() => removeFromArray('evidence_links', index)} className="text-red-500 hover:text-red-700">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Estimated Impact */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Estimated Victims
                    </label>
                    <input
                      type="number"
                      value={formData.victims_count || ''}
                      onChange={(e) => updateFormData({ victims_count: parseInt(e.target.value) || 0 })}
                      placeholder="0"
                      min="0"
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Estimated Loss (USD)
                    </label>
                    <input
                      type="number"
                      value={formData.estimated_loss_usd || ''}
                      onChange={(e) => updateFormData({ estimated_loss_usd: parseInt(e.target.value) || undefined })}
                      placeholder="0"
                      min="0"
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Review */}
            {step === 4 && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Review your report</h2>

                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-6 space-y-4">
                  <div className="flex items-center gap-3 pb-4 border-b border-gray-200 dark:border-gray-600">
                    <span className="text-2xl">{SCAM_TYPES.find((t) => t.value === formData.scam_type)?.icon}</span>
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-white">{formData.title}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {SCAM_TYPES.find((t) => t.value === formData.scam_type)?.label} - {formData.severity?.toUpperCase()} severity
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Description</div>
                    <p className="text-gray-900 dark:text-white">{formData.description}</p>
                  </div>

                  {formData.website_url && (
                    <div>
                      <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Website</div>
                      <p className="text-gray-900 dark:text-white">{formData.website_url}</p>
                    </div>
                  )}

                  {formData.blockchain && (
                    <div>
                      <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Blockchain</div>
                      <p className="text-gray-900 dark:text-white">{formData.blockchain}</p>
                    </div>
                  )}

                  {formData.wallet_addresses && formData.wallet_addresses.length > 0 && (
                    <div>
                      <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Wallet Addresses</div>
                      <div className="space-y-1">
                        {formData.wallet_addresses.map((addr, i) => (
                          <code key={i} className="block text-sm text-gray-900 dark:text-white">{addr}</code>
                        ))}
                      </div>
                    </div>
                  )}

                  {formData.red_flags && formData.red_flags.length > 0 && (
                    <div>
                      <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Red Flags</div>
                      <ul className="list-disc list-inside text-gray-900 dark:text-white">
                        {formData.red_flags.map((flag, i) => (
                          <li key={i}>{flag}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    Your report will be submitted for review. Our team will verify the information before it becomes publicly visible.
                  </p>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setStep(Math.max(1, step - 1))}
                disabled={step === 1}
                className="px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                Back
              </button>

              {step < 4 ? (
                <button
                  onClick={() => setStep(step + 1)}
                  disabled={!canProceed()}
                  className="px-6 py-3 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium"
                >
                  Continue
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="px-6 py-3 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white rounded-lg font-medium flex items-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Shield className="w-5 h-5" />
                      Submit Report
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
