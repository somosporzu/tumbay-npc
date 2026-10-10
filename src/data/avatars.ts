export interface AvatarPreset {
  id: string;
  name: string;
  category: 'bestias' | 'humanoides' | 'monstruos' | 'elementales';
  svgBackground: string;
  iconSvg: string;
  accentColor: string;
}

export const BEHAVIOR_ICONS: Record<
  string,
  { label: string; icon: string; description: string }
> = {
  Bestia: {
    label: 'Bestia',
    icon: '🐾',
    description: 'Ataca al más cercano o al azar. Huye si pierde su primera Barrera.'
  },
  Táctico: {
    label: 'Táctico',
    icon: '🎯',
    description: 'Ataca al más herido. Protege a su líder y se reagrupa.'
  },
  Cobarde: {
    label: 'Cobarde',
    icon: '🪶',
    description: 'Huye o se rinde cuando pierde la mitad de sus Barreras.'
  },
  Fanático: {
    label: 'Fanático',
    icon: '🔥',
    description: 'Lucha hasta quedar derrotado. Nunca se rinde.'
  },
  Depredador: {
    label: 'Depredador',
    icon: '👁️',
    description: 'Elige a su víctima y la persigue; ignora a los demás mientras pueda.'
  },
  Vengativo: {
    label: 'Vengativo',
    icon: '⚡',
    description: 'Ataca a quien lo atacó previamente.'
  },
  Errático: {
    label: 'Errático',
    icon: '🌀',
    description: 'Actúa sin sentido ni lógica.'
  },
  Defensivo: {
    label: 'Defensivo',
    icon: '🛡️',
    description: 'Se preocupa más de mantenerse con vida que de atacar a otros.'
  },
  Personalizado: {
    label: 'Personalizado',
    icon: '⚔️',
    description: 'Comportamiento táctico único definido por el Director.'
  }
};

