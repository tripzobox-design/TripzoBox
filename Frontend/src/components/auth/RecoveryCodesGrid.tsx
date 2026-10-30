import React, { useState } from 'react';
import { Download, Check, Copy } from 'lucide-react';

export interface RecoveryCodesGridProps {
  codes?: string[];
  onDone?: () => void;
  doneText?: string;
}

const DEFAULT_CODES = [
  '8P3K-2D9Q',
  '4G7P-1KDM',
  '2ZNV-988C',
  '6TQ1-3L5D',
  'H9W2-7K4F',
  'D5JS-0P3R',
];

export const RecoveryCodesGrid: React.FC<RecoveryCodesGridProps> = ({
  codes = DEFAULT_CODES,
  onDone,
  doneText = 'Done',
}) => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [downloaded, setDownloaded] = useState(false);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleDownload = () => {
    const content = `TRIPZOBOX ACCOUNT RECOVERY CODES
Generated: ${new Date().toLocaleDateString()}
Keep these codes in a safe, private place. Each code can be used once to access your Tripzobox account.

${codes.map((code, idx) => `${idx + 1}. ${code}`).join('\n')}

For security, never share these recovery codes with anyone.`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `tripzobox-recovery-codes-${Date.now().toString().slice(-4)}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 3000);
  };

  return (
    <div className="w-full space-y-6">
      {/* 2x3 Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
        {codes.map((code) => {
          const isCopied = copiedCode === code;
          return (
            <button
              key={code}
              type="button"
              onClick={() => handleCopy(code)}
              title="Click to copy code"
              className="group relative flex items-center justify-between p-2.5 sm:p-3 rounded-xl border border-gray-200 bg-gray-50/70 hover:bg-white hover:border-primary/40 hover:shadow-xs transition-all cursor-pointer text-left"
            >
              <span className="font-mono text-xs sm:text-sm font-semibold text-gray-800 tracking-wider">
                {code}
              </span>
              <span className="text-gray-400 group-hover:text-primary transition-colors">
                {isCopied ? (
                  <Check className="w-3.5 h-3.5 text-primary stroke-[2.5]" />
                ) : (
                  <Copy className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />
                )}
              </span>
            </button>
          );
        })}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        <button
          type="button"
          onClick={handleDownload}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-semibold text-xs sm:text-sm hover:bg-gray-50 active:bg-gray-100 transition-colors cursor-pointer"
        >
          {downloaded ? (
            <>
              <Check className="w-4 h-4 text-primary stroke-[2.5]" />
              <span>Codes Downloaded</span>
            </>
          ) : (
            <>
              <Download className="w-4 h-4 text-gray-600" />
              <span>Download Codes</span>
            </>
          )}
        </button>

        {onDone && (
          <button
            type="button"
            onClick={onDone}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white font-semibold text-xs sm:text-sm shadow-xs transition-colors cursor-pointer text-center"
          >
            {doneText}
          </button>
        )}
      </div>
    </div>
  );
};

