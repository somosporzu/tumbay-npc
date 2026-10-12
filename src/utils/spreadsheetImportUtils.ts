import * as XLSX from 'xlsx';
import { NpcData, NpcRank, BehaviorType, Trait } from '../types/npc';
import { OFFICIAL_TRAITS, BEHAVIORS_PRESETS, RANK_BASE_STATS } from '../data/rulesData';

export interface ParsedSpreadsheetRow {
  rowNumber: number;
  raw: Record<string, any>;
  npc: NpcData;
  warnings: string[];
  isValid: boolean;
}

export interface SpreadsheetParseResult {
  success: boolean;
  totalFound: number;
  validCount: number;
  rows: ParsedSpreadsheetRow[];
  headersDetected: string[];
  error?: string;
}

// Normalize strings for fuzzy matching
function normalizeKey(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

// Known header aliases
const HEADER_MAP: Record<string, string[]> = {
  name: ['nombre', 'name', 'criatura', 'npc', 'adversario', 'enemigo', 'personaje', 'titulo', 'creature'],
  rank: ['rango', 'rank', 'categoria', 'tipo', 'clase', 'escala', 'tier'],
  targetNA: ['amenaza', 'na', 'niveldeamenaza', 'targetna', 'threat', 'nivel', 'amenazana', 'dificultad', 'level'],
  mainConcept: ['conceptoprincipal', 'concepto', 'arquetipo', 'rol', 'oficio', 'mainconcept', 'conceptoprimario'],
  secondaryConcepts: ['conceptossecundarios', 'secundarios', 'secundario', 'otrosconceptos', 'secondaryconcepts', 'conceptosextra'],
  traits: ['rasgos', 'rasgo', 'ventajas', 'habilidades', 'talentos', 'traits', 'ventajasydesventajas', 'desventajas'],
  behaviorType: ['comportamiento', 'conducta', 'tactica', 'tacticatipo', 'behavior', 'ia', 'tipodecomportamiento'],
  behaviorDescription: ['descripcioncomportamiento', 'descripciontactica', 'behaviordescription', 'estrategia', 'tacticaespecifica'],
  quote: ['cita', 'frase', 'lore', 'citadescriptiva', 'quote', 'flavor'],
  unitFormation: ['formacion', 'unidad', 'tipounidad', 'formation', 'unitformation'],
  rankVariant: ['variante', 'variant', 'version'],
  notes: ['notas', 'apuntes', 'observaciones', 'notes', 'comentarios']
};

function matchHeaderKey(rawHeader: string): string | null {
  const normalized = normalizeKey(rawHeader);
  for (const [targetKey, aliases] of Object.entries(HEADER_MAP)) {
    if (aliases.includes(normalized)) {
      return targetKey;
    }
  }
  return null;
}

// Rank normalization
export function normalizeRank(raw: any): NpcRank {
  if (typeof raw !== 'string') return 'Cuadrilla';
  const clean = raw.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (clean.includes('pandilla') || clean === 'esbirro' || clean === 'minion' || clean === 'horda' || clean === '6') {
    return 'Pandilla';
  }
  if (clean.includes('cuadrilla') || clean === 'soldado' || clean === 'squad' || clean === '4') {
    return 'Cuadrilla';
  }
  if (clean.includes('trio') || clean === '3') {
    return 'Trío';
  }
  if (clean.includes('duo') || clean === 'elite' || clean === 'campeon' || clean === 'pareja' || clean === '2') {
    return 'Dúo';
  }
  if (clean.includes('solo') || clean === 'jefe' || clean === 'boss' || clean === 'lider' || clean === '1') {
    return 'Solo';
  }
  return 'Cuadrilla';
}

// Behavior normalization
export function normalizeBehavior(raw: any): BehaviorType {
  if (typeof raw !== 'string') return 'Bestia';
  const clean = raw.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (clean.includes('tactico')) return 'Táctico';
  if (clean.includes('cobarde')) return 'Cobarde';
  if (clean.includes('fanatico')) return 'Fanático';
  if (clean.includes('depredador')) return 'Depredador';
  if (clean.includes('vengativo')) return 'Vengativo';
  if (clean.includes('erratico')) return 'Errático';
  if (clean.includes('defensivo')) return 'Defensivo';
  if (clean.includes('personalizado')) return 'Personalizado';
  return 'Bestia';
}

// Smart Avatar preset selection based on creature name/concept/rank
export function inferAvatarPreset(name: string, concept: string, rank: NpcRank): string {
  const combined = `${name} ${concept}`.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  
  if (combined.includes('dragon') || combined.includes('demonio') || combined.includes('volcan') || combined.includes('fuego') || rank === 'Solo') {
    return 'dragon';
  }
  if (combined.includes('ogro') || combined.includes('troll') || combined.includes('coloso') || combined.includes('bruto') || combined.includes('gigante') || rank === 'Dúo') {
    return 'ogre';
  }
  if (combined.includes('golem') || combined.includes('piedra') || combined.includes('roca') || combined.includes('constructo') || combined.includes('hierro')) {
    return 'golem';
  }
  if (
    combined.includes('bandido') ||
    combined.includes('soldado') ||
    combined.includes('guardia') ||
    combined.includes('humano') ||
    combined.includes('ladron') ||
    combined.includes('picaro') ||
    combined.includes('cultista') ||
    combined.includes('guerrero')
  ) {
    return 'bandit';
  }
  return 'wolf';
}

// Parse traits list from text (e.g. "Veloz, Certero x2, Piel dura, Aliento de fuego: Exhala llamas de 2d6")
export function parseTraitsString(rawTraits: string, rank: NpcRank): Trait[] {
  if (!rawTraits || typeof rawTraits !== 'string') return [];

  // Split by comma, semicolon, pipe or newline (unless inside parentheses)
  const tokens = rawTraits
    .split(/[,;\n|]+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 0);

  const parsedTraits: Trait[] = [];

  for (const token of tokens) {
    let traitName = token;
    let traitEffect = '';
    let customCost = 1;
    let customCategory: 'ventaja' | 'menor' | 'desventaja' = 'ventaja';

    // 1. Check if token contains a colon or dash separating name and description:
    // e.g. "Aliento gélido: Exhala una ráfaga de escarcha que inmoviliza al objetivo."
    const colonIndex = token.indexOf(':');
    const dashMatch = token.match(/\s+[-—]\s+/);

    if (colonIndex > 0) {
      traitName = token.substring(0, colonIndex).trim();
      traitEffect = token.substring(colonIndex + 1).trim();
    } else if (dashMatch && dashMatch.index && dashMatch.index > 0) {
      traitName = token.substring(0, dashMatch.index).trim();
      traitEffect = token.substring(dashMatch.index + dashMatch[0].length).trim();
    }

    // 2. Check for cost or category hints in the name or effect, e.g. [costo 2], (menor), (-1)
    const costMatch = traitName.match(/[([{\[]\s*(?:costo\s*)?([+-]?\d+)\s*[)\]}]/i);
    if (costMatch) {
      customCost = parseInt(costMatch[1], 10);
      if (customCost === 0) customCategory = 'menor';
      else if (customCost < 0) customCategory = 'desventaja';
      else customCategory = 'ventaja';
      traitName = traitName.replace(/[([{\[]\s*(?:costo\s*)?[+-]?\d+\s*[)\]}]/i, '').trim();
    } else if (/menor/i.test(traitName)) {
      customCost = 0;
      customCategory = 'menor';
      traitName = traitName.replace(/[([{\[]\s*menor\s*[)\]}]/i, '').trim();
    } else if (/desventaja/i.test(traitName)) {
      customCost = -1;
      customCategory = 'desventaja';
      traitName = traitName.replace(/[([{\[]\s*desventaja\s*[)\]}]/i, '').trim();
    }

    // 3. Check for cumulative count suffix like "Certero x2", "Certero (3)", "Certero 2"
    let count = 1;
    const countMatch = traitName.match(/^(.*?)(?:\s*[xX(]\s*(\d+)\s*\)?|\s+(\d+))$/);
    if (countMatch) {
      traitName = countMatch[1].trim();
      count = parseInt(countMatch[2] || countMatch[3], 10) || 1;
      count = Math.min(3, Math.max(1, count));
    }

    const normalizedName = traitName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    // 4. Try matching with official traits from Papa Tumbay
    const officialMatch = OFFICIAL_TRAITS.find((ot) => {
      const normOfficial = ot.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      return normOfficial === normalizedName || normOfficial.includes(normalizedName) || normalizedName.includes(normOfficial);
    });

    if (officialMatch) {
      parsedTraits.push({
        ...officialMatch,
        effect: traitEffect || officialMatch.effect,
        isCustomized: traitEffect ? true : undefined,
        originalEffect: traitEffect ? officialMatch.effect : undefined,
        count: officialMatch.category === 'acumulable' ? count : undefined
      });
    } else {
      // 5. Valid Custom Trait (creates a first-class custom trait)
      parsedTraits.push({
        id: `custom_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name: traitName,
        effect: traitEffect || 'Habilidad táctica especial definida por el Director.',
        cost: customCost,
        category: customCategory,
        isCustom: true
      });
    }
  }

  return parsedTraits;
}

// Convert 2D table or array of objects into structured Papa Tumbay NpcData
export function convertRowsToNpcData(rawRows: any[][]): SpreadsheetParseResult {
  if (!rawRows || rawRows.length === 0) {
    return {
      success: false,
      totalFound: 0,
      validCount: 0,
      rows: [],
      headersDetected: [],
      error: 'La hoja de cálculo está vacía o no tiene datos legibles.'
    };
  }

  // Find header row: look through the first 5 rows for matching keywords
  let headerRowIndex = -1;
  let headerMapping: Record<number, string> = {};

  for (let r = 0; r < Math.min(5, rawRows.length); r++) {
    const row = rawRows[r];
    if (!Array.isArray(row)) continue;

    let matchedCount = 0;
    const tempMapping: Record<number, string> = {};

    row.forEach((cell, colIndex) => {
      if (cell !== undefined && cell !== null && cell !== '') {
        const strCell = String(cell).trim();
        const matched = matchHeaderKey(strCell);
        if (matched) {
          tempMapping[colIndex] = matched;
          matchedCount++;
        }
      }
    });

    // If at least 2 key headers matched, or name & rank matched
    const hasNameOrRank = Object.values(tempMapping).includes('name') || Object.values(tempMapping).includes('rank');
    if (matchedCount >= 2 || (matchedCount >= 1 && hasNameOrRank)) {
      headerRowIndex = r;
      headerMapping = tempMapping;
      break;
    }
  }

  // If no header found, use positional fallback:
  // Col 0: Name, Col 1: Rank, Col 2: NA, Col 3: MainConcept, Col 4: SecondaryConcepts, Col 5: Traits, Col 6: Behavior, Col 7: BehaviorDesc, Col 8: Quote
  const usePositional = headerRowIndex === -1;
  const startRow = usePositional ? 0 : headerRowIndex + 1;

  const positionalKeys = [
    'name',
    'rank',
    'targetNA',
    'mainConcept',
    'secondaryConcepts',
    'traits',
    'behaviorType',
    'behaviorDescription',
    'quote'
  ];

  const parsedRows: ParsedSpreadsheetRow[] = [];

  for (let r = startRow; r < rawRows.length; r++) {
    const row = rawRows[r];
    if (!Array.isArray(row) || row.every((c) => c === undefined || c === null || String(c).trim() === '')) {
      continue; // Skip completely empty row
    }

    const rowObj: Record<string, any> = {};
    const warnings: string[] = [];

    if (usePositional) {
      row.forEach((cell, colIndex) => {
        if (colIndex < positionalKeys.length) {
          rowObj[positionalKeys[colIndex]] = cell;
        }
      });
    } else {
      row.forEach((cell, colIndex) => {
        const key = headerMapping[colIndex];
        if (key) {
          rowObj[key] = cell;
        }
      });
    }

    // Extract & normalize fields
    const rawName = rowObj['name'];
    const name = rawName && String(rawName).trim() ? String(rawName).trim() : `Criatura #${parsedRows.length + 1}`;
    if (!rawName) {
      warnings.push('Nombre no especificado; se asignó nombre provisional.');
    }

    const rank = normalizeRank(rowObj['rank']);
    const rankStats = RANK_BASE_STATS[rank] || RANK_BASE_STATS['Cuadrilla'];

    // NA (Amenaza)
    let targetNA = rankStats.amenazaBase;
    const rawNA = rowObj['targetNA'];
    if (rawNA !== undefined && rawNA !== null && String(rawNA).trim() !== '') {
      const parsedNum = parseFloat(String(rawNA).replace(',', '.'));
      if (!isNaN(parsedNum)) {
        targetNA = Math.min(11, Math.max(0, Math.round(parsedNum)));
      } else {
        warnings.push(`NA no numérico ("${rawNA}"); se asignó NA base de ${rank} (${targetNA}).`);
      }
    } else {
      warnings.push(`NA no especificado; asignado valor base ${targetNA} de rango ${rank}.`);
    }

    // Main Concept
    const rawMain = rowObj['mainConcept'];
    const mainConcept = rawMain && String(rawMain).trim() ? String(rawMain).trim() : name;

    // Secondary Concepts
    const rawSec = rowObj['secondaryConcepts'];
    let secondaryConcepts: string[] = [];
    if (rawSec && String(rawSec).trim()) {
      secondaryConcepts = String(rawSec)
        .split(/[,;\n|]+/)
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
    }

    // Traits
    const rawTraits = rowObj['traits'];
    const selectedTraits = parseTraitsString(String(rawTraits || ''), rank);

    // Behavior
    const behaviorType = normalizeBehavior(rowObj['behaviorType']);
    let behaviorDescription = '';
    const rawDesc = rowObj['behaviorDescription'];
    if (rawDesc && String(rawDesc).trim()) {
      behaviorDescription = String(rawDesc).trim();
    } else {
      const preset = BEHAVIORS_PRESETS.find((b) => b.type === behaviorType);
      behaviorDescription = preset ? preset.description : 'Lucha de forma instintiva.';
    }

    // Quote
    const quote = rowObj['quote'] && String(rowObj['quote']).trim() ? String(rowObj['quote']).trim() : undefined;

    // Formation
    const rawFormation = rowObj['unitFormation'];
    let unitFormation: 'Cuadrilla' | 'Solitario' =
      rank === 'Pandilla' || rank === 'Cuadrilla' ? 'Cuadrilla' : 'Solitario';
    if (rawFormation && typeof rawFormation === 'string') {
      const fClean = rawFormation.trim().toLowerCase();
      if (fClean.includes('solitari')) unitFormation = 'Solitario';
      else if (fClean.includes('cuadrilla') || fClean.includes('grupo') || fClean.includes('horda'))
        unitFormation = 'Cuadrilla';
    }

    // Variant
    const rawVar = rowObj['rankVariant'];
    let rankVariant: 'normal' | 'debil' | 'veterano' = 'normal';
    if (rawVar && typeof rawVar === 'string') {
      const vClean = rawVar.trim().toLowerCase();
      if (vClean.includes('deb')) rankVariant = 'debil';
      else if (vClean.includes('vet')) rankVariant = 'veterano';
    }

    // Notes
    const notes = rowObj['notes'] && String(rowObj['notes']).trim() ? String(rowObj['notes']).trim() : undefined;

    // Avatar Preset (images not needed, automatic visual preset)
    const avatarPreset = inferAvatarPreset(name, mainConcept, rank);

    const npcData: NpcData = {
      id: `npc_sheet_${Date.now()}_${parsedRows.length}_${Math.random().toString(36).substring(2, 6)}`,
      name,
      quote,
      mainConcept,
      secondaryConcepts,
      rank,
      rankVariant,
      unitFormation,
      targetNA,
      selectedTraits,
      behaviorType,
      behaviorDescription,
      avatarPreset,
      notes
    };

    parsedRows.push({
      rowNumber: r + 1,
      raw: rowObj,
      npc: npcData,
      warnings,
      isValid: true
    });
  }

  const detectedHeadersList = Object.values(headerMapping);

  return {
    success: parsedRows.length > 0,
    totalFound: parsedRows.length,
    validCount: parsedRows.filter((r) => r.isValid).length,
    rows: parsedRows,
    headersDetected: detectedHeadersList,
    error: parsedRows.length === 0 ? 'No se encontraron filas con datos de criaturas válidos.' : undefined
  };
}

/**
 * Parses raw text (TSV / CSV copied from Excel or Google Sheets, or pasted into textarea)
 */
export function parseSpreadsheetText(rawText: string): SpreadsheetParseResult {
  if (!rawText || !rawText.trim()) {
    return {
      success: false,
      totalFound: 0,
      validCount: 0,
      rows: [],
      headersDetected: [],
      error: 'El texto ingresado está vacío.'
    };
  }

  try {
    // SheetJS XLSX.read works with string data as well
    const workbook = XLSX.read(rawText, { type: 'string' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rawRows = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1 });
    return convertRowsToNpcData(rawRows);
  } catch (err) {
    // Fallback: manual TSV / CSV row splitter
    try {
      const lines = rawText.split(/\r?\n/).filter((l) => l.trim().length > 0);
      const isTab = rawText.includes('\t');
      const delimiter = isTab ? '\t' : (rawText.includes(';') ? ';' : ',');
      
      const rawRows = lines.map((line) => {
        // Simple CSV parser supporting quotes
        const result: string[] = [];
        let cur = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === delimiter && !inQuotes) {
            result.push(cur.trim());
            cur = '';
          } else {
            cur += char;
          }
        }
        result.push(cur.trim());
        return result;
      });

      return convertRowsToNpcData(rawRows);
    } catch (fallbackErr) {
      return {
        success: false,
        totalFound: 0,
        validCount: 0,
        rows: [],
        headersDetected: [],
        error: `Error al procesar el texto: ${(err as Error).message}`
      };
    }
  }
}

/**
 * Parses binary file (.xlsx, .xls, .csv, .tsv) via SheetJS
 */
export async function parseSpreadsheetFile(file: File): Promise<SpreadsheetParseResult> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[firstSheetName];
        const rawRows = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1 });
        resolve(convertRowsToNpcData(rawRows));
      } catch (err) {
        resolve({
          success: false,
          totalFound: 0,
          validCount: 0,
          rows: [],
          headersDetected: [],
          error: `Error al leer el archivo de hoja de cálculo: ${(err as Error).message}`
        });
      }
    };
    reader.onerror = () => {
      resolve({
        success: false,
        totalFound: 0,
        validCount: 0,
        rows: [],
        headersDetected: [],
        error: 'No se pudo leer el archivo seleccionado.'
      });
    };
    reader.readAsArrayBuffer(file);
  });
}

