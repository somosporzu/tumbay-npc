import React, { useState, useRef } from 'react';
import { NpcData } from '../types/npc';
import { exportNpcsToJson, parseAndValidateNpcsJson } from '../utils/backupUtils';
import {
  X,
  Download,
  Upload,
  FileJson,
  CheckCircle,
  AlertCircle,
  Copy,
  RefreshCw,
  Layers,
  Sparkles,
  FileSpreadsheet
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface JsonBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  npcs: NpcData[];
  onImportNpcs: (imported: NpcData[], mode: 'merge' | 'replace') => void;
  onOpenSpreadsheetImport?: () => void;
}

export const JsonBackupModal: React.FC<JsonBackupModalProps> = ({
  isOpen,
  onClose,
  npcs,
  onImportNpcs,
  onOpenSpreadsheetImport
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const [parsedNpcs, setParsedNpcs] = useState<NpcData[] | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  if (!isOpen) return null;

  const handleExport = () => {
    exportNpcsToJson(npcs);
    setSuccessMessage(`Se ha descargado el archivo JSON con las ${npcs.length} criaturas.`);
    try {
      confetti({ particleCount: 25, spread: 60, origin: { y: 0.8 } });
    } catch {}
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setErrorMessage('');
    setSuccessMessage('');

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const result = parseAndValidateNpcsJson(content);
      if (result.success && result.npcs) {
        setParsedNpcs(result.npcs);
      } else {
        setParsedNpcs(null);
        setErrorMessage(result.error || 'Archivo JSON no reconocido.');
      }
    };
    reader.onerror = () => {
      setErrorMessage('No se pudo leer el archivo seleccionado.');
    };
    reader.readAsText(file);
  };

  const handleConfirmImport = () => {
    if (!parsedNpcs || parsedNpcs.length === 0) return;

    onImportNpcs(parsedNpcs, importMode);
    setSuccessMessage(
      `¡Se han importado exitosamente ${parsedNpcs.length} criaturas (${
        importMode === 'merge' ? 'combinadas con tu lista' : 'reemplazo total'
      })!`
    );
    try {
      confetti({ particleCount: 40, spread: 70, origin: { y: 0.6 } });
    } catch {}

    setParsedNpcs(null);
    setFileName('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleResetImportState = () => {
    setParsedNpcs(null);
    setFileName('');
    setErrorMessage('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#FAF7F0] rounded-2xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border-2 border-[#D9C8A8] overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#D8C7A5] flex items-center justify-between bg-[#FAF6EE]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#7C5A37] text-white rounded-xl shadow-xs">
              <FileJson className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-heading text-lg sm:text-xl font-black text-[#261E16]">
                Copia de Seguridad: Importar & Exportar JSON
              </h2>
              <p className="text-xs text-[#6B5742] font-serif">
                Guarda todos tus adversarios en un archivo local o cárgalos en cualquier momento.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-[#735F48] hover:text-[#261E16] hover:bg-[#EAE0CF] rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {/* Notifications */}
          {successMessage && (
            <div className="flex items-start gap-2 p-3 bg-[#EEF5E5] border border-[#BFDE9F] text-[#2F591A] rounded-xl text-xs font-semibold animate-in fade-in">
              <CheckCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#3F7523]" />
              <div className="flex-1">{successMessage}</div>
              <button
                onClick={() => setSuccessMessage('')}
                className="text-[#3F7523] hover:text-[#1F3D10] font-bold"
              >
                ×
              </button>
            </div>
          )}

          {errorMessage && (
            <div className="flex items-start gap-2 p-3 bg-[#FBEDE9] border border-[#E7AEA3] text-[#8C2A1E] rounded-xl text-xs font-semibold animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#A53325]" />
              <div className="flex-1">{errorMessage}</div>
              <button
                onClick={() => setErrorMessage('')}
                className="text-[#A53325] hover:text-[#5E1B13] font-bold"
              >
                ×
              </button>
            </div>
          )}

          {/* Section 1: Export Current NPCs */}
          <div className="p-4 bg-[#FAF3E2] rounded-xl border border-[#DECDB3] space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-heading text-sm font-bold text-[#3B2C1D] flex items-center gap-1.5">
                  <Download className="w-4 h-4 text-[#7C5A37]" />
                  1. Exportar Todos los NPCs Actuales
                </h3>
                <p className="text-xs text-[#6B5742] font-serif mt-0.5">
                  Descarga un archivo <code>.json</code> con todas las estadísticas, rasgos, conceptos y configuraciones de tus criaturas.
                </p>
              </div>

              <button
                type="button"
                onClick={handleExport}
                className="px-3.5 py-2 bg-[#7C5A37] hover:bg-[#68492A] text-white text-xs font-bold rounded-lg shadow-xs flex items-center justify-center gap-1.5 transition-all shrink-0 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Exportar ({npcs.length} NPCs)</span>
              </button>
            </div>

            {/* List preview badge of creatures to export */}
            <div className="pt-2 border-t border-[#DFD1B7]">
              <span className="text-[10.5px] font-bold uppercase text-[#735D46] block mb-1.5">
                Criaturas que se incluirán en la exportación ({npcs.length}):
              </span>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                {npcs.map((n) => (
                  <span
                    key={n.id}
                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#FAF6EE] border border-[#D5C4A7] text-[11px] font-medium text-[#382C1F] rounded-md shadow-2xs"
                  >
                    <span className="font-bold">{n.name}</span>
                    <span className="text-[9.5px] text-[#7A644D]">({n.rank})</span>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Section 2: Import NPCs from JSON */}
          <div className="p-4 bg-[#FAF3E2] rounded-xl border border-[#DECDB3] space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-heading text-sm font-bold text-[#3B2C1D] flex items-center gap-1.5">
                  <Upload className="w-4 h-4 text-[#7C5A37]" />
                  2. Importar NPCs desde Archivo JSON
                </h3>
                <p className="text-xs text-[#6B5742] font-serif mt-0.5">
                  Selecciona un archivo <code>.json</code> previamente guardado para restaurar o añadir adversarios a tu biblioteca.
                </p>
              </div>

              {onOpenSpreadsheetImport && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenSpreadsheetImport();
                  }}
                  className="px-2.5 py-1.5 bg-[#FAF6EE] hover:bg-[#EAE0CA] border border-[#2E6B48]/40 text-[#245B38] text-[11px] font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-[#2E6B48]" />
                  <span>¿Tienes Excel / CSV?</span>
                </button>
              )}
            </div>

            {/* File selector input */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleFileChange}
                className="hidden"
                id="json-file-input"
              />
              <label
                htmlFor="json-file-input"
                className="flex-1 px-3.5 py-2.5 bg-[#FAF6EE] hover:bg-[#EFE8D6] border-2 border-dashed border-[#C5B393] rounded-xl text-center sm:text-left text-xs text-[#473623] font-semibold cursor-pointer transition-colors flex items-center justify-center sm:justify-start gap-2"
              >
                <FileJson className="w-4 h-4 text-[#7C5A37] shrink-0" />
                <span className="truncate">
                  {fileName ? fileName : 'Haz clic para seleccionar tu archivo JSON...'}
                </span>
              </label>

              {parsedNpcs && (
                <button
                  type="button"
                  onClick={handleResetImportState}
                  className="px-2.5 py-2 text-xs font-semibold text-[#7A644E] hover:text-[#3B2C1E] bg-[#EBE0CC] hover:bg-[#DFCFAe] rounded-lg transition-colors cursor-pointer"
                  title="Cambiar archivo"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* If file parsed successfully, show preview and mode options */}
            {parsedNpcs && parsedNpcs.length > 0 && (
              <div className="p-3.5 bg-[#FAF7F0] rounded-xl border border-[#CBB895] space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-[#261E16] flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-[#3E7321]" />
                    {parsedNpcs.length} Criaturas listas para importar
                  </span>
                </div>

                {/* Import Mode selection */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-[#5C452C] block">
                    Modo de importación:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setImportMode('merge')}
                      className={`p-2.5 text-left rounded-lg border transition-all cursor-pointer ${
                        importMode === 'merge'
                          ? 'bg-[#FAF6EE] border-[#7C5A37] ring-1 ring-[#7C5A37] shadow-xs'
                          : 'bg-[#EFE8D6] border-[#D5C4A7] hover:bg-[#FAF6EE]'
                      }`}
                    >
                      <div className="text-xs font-bold text-[#2A2016] flex items-center gap-1">
                        <Copy className="w-3.5 h-3.5 text-[#7C5A37]" />
                        Combinar (Recomendado)
                      </div>
                      <div className="text-[10.5px] text-[#695642] mt-0.5">
                        Conserva tus criaturas actuales y añade las nuevas del archivo.
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setImportMode('replace')}
                      className={`p-2.5 text-left rounded-lg border transition-all cursor-pointer ${
                        importMode === 'replace'
                          ? 'bg-[#FAF6EE] border-[#9E3524] ring-1 ring-[#9E3524] shadow-xs'
                          : 'bg-[#EFE8D6] border-[#D5C4A7] hover:bg-[#FAF6EE]'
                      }`}
                    >
                      <div className="text-xs font-bold text-[#2A2016] flex items-center gap-1">
                        <RefreshCw className="w-3.5 h-3.5 text-[#9E3524]" />
                        Reemplazar Todo
                      </div>
                      <div className="text-[10.5px] text-[#695642] mt-0.5">
                        Sustituye completamente la lista actual por las del archivo.
                      </div>
                    </button>
                  </div>
                </div>

                {/* Preview of creatures to be imported */}
                <div>
                  <span className="text-[10.5px] font-bold uppercase text-[#735D46] block mb-1">
                    Vista previa de criaturas del archivo:
                  </span>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                    {parsedNpcs.map((n, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#FAF3E2] border border-[#DAC8A8] text-[11px] font-medium text-[#2F2418] rounded"
                      >
                        <span className="font-bold">{n.name}</span>
                        <span className="text-[9.5px] text-[#7A644D]">
                          ({n.rank} • NA {n.targetNA})
                        </span>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Confirm import button */}
                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={handleConfirmImport}
                    className="px-4 py-2 bg-[#7C5A37] hover:bg-[#68492A] text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>
                      Confirmar Importación ({parsedNpcs.length} NPCs)
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#D8C7A5] bg-[#FAF6EE] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-[#EFE8D6] hover:bg-[#E2D7BE] text-[#473623] text-xs font-bold rounded-lg border border-[#CDBBA0] transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
