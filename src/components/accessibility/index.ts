/**
 * Accessibility Components
 *
 * This module exports all accessibility-related components used throughout
 * the application to ensure ADA/WCAG 2.1 compliance.
 */

export { SkipLinks } from './SkipLinks';
export { RouteAnnouncer } from './RouteAnnouncer';
export { KeyboardShortcutsHelp } from './KeyboardShortcutsHelp';
export { AccessibilityProvider, useAccessibility } from './AccessibilityContext';
export { LiveRegion, useAnnounce } from './LiveRegion';
export { FocusManager, useFocusManager } from './FocusManager';
export { VisuallyHidden, srOnly } from './VisuallyHidden';
export { AccessibleIcon, makeAccessibleIcon } from './AccessibleIcon';
export { AccessibleTable, SimpleTable } from './AccessibleTable';
export { AccessibilityWidget } from './AccessibilityWidget';