export const AVATAR_PRESETS: AvatarPreset[] = [
  {
    id: 'wolf',
    name: 'Lobo de Ceniza / Ciénaga',
    category: 'bestias',
    accentColor: '#4A3B32',
    iconSvg: '🐺',
    svgBackground: `<svg viewBox="0 0 400 580" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" width="100%" height="100%">
      <defs>
        <linearGradient id="wolfBg" x1="0" y1="0" x2="0" y2="580" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#1c2524"/>
          <stop offset="35%" stop-color="#2d3b36"/>
          <stop offset="70%" stop-color="#1e2925"/>
          <stop offset="100%" stop-color="#121816"/>
        </linearGradient>
        <radialGradient id="moonGlow" cx="200" cy="180" r="160" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#9ce6b9" stop-opacity="0.5"/>
          <stop offset="60%" stop-color="#4e886d" stop-opacity="0.2"/>
          <stop offset="100%" stop-color="#2d3b36" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="400" height="580" fill="url(#wolfBg)"/>
      <circle cx="200" cy="180" r="140" fill="url(#moonGlow)"/>
      <!-- Ancient mossy pillars & ruins -->
      <rect x="70" y="80" width="70" height="280" fill="#384942" opacity="0.6"/>
      <rect x="260" y="60" width="80" height="320" fill="#32423c" opacity="0.7"/>
      <path d="M50 340 L160 300 L250 330 L360 290 L400 370 L0 370 Z" fill="#24312c"/>
      <!-- Vines and foliage -->
      <path d="M70 90 Q110 130 90 200 Q70 260 110 320" stroke="#5a8264" stroke-width="12" stroke-linecap="round" fill="none" opacity="0.6"/>
      <circle cx="100" cy="160" r="18" fill="#6f9e7b" opacity="0.7"/>
      <circle cx="270" cy="120" r="22" fill="#6f9e7b" opacity="0.7"/>
      <circle cx="310" cy="180" r="16" fill="#84b891" opacity="0.6"/>
      <!-- Wolf silhouette in moonlight -->
      <path d="M140 320 C150 250 180 210 200 170 C220 210 250 250 260 320 C240 305 210 295 200 295 C190 295 160 305 140 320 Z" fill="#131b18"/>
      <polygon points="165,220 145,160 185,200" fill="#18231f"/>
      <polygon points="235,220 255,160 215,200" fill="#18231f"/>
      <ellipse cx="182" cy="235" rx="8" ry="6" fill="#75ffb8"/>
      <ellipse cx="218" cy="235" rx="8" ry="6" fill="#75ffb8"/>
      <circle cx="182" cy="235" r="3" fill="#0b1712"/>
      <circle cx="218" cy="235" r="3" fill="#0b1712"/>
      <!-- Atmospheric fireflies / spores -->
      <circle cx="150" cy="140" r="4" fill="#a8ffcc" opacity="0.8"/>
      <circle cx="250" cy="130" r="5" fill="#a8ffcc" opacity="0.9"/>
      <circle cx="120" cy="280" r="3" fill="#a8ffcc" opacity="0.7"/>
      <circle cx="280" cy="270" r="4" fill="#a8ffcc" opacity="0.8"/>
    </svg>`
  },
  {
    id: 'bandit',
    name: 'Bandido / Campamento',
    category: 'humanoides',
    accentColor: '#6B4226',
    iconSvg: '🗡️',
    svgBackground: `<svg viewBox="0 0 400 580" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" width="100%" height="100%">
      <defs>
        <linearGradient id="banditBg" x1="0" y1="0" x2="0" y2="580" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#2a1e17"/>
          <stop offset="40%" stop-color="#442e20"/>
          <stop offset="75%" stop-color="#2c1a11"/>
          <stop offset="100%" stop-color="#140a05"/>
        </linearGradient>
        <radialGradient id="fireGlow" cx="200" cy="320" r="180" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#ff9944" stop-opacity="0.6"/>
          <stop offset="50%" stop-color="#c94e1d" stop-opacity="0.3"/>
          <stop offset="100%" stop-color="#2c1a11" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="400" height="580" fill="url(#banditBg)"/>
      <circle cx="200" cy="320" r="160" fill="url(#fireGlow)"/>
      <!-- Trees and rocky crags -->
      <path d="M0 0 L90 0 L60 350 L0 380 Z" fill="#1b120c"/>
      <path d="M310 0 L400 0 L400 370 L340 330 Z" fill="#1b120c"/>
      <!-- Campfire / Ember silhouette -->
      <polygon points="190,360 210,360 200,320" fill="#ffdd66"/>
      <path d="M185 365 Q200 330 205 315 Q215 340 220 365 Z" fill="#ff7a29"/>
      <!-- Rogue figure -->
      <circle cx="200" cy="220" r="32" fill="#18110b"/>
      <path d="M150 330 C160 260 180 245 200 245 C220 245 240 260 250 330 Z" fill="#20150e"/>
      <path d="M175 225 L225 225 L215 245 L185 245 Z" fill="#913329"/>
      <circle cx="190" cy="215" r="4" fill="#ffaa5e"/>
      <circle cx="210" cy="215" r="4" fill="#ffaa5e"/>
    </svg>`
  },
  {
    id: 'ogre',
    name: 'Ogro de la Ciénaga',
    category: 'monstruos',
    accentColor: '#4A5B3E',
    iconSvg: '🧌',
    svgBackground: `<svg viewBox="0 0 400 580" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" width="100%" height="100%">
      <defs>
        <linearGradient id="ogreBg" x1="0" y1="0" x2="0" y2="580" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#1f281e"/>
          <stop offset="40%" stop-color="#2d3b2a"/>
          <stop offset="80%" stop-color="#182116"/>
          <stop offset="100%" stop-color="#0d140c"/>
        </linearGradient>
      </defs>
      <rect width="400" height="580" fill="url(#ogreBg)"/>
      <ellipse cx="200" cy="250" r="140" fill="#5c7a4e" opacity="0.25"/>
      <!-- Colossal brute silhouette with tree trunk club -->
      <circle cx="200" cy="180" r="50" fill="#222d1e"/>
      <path d="M120 350 C130 240 170 215 200 215 C230 215 270 240 280 350 Z" fill="#1b2418"/>
      <!-- Giant Club -->
      <polygon points="260,140 295,120 320,330 290,340" fill="#3d2a1b"/>
      <!-- Glowing yellow eyes -->
      <ellipse cx="185" cy="175" rx="7" ry="5" fill="#f2d057"/>
      <ellipse cx="215" cy="175" rx="7" ry="5" fill="#f2d057"/>
      <!-- Swamp leaves & fog -->
      <path d="M0 360 Q100 320 200 340 Q300 320 400 360 L400 580 L0 580 Z" fill="#10180f" opacity="0.8"/>
    </svg>`
  },
  {
    id: 'golem',
    name: 'Gólem de Piedra',
    category: 'elementales',
    accentColor: '#58595B',
    iconSvg: '🗿',
    svgBackground: `<svg viewBox="0 0 400 580" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" width="100%" height="100%">
      <defs>
        <linearGradient id="golemBg" x1="0" y1="0" x2="0" y2="580" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#202428"/>
          <stop offset="50%" stop-color="#303840"/>
          <stop offset="100%" stop-color="#14171a"/>
        </linearGradient>
      </defs>
      <rect width="400" height="580" fill="url(#golemBg)"/>
      <!-- Monolithic stone titan -->
      <polygon points="150,150 200,90 250,150 230,220 170,220" fill="#444d56"/>
      <polygon points="120,230 200,200 280,230 300,350 100,350" fill="#373e46"/>
      <!-- Rune Core glowing cyan -->
      <circle cx="200" cy="160" r="16" fill="#38bdf8" opacity="0.9"/>
      <circle cx="200" cy="270" r="28" fill="#38bdf8" opacity="0.75"/>
      <line x1="200" y1="160" x2="200" y2="270" stroke="#bae6fd" stroke-width="6"/>
      <polygon points="180,145 190,145 185,155" fill="#ffffff"/>
      <polygon points="210,145 220,145 215,155" fill="#ffffff"/>
    </svg>`
  },
  {
    id: 'dragon',
    name: 'Dragón Joven / Volcánico',
    category: 'monstruos',
    accentColor: '#8C3224',
    iconSvg: '🐉',
    svgBackground: `<svg viewBox="0 0 400 580" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" width="100%" height="100%">
      <defs>
        <linearGradient id="dragonBg" x1="0" y1="0" x2="0" y2="580" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#36110e"/>
          <stop offset="45%" stop-color="#4d1612"/>
          <stop offset="80%" stop-color="#290a07"/>
          <stop offset="100%" stop-color="#140403"/>
        </linearGradient>
        <radialGradient id="infernoGlow" cx="200" cy="240" r="180" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#ff6b35" stop-opacity="0.6"/>
          <stop offset="60%" stop-color="#b82614" stop-opacity="0.3"/>
          <stop offset="100%" stop-color="#36110e" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="400" height="580" fill="url(#dragonBg)"/>
      <circle cx="200" cy="240" r="160" fill="url(#infernoGlow)"/>
      <!-- Dragon head & spread wings silhouette -->
      <polygon points="200,90 140,160 170,220 200,240 230,220 260,160" fill="#240705"/>
      <!-- Horns -->
      <polygon points="160,120 110,60 150,90" fill="#190403"/>
      <polygon points="240,120 290,60 250,90" fill="#190403"/>
      <!-- Wings -->
      <path d="M140 200 C80 150 20 180 0 280 C60 260 120 250 150 260 Z" fill="#200604"/>
      <path d="M260 200 C320 150 380 180 400 280 C340 260 280 250 250 260 Z" fill="#200604"/>
      <!-- Burning slit eyes -->
      <polygon points="175,160 185,155 180,170" fill="#facc15"/>
      <polygon points="225,160 215,155 220,170" fill="#facc15"/>
      <!-- Sparks & embers -->
      <circle cx="160" cy="260" r="3" fill="#ffedd5"/>
      <circle cx="230" cy="250" r="4" fill="#fed7aa"/>
      <circle cx="200" cy="290" r="5" fill="#f97316"/>
    </svg>`
  }
];

export function getAvatarPreset(presetId?: string): AvatarPreset {
  const match = AVATAR_PRESETS.find((p) => p.id === presetId);
  return match || AVATAR_PRESETS[0];
}
