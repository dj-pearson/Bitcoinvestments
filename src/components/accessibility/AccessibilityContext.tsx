/**
 * AccessibilityContext
 *
 * Provides global accessibility preferences and controls throughout the application.
 * Manages high contrast mode, reduced motion, and other accessibility settings.
 *
 * WCAG 2.1 Success Criteria:
 * - 1.4.3 Contrast (Minimum) (Level AA)
 * - 2.3.3 Animation from Interactions (Level AAA)
 */

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';

interface AccessibilitySettings {
    highContrastMode: boolean;
    reducedMotion: boolean;
    fontSize: 'normal' | 'large' | 'larger';
    focusIndicatorEnhanced: boolean;
}

interface AccessibilityContextType {
    settings: AccessibilitySettings;
    toggleHighContrast: () => void;
    toggleReducedMotion: () => void;
    setFontSize: (size: AccessibilitySettings['fontSize']) => void;
    toggleEnhancedFocus: () => void;
    announce: (message: string, priority?: 'polite' | 'assertive') => void;
}

const defaultSettings: AccessibilitySettings = {
    highContrastMode: false,
    reducedMotion: false,
    fontSize: 'normal',
    focusIndicatorEnhanced: false,
};

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

const STORAGE_KEY = 'accessibility-settings';

export function AccessibilityProvider({ children }: { children: ReactNode }) {
    const [settings, setSettings] = useState<AccessibilitySettings>(() => {
        // Load settings from localStorage
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                try {
                    return { ...defaultSettings, ...JSON.parse(saved) };
                } catch {
                    // Invalid JSON, use defaults
                }
            }
        }
        return defaultSettings;
    });

    const [announcement, setAnnouncement] = useState<{ message: string; priority: 'polite' | 'assertive' } | null>(null);

    // Check system preferences on mount
    useEffect(() => {
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const prefersHighContrast = window.matchMedia('(prefers-contrast: more)').matches;

        setSettings((prev) => ({
            ...prev,
            reducedMotion: prev.reducedMotion || prefersReducedMotion,
            highContrastMode: prev.highContrastMode || prefersHighContrast,
        }));
    }, []);

    // Persist settings to localStorage
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    }, [settings]);

    // Apply settings to document
    useEffect(() => {
        const root = document.documentElement;

        // High contrast mode
        if (settings.highContrastMode) {
            root.classList.add('high-contrast');
        } else {
            root.classList.remove('high-contrast');
        }

        // Reduced motion
        if (settings.reducedMotion) {
            root.classList.add('reduce-motion');
        } else {
            root.classList.remove('reduce-motion');
        }

        // Font size
        root.classList.remove('font-size-normal', 'font-size-large', 'font-size-larger');
        root.classList.add(`font-size-${settings.fontSize}`);

        // Enhanced focus indicators
        if (settings.focusIndicatorEnhanced) {
            root.classList.add('enhanced-focus');
        } else {
            root.classList.remove('enhanced-focus');
        }
    }, [settings]);

    // Keyboard shortcuts for accessibility toggles
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Alt + H: Toggle high contrast
            if (e.altKey && e.key.toLowerCase() === 'h') {
                e.preventDefault();
                toggleHighContrast();
            }
            // Alt + M: Toggle reduced motion
            if (e.altKey && e.key.toLowerCase() === 'm') {
                e.preventDefault();
                toggleReducedMotion();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    const toggleHighContrast = useCallback(() => {
        setSettings((prev) => {
            const newValue = !prev.highContrastMode;
            setTimeout(() => {
                announce(newValue ? 'High contrast mode enabled' : 'High contrast mode disabled');
            }, 0);
            return { ...prev, highContrastMode: newValue };
        });
    }, []);

    const toggleReducedMotion = useCallback(() => {
        setSettings((prev) => {
            const newValue = !prev.reducedMotion;
            setTimeout(() => {
                announce(newValue ? 'Reduced motion enabled' : 'Reduced motion disabled');
            }, 0);
            return { ...prev, reducedMotion: newValue };
        });
    }, []);

    const setFontSize = useCallback((size: AccessibilitySettings['fontSize']) => {
        setSettings((prev) => {
            setTimeout(() => {
                announce(`Font size set to ${size}`);
            }, 0);
            return { ...prev, fontSize: size };
        });
    }, []);

    const toggleEnhancedFocus = useCallback(() => {
        setSettings((prev) => {
            const newValue = !prev.focusIndicatorEnhanced;
            setTimeout(() => {
                announce(newValue ? 'Enhanced focus indicators enabled' : 'Enhanced focus indicators disabled');
            }, 0);
            return { ...prev, focusIndicatorEnhanced: newValue };
        });
    }, []);

    const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
        setAnnouncement({ message, priority });
        // Clear announcement after a brief delay
        setTimeout(() => setAnnouncement(null), 1000);
    }, []);

    return (
        <AccessibilityContext.Provider
            value={{
                settings,
                toggleHighContrast,
                toggleReducedMotion,
                setFontSize,
                toggleEnhancedFocus,
                announce,
            }}
        >
            {children}

            {/* Live region for announcements */}
            <div
                role="status"
                aria-live={announcement?.priority || 'polite'}
                aria-atomic="true"
                className="sr-only"
            >
                {announcement?.message}
            </div>
        </AccessibilityContext.Provider>
    );
}

export function useAccessibility() {
    const context = useContext(AccessibilityContext);
    if (context === undefined) {
        throw new Error('useAccessibility must be used within an AccessibilityProvider');
    }
    return context;
}
