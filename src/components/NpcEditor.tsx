import React, { useState, useRef, useEffect } from 'react';
import { NpcData, NpcRank, Trait, BehaviorType } from '../types/npc';
import { RANK_BASE_STATS, OFFICIAL_TRAITS, BEHAVIORS_PRESETS, PREBUILT_NPCS } from '../data/rulesData';
import { AVATAR_PRESETS } from '../data/avatars';
import { calculateNpcStats, isAutomaticStatTrait, validateNpcCreature } from '../utils/calculator';
import {
  Sparkles,
  HelpCircle,
  Plus,
  X,
  Shuffle,
  Shield,
  Zap,
  BookOpen,
  Info,
  Check,
  CheckCircle2,
  Upload,
  AlertCircle,
  FileJson,
  Edit3,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Undo2,
  Redo2,
  Copy,
  Palette
} from 'lucide-react';

interface NpcEditorProps {
  npc: NpcData;
  onChange: (updated: NpcData) => void;
  onLoadPrebuilt: (preset: NpcData) => void;
  onOpenBackupModal?: () => void;
  onDuplicateNpc?: () => void;
}

export const NpcEditor: React.FC<NpcEditorProps> = ({
  npc,
  onChange,
  onLoadPrebuilt,
  onOpenBackupModal,
  onDuplicateNpc
}) => {
  const [newSecondaryConcept, setNewSecondaryConcept] = useState('');
  const [showCustomTraitModal, setShowCustomTraitModal] = useState(false);
  const [customTraitName, setCustomTraitName] = useState('');
  const [customTraitEffect, setCustomTraitEffect] = useState('');
  const [customTraitCost, setCustomTraitCost] = useState<number>(1);
  const [customTraitCategory, setCustomTraitCategory] = useState<'menor' | 'ventaja' | 'desventaja' | 'provisional'>('ventaja');
  const [isCustomStatMod, setIsCustomStatMod] = useState<boolean>(false);
  const [customStatType, setCustomStatType] = useState<'aptitude' | 'barriersNd' | 'actions'>('aptitude');
  const [customStatValue, setCustomStatValue] = useState<number>(-2);

  // Validation details accordion state
  const [showValidationDetails, setShowValidationDetails] = useState<boolean>(true);

  // Trait inline text customization state
  const [editingTraitId, setEditingTraitId] = useState<string | null>(null);
  const [editTraitName, setEditTraitName] = useState<string>('');
  const [editTraitEffect, setEditTraitEffect] = useState<string>('');

  // Undo / Redo History State (keyed by NPC ID to preserve history per creature)
  const [undoCount, setUndoCount] = useState<number>(0);
  const [redoCount, setRedoCount] = useState<number>(0);
  const historyMapRef = useRef<Map<string, { undo: NpcData[]; redo: NpcData[] }>>(new Map());
  const pendingUndoRef = useRef<NpcData | null>(null);
  const textTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const getHistory = (id: string) => {
    let h = historyMapRef.current.get(id);
    if (!h) {
      h = { undo: [], redo: [] };
      historyMapRef.current.set(id, h);
    }
    return h;
  };

  // Sync stack counts whenever the active creature changes
  useEffect(() => {
    if (textTimeoutRef.current) {
      clearTimeout(textTimeoutRef.current);
      textTimeoutRef.current = null;
    }
    pendingUndoRef.current = null;
    const h = getHistory(npc.id);
    setUndoCount(h.undo.length);
    setRedoCount(h.redo.length);
  }, [npc.id]);

  const flushPendingUndo = () => {
    if (textTimeoutRef.current) {
      clearTimeout(textTimeoutRef.current);
      textTimeoutRef.current = null;
    }
    if (pendingUndoRef.current) {
      if (JSON.stringify(pendingUndoRef.current) !== JSON.stringify(npc)) {
        const h = getHistory(npc.id);
        h.undo.push(pendingUndoRef.current);
        if (h.undo.length > 50) h.undo.shift();
        h.redo = [];
        setUndoCount(h.undo.length);
        setRedoCount(0);
      }
      pendingUndoRef.current = null;
    }
  };

  /**
   * Main updater that pushes snapshots to the undo stack.
   * isContinuousText indicates text field input (e.g., name, concept, quote, description)
   * so rapid keystrokes are grouped into a single undo step.
   */
  const updateNpc = (updated: NpcData, isContinuousText: boolean = false) => {
    if (JSON.stringify(npc) === JSON.stringify(updated)) return;

    const h = getHistory(npc.id);

    if (isContinuousText) {
      if (!pendingUndoRef.current) {
        pendingUndoRef.current = npc;
      }
      if (textTimeoutRef.current) {
        clearTimeout(textTimeoutRef.current);
      }
      textTimeoutRef.current = setTimeout(() => {
        if (pendingUndoRef.current && JSON.stringify(pendingUndoRef.current) !== JSON.stringify(updated)) {
          h.undo.push(pendingUndoRef.current);
          if (h.undo.length > 50) h.undo.shift();
          h.redo = [];
          pendingUndoRef.current = null;
          setUndoCount(h.undo.length);
          setRedoCount(0);
        }
      }, 700);
    } else {
      if (textTimeoutRef.current) {
        clearTimeout(textTimeoutRef.current);
        textTimeoutRef.current = null;
      }
      if (pendingUndoRef.current && JSON.stringify(pendingUndoRef.current) !== JSON.stringify(npc)) {
        h.undo.push(pendingUndoRef.current);
        if (h.undo.length > 50) h.undo.shift();
      }
      pendingUndoRef.current = null;

      h.undo.push(npc);
      if (h.undo.length > 50) h.undo.shift();
      h.redo = [];
      setUndoCount(h.undo.length);
      setRedoCount(0);
    }

    onChange(updated);
  };

  const handleUndo = () => {
    flushPendingUndo();
    const h = getHistory(npc.id);
    if (h.undo.length === 0) return;

    const previousState = h.undo.pop()!;
    h.redo.push(npc);
    if (h.redo.length > 50) h.redo.shift();

    setUndoCount(h.undo.length);
    setRedoCount(h.redo.length);
    onChange(previousState);
  };

  const handleRedo = () => {
    flushPendingUndo();
    const h = getHistory(npc.id);
    if (h.redo.length === 0) return;

    const nextState = h.redo.pop()!;
    h.undo.push(npc);
    if (h.undo.length > 50) h.undo.shift();

    setUndoCount(h.undo.length);
    setRedoCount(h.redo.length);
    onChange(nextState);
  };

  // Keyboard shortcuts: Ctrl+Z / Cmd+Z to Undo, Ctrl+Y / Cmd+Y or Ctrl+Shift+Z to Redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && !e.altKey) {
        const target = e.target as HTMLElement | null;
        const isEditingField = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA');

        if (e.key === 'z' || e.key === 'Z') {
          if (e.shiftKey) {
            e.preventDefault();
            handleRedo();
          } else {
            if (!isEditingField) {
              e.preventDefault();
              handleUndo();
            }
          }
        } else if (e.key === 'y' || e.key === 'Y') {
          if (!isEditingField) {
            e.preventDefault();
            handleRedo();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [npc]);

  const stats = calculateNpcStats(npc);
  const validation = validateNpcCreature(npc, stats);

  const handleRankChange = (newRank: NpcRank) => {
    const autoFormation = newRank === 'Pandilla' || newRank === 'Cuadrilla' ? 'Cuadrilla' : 'Solitario';
    const baseAmenaza = RANK_BASE_STATS[newRank]?.amenazaBase ?? 0;
    // La amenaza del NPC se ajusta sola según la base mínima de la criatura:
    // Al elegir Solo sube a 7 y no puede bajar de ahí; Dúo a 5; Trío a 3; Cuadrilla a 2; Pandilla a 0.
    const newTargetNA = Math.max(baseAmenaza, npc.targetNA);
    updateNpc({
      ...npc,
      rank: newRank,
      unitFormation: npc.unitFormation || autoFormation,
      targetNA: newTargetNA
    });
  };

  const handleAddSecondaryConcept = (conceptToAdd?: string) => {
    const val = (conceptToAdd || newSecondaryConcept).trim();
    if (!val) return;
    if (npc.secondaryConcepts.includes(val)) return;
    updateNpc({
      ...npc,
      secondaryConcepts: [...npc.secondaryConcepts, val]
    });
    setNewSecondaryConcept('');
  };

  const handleRemoveSecondaryConcept = (index: number) => {
    updateNpc({
      ...npc,
      secondaryConcepts: npc.secondaryConcepts.filter((_, i) => i !== index)
    });
  };

  const handleToggleTrait = (trait: Trait) => {
    const exists = npc.selectedTraits.some((t) => t.id === trait.id);
    let updated: Trait[];
    if (exists) {
      updated = npc.selectedTraits.filter((t) => t.id !== trait.id);
    } else {
      updated = [...npc.selectedTraits, trait];
    }
    updateNpc({
      ...npc,
      selectedTraits: updated
    });
  };

  const handleStartEditTrait = (trait: Trait) => {
    setEditingTraitId(trait.id);
    setEditTraitName(trait.name);
    setEditTraitEffect(trait.effect);
  };

  const handleSaveEditedTrait = () => {
    if (!editingTraitId || !editTraitName.trim()) return;
    const updated = npc.selectedTraits.map((t) => {
      if (t.id !== editingTraitId) return t;
      const official = OFFICIAL_TRAITS.find((ot) => ot.id === t.id);
      return {
        ...t,
        name: editTraitName.trim(),
        effect: editTraitEffect.trim() || t.effect,
        isCustomized: true,
        originalName: t.originalName || official?.name,
        originalEffect: t.originalEffect || official?.effect
      };
    });
    updateNpc({
      ...npc,
      selectedTraits: updated
    });
    setEditingTraitId(null);
  };

  const handleCancelEditTrait = () => {
    setEditingTraitId(null);
  };

  const handleResetTraitToOfficial = (traitId: string) => {
    const official = OFFICIAL_TRAITS.find((ot) => ot.id === traitId);
    if (!official) return;
    const updated = npc.selectedTraits.map((t) => {
      if (t.id !== traitId) return t;
      return {
        ...t,
        name: official.name,
        effect: official.effect,
        isCustomized: false
      };
    });
    updateNpc({
      ...npc,
      selectedTraits: updated
    });
    if (editingTraitId === traitId) {
      setEditingTraitId(null);
    }
  };

  const handleAddCustomTrait = () => {
    if (!customTraitName.trim()) return;
    const newTrait: Trait = {
      id: `custom_${Date.now()}`,
      name: customTraitName.trim(),
      effect: customTraitEffect.trim() || 'Efecto personalizado.',
      cost: customTraitCategory === 'desventaja' ? -Math.abs(customTraitCost) : customTraitCategory === 'menor' ? 0 : customTraitCost,
      category: customTraitCategory,
      isCustom: true,
      appliesDirectlyToStats: isCustomStatMod,
      statModifier: isCustomStatMod ? { [customStatType]: customStatValue } : undefined
    };
    updateNpc({
      ...npc,
      selectedTraits: [...npc.selectedTraits, newTrait]
    });
    setCustomTraitName('');
    setCustomTraitEffect('');
    setIsCustomStatMod(false);
    setShowCustomTraitModal(false);
  };

  const handleBehaviorTypeChange = (type: BehaviorType) => {
    const preset = BEHAVIORS_PRESETS.find((b) => b.type === type);
    updateNpc({
      ...npc,
      behaviorType: type,
      behaviorDescription: preset ? preset.description : npc.behaviorDescription
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        updateNpc({
          ...npc,
          avatarUrl: event.target?.result as string,
          avatarPreset: undefined
        });
      };
      reader.readAsDataURL(file);
    }
    if (e.target) {
      e.target.value = '';
    }
  };

  // Quick Random Creature Generator based on Papa Tumbay rules
  const handleGenerateRandom = () => {
    const randomRanks: NpcRank[] = ['Pandilla', 'Cuadrilla', 'Trío', 'Dúo', 'Solo'];
    const chosenRank = randomRanks[Math.floor(Math.random() * randomRanks.length)];
    const chosenNA = Math.floor(Math.random() * 5) + 2;

    const names = [
      { name: 'Acechador de la Cripta', concept: 'Cazador carroñero', sec: ['Oído agudo', 'Sigilo'], avatar: 'skeleton', behavior: 'Depredador' },
      { name: 'Ogro Devorador', concept: 'Coloso de las colinas', sec: ['Fuerza descomunal', 'Aplastador'], avatar: 'ogre', behavior: 'Bestia' },
      { name: 'Sierpe de Obsidiana', concept: 'Dragón de azufre', sec: ['Aliento tóxico', 'Vuelo rasante'], avatar: 'dragon', behavior: 'Depredador' },
      { name: 'Guardia Renegado', concept: 'Desertor de la guardia', sec: ['Escudo pesado', 'Tácticas de pelotón'], avatar: 'bandit', behavior: 'Táctico' },
      { name: 'Chamán de los Pantanos', concept: 'Brujo de fango', sec: ['Veneno antiguo', 'Rito oscuro'], avatar: 'cultist', behavior: 'Fanático' },
      { name: 'Jauría de Sombras', concept: 'Lobo espectral', sec: ['Mordisco helado', 'Caza en manada'], avatar: 'wolf', behavior: 'Bestia' },
      { name: 'Espectro Vengativo', concept: 'Alma en pena', sec: ['Rencor eterno', 'Toque gélido'], avatar: 'skeleton', behavior: 'Vengativo' },
      { name: 'Duende Maníaco', concept: 'Bromista desquiciado', sec: ['Impredecible', 'Saltos caóticos'], avatar: 'cultist', behavior: 'Errático' },
      { name: 'Tortuga de Granito', concept: 'Quelonio acorazado', sec: ['Caparazón impenetrable', 'Inmóvil'], avatar: 'ogre', behavior: 'Defensivo' }
    ];
    const picked = names[Math.floor(Math.random() * names.length)];

    // Pick 1 or 2 traits matching rank
    const candidateTraits = OFFICIAL_TRAITS.filter((t) => t.category !== 'provisional');
    const randomTrait = candidateTraits[Math.floor(Math.random() * candidateTraits.length)];

    const behaviorPreset = BEHAVIORS_PRESETS.find((b) => b.type === picked.behavior);

    updateNpc({
      id: npc.id,
      name: picked.name,
      quote: 'En las tierras de Tumbay, cada paso en falso tiene garras o filo.',
      mainConcept: picked.concept,
      secondaryConcepts: picked.sec,
      rank: chosenRank,
      unitFormation: (chosenRank === 'Pandilla' || chosenRank === 'Cuadrilla') ? 'Cuadrilla' : 'Solitario',
      targetNA: chosenNA,
      selectedTraits: [randomTrait],
      behaviorType: (picked.behavior as BehaviorType) || 'Bestia',
      behaviorDescription: behaviorPreset ? behaviorPreset.description : 'Lucha agresivamente.',
      avatarPreset: picked.avatar
    });
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Top Banner: Quick Presets & Randomizer */}
      <div className="bg-[#FAF6EE] rounded-2xl p-4 sm:p-5 border-2 border-[#D9C8A8] shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#7C5A37] block">
              Biblioteca del Director
            </span>
            <h2 className="font-heading text-lg sm:text-xl font-bold text-[#2A2016]">
              Plantillas Oficiales del Suplemento
            </h2>
            <p className="text-xs text-[#635340] font-serif mt-0.5">
              Carga un adversario de ejemplo de la sección 6 del manual o genera uno al azar.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {PREBUILT_NPCS.map((pre) => (
              <button
                key={pre.id}
                type="button"
                onClick={() => {
                  const h = getHistory(npc.id);
                  h.undo.push(npc);
                  if (h.undo.length > 40) h.undo.shift();
                  h.redo = [];
                  setUndoCount(h.undo.length);
                  setRedoCount(0);
                  onLoadPrebuilt(pre);
                }}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all ${
                  npc.id === pre.id
                    ? 'bg-[#7C5A37] text-white border-[#5A3F24] shadow-xs'
                    : 'bg-[#EFE6D2] hover:bg-[#E5DABF] text-[#423321] border-[#CBB895]'
                }`}
              >
                {pre.name}
              </button>
            ))}
            <button
              type="button"
              onClick={handleGenerateRandom}
              className="px-2.5 py-1 text-xs font-bold rounded-lg bg-[#FAF0DC] hover:bg-[#F2E0BD] text-[#7A4D1A] border border-[#DCBE8E] flex items-center gap-1 transition-all cursor-pointer"
              title="Generar criatura aleatoria"
            >
              <Shuffle className="w-3 h-3 text-[#A86420]" />
              Aleatorio
            </button>

            {onOpenBackupModal && (
              <button
                type="button"
                onClick={onOpenBackupModal}
                className="px-2.5 py-1 text-xs font-bold rounded-lg bg-[#FAF6EE] hover:bg-[#EAE0CA] text-[#473623] border border-[#CBB895] flex items-center gap-1 transition-all shadow-2xs cursor-pointer ml-1"
                title="Exportar o importar todos los NPCs en formato JSON"
              >
                <FileJson className="w-3.5 h-3.5 text-[#7C5A37]" />
                <span>JSON (Copia)</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Editor Status & Undo / Redo Toolbar */}
      <div className="sticky top-2 z-20 bg-[#FAF6EE]/95 backdrop-blur-xs rounded-xl p-3 border border-[#D9C8A8] shadow-md flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-[#3D2C1D] flex items-center gap-1.5 font-heading">
            <Sparkles className="w-4 h-4 text-[#7C5A37]" />
            Criatura Activa: <span className="text-[#7C5A37] font-sans font-black">{npc.name || 'Sin Nombre'}</span>
          </span>
          <span className="text-[11px] text-[#7A644D] font-serif hidden sm:inline italic">
            ({npc.rank} • ND {stats.finalBarriers.join('/')} • Aptitud {stats.finalAptitude >= 0 ? `+${stats.finalAptitude}` : stats.finalAptitude})
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Deshacer */}
          <button
            type="button"
            onClick={handleUndo}
            disabled={undoCount === 0}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all ${
              undoCount > 0
                ? 'bg-[#EFE6D2] hover:bg-[#E5DABF] text-[#3D2E1F] border border-[#CBB895] cursor-pointer shadow-2xs active:scale-95'
                : 'bg-[#F2ECE0] text-[#A59582] border border-[#DDD0BC] cursor-not-allowed opacity-60'
            }`}
            title={undoCount > 0 ? `Deshacer último cambio (Ctrl+Z) — ${undoCount} paso(s) disponibles` : 'No hay cambios para deshacer'}
          >
            <Undo2 className="w-3.5 h-3.5 text-[#7C5A37]" />
            <span>Deshacer</span>
            {undoCount > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 bg-[#E2D5BA] rounded-full font-mono text-[#4A3825]">
                {undoCount}
              </span>
            )}
          </button>

          {/* Rehacer */}
          <button
            type="button"
            onClick={handleRedo}
            disabled={redoCount === 0}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all ${
              redoCount > 0
                ? 'bg-[#EFE6D2] hover:bg-[#E5DABF] text-[#3D2E1F] border border-[#CBB895] cursor-pointer shadow-2xs active:scale-95'
                : 'bg-[#F2ECE0] text-[#A59582] border border-[#DDD0BC] cursor-not-allowed opacity-60'
            }`}
            title={redoCount > 0 ? `Rehacer cambio (Ctrl+Y o Ctrl+Shift+Z) — ${redoCount} paso(s) disponibles` : 'No hay cambios para rehacer'}
          >
            <Redo2 className="w-3.5 h-3.5 text-[#7C5A37]" />
            <span>Rehacer</span>
            {redoCount > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 bg-[#E2D5BA] rounded-full font-mono text-[#4A3825]">
                {redoCount}
              </span>
            )}
          </button>

          {/* Duplicar Criatura */}
          {onDuplicateNpc && (
            <button
              type="button"
              onClick={onDuplicateNpc}
              className="px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 bg-[#FAF6EE] hover:bg-[#EAE0CA] text-[#473623] border border-[#CBB895] transition-all cursor-pointer shadow-2xs active:scale-95 ml-1"
              title="Duplicar y crear una copia de esta criatura"
            >
              <Copy className="w-3.5 h-3.5 text-[#7C5A37]" />
              <span className="hidden sm:inline">Duplicar</span>
            </button>
          )}
        </div>
      </div>

      {/* Validador Oficial de Criatura (Papa Tumbay Borrador v0.4) */}
      <div
        className={`rounded-2xl border-2 transition-all p-4 sm:p-5 shadow-xs ${
          validation.isValid
            ? 'bg-[#FAF6EE] border-[#8C6D44]'
            : 'bg-[#FFF9EE] border-[#DEB070]'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
                validation.isValid
                  ? 'bg-[#40683E] text-white'
                  : 'bg-[#B06D1E] text-white'
              }`}
            >
              {validation.isValid ? (
                <CheckCircle2 className="w-6 h-6" />
              ) : (
                <AlertCircle className="w-6 h-6" />
              )}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-heading text-base sm:text-lg font-black text-[#261E16]">
                  Validador de Criatura
                </h3>
                <span
                  className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                    validation.isValid
                      ? 'bg-[#E3EEE0] text-[#2D5A27] border-[#BCD4B4]'
                      : 'bg-[#FDF0DB] text-[#8C5214] border-[#E8CD9E]'
                  }`}
                >
                  {validation.isValid
                    ? `✓ Equilibrada (${validation.score}%)`
                    : `⚠️ Requiere Revisión (${validation.score}%)`}
                </span>
              </div>
              <p className="text-xs text-[#5E4C38] font-serif mt-0.5">
                {validation.summary}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowValidationDetails((prev) => !prev)}
            className="px-3 py-1.5 bg-[#EFE6D2] hover:bg-[#E5DABF] text-[#3D2E1F] text-xs font-bold rounded-lg border border-[#CBB895] flex items-center gap-1.5 self-start sm:self-auto transition-all cursor-pointer shadow-2xs"
          >
            <span>{showValidationDetails ? 'Ocultar comprobaciones' : `Ver ${validation.checks.length} comprobaciones`}</span>
            {showValidationDetails ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        {/* Breakdown of 7 checks */}
        {showValidationDetails && (
          <div className="mt-4 pt-3.5 border-t border-[#DFD1B8] grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {validation.checks.map((check) => (
              <div
                key={check.id}
                className={`p-2.5 rounded-xl border flex items-start gap-2.5 transition-all ${
                  check.type === 'success'
                    ? 'bg-[#F9FCF8] border-[#CCE0C8]'
                    : check.type === 'warning'
                    ? 'bg-[#FFF8EC] border-[#E8CBA3]'
                    : 'bg-[#FAF7F0] border-[#D9C8A8]'
                }`}
              >
                <div className="mt-0.5 shrink-0">
                  {check.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-[#35662E]" />
                  ) : check.type === 'warning' ? (
                    <AlertCircle className="w-4 h-4 text-[#B5671E]" />
                  ) : (
                    <Info className="w-4 h-4 text-[#7A644D]" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[11.5px] font-bold text-[#2A2016] block leading-tight">
                    {check.title}
                  </span>
                  <p className="text-[11px] text-[#554432] leading-snug mt-0.5">
                    {check.message}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Step 1: ¿Qué es? (Sus Conceptos) */}
      <div className="bg-[#FAF7F0] rounded-2xl p-5 border border-[#DACBB0] shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#D8C7A5] pb-2">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-[#7C5A37] text-white text-xs font-bold flex items-center justify-center">
              1
            </span>
            <h3 className="font-heading text-base font-bold text-[#2A2016]">
              ¿Qué es? — Nombre e Identidad (Conceptos)
            </h3>
          </div>
          <span className="text-xs text-[#7A644E] font-serif italic">
            El Concepto principal define su ataque y le da 3d6
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-[11px] font-bold text-[#6B5742] uppercase block mb-1">
              Nombre de la Criatura / Enemigo
            </label>
            <input
              type="text"
              value={npc.name}
              onChange={(e) => updateNpc({ ...npc, name: e.target.value }, true)}
              onBlur={flushPendingUndo}
              placeholder="Ej: Lobo de ceniza, Capitán renegado..."
              className="w-full bg-[#FAF6EE] border border-[#CBB895] rounded-lg px-3 py-2 text-sm font-semibold text-[#2A2117] focus:ring-1 focus:ring-[#8C6D44]"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-[#6B5742] uppercase block mb-1">
              Concepto Principal (Frase corta)
            </label>
            <input
              type="text"
              value={npc.mainConcept}
              onChange={(e) => updateNpc({ ...npc, mainConcept: e.target.value }, true)}
              onBlur={flushPendingUndo}
              placeholder="Ej: Lobo de ceniza, Cazador de la ciénaga..."
              className="w-full bg-[#FAF6EE] border border-[#CBB895] rounded-lg px-3 py-2 text-sm text-[#2A2117] focus:ring-1 focus:ring-[#8C6D44]"
            />
            <p className="text-[10px] text-[#7E6953] mt-1">
              Guía: Es su identidad y suele aplicarse a su ataque principal (tira 3d6 y conserva los 2 más altos).
            </p>
          </div>
        </div>

        {/* Secondary Concepts */}
        <div className="pt-2 border-t border-[#E5D7BF]">
          <label className="text-[11px] font-bold text-[#6B5742] uppercase block mb-1.5">
            Conceptos Secundarios (Para rastrear, trepar, emboscar, engañar...)
          </label>

          <div className="flex flex-wrap gap-1.5 mb-2">
            {npc.secondaryConcepts.map((concept, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#EFE6D2] border border-[#C9B591] text-[#3D2F20] text-xs font-medium rounded-md"
              >
                ✦ {concept}
                <button
                  type="button"
                  onClick={() => handleRemoveSecondaryConcept(index)}
                  className="hover:text-[#8A2B1D] ml-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>

          {/* Quick suggestions & Add input */}
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              value={newSecondaryConcept}
              onChange={(e) => setNewSecondaryConcept(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddSecondaryConcept();
                }
              }}
              placeholder="Añadir concepto secundario..."
              className="flex-1 min-w-[200px] bg-[#FAF6EE] border border-[#CBB895] rounded-lg px-3 py-1.5 text-xs text-[#2A2117]"
            />
            <button
              type="button"
              onClick={() => handleAddSecondaryConcept()}
              className="px-3 py-1.5 bg-[#7C5A37] hover:bg-[#68492A] text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              Añadir
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-1 mt-2 text-[11px] text-[#78634B]">
            <span className="font-semibold">Sugerencias rápidas:</span>
            {['Rastreador', 'Cazador en manada', 'Emboscador', 'Bruto', 'Trepar', 'Sigilo', 'Voz seductora'].map((sug) => (
              <button
                key={sug}
                type="button"
                onClick={() => handleAddSecondaryConcept(sug)}
                className="px-2 py-0.5 bg-[#FAF6EE] hover:bg-[#EBE0C9] border border-[#D5C4A4] rounded text-[10px] text-[#4A3928]"
              >
                + {sug}
              </button>
            ))}
          </div>
        </div>

        {/* Lore Quote */}
        <div className="pt-2 border-t border-[#E5D7BF]">
          <label className="text-[11px] font-bold text-[#6B5742] uppercase block mb-1">
            Cita de Ambientación o Sabor (Para la carta coleccionable)
          </label>
          <input
            type="text"
            value={npc.quote || ''}
            onChange={(e) => updateNpc({ ...npc, quote: e.target.value }, true)}
            onBlur={flushPendingUndo}
            placeholder="«Acechan en jaurías silenciosas donde el humo apaga los pasos...»"
            className="w-full bg-[#FAF6EE] border border-[#CBB895] rounded-lg px-3 py-1.5 text-xs italic font-serif text-[#382C1F]"
          />
        </div>
      </div>

      {/* Step 2: ¿Qué tan grande y fuerte? (Rango y NA) */}
      <div className="bg-[#FAF7F0] rounded-2xl p-5 border border-[#DACBB0] shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#D8C7A5] pb-2">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-[#7C5A37] text-white text-xs font-bold flex items-center justify-center">
              2
            </span>
            <h3 className="font-heading text-base font-bold text-[#2A2016]">
              ¿Qué tan grande y fuerte es? — Rango y Nivel de Amenaza (NA)
            </h3>
          </div>
          <span className="text-xs text-[#7A644E] font-serif italic">
            El Rango fija la forma; el NA fija la escala
          </span>
        </div>

        {/* Rank Cards Selector - Papa Tumbay Borrador v0.4 */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-[11px] font-bold text-[#6B5742] uppercase block">
              Elige el Rango del Adversario (Borrador v0.4)
            </label>
            <span className="text-[10px] text-[#7A644D] font-serif italic">
              5 Rangos oficiales calibrados
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
            {(['Pandilla', 'Cuadrilla', 'Trío', 'Dúo', 'Solo'] as NpcRank[]).map((r) => {
              const base = RANK_BASE_STATS[r];
              const isSelected = npc.rank === r;

              return (
                <div
                  key={r}
                  onClick={() => handleRankChange(r)}
                  className={`p-2.5 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-[#FAF2E2] border-[#8C6D44] shadow-xs ring-1 ring-[#8C6D44]'
                      : 'bg-[#FAF6EE] border-[#D9C8A8] hover:border-[#BFAF8E]'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-heading text-sm font-bold text-[#2A2016]">
                          {r}
                        </span>
                        {r === 'Trío' && (
                          <span className="text-[9px] px-1 py-0.2 bg-[#E1EDDB] text-[#2F5927] rounded border border-[#BBD5B4] font-semibold">
                            v0.4
                          </span>
                        )}
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-[#8C6D44] shrink-0" />}
                    </div>
                    <div className="text-[10.5px] text-[#635340] mb-2 leading-tight">
                      {base.description}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#DFD1B7] text-[10px] space-y-0.5 text-[#524131]">
                    <div>
                      <strong>Barreras:</strong> {base.barriers.length} (ND {base.barriers.join('/')})
                    </div>
                    <div>
                      <strong>Aptitud:</strong> +{base.aptitude} | <strong>Actuar:</strong> {base.actions}
                    </div>
                    <div className="text-[9.5px] text-[#8C6D44] font-semibold">
                      Amenaza: {base.amenazaBase} • {base.typicalCount}
                    </div>
                    <div className="text-[9px] text-[#7A644D] italic mt-0.5 truncate" title={base.examples}>
                      Ej: {base.examples}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Variant and Target Threat */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[#E5D7BF]">
          <div>
            <label className="text-[11px] font-bold text-[#6B5742] uppercase block mb-1">
              Variante de Rango
            </label>
            <select
              value={npc.rankVariant || 'normal'}
              onChange={(e) =>
                updateNpc({
                  ...npc,
                  rankVariant: e.target.value as 'normal' | 'debil' | 'veterano'
                })
              }
              className="w-full bg-[#FAF6EE] border border-[#CBB895] rounded-lg px-2.5 py-1.5 text-xs font-semibold text-[#2A2117]"
            >
              <option value="normal">Estándar</option>
              <option value="debil">Débil (-1 ND, -1 Aptitud)</option>
              <option value="veterano">Veterano (+1 ND)</option>
            </select>
            <p className="text-[9.5px] text-[#7A644D] mt-1">
              Permite variar un Rango en 1 o 2 puntos (Sección 2, paso 2).
            </p>
          </div>

          <div>
            {(() => {
              const rankMinNA = RANK_BASE_STATS[npc.rank]?.amenazaBase ?? 0;
              const maxNA = 16;
              const currentNA = Math.max(rankMinNA, npc.targetNA);

              return (
                <>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-[#6B5742] uppercase">
                      Amenaza del NPC (Base mín: {rankMinNA})
                    </label>
                    <span className="text-[10px] text-[#7A644D] font-mono">
                      delta: {stats.threatDelta >= 0 ? `+${stats.threatDelta}` : stats.threatDelta}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => updateNpc({ ...npc, targetNA: Math.max(rankMinNA, currentNA - 1) })}
                      disabled={currentNA <= rankMinNA}
                      className="w-7 h-7 rounded-lg bg-[#EFE6D2] hover:bg-[#E5DABF] disabled:opacity-40 text-[#473623] border border-[#CBB895] font-bold text-xs flex items-center justify-center cursor-pointer transition-all active:scale-95 shrink-0"
                      title={`Disminuir Amenaza (-1, mínimo ${rankMinNA} para ${npc.rank})`}
                    >
                      -
                    </button>
                    <input
                      type="range"
                      min={rankMinNA}
                      max={maxNA}
                      value={currentNA}
                      onChange={(e) => updateNpc({ ...npc, targetNA: Math.max(rankMinNA, Number(e.target.value)) }, true)}
                      onMouseUp={flushPendingUndo}
                      onTouchEnd={flushPendingUndo}
                      className="flex-1 accent-[#7C5A37]"
                    />
                    <button
                      type="button"
                      onClick={() => updateNpc({ ...npc, targetNA: Math.min(maxNA, currentNA + 1) })}
                      disabled={currentNA >= maxNA}
                      className="w-7 h-7 rounded-lg bg-[#EFE6D2] hover:bg-[#E5DABF] disabled:opacity-40 text-[#473623] border border-[#CBB895] font-bold text-xs flex items-center justify-center cursor-pointer transition-all active:scale-95 shrink-0"
                      title="Aumentar Amenaza (+1)"
                    >
                      +
                    </button>
                    <span className="w-8 h-8 rounded-lg bg-[#EFE6D2] border border-[#CBB895] font-heading font-black text-sm text-[#261E16] flex items-center justify-center shrink-0">
                      {currentNA}
                    </span>
                  </div>
                  <p className="text-[9.5px] text-[#7A644D] mt-1 leading-tight">
                    Efectiva: <strong>{stats.effectiveThreat}</strong> (Base {npc.rank}: {rankMinNA}). Escala ND y Aptitud en {stats.threatDelta >= 0 ? `+${stats.threatDelta}` : stats.threatDelta}.
                  </p>
                </>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Step 3: ¿Qué lo hace especial? (Rasgos y Modo de Actuar) */}
      <div className="bg-[#FAF7F0] rounded-2xl p-5 border border-[#DACBB0] shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#D8C7A5] pb-2">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-[#7C5A37] text-white text-xs font-bold flex items-center justify-center">
              3
            </span>
            <h3 className="font-heading text-base font-bold text-[#2A2016]">
              ¿Qué lo hace especial? — Rasgos y Modo de Actuar
            </h3>
          </div>
          <span className="text-xs text-[#7A644E] font-serif italic">
            Ventajas restan Amenaza; desventajas suman Amenaza
          </span>
        </div>

        {/* Traits Warning or Rule notice */}
        {stats.warnings.length > 0 && (
          <div className="p-3 bg-[#FFF8EB] border border-[#E8CBA3] rounded-xl text-xs text-[#7A4B1A] space-y-1">
            {stats.warnings.map((w, i) => (
              <div key={i} className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-[#B5671E] shrink-0" />
                <span>{w}</span>
              </div>
            ))}
          </div>
        )}

        {/* Presentation Rule Banner */}
        <div className="p-3 bg-[#FAF3E3] border border-[#DECFB5] rounded-xl text-xs text-[#5C452C] flex items-start gap-2.5">
          <Info className="w-4 h-4 text-[#8C6D44] shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold text-[#3B2B1B] block">
              Regla de presentación en la Carta Coleccionable:
            </span>
            <p className="text-[11px] text-[#69543C] leading-snug">
              En la carta solo se colocan los <strong>rasgos tácticos con efectos en combate</strong> (ej: <em>Veloz</em>, <em>Presa</em>, <em>Golpe de área</em>). Los rasgos que modifican estadísticas directamente (como <strong>Torpe: -2 Aptitud</strong>, <strong>Piel dura: +2 ND</strong> o <strong>Lento: -1 Actuar</strong>) se aplican automáticamente a los números de la carta y <strong>no se colocan en el recuadro de rasgos</strong> para mantener la carta limpia y sin saturación.
            </p>
          </div>
        </div>

        {/* Active Selected Traits list with text customization */}
        {npc.selectedTraits.length > 0 && (
          <div className="p-3.5 bg-[#FAF3E2] rounded-xl border border-[#D9C7A8] space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#4E3926] flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#7C5A37]" />
                Rasgos Asignados a la Criatura ({npc.selectedTraits.length})
              </span>
              <span className="text-[10px] text-[#7A644D] italic hidden sm:inline">
                Puedes personalizar el texto (ej: tipo de elemento, aliento o resistencias)
              </span>
            </div>

            <div className="space-y-2">
              {npc.selectedTraits.map((t) => {
                const isEditingThis = editingTraitId === t.id;
                const isAutoStat = isAutomaticStatTrait(t);
                const official = OFFICIAL_TRAITS.find((ot) => ot.id === t.id);

                if (isEditingThis) {
                  return (
                    <div
                      key={t.id}
                      className="p-3 bg-[#FFFDF7] rounded-xl border-2 border-[#8C6D44] shadow-sm space-y-2"
                    >
                      <div className="flex items-center justify-between text-xs font-bold text-[#3B2A1C]">
                        <span className="flex items-center gap-1">
                          <Edit3 className="w-3.5 h-3.5 text-[#7C5A37]" />
                          Personalizar texto de: {t.originalName || official?.name || t.name}
                        </span>
                        {official && t.isCustomized && (
                          <button
                            type="button"
                            onClick={() => handleResetTraitToOfficial(t.id)}
                            className="text-[10.5px] text-[#7C5A37] hover:text-[#3B2A1C] flex items-center gap-1 cursor-pointer"
                            title="Restablecer al texto original del manual"
                          >
                            <RotateCcw className="w-3 h-3" />
                            Restablecer original
                          </button>
                        )}
                      </div>

                      <div className="space-y-2">
                        <div>
                          <label className="text-[10px] font-bold text-[#6B5742] uppercase block mb-0.5">
                            Nombre del rasgo (personalizado):
                          </label>
                          <input
                            type="text"
                            value={editTraitName}
                            onChange={(e) => setEditTraitName(e.target.value)}
                            placeholder="Ej: Resistente al fuego, Volador..."
                            className="w-full bg-[#FAF6EE] border border-[#CBB895] rounded px-2.5 py-1 text-xs font-bold text-[#2A2016]"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-[#6B5742] uppercase block mb-0.5">
                            Efecto o detalle en partida:
                          </label>
                          <textarea
                            rows={2}
                            value={editTraitEffect}
                            onChange={(e) => setEditTraitEffect(e.target.value)}
                            placeholder="Describe el efecto específico en combate..."
                            className="w-full bg-[#FAF6EE] border border-[#CBB895] rounded px-2.5 py-1 text-xs text-[#2A2016]"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-1 border-t border-[#E5D7BF]">
                        <button
                          type="button"
                          onClick={handleCancelEditTrait}
                          className="px-2.5 py-1 text-xs text-[#6B5742] hover:bg-[#EFE6D2] rounded cursor-pointer"
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveEditedTrait}
                          className="px-3 py-1 bg-[#7C5A37] hover:bg-[#68492A] text-white text-xs font-bold rounded flex items-center gap-1 shadow-2xs cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Guardar texto
                        </button>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={t.id}
                    className="p-2.5 bg-[#FFFDF7] rounded-xl border border-[#D5C2A4] flex items-start justify-between gap-3 shadow-2xs"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-0.5">
                        <span className="font-bold text-xs text-[#2A2016]">
                          {t.name}
                        </span>
                        {t.isCustomized && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-[#EAE0CA] text-[#553E26] border border-[#CCA770]">
                            Texto personalizado
                          </span>
                        )}
                        <span className="text-[9.5px] text-[#705E4B]">
                          {t.cost > 0 ? `(Costo ${t.cost} NA)` : t.cost < 0 ? `(Valor +${Math.abs(t.cost)} NA)` : '(Costo 0)'}
                        </span>
                        {isAutoStat ? (
                          <span className="text-[9px] font-semibold text-[#66533D]">
                            • Auto-aplicado a estadísticas
                          </span>
                        ) : (
                          <span className="text-[9px] font-semibold text-[#2D5A27]">
                            • Visible en carta
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[#524131] leading-snug">
                        {t.effect}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 shrink-0 pt-0.5">
                      <button
                        type="button"
                        onClick={() => handleStartEditTrait(t)}
                        className="px-2 py-1 bg-[#EFE6D2] hover:bg-[#E2D5BA] text-[#42311F] text-[11px] font-bold rounded flex items-center gap-1 border border-[#CDBEA4] transition-colors cursor-pointer"
                        title="Modificar el texto de este rasgo (nombre o efecto)"
                      >
                        <Edit3 className="w-3 h-3 text-[#7C5A37]" />
                        <span>Editar texto</span>
                      </button>
                      {official && t.isCustomized && (
                        <button
                          type="button"
                          onClick={() => handleResetTraitToOfficial(t.id)}
                          className="p-1 text-[#7C5A37] hover:text-[#3B2A1C] hover:bg-[#EAE0CA] rounded transition-colors cursor-pointer"
                          title="Restablecer al texto original del manual"
                        >
                          <RotateCcw className="w-3 h-3" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleToggleTrait(t)}
                        className="p-1 text-[#8A7561] hover:text-[#942E20] hover:bg-[#F4DDD9] rounded transition-colors cursor-pointer"
                        title="Quitar este rasgo"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Traits Catalog Accordion / Selector */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-[11px] font-bold text-[#6B5742] uppercase">
              Catálogo de Rasgos Oficiales
            </label>
            <button
              type="button"
              onClick={() => setShowCustomTraitModal(true)}
              className="text-xs font-bold text-[#7C5A37] hover:text-[#5E4122] flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              Crear Rasgo Propio
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {OFFICIAL_TRAITS.map((trait) => {
              const isSelected = npc.selectedTraits.some((t) => t.id === trait.id);
              const isAutoStat = isAutomaticStatTrait(trait);
              const currentInNpc = npc.selectedTraits.find((t) => t.id === trait.id);
              return (
                <div
                  key={trait.id}
                  onClick={() => handleToggleTrait(trait)}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-start gap-2.5 ${
                    isSelected
                      ? 'bg-[#F9F0DF] border-[#8C6D44] shadow-xs'
                      : 'bg-[#FAF6EE] border-[#D9C8A8] hover:border-[#BFB090]'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => {}} // handled by parent div
                    className="mt-0.5 rounded border-[#C2B299] text-[#7C5A37] focus:ring-0"
                  />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-[#2A2016]">
                          {currentInNpc?.name || trait.name}
                        </span>
                        {currentInNpc?.isCustomized && (
                          <span className="text-[8.5px] px-1 bg-[#E8DCBF] text-[#553E26] rounded border border-[#CDB58E]">
                            Personalizado
                          </span>
                        )}
                      </div>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                          trait.cost > 0
                            ? 'bg-[#EBD6CF] text-[#7A2B1D]'
                            : trait.cost < 0
                            ? 'bg-[#DFE7D6] text-[#345928]'
                            : 'bg-[#EBE2D0] text-[#635340]'
                        }`}
                      >
                        {trait.cost > 0
                          ? `Costo ${trait.cost} NA`
                          : trait.cost < 0
                          ? `Valor +${Math.abs(trait.cost)} NA`
                          : 'Costo 0'}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#594735] leading-snug">
                      {currentInNpc?.effect || trait.effect}
                    </p>
                    <div className="flex items-center justify-between pt-0.5">
                      {isAutoStat ? (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#EAE2D2] text-[#614D35] border border-[#D5C6AC] inline-block">
                          📊 Modifica estadísticas (auto-aplicado a la carta)
                        </span>
                      ) : (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#E4ECE0] text-[#2C5224] border border-[#BFD5BA] inline-block">
                          ⚡ Rasgo táctico (visible en la carta)
                        </span>
                      )}

                      {isSelected && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartEditTrait(currentInNpc || trait);
                          }}
                          className="text-[10px] font-bold px-2 py-0.5 bg-[#FAF6EE] hover:bg-[#EAE0CA] text-[#5C452C] rounded border border-[#CDBEA4] flex items-center gap-1 cursor-pointer transition-colors"
                          title="Personalizar el texto de este rasgo"
                        >
                          <Edit3 className="w-2.5 h-2.5 text-[#7C5A37]" />
                          <span>Editar texto</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Behavior (Modo de actuar) */}
        <div className="pt-3 border-t border-[#E5D7BF]">
          <div className="flex items-center justify-between mb-2">
            <label className="text-[11px] font-bold text-[#6B5742] uppercase">
              Modo de Actuar (¿Qué hace cuando las cosas van mal?)
            </label>
            <span className="text-[10px] text-[#7A644D]">
              Arquetipos oficiales de la Sección 5
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-1.5 mb-2.5">
            {BEHAVIORS_PRESETS.map((b) => (
              <button
                key={b.type}
                type="button"
                onClick={() => handleBehaviorTypeChange(b.type)}
                title={b.description}
                className={`py-1.5 px-2 text-xs font-bold rounded-lg border transition-all text-center ${
                  npc.behaviorType === b.type
                    ? 'bg-[#7C5A37] text-white border-[#5A3F24] shadow-xs'
                    : 'bg-[#FAF6EE] text-[#4F3E2C] border-[#D9C8A8] hover:bg-[#EFE6D2]'
                }`}
              >
                {b.type}
              </button>
            ))}
          </div>

          <textarea
            rows={2}
            value={npc.behaviorDescription}
            onChange={(e) => updateNpc({ ...npc, behaviorDescription: e.target.value }, true)}
            onBlur={flushPendingUndo}
            placeholder="Describe cómo actúa cuando las cosas van mal..."
            className="w-full bg-[#FAF6EE] border border-[#CBB895] rounded-lg px-3 py-2 text-xs text-[#2A2117] leading-relaxed"
          />
        </div>
      </div>

      {/* Card Visual Artwork & Illustration Picker */}
      <div className="bg-[#FAF7F0] rounded-2xl p-5 border border-[#DACBB0] shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#D8C7A5] pb-2">
          <h3 className="font-heading text-base font-bold text-[#2A2016]">
            Ilustración para la Carta Coleccionable
          </h3>
          <span className="text-xs text-[#7A644E] font-serif italic">
            Elige un arte predeterminado o sube tu propia imagen
          </span>
        </div>

        {/* Gallery of SVG Presets */}
        <div>
          <label className="text-[11px] font-bold text-[#6B5742] uppercase block mb-2">
            Galería de Ilustraciones Estilizadas
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2">
            {AVATAR_PRESETS.map((preset) => {
              const isSelected = !npc.avatarUrl && npc.avatarPreset === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() =>
                    updateNpc({
                      ...npc,
                      avatarPreset: preset.id,
                      avatarUrl: undefined
                    })
                  }
                  className={`p-1.5 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                    isSelected
                      ? 'bg-[#FAF0DC] border-[#8C6D44] ring-2 ring-[#8C6D44]/30'
                      : 'bg-[#FAF6EE] border-[#D9C8A8] hover:bg-[#EFE6D2]'
                  }`}
                >
                  <div
                    className="w-12 h-12 rounded-lg overflow-hidden border border-[#CBB895] shadow-2xs"
                    dangerouslySetInnerHTML={{ __html: preset.svgBackground }}
                  />
                  <span className="text-[9px] font-bold text-[#423221] truncate w-full text-center">
                    {preset.name.split('/')[0]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Upload Custom Image */}
        <div className="pt-2 border-t border-[#E5D7BF] flex flex-wrap items-center gap-4">
          <label className="cursor-pointer px-3 py-1.5 bg-[#EFE6D2] hover:bg-[#E4D7BC] text-[#423221] text-xs font-bold rounded-lg border border-[#C5B08C] flex items-center gap-1.5 transition-all">
            <Upload className="w-3.5 h-3.5 text-[#7C5A37]" />
            Subir Imagen desde mi Dispositivo
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="sr-only"
            />
          </label>

          <span className="text-[11px] text-[#7A644E]">o bien pegar URL:</span>
          <input
            type="text"
            value={npc.avatarUrl || ''}
            onChange={(e) =>
              updateNpc(
                {
                  ...npc,
                  avatarUrl: e.target.value,
                  avatarPreset: undefined
                },
                true
              )
            }
            onBlur={flushPendingUndo}
            placeholder="https://ejemplo.com/criatura.jpg"
            className="flex-1 min-w-[200px] bg-[#FAF6EE] border border-[#CBB895] rounded-lg px-3 py-1.5 text-xs text-[#2A2117]"
          />
        </div>
      </div>

      {/* Modal for Custom Trait */}
      {showCustomTraitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-[#FAF7F0] rounded-2xl p-6 border-2 border-[#CBB895] max-w-md w-full shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#D8C7A5] pb-2">
              <h4 className="font-heading text-base font-bold text-[#2A2016]">
                Crear Rasgo Personalizado
              </h4>
              <button
                type="button"
                onClick={() => setShowCustomTraitModal(false)}
                className="text-[#7A644D] hover:text-[#2A2016]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="text-[11px] font-bold text-[#6B5742] uppercase block mb-1">
                Nombre del Rasgo
              </label>
              <input
                type="text"
                value={customTraitName}
                onChange={(e) => setCustomTraitName(e.target.value)}
                placeholder="Ej: Aura de escarcha, Garras envenenadas..."
                className="w-full bg-[#FAF6EE] border border-[#CBB895] rounded-lg px-3 py-2 text-xs text-[#2A2117]"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-[#6B5742] uppercase block mb-1">
                Efecto en Combate
              </label>
              <textarea
                rows={2}
                value={customTraitEffect}
                onChange={(e) => setCustomTraitEffect(e.target.value)}
                placeholder="Explica qué hace este rasgo en las tiradas o situaciones..."
                className="w-full bg-[#FAF6EE] border border-[#CBB895] rounded-lg px-3 py-2 text-xs text-[#2A2117]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-[#6B5742] uppercase block mb-1">
                  Categoría
                </label>
                <select
                  value={customTraitCategory}
                  onChange={(e) =>
                    setCustomTraitCategory(
                      e.target.value as 'menor' | 'ventaja' | 'desventaja' | 'provisional'
                    )
                  }
                  className="w-full bg-[#FAF6EE] border border-[#CBB895] rounded-lg px-3 py-2 text-xs text-[#2A2117]"
                >
                  <option value="menor">Menor (Costo 0)</option>
                  <option value="ventaja">Ventaja (Resta del NA)</option>
                  <option value="desventaja">Desventaja (Suma al NA)</option>
                  <option value="provisional">Especial (Costo 1)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#6B5742] uppercase block mb-1">
                  Puntos de NA
                </label>
                <input
                  type="number"
                  min="0"
                  max="5"
                  value={customTraitCost}
                  onChange={(e) => setCustomTraitCost(Number(e.target.value))}
                  disabled={customTraitCategory === 'menor'}
                  className="w-full bg-[#FAF6EE] border border-[#CBB895] rounded-lg px-3 py-2 text-xs text-[#2A2117] disabled:opacity-50"
                />
              </div>
            </div>

            {/* Direct stat modification checkbox */}
            <div className="p-2.5 bg-[#FAF3E2] rounded-xl border border-[#D9C7A8] space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isCustomStatMod}
                  onChange={(e) => setIsCustomStatMod(e.target.checked)}
                  className="rounded border-[#C2B299] text-[#7C5A37] focus:ring-0"
                />
                <span className="text-xs font-bold text-[#3D2C1D]">
                  Modifica directamente estadísticas numéricas (no mostrar en la carta)
                </span>
              </label>

              {isCustomStatMod && (
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[#DFD1B8]">
                  <div>
                    <label className="text-[10px] font-bold text-[#66523E] block mb-0.5">
                      Estadística que altera:
                    </label>
                    <select
                      value={customStatType}
                      onChange={(e) =>
                        setCustomStatType(e.target.value as 'aptitude' | 'barriersNd' | 'actions')
                      }
                      className="w-full bg-[#FAF6EE] border border-[#CBB895] rounded px-2 py-1 text-xs text-[#2A2117]"
                    >
                      <option value="aptitude">Aptitud (ej: -2 como Torpe)</option>
                      <option value="barriersNd">ND de Barreras (ej: +2 como Piel dura)</option>
                      <option value="actions">Actuar (ej: -1 como Lento)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-[#66523E] block mb-0.5">
                      Modificador numérico:
                    </label>
                    <input
                      type="number"
                      value={customStatValue}
                      onChange={(e) => setCustomStatValue(Number(e.target.value))}
                      className="w-full bg-[#FAF6EE] border border-[#CBB895] rounded px-2 py-1 text-xs text-[#2A2117]"
                      placeholder="-2"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#D8C7A5]">
              <button
                type="button"
                onClick={() => setShowCustomTraitModal(false)}
                className="px-3 py-1.5 text-xs text-[#6B5742] hover:bg-[#EFE6D2] rounded-lg"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleAddCustomTrait}
                className="px-4 py-1.5 bg-[#7C5A37] text-white text-xs font-bold rounded-lg hover:bg-[#68492A]"
              >
                Guardar Rasgo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
