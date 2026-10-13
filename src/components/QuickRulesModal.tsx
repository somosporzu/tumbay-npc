import React from 'react';
import { X, BookOpen, Shield, Zap, Sparkles, Swords, AlertTriangle, Dice6 } from 'lucide-react';

interface QuickRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QuickRulesModal: React.FC<QuickRulesModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-[#FAF7F0] rounded-2xl border-2 border-[#CBB895] max-w-2xl w-full max-h-[90vh] shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-[#FAF6EE] border-b border-[#D8C7A5] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#7C5A37]" />
            <div>
              <h3 className="font-heading text-lg font-bold text-[#2A2016]">
                Reglas Rápidas — Sistema Papa Tumbay
              </h3>
              <p className="text-xs text-[#705E4A] font-serif">
                Suplemento para el Director • Creación de NPC Borrador v0.4
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[#7A644D] hover:text-[#2A2016] rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs text-[#3D3020] leading-relaxed">
          {/* Section 1 & 2 */}
          <div className="bg-[#FAF6EE] p-3.5 rounded-xl border border-[#D9C8A8] space-y-2">
            <h4 className="font-heading text-sm font-bold text-[#261E16] flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-[#8C6D44]" />
              ¿Cómo funciona un NPC? (Sección 1 y 2)
            </h4>
            <ul className="list-disc pl-4 space-y-1">
              <li>
                <strong>Atacar:</strong> Tira <strong>2d6 + Aptitud</strong> contra el ND de la Barrera activa del personaje. Si lo iguala o supera, rompe esa Barrera.
              </li>
              <li>
                <strong>Actuar:</strong> Cuántas acciones hace en su turno (atacar, lanzar conjuro o usar un rasgo).
              </li>
              <li>
                <strong>Conceptos:</strong> Le dan <strong>3d6 (conserva los 2 más altos)</strong> cuando son relevantes (su ataque característico o acciones fuera de combate). No cambian los números del NPC.
              </li>
              <li>
                <strong>Crítico (Doble 6):</strong> El personaje defensor pierde una acción.
              </li>
              <li>
                <strong>Brotar (Doble 1):</strong> El NPC pierde su siguiente Actuar.
              </li>
              <li>
                <strong>Resistir:</strong> Cuando un conjuro o efecto lo afecta, tira <strong>2d6 + Aptitud</strong> contra el ND del efecto.
              </li>
              <li>
                <strong>Derrotado:</strong> Cuando todas sus Barreras están rotas (huir, rendirse, quedar inconsciente o morir según la ficción).
              </li>
            </ul>
          </div>

          {/* Section 3: Rangos y Amenaza v0.4 */}
          <div className="bg-[#FAF6EE] p-3.5 rounded-xl border border-[#D9C8A8] space-y-2">
            <h4 className="font-heading text-sm font-bold text-[#261E16] flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-[#8C6D44]" />
              Los 5 Rangos y Fórmula de Amenaza (Borrador v0.4)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-[11px]">
              <div className="p-2 bg-[#FAF7F0] border border-[#CDBAA0] rounded-lg">
                <strong className="block text-[#7C5A37]">Pandilla (6)</strong>
                1 Barrera (ND base 6)<br />
                Aptitud base -2 • Actuar 1<br />
                <span className="text-[10px] text-[#8C6D44] font-semibold">Amenaza base: 0</span><br />
                <span className="text-[9.5px] text-[#69543E]">Típico: 6 criaturas (Lobos, ratas)</span>
              </div>
              <div className="p-2 bg-[#FAF7F0] border border-[#CDBAA0] rounded-lg">
                <strong className="block text-[#6B4E2B]">Cuadrilla (4)</strong>
                2 Barreras (ND 8 / 9)<br />
                Aptitud base 0 • Actuar 1<br />
                <span className="text-[10px] text-[#8C6D44] font-semibold">Amenaza base: 2</span><br />
                <span className="text-[9.5px] text-[#69543E]">Típico: 4 combatientes</span>
              </div>
              <div className="p-2 bg-[#FAF7F0] border border-[#CDBAA0] rounded-lg">
                <strong className="block text-[#5B4F35]">Trío (3)</strong>
                2 Barreras (ND 8 / 9)<br />
                Aptitud base +1 • Actuar 2<br />
                <span className="text-[10px] text-[#8C6D44] font-semibold">Amenaza base: 3</span><br />
                <span className="text-[9.5px] text-[#69543E]">Típico: 3 mercenarios</span>
              </div>
              <div className="p-2 bg-[#FAF7F0] border border-[#CDBAA0] rounded-lg">
                <strong className="block text-[#4A5D3E]">Dúo (2)</strong>
                3 Barreras (ND 10 / 11 / 12)<br />
                Aptitud base +3 • Actuar 2<br />
                <span className="text-[10px] text-[#8C6D44] font-semibold">Amenaza base: 5</span><br />
                <span className="text-[9.5px] text-[#69543E]">Típico: 2 ogros o campeones</span>
              </div>
              <div className="p-2 bg-[#FAF7F0] border border-[#CDBAA0] rounded-lg">
                <strong className="block text-[#8A2B1D]">Solo (1)</strong>
                4 Barreras (ND 13 / 14 / 15 / 16)<br />
                Aptitud base +5 • Actuar 3<br />
                <span className="text-[10px] text-[#8C6D44] font-semibold">Amenaza base: 7</span><br />
                <span className="text-[9.5px] text-[#69543E]">Típico: 1 coloso o dragón</span>
              </div>
            </div>

            <div className="p-2.5 bg-[#F5EEDC] rounded-lg border border-[#DAC9A8] space-y-1 text-[11px] text-[#55402A]">
              <p className="font-bold text-[#3B2B1B]">
                Fórmulas de Escala (Paso 3 y 4 del Suplemento):
              </p>
              <p>• <strong>Amenaza efectiva</strong> = Amenaza de la criatura - costo de ventajas + valor de desventajas</p>
              <p>• <strong>ND de cada Barrera</strong> = ND del Rango + (Amenaza efectiva - Amenaza base del Rango)</p>
              <p>• <strong>Aptitud</strong> = Aptitud del Rango + (Amenaza efectiva - Amenaza base del Rango)</p>
              <p className="text-[10px] text-[#7A5B35] italic">
                * En la ficha y en la carta se anota la Amenaza de la criatura (no la efectiva). La Amenaza efectiva nunca debería bajar de 0.
              </p>
            </div>
          </div>

          {/* Section 4: Rasgos y Magia */}
          <div className="bg-[#FAF6EE] p-3.5 rounded-xl border border-[#D9C8A8] space-y-2">
            <h4 className="font-heading text-sm font-bold text-[#261E16] flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#8C6D44]" />
              Catálogo de Rasgos y Costos Calibrados (Borrador v0.4)
            </h4>
            <ul className="list-disc pl-4 space-y-1 text-[11px]">
              <li>
                <strong>Rasgos en la Carta vs Números:</strong> Los rasgos que modifican estadísticas (como <em>Torpe</em> -2 Aptitud, <em>Piel dura</em> +2 ND, <em>Lento</em> -1 Actuar, <em>Frágil</em> o <em>Barrera extra</em>) se calculan directamente en las estadísticas de la carta y no ocupan espacio en el cuadro de rasgos tácticos.
              </li>
              <li>
                <strong>Costos calibrados por Rango:</strong> En v0.4, rasgos de gran impacto como <em>Acción extra</em> o <em>Golpe de área</em> tienen costo proporcional (por ejemplo, Acción extra cuesta 3 en Pandilla/Cuadrilla, 2 en Trío/Dúo, 1 en Solo).
              </li>
              <li>
                <strong>Magia de NPC (Rasgo Dotado, Costo 2):</strong> Permite lanzar conjuros con las mismas reglas que los personajes (usa Aptitud en lugar de Presencia). Su cupo de conjuros por combate es <strong>Actuar + 1</strong>.
              </li>
              <li>
                <strong>Regeneración (Costo variable por Rango):</strong> Recupera su Barrera rota de ND más alto al empezar su turno (costo 0 en Pandilla, 2 en Cuadrilla/Trío, 3 en Dúo/Solo).
              </li>
              <li>
                <strong>Límite de Rasgos con costo:</strong> Pandilla y Cuadrilla (máx. 1), Trío y Dúo (máx. 2), Solo (máx. 3).
              </li>
            </ul>
          </div>

          {/* Section 5: Modos de actuar */}
          <div className="bg-[#FAF6EE] p-3.5 rounded-xl border border-[#D9C8A8] space-y-2">
            <h4 className="font-heading text-sm font-bold text-[#261E16] flex items-center gap-1.5">
              <Swords className="w-4 h-4 text-[#8C6D44]" />
              Modos de Actuar (Sección 4 v0.3)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[10.5px]">
              <div className="p-1.5 bg-[#FAF7F0] rounded border border-[#DACBB0]">
                <strong>Bestia:</strong> Ataca al más cercano o al azar. Huye o se rinde cuando pierde la mitad de sus Barreras.
              </div>
              <div className="p-1.5 bg-[#FAF7F0] rounded border border-[#DACBB0]">
                <strong>Táctico:</strong> Ataca al más herido. Protege a su líder y se reagrupa.
              </div>
              <div className="p-1.5 bg-[#FAF7F0] rounded border border-[#DACBB0]">
                <strong>Cobarde:</strong> Huye si pierde su primera Barrera.
              </div>
              <div className="p-1.5 bg-[#FAF7F0] rounded border border-[#DACBB0]">
                <strong>Fanático:</strong> Lucha hasta quedar derrotado. Nunca se rinde.
              </div>
              <div className="p-1.5 bg-[#FAF7F0] rounded border border-[#DACBB0]">
                <strong>Depredador:</strong> Elige a su víctima y la persigue; ignora a los demás mientras pueda.
              </div>
              <div className="p-1.5 bg-[#FAF7F0] rounded border border-[#DACBB0]">
                <strong>Vengativo:</strong> Ataca a quien lo atacó previamente.
              </div>
              <div className="p-1.5 bg-[#FAF7F0] rounded border border-[#DACBB0]">
                <strong>Errático:</strong> Actúa sin sentido ni lógica.
              </div>
              <div className="p-1.5 bg-[#FAF7F0] rounded border border-[#DACBB0] sm:col-span-2">
                <strong>Defensivo:</strong> Se preocupa más de mantenerse con vida que de atacar a otros.
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-[#FAF6EE] border-t border-[#D8C7A5] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#7C5A37] hover:bg-[#68492A] text-white text-xs font-bold rounded-lg transition-all"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
