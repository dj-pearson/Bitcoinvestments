/**
 * NotFound (404) Page
 *
 * Accessible error page for when users navigate to non-existent routes.
 *
 * WCAG 2.1 Success Criteria:
 * - 2.4.2 Page Titled (Level A)
 * - 3.3.1 Error Identification (Level A)
 * - 2.4.4 Link Purpose (Level A)
 */

import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Search, ArrowLeft, AlertTriangle, HelpCircle } from 'lucide-react';
import { useSEO } from '../hooks/useSEO';

export function NotFound() {
    const location = useLocation();

    useSEO({
        title: 'Page Not Found (404)',
        description: 'The page you are looking for could not be found. Please check the URL or navigate to another page.',
    });

    useEffect(() => {
        document.title = 'Page Not Found | Bitcoinvestments';

        // Announce the error to screen readers
        const announcement = document.createElement('div');
        announcement.setAttribute('role', 'alert');
        announcement.setAttribute('aria-live', 'assertive');
        announcement.className = 'sr-only';
        announcement.textContent = 'Error: Page not found. The requested page does not exist.';
        document.body.appendChild(announcement);

        return () => {
            document.body.removeChild(announcement);
        };
    }, []);

    const suggestedLinks = [
        { to: '/', label: 'Home Page', icon: Home, description: 'Start from the homepage' },
        { to: '/dashboard', label: 'Dashboard', icon: Search, description: 'View your portfolio' },
        { to: '/learn', label: 'Learn', icon: HelpCircle, description: 'Educational resources' },
    ];

    return (
        <div className="min-h-[70vh] flex items-center justify-center py-12">
            <div className="max-w-xl mx-auto px-4 text-center">
                {/* Error Icon */}
                <div className="mb-8">
                    <div
                        className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-amber-500/10 border border-amber-500/20"
                        aria-hidden="true"
                    >
                        <AlertTriangle className="w-12 h-12 text-amber-400" />
                    </div>
                </div>

                {/* Error Message */}
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                    404
                </h1>
                <h2 className="text-xl md:text-2xl font-semibold text-gray-300 mb-4">
                    Page Not Found
                </h2>

                {/* Description */}
                <p className="text-gray-400 mb-2">
                    Sorry, the page you're looking for doesn't exist or has been moved.
                </p>
                <p className="text-gray-500 text-sm mb-8">
                    <span className="sr-only">Requested URL: </span>
                    <code className="px-2 py-1 bg-white/5 border border-white/10 rounded text-xs">
                        {location.pathname}
                    </code>
                </p>

                {/* Primary Actions */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                    <Link
                        to="/"
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-brand-primary hover:bg-brand-primary/90 text-white font-medium rounded-lg transition-colors"
                    >
                        <Home className="w-5 h-5" aria-hidden="true" />
                        Go to Homepage
                    </Link>
                    <button
                        onClick={() => window.history.back()}
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 text-white border border-white/10 font-medium rounded-lg transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" aria-hidden="true" />
                        Go Back
                    </button>
                </div>

                {/* Suggested Links */}
                <nav aria-label="Suggested pages">
                    <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">
                        You might be looking for
                    </h3>
                    <ul className="grid gap-3">
                        {suggestedLinks.map((link) => {
                            const Icon = link.icon;
                            return (
                                <li key={link.to}>
                                    <Link
                                        to={link.to}
                                        className="flex items-center gap-4 p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:border-white/20 transition-all group"
                                    >
                                        <div className="p-2 bg-brand-primary/10 rounded-lg group-hover:bg-brand-primary/20 transition-colors">
                                            <Icon className="w-5 h-5 text-brand-primary" aria-hidden="true" />
                                        </div>
                                        <div className="text-left">
                                            <span className="block text-white font-medium">{link.label}</span>
                                            <span className="text-sm text-gray-400">{link.description}</span>
                                        </div>
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </nav>

                {/* Help Text */}
                <p className="mt-8 text-sm text-gray-500">
                    If you believe this is an error, please{' '}
                    <a
                        href="mailto:support@bitcoinvestments.net"
                        className="text-brand-primary hover:text-brand-primary/80 underline"
                    >
                        contact support
                    </a>
                    .
                </p>
            </div>
        </div>
    );
}
