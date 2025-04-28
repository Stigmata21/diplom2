import React from 'react';
import Link from 'next/link';

interface NavButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    href?: string;
    className?: string;
    children: React.ReactNode;
}

export default function NavButton({ href, className = '', children, ...props }: NavButtonProps) {
    const baseClasses = 'inline-flex items-center justify-center px-4 py-2 rounded-lg transition-colors duration-200';
    const finalClasses = `${baseClasses} ${className}`;

    if (href) {
        return (
            <Link href={href} className={finalClasses}>
                {children}
            </Link>
        );
    }

    return (
        <button className={finalClasses} {...props}>
            {children}
        </button>
    );
} 