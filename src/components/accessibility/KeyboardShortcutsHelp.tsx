/**
 * KeyboardShortcutsHelp Component
 *
 * Provides a modal dialog showing available keyboard shortcuts.
 * Triggered by pressing '?' key or via accessibility menu.
 *
 * WCAG 2.1 Success Criteria:
 * - 2.1.1 Keyboard (Level A)
 * - 2.1.4 Character Key Shortcuts (Level A)
 * - 1.4.13 Content on Hover or Focus (Level AA)
 */

import { useEffect, useState, useRef, useCallback } from 'react';
import { X } from 'lucide-react';

interface ShortcutGroup {
    title: string;
    shortcuts: Array<{
        keys: string[];
        description: string;
    }>;
}

const shortcutGroups: ShortcutGroup[] = [
    {
        title: 'Navigation',
        shortcuts: [
            { keys: ['Tab'], description: 'Move to next interactive element' },
            { keys: ['Shift', 'Tab'], description: 'Move to previous interactive element' },
            { keys: ['Enter', 'Space'], description: 'Activate button or link' },
            { keys: ['Escape'], description: 'Close modal or dropdown' },
            { keys: ['Home'], description: 'Go to beginning of page' },
            { keys: ['End'], description: 'Go to end of page' },
        ],
    },
    {
        title: 'Accessibility',
        shortcuts: [
            { keys: ['?'], description: 'Open keyboard shortcuts help (this dialog)' },
            { keys: ['Alt', 'H'], description: 'Toggle high contrast mode' },
            { keys: ['Alt', 'M'], description: 'Toggle reduced motion' },
            { keys: ['/'], description: 'Focus search (when not in input)' },
        ],
    },
    {
        title: 'Menus & Dropdowns',
        shortcuts: [
            { keys: ['Arrow Down'], description: 'Move to next menu item' },
            { keys: ['Arrow Up'], description: 'Move to previous menu item' },
            { keys: ['Arrow Right'], description: 'Open submenu' },
            { keys: ['Arrow Left'], description: 'Close submenu' },
        ],
    },
];

export function KeyboardShortcutsHelp() {
    const [isOpen, setIsOpen] = useState(false);
    const dialogRef = useRef<HTMLDivElement>(null);
    const previousFocusRef = useRef<HTMLElement | null>(null);

    const openDialog = useCallback(() => {
        previousFocusRef.current = document.activeElement as HTMLElement;
        setIsOpen(true);
    }, []);

    const closeDialog = useCallback(() => {
        setIsOpen(false);
        // Return focus to the element that triggered the dialog
        if (previousFocusRef.current) {
            previousFocusRef.current.focus();
        }
    }, []);

    // Handle global keyboard shortcut to open dialog
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Don't trigger if user is typing in an input/textarea
            const target = e.target as HTMLElement;
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
                return;
            }

            if (e.key === '?' && !e.ctrlKey && !e.metaKey) {
                e.preventDefault();
                if (isOpen) {
                    closeDialog();
                } else {
                    openDialog();
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, openDialog, closeDialog]);

    // Handle escape key and focus trap
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                closeDialog();
                return;
            }

            // Focus trap
            if (e.key === 'Tab' && dialogRef.current) {
                const focusableElements = dialogRef.current.querySelectorAll<HTMLElement>(
                    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
                );
                const firstElement = focusableElements[0];
                const lastElement = focusableElements[focusableElements.length - 1];

                if (e.shiftKey && document.activeElement === firstElement) {
                    e.preventDefault();
                    lastElement.focus();
                } else if (!e.shiftKey && document.activeElement === lastElement) {
                    e.preventDefault();
                    firstElement.focus();
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, closeDialog]);

    // Focus the dialog when opened
    useEffect(() => {
        if (isOpen && dialogRef.current) {
            const closeButton = dialogRef.current.querySelector<HTMLButtonElement>('button');
            closeButton?.focus();
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            role="presentation"
        >
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={closeDialog}
                aria-hidden="true"
            />

            {/* Dialog */}
            <div
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="keyboard-shortcuts-title"
                className="relative z-10 w-full max-w-2xl max-h-[80vh] overflow-auto bg-brand-gray border border-white/10 rounded-xl shadow-2xl mx-4"
            >
                {/* Header */}
                <div className="sticky top-0 flex items-center justify-between p-4 bg-brand-gray border-b border-white/10">
                    <h2 id="keyboard-shortcuts-title" className="text-xl font-semibold text-white">
                        Keyboard Shortcuts
                    </h2>
                    <button
                        onClick={closeDialog}
                        className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors touch-target"
                        aria-label="Close keyboard shortcuts dialog"
                    >
                        <X className="w-5 h-5" aria-hidden="true" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 space-y-6">
                    {shortcutGroups.map((group) => (
                        <div key={group.title}>
                            <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">
                                {group.title}
                            </h3>
                            <dl className="space-y-2">
                                {group.shortcuts.map((shortcut, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-white/5"
                                    >
                                        <dt className="text-gray-300">{shortcut.description}</dt>
                                        <dd className="flex items-center gap-1">
                                            {shortcut.keys.map((key, keyIndex) => (
                                                <span key={keyIndex}>
                                                    <kbd className="inline-flex items-center justify-center min-w-[28px] px-2 py-1 text-xs font-mono font-medium text-gray-300 bg-brand-dark border border-white/20 rounded">
                                                        {key}
                                                    </kbd>
                                                    {keyIndex < shortcut.keys.length - 1 && (
                                                        <span className="mx-1 text-gray-500">+</span>
                                                    )}
                                                </span>
                                            ))}
                                        </dd>
                                    </div>
                                ))}
                            </dl>
                        </div>
                    ))}

                    {/* Accessibility note */}
                    <div className="pt-4 border-t border-white/10">
                        <p className="text-sm text-gray-400">
                            Press <kbd className="px-1.5 py-0.5 text-xs font-mono bg-brand-dark border border-white/20 rounded">?</kbd> at any time to show or hide this dialog.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
