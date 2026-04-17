import { useState, useCallback } from 'react';
import { useTheme } from './hooks/useTheme';
import { applyMasking } from './lib/maskingEngine';
import type { MaskingSummaryItem } from './lib/maskingEngine';
import { Header } from './components/Header';
import { InputArea } from './components/InputArea';
import { OutputArea } from './components/OutputArea';
import { MaskingSummary } from './components/MaskingSummary';
import { Footer } from './components/Footer';

function App() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  const [inputText, setInputText] = useState('');
  const [maskedText, setMaskedText] = useState('');
  const [summary, setSummary] = useState<MaskingSummaryItem[]>([]);
  const [totalReplacements, setTotalReplacements] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleMask = useCallback(() => {
    if (!inputText.trim()) return;

    setIsProcessing(true);

    // Use requestAnimationFrame to allow UI to update before heavy processing
    requestAnimationFrame(() => {
      const result = applyMasking(inputText);
      setMaskedText(result.maskedText);
      setSummary(result.summary);
      setTotalReplacements(result.totalReplacements);
      setIsProcessing(false);
    });
  }, [inputText]);

  const handleClear = useCallback(() => {
    setInputText('');
    setMaskedText('');
    setSummary([]);
    setTotalReplacements(0);
  }, []);

  return (
    <div
      className={`
        min-h-screen flex flex-col
        ${isDark ? 'bg-mesh-dark' : 'bg-mesh-light'}
        transition-colors duration-500
      `}
    >
      <Header theme={theme} onToggleTheme={toggleTheme} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Two-pane layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
          {/* Input Pane */}
          <div
            className={`
              rounded-2xl overflow-hidden min-h-[400px] flex flex-col
              ${isDark
                ? 'bg-slate-800/40 border border-slate-700/50 shadow-2xl shadow-black/20'
                : 'bg-white/80 border border-slate-200 shadow-xl shadow-slate-200/50'}
              transition-all duration-300
            `}
          >
            <InputArea
              theme={theme}
              value={inputText}
              onChange={setInputText}
              onMask={handleMask}
              onClear={handleClear}
              isProcessing={isProcessing}
            />
          </div>

          {/* Output Pane */}
          <div
            className={`
              rounded-2xl overflow-hidden min-h-[400px] flex flex-col
              ${isDark
                ? 'bg-slate-800/40 border border-slate-700/50 shadow-2xl shadow-black/20'
                : 'bg-white/80 border border-slate-200 shadow-xl shadow-slate-200/50'}
              transition-all duration-300
            `}
          >
            <OutputArea theme={theme} maskedText={maskedText} />
          </div>
        </div>

        {/* Summary */}
        <MaskingSummary
          theme={theme}
          summary={summary}
          totalReplacements={totalReplacements}
        />
      </main>

      <Footer theme={theme} />
    </div>
  );
}

export default App;