/**
 * 10 Pre-crafted balanced Papa Tumbay creatures sample dataset
 */
export const SAMPLE_SPREADSHEET_NPCS = [
  {
    Nombre: 'Lobo de Páramo',
    Rango: 'Pandilla',
    Amenaza: 1,
    'Concepto Principal': 'Cazador en jauría',
    'Conceptos Secundarios': 'Olfato agudo, Acecho',
    Rasgos: 'Veloz',
    Comportamiento: 'Bestia',
    'Táctica de Combate': 'Rodean a la presa solitaria y atacan al unísono.',
    Cita: 'Un aullido lejano anticipa su emboscada nocturna.'
  },
  {
    Nombre: 'Bandido Salteador',
    Rango: 'Cuadrilla',
    Amenaza: 2,
    'Concepto Principal': 'Espadachín forajido',
    'Conceptos Secundarios': 'Tácticas de emboscada',
    Rasgos: 'Certero',
    Comportamiento: 'Cobarde',
    'Táctica de Combate': 'Busca el flanco y huye si derriban a su camarada.',
    Cita: '¡El oro o el pescuezo, viajero!'
  },
  {
    Nombre: 'Arquero Renegado',
    Rango: 'Cuadrilla',
    Amenaza: 3,
    'Concepto Principal': 'Tirador furtivo',
    'Conceptos Secundarios': 'Puntería de bosque, Camuflaje',
    Rasgos: 'Certero x2, Veloz',
    Comportamiento: 'Táctico',
    'Táctica de Combate': 'Dispara desde la cobertura y retrocede si se acercan.',
    Cita: 'Una flecha silenciosa atraviesa la niebla.'
  },
  {
    Nombre: 'Caballero Deshonrado',
    Rango: 'Trío',
    Amenaza: 4,
    'Concepto Principal': 'Guerrero blindado',
    'Conceptos Secundarios': 'Disciplina marcial, Escudo pesado',
    Rasgos: 'Piel dura, Templado',
    Comportamiento: 'Defensivo',
    'Táctica de Combate': 'Protege el paso estrecho y rechaza los embates.',
    Cita: 'Mi honor pereció, pero mi acero aún corta.'
  },
  {
    Nombre: 'Hechicera del Pantano',
    Rango: 'Trío',
    Amenaza: 4,
    'Concepto Principal': 'Canalizadora de plagas',
    'Conceptos Secundarios': 'Conocimiento oscuro, Alquimia',
    Rasgos: 'Dotado, Arcano',
    Comportamiento: 'Táctico',
    'Táctica de Combate': 'Lanza maleficios debilitantes desde el fango.',
    Cita: 'El lodo reclama lo que la tierra engendra.'
  },
  {
    Nombre: 'Ogro Devorador',
    Rango: 'Dúo',
    Amenaza: 5,
    'Concepto Principal': 'Fuerza descomunal',
    'Conceptos Secundarios': 'Maza de roble, Piel correosa',
    Rasgos: 'Golpe de área, Piel dura',
    Comportamiento: 'Bestia',
    'Táctica de Combate': 'Arremete contra varios a la vez derribando obstáculos.',
    Cita: '¡Huesos crujen, carne tierna!'
  },
  {
    Nombre: 'Campeón Espadachín',
    Rango: 'Dúo',
    Amenaza: 6,
    'Concepto Principal': 'Maestro de la hoja doble',
    'Conceptos Secundarios': 'Duelo mortal, Reflejos fulgurantes',
    Rasgos: 'Ataque doble, Certero x2',
    Comportamiento: 'Depredador',
    'Táctica de Combate': 'Fija al rival más desafiante y descarga ráfagas de estocadas.',
    Cita: 'Un solo parpadeo es tu sentencia.'
  },
  {
    Nombre: 'Gólem de Muralla',
    Rango: 'Dúo',
    Amenaza: 6,
    'Concepto Principal': 'Coloso de granito',
    'Conceptos Secundarios': 'Runas protectoras, Inmune al dolor',
    Rasgos: 'Piel dura, Barrera extra (alta), Lento',
    Comportamiento: 'Defensivo',
    'Táctica de Combate': 'Guarda la puerta principal; no se mueve de su puesto.',
    Cita: 'El paso está vedado por mandato antiguo.'
  },
  {
    Nombre: 'Capitán Sangriento',
    Rango: 'Solo',
    Amenaza: 8,
    'Concepto Principal': 'Señor de la guerra mercenario',
    'Conceptos Secundarios': 'Mando tiránico, Estratega veterano, Dos espadas',
    Rasgos: 'Acción extra, Ataque doble, Aterrador',
    Comportamiento: 'Táctico',
    'Táctica de Combate': 'Intimida a la vanguardia y aprovecha su triple acción.',
    Cita: '¡Por cada gota de mi sangre, cobraré diez de las vuestras!'
  },
  {
    Nombre: 'Draco de Ceniza',
    Rango: 'Solo',
    Amenaza: 9,
    'Concepto Principal': 'Sierpe alada voraz',
    'Conceptos Secundarios': 'Aliento ardiente, Garras de basalto, Vuelo rasante',
    Rasgos: 'Golpe de área, Aterrador, Volador / Trepador / Nadador',
    Comportamiento: 'Depredador',
    'Táctica de Combate': 'Desciende en picada, envuelve la zona en fuego y alza el vuelo.',
    Cita: 'La ceniza cae donde su sombra se posa.'
  }
];

