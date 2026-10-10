import { NpcData, NpcRank, Trait } from '../types/npc';

// Base stats by rank (at base threat) - Papa Tumbay Borrador v0.4
export const RANK_BASE_STATS: Record<
  NpcRank,
  {
    npcCount: number;
    barriers: number[];
    aptitude: number;
    actions: number;
    amenazaBase: number;
    typicalCount: string;
    maxRecommendedTraits: number;
    recommendedSecondaryConcepts: string;
    examples: string;
    description: string;
  }
> = {
  Pandilla: {
    npcCount: 6,
    barriers: [6],
    aptitude: 1,
    actions: 1,
    amenazaBase: 0,
    typicalCount: '6 criaturas',
    maxRecommendedTraits: 1,
    recommendedSecondaryConcepts: 'Principal, más uno secundario como máximo',
    examples: 'Lobos, ratas gigantes, goblins',
    description: 'Grupo de 6 enemigos básicos. 1 barrera (ND 6) y 1 acción cada uno.'
  },
  Cuadrilla: {
    npcCount: 4,
    barriers: [8, 9],
    aptitude: 4,
    actions: 1,
    amenazaBase: 2,
    typicalCount: '4 criaturas',
    maxRecommendedTraits: 1,
    recommendedSecondaryConcepts: 'Principal, más uno o dos secundarios',
    examples: 'Bandidos, guardias, cultistas',
    description: 'Grupo de 4 combatientes estándar. 2 barreras (ND 8/9) y 1 acción cada uno.'
  },
  Trío: {
    npcCount: 3,
    barriers: [8, 9],
    aptitude: 4,
    actions: 2,
    amenazaBase: 3,
    typicalCount: '3 criaturas',
    maxRecommendedTraits: 2,
    recommendedSecondaryConcepts: 'Principal, más dos secundarios',
    examples: 'Mercenarios, aquelarre de brujas',
    description: 'Grupo de 3 enemigos peligrosos. 2 barreras (ND 8/9) y 2 acciones cada uno.'
  },
  Dúo: {
    npcCount: 2,
    barriers: [10, 11, 12],
    aptitude: 7,
    actions: 2,
    amenazaBase: 5,
    typicalCount: '2 criaturas',
    maxRecommendedTraits: 2,
    recommendedSecondaryConcepts: 'Principal, más dos secundarios',
    examples: 'Ogros, campeones',
    description: 'Pareja de monstruos temibles o campeones. 3 barreras (ND 10/11/12) y 2 acciones cada uno.'
  },
  Solo: {
    npcCount: 1,
    barriers: [13, 14, 15, 16],
    aptitude: 9,
    actions: 3,
    amenazaBase: 7,
    typicalCount: '1 criatura',
    maxRecommendedTraits: 3,
    recommendedSecondaryConcepts: 'Principal, más tres secundarios',
    examples: 'Dragón joven, señor de la guerra',
    description: 'Criatura solitaria o coloso. 4 barreras (ND 13/14/15/16) y 3 acciones por turno.'
  }
};

// Threat Level Table according to character level (1 to 8) for 4 players
// Column headers: Cuadrilla Fácil, Cuadrilla Normal, Cuadrilla Difícil, Solo Fácil, Solo Normal, Solo Difícil
export const THREAT_TABLE_4_PLAYERS: Record<
  number,
  {
    cuadrillaFacil: number;
    cuadrillaNormal: number;
    cuadrillaDificil: number;
    jefeFacil: number;
    jefeNormal: number;
    jefeDificil: number;
  }
