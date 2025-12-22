import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Building2, Wallet as WalletIcon, ArrowRight, Star, Shield, Check, X, ExternalLink, Award, ThumbsUp, Handshake, Info, ArrowLeft, Globe, Smartphone, Lock } from 'lucide-react';
import { exchanges, getExchangeById } from '../data/exchanges';
import { wallets, getWalletById } from '../data/wallets';
import { ReviewSection } from '../components/reviews';
import { cn } from '../lib/utils';
import {
  AffiliateDisclosureBanner,
  AffiliateBadge,
  AffiliateCardFooter,
} from '../components/AffiliateDisclosure';
import type { Exchange, Wallet as WalletType } from '../types';

/**
 * Sponsored badge component with disclosure
 */
function SponsoredBadge({ badgeType }: { badgeType: 'featured' | 'recommended' | 'partner' }) {
  const badgeConfig = {
    featured: {
      icon: Award,
      label: 'Featured',
      className: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    },
    recommended: {
      icon: ThumbsUp,
      label: 'Recommended',
      className: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    },
    partner: {
      icon: Handshake,
      label: 'Partner',
      className: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    },
  };

  const config = badgeConfig[badgeType];
  const Icon = config.icon;

  return (
    <div className="flex items-center gap-2">
      <span className={cn(
        'flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border',
        config.className
      )}>
        <Icon className="w-3.5 h-3.5" />
        {config.label}
      </span>
      <span className="group relative">
        <Info className="w-4 h-4 text-gray-500 cursor-help" />
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 border border-white/10">
          Sponsored placement
        </span>
      </span>
    </div>
  );
}

type CompareType = 'exchanges' | 'wallets';

export function Compare() {
  const { type, id } = useParams<{ type?: string; id?: string }>();
  const [activeTab, setActiveTab] = useState<CompareType>('exchanges');

  // If we have type and id, show detail view
  if (type && id) {
    if (type === 'exchange') {
      const exchange = getExchangeById(id);
      if (exchange) {
        return <ExchangeDetail exchange={exchange} />;
      }
    }
    if (type === 'wallet') {
      const wallet = getWalletById(id);
      if (wallet) {
        return <WalletDetail wallet={wallet} />;
      }
    }
    // Platform not found
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold text-white mb-4">Platform Not Found</h1>
        <Link to="/compare" className="text-orange-500 hover:text-orange-400">
          Back to Compare
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          Compare <span className="text-gradient">Platforms</span>
        </h1>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          Find the best cryptocurrency exchange or wallet for your needs with our comprehensive comparison tools.
        </p>
      </div>

      {/* Tab Selection */}
      <div className="flex justify-center gap-4 mb-8">
        <button
          onClick={() => setActiveTab('exchanges')}
          className={cn(
            'flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all',
            activeTab === 'exchanges'
              ? 'bg-brand-primary text-white'
              : 'glass hover:bg-white/10 text-gray-300'
          )}
        >
          <Building2 className="w-5 h-5" />
          Exchanges
        </button>
        <button
          onClick={() => setActiveTab('wallets')}
          className={cn(
            'flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all',
            activeTab === 'wallets'
              ? 'bg-brand-primary text-white'
              : 'glass hover:bg-white/10 text-gray-300'
          )}
        >
          <WalletIcon className="w-5 h-5" />
          Wallets
        </button>
      </div>

      {/* Content */}
      {activeTab === 'exchanges' ? <ExchangeComparison /> : <WalletComparison />}
    </div>
  );
}