/**
 * Exports current app NPCs to a well-formatted Excel (.xlsx) file
 */
export function exportNpcsToExcel(npcs: NpcData[], fileNamePrefix: string = 'criaturas_papa_tumbay'): void {
  const dateStr = new Date().toISOString().split('T')[0];
  const wb = XLSX.utils.book_new();

  const formatTraitForExport = (t: Trait) => {
    if (t.isCustom && t.effect && !t.effect.startsWith('Habilidad especial importada')) {
      return `${t.name}: ${t.effect}`;
    }
    return t.name + (t.count ? ` x${t.count}` : '');
  };

  const exportRows = npcs.map((npc) => {
    return {
      Nombre: npc.name,
      Rango: npc.rank,
      Amenaza: npc.targetNA,
      'Concepto Principal': npc.mainConcept,
      'Conceptos Secundarios': npc.secondaryConcepts.join(', '),
      Rasgos: npc.selectedTraits.map(formatTraitForExport).join(', '),
      Comportamiento: npc.behaviorType,
      'Táctica de Combate': npc.behaviorDescription,
      Cita: npc.quote || '',
      Formación: npc.unitFormation || (npc.rank === 'Pandilla' || npc.rank === 'Cuadrilla' ? 'Cuadrilla' : 'Solitario'),
      Notas: npc.notes || ''
    };
  });

  const ws = XLSX.utils.json_to_sheet(exportRows);
  ws['!cols'] = [
    { wch: 24 },
    { wch: 14 },
    { wch: 10 },
    { wch: 28 },
    { wch: 32 },
    { wch: 30 },
    { wch: 16 },
    { wch: 45 },
    { wch: 40 },
    { wch: 14 },
    { wch: 30 }
  ];
  XLSX.utils.book_append_sheet(wb, ws, 'Criaturas Papa Tumbay');
  XLSX.writeFile(wb, `${fileNamePrefix}_${dateStr}.xlsx`);
}

