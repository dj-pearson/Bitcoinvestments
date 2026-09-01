import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import {
  Users,
  FileText,
  Settings,
  PlusCircle,
  Mail,
  Download,
  TrendingUp,
  TrendingDown,
  Building2,
  AlertCircle,
  Edit2,
  Eye,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { hasAdvisorAccess, getTierLimits } from '../services/subscriptionLimits';
import { cn } from '../lib/utils';
import type { AdvisorClient } from '../types';

import { DemoDataBanner } from '../components/DemoDataBanner';
// Mock data for clients (in production, this would come from database)
const mockClients: AdvisorClient[] = [
  {
    id: '1',
    advisor_id: 'advisor-1',
    name: 'John Smith',
    email: 'john.smith@email.com',
    portfolio_id: 'portfolio-1',
    created_at: '2024-01-15',
    updated_at: '2024-12-01',
    status: 'active',
    notes: 'Conservative investor, retirement focused',
  },
  {
    id: '2',
    advisor_id: 'advisor-1',
    name: 'Sarah Johnson',
    email: 'sarah.j@email.com',
    portfolio_id: 'portfolio-2',
    created_at: '2024-03-20',
    updated_at: '2024-11-28',
    status: 'active',
    notes: 'High-risk tolerance, growth focused',
  },
  {
    id: '3',
    advisor_id: 'advisor-1',
    name: 'Michael Chen',
    email: 'm.chen@email.com',
    portfolio_id: 'portfolio-3',
    created_at: '2024-06-10',
    updated_at: '2024-12-05',
    status: 'active',
    notes: 'Balanced portfolio, income generation',
  },
];

// Mock portfolio data
const mockPortfolioValues: Record<string, { value: number; change: number }> = {
  'portfolio-1': { value: 125000, change: 5.2 },
  'portfolio-2': { value: 89500, change: -2.1 },
  'portfolio-3': { value: 310000, change: 8.7 },
};

export function AdvisorDashboard() {
  const { profile } = useAuth();
  const [clients, setClients] = useState<AdvisorClient[]>(mockClients);
  const [activeTab, setActiveTab] = useState<'clients' | 'reports' | 'branding'>('clients');
  const [showAddClient, setShowAddClient] = useState(false);
  const [newClient, setNewClient] = useState({ name: '', email: '', notes: '' });

  // Check if user has advisor access
  const isAdvisor = profile && hasAdvisorAccess(
    profile.subscription_status,
    profile.subscription_expires_at
  );

  const limits = profile ? getTierLimits(
    profile.subscription_status,
    profile.subscription_expires_at
  ) : getTierLimits('free');

  // Redirect if not an advisor
  if (!isAdvisor) {
    return <Navigate to="/pricing" replace />;
  }

  const totalAUM = Object.values(mockPortfolioValues).reduce((sum, p) => sum + p.value, 0);
  const avgChange = Object.values(mockPortfolioValues).reduce((sum, p) => sum + p.change, 0) / Object.values(mockPortfolioValues).length;

  const handleAddClient = () => {
    if (!newClient.name || !newClient.email) return;

    const client: AdvisorClient = {
      id: `client-${Date.now()}`,
      advisor_id: profile?.id || '',
      name: newClient.name,
      email: newClient.email,
      notes: newClient.notes,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      status: 'active',
    };

    setClients([...clients, client]);
    setNewClient({ name: '', email: '', notes: '' });
    setShowAddClient(false);
  };

  const canAddMoreClients = limits.maxClientPortfolios === Infinity ||
    clients.length < limits.maxClientPortfolios;

  return (
    <div className="container mx-auto px-4 py-8">
      <DemoDataBanner source="client portfolios" />
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Advisor Dashboard</h1>
          <p className="text-gray-400 mt-1">
            Manage your clients and generate professional reports
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className={cn(
            "px-3 py-1 rounded-full text-sm font-medium",
            profile?.subscription_tier === 'enterprise'
              ? "bg-purple-500/20 text-purple-400"
              : "bg-blue-500/20 text-blue-400"
          )}>
            {profile?.subscription_tier === 'enterprise' ? 'Enterprise' : 'Advisor'} Plan
          </span>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="glass-card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Clients</p>
              <p className="text-2xl font-bold text-white">{clients.length}</p>
            </div>
            <Users className="w-10 h-10 text-brand-primary opacity-50" />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {limits.maxClientPortfolios === Infinity
              ? 'Unlimited'
              : `${limits.maxClientPortfolios - clients.length} slots remaining`}
          </p>
        </div>

        <div className="glass-card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total AUM</p>
              <p className="text-2xl font-bold text-white">
                ${totalAUM.toLocaleString()}
              </p>
            </div>
            <Building2 className="w-10 h-10 text-green-500 opacity-50" />
          </div>
          <p className="text-xs text-gray-500 mt-2">Assets Under Management</p>
        </div>

        <div className="glass-card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Avg. Performance</p>
              <p className={cn(
                "text-2xl font-bold",
                avgChange >= 0 ? "text-green-500" : "text-red-500"
              )}>
                {avgChange >= 0 ? '+' : ''}{avgChange.toFixed(1)}%
              </p>
            </div>
            {avgChange >= 0 ? (
              <TrendingUp className="w-10 h-10 text-green-500 opacity-50" />
            ) : (
              <TrendingDown className="w-10 h-10 text-red-500 opacity-50" />
            )}
          </div>
          <p className="text-xs text-gray-500 mt-2">Across all portfolios</p>
        </div>

        <div className="glass-card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Reports Generated</p>
              <p className="text-2xl font-bold text-white">24</p>
            </div>
            <FileText className="w-10 h-10 text-blue-500 opacity-50" />
          </div>
          <p className="text-xs text-gray-500 mt-2">This month</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-white/10 pb-4">
        <button
          onClick={() => setActiveTab('clients')}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors",
            activeTab === 'clients'
              ? "bg-brand-primary text-white"
              : "text-gray-400 hover:text-white hover:bg-white/5"
          )}
        >
          <Users className="w-4 h-4" />
          Clients
        </button>
        <button
          onClick={() => setActiveTab('reports')}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors",
            activeTab === 'reports'
              ? "bg-brand-primary text-white"
              : "text-gray-400 hover:text-white hover:bg-white/5"
          )}
        >
          <FileText className="w-4 h-4" />
          Reports
        </button>
        <button
          onClick={() => setActiveTab('branding')}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors",
            activeTab === 'branding'
              ? "bg-brand-primary text-white"
              : "text-gray-400 hover:text-white hover:bg-white/5"
          )}
        >
          <Settings className="w-4 h-4" />
          Branding
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'clients' && (
        <div>
          {/* Add Client Button */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-white">Client Portfolios</h2>
            <button
              onClick={() => setShowAddClient(true)}
              disabled={!canAddMoreClients}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors",
                canAddMoreClients
                  ? "bg-brand-primary hover:bg-brand-primary/90 text-white"
                  : "bg-gray-700 text-gray-400 cursor-not-allowed"
              )}
            >
              <PlusCircle className="w-4 h-4" />
              Add Client
            </button>
          </div>

          {!canAddMoreClients && (
            <div className="mb-4 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-500" />
              <p className="text-yellow-500 text-sm">
                You've reached your client limit. <Link to="/pricing" className="underline">Upgrade to Enterprise</Link> for unlimited clients.
              </p>
            </div>
          )}

          {/* Add Client Modal */}
          {showAddClient && (
            <div className="mb-6 glass-card p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Add New Client</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Client Name *</label>
                  <input
                    type="text"
                    value={newClient.name}
                    onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-brand-primary"
                    placeholder="John Smith"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Email *</label>
                  <input
                    type="email"
                    value={newClient.email}
                    onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-brand-primary"
                    placeholder="john@email.com"
                  />
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm text-gray-400 mb-2">Notes</label>
                <textarea
                  value={newClient.notes}
                  onChange={(e) => setNewClient({ ...newClient, notes: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-brand-primary"
                  rows={2}
                  placeholder="Investment goals, risk tolerance, etc."
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowAddClient(false)}
                  className="px-4 py-2 rounded-lg text-gray-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddClient}
                  className="px-4 py-2 rounded-lg bg-brand-primary hover:bg-brand-primary/90 text-white font-medium transition-colors"
                >
                  Add Client
                </button>
              </div>
            </div>
          )}

          {/* Clients Table */}
          <div className="glass-card overflow-hidden">
            <table className="w-full">
              <thead className="bg-white/5">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Client</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Portfolio Value</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Performance</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Status</th>
                  <th className="text-right px-6 py-4 text-sm font-medium text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {clients.map((client) => {
                  const portfolio = client.portfolio_id ? mockPortfolioValues[client.portfolio_id] : null;
                  return (
                    <tr key={client.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-white">{client.name}</p>
                          <p className="text-sm text-gray-400">{client.email}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-white font-medium">
                          ${portfolio?.value.toLocaleString() || '—'}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        {portfolio ? (
                          <span className={cn(
                            "font-medium",
                            portfolio.change >= 0 ? "text-green-500" : "text-red-500"
                          )}>
                            {portfolio.change >= 0 ? '+' : ''}{portfolio.change}%
                          </span>
                        ) : (
                          <span className="text-gray-500">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "px-2 py-1 rounded text-xs font-medium",
                          client.status === 'active'
                            ? "bg-green-500/20 text-green-400"
                            : "bg-gray-500/20 text-gray-400"
                        )}>
                          {client.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          <button className="p-2 text-gray-400 hover:text-white transition-colors" title="View">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button className="p-2 text-gray-400 hover:text-white transition-colors" title="Email Report">
                            <Mail className="w-4 h-4" />
                          </button>
                          <button className="p-2 text-gray-400 hover:text-white transition-colors" title="Download Report">
                            <Download className="w-4 h-4" />
                          </button>
                          <button className="p-2 text-gray-400 hover:text-white transition-colors" title="Edit">
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'reports' && (
        <div>
          <h2 className="text-xl font-semibold text-white mb-6">Generate Reports</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Portfolio Summary Report */}
            <div className="glass-card p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-lg bg-blue-500/20">
                  <FileText className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Portfolio Summary</h3>
                  <p className="text-sm text-gray-400">Client portfolio overview</p>
                </div>
              </div>
              <p className="text-sm text-gray-400 mb-4">
                Generate a comprehensive portfolio summary including holdings, performance, and allocation breakdown.
              </p>
              <button className="w-full py-2 rounded-lg bg-brand-primary hover:bg-brand-primary/90 text-white font-medium transition-colors">
                Generate Report
              </button>
            </div>

            {/* Tax Report */}
            <div className="glass-card p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-lg bg-green-500/20">
                  <FileText className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Tax Report</h3>
                  <p className="text-sm text-gray-400">Compliance-ready export</p>
                </div>
              </div>
              <p className="text-sm text-gray-400 mb-4">
                Generate IRS Form 8949 compatible tax reports with cost basis calculations (FIFO, LIFO, HIFO).
              </p>
              <button className="w-full py-2 rounded-lg bg-brand-primary hover:bg-brand-primary/90 text-white font-medium transition-colors">
                Generate Report
              </button>
            </div>

            {/* Performance Report */}
            <div className="glass-card p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-lg bg-purple-500/20">
                  <TrendingUp className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Performance Report</h3>
                  <p className="text-sm text-gray-400">Historical analysis</p>
                </div>
              </div>
              <p className="text-sm text-gray-400 mb-4">
                Generate detailed performance reports with charts, benchmarks, and time-weighted returns.
              </p>
              <button className="w-full py-2 rounded-lg bg-brand-primary hover:bg-brand-primary/90 text-white font-medium transition-colors">
                Generate Report
              </button>
            </div>

            {/* Bulk Export */}
            <div className="glass-card p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-lg bg-orange-500/20">
                  <Download className="w-6 h-6 text-orange-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Bulk Export</h3>
                  <p className="text-sm text-gray-400">All clients</p>
                </div>
              </div>
              <p className="text-sm text-gray-400 mb-4">
                Export reports for all clients at once. Perfect for quarterly reviews and audits.
              </p>
              <button className="w-full py-2 rounded-lg bg-brand-primary hover:bg-brand-primary/90 text-white font-medium transition-colors">
                Export All
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'branding' && (
        <div>
          <h2 className="text-xl font-semibold text-white mb-6">White-Label Branding</h2>

          <div className="glass-card p-6 max-w-2xl">
            <p className="text-gray-400 mb-6">
              Customize your reports with your company branding. These settings will be applied to all generated reports.
            </p>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Company Name</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-brand-primary"
                  placeholder="Your Company Name"
                  defaultValue={(profile as { company_name?: string } | null)?.company_name ?? ''}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Logo URL</label>
                <input
                  type="url"
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-brand-primary"
                  placeholder="https://your-company.com/logo.png"
                />
                <p className="text-xs text-gray-500 mt-1">Recommended: 300x100px PNG with transparent background</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Primary Color</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      className="w-12 h-10 rounded cursor-pointer bg-transparent"
                      defaultValue="#F7931A"
                    />
                    <input
                      type="text"
                      className="flex-1 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-brand-primary"
                      placeholder="#F7931A"
                      defaultValue="#F7931A"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Secondary Color</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      className="w-12 h-10 rounded cursor-pointer bg-transparent"
                      defaultValue="#1E3A5F"
                    />
                    <input
                      type="text"
                      className="flex-1 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-brand-primary"
                      placeholder="#1E3A5F"
                      defaultValue="#1E3A5F"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Contact Email</label>
                <input
                  type="email"
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-brand-primary"
                  placeholder="contact@your-company.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Contact Phone</label>
                <input
                  type="tel"
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-brand-primary"
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Disclaimer Text</label>
                <textarea
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-brand-primary"
                  rows={3}
                  placeholder="This report is for informational purposes only..."
                  defaultValue="This report is for informational purposes only and does not constitute financial advice. Past performance is not indicative of future results."
                />
              </div>

              <div className="flex justify-end pt-4">
                <button className="px-6 py-2 rounded-lg bg-brand-primary hover:bg-brand-primary/90 text-white font-medium transition-colors">
                  Save Branding Settings
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
