import React from 'react';
import { CardFrameTheme } from '../types/npc';

interface CardBackVisualProps {
  cardRef?: React.Ref<HTMLDivElement>;
  frameTheme?: CardFrameTheme;
  isInkSaver?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const CardBackVisual: React.FC<CardBackVisualProps> = ({
  cardRef,
  frameTheme = 'pergamino',
  isInkSaver = false,
  className = '',
  style
}) => {
  const isTinta = isInkSaver || frameTheme === 'tinta';

  return (
    <div
      ref={cardRef}
      id="papa-tumbay-card-back"
      className={`papa-tumbay-card w-[375px] h-[525px] rounded-[22px] p-5 shadow-xl flex flex-col items-center justify-between select-none relative overflow-hidden shrink-0 ${
        isTinta ? 'bg-white text-zinc-950 border-2 border-black' : 'bg-[#141A17] text-[#FAF6EE]'
      } ${className}`}
      style={style}
    >
      {/* Background radial glow or texture */}
      {!isTinta && (
        <>
          <div
            className="absolute inset-0 pointer-events-none opacity-40"
            style={{
              background:
                frameTheme === 'arcano'
                  ? 'radial-gradient(circle at 50% 50%, rgba(147, 51, 234, 0.35) 0%, rgba(15, 10, 25, 0.95) 70%)'
                  : frameTheme === 'cripta'
                  ? 'radial-gradient(circle at 50% 50%, rgba(100, 116, 139, 0.35) 0%, rgba(15, 18, 20, 0.95) 70%)'
                  : frameTheme === 'bosque'
                  ? 'radial-gradient(circle at 50% 50%, rgba(34, 197, 94, 0.35) 0%, rgba(10, 20, 14, 0.95) 70%)'
                  : 'radial-gradient(circle at 50% 50%, rgba(197, 142, 60, 0.35) 0%, rgba(18, 24, 20, 0.95) 70%)'
            }}
          />
          {/* Subtle noise/pattern overlay */}
          <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#C58E3C_1px,transparent_1px)] [background-size:16px_16px]" />
        </>
      )}

      {/* Triple Inner Border */}
      <div
        className={`absolute inset-2.5 rounded-[18px] border-2 pointer-events-none ${
          isTinta ? 'border-black' : 'border-[#C58E3C]/60'
        }`}
      />
      <div
        className={`absolute inset-4 rounded-[14px] border pointer-events-none ${
          isTinta ? 'border-black/50 border-dashed' : 'border-[#C58E3C]/30'
        }`}
      />

      {/* Corner Ornaments */}
      {[
        'top-3.5 left-3.5',
        'top-3.5 right-3.5 -scale-x-100',
        'bottom-3.5 left-3.5 -scale-y-100',
        'bottom-3.5 right-3.5 -scale-x-100 -scale-y-100'
      ].map((pos, idx) => (
        <div key={idx} className={`absolute ${pos} pointer-events-none`}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              d="M2 2 L12 2 C7 7 7 7 2 12 Z M2 2 L22 2 M2 2 L2 22"
              stroke={isTinta ? '#000000' : '#C58E3C'}
              strokeWidth="1.5"
              fill={isTinta ? 'none' : 'rgba(197, 142, 60, 0.25)'}
            />
            <circle cx="5" cy="5" r="1.5" fill={isTinta ? '#000000' : '#E6BE78'} />
          </svg>
        </div>
      ))}

      {/* Header Emblem */}
      <div className="relative z-10 pt-4 flex flex-col items-center">
        <span
          className={`text-[8.5px] uppercase font-bold tracking-[0.3em] font-sans ${
            isTinta ? 'text-zinc-700' : 'text-[#D4A373]'
          }`}
        >
          Suplemento del Director
        </span>
        <div className={`w-16 h-0.5 mt-1 ${isTinta ? 'bg-black' : 'bg-[#C58E3C]/70'}`} />
      </div>

      {/* Central Mystic Seal */}
      <div className="relative z-10 flex flex-col items-center justify-center my-auto py-2">
        <div
          className={`w-36 h-36 rounded-full flex items-center justify-center relative shadow-xl ${
            isTinta
              ? 'bg-white border-2 border-black'
              : 'bg-[#18201C] border-2 border-[#C58E3C]'
          }`}
        >
          {/* Outer Sun Rays / Ring */}
          <div
            className={`absolute inset-1.5 rounded-full border border-dashed ${
              isTinta ? 'border-black/60' : 'border-[#E6BE78]/40'
            }`}
          />

          {/* Central Logo SVG */}
          <svg
            width="88"
            height="88"
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="drop-shadow-md"
          >
            {/* Crossed Blades */}
            <path
              d="M25 75 L75 25 M30 75 L75 30 M25 70 L70 25"
              stroke={isTinta ? '#18181B' : '#E6BE78'}
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <path
              d="M75 75 L25 25 M70 75 L25 30 M75 70 L30 25"
              stroke={isTinta ? '#18181B' : '#E6BE78'}
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            {/* Mystic Center Diamond */}
            <polygon
              points="50,15 85,50 50,85 15,50"
              stroke={isTinta ? '#000000' : '#C58E3C'}
              strokeWidth="2"
              fill={isTinta ? '#FFFFFF' : 'rgba(21, 28, 24, 0.95)'}
            />
            <polygon
              points="50,26 74,50 50,74 26,50"
              stroke={isTinta ? '#000000' : '#E6BE78'}
              strokeWidth="1.2"
              fill={isTinta ? 'none' : 'rgba(197, 142, 60, 0.2)'}
            />
            {/* Runes / Dots */}
            <circle cx="50" cy="50" r="7" fill={isTinta ? '#000000' : '#E6BE78'} />
            <circle cx="50" cy="50" r="3" fill={isTinta ? '#FFFFFF' : '#18201C'} />
            <circle cx="50" cy="20" r="2.5" fill={isTinta ? '#000000' : '#E6BE78'} />
            <circle cx="50" cy="80" r="2.5" fill={isTinta ? '#000000' : '#E6BE78'} />
            <circle cx="20" cy="50" r="2.5" fill={isTinta ? '#000000' : '#E6BE78'} />
            <circle cx="80" cy="50" r="2.5" fill={isTinta ? '#000000' : '#E6BE78'} />
          </svg>
        </div>

        {/* Title */}
        <h1
          className={`font-heading text-xl sm:text-2xl font-black tracking-widest mt-4 uppercase drop-shadow-sm text-center ${
            isTinta ? 'text-black' : 'text-[#F3E3B9]'
          }`}
        >
          Papa Tumbay
        </h1>
        <p
          className={`text-[9.5px] uppercase tracking-[0.25em] font-sans font-semibold mt-0.5 text-center ${
            isTinta ? 'text-zinc-600' : 'text-[#BCA27E]'
          }`}
        >
          Cartas Coleccionables & Adversarios
        </p>
      </div>

      {/* Footer Info */}
      <div className="relative z-10 pb-3 flex flex-col items-center">
        <div className={`w-12 h-0.5 mb-1 ${isTinta ? 'bg-black' : 'bg-[#C58E3C]/60'}`} />
        <span
          className={`text-[8px] font-mono uppercase tracking-widest ${
            isTinta ? 'text-zinc-500' : 'text-[#8C7A64]'
          }`}
        >
          Edición Oficial • Borrador v0.4
        </span>
      </div>
    </div>
  );
};
