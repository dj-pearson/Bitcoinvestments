import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';
import { CookieConsent } from '../CookieConsent';
import { Breadcrumbs } from '../Breadcrumbs';

export function Layout() {
    return (
        <div className="min-h-screen flex flex-col bg-brand-dark text-white selection:bg-brand-primary/30">
            <Header />
            <main className="flex-grow pt-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <Breadcrumbs className="py-3 mb-2" />
                </div>
                <Outlet />
            </main>
            <Footer />
            <CookieConsent />
        </div>
    );
}
