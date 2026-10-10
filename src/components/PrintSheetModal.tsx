import React, { useState, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { NpcData } from '../types/npc';
import { CardVisual } from './CardVisual';
import { exportEightCardSheetAsPdf } from '../utils/exportUtils';
import {
  X,
  Printer,
  Download,
  Scissors,
  FileText,
  Copy,
  Layers,
  Sparkles,
  RotateCcw,
  Check
} from 'lucide-react';

interface PrintSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentNpc: NpcData;
  availableNpcs: NpcData[];
}

export type PaperSize = 'a4' | 'carta';

export const PrintSheetModal: React.FC<PrintSheetModalProps> = ({
  isOpen,
  onClose,
  currentNpc,
  availableNpcs
}) => {
  const sheetRef = useRef<HTMLDivElement>(null);
  const [paperSize, setPaperSize] = useState<PaperSize>('a4');
  const [showCutGuides, setShowCutGuides] = useState<boolean>(true);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [isPrinting, setIsPrinting] = useState<boolean>(false);

  // 8 slots for the cards
  const [selectedSlots, setSelectedSlots] = useState<NpcData[]>(() => {
    // Initial: 8 cards of current NPC (or filled with available)
    return Array.from({ length: 8 }, () => currentNpc);
  });

  // Direct print with react-to-print
  const handlePrintSheet = useReactToPrint({
    contentRef: sheetRef,
    documentTitle: `hoja_8_cartas_${paperSize}_papa_tumbay`,
    onBeforePrint: async () => {
      setIsPrinting(true);
    },
    onAfterPrint: () => {
      setIsPrinting(false);
    },
    pageStyle: `
      @page {
        size: ${paperSize === 'a4' ? '297mm 210mm' : '11in 8.5in'};
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
          width: ${paperSize === 'a4' ? '297mm' : '11in'} !important;
          height: ${paperSize === 'a4' ? '210mm' : '8.5in'} !important;
          background: #FFFFFF !important;
          overflow: hidden !important;
        }
        .no-print {
          display: none !important;
        }
      }
    `
  });

  if (!isOpen) return null;

  // Change card in a specific slot
  const handleSlotChange = (slotIndex: number, npcId: string) => {
    const found = availableNpcs.find((n) => n.id === npcId) || currentNpc;
    setSelectedSlots((prev) => {
      const next = [...prev];
      next[slotIndex] = found;
      return next;
    });
  };

  // Quick fill: fill all 8 slots with current creature
  const handleFillAllCurrent = () => {
    setSelectedSlots(Array.from({ length: 8 }, () => currentNpc));
  };

  // Quick fill: distribute available creatures across 8 slots
  const handleDistributeAll = () => {
    setSelectedSlots(
      Array.from({ length: 8 }, (_, i) => {
        return availableNpcs[i % availableNpcs.length] || currentNpc;
      })
    );
  };

  // Export PDF with jsPDF
  const handleExportPdf = async () => {
    if (!sheetRef.current) return;
    setIsExporting(true);
    try {
      await exportEightCardSheetAsPdf(
        sheetRef.current,
        paperSize,
        `hoja_8_cartas_${paperSize}_${currentNpc.name.toLowerCase().replace(/\s+/g, '_')}.pdf`
      );
    } catch {
      alert('Hubo un error al generar el PDF de la hoja de 8 cartas.');
    } finally {
      setIsExporting(false);
    }
  };

  const isA4 = paperSize === 'a4';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#FAF7F0] rounded-2xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl border-2 border-[#D9C8A8] overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#D8C7A5] flex items-center justify-between bg-[#FAF6EE]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#7C5A37] text-white rounded-xl shadow-xs">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-heading text-lg sm:text-xl font-black text-[#261E16]">
                Hoja de Impresión: 8 Cartas Coleccionables
              </h2>
              <p className="text-xs text-[#6B5742] font-serif">
                Distribución en cuadrícula 4×2 a escala real 300 DPI (63.5 × 88.9 mm / 2.5″ × 3.5″ por carta).
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-[#735F48] hover:text-[#261E16] hover:bg-[#EAE0CF] rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-5 flex-1">
          {/* Controls Bar: Paper Size & Cut Guides */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 p-3.5 bg-[#FAF3E2] rounded-xl border border-[#DECDB3]">
            {/* Paper Size selector */}
            <div className="md:col-span-5 space-y-1.5">
              <label className="text-[11px] font-black uppercase tracking-wider text-[#5C452C] block">
                1. Tamaño del Papel (Horizontal / Apaisado)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPaperSize('a4')}
                  className={`px-3 py-2 text-xs font-bold rounded-lg border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    paperSize === 'a4'
                      ? 'bg-[#7C5A37] text-white border-[#5A3F24] shadow-xs'
                      : 'bg-[#FAF6EE] text-[#473623] border-[#CBB895] hover:bg-[#EFE8D6]'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>A4 (297 × 210 mm)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaperSize('carta')}
                  className={`px-3 py-2 text-xs font-bold rounded-lg border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    paperSize === 'carta'
                      ? 'bg-[#7C5A37] text-white border-[#5A3F24] shadow-xs'
                      : 'bg-[#FAF6EE] text-[#473623] border-[#CBB895] hover:bg-[#EFE8D6]'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Carta (279.4 × 215.9 mm)</span>
                </button>
              </div>
            </div>

            {/* Cut Guides Toggle */}
            <div className="md:col-span-3 space-y-1.5">
              <label className="text-[11px] font-black uppercase tracking-wider text-[#5C452C] block">
                2. Guías de Corte
              </label>
              <label className="flex items-center gap-2 p-2 bg-[#FAF6EE] border border-[#CBB895] rounded-lg cursor-pointer hover:bg-[#EFE8D6] transition-colors">
                <input
                  type="checkbox"
                  checked={showCutGuides}
                  onChange={(e) => setShowCutGuides(e.target.checked)}
                  className="rounded border-[#B8A484] text-[#7C5A37] focus:ring-0 w-4 h-4"
                />
                <span className="text-xs font-bold text-[#3B2C1E] flex items-center gap-1">
                  <Scissors className="w-3.5 h-3.5 text-[#7C5A37]" />
                  Incluir líneas de recorte
                </span>
              </label>
            </div>

            {/* Quick Fill Actions */}
            <div className="md:col-span-4 space-y-1.5">
              <label className="text-[11px] font-black uppercase tracking-wider text-[#5C452C] block">
                3. Relleno Rápido de Cartas
              </label>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleFillAllCurrent}
                  className="flex-1 px-2.5 py-1.5 bg-[#EFE6D2] hover:bg-[#E2D6BC] text-[#3E2E1D] text-xs font-bold rounded-lg border border-[#C8B490] transition-all flex items-center justify-center gap-1 cursor-pointer"
                  title="Llenar los 8 espacios con la criatura actual"
                >
                  <Copy className="w-3 h-3 text-[#7C5A37]" />
                  Llenar ×8 con actual
                </button>
                <button
                  type="button"
                  onClick={handleDistributeAll}
                  className="px-2.5 py-1.5 bg-[#EFE6D2] hover:bg-[#E2D6BC] text-[#3E2E1D] text-xs font-bold rounded-lg border border-[#C8B490] transition-all flex items-center justify-center gap-1 cursor-pointer"
                  title="Distribuir las diferentes criaturas disponibles"
                >
                  <Sparkles className="w-3 h-3 text-[#7C5A37]" />
                  Variar
                </button>
              </div>
            </div>
          </div>

          {/* Slots selector row */}
          <div className="space-y-2">
            <span className="text-xs font-black uppercase text-[#473623] block">
              Cartas seleccionadas para cada ranura (1 a 8):
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
              {selectedSlots.map((slotNpc, index) => (
                <div
                  key={index}
                  className="p-2 bg-[#FAF6EE] rounded-xl border border-[#D5C4A7] flex flex-col justify-between gap-1.5 shadow-2xs"
                >
                  <div className="flex items-center justify-between text-[10px] font-black text-[#7A644E]">
                    <span>Ranura #{index + 1}</span>
                    <span className="text-[9px] px-1 bg-[#EBE0CD] rounded">
                      {index < 4 ? 'Fila 1' : 'Fila 2'}
                    </span>
                  </div>
                  <div className="text-xs font-bold text-[#2A2016] truncate" title={slotNpc.name}>
                    {slotNpc.name}
                  </div>
                  <select
                    value={slotNpc.id}
                    onChange={(e) => handleSlotChange(index, e.target.value)}
                    className="w-full bg-[#FFFDF7] border border-[#CBB895] rounded px-1.5 py-1 text-[10.5px] font-medium text-[#2A2016] cursor-pointer"
                  >
                    {availableNpcs.map((n) => (
                      <option key={n.id} value={n.id}>
                        {n.name} ({n.rank})
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>

          {/* Visual Preview Container */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-[#473623] flex items-center gap-1.5">
                Vista Previa de la Hoja de Impresión ({isA4 ? 'A4' : 'Carta'} Apaisada)
              </span>
              <span className="text-[11px] text-[#7A644E] font-medium">
                Dimensiones: {isA4 ? '297 × 210 mm' : '279.4 × 215.9 mm'} • 4 columnas × 2 filas
              </span>
            </div>

            {/* Scrollable preview area */}
            <div className="p-4 bg-[#4A3D2F]/20 rounded-2xl border-2 border-dashed border-[#C5B393] overflow-x-auto flex justify-center items-center">
              {/* THE PRINTABLE SHEET ELEMENT (EXACT MM DIMENSIONS) */}
              <div
                ref={sheetRef}
                id="print-sheet-8-cards"
                className="bg-white text-black relative flex flex-col items-center justify-center shadow-2xl transition-all"
                style={{
                  width: isA4 ? '297mm' : '279.4mm',
                  height: isA4 ? '210mm' : '215.9mm',
                  padding: isA4 ? '16.1mm 21.5mm' : '19.05mm 12.7mm',
                  boxSizing: 'border-box'
                }}
              >
                {/* 4x2 Grid of 8 cards */}
                <div
                  className="grid grid-cols-4 grid-rows-2 relative"
                  style={{
                    width: '254mm',
                    height: '177.8mm',
                    boxSizing: 'border-box'
                  }}
                >
                  {/* Crop guides / Cut marks if enabled */}
                  {showCutGuides && (
                    <>
                      {/* Top & Bottom cut ticks along the vertical lines (x = 0, 63.5, 127, 190.5, 254 mm) */}
                      {[0, 63.5, 127, 190.5, 254].map((x) => (
                        <React.Fragment key={`v-ticks-${x}`}>
                          {/* Top tick mark */}
                          <div
                            className="absolute border-l border-black"
                            style={{
                              left: `${x}mm`,
                              top: '-8mm',
                              height: '6mm',
                              width: '1px'
                            }}
                          />
                          {/* Bottom tick mark */}
                          <div
                            className="absolute border-l border-black"
                            style={{
                              left: `${x}mm`,
                              bottom: '-8mm',
                              height: '6mm',
                              width: '1px'
                            }}
                          />
                        </React.Fragment>
                      ))}

                      {/* Left & Right cut ticks along the horizontal lines (y = 0, 88.9, 177.8 mm) */}
                      {[0, 88.9, 177.8].map((y) => (
                        <React.Fragment key={`h-ticks-${y}`}>
                          {/* Left tick mark */}
                          <div
                            className="absolute border-t border-black"
                            style={{
                              top: `${y}mm`,
                              left: '-8mm',
                              width: '6mm',
                              height: '1px'
                            }}
                          />
                          {/* Right tick mark */}
                          <div
                            className="absolute border-t border-black"
                            style={{
                              top: `${y}mm`,
                              right: '-8mm',
                              width: '6mm',
                              height: '1px'
                            }}
                          />
                        </React.Fragment>
                      ))}
                    </>
                  )}

                  {/* Render the 8 cards */}
                  {selectedSlots.map((npcItem, idx) => (
                    <div
                      key={idx}
                      className="relative overflow-hidden flex items-center justify-center"
                      style={{
                        width: '63.5mm',
                        height: '88.9mm',
                        boxSizing: 'border-box',
                        outline: showCutGuides ? '0.5px dashed rgba(0,0,0,0.35)' : 'none'
                      }}
                    >
                      {/* Scaled Card: 375px x 525px scaled down by 0.64 fits exactly into 240px x 336px (63.5mm x 88.9mm) */}
                      <div
                        style={{
                          width: '375px',
                          height: '525px',
                          transform: 'scale(0.64)',
                          transformOrigin: 'top left',
                          position: 'absolute',
                          top: 0,
                          left: 0
                        }}
                      >
                        <CardVisual npc={npcItem} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-[#D8C7A5] bg-[#FAF6EE] flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-[#6B5742] font-serif">
            💡 Consejo: Selecciona <strong>«Ajustar al área imprimible»</strong> o escala 100% en el diálogo de impresión para corte exacto.
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[#EFE8D6] hover:bg-[#E2D7BE] text-[#473623] text-xs font-bold rounded-lg border border-[#CDBBA0] transition-colors cursor-pointer"
            >
              Cerrar
            </button>

            <button
              type="button"
              onClick={handleExportPdf}
              disabled={isExporting || isPrinting}
              className="px-4 py-2 bg-[#FAF6EE] hover:bg-[#EFE6D2] text-[#3D3020] text-xs font-bold rounded-lg border border-[#CBB895] shadow-xs flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
            >
              <Download className="w-4 h-4 text-[#7C5A37]" />
              <span>{isExporting ? 'Generando PDF...' : 'Descargar PDF (8 Cartas)'}</span>
            </button>

            <button
              type="button"
              onClick={() => handlePrintSheet()}
              disabled={isPrinting || isExporting}
              className="px-4 py-2 bg-[#7C5A37] hover:bg-[#68492A] text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>{isPrinting ? 'Preparando...' : 'Imprimir Hoja (react-to-print)'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
