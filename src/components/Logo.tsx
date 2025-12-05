

export function Logo({ className = "", showText = true }: { className?: string, showText?: boolean }) {
    return (
        <div className={`flex items-center gap-2 group ${className}`}>
            <div className="relative w-10 h-10 transition-transform group-hover:scale-105">
                <img
                    src="/favicon.svg"
                    alt="Bitcoinvestments Logo"
                    className="w-full h-full object-contain filter drop-shadow-[0_0_10px_rgba(139,92,246,0.3)]"
                />
            </div>
            {showText && (
                <span className="text-xl font-bold tracking-tight text-white">
                    Bitcoin<span className="text-brand-primary">vestments</span>
                </span>
            )}
        </div>
    );
}
