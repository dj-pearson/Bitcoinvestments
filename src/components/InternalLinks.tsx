/**
 * Internal Linking Components
 *
 * Components for consistent internal linking across the site
 * to improve SEO and user navigation.
 */

import { Link } from 'react-router-dom';
import { ArrowRight, ExternalLink } from 'lucide-react';
import { getRelatedPages, getContextualLinks, type RelatedLink } from '../lib/seo';

interface RelatedPagesProps {
  currentPath: string;
  title?: string;
  maxItems?: number;
  variant?: 'card' | 'list' | 'inline';
  className?: string;
}

/**
 * Related Pages Component
 * Shows related pages based on the current path
 */
export function RelatedPages({
  currentPath,
  title = 'Related Content',
  maxItems = 3,
  variant = 'card',
  className = '',
}: RelatedPagesProps) {
  const relatedPages = getRelatedPages(currentPath).slice(0, maxItems);

  if (relatedPages.length === 0) return null;

  if (variant === 'inline') {
    return (
      <div className={`flex flex-wrap gap-2 ${className}`}>
        {relatedPages.map((link) => (
          <Link
            key={link.url}
            to={link.url}
            className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white text-sm transition-colors"
          >
            {link.title}
            <ArrowRight className="w-3 h-3" />
          </Link>
        ))}
      </div>
    );
  }

  if (variant === 'list') {
    return (
      <nav className={`space-y-2 ${className}`} aria-label="Related content">
        <h3 className="text-lg font-semibold text-white mb-3">{title}</h3>
        {relatedPages.map((link) => (
          <Link
            key={link.url}
            to={link.url}
            className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors group"
          >
            <div>
              <p className="font-medium text-white group-hover:text-brand-primary transition-colors">
                {link.title}
              </p>
              {link.description && (
                <p className="text-sm text-gray-400">{link.description}</p>
              )}
            </div>
            <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-brand-primary transition-colors" />
          </Link>
        ))}
      </nav>
    );
  }

  // Card variant (default)
  return (
    <section className={`${className}`} aria-label="Related content">
      <h3 className="text-xl font-bold text-white mb-4">{title}</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {relatedPages.map((link) => (
          <Link
            key={link.url}
            to={link.url}
            className="glass-card p-4 hover:border-brand-primary/30 transition-all group"
          >
            <h4 className="font-semibold text-white group-hover:text-brand-primary transition-colors mb-2">
              {link.title}
            </h4>
            {link.description && (
              <p className="text-sm text-gray-400 mb-3">{link.description}</p>
            )}
            <span className="inline-flex items-center gap-1 text-sm text-brand-primary">
              Learn more <ArrowRight className="w-3 h-3" />
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

interface ContextualLinksProps {
  topic: string;
  title?: string;
  className?: string;
}

/**
 * Contextual Links Component
 * Shows links related to a specific topic
 */
export function ContextualLinks({
  topic,
  title,
  className = '',
}: ContextualLinksProps) {
  const links = getContextualLinks(topic);

  if (links.length === 0) return null;

  return (
    <div className={`p-4 rounded-xl bg-white/5 border border-white/10 ${className}`}>
      {title && <h4 className="font-semibold text-white mb-3">{title}</h4>}
      <div className="space-y-2">
        {links.map((link) => (
          <Link
            key={link.url}
            to={link.url}
            className="flex items-center gap-2 text-gray-300 hover:text-brand-primary transition-colors"
          >
            <ArrowRight className="w-3 h-3" />
            {link.title}
          </Link>
        ))}
      </div>
    </div>
  );
}

interface QuickLinksProps {
  links: Array<{
    title: string;
    url: string;
    icon?: React.ReactNode;
    external?: boolean;
  }>;
  title?: string;
  className?: string;
}

/**
 * Quick Links Component
 * Custom quick access links for any page
 */
export function QuickLinks({ links, title, className = '' }: QuickLinksProps) {
  return (
    <nav className={`glass-card p-6 ${className}`} aria-label="Quick links">
      {title && <h3 className="text-lg font-bold text-white mb-4">{title}</h3>}
      <div className="space-y-2">
        {links.map((link, index) => {
          const isExternal = link.external || link.url.startsWith('http');
          const linkClassName = "flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors group";

          if (isExternal) {
            return (
              <a
                key={index}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className={linkClassName}
              >
                <div className="flex items-center gap-3">
                  {link.icon && (
                    <span className="text-brand-primary">{link.icon}</span>
                  )}
                  <span className="text-white group-hover:text-brand-primary transition-colors">
                    {link.title}
                  </span>
                </div>
                <ExternalLink className="w-4 h-4 text-gray-400" />
              </a>
            );
          }

          return (
            <Link
              key={index}
              to={link.url}
              className={linkClassName}
            >
              <div className="flex items-center gap-3">
                {link.icon && (
                  <span className="text-brand-primary">{link.icon}</span>
                )}
                <span className="text-white group-hover:text-brand-primary transition-colors">
                  {link.title}
                </span>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-brand-primary transition-colors" />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

interface ContentHubProps {
  category: 'tools' | 'education' | 'comparison' | 'security' | 'defi';
  title?: string;
  description?: string;
  className?: string;
}

const CONTENT_HUBS: Record<ContentHubProps['category'], RelatedLink[]> = {
  tools: [
    { title: 'DCA Calculator', url: '/calculators', description: 'Plan your investments' },
    { title: 'Staking Calculator', url: '/staking-calculator', description: 'Calculate staking rewards' },
    { title: 'Price Charts', url: '/charts', description: 'Interactive price charts' },
    { title: 'Portfolio Tracker', url: '/dashboard', description: 'Track your holdings' },
    { title: 'Backtesting', url: '/backtesting', description: 'Test strategies' },
    { title: 'Gas Optimizer', url: '/gas-optimizer', description: 'Save on fees' },
  ],
  education: [
    { title: 'Getting Started', url: '/learn', description: 'Beginner guides' },
    { title: 'Glossary', url: '/glossary', description: '300+ terms explained' },
    { title: 'What is Bitcoin', url: '/article/what-is-bitcoin', description: 'Bitcoin basics' },
    { title: 'DeFi Basics', url: '/article/defi-basics', description: 'DeFi explained' },
    { title: 'Crypto Wallets', url: '/article/crypto-wallets-explained', description: 'Wallet guide' },
  ],
  comparison: [
    { title: 'Exchange Comparison', url: '/compare', description: 'Compare exchanges' },
    { title: 'Best for Beginners', url: '/compare?filter=beginners', description: 'Beginner-friendly' },
    { title: 'Lowest Fees', url: '/compare?filter=fees', description: 'Fee comparison' },
    { title: 'Wallet Comparison', url: '/compare?type=wallets', description: 'Compare wallets' },
  ],
  security: [
    { title: 'Scam Database', url: '/scam-database', description: 'Check for scams' },
    { title: 'Report a Scam', url: '/report-scam', description: 'Report fraud' },
    { title: 'Hardware Wallets', url: '/hardware-wallet', description: 'Cold storage options' },
    { title: 'Security Guide', url: '/learn', description: 'Protect your crypto' },
  ],
  defi: [
    { title: 'Yield Farming', url: '/defi-yield', description: 'Compare yields' },
    { title: 'Staking', url: '/staking-calculator', description: 'Staking rewards' },
    { title: 'On-Chain Analytics', url: '/onchain-analytics', description: 'Blockchain data' },
    { title: 'Gas Tracker', url: '/gas-optimizer', description: 'Monitor gas prices' },
  ],
};

/**
 * Content Hub Component
 * Shows a category of related content for topic clusters
 */
export function ContentHub({
  category,
  title,
  description,
  className = '',
}: ContentHubProps) {
  const links = CONTENT_HUBS[category];
  const hubTitle = title || category.charAt(0).toUpperCase() + category.slice(1);

  return (
    <section className={`glass-card p-6 ${className}`}>
      <h3 className="text-xl font-bold text-white mb-2">{hubTitle}</h3>
      {description && <p className="text-gray-400 mb-4">{description}</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {links.map((link) => (
          <Link
            key={link.url}
            to={link.url}
            className="flex items-start gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors group"
          >
            <ArrowRight className="w-4 h-4 mt-0.5 text-brand-primary" />
            <div>
              <p className="font-medium text-white group-hover:text-brand-primary transition-colors">
                {link.title}
              </p>
              {link.description && (
                <p className="text-xs text-gray-400">{link.description}</p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

interface SEOFooterLinksProps {
  className?: string;
}

/**
 * SEO Footer Links
 * Rich internal linking section for page footers
 */
export function SEOFooterLinks({ className = '' }: SEOFooterLinksProps) {
  const sections = [
    {
      title: 'Tools',
      links: [
        { title: 'DCA Calculator', url: '/calculators' },
        { title: 'Staking Calculator', url: '/staking-calculator' },
        { title: 'Price Charts', url: '/charts' },
        { title: 'Portfolio Tracker', url: '/dashboard' },
        { title: 'Backtesting', url: '/backtesting' },
      ],
    },
    {
      title: 'Compare',
      links: [
        { title: 'Best Exchanges', url: '/compare' },
        { title: 'Best Wallets', url: '/compare?type=wallets' },
        { title: 'Hardware Wallets', url: '/hardware-wallet' },
        { title: 'Lending Platforms', url: '/lending' },
      ],
    },
    {
      title: 'Learn',
      links: [
        { title: 'Getting Started', url: '/learn' },
        { title: 'Glossary', url: '/glossary' },
        { title: 'DeFi Guide', url: '/learn' },
        { title: 'Security Tips', url: '/learn' },
      ],
    },
    {
      title: 'Security',
      links: [
        { title: 'Scam Database', url: '/scam-database' },
        { title: 'Report Scam', url: '/report-scam' },
        { title: 'Wallet Guide', url: '/hardware-wallet' },
      ],
    },
  ];

  return (
    <nav
      className={`py-8 border-t border-white/10 ${className}`}
      aria-label="Site navigation"
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
        {sections.map((section) => (
          <div key={section.title}>
            <h4 className="font-semibold text-white mb-3">{section.title}</h4>
            <ul className="space-y-2">
              {section.links.map((link) => (
                <li key={link.url}>
                  <Link
                    to={link.url}
                    className="text-gray-400 hover:text-white transition-colors text-sm"
                  >
                    {link.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </nav>
  );
}
