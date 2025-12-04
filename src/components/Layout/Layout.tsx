import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';

export function Layout() {
    return (
        <div className="min-h-screen flex flex-col bg-brand-dark text-white selection:bg-brand-primary/30">
            <Header />
            <main className="flex-grow pt-20">
                <Outlet />
            </main>
            <Footer />
        </div>
    );
}
