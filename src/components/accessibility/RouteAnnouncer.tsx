/**
 * RouteAnnouncer Component
 *
 * Announces page changes to screen reader users when navigating between routes.
 * Uses an ARIA live region to communicate route changes.
 *
 * WCAG 2.1 Success Criteria:
 * - 4.1.3 Status Messages (Level AA)
 * - 2.4.2 Page Titled (Level A)
 */

import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

export function RouteAnnouncer() {
    const location = useLocation();
    const [announcement, setAnnouncement] = useState('');

    useEffect(() => {
        // Wait a brief moment for the page title to update
        const timeoutId = setTimeout(() => {
            const pageTitle = document.title || 'Page';
            setAnnouncement(`Navigated to ${pageTitle}`);

            // Clear the announcement after it's been read
            const clearTimeoutId = setTimeout(() => {
                setAnnouncement('');
            }, 1000);

            return () => clearTimeout(clearTimeoutId);
        }, 100);

        return () => clearTimeout(timeoutId);
    }, [location.pathname]);

    return (
        <div
            role="status"
            aria-live="polite"
            aria-atomic="true"
            className="sr-only"
        >
            {announcement}
        </div>
    );
}
