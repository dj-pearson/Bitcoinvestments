import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Play, Pause, BarChart3, Calendar } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { AD_ZONES } from '../services/ads';
import type { Advertisement } from '../types/database';

type AdFormData = {
  campaign_name: string;
  advertiser_id: string;
  ad_zone: 'banner' | 'sidebar' | 'native' | 'popup';
  image_url: string;
  target_url: string;
  alt_text: string;
  cta_text: string;
  start_date: string;
  end_date: string;
  status: 'active' | 'paused' | 'ended';
};

export function AdManager() {
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAd, setEditingAd] = useState<Advertisement | null>(null);
  const [formData, setFormData] = useState<AdFormData>({
    campaign_name: '',
    advertiser_id: '',
    ad_zone: 'banner',
    image_url: '',
    target_url: '',
    alt_text: '',
    cta_text: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'active',
  });

  useEffect(() => {
    loadAds();
  }, []);

  async function loadAds() {
    setLoading(true);
    const { data, error } = await supabase
      .from('advertisements')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setAds(data);
    }
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (editingAd) {
      // Update existing ad
      const { error } = await supabase
        .from('advertisements')
        .update(formData)
        .eq('id', editingAd.id);

      if (!error) {
        await loadAds();
        resetForm();
      }
    } else {
      // Create new ad
      const { error } = await supabase
        .from('advertisements')
        .insert({
          ...formData,
          impressions: 0,
          clicks: 0,
        });

      if (!error) {
        await loadAds();
        resetForm();
      }
    }
  }

  function resetForm() {
    setShowForm(false);
    setEditingAd(null);
    setFormData({
      campaign_name: '',
      advertiser_id: '',
      ad_zone: 'banner',
      image_url: '',
      target_url: '',
      alt_text: '',
      cta_text: '',
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'active',
    });
  }

  function handleEdit(ad: Advertisement) {
    setEditingAd(ad);
    setFormData({
      campaign_name: ad.campaign_name,
      advertiser_id: ad.advertiser_id,
      ad_zone: ad.ad_zone,
      image_url: ad.image_url,
      target_url: ad.target_url,
      alt_text: ad.alt_text,
      cta_text: ad.cta_text || '',
      start_date: ad.start_date.split('T')[0],
      end_date: ad.end_date.split('T')[0],
      status: ad.status,
    });
    setShowForm(true);
  }

  async function handleDelete(adId: string) {
    if (!confirm('Are you sure you want to delete this ad?')) return;

    const { error } = await supabase
      .from('advertisements')
      .delete()
      .eq('id', adId);

    if (!error) {
      await loadAds();
    }
  }

  async function toggleAdStatus(ad: Advertisement) {
    const newStatus = ad.status === 'active' ? 'paused' : 'active';
    const { error } = await supabase
      .from('advertisements')
      .update({ status: newStatus })
      .eq('id', ad.id);

    if (!error) {
      await loadAds();
    }
  }

  function calculateCTR(ad: Advertisement): number {
    if (ad.impressions === 0) return 0;
    return (ad.clicks / ad.impressions) * 100;
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-700 rounded w-1/4"></div>
          <div className="h-64 bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Ad Manager</h1>
          <p className="text-gray-400">Manage your self-hosted advertisements</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          {showForm ? 'Cancel' : 'Create Ad'}
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <p className="text-gray-400 text-sm mb-1">Total Ads</p>
          <p className="text-2xl font-bold text-white">{ads.length}</p>
        </div>
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <p className="text-gray-400 text-sm mb-1">Active Campaigns</p>
          <p className="text-2xl font-bold text-green-400">
            {ads.filter(a => a.status === 'active').length}
          </p>
        </div>
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <p className="text-gray-400 text-sm mb-1">Total Impressions</p>
          <p className="text-2xl font-bold text-white">
            {ads.reduce((sum, ad) => sum + ad.impressions, 0).toLocaleString()}
          </p>
        </div>
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <p className="text-gray-400 text-sm mb-1">Total Clicks</p>
          <p className="text-2xl font-bold text-white">
            {ads.reduce((sum, ad) => sum + ad.clicks, 0).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Create/Edit Form */}
      {showForm && (
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 mb-8">
          <h2 className="text-xl font-bold text-white mb-6">
            {editingAd ? 'Edit Advertisement' : 'Create New Advertisement'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Campaign Name *
                </label>
                <input
                  type="text"
                  value={formData.campaign_name}
                  onChange={(e) => setFormData({ ...formData, campaign_name: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Advertiser ID *
                </label>
                <input
                  type="text"
                  value={formData.advertiser_id}
                  onChange={(e) => setFormData({ ...formData, advertiser_id: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="e.g., coinbase-promo-2024"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Ad Zone *
                </label>
                <select
                  value={formData.ad_zone}
                  onChange={(e) => setFormData({ ...formData, ad_zone: e.target.value as any })}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                >
                  {Object.entries(AD_ZONES).map(([key, zone]) => (
                    <option key={key} value={key}>
                      {zone.name} - {zone.description}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Status *
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                >
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="ended">Ended</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Start Date *
                </label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  End Date *
                </label>
                <input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Image URL *
                </label>
                <input
                  type="url"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="https://example.com/ad-image.jpg"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Target URL *
                </label>
                <input
                  type="url"
                  value={formData.target_url}
                  onChange={(e) => setFormData({ ...formData, target_url: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="https://example.com/landing-page"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Alt Text *
                </label>
                <input
                  type="text"
                  value={formData.alt_text}
                  onChange={(e) => setFormData({ ...formData, alt_text: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Descriptive text for accessibility"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  CTA Text (Optional)
                </label>
                <input
                  type="text"
                  value={formData.cta_text}
                  onChange={(e) => setFormData({ ...formData, cta_text: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="e.g., Learn More, Get Started"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition-colors"
              >
                {editingAd ? 'Update Ad' : 'Create Ad'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Ads List */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white">All Advertisements</h2>
        </div>

        {ads.length === 0 ? (
          <div className="p-12 text-center">
            <BarChart3 className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 mb-4">No advertisements yet</p>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create First Ad
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Campaign
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Zone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Impressions
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Clicks
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">
                    CTR
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Dates
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {ads.map((ad) => (
                  <tr key={ad.id} className="hover:bg-gray-700/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={ad.image_url}
                          alt={ad.alt_text}
                          className="w-12 h-12 object-cover rounded"
                        />
                        <div>
                          <p className="text-white font-medium">{ad.campaign_name}</p>
                          <p className="text-xs text-gray-400">{ad.advertiser_id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-gray-700 rounded text-xs text-gray-300 font-medium">
                        {AD_ZONES[ad.ad_zone].name}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          ad.status === 'active'
                            ? 'bg-green-500/20 text-green-400'
                            : ad.status === 'paused'
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : 'bg-gray-700 text-gray-400'
                        }`}
                      >
                        {ad.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center text-white">
                      {ad.impressions.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-center text-white">
                      {ad.clicks.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-orange-400 font-medium">
                        {calculateCTR(ad).toFixed(2)}%
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs text-gray-400">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(ad.start_date).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                          →{' '}{new Date(ad.end_date).toLocaleDateString()}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          onClick={() => toggleAdStatus(ad)}
                          className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
                          title={ad.status === 'active' ? 'Pause' : 'Activate'}
                        >
                          {ad.status === 'active' ? (
                            <Pause className="w-4 h-4" />
                          ) : (
                            <Play className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => handleEdit(ad)}
                          className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(ad.id)}
                          className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
