// src/app/components/NavButton.tsx
import React from 'react';

interface NavButtonProps {
    children: React.ReactNode;
    onClick?: () => void;
    href?: string;
    className?: string;
    type?: 'button' | 'submit' | 'reset';
}

const NavButton = React.forwardRef<HTMLButtonElement | HTMLAnchorElement, NavButtonProps>(
    ({ children, onClick, href, className = '', type = 'button' }, ref) => {
        const baseStyles = 'px-4 py-2 rounded-lg font-semibold text-white transition-colors';

        if (href) {
            return (
                <a
                    href={href}
                    ref={ref as React.Ref<HTMLAnchorElement>}
                    className={`${baseStyles} ${className}`}
                    onClick={onClick}
                >
                    {children}
                </a>
            );
        }

        return (
            <button
                ref={ref as React.Ref<HTMLButtonElement>}
                type={type}
                onClick={onClick}
                className={`${baseStyles} ${className}`}
            >
                {children}
            </button>
        );
    }
);

NavButton.displayName = 'NavButton';

export default NavButton;