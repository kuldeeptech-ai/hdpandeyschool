import jsPDF from 'jspdf';
import html2canvas from 'html2canvas-pro';

export async function waitForImages(element: HTMLElement): Promise<void> {
  const images = Array.from(element.querySelectorAll('img'));
  const promises = images.map((img) => {
    if (img.complete && img.naturalWidth > 0) return Promise.resolve();
    return new Promise<void>((resolve) => {
      const handleDone = () => resolve();
      img.addEventListener('load', handleDone, { once: true });
      img.addEventListener('error', handleDone, { once: true });
      // Fallback timeout so it never hangs
      setTimeout(handleDone, 1200);
    });
  });

  await Promise.all(promises);

  if (document.fonts && document.fonts.ready) {
    try {
      await document.fonts.ready;
    } catch {
      // Font load error fallback
    }
  }
}

/**
 * Robust color sanitizer to convert modern CSS color functions (like oklch, lab, lch)
 * into standard hex or rgb formats before canvas rendering.
 */
function sanitizeOklchColors(root: HTMLElement): void {
  const testCanvas = document.createElement('canvas');
  testCanvas.width = 1;
  testCanvas.height = 1;
  const ctx = testCanvas.getContext('2d');

  const convertColor = (val: string): string => {
    if (!val || (!val.includes('oklch') && !val.includes('lab') && !val.includes('lch'))) {
      return val;
    }
    if (!ctx) return val;
    try {
      ctx.fillStyle = val;
      return ctx.fillStyle; // Canvas 2D context resolves any CSS color to rgb(...) or #hex
    } catch {
      return val;
    }
  };

  const elements = [root, ...Array.from(root.querySelectorAll<HTMLElement>('*'))];
  const colorProps = [
    'color',
    'backgroundColor',
    'borderColor',
    'borderTopColor',
    'borderBottomColor',
    'borderLeftColor',
    'borderRightColor',
    'outlineColor',
  ] as const;

  for (const el of elements) {
    const computed = window.getComputedStyle(el);
    for (const prop of colorProps) {
      const currentVal = computed.getPropertyValue(
        prop.replace(/([A-Z])/g, '-$1').toLowerCase()
      );
      if (currentVal && (currentVal.includes('oklch') || currentVal.includes('lab') || currentVal.includes('lch'))) {
        const sanitized = convertColor(currentVal);
        if (sanitized && sanitized !== currentVal) {
          (el.style as any)[prop] = sanitized;
        }
      }
    }
  }
}

export interface PdfExportOptions {
  fileName?: string;
  onProgress?: (status: string) => void;
}

/**
 * High-definition A4 PDF Download
 * Powered by html2canvas-pro with native OKLCH support + color sanitization
 */
export async function downloadMarksheetPdf(
  elementId: string,
  options: PdfExportOptions = {}
): Promise<boolean> {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element #${elementId} not found`);
    return false;
  }

  try {
    options.onProgress?.('Preparing document & graphics...');
    await waitForImages(element);
    await new Promise((res) => setTimeout(res, 150));

    options.onProgress?.('Rendering high-resolution A4 canvas...');
    const canvas = await html2canvas(element, {
      scale: 2.0,
      useCORS: true,
      allowTaint: false,
      logging: false,
      backgroundColor: '#ffffff',
      imageTimeout: 10000,
      onclone: (clonedDoc) => {
        const clonedEl = clonedDoc.getElementById(elementId);
        if (clonedEl) {
          // Reset positioning & shadows
          clonedEl.style.transform = 'none';
          clonedEl.style.margin = '0 auto';
          clonedEl.style.boxShadow = 'none';

          // Reset all ancestor transforms in the cloned DOM
          let ancestor = clonedEl.parentElement;
          while (ancestor && ancestor !== clonedDoc.body) {
            ancestor.style.transform = 'none';
            ancestor.style.margin = '0';
            ancestor.style.padding = '0';
            ancestor.style.display = 'block';
            ancestor = ancestor.parentElement;
          }

          // Convert any lingering modern color functions into standard rgb
          sanitizeOklchColors(clonedEl);
        }
      },
    });

    options.onProgress?.('Compiling PDF...');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.96);
    // A4 dimensions: 210mm x 297mm
    pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297, undefined, 'FAST');

    const cleanFileName = (options.fileName || 'School_Academic_Result').replace(/[^a-zA-Z0-9_-]/g, '_');

    // Trigger download
    try {
      pdf.save(`${cleanFileName}.pdf`);
    } catch {
      // Fallback via Blob URL
      const pdfBlob = pdf.output('blob');
      const blobUrl = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `${cleanFileName}.pdf`;
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
      }, 1000);
    }

    options.onProgress?.('PDF downloaded successfully!');
    return true;
  } catch (err: any) {
    console.error('Failed to generate PDF:', err);
    options.onProgress?.(`Error: ${err?.message || 'Failed to render PDF'}`);
    return false;
  }
}

