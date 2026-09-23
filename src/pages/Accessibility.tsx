/**
 * Accessibility Statement Page
 *
 * Accessibility statement: our WCAG 2.2 AA target, a self-assessed status per
 * criterion, known issues, display settings and how to report a barrier.
 *
 * Statuses are self-assessed, not an independent audit. Only mark a criterion
 * "no known issues" after checking it; otherwise use "not yet reviewed".
 */

import { Link } from 'react-router-dom';
import {
    Eye,
    Keyboard,
    MousePointer2,
    Volume2,
    Palette,
    Type,
    MonitorSmartphone,
    CheckCircle2,
    HelpCircle,
    AlertCircle,
    Mail,
    ExternalLink,
} from 'lucide-react';
import { useAccessibility } from '../components/accessibility/AccessibilityContext';
import { PageSEO } from '../components/PageSEO';

// Fixed date of the last accessibility review. Update when a review is done;
// do not render a live clock, which would falsely show today's date every visit.
const LAST_REVIEWED = 'September 23, 2026';
const LAST_REVIEWED_ISO = '2026-09-23';

const FONT_SIZES = ['normal', 'large', 'larger'] as const;

interface AccessibilityFeature {
    icon: React.ElementType;
    title: string;
    description: string;
    features: string[];
}

const accessibilityFeatures: AccessibilityFeature[] = [
    {
        icon: Keyboard,
        title: 'Keyboard Navigation',
        description: 'Full keyboard support for all functionality',
        features: [
            'Tab and Shift+Tab move between links, buttons and form fields',
            'Enter/Space activate buttons and links',
            'Escape closes dialogs and dropdowns',
            'Skip link to jump past the navigation',
        ],
    },
    {
        icon: Eye,
        title: 'Screen Reader Support',
        description: 'Built with screen readers in mind',
        features: [
            'Semantic HTML: headings, landmarks, lists and tables',
            'Page changes announced after navigation',
            'Live regions for form results and loading states',
            'Decorative icons hidden from assistive technology',
        ],
    },
    {
        icon: Palette,
        title: 'Visual Accessibility',
        description: 'Settings for low vision and colour needs',
        features: [
            'High contrast mode (Alt + H)',
            'Visible focus indicators',
            'Aiming for WCAG AA colour contrast (see known issues)',
        ],
    },
    {
        icon: Type,
        title: 'Text & Readability',
        description: 'Readable and resizable content',
        features: [
            'Adjustable text size (below)',
            'Text resizes with browser zoom',
            'One H1 per page and ordered headings',
        ],
    },
    {
        icon: MousePointer2,
        title: 'Motor Accessibility',
        description: 'Designed for various input methods',
        features: [
            'No time limits on anything you do on the site',
            'Reduced motion mode (Alt + M), which also follows your system setting',
            'Moving price ticker on the home page can be paused',
        ],
    },
    {
        icon: Volume2,
        title: 'Audio & Multimedia',
        description: 'Media and motion',
        features: [
            'No auto-playing audio',
            'No flashing content',
        ],
    },
];

type CriterionStatus = 'ok' | 'partial' | 'unreviewed';

const STATUS_LABEL: Record<CriterionStatus, string> = {
    ok: 'No known issues',
    partial: 'Known issues',
    unreviewed: 'Not yet reviewed',
};

