/**
 * VisuallyHidden Component
 *
 * Hides content visually while keeping it accessible to screen readers.
 * Use this for providing additional context to assistive technology users.
 *
 * WCAG 2.1 Success Criteria:
 * - 1.3.1 Info and Relationships (Level A)
 * - 4.1.2 Name, Role, Value (Level A)
 */

import { type ReactNode, type ElementType, type ComponentPropsWithoutRef } from 'react';

interface VisuallyHiddenProps<T extends ElementType = 'span'> {
    /** The content to hide visually */
    children: ReactNode;
    /** The HTML element to render (defaults to span) */
    as?: T;
    /** Whether to make content focusable (shows on focus) */
    focusable?: boolean;
}

type Props<T extends ElementType> = VisuallyHiddenProps<T> &
    Omit<ComponentPropsWithoutRef<T>, keyof VisuallyHiddenProps<T>>;

/**
 * VisuallyHidden hides content from sighted users while keeping it
 * accessible to screen readers. This is useful for:
 *
 * - Providing additional context for icon-only buttons
 * - Adding descriptive text for screen reader users
 * - Creating skip links that are hidden until focused
 *
 * @example
 * // Icon button with hidden label
 * <button>
 *   <SearchIcon aria-hidden="true" />
 *   <VisuallyHidden>Search</VisuallyHidden>
 * </button>
 *
 * @example
 * // Skip link that shows on focus
 * <VisuallyHidden as="a" href="#main" focusable>
 *   Skip to main content
 * </VisuallyHidden>
 */
export function VisuallyHidden<T extends ElementType = 'span'>({
    children,
    as,
    focusable = false,
    ...props
}: Props<T>) {
    const Component = as || 'span';

    const className = focusable ? 'sr-only-focusable' : 'sr-only';

    return (
        <Component
            {...props}
            className={`${className} ${props.className || ''}`.trim()}
        >
            {children}
        </Component>
    );
}

/**
 * Shorthand for visually hidden text within an element
 *
 * @example
 * <button aria-label={srOnly("Close dialog")}>
 *   <XIcon />
 * </button>
 */
export function srOnly(text: string): string {
    return text;
}
