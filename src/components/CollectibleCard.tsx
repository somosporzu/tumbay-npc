import React, { useRef, useState, useEffect } from 'react';
import { useReactToPrint } from 'react-to-print';
import { NpcData, CalculatedNpcStats, CardFrameTheme } from '../types/npc';
import { exportElementAsPng, exportElementAsPdf } from '../utils/exportUtils';
import { PorzuuLogo } from './PorzuuLogo';
import {
  Download,
  FileText,
  Printer,
  Shield,
  Sliders,
  Upload,
  RotateCcw,
  Palette,
  Check,
  Layers,
  Sparkles,
  Move,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Eye,
  LayoutGrid,
  Link as LinkIcon,
  HelpCircle,
  ArrowUp,
  Pin,
  Image as ImageIcon
} from 'lucide-react';
import { getAvatarPreset, AVATAR_PRESETS } from '../data/avatars';
import { getCoordinatedTheme, CARD_COLOR_PRESETS, FRAME_THEME_PRESETS } from '../utils/cardTheme';
import { PrintSheetModal } from './PrintSheetModal';
import { CardVisual } from './CardVisual';

interface CollectibleCardProps {
  npc: NpcData;
  stats: CalculatedNpcStats;
  availableNpcs?: NpcData[];
  onUpdateDamagedBarriers?: (damagedCount: number) => void;
  onUpdateImageFit?: (fit: NonNullable<NpcData['imageFit']>) => void;
  onUpdateAvatarUrl?: (url: string, initialFit?: NonNullable<NpcData['imageFit']>) => void;
  onUpdateAvatarPreset?: (presetId: string) => void;
  onUpdateColorTheme?: (colorHex: string) => void;
  onUpdateFrameTheme?: (frameTheme: CardFrameTheme) => void;
}

type WorkbenchTab = 'image' | 'appearance' | 'export';

