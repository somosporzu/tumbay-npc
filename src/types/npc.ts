// Papa Tumbay Borrador v0.4: Pandilla (6), Cuadrilla (4), Trío (3), Dúo (2), Solo (1)
export type NpcRank = 'Pandilla' | 'Cuadrilla' | 'Trío' | 'Dúo' | 'Solo';

export type BehaviorType =
  | 'Bestia'
  | 'Táctico'
  | 'Cobarde'
  | 'Fanático'
  | 'Depredador'
  | 'Vengativo'
  | 'Errático'
  | 'Defensivo'
  | 'Personalizado';

export type TraitCategory = 'menor' | 'ventaja' | 'desventaja' | 'acumulable' | 'provisional';

export interface Trait {
  id: string;
  name: string;
  effect: string;
  cost: number; // positive = advantage (subtracts from NA), negative = disadvantage (adds to NA), 0 = minor
  rankCosts?: Partial<Record<NpcRank, number>>; // Specific costs according to Rank table in Borrador v0.4
  category: TraitCategory;
  isCustom?: boolean;
  isCustomized?: boolean; // If user modified the name or text of an existing trait
  originalName?: string;
  originalEffect?: string;
  count?: number; // For cumulative traits (Certero, Arcano, Templado up to 3 times)
  appliesDirectlyToStats?: boolean; // If true, effect is directly applied to numbers (Aptitude, ND, Actions) and not listed on the card
  statModifier?: {
    aptitude?: number;
    actions?: number;
    barriersNd?: number;
  };
}

export type CardFrameTheme = 'pergamino' | 'cripta' | 'arcano' | 'bosque' | 'tinta';

export interface NpcData {
  id: string;
  name: string;
  quote?: string;
  mainConcept: string;
  secondaryConcepts: string[];
  rank: NpcRank;
  rankVariant?: 'normal' | 'debil' | 'veterano'; // e.g., bandido débil (-1 ND, -1 Aptitud), soldado veterano (+1 ND)
  unitFormation?: 'Cuadrilla' | 'Solitario'; // Cuadrilla (mobs) vs Solitario (solos)
  targetNA: number;
  selectedTraits: Trait[];
  behaviorType: BehaviorType;
  behaviorDescription: string;
  avatarUrl?: string;
  avatarPreset?: string;
  imageFit?: {
    scale?: number;
    offsetX?: number;
    offsetY?: number;
    brightness?: number;
    overlayDim?: number;
    fitMode?: 'cover' | 'contain' | 'width' | 'height';
  };
  cardColorTheme?: string; // Hex color for the name bar and coordinated card elements
  cardFrameTheme?: CardFrameTheme; // Visual frame style: pergamino, cripta, arcano, bosque, tinta (ahorro de tinta)
  notes?: string;
  // Live state during encounters
  currentDamagedBarriers?: number; // count of broken barriers
}

export interface CalculatedNpcStats {
  targetNA: number; // Amenaza base elegida del NPC
  effectiveThreat: number; // Amenaza efectiva según documento base: Amenaza elegida - costos de rasgos + desventajas
  rankBaseThreat: number; // Amenaza base mínima del Rango (Pandilla 0, Cuadrilla 2, Trío 3, Dúo 5, Solo 7)
  threatDelta: number; // Amenaza efectiva - Amenaza base del Rango (escala Barreras y Aptitud)
  isEffectiveThreatBelowBase: boolean;
  traitsCostSum: number; // suma de costos de rasgos/ventajas (restan a la amenaza efectiva)
  traitsValueSum: number; // suma de valores de desventajas (suman a la amenaza efectiva)
  traitsDisadvantageSum: number; // alias para suma de desventajas
  netTraitModifier: number; // modificador neto (- costos + desventajas)
  resultNA: number; // alias para effectiveThreat (visible en la carta)
  baseBarriers: number[];
  finalBarriers: number[];
  baseAptitude: number;
  finalAptitude: number;
  baseActions: number;
  finalActions: number;
  spellsQuota?: number; // Para rasgo Dotado: Actuar + 1 conjuros por combate
  warnings: string[];
}

export type EncounterDifficulty = 'Fácil' | 'Normal' | 'Difícil';
export type EncounterStructure = 'cuadrilla' | 'solo_cuadrilla' | 'cuadrilla_lider' | 'jefe' | 'cuadrilla_pequena' | 'jefe_sequito' | 'personalizado';

export interface EncounterConfig {
  id: string;
  title: string;
  playerLevel: number; // 1 to 8
  playerCount: number; // 2, 3, 4, 5+
  difficulty: EncounterDifficulty;
  structure: EncounterStructure;
  recommendedNA: number;
  npcs: {
    npcId: string;
    overrideNA?: number;
    count: number;
    customName?: string;
  }[];
}

export interface EncounterNpcEntry {
  instanceId: string;
  npcId: string;
  customName: string;
  unitType: 'cuadrilla' | 'solitario'; // Pandilla/Cuadrilla = cuadrilla; Trío/Dúo/Solo = solitario
  squadMembersCount?: number; // e.g. 5 members in the squadron
  freeNdBonus: number; // Cada ND libre sobre el ND de la criatura le da un bono
  overrideNA?: number;
  brokenBarriers: boolean[];
}

export interface RollResult {
  id: string;
  timestamp: Date;
  npcName: string;
  unitType?: 'cuadrilla' | 'solitario';
  actionName: string;
  diceCount: 2 | 3; // 2d6 or 3d6 (with relevant concept)
  rolledDice: number[];
  keptDice: number[];
  baseAptitude: number;
  freeNdBonus: number;
  aptitudeBonus: number; // baseAptitude + freeNdBonus
  targetNd?: number;
  ndMargin?: number; // margin over player ND
  total: number;
  isCrit: boolean; // double 6
  isBrotar: boolean; // double 1
  description: string;
}