/**
 * Exports current app NPCs to CSV format
 */
export function exportNpcsToCsv(npcs: NpcData[], fileNamePrefix: string = 'criaturas_papa_tumbay'): void {
  const dateStr = new Date().toISOString().split('T')[0];
  const wb = XLSX.utils.book_new();

  const formatTraitForExport = (t: Trait) => {
    if (t.isCustom && t.effect && !t.effect.startsWith('Habilidad especial importada')) {
      return `${t.name}: ${t.effect}`;
    }
    return t.name + (t.count ? ` x${t.count}` : '');
  };

  const exportRows = npcs.map((npc) => ({
    Nombre: npc.name,
    Rango: npc.rank,
    Amenaza: npc.targetNA,
    'Concepto Principal': npc.mainConcept,
    'Conceptos Secundarios': npc.secondaryConcepts.join(', '),
    Rasgos: npc.selectedTraits.map(formatTraitForExport).join(', '),
    Comportamiento: npc.behaviorType,
    'Táctica de Combate': npc.behaviorDescription,
    Cita: npc.quote || '',
    Formación: npc.unitFormation || (npc.rank === 'Pandilla' || npc.rank === 'Cuadrilla' ? 'Cuadrilla' : 'Solitario'),
    Notas: npc.notes || ''
  }));

  const ws = XLSX.utils.json_to_sheet(exportRows);
  XLSX.utils.book_append_sheet(wb, ws, 'Criaturas');
  XLSX.writeFile(wb, `${fileNamePrefix}_${dateStr}.csv`, { bookType: 'csv' });
}

