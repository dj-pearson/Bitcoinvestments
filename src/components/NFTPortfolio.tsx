import { useState, useEffect } from 'react';
import {
  Image,
  Grid3X3,
  List,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Filter,
  Sparkles,
  DollarSign,
  Layers,
  TrendingUp,
} from 'lucide-react';
import {
  fetchWalletNFTs,
  groupNFTsByCollection,
  calculateNFTPortfolioSummary,
  refreshNFTData,
  formatNFTPrice,
  getRarityTier,
  SUPPORTED_NFT_CHAINS,
  type NFT,
  type NFTCollection,
  type NFTPortfolioSummary,
} from '../services/nftPortfolio';

interface NFTPortfolioProps {
  walletAddress: string;
  defaultChain?: string;
}

export function NFTPortfolio({ walletAddress, defaultChain = 'ethereum' }: NFTPortfolioProps) {
  const [nfts, setNFTs] = useState<NFT[]>([]);
  const [collections, setCollections] = useState<NFTCollection[]>([]);
  const [summary, setSummary] = useState<NFTPortfolioSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'collections'>('grid');
  const [selectedChain, setSelectedChain] = useState(defaultChain);
  const [selectedNFT, setSelectedNFT] = useState<NFT | null>(null);
  const [expandedCollection, setExpandedCollection] = useState<string | null>(null);

  // Fetch NFTs on mount
  useEffect(() => {
    loadNFTs();
  }, [walletAddress, selectedChain]);

  const loadNFTs = async () => {
    setIsLoading(true);
    setError(null);

    const result = await fetchWalletNFTs(walletAddress, [selectedChain]);

    if (result.error) {
      setError(result.error);
    } else {
      setNFTs(result.nfts);
      setCollections(groupNFTsByCollection(result.nfts));
      setSummary(calculateNFTPortfolioSummary(result.nfts));
    }

    setIsLoading(false);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshNFTData(walletAddress, selectedChain);
    await loadNFTs();
    setIsRefreshing(false);
  };

  if (isLoading) {
    return (
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8">
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 text-orange-400 animate-spin" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8">
        <div className="text-center">
          <Image className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">Failed to Load NFTs</h3>
          <p className="text-slate-400 mb-4">{error}</p>
          <button
            onClick={loadNFTs}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <SummaryCard
            icon={<Image className="h-5 w-5" />}
            label="Total NFTs"
            value={summary.totalNFTs.toString()}
          />
          <SummaryCard
            icon={<Layers className="h-5 w-5" />}
            label="Collections"
            value={summary.totalCollections.toString()}
          />
          <SummaryCard
            icon={<DollarSign className="h-5 w-5" />}
            label="Est. Value"
            value={`$${summary.estimatedValue.toLocaleString()}`}
            highlight
          />
          <SummaryCard
            icon={<TrendingUp className="h-5 w-5" />}
            label="Chains"
            value={summary.chainDistribution.length.toString()}
          />
        </div>
      )}

      {/* Controls */}
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Chain Selector */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-400" />
            <select
              value={selectedChain}
              onChange={(e) => setSelectedChain(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
            >
              {SUPPORTED_NFT_CHAINS.map((chain) => (
                <option key={chain.id} value={chain.id}>
                  {chain.name}
                </option>
              ))}
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'grid' ? 'bg-orange-500 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Grid3X3 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'list' ? 'bg-orange-500 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <List className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('collections')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'collections'
                  ? 'bg-orange-500 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="h-4 w-4" />
            </button>
          </div>

          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:text-white transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* NFTs Display */}
      {nfts.length === 0 ? (
        <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 text-center">
          <Image className="h-16 w-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No NFTs Found</h3>
          <p className="text-slate-400">
            No NFTs were found in this wallet on {selectedChain}.
          </p>
        </div>
      ) : viewMode === 'collections' ? (
        <CollectionsView
          collections={collections}
          expandedCollection={expandedCollection}
          onToggleCollection={(id) =>
            setExpandedCollection(expandedCollection === id ? null : id)
          }
          onSelectNFT={setSelectedNFT}
        />
      ) : viewMode === 'grid' ? (
        <NFTGrid nfts={nfts} onSelectNFT={setSelectedNFT} />
      ) : (
        <NFTList nfts={nfts} onSelectNFT={setSelectedNFT} />
      )}

      {/* NFT Detail Modal */}
      {selectedNFT && (
        <NFTDetailModal nft={selectedNFT} onClose={() => setSelectedNFT(null)} />
      )}
    </div>
  );
}

