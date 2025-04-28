import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface RightSidebarProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export default function RightSidebar({ open, onClose, title, children }: RightSidebarProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Overlay */}
          <motion.div
            className="fixed inset-0 bg-black/30 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          {/* Sidebar */}
          <motion.aside
            className="fixed top-0 right-0 h-full w-full sm:w-[420px] bg-white dark:bg-gray-900 shadow-2xl z-50 flex flex-col"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
              <h2 className="text-lg font-bold text-indigo-700 dark:text-white">{title}</h2>
              <button onClick={onClose} className="text-gray-500 hover:text-gray-900 dark:hover:text-white text-2xl font-bold">×</button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">{children}</div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
} 