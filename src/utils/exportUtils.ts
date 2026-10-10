import { toPng } from 'html-to-image';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface RenderOptions {
  width?: number;
  height?: number;
  pixelRatio?: number;
  backgroundColor?: string;
}

/**
 * Renders an element to a crisp PNG data URL.
 * Uses html-to-image with skipFonts: true and fontEmbedCSS: '' to prevent SecurityError
 * from cross-origin Google Fonts stylesheets, with an automatic fallback to html2canvas if needed.
 */
async function renderElementToDataUrl(
  element: HTMLElement,
  options: RenderOptions = {}
): Promise<string> {
  const targetWidth = options.width || 750;
  const targetHeight = options.height || 1050;
  const elWidth = element.offsetWidth || 375;
  const elHeight = element.offsetHeight || 525;
  const bg = options.backgroundColor || '#181F1C';

  try {
    // Primary: html-to-image with exact dimensions and 1.0 pixel ratio to avoid double-scaling distortion
    return await toPng(element, {
      width: elWidth,
      height: elHeight,
      canvasWidth: targetWidth,
      canvasHeight: targetHeight,
      pixelRatio: 1.0,
      quality: 1.0,
      backgroundColor: bg,
      skipFonts: true,
      fontEmbedCSS: '',
      style: {
        transform: 'none',
        margin: '0'
      }
    });
  } catch (pngErr) {
    console.warn('toPng error, attempting html2canvas fallback:', pngErr);
    const canvas = await html2canvas(element, {
      scale: targetWidth / elWidth,
      useCORS: true,
      allowTaint: true,
      backgroundColor: bg,
      logging: false
    });
    return canvas.toDataURL('image/png', 1.0);
  }
}

/**
 * Exports an element as a crisp PNG.
 * For standard 300 DPI collectible cards, defaults to exactly 750 x 1050 px.
 */
export async function exportElementAsPng(
  element: HTMLElement,
  fileName: string = 'carta_papa_tumbay.png',
  exactDimensions: { width: number; height: number } = { width: 750, height: 1050 }
): Promise<void> {
  try {
    const targetWidth = exactDimensions.width;
    const targetHeight = exactDimensions.height;

    // Render directly at exact target resolution (750x1050 px, crisp 300 DPI)
    const dataUrl = await renderElementToDataUrl(element, {
      width: targetWidth,
      height: targetHeight,
      backgroundColor: '#121816'
    });

    const link = document.createElement('a');
    link.download = fileName;
    link.href = dataUrl;
    link.click();
  } catch (err) {
    console.error('Error exportando PNG a 750x1050 px (300 DPI):', err);
    throw err;
  }
}

/**
 * Exports element as print-ready PDF.
 * For cards, 750 x 1050 px at 300 DPI equals exactly 63.5 mm x 88.9 mm (2.5 x 3.5 inches).
 */
export async function exportElementAsPdf(
  element: HTMLElement,
  fileName: string = 'carta_papa_tumbay.pdf',
  format: 'card' | 'sheet' = 'card'
): Promise<void> {
  try {
    const targetWidth = 750;
    const targetHeight = 1050;

    // Lossless, ultra-sharp rendering at 750 x 1050 px
    const dataUrl = await renderElementToDataUrl(element, {
      width: targetWidth,
      height: targetHeight,
      pixelRatio: targetWidth / (element.offsetWidth || 375),
      backgroundColor: format === 'card' ? '#181F1C' : '#FAF7F0'
    });

    // Create a PDF document
    if (format === 'card') {
      // Standard collectible card size at 300 DPI:
      // 750 px / 300 DPI * 25.4 mm/inch = 63.5 mm width
      // 1050 px / 300 DPI * 25.4 mm/inch = 88.9 mm height
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [63.5, 88.9]
      });

      // Fit card edge to edge with zero bleed margin
      pdf.addImage(dataUrl, 'PNG', 0, 0, 63.5, 88.9, undefined, 'FAST');
      pdf.save(fileName);
    } else {
      // A4 technical sheet
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = 10;
      const contentWidth = pageWidth - margin * 2;
      const elementRatio = element.offsetHeight / (element.offsetWidth || 1);
      const contentHeight = contentWidth * elementRatio;

      pdf.addImage(dataUrl, 'PNG', margin, margin, contentWidth, contentHeight, undefined, 'FAST');
      pdf.save(fileName);
    }
  } catch (err) {
    console.error('Error exportando PDF:', err);
    throw err;
  }
}

/**
 * Exports an 8-card printable sheet (4x2 grid in landscape) to PDF.
 * Supports A4 (297 x 210 mm) or Carta / US Letter (279.4 x 215.9 mm).
 */
export async function exportEightCardSheetAsPdf(
  element: HTMLElement,
  paperSize: 'a4' | 'carta' = 'a4',
  fileName: string = 'hoja_8_cartas_papa_tumbay.pdf'
): Promise<void> {
  try {
    const isA4 = paperSize === 'a4';
    const targetWidthMm = isA4 ? 297 : 279.4;
    const targetHeightMm = isA4 ? 210 : 215.9;

    const dataUrl = await renderElementToDataUrl(element, {
      pixelRatio: 2.0,
      backgroundColor: '#FFFFFF'
    });

    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: isA4 ? 'a4' : 'letter'
    });

    pdf.addImage(dataUrl, 'PNG', 0, 0, targetWidthMm, targetHeightMm, undefined, 'FAST');
    pdf.save(fileName);
  } catch (err) {
    console.error('Error exportando hoja de 8 cartas a PDF:', err);
    throw err;
  }
}
