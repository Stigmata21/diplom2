"use client";
import { useTheme } from "next-themes";
import { Switch } from "./switch";
import { useEffect, useState } from "react";

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;
  return (
    <div className="flex items-center space-x-2">
      <span className="text-xs text-gray-500">🌞</span>
      <Switch
        checked={theme === "dark"}
        onCheckedChange={v => setTheme(v ? "dark" : "light")}
        id="theme-switch"
      />
      <span className="text-xs text-gray-500">🌚</span>
    </div>
  );
} 