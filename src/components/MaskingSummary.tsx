import {
  Mail,
  Globe,
  Phone,
  CreditCard,
  Key,
  Network,
  Wifi,
  type LucideIcon,
} from 'lucide-react';
import type { MaskingSummaryItem } from '../lib/maskingEngine';
import type { Theme } from '../hooks/useTheme';

interface MaskingSummaryProps {
  theme: Theme;
  summary: MaskingSummaryItem[];
  totalReplacements: number;
}

const RULE_ICON_MAP: Record<string, LucideIcon> = {
  email: Mail,
  ipv4: Globe,
  ipv6: Globe,
  phone_number: Phone,
  credit_card: CreditCard,
  bearer_token: Key,
  aws_access_key: Key,
  aws_secret_key: Key,
  generic_api_key: Key,
  mac_address: Wifi,
};

const RULE_COLOR_MAP: Record<string, { dark: string; light: string }> = {
  email: { dark: 'text-blue-400', light: 'text-blue-600' },
  ipv4: { dark: 'text-amber-400', light: 'text-amber-600' },
  ipv6: { dark: 'text-amber-400', light: 'text-amber-600' },
  phone_number: { dark: 'text-purple-400', light: 'text-purple-600' },
  credit_card: { dark: 'text-red-400', light: 'text-red-600' },
  bearer_token: { dark: 'text-orange-400', light: 'text-orange-600' },
  aws_access_key: { dark: 'text-orange-400', light: 'text-orange-600' },
  aws_secret_key: { dark: 'text-orange-400', light: 'text-orange-600' },
  generic_api_key: { dark: 'text-orange-400', light: 'text-orange-600' },
  mac_address: { dark: 'text-cyan-400', light: 'text-cyan-600' },
};

export function MaskingSummary({
  theme,
  summary,
  totalReplacements,
}: MaskingSummaryProps) {
  const isDark = theme === 'dark';

  if (summary.length === 0) return null;

  return (
    <div className="animate-slide-up">
      <div
        className={`
          rounded-2xl overflow-hidden
          ${isDark
            ? 'bg-slate-800/60 border border-slate-700/60'
            : 'bg-white border border-slate-200 shadow-sm'}
          transition-colors duration-300
        `}
      >
        {/* Summary Header */}
        <div
          className={`
            px-4 py-3 border-b
            ${isDark ? 'border-slate-700/60' : 'border-slate-200'}
          `}
        >
          <div className="flex items-center justify-between">
            <h3
              className={`text-sm font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}
            >
              検出サマリー
            </h3>
            <div
              className={`
                badge
                ${isDark
                  ? 'bg-primary-900/40 text-primary-300 border border-primary-800/50'
                  : 'bg-primary-50 text-primary-700 border border-primary-200'}
              `}
            >
              合計 {totalReplacements} 件置換
            </div>
          </div>
        </div>

        {/* Summary Items */}
        <div className="px-4 py-2">
          {summary.map((item, index) => {
            const Icon = RULE_ICON_MAP[item.ruleId] || Network;
            const colors = RULE_COLOR_MAP[item.ruleId] || {
              dark: 'text-slate-400',
              light: 'text-slate-600',
            };

            return (
              <div
                key={item.ruleId}
                className={`
                  flex items-center justify-between py-2.5
                  ${index < summary.length - 1
                    ? isDark
                      ? 'border-b border-slate-700/40'
                      : 'border-b border-slate-100'
                    : ''}
                `}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 ${isDark ? colors.dark : colors.light}`}
                  />
                  <div>
                    <span
                      className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}
                    >
                      {item.labelJa}
                    </span>
                    <span
                      className={`text-xs ml-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}
                    >
                      ({item.label})
                    </span>
                  </div>
                </div>
                <span
                  className={`
                    text-sm font-bold tabular-nums
                    ${isDark ? colors.dark : colors.light}
                  `}
                >
                  {item.count} 件
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