// Summary Card Component
function SummaryCard({
  icon,
  label,
  value,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl p-4">
      <div className="flex items-center gap-2 text-slate-400 mb-2">
        {icon}
        <span className="text-sm">{label}</span>
      </div>
      <div className={`text-2xl font-bold ${highlight ? 'text-orange-400' : 'text-white'}`}>
        {value}
      </div>
    </div>
  );
}

// NFT Grid View
function NFTGrid({
  nfts,
  onSelectNFT,
}: {
  nfts: NFT[];
  onSelectNFT: (nft: NFT) => void;
}) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {nfts.map((nft) => (
        <NFTCard key={nft.id} nft={nft} onClick={() => onSelectNFT(nft)} />
      ))}
    </div>
  );
}

// NFT Card Component
function NFTCard({ nft, onClick }: { nft: NFT; onClick: () => void }) {
  const rarityInfo = getRarityTier(nft.rarity);

  return (
    <div
      onClick={onClick}
      className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden cursor-pointer hover:border-orange-500/50 transition-all hover:scale-[1.02]"
    >
      {/* Image */}
      <div className="aspect-square bg-slate-800 relative">
        {nft.imageUrl ? (
          <img
            src={nft.imageUrl}
            alt={nft.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Image className="h-12 w-12 text-slate-600" />
          </div>
        )}
        {nft.rarity && (
          <div
            className="absolute top-2 right-2 px-2 py-0.5 rounded text-xs font-medium"
            style={{ backgroundColor: `${rarityInfo.color}20`, color: rarityInfo.color }}
          >
            #{nft.rarity.rank}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <div className="text-sm text-slate-500 truncate">{nft.collection.name}</div>
        <div className="text-white font-medium truncate">{nft.name}</div>
        {nft.floorPrice && (
          <div className="text-sm text-orange-400 mt-1">{formatNFTPrice(nft.floorPrice)}</div>
        )}
      </div>
    </div>
  );
}

// NFT List View
function NFTList({
  nfts,
  onSelectNFT,
}: {
  nfts: NFT[];
  onSelectNFT: (nft: NFT) => void;
}) {
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden">
      <div className="divide-y divide-slate-700">
        {nfts.map((nft) => (
          <div
            key={nft.id}
            onClick={() => onSelectNFT(nft)}
            className="p-4 flex items-center gap-4 hover:bg-slate-800/50 cursor-pointer transition-colors"
          >
            {/* Thumbnail */}
            <div className="w-16 h-16 rounded-lg overflow-hidden bg-slate-800 flex-shrink-0">
              {nft.imageUrl ? (
                <img
                  src={nft.imageUrl}
                  alt={nft.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Image className="h-6 w-6 text-slate-600" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="text-white font-medium truncate">{nft.name}</div>
              <div className="text-sm text-slate-400 truncate">{nft.collection.name}</div>
            </div>

            {/* Rarity */}
            {nft.rarity && (
              <div className="text-right">
                <div
                  className="text-sm font-medium"
                  style={{ color: getRarityTier(nft.rarity).color }}
                >
                  {getRarityTier(nft.rarity).tier}
                </div>
                <div className="text-xs text-slate-500">#{nft.rarity.rank}</div>
              </div>
            )}

            {/* Price */}
            <div className="text-right min-w-[100px]">
              <div className="text-white font-medium">{formatNFTPrice(nft.floorPrice)}</div>
              {nft.floorPrice?.usdValue && (
                <div className="text-xs text-slate-500">
                  ${nft.floorPrice.usdValue.toLocaleString()}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Collections View
function CollectionsView({
  collections,
  expandedCollection,
  onToggleCollection,
  onSelectNFT,
}: {
  collections: NFTCollection[];
  expandedCollection: string | null;
  onToggleCollection: (id: string) => void;
  onSelectNFT: (nft: NFT) => void;
}) {
  return (
    <div className="space-y-4">
      {collections.map((collection) => {
        const collectionKey = `${collection.chain}:${collection.contractAddress}`;
        const isExpanded = expandedCollection === collectionKey;

        return (
          <div
            key={collectionKey}
            className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden"
          >
            {/* Collection Header */}
            <div
              onClick={() => onToggleCollection(collectionKey)}
              className="p-4 flex items-center gap-4 cursor-pointer hover:bg-slate-800/50 transition-colors"
            >
              {/* Collection Image */}
              <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-800 flex-shrink-0">
                {collection.imageUrl ? (
                  <img
                    src={collection.imageUrl}
                    alt={collection.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Layers className="h-6 w-6 text-slate-600" />
                  </div>
                )}
              </div>

              {/* Collection Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-white truncate">{collection.name}</span>
                  {collection.verified && (
                    <Sparkles className="h-4 w-4 text-blue-400 flex-shrink-0" />
                  )}
                </div>
                <div className="text-sm text-slate-400">{collection.ownedCount} items</div>
              </div>

              {/* Floor Price */}
              {collection.floorPrice && (
                <div className="text-right">
                  <div className="text-white font-medium">
                    {formatNFTPrice(collection.floorPrice)}
                  </div>
                  <div className="text-xs text-slate-500">Floor</div>
                </div>
              )}

              {/* Expand Icon */}
              <div className="text-slate-400">
                {isExpanded ? (
                  <ChevronUp className="h-5 w-5" />
                ) : (
                  <ChevronDown className="h-5 w-5" />
                )}
              </div>
            </div>

            {/* Expanded NFTs */}
            {isExpanded && (
              <div className="border-t border-slate-700 p-4">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {collection.nfts.map((nft) => (
                    <div
                      key={nft.id}
                      onClick={() => onSelectNFT(nft)}
                      className="cursor-pointer hover:opacity-80 transition-opacity"
                    >
                      <div className="aspect-square rounded-lg overflow-hidden bg-slate-800">
                        {nft.imageUrl ? (
                          <img
                            src={nft.imageUrl}
                            alt={nft.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Image className="h-6 w-6 text-slate-600" />
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 truncate mt-1">{nft.name}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// NFT Detail Modal
function NFTDetailModal({ nft, onClose }: { nft: NFT; onClose: () => void }) {
  const rarityInfo = getRarityTier(nft.rarity);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Image */}
        <div className="aspect-square bg-slate-800 relative">
          {nft.imageUrl ? (
            <img
              src={nft.imageUrl}
              alt={nft.name}
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Image className="h-24 w-24 text-slate-600" />
            </div>
          )}
        </div>

        {/* Details */}
        <div className="p-6 space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 text-slate-400 mb-1">
                {nft.collection.name}
                {nft.collection.verified && <Sparkles className="h-4 w-4 text-blue-400" />}
              </div>
              <h2 className="text-2xl font-bold text-white">{nft.name}</h2>
            </div>
            {nft.rarity && (
              <div
                className="px-3 py-1 rounded-lg text-sm font-medium"
                style={{ backgroundColor: `${rarityInfo.color}20`, color: rarityInfo.color }}
              >
                {rarityInfo.tier} #{nft.rarity.rank}
              </div>
            )}
          </div>

          {/* Description */}
          {nft.description && (
            <p className="text-slate-400">{nft.description}</p>
          )}

          {/* Price Info */}
          <div className="grid grid-cols-2 gap-4">
            {nft.floorPrice && (
              <div className="bg-slate-800/50 rounded-lg p-4">
                <div className="text-slate-500 text-sm mb-1">Floor Price</div>
                <div className="text-xl font-bold text-white">{formatNFTPrice(nft.floorPrice)}</div>
                {nft.floorPrice.usdValue && (
                  <div className="text-slate-400">${nft.floorPrice.usdValue.toLocaleString()}</div>
                )}
              </div>
            )}
            {nft.lastSalePrice && (
              <div className="bg-slate-800/50 rounded-lg p-4">
                <div className="text-slate-500 text-sm mb-1">Last Sale</div>
                <div className="text-xl font-bold text-white">
                  {formatNFTPrice(nft.lastSalePrice)}
                </div>
              </div>
            )}
          </div>

          {/* Attributes */}
          {nft.attributes && nft.attributes.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Attributes</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {nft.attributes.map((attr, index) => (
                  <div
                    key={index}
                    className="bg-slate-800/50 border border-slate-700 rounded-lg p-3"
                  >
                    <div className="text-xs text-slate-500 uppercase">{attr.traitType}</div>
                    <div className="text-white font-medium">{attr.value}</div>
                    {attr.rarity && (
                      <div className="text-xs text-slate-400">{attr.rarity.toFixed(1)}% have this</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Links */}
          <div className="flex gap-3">
            {nft.externalUrl && (
              <a
                href={nft.externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:text-white transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
                View Details
              </a>
            )}
            <a
              href={`https://opensea.io/assets/${nft.chain}/${nft.contractAddress}/${nft.tokenId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
              OpenSea
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
