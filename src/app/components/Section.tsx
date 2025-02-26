import { ReactNode } from 'react';

interface SectionProps {
    id: string;
    children: ReactNode;
    className?: string;
}

export default function Section({ id, children, className }: SectionProps) {
    return (
        <section id={id} className={`min-h-screen flex items-center justify-center ${className}`}>
            <div className="container mx-auto px-4 text-center">{children}</div>
        </section>
    );
}