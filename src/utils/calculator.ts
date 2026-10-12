import { RANK_BASE_STATS, THREAT_TABLE_4_PLAYERS } from '../data/rulesData';
import { CalculatedNpcStats, EncounterConfig, EncounterDifficulty, NpcData, NpcRank, Trait } from '../types/npc';

/**
 * Trait IDs whose effects modify the creature's core numerical statistics directly
 * (Aptitude, ND of barriers, count of barriers, actions) and therefore
 * are applied automatically and NOT displayed in the collectible card's tactical traits box.
 */
export const AUTO_APPLIED_STAT_TRAIT_IDS = new Set<string>([
  'torpe',
  'piel_dura',
  'fragil',
  'fragil_primera_barrera',
  'barrera_extra',
  'barrera_extra_alta',
  'barrera_extra_baja',
  'punto_debil',
  'sin_una_barrera',
  'accion_extra',
  'lento'
]);

/**
 * Determines whether a trait is automatically reflected in the creature's numbers.
 */
export function isAutomaticStatTrait(trait: Trait): boolean {
  return Boolean(trait.appliesDirectlyToStats || AUTO_APPLIED_STAT_TRAIT_IDS.has(trait.id));
}

/**
 * Filters creature traits to return only tactical/combat rule traits that should be displayed
 * in the collectible card's traits box (excluding traits whose effects are already directly
 * reflected in the stats like Torpe, Piel dura, Lento, etc.).
 */
export function getTacticalCardTraits(traits: Trait[] = []): Trait[] {
  return traits.filter((t) => !isAutomaticStatTrait(t));
}

/**
 * Resolves the cost of a trait according to the creature's rank (Papa Tumbay Borrador v0.4).
 */
export function getTraitCostForRank(trait: Trait, rank: NpcRank): number {
  if (trait.rankCosts && trait.rankCosts[rank] !== undefined) {
    return trait.rankCosts[rank]!;
  }
  return trait.cost;
}