export const CollectibleCard: React.FC<CollectibleCardProps> = ({
  npc,
  stats,
  availableNpcs = [],
  onUpdateDamagedBarriers,
  onUpdateImageFit,
  onUpdateAvatarUrl,
  onUpdateAvatarPreset,
  onUpdateColorTheme,
  onUpdateFrameTheme
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const cardContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isExporting, setIsExporting] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [showCutMarks, setShowCutMarks] = useState(false);
  const [brokenBarriers, setBrokenBarriers] = useState<number[]>([]);
  const [showPrintSheetModal, setShowPrintSheetModal] = useState(false);

  // Active workbench section and view mode
  const [activeTab, setActiveTab] = useState<WorkbenchTab>('image');
  const [viewMode, setViewMode] = useState<'tabs' | 'all'>('tabs');
  const [studioScrollMode, setStudioScrollMode] = useState<boolean>(true);

  // Image upload feedback states
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [imageUploadStatus, setImageUploadStatus] = useState<string | null>(null);

  // Preview zoom scale so the card fits perfectly on any screen height
  const [previewScale, setPreviewScale] = useState<number>(1);

  // Dynamic vertical centering offset for the sticky card (centered in the viewport)
  const stickyTopOffset =
    previewScale === 1
      ? 'clamp(112px, calc(50vh - 285px), 260px)'
      : previewScale === 0.88
      ? 'clamp(112px, calc(50vh - 252px), 260px)'
      : 'clamp(112px, calc(50vh - 225px), 260px)';

  // Mobile floating helper visibility
  const [showMobileFloating, setShowMobileFloating] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (cardContainerRef.current) {
        const rect = cardContainerRef.current.getBoundingClientRect();
        // If bottom of the card is scrolled above the screen, show mobile floating button
        setShowMobileFloating(rect.bottom < 150);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Direct print using react-to-print hook configured for standard 750x1050 px at 300 DPI (2.5 x 3.5 in)
  const handleDirectPrint = useReactToPrint({
    contentRef: cardRef,
    documentTitle: `carta_${npc.name.toLowerCase().replace(/\s+/g, '_')}_750x1050`,
    onBeforePrint: async () => {
      setIsPrinting(true);
    },
    onAfterPrint: () => {
      setIsPrinting(false);
    },
    pageStyle: `
      @page {
        size: 2.5in 3.5in;
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
          width: 2.5in !important;
          height: 3.5in !important;
          background: #181F1C !important;
          overflow: hidden !important;
        }
        #papa-tumbay-card {
          width: 100% !important;
          height: 100% !important;
          margin: 0 auto !important;
          box-shadow: none !important;
          border-radius: 0 !important;
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }
        .no-print {
          display: none !important;
        }
      }
    `
  });

  // Coordinated Card Theme based on user-selected color
  const activeColor = npc.cardColorTheme || '#3D6643';
  const theme = getCoordinatedTheme(activeColor);

  // Local image adjustment state
  const imageFit = npc.imageFit || {
    scale: 1,
    offsetX: 0,
    offsetY: 0,
    brightness: 100,
    overlayDim: 45,
    fitMode: 'cover'
  };

  const scale = imageFit.scale ?? 1;
  const offsetX = imageFit.offsetX ?? 0;
  const offsetY = imageFit.offsetY ?? 0;
  const brightness = imageFit.brightness ?? 100;
  const overlayDim = imageFit.overlayDim ?? 45;
  const fitMode = imageFit.fitMode ?? 'cover';

  const handleFitChange = (field: keyof NonNullable<NpcData['imageFit']>, value: any) => {
    if (onUpdateImageFit) {
      onUpdateImageFit({
        ...imageFit,
        [field]: value
      });
    }
  };

  const handleFitChangeMultiple = (updates: Partial<NonNullable<NpcData['imageFit']>>) => {
    if (onUpdateImageFit) {
      onUpdateImageFit({
        ...imageFit,
        ...updates
      });
    }
  };

  const handleResetFit = () => {
    if (onUpdateImageFit) {
      onUpdateImageFit({
        scale: 1,
        offsetX: 0,
        offsetY: 0,
        brightness: 100,
        overlayDim: 45,
        fitMode: 'cover'
      });
    }
  };

  const handleSetFitMode = (mode: 'cover' | 'contain' | 'width' | 'height') => {
    handleFitChangeMultiple({
      fitMode: mode,
      scale: mode === 'contain' ? 1 : mode === 'cover' ? 1.05 : 1,
      offsetX: 0,
      offsetY: 0
    });
  };

  const handleFrameSelect = (frameId: CardFrameTheme) => {
    if (onUpdateFrameTheme) {
      onUpdateFrameTheme(frameId);
    }
  };

  const toggleBarrier = (index: number) => {
    let next: number[];
    if (brokenBarriers.includes(index)) {
      next = brokenBarriers.filter((i) => i !== index);
    } else {
      next = [...brokenBarriers, index];
    }
    setBrokenBarriers(next);
    if (onUpdateDamagedBarriers) {
      onUpdateDamagedBarriers(next.length);
    }
  };

  const handleExportPng = async () => {
    if (!cardRef.current) return;
    setIsExporting(true);
    try {
      await exportElementAsPng(
        cardRef.current,
        `carta_${npc.name.toLowerCase().replace(/\s+/g, '_')}.png`,
        { width: 750, height: 1050 }
      );
    } catch {
      alert('Hubo un problema al exportar el PNG a 750x1050 px.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPdf = async () => {
    if (!cardRef.current) return;
    setIsExporting(true);
    try {
      await exportElementAsPdf(
        cardRef.current,
        `carta_${npc.name.toLowerCase().replace(/\s+/g, '_')}.pdf`,
        'card'
      );
    } catch {
      alert('Hubo un problema al exportar el PDF.');
    } finally {
      setIsExporting(false);
    }
  };

  // Robust file processor with client-side downscaling for large photos
  const processImageFile = (file: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setImageUploadStatus('Por favor selecciona un archivo de imagen válido (JPG, PNG, WebP o SVG).');
      return;
    }
    setImageUploadStatus(null);
    setIsProcessingImage(true);

    const defaultFit: NonNullable<NpcData['imageFit']> = {
      scale: 1,
      offsetX: 0,
      offsetY: 0,
      brightness: 100,
      overlayDim: 45,
      fitMode: 'cover'
    };

    const reader = new FileReader();
    reader.onerror = () => {
      setImageUploadStatus('Error al leer el archivo de imagen.');
      setIsProcessingImage(false);
    };

    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (!dataUrl) {
        setIsProcessingImage(false);
        return;
      }

      // Optimize large raster images (> 2MB) using offscreen canvas to avoid lag
      if (file.size > 2 * 1024 * 1024 && file.type !== 'image/svg+xml') {
        const img = new Image();
        img.onload = () => {
          try {
            const maxDim = 1600;
            let { width, height } = img;
            if (width > maxDim || height > maxDim) {
              if (width > height) {
                height = Math.round((height * maxDim) / width);
                width = maxDim;
              } else {
                width = Math.round((width * maxDim) / height);
                height = maxDim;
              }
            }
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0, width, height);
              const compressed = canvas.toDataURL('image/jpeg', 0.9);
              if (onUpdateAvatarUrl) onUpdateAvatarUrl(compressed, defaultFit);
            } else if (onUpdateAvatarUrl) {
              onUpdateAvatarUrl(dataUrl, defaultFit);
            }
          } catch {
            if (onUpdateAvatarUrl) onUpdateAvatarUrl(dataUrl, defaultFit);
          } finally {
            setIsProcessingImage(false);
          }
        };
        img.onerror = () => {
          if (onUpdateAvatarUrl) onUpdateAvatarUrl(dataUrl, defaultFit);
          setIsProcessingImage(false);
        };
        img.src = dataUrl;
      } else {
        if (onUpdateAvatarUrl) {
          onUpdateAvatarUrl(dataUrl, defaultFit);
        }
        setIsProcessingImage(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
    // Always clear input value so re-selecting the exact same file fires onChange reliably
    if (e.target) {
      e.target.value = '';
    }
  };

  const handleColorSelect = (colorHex: string) => {
    if (onUpdateColorTheme) {
      onUpdateColorTheme(colorHex);
    }
  };

  const scrollToCard = () => {
    cardContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 pb-20">
      {/* Studio Header & Quick Bar */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 bg-[#FAF6EE] p-3 rounded-2xl border border-[#DFD3BE] shadow-2xs no-print">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 flex items-center justify-center shrink-0 drop-shadow-xs" title="Logo">
            <PorzuuLogo className="w-full h-full object-contain" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-heading font-black text-[#261E16] leading-tight flex items-center gap-2 flex-wrap">
              <span>Taller de Carta Coleccionable</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#EAE0CA] text-[#55402A] font-sans font-bold border border-[#D5C4A4]">
                Rango {npc.rank}
              </span>
              {npc.behaviorType && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#F3ECE0] text-[#634E35] font-sans font-bold border border-[#DACBB0]">
                  {npc.behaviorType}
                </span>
              )}
            </h2>
            <p className="text-[11px] text-[#705E4A] font-serif">
              {npc.name} • NA {stats.targetNA} • Aptitud +{stats.finalAptitude} • {stats.finalBarriers.length} Barreras
              {npc.behaviorDescription ? ` • ${npc.behaviorType}: ${npc.behaviorDescription}` : ''}
            </p>
          </div>
        </div>

        {/* Quick export and print shortcuts */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportPng}
            disabled={isExporting || isPrinting}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FAF2E2] hover:bg-[#EFE4CF] text-[#473623] text-xs font-bold rounded-lg border border-[#CBB895] transition-all shadow-2xs active:scale-95 disabled:opacity-50 cursor-pointer"
            title="Descargar PNG a exactamente 750 × 1050 px (300 DPI)"
          >
            <Download className="w-3.5 h-3.5 text-[#7C5A37]" />
            <span className="hidden sm:inline">Descargar</span> PNG
          </button>
          <button
            onClick={() => handleDirectPrint()}
            disabled={isPrinting || isExporting}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#7C5A37] hover:bg-[#68492A] text-white text-xs font-bold rounded-lg transition-all shadow-xs active:scale-95 disabled:opacity-50 cursor-pointer"
            title="Imprimir carta en formato estándar 2.5″ × 3.5″ a 300 DPI"
          >
            <Printer className="w-3.5 h-3.5 text-[#FAF6EE]" />
            <span>{isPrinting ? 'Preparando...' : 'Imprimir'}</span>
          </button>
        </div>
      </div>

      {/* Main 2-Column Studio Workbench */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start pb-28 relative">
        {/* Left Column: Centered & Pinned (Sticky) Card Showcase */}
        <div
          ref={cardContainerRef}
          className="lg:col-span-5 flex flex-col items-center justify-center lg:sticky self-start z-20 pb-2"
          style={{ top: stickyTopOffset }}
        >
          {/* Centered Card Status Pill */}
          <div className="mb-2 flex items-center justify-between w-[375px] max-w-full px-1 text-[11px] text-[#7A644D]">
            <span className="font-semibold flex items-center gap-1.5 text-[#5C452C] bg-[#EFE4CF] px-2 py-0.5 rounded-full border border-[#D5C2A2]">
              <span className="w-2 h-2 rounded-full bg-[#2E7D32] animate-pulse" />
              Tarjeta Centrada en Pantalla
            </span>
            <span className="text-[10px] text-[#78634C] font-mono">
              2.5″ × 3.5″ (300 DPI)
            </span>
          </div>

          {/* Card Viewport Scaling Wrapper */}
          <div
            className="transition-transform duration-150 origin-center flex flex-col items-center justify-center"
            style={{
              transform: previewScale !== 1 ? `scale(${previewScale})` : undefined,
              marginBottom: previewScale !== 1 ? `${(previewScale - 1) * 540}px` : 0
            }}
          >
            {/* Card Preview Container with optional cut marks */}
            <div
              className={`relative transition-all duration-200 ${
                showCutMarks
                  ? 'p-2.5 bg-[#EAE2D2] border border-dashed border-[#B8A484] rounded-2xl shadow-md'
                  : ''
              }`}
            >
              {/* Cut marks corner indicators */}
              {showCutMarks && (
                <>
                  <div className="absolute top-1 left-1 w-3.5 h-3.5 border-t-2 border-l-2 border-[#8C7558]" />
                  <div className="absolute top-1 right-1 w-3.5 h-3.5 border-t-2 border-r-2 border-[#8C7558]" />
                  <div className="absolute bottom-1 left-1 w-3.5 h-3.5 border-b-2 border-l-2 border-[#8C7558]" />
                  <div className="absolute bottom-1 right-1 w-3.5 h-3.5 border-b-2 border-r-2 border-[#8C7558]" />
                </>
              )}

              {/* The Actual Card Component with Direct Drag & Zoom */}
              <CardVisual
                cardRef={cardRef}
                npc={npc}
                stats={stats}
                brokenBarriers={brokenBarriers}
                onToggleBarrier={toggleBarrier}
                interactive={true}
                allowDirectPan={true}
                onPanChange={(newX, newY) => {
                  handleFitChangeMultiple({ offsetX: newX, offsetY: newY });
                }}
                onScaleChange={(newScale) => {
                  handleFitChange('scale', newScale);
                }}
              />
            </div>
          </div>

          {/* Under-Card Compact Toolbar (Keeps total height under 610px so it fits all laptops!) */}
          <div className="w-[375px] max-w-full mt-2.5 p-2 bg-[#FAF6EE] rounded-xl border border-[#DFD3BE] shadow-2xs space-y-1.5 no-print text-xs">
            {/* Top row: Interactive Drag Hint + Scale / Zoom quick shortcuts */}
            <div className="flex items-center justify-between gap-1 text-[11px] text-[#635340]">
              <span className="flex items-center gap-1 text-[10.5px] font-medium text-[#7C5A37]" title="Haz clic y arrastra directamente sobre la carta para reubicar la imagen">
                <Move className="w-3 h-3 text-[#7C5A37] shrink-0" />
                <span className="truncate">Arrastra sobre la carta para encuadrar</span>
              </span>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => handleFitChange('scale', Math.max(0.25, Number((scale - 0.1).toFixed(2))))}
                  className="p-1 rounded bg-[#EFE6D2] hover:bg-[#E3D7BF] text-[#473623] cursor-pointer transition-colors"
                  title="Alejar imagen (-10%)"
                >
                  <ZoomOut className="w-3 h-3" />
                </button>
                <span className="font-mono text-[10px] w-8 text-center text-[#473623] font-bold">
                  {Math.round(scale * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => handleFitChange('scale', Math.min(4.0, Number((scale + 0.1).toFixed(2))))}
                  className="p-1 rounded bg-[#EFE6D2] hover:bg-[#E3D7BF] text-[#473623] cursor-pointer transition-colors"
                  title="Acercar imagen (+10%)"
                >
                  <ZoomIn className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => handleFitChangeMultiple({ offsetX: 0, offsetY: 0 })}
                  className="px-1.5 py-0.5 rounded bg-[#EFE6D2] hover:bg-[#E3D7BF] text-[10px] font-bold text-[#473623] cursor-pointer ml-0.5"
                  title="Centrar imagen"
                >
                  Centrar
                </button>
              </div>
            </div>

            {/* Middle row: Barrier status & Cut marks */}
            <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#EAE0CA] text-[10.5px]">
              <div className="flex items-center gap-1.5 text-[#524131]">
                <Shield className="w-3.5 h-3.5 text-[#7C5A37]" />
                <span>
                  Barreras: <strong>{brokenBarriers.length}/{stats.finalBarriers.length}</strong> rotas
                </span>
                {brokenBarriers.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setBrokenBarriers([]);
                      if (onUpdateDamagedBarriers) onUpdateDamagedBarriers(0);
                    }}
                    className="text-[10px] font-bold text-[#7C5A37] hover:underline cursor-pointer ml-1"
                  >
                    Restaurar
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1 text-[#635544] cursor-pointer hover:text-[#2A231C]">
                  <input
                    type="checkbox"
                    checked={showCutMarks}
                    onChange={(e) => setShowCutMarks(e.target.checked)}
                    className="rounded border-[#C2B299] text-[#7C5A37] w-3 h-3 focus:ring-0"
                  />
                  <span>Guías corte</span>
                </label>

                {/* Viewport Scale switch (100% / 90% / 80%) to comfortably fit any small laptop screen */}
                <div className="flex items-center gap-0.5 bg-[#EFE6D2] rounded p-0.5 text-[9px] font-bold">
                  <button
                    type="button"
                    onClick={() => setPreviewScale(1)}
                    className={`px-1 py-0.2 rounded transition-colors ${
                      previewScale === 1 ? 'bg-[#7C5A37] text-white' : 'text-[#5C4835] hover:text-[#2A2016]'
                    }`}
                    title="Tamaño normal de carta (100%)"
                  >
                    100%
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewScale(0.88)}
                    className={`px-1 py-0.2 rounded transition-colors ${
                      previewScale === 0.88 ? 'bg-[#7C5A37] text-white' : 'text-[#5C4835] hover:text-[#2A2016]'
                    }`}
                    title="Tamaño confort para laptops (88%)"
                  >
                    88%
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewScale(0.78)}
                    className={`px-1 py-0.2 rounded transition-colors ${
                      previewScale === 0.78 ? 'bg-[#7C5A37] text-white' : 'text-[#5C4835] hover:text-[#2A2016]'
                    }`}
                    title="Tamaño compacto (78%)"
                  >
                    78%
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Studio Customization & Export Workbench */}
        <div
          className={`lg:col-span-7 flex flex-col gap-3.5 no-print transition-all ${
            studioScrollMode
              ? 'lg:max-h-[calc(100vh-130px)] lg:overflow-y-auto lg:pr-2.5 pb-8'
              : 'pb-24'
          }`}
        >
          {/* Workbench Section Navigation Tabs (Now only 3 unified sections!) */}
          <div className="bg-[#FAF6EE] p-1.5 rounded-2xl border border-[#D9C8A8] shadow-2xs flex items-center justify-between gap-1 flex-wrap">
            <div className="flex items-center gap-1 overflow-x-auto">
              <button
                type="button"
                onClick={() => setActiveTab('image')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  activeTab === 'image'
                    ? 'bg-[#7C5A37] text-white shadow-xs'
                    : 'text-[#544230] hover:bg-[#EFE6D2]'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>1. Ilustración & Encuadre</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('appearance')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  activeTab === 'appearance'
                    ? 'bg-[#7C5A37] text-white shadow-xs'
                    : 'text-[#544230] hover:bg-[#EFE6D2]'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>2. Marco & Paleta de Color</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('export')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  activeTab === 'export'
                    ? 'bg-[#7C5A37] text-white shadow-xs'
                    : 'text-[#544230] hover:bg-[#EFE6D2]'
                }`}
              >
                <Printer className="w-3.5 h-3.5" />
                <span>3. Imprimir & Exportar</span>
              </button>
            </div>

            {/* Action buttons: Pin toggle & View mode */}
            <div className="flex items-center gap-1.5 ml-auto">
              <button
                type="button"
                onClick={() => setStudioScrollMode(!studioScrollMode)}
                className={`text-[10.5px] font-bold px-2 py-1 rounded-lg border transition-all cursor-pointer flex items-center gap-1 ${
                  studioScrollMode
                    ? 'bg-[#FAF0DC] text-[#473623] border-[#8C6D44] ring-1 ring-[#8C6D44]/30'
                    : 'bg-[#FAF6EE] text-[#7A644D] border-[#D9C8A8] hover:bg-[#EFE6D2]'
                }`}
                title={
                  studioScrollMode
                    ? 'Panel con scroll independiente activo (tarjeta fija en el centro)'
                    : 'Activar panel con scroll independiente'
                }
              >
                <Pin className={`w-3 h-3 ${studioScrollMode ? 'text-[#7C5A37]' : 'text-[#8C7A64]'}`} />
                <span className="hidden sm:inline">
                  {studioScrollMode ? 'Scroll fijo' : 'Scroll libre'}
                </span>
              </button>

              {/* Mode switch: Pestañas limpias vs Cascada */}
              <button
                type="button"
                onClick={() => setViewMode(viewMode === 'tabs' ? 'all' : 'tabs')}
                className="text-[11px] font-bold text-[#7C5A37] hover:text-[#523A21] px-2 py-1 rounded hover:bg-[#EFE6D2] transition-colors cursor-pointer flex items-center gap-1"
                title={viewMode === 'tabs' ? 'Ver todas las secciones a la vez' : 'Ver por pestañas limpias'}
              >
                <LayoutGrid className="w-3 h-3" />
                <span>{viewMode === 'tabs' ? 'Ver todas' : 'Pestañas'}</span>
              </button>
            </div>
          </div>

          {/* Section 1: Ilustración & Encuadre de Fondo */}
          {(viewMode === 'all' || activeTab === 'image') && (
            <div className="p-4 bg-[#FAF6EE] rounded-2xl border border-[#D9C8A8] shadow-xs space-y-3.5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-heading text-sm font-bold text-[#2A2016] flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-[#7C5A37]" />
                    <span>Ilustración & Encuadre de Fondo</span>
                  </h3>
                  <p className="text-[10.5px] text-[#7A644E]">
                    Sube tu imagen y ajusta zoom y posición con total libertad sin recortes indeseados.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleResetFit}
                    className="text-[11px] font-bold text-[#7C5A37] hover:text-[#473623] flex items-center gap-1 cursor-pointer"
                    title="Restablecer todos los ajustes al centro"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Restablecer
                  </button>

                  {/* Explicit reliable button that triggers fileInputRef.current.click() */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isProcessingImage}
                    className="px-3.5 py-1.5 bg-[#7C5A37] hover:bg-[#68492A] text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer active:scale-95 disabled:opacity-50"
                  >
                    <Upload className="w-3.5 h-3.5 text-[#FAF6EE]" />
                    <span>{isProcessingImage ? 'Cargando...' : 'Subir Imagen'}</span>
                  </button>
                  <input
                    ref={fileInputRef}
                    id="card-photo-input"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Prominent Drag & Drop Dropzone for guaranteed upload ease */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDraggingFile(true);
                }}
                onDragLeave={() => setIsDraggingFile(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDraggingFile(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file) processImageFile(file);
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-3.5 text-center cursor-pointer transition-all ${
                  isDraggingFile
                    ? 'border-[#7C5A37] bg-[#EAE0CA] ring-2 ring-[#7C5A37]/30 shadow-xs'
                    : npc.avatarUrl
                    ? 'border-[#D5C4A4] bg-[#FAF5E8] hover:bg-[#F3EAD5]'
                    : 'border-[#C2AA83] bg-[#FAF3E0] hover:bg-[#F2E5CC]'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Upload className="w-4 h-4 text-[#7C5A37]" />
                  <span className="text-xs font-bold text-[#3D2E1F]">
                    {isProcessingImage
                      ? 'Procesando y optimizando imagen...'
                      : npc.avatarUrl
                      ? 'Haz clic o arrastra para cambiar la imagen actual'
                      : 'Arrastra aquí una foto o haz clic para subir imagen'}
                  </span>
                </div>
                <p className="text-[10px] text-[#7A644E] mt-0.5">
                  Formatos JPG, PNG, WEBP, SVG • Se adapta sin recortes y permite mover libremente
                </p>
              </div>

              {/* Status or Active Image Pill */}
              {imageUploadStatus && (
                <p className="text-[11px] text-[#A63426] bg-[#FDEEEB] p-2 rounded-lg border border-[#F3C4BE]">
                  {imageUploadStatus}
                </p>
              )}

              {npc.avatarUrl && (
                <div className="flex items-center justify-between bg-[#EFE6D2] px-3 py-1.5 rounded-lg border border-[#D5C4A4] text-xs">
                  <div className="flex items-center gap-2 truncate">
                    <img
                      src={npc.avatarUrl}
                      alt="Miniatura"
                      className="w-7 h-7 rounded object-cover border border-[#BFA77D] shrink-0"
                    />
                    <span className="text-[11px] font-semibold text-[#423221] truncate">
                      Foto personalizada activa en la carta
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-[10.5px] font-bold text-[#7C5A37] hover:underline cursor-pointer"
                    >
                      Cambiar
                    </button>
                    <button
                      type="button"
                      onClick={() => onUpdateAvatarUrl && onUpdateAvatarUrl('')}
                      className="text-[10.5px] font-bold text-[#8C3A2A] hover:underline cursor-pointer"
                    >
                      Quitar
                    </button>
                  </div>
                </div>
              )}

              {/* Mode Buttons: Cubrir, Completa sin corte, Ajustar ancho, Ajustar alto */}
              <div>
                <label className="text-[11px] font-bold text-[#6B5742] uppercase block mb-1.5">
                  Modo de Ajuste Rápido (Evitar Recorte):
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => handleSetFitMode('cover')}
                    className={`px-2.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      fitMode === 'cover'
                        ? 'bg-[#FAF0DC] border-[#8C6D44] text-[#2A2016] font-bold ring-2 ring-[#8C6D44]/30'
                        : 'bg-[#FAF6EE] border-[#D9C8A8] text-[#5C4835] hover:bg-[#EFE6D2]'
                    }`}
                    title="Llenar toda la carta sin bordes vacíos"
                  >
                    <Maximize2 className="w-3.5 h-3.5 text-[#7C5A37]" />
                    <span>Cubrir carta</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSetFitMode('contain')}
                    className={`px-2.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      fitMode === 'contain'
                        ? 'bg-[#FAF0DC] border-[#8C6D44] text-[#2A2016] font-bold ring-2 ring-[#8C6D44]/30'
                        : 'bg-[#FAF6EE] border-[#D9C8A8] text-[#5C4835] hover:bg-[#EFE6D2]'
                    }`}
                    title="Mostrar la ilustración completa sin ningún recorte"
                  >
                    <Minimize2 className="w-3.5 h-3.5 text-[#7C5A37]" />
                    <span>Completa (Sin corte)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSetFitMode('width')}
                    className={`px-2.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      fitMode === 'width'
                        ? 'bg-[#FAF0DC] border-[#8C6D44] text-[#2A2016] font-bold ring-2 ring-[#8C6D44]/30'
                        : 'bg-[#FAF6EE] border-[#D9C8A8] text-[#5C4835] hover:bg-[#EFE6D2]'
                    }`}
                    title="Ajustar al ancho de la carta"
                  >
                    <span>↔️ Ajustar ancho</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSetFitMode('height')}
                    className={`px-2.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      fitMode === 'height'
                        ? 'bg-[#FAF0DC] border-[#8C6D44] text-[#2A2016] font-bold ring-2 ring-[#8C6D44]/30'
                        : 'bg-[#FAF6EE] border-[#D9C8A8] text-[#5C4835] hover:bg-[#EFE6D2]'
                    }`}
                    title="Ajustar a la altura completa de la carta"
                  >
                    <span>↕️ Ajustar alto</span>
                  </button>
                </div>
              </div>

              {/* Sliders Grid: Zoom, X, Y, Oscurecido, Brillo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-[#524131] pt-1 border-t border-[#EAE0CA]">
                {/* Zoom / Escala */}
                <div>
                  <div className="flex justify-between text-[11px] font-bold mb-1">
                    <span className="flex items-center gap-1">
                      <ZoomIn className="w-3 h-3 text-[#7C5A37]" />
                      Zoom / Escala:
                    </span>
                    <span className="font-mono text-[#7C5A37] font-bold">{Math.round(scale * 100)}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="0.25"
                      max="4.0"
                      step="0.05"
                      value={scale}
                      onChange={(e) => handleFitChange('scale', Number(e.target.value))}
                      className="w-full accent-[#7C5A37] cursor-pointer"
                    />
                  </div>
                  <div className="flex justify-between text-[9px] text-[#8C7A64] mt-0.5">
                    <span>25% (Alejar)</span>
                    <span>100%</span>
                    <span>400% (Acercar)</span>
                  </div>
                </div>

                {/* Oscurecido inferior para legibilidad */}
                <div>
                  <div className="flex justify-between text-[11px] font-bold mb-1">
                    <span>Oscurecido Inferior (Legibilidad):</span>
                    <span className="font-mono text-[#7C5A37] font-bold">{overlayDim}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="95"
                    step="5"
                    value={overlayDim}
                    onChange={(e) => handleFitChange('overlayDim', Number(e.target.value))}
                    className="w-full accent-[#7C5A37] cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] text-[#8C7A64] mt-0.5">
                    <span>0% (Sin sombra)</span>
                    <span>45% (Equilibrado)</span>
                    <span>95% (Máx contraste)</span>
                  </div>
                </div>

                {/* Desplazamiento Horizontal (X) con rango amplio */}
                <div>
                  <div className="flex justify-between text-[11px] font-bold mb-1">
                    <span className="flex items-center gap-1">
                      <Move className="w-3 h-3 text-[#7C5A37]" />
                      Desplazamiento Horizontal (X):
                    </span>
                    <span className="font-mono text-[#7C5A37] font-bold">
                      {offsetX > 0 ? `+${offsetX}` : offsetX}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="-250"
                    max="250"
                    step="1"
                    value={offsetX}
                    onChange={(e) => handleFitChange('offsetX', Number(e.target.value))}
                    className="w-full accent-[#7C5A37] cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] text-[#8C7A64] mt-0.5">
                    <span>← Izquierda (-250%)</span>
                    <button
                      type="button"
                      onClick={() => handleFitChange('offsetX', 0)}
                      className="text-[#7C5A37] font-bold hover:underline"
                    >
                      Centrar (0)
                    </button>
                    <span>Derecha (+250%) →</span>
                  </div>
                </div>

                {/* Desplazamiento Vertical (Y) con rango amplio */}
                <div>
                  <div className="flex justify-between text-[11px] font-bold mb-1">
                    <span className="flex items-center gap-1">
                      <Move className="w-3 h-3 text-[#7C5A37]" />
                      Desplazamiento Vertical (Y):
                    </span>
                    <span className="font-mono text-[#7C5A37] font-bold">
                      {offsetY > 0 ? `+${offsetY}` : offsetY}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="-250"
                    max="250"
                    step="1"
                    value={offsetY}
                    onChange={(e) => handleFitChange('offsetY', Number(e.target.value))}
                    className="w-full accent-[#7C5A37] cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] text-[#8C7A64] mt-0.5">
                    <span>↑ Subir (-250%)</span>
                    <button
                      type="button"
                      onClick={() => handleFitChange('offsetY', 0)}
                      className="text-[#7C5A37] font-bold hover:underline"
                    >
                      Centrar (0)
                    </button>
                    <span>Bajar (+250%) ↓</span>
                  </div>
                </div>

                {/* Brillo de la Imagen */}
                <div className="sm:col-span-2">
                  <div className="flex justify-between text-[11px] font-bold mb-1">
                    <span>Brillo de la Ilustración:</span>
                    <span className="font-mono text-[#7C5A37] font-bold">{brightness}%</span>
                  </div>
                  <input
                    type="range"
                    min="30"
                    max="200"
                    step="5"
                    value={brightness}
                    onChange={(e) => handleFitChange('brightness', Number(e.target.value))}
                    className="w-full accent-[#7C5A37] cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] text-[#8C7A64] mt-0.5">
                    <span>Oscura (30%)</span>
                    <span>Normal (100%)</span>
                    <span>Brillante (200%)</span>
                  </div>
                </div>
              </div>

              {/* URL Directa opcional */}
              <div className="pt-2 border-t border-[#EAE0CA] flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-1 min-w-[240px]">
                  <LinkIcon className="w-3.5 h-3.5 text-[#7C5A37] shrink-0" />
                  <input
                    type="text"
                    placeholder="O pegar URL directa de imagen (https://...)"
                    value={npc.avatarUrl || ''}
                    onChange={(e) => onUpdateAvatarUrl && onUpdateAvatarUrl(e.target.value)}
                    className="text-xs px-2.5 py-1 bg-[#FAF6EE] border border-[#D5C4A4] rounded-lg w-full text-[#423221]"
                  />
                </div>
                {npc.avatarUrl && (
                  <button
                    type="button"
                    onClick={() => onUpdateAvatarUrl && onUpdateAvatarUrl('')}
                    className="text-[11px] font-bold text-[#8C3A2A] hover:underline cursor-pointer"
                  >
                    Quitar foto
                  </button>
                )}
              </div>

              {/* Siluetas de fantasía predefinidas oficiales */}
              <div className="pt-2 border-t border-[#EAE0CA] space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-[#6B5742] uppercase block">
                    Siluetas e Ilustraciones Temáticas Predefinidas:
                  </label>
                  <span className="text-[10px] text-[#7A644E]">
                    {AVATAR_PRESETS.length} disponibles
                  </span>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {AVATAR_PRESETS.map((p) => {
                    const isSelected =
                      !npc.avatarUrl &&
                      (npc.avatarPreset === p.id || (!npc.avatarPreset && p.id === 'wolf'));
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          if (onUpdateAvatarPreset) {
                            onUpdateAvatarPreset(p.id);
                          } else if (onUpdateAvatarUrl) {
                            onUpdateAvatarUrl('');
                          }
                        }}
                        className={`p-1.5 rounded-xl border flex flex-col items-center gap-1 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#FAF0DC] border-[#8C6D44] ring-2 ring-[#8C6D44]/30 shadow-xs'
                            : 'bg-[#FAF6EE] border-[#D9C8A8] hover:bg-[#EFE6D2]'
                        }`}
                        title={p.name}
                      >
                        <div
                          className="w-9 h-9 rounded-lg overflow-hidden border border-[#CBB895] shadow-2xs pointer-events-none"
                          dangerouslySetInnerHTML={{ __html: p.svgBackground }}
                        />
                        <span className="text-[10px] font-bold text-[#3D2E1F] truncate w-full text-center">
                          {p.name.split('/')[0]}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Section 2: Marco & Paleta de Color (UNIFICADOS EN LA MISMA SECCIÓN) */}
          {(viewMode === 'all' || activeTab === 'appearance') && (
            <div className="p-4 bg-[#FAF6EE] rounded-2xl border border-[#D9C8A8] shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[#EAE0CA]">
                <div>
                  <h3 className="font-heading text-sm font-bold text-[#2A2016] flex items-center gap-2">
                    <Layers className="w-4 h-4 text-[#7C5A37]" />
                    <span>Marco & Paleta de Color</span>
                  </h3>
                  <p className="text-[10.5px] text-[#7A644E]">
                    Personaliza el marco estético y la armonía cromática de tu carta coleccionable.
                  </p>
                </div>
              </div>

              {/* Sub-bloque 1: Marco & Acabado Visual (5 estilos) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-[#6B5742] uppercase block">
                    1. Marco & Acabado Visual
                  </label>
                  <span className="text-[10px] text-[#7A644E] font-mono">
                    {FRAME_THEME_PRESETS.length} estilos temáticos
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {FRAME_THEME_PRESETS.map((frame) => {
                    const isSelected = (npc.cardFrameTheme || 'pergamino') === frame.id;
                    return (
                      <button
                        key={frame.id}
                        type="button"
                        onClick={() => handleFrameSelect(frame.id)}
                        className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#FAF0DC] border-[#8C6D44] ring-2 ring-[#8C6D44]/40 shadow-xs'
                            : 'bg-[#FAF6EE] border-[#D9C8A8] hover:bg-[#EFE6D2]'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full mb-1">
                          <span className="text-xs font-bold text-[#2A2016]">
                            {frame.badge}
                          </span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-[#7C5A37]" />}
                        </div>
                        <p className="text-[10px] text-[#5C4835] leading-snug">
                          {frame.subtitle}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sub-bloque 2: Paleta de Color Coordinada */}
              <div className="space-y-2 pt-3 border-t border-[#EAE0CA]">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-[#6B5742] uppercase block">
                    2. Paleta de Color Coordinada
                  </label>
                  <div className="flex items-center gap-1.5 text-xs font-medium text-[#6B5742]">
                    <span className="text-[11px]">Color libre:</span>
                    <input
                      type="color"
                      value={activeColor}
                      onChange={(e) => handleColorSelect(e.target.value)}
                      className="w-7 h-7 rounded-lg cursor-pointer border border-[#C5B18E] p-0 shadow-2xs"
                      title="Elegir cualquier color personalizado"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {CARD_COLOR_PRESETS.map((preset) => {
                    const isSelected = activeColor.toLowerCase() === preset.primary.toLowerCase();
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => handleColorSelect(preset.primary)}
                        className={`p-2 rounded-xl border flex items-center gap-2 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#FAF0DC] border-[#8C6D44] ring-2 ring-[#8C6D44]/30 shadow-xs'
                            : 'bg-[#FAF6EE] border-[#D9C8A8] hover:bg-[#EFE6D2]'
                        }`}
                      >
                        <span
                          className="w-4 h-4 rounded-full border border-black/20 shrink-0 shadow-2xs"
                          style={{ backgroundColor: preset.primary }}
                        />
                        <span className="text-[11px] font-bold text-[#2A2016] truncate">
                          {preset.name.split('/')[0]}
                        </span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-[#7C5A37] ml-auto shrink-0" />}
                      </button>
                    );
                  })}
                </div>
                <p className="text-[10px] text-[#7A644E] mt-1">
                  Armoniza en vivo la banda del nombre, la insignia de Rango (<strong>{npc.rank}</strong>), los escudos de barrera y el medallón de NA.
                </p>
              </div>
            </div>
          )}

          {/* Section 3: Impresión y Exportación */}
          {(viewMode === 'all' || activeTab === 'export') && (
            <div className="p-4 bg-[#FAF6EE] rounded-2xl border border-[#D9C8A8] shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-heading text-sm font-bold text-[#2A2016] flex items-center gap-2">
                    <Printer className="w-4 h-4 text-[#7C5A37]" />
                    <span>Impresión y Exportación</span>
                  </h3>
                  <p className="text-[10.5px] text-[#7A644E]">
                    Calibración estándar a 300 DPI (2.5″ × 3.5″ / 750 × 1050 px) y hojas múltiples.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  onClick={() => handleDirectPrint()}
                  disabled={isPrinting || isExporting}
                  className="p-3 bg-[#7C5A37] hover:bg-[#68492A] text-white rounded-xl shadow-xs flex flex-col items-center justify-center gap-1 text-center transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                  title="Imprimir directamente la carta individual en tamaño real (2.5 x 3.5 pulgadas)"
                >
                  <Printer className="w-4 h-4 text-[#FAF6EE]" />
                  <span className="text-xs font-bold">Imprimir Carta</span>
                  <span className="text-[9.5px] text-[#EFE5D2] font-mono">2.5″ × 3.5″</span>
                </button>

                <button
                  onClick={handleExportPng}
                  disabled={isExporting || isPrinting}
                  className="p-3 bg-[#FAF2E2] hover:bg-[#EFE3CD] text-[#3D2E1F] rounded-xl border border-[#CBB895] flex flex-col items-center justify-center gap-1 text-center transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                  title="Descargar imagen PNG a 750 × 1050 px (300 DPI)"
                >
                  <Download className="w-4 h-4 text-[#7C5A37]" />
                  <span className="text-xs font-bold">Descargar PNG</span>
                  <span className="text-[9.5px] text-[#7A644D] font-mono">750 × 1050 px</span>
                </button>

                <button
                  onClick={handleExportPdf}
                  disabled={isExporting || isPrinting}
                  className="p-3 bg-[#FAF2E2] hover:bg-[#EFE3CD] text-[#3D2E1F] rounded-xl border border-[#CBB895] flex flex-col items-center justify-center gap-1 text-center transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                  title="Descargar archivo PDF individual de la carta"
                >
                  <FileText className="w-4 h-4 text-[#7C5A37]" />
                  <span className="text-xs font-bold">Descargar PDF</span>
                  <span className="text-[9.5px] text-[#7A644D] font-mono">Vector / Imprimible</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowPrintSheetModal(true)}
                  className="p-3 bg-[#543D28] hover:bg-[#432F1E] text-white rounded-xl shadow-xs flex flex-col items-center justify-center gap-1 text-center transition-all cursor-pointer active:scale-95"
                  title="Generar e imprimir hoja con 8 cartas en formato A4 o Carta"
                >
                  <Layers className="w-4 h-4 text-[#EFE5D2]" />
                  <span className="text-xs font-bold">Hoja 8 Cartas</span>
                  <span className="text-[9.5px] text-[#E5D7BE] font-mono">A4 / Carta</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Floating Button to quickly view card when scrolled down on small screens */}
      {showMobileFloating && (
        <div className="lg:hidden fixed bottom-5 right-4 z-40 animate-fade-in no-print">
          <button
            type="button"
            onClick={scrollToCard}
            className="flex items-center gap-2 px-3.5 py-2 bg-[#7C5A37] hover:bg-[#68492A] text-white text-xs font-bold rounded-full shadow-lg border border-[#523A21] active:scale-95 cursor-pointer"
          >
            <ArrowUp className="w-3.5 h-3.5" />
            <span>Ver Carta ({npc.rank})</span>
          </button>
        </div>
      )}

      {/* 8-Card Print Sheet Modal */}
      <PrintSheetModal
        isOpen={showPrintSheetModal}
        onClose={() => setShowPrintSheetModal(false)}
        currentNpc={npc}
        availableNpcs={availableNpcs.length > 0 ? availableNpcs : [npc]}
      />
    </div>
  );
};
