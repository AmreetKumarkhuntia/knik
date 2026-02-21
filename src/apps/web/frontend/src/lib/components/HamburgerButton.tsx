
import { MenuIcon } from './index';

interface HamburgerButtonProps {
    onClick: () => void;
}

export default function HamburgerButton({ onClick }: HamburgerButtonProps) {
    return (
        <button
            onClick={onClick}
            className="fixed top-6 left-6 z-20 w-11 h-11 bg-white/5 backdrop-blur-3xl border border-white/30 
                 rounded-lg flex items-center justify-center text-white hover:bg-white/10 
                 transition-all duration-200 shadow-2xl hover:scale-105"
            aria-label="Open sidebar"
        >
            <MenuIcon className="w-5 h-5" />
        </button>
    );
}
