/**
 * AccessibleIcon Component
 *
 * Wraps icons to ensure they are accessible, either as decorative (hidden)
 * or with proper labeling for screen readers.
 *
 * WCAG 2.1 Success Criteria:
 * - 1.1.1 Non-text Content (Level A)
 * - 4.1.2 Name, Role, Value (Level A)
 */

import { type ReactNode, type ReactElement, cloneElement, isValidElement } from 'react';
import { VisuallyHidden } from './VisuallyHidden';

interface AccessibleIconProps {
    /** The icon element to wrap */
    children: ReactNode;
    /**
     * The accessible label for the icon.
     * If provided, the icon will be labeled for screen readers.
     * If not provided, the icon is treated as decorative.
     */
    label?: string;
    /**
     * Whether the icon is purely decorative and should be hidden from screen readers.
     * Defaults to true if no label is provided.
     */
    decorative?: boolean;
}

/**
 * AccessibleIcon ensures icons are properly accessible:
 *
 * 1. Decorative icons (no meaning) - hidden from screen readers
 * 2. Informative icons (convey meaning) - labeled for screen readers
 *
 * @example
 * // Decorative icon (hidden from screen readers)
 * <AccessibleIcon>
 *   <StarIcon />
 * </AccessibleIcon>
 *
 * @example
 * // Informative icon with label
 * <AccessibleIcon label="Favorite">
 *   <StarIcon />
 * </AccessibleIcon>
 *
 * @example
 * // Icon button (use aria-label on the button instead)
 * <button aria-label="Add to favorites">
 *   <AccessibleIcon>
 *     <StarIcon />
 *   </AccessibleIcon>
 * </button>
 */
export function AccessibleIcon({
    children,
    label,
    decorative,
}: AccessibleIconProps) {
    const isDecorative = decorative ?? !label;

    // If the icon is not a valid element, just return it as-is
    if (!isValidElement(children)) {
        return <>{children}</>;
    }

    // Clone the icon element with accessibility attributes
    const iconElement = cloneElement(children as ReactElement, {
        'aria-hidden': isDecorative ? 'true' : undefined,
        focusable: 'false', // Prevent SVG icons from being focusable in IE
        role: isDecorative ? 'presentation' : 'img',
        'aria-label': !isDecorative ? label : undefined,
    });

    if (isDecorative) {
        return iconElement;
    }

    // For informative icons, we add both aria-label on the icon
    // and a visually hidden text for better compatibility
    return (
        <>
            {iconElement}
            <VisuallyHidden>{label}</VisuallyHidden>
        </>
    );
}

/**
 * Higher-order component for making icon components accessible by default
 *
 * @example
 * const AccessibleSearchIcon = makeAccessibleIcon(SearchIcon);
 *
 * // Usage
 * <AccessibleSearchIcon label="Search" />
 * <AccessibleSearchIcon /> // decorative
 */
export function makeAccessibleIcon<P extends object>(
    IconComponent: React.ComponentType<P>
) {
    return function AccessibleIconWrapper({
        label,
        decorative,
        ...iconProps
    }: P & { label?: string; decorative?: boolean }) {
        return (
            <AccessibleIcon label={label} decorative={decorative}>
                <IconComponent {...(iconProps as P)} />
            </AccessibleIcon>
        );
    };
}
