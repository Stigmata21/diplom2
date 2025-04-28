"use client";
import React from "react";
import { Sidebar } from "@/components/sidebar/sidebar";

export default function SupportLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex bg-gradient-to-b from-indigo-50 to-blue-100 dark:from-gray-900 dark:to-gray-950">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <main className="flex-1 p-2 sm:p-6 md:p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
} 