// WCAG 2.2. 4.1.1 Parsing is obsolete in 2.2 and no longer listed.
const wcagCriteria: Array<{
    level: string;
    title: string;
    criteria: Array<{ id: string; name: string; status: CriterionStatus }>;
}> = [
    {
        level: 'A',
        title: 'Level A',
        criteria: [
            { id: '1.1.1', name: 'Non-text Content', status: 'partial' },
            { id: '1.3.1', name: 'Info and Relationships', status: 'partial' },
            { id: '1.3.2', name: 'Meaningful Sequence', status: 'unreviewed' },
            { id: '1.4.1', name: 'Use of Color', status: 'partial' },
            { id: '2.1.1', name: 'Keyboard', status: 'partial' },
            { id: '2.1.2', name: 'No Keyboard Trap', status: 'unreviewed' },
            { id: '2.2.2', name: 'Pause, Stop, Hide', status: 'partial' },
            { id: '2.4.1', name: 'Bypass Blocks', status: 'ok' },
            { id: '2.4.2', name: 'Page Titled', status: 'partial' },
            { id: '2.4.3', name: 'Focus Order', status: 'partial' },
            { id: '2.4.4', name: 'Link Purpose (In Context)', status: 'partial' },
            { id: '3.1.1', name: 'Language of Page', status: 'ok' },
            { id: '3.2.1', name: 'On Focus', status: 'unreviewed' },
            { id: '3.2.2', name: 'On Input', status: 'unreviewed' },
            { id: '3.2.6', name: 'Consistent Help', status: 'unreviewed' },
            { id: '3.3.1', name: 'Error Identification', status: 'unreviewed' },
            { id: '3.3.2', name: 'Labels or Instructions', status: 'partial' },
            { id: '3.3.7', name: 'Redundant Entry', status: 'unreviewed' },
            { id: '4.1.2', name: 'Name, Role, Value', status: 'partial' },
        ],
    },
    {
        level: 'AA',
        title: 'Level AA',
        criteria: [
            { id: '1.3.4', name: 'Orientation', status: 'unreviewed' },
            { id: '1.3.5', name: 'Identify Input Purpose', status: 'unreviewed' },
            { id: '1.4.3', name: 'Contrast (Minimum)', status: 'partial' },
            { id: '1.4.4', name: 'Resize Text', status: 'unreviewed' },
            { id: '1.4.5', name: 'Images of Text', status: 'unreviewed' },
            { id: '1.4.10', name: 'Reflow', status: 'unreviewed' },
            { id: '1.4.11', name: 'Non-text Contrast', status: 'unreviewed' },
            { id: '1.4.12', name: 'Text Spacing', status: 'unreviewed' },
            { id: '1.4.13', name: 'Content on Hover or Focus', status: 'partial' },
            { id: '2.4.5', name: 'Multiple Ways', status: 'ok' },
            { id: '2.4.6', name: 'Headings and Labels', status: 'unreviewed' },
            { id: '2.4.7', name: 'Focus Visible', status: 'unreviewed' },
            { id: '2.4.11', name: 'Focus Not Obscured (Minimum)', status: 'unreviewed' },
            { id: '2.5.7', name: 'Dragging Movements', status: 'unreviewed' },
            { id: '2.5.8', name: 'Target Size (Minimum)', status: 'unreviewed' },
            { id: '3.1.2', name: 'Language of Parts', status: 'unreviewed' },
            { id: '3.2.3', name: 'Consistent Navigation', status: 'ok' },
            { id: '3.2.4', name: 'Consistent Identification', status: 'unreviewed' },
            { id: '3.3.3', name: 'Error Suggestion', status: 'unreviewed' },
            { id: '3.3.4', name: 'Error Prevention (Legal, Financial, Data)', status: 'unreviewed' },
            { id: '3.3.8', name: 'Accessible Authentication (Minimum)', status: 'unreviewed' },
            { id: '4.1.3', name: 'Status Messages', status: 'partial' },
        ],
    },
];

// Problems we know about. Remove an item only once it is fixed and checked.
const KNOWN_ISSUES = [
    'Between roughly 1024 and 1279 pixels wide, the main navigation shows icons without visible text labels, and screen readers may not announce a name for them.',
    'In the mobile menu, links inside collapsed sections can still receive keyboard focus.',
    'The site search suggestions do not yet use combobox semantics, so screen readers may not announce the highlighted suggestion.',
    'Some charts convey information mainly through colour and do not yet have a text or table alternative.',
    'Some hover tooltips cannot be reached with the keyboard or dismissed with Escape.',
    'Some text, especially small grey text on dark backgrounds, may fall below the 4.5:1 contrast ratio.',
    'Pages without their own title and description can briefly keep the previous page\'s title after navigation.',
];

