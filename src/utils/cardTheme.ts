import { CardFrameTheme } from '../types/npc';

export interface CardColorPreset {
  id: string;
  name: string;
  primary: string;
  borderAccent: string;
}

export interface FrameThemePreset {
  id: CardFrameTheme;
  name: string;
  subtitle: string;
  badge: string;
  cardBg: string;
  borderClass: string;
  innerBorderColor: string;
  accentColor: string;
}

export const FRAME_THEME_PRESETS: FrameThemePreset[] = [
  {
    id: 'pergamino',
    name: 'Pergamino Rústico',
    subtitle: 'Estilo canónico de Papa Tumbay con filigrana dorada y cuero cálido',
    badge: '📜 Pergamino',
    cardBg: '#181F1C',
    borderClass: 'border-[#D4A373]/60',
    innerBorderColor: 'rgba(212, 163, 115, 0.45)',
    accentColor: '#D4A373'
  },
  {
    id: 'cripta',
    name: 'Hierro & Cripta',
    subtitle: 'Marco gótico de hierro forjado y piedra fría para no-muertos y sombras',
    badge: '⚔️ Cripta',
    cardBg: '#121517',
    borderClass: 'border-[#94A3B8]/60',
    innerBorderColor: 'rgba(148, 163, 184, 0.45)',
    accentColor: '#CBD5E1'
  },
  {
    id: 'arcano',
    name: 'Éter Arcano',
    subtitle: 'Filigrana de constelaciones y runas luminosas para magos y dragones',
    badge: '✨ Arcano',
    cardBg: '#151024',
    borderClass: 'border-[#C084FC]/60',
    innerBorderColor: 'rgba(192, 132, 252, 0.45)',
    accentColor: '#E9D5FF'
  },
  {
    id: 'bosque',
    name: 'Musgo & Raíces',
    subtitle: 'Vides grabadas y madera de hierro para bestias y espíritus del bosque',
    badge: '🌿 Bosque',
    cardBg: '#101B14',
    borderClass: 'border-[#86EFAC]/60',
    innerBorderColor: 'rgba(134, 239, 172, 0.45)',
    accentColor: '#86EFAC'
  },
  {
    id: 'tinta',
    name: 'Modo Ahorro de Tinta',
    subtitle: 'Fondo blanco pulcro y grabado negro de bajo consumo para imprimir en casa',
    badge: '🖨️ Ahorro Tinta',
    cardBg: '#FFFFFF',
    borderClass: 'border-black/75',
    innerBorderColor: 'rgba(0, 0, 0, 0.7)',
    accentColor: '#18181B'
  }
];

export const CARD_COLOR_PRESETS: CardColorPreset[] = [
  { id: 'emerald', name: 'Esmeralda / Bosque', primary: '#3D6643', borderAccent: '#86CF8E' },
  { id: 'leather', name: 'Cuero / Pergamino', primary: '#7C5A37', borderAccent: '#D4A373' },
  { id: 'crimson', name: 'Carmesí / Rubí', primary: '#8A2B1D', borderAccent: '#F87171' },
  { id: 'sapphire', name: 'Zafiro / Marino', primary: '#1E3A8A', borderAccent: '#60A5FA' },
  { id: 'amethyst', name: 'Amatista / Arcano', primary: '#581C87', borderAccent: '#C084FC' },
  { id: 'amber', name: 'Ámbar / Solar', primary: '#92400E', borderAccent: '#FBBF24' },
  { id: 'obsidian', name: 'Obsidiana / Sombra', primary: '#27272A', borderAccent: '#A1A1AA' },
  { id: 'teal', name: 'Jade / Abisal', primary: '#0F766E', borderAccent: '#2DD4BF' }
];

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let clean = hex.replace('#', '');
  if (clean.length === 3) {
    clean = clean.split('').map((c) => c + c).join('');
  }
  const num = parseInt(clean, 16);
  if (isNaN(num)) return { r: 61, g: 102, b: 67 }; // default emerald
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255
  };
}

export function getCoordinatedTheme(baseHex?: string, isInkSaver: boolean = false) {
  if (isInkSaver) {
    return {
      baseHex: '#18181B',
      nameBarGradient: 'linear-gradient(90deg, #18181B 0%, #27272A 80%, transparent 100%)',
      borderAccent: '#000000',
      pillBg: '#18181B',
      pillBorder: '#000000',
      medallionBg: '#FFFFFF',
      medallionBorder: '#18181B',
      innerRingBorder: 'rgba(0, 0, 0, 0.4)',
      shieldFill: '#FFFFFF',
      shieldStroke: '#18181B',
      glowColor: 'transparent',
      isInkSaver: true
    };
  }

  const hex = baseHex || '#3D6643';
  const { r, g, b } = hexToRgb(hex);

  // Name bar gradient: from full primary to slightly darker/transparent
  const nameBarGradient = `linear-gradient(90deg, rgba(${r}, ${g}, ${b}, 0.96) 0%, rgba(${Math.max(0, r - 20)}, ${Math.max(0, g - 20)}, ${Math.max(0, b - 20)}, 0.88) 75%, transparent 100%)`;

  // Pill badge: exact matching color
  const pillBg = `rgba(${r}, ${g}, ${b}, 0.95)`;
  const pillBorder = `rgba(${Math.min(255, r + 50)}, ${Math.min(255, g + 50)}, ${Math.min(255, b + 50)}, 0.85)`;

  // Medallions (NA & Aptitude): deep rich tinted glassmorphism matching the theme
  const medallionBg = `rgba(${Math.max(8, Math.round(r * 0.25))}, ${Math.max(12, Math.round(g * 0.25))}, ${Math.max(10, Math.round(b * 0.25))}, 0.92)`;
  const medallionBorder = `rgba(${Math.min(255, r + 70)}, ${Math.min(255, g + 70)}, ${Math.min(255, b + 70)}, 0.85)`;
  const innerRingBorder = `rgba(255, 255, 255, 0.4)`;

  // Shields: matching tinted background with coordinated stroke
  const shieldFill = `rgba(${Math.max(10, Math.round(r * 0.3))}, ${Math.max(14, Math.round(g * 0.3))}, ${Math.max(12, Math.round(b * 0.3))}, 0.9)`;
  const shieldStroke = `rgba(${Math.min(255, r + 70)}, ${Math.min(255, g + 70)}, ${Math.min(255, b + 70)}, 0.9)`;

  // Accent border for name bar (light tint)
  const borderAccent = `rgb(${Math.min(255, r + 75)}, ${Math.min(255, g + 75)}, ${Math.min(255, b + 75)})`;

  return {
    baseHex: hex,
    nameBarGradient,
    borderAccent,
    pillBg,
    pillBorder,
    medallionBg,
    medallionBorder,
    innerRingBorder,
    shieldFill,
    shieldStroke,
    glowColor: `rgba(${r}, ${g}, ${b}, 0.5)`,
    isInkSaver: false
  };
}
