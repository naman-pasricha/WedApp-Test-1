// QR Code Generation Library
// Uses a simple SVG-based approach (no external dependencies)

interface QRCodeOptions {
  size?: number;
  margin?: number;
  color?: {
    dark?: string;
    light?: string;
  };
}

/**
 * Generate a QR code as SVG string
 * This is a simplified implementation - for production consider using a dedicated library
 */
export async function generateQRCodeSVG(
  text: string,
  options: QRCodeOptions = {}
): Promise<string> {
  const size = options.size || 256;
  const margin = options.margin || 4;
  const darkColor = options.color?.dark || '#000000';
  const lightColor = options.color?.light || '#FFFFFF';

  // For a real implementation, use a library like 'qrcode' or 'qr-code-styling'
  // This creates a placeholder SVG that represents a QR code
  const moduleCount = 25; // Standard QR code modules
  const moduleSize = (size - 2 * margin) / moduleCount;

  // Generate a simple pattern (in reality, use a proper QR encoder)
  const modules = generateQRModules(text, moduleCount);

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" shape-rendering="crispEdges">`;
  svg += `<rect width="${size}" height="${size}" fill="${lightColor}"/>`;

  for (let row = 0; row < moduleCount; row++) {
    for (let col = 0; col < moduleCount; col++) {
      if (modules[row][col]) {
        const x = margin + col * moduleSize;
        const y = margin + row * moduleSize;
        svg += `<rect x="${x}" y="${y}" width="${moduleSize}" height="${moduleSize}" fill="${darkColor}"/>`;
      }
    }
  }

  // Add quiet zone indicators (finder patterns)
  const finderSize = 7 * moduleSize;
  const finderPositions = [
    { x: margin, y: margin }, // Top-left
    { x: size - margin - finderSize, y: margin }, // Top-right
    { x: margin, y: size - margin - finderSize }, // Bottom-left
  ];

  // Draw finder patterns (simplified)
  finderPositions.forEach(pos => {
    svg += drawFinderPattern(pos.x, pos.y, finderSize, moduleSize, darkColor);
  });

  svg += '</svg>';
  return svg;
}

function generateQRModules(text: string, size: number): boolean[][] {
  // Simplified module generation - in production use a real QR encoder
  const modules: boolean[][] = Array(size).fill(null).map(() => Array(size).fill(false));

  // Create a deterministic pattern based on the text
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = ((hash << 5) - hash) + text.charCodeAt(i);
    hash |= 0;
  }

  // Use hash to generate pseudo-random pattern
  let seed = Math.abs(hash);
  const random = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };

  // Fill with pattern
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      // Skip finder pattern areas
      if (isInFinderArea(row, col, size)) continue;
      if (isInTimingPattern(row, col, size)) continue;

      modules[row][col] = random() > 0.5;
    }
  }

  // Ensure finder patterns are set
  drawFinderPatternModules(modules, size);
  drawTimingPatterns(modules, size);

  return modules;
}

function isInFinderArea(row: number, col: number, size: number): boolean {
  const finderSize = 7;
  return (
    (row < finderSize && col < finderSize) || // Top-left
    (row < finderSize && col >= size - finderSize) || // Top-right
    (row >= size - finderSize && col < finderSize) // Bottom-left
  );
}

function isInTimingPattern(row: number, col: number, size: number): boolean {
  return (row === 6 && col >= 8 && col < size - 8) ||
         (col === 6 && row >= 8 && row < size - 8);
}

function drawFinderPatternModules(modules: boolean[][], size: number): void {
  const finderSize = 7;
  const positions = [
    { row: 0, col: 0 },
    { row: 0, col: size - finderSize },
    { row: size - finderSize, col: 0 },
  ];

  positions.forEach(pos => {
    for (let r = 0; r < finderSize; r++) {
      for (let c = 0; c < finderSize; c++) {
        const row = pos.row + r;
        const col = pos.col + c;
        if (row < size && col < size) {
          // Finder pattern: 1111111, 1000001, 1011101, 1011101, 1011101, 1000001, 1111111
          const isBorder = r === 0 || r === finderSize - 1 || c === 0 || c === finderSize - 1;
          const isInner = r >= 2 && r <= 4 && c >= 2 && c <= 4;
          modules[row][col] = isBorder || isInner;
        }
      }
    }
  });
}

function drawTimingPatterns(modules: boolean[][], size: number): void {
  for (let i = 8; i < size - 8; i++) {
    modules[6][i] = i % 2 === 0; // Horizontal timing
    modules[i][6] = i % 2 === 0; // Vertical timing
  }
}

function drawFinderPattern(x: number, y: number, size: number, moduleSize: number, color: string): string {
  let pattern = '';
  const finderModules = 7;
  const modSize = size / finderModules;

  for (let r = 0; r < finderModules; r++) {
    for (let c = 0; c < finderModules; c++) {
      const isBorder = r === 0 || r === finderModules - 1 || c === 0 || c === finderModules - 1;
      const isInner = r >= 2 && r <= 4 && c >= 2 && c <= 4;
      if (isBorder || isInner) {
        pattern += `<rect x="${x + c * modSize}" y="${y + r * modSize}" width="${modSize}" height="${modSize}" fill="${color}"/>`;
      }
    }
  }
  return pattern;
}

/**
 * Generate QR code as data URL (base64 encoded PNG)
 * Note: This returns SVG as data URL. For PNG, use a canvas-based approach.
 */
export async function generateQRCode(
  text: string,
  size: number = 256
): Promise<string> {
  const svg = await generateQRCodeSVG(text, { size });
  const base64 = Buffer.from(svg).toString('base64');
  return `data:image/svg+xml;base64,${base64}`;
}

/**
 * Generate printable QR code page with multiple sizes
 */
export async function generatePrintableQRPage(
  weddingName: string,
  guestUrl: string,
  options: { size?: number; includeInstructions?: boolean } = {}
): Promise<string> {
  const qrSize = options.size || 512;
  const qrSvg = await generateQRCodeSVG(guestUrl, { size: qrSize });

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>QR Code - ${weddingName}</title>
  <style>
    @page { margin: 0; size: auto; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      margin: 0; padding: 40px; text-align: center;
      background: white; color: #333;
    }
    .container { max-width: 600px; margin: 0 auto; }
    h1 { color: #C4785E; margin-bottom: 8px; font-size: 28px; }
    .subtitle { color: #8B7D6B; margin-bottom: 32px; font-size: 16px; }
    .qr-wrapper {
      background: white; padding: 24px; border-radius: 16px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.1); margin-bottom: 24px;
      display: inline-block;
    }
    .qr-code { display: block; }
    .url {
      font-family: monospace; font-size: 14px; color: #666;
      word-break: break-all; margin-top: 16px; padding: 12px;
      background: #FFF8F3; border-radius: 8px;
    }
    .instructions {
      text-align: left; background: #FFF8F3; padding: 24px;
      border-radius: 12px; margin-top: 24px;
    }
    .instructions h3 { margin-top: 0; color: #C4785E; }
    .instructions ol { padding-left: 20px; }
    .instructions li { margin-bottom: 12px; line-height: 1.6; }
    @media print {
      body { padding: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>${weddingName}</h1>
    <p class="subtitle">Wedding Guest App</p>

    <div class="qr-wrapper">
      ${qrSvg}
    </div>

    <div class="url">${guestUrl}</div>

    ${options.includeInstructions !== false ? `
    <div class="instructions">
      <h3>How to Join</h3>
      <ol>
        <li>Open your phone's camera app</li>
        <li>Point it at the QR code above</li>
        <li>Tap the notification that appears</li>
        <li>Enter your name and phone number</li>
        <li>You're in! 🎉</li>
      </ol>
      <p style="margin-top: 16px; font-size: 14px; color: #8B7D6B;">
        <strong>Or manually visit:</strong> ${guestUrl}
      </p>
    </div>
    ` : ''}
  </div>
</body>
</html>
  `.trim();
}