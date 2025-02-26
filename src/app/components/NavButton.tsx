import { ReactNode } from 'react';

interface NavButtonProps {
    children: ReactNode;
    onClick: () => void; // onClick снова обязателен
    className?: string;
}

export default function NavButton({ children, onClick, className }: NavButtonProps) {
    return (
        <button
            onClick={onClick}
            className={`bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-all ${className}`}
        >
            {children}
        </button>
    );
}