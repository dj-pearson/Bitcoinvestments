/**
 * LiveRegion Component
 *
 * Provides ARIA live regions for announcing dynamic content changes to screen readers.
 *
 * WCAG 2.1 Success Criteria:
 * - 4.1.3 Status Messages (Level AA)
 */

import { useEffect, useState, useRef, type ReactNode } from 'react';

interface LiveRegionProps {
    /** Content to announce to screen readers */
    children?: ReactNode;
    /** The politeness level of the announcement */
    'aria-live'?: 'polite' | 'assertive' | 'off';
    /** Whether the entire region should be announced or just changes */
    'aria-atomic'?: boolean;
    /** What types of changes should be announced */
    'aria-relevant'?: 'additions' | 'removals' | 'text' | 'all' | 'additions text';
    /** Additional CSS classes */
    className?: string;
    /** Whether to visually hide the region (screen reader only) */
    visuallyHidden?: boolean;
    /** The role of the live region */
    role?: 'status' | 'alert' | 'log' | 'timer';
    /** Clear the announcement after this many milliseconds (0 = never) */
    clearAfter?: number;
}

export function LiveRegion({
    children,
    'aria-live': ariaLive = 'polite',
    'aria-atomic': ariaAtomic = true,
    'aria-relevant': ariaRelevant = 'additions text',
    className = '',
    visuallyHidden = true,
    role = 'status',
    clearAfter = 0,
}: LiveRegionProps) {
    const [content, setContent] = useState<ReactNode>(children);
    const clearTimeoutRef = useRef<number>();

    useEffect(() => {
        setContent(children);

        if (clearAfter > 0 && children) {
            clearTimeoutRef.current = window.setTimeout(() => {
                setContent(null);
            }, clearAfter);
        }

        return () => {
            if (clearTimeoutRef.current) {
                clearTimeout(clearTimeoutRef.current);
            }
        };
    }, [children, clearAfter]);

    const baseClassName = visuallyHidden ? 'sr-only' : '';

    return (
        <div
            role={role}
            aria-live={ariaLive}
            aria-atomic={ariaAtomic}
            aria-relevant={ariaRelevant}
            className={`${baseClassName} ${className}`.trim()}
        >
            {content}
        </div>
    );
}

/**
 * Hook for creating announcements programmatically
 */
export function useAnnounce() {
    const [announcement, setAnnouncement] = useState<string>('');
    const [priority, setPriority] = useState<'polite' | 'assertive'>('polite');
    const timeoutRef = useRef<number>();

    const announce = (message: string, announcePriority: 'polite' | 'assertive' = 'polite') => {
        // Clear any pending timeout
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        // Set the priority first
        setPriority(announcePriority);

        // Clear the message first to ensure the new message is announced
        setAnnouncement('');

        // Set the new message after a brief delay
        requestAnimationFrame(() => {
            setAnnouncement(message);

            // Clear after announcement is read
            timeoutRef.current = window.setTimeout(() => {
                setAnnouncement('');
            }, 1000);
        });
    };

    const LiveRegionComponent = (
        <LiveRegion
            aria-live={priority}
            aria-atomic={true}
            visuallyHidden={true}
            role={priority === 'assertive' ? 'alert' : 'status'}
        >
            {announcement}
        </LiveRegion>
    );

    return { announce, LiveRegionComponent };
}
