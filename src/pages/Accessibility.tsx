/**
 * Accessibility Statement Page
 *
 * Comprehensive accessibility statement documenting WCAG 2.1 compliance,
 * available accessibility features, and contact information.
 *
 * WCAG 2.1 Success Criteria:
 * - All applicable criteria documented
 */

import { useEffect } from 'react';
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
    AlertCircle,
    Mail,
    ExternalLink,
} from 'lucide-react';
import { useSEO } from '../hooks/useSEO';
import { useAccessibility } from '../components/accessibility/AccessibilityContext';

// Fixed date of the last accessibility review. Update when a review is done;
// do not render a live clock, which would falsely show today's date every visit.
const LAST_REVIEWED = 'July 23, 2026';

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
            'Tab navigation through all interactive elements',
            'Enter/Space to activate buttons and links',
            'Arrow keys for menu navigation',
            'Escape to close modals and dropdowns',
            'Skip links to bypass navigation',
        ],
    },
    {
        icon: Eye,
        title: 'Screen Reader Support',
        description: 'Compatible with popular screen readers',
        features: [
            'Semantic HTML structure',
            'ARIA labels and descriptions',
            'Live regions for dynamic content',
            'Descriptive link text',
            'Image alt text throughout',
        ],
    },
    {
        icon: Palette,
        title: 'Visual Accessibility',
        description: 'Optimized for visual impairments',
        features: [
            'WCAG AA color contrast ratios',
            'High contrast mode (Alt + H)',
            'No color-only information',
            'Clear focus indicators',
            'Consistent visual design',
        ],
    },
    {
        icon: Type,
        title: 'Text & Readability',
        description: 'Readable and resizable content',
        features: [
            'Adjustable font sizes',
            'Clear typography with good line height',
            'Proper heading hierarchy',
            'Readable paragraph lengths',
            'Support for browser zoom up to 200%',
        ],
    },
    {
        icon: MousePointer2,
        title: 'Motor Accessibility',
        description: 'Designed for various input methods',
        features: [
            '44x44px minimum touch targets',
            'No time-limited interactions',
            'Reduced motion mode (Alt + M)',
            'No keyboard traps',
            'Single-click activation',
        ],
    },
    {
        icon: Volume2,
        title: 'Audio & Multimedia',
        description: 'Accessible media content',
        features: [
            'No auto-playing audio',
            'Text alternatives for media',
            'Visual indicators for alerts',
            'No seizure-inducing content',
            'Pause/stop controls where needed',
        ],
    },
];

const wcagCriteria = [
    {
        level: 'A',
        title: 'Level A (Minimum)',
        criteria: [
            { id: '1.1.1', name: 'Non-text Content', status: 'pass' },
            { id: '1.3.1', name: 'Info and Relationships', status: 'partial' },
            { id: '1.3.2', name: 'Meaningful Sequence', status: 'pass' },
            { id: '1.4.1', name: 'Use of Color', status: 'pass' },
            { id: '2.1.1', name: 'Keyboard', status: 'partial' },
            { id: '2.1.2', name: 'No Keyboard Trap', status: 'pass' },
            { id: '2.4.1', name: 'Bypass Blocks', status: 'pass' },
            { id: '2.4.2', name: 'Page Titled', status: 'pass' },
            { id: '2.4.3', name: 'Focus Order', status: 'partial' },
            { id: '2.4.4', name: 'Link Purpose (In Context)', status: 'pass' },
            { id: '3.1.1', name: 'Language of Page', status: 'pass' },
            { id: '3.2.1', name: 'On Focus', status: 'pass' },
            { id: '3.2.2', name: 'On Input', status: 'pass' },
            { id: '3.3.1', name: 'Error Identification', status: 'pass' },
            { id: '3.3.2', name: 'Labels or Instructions', status: 'partial' },
            { id: '4.1.1', name: 'Parsing', status: 'pass' },
            { id: '4.1.2', name: 'Name, Role, Value', status: 'partial' },
        ],
    },
    {
        level: 'AA',
        title: 'Level AA (Recommended)',
        criteria: [
            { id: '1.3.4', name: 'Orientation', status: 'pass' },
            { id: '1.3.5', name: 'Identify Input Purpose', status: 'pass' },
            { id: '1.4.3', name: 'Contrast (Minimum)', status: 'partial' },
            { id: '1.4.4', name: 'Resize Text', status: 'pass' },
            { id: '1.4.5', name: 'Images of Text', status: 'pass' },
            { id: '1.4.10', name: 'Reflow', status: 'pass' },
            { id: '1.4.11', name: 'Non-text Contrast', status: 'pass' },
            { id: '1.4.12', name: 'Text Spacing', status: 'pass' },
            { id: '1.4.13', name: 'Content on Hover or Focus', status: 'pass' },
            { id: '2.4.5', name: 'Multiple Ways', status: 'pass' },
            { id: '2.4.6', name: 'Headings and Labels', status: 'pass' },
            { id: '2.4.7', name: 'Focus Visible', status: 'pass' },
            { id: '3.1.2', name: 'Language of Parts', status: 'pass' },
            { id: '3.2.3', name: 'Consistent Navigation', status: 'pass' },
            { id: '3.2.4', name: 'Consistent Identification', status: 'pass' },
            { id: '3.3.3', name: 'Error Suggestion', status: 'pass' },
            { id: '3.3.4', name: 'Error Prevention', status: 'pass' },
            { id: '4.1.3', name: 'Status Messages', status: 'pass' },
        ],
    },
];

