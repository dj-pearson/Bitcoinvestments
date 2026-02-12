/**
 * AccessibilityWidget
 *
 * A persistent floating toolbar that gives users with disabilities immediate
 * access to accessibility controls from any page. Opens a panel with toggles
 * for high contrast, reduced motion, font size, and enhanced focus indicators.
 *
 * WCAG 2.1 Success Criteria addressed:
 * - 1.4.3 Contrast (Minimum) (Level AA) — high-contrast toggle
 * - 1.4.4 Resize Text (Level AA) — font-size controls
 * - 1.4.12 Text Spacing (Level AA) — respects user font scaling
 * - 2.3.1 Three Flashes or Below Threshold (Level A) — reduced-motion toggle
 * - 2.1.1 Keyboard (Level A) — fully keyboard operable
 * - 2.4.7 Focus Visible (Level AA) — enhanced focus toggle
 * - 4.1.2 Name, Role, Value (Level A) — proper ARIA throughout
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAccessibility } from './AccessibilityContext';

export function AccessibilityWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const {
    settings,
    toggleHighContrast,
    toggleReducedMotion,
    setFontSize,
    toggleEnhancedFocus,
  } = useAccessibility();

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        isOpen &&
        panelRef.current &&
        triggerRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Trap focus inside panel when open
  useEffect(() => {
    if (!isOpen || !panelRef.current) return;

    const panel = panelRef.current;
    const focusableElements = panel.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];

    // Focus first element when opening
    firstFocusable?.focus();

    const handleTabTrap = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          e.preventDefault();
          lastFocusable?.focus();
        }
      } else {
        if (document.activeElement === lastFocusable) {
          e.preventDefault();
          firstFocusable?.focus();
        }
      }
    };

    panel.addEventListener('keydown', handleTabTrap);
    return () => panel.removeEventListener('keydown', handleTabTrap);
  }, [isOpen]);

  const toggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const fontSizeOptions: Array<{ value: 'normal' | 'large' | 'larger'; label: string }> = [
    { value: 'normal', label: 'Default' },
    { value: 'large', label: 'Large' },
    { value: 'larger', label: 'Largest' },
  ];

  return (
    <div className="a11y-widget-container">
      {/* Floating trigger button — universal accessibility symbol */}
      <button
        ref={triggerRef}
        onClick={toggle}
        className="a11y-widget-trigger"
        aria-label={isOpen ? 'Close accessibility settings' : 'Open accessibility settings'}
        aria-expanded={isOpen}
        aria-controls="a11y-widget-panel"
        type="button"
      >
        {/* Universal accessibility icon (person with arms out) */}
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className="a11y-widget-icon"
        >
          <circle cx="12" cy="4.5" r="2.5" />
          <path d="M12 7v6" />
          <path d="M8 10h8" />
          <path d="M9 21l3-8 3 8" />
        </svg>
      </button>

      {/* Settings panel */}
      {isOpen && (
        <div
          ref={panelRef}
          id="a11y-widget-panel"
          role="dialog"
          aria-label="Accessibility settings"
          aria-modal="true"
          className="a11y-widget-panel"
        >
          <div className="a11y-widget-header">
            <h2 className="a11y-widget-title">Accessibility Settings</h2>
            <button
              onClick={() => {
                setIsOpen(false);
                triggerRef.current?.focus();
              }}
              className="a11y-widget-close"
              aria-label="Close accessibility settings"
              type="button"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <div className="a11y-widget-body">
            {/* High Contrast */}
            <div className="a11y-widget-option">
              <div className="a11y-widget-option-info">
                <span className="a11y-widget-option-label" id="hc-label">High Contrast</span>
                <span className="a11y-widget-option-desc" id="hc-desc">
                  Increase color contrast for better readability
                </span>
              </div>
              <button
                onClick={toggleHighContrast}
                className={`a11y-widget-toggle ${settings.highContrastMode ? 'a11y-widget-toggle--active' : ''}`}
                role="switch"
                aria-checked={settings.highContrastMode}
                aria-labelledby="hc-label"
                aria-describedby="hc-desc"
                type="button"
              >
                <span className="a11y-widget-toggle-thumb" />
              </button>
            </div>

            {/* Reduced Motion */}
            <div className="a11y-widget-option">
              <div className="a11y-widget-option-info">
                <span className="a11y-widget-option-label" id="rm-label">Reduce Motion</span>
                <span className="a11y-widget-option-desc" id="rm-desc">
                  Minimize animations and transitions
                </span>
              </div>
              <button
                onClick={toggleReducedMotion}
                className={`a11y-widget-toggle ${settings.reducedMotion ? 'a11y-widget-toggle--active' : ''}`}
                role="switch"
                aria-checked={settings.reducedMotion}
                aria-labelledby="rm-label"
                aria-describedby="rm-desc"
                type="button"
              >
                <span className="a11y-widget-toggle-thumb" />
              </button>
            </div>

            {/* Enhanced Focus */}
            <div className="a11y-widget-option">
              <div className="a11y-widget-option-info">
                <span className="a11y-widget-option-label" id="ef-label">Enhanced Focus</span>
                <span className="a11y-widget-option-desc" id="ef-desc">
                  Larger, more visible focus indicators
                </span>
              </div>
              <button
                onClick={toggleEnhancedFocus}
                className={`a11y-widget-toggle ${settings.focusIndicatorEnhanced ? 'a11y-widget-toggle--active' : ''}`}
                role="switch"
                aria-checked={settings.focusIndicatorEnhanced}
                aria-labelledby="ef-label"
                aria-describedby="ef-desc"
                type="button"
              >
                <span className="a11y-widget-toggle-thumb" />
              </button>
            </div>

            {/* Font Size */}
            <div className="a11y-widget-option a11y-widget-option--column">
              <div className="a11y-widget-option-info">
                <span className="a11y-widget-option-label" id="fs-label">Text Size</span>
                <span className="a11y-widget-option-desc" id="fs-desc">
                  Adjust the base font size
                </span>
              </div>
              <div
                className="a11y-widget-font-sizes"
                role="radiogroup"
                aria-labelledby="fs-label"
                aria-describedby="fs-desc"
              >
                {fontSizeOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setFontSize(opt.value)}
                    className={`a11y-widget-font-btn ${settings.fontSize === opt.value ? 'a11y-widget-font-btn--active' : ''}`}
                    role="radio"
                    aria-checked={settings.fontSize === opt.value}
                    type="button"
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="a11y-widget-footer">
            <div className="a11y-widget-shortcuts">
              <span className="a11y-widget-shortcuts-label">Keyboard shortcuts:</span>
              <span className="a11y-widget-shortcut"><kbd>Alt</kbd>+<kbd>H</kbd> Contrast</span>
              <span className="a11y-widget-shortcut"><kbd>Alt</kbd>+<kbd>M</kbd> Motion</span>
              <span className="a11y-widget-shortcut"><kbd>?</kbd> All shortcuts</span>
            </div>
            <Link
              to="/accessibility"
              className="a11y-widget-statement-link"
              onClick={() => setIsOpen(false)}
            >
              Full Accessibility Statement
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
