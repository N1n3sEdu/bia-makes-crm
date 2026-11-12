'use client';

import React from 'react';
import { HourlyHeatmapCell } from '@/types/analytics';
import { Sparkles } from 'lucide-react';

interface TrafficHeatmapProps {
  cells: HourlyHeatmapCell[];
  peakInsight: string;
}

const DAYS_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const HOURS_SAMPLE = [0, 3, 6, 9, 12, 15, 18, 21];

export function TrafficHeatmap({ cells, peakInsight }: TrafficHeatmapProps) {
  // Mapear visitas em matriz [dow][hour]
  const matrix: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));
  let maxVisits = 1;

  cells.forEach((c) => {
    if (c.dayOfWeek >= 0 && c.dayOfWeek < 7 && c.hour >= 0 && c.hour < 24) {
      matrix[c.dayOfWeek][c.hour] = c.visits;
      if (c.visits > maxVisits) maxVisits = c.visits;
    }
  });

  const getCellColor = (val: number) => {
    if (val === 0) return 'bg-stone-100/70';
    const intensity = val / maxVisits;
    if (intensity < 0.2) return 'bg-[#FAF0F4]';
    if (intensity < 0.4) return 'bg-[#F5DDE5]';
    if (intensity < 0.7) return 'bg-[#C69A76]';
    if (intensity < 0.9) return 'bg-[#9C5B6F]';
    return 'bg-[#7A3F51]';
  };

  return (
    <div className="space-y-3">
      {/* Grade 7x24 */}
      <div className="overflow-x-auto pb-1">
        <div className="min-w-[420px]">
          {/* Header das horas */}
          <div className="grid grid-cols-25 gap-1 mb-1 text-[9px] text-stone-400 font-mono text-center">
            <div className="w-6"></div>
            {Array.from({ length: 24 }).map((_, h) => (
              <div key={h} className="truncate">
                {h % 4 === 0 ? `${h}h` : ''}
              </div>
            ))}
          </div>

          {/* Linhas por dia da semana */}
          {matrix.map((row, dow) => (
            <div key={dow} className="grid grid-cols-25 gap-1 items-center mb-1">
              <div className="w-6 text-[10px] font-bold text-stone-500 text-left">
                {DAYS_SHORT[dow]}
              </div>
              {row.map((val, hour) => (
                <div
                  key={hour}
                  title={`${DAYS_SHORT[dow]}, ${hour}h: ${val} acessos`}
                  className={`h-4 rounded-sm transition-all hover:ring-2 hover:ring-[#7A3F51] cursor-pointer ${getCellColor(
                    val
                  )}`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Legenda */}
      <div className="flex items-center justify-between text-[10px] text-stone-500 pt-1 border-t border-[#E9D9CD]/60">
        <div className="flex items-center gap-1.5">
          <span>Menos acessos</span>
          <span className="w-2.5 h-2.5 rounded-sm bg-stone-100 border border-[#E9D9CD]"></span>
          <span className="w-2.5 h-2.5 rounded-sm bg-[#F5DDE5]"></span>
          <span className="w-2.5 h-2.5 rounded-sm bg-[#C69A76]"></span>
          <span className="w-2.5 h-2.5 rounded-sm bg-[#7A3F51]"></span>
          <span>Mais acessos</span>
        </div>
      </div>

      {/* Insight */}
      <div className="p-3 bg-[#FAF0F4] border border-[#E9D9CD] rounded-2xl flex items-center gap-2 text-xs text-[#7A3F51]">
        <Sparkles className="w-4 h-4 text-[#C69A76] shrink-0" />
        <span className="font-medium">{peakInsight}</span>
      </div>
    </div>
  );
}
