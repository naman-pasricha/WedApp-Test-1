'use client';

import { useState, useEffect } from 'react';
import { Download, Copy, Check, ExternalLink, Printer, QrCode } from 'lucide-react';
import { clsx } from 'clsx';
import { generateQRCodeSVG, generatePrintableQRPage } from '@/lib/qrcode';

interface QRCodePageProps {
  wedding: {
    id: string;
    name: string;
    slug: string;
    hero_image_url: string | null;
  };
  guestUrl: string;
}

export function QRCodePage({ wedding, guestUrl }: QRCodePageProps) {
  const [qrSvg, setQrSvg] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    generateQRCode();
  }, [guestUrl]);

  const generateQRCode = async () => {
    setGenerating(true);
    try {
      const svg = await generateQRCodeSVG(guestUrl, { size: 384, margin: 16 });
      setQrSvg(svg);
    } catch (error) {
      console.error('Failed to generate QR code:', error);
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(guestUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleDownload = async () => {
    try {
      const svg = await generateQRCodeSVG(guestUrl, { size: 1024, margin: 32 });
      const blob = new Blob([svg], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${wedding.slug}-qr-code.svg`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download:', error);
    }
  };

  const handlePrint = async () => {
    try {
      const printHtml = await generatePrintableQRPage(wedding.name, guestUrl, {
        size: 1024,
        includeInstructions: true
      });

      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(printHtml);
        printWindow.document.close();
        printWindow.focus();
        // Small delay to ensure content is loaded
        setTimeout(() => {
          printWindow.print();
        }, 500);
      }
    } catch (error) {
      console.error('Failed to open print:', error);
    }
  };

  const handleOpenGuestApp = () => {
    window.open(guestUrl, '_blank', 'noopener,noreferrer');
  };

  if (generating) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-3 border-[var(--color-primary)] border-t-transparent" />
        <p className="mt-4 text-[var(--color-muted-foreground)]">Generating QR code...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* QR Code Display */}
      <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
        <div className="inline-block bg-white p-6 rounded-xl shadow-sm">
          <div
            className="qr-code-container"
            dangerouslySetInnerHTML={{ __html: qrSvg }}
          />
        </div>

        <div className="mt-6 space-y-3">
          <p className="text-sm font-medium text-gray-900">{wedding.name}</p>
          <p className="text-sm text-gray-500 font-mono break-all">
            {guestUrl}
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={handleCopy}
          className={clsx(
            'flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium border transition-colors',
            'border-gray-300 text-gray-700 hover:bg-gray-50'
          )}
        >
          {copied ? (
            <>
              <Check className="h-5 w-5 text-green-500" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Copy className="h-5 w-5" />
              <span>Copy Link</span>
            </>
          )}
        </button>

        <button
          onClick={handleDownload}
          className={clsx(
            'flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium border transition-colors',
            'border-gray-300 text-gray-700 hover:bg-gray-50'
          )}
        >
          <Download className="h-5 w-5" />
          <span>Download SVG</span>
        </button>

        <button
          onClick={handlePrint}
          className={clsx(
            'flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium border transition-colors',
            'border-gray-300 text-gray-700 hover:bg-gray-50'
          )}
        >
          <Printer className="h-5 w-5" />
          <span>Print Page</span>
        </button>

        <button
          onClick={handleOpenGuestApp}
          className={clsx(
            'flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium border transition-colors',
            'border-gray-300 text-gray-700 hover:bg-gray-50'
          )}
        >
          <ExternalLink className="h-5 w-5" />
          <span>Open App</span>
        </button>
      </div>

      {/* Batch Generation */}
      <BatchQRGenerator wedding={wedding} guestUrl={guestUrl} />
    </div>
  );
}

interface BatchQRGeneratorProps {
  wedding: {
    id: string;
    name: string;
    slug: string;
  };
  guestUrl: string;
}

function BatchQRGenerator({ wedding, guestUrl }: BatchQRGeneratorProps) {
  const [generatingBatch, setGeneratingBatch] = useState(false);
  const [batchCount, setBatchCount] = useState(10);

  const handleBatchGenerate = async () => {
    setGeneratingBatch(true);
    try {
      const printHtml = await generateBatchPrintPage(wedding, guestUrl, batchCount);

      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(printHtml);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
        }, 500);
      }
    } catch (error) {
      console.error('Failed to generate batch:', error);
    } finally {
      setGeneratingBatch(false);
    }
  };

  return (
    <div className="bg-gray-50 rounded-2xl p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <QrCode className="h-5 w-5 text-[#C4785E]" />
        Batch Generation for Invitations
      </h3>
      <p className="text-gray-500 mb-4">
        Generate multiple QR codes on printable pages for physical invitations
      </p>

      <div className="flex flex-col sm:flex-row gap-4 items-end">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Number of QR codes per page
          </label>
          <select
            value={batchCount}
            onChange={(e) => setBatchCount(Number(e.target.value))}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#C4785E]"
          >
            <option value={4}>4 per page (Large)</option>
            <option value={6}>6 per page (Medium)</option>
            <option value={10}>10 per page (Small)</option>
            <option value={20}>20 per page (Tiny)</option>
          </select>
        </div>

        <button
          onClick={handleBatchGenerate}
          disabled={generatingBatch}
          className={clsx(
            'flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold',
            'bg-[#C4785E] text-white hover:bg-[#B06850] disabled:opacity-50',
            'transition-colors w-full sm:w-auto'
          )}
        >
          {generatingBatch ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
              Generating...
            </>
          ) : (
            <>
              <QrCode className="h-5 w-5" />
              Generate Print Page
            </>
          )}
        </button>
      </div>
    </div>
  );
}

async function generateBatchPrintPage(
  wedding: { name: string; slug: string },
  guestUrl: string,
  count: number
): Promise<string> {
  const qrSvg = await generateQRCodeSVG(guestUrl, { size: 256, margin: 8 });

  const perRow = count <= 4 ? 2 : count <= 6 ? 3 : count <= 10 ? 5 : 5;
  const rows = Math.ceil(count / perRow);

  const qrSize = 200;
  const gap = 24;
  const pageWidth = perRow * qrSize + (perRow + 1) * gap;
  const pageHeight = rows * (qrSize + 40) + (rows + 1) * gap + 120;

  let qrGrid = '';
  for (let i = 0; i < count; i++) {
    const row = Math.floor(i / perRow);
    const col = i % perRow;
    const x = gap + col * (qrSize + gap);
    const y = 120 + gap + row * (qrSize + 40 + gap);

    qrGrid += `
      <div style="position: absolute; left: ${x}px; top: ${y}px; width: ${qrSize}px; text-align: center;">
        <div style="background: white; padding: 16px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); margin-bottom: 8px;">
          ${qrSvg.replace(`width="256" height="256"`, `width="${qrSize}" height="${qrSize}"`)}
        </div>
        <p style="font-size: 11px; color: #666; font-family: monospace; margin: 0;">${guestUrl}</p>
      </div>
    `;
  }

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>QR Codes - ${wedding.name}</title>
  <style>
    @page { margin: 0; size: ${pageWidth}px ${pageHeight}px; }
    @media print {
      body { margin: 0; }
      .no-print { display: none; }
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      margin: 0; padding: 0;
      width: ${pageWidth}px; height: ${pageHeight}px;
      background: white; color: #333;
      position: relative;
    }
    .header {
      text-align: center; padding: 24px;
      border-bottom: 2px solid #E8DDD4;
    }
    h1 { color: #C4785E; margin: 0 0 8px; font-size: 24px; }
    .subtitle { color: #8B7D6B; margin: 0; font-size: 14px; }
    .qr-page { position: relative; }
  </style>
</head>
<body>
  <div class="header">
    <h1>${wedding.name}</h1>
    <p class="subtitle">Wedding Guest App — QR Codes for Invitations</p>
  </div>
  <div class="qr-page">
    ${qrGrid}
  </div>
  <script>
    window.onload = function() { window.print(); };
  </script>
</body>
</html>
  `.trim();
}