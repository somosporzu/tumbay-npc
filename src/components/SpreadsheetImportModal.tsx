import React, { useState, useRef } from 'react';
import { NpcData } from '../types/npc';
import {
  parseSpreadsheetFile,
  parseSpreadsheetText,
  downloadExcelTemplate,
  downloadCsvTemplate,
  exportNpcsToExcel,
  exportNpcsToCsv,
  getSampleTsvText,
  SpreadsheetParseResult,
  SAMPLE_SPREADSHEET_NPCS
} from '../utils/spreadsheetImportUtils';
import { calculateNpcStats } from '../utils/calculator';
import {
  X,
  FileSpreadsheet,
  Upload,
  ClipboardPaste,
  FileDown,
  CheckCircle2,
  AlertCircle,
  Copy,
  RefreshCw,
  Sparkles,
  Info,
  Check,
  Shield,
  Zap,
  Download,
  ChevronRight,
  HelpCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface SpreadsheetImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportNpcs: (imported: NpcData[], mode: 'merge' | 'replace') => void;
  npcs: NpcData[];
}

type InputMethod = 'file' | 'paste' | 'template';

export const SpreadsheetImportModal: React.FC<SpreadsheetImportModalProps> = ({
  isOpen,
  onClose,
  onImportNpcs,
  npcs
}) => {
  const currentNpcCount = npcs.length;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeMethod, setActiveMethod] = useState<InputMethod>('file');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [pastedText, setPastedText] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [parseResult, setParseResult] = useState<SpreadsheetParseResult | null>(null);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [copiedClip, setCopiedClip] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleFile = async (file: File) => {
    setFileName(file.name);
    setErrorMessage('');
    setSuccessMessage('');
    setIsProcessing(true);

    try {
      const result = await parseSpreadsheetFile(file);
      setParseResult(result);
      if (result.success && result.rows.length > 0) {
        setSelectedIndices(new Set(result.rows.map((_, i) => i)));
      } else {
        setErrorMessage(result.error || 'No se pudieron extraer criaturas válidas.');
      }
    } catch (err) {
      setErrorMessage(`Error al procesar el archivo: ${(err as Error).message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handlePasteSubmit = () => {
    if (!pastedText.trim()) {
      setErrorMessage('Por favor pega filas copiadas de tu hoja de cálculo.');
      return;
    }
    setErrorMessage('');
    setSuccessMessage('');
    setIsProcessing(true);

    try {
      const result = parseSpreadsheetText(pastedText);
      setParseResult(result);
      if (result.success && result.rows.length > 0) {
        setSelectedIndices(new Set(result.rows.map((_, i) => i)));
      } else {
        setErrorMessage(result.error || 'No se reconocieron columnas de Papa Tumbay en el texto.');
      }
    } catch (err) {
      setErrorMessage(`Error: ${(err as Error).message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLoadSampleDataset = () => {
    const tsv = getSampleTsvText();
    const result = parseSpreadsheetText(tsv);
    setParseResult(result);
    setFileName('10_criaturas_ejemplo_papa_tumbay.xlsx');
    setPastedText(tsv);
    setSelectedIndices(new Set(result.rows.map((_, i) => i)));
    setSuccessMessage('¡Se cargaron 10 criaturas de prueba con rangos y rasgos calibrados!');
  };

  const handleCopySampleToClipboard = () => {
    const tsv = getSampleTsvText();
    navigator.clipboard.writeText(tsv).then(() => {
      setCopiedClip(true);
      setTimeout(() => setCopiedClip(false), 2500);
    });
  };

  const toggleSelectAll = () => {
    if (!parseResult) return;
    if (selectedIndices.size === parseResult.rows.length) {
      setSelectedIndices(new Set());
    } else {
      setSelectedIndices(new Set(parseResult.rows.map((_, i) => i)));
    }
  };

  const toggleIndex = (index: number) => {
    setSelectedIndices((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const handleCommitImport = () => {
    if (!parseResult || selectedIndices.size === 0) return;

    const toImport = parseResult.rows
      .filter((_, i) => selectedIndices.has(i))
      .map((r) => r.npc);

    onImportNpcs(toImport, importMode);

    try {
      confetti({ particleCount: 50, spread: 80, origin: { y: 0.6 } });
    } catch {}

    setSuccessMessage(
      `¡Se importaron ${toImport.length} criaturas a la aplicación con éxito (${
        importMode === 'merge' ? 'añadidas a tus existentes' : 'reemplazo total'
      })!`
    );

    // Close after a brief moment so user sees feedback, or keep open with clear button
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  const handleReset = () => {
    setParseResult(null);
    setFileName('');
    setPastedText('');
    setErrorMessage('');
    setSelectedIndices(new Set());
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#FAF7F0] rounded-2xl max-w-4xl w-full max-h-[94vh] flex flex-col shadow-2xl border-2 border-[#D9C8A8] overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#D8C7A5] flex items-center justify-between bg-[#FAF6EE]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#2E6B48] text-white rounded-xl shadow-xs">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-heading text-lg sm:text-xl font-black text-[#261E16]">
                  Importar Hoja de Cálculo (Excel / CSV / Google Sheets)
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-[#E6F3E6] text-[#245D3B] rounded-full border border-[#BCE0C3]">
                  Borrador v0.4
                </span>
              </div>
              <p className="text-xs text-[#6B5742] font-serif">
                Convierte filas de una hoja de cálculo en NPCs listos para combate, cartas coleccionables y fichas.
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

        {/* Content Area */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Notifications */}
          {successMessage && (
            <div className="flex items-start gap-2 p-3 bg-[#EEF5E5] border border-[#BFDE9F] text-[#2F591A] rounded-xl text-xs font-semibold animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-[#3F7523]" />
              <div className="flex-1">{successMessage}</div>
              <button onClick={() => setSuccessMessage('')} className="text-[#3F7523] hover:text-[#1F3D10] font-bold">
                ×
              </button>
            </div>
          )}

          {errorMessage && (
            <div className="flex items-start gap-2 p-3 bg-[#FBEDE9] border border-[#E7AEA3] text-[#8C2A1E] rounded-xl text-xs font-semibold animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#A53325]" />
              <div className="flex-1">{errorMessage}</div>
              <button onClick={() => setErrorMessage('')} className="text-[#A53325] hover:text-[#5E1B13] font-bold">
                ×
              </button>
            </div>
          )}

          {/* If no parse result yet: show import method tabs & input zones */}
          {!parseResult && (
            <div className="space-y-4">
              {/* Method Switcher Tabs */}
              <div className="flex flex-wrap items-center gap-1.5 bg-[#EFE8D6] p-1.5 rounded-xl border border-[#D5C4A7]">
                <button
                  type="button"
                  onClick={() => setActiveMethod('file')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    activeMethod === 'file'
                      ? 'bg-[#FAF6EE] text-[#2A2016] shadow-xs'
                      : 'text-[#695642] hover:text-[#2A2016]'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5 text-[#2E6B48]" />
                  <span>Subir Archivo (.xlsx / .csv / .tsv)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveMethod('paste')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    activeMethod === 'paste'
                      ? 'bg-[#FAF6EE] text-[#2A2016] shadow-xs'
                      : 'text-[#695642] hover:text-[#2A2016]'
                  }`}
                >
                  <ClipboardPaste className="w-3.5 h-3.5 text-[#2E6B48]" />
                  <span>Pegar desde Excel / Sheets (Ctrl+V)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveMethod('template')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    activeMethod === 'template'
                      ? 'bg-[#FAF6EE] text-[#2A2016] shadow-xs'
                      : 'text-[#695642] hover:text-[#2A2016]'
                  }`}
                >
                  <FileDown className="w-3.5 h-3.5 text-[#2E6B48]" />
                  <span>Descargar Plantilla & 10 NPCs de Prueba</span>
                </button>
              </div>

              {/* METHOD 1: FILE DRAG & DROP */}
              {activeMethod === 'file' && (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  className={`p-8 border-2 border-dashed rounded-2xl text-center transition-all flex flex-col items-center justify-center gap-3 bg-[#FAF6EE] ${
                    isDragging
                      ? 'border-[#2E6B48] bg-[#EEF5E5] scale-[0.99]'
                      : 'border-[#C8B696] hover:border-[#7C5A37]'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv,.tsv,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                    onChange={handleFileInputChange}
                    className="hidden"
                    id="spreadsheet-file-input"
                  />

                  <div className="w-14 h-14 rounded-2xl bg-[#E2EFD9] text-[#2E6B48] flex items-center justify-center shadow-xs">
                    <FileSpreadsheet className="w-7 h-7" />
                  </div>

                  <div>
                    <h3 className="font-heading font-bold text-base text-[#2E2317]">
                      Arrastra tu hoja de cálculo aquí o haz clic para examinar
                    </h3>
                    <p className="text-xs text-[#705C46] font-serif max-w-md mx-auto mt-1">
                      Admite archivos <strong>.xlsx</strong> (Excel), <strong>.xls</strong>, <strong>.csv</strong> y <strong>.tsv</strong>. No requieres imágenes; la app genera cartas completas y calcula barreras, aptitud y acciones automáticamente.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                    <label
                      htmlFor="spreadsheet-file-input"
                      className="px-4 py-2 bg-[#2E6B48] hover:bg-[#235337] text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer transition-all flex items-center gap-1.5"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Seleccionar Archivo</span>
                    </label>

                    <button
                      type="button"
                      onClick={handleLoadSampleDataset}
                      className="px-3.5 py-2 bg-[#FAF3E2] hover:bg-[#EFE5CD] text-[#543F2A] border border-[#D5C29F] text-xs font-semibold rounded-xl cursor-pointer transition-all flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-[#B87A2B]" />
                      <span>Probar con 10 NPCs de Ejemplo</span>
                    </button>
                  </div>
                </div>
              )}

              {/* METHOD 2: DIRECT PASTE */}
              {activeMethod === 'paste' && (
                <div className="space-y-3 bg-[#FAF6EE] p-5 rounded-2xl border border-[#D8C7A5]">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-black uppercase tracking-wider text-[#3D2E1E]">
                        Pega tus filas directamente desde Excel o Google Sheets
                      </h3>
                      <p className="text-[11.5px] text-[#705C46] font-serif mt-0.5">
                        Selecciona y copia tus celdas (Ctrl+C) en Google Sheets o Excel, luego pégalas (Ctrl+V) en esta caja.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPastedText(getSampleTsvText())}
                      className="text-xs font-semibold text-[#2E6B48] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3" />
                      Pegar datos de prueba
                    </button>
                  </div>

                  <textarea
                    rows={7}
                    value={pastedText}
                    onChange={(e) => setPastedText(e.target.value)}
                    placeholder="Nombre&#9;Rango&#9;Amenaza&#9;Concepto Principal&#9;Conceptos Secundarios&#9;Rasgos&#9;Comportamiento&#10;Lobo de Páramo&#9;Pandilla&#9;1&#9;Cazador en jauría&#9;Olfato agudo&#9;Veloz&#9;Bestia&#10;Bandido Salteador&#9;Cuadrilla&#9;2&#9;Espadachín forajido&#9;Emboscada&#9;Certero&#9;Cobarde"
                    className="w-full p-3 font-mono text-[11px] bg-[#FAF3E2] border border-[#CFBD9D] rounded-xl text-[#2B2117] placeholder-[#A18F76] focus:outline-none focus:ring-2 focus:ring-[#2E6B48]"
                  />

                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setPastedText('')}
                      className="px-3 py-1.5 text-xs text-[#735F48] hover:bg-[#EAE0CF] rounded-lg transition-colors cursor-pointer"
                    >
                      Limpiar
                    </button>
                    <button
                      type="button"
                      onClick={handlePasteSubmit}
                      disabled={!pastedText.trim() || isProcessing}
                      className="px-4 py-2 bg-[#2E6B48] hover:bg-[#235337] disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Convertir Filas en NPCs</span>
                    </button>
                  </div>
                </div>
              )}

              {/* METHOD 3: TEMPLATES & GUIDE */}
              {activeMethod === 'template' && (
                <div className="space-y-4 bg-[#FAF6EE] p-5 rounded-2xl border border-[#D8C7A5]">
                  <div>
                    <h3 className="font-heading font-bold text-sm text-[#2E2317]">
                      Plantillas Oficiales y Columnas Reconocidas
                    </h3>
                    <p className="text-xs text-[#705C46] font-serif mt-0.5">
                      Descarga un archivo listo para abrir en Microsoft Excel, Google Sheets, LibreOffice o Numbers.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={downloadExcelTemplate}
                      className="p-3.5 bg-[#FAF3E2] hover:bg-[#EFE5CD] border border-[#D5C29F] rounded-xl text-left transition-all flex flex-col justify-between gap-2 cursor-pointer shadow-2xs group"
                    >
                      <div>
                        <div className="flex items-center gap-1.5 text-xs font-bold text-[#1F5435]">
                          <FileSpreadsheet className="w-4 h-4 text-[#2E6B48]" />
                          <span>Plantilla Excel (.xlsx)</span>
                        </div>
                        <p className="text-[10.5px] text-[#695642] mt-1 font-serif">
                          Incluye 10 criaturas de ejemplo y pestaña con guía de reglas.
                        </p>
                      </div>
                      <span className="text-[11px] font-bold text-[#2E6B48] flex items-center gap-1">
                        Descargar .xlsx <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={downloadCsvTemplate}
                      className="p-3.5 bg-[#FAF3E2] hover:bg-[#EFE5CD] border border-[#D5C29F] rounded-xl text-left transition-all flex flex-col justify-between gap-2 cursor-pointer shadow-2xs group"
                    >
                      <div>
                        <div className="flex items-center gap-1.5 text-xs font-bold text-[#3B2C1D]">
                          <FileDown className="w-4 h-4 text-[#7C5A37]" />
                          <span>Plantilla CSV (.csv)</span>
                        </div>
                        <p className="text-[10.5px] text-[#695642] mt-1 font-serif">
                          Formato ligero separado por comas universal para cualquier programa.
                        </p>
                      </div>
                      <span className="text-[11px] font-bold text-[#7C5A37] flex items-center gap-1">
                        Descargar .csv <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={handleCopySampleToClipboard}
                      className="p-3.5 bg-[#FAF3E2] hover:bg-[#EFE5CD] border border-[#D5C29F] rounded-xl text-left transition-all flex flex-col justify-between gap-2 cursor-pointer shadow-2xs group"
                    >
                      <div>
                        <div className="flex items-center gap-1.5 text-xs font-bold text-[#5C4223]">
                          <Copy className="w-4 h-4 text-[#8C5D29]" />
                          <span>Copiar al Portapapeles</span>
                        </div>
                        <p className="text-[10.5px] text-[#695642] mt-1 font-serif">
                          {copiedClip ? '¡Copiado! Pega en Google Sheets con Ctrl+V' : 'Copia las 10 filas para pegarlas directamente en Google Sheets.'}
                        </p>
                      </div>
                      <span className="text-[11px] font-bold text-[#8C5D29] flex items-center gap-1">
                        {copiedClip ? '✓ Copiado al portapapeles' : 'Copiar celdas'}
                      </span>
                    </button>
                  </div>

                  {/* Section to Export current NPCs to Excel / CSV */}
                  <div className="p-3.5 bg-[#FAF3E2] rounded-xl border border-[#D5C29F] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h4 className="text-xs font-bold text-[#2A2016] flex items-center gap-1.5">
                        <Download className="w-3.5 h-3.5 text-[#2E6B48]" />
                        Exportar tu lista actual ({npcs.length} criaturas) a Hoja de Cálculo
                      </h4>
                      <p className="text-[11px] text-[#695642] font-serif mt-0.5">
                        Descarga tus criaturas actuales en un archivo Excel o CSV editable.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => exportNpcsToExcel(npcs)}
                        className="px-3 py-1.5 bg-[#2E6B48] hover:bg-[#235337] text-white text-xs font-semibold rounded-lg shadow-2xs transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5" />
                        <span>Exportar Excel (.xlsx)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => exportNpcsToCsv(npcs)}
                        className="px-2.5 py-1.5 bg-[#FAF6EE] hover:bg-[#EAE0CF] text-[#423321] border border-[#CBB895] text-xs font-semibold rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <FileDown className="w-3.5 h-3.5 text-[#7C5A37]" />
                        <span>CSV</span>
                      </button>
                    </div>
                  </div>

                  {/* Summary of accepted column names */}
                  <div className="p-3 bg-[#EFE8D6] rounded-xl border border-[#D5C4A7] text-[11px] text-[#544230] space-y-1">
                    <span className="font-bold block text-[#36291C]">Columnas reconocidas automáticamente:</span>
                    <p className="font-serif">
                      <strong>Nombre</strong> (obligatorio/sugerido) • <strong>Rango</strong> (Pandilla, Cuadrilla, Trío, Dúo, Solo) • <strong>Amenaza</strong> (NA 0 a 11) • <strong>Concepto Principal</strong> • <strong>Conceptos Secundarios</strong> • <strong>Rasgos</strong> (oficiales como <em>Veloz, Certero x2, Piel dura</em> o <em>personalizados</em> con formato <code>Nombre: Efecto</code>) • <strong>Comportamiento</strong> (Bestia, Táctico, etc.) • <strong>Táctica de Combate</strong> • <strong>Cita</strong>
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* If spreadsheet parsed: SHOW INTERACTIVE PREVIEW & SELECTION TABLE */}
          {parseResult && (
            <div className="space-y-4 animate-in fade-in">
              {/* Summary Bar */}
              <div className="p-3.5 bg-[#EAF2E4] border border-[#B8D7A6] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-[#2E6B48] shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold text-[#1C4E2D]">
                      {parseResult.totalFound} criaturas listas para conversión {fileName ? `(${fileName})` : ''}
                    </h4>
                    <p className="text-[11px] text-[#3F6B4C] font-serif">
                      {selectedIndices.size} seleccionadas para importar a tu biblioteca.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={toggleSelectAll}
                    className="px-2.5 py-1 text-xs font-semibold text-[#2E6B48] bg-[#FAF6EE] hover:bg-[#E2ECD9] border border-[#B8D7A6] rounded-lg transition-colors cursor-pointer"
                  >
                    {selectedIndices.size === parseResult.rows.length ? 'Deseleccionar todas' : 'Seleccionar todas'}
                  </button>

                  <button
                    type="button"
                    onClick={handleReset}
                    className="px-2.5 py-1 text-xs font-semibold text-[#66533F] bg-[#FAF6EE] hover:bg-[#EFE5CD] border border-[#D2BF9E] rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Cambiar archivo
                  </button>
                </div>
              </div>

              {/* Mode Selection */}
              <div className="p-3.5 bg-[#FAF6EE] rounded-xl border border-[#D8C7A5] space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#5C452C] block">
                  ¿Cómo deseas agregar estas criaturas a la app?
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setImportMode('merge')}
                    className={`p-2.5 text-left rounded-lg border transition-all cursor-pointer ${
                      importMode === 'merge'
                        ? 'bg-[#FAF6EE] border-[#2E6B48] ring-1 ring-[#2E6B48] shadow-xs'
                        : 'bg-[#EFE8D6] border-[#D5C4A7] hover:bg-[#FAF6EE]'
                    }`}
                  >
                    <div className="text-xs font-bold text-[#1C4E2D] flex items-center gap-1.5">
                      <Copy className="w-3.5 h-3.5 text-[#2E6B48]" />
                      Combinar con las actuales (Recomendado)
                    </div>
                    <div className="text-[10.5px] text-[#695642] mt-0.5">
                      Conserva tus {currentNpcCount} criaturas actuales y añade las {selectedIndices.size} seleccionadas.
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
                    <div className="text-xs font-bold text-[#9E3524] flex items-center gap-1.5">
                      <RefreshCw className="w-3.5 h-3.5 text-[#9E3524]" />
                      Reemplazar lista completa
                    </div>
                    <div className="text-[10.5px] text-[#695642] mt-0.5">
                      Sustituye toda tu lista por las {selectedIndices.size} criaturas importadas.
                    </div>
                  </button>
                </div>
              </div>

              {/* Detected NPC Table */}
              <div className="border border-[#D8C7A5] rounded-xl overflow-hidden bg-[#FAF6EE]">
                <div className="max-h-[300px] overflow-y-auto divide-y divide-[#E6D9C0]">
                  {parseResult.rows.map((row, index) => {
                    const isSelected = selectedIndices.has(index);
                    const stats = calculateNpcStats(row.npc);

                    return (
                      <div
                        key={index}
                        onClick={() => toggleIndex(index)}
                        className={`p-3 transition-colors cursor-pointer flex items-start gap-3 ${
                          isSelected ? 'bg-[#FAF6EE] hover:bg-[#F3EAD8]' : 'bg-[#F2EAE0]/50 opacity-60 hover:opacity-85'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}} // handled by parent onClick
                          className="mt-1 h-4 w-4 rounded border-[#C8B696] text-[#2E6B48] focus:ring-[#2E6B48] cursor-pointer"
                        />

                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-heading font-black text-sm text-[#261E16]">
                              {row.npc.name}
                            </span>

                            {/* Rank badge */}
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#E5D7BF] text-[#4A3926] border border-[#CEBC9B]">
                              {row.npc.rank}
                            </span>

                            {/* Amenaza NA badge */}
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#DFC1A0] text-[#542B0D] border border-[#CAA67E]">
                              Amenaza {row.npc.targetNA}
                            </span>

                            {/* Behavior tag */}
                            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-[#E8E0D0] text-[#5C4B39]">
                              {row.npc.behaviorType}
                            </span>
                          </div>

                          {/* Concepts */}
                          <div className="text-xs text-[#524130] mt-1 flex flex-wrap items-center gap-1">
                            <span className="font-semibold text-[#302417]">{row.npc.mainConcept}</span>
                            {row.npc.secondaryConcepts.length > 0 && (
                              <span className="text-[11px] text-[#78644E]">
                                • {row.npc.secondaryConcepts.join(', ')}
                              </span>
                            )}
                          </div>

                          {/* Calculated Stats preview */}
                          <div className="flex flex-wrap items-center gap-3 mt-1.5 text-[10.5px] text-[#695642]">
                            <span className="flex items-center gap-1 font-mono">
                              <Shield className="w-3 h-3 text-[#2E6B48]" />
                              Barreras: [{stats.finalBarriers.join(', ')}]
                            </span>
                            <span className="flex items-center gap-1 font-mono">
                              <Zap className="w-3 h-3 text-[#B87A2B]" />
                              Aptitud: {stats.finalAptitude >= 0 ? `+${stats.finalAptitude}` : stats.finalAptitude}
                            </span>
                            <span className="flex items-center gap-1 font-mono">
                              <Sparkles className="w-3 h-3 text-[#7C5A37]" />
                              Acciones: {stats.finalActions}
                            </span>
                            {row.npc.selectedTraits.length > 0 && (
                              <span className="text-[#3F6335] font-semibold">
                                Rasgos ({row.npc.selectedTraits.length}):{' '}
                                {row.npc.selectedTraits.map((t) => t.name + (t.count ? ` x${t.count}` : '')).join(', ')}
                              </span>
                            )}
                          </div>

                          {/* Warnings if any */}
                          {row.warnings.length > 0 && (
                            <div className="mt-1 text-[10px] text-[#8C461E] italic flex items-center gap-1">
                              <Info className="w-3 h-3 shrink-0" />
                              <span>{row.warnings.join(' • ')}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-[#D8C7A5] bg-[#FAF6EE] flex items-center justify-between">
          <div className="text-xs text-[#705C46]">
            {parseResult ? (
              <span>
                <strong>{selectedIndices.size}</strong> de {parseResult.totalFound} seleccionadas para importar
              </span>
            ) : (
              <span>Las cartas coleccionables se adaptarán con marcos pergamino y presets temáticos</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[#EFE8D6] hover:bg-[#E2D7BE] text-[#473623] text-xs font-bold rounded-xl border border-[#CDBBA0] transition-colors cursor-pointer"
            >
              Cancelar
            </button>

            {parseResult && (
              <button
                type="button"
                onClick={handleCommitImport}
                disabled={selectedIndices.size === 0}
                className="px-5 py-2 bg-[#2E6B48] hover:bg-[#235337] disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Importar {selectedIndices.size} Criaturas a la App</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
