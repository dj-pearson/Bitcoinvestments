/**
 * Accessibility Testing Utilities
 *
 * This module provides utilities for automated accessibility testing
 * and manual testing assistance.
 *
 * These utilities are designed to be used during development and testing
 * to ensure WCAG 2.1 AA compliance.
 */

/**
 * Check if an element is focusable
 */
export function isFocusable(element: Element): boolean {
    if (element.hasAttribute('disabled') || element.getAttribute('aria-disabled') === 'true') {
        return false;
    }

    const tabIndex = element.getAttribute('tabindex');
    if (tabIndex !== null && parseInt(tabIndex, 10) < 0) {
        return false;
    }

    const tagName = element.tagName.toLowerCase();
    const focusableTags = ['a', 'button', 'input', 'select', 'textarea'];

    if (focusableTags.includes(tagName)) {
        if (tagName === 'a') {
            return element.hasAttribute('href');
        }
        return true;
    }

    return tabIndex !== null && parseInt(tabIndex, 10) >= 0;
}

/**
 * Get all focusable elements within a container
 */
export function getFocusableElements(container: Element = document.body): Element[] {
    const selector = [
        'a[href]',
        'button:not([disabled])',
        'input:not([disabled]):not([type="hidden"])',
        'select:not([disabled])',
        'textarea:not([disabled])',
        '[tabindex]:not([tabindex="-1"])',
        '[contenteditable="true"]',
    ].join(', ');

    return Array.from(container.querySelectorAll(selector)).filter(isFocusable);
}

/**
 * Check if an image has alt text
 */
export function hasAltText(img: HTMLImageElement): boolean {
    return img.hasAttribute('alt') && img.alt.trim() !== '';
}

/**
 * Get all images missing alt text
 */
export function getImagesMissingAlt(): HTMLImageElement[] {
    const images = Array.from(document.querySelectorAll('img'));
    return images.filter((img) => !hasAltText(img));
}

/**
 * Check if a button has accessible name
 */
export function hasAccessibleName(element: Element): boolean {
    // Check for aria-label
    if (element.getAttribute('aria-label')?.trim()) {
        return true;
    }

    // Check for aria-labelledby
    const labelledBy = element.getAttribute('aria-labelledby');
    if (labelledBy) {
        const labelElement = document.getElementById(labelledBy);
        if (labelElement?.textContent?.trim()) {
            return true;
        }
    }

    // Check for text content
    if (element.textContent?.trim()) {
        return true;
    }

    // Check for title
    if (element.getAttribute('title')?.trim()) {
        return true;
    }

    // Check for associated label (for form elements)
    if (element instanceof HTMLInputElement || element instanceof HTMLSelectElement || element instanceof HTMLTextAreaElement) {
        const id = element.id;
        if (id) {
            const label = document.querySelector(`label[for="${id}"]`);
            if (label?.textContent?.trim()) {
                return true;
            }
        }
    }

    return false;
}

/**
 * Get all buttons missing accessible names
 */
export function getButtonsMissingAccessibleName(): Element[] {
    const buttons = Array.from(document.querySelectorAll('button, [role="button"]'));
    return buttons.filter((button) => !hasAccessibleName(button));
}

/**
 * Check color contrast ratio between two colors
 * Returns the contrast ratio
 */
export function getContrastRatio(color1: string, color2: string): number {
    const getLuminance = (rgb: number[]): number => {
        const [r, g, b] = rgb.map((v) => {
            v /= 255;
            return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
        });
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };

    const parseColor = (color: string): number[] => {
        // Handle hex colors
        if (color.startsWith('#')) {
            const hex = color.slice(1);
            const r = parseInt(hex.slice(0, 2), 16);
            const g = parseInt(hex.slice(2, 4), 16);
            const b = parseInt(hex.slice(4, 6), 16);
            return [r, g, b];
        }

        // Handle rgb/rgba colors
        const match = color.match(/\d+/g);
        if (match && match.length >= 3) {
            return [parseInt(match[0]), parseInt(match[1]), parseInt(match[2])];
        }

        return [0, 0, 0];
    };

    const l1 = getLuminance(parseColor(color1));
    const l2 = getLuminance(parseColor(color2));
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);

    return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if contrast ratio meets WCAG AA requirements
 * Normal text: 4.5:1
 * Large text (18pt+ or 14pt+ bold): 3:1
 */
export function meetsContrastRequirements(ratio: number, isLargeText: boolean = false): boolean {
    return isLargeText ? ratio >= 3 : ratio >= 4.5;
}

/**
 * Generate accessibility audit report
 */
export interface AccessibilityIssue {
    type: 'error' | 'warning';
    category: string;
    message: string;
    element?: Element;
    wcagCriteria?: string;
}