function ExchangeComparison() {
  const [sortBy, setSortBy] = useState<'trust_score' | 'fees' | 'user_rating'>('trust_score');

  // Sort exchanges with sponsored ones prioritized by tier, then by selected criteria
  const sortedExchanges = [...exchanges].sort((a, b) => {
    // Sponsored exchanges come first, sorted by placement tier
    const aSponsored = a.sponsored?.is_sponsored ? (a.sponsored.placement_tier || 99) : 99;
    const bSponsored = b.sponsored?.is_sponsored ? (b.sponsored.placement_tier || 99) : 99;

    if (aSponsored !== bSponsored) {
      return aSponsored - bSponsored;
    }

    // Then sort by selected criteria
    switch (sortBy) {
      case 'trust_score':
        return b.trust_score - a.trust_score;
      case 'fees':
        return a.fees.taker_fee - b.fees.taker_fee;
      case 'user_rating':
        return b.user_rating - a.user_rating;
      default:
        return 0;
    }
  });

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-8">
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
          className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-brand-primary"
        >
          <option value="trust_score">Sort by Trust Score</option>
          <option value="fees">Sort by Fees (Low to High)</option>
          <option value="user_rating">Sort by User Rating</option>
        </select>
      </div>

      {/* Affiliate & Sponsored Disclosure */}
      <AffiliateDisclosureBanner variant="prominent" className="mb-6" />

      {/* Exchange Cards */}
      <div className="grid gap-6">
        {sortedExchanges.map((exchange, index) => (
          <div key={exchange.id} className={cn(
            "glass-card p-6",
            exchange.sponsored?.is_sponsored && "ring-1 ring-white/10"
          )}>
            <div className="flex flex-col lg:flex-row lg:items-center gap-6">
              {/* Rank & Name */}
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-brand-primary/20 flex items-center justify-center text-brand-primary font-bold">
                  {index + 1}
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl font-bold text-white">{exchange.name}</h3>
                    {exchange.sponsored?.is_sponsored && (
                      <SponsoredBadge badgeType={exchange.sponsored.badge_type} />
                    )}
                  </div>
                  <p className="text-sm text-gray-400">Est. {exchange.year_established}</p>
                </div>
              </div>

              {/* Metrics */}
              <div className="flex flex-wrap gap-6 lg:ml-auto">
                <div className="text-center">
                  <div className="flex items-center gap-1 justify-center">
                    <Shield className="w-4 h-4 text-green-400" />
                    <span className="text-xl font-bold text-white">{exchange.trust_score}/10</span>
                  </div>
                  <p className="text-xs text-gray-400">Trust Score</p>
                </div>

                <div className="text-center">
                  <span className="text-xl font-bold text-white">{(exchange.fees.taker_fee * 100).toFixed(2)}%</span>
                  <p className="text-xs text-gray-400">Taker Fee</p>
                </div>

                <div className="text-center">
                  <div className="flex items-center gap-1 justify-center">
                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    <span className="text-xl font-bold text-white">{exchange.user_rating}</span>
                  </div>
                  <p className="text-xs text-gray-400">{exchange.review_count.toLocaleString()} reviews</p>
                </div>

                <div className="text-center">
                  <span className="text-xl font-bold text-white">{exchange.supported_cryptocurrencies}+</span>
                  <p className="text-xs text-gray-400">Cryptos</p>
                </div>
              </div>
            </div>

            {/* Features */}
            <div className="mt-6 pt-6 border-t border-white/10">
              <div className="flex flex-wrap gap-4 mb-4">
                {exchange.features.staking && (
                  <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-xs">Staking</span>
                )}
                {exchange.features.margin_trading && (
                  <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-xs">Margin</span>
                )}
                {exchange.features.debit_card && (
                  <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-400 text-xs">Debit Card</span>
                )}
                {exchange.features.earn_program && (
                  <span className="px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-400 text-xs">Earn</span>
                )}
                {exchange.mobile_app && (
                  <span className="px-3 py-1 rounded-full bg-gray-500/20 text-gray-400 text-xs">Mobile App</span>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="flex flex-wrap gap-2">
                  {exchange.pros.slice(0, 2).map((pro, i) => (
                    <span key={i} className="flex items-center gap-1 text-xs text-gray-400">
                      <Check className="w-3 h-3 text-green-400" />
                      {pro}
                    </span>
                  ))}
                </div>

                <Link
                  to={`/compare/exchange/${exchange.id}`}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-primary hover:bg-brand-primary/90 text-white text-sm font-medium transition-colors"
                >
                  View Details & Reviews <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function WalletComparison() {
  const [walletType, setWalletType] = useState<'all' | 'hardware' | 'software' | 'mobile'>('all');

  const filteredWallets = wallets.filter(wallet => {
    if (walletType === 'all') return true;
    return wallet.type === walletType;
  });

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {(['all', 'hardware', 'software', 'mobile'] as const).map((type) => (
          <button
            key={type}
            onClick={() => setWalletType(type)}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-all',
              walletType === type
                ? 'bg-brand-primary text-white'
                : 'bg-white/5 text-gray-300 hover:bg-white/10'
            )}
          >
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </button>
        ))}
      </div>

      {/* Affiliate Disclosure for Wallets */}
      <AffiliateDisclosureBanner variant="compact" className="mb-6" />

      {/* Wallet Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredWallets.map((wallet) => (
          <div key={wallet.id} className="glass-card p-6 flex flex-col">
            <div className="flex items-start justify-between mb-4">
              <div>
                <span className={cn(
                  'px-2 py-1 rounded text-xs font-medium mb-2 inline-block',
                  wallet.type === 'hardware' ? 'bg-orange-500/20 text-orange-400' :
                  wallet.type === 'software' ? 'bg-blue-500/20 text-blue-400' :
                  'bg-green-500/20 text-green-400'
                )}>
                  {wallet.type.toUpperCase()}
                </span>
                <h3 className="text-xl font-bold text-white">{wallet.name}</h3>
              </div>
              {wallet.price ? (
                <span className="text-lg font-bold text-brand-primary">${wallet.price}</span>
              ) : (
                <span className="text-sm text-green-400">Free</span>
              )}
            </div>

            <p className="text-gray-400 text-sm mb-4 flex-grow">
              {wallet.description.slice(0, 120)}...
            </p>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-xs text-gray-400">Supported Coins</p>
                <p className="font-bold text-white">{wallet.supported_cryptocurrencies.toLocaleString()}+</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Ease of Use</p>
                <p className="font-bold text-white">{wallet.ease_of_use}/10</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">User Rating</p>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  <span className="font-bold text-white">{wallet.user_rating}</span>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-400">Reviews</p>
                <p className="font-bold text-white">{wallet.review_count.toLocaleString()}</p>
              </div>
            </div>

            {/* Security Features */}
            <div className="flex flex-wrap gap-2 mb-4">
              {wallet.security_features.seed_phrase_backup && (
                <span className="flex items-center gap-1 text-xs text-gray-400">
                  <Check className="w-3 h-3 text-green-400" /> Seed Backup
                </span>
              )}
              {wallet.security_features.biometric_auth && (
                <span className="flex items-center gap-1 text-xs text-gray-400">
                  <Check className="w-3 h-3 text-green-400" /> Biometric
                </span>
              )}
              {wallet.security_features.open_source && (
                <span className="flex items-center gap-1 text-xs text-gray-400">
                  <Check className="w-3 h-3 text-green-400" /> Open Source
                </span>
              )}
              {!wallet.security_features.open_source && (
                <span className="flex items-center gap-1 text-xs text-gray-400">
                  <X className="w-3 h-3 text-red-400" /> Closed Source
                </span>
              )}
            </div>

            {/* Affiliate Footer */}
            {wallet.affiliate_url && (
              <AffiliateCardFooter isAffiliate={true} className="mb-4" />
            )}

            {/* Actions */}
            <div className="flex gap-2 mt-auto pt-4 border-t border-white/10">
              <Link
                to={`/compare/wallet/${wallet.id}`}
                className="flex-1 text-center py-2 rounded-lg bg-brand-primary hover:bg-brand-primary/90 text-white text-sm font-medium transition-colors"
              >
                Details & Reviews
              </Link>
              <a
                href={wallet.affiliate_url || wallet.url}
                target="_blank"
                rel={wallet.affiliate_url ? "noopener noreferrer sponsored" : "noopener noreferrer"}
                className="flex items-center justify-center gap-1 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 text-sm transition-colors"
                title={wallet.affiliate_url ? "Affiliate link - we may earn a commission" : "Visit website"}
              >
                <ExternalLink className="w-4 h-4" />
                {wallet.affiliate_url && <AffiliateBadge showTooltip={false} className="ml-1" />}
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Exchange Detail Component
function ExchangeDetail({ exchange }: { exchange: Exchange }) {
  return (
    <div className="container mx-auto px-4 py-12">
      {/* Back Link */}
      <Link
        to="/compare"
        className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Compare
      </Link>

      {/* Header */}
      <div className="glass-card p-8 mb-8">
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-4">
              <h1 className="text-3xl font-bold text-white">{exchange.name}</h1>
              {exchange.sponsored?.is_sponsored && (
                <SponsoredBadge badgeType={exchange.sponsored.badge_type} />
              )}
            </div>
            <p className="text-gray-400 mb-4">{exchange.description}</p>
            <div className="flex flex-wrap gap-4">
              <span className="flex items-center gap-2 text-sm text-gray-300">
                <Globe className="w-4 h-4" />
                {exchange.country}
              </span>
              <span className="text-sm text-gray-300">Est. {exchange.year_established}</span>
              {exchange.mobile_app && (
                <span className="flex items-center gap-2 text-sm text-gray-300">
                  <Smartphone className="w-4 h-4" />
                  Mobile App Available
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <a
              href={exchange.affiliate_url || exchange.url}
              target="_blank"
              rel={exchange.affiliate_url ? "noopener noreferrer sponsored" : "noopener noreferrer"}
              className="px-8 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors text-center"
            >
              Visit {exchange.name}
            </a>
            {exchange.affiliate_url && (
              <div className="flex flex-col items-center gap-1">
                <AffiliateBadge />
                <p className="text-xs text-gray-500 text-center max-w-[200px]">
                  We may earn a commission at no extra cost to you
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="glass-card p-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Shield className="w-6 h-6 text-green-400" />
            <span className="text-3xl font-bold text-white">{exchange.trust_score}</span>
            <span className="text-gray-400">/10</span>
          </div>
          <p className="text-sm text-gray-400">Trust Score</p>
        </div>
        <div className="glass-card p-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Star className="w-6 h-6 text-yellow-400 fill-yellow-400" />
            <span className="text-3xl font-bold text-white">{exchange.user_rating}</span>
          </div>
          <p className="text-sm text-gray-400">{exchange.review_count.toLocaleString()} Reviews</p>
        </div>
        <div className="glass-card p-6 text-center">
          <span className="text-3xl font-bold text-white">{(exchange.fees.taker_fee * 100).toFixed(2)}%</span>
          <p className="text-sm text-gray-400">Taker Fee</p>
        </div>
        <div className="glass-card p-6 text-center">
          <span className="text-3xl font-bold text-white">{exchange.supported_cryptocurrencies}+</span>
          <p className="text-sm text-gray-400">Cryptocurrencies</p>
        </div>
      </div>

      {/* Features & Pros/Cons */}
      <div className="grid md:grid-cols-2 gap-8 mb-12">
        {/* Features */}
        <div className="glass-card p-6">
          <h2 className="text-xl font-bold text-white mb-4">Features</h2>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(exchange.features).map(([key, value]) => (
              <div key={key} className="flex items-center gap-2">
                {value ? (
                  <Check className="w-4 h-4 text-green-400" />
                ) : (
                  <X className="w-4 h-4 text-red-400" />
                )}
                <span className={cn('text-sm', value ? 'text-gray-300' : 'text-gray-500')}>
                  {key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Pros & Cons */}
        <div className="glass-card p-6">
          <h2 className="text-xl font-bold text-white mb-4">Pros & Cons</h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-green-400 mb-2">Pros</h3>
              <ul className="space-y-2">
                {exchange.pros.map((pro, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-gray-300">
                    <Check className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                    {pro}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-medium text-red-400 mb-2">Cons</h3>
              <ul className="space-y-2">
                {exchange.cons.map((con, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-gray-300">
                    <X className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                    {con}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Fees Section */}
      <div className="glass-card p-6 mb-12">
        <h2 className="text-xl font-bold text-white mb-4">Fee Structure</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div>
            <p className="text-xs text-gray-400 mb-1">Maker Fee</p>
            <p className="text-lg font-bold text-white">{(exchange.fees.maker_fee * 100).toFixed(2)}%</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">Taker Fee</p>
            <p className="text-lg font-bold text-white">{(exchange.fees.taker_fee * 100).toFixed(2)}%</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">BTC Withdrawal</p>
            <p className="text-lg font-bold text-white">
              {exchange.fees.withdrawal_fee_btc === 0 ? 'Free' : `${exchange.fees.withdrawal_fee_btc} BTC`}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">ETH Withdrawal</p>
            <p className="text-lg font-bold text-white">
              {exchange.fees.withdrawal_fee_eth === 0 ? 'Free' : `${exchange.fees.withdrawal_fee_eth} ETH`}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">Fiat Deposit</p>
            <p className="text-lg font-bold text-white">
              {exchange.fees.deposit_fee_fiat === 0 ? 'Free' : `$${exchange.fees.deposit_fee_fiat}`}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">Fiat Withdrawal</p>
            <p className="text-lg font-bold text-white">
              {exchange.fees.withdrawal_fee_fiat === 0 ? 'Free' : `$${exchange.fees.withdrawal_fee_fiat}`}
            </p>
          </div>
        </div>
      </div>

      {/* User Reviews Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-6">User Reviews</h2>
        <ReviewSection
          platformType="exchange"
          platformId={exchange.id}
          platformName={exchange.name}
        />
      </div>
    </div>
  );
}

// Wallet Detail Component
function WalletDetail({ wallet }: { wallet: WalletType }) {
  return (
    <div className="container mx-auto px-4 py-12">
      {/* Back Link */}
      <Link
        to="/compare"
        className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Compare
      </Link>

      {/* Header */}
      <div className="glass-card p-8 mb-8">
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-4">
              <span className={cn(
                'px-3 py-1 rounded text-sm font-medium',
                wallet.type === 'hardware' ? 'bg-orange-500/20 text-orange-400' :
                wallet.type === 'software' ? 'bg-blue-500/20 text-blue-400' :
                'bg-green-500/20 text-green-400'
              )}>
                {wallet.type.toUpperCase()} WALLET
              </span>
              {wallet.price ? (
                <span className="text-2xl font-bold text-orange-400">${wallet.price}</span>
              ) : (
                <span className="text-lg text-green-400 font-medium">Free</span>
              )}
            </div>
            <h1 className="text-3xl font-bold text-white mb-4">{wallet.name}</h1>
            <p className="text-gray-400">{wallet.description}</p>
          </div>

          <div className="flex flex-col gap-3">
            <a
              href={wallet.affiliate_url || wallet.url}
              target="_blank"
              rel={wallet.affiliate_url ? "noopener noreferrer sponsored" : "noopener noreferrer"}
              className="px-8 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors text-center"
            >
              {wallet.price ? 'Buy Now' : 'Get ' + wallet.name}
            </a>
            {wallet.affiliate_url && (
              <div className="flex flex-col items-center gap-1">
                <AffiliateBadge />
                <p className="text-xs text-gray-500 text-center max-w-[200px]">
                  We may earn a commission at no extra cost to you
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="glass-card p-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Star className="w-6 h-6 text-yellow-400 fill-yellow-400" />
            <span className="text-3xl font-bold text-white">{wallet.user_rating}</span>
          </div>
          <p className="text-sm text-gray-400">{wallet.review_count.toLocaleString()} Reviews</p>
        </div>
        <div className="glass-card p-6 text-center">
          <span className="text-3xl font-bold text-white">{wallet.ease_of_use}</span>
          <span className="text-gray-400">/10</span>
          <p className="text-sm text-gray-400">Ease of Use</p>
        </div>
        <div className="glass-card p-6 text-center">
          <span className="text-3xl font-bold text-white">{wallet.supported_cryptocurrencies.toLocaleString()}+</span>
          <p className="text-sm text-gray-400">Supported Coins</p>
        </div>
        <div className="glass-card p-6 text-center">
          <span className="text-3xl font-bold text-white">{wallet.supported_chains.length}</span>
          <p className="text-sm text-gray-400">Blockchains</p>
        </div>
      </div>

      {/* Security & Features */}
      <div className="grid md:grid-cols-2 gap-8 mb-12">
        {/* Security Features */}
        <div className="glass-card p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Lock className="w-5 h-5 text-green-400" />
            Security Features
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(wallet.security_features).map(([key, value]) => (
              <div key={key} className="flex items-center gap-2">
                {value ? (
                  <Check className="w-4 h-4 text-green-400" />
                ) : (
                  <X className="w-4 h-4 text-red-400" />
                )}
                <span className={cn('text-sm', value ? 'text-gray-300' : 'text-gray-500')}>
                  {key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Wallet Features */}
        <div className="glass-card p-6">
          <h2 className="text-xl font-bold text-white mb-4">Features</h2>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(wallet.features).map(([key, value]) => (
              <div key={key} className="flex items-center gap-2">
                {value ? (
                  <Check className="w-4 h-4 text-green-400" />
                ) : (
                  <X className="w-4 h-4 text-red-400" />
                )}
                <span className={cn('text-sm', value ? 'text-gray-300' : 'text-gray-500')}>
                  {key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pros & Cons */}
      <div className="glass-card p-6 mb-12">
        <h2 className="text-xl font-bold text-white mb-4">Pros & Cons</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-medium text-green-400 mb-3">Pros</h3>
            <ul className="space-y-2">
              {wallet.pros.map((pro, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-gray-300">
                  <Check className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                  {pro}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-medium text-red-400 mb-3">Cons</h3>
            <ul className="space-y-2">
              {wallet.cons.map((con, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-gray-300">
                  <X className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                  {con}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Supported Chains */}
      <div className="glass-card p-6 mb-12">
        <h2 className="text-xl font-bold text-white mb-4">Supported Blockchains</h2>
        <div className="flex flex-wrap gap-2">
          {wallet.supported_chains.map((chain, index) => (
            <span
              key={index}
              className="px-3 py-1 rounded-full bg-white/5 text-gray-300 text-sm"
            >
              {chain}
            </span>
          ))}
        </div>
      </div>

      {/* User Reviews Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-6">User Reviews</h2>
        <ReviewSection
          platformType="wallet"
          platformId={wallet.id}
          platformName={wallet.name}
        />
      </div>
    </div>
  );
}
