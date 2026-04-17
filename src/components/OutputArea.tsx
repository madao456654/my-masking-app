import { useState } from 'react';
import { ShieldCheck, Copy, Check, Download } from 'lucide-react';
import type { Theme } from '../hooks/useTheme';

interface OutputAreaProps {
  theme: Theme;
  maskedText: string;
}

export function OutputArea({ theme, maskedText }: OutputAreaProps) {
  const isDark = theme === 'dark';
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!maskedText) return;
    try {
      await navigator.clipboard.writeText(maskedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const ta = document.createElement('textarea');
      ta.value = maskedText;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (!maskedText) return;
    const blob = new Blob([maskedText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `masked_output_${new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const lineCount = maskedText ? maskedText.split('\n').length : 0;

  return (
    <div className="flex flex-col h-full animate-fade-in">
      {/* Panel Header */}
      <div
        className={`
          flex items-center justify-between px-4 py-3 rounded-t-2xl border-b
          ${isDark
            ? 'bg-slate-800/80 border-slate-700/60'
            : 'bg-white border-slate-200'}
          transition-colors duration-300
        `}
      >
        <div className="flex items-center gap-2">
          <ShieldCheck
            className={`w-4 h-4 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}
          />
          <h2
            className={`text-sm font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}
          >
            マスキング結果
          </h2>
          {maskedText && (
            <span
              className={`
                text-[11px] px-2 py-0.5 rounded-md font-mono
                ${isDark ? 'bg-slate-700 text-slate-400' : 'bg-slate-100 text-slate-500'}
              `}
            >
              {lineCount} 行
            </span>
          )}
        </div>

        {maskedText && (
          <div className="flex items-center gap-2">
            <button
              id="download-btn"
              onClick={handleDownload}
              className={`
                text-xs px-3 py-1.5 rounded-lg font-medium transition-all duration-200 flex items-center gap-1.5
                ${isDark
                  ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/60'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'}
              `}
              title="ファイルとしてダウンロード"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">保存</span>
            </button>
            <button
              id="copy-btn"
              onClick={handleCopy}
              className={`
                text-xs px-3 py-1.5 rounded-lg font-medium transition-all duration-200 flex items-center gap-1.5
                ${copied
                  ? isDark
                    ? 'bg-emerald-900/40 text-emerald-400'
                    : 'bg-emerald-50 text-emerald-600'
                  : isDark
                    ? 'text-primary-400 hover:bg-primary-500/10'
                    : 'text-primary-600 hover:bg-primary-50'}
              `}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  コピー完了
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  コピー
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Output Display */}
      <div className="flex-1 relative overflow-auto">
        {maskedText ? (
          <pre
            id="output-display"
            className={`
              w-full h-full p-4 text-sm leading-relaxed font-mono whitespace-pre-wrap break-all
              ${isDark ? 'text-slate-300' : 'text-slate-700'}
            `}
          >
            {maskedText}
          </pre>
        ) : (
          <div className="flex flex-col items-center justify-center h-full py-12 px-4">
            <div
              className={`
                p-4 rounded-2xl mb-4
                ${isDark ? 'bg-slate-800/60' : 'bg-slate-100'}
              `}
            >
              <ShieldCheck
                className={`w-10 h-10 ${isDark ? 'text-slate-600' : 'text-slate-300'}`}
              />
            </div>
            <p
              className={`text-sm text-center ${isDark ? 'text-slate-500' : 'text-slate-400'}`}
            >
              テキストを入力して「マスキング実行」を
              <br />
              クリックすると結果がここに表示されます
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div
        className={`
          px-4 py-2.5 rounded-b-2xl border-t
          ${isDark
            ? 'bg-slate-800/80 border-slate-700/60'
            : 'bg-white border-slate-200'}
          transition-colors duration-300
        `}
      >
        <p
          className={`text-[11px] flex items-center gap-1.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}
        >
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
          すべてのデータはブラウザ内で処理されます。外部への送信は一切ありません。
        </p>
      </div>
    </div>
  );
}