export function runAccessibilityAudit(): AccessibilityIssue[] {
    const issues: AccessibilityIssue[] = [];

    // Check for images without alt text
    const imagesMissingAlt = getImagesMissingAlt();
    imagesMissingAlt.forEach((img) => {
        issues.push({
            type: 'error',
            category: 'Images',
            message: 'Image missing alt text',
            element: img,
            wcagCriteria: '1.1.1 Non-text Content',
        });
    });

    // Check for buttons without accessible names
    const buttonsMissingName = getButtonsMissingAccessibleName();
    buttonsMissingName.forEach((button) => {
        issues.push({
            type: 'error',
            category: 'Interactive Elements',
            message: 'Button missing accessible name',
            element: button,
            wcagCriteria: '4.1.2 Name, Role, Value',
        });
    });

    // Check for form inputs without labels
    const inputs = document.querySelectorAll('input:not([type="hidden"]), select, textarea');
    inputs.forEach((input) => {
        if (!hasAccessibleName(input)) {
            issues.push({
                type: 'error',
                category: 'Forms',
                message: 'Form input missing label',
                element: input,
                wcagCriteria: '1.3.1 Info and Relationships',
            });
        }
    });

    // Check for missing document language
    if (!document.documentElement.lang) {
        issues.push({
            type: 'error',
            category: 'Document',
            message: 'Document missing lang attribute',
            wcagCriteria: '3.1.1 Language of Page',
        });
    }

    // Check for skip link
    const skipLink = document.querySelector('a[href="#main-content"], .skip-link');
    if (!skipLink) {
        issues.push({
            type: 'warning',
            category: 'Navigation',
            message: 'No skip link found',
            wcagCriteria: '2.4.1 Bypass Blocks',
        });
    }

    // Check for main landmark
    const main = document.querySelector('main, [role="main"]');
    if (!main) {
        issues.push({
            type: 'error',
            category: 'Landmarks',
            message: 'No main landmark found',
            wcagCriteria: '1.3.1 Info and Relationships',
        });
    }

    // Check for heading hierarchy
    const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
    let previousLevel = 0;
    headings.forEach((heading) => {
        const level = parseInt(heading.tagName[1]);
        if (previousLevel > 0 && level > previousLevel + 1) {
            issues.push({
                type: 'warning',
                category: 'Headings',
                message: `Heading level skipped from H${previousLevel} to H${level}`,
                element: heading,
                wcagCriteria: '1.3.1 Info and Relationships',
            });
        }
        previousLevel = level;
    });

    // Check for multiple H1 elements
    const h1Elements = document.querySelectorAll('h1');
    if (h1Elements.length > 1) {
        issues.push({
            type: 'warning',
            category: 'Headings',
            message: 'Multiple H1 elements found on page',
            wcagCriteria: '1.3.1 Info and Relationships',
        });
    }

    return issues;
}

/**
 * Log accessibility audit results to console
 */
export function logAuditResults(): void {
    const issues = runAccessibilityAudit();
    const errors = issues.filter((i) => i.type === 'error');
    const warnings = issues.filter((i) => i.type === 'warning');

    console.group('🔍 Accessibility Audit Results');

    if (errors.length === 0 && warnings.length === 0) {
        console.log('✅ No accessibility issues found!');
    } else {
        if (errors.length > 0) {
            console.group(`❌ Errors (${errors.length})`);
            errors.forEach((error) => {
                console.error(`[${error.wcagCriteria}] ${error.message}`, error.element || '');
            });
            console.groupEnd();
        }

        if (warnings.length > 0) {
            console.group(`⚠️ Warnings (${warnings.length})`);
            warnings.forEach((warning) => {
                console.warn(`[${warning.wcagCriteria}] ${warning.message}`, warning.element || '');
            });
            console.groupEnd();
        }
    }

    console.groupEnd();
}

/**
 * Hook to run accessibility audit in development mode
 */
export function useAccessibilityAudit(enabled: boolean = import.meta.env.DEV): void {
    if (typeof window === 'undefined' || !enabled) return;

    // Run audit after page load
    if (document.readyState === 'complete') {
        setTimeout(logAuditResults, 1000);
    } else {
        window.addEventListener('load', () => {
            setTimeout(logAuditResults, 1000);
        });
    }
}

/**
 * Visual debugging: highlight elements with accessibility issues
 */
export function highlightAccessibilityIssues(): void {
    const issues = runAccessibilityAudit();

    issues.forEach((issue) => {
        if (issue.element && issue.element instanceof HTMLElement) {
            const color = issue.type === 'error' ? 'red' : 'orange';
            issue.element.style.outline = `3px solid ${color}`;
            issue.element.style.outlineOffset = '2px';
            issue.element.setAttribute('data-a11y-issue', issue.message);
        }
    });

    console.log(`Highlighted ${issues.length} elements with accessibility issues`);
}

/**
 * Remove accessibility issue highlights
 */
export function removeAccessibilityHighlights(): void {
    const elements = document.querySelectorAll('[data-a11y-issue]');
    elements.forEach((el) => {
        if (el instanceof HTMLElement) {
            el.style.outline = '';
            el.style.outlineOffset = '';
            el.removeAttribute('data-a11y-issue');
        }
    });
}

// Extend Window interface for accessibility debugging
declare global {
    interface Window {
        a11yAudit: typeof logAuditResults;
        a11yHighlight: typeof highlightAccessibilityIssues;
        a11yClearHighlights: typeof removeAccessibilityHighlights;
    }
}

// Export a global debug function for console use
if (typeof window !== 'undefined') {
    window.a11yAudit = logAuditResults;
    window.a11yHighlight = highlightAccessibilityIssues;
    window.a11yClearHighlights = removeAccessibilityHighlights;
}