/**
 * High-definition Image (PNG) Download
 */
export async function downloadMarksheetImage(
  elementId: string,
  options: PdfExportOptions = {}
): Promise<boolean> {
  const element = document.getElementById(elementId);
  if (!element) return false;

  try {
    options.onProgress?.('Preparing image...');
    await waitForImages(element);
    await new Promise((res) => setTimeout(res, 120));

    options.onProgress?.('Capturing high-resolution image...');
    const canvas = await html2canvas(element, {
      scale: 2.0,
      useCORS: true,
      allowTaint: false,
      logging: false,
      backgroundColor: '#ffffff',
      imageTimeout: 10000,
      onclone: (clonedDoc) => {
        const clonedEl = clonedDoc.getElementById(elementId);
        if (clonedEl) {
          clonedEl.style.transform = 'none';
          clonedEl.style.margin = '0 auto';
          clonedEl.style.boxShadow = 'none';
          let ancestor = clonedEl.parentElement;
          while (ancestor && ancestor !== clonedDoc.body) {
            ancestor.style.transform = 'none';
            ancestor.style.margin = '0';
            ancestor.style.padding = '0';
            ancestor = ancestor.parentElement;
          }

          // Convert any lingering modern color functions into standard rgb
          sanitizeOklchColors(clonedEl);
        }
      },
    });

    const cleanFileName = (options.fileName || 'School_Academic_Result').replace(/[^a-zA-Z0-9_-]/g, '_');

    // Prefer toBlob for memory efficiency
    if (canvas.toBlob) {
      canvas.toBlob((blob) => {
        if (!blob) {
          fallbackDownloadDataUrl(canvas, cleanFileName);
          return;
        }
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = `${cleanFileName}.png`;
        document.body.appendChild(link);
        link.click();
        setTimeout(() => {
          document.body.removeChild(link);
          URL.revokeObjectURL(blobUrl);
        }, 1000);
      }, 'image/png');
    } else {
      fallbackDownloadDataUrl(canvas, cleanFileName);
    }

    options.onProgress?.('Image downloaded successfully!');
    return true;
  } catch (err: any) {
    console.error('Failed to download image:', err);
    options.onProgress?.(`Error: ${err?.message || 'Failed to capture image'}`);
    return false;
  }
}

function fallbackDownloadDataUrl(canvas: HTMLCanvasElement, fileName: string): void {
  const dataUrl = canvas.toDataURL('image/png');
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = `${fileName}.png`;
  document.body.appendChild(link);
  link.click();
  setTimeout(() => document.body.removeChild(link), 1000);
}

/**
 * Bulletproof Print Function
 * Creates an isolated, clean printable document so neither UI zoom, parent backgrounds,
 * navigation bars, nor modal dialogs interfere with the A4 marksheet print output.
 */
export function printMarksheet(elementId: string = 'printable-marksheet'): void {
  const element = document.getElementById(elementId);
  if (!element) {
    window.print();
    return;
  }

  // Create an isolated hidden iframe for printing
  const iframe = document.createElement('iframe');
  iframe.id = 'print-engine-frame';
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.style.visibility = 'hidden';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) {
    // If iframe access is prevented by container sandbox, fallback to direct window.print()
    window.print();
    return;
  }

  // Collect all stylesheets from main page
  const stylesheets = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
    .map((el) => el.outerHTML)
    .join('\n');

  doc.open();
  doc.write(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <title>Marksheet Print</title>
        ${stylesheets}
        <style>
          @page {
            size: A4 portrait;
            margin: 0mm;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            width: 210mm !important;
            height: 297mm !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .marksheet-a4-page {
            width: 210mm !important;
            height: 297mm !important;
            min-height: 297mm !important;
            max-height: 297mm !important;
            margin: 0 auto !important;
            padding: 7mm 9mm 6mm 9mm !important;
            box-shadow: none !important;
            border: none !important;
            page-break-after: avoid !important;
            break-after: avoid !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            overflow: hidden !important;
            transform: none !important;
          }
        </style>
      </head>
      <body>
        <div style="width: 210mm; margin: 0 auto;">
          ${element.outerHTML}
        </div>
      </body>
    </html>
  `);
  doc.close();

  // Trigger print after iframe renders
  setTimeout(() => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch {
      window.print();
    } finally {
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 3000);
    }
  }, 400);
}