> = {
  1: { cuadrillaFacil: 0, cuadrillaNormal: 1, cuadrillaDificil: 3, jefeFacil: 1, jefeNormal: 2, jefeDificil: 3 },
  2: { cuadrillaFacil: 1, cuadrillaNormal: 2, cuadrillaDificil: 4, jefeFacil: 1, jefeNormal: 2, jefeDificil: 3 },
  3: { cuadrillaFacil: 2, cuadrillaNormal: 3, cuadrillaDificil: 5, jefeFacil: 2, jefeNormal: 3, jefeDificil: 4 },
  4: { cuadrillaFacil: 3, cuadrillaNormal: 4, cuadrillaDificil: 6, jefeFacil: 3, jefeNormal: 4, jefeDificil: 5 },
  5: { cuadrillaFacil: 4, cuadrillaNormal: 5, cuadrillaDificil: 7, jefeFacil: 4, jefeNormal: 5, jefeDificil: 6 },
  6: { cuadrillaFacil: 5, cuadrillaNormal: 6, cuadrillaDificil: 8, jefeFacil: 4, jefeNormal: 5, jefeDificil: 6 },
  7: { cuadrillaFacil: 6, cuadrillaNormal: 7, cuadrillaDificil: 8, jefeFacil: 4, jefeNormal: 5, jefeDificil: 6 },
  8: { cuadrillaFacil: 7, cuadrillaNormal: 8, cuadrillaDificil: 9, jefeFacil: 5, jefeNormal: 6, jefeDificil: 7 }
};

