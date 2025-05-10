// src/app/components/NavButton.tsx
import React from 'react';

interface NavButtonProps {
    children: React.ReactNode;
    onClick?: () => void;
    href?: string;
    className?: string;
    type?: 'button' | 'submit' | 'reset';
    disabled?: boolean;
    variant?: 'primary' | 'secondary' | 'outline';
}

const NavButton = React.forwardRef<HTMLButtonElement | HTMLAnchorElement, NavButtonProps>(
    ({ children, onClick, href, className = '', type = 'button', disabled = false, variant = 'primary' }, ref) => {
        // Base styles that are common to all variants
        const baseStyles = 'px-4 py-2 rounded-lg font-semibold transition-all duration-300 shadow-md';
        
        // Variant-specific styles
        const variantStyles = {
            primary: 'bg-indigo-600 hover:bg-indigo-700 text-white dark:bg-indigo-700 dark:hover:bg-indigo-800',
            secondary: 'bg-yellow-400 hover:bg-yellow-500 text-indigo-900 dark:bg-yellow-500 dark:hover:bg-yellow-600',
            outline: 'bg-transparent border-2 border-indigo-500 text-indigo-600 hover:bg-indigo-50 dark:border-indigo-400 dark:text-indigo-300 dark:hover:bg-indigo-900/30'
        };
        
        // Disabled styles
        const disabledStyles = disabled ? 'opacity-60 cursor-not-allowed' : '';

        if (href) {
            return (
                <a
                    href={href}
                    ref={ref as React.Ref<HTMLAnchorElement>}
                    className={`${baseStyles} ${variantStyles[variant]} ${className}`}
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
                className={`${baseStyles} ${variantStyles[variant]} ${className} ${disabledStyles}`}
                disabled={disabled}
            >
                {children}
            </button>
        );
    }
);

NavButton.displayName = 'NavButton';

export default NavButton;