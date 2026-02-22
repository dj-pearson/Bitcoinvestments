import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';
import { CookieConsent } from '../CookieConsent';
import { Breadcrumbs } from '../Breadcrumbs';
import { BackToTop } from '../BackToTop';
import { SkipLinks } from '../accessibility/SkipLinks';
import { RouteAnnouncer } from '../accessibility/RouteAnnouncer';
import { KeyboardShortcutsHelp } from '../accessibility/KeyboardShortcutsHelp';
import { AccessibilityWidget } from '../accessibility/AccessibilityWidget';

export function Layout() {
    return (
        <div className="min-h-screen flex flex-col bg-brand-dark text-white selection:bg-brand-primary/30">
            <SkipLinks />
            <RouteAnnouncer />
            <KeyboardShortcutsHelp />
            <Header />
            <main id="main-content" className="flex-grow pt-20" role="main" tabIndex={-1}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <Breadcrumbs className="py-3 mb-2" />
                </div>
                <Outlet />
            </main>
            <Footer />
            <BackToTop />
            <CookieConsent />
            <AccessibilityWidget />
        </div>
    );
}
