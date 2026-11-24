import React, { useState } from 'react';
import { Download, Check, Copy } from 'lucide-react';

export interface RecoveryCodesGridProps {
  codes?: string[];
  onDone?: () => void;
  doneText?: string;
}

export const RecoveryCodesGrid: React.FC<RecoveryCodesGridProps> = ({
  codes = [],
  onDone,
  doneText = 'Done',
}) => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleCopyAll = () => {
    if (!codes.length) return;
    navigator.clipboard.writeText(codes.join('\n'));
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
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
      {codes.length > 0 ? (
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
      ) : (
        <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 text-center text-xs text-gray-500">
          No recovery codes generated.
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleDownload}
            disabled={codes.length === 0}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-semibold text-xs sm:text-sm hover:bg-gray-50 active:bg-gray-100 transition-colors cursor-pointer disabled:opacity-50"
          >
            {downloaded ? (
              <>
                <Check className="w-4 h-4 text-primary stroke-[2.5]" />
                <span>Downloaded</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4 text-gray-600" />
                <span>Download</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={handleCopyAll}
            disabled={codes.length === 0}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-semibold text-xs sm:text-sm hover:bg-gray-50 active:bg-gray-100 transition-colors cursor-pointer disabled:opacity-50"
          >
            {copiedAll ? (
              <>
                <Check className="w-4 h-4 text-primary stroke-[2.5]" />
                <span>Copied All</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-gray-600" />
                <span>Copy All</span>
              </>
            )}
          </button>
        </div>

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

