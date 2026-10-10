import { NpcData, NpcRank, BehaviorType } from '../types/npc';

export interface ExportDataStructure {
  system: string;
  version: string;
  exportedAt: string;
  totalNpcs: number;
  npcs: NpcData[];
}

/**
 * Exports an array of NPCs to a formatted local JSON file download.
 */
export function exportNpcsToJson(
  npcs: NpcData[],
  fileNamePrefix: string = 'npcs_papa_tumbay'
): void {
  const dateStr = new Date().toISOString().split('T')[0];
  const fileName = `${fileNamePrefix}_${dateStr}.json`;

  const exportPayload: ExportDataStructure = {
    system: 'Papa Tumbay Borrador v0.4',
    version: '1.0',
    exportedAt: new Date().toISOString(),
    totalNpcs: npcs.length,
    npcs
  };

  const jsonString = JSON.stringify(exportPayload, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Validates and sanitizes imported JSON text into a valid array of NpcData.
 */
export function parseAndValidateNpcsJson(jsonString: string): {
  success: boolean;
  npcs?: NpcData[];
  count?: number;
  error?: string;
} {
  try {
    const parsed = JSON.parse(jsonString);

    let rawList: unknown[] = [];
    if (Array.isArray(parsed)) {
      rawList = parsed;
    } else if (parsed && typeof parsed === 'object') {
      if (Array.isArray(parsed.npcs)) {
        rawList = parsed.npcs;
      } else if (Array.isArray(parsed.data)) {
        rawList = parsed.data;
      } else if (parsed.name && parsed.rank) {
        // Single creature JSON file
        rawList = [parsed];
      }
    }

    if (!Array.isArray(rawList) || rawList.length === 0) {
      return {
        success: false,
        error: 'El archivo JSON no contiene una lista válida de NPCs de Papa Tumbay.'
      };
    }

    const validRanks: NpcRank[] = ['Pandilla', 'Cuadrilla', 'Trío', 'Dúo', 'Solo'];
    const validBehaviors: BehaviorType[] = [
      'Bestia',
      'Táctico',
      'Cobarde',
      'Fanático',
      'Depredador',
      'Vengativo',
      'Errático',
      'Defensivo',
      'Personalizado'
    ];

    const normalizeImportedRank = (raw: any): NpcRank => {
      if (raw === 'Esbirro') return 'Pandilla';
      if (raw === 'Soldado') return 'Cuadrilla';
      if (raw === 'Élite') return 'Dúo';
      if (raw === 'Jefe') return 'Solo';
      if (validRanks.includes(raw)) return raw;
      return 'Cuadrilla';
    };

    const sanitizedList: NpcData[] = [];

    for (let i = 0; i < rawList.length; i++) {
      const item = rawList[i] as any;
      if (!item || typeof item !== 'object') continue;

      // Validate mandatory minimal attributes
      const name = typeof item.name === 'string' && item.name.trim() ? item.name.trim() : `Criatura #${i + 1}`;
      const rank: NpcRank = normalizeImportedRank(item.rank);
      const mainConcept = typeof item.mainConcept === 'string' && item.mainConcept.trim() ? item.mainConcept.trim() : name;

      const sanitizedNpc: NpcData = {
        id: typeof item.id === 'string' && item.id.trim() ? item.id : `npc_imported_${Date.now()}_${i}`,
        name,
        quote: typeof item.quote === 'string' ? item.quote : undefined,
        mainConcept,
        secondaryConcepts: Array.isArray(item.secondaryConcepts)
          ? item.secondaryConcepts.filter((c: any) => typeof c === 'string' && c.trim())
          : [],
        rank,
        rankVariant: item.rankVariant === 'debil' || item.rankVariant === 'veterano' ? item.rankVariant : 'normal',
        unitFormation: item.unitFormation === 'Cuadrilla' || item.unitFormation === 'Solitario'
          ? item.unitFormation
          : (rank === 'Pandilla' || rank === 'Cuadrilla' ? 'Cuadrilla' : 'Solitario'),
        targetNA: typeof item.targetNA === 'number' && !isNaN(item.targetNA) ? Math.max(0, item.targetNA) : 3,
        selectedTraits: Array.isArray(item.selectedTraits)
          ? item.selectedTraits.filter((t: any) => t && typeof t === 'object' && t.name)
          : [],
        behaviorType: validBehaviors.includes(item.behaviorType) ? item.behaviorType : 'Bestia',
        behaviorDescription: typeof item.behaviorDescription === 'string' ? item.behaviorDescription : 'Lucha según su instinto.',
        avatarUrl: typeof item.avatarUrl === 'string' ? item.avatarUrl : undefined,
        avatarPreset: typeof item.avatarPreset === 'string' ? item.avatarPreset : 'wolf',
        imageFit: item.imageFit && typeof item.imageFit === 'object' ? item.imageFit : undefined,
        cardColorTheme: typeof item.cardColorTheme === 'string' ? item.cardColorTheme : undefined,
        notes: typeof item.notes === 'string' ? item.notes : undefined
      };

      sanitizedList.push(sanitizedNpc);
    }

    if (sanitizedList.length === 0) {
      return {
        success: false,
        error: 'No se encontraron criaturas válidas para importar en el archivo JSON.'
      };
    }

    return {
      success: true,
      npcs: sanitizedList,
      count: sanitizedList.length
    };
  } catch (err) {
    return {
      success: false,
      error: `Error al procesar el archivo JSON: ${(err as Error).message}`
    };
  }
}
