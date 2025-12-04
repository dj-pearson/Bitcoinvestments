import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Wallet, ArrowRight, Star, Shield, Check, X, ExternalLink } from 'lucide-react';
import { exchanges } from '../data/exchanges';
import { wallets } from '../data/wallets';
import { cn } from '../lib/utils';

type CompareType = 'exchanges' | 'wallets';

export function Compare() {
  const [activeTab, setActiveTab] = useState<CompareType>('exchanges');

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
          <Wallet className="w-5 h-5" />
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

  const sortedExchanges = [...exchanges].sort((a, b) => {
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

      {/* Exchange Cards */}
      <div className="grid gap-6">
        {sortedExchanges.map((exchange, index) => (
          <div key={exchange.id} className="glass-card p-6">
            <div className="flex flex-col lg:flex-row lg:items-center gap-6">
              {/* Rank & Name */}
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-brand-primary/20 flex items-center justify-center text-brand-primary font-bold">
                  {index + 1}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{exchange.name}</h3>
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
                  View Details <ArrowRight className="w-4 h-4" />
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
      <div className="flex flex-wrap gap-2 mb-8">
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

            {/* Actions */}
            <div className="flex gap-2 mt-auto pt-4 border-t border-white/10">
              <Link
                to={`/compare/wallet/${wallet.id}`}
                className="flex-1 text-center py-2 rounded-lg bg-brand-primary hover:bg-brand-primary/90 text-white text-sm font-medium transition-colors"
              >
                Details
              </Link>
              <a
                href={wallet.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 text-sm transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
