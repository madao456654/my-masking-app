import { FileText, Sparkles, Trash2 } from 'lucide-react';
import type { Theme } from '../hooks/useTheme';

interface InputAreaProps {
  theme: Theme;
  value: string;
  onChange: (value: string) => void;
  onMask: () => void;
  onClear: () => void;
  isProcessing: boolean;
}

const SAMPLE_TEXT = `# サンプルログデータ（テスト用）
[2024-12-15 10:23:45] INFO  ユーザー tanaka.taro@company.co.jp がログインしました
[2024-12-15 10:23:46] DEBUG 接続元IP: 192.168.10.50, サーバーIP: 10.0.0.1
[2024-12-15 10:23:47] INFO  APIリクエスト: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.abc123
[2024-12-15 10:24:01] WARN  AWS認証キー検出: AKIAIOSFODNN7EXAMPLE
[2024-12-15 10:24:02] INFO  api_key= sk-proj-abc123def456ghi789jkl012mno345
[2024-12-15 10:24:15] DEBUG MACアドレス: 00:1B:44:11:3A:B7
[2024-12-15 10:24:20] INFO  連絡先: 090-1234-5678 / 03-9876-5432
[2024-12-15 10:24:30] WARN  カード番号 4111-1111-1111-1111 が平文で検出されました
[2024-12-15 10:24:35] INFO  IPv6: 2001:0db8:85a3:0000:0000:8a2e:0370:7334
[2024-12-15 10:24:40] INFO  担当: suzuki.hanako@example.com, TEL: 052-999-9999-1234`;

export function InputArea({
  theme,
  value,
  onChange,
  onMask,
  onClear,
  isProcessing,
}: InputAreaProps) {
  const isDark = theme === 'dark';

  const handleLoadSample = () => {
    onChange(SAMPLE_TEXT);
  };

  const lineCount = value ? value.split('\n').length : 0;
  const charCount = value.length;

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
          <FileText
            className={`w-4 h-4 ${isDark ? 'text-primary-400' : 'text-primary-600'}`}
          />
          <h2
            className={`text-sm font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}
          >
            入力テキスト
          </h2>
          {charCount > 0 && (
            <span
              className={`
                text-[11px] px-2 py-0.5 rounded-md font-mono
                ${isDark ? 'bg-slate-700 text-slate-400' : 'bg-slate-100 text-slate-500'}
              `}
            >
              {lineCount} 行 / {charCount.toLocaleString()} 文字
            </span>
          )}
        </div>
        <button
          id="load-sample-btn"
          onClick={handleLoadSample}
          className={`
            text-xs px-3 py-1.5 rounded-lg font-medium transition-all duration-200
            ${isDark
              ? 'text-primary-400 hover:bg-primary-500/10'
              : 'text-primary-600 hover:bg-primary-50'}
          `}
        >
          サンプルを読み込む
        </button>
      </div>

      {/* Textarea */}
      <div className="flex-1 relative">
        <textarea
          id="input-textarea"
          className={`
            w-full h-full resize-none p-4 text-sm leading-relaxed
            ${isDark
              ? 'bg-slate-900/60 text-slate-200 placeholder-slate-600'
              : 'bg-slate-50/80 text-slate-800 placeholder-slate-400'}
            transition-colors duration-300
            focus:ring-2 focus:ring-primary-500/30
          `}
          placeholder="ここにログファイルや設定ファイルの内容をペーストしてください...&#10;&#10;📋 クリップボードから貼り付け、またはサンプルデータを読み込んで試すことができます。"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          spellCheck={false}
        />
      </div>

      {/* Action Buttons */}
      <div
        className={`
          flex items-center justify-between px-4 py-3 rounded-b-2xl border-t gap-2
          ${isDark
            ? 'bg-slate-800/80 border-slate-700/60'
            : 'bg-white border-slate-200'}
          transition-colors duration-300
        `}
      >
        <button
          id="clear-btn"
          onClick={onClear}
          disabled={!value}
          className="btn-danger"
        >
          <Trash2 className="w-4 h-4" />
          <span className="hidden sm:inline">クリア</span>
        </button>

        <button
          id="mask-btn"
          onClick={onMask}
          disabled={!value || isProcessing}
          className="btn-primary"
        >
          <Sparkles className="w-4 h-4" />
          {isProcessing ? '処理中...' : 'マスキング実行'}
        </button>
      </div>
    </div>
  );
}
