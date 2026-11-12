'use client';

import React, { useState } from 'react';
import { TimeSeriesPoint } from '@/types/analytics';

interface TrafficTimeSeriesChartProps {
  data: TimeSeriesPoint[];
}

export function TrafficTimeSeriesChart({ data }: TrafficTimeSeriesChartProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-xs text-stone-400 bg-[#FAF7F8]/50 rounded-2xl border border-dashed border-[#E9D9CD]">
        Sem dados de tráfego para o período selecionado.
      </div>
    );
  }

  const maxVal = Math.max(...data.map((d) => Math.max(d.pageviews, d.visitors, 5)));
  const width = 800;
  const height = 240;
  const paddingX = 40;
  const paddingY = 30;

  const pointsViews = data.map((d, i) => {
    const x = paddingX + (i / Math.max(1, data.length - 1)) * (width - paddingX * 2);
    const y = height - paddingY - (d.pageviews / maxVal) * (height - paddingY * 2);
    return { x, y, data: d };
  });

  const pointsVisitors = data.map((d, i) => {
    const x = paddingX + (i / Math.max(1, data.length - 1)) * (width - paddingX * 2);
    const y = height - paddingY - (d.visitors / maxVal) * (height - paddingY * 2);
    return { x, y, data: d };
  });

  // Linhas SVG
  const pathViews = pointsViews.reduce(
    (acc, p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`),
    ''
  );

  const pathAreaViews = `${pathViews} L ${pointsViews[pointsViews.length - 1].x} ${
    height - paddingY
  } L ${pointsViews[0].x} ${height - paddingY} Z`;

  const pathVisitors = pointsVisitors.reduce(
    (acc, p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`),
    ''
  );

  const activePoint = hoverIndex !== null ? data[hoverIndex] : null;

  return (
    <div className="space-y-3">
      {/* Legenda e Destaque no Hover */}
      <div className="flex flex-wrap items-center justify-between text-xs">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 font-semibold text-[#7A3F51]">
            <span className="w-3 h-3 rounded-full bg-[#7A3F51]"></span>
            <span>Acessos (Páginas abertas)</span>
          </div>
          <div className="flex items-center gap-1.5 font-semibold text-[#C69A76]">
            <span className="w-3 h-3 rounded-full bg-[#C69A76]"></span>
            <span>Visitantes Únicos</span>
          </div>
        </div>

        {activePoint ? (
          <div className="text-xs font-bold text-[#39313A] bg-[#FAF0F4] px-3 py-1 rounded-full border border-[#E9D9CD]">
            {activePoint.timeLabel}:{' '}
            <span className="text-[#7A3F51]">{activePoint.pageviews} acessos</span> ·{' '}
            <span className="text-[#C69A76]">{activePoint.visitors} visitantes</span>
          </div>
        ) : (
          <span className="text-[11px] text-stone-400">
            Passe o mouse no gráfico para ver os detalhes
          </span>
        )}
      </div>

      {/* SVG Responsivo */}
      <div className="relative w-full aspect-[8/2.6] bg-white rounded-2xl border border-[#E9D9CD] p-2 overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full overflow-visible"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="viewsGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7A3F51" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#7A3F51" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Linhas horizontais de grade */}
          {[0, 0.33, 0.66, 1].map((ratio, idx) => {
            const y = height - paddingY - ratio * (height - paddingY * 2);
            const valLabel = Math.round(ratio * maxVal);
            return (
              <g key={idx}>
                <line
                  x1={paddingX}
                  y1={y}
                  x2={width - paddingX}
                  y2={y}
                  stroke="#E9D9CD"
                  strokeDasharray="4 4"
                  strokeWidth="1"
                />
                <text
                  x={paddingX - 8}
                  y={y + 3}
                  textAnchor="end"
                  fontSize="9"
                  fill="#A8A29E"
                  fontFamily="sans-serif"
                >
                  {valLabel}
                </text>
              </g>
            );
          })}

          {/* Área de preenchimento de Acessos */}
          <path d={pathAreaViews} fill="url(#viewsGradient)" />

          {/* Linha de Acessos */}
          <path d={pathViews} fill="none" stroke="#7A3F51" strokeWidth="2.5" />

          {/* Linha de Visitantes */}
          <path
            d={pathVisitors}
            fill="none"
            stroke="#C69A76"
            strokeWidth="2"
            strokeDasharray="2 2"
          />

          {/* Pontos interativos */}
          {pointsViews.map((p, idx) => {
            const isHover = hoverIndex === idx;
            return (
              <g
                key={idx}
                onMouseEnter={() => setHoverIndex(idx)}
                onMouseLeave={() => setHoverIndex(null)}
                className="cursor-pointer"
              >
                {/* Linha vertical ao passar o mouse */}
                {isHover && (
                  <line
                    x1={p.x}
                    y1={paddingY}
                    x2={p.x}
                    y2={height - paddingY}
                    stroke="#7A3F51"
                    strokeWidth="1.5"
                    strokeDasharray="3 3"
                  />
                )}

                {/* Ponto Acessos */}
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={isHover ? 6 : 3.5}
                  fill="#7A3F51"
                  stroke="#FFFFFF"
                  strokeWidth="2"
                  className="transition-all"
                />

                {/* Ponto Visitantes */}
                <circle
                  cx={pointsVisitors[idx].x}
                  cy={pointsVisitors[idx].y}
                  r={isHover ? 5 : 2.5}
                  fill="#C69A76"
                  stroke="#FFFFFF"
                  strokeWidth="1.5"
                />

                {/* Rótulo de tempo no eixo X */}
                {(idx === 0 ||
                  idx === pointsViews.length - 1 ||
                  idx % Math.ceil(pointsViews.length / 8) === 0) && (
                  <text
                    x={p.x}
                    y={height - 8}
                    textAnchor="middle"
                    fontSize="9"
                    fill="#78716C"
                    fontWeight={isHover ? 'bold' : 'normal'}
                  >
                    {p.data.timeLabel}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
