import React, { useState } from 'react';
import {
  NpcData,
  RollResult,
  EncounterDifficulty,
  EncounterStructure,
  EncounterNpcEntry
} from '../types/npc';
import { calculateNpcStats, getRecommendedNA } from '../utils/calculator';
import { THREAT_TABLE_4_PLAYERS } from '../data/rulesData';
import {
  Users,
  Shield,
  Zap,
  Dice5,
  AlertTriangle,
  Plus,
  Trash2,
  RotateCcw,
  Sparkles,
  Swords,
  CheckCircle,
  HelpCircle,
  Flame,
  Star,
  Award,
  Crown
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface EncounterBuilderProps {
  availableNpcs: NpcData[];
  onSelectNpcForView?: (npc: NpcData) => void;
}

export const EncounterBuilder: React.FC<EncounterBuilderProps> = ({
  availableNpcs,
  onSelectNpcForView
}) => {
  // Party configuration
  const [playerLevel, setPlayerLevel] = useState<number>(4);
  const [playerCount, setPlayerCount] = useState<number>(4);
  const [difficulty, setDifficulty] = useState<EncounterDifficulty>('Normal');
  const [structure, setStructure] = useState<EncounterStructure>('cuadrilla');

  // Player active barrier ND to compare attacks against
  const [targetPlayerNd, setTargetPlayerNd] = useState<number>(7);

  // Calculate recommended NA from rules
  const isBossStructure = structure === 'jefe';
  const recommendation = getRecommendedNA(playerLevel, difficulty, isBossStructure, playerCount);
  const naOffset = structure === 'jefe_sequito' ? -2 : 0;
  const targetNAforEncounter = Math.max(0, recommendation.adjustedNA + naOffset);

  // Helper to determine unit type
  const getUnitTypeForRank = (rank: string): 'cuadrilla' | 'solitario' => {
    return rank === 'Pandilla' || rank === 'Cuadrilla'
      ? 'cuadrilla'
      : 'solitario';
  };

  // Helper to calculate initial free ND bonus based on encounter threat vs creature NA
  const calculateDefaultFreeNd = (creatureNA: number): number => {
    return Math.max(0, targetNAforEncounter - creatureNA);
  };

  // Encounter roster
  const [roster, setRoster] = useState<EncounterNpcEntry[]>(() => {
    const bandit = availableNpcs.find((n) => n.id === 'bandido_veterano') || availableNpcs[0];
    const ogre = availableNpcs.find((n) => n.id === 'ogro_de_la_cienaga');

    const initial: EncounterNpcEntry[] = [];
    if (bandit) {
      const stats = calculateNpcStats(bandit);
      const freeNd = Math.max(0, 4 - bandit.targetNA); // Level 4 normal NA = 4
      initial.push({
        instanceId: `entry_${Date.now()}_cuadrilla`,
        npcId: bandit.id,
        customName: `Cuadrilla de ${bandit.name}s`,
        unitType: 'cuadrilla',
        squadMembersCount: 5,
        freeNdBonus: freeNd,
        brokenBarriers: new Array(stats.finalBarriers.length).fill(false)
      });
    }
    if (ogre) {
      const stats = calculateNpcStats(ogre);
      const freeNd = Math.max(0, 4 - ogre.targetNA);
      initial.push({
        instanceId: `entry_${Date.now()}_elite`,
        npcId: ogre.id,
        customName: `${ogre.name} (Líder)`,
        unitType: 'solitario',
        squadMembersCount: 1,
        freeNdBonus: freeNd,
        brokenBarriers: new Array(stats.finalBarriers.length).fill(false)
      });
    }
    return initial;
  });

  // Selected NPC to roll for in battle
  const [selectedActorId, setSelectedActorId] = useState<string>('');
  const [useConceptRoll, setUseConceptRoll] = useState<boolean>(true); // 3d6 pick 2
  const [rollHistory, setRollHistory] = useState<RollResult[]>([]);

  // Compute encounter totals
  let totalActions = 0;
  let totalBarriers = 0;
  let brokenBarriersCount = 0;
  let squadCount = 0;
  let soloCount = 0;

  roster.forEach((entry) => {
    const template = availableNpcs.find((n) => n.id === entry.npcId);
    if (template) {
      const stats = calculateNpcStats(template);
      // Cada miembro de la cuadrilla aporta sus acciones al bando (ej: 5 miembros con 1 Actuar = 5 Actuar)
      const members = entry.unitType === 'cuadrilla' ? (entry.squadMembersCount ?? 5) : 1;
      const actions = members * stats.finalActions;
      totalActions += actions;
      totalBarriers += stats.finalBarriers.length;
      brokenBarriersCount += entry.brokenBarriers.filter(Boolean).length;
      if (entry.unitType === 'cuadrilla') squadCount++;
      else soloCount++;
    }
  });

  // Section 7 check:
  // - Solo Cuadrilla: debe sumar al menos 5 Actuar (5 miembros x 1 actuar)
  // - Cuadrilla con élite: debe sumar al menos ~6 Actuar (4 esbirros + 1 élite de 2 actuar)
  const isSmallSquadron =
    structure === 'solo_cuadrilla'
      ? roster.length > 0 && totalActions < 5
      : structure === 'cuadrilla'
      ? roster.length > 0 && totalActions < 6
      : false;

  // Add an NPC to roster
  const handleAddNpcToRoster = (npcId: string) => {
    const template = availableNpcs.find((n) => n.id === npcId);
    if (!template) return;
    const stats = calculateNpcStats(template);
    const uType = getUnitTypeForRank(template.rank);
    const sameTypeCount = roster.filter((r) => r.npcId === npcId).length + 1;
    const initialFreeNd = calculateDefaultFreeNd(stats.resultNA);

    const displayName =
      uType === 'cuadrilla'
        ? `Cuadrilla de ${template.name}s #${sameTypeCount}`
        : `${template.name} (Solitario #${sameTypeCount})`;

    setRoster((prev) => [
      ...prev,
      {
        instanceId: `entry_${Date.now()}_${Math.random()}`,
        npcId: template.id,
        customName: displayName,
        unitType: uType,
        squadMembersCount: uType === 'cuadrilla' ? 5 : 1,
        freeNdBonus: initialFreeNd,
        brokenBarriers: new Array(stats.finalBarriers.length).fill(false)
      }
    ]);
  };

  // Remove from roster
  const handleRemoveFromRoster = (instanceId: string) => {
    setRoster((prev) => prev.filter((r) => r.instanceId !== instanceId));
    if (selectedActorId === instanceId) {
      setSelectedActorId('');
    }
  };

  // Adjust Free ND bonus manually
  const handleAdjustFreeNd = (instanceId: string, delta: number) => {
    setRoster((prev) =>
      prev.map((r) => {
        if (r.instanceId !== instanceId) return r;
        const nextBonus = Math.max(0, r.freeNdBonus + delta);
        return { ...r, freeNdBonus: nextBonus };
      })
    );
  };

  // Toggle barrier broken state
  const handleToggleBarrier = (instanceId: string, barrierIndex: number) => {
    setRoster((prev) =>
      prev.map((r) => {
        if (r.instanceId !== instanceId) return r;
        const newBarriers = [...r.brokenBarriers];
        newBarriers[barrierIndex] = !newBarriers[barrierIndex];
        return { ...r, brokenBarriers: newBarriers };
      })
    );
  };

  // Reset all barriers
  const handleResetCombat = () => {
    setRoster((prev) =>
      prev.map((r) => ({
        ...r,
        brokenBarriers: r.brokenBarriers.map(() => false)
      }))
    );
    setRollHistory([]);
  };

  // Quick preset encounter loader: Solo Cuadrilla
  const handleLoadSoloSquadPreset = () => {
    const minionOrSoldier =
      availableNpcs.find((n) => n.rank === 'Cuadrilla' || n.rank === 'Pandilla') || availableNpcs[0];
    if (!minionOrSoldier) return;

    const stats = calculateNpcStats(minionOrSoldier);
    setStructure('solo_cuadrilla');
    setRoster([
      {
        instanceId: `sq_${Date.now()}_solo_cuadrilla`,
        npcId: minionOrSoldier.id,
        customName: `Cuadrilla de ${minionOrSoldier.name}s`,
        unitType: 'cuadrilla',
        squadMembersCount: 5,
        freeNdBonus: calculateDefaultFreeNd(stats.resultNA),
        brokenBarriers: new Array(stats.finalBarriers.length).fill(false)
      }
    ]);
  };

  // Adjust squad members count (1 - 10)
  const handleAdjustSquadMembers = (instanceId: string, delta: number) => {
    setRoster((prev) =>
      prev.map((r) => {
        if (r.instanceId !== instanceId || r.unitType !== 'cuadrilla') return r;
        const currentCount = r.squadMembersCount ?? 5;
        const nextCount = Math.max(1, Math.min(12, currentCount + delta));
        return { ...r, squadMembersCount: nextCount };
      })
    );
  };

  // Quick preset encounter loader: Cuadrilla + Dúo Solitario
  const handleLoadSquadronPreset = () => {
    const soldier = availableNpcs.find((n) => n.rank === 'Cuadrilla' || n.rank === 'Pandilla') || availableNpcs[0];
    const elite = availableNpcs.find((n) => n.rank === 'Dúo' || n.rank === 'Trío') || availableNpcs[0];
    if (!soldier) return;

    const soldierStats = calculateNpcStats(soldier);
    const newRoster: EncounterNpcEntry[] = [
      {
        instanceId: `sq_${Date.now()}_cuadrilla`,
        npcId: soldier.id,
        customName: `Cuadrilla de ${soldier.name}s`,
        unitType: 'cuadrilla',
        squadMembersCount: 5,
        freeNdBonus: calculateDefaultFreeNd(soldierStats.resultNA),
        brokenBarriers: new Array(soldierStats.finalBarriers.length).fill(false)
      }
    ];

    if (elite) {
      const eliteStats = calculateNpcStats(elite);
      newRoster.push({
        instanceId: `sq_${Date.now()}_leader`,
        npcId: elite.id,
        customName: `${elite.name} (Líder Solitario)`,
        unitType: 'solitario',
        squadMembersCount: 1,
        freeNdBonus: calculateDefaultFreeNd(eliteStats.resultNA),
        brokenBarriers: new Array(eliteStats.finalBarriers.length).fill(false)
      });
    }

    setStructure('cuadrilla');
    setRoster(newRoster);
  };

  // Preset loader: Solo
  const handleLoadBossPreset = () => {
    const boss = availableNpcs.find((n) => n.rank === 'Solo') || availableNpcs[availableNpcs.length - 1];
    if (!boss) return;
    const bossStats = calculateNpcStats(boss);
    setStructure('jefe');
    setRoster([
      {
        instanceId: `boss_${Date.now()}`,
        npcId: boss.id,
        customName: `${boss.name} (Solo)`,
        unitType: 'solitario',
        squadMembersCount: 1,
        freeNdBonus: calculateDefaultFreeNd(bossStats.resultNA),
        brokenBarriers: new Array(bossStats.finalBarriers.length).fill(false)
      }
    ]);
  };

  // Roll dice for active NPC/Cuadrilla
  const handleRollAttack = (instanceId?: string) => {
    const targetEntry =
      roster.find((r) => r.instanceId === (instanceId || selectedActorId)) || roster[0];
    if (!targetEntry) return;

    const template = availableNpcs.find((n) => n.id === targetEntry.npcId);
    if (!template) return;

    const stats = calculateNpcStats(template);
    const baseAptitude = stats.finalAptitude;
    const freeNdBonus = targetEntry.freeNdBonus;
    const totalAptitude = baseAptitude + freeNdBonus;

    // Dice rolling: 3d6 pick 2 if concept is relevant, else 2d6
    const count = useConceptRoll ? 3 : 2;
    const rolls: number[] = [];
    for (let i = 0; i < count; i++) {
      rolls.push(Math.floor(Math.random() * 6) + 1);
    }

    let kept: number[] = [];
    if (count === 3) {
      const sorted = [...rolls].sort((a, b) => b - a);
      kept = [sorted[0], sorted[1]];
    } else {
      kept = [...rolls];
    }

    const isCrit = kept[0] === 6 && kept[1] === 6;
    const isBrotar = kept[0] === 1 && kept[1] === 1;
    const diceSum = kept[0] + kept[1];
    const total = diceSum + totalAptitude;
    const ndMargin = total - targetPlayerNd;

    let description = '';
    if (isCrit) {
      description = '¡CRÍTICO! (Doble 6) — El personaje defensor pierde una acción.';
      try {
        confetti({ particleCount: 35, spread: 65, origin: { y: 0.7 } });
      } catch {}
    } else if (isBrotar) {
      description = `¡BROTAR! (Doble 1) — ${
        targetEntry.unitType === 'cuadrilla' ? 'La cuadrilla' : 'El combatiente'
      } pierde su siguiente Actuar.`;
    } else if (ndMargin >= 0) {
      description = `¡IMPACTA Y ROMPE BARRERA! Supera el ND ${targetPlayerNd} del PJ con un excedente de +${ndMargin} de margen.`;
    } else {
      description = `Falla contra la Barrera del PJ (Total ${total} vs ND ${targetPlayerNd}). No rompe la Barrera.`;
    }

    const actionTitle =
      targetEntry.unitType === 'cuadrilla'
        ? `Ataque de Cuadrilla${useConceptRoll ? ` (${template.mainConcept})` : ''}`
        : `Ataque Solitario${useConceptRoll ? ` (${template.mainConcept})` : ''}`;

    const newResult: RollResult = {
      id: `roll_${Date.now()}`,
      timestamp: new Date(),
      npcName: targetEntry.customName,
      unitType: targetEntry.unitType,
      actionName: actionTitle,
      diceCount: count as 2 | 3,
      rolledDice: rolls,
      keptDice: kept,
      baseAptitude,
      freeNdBonus,
      aptitudeBonus: totalAptitude,
      targetNd: targetPlayerNd,
      ndMargin,
      total,
      isCrit,
      isBrotar,
      description
    };

    setRollHistory((prev) => [newResult, ...prev.slice(0, 19)]);
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-[#FAF6EE] rounded-2xl p-5 border-2 border-[#D9C8A8] shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#7C5A37]">
              <Swords className="w-4 h-4 text-[#8C6D44]" />
              Constructor de Combates — Sistema Papa Tumbay
            </div>
            <h1 className="font-heading text-2xl font-black text-[#261E16] mt-0.5">
              Gestor de Cuadrillas, Solitarios & Bonos de ND Libre
            </h1>
            <p className="text-xs text-[#635340] font-serif mt-1">
              <strong>Regla fundamental:</strong> Cada criatura de rango Pandilla o Cuadrilla combate como grupo/cuadrilla. Los rangos <strong>Dúo y Solo</strong> combaten en solitario. Todo ND libre sobre la criatura le otorga un bono automático.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleLoadSoloSquadPreset}
              className="px-3 py-1.5 bg-[#EFE6D2] hover:bg-[#E2D6BC] text-[#423321] text-xs font-bold rounded-lg border border-[#C5B18E] transition-all flex items-center gap-1.5 shadow-2xs"
            >
              <Shield className="w-3.5 h-3.5 text-[#7A5B36]" />
              Solo Cuadrilla
            </button>
            <button
              onClick={handleLoadSquadronPreset}
              className="px-3 py-1.5 bg-[#EFE6D2] hover:bg-[#E2D6BC] text-[#423321] text-xs font-bold rounded-lg border border-[#C5B18E] transition-all flex items-center gap-1.5 shadow-2xs"
            >
              <Users className="w-3.5 h-3.5 text-[#7A5B36]" />
              Cuadrilla + Dúo Solitario
            </button>
            <button
              onClick={handleLoadBossPreset}
              className="px-3 py-1.5 bg-[#EFE6D2] hover:bg-[#E2D6BC] text-[#423321] text-xs font-bold rounded-lg border border-[#C5B18E] transition-all flex items-center gap-1.5 shadow-2xs"
            >
              <Crown className="w-3.5 h-3.5 text-[#9E3626]" />
              Enemigo Solo
            </button>
          </div>
        </div>
      </div>

      {/* Grid: Left Column (Party config & table) - Right Column (Combat roster & dice) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Parameters & Threat Table (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Party Configuration Panel */}
          <div className="bg-[#FAF7F0] rounded-xl p-4 border border-[#DACBB0] shadow-xs space-y-3">
            <h3 className="font-heading text-sm font-bold text-[#32271C] flex items-center gap-1.5">
              <Users className="w-4 h-4 text-[#7C5A37]" />
              1. Configuración del Grupo de PJs
            </h3>

            {/* Level & Player count */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-[#6B5742] uppercase block mb-1">
                  Nivel de los PJ (1 - 8)
                </label>
                <select
                  value={playerLevel}
                  onChange={(e) => setPlayerLevel(Number(e.target.value))}
                  className="w-full bg-[#FAF6EE] border border-[#CBB895] rounded-lg px-2.5 py-1.5 text-xs font-bold text-[#2A2117] focus:ring-1 focus:ring-[#8C6D44]"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((lvl) => (
                    <option key={lvl} value={lvl}>
                      Nivel {lvl}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#6B5742] uppercase block mb-1">
                  Jugadores en Mesa
                </label>
                <select
                  value={playerCount}
                  onChange={(e) => setPlayerCount(Number(e.target.value))}
                  className="w-full bg-[#FAF6EE] border border-[#CBB895] rounded-lg px-2.5 py-1.5 text-xs font-bold text-[#2A2117] focus:ring-1 focus:ring-[#8C6D44]"
                >
                  <option value={2}>2 Jugadores (-2 al NA)</option>
                  <option value={3}>3 Jugadores (-1 al NA)</option>
                  <option value={4}>4 Jugadores (Estándar)</option>
                  <option value={5}>5 Jugadores</option>
                  <option value={6}>6 Jugadores</option>
                </select>
              </div>
            </div>

            {/* Structure & Difficulty */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="text-[11px] font-bold text-[#6B5742] uppercase block mb-1">
                  Tipo de Encuentro
                </label>
                <select
                  value={structure}
                  onChange={(e) => setStructure(e.target.value as EncounterStructure)}
                  className="w-full bg-[#FAF6EE] border border-[#CBB895] rounded-lg px-2.5 py-1.5 text-xs font-semibold text-[#2A2117] focus:ring-1 focus:ring-[#8C6D44]"
                >
                  <option value="solo_cuadrilla">Solo Cuadrilla (5 Actuar)</option>
                  <option value="cuadrilla">Cuadrilla con Dúo (~6 Actuar)</option>
                  <option value="jefe">Enemigo Solo (3 Actuar)</option>
                  <option value="jefe_sequito">Enemigo Solo con séquito (-2 NA)</option>
                  <option value="personalizado">Encuentro Libre</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#6B5742] uppercase block mb-1">
                  Dificultad
                </label>
                <div className="grid grid-cols-3 gap-1">
                  {(['Fácil', 'Normal', 'Difícil'] as EncounterDifficulty[]).map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDifficulty(d)}
                      className={`py-1.5 text-[11px] font-bold rounded-lg transition-all ${
                        difficulty === d
                          ? 'bg-[#7C5A37] text-[#FAF6EE] shadow-xs'
                          : 'bg-[#EFE6D2] text-[#554330] hover:bg-[#E5DABF]'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Recommended NA result banner */}
            <div className="bg-[#EFE6D2] border border-[#CEBD9A] rounded-xl p-3 mt-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#69523A] block">
                    NA Recomendado del Encuentro
                  </span>
                  <span className="text-xs text-[#483726] font-medium">
                    {recommendation.explanation}
                    {structure === 'solo_cuadrilla' && ' • Solo Cuadrilla (5 miembros, 5 Actuar)'}
                    {structure === 'jefe_sequito' && ' • Séquito: -2 NA'}
                  </span>
                </div>
                <div className="flex items-center justify-center bg-[#FAF6EE] border border-[#BAA582] rounded-xl px-3 py-1">
                  <span className="text-xs font-bold text-[#7A6044] mr-1">NA</span>
                  <span className="font-heading text-xl font-black text-[#261E16]">
                    {targetNAforEncounter}
                  </span>
                </div>
              </div>
            </div>

            {/* Explanation box on Free ND bonus rule and Squad actions */}
            <div className="p-3 bg-[#FAF3E2] border border-[#DFCEAF] rounded-xl text-[11px] text-[#5C4835] space-y-1.5">
              <div className="flex items-center gap-1 font-bold text-[#3B2C1E]">
                <Star className="w-3.5 h-3.5 text-[#B87D28]" />
                Reglas de Cuadrilla & ND Libre:
              </div>
              <p>
                <strong>Cuadrilla (5 miembros):</strong> Cada miembro con 1 Actuar suma <strong>5 Actuar en total</strong> a su bando por turno.
              </p>
              <p>
                <strong>Bono de ND Libre:</strong> Todo punto de ND libre por encima del ND base de la criatura se transforma en un <strong>bono directo</strong> (+1 a Aptitud para todas sus tiradas y +1 a la dificultad de sus Barreras).
              </p>
            </div>
          </div>

          {/* Add Units to Roster */}
          <div className="bg-[#FAF7F0] rounded-xl p-4 border border-[#DACBB0] shadow-xs space-y-2.5">
            <h3 className="font-heading text-sm font-bold text-[#32271C] flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-[#7C5A37]" />
                2. Añadir Criaturas / Cuadrillas
              </span>
              <span className="text-[10px] text-[#7A644E] font-normal">
                ({availableNpcs.length} disponibles)
              </span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
              {availableNpcs.map((npc) => {
                const stats = calculateNpcStats(npc);
                const isSquad = getUnitTypeForRank(npc.rank) === 'cuadrilla';
                return (
                  <button
                    key={npc.id}
                    type="button"
                    onClick={() => handleAddNpcToRoster(npc.id)}
                    className="flex items-center justify-between p-2 bg-[#FAF6EE] hover:bg-[#EFE6D2] border border-[#CFBDA0] rounded-lg text-left transition-all group"
                  >
                    <div className="truncate pr-1">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-[9px] font-black uppercase px-1 rounded ${
                            isSquad
                              ? 'bg-[#E2D4BC] text-[#543E26]'
                              : 'bg-[#DAC5B8] text-[#5A2C21]'
                          }`}
                        >
                          {isSquad ? 'Cuadrilla' : 'Solitario'}
                        </span>
                        <span className="text-xs font-bold text-[#2A2016] group-hover:text-[#6E4E2C] truncate">
                          {npc.name}
                        </span>
                      </div>
                      <div className="text-[10px] text-[#705C46] mt-0.5">
                        {npc.rank} • ND {stats.finalBarriers.join('/')} • Aptitud {stats.finalAptitude}
                      </div>
                    </div>
                    <span className="shrink-0 p-1 bg-[#EBE0C9] group-hover:bg-[#7C5A37] group-hover:text-white rounded-md text-[#5E4832] transition-colors">
                      <Plus className="w-3 h-3" />
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Side: Active Combat Roster & Live Dice Roller (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Encounter Status & Rules Check Banner */}
          <div className="bg-[#FAF7F0] rounded-xl p-4 border border-[#DACBB0] shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#D8C7A5] pb-2.5 mb-2.5">
              <div className="flex items-center gap-3">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#7A644D] block">
                    Bando de Adversarios Activo
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-heading text-lg font-black text-[#261E16]">
                      {roster.length} Unidades
                    </span>
                    <span className="text-[11px] font-semibold px-2 py-0.5 bg-[#EBE0C9] text-[#473624] rounded-full">
                      {squadCount} Cuadrilla(s) • {soloCount} Solitario(s)
                    </span>
                    <span className="text-xs font-bold text-[#7A6044]">
                      Total {totalActions} Actuar
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleResetCombat}
                  className="px-2.5 py-1 text-xs text-[#5C4835] hover:text-[#291F14] bg-[#EBE0C9] hover:bg-[#E0D2B6] rounded-md font-medium flex items-center gap-1 transition-all"
                  title="Restaurar todas las barreras del combate"
                >
                  <RotateCcw className="w-3 h-3" />
                  Reiniciar Barreras
                </button>
              </div>
            </div>

            {/* Warning if Cuadrilla doesn't reach minimum actions */}
            {isSmallSquadron && (
              <div className="flex items-start gap-2 p-2.5 bg-[#FFF8EB] border border-[#E8CBA3] rounded-lg text-xs text-[#7A4B1A] mb-3">
                <AlertTriangle className="w-4 h-4 text-[#A86420] shrink-0 mt-0.5" />
                <div>
                  <strong>
                    {structure === 'solo_cuadrilla'
                      ? 'Aviso de Cuadrilla reducida:'
                      : 'Aviso de Cuadrilla con Dúo:'}
                  </strong>{' '}
                  {structure === 'solo_cuadrilla'
                    ? `Una cuadrilla completa de 5 miembros aporta 5 Actuar al bando. Actualmente suman ${totalActions} Actuar.`
                    : `Las cuadrillas con líder de rango Dúo suman ~6 Actuar por turno. Actualmente suman ${totalActions} Actuar.`}
                  <span className="block mt-0.5 font-semibold text-[#8C4F12]">
                    Puedes aumentar los miembros de la cuadrilla, añadir más criaturas o subir el ND Libre en +1 o +2 para compensar la dificultad.
                  </span>
                </div>
              </div>
            )}

            {/* Roster list */}
            {roster.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#7D6B57] bg-[#FAF6EE] rounded-xl border border-dashed border-[#D2BF9E]">
                El encuentro está vacío. Añade una Cuadrilla o un Solitario desde el panel izquierdo.
              </div>
            ) : (
              <div className="space-y-3">
                {roster.map((entry) => {
                  const template = availableNpcs.find((n) => n.id === entry.npcId);
                  if (!template) return null;
                  const stats = calculateNpcStats(template);
                  const isAllBroken = entry.brokenBarriers.every(Boolean);

                  // Calculate final values with Free ND bonus
                  const effectiveAptitude = stats.finalAptitude + entry.freeNdBonus;
                  const effectiveBarriers = stats.finalBarriers.map(
                    (b) => b + entry.freeNdBonus
                  );

                  return (
                    <div
                      key={entry.instanceId}
                      className={`p-3 rounded-xl border transition-all ${
                        isAllBroken
                          ? 'bg-[#EFE8DF] border-[#D1BFAF] opacity-60'
                          : 'bg-[#FAF6EE] border-[#CDB996] shadow-xs'
                      }`}
                    >
                      {/* Top Header of Unit */}
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          {entry.unitType === 'cuadrilla' ? (
                            <div className="flex items-center gap-1.5 bg-[#7C5A37] text-white px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider">
                              <span>🛡️ Cuadrilla</span>
                              <span className="text-[#E0CFBD]">•</span>
                              <div className="flex items-center gap-1 bg-[#654829] px-1 py-0.2 rounded">
                                <button
                                  type="button"
                                  onClick={() => handleAdjustSquadMembers(entry.instanceId, -1)}
                                  disabled={(entry.squadMembersCount ?? 5) <= 1}
                                  className="w-3.5 h-3.5 flex items-center justify-center bg-[#4E371E] hover:bg-[#3D2B16] rounded font-bold disabled:opacity-30 leading-none cursor-pointer"
                                  title="Quitar un miembro de la cuadrilla"
                                >
                                  -
                                </button>
                                <span className="font-bold min-w-[50px] text-center">
                                  {entry.squadMembersCount ?? 5} miembros
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleAdjustSquadMembers(entry.instanceId, 1)}
                                  disabled={(entry.squadMembersCount ?? 5) >= 12}
                                  className="w-3.5 h-3.5 flex items-center justify-center bg-[#4E371E] hover:bg-[#3D2B16] rounded font-bold disabled:opacity-30 leading-none cursor-pointer"
                                  title="Añadir un miembro a la cuadrilla"
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          ) : (
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                                template.rank === 'Solo'
                                  ? 'bg-[#8A2B1D] text-white'
                                  : 'bg-[#4A5D3E] text-white'
                              }`}
                            >
                              ⚔️ Solitario ({template.rank})
                            </span>
                          )}

                          <span className="font-heading text-sm font-bold text-[#2A2016]">
                            {entry.customName}
                          </span>

                          {isAllBroken && (
                            <span className="text-[10px] font-bold text-[#8A2B1D] uppercase px-1.5 py-0.5 bg-[#F8DDD7] rounded">
                              ¡DERROTADO!
                            </span>
                          )}
                        </div>

                        {/* Actions buttons */}
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleRollAttack(entry.instanceId)}
                            className="px-2.5 py-1 bg-[#EBE0C9] hover:bg-[#DFCFAe] text-[#42311E] text-xs font-bold rounded-md flex items-center gap-1 transition-all"
                            title="Tirar ataque con esta unidad"
                          >
                            <Dice5 className="w-3.5 h-3.5 text-[#825F37]" />
                            Tirar Ataque
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveFromRoster(entry.instanceId)}
                            className="p-1 text-[#8C7A65] hover:text-[#992E20] hover:bg-[#F2DFDC] rounded-md transition-colors"
                            title="Eliminar del encuentro"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* ND Libre Bonus Widget */}
                      <div className="flex flex-wrap items-center justify-between gap-2 py-1.5 px-2 bg-[#F3ECDE] rounded-lg border border-[#DACBB0] mb-2 text-xs">
                        <div className="flex items-center gap-2">
                          <Star className="w-3.5 h-3.5 text-[#B87D28]" />
                          <span className="font-bold text-[#473623]">
                            Bono por ND Libre sobre la criatura:
                          </span>
                          <span
                            className={`font-black px-1.5 py-0.2 rounded text-[11px] ${
                              entry.freeNdBonus > 0
                                ? 'bg-[#EBD69B] text-[#543D0C] border border-[#CCA547]'
                                : 'bg-[#EAE0CD] text-[#695642]'
                            }`}
                          >
                            +{entry.freeNdBonus}
                          </span>
                          <span className="text-[10px] text-[#705F4B]">
                            (+{entry.freeNdBonus} a Aptitud y a cada Barrera)
                          </span>
                        </div>

                        {/* Adjust Free ND buttons */}
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-[#78654E] font-medium mr-1">
                            Ajustar:
                          </span>
                          <button
                            type="button"
                            onClick={() => handleAdjustFreeNd(entry.instanceId, -1)}
                            disabled={entry.freeNdBonus <= 0}
                            className="w-5 h-5 flex items-center justify-center bg-[#E5DAC4] hover:bg-[#D8CBB2] text-[#423221] rounded font-bold disabled:opacity-40"
                            title="Restar 1 punto de ND libre"
                          >
                            -
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAdjustFreeNd(entry.instanceId, 1)}
                            className="w-5 h-5 flex items-center justify-center bg-[#E5DAC4] hover:bg-[#D8CBB2] text-[#423221] rounded font-bold"
                            title="Sumar 1 punto de ND libre"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Stats and Barrier clickers */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[#E5D7BF]">
                        <div className="flex items-center gap-3 text-xs text-[#524131]">
                          <span>
                            <strong>Aptitud Efectiva:</strong>{' '}
                            <span className="font-bold text-[#2A2016]">
                              {effectiveAptitude}
                            </span>
                            {entry.freeNdBonus > 0 && (
                               <span className="text-[10px] text-[#7A6145] ml-1">
                                 ({stats.finalAptitude} base +{entry.freeNdBonus} ND libre)
                               </span>
                            )}
                          </span>
                          {entry.unitType === 'cuadrilla' ? (
                            <span className="flex items-center gap-1">
                              <strong>Actuar:</strong>{' '}
                              <span>{stats.finalActions} c/u</span>
                              <span className="text-[11px] font-bold text-[#7A4B1A] bg-[#EFE0C7] px-1.5 py-0.2 rounded border border-[#DFCEAF]">
                                = {(entry.squadMembersCount ?? 5) * stats.finalActions} Actuar al bando
                              </span>
                            </span>
                          ) : (
                            <span>
                              <strong>Actuar:</strong>{' '}
                              <span className="font-bold text-[#2A2016]">{stats.finalActions}</span>{' '}
                              <span className="text-[10px] text-[#705F4B]">(Solitario)</span>
                            </span>
                          )}
                        </div>

                        {/* Interactive Barrier Boxes */}
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold text-[#735F48] uppercase">
                            Barreras:
                          </span>
                          {effectiveBarriers.map((nd, idx) => {
                            const isBroken = entry.brokenBarriers[idx];
                            return (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => handleToggleBarrier(entry.instanceId, idx)}
                                className={`px-2 py-0.5 rounded text-xs font-black border transition-all cursor-pointer ${
                                  isBroken
                                    ? 'bg-[#D9C6BB] text-[#7A5B4C] border-[#B59684] line-through'
                                    : 'bg-[#FFFDF7] text-[#292017] border-[#C2AD88] hover:border-[#8E6E45] shadow-xs'
                                }`}
                                title={
                                  isBroken
                                    ? 'Barrera rota (clic para restaurar)'
                                    : `Barrera ${idx + 1}: ND ${nd} (clic para romper)`
                                }
                              >
                                ND {nd}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Integrated Dice Roller for the Game Master */}
          <div className="bg-[#FAF7F0] rounded-xl p-4 border border-[#DACBB0] shadow-xs space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-heading text-sm font-bold text-[#32271C] flex items-center gap-1.5">
                <Dice5 className="w-4 h-4 text-[#7C5A37]" />
                3. Tirador Oficial de Combate (Director de Juego)
              </h3>
              <label className="flex items-center gap-1.5 text-xs text-[#5E4B37] font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={useConceptRoll}
                  onChange={(e) => setUseConceptRoll(e.target.checked)}
                  className="rounded border-[#C2B299] text-[#7C5A37] focus:ring-0"
                />
                Concepto Relevante (3d6, conserva los 2 más altos)
              </label>
            </div>

            {/* Target Player ND control */}
            <div className="flex flex-wrap items-center gap-3 p-2 bg-[#F3ECDE] rounded-lg border border-[#DACBB0] text-xs">
              <span className="font-bold text-[#4A3928]">
                ND de la Barrera activa del PJ objetivo:
              </span>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min="4"
                  max="20"
                  value={targetPlayerNd}
                  onChange={(e) => setTargetPlayerNd(Number(e.target.value))}
                  className="w-16 bg-[#FAF6EE] border border-[#C5B391] rounded px-2 py-0.5 text-xs font-bold text-center text-[#2A2016]"
                />
                <span className="text-[10px] text-[#7A644D]">
                  (Ej: 7 para PJ común, 9 para veterano)
                </span>
              </div>
            </div>

            {/* Quick Roll Action Bar */}
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={selectedActorId}
                onChange={(e) => setSelectedActorId(e.target.value)}
                className="flex-1 min-w-[200px] bg-[#FAF6EE] border border-[#CBB895] rounded-lg px-2.5 py-2 text-xs font-bold text-[#2A2117]"
              >
                <option value="">Seleccionar Unidad para Tirar...</option>
                {roster.map((r) => {
                  const unitApt = availableNpcs.find((n) => n.id === r.npcId)
                    ? calculateNpcStats(availableNpcs.find((n) => n.id === r.npcId)!)
                        .finalAptitude + r.freeNdBonus
                    : 0;
                  return (
                    <option key={r.instanceId} value={r.instanceId}>
                      {r.customName} (Aptitud {unitApt})
                    </option>
                  );
                })}
              </select>

              <button
                type="button"
                onClick={() => handleRollAttack()}
                disabled={roster.length === 0}
                className="px-4 py-2 bg-[#7C5A37] hover:bg-[#68492A] text-[#FAF6ED] text-xs font-bold rounded-lg shadow-xs flex items-center gap-2 disabled:opacity-50 transition-all cursor-pointer"
              >
                <Dice5 className="w-4 h-4" />
                Lanzar Tirada de Ataque
              </button>
            </div>

            {/* Latest Roll Banner */}
            {rollHistory.length > 0 && (
              <div
                className={`p-3.5 rounded-xl border transition-all ${
                  rollHistory[0].isCrit
                    ? 'bg-[#FDF3D8] border-[#E2B755]'
                    : rollHistory[0].isBrotar
                    ? 'bg-[#FBE8E5] border-[#E29285]'
                    : rollHistory[0].ndMargin !== undefined && rollHistory[0].ndMargin >= 0
                    ? 'bg-[#F4F7EE] border-[#BCD4A5]'
                    : 'bg-[#FAF6EE] border-[#CEBD9C]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-heading text-sm font-bold text-[#292016]">
                      {rollHistory[0].npcName}
                    </span>
                    <span className="text-[10px] text-[#705F4A] px-2 py-0.5 bg-[#EFE6D2] rounded">
                      {rollHistory[0].actionName}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-[#7A644D] uppercase font-bold block">
                      Resultado Total
                    </span>
                    <span className="font-heading text-2xl font-black text-[#261E16] leading-none">
                      {rollHistory[0].total}
                    </span>
                  </div>
                </div>

                {/* Dice Breakdown with Free ND calculation */}
                <div className="flex flex-wrap items-center gap-2 mt-2 pt-2 border-t border-[#DFD1B7] text-xs">
                  <span className="text-[#6E5B47]">
                    Dados ({rollHistory[0].diceCount}d6):
                  </span>
                  <div className="flex gap-1.5">
                    {rollHistory[0].rolledDice.map((d, i) => (
                      <span
                        key={i}
                        className={`w-6 h-6 flex items-center justify-center rounded font-black text-xs border ${
                          d === 6
                            ? 'bg-[#EBD59B] text-[#593F0C] border-[#CCA74D]'
                            : d === 1
                            ? 'bg-[#EFCAC4] text-[#691C12] border-[#C97B70]'
                            : 'bg-[#FFFDF7] text-[#292017] border-[#CEBD9C]'
                        }`}
                      >
                        {d}
                      </span>
                    ))}
                  </div>

                  {rollHistory[0].diceCount === 3 && (
                    <span className="text-[#7A644D] text-[11px]">
                      (Conservados: [{rollHistory[0].keptDice.join(', ')}])
                    </span>
                  )}

                  <span className="text-[#6E5B47]">
                    + Aptitud base ({rollHistory[0].baseAptitude})
                  </span>

                  {rollHistory[0].freeNdBonus > 0 && (
                    <span className="text-[#875F25] font-bold">
                      + Bono ND Libre (+{rollHistory[0].freeNdBonus})
                    </span>
                  )}

                  <span className="text-[#2A2016] font-black">
                    = {rollHistory[0].total}
                  </span>
                </div>

                {/* Status rule notice & Margin over ND */}
                <div
                  className={`mt-2 text-xs font-semibold ${
                    rollHistory[0].isCrit
                      ? 'text-[#8A5A12]'
                      : rollHistory[0].isBrotar
                      ? 'text-[#9C2B1D]'
                      : rollHistory[0].ndMargin !== undefined && rollHistory[0].ndMargin >= 0
                      ? 'text-[#3E6627]'
                      : 'text-[#694235]'
                  }`}
                >
                  {rollHistory[0].description}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
