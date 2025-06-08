'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Inter } from 'next/font/google';
import './globals.css'
import { ThemeProvider } from 'next-themes';
import { SessionProvider } from 'next-auth/react';
import { Toaster } from 'react-hot-toast';
import dynamic from 'next/dynamic';
import UserStatusChecker from '@/components/UserStatusChecker';

const inter = Inter({ subsets: ['latin'] });
const SupportChatWidget = dynamic(() => import('@/components/support/SupportChatWidget'), { ssr: false });

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="ru" suppressHydrationWarning>
        <body className={inter.className}>
        <SessionProvider>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
            <UserStatusChecker>
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
            <Toaster position="top-right" />
            <SupportChatWidget />
            </UserStatusChecker>
        </ThemeProvider>
        </SessionProvider>
        </body>
        </html>
    );
}