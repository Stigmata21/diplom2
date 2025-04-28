'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Inter } from 'next/font/google';
import './globals.css'
import { ThemeProvider } from 'next-themes';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="ru" suppressHydrationWarning>
        <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <AnimatePresence mode="wait">
                <motion.div
                    key={typeof window !== 'undefined' ? window.location.pathname : 'page'}
                    initial={{ opacity: 0, x: 100 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ duration: 0.5 }}
                >
                    {children}
                </motion.div>
            </AnimatePresence>
        </ThemeProvider>
        </body>
        </html>
    );
}