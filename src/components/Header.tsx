import { ShieldCheck, Moon, Sun } from 'lucide-react';
import type { Theme } from '../hooks/useTheme';

interface HeaderProps {
  theme: Theme;
  onToggleTheme: () => void;
}

export function Header({ theme, onToggleTheme }: HeaderProps) {
  const isDark = theme === 'dark';

  return (
    <header
      id="app-header"
      className={`
        sticky top-0 z-50
        ${isDark ? 'glass-panel' : 'glass-panel-light'}
        transition-colors duration-300
      `}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div
              className={`
                p-2 rounded-xl
                ${isDark
                  ? 'bg-primary-500/20 text-primary-400'
                  : 'bg-primary-100 text-primary-600'}
                transition-colors duration-300
              `}
            >
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1
                className={`
                  text-lg font-bold tracking-tight
                  ${isDark ? 'text-white' : 'text-slate-900'}
                `}
              >
                SecureMask
              </h1>
              <p
                className={`
                  text-[11px] font-medium tracking-wide uppercase
                  ${isDark ? 'text-slate-400' : 'text-slate-500'}
                `}
              >
                Privacy-First Log Masker
              </p>
            </div>
          </div>

          {/* Right side controls */}
          <div className="flex items-center gap-3">
            {/* Security badge */}
            <div
              className={`
                hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium
                ${isDark
                  ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-800/40'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}
                transition-colors duration-300
              `}
            >
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              ローカル処理のみ
            </div>

            {/* Theme toggle */}
            <button
              id="theme-toggle-btn"
              onClick={onToggleTheme}
              className={`
                p-2.5 rounded-xl transition-all duration-300
                ${isDark
                  ? 'text-slate-400 hover:text-white hover:bg-slate-700/60'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/60'}
              `}
              aria-label={isDark ? 'ライトモードに切り替え' : 'ダークモードに切り替え'}
              title={isDark ? 'ライトモードに切り替え' : 'ダークモードに切り替え'}
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
