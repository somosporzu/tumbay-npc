import React, { useState, useEffect } from 'react';
import { NpcData } from './types/npc';
import { PREBUILT_NPCS } from './data/rulesData';
import { calculateNpcStats, validateNpcCreature } from './utils/calculator';
import { NpcEditor } from './components/NpcEditor';
import { CollectibleCard } from './components/CollectibleCard';
import { DesignSheet } from './components/DesignSheet';
import { EncounterBuilder } from './components/EncounterBuilder';
import { QuickRulesModal } from './components/QuickRulesModal';
import { JsonBackupModal } from './components/JsonBackupModal';
import { SpreadsheetImportModal } from './components/SpreadsheetImportModal';
import { PrintSheetModal } from './components/PrintSheetModal';
import { ZipExportModal } from './components/ZipExportModal';
import { PorzuuLogo } from './components/PorzuuLogo';
import {
  Sparkles,
  Layers,
  FileSpreadsheet,
  Swords,
  BookOpen,
  Plus,
  Save,
  Trash2,
  Bookmark,
  Printer,
  FileJson,
  Copy,
  FileArchive
} from 'lucide-react';

type ActiveTab = 'editor' | 'card' | 'designSheet' | 'encounters';

export default function App() {
  // Saved NPCs in state and localStorage
  const [npcList, setNpcList] = useState<NpcData[]>(() => {
    try {
      const saved = localStorage.getItem('papa_tumbay_npcs');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Normalize any legacy ranks
          return parsed.map((item: any) => {
            let rank = item.rank;
            if (rank === 'Esbirro') rank = 'Pandilla';
            else if (rank === 'Soldado') rank = 'Cuadrilla';
            else if (rank === 'Élite') rank = 'Dúo';
            else if (rank === 'Jefe') rank = 'Solo';
            else if (!['Pandilla', 'Cuadrilla', 'Trío', 'Dúo', 'Solo'].includes(rank)) rank = 'Cuadrilla';
            return { ...item, rank };
          });
        }
      }
    } catch {}
    return PREBUILT_NPCS;
  });

  const [activeNpcId, setActiveNpcId] = useState<string>(() => {
    return npcList[0]?.id || PREBUILT_NPCS[0].id;
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>('card');
  const [showRulesModal, setShowRulesModal] = useState<boolean>(false);
  const [showBackupModal, setShowBackupModal] = useState<boolean>(false);
  const [showSpreadsheetModal, setShowSpreadsheetModal] = useState<boolean>(false);
  const [showZipModal, setShowZipModal] = useState<boolean>(false);
  const [showPrintSheetModal, setShowPrintSheetModal] = useState<boolean>(false);

  // Sync to local storage
  useEffect(() => {
    try {
      localStorage.setItem('papa_tumbay_npcs', JSON.stringify(npcList));
    } catch {}
  }, [npcList]);

  // Active NPC data
  const currentNpc = npcList.find((n) => n.id === activeNpcId) || npcList[0] || PREBUILT_NPCS[0];
  const currentStats = calculateNpcStats(currentNpc);
  const currentValidation = validateNpcCreature(currentNpc, currentStats);

  const handleUpdateCurrentNpc = (updatedOrFn: NpcData | ((prev: NpcData) => NpcData)) => {
    setNpcList((prev) =>
      prev.map((n) => {
        if (n.id === activeNpcId) {
          return typeof updatedOrFn === 'function' ? updatedOrFn(n) : updatedOrFn;
        }
        return n;
      })
    );
  };

  const handleCreateNewNpc = () => {
    const newId = `npc_${Date.now()}`;
    const newNpc: NpcData = {
      id: newId,
      name: 'Nueva Criatura',
      quote: 'Acecha desde las sombras del bosque de piedra.',
      mainConcept: 'Bestia salvaje',
      secondaryConcepts: ['Oído agudo'],
      rank: 'Cuadrilla',
      unitFormation: 'Cuadrilla',
      targetNA: 3,
      selectedTraits: [],
      behaviorType: 'Bestia',
      behaviorDescription: 'Ataca al enemigo más cercano. Huye si pierde su primera Barrera.',
      avatarPreset: 'wolf'
    };
    setNpcList((prev) => [newNpc, ...prev]);
    setActiveNpcId(newId);
    setActiveTab('editor');
  };

  const handleDuplicateCurrentNpc = () => {
    const newId = `npc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const clonedNpc: NpcData = {
      ...JSON.parse(JSON.stringify(currentNpc)),
      id: newId,
      name: `${currentNpc.name} (Copia)`
    };
    const currentIndex = npcList.findIndex((n) => n.id === currentNpc.id);
    const nextList = [...npcList];
    if (currentIndex >= 0) {
      nextList.splice(currentIndex + 1, 0, clonedNpc);
    } else {
      nextList.unshift(clonedNpc);
    }
    setNpcList(nextList);
    setActiveNpcId(newId);
  };

  const handleDeleteCurrentNpc = () => {
    if (npcList.length <= 1) {
      alert('Debes conservar al menos una criatura.');
      return;
    }
    if (confirm(`¿Eliminar "${currentNpc.name}"?`)) {
      const remaining = npcList.filter((n) => n.id !== currentNpc.id);
      setNpcList(remaining);
      setActiveNpcId(remaining[0].id);
    }
  };

  const handleLoadPrebuilt = (preset: NpcData) => {
    const existingIndex = npcList.findIndex((n) => n.id === preset.id);
    if (existingIndex >= 0) {
      setActiveNpcId(preset.id);
    } else {
      setNpcList((prev) => [preset, ...prev]);
      setActiveNpcId(preset.id);
    }
  };

  // Import JSON handler (Merge or Replace)
  const handleImportNpcs = (imported: NpcData[], mode: 'merge' | 'replace') => {
    if (mode === 'replace') {
      setNpcList(imported);
      if (imported.length > 0) {
        setActiveNpcId(imported[0].id);
      }
    } else {
      const existingIds = new Set(npcList.map((n) => n.id));
      const merged = [...npcList];
      imported.forEach((item) => {
        let safeItem = item;
        if (existingIds.has(item.id)) {
          safeItem = {
            ...item,
            id: `${item.id}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`
          };
        }
        existingIds.add(safeItem.id);
        merged.push(safeItem);
      });
      setNpcList(merged);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F0] text-[#29221B] flex flex-col font-body selection:bg-[#E2D2B3]">
      {/* Top Parchment Navbar */}
      <header className="bg-[#FAF6EE] border-b-2 border-[#D8C7A5] sticky top-0 z-40 shadow-xs no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
          {/* Logo & System Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center shrink-0 drop-shadow-xs transition-transform hover:scale-105" title="Logo">
              <PorzuuLogo className="w-full h-full object-contain" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-heading font-black text-base sm:text-lg text-[#261E16] tracking-tight">
                  PAPA TUMBAY
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 bg-[#EAE0CA] text-[#5A4530] rounded border border-[#CBB895]">
                  Creación de NPC Borrador v0.4
                </span>
              </div>
              <p className="text-[11px] text-[#78644E] font-ui hidden sm:block">
                Generador de Adversarios, Cartas Coleccionables & Encuentros
              </p>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-1 bg-[#EFE6D2] p-1 rounded-xl border border-[#D5C4A4]">
            <button
              onClick={() => setActiveTab('editor')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold font-ui rounded-lg transition-all ${
                activeTab === 'editor'
                  ? 'bg-[#FAF6EE] text-[#2A2016] shadow-xs'
                  : 'text-[#614E3A] hover:text-[#2A2016]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-[#7C5A37]" />
              <span className="hidden md:inline">Diseñar Criatura</span>
              <span className="md:hidden">Diseñar</span>
            </button>

            <button
              onClick={() => setActiveTab('card')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold font-ui rounded-lg transition-all ${
                activeTab === 'card'
                  ? 'bg-[#FAF6EE] text-[#2A2016] shadow-xs'
                  : 'text-[#614E3A] hover:text-[#2A2016]'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-[#7C5A37]" />
              <span>Carta Coleccionable</span>
            </button>

            <button
              onClick={() => setActiveTab('designSheet')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold font-ui rounded-lg transition-all ${
                activeTab === 'designSheet'
                  ? 'bg-[#FAF6EE] text-[#2A2016] shadow-xs'
                  : 'text-[#614E3A] hover:text-[#2A2016]'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-[#7C5A37]" />
              <span className="hidden md:inline">Ficha en Modo Diseño</span>
              <span className="md:hidden">Ficha</span>
            </button>

            <button
              onClick={() => setActiveTab('encounters')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold font-ui rounded-lg transition-all ${
                activeTab === 'encounters'
                  ? 'bg-[#FAF6EE] text-[#2A2016] shadow-xs'
                  : 'text-[#614E3A] hover:text-[#2A2016]'
              }`}
            >
              <Swords className="w-3.5 h-3.5 text-[#7C5A37]" />
              <span>Armar Encuentros</span>
            </button>
          </div>

          {/* Quick Actions: Rules, Spreadsheet, Print 8 Cards, ZIP Export, JSON Backup & New NPC */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => setShowPrintSheetModal(true)}
              className="p-1.5 sm:px-2.5 sm:py-1.5 bg-[#543D28] hover:bg-[#432F1E] text-white text-xs font-bold rounded-lg shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer"
              title="Armar e imprimir planillas de 8 cartas automáticas para papel Oficio o Carta con sangrado y guías de corte"
            >
              <Layers className="w-4 h-4 text-[#EFE5D2]" />
              <span className="hidden sm:inline">Planilla 8 Cartas</span>
            </button>

            <button
              onClick={() => setShowZipModal(true)}
              className="p-1.5 sm:px-2.5 sm:py-1.5 bg-[#FAF6EE] hover:bg-[#EAF3E6] text-[#205735] text-xs font-bold rounded-lg border border-[#A7CCA8] flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
              title="Exportar todas las cartas en formato PNG alta resolución juntas en un archivo ZIP"
            >
              <FileArchive className="w-4 h-4 text-[#2E6B48]" />
              <span className="hidden sm:inline">Exportar ZIP</span>
            </button>

            <button
              onClick={() => setShowSpreadsheetModal(true)}
              className="p-1.5 sm:px-2.5 sm:py-1.5 bg-[#FAF6EE] hover:bg-[#EAF3E6] text-[#205735] text-xs font-bold rounded-lg border border-[#A7CCA8] flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
              title="Importar hoja de cálculo con datos de NPCs (Excel, CSV o copiar y pegar de Google Sheets)"
            >
              <FileSpreadsheet className="w-4 h-4 text-[#2E6B48]" />
              <span className="hidden md:inline">Hoja de Cálculo</span>
            </button>

            <button
              onClick={() => setShowBackupModal(true)}
              className="p-1.5 sm:px-2.5 sm:py-1.5 bg-[#FAF6EE] hover:bg-[#EFE6D2] text-[#544230] text-xs font-semibold rounded-lg border border-[#CBB895] flex items-center gap-1.5 transition-all cursor-pointer"
              title="Exportar o importar tus NPCs en formato JSON local"
            >
              <FileJson className="w-4 h-4 text-[#7C5A37]" />
              <span className="hidden lg:inline">JSON</span>
            </button>

            <button
              onClick={() => setShowRulesModal(true)}
              className="p-1.5 sm:px-2.5 sm:py-1.5 bg-[#FAF6EE] hover:bg-[#EFE6D2] text-[#544230] text-xs font-semibold rounded-lg border border-[#CBB895] flex items-center gap-1.5 transition-all cursor-pointer"
              title="Consultar manual de reglas rápidas"
            >
              <BookOpen className="w-4 h-4 text-[#7C5A37]" />
              <span className="hidden lg:inline">Reglas Rápidas</span>
            </button>

            <button
              onClick={handleCreateNewNpc}
              className="px-3 py-1.5 bg-[#7C5A37] hover:bg-[#68492A] text-[#FAF6EE] text-xs font-bold rounded-lg shadow-xs flex items-center gap-1 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Nueva Criatura</span>
            </button>
          </div>
        </div>

        {/* Creature Selector Ribbon (Visible when not in Encounters) */}
        {activeTab !== 'encounters' && (
          <div className="bg-[#F4ECE0] border-t border-[#DFD1B8] px-4 sm:px-6 py-2 overflow-x-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[11px] font-bold uppercase text-[#735E46] font-ui">
                Criatura activa:
              </span>
              <div className="flex items-center gap-1.5">
                {npcList.map((npc) => {
                  const isCur = npc.id === currentNpc.id;
                  return (
                    <button
                      key={npc.id}
                      onClick={() => setActiveNpcId(npc.id)}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all truncate max-w-[150px] ${
                        isCur
                          ? 'bg-[#7C5A37] text-white border-[#5A3F24] shadow-xs'
                          : 'bg-[#FAF6EE] text-[#473624] border-[#D5C4A4] hover:bg-[#EAE0CA]'
                      }`}
                    >
                      {npc.name}
                    </button>
                  );
                })}
              </div>

              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border hidden sm:inline-flex items-center gap-1 transition-all ${
                  currentValidation.isValid
                    ? 'bg-[#E3EEE0] text-[#2D5A27] border-[#BCD4B4]'
                    : 'bg-[#FDF0DB] text-[#8C5214] border-[#E8CD9E]'
                }`}
                title={currentValidation.summary}
              >
                {currentValidation.isValid ? '✓ Equilibrada' : '⚠️ Revisar'}
              </span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => setShowPrintSheetModal(true)}
                className="text-[11px] text-[#4E3923] hover:text-[#2E1F12] font-semibold flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#FAF6EE] hover:bg-[#EAE0CA] border border-[#D5C4A4] shadow-2xs transition-colors cursor-pointer"
                title="Armar e imprimir planillas automáticas de 8 cartas para Oficio o Carta"
              >
                <Layers className="w-3.5 h-3.5 text-[#7C5A37]" />
                <span className="hidden sm:inline">Planilla 8 Cartas</span>
              </button>

              <button
                onClick={() => setShowZipModal(true)}
                className="text-[11px] text-[#245D3B] hover:text-[#184428] font-semibold flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#FAF6EE] hover:bg-[#EAF3E6] border border-[#A7CCA8] shadow-2xs transition-colors cursor-pointer"
                title="Exportar todas las cartas en formato PNG en un archivo ZIP"
              >
                <FileArchive className="w-3.5 h-3.5 text-[#2E6B48]" />
                <span className="hidden sm:inline">ZIP Cartas</span>
              </button>

              <button
                onClick={() => setShowSpreadsheetModal(true)}
                className="text-[11px] text-[#245D3B] hover:text-[#184428] font-semibold flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#FAF6EE] hover:bg-[#EAF3E6] border border-[#A7CCA8] shadow-2xs transition-colors cursor-pointer"
                title="Importar una hoja de cálculo con varias criaturas"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-[#2E6B48]" />
                <span className="hidden md:inline">Importar Hoja</span>
              </button>

              <button
                onClick={handleDuplicateCurrentNpc}
                className="text-[11px] text-[#423220] hover:text-[#261C12] font-semibold flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#FAF6EE] hover:bg-[#EAE0CA] border border-[#D5C4A4] shadow-2xs transition-colors cursor-pointer"
                title="Duplicar y crear una copia de esta criatura"
              >
                <Copy className="w-3.5 h-3.5 text-[#7C5A37]" />
                Duplicar
              </button>

              <button
                onClick={handleDeleteCurrentNpc}
                className="text-[11px] text-[#8C3A2A] hover:text-[#5E1F14] font-medium flex items-center gap-1 px-2 py-0.5 rounded hover:bg-[#F2D6D0] transition-colors"
                title="Eliminar esta criatura"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Eliminar
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Main App Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {activeTab === 'editor' && (
          <NpcEditor
            npc={currentNpc}
            onChange={handleUpdateCurrentNpc}
            onLoadPrebuilt={handleLoadPrebuilt}
            onOpenBackupModal={() => setShowBackupModal(true)}
            onDuplicateNpc={handleDuplicateCurrentNpc}
          />
        )}

        {activeTab === 'card' && (
          <CollectibleCard
            npc={currentNpc}
            stats={currentStats}
            availableNpcs={npcList}
            onUpdateDamagedBarriers={(damaged) => {
              handleUpdateCurrentNpc((prev) => ({
                ...prev,
                currentDamagedBarriers: damaged
              }));
            }}
            onUpdateImageFit={(fit) => {
              handleUpdateCurrentNpc((prev) => ({
                ...prev,
                imageFit: fit
              }));
            }}
            onUpdateAvatarUrl={(url, initialFit) => {
              handleUpdateCurrentNpc((prev) => ({
                ...prev,
                avatarUrl: url || undefined,
                avatarPreset: url ? undefined : prev.avatarPreset,
                ...(initialFit ? { imageFit: initialFit } : {})
              }));
            }}
            onUpdateAvatarPreset={(presetId) => {
              handleUpdateCurrentNpc((prev) => ({
                ...prev,
                avatarUrl: undefined,
                avatarPreset: presetId
              }));
            }}
            onUpdateColorTheme={(color) => {
              handleUpdateCurrentNpc((prev) => ({
                ...prev,
                cardColorTheme: color
              }));
            }}
            onUpdateFrameTheme={(frameTheme) => {
              handleUpdateCurrentNpc((prev) => ({
                ...prev,
                cardFrameTheme: frameTheme
              }));
            }}
          />
        )}

        {activeTab === 'designSheet' && (
          <DesignSheet npc={currentNpc} stats={currentStats} />
        )}

        {activeTab === 'encounters' && (
          <EncounterBuilder
            availableNpcs={npcList}
            onSelectNpcForView={(npc) => {
              setActiveNpcId(npc.id);
              setActiveTab('card');
            }}
          />
        )}
      </main>

      {/* Quick Rules Modal */}
      <QuickRulesModal
        isOpen={showRulesModal}
        onClose={() => setShowRulesModal(false)}
      />

      {/* JSON Backup & Restore Modal */}
      <JsonBackupModal
        isOpen={showBackupModal}
        onClose={() => setShowBackupModal(false)}
        npcs={npcList}
        onImportNpcs={handleImportNpcs}
        onOpenSpreadsheetImport={() => setShowSpreadsheetModal(true)}
      />

      {/* Spreadsheet Import (Excel / CSV / Google Sheets) Modal */}
      <SpreadsheetImportModal
        isOpen={showSpreadsheetModal}
        onClose={() => setShowSpreadsheetModal(false)}
        npcs={npcList}
        onImportNpcs={handleImportNpcs}
      />

      {/* 8-Card Print Sheet Modal (Oficio, Carta, Bleed, Cut Guides) */}
      <PrintSheetModal
        isOpen={showPrintSheetModal}
        onClose={() => setShowPrintSheetModal(false)}
        currentNpc={currentNpc}
        availableNpcs={npcList}
        onOpenZipExport={() => setShowZipModal(true)}
      />

      {/* ZIP Archive Export Modal (All Cards PNG in ZIP) */}
      <ZipExportModal
        isOpen={showZipModal}
        onClose={() => setShowZipModal(false)}
        npcs={npcList}
        currentNpcId={activeNpcId}
      />

      {/* Footer */}
      <footer className="bg-[#F0E8D7] border-t border-[#D8C7A5] py-4 text-center text-xs text-[#735F48] font-ui no-print mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Sistema Papa Tumbay — Suplemento de Creación de NPC Borrador v0.4</span>
          <span>Diseño cuidado para impresión y descanso visual en tonos crema y pergamino</span>
        </div>
      </footer>
    </div>
  );
}
