import React, { useRef, useState } from 'react';
import { useReactToPrint } from 'react-to-print';
import { NpcData, CalculatedNpcStats } from '../types/npc';
import { exportElementAsPdf, exportElementAsPng } from '../utils/exportUtils';
import { isAutomaticStatTrait, getTraitCostForRank } from '../utils/calculator';
import { Download, FileText, Printer, Shield, Sword, Eye, Calculator, Info } from 'lucide-react';

interface DesignSheetProps {
  npc: NpcData;
  stats: CalculatedNpcStats;
}

export const DesignSheet: React.FC<DesignSheetProps> = ({ npc, stats }) => {
  const sheetRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  const handlePrint = useReactToPrint({
    contentRef: sheetRef,
    documentTitle: `ficha_diseno_${npc.name.toLowerCase().replace(/\s+/g, '_')}`,
    onBeforePrint: async () => {
      setIsPrinting(true);
    },
    onAfterPrint: () => {
      setIsPrinting(false);
    },
    pageStyle: `
      @page {
        size: A4 portrait;
        margin: 10mm;
      }
      @media print {
        *, *::before, *::after {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        html, body {
          background: #FAF7F0 !important;
        }
        .no-print {
          display: none !important;
        }
      }
    `
  });

  const handleExportPng = async () => {
    if (!sheetRef.current) return;
    setIsExporting(true);
    try {
      await exportElementAsPng(
        sheetRef.current,
        `ficha_diseno_${npc.name.toLowerCase().replace(/\s+/g, '_')}.png`
      );
    } catch {
      alert('Error exportando imagen de la ficha.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPdf = async () => {
    if (!sheetRef.current) return;
    setIsExporting(true);
    try {
      await exportElementAsPdf(
        sheetRef.current,
        `ficha_diseno_${npc.name.toLowerCase().replace(/\s+/g, '_')}.pdf`,
        'sheet'
      );
    } catch {
      alert('Error exportando PDF de la ficha.');
    } finally {
      setIsExporting(false);
    }
  };

  // Trait breakdown text
  const traitString =
    npc.selectedTraits.length === 0
      ? 'Ninguno. Amenaza efectiva: ' + stats.effectiveThreat + '.'
      : npc.selectedTraits
          .map((t) => {
            const cost = getTraitCostForRank(t, npc.rank);
            if (t.category === 'desventaja' || cost < 0) return `${t.name} (desventaja: +${Math.abs(cost)} Amenaza)`;
            if (cost > 0) return `${t.name} (costo -${cost} Amenaza)`;
            return `${t.name} (costo 0)`;
          })
          .join(', ') +
        `. Amenaza efectiva: ${npc.targetNA}${
          stats.traitsCostSum > 0 ? ` - ${stats.traitsCostSum} [rasgos]` : ''
        }${stats.traitsValueSum > 0 ? ` + ${stats.traitsValueSum} [desventajas]` : ''} = ${stats.effectiveThreat}.`;

  // Barriers math breakdown according to Borrador v0.4
  const deltaStr = stats.threatDelta >= 0 ? `+${stats.threatDelta}` : `${stats.threatDelta}`;
  const barriersBreakdown = `${stats.finalBarriers.length}. Base ND ${stats.baseBarriers.join(
    ' / '
  )} + (${stats.effectiveThreat} - ${stats.rankBaseThreat} [Amenaza base]) = ${stats.baseBarriers
    .map((b) => b + stats.threatDelta)
    .join(' / ')}${
    npc.selectedTraits.some((t) => t.id === 'piel_dura') ? '; luego +2 por Piel dura' : ''
  }${
    npc.selectedTraits.some((t) => t.id === 'fragil') ? '; luego -2 por Frágil' : ''
  }${
    npc.selectedTraits.some((t) => t.id === 'fragil_primera_barrera') ? '; -2 en la Barrera I' : ''
  }${
    npc.selectedTraits.some((t) => t.id === 'sin_una_barrera') ? '; pierde barrera más alta por Sin una Barrera' : ''
  }${
    npc.selectedTraits.some((t) => t.id === 'barrera_extra') ? '; repite la más alta por Barrera extra' : ''
  }: ND ${stats.finalBarriers.join(' / ')}.`;

  return (
    <div className="flex flex-col items-center w-full max-w-3xl mx-auto">
      {/* Top Toolbar */}
      <div className="w-full mb-4 flex flex-wrap items-center justify-between gap-3 p-3 bg-[#FAF6EE] rounded-xl border border-[#DFD3BE] shadow-xs no-print">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-[#7C5A37]" />
          <span className="text-xs font-bold text-[#453727] font-ui">
            Ficha de Criatura — Modo Diseño (Página 10 del Suplemento)
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportPng}
            disabled={isExporting}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#EFE8D6] hover:bg-[#E5DCBF] text-[#3D3020] text-xs font-semibold rounded-lg border border-[#CEBF9E] transition-all disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5 text-[#73542E]" />
            Descargar PNG
          </button>
          <button
            onClick={handleExportPdf}
            disabled={isExporting || isPrinting}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#7C5A37] hover:bg-[#68492A] text-[#FAF6ED] text-xs font-semibold rounded-lg shadow-xs transition-all disabled:opacity-50 cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-[#EFE8D6]" />
            Descargar PDF
          </button>
          <button
            onClick={() => handlePrint()}
            disabled={isPrinting || isExporting}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FAF6ED] hover:bg-[#EBE2CD] text-[#524434] text-xs font-medium rounded-lg border border-[#CEBF9E] transition-all cursor-pointer disabled:opacity-50"
            title="Imprimir directamente la ficha oficial"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>{isPrinting ? 'Preparando...' : 'Imprimir'}</span>
          </button>
        </div>
      </div>

      {/* Main Design Sheet */}
      <div
        ref={sheetRef}
        id="papa-tumbay-design-sheet"
        className="w-full bg-[#FAF7F0] text-[#29221B] rounded-2xl p-6 sm:p-8 border-2 border-[#D5C4A4] shadow-md relative overflow-hidden"
        style={{
          backgroundImage:
            'radial-gradient(#E8DFC9 0.75px, transparent 0.75px), radial-gradient(#E8DFC9 0.75px, #FAF7F0 0.75px)',
          backgroundSize: '28px 28px',
          backgroundPosition: '0 0, 14px 14px'
        }}
      >
        {/* Subtle decorative corners */}
        <div className="absolute top-3 left-3 text-xs text-[#9E876A]">❖</div>
        <div className="absolute top-3 right-3 text-xs text-[#9E876A]">❖</div>
        <div className="absolute bottom-3 left-3 text-xs text-[#9E876A]">❖</div>
        <div className="absolute bottom-3 right-3 text-xs text-[#9E876A]">❖</div>

        {/* Header */}
        <div className="border-b-2 border-[#8C6D44] pb-4 mb-6 text-center">
          <div className="text-[11px] font-bold tracking-widest uppercase text-[#7D6448] mb-1">
            SISTEMA PAPA TUMBAY — SUPLEMENTO PARA EL DIRECTOR
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-black text-[#261E16] tracking-wide">
            Ficha de Diseño de NPC
          </h1>
          <p className="text-xs text-[#6B5741] mt-1 font-serif italic">
            Cómo construir criaturas, enemigos y jefes con tres números, unos Conceptos y unos pocos rasgos
          </p>
        </div>

        {/* Official Layout Table (Matching page 10 of the PDF) */}
        <div className="bg-[#FAF6EE] border-2 border-[#CBB894] rounded-xl overflow-hidden shadow-xs mb-6">
          <table className="w-full border-collapse text-xs sm:text-sm">
            <tbody>
              {/* Nombre */}
              <tr className="border-b border-[#D8C7A5]">
                <td className="w-1/3 sm:w-1/4 p-2.5 sm:p-3 bg-[#EFE6D2] font-heading font-bold text-[#453625] border-r border-[#D8C7A5]">
                  Nombre
                </td>
                <td className="p-2.5 sm:p-3 font-semibold text-[#201812] text-base">
                  {npc.name || 'Sin nombre asignado'}
                </td>
              </tr>

              {/* Concepto principal */}
              <tr className="border-b border-[#D8C7A5]">
                <td className="p-2.5 sm:p-3 bg-[#EFE6D2] font-heading font-bold text-[#453625] border-r border-[#D8C7A5]">
                  Concepto principal
                </td>
                <td className="p-2.5 sm:p-3 text-[#292017]">
                  <span className="font-semibold">{npc.mainConcept || 'No especificado'}</span>
                  <span className="text-xs text-[#73604B] ml-2 italic">
                    (Identidad y acción característica, suele aplicar a su ataque: 3d6 conservando los 2 más altos)
                  </span>
                </td>
              </tr>

              {/* Conceptos secundarios */}
              <tr className="border-b border-[#D8C7A5]">
                <td className="p-2.5 sm:p-3 bg-[#EFE6D2] font-heading font-bold text-[#453625] border-r border-[#D8C7A5]">
                  Conceptos secundarios
                </td>
                <td className="p-2.5 sm:p-3 text-[#292017]">
                  {npc.secondaryConcepts.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {npc.secondaryConcepts.map((sc, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 bg-[#FAF7F0] border border-[#CDBAA0] rounded-md text-xs font-medium text-[#453625]"
                        >
                          ✦ {sc}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-[#877561] italic">Ninguno</span>
                  )}
                </td>
              </tr>

              {/* Rango */}
              <tr className="border-b border-[#D8C7A5]">
                <td className="p-2.5 sm:p-3 bg-[#EFE6D2] font-heading font-bold text-[#453625] border-r border-[#D8C7A5]">
                  Rango
                </td>
                <td className="p-2.5 sm:p-3 font-semibold text-[#292017]">
                  <span className="px-2 py-0.5 bg-[#E8DEC7] rounded text-xs font-bold mr-2 uppercase">
                    {npc.rank}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-xs font-bold mr-2 uppercase ${
                    (npc.unitFormation || (npc.rank === 'Pandilla' || npc.rank === 'Cuadrilla' ? 'Cuadrilla' : 'Solitario')) === 'Cuadrilla'
                      ? 'bg-[#7C5A37] text-white'
                      : 'bg-[#4A5D3E] text-white'
                  }`}>
                    {npc.unitFormation || (npc.rank === 'Pandilla' || npc.rank === 'Cuadrilla' ? 'Cuadrilla' : 'Solitario')}
                  </span>
                  {npc.rankVariant && npc.rankVariant !== 'normal' && (
                    <span className="text-xs text-[#7A624A] font-medium mr-2">
                      Variante: {npc.rankVariant}
                    </span>
                  )}
                  <span className="text-xs text-[#6B5A47] font-normal">
                    (Base: {stats.baseBarriers.length} Barrera(s) [ND {stats.baseBarriers.join('/')}], Aptitud {stats.baseAptitude}, Actuar {stats.baseActions})
                  </span>
                </td>
              </tr>

              {/* Amenaza del NPC */}
              <tr className="border-b border-[#D8C7A5]">
                <td className="p-2.5 sm:p-3 bg-[#EFE6D2] font-heading font-bold text-[#453625] border-r border-[#D8C7A5]">
                  Amenaza del NPC
                </td>
                <td className="p-2.5 sm:p-3 text-[#292017] font-semibold">
                  {npc.targetNA}
                  {npc.notes && <span className="text-xs text-[#735F48] font-normal ml-3">({npc.notes})</span>}
                </td>
              </tr>

              {/* Rasgos (costo / valor) */}
              <tr className="border-b border-[#D8C7A5]">
                <td className="p-2.5 sm:p-3 bg-[#EFE6D2] font-heading font-bold text-[#453625] border-r border-[#D8C7A5]">
                  Rasgos (costo / valor)
                </td>
                <td className="p-2.5 sm:p-3 text-[#292017]">
                  <div className="font-medium">{traitString}</div>
                  {npc.selectedTraits.length > 0 && (
                    <div className="mt-2 space-y-1 text-xs">
                      {npc.selectedTraits.map((t) => {
                        const isAuto = isAutomaticStatTrait(t);
                        return (
                          <div key={t.id} className="text-[#544435] flex flex-wrap items-baseline gap-1">
                            <span>•</span>
                            <strong className="text-[#2C2117]">{t.name}:</strong>
                            <span>{t.effect}</span>
                            <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                              isAuto
                                ? 'bg-[#EAE2D2] text-[#614D35] border border-[#D5C6AC]'
                                : 'bg-[#E4ECE0] text-[#2C5224] border border-[#BFD5BA]'
                            }`}>
                              {isAuto ? '📊 Auto-aplicado a estadísticas' : '⚡ Visible en carta'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </td>
              </tr>

              {/* Amenaza efectiva */}
              <tr className="border-b border-[#D8C7A5]">
                <td className="p-2.5 sm:p-3 bg-[#EFE6D2] font-heading font-bold text-[#453625] border-r border-[#D8C7A5]">
                  Amenaza efectiva
                </td>
                <td className="p-2.5 sm:p-3 text-[#292017] font-black text-base">
                  {stats.effectiveThreat}
                  {stats.effectiveThreat !== npc.targetNA && (
                    <span className="text-xs text-[#735F49] font-normal ml-2">
                      (Ajustada por rasgos: base {npc.targetNA} {stats.netTraitModifier >= 0 ? `+ ${stats.netTraitModifier}` : `- ${Math.abs(stats.netTraitModifier)}`})
                    </span>
                  )}
                  <span className="text-xs text-[#7A624A] font-medium ml-2">
                    [Base del Rango: {stats.rankBaseThreat}, delta {stats.threatDelta >= 0 ? `+${stats.threatDelta}` : stats.threatDelta}]
                  </span>
                </td>
              </tr>

              {/* Barreras (ND de cada una) */}
              <tr className="border-b border-[#D8C7A5]">
                <td className="p-2.5 sm:p-3 bg-[#EFE6D2] font-heading font-bold text-[#453625] border-r border-[#D8C7A5]">
                  Barreras (ND de cada una)
                </td>
                <td className="p-2.5 sm:p-3 text-[#292017]">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-black text-base text-[#7C2D12]">
                      {stats.finalBarriers.map((nd, idx) => `ND ${nd}`).join(' / ')}
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 bg-[#FAF0E6] text-[#7C2D12] rounded border border-[#E9CBBB]">
                      Total: {stats.finalBarriers.length} Barrera(s)
                    </span>
                  </div>
                  <div className="text-xs text-[#6B5A47] italic">
                    Desglose v0.4: {barriersBreakdown}
                  </div>
                </td>
              </tr>

              {/* Aptitud */}
              <tr className="border-b border-[#D8C7A5]">
                <td className="p-2.5 sm:p-3 bg-[#EFE6D2] font-heading font-bold text-[#453625] border-r border-[#D8C7A5]">
                  Aptitud
                </td>
                <td className="p-2.5 sm:p-3 text-[#292017]">
                  <span className="font-black text-base mr-2">
                    {stats.finalAptitude}
                  </span>
                  <span className="text-xs text-[#6B5A47]">
                    (Base {stats.baseAptitude} + delta ({stats.effectiveThreat} - {stats.rankBaseThreat})
                    {npc.selectedTraits.some((t) => t.id === 'torpe') ? ' - 2 por Torpe' : ''} = {stats.finalAptitude}).
                    Suma a todas las tiradas: atacar, resistir efectos y fuera de combate.
                  </span>
                </td>
              </tr>

              {/* Actuar */}
              <tr className="border-b border-[#D8C7A5]">
                <td className="p-2.5 sm:p-3 bg-[#EFE6D2] font-heading font-bold text-[#453625] border-r border-[#D8C7A5]">
                  Actuar
                </td>
                <td className="p-2.5 sm:p-3 text-[#292017]">
                  <span className="font-black text-base mr-2">{stats.finalActions}</span>
                  <span className="text-xs text-[#6B5A47]">
                    acción(es) por turno. Cada Actuar es un ataque, conjuro o rasgo activo.
                  </span>
                  {stats.spellsQuota !== undefined && (
                    <div className="mt-1 text-xs font-bold text-[#4A5D3E]">
                      ✦ Rasgo Dotado activo: Cupo de {stats.spellsQuota} conjuros por combate (Actuar + 1).
                    </div>
                  )}
                </td>
              </tr>

              {/* Modo de actuar */}
              <tr>
                <td className="p-2.5 sm:p-3 bg-[#EFE6D2] font-heading font-bold text-[#453625] border-r border-[#D8C7A5]">
                  Modo de actuar
                </td>
                <td className="p-2.5 sm:p-3 text-[#292017]">
                  <div className="font-semibold text-sm mb-0.5">
                    {npc.behaviorType}. {npc.behaviorDescription}
                  </div>
                  <div className="text-xs text-[#73604B] italic">
                    Responde a la pregunta: ¿Qué hace cuando las cosas van mal?
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Mathematical Calibration & Director Reference Box */}
        <div className="bg-[#FAF3E5] border border-[#D5C29E] rounded-xl p-4 text-xs text-[#4E3F30] space-y-2">
          <div className="flex items-center gap-1.5 font-bold text-[#382B1E] uppercase tracking-wider text-[11px]">
            <Calculator className="w-3.5 h-3.5 text-[#825F37]" />
            Guía de Mesa y Reglas de Combate para el Director
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            <div className="space-y-1">
              <div>
                <strong className="text-[#261E16]">Tirada de Ataque:</strong> Tira <strong>2d6 {stats.finalAptitude >= 0 ? `+ ${stats.finalAptitude}` : `- ${Math.abs(stats.finalAptitude)}`}</strong> contra el ND de la Barrera activa del PJ (o <strong>3d6</strong> conservando los 2 más altos si aplica su Concepto principal o relevante).
              </div>
              <div>
                <strong className="text-[#261E16]">Crítico:</strong> Doble 6 en los dados = El personaje pierde una acción.
              </div>
              <div>
                <strong className="text-[#261E16]">Brotar:</strong> Doble 1 en los dados = El NPC pierde su siguiente Actuar.
              </div>
            </div>
            <div className="space-y-1">
              <div>
                <strong className="text-[#261E16]">Resistir Efectos:</strong> Cuando un conjuro de efecto lo afecta, tira <strong>2d6 {stats.finalAptitude >= 0 ? `+ ${stats.finalAptitude}` : `- ${Math.abs(stats.finalAptitude)}`}</strong> contra el ND del conjuro.
              </div>
              <div>
                <strong className="text-[#261E16]">Iniciativa:</strong> Todos los NPCs del mismo bando actúan juntos, antes o después de los personajes.
              </div>
              <div>
                <strong className="text-[#261E16]">Derrota:</strong> Queda derrotado cuando todas sus barreras están rotas (huir, rendirse o caer según la ficción).
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-3 border-t border-[#D5C4A4] flex justify-between items-center text-[10px] text-[#8C7A64]">
          <span>Papa Tumbay — Sistema Modular de Rol</span>
          <span>Ficha Técnica Generada Oficial</span>
        </div>
      </div>
    </div>
  );
};