// Official catalog of traits - Papa Tumbay Borrador v0.4
export const OFFICIAL_TRAITS: Trait[] = [
  // 1. Rasgos menores (costo 0)
  {
    id: 'veloz',
    name: 'Veloz',
    effect: 'Se mueve dos veces por turno sin gastar su Actuar.',
    cost: 0,
    category: 'menor'
  },
  {
    id: 'volador_trepador',
    name: 'Volador / Trepador / Nadador',
    effect: 'Se mueve por un medio que los personajes no dominan; puede esquivar o aislar a sus víctimas.',
    cost: 0,
    category: 'menor'
  },
  {
    id: 'presa',
    name: 'Presa',
    effect: 'Si impacta, el objetivo no puede Moverse hasta que gaste su Actuar para liberarse.',
    cost: 0,
    category: 'menor'
  },
  {
    id: 'resistente',
    name: 'Resistente a algo',
    effect: '+2 a su Aptitud al aguantar un tipo de efecto (fuego, veneno, miedo...).',
    cost: 0,
    category: 'menor'
  },
  {
    id: 'sentidos_agudos',
    name: 'Sentidos agudos',
    effect: 'Detectarlo o sorprenderlo exige una tirada contra un ND que fijas tú (normalmente 8 a 10).',
    cost: 0,
    category: 'menor'
  },

  // 2. Bonos acumulables (costo 0, hasta 3 veces)
  {
    id: 'certero',
    name: 'Certero',
    effect: '+2 a sus tiradas de ataque (acumulable hasta 3 veces para +6).',
    cost: 0,
    category: 'acumulable'
  },
  {
    id: 'arcano',
    name: 'Arcano',
    effect: '+2 a sus tiradas de magia (acumulable hasta 3 veces para +6). Requiere Dotado.',
    cost: 0,
    category: 'acumulable'
  },
  {
    id: 'templado',
    name: 'Templado',
    effect: '+2 a resistir efectos (acumulable hasta 3 veces para +6).',
    cost: 0,
    category: 'acumulable'
  },

  // 3. Ventajas con costo (calibradas según Rango)
  {
    id: 'accion_extra',
    name: 'Acción extra',
    effect: 'Gana un Actuar por turno.',
    cost: 2,
    rankCosts: { Pandilla: 3, Cuadrilla: 3, Trío: 2, Dúo: 2, Solo: 1 },
    category: 'ventaja',
    appliesDirectlyToStats: true
  },
  {
    id: 'ataque_doble',
    name: 'Ataque doble',
    effect: 'Su primera acción de cada ronda ataca dos veces.',
    cost: 2,
    rankCosts: { Pandilla: 3, Cuadrilla: 3, Trío: 2, Dúo: 2, Solo: 1 },
    category: 'ventaja'
  },
  {
    id: 'barrera_extra_alta',
    name: 'Barrera extra (alta)',
    effect: 'Gana una Barrera que copia la de ND más alto.',
    cost: 2,
    rankCosts: { Pandilla: 3, Cuadrilla: 2, Trío: 2, Dúo: 1, Solo: 1 },
    category: 'ventaja',
    appliesDirectlyToStats: true
  },
  {
    id: 'barrera_extra_baja',
    name: 'Barrera extra (baja)',
    effect: 'Gana una Barrera que copia la de ND más bajo.',
    cost: 1,
    rankCosts: { Pandilla: 3, Cuadrilla: 1, Trío: 2, Dúo: 1, Solo: 0 },
    category: 'ventaja',
    appliesDirectlyToStats: true
  },
  {
    id: 'piel_dura',
    name: 'Piel dura',
    effect: '+2 al ND de todas sus Barreras (+N al ND de todas sus Barreras, N de 1 a 4).',
    cost: 2,
    rankCosts: { Pandilla: 2, Cuadrilla: 2, Trío: 2, Dúo: 2, Solo: 2 },
    category: 'ventaja',
    appliesDirectlyToStats: true
  },
  {
    id: 'golpe_de_area',
    name: 'Golpe de área',
    effect: 'Una vez por ronda, un ataque con una sola tirada contra todos los personajes.',
    cost: 2,
    rankCosts: { Pandilla: 5, Cuadrilla: 6, Trío: 5, Dúo: 6, Solo: 2 },
    category: 'ventaja'
  },
  {
    id: 'regeneracion',
    name: 'Regeneración',
    effect: 'Al empezar su turno recupera su Barrera rota de ND más alto.',
    cost: 3,
    rankCosts: { Pandilla: 0, Cuadrilla: 2, Trío: 2, Dúo: 3, Solo: 3 },
    category: 'ventaja'
  },
  {
    id: 'golpe_aturdidor',
    name: 'Golpe aturdidor',
    effect: 'Si su ataque rompe una Barrera, el personaje tira Vigor contra ND 10 o pierde una acción.',
    cost: 1,
    rankCosts: { Pandilla: 1, Cuadrilla: 1, Trío: 1, Dúo: 1, Solo: 1 },
    category: 'ventaja'
  },
  {
    id: 'aterrador',
    name: 'Aterrador',
    effect: 'Al empezar el combate, cada personaje tira 2d6 + Presencia contra ND 8; quien falla pierde su primera acción.',
    cost: 1,
    rankCosts: { Pandilla: 2, Cuadrilla: 1, Trío: 2, Dúo: 1, Solo: 0 },
    category: 'ventaja'
  },
  {
    id: 'dotado',
    name: 'Dotado',
    effect: 'Lanza conjuros (usa Aptitud en lugar de Presencia; conjuros al día = Actuar + 1). Cuenta como Concepto mágico.',
    cost: 2,
    rankCosts: { Pandilla: 2, Cuadrilla: 2, Trío: 2, Dúo: 2, Solo: 2 },
    category: 'ventaja'
  },
  {
    id: 'magia_ampliada',
    name: 'Magia ampliada',
    effect: '+2 conjuros al día sobre los de Dotado. Requiere Dotado.',
    cost: 2,
    rankCosts: { Pandilla: 2, Cuadrilla: 2, Trío: 2, Dúo: 2, Solo: 2 },
    category: 'ventaja'
  },

  // 4. Desventajas (el valor suma a la Amenaza; cost negativo en el modelo interno)
  {
    id: 'fragil',
    name: 'Frágil',
    effect: '-2 al ND de todas sus Barreras (-N al ND, N de 1 a 3; suma +N a la Amenaza).',
    cost: -2,
    category: 'desventaja',
    appliesDirectlyToStats: true
  },
  {
    id: 'punto_debil',
    name: 'Punto débil',
    effect: '-3 al ND de su última Barrera (suma +1 a la Amenaza).',
    cost: -1,
    category: 'desventaja',
    appliesDirectlyToStats: true
  },
  {
    id: 'lento',
    name: 'Lento',
    effect: 'Tiene un Actuar menos por turno (solo Trío, Dúo o Solo).',
    cost: -1,
    rankCosts: { Trío: -2, Dúo: -2, Solo: -1 },
    category: 'desventaja',
    appliesDirectlyToStats: true
  },
  {
    id: 'sin_una_barrera',
    name: 'Sin una Barrera',
    effect: 'Pierde su Barrera de ND más alto.',
    cost: -1,
    rankCosts: { Cuadrilla: -2, Trío: -2, Dúo: -1, Solo: -1 },
    category: 'desventaja',
    appliesDirectlyToStats: true
  },
  {
    id: 'torpe',
    name: 'Torpe',
    effect: '-2 a la Aptitud (rasgo descriptivo/color; casi no altera dificultad en simulación).',
    cost: 0,
    category: 'desventaja',
    appliesDirectlyToStats: true
  },
  {
    id: 'fragil_primera_barrera',
    name: 'Frágil de la 1ª Barrera',
    effect: '-2 al ND únicamente en la Barrera I (rasgo descriptivo/color).',
    cost: 0,
    category: 'desventaja',
    appliesDirectlyToStats: true
  }
];

