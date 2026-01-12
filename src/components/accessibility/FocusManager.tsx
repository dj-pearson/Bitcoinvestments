/**
 * FocusManager Component
 *
 * Manages focus for modal dialogs, drawers, and other overlay content.
 * Implements focus trapping and focus restoration.
 *
 * WCAG 2.1 Success Criteria:
 * - 2.4.3 Focus Order (Level A)
 * - 2.1.2 No Keyboard Trap (Level A)
 */

import { useEffect, useRef, type ReactNode } from 'react';

interface FocusManagerProps {
    /** The content to manage focus for */
    children: ReactNode;
    /** Whether focus trapping is active */
    active?: boolean;
    /** Whether to restore focus when deactivated */
    restoreFocus?: boolean;
    /** Whether to auto-focus the first focusable element */
    autoFocus?: boolean;
    /** Element to focus when activated (overrides autoFocus) */
    initialFocusRef?: React.RefObject<HTMLElement>;
    /** Element to focus when deactivated (overrides restoreFocus) */
    returnFocusRef?: React.RefObject<HTMLElement>;
    /** Callback when user tries to tab out of the trap */
    onEscapeFocus?: () => void;
    /** Additional class name for the container */
    className?: string;
}

const FOCUSABLE_ELEMENTS = [
    'a[href]',
    'button:not([disabled])',
    'textarea:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable="true"]',
].join(', ');

export function FocusManager({
    children,
    active = true,
    restoreFocus = true,
    autoFocus = true,
    initialFocusRef,
    returnFocusRef,
    onEscapeFocus,
    className = '',
}: FocusManagerProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const previousFocusRef = useRef<HTMLElement | null>(null);

    // Store the previously focused element when activated
    useEffect(() => {
        if (active) {
            previousFocusRef.current = document.activeElement as HTMLElement;
        }
    }, [active]);

    // Focus the initial element when activated
    useEffect(() => {
        if (!active || !autoFocus) return;

        const focusElement = () => {
            if (initialFocusRef?.current) {
                initialFocusRef.current.focus();
            } else if (containerRef.current) {
                const focusableElements = containerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_ELEMENTS);
                if (focusableElements.length > 0) {
                    focusableElements[0].focus();
                } else {
                    // If no focusable elements, focus the container itself
                    containerRef.current.focus();
                }
            }
        };

        // Delay to ensure DOM is ready
        const timeoutId = setTimeout(focusElement, 0);
        return () => clearTimeout(timeoutId);
    }, [active, autoFocus, initialFocusRef]);

    // Restore focus when deactivated
    useEffect(() => {
        return () => {
            if (restoreFocus && previousFocusRef.current) {
                const elementToFocus = returnFocusRef?.current || previousFocusRef.current;
                // Ensure the element is still in the DOM
                if (elementToFocus && document.body.contains(elementToFocus)) {
                    elementToFocus.focus();
                }
            }
        };
    }, [restoreFocus, returnFocusRef]);

    // Handle focus trap
    useEffect(() => {
        if (!active) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key !== 'Tab' || !containerRef.current) return;

            const focusableElements = containerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_ELEMENTS);
            if (focusableElements.length === 0) return;

            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];

            // Trap focus within the container
            if (e.shiftKey) {
                // Shift + Tab
                if (document.activeElement === firstElement) {
                    e.preventDefault();
                    lastElement.focus();
                    onEscapeFocus?.();
                }
            } else {
                // Tab
                if (document.activeElement === lastElement) {
                    e.preventDefault();
                    firstElement.focus();
                    onEscapeFocus?.();
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [active, onEscapeFocus]);

    return (
        <div
            ref={containerRef}
            className={className}
            tabIndex={-1}
        >
            {children}
        </div>
    );
}

/**
 * Hook for managing focus programmatically
 */
export function useFocusManager() {
    const focusFirst = (container: HTMLElement | null) => {
        if (!container) return;
        const focusableElements = container.querySelectorAll<HTMLElement>(FOCUSABLE_ELEMENTS);
        if (focusableElements.length > 0) {
            focusableElements[0].focus();
        }
    };

    const focusLast = (container: HTMLElement | null) => {
        if (!container) return;
        const focusableElements = container.querySelectorAll<HTMLElement>(FOCUSABLE_ELEMENTS);
        if (focusableElements.length > 0) {
            focusableElements[focusableElements.length - 1].focus();
        }
    };

    const getFocusableElements = (container: HTMLElement | null): HTMLElement[] => {
        if (!container) return [];
        return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_ELEMENTS));
    };

    return { focusFirst, focusLast, getFocusableElements };
}