export function calculateNpcStats(npc: NpcData): CalculatedNpcStats {
  const baseStats = RANK_BASE_STATS[npc.rank] || RANK_BASE_STATS.Cuadrilla;
  const warnings: string[] = [];

  const activeTraits = npc.selectedTraits || [];

  // Trait count limit (Borrador v0.4: Pandilla/Cuadrilla máx 1, Trío/Dúo máx 2, Solo máx 3)
  if (activeTraits.length > baseStats.maxRecommendedTraits) {
    warnings.push(
      `Para un ${npc.rank}, el Suplemento v0.4 fija un límite máximo de ${baseStats.maxRecommendedTraits} rasgo(s). Actualmente tiene ${activeTraits.length}.`
    );
  }

  // Calculate costs & values using the rank-specific cost table
  // Regla oficial Papa Tumbay Borrador v0.4 (Documento Base):
  // Los costos de los rasgos (ventajas) descuentan presupuesto de Amenaza (- costo).
  // Las desventajas otorgan bono de Amenaza (suma +N a la Amenaza).
  let traitsCostSum = 0; // ventajas con costo (restan a la amenaza efectiva)
  let traitsValueSum = 0; // desventajas (suman a la amenaza efectiva)

  for (const t of activeTraits) {
    const cost = getTraitCostForRank(t, npc.rank);
    if (cost > 0) {
      traitsCostSum += cost;
    } else if (cost < 0 || t.category === 'desventaja') {
      traitsValueSum += Math.abs(cost);
    }
  }

  const traitsDisadvantageSum = traitsValueSum;
  // Modificador neto según documento base: - costos de ventajas + desventajas
  const netTraitModifier = -traitsCostSum + traitsValueSum;

  // Amenaza según Papa Tumbay Borrador v0.4
  // Target threat is the base threat chosen (minimum by rank)
  // Effective threat is targetThreat - traitsCostSum + traitsValueSum
  const targetThreat = npc.targetNA;
  const rawEffectiveThreat = targetThreat + netTraitModifier;
  const effectiveThreat = Math.max(0, Math.min(11, rawEffectiveThreat));
  const rankBaseThreat = baseStats.amenazaBase;
  // All barrier and aptitude calculations scale from effectiveThreat (not base)
  const threatDelta = effectiveThreat - rankBaseThreat;
  const isEffectiveThreatBelowBase = effectiveThreat < rankBaseThreat;

  if (effectiveThreat < rankBaseThreat) {
    warnings.push(
      `La Amenaza efectiva (${effectiveThreat}) es menor que la base del rango ${npc.rank} (${rankBaseThreat}).`
    );
  }
  if (rawEffectiveThreat < 0) {
    warnings.push(
      `La Amenaza efectiva calculada (${rawEffectiveThreat}) es menor que 0. El manual v0.4 indica: "La Amenaza efectiva nunca debería bajar de 0."`
    );
  }
  if (rawEffectiveThreat > 11) {
    warnings.push(
      `La Amenaza efectiva (${rawEffectiveThreat}) supera el nivel máximo de 11 permitido (ajustada al límite de 11).`
    );
  }

  // Base barrier values
  let workingBarriers = [...baseStats.barriers];

  // Rank variant modifiers (e.g. Bandido débil: -1 ND, Veterano: +1 ND)
  let variantNdModifier = 0;
  let variantAptitudeModifier = 0;
  if (npc.rankVariant === 'debil') {
    variantNdModifier = -1;
    variantAptitudeModifier = -1;
  } else if (npc.rankVariant === 'veterano') {
    variantNdModifier = 1;
  }

  // Step 1: Base + variant + threatDelta (Amenaza efectiva - Amenaza base del Rango)
  let finalBarriers = workingBarriers.map((b) => b + variantNdModifier + threatDelta);

  // Step 2: Handle barrier-altering traits
  const hasSinUnaBarrera = activeTraits.some((t) => t.id === 'sin_una_barrera');
  if (hasSinUnaBarrera && finalBarriers.length > 1) {
    // Loses highest ND barrier
    finalBarriers.pop();
  }

  const hasBarreraExtraAlta = activeTraits.some((t) => t.id === 'barrera_extra_alta' || t.id === 'barrera_extra');
  if (hasBarreraExtraAlta && finalBarriers.length > 0) {
    // Gains an extra barrier repeating the highest
    const highest = finalBarriers[finalBarriers.length - 1];
    finalBarriers.push(highest);
  }

  const hasBarreraExtraBaja = activeTraits.some((t) => t.id === 'barrera_extra_baja');
  if (hasBarreraExtraBaja && finalBarriers.length > 0) {
    // Gains an extra barrier repeating the lowest
    const lowest = finalBarriers[0];
    finalBarriers.unshift(lowest);
  }

  const hasPielDura = activeTraits.some((t) => t.id === 'piel_dura');
  if (hasPielDura) {
    finalBarriers = finalBarriers.map((b) => b + 2);
  }

  const hasFragil = activeTraits.some((t) => t.id === 'fragil');
  if (hasFragil) {
    finalBarriers = finalBarriers.map((b) => b - 2);
  }

  const hasPuntoDebil = activeTraits.some((t) => t.id === 'punto_debil');
  if (hasPuntoDebil && finalBarriers.length > 0) {
    finalBarriers[finalBarriers.length - 1] -= 3;
  }

  const hasFragilPrimera = activeTraits.some((t) => t.id === 'fragil_primera_barrera');
  if (hasFragilPrimera && finalBarriers.length > 0) {
    finalBarriers[0] = finalBarriers[0] - 2;
  }

  // Aptitude: Base + variant + threatDelta
  let aptitude = baseStats.aptitude + variantAptitudeModifier + threatDelta;
  const hasTorpe = activeTraits.some((t) => t.id === 'torpe');
  if (hasTorpe) {
    aptitude -= 2;
  }

  // Actions (Actuar)
  let actions = baseStats.actions;
  const hasAccionExtra = activeTraits.some((t) => t.id === 'accion_extra');
  if (hasAccionExtra) {
    actions += 1;
  }
  const hasLento = activeTraits.some((t) => t.id === 'lento');
  if (hasLento) {
    actions = Math.max(1, actions - 1);
  }

  // Custom trait numerical stat modifiers
  for (const t of activeTraits) {
    if (t.statModifier?.aptitude) {
      aptitude += t.statModifier.aptitude;
    }
    if (t.statModifier?.actions) {
      actions = Math.max(1, actions + t.statModifier.actions);
    }
    if (t.statModifier?.barriersNd) {
      finalBarriers = finalBarriers.map((b) => b + (t.statModifier?.barriersNd ?? 0));
    }
  }

  // NPC Magic (Dotado trait): spells quota = actions + 1 per day (plus 2 with Magia ampliada)
  const hasDotado = activeTraits.some((t) => t.id === 'dotado');
  const hasMagiaAmpliada = activeTraits.some((t) => t.id === 'magia_ampliada');
  const spellsQuota = hasDotado ? actions + 1 + (hasMagiaAmpliada ? 2 : 0) : undefined;

  return {
    targetNA: npc.targetNA,
    effectiveThreat,
    rankBaseThreat,
    threatDelta,
    isEffectiveThreatBelowBase,
    traitsCostSum,
    traitsValueSum,
    traitsDisadvantageSum,
    netTraitModifier,
    resultNA: npc.targetNA,
    baseBarriers: baseStats.barriers,
    finalBarriers,
    baseAptitude: baseStats.aptitude,
    finalAptitude: aptitude,
    baseActions: baseStats.actions,
    finalActions: actions,
    spellsQuota,
    warnings
  };
}

