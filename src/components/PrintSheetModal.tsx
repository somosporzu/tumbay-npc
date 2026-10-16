import React, { useState, useRef, useMemo } from 'react';
import { useReactToPrint } from 'react-to-print';
import { NpcData } from '../types/npc';
import { CardVisual } from './CardVisual';
import { exportEightCardSheetAsPdf, PrintPaperSize, PAPER_DIMENSIONS_MM } from '../utils/exportUtils';
import {
  X,
  Printer,
  Download,
  Scissors,
  FileText,
  Copy,
  Layers,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  RefreshCw,
  FileArchive,
  Sliders,
  Check
} from 'lucide-react';

interface PrintSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentNpc: NpcData;
  availableNpcs: NpcData[];
  onOpenZipExport?: () => void;
}

export type BleedOption = 0 | 2 | 3; // in millimeters
export type GenerationMode = 'all_auto' | 'current_8' | 'custom';

export const PrintSheetModal: React.FC<PrintSheetModalProps> = ({
  isOpen,
  onClose,
  currentNpc,
  availableNpcs,
  onOpenZipExport
}) => {
  // Paper Size: oficio, carta, a4
  const [paperSize, setPaperSize] = useState<PrintPaperSize>('carta');

  // Bleed (sangrado) in mm
  const [bleedMm, setBleedMm] = useState<BleedOption>(2);

  // Cut Guides configuration
  const [showCutGuides, setShowCutGuides] = useState<boolean>(true);
  const [showCornerMarks, setShowCornerMarks] = useState<boolean>(true);
  const [showGridLines, setShowGridLines] = useState<boolean>(true);
  const [showPerimeterTicks, setShowPerimeterTicks] = useState<boolean>(true);
  const [cutGuideColor, setCutGuideColor] = useState<'#000000' | '#666666'>('#000000');

  // Generation mode
  const [generationMode, setGenerationMode] = useState<GenerationMode>('all_auto');
  const [fillEmptySlotsWith, setFillEmptySlotsWith] = useState<'repeat' | 'current' | 'empty'>('repeat');

  // Sheets management (each sheet has exactly 8 slots, slot can be NpcData or null for empty)
  const [customPages, setCustomPages] = useState<Array<Array<NpcData | null>>>(() => {
    // Initial 1 sheet with 8 of current
    return [Array.from({ length: 8 }, () => currentNpc)];
  });

  const [activePageIndex, setActivePageIndex] = useState<number>(0);

  // UI state
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [isPrinting, setIsPrinting] = useState<boolean>(false);

  // Ref container holding ALL printable pages for react-to-print & jsPDF
  const printableContainerRef = useRef<HTMLDivElement>(null);
  const singleSheetRef = useRef<HTMLDivElement>(null);

  // Ensure available list has at least currentNpc
  const allNpcs = useMemo(() => {
    return availableNpcs.length > 0 ? availableNpcs : [currentNpc];
  }, [availableNpcs, currentNpc]);

  // Compute pages based on active generation mode
  const computedPages: Array<Array<NpcData | null>> = useMemo(() => {
    if (generationMode === 'current_8') {
      return [Array.from({ length: 8 }, () => currentNpc)];
    }

    if (generationMode === 'all_auto') {
      const pages: Array<Array<NpcData | null>> = [];
      const totalNpcs = allNpcs.length;
      const totalPages = Math.max(1, Math.ceil(totalNpcs / 8));

      for (let p = 0; p < totalPages; p++) {
        const pageSlots: Array<NpcData | null> = [];
        for (let s = 0; s < 8; s++) {
          const npcIndex = p * 8 + s;
          if (npcIndex < totalNpcs) {
            pageSlots.push(allNpcs[npcIndex]);
          } else {
            // Unfilled slot
            if (fillEmptySlotsWith === 'repeat') {
              pageSlots.push(allNpcs[npcIndex % totalNpcs] || currentNpc);
            } else if (fillEmptySlotsWith === 'current') {
              pageSlots.push(currentNpc);
            } else {
              pageSlots.push(null);
            }
          }
        }
        pages.push(pageSlots);
      }
      return pages;
    }

    // Custom mode
    return customPages.length > 0 ? customPages : [[...Array.from({ length: 8 }, () => currentNpc)]];
  }, [generationMode, allNpcs, currentNpc, fillEmptySlotsWith, customPages]);

  // Paper geometry & dimensions
  const paperDims = PAPER_DIMENSIONS_MM[paperSize] || PAPER_DIMENSIONS_MM.carta;

  // Standard net card: 63.5 mm x 88.9 mm
  const cardNetWidthMm = 63.5;
  const cardNetHeightMm = 88.9;

  // Card size with bleed
  const cardTotalWidthMm = cardNetWidthMm + bleedMm * 2;
  const cardTotalHeightMm = cardNetHeightMm + bleedMm * 2;

  // 4 columns x 2 rows
  const gridWidthMm = cardTotalWidthMm * 4;
  const gridHeightMm = cardTotalHeightMm * 2;

  // Margins on paper
  const marginHorizMm = Math.max(2, (paperDims.widthMm - gridWidthMm) / 2);
  const marginVertMm = Math.max(2, (paperDims.heightMm - gridHeightMm) / 2);

  // Scale ratio for CardVisual (nominal card in css is 375px x 525px)
  // At 96 DPI: 1 inch = 25.4 mm = 96 px -> 1 mm = 3.7795 px
  // 63.5 mm = 240 px. 240 / 375 = 0.64 scale factor.
  // With bleed: card scale stays proportional so trim lines match!
  const baseCardScale = 0.64;

  // Direct print with react-to-print hook
  const handlePrintAllSheets = useReactToPrint({
    contentRef: printableContainerRef,
    documentTitle: `hoja_8_cartas_${paperSize}_papa_tumbay`,
    onBeforePrint: async () => {
      setIsPrinting(true);
    },
    onAfterPrint: () => {
      setIsPrinting(false);
    },
    pageStyle: `
      @page {
        size: ${paperDims.widthMm}mm ${paperDims.heightMm}mm;
        margin: 0mm;
      }
      @media print {
        *, *::before, *::after {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        html, body {
          margin: 0 !important;
          padding: 0 !important;
          background: #FFFFFF !important;
          width: ${paperDims.widthMm}mm !important;
        }
        .print-sheet-page {
          width: ${paperDims.widthMm}mm !important;
          height: ${paperDims.heightMm}mm !important;
          page-break-after: always !important;
          break-after: page !important;
          margin: 0 !important;
          padding: 0 !important;
          box-shadow: none !important;
          border: none !important;
          overflow: hidden !important;
        }
        .print-sheet-page:last-child {
          page-break-after: auto !important;
          break-after: auto !important;
        }
        .no-print {
          display: none !important;
        }
      }
    `
  });

  if (!isOpen) return null;

  // Safe active page index
  const safePageIndex = Math.min(activePageIndex, computedPages.length - 1);
  const currentDisplayedSlots = computedPages[safePageIndex] || computedPages[0] || [];

  // Slot change in custom mode
  const handleSlotChange = (slotIndex: number, value: string) => {
    if (generationMode !== 'custom') {
      // Switch to custom mode and clone current pages
      setGenerationMode('custom');
    }

    setCustomPages((prev) => {
      const next = prev.map((p) => [...p]);
      if (!next[safePageIndex]) {
        next[safePageIndex] = Array.from({ length: 8 }, () => currentNpc);
      }

      if (value === 'empty') {
        next[safePageIndex][slotIndex] = null;
      } else {
        const found = allNpcs.find((n) => n.id === value) || currentNpc;
        next[safePageIndex][slotIndex] = found;
      }
      return next;
    });
  };

  // Add custom sheet
  const handleAddCustomPage = () => {
    setGenerationMode('custom');
    setCustomPages((prev) => [...prev, Array.from({ length: 8 }, () => currentNpc)]);
    setActivePageIndex(customPages.length);
  };

  // Remove active sheet
  const handleRemovePage = (indexToRemove: number) => {
    if (customPages.length <= 1) return;
    setCustomPages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
    setActivePageIndex((prev) => Math.max(0, Math.min(prev, customPages.length - 2)));
  };

  // Export PDF of all sheets
  const handleExportAllPdf = async () => {
    if (!printableContainerRef.current) return;
    setIsExporting(true);

    try {
      const pageElements = Array.from(
        printableContainerRef.current.querySelectorAll('.print-sheet-page')
      ) as HTMLElement[];

      if (pageElements.length === 0) {
        throw new Error('No se encontraron páginas para exportar');
      }

      await exportEightCardSheetAsPdf(
        pageElements,
        paperSize,
        `planillas_8_cartas_${paperSize}_sangrado${bleedMm}mm_${new Date().toISOString().split('T')[0]}.pdf`
      );
    } catch (err) {
      console.error('Error exportando PDF:', err);
      alert('Hubo un error al generar el archivo PDF de las hojas de impresión.');
    } finally {
      setIsExporting(false);
    }
  };

  // Export PDF of single active sheet
  const handleExportSinglePdf = async () => {
    if (!singleSheetRef.current) return;
    setIsExporting(true);

    try {
      await exportEightCardSheetAsPdf(
        singleSheetRef.current,
        paperSize,
        `hoja_${safePageIndex + 1}_8_cartas_${paperSize}_sangrado${bleedMm}mm.pdf`
      );
    } catch (err) {
      console.error('Error exportando hoja individual:', err);
      alert('Hubo un error al generar el PDF de la hoja.');
    } finally {
      setIsExporting(false);
    }
  };

  /**
   * Renders the 4x2 grid of 8 cards with bleed and crop marks
   */
  const renderCardGrid = (slots: Array<NpcData | null>, isForPrint: boolean = false) => {
    return (
      <div
        className="relative"
        style={{
          width: `${gridWidthMm}mm`,
          height: `${gridHeightMm}mm`,
          boxSizing: 'border-box'
        }}
      >
        {/* Crop Marks & Cut Guides */}
        {showCutGuides && (
          <div className="absolute inset-0 pointer-events-none z-30">
            {/* Horizontal cut lines across 2 rows (y = 0, cardTotalHeightMm, cardTotalHeightMm * 2) */}
            {[0, cardTotalHeightMm, cardTotalHeightMm * 2].map((yMm, rowIdx) => {
              // Exact cut line with bleed offset
              const cutY = rowIdx === 0 ? bleedMm : rowIdx === 1 ? cardTotalHeightMm + (bleedMm === 0 ? 0 : -bleedMm) : gridHeightMm - bleedMm;

              return (
                <React.Fragment key={`h-cuts-${rowIdx}`}>
                  {/* Left perimeter tick mark extending into paper margin */}
                  {showPerimeterTicks && (
                    <div
                      className="absolute border-t"
                      style={{
                        top: `${rowIdx * cardTotalHeightMm + (bleedMm > 0 && rowIdx === 1 ? cardTotalHeightMm / 2 : bleedMm)}mm`,
                        left: '-8mm',
                        width: '6mm',
                        borderColor: cutGuideColor
                      }}
                    />
                  )}
                  {/* Right perimeter tick mark */}
                  {showPerimeterTicks && (
                    <div
                      className="absolute border-t"
                      style={{
                        top: `${rowIdx * cardTotalHeightMm + (bleedMm > 0 && rowIdx === 1 ? cardTotalHeightMm / 2 : bleedMm)}mm`,
                        right: '-8mm',
                        width: '6mm',
                        borderColor: cutGuideColor
                      }}
                    />
                  )}
                </React.Fragment>
              );
            })}

            {/* Vertical cut lines across 4 columns */}
            {[0, 1, 2, 3, 4].map((colIdx) => {
              return (
                <React.Fragment key={`v-cuts-${colIdx}`}>
                  {/* Top perimeter tick mark */}
                  {showPerimeterTicks && (
                    <div
                      className="absolute border-l"
                      style={{
                        left: `${colIdx * cardTotalWidthMm}mm`,
                        top: '-8mm',
                        height: '6mm',
                        borderColor: cutGuideColor
                      }}
                    />
                  )}
                  {/* Bottom perimeter tick mark */}
                  {showPerimeterTicks && (
                    <div
                      className="absolute border-l"
                      style={{
                        left: `${colIdx * cardTotalWidthMm}mm`,
                        bottom: '-8mm',
                        height: '6mm',
                        borderColor: cutGuideColor
                      }}
                    />
                  )}
                </React.Fragment>
              );
            })}

            {/* Subtle grid lines if enabled */}
            {showGridLines && (
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  display: 'grid',
                  gridTemplateColumns: `repeat(4, ${cardTotalWidthMm}mm)`,
                  gridTemplateRows: `repeat(2, ${cardTotalHeightMm}mm)`
                }}
              >
                {Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    style={{
                      border: `0.5px dashed ${cutGuideColor}33`,
                      boxSizing: 'border-box'
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* 4x2 Grid of Card Slots */}
        <div
          className="grid grid-cols-4 grid-rows-2 relative"
          style={{
            width: `${gridWidthMm}mm`,
            height: `${gridHeightMm}mm`,
            boxSizing: 'border-box'
          }}
        >
          {slots.map((item, slotIndex) => {
            const npcItem = item;

            return (
              <div
                key={slotIndex}
                className="relative overflow-hidden flex items-center justify-center"
                style={{
                  width: `${cardTotalWidthMm}mm`,
                  height: `${cardTotalHeightMm}mm`,
                  boxSizing: 'border-box',
                  padding: `${bleedMm}mm`
                }}
              >
                {/* Trim line indicator (shown in preview when bleed is active) */}
                {bleedMm > 0 && !isForPrint && (
                  <div
                    className="absolute pointer-events-none z-20"
                    style={{
                      top: `${bleedMm}mm`,
                      left: `${bleedMm}mm`,
                      width: `${cardNetWidthMm}mm`,
                      height: `${cardNetHeightMm}mm`,
                      border: '0.75px dashed rgba(239, 68, 68, 0.65)',
                      boxSizing: 'border-box'
                    }}
                    title="Línea de corte exacta (Trim line)"
                  />
                )}

                {/* Corner Marks (Crop marks) around each card if enabled */}
                {showCornerMarks && (
                  <>
                    {/* Top-Left */}
                    <div
                      className="absolute border-t border-l pointer-events-none z-20"
                      style={{
                        top: `${bleedMm}mm`,
                        left: `${bleedMm}mm`,
                        width: '3.5mm',
                        height: '3.5mm',
                        borderColor: cutGuideColor
                      }}
                    />
                    {/* Top-Right */}
                    <div
                      className="absolute border-t border-r pointer-events-none z-20"
                      style={{
                        top: `${bleedMm}mm`,
                        right: `${bleedMm}mm`,
                        width: '3.5mm',
                        height: '3.5mm',
                        borderColor: cutGuideColor
                      }}
                    />
                    {/* Bottom-Left */}
                    <div
                      className="absolute border-b border-l pointer-events-none z-20"
                      style={{
                        bottom: `${bleedMm}mm`,
                        left: `${bleedMm}mm`,
                        width: '3.5mm',
                        height: '3.5mm',
                        borderColor: cutGuideColor
                      }}
                    />
                    {/* Bottom-Right */}
                    <div
                      className="absolute border-b border-r pointer-events-none z-20"
                      style={{
                        bottom: `${bleedMm}mm`,
                        right: `${bleedMm}mm`,
                        width: '3.5mm',
                        height: '3.5mm',
                        borderColor: cutGuideColor
                      }}
                    />
                  </>
                )}

                {npcItem ? (
                  <div
                    style={{
                      width: '375px',
                      height: '525px',
                      transform: `scale(${baseCardScale * ((cardNetWidthMm + (bleedMm > 0 ? bleedMm * 1.5 : 0)) / cardNetWidthMm)})`,
                      transformOrigin: 'center center',
                      position: 'relative'
                    }}
                  >
                    <CardVisual npc={npcItem} noRounded={bleedMm > 0} />
                  </div>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center border border-dashed border-zinc-300 text-zinc-400 bg-zinc-50/40 rounded text-center p-2 select-none">
                    <span className="text-[10px] font-bold text-zinc-400">Espacio Vacío</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#FAF7F0] rounded-2xl max-w-6xl w-full max-h-[96vh] flex flex-col shadow-2xl border-2 border-[#D9C8A8] overflow-hidden">
        {/* Header */}
        <div className="p-3.5 sm:p-5 border-b border-[#D8C7A5] flex items-center justify-between bg-[#FAF6EE]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#7C5A37] text-white rounded-xl shadow-xs">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-heading text-lg sm:text-xl font-black text-[#261E16]">
                  Planilla de Impresión de 8 Cartas
                </h2>
                <span className="text-[10px] font-bold bg-[#E6D8BF] text-[#4E3923] px-2 py-0.5 rounded-full uppercase tracking-wider font-mono">
                  Cuadrícula 4×2
                </span>
              </div>
              <p className="text-xs text-[#6B5742] font-serif">
                Armado automático para papel <strong>Oficio</strong> y <strong>Carta</strong> con sangrado profesional (bleed) y guías de corte.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenZipExport && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenZipExport();
                }}
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-[#FAF3E2] hover:bg-[#EAE0CD] text-[#255C3E] text-xs font-bold rounded-lg border border-[#A5CCA6] shadow-2xs transition-colors cursor-pointer"
                title="Exportar todos los archivos PNG individuales en un ZIP"
              >
                <FileArchive className="w-4 h-4 text-[#255C3E]" />
                <span>Exportar PNGs en ZIP</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 text-[#735F48] hover:text-[#261E16] hover:bg-[#EAE0CF] rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Control Panel and Options */}
        <div className="p-3 sm:p-4 overflow-y-auto space-y-3.5 flex-1 bg-[#FAF7F0]">
          {/* Top Controls Grid: Paper Size, Bleed, Cut Guides, Auto Modes */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 p-3 bg-[#FAF3E2] rounded-xl border border-[#DECDB3]">
            {/* 1. Paper Size Selector (Carta vs Oficio vs A4) */}
            <div className="md:col-span-4 space-y-1.5">
              <label className="text-[11px] font-black uppercase tracking-wider text-[#5C452C] flex items-center justify-between">
                <span>1. Tamaño del Papel (Apaisado)</span>
                <span className="text-[10px] text-[#7A644E] font-normal">
                  {paperDims.widthMm} × {paperDims.heightMm} mm
                </span>
              </label>

              <div className="grid grid-cols-3 gap-1.5">
                {/* CARTA */}
                <button
                  type="button"
                  onClick={() => setPaperSize('carta')}
                  className={`px-2 py-2 text-xs font-bold rounded-lg border flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${
                    paperSize === 'carta'
                      ? 'bg-[#7C5A37] text-white border-[#5A3F24] shadow-xs'
                      : 'bg-[#FAF6EE] text-[#473623] border-[#CBB895] hover:bg-[#EFE8D6]'
                  }`}
                  title="Papel Carta estándar americano (11″ × 8.5″)"
                >
                  <span className="flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5" />
                    Carta
                  </span>
                  <span className="text-[9.5px] opacity-80 font-mono">11″ × 8.5″</span>
                </button>

                {/* OFICIO */}
                <button
                  type="button"
                  onClick={() => setPaperSize('oficio')}
                  className={`px-2 py-2 text-xs font-bold rounded-lg border flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${
                    paperSize === 'oficio'
                      ? 'bg-[#7C5A37] text-white border-[#5A3F24] shadow-xs'
                      : 'bg-[#FAF6EE] text-[#473623] border-[#CBB895] hover:bg-[#EFE8D6]'
                  }`}
                  title="Papel Oficio / Legal estándar (14″ × 8.5″)"
                >
                  <span className="flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5" />
                    Oficio
                  </span>
                  <span className="text-[9.5px] opacity-80 font-mono">14″ × 8.5″</span>
                </button>

                {/* A4 */}
                <button
                  type="button"
                  onClick={() => setPaperSize('a4')}
                  className={`px-2 py-2 text-xs font-bold rounded-lg border flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${
                    paperSize === 'a4'
                      ? 'bg-[#7C5A37] text-white border-[#5A3F24] shadow-xs'
                      : 'bg-[#FAF6EE] text-[#473623] border-[#CBB895] hover:bg-[#EFE8D6]'
                  }`}
                  title="Papel A4 estándar internacional (297 × 210 mm)"
                >
                  <span className="flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5" />
                    A4
                  </span>
                  <span className="text-[9.5px] opacity-80 font-mono">297 × 210 mm</span>
                </button>
              </div>
            </div>

            {/* 2. Sangrado (Bleed) Selector */}
            <div className="md:col-span-3 space-y-1.5">
              <label className="text-[11px] font-black uppercase tracking-wider text-[#5C452C] flex items-center justify-between">
                <span>2. Sangrado (Bleed)</span>
                <span className="text-[10px] text-[#7A644E] font-normal">
                  {bleedMm === 0 ? 'Sin sangrado' : `+${bleedMm} mm por lado`}
                </span>
              </label>

              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => setBleedMm(0)}
                  className={`px-1.5 py-2 text-xs font-bold rounded-lg border flex flex-col items-center justify-center transition-all cursor-pointer ${
                    bleedMm === 0
                      ? 'bg-[#7C5A37] text-white border-[#5A3F24] shadow-xs'
                      : 'bg-[#FAF6EE] text-[#473623] border-[#CBB895] hover:bg-[#EFE8D6]'
                  }`}
                  title="Corte neto directo a 63.5 × 88.9 mm"
                >
                  <span>0 mm</span>
                  <span className="text-[9px] opacity-80 font-mono">Neto</span>
                </button>

                <button
                  type="button"
                  onClick={() => setBleedMm(2)}
                  className={`px-1.5 py-2 text-xs font-bold rounded-lg border flex flex-col items-center justify-center transition-all cursor-pointer ${
                    bleedMm === 2
                      ? 'bg-[#7C5A37] text-white border-[#5A3F24] shadow-xs'
                      : 'bg-[#FAF6EE] text-[#473623] border-[#CBB895] hover:bg-[#EFE8D6]'
                  }`}
                  title="Sangrado recomendado de 2 mm para guillotina"
                >
                  <span>+2 mm</span>
                  <span className="text-[9px] opacity-80 font-mono">Óptimo</span>
                </button>

                <button
                  type="button"
                  onClick={() => setBleedMm(3)}
                  className={`px-1.5 py-2 text-xs font-bold rounded-lg border flex flex-col items-center justify-center transition-all cursor-pointer ${
                    bleedMm === 3
                      ? 'bg-[#7C5A37] text-white border-[#5A3F24] shadow-xs'
                      : 'bg-[#FAF6EE] text-[#473623] border-[#CBB895] hover:bg-[#EFE8D6]'
                  }`}
                  title="Sangrado estándar de imprenta de 3 mm"
                >
                  <span>+3 mm</span>
                  <span className="text-[9px] opacity-80 font-mono">Imprenta</span>
                </button>
              </div>
            </div>

            {/* 3. Guías de Corte Toggle and Ticks */}
            <div className="md:col-span-5 space-y-1.5">
              <label className="text-[11px] font-black uppercase tracking-wider text-[#5C452C] block">
                3. Guías de Corte y Marcas
              </label>

              <div className="flex flex-wrap items-center gap-2 p-1.5 bg-[#FAF6EE] border border-[#CBB895] rounded-lg">
                <label className="flex items-center gap-1.5 text-xs font-bold text-[#3B2C1E] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showCutGuides}
                    onChange={(e) => setShowCutGuides(e.target.checked)}
                    className="rounded border-[#B8A484] text-[#7C5A37] focus:ring-0 w-3.5 h-3.5"
                  />
                  <Scissors className="w-3.5 h-3.5 text-[#7C5A37]" />
                  <span>Activar guías</span>
                </label>

                {showCutGuides && (
                  <>
                    <span className="text-[#C5B395]">|</span>
                    <label className="flex items-center gap-1 text-[11px] text-[#4E3923] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showCornerMarks}
                        onChange={(e) => setShowCornerMarks(e.target.checked)}
                        className="rounded border-[#B8A484] text-[#7C5A37] focus:ring-0 w-3 h-3"
                      />
                      <span>Esquinas</span>
                    </label>

                    <label className="flex items-center gap-1 text-[11px] text-[#4E3923] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showPerimeterTicks}
                        onChange={(e) => setShowPerimeterTicks(e.target.checked)}
                        className="rounded border-[#B8A484] text-[#7C5A37] focus:ring-0 w-3 h-3"
                      />
                      <span>Bordes (Ticks)</span>
                    </label>

                    <label className="flex items-center gap-1 text-[11px] text-[#4E3923] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showGridLines}
                        onChange={(e) => setShowGridLines(e.target.checked)}
                        className="rounded border-[#B8A484] text-[#7C5A37] focus:ring-0 w-3 h-3"
                      />
                      <span>Líneas</span>
                    </label>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Secondary Controls: Auto Generation Mode & Page Navigator */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 p-3 bg-[#FAF3E2] rounded-xl border border-[#DECDB3] items-center">
            {/* Generation Mode Selector */}
            <div className="md:col-span-6 space-y-1">
              <span className="text-[11px] font-black uppercase tracking-wider text-[#5C452C] block">
                Modo de Armado de Planillas:
              </span>
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setGenerationMode('all_auto')}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                    generationMode === 'all_auto'
                      ? 'bg-[#7C5A37] text-white border-[#5A3F24] shadow-2xs'
                      : 'bg-[#FAF6EE] text-[#473623] border-[#CBB895] hover:bg-[#EFE8D6]'
                  }`}
                  title="Agrupa automáticamente todas las criaturas en hojas de 8"
                >
                  <Sparkles className="w-3 h-3 inline mr-1 text-amber-300" />
                  Toda la Colección ({allNpcs.length} criaturas)
                </button>

                <button
                  type="button"
                  onClick={() => setGenerationMode('current_8')}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                    generationMode === 'current_8'
                      ? 'bg-[#7C5A37] text-white border-[#5A3F24] shadow-2xs'
                      : 'bg-[#FAF6EE] text-[#473623] border-[#CBB895] hover:bg-[#EFE8D6]'
                  }`}
                  title="Llena 1 hoja con 8 copias de la criatura actual"
                >
                  <Copy className="w-3 h-3 inline mr-1 text-[#C58E3C]" />
                  Criatura Actual ×8
                </button>

                <button
                  type="button"
                  onClick={() => setGenerationMode('custom')}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                    generationMode === 'custom'
                      ? 'bg-[#7C5A37] text-white border-[#5A3F24] shadow-2xs'
                      : 'bg-[#FAF6EE] text-[#473623] border-[#CBB895] hover:bg-[#EFE8D6]'
                  }`}
                  title="Configurar manualmente cada ranura de cada hoja"
                >
                  <Sliders className="w-3 h-3 inline mr-1 text-[#7C5A37]" />
                  Personalizado
                </button>
              </div>
            </div>

            {/* Empty Slots Fill Option */}
            <div className="md:col-span-6 flex flex-wrap items-center justify-end gap-3 text-xs">
              {generationMode === 'all_auto' && allNpcs.length % 8 !== 0 && (
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-[#634E37] font-semibold">Espacios vacíos al final:</span>
                  <select
                    value={fillEmptySlotsWith}
                    onChange={(e) => setFillEmptySlotsWith(e.target.value as 'repeat' | 'current' | 'empty')}
                    className="bg-[#FFFDF7] border border-[#CBB895] rounded px-2 py-0.5 text-xs text-[#2A2016] cursor-pointer"
                  >
                    <option value="repeat">Repetir Criaturas</option>
                    <option value="current">Criatura Activa</option>
                    <option value="empty">Dejar en Blanco (Vacíos)</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Page Selector Bar (when multiple sheets exist) */}
          <div className="flex items-center justify-between bg-[#F4ECE0] p-2.5 rounded-xl border border-[#DECDB3]">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase text-[#473623] font-ui">
                Hojas Calculadas ({computedPages.length} en total):
              </span>

              <div className="flex items-center gap-1">
                {computedPages.map((_, pIdx) => (
                  <button
                    key={pIdx}
                    onClick={() => setActivePageIndex(pIdx)}
                    className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                      pIdx === safePageIndex
                        ? 'bg-[#7C5A37] text-white border-[#5A3F24] shadow-xs'
                        : 'bg-[#FAF6EE] text-[#473623] border-[#D5C4A4] hover:bg-[#EAE0CA]'
                    }`}
                  >
                    Hoja #{pIdx + 1}
                  </button>
                ))}
              </div>

              {generationMode === 'custom' && (
                <button
                  type="button"
                  onClick={handleAddCustomPage}
                  className="px-2 py-1 bg-[#FAF6EE] hover:bg-[#EBE0CD] text-[#7C5A37] text-xs font-bold rounded-lg border border-[#C5B395] flex items-center gap-1 transition-colors cursor-pointer"
                  title="Añadir una nueva hoja en blanco"
                >
                  <Plus className="w-3 h-3" />
                  <span>Añadir Hoja</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActivePageIndex((prev) => Math.max(0, prev - 1))}
                disabled={safePageIndex === 0}
                className="p-1 rounded bg-[#FAF6EE] border border-[#C5B395] text-[#473623] disabled:opacity-40 cursor-pointer"
                title="Página anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="text-xs font-mono font-bold text-[#473623]">
                {safePageIndex + 1} / {computedPages.length}
              </span>

              <button
                type="button"
                onClick={() => setActivePageIndex((prev) => Math.min(computedPages.length - 1, prev + 1))}
                disabled={safePageIndex === computedPages.length - 1}
                className="p-1 rounded bg-[#FAF6EE] border border-[#C5B395] text-[#473623] disabled:opacity-40 cursor-pointer"
                title="Página siguiente"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              {generationMode === 'custom' && computedPages.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemovePage(safePageIndex)}
                  className="p-1 rounded bg-red-100 hover:bg-red-200 border border-red-300 text-red-700 transition-colors cursor-pointer ml-1"
                  title="Eliminar esta hoja"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* 8 Slots Selector for the Active Page */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold text-[#473623]">
              <span>Contenido de los 8 espacios de la Hoja #{safePageIndex + 1}:</span>
              <span className="text-[11px] text-[#7A644E] font-normal">
                Puedes cambiar cualquier ranura individualmente
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-1.5">
              {currentDisplayedSlots.map((slotItem, slotIdx) => {
                const npc = slotItem;

                return (
                  <div
                    key={slotIdx}
                    className="p-1.5 bg-[#FAF6EE] rounded-lg border border-[#D5C4A7] flex flex-col justify-between gap-1 shadow-2xs"
                  >
                    <div className="flex items-center justify-between text-[9.5px] font-black text-[#7A644E]">
                      <span>#{slotIdx + 1}</span>
                      <span className="text-[8.5px] px-1 bg-[#EBE0CD] rounded">
                        {slotIdx < 4 ? 'Fila 1' : 'Fila 2'}
                      </span>
                    </div>

                    <div className="text-[11px] font-bold text-[#2A2016] truncate" title={npc ? npc.name : 'Espacio Vacío'}>
                      {npc ? npc.name : '⬜ Vacío'}
                    </div>

                    <select
                      value={npc ? npc.id : 'empty'}
                      onChange={(e) => handleSlotChange(slotIdx, e.target.value)}
                      className="w-full bg-[#FFFDF7] border border-[#CBB895] rounded px-1 py-0.5 text-[10px] font-medium text-[#2A2016] cursor-pointer truncate"
                    >
                      <option value="empty">⬜ Dejar Vacío (En Blanco)</option>
                      {allNpcs.map((n) => (
                        <option key={n.id} value={n.id}>
                          {n.name} ({n.rank})
                        </option>
                      ))}
                    </select>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Visual Sheet Preview Area */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold text-[#473623]">
              <span className="flex items-center gap-1.5">
                Vista Previa de Impresión: Hoja #{safePageIndex + 1} ({paperSize.toUpperCase()} Apaisado • {paperDims.widthMm} × {paperDims.heightMm} mm)
              </span>
              <span className="text-[11px] text-[#7A644E] font-medium hidden sm:inline">
                {bleedMm > 0 ? `Línea roja discontinua = Corte neto (63.5 × 88.9 mm) • Exterior = Sangrado (+${bleedMm}mm)` : 'Corte neto directo'}
              </span>
            </div>

            {/* Scrollable Canvas Container */}
            <div className="p-3 sm:p-5 bg-[#4A3D2F]/25 rounded-2xl border-2 border-dashed border-[#C5B393] overflow-x-auto flex justify-center items-center min-h-[380px]">
              {/* Single Sheet Element Displayed for Preview and single export */}
              <div
                ref={singleSheetRef}
                className="bg-white text-black relative flex flex-col items-center justify-center shadow-2xl transition-all"
                style={{
                  width: `${paperDims.widthMm}mm`,
                  height: `${paperDims.heightMm}mm`,
                  padding: `${marginVertMm}mm ${marginHorizMm}mm`,
                  boxSizing: 'border-box'
                }}
              >
                {renderCardGrid(currentDisplayedSlots, false)}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-3.5 sm:p-5 border-t border-[#D8C7A5] bg-[#FAF6EE] flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-[#6B5742] font-serif">
            💡 Para escala 100% exacta, selecciona <strong>«Sin márgenes»</strong> o <strong>«Escala 100%»</strong> en la ventana de impresión de tu navegador.
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 bg-[#EFE8D6] hover:bg-[#E2D7BE] text-[#473623] text-xs font-bold rounded-lg border border-[#CDBBA0] transition-colors cursor-pointer"
            >
              Cerrar
            </button>

            {/* Single Sheet PDF */}
            <button
              type="button"
              onClick={handleExportSinglePdf}
              disabled={isExporting || isPrinting}
              className="px-3 py-2 bg-[#FAF6EE] hover:bg-[#EFE6D2] text-[#3D3020] text-xs font-bold rounded-lg border border-[#CBB895] shadow-xs flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
              title="Descargar solo la hoja actual que estás previsualizando"
            >
              <Download className="w-3.5 h-3.5 text-[#7C5A37]" />
              <span>PDF Hoja #{safePageIndex + 1}</span>
            </button>

            {/* All Sheets PDF */}
            <button
              type="button"
              onClick={handleExportAllPdf}
              disabled={isExporting || isPrinting}
              className="px-3.5 py-2 bg-[#FAF6EE] hover:bg-[#EFE6D2] text-[#3D3020] text-xs font-bold rounded-lg border border-[#CBB895] shadow-xs flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
              title={`Descargar PDF completo con las ${computedPages.length} hojas de la colección`}
            >
              <Download className="w-4 h-4 text-[#7C5A37]" />
              <span>
                {isExporting ? 'Generando...' : `Descargar PDF Completo (${computedPages.length} Hojas)`}
              </span>
            </button>

            {/* Print with react-to-print */}
            <button
              type="button"
              onClick={() => handlePrintAllSheets()}
              disabled={isPrinting || isExporting}
              className="px-4 py-2 bg-[#7C5A37] hover:bg-[#68492A] text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
              title="Abrir diálogo de impresión para imprimir todas las páginas"
            >
              <Printer className="w-4 h-4" />
              <span>
                {isPrinting ? 'Preparando...' : `Imprimir ${computedPages.length} ${computedPages.length === 1 ? 'Hoja' : 'Hojas'}`}
              </span>
            </button>
          </div>
        </div>

        {/* Hidden Container for react-to-print & multi-page PDF generation */}
        <div
          ref={printableContainerRef}
          id="multi-page-print-container"
          style={{
            position: 'fixed',
            left: '-9999px',
            top: '-9999px',
            zIndex: -9999
          }}
        >
          {computedPages.map((pageSlots, pIdx) => {
            const isLast = pIdx === computedPages.length - 1;

            return (
              <div
                key={pIdx}
                className="print-sheet-page bg-white text-black relative flex flex-col items-center justify-center overflow-hidden"
                style={{
                  width: `${paperDims.widthMm}mm`,
                  height: `${paperDims.heightMm}mm`,
                  padding: `${marginVertMm}mm ${marginHorizMm}mm`,
                  boxSizing: 'border-box',
                  pageBreakAfter: isLast ? 'auto' : 'always',
                  breakAfter: isLast ? 'page' : 'auto'
                }}
              >
                {renderCardGrid(pageSlots, true)}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