export function Accessibility() {
    const { settings, toggleHighContrast, toggleReducedMotion, setFontSize } = useAccessibility();

    return (
        <div className="min-h-screen py-12">
            <PageSEO pageKey="accessibility" urlPath="/accessibility" />
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <header className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                        Accessibility Statement
                    </h1>
                    <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                        We aim for Bitcoinvestments to meet WCAG 2.2 Level AA. It doesn&apos;t yet: parts of the
                        site are partially conformant, and the known problems are listed below. This statement is
                        based on our own review, not an independent audit.
                    </p>
                </header>

                {/* Conformance Status */}
                <section aria-labelledby="conformance-heading" className="mb-12">
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-6">
                        <div className="flex items-start gap-4">
                            <AlertCircle className="w-8 h-8 text-amber-400 flex-shrink-0" aria-hidden="true" />
                            <div>
                                <h2 id="conformance-heading" className="text-xl font-semibold text-white mb-2">
                                    WCAG 2.2 Level AA — Partially Conformant
                                </h2>
                                <p className="text-gray-300">
                                    Our target is the Web Content Accessibility Guidelines (WCAG) 2.2 Level AA.
                                    The site is <strong>partially conformant</strong>: some content does not yet
                                    fully conform. See the known issues and the per-criterion status below.
                                </p>
                                <p className="text-sm text-gray-400 mt-2">
                                    Last reviewed: <time dateTime={LAST_REVIEWED_ISO}>{LAST_REVIEWED}</time>
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Accessibility Preferences */}
                <section aria-labelledby="preferences-heading" className="mb-12">
                    <h2 id="preferences-heading" className="text-2xl font-bold text-white mb-6">
                        Accessibility Preferences
                    </h2>
                    <p className="text-gray-400 mb-6">
                        Customize your experience with these accessibility options. Your preferences are saved
                        and will persist across sessions.
                    </p>

                    <div className="grid sm:grid-cols-2 gap-4">
                        {/* High Contrast Toggle */}
                        <button
                            onClick={toggleHighContrast}
                            className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                                settings.highContrastMode
                                    ? 'bg-brand-primary/20 border-brand-primary text-white'
                                    : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                            }`}
                            aria-pressed={settings.highContrastMode}
                        >
                            <div className="flex items-center gap-3">
                                <Palette className="w-5 h-5" aria-hidden="true" />
                                <span className="font-medium">High Contrast</span>
                            </div>
                            <span className="text-sm">
                                {settings.highContrastMode ? 'On' : 'Off'} (Alt+H)
                            </span>
                        </button>

                        {/* Reduced Motion Toggle */}
                        <button
                            onClick={toggleReducedMotion}
                            className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                                settings.reducedMotion
                                    ? 'bg-brand-primary/20 border-brand-primary text-white'
                                    : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                            }`}
                            aria-pressed={settings.reducedMotion}
                        >
                            <div className="flex items-center gap-3">
                                <MonitorSmartphone className="w-5 h-5" aria-hidden="true" />
                                <span className="font-medium">Reduced Motion</span>
                            </div>
                            <span className="text-sm">
                                {settings.reducedMotion ? 'On' : 'Off'} (Alt+M)
                            </span>
                        </button>
                    </div>

                    {/* Font Size Options */}
                    <div className="mt-6">
                        <p id="text-size-label" className="block text-white font-medium mb-3">
                            <Type className="w-5 h-5 inline-block mr-2" aria-hidden="true" />
                            Text size
                        </p>
                        <div
                            className="flex gap-2"
                            role="radiogroup"
                            aria-labelledby="text-size-label"
                            onKeyDown={(e) => {
                                const i = FONT_SIZES.indexOf(settings.fontSize as (typeof FONT_SIZES)[number]);
                                let next = -1;
                                if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (i + 1) % FONT_SIZES.length;
                                if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = (i - 1 + FONT_SIZES.length) % FONT_SIZES.length;
                                if (next === -1) return;
                                e.preventDefault();
                                setFontSize(FONT_SIZES[next]);
                                const buttons = e.currentTarget.querySelectorAll<HTMLButtonElement>('[role="radio"]');
                                buttons[next]?.focus();
                            }}
                        >
                            {FONT_SIZES.map((size) => {
                                const checked = settings.fontSize === size;
                                return (
                                    <button
                                        key={size}
                                        type="button"
                                        onClick={() => setFontSize(size)}
                                        className={`px-4 py-2 rounded-lg border transition-all capitalize ${
                                            checked
                                                ? 'bg-brand-primary border-brand-primary text-white'
                                                : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                                        }`}
                                        role="radio"
                                        aria-checked={checked}
                                        tabIndex={checked ? 0 : -1}
                                    >
                                        {size}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </section>

                {/* Known issues */}
                <section aria-labelledby="known-issues-heading" className="mb-12">
                    <h2 id="known-issues-heading" className="text-2xl font-bold text-white mb-6">
                        Known issues
                    </h2>
                    <ul className="list-disc pl-6 space-y-2 text-gray-300">
                        {KNOWN_ISSUES.map((issue) => (
                            <li key={issue}>{issue}</li>
                        ))}
                    </ul>
                    <p className="text-gray-400 mt-4">
                        If one of these stops you doing something, email us (below) and we&apos;ll help you
                        another way.
                    </p>
                </section>

                {/* Accessibility Features */}
                <section aria-labelledby="features-heading" className="mb-12">
                    <h2 id="features-heading" className="text-2xl font-bold text-white mb-6">
                        What we have built in
                    </h2>
                    <div className="grid md:grid-cols-2 gap-6">
                        {accessibilityFeatures.map((feature) => {
                            const Icon = feature.icon;
                            return (
                                <div
                                    key={feature.title}
                                    className="bg-white/5 border border-white/10 rounded-xl p-6"
                                >
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="p-2 bg-brand-primary/20 rounded-lg">
                                            <Icon className="w-5 h-5 text-brand-primary" aria-hidden="true" />
                                        </div>
                                        <h3 className="text-lg font-semibold text-white">{feature.title}</h3>
                                    </div>
                                    <p className="text-gray-400 mb-4">{feature.description}</p>
                                    <ul className="space-y-2">
                                        {feature.features.map((item) => (
                                            <li key={item} className="flex items-start gap-2 text-sm text-gray-300">
                                                <span className="w-1.5 h-1.5 rounded-full bg-gray-400 flex-shrink-0 mt-2" aria-hidden="true" />
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* Keyboard Shortcuts */}
                <section aria-labelledby="shortcuts-heading" className="mb-12">
                    <h2 id="shortcuts-heading" className="text-2xl font-bold text-white mb-6">
                        Keyboard Shortcuts
                    </h2>
                    <p className="text-gray-400 mb-4">
                        Press <kbd className="px-2 py-1 bg-brand-dark border border-white/20 rounded text-sm font-mono">?</kbd> at
                        any time to view all available keyboard shortcuts.
                    </p>
                    <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                        <table className="w-full" role="table">
                            <caption className="sr-only">Keyboard shortcuts</caption>
                            <thead>
                                <tr className="border-b border-white/10">
                                    <th scope="col" className="text-left px-4 py-3 text-sm font-medium text-gray-400">
                                        Shortcut
                                    </th>
                                    <th scope="col" className="text-left px-4 py-3 text-sm font-medium text-gray-400">
                                        Action
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                <tr>
                                    <td className="px-4 py-3">
                                        <kbd className="px-2 py-1 bg-brand-dark border border-white/20 rounded text-sm font-mono">Tab</kbd>
                                    </td>
                                    <td className="px-4 py-3 text-gray-300">Navigate to next element</td>
                                </tr>
                                <tr>
                                    <td className="px-4 py-3">
                                        <kbd className="px-2 py-1 bg-brand-dark border border-white/20 rounded text-sm font-mono">Shift + Tab</kbd>
                                    </td>
                                    <td className="px-4 py-3 text-gray-300">Navigate to previous element</td>
                                </tr>
                                <tr>
                                    <td className="px-4 py-3">
                                        <kbd className="px-2 py-1 bg-brand-dark border border-white/20 rounded text-sm font-mono">Escape</kbd>
                                    </td>
                                    <td className="px-4 py-3 text-gray-300">Close modal or dropdown</td>
                                </tr>
                                <tr>
                                    <td className="px-4 py-3">
                                        <kbd className="px-2 py-1 bg-brand-dark border border-white/20 rounded text-sm font-mono">Alt + H</kbd>
                                    </td>
                                    <td className="px-4 py-3 text-gray-300">Toggle high contrast mode</td>
                                </tr>
                                <tr>
                                    <td className="px-4 py-3">
                                        <kbd className="px-2 py-1 bg-brand-dark border border-white/20 rounded text-sm font-mono">Alt + M</kbd>
                                    </td>
                                    <td className="px-4 py-3 text-gray-300">Toggle reduced motion</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* WCAG Compliance Details */}
                <section aria-labelledby="wcag-heading" className="mb-12">
                    <h2 id="wcag-heading" className="text-2xl font-bold text-white mb-6">
                        WCAG 2.2 status by criterion
                    </h2>
                    <p className="text-gray-400 mb-6">
                        Self-assessed status for each WCAG 2.2 Level A and AA success criterion. &ldquo;No known
                        issues&rdquo; means we checked and found none, not that an auditor certified it.
                    </p>

                    {wcagCriteria.map((level) => (
                        <div key={level.level} className="mb-8">
                            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                                    level.level === 'A' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'
                                }`}>
                                    {level.level}
                                </span>
                                {level.title}
                            </h3>
                            <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                                <div className="grid gap-1 p-2">
                                    {level.criteria.map((criterion) => (
                                        <div
                                            key={criterion.id}
                                            className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white/5"
                                        >
                                            <span className="text-gray-300">
                                                <span className="text-gray-500 font-mono text-sm mr-2">{criterion.id}</span>
                                                {criterion.name}
                                            </span>
                                            <span className="flex items-center gap-1 text-sm">
                                                {criterion.status === 'ok' ? (
                                                    <CheckCircle2 className="w-4 h-4 text-green-400" aria-hidden="true" />
                                                ) : criterion.status === 'partial' ? (
                                                    <AlertCircle className="w-4 h-4 text-amber-400" aria-hidden="true" />
                                                ) : (
                                                    <HelpCircle className="w-4 h-4 text-gray-400" aria-hidden="true" />
                                                )}
                                                <span
                                                    className={
                                                        criterion.status === 'ok'
                                                            ? 'text-green-400'
                                                            : criterion.status === 'partial'
                                                              ? 'text-amber-400'
                                                              : 'text-gray-400'
                                                    }
                                                >
                                                    {STATUS_LABEL[criterion.status]}
                                                </span>
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </section>

                {/* Assistive Technology Compatibility */}
                <section aria-labelledby="compat-heading" className="mb-12">
                    <h2 id="compat-heading" className="text-2xl font-bold text-white mb-6">
                        Assistive Technology Compatibility
                    </h2>
                    <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                        <p className="text-gray-300 mb-4">
                            We have not finished testing with assistive technology. These are the tools we
                            intend to test with:
                        </p>
                        <ul className="grid sm:grid-cols-2 gap-3">
                            {[
                                'NVDA (Windows)',
                                'JAWS (Windows)',
                                'VoiceOver (macOS/iOS)',
                                'TalkBack (Android)',
                                'Dragon NaturallySpeaking',
                                'ZoomText',
                            ].map((tech) => (
                                <li key={tech} className="flex items-center gap-2 text-gray-300">
                                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400" aria-hidden="true" />
                                    {tech}
                                </li>
                            ))}
                        </ul>
                    </div>
                </section>

                {/* Feedback & Contact */}
                <section aria-labelledby="feedback-heading" className="mb-12">
                    <h2 id="feedback-heading" className="text-2xl font-bold text-white mb-6">
                        Feedback & Contact
                    </h2>
                    <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                        <p className="text-gray-300 mb-4">
                            We welcome your feedback on the accessibility of Bitcoinvestments. Please let us know if you
                            encounter accessibility barriers:
                        </p>
                        <ul className="space-y-3 mb-6">
                            <li className="flex items-center gap-2 text-gray-300">
                                <Mail className="w-4 h-4 text-brand-primary" aria-hidden="true" />
                                <span>Email: </span>
                                <a
                                    href="mailto:accessibility@bitcoinvestments.net"
                                    className="text-brand-primary hover:text-brand-primary/80 underline"
                                >
                                    accessibility@bitcoinvestments.net
                                </a>
                            </li>
                        </ul>
                        <p className="text-gray-400 text-sm">
                            We try to respond to accessibility feedback within 2 business days.
                        </p>
                    </div>
                </section>

                {/* Legal & Resources */}
                <section aria-labelledby="resources-heading" className="mb-12">
                    <h2 id="resources-heading" className="text-2xl font-bold text-white mb-6">
                        Additional Resources
                    </h2>
                    <div className="grid sm:grid-cols-2 gap-4">
                        <a
                            href="https://www.w3.org/WAI/standards-guidelines/wcag/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors"
                        >
                            <ExternalLink className="w-5 h-5 text-brand-primary" aria-hidden="true" />
                            <div>
                                <span className="block text-white font-medium">WCAG Guidelines</span>
                                <span className="text-sm text-gray-400">W3C Web Accessibility Initiative</span>
                            </div>
                        </a>
                        <a
                            href="https://www.ada.gov/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors"
                        >
                            <ExternalLink className="w-5 h-5 text-brand-primary" aria-hidden="true" />
                            <div>
                                <span className="block text-white font-medium">ADA.gov</span>
                                <span className="text-sm text-gray-400">Americans with Disabilities Act</span>
                            </div>
                        </a>
                    </div>
                </section>

                {/* Related Pages */}
                <nav aria-label="Related pages" className="border-t border-white/10 pt-8">
                    <h2 className="text-lg font-semibold text-white mb-4">Related Pages</h2>
                    <div className="flex flex-wrap gap-4">
                        <Link
                            to="/privacy"
                            className="text-brand-primary hover:text-brand-primary/80 underline"
                        >
                            Privacy Policy
                        </Link>
                        <Link
                            to="/terms"
                            className="text-brand-primary hover:text-brand-primary/80 underline"
                        >
                            Terms of Service
                        </Link>
                        <Link
                            to="/disclaimer"
                            className="text-brand-primary hover:text-brand-primary/80 underline"
                        >
                            Disclaimer
                        </Link>
                    </div>
                </nav>
            </div>
        </div>
    );
}