// Calculate recommended NA from encounter tables
export function getRecommendedNA(
  playerLevel: number,
  difficulty: EncounterDifficulty,
  isBoss: boolean,
  playerCount: number = 4
): { baseNA: number; adjustedNA: number; explanation: string } {
  const safeLevel = Math.max(1, Math.min(8, playerLevel));
  const row = THREAT_TABLE_4_PLAYERS[safeLevel] || THREAT_TABLE_4_PLAYERS[1];

  let baseNA = 0;
  if (isBoss) {
    if (difficulty === 'Fácil') baseNA = row.jefeFacil;
    else if (difficulty === 'Normal') baseNA = row.jefeNormal;
    else baseNA = row.jefeDificil;
  } else {
    if (difficulty === 'Fácil') baseNA = row.cuadrillaFacil;
    else if (difficulty === 'Normal') baseNA = row.cuadrillaNormal;
    else baseNA = row.cuadrillaDificil;
  }

  // Adjust for number of players (3 players = -1 NA, 2 players = -2 NA)
  let playerAdjustment = 0;
  if (playerCount === 3) playerAdjustment = -1;
  else if (playerCount === 2) playerAdjustment = -2;
  else if (playerCount > 4) playerAdjustment = Math.min(2, playerCount - 4); // optional slight bump for 5+

  const adjustedNA = Math.max(0, baseNA + playerAdjustment);

  let explanation = `Nivel PJ ${safeLevel}, ${isBoss ? 'Solo' : 'Cuadrilla'} ${difficulty}`;
  if (playerAdjustment !== 0) {
    explanation += ` (${playerCount} jugadores: ${playerAdjustment > 0 ? '+' : ''}${playerAdjustment} al NA)`;
  }

  return { baseNA, adjustedNA, explanation };
}

