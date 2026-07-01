import { Sun, Moon } from 'lucide-react';

interface ThemeToggleProps {
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
}

export default function ThemeToggle({ darkMode, setDarkMode }: ThemeToggleProps) {
  return (
    <button
      id="theme-toggle-btn"
      onClick={() => setDarkMode(!darkMode)}
      className="p-2 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs"
      aria-label="Toggle Theme"
    >
      <div className="relative w-5 h-5 flex items-center justify-center overflow-hidden">
        {darkMode ? (
          <Sun className="w-5 h-5 text-amber-500 transition-transform duration-300 rotate-0" />
        ) : (
          <Moon className="w-5 h-5 text-indigo-600 transition-transform duration-300 rotate-0" />
        )}
      </div>
    </button>
  );
}