export function Accessibility() {
    const { settings, toggleHighContrast, toggleReducedMotion, setFontSize } = useAccessibility();

    useSEO({
        title: 'Accessibility Statement',
        description: 'Learn about our commitment to accessibility and WCAG 2.1 AA compliance at Bitcoinvestments.',
    });

    useEffect(() => {
        document.title = 'Accessibility Statement | Bitcoinvestments';
    }, []);

    return (
        <div className="min-h-screen py-12">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <header className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                        Accessibility Statement
                    </h1>
                    <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                        Bitcoinvestments is committed to ensuring digital accessibility for people with disabilities.
                        We continually improve the user experience for everyone.
                    </p>
                </header>

                {/* Conformance Status */}
                <section aria-labelledby="conformance-heading" className="mb-12">
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-6">
                        <div className="flex items-start gap-4">
                            <AlertCircle className="w-8 h-8 text-amber-400 flex-shrink-0" aria-hidden="true" />
                            <div>
                                <h2 id="conformance-heading" className="text-xl font-semibold text-white mb-2">
                                    WCAG 2.1 Level AA — Partially Conformant
                                </h2>
                                <p className="text-gray-300">
                                    Bitcoinvestments aims to conform to the Web Content Accessibility Guidelines
                                    (WCAG) 2.1 Level AA. We are currently <strong>partially conformant</strong>:
                                    most of the site meets these standards, and we are actively remediating the
                                    remaining known issues (see the success-criteria list below). "Partially
                                    conformant" means some parts of the content do not yet fully conform.
                                </p>
                                <p className="text-sm text-gray-400 mt-2">
                                    Last reviewed: {LAST_REVIEWED}
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
                        <label className="block text-white font-medium mb-3">
                            <Type className="w-5 h-5 inline-block mr-2" aria-hidden="true" />
                            Text Size
                        </label>
                        <div className="flex gap-2" role="radiogroup" aria-label="Font size selection">
                            {(['normal', 'large', 'larger'] as const).map((size) => (
                                <button
                                    key={size}
                                    onClick={() => setFontSize(size)}
                                    className={`px-4 py-2 rounded-lg border transition-all capitalize ${
                                        settings.fontSize === size
                                            ? 'bg-brand-primary border-brand-primary text-white'
                                            : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                                    }`}
                                    role="radio"
                                    aria-checked={settings.fontSize === size}
                                >
                                    {size}
                                </button>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Accessibility Features */}
                <section aria-labelledby="features-heading" className="mb-12">
                    <h2 id="features-heading" className="text-2xl font-bold text-white mb-6">
                        Accessibility Features
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
                                        {feature.features.map((item, index) => (
                                            <li key={index} className="flex items-start gap-2 text-sm text-gray-300">
                                                <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
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
                                <tr>
                                    <td className="px-4 py-3">
                                        <kbd className="px-2 py-1 bg-brand-dark border border-white/20 rounded text-sm font-mono">/</kbd>
                                    </td>
                                    <td className="px-4 py-3 text-gray-300">Focus search</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* WCAG Compliance Details */}
                <section aria-labelledby="wcag-heading" className="mb-12">
                    <h2 id="wcag-heading" className="text-2xl font-bold text-white mb-6">
                        WCAG 2.1 Compliance Status
                    </h2>
                    <p className="text-gray-400 mb-6">
                        Below is a detailed breakdown of our compliance with WCAG 2.1 success criteria.
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
                                                {criterion.status === 'pass' ? (
                                                    <>
                                                        <CheckCircle2 className="w-4 h-4 text-green-400" aria-hidden="true" />
                                                        <span className="text-green-400">Pass</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <AlertCircle className="w-4 h-4 text-amber-400" aria-hidden="true" />
                                                        <span className="text-amber-400">In Progress</span>
                                                    </>
                                                )}
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
                            This website is designed and being tested for compatibility with the following
                            assistive technologies:
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
                                    <CheckCircle2 className="w-4 h-4 text-green-400" aria-hidden="true" />
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