// Calculate total encounter stats
export function analyzeEncounter(encounter: EncounterConfig, npcsMap: Map<string, NpcData>) {
  let totalNpcs = 0;
  let totalActions = 0;
  let totalBarriers = 0;
  let hasBoss = false;
  const warnings: string[] = [];

  encounter.npcs.forEach((item) => {
    const npc = npcsMap.get(item.npcId);
    if (!npc) return;

    totalNpcs += item.count;
    const stats = calculateNpcStats(npc);
    totalActions += stats.finalActions * item.count;
    totalBarriers += stats.finalBarriers.length * item.count;
    if (npc.rank === 'Solo') hasBoss = true;
  });

  // Check section 7 rules:
  // "Cuadrilla es un conjunto de unos 5 NPC que suman unos 6 Actuar por turno"
  // "Cuadrillas pequeñas: las tablas están pensadas para unos 5 NPC (~6 Actuar). Si hay menos, subir el NA en 1 o 2."
  if (!hasBoss && totalNpcs > 0 && totalNpcs < 5 && totalActions < 6) {
    warnings.push(
      'Cuadrilla pequeña: Al tener menos de 5 NPCs (y menos de 6 Actuar), los PJs reciben menos ataques por turno. La regla recomienda subir el NA de los enemigos en +1 o +2 para compensar.'
    );
  }

  return {
    totalNpcs,
    totalActions,
    totalBarriers,
    hasBoss,
    warnings
  };
}

export interface ValidationCheck {
  id: string;
  title: string;
  passed: boolean;
  message: string;
  type: 'success' | 'warning' | 'info';
}

export interface CreatureValidationResult {
  isValid: boolean;
  score: number;
  summary: string;
  passedCount: number;
  totalCount: number;
  checks: ValidationCheck[];
}

/**
 * Validates a creature against the official Papa Tumbay Borrador v0.4 guidelines.
 * Returns what is compliant and what can be adjusted.
 */
