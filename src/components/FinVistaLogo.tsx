import React, { useState } from 'react';
import { TrendingUp } from 'lucide-react';

interface FinVistaLogoProps {
  logoUrl?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export default function FinVistaLogo({ logoUrl, className = '', size = 'md' }: FinVistaLogoProps) {
  const [imgError, setImgError] = useState(false);

  // Default size mappings
  const imgHeights = {
    sm: 'h-8 sm:h-9',
    md: 'h-10 sm:h-12 md:h-14',
    lg: 'h-16 sm:h-20',
    xl: 'h-20 sm:h-24 md:h-28'
  };

  const primarySrc = logoUrl || '/finvista_logo.svg';

  if (!imgError) {
    return (
      <img
        src={primarySrc}
        alt="FinVista Analytics"
        onError={() => setImgError(true)}
        className={`${imgHeights[size]} w-auto object-contain rounded-xl shadow-xs transition-transform duration-300 ${className}`}
      />
    );
  }

  // High-fidelity vector SVG brand logo fallback (100% resilient on Netlify, offline & any screen)
  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      <div className="relative flex items-center justify-center p-2.5 sm:p-3 bg-gradient-to-br from-zinc-900 via-indigo-950 to-zinc-950 dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-950 border border-indigo-500/30 dark:border-zinc-800 rounded-2xl shadow-lg group">
        <div className="absolute inset-0 bg-emerald-500/10 rounded-2xl blur-xs group-hover:bg-emerald-500/20 transition-all" />
        
        {/* Vector SVG Icon */}
        <div className="relative flex items-center gap-1.5 z-10">
          <div className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg">
            <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400 stroke-[2.5]" />
          </div>
          <div className="flex items-end gap-1 h-5 sm:h-6">
            <span className="w-1.5 h-2.5 bg-indigo-500/80 rounded-xs" />
            <span className="w-1.5 h-4 bg-indigo-400 rounded-xs" />
            <span className="w-1.5 h-6 bg-emerald-400 rounded-xs shadow-xs shadow-emerald-400/50" />
          </div>
        </div>
      </div>

      <div className="flex flex-col">
        <div className="flex items-baseline font-black tracking-tight leading-none text-gray-900 dark:text-white text-lg sm:text-2xl">
          <span>Fin</span>
          <span className="text-emerald-500 dark:text-emerald-400">Vista</span>
        </div>
        <span className="text-[10px] sm:text-xs font-semibold tracking-widest uppercase text-indigo-600 dark:text-indigo-400 mt-0.5">
          Analytics
        </span>
      </div>
    </div>
  );
}
