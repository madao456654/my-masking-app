import { Lock, ExternalLink } from 'lucide-react';
import type { Theme } from '../hooks/useTheme';

interface FooterProps {
  theme: Theme;
}

export function Footer({ theme }: FooterProps) {
  const isDark = theme === 'dark';

  return (
    <footer
      id="app-footer"
      className={`
        mt-auto py-6 border-t
        ${isDark ? 'border-slate-800 text-slate-500' : 'border-slate-200 text-slate-400'}
        transition-colors duration-300
      `}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" />
              <span>すべてのデータはブラウザ内で処理されます</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span>© 2026 SecureMask</span>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className={`
                flex items-center gap-1 transition-colors duration-200
                ${isDark ? 'hover:text-slate-300' : 'hover:text-slate-600'}
              `}
            >
              <ExternalLink className="w-3.5 h-3.5" />
              GitHub
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