export function validateNpcCreature(npc: NpcData, stats: CalculatedNpcStats): CreatureValidationResult {
  const checks: ValidationCheck[] = [];
  const baseStats = RANK_BASE_STATS[npc.rank] || RANK_BASE_STATS.Cuadrilla;

  // 1. Nombre
  const hasName = Boolean(npc.name && npc.name.trim().length > 0 && npc.name.trim() !== 'Nueva Criatura');
  checks.push({
    id: 'name',
    title: 'Nombre de Criatura',
    passed: hasName,
    message: hasName ? `Asignado correctamente: "${npc.name}"` : 'Nombre pendiente o genérico.',
    type: hasName ? 'success' : 'info'
  });

  // 2. Concepto Principal (3d6 a ataques)
  const hasMainConcept = Boolean(npc.mainConcept && npc.mainConcept.trim().length > 0);
  checks.push({
    id: 'main_concept',
    title: 'Concepto Principal (Tiradas 3d6)',
    passed: hasMainConcept,
    message: hasMainConcept
      ? `Definido: "${npc.mainConcept}". Le otorga 3d6 (conserva los 2 más altos) a sus ataques nucleares.`
      : 'Falta definir el Concepto Principal (imprescindible para sus ataques).',
    type: hasMainConcept ? 'success' : 'warning'
  });

  // 3. Conceptos Secundarios (según guía Borrador v0.4)
  const secCount = npc.secondaryConcepts?.length || 0;
  const isPandilla = npc.rank === 'Pandilla';
  const isSolo = npc.rank === 'Solo';
  const secOptimal = isPandilla
    ? secCount <= 1
    : isSolo
    ? secCount >= 1 && secCount <= 3
    : secCount >= 1 && secCount <= 2;

  checks.push({
    id: 'secondary_concepts',
    title: 'Conceptos Secundarios',
    passed: secCount > 0,
    message: secCount > 0
      ? `${secCount} Concepto(s) secundario(s): ${npc.secondaryConcepts.join(', ')} (${baseStats.recommendedSecondaryConcepts}).`
      : 'Sin conceptos secundarios (recomendado al menos 1 para rastreo, emboscadas o trepar).',
    type: secCount > 0 ? (secOptimal ? 'success' : 'info') : 'info'
  });

  // 4. Presupuesto de Rasgos según Rango (Borrador v0.4)
  const activeTraits = npc.selectedTraits || [];
  const majorTraits = activeTraits.filter((t) => t.category !== 'menor');
  const majorCount = majorTraits.length;
  const maxTraits = baseStats.maxRecommendedTraits;
  const traitsWithinBudget = majorCount <= maxTraits;

  checks.push({
    id: 'traits_budget',
    title: `Rasgos para Rango ${npc.rank}`,
    passed: traitsWithinBudget,
    message: traitsWithinBudget
      ? `${majorCount} de máx. ${maxTraits} rasgo(s) con costo: equilibrio perfecto según el Suplemento Borrador v0.4.`
      : `Tiene ${majorCount} rasgos con costo (la guía v0.4 recomienda máx. ${maxTraits} para ${npc.rank}).`,
    type: traitsWithinBudget ? 'success' : 'warning'
  });

  // 5. Amenaza Efectiva vs Amenaza Base del Rango y Límite Máximo 11 (Regla v0.4)
  const isThreatAboveMax = stats.effectiveThreat > 11;
  const threatValid = !stats.isEffectiveThreatBelowBase && !isThreatAboveMax;
  checks.push({
    id: 'threat_balance',
    title: 'Amenaza Efectiva (Base y Máx 11)',
    passed: threatValid,
    message: isThreatAboveMax
      ? `La Amenaza efectiva (${stats.effectiveThreat}) supera el nivel máximo de 11.`
      : threatValid
      ? `Amenaza efectiva: ${stats.effectiveThreat} (Base de ${npc.rank}: ${stats.rankBaseThreat}, Máx: 11, delta ${stats.threatDelta >= 0 ? `+${stats.threatDelta}` : stats.threatDelta}). Aptitud ${stats.finalAptitude}, Barreras: ND ${stats.finalBarriers.join('/')}.`
      : `La Amenaza efectiva (${stats.effectiveThreat}) es menor que la base del ${npc.rank} (${stats.rankBaseThreat}). El manual v0.4 indica que nunca debería bajar de la base del Rango ni de 0.`,
    type: threatValid ? 'success' : 'warning'
  });

  // 6. Rango y Cantidad Típica de Adversarios
  checks.push({
    id: 'rank_count',
    title: `Rango ${npc.rank} y Cantidad Típica`,
    passed: true,
    message: `Rango: ${npc.rank} (Cantidad típica calibrada en el manual: ${baseStats.typicalCount}, Amenaza base: ${baseStats.amenazaBase}).`,
    type: 'success'
  });

  // 7. Modo de Actuar
  const hasBehavior = Boolean(npc.behaviorDescription && npc.behaviorDescription.trim().length > 5);
  checks.push({
    id: 'behavior',
    title: 'Modo de Actuar (IA del Director)',
    passed: hasBehavior,
    message: hasBehavior
      ? `Arquetipo "${npc.behaviorType}": pautas claras para actuar ante la retirada o presión.`
      : 'Se recomienda describir brevemente cómo actúa ante la derrota o retirada.',
    type: hasBehavior ? 'success' : 'info'
  });

  // 8. Magia de NPC (si es Dotado)
  if (stats.spellsQuota !== undefined) {
    checks.push({
      id: 'dotado_magic',
      title: 'Magia de NPC (Rasgo Dotado)',
      passed: true,
      message: `Cupo de conjuros: ${stats.spellsQuota} por combate (Actuar + 1). Añadir Concepto mágico (Hechicero, Sacerdote, etc.).`,
      type: 'info'
    });
  }

  const passedCount = checks.filter((c) => c.passed && c.type !== 'warning').length;
  const totalCount = checks.length;
  const hasWarnings = checks.some((c) => c.type === 'warning');
  const isValid = !hasWarnings && hasMainConcept;
  const score = Math.round((passedCount / totalCount) * 100);

  let summary = 'Criatura 100% equilibrada y conforme al manual Borrador v0.4 ✓';
  if (hasWarnings) {
    summary = 'Criatura con observaciones de equilibrio v0.4 para revisar';
  } else if (!hasName || !hasBehavior) {
    summary = 'Criatura lista para jugar (puedes completar detalles opcionales)';
  }

  return {
    isValid,
    score,
    summary,
    passedCount,
    totalCount,
    checks
  };
}
