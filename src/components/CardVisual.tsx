import React from 'react';
import { NpcData, CalculatedNpcStats } from '../types/npc';
import { calculateNpcStats, getTacticalCardTraits } from '../utils/calculator';
import { getAvatarPreset } from '../data/avatars';
import { getCoordinatedTheme, FRAME_THEME_PRESETS } from '../utils/cardTheme';

interface CardVisualProps {
  cardRef?: React.Ref<HTMLDivElement>;
  npc: NpcData;
  stats?: CalculatedNpcStats;
  brokenBarriers?: number[];
  onToggleBarrier?: (index: number) => void;
  interactive?: boolean;
  isInkSaver?: boolean;
  className?: string;
  style?: React.CSSProperties;
  allowDirectPan?: boolean;
  onPanChange?: (newOffsetX: number, newOffsetY: number) => void;
  onScaleChange?: (newScale: number) => void;
}

export const CardVisual: React.FC<CardVisualProps> = ({
  cardRef,
  npc,
  stats: propStats,
  brokenBarriers = [],
  onToggleBarrier,
  interactive = false,
  isInkSaver = false,
  className = '',
  style,
  allowDirectPan = false,
  onPanChange,
  onScaleChange
}) => {
  const stats = propStats || calculateNpcStats(npc);

  const activeFrame = npc.cardFrameTheme || 'pergamino';
  const isEffectiveInkSaver = isInkSaver || activeFrame === 'tinta';

  // Coordinated Card Theme based on user-selected color & ink saver mode
  const activeColor = npc.cardColorTheme || '#3D6643';
  const theme = getCoordinatedTheme(activeColor, isEffectiveInkSaver);
  const framePreset = FRAME_THEME_PRESETS.find((f) => f.id === activeFrame) || FRAME_THEME_PRESETS[0];

  // Image adjustment state
  const imageFit = npc.imageFit || {
    scale: 1,
    offsetX: 0,
    offsetY: 0,
    brightness: 100,
    overlayDim: 45
  };

  const scale = imageFit.scale ?? 1;
  const offsetX = imageFit.offsetX ?? 0;
  const offsetY = imageFit.offsetY ?? 0;
  const brightness = imageFit.brightness ?? 100;
  const overlayDim = imageFit.overlayDim ?? 45;
  const fitMode = imageFit.fitMode || 'cover';

  // Direct drag & pan state
  const [isDragging, setIsDragging] = React.useState(false);
  const dragStartRef = React.useRef<{ x: number; y: number; initX: number; initY: number } | null>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!allowDirectPan || !onPanChange) return;
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      initX: offsetX,
      initY: offsetY
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !dragStartRef.current || !onPanChange) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    const newX = Math.round(dragStartRef.current.initX + dx / 2.5);
    const newY = Math.round(dragStartRef.current.initY + dy / 2.5);
    onPanChange(newX, newY);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    dragStartRef.current = null;
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (!allowDirectPan || !onScaleChange) return;
    e.stopPropagation();
    const delta = e.deltaY > 0 ? -0.05 : 0.05;
    const nextScale = Math.min(4.0, Math.max(0.25, Number((scale + delta).toFixed(2))));
    onScaleChange(nextScale);
  };

  // Rank badge on the card (normalized to official ranks: Pandilla, Cuadrilla, Trío, Dúo, Solo)
  const normalizeRank = (rawRank?: string): string => {
    if (rawRank === 'Esbirro') return 'Pandilla';
    if (rawRank === 'Soldado') return 'Cuadrilla';
    if (rawRank === 'Élite') return 'Dúo';
    if (rawRank === 'Jefe') return 'Solo';
    if (rawRank && ['Pandilla', 'Cuadrilla', 'Trío', 'Dúo', 'Solo'].includes(rawRank)) {
      return rawRank;
    }
    return 'Cuadrilla';
  };
  const activeRank = normalizeRank(npc.rank);
  const rankLabel = activeRank.toUpperCase();

  const presetAvatar = getAvatarPreset(npc.avatarPreset);
  // Only traits whose effects are NOT automatically applied to numeric stats are shown on the card
  const tacticalTraits = getTacticalCardTraits(npc.selectedTraits);
  const hasTacticalTraits = tacticalTraits.length > 0;

  // Calculate text density to dynamically elevate name banner and traits without scrollbars
  const totalTacticalChars = tacticalTraits.reduce(
    (acc, t) => acc + (t.name?.length || 0) + (t.effect?.length || 0),
    0
  );
  const isElevatedTraits = totalTacticalChars > 110 || tacticalTraits.length >= 2;
  const isSuperElevated = totalTacticalChars > 220 || tacticalTraits.length >= 3;

  // Render actions as stars (✦)
  const actionStarsCount = Math.max(1, stats.finalActions);
  const actionStars = Array.from({ length: actionStarsCount }, (_, i) => i);

  // Background and border styles depending on frame theme
  const getContainerClasses = () => {
    if (isEffectiveInkSaver) {
      return 'bg-white text-zinc-950 border-2 border-black shadow-lg';
    }
    if (activeFrame === 'cripta') {
      return 'bg-[#121517] text-slate-100 shadow-xl border-2 border-slate-700/60';
    }
    if (activeFrame === 'arcano') {
      return 'bg-[#151024] text-purple-100 shadow-xl border-2 border-purple-500/40';
    }
    if (activeFrame === 'bosque') {
      return 'bg-[#101B14] text-emerald-100 shadow-xl border-2 border-emerald-600/40';
    }
    return 'bg-[#181F1C] text-white shadow-xl border-2 border-[#D4A373]/30';
  };

  // Dynamic image styling based on fitMode to avoid unwanted clipping
  const getImageStyles = (): React.CSSProperties => {
    const base: React.CSSProperties = {
      transform: `translate(calc(-50% + ${offsetX * 2.5}px), calc(-50% + ${offsetY * 2.5}px)) scale(${scale})`,
      transformOrigin: 'center center',
      filter: isEffectiveInkSaver
        ? 'grayscale(100%) contrast(150%) brightness(130%) opacity(0.22)'
        : `brightness(${brightness}%)`
    };

    if (fitMode === 'contain') {
      return {
        ...base,
        maxWidth: '100%',
        maxHeight: '100%',
        width: 'auto',
        height: 'auto',
        objectFit: 'contain'
      };
    }
    if (fitMode === 'width') {
      return {
        ...base,
        width: '100%',
        minWidth: '100%',
        height: 'auto'
      };
    }
    if (fitMode === 'height') {
      return {
        ...base,
        height: '100%',
        minHeight: '100%',
        width: 'auto'
      };
    }
    // Default 'cover'
    return {
      ...base,
      minWidth: '100%',
      minHeight: '100%',
      width: 'auto',
      height: 'auto'
    };
  };

  return (
    <div
      ref={cardRef}
      id="papa-tumbay-card"
      className={`papa-tumbay-card w-[375px] h-[525px] rounded-[22px] p-4 flex flex-col justify-between select-none relative overflow-hidden shrink-0 transition-colors ${getContainerClasses()} ${className}`}
      style={{
        ...style,
        backgroundColor: isEffectiveInkSaver ? '#FFFFFF' : framePreset.cardBg
      }}
    >
      {/* Full-bleed background illustration (unclipped for smooth pan and zoom) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {npc.avatarUrl ? (
          <img
            src={npc.avatarUrl}
            alt={npc.name}
            className={`absolute top-1/2 left-1/2 pointer-events-none select-none transition-[filter] ${
              fitMode === 'contain' ? 'max-w-full max-h-full object-contain' : 'max-w-none'
            }`}
            style={getImageStyles()}
          />
        ) : (
          <div
            className="absolute top-1/2 left-1/2 w-full h-full pointer-events-none select-none"
            style={{
              transform: `translate(calc(-50% + ${offsetX * 2.5}px), calc(-50% + ${offsetY * 2.5}px)) scale(${scale})`,
              transformOrigin: 'center center',
              filter: isEffectiveInkSaver
                ? 'grayscale(100%) contrast(150%) brightness(130%) opacity(0.22)'
                : `brightness(${brightness}%)`
            }}
            dangerouslySetInnerHTML={{ __html: presetAvatar.svgBackground }}
          />
        )}

        {/* Gradient Overlays (omitted in ink saver for pure white readability) */}
        {!isEffectiveInkSaver && (
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(180deg, rgba(12,18,16,0.15) 0%, rgba(12,18,16,0.2) 35%, rgba(10,16,14,${
                overlayDim / 100
              }) 65%, rgba(6,10,9,0.94) 88%, rgba(4,7,6,0.98) 100%)`
            }}
          />
        )}
      </div>

      {/* Interactive Direct Pan & Zoom layer (enabled in editor workbench) */}
      {allowDirectPan && (
        <div
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={(e) => {
            if (!allowDirectPan || !onPanChange) return;
            const touch = e.touches[0];
            setIsDragging(true);
            dragStartRef.current = {
              x: touch.clientX,
              y: touch.clientY,
              initX: offsetX,
              initY: offsetY
            };
          }}
          onTouchMove={(e) => {
            if (!isDragging || !dragStartRef.current || !onPanChange) return;
            const touch = e.touches[0];
            const dx = touch.clientX - dragStartRef.current.x;
            const dy = touch.clientY - dragStartRef.current.y;
            onPanChange(
              Math.round(dragStartRef.current.initX + dx / 2.5),
              Math.round(dragStartRef.current.initY + dy / 2.5)
            );
          }}
          onTouchEnd={handleMouseUp}
          onWheel={handleWheel}
          className={`absolute inset-0 z-5 select-none ${
            isDragging ? 'cursor-grabbing' : 'cursor-grab'
          }`}
          title="Arrastra para mover la ilustración libremente • Rueda del ratón para zoom"
        />
      )}

      {/* Thin inner border line with frame styling */}
      <div
        className="absolute inset-2.5 rounded-[18px] pointer-events-none z-10 transition-colors"
        style={{
          border: isEffectiveInkSaver ? '1.5px solid #000000' : `1.5px solid ${framePreset.innerBorderColor}`
        }}
      />

      {/* Themed Corner Accents */}
      {!isEffectiveInkSaver ? (
        <>
          <div className="absolute top-3 left-3 w-3.5 h-3.5 border-t-2 border-l-2 pointer-events-none z-10 opacity-70" style={{ borderColor: framePreset.accentColor }} />
          <div className="absolute top-3 right-3 w-3.5 h-3.5 border-t-2 border-r-2 pointer-events-none z-10 opacity-70" style={{ borderColor: framePreset.accentColor }} />
          <div className="absolute bottom-3 left-3 w-3.5 h-3.5 border-b-2 border-l-2 pointer-events-none z-10 opacity-70" style={{ borderColor: framePreset.accentColor }} />
          <div className="absolute bottom-3 right-3 w-3.5 h-3.5 border-b-2 border-r-2 pointer-events-none z-10 opacity-70" style={{ borderColor: framePreset.accentColor }} />
        </>
      ) : (
        <>
          <div className="absolute top-3 left-3 w-3 h-3 border-t-2 border-l-2 border-black pointer-events-none z-10" />
          <div className="absolute top-3 right-3 w-3 h-3 border-t-2 border-r-2 border-black pointer-events-none z-10" />
          <div className="absolute bottom-3 left-3 w-3 h-3 border-b-2 border-l-2 border-black pointer-events-none z-10" />
          <div className="absolute bottom-3 right-3 w-3 h-3 border-b-2 border-r-2 border-black pointer-events-none z-10" />
        </>
      )}

      {/* Top Section: NA circle, Cuadrilla/Solo pill, Shields on Left; Star emblem on Right */}
      <div className="relative z-20 flex items-start justify-between">
        {/* Top-Left Column: Big NA circle + Formation Pill + Barrier Shields */}
        <div className="flex flex-col items-center">
          {/* Big Circular Medallion with NA */}
          <div
            className={`w-14 h-14 rounded-full shadow-xl flex items-center justify-center relative border-2 transition-colors ${
              isEffectiveInkSaver ? 'bg-white border-2 border-black' : 'backdrop-blur-md'
            }`}
            style={{
              backgroundColor: isEffectiveInkSaver ? '#FFFFFF' : theme.medallionBg,
              borderColor: isEffectiveInkSaver ? '#000000' : theme.medallionBorder
            }}
          >
            <span
              className={`font-heading text-[32px] font-black leading-none drop-shadow-md select-none ${
                isEffectiveInkSaver ? 'text-black font-black' : 'text-white'
              }`}
            >
              {stats.resultNA}
            </span>
            <span
              className={`absolute bottom-1 text-[6.5px] font-black uppercase tracking-widest leading-none select-none ${
                isEffectiveInkSaver ? 'text-zinc-800' : 'text-white/70'
              }`}
            >
              NA
            </span>
          </div>

          {/* Rank badge */}
          <div
            className={`inline-flex items-center justify-center min-w-[56px] mt-1 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wide text-center border shadow-md leading-tight whitespace-nowrap transition-colors ${
              isEffectiveInkSaver ? 'bg-zinc-100 text-black border-black' : 'text-white'
            }`}
            style={{
              backgroundColor: isEffectiveInkSaver ? '#F4F4F5' : theme.pillBg,
              borderColor: isEffectiveInkSaver ? '#000000' : theme.pillBorder
            }}
            title={`Rango: ${activeRank}${npc.rankVariant && npc.rankVariant !== 'normal' ? ` (${npc.rankVariant})` : ''}`}
          >
            <span>{rankLabel}</span>
          </div>

          {/* Behavior / Modo de actuar: solo su nombre justo debajo del indicador de rango */}
          {npc.behaviorType && (
            <div
              className={`inline-flex items-center justify-center min-w-[54px] mt-1 px-2 py-0.5 rounded-full text-[7.5px] font-black uppercase tracking-wide text-center border shadow-xs leading-tight whitespace-nowrap transition-colors ${
                isEffectiveInkSaver
                  ? 'bg-zinc-100 text-zinc-900 border-black'
                  : 'bg-black/80 text-amber-200 border-amber-300/40 backdrop-blur-xs'
              }`}
              title={`Modo de actuar: ${npc.behaviorType}${npc.behaviorDescription ? ` — ${npc.behaviorDescription}` : ''}`}
            >
              <span>{npc.behaviorType}</span>
            </div>
          )}

          {/* Shields with ND to break barriers */}
          <div
            className={`mt-2 ${
              stats.finalBarriers.length >= 4
                ? 'w-[72px] grid grid-cols-2 gap-1.5 justify-items-center'
                : 'w-14 flex flex-col items-center gap-1.5'
            }`}
          >
            {stats.finalBarriers.map((nd, idx) => {
              const isBroken = brokenBarriers.includes(idx);
              const isCompact = stats.finalBarriers.length >= 4;
              const shieldW = isCompact ? 32 : 36;
              const shieldH = isCompact ? 38 : 42;

              return (
                <button
                  key={idx}
                  type="button"
                  disabled={!interactive}
                  onClick={() => onToggleBarrier && onToggleBarrier(idx)}
                  className={`relative group ${
                    interactive ? 'cursor-pointer hover:scale-110 active:scale-95' : 'cursor-default'
                  } transition-transform focus:outline-none`}
                  title={
                    isBroken
                      ? `Barrera ${idx + 1} rota`
                      : `Barrera ${idx + 1}: superar ND ${nd} para romper`
                  }
                >
                  <svg
                    width={shieldW}
                    height={shieldH}
                    viewBox="0 0 38 44"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="drop-shadow-md transition-all"
                  >
                    <path
                      d="M19 2 C27 2 35 4 36 7 C36 23 29 35 19 42 C9 35 2 23 2 7 C3 4 11 2 19 2 Z"
                      fill={
                        isBroken
                          ? isEffectiveInkSaver
                            ? '#E4E4E7'
                            : 'rgba(58, 20, 16, 0.92)'
                          : isEffectiveInkSaver
                          ? '#FFFFFF'
                          : theme.shieldFill
                      }
                      stroke={
                        isBroken
                          ? '#DC2626'
                          : isEffectiveInkSaver
                          ? '#000000'
                          : theme.shieldStroke
                      }
                      strokeWidth={isEffectiveInkSaver ? '2.2' : '2'}
                    />
                    <path
                      d="M19 5 C25 5 32 7 33 9 C33 21 27 32 19 38 C11 32 5 21 5 9 C6 7 13 5 19 5 Z"
                      stroke={
                        isBroken
                          ? 'rgba(226, 83, 69, 0.45)'
                          : isEffectiveInkSaver
                          ? 'rgba(0, 0, 0, 0.35)'
                          : 'rgba(255, 255, 255, 0.35)'
                      }
                      strokeWidth="1"
                      fill="none"
                    />
                    {isBroken && (
                      <line
                        x1="8"
                        y1="10"
                        x2="30"
                        y2="34"
                        stroke="#DC2626"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                      />
                    )}
                  </svg>
                  <span
                    className={`absolute inset-0 flex items-center justify-center font-heading font-black leading-none drop-shadow-sm select-none ${
                      isCompact ? 'text-[11.5px]' : 'text-sm'
                    } ${
                      isBroken
                        ? 'text-red-600 line-through opacity-80'
                        : isEffectiveInkSaver
                        ? 'text-black font-black'
                        : 'text-white'
                    }`}
                  >
                    {nd}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Top-Right: Star glint emblem */}
        <div className="pt-1 pr-1 shrink-0">
          <svg
            width="34"
            height="34"
            viewBox="0 0 34 34"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="opacity-90 drop-shadow-md"
          >
            <path
              d="M17 1 L19 13 L31 15 L19 17 L17 29 L15 17 L3 15 L15 13 Z"
              fill={isEffectiveInkSaver ? '#000000' : 'white'}
              fillOpacity={isEffectiveInkSaver ? '1' : '0.95'}
            />
            <circle
              cx="17"
              cy="15"
              r="7"
              stroke={isEffectiveInkSaver ? '#000000' : 'white'}
              strokeWidth="1"
              strokeOpacity={isEffectiveInkSaver ? '1' : '0.6'}
              fill="none"
            />
            <circle cx="17" cy="15" r="2.5" fill={isEffectiveInkSaver ? '#000000' : 'white'} />
          </svg>
        </div>
      </div>

      {/* Bottom Section: Name Banner, Special Traits, Lore and Aptitude Circle */}
      <div
        className={`relative z-20 mt-auto shrink-0 transition-all ${
          isElevatedTraits ? 'space-y-1 pt-0' : 'space-y-1.5 pt-1'
        }`}
      >
        {/* Concept Tag Bar */}
        <div className="flex items-center gap-1.5 pl-0.5 flex-nowrap max-w-full">
          <div
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide whitespace-nowrap shrink-0 shadow-xs border leading-tight ${
              isEffectiveInkSaver
                ? 'bg-zinc-100 text-black border-black'
                : 'bg-black/70 backdrop-blur-md border-white/35 text-white'
            }`}
          >
            <span>{npc.mainConcept}</span>
          </div>
          {npc.secondaryConcepts && npc.secondaryConcepts[0] && (
            <div
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[8.5px] font-medium border whitespace-nowrap shrink-0 max-w-[150px] truncate leading-tight ${
                isEffectiveInkSaver
                  ? 'bg-zinc-100 text-zinc-800 border-zinc-700'
                  : 'bg-white/25 backdrop-blur-md text-white/95 border-white/30'
              }`}
            >
              <span className="truncate">{npc.secondaryConcepts[0]}</span>
            </div>
          )}
        </div>

        {/* Name Banner with customizable coordinated color and Action Stars */}
        <div
          className={`px-2.5 rounded-r-xl border-l-4 flex items-center justify-between gap-2 shadow-lg transition-all ${
            isEffectiveInkSaver
              ? 'bg-black text-white border-l-black py-1'
              : 'backdrop-blur-md ' + (isElevatedTraits ? 'py-0.5' : 'py-1')
          }`}
          style={{
            background: isEffectiveInkSaver ? '#18181B' : theme.nameBarGradient,
            borderLeftColor: isEffectiveInkSaver ? '#000000' : theme.borderAccent
          }}
        >
          <h2 className="font-heading text-base sm:text-lg font-black text-white tracking-wide truncate drop-shadow-sm">
            {npc.name || 'Sin Nombre'}
          </h2>

          <div
            className="flex items-center gap-1 shrink-0 pl-1.5"
            title={`${stats.finalActions} Actuar (acciones por turno)`}
          >
            {actionStars.map((i) => (
              <svg
                key={i}
                width="19"
                height="19"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="drop-shadow-[0_0_4px_rgba(255,255,255,0.85)]"
              >
                <path
                  d="M12 0 C12 7.5 14 10.5 24 12 C14 13.5 12 16.5 12 24 C12 16.5 10 13.5 0 12 C10 10.5 12 7.5 12 0 Z"
                  fill="white"
                />
                <circle cx="12" cy="12" r="1.5" fill="#FFFFFF" />
              </svg>
            ))}
          </div>
        </div>

        {/* Tactical Traits (Expanded naturally upwards without any scrollbar) */}
        {hasTacticalTraits && (
          <div
            className={`rounded-lg border shadow-md overflow-hidden transition-all ${
              isEffectiveInkSaver
                ? 'bg-zinc-50 border-black text-zinc-950'
                : 'bg-black/60 backdrop-blur-md border-white/20 text-white/95'
            } ${
              isSuperElevated
                ? 'p-1.5 space-y-0.5'
                : isElevatedTraits
                ? 'p-2 space-y-1'
                : 'p-2 space-y-1'
            }`}
          >
            {tacticalTraits.map((t) => (
              <div
                key={t.id}
                className={`${
                  isSuperElevated
                    ? 'text-[7.8px] leading-[1.18]'
                    : isElevatedTraits
                    ? 'text-[8.2px] leading-[1.22]'
                    : 'text-[8.5px] leading-[1.28]'
                }`}
              >
                <span
                  className={`font-bold mr-1 ${
                    isEffectiveInkSaver ? 'text-black font-black' : 'text-[#F3E2B8]'
                  }`}
                >
                  ✦ {t.name}:
                </span>
                <span className={isEffectiveInkSaver ? 'text-zinc-900 font-medium' : 'text-white/90'}>
                  {t.effect}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Bottom Row: Aptitude Circle on Left & Lore Text */}
        <div
          className={`flex items-center gap-2.5 border-t transition-all ${
            isEffectiveInkSaver ? 'border-black/50' : 'border-white/20'
          } ${isElevatedTraits ? 'pt-1' : 'pt-1.5'}`}
        >
          <div
            className={`w-12 h-12 rounded-full shadow-xl flex items-center justify-center text-center shrink-0 cursor-default relative border-2 transition-colors ${
              isEffectiveInkSaver ? 'bg-white border-2 border-black' : 'backdrop-blur-md'
            }`}
            style={{
              backgroundColor: isEffectiveInkSaver ? '#FFFFFF' : theme.medallionBg,
              borderColor: isEffectiveInkSaver ? '#000000' : theme.medallionBorder
            }}
            title={`Aptitud ${stats.finalAptitude >= 0 ? `+${stats.finalAptitude}` : stats.finalAptitude} (Suma a 2d6/3d6)`}
          >
            <span
              className={`font-heading text-[22px] font-black leading-none drop-shadow-md select-none ${
                isEffectiveInkSaver ? 'text-black font-black' : 'text-white'
              }`}
            >
              {stats.finalAptitude >= 0 ? `+${stats.finalAptitude}` : stats.finalAptitude}
            </span>
            <span
              className={`absolute bottom-1 text-[6px] font-black uppercase tracking-widest leading-none select-none ${
                isEffectiveInkSaver ? 'text-zinc-800' : 'text-white/70'
              }`}
            >
              APT
            </span>
          </div>

          <div className="flex-1 min-w-0 pr-0.5">
            {npc.quote ? (
              <p
                className={`font-serif italic ${
                  isEffectiveInkSaver ? 'text-zinc-800 font-medium' : 'text-white/90'
                } ${
                  isSuperElevated
                    ? 'text-[8.5px] leading-tight line-clamp-1'
                    : 'text-[9.5px] leading-snug line-clamp-2'
                }`}
              >
                «{npc.quote}»
              </p>
            ) : (
              <p
                className={`font-serif italic ${
                  isEffectiveInkSaver ? 'text-zinc-600' : 'text-white/75'
                } ${
                  isSuperElevated
                    ? 'text-[8px] leading-tight line-clamp-1'
                    : 'text-[9px] leading-snug line-clamp-2'
                }`}
              >
                «Acecha en los rincones olvidados y ruinas antiguas de las tierras de Tumbay.»
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