export const BEHAVIORS_PRESETS: {
  type: 'Bestia' | 'Táctico' | 'Cobarde' | 'Fanático' | 'Depredador' | 'Vengativo' | 'Errático' | 'Defensivo';
  description: string;
}[] = [
  {
    type: 'Bestia',
    description: 'Ataca al personaje más cercano o al azar. Huye si pierde la mitad de sus Barreras, salvo que proteja a su cría.'
  },
  {
    type: 'Táctico',
    description: 'Ataca al personaje más herido. Protege a su líder y se reagrupa.'
  },
  {
    type: 'Cobarde',
    description: 'Huye o se rinde cuando pierde su primera Barrera.'
  },
  {
    type: 'Fanático',
    description: 'Lucha hasta quedar derrotado. Nunca se rinde.'
  },
  {
    type: 'Depredador',
    description: 'Elige a su víctima y la persigue; ignora a los demás mientras pueda.'
  },
  {
    type: 'Vengativo',
    description: 'Ataca a quien lo atacó previamente.'
  },
  {
    type: 'Errático',
    description: 'Actúa sin sentido ni lógica.'
  },
  {
    type: 'Defensivo',
    description: 'Se preocupa más de mantenerse con vida que de atacar a otros.'
  }
];

// Pre-built official examples from section 5 of the PDF (Borrador v0.4)
export const PREBUILT_NPCS: NpcData[] = [
  {
    id: 'lobo_de_ceniza',
    name: 'Lobos de ceniza',
    quote: 'Acechan en jaurías silenciosas donde el humo apaga los pasos.',
    mainConcept: 'Lobo de ceniza',
    secondaryConcepts: ['Rastreador', 'Cazador en manada'],
    rank: 'Pandilla',
    unitFormation: 'Cuadrilla',
    targetNA: 7,
    selectedTraits: [],
    behaviorType: 'Bestia',
    behaviorDescription: 'Bestia. Rodean a un personaje y huyen si pierden la mitad de sus Barreras.',
    avatarPreset: 'wolf',
    notes: 'Pandilla (6 NPC, Amenaza base 0) con Amenaza 7: ND 6 + 7 = ND 13, Aptitud +8, Actuar 1.'
  },
  {
    id: 'bandido_veterano',
    name: 'Bandidos veteranos',
    quote: 'El acero mellado aún corta, y la experiencia enseña por la espalda.',
    mainConcept: 'Bandido veterano',
    secondaryConcepts: ['Emboscador'],
    rank: 'Cuadrilla',
    unitFormation: 'Cuadrilla',
    targetNA: 7,
    selectedTraits: [],
    behaviorType: 'Cobarde',
    behaviorDescription: 'Cobarde. Huyen o se rinden en cuanto se les rompe la primera Barrera.',
    avatarPreset: 'bandit',
    notes: 'Cuadrilla (4 NPC, Amenaza base 2) con Amenaza 7: ND 8/9 + (7 - 2) = ND 13/14, Aptitud +9, Actuar 1.'
  },
  {
    id: 'ogro_de_la_cienaga',
    name: 'Ogros de la ciénaga',
    quote: 'Pesados como el lodo espeso y con un garrote arrancado de cuajo.',
    mainConcept: 'Ogro',
    secondaryConcepts: ['Cazador de la ciénaga', 'Bruto'],
    rank: 'Dúo',
    unitFormation: 'Solitario',
    targetNA: 8,
    selectedTraits: [
      OFFICIAL_TRAITS.find((t) => t.id === 'piel_dura')!
    ],
    behaviorType: 'Fanático',
    behaviorDescription: 'Fanático. Atacan al que más cerca esté y no huyen jamás.',
    avatarPreset: 'ogre',
    notes: 'Dúo (2 NPC, Amenaza base 5) con Amenaza 8 y Piel dura 2 (Amenaza efectiva 6): ND 10/11/12 + 1 + 2 = ND 13/14/15, Aptitud +8, Actuar 2.'
  },
  {
    id: 'hechicero_del_abismo',
    name: 'Hechiceros del abismo',
    quote: 'Los susurros del vacío tuercen el aire antes de que el rayo caiga.',
    mainConcept: 'Hechicero del abismo (mágico)',
    secondaryConcepts: ['Sacerdote del culto', 'Voz ritual'],
    rank: 'Dúo',
    unitFormation: 'Solitario',
    targetNA: 8,
    selectedTraits: [
      {
        ...OFFICIAL_TRAITS.find((t) => t.id === 'dotado')!,
        effect: 'Lanza conjuros (Actuar + 1 conjuros al día = 3 conjuros al día, ej. Aturdir y Estallido).'
      }
    ],
    behaviorType: 'Cobarde',
    behaviorDescription: 'Cobarde. Se esconden tras sus aliados y huyen al primer golpe.',
    avatarPreset: 'cultist',
    notes: 'Dúo (2 NPC, Amenaza base 5) con Amenaza 8 y Dotado (costo 2 -> Amenaza efectiva 6): ND 10/11/12 + 1 = ND 11/12/13, Aptitud +8, Actuar 2. Conjuros: 3 al día.'
  },
  {
    id: 'dragon_joven',
    name: 'Dragón joven',
    quote: 'El azufre precede a su sombra en las cumbres escarpadas.',
    mainConcept: 'Dragón joven',
    secondaryConcepts: ['Acechador de las montañas', 'Voz seductora'],
    rank: 'Solo',
    unitFormation: 'Solitario',
    targetNA: 8,
    selectedTraits: [
      {
        ...OFFICIAL_TRAITS.find((t) => t.id === 'golpe_de_area')!,
        name: 'Golpe de área (su aliento)',
        effect: 'Una vez por ronda, un ataque con una sola tirada contra todos los personajes (su aliento).'
      }
    ],
    behaviorType: 'Bestia',
    behaviorDescription: 'Bestia. Vuela, lanza el aliento sobre el grupo y se retira si pierde la mitad de sus Barreras.',
    avatarPreset: 'dragon',
    notes: 'Solo (1 NPC, Amenaza base 7) con Amenaza 8 y Golpe de área (costo 2 en Solo -> Amenaza efectiva 6): ND 13/14/15/16 - 1 = ND 12/13/14/15, Aptitud +8, Actuar 3.'
  }
];