/**
 * Downloads a pre-formatted Excel template (.xlsx) with columns, guidelines and 10 ready-to-test NPCs
 */
export function downloadExcelTemplate(): void {
  const wb = XLSX.utils.book_new();

  // Sheet 1: NPCs
  const ws = XLSX.utils.json_to_sheet(SAMPLE_SPREADSHEET_NPCS);
  // Auto column widths
  ws['!cols'] = [
    { wch: 24 }, // Nombre
    { wch: 14 }, // Rango
    { wch: 10 }, // Amenaza
    { wch: 28 }, // Concepto Principal
    { wch: 32 }, // Conceptos Secundarios
    { wch: 30 }, // Rasgos
    { wch: 16 }, // Comportamiento
    { wch: 45 }, // Táctica de Combate
    { wch: 40 }  // Cita
  ];
  XLSX.utils.book_append_sheet(wb, ws, 'Criaturas Papa Tumbay');

  // Sheet 2: Reference Guide for Papa Tumbay rules
  const guideData = [
    {
      Columna: 'Nombre',
      Descripción: 'Nombre de la criatura o adversario.',
      Ejemplo: 'Lobo de Páramo, Soldado Rebelde'
    },
    {
      Columna: 'Rango',
      Descripción: 'Rango oficial del sistema Papa Tumbay v0.4: Pandilla (6), Cuadrilla (4), Trío (3), Dúo (2), Solo (1).',
      Ejemplo: 'Pandilla, Cuadrilla, Trío, Dúo, Solo'
    },
    {
      Columna: 'Amenaza',
      Descripción: 'Nivel de Amenaza (NA). Si se deja vacío, se calcula automáticamente según el rango base.',
      Ejemplo: '0 a 11'
    },
    {
      Columna: 'Concepto Principal',
      Descripción: 'Arquetipo o rol distintivo que otorga tiradas con 3d6.',
      Ejemplo: 'Cazador furtivo, Mago de batalla'
    },
    {
      Columna: 'Conceptos Secundarios',
      Descripción: 'Rasgos o habilidades secundarias separadas por comas.',
      Ejemplo: 'Oído fino, Rastreador, Nocturno'
    },
    {
      Columna: 'Rasgos',
      Descripción: 'Rasgos oficiales (Veloz, Certero x2, Piel dura, etc.) o RASGOS PERSONALIZADOS. Puedes escribir solo el nombre o nombre y descripción con dos puntos (Ej: "Veneno: Reduce las acciones del rival").',
      Ejemplo: 'Veloz, Certero x2, Piel dura, Aliento de fuego: Exhala llamas de 2d6'
    },
    {
      Columna: 'Comportamiento',
      Descripción: 'Tipo de conducta: Bestia, Táctico, Cobarde, Fanático, Depredador, Vengativo, Errático, Defensivo, Personalizado.',
      Ejemplo: 'Bestia, Táctico, Cobarde'
    },
    {
      Columna: 'Táctica de Combate',
      Descripción: 'Instrucciones tácticas de cómo actúa en combate (opcional, tiene valores por defecto).',
      Ejemplo: 'Ataca al personaje más vulnerable.'
    },
    {
      Columna: 'Cita',
      Descripción: 'Frase o lore descriptivo de la criatura (opcional).',
      Ejemplo: 'Acecha en el bosque de piedra.'
    }
  ];

  const wsGuide = XLSX.utils.json_to_sheet(guideData);
  wsGuide['!cols'] = [{ wch: 22 }, { wch: 65 }, { wch: 35 }];
  XLSX.utils.book_append_sheet(wb, wsGuide, 'Guía de Columnas');

  XLSX.writeFile(wb, 'plantilla_npcs_papa_tumbay.xlsx');
}

/**
 * Downloads a pre-formatted CSV template
 */
export function downloadCsvTemplate(): void {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(SAMPLE_SPREADSHEET_NPCS);
  XLSX.utils.book_append_sheet(wb, ws, 'Criaturas');
  XLSX.writeFile(wb, 'plantilla_npcs_papa_tumbay.csv', { bookType: 'csv' });
}

/**
 * Generates TSV text ready to paste directly into Google Sheets or Excel
 */
export function getSampleTsvText(): string {
  const headers = Object.keys(SAMPLE_SPREADSHEET_NPCS[0]);
  const rows = SAMPLE_SPREADSHEET_NPCS.map((item) =>
    headers.map((h) => (item as any)[h] ?? '').join('\t')
  );
  return [headers.join('\t'), ...rows].join('\n');
}
