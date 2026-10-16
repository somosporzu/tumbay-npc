import React, { useState, useRef } from 'react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { toPng } from 'html-to-image';
import html2canvas from 'html2canvas';
import confetti from 'canvas-confetti';
import {
  X,
  FileArchive,
  Download,
  CheckSquare,
  Square,
  Sparkles,
  Loader2,
  FileJson,
  FileText,
  Image as ImageIcon,
  Shield,
  Layers,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { NpcData } from '../types/npc';
import { CardVisual } from './CardVisual';
import { calculateNpcStats } from '../utils/calculator';

interface ZipExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  npcs: NpcData[];
  currentNpcId?: string;
}

export const ZipExportModal: React.FC<ZipExportModalProps> = ({
  isOpen,
  onClose,
  npcs,
  currentNpcId
}) => {
  // Selection state
  const [selectedIds, setSelectedIds] = useState<string[]>(() => npcs.map((n) => n.id));
  const [includeJsonBackup, setIncludeJsonBackup] = useState<boolean>(true);
  const [includeReadme, setIncludeReadme] = useState<boolean>(true);
  const [isInkSaver, setIsInkSaver] = useState<boolean>(false);

  // Export progress state
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [progress, setProgress] = useState<{
    current: number;
    total: number;
    currentName: string;
    step: 'idle' | 'rendering' | 'zipping' | 'done' | 'error';
    errorMsg?: string;
  }>({
    current: 0,
    total: npcs.length,
    currentName: '',
    step: 'idle'
  });

  // Dedicated offscreen render stage
  const renderContainerRef = useRef<HTMLDivElement>(null);
  const [activeRenderNpc, setActiveRenderNpc] = useState<NpcData | null>(null);

  if (!isOpen) return null;

  const toggleSelectAll = () => {
    if (selectedIds.length === npcs.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(npcs.map((n) => n.id));
    }
  };

  const toggleNpc = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const sanitizeFilename = (name: string): string => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9_-]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
  };

  const renderCurrentStageToPng = async (): Promise<string> => {
    if (!renderContainerRef.current) {
      throw new Error('Contenedor de renderizado no disponible');
    }

    const cardElement = renderContainerRef.current.querySelector(
      '#papa-tumbay-card, #papa-tumbay-card-back'
    ) as HTMLElement | null;

    const targetEl = cardElement || renderContainerRef.current;

    // Small delay to ensure styles, fonts and images are ready
    await new Promise((r) => setTimeout(r, 70));

    try {
      return await toPng(targetEl, {
        width: 375,
        height: 525,
        canvasWidth: 750,
        canvasHeight: 1050,
        pixelRatio: 1.0,
        quality: 1.0,
        skipFonts: true,
        fontEmbedCSS: '',
        backgroundColor: '#141A17',
        style: {
          transform: 'none',
          margin: '0'
        }
      });
    } catch (err) {
      console.warn('html-to-image error en ZIP export, usando fallback html2canvas:', err);
      const canvas = await html2canvas(targetEl, {
        scale: 2.0,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#141A17',
        logging: false
      });
      return canvas.toDataURL('image/png', 1.0);
    }
  };

  const handleStartZipExport = async () => {
    const npcsToExport = npcs.filter((n) => selectedIds.includes(n.id));
    if (npcsToExport.length === 0) {
      alert('Por favor selecciona al menos una criatura para exportar.');
      return;
    }

    setIsExporting(true);
    const totalItems = npcsToExport.length;
    setProgress({
      current: 0,
      total: totalItems,
      currentName: 'Iniciando generación...',
      step: 'rendering'
    });

    const zip = new JSZip();
    const folder = zip.folder('cartas_papa_tumbay') || zip;

    try {
      // 1. Render all selected cards
      for (let i = 0; i < npcsToExport.length; i++) {
        const npc = npcsToExport[i];
        const numStr = String(i + 1).padStart(2, '0');
        const cleanName = sanitizeFilename(npc.name);
        const fileName = `${numStr}_${cleanName}_${npc.rank.toLowerCase()}_na${npc.targetNA}.png`;

        setProgress({
          current: i + 1,
          total: totalItems,
          currentName: `Renderizando carta ${i + 1} de ${npcsToExport.length}: «${npc.name}»...`,
          step: 'rendering'
        });

        // Set card in render stage
        setActiveRenderNpc(npc);

        // Wait for React to render the stage
        await new Promise((r) => setTimeout(r, 90));

        // Capture PNG data URL
        const dataUrl = await renderCurrentStageToPng();
        const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '');

        folder.file(fileName, base64Data, { base64: true });
      }

      // 3. Optionally include JSON backup
      if (includeJsonBackup) {
        const backupPayload = {
          version: '1.2.0',
          exportedAt: new Date().toISOString(),
          appName: 'Papa Tumbay - Creador de Cartas y Compendio NPC',
          npcsCount: npcsToExport.length,
          npcs: npcsToExport
        };
        folder.file(
          'criaturas_papa_tumbay_backup.json',
          JSON.stringify(backupPayload, null, 2)
        );
      }

      // 4. Optionally include README text file
      if (includeReadme) {
        let readmeText = `========================================================\n`;
        readmeText += `PAPA TUMBAY RPG - COMPENDIO DE CARTAS EN FORMATO PNG\n`;
        readmeText += `Fecha de exportación: ${new Date().toLocaleDateString('es-ES')}\n`;
        readmeText += `Total de cartas: ${npcsToExport.length}\n`;
        readmeText += `Resolución: 750 × 1050 px (300 DPI estándar 63.5 × 88.9 mm / 2.5″ × 3.5″)\n`;
        readmeText += `========================================================\n\n`;
        readmeText += `ÍNDICE DE CRIATURAS:\n\n`;

        npcsToExport.forEach((npc, index) => {
          const stats = calculateNpcStats(npc);
          readmeText += `${index + 1}. ${npc.name.toUpperCase()}\n`;
          readmeText += `   - Rango: ${npc.rank} | Amenaza/NA: ${stats.targetNA} | Amenaza Efectiva: ${stats.effectiveThreat}\n`;
          readmeText += `   - Aptitud: +${stats.finalAptitude} (tiradas 3d6) | Acciones: ${stats.finalActions}\n`;
          readmeText += `   - Barreras Defensivas: ${stats.finalBarriers.map((b) => `[ND ${b}]`).join(' → ')}\n`;
          readmeText += `   - Concepto Principal: ${npc.mainConcept}${npc.secondaryConcepts.length > 0 ? ` (${npc.secondaryConcepts.join(', ')})` : ''}\n`;
          readmeText += `   - Rasgos: ${npc.selectedTraits.map((t) => `${t.name}${(t.count ?? 1) > 1 ? ` x${t.count}` : ''}`).join(', ') || 'Ninguno'}\n`;
          readmeText += `   - Comportamiento: ${npc.behaviorType} (${npc.behaviorDescription})\n`;
          if (npc.quote) readmeText += `   - Cita: "${npc.quote}"\n`;
          readmeText += `\n`;
        });

        readmeText += `\nCONSEJOS DE IMPRESIÓN:\n`;
        readmeText += `- Imprime a escala 100% (sin ajustar márgenes) para obtener el tamaño oficial de 63.5 × 88.9 mm.\n`;
        readmeText += `- Para imprimir planillas de 8 cartas listas en papel Carta u Oficio con sangrado y guías de corte, utiliza la opción «Hoja 8 Cartas» dentro de la aplicación.\n`;

        folder.file('INDICE_CRIATURAS.txt', readmeText);
      }

      // 5. Generate ZIP file
      setProgress({
        current: totalItems,
        total: totalItems,
        currentName: 'Comprimiendo y empaquetando archivo ZIP...',
        step: 'zipping'
      });

      const zipBlob = await zip.generateAsync(
        {
          type: 'blob',
          compression: 'DEFLATE',
          compressionOptions: { level: 6 }
        },
        (metadata) => {
          setProgress((prev) => ({
            ...prev,
            currentName: `Comprimiendo ZIP: ${Math.round(metadata.percent)}%`
          }));
        }
      );

      const dateStr = new Date().toISOString().split('T')[0];
      const zipFileName = `cartas_papa_tumbay_png_${npcsToExport.length}_criaturas_${dateStr}.zip`;

      saveAs(zipBlob, zipFileName);

      setProgress({
        current: totalItems,
        total: totalItems,
        currentName: `¡Exportación completada exitosamente! (${zipFileName})`,
        step: 'done'
      });

      // Celebration
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch {
        // ignore
      }
    } catch (err: unknown) {
      console.error('Error generando archivo ZIP:', err);
      const errMsg = err instanceof Error ? err.message : 'Error desconocido al crear el archivo ZIP';
      setProgress((prev) => ({
        ...prev,
        step: 'error',
        errorMsg: errMsg
      }));
    } finally {
      setIsExporting(false);
      setActiveRenderNpc(null);
    }
  };

  const progressPercent =
    progress.total > 0 ? Math.min(100, Math.round((progress.current / progress.total) * 100)) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#FAF7F0] rounded-2xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border-2 border-[#D9C8A8] overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#D8C7A5] flex items-center justify-between bg-[#FAF6EE]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#255C3E] text-white rounded-xl shadow-xs">
              <FileArchive className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-heading text-lg sm:text-xl font-black text-[#261E16]">
                Exportar Colección en Archivo ZIP
              </h2>
              <p className="text-xs text-[#6B5742] font-serif">
                Descarga todas tus cartas en formato PNG alta resolución (750 × 1050 px @ 300 DPI) juntas en un .zip.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isExporting}
            className="p-1.5 text-[#735F48] hover:text-[#261E16] hover:bg-[#EAE0CF] rounded-lg transition-colors cursor-pointer disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {/* Quick selection bar */}
          <div className="flex items-center justify-between bg-[#FAF3E2] p-3 rounded-xl border border-[#DECDB3]">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleSelectAll}
                disabled={isExporting}
                className="flex items-center gap-1.5 text-xs font-bold text-[#453422] hover:text-[#1F150C] transition-colors cursor-pointer"
              >
                {selectedIds.length === npcs.length ? (
                  <CheckSquare className="w-4 h-4 text-[#255C3E]" />
                ) : (
                  <Square className="w-4 h-4 text-[#7A644E]" />
                )}
                <span>
                  {selectedIds.length === npcs.length
                    ? 'Deseleccionar todas'
                    : 'Seleccionar todas las criaturas'}
                </span>
              </button>
            </div>

            <span className="text-xs font-bold text-[#6B5742]">
              {selectedIds.length} de {npcs.length} seleccionadas
            </span>
          </div>

          {/* List of NPCs to export */}
          <div className="border border-[#DBCAB0] rounded-xl bg-[#FFFDF9] max-h-48 overflow-y-auto divide-y divide-[#EFE4D2]">
            {npcs.map((npc) => {
              const isSelected = selectedIds.includes(npc.id);
              const isCurrent = npc.id === currentNpcId;
              const stats = calculateNpcStats(npc);

              return (
                <label
                  key={npc.id}
                  className={`flex items-center justify-between p-2.5 hover:bg-[#FAF5EC] transition-colors cursor-pointer select-none ${
                    isSelected ? 'bg-[#F9F4EB]/60' : 'opacity-65'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleNpc(npc.id)}
                      disabled={isExporting}
                      className="rounded border-[#B8A484] text-[#255C3E] focus:ring-0 w-4 h-4"
                    />
                    <div className="truncate">
                      <span className="text-xs font-bold text-[#2A2016] flex items-center gap-1.5 truncate">
                        {npc.name}
                        {isCurrent && (
                          <span className="text-[9px] px-1.5 py-0.2 bg-[#7C5A37] text-white rounded font-mono">
                            Activa
                          </span>
                        )}
                      </span>
                      <span className="text-[10px] text-[#7A644E]">
                        Rango: {npc.rank} • NA: {stats.targetNA} • {stats.finalBarriers.length} Barreras • Aptitud +{stats.finalAptitude}
                      </span>
                    </div>
                  </div>

                  <span className="text-[10.5px] font-mono text-[#8C5D29] bg-[#F4E9D5] px-2 py-0.5 rounded shrink-0">
                    PNG 750×1050
                  </span>
                </label>
              );
            })}
          </div>

          {/* Additional Options */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-3.5 bg-[#FAF3E2] rounded-xl border border-[#DECDB3]">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-[#3B2C1E]">
              <input
                type="checkbox"
                checked={includeJsonBackup}
                onChange={(e) => setIncludeJsonBackup(e.target.checked)}
                disabled={isExporting}
                className="rounded border-[#B8A484] text-[#255C3E] focus:ring-0 w-4 h-4"
              />
              <span className="flex items-center gap-1">
                <FileJson className="w-3.5 h-3.5 text-[#255C3E]" />
                Incluir copia JSON editable
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-[#3B2C1E]">
              <input
                type="checkbox"
                checked={includeReadme}
                onChange={(e) => setIncludeReadme(e.target.checked)}
                disabled={isExporting}
                className="rounded border-[#B8A484] text-[#255C3E] focus:ring-0 w-4 h-4"
              />
              <span className="flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-[#7C5A37]" />
                Incluir índice y estadísticas (README.txt)
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-[#3B2C1E]">
              <input
                type="checkbox"
                checked={isInkSaver}
                onChange={(e) => setIsInkSaver(e.target.checked)}
                disabled={isExporting}
                className="rounded border-[#B8A484] text-[#255C3E] focus:ring-0 w-4 h-4"
              />
              <span className="flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-[#7C5A37]" />
                Modo Ahorro de Tinta (Blanco y Negro)
              </span>
            </label>
          </div>

          {/* Progress notification area */}
          {progress.step !== 'idle' && (
            <div
              className={`p-3.5 rounded-xl border space-y-2 transition-all ${
                progress.step === 'error'
                  ? 'bg-red-50 border-red-300 text-red-900'
                  : progress.step === 'done'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                  : 'bg-[#F2E8D5] border-[#DECAB0] text-[#3D2F1F]'
              }`}
            >
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="flex items-center gap-2">
                  {progress.step === 'rendering' || progress.step === 'zipping' ? (
                    <Loader2 className="w-4 h-4 animate-spin text-[#255C3E]" />
                  ) : progress.step === 'done' ? (
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-600" />
                  )}
                  {progress.currentName}
                </span>
                <span>{progressPercent}%</span>
              </div>

              {/* Progress bar track */}
              <div className="w-full h-2 bg-[#E1D3BD] rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    progress.step === 'error'
                      ? 'bg-red-500'
                      : progress.step === 'done'
                      ? 'bg-emerald-600'
                      : 'bg-[#255C3E]'
                  }`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              {progress.errorMsg && (
                <p className="text-[11px] text-red-700 mt-1 font-mono">{progress.errorMsg}</p>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-[#D8C7A5] bg-[#FAF6EE] flex items-center justify-between gap-3">
          <div className="text-xs text-[#6B5742] font-serif">
            📦 Archivo ZIP sin pérdida con compresión DEFLATE.
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isExporting}
              className="px-4 py-2 bg-[#EFE8D6] hover:bg-[#E2D7BE] text-[#473623] text-xs font-bold rounded-lg border border-[#CDBBA0] transition-colors cursor-pointer disabled:opacity-50"
            >
              Cerrar
            </button>

            <button
              type="button"
              onClick={handleStartZipExport}
              disabled={isExporting || selectedIds.length === 0}
              className="px-4 py-2 bg-[#255C3E] hover:bg-[#1C462F] text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Procesando ZIP...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Descargar {selectedIds.length} Cartas (.ZIP)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Offscreen / Hidden Render Stage */}
        <div
          ref={renderContainerRef}
          style={{
            position: 'fixed',
            left: '-9999px',
            top: '-9999px',
            width: '375px',
            height: '525px',
            overflow: 'hidden',
            zIndex: -9999,
            pointerEvents: 'none'
          }}
        >
          {activeRenderNpc ? (
            <CardVisual npc={activeRenderNpc} isInkSaver={isInkSaver} />
          ) : null}
        </div>
      </div>
    </div>
  );
};
