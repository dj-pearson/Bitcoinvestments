/**
 * SkipLinks Component
 *
 * Provides keyboard-accessible skip links for screen reader users and keyboard navigators
 * to bypass repetitive navigation and jump directly to main content areas.
 *
 * WCAG 2.1 Success Criteria:
 * - 2.4.1 Bypass Blocks (Level A)
 * - 2.1.1 Keyboard (Level A)
 */

export function SkipLinks() {
    const skipLinks = [
        { id: 'main-content', label: 'Skip to main content' },
        { id: 'navigation', label: 'Skip to navigation' },
        { id: 'footer', label: 'Skip to footer' },
    ];

    const handleSkipClick = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
        e.preventDefault();
        const target = document.getElementById(targetId);
        if (target) {
            target.focus();
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    return (
        <nav
            aria-label="Skip links"
            className="skip-links-container"
        >
            <ul className="skip-links-list">
                {skipLinks.map((link) => (
                    <li key={link.id}>
                        <a
                            href={`#${link.id}`}
                            className="skip-link"
                            onClick={(e) => handleSkipClick(e, link.id)}
                        >
                            {link.label}
                        </a>
                    </li>
                ))}
            </ul>
        </nav>
    );
}
