import React, { useState } from 'react';
import { RISK_DISTRIBUTION_DATA } from '../../data/mockData';

export const RiskDonutChart: React.FC = () => {
  const [hoveredLevel, setHoveredLevel] = useState<string | null>(null);

  const total = RISK_DISTRIBUTION_DATA.reduce((acc, curr) => acc + curr.count, 0);

  const radius = 60;
  const strokeWidth = 20;
  const circumference = 2 * Math.PI * radius;

  let cumulativePercent = 0;
  const slices = RISK_DISTRIBUTION_DATA.map(item => {
    const strokeDasharray = `${(item.percent / 100) * circumference} ${circumference}`;
    const strokeDashoffset = -((cumulativePercent / 100) * circumference);
    cumulativePercent += item.percent;
    return {
      ...item,
      strokeDasharray,
      strokeDashoffset
    };
  });

  return (
    <div className="flex flex-col h-full w-full min-w-0">
      <div className="mb-2 min-w-0">
        <h4 className="text-xs font-semibold text-[var(--color-text-main)] truncate">Risk Distribution</h4>
        <p className="text-[11px] text-[var(--color-text-muted)] truncate">Risk profiling across active commitments</p>
      </div>

      <div className="flex flex-col xs:flex-row items-center justify-around flex-1 py-1 gap-4">
        {/* SVG Donut */}
        <div className="relative w-36 h-36 sm:w-40 sm:h-40 flex items-center justify-center shrink-0">
          <svg viewBox="0 0 160 160" className="w-full h-full -rotate-90 transform">
            {/* Background ring */}
            <circle
              cx="80"
              cy="80"
              r={radius}
              fill="transparent"
              stroke="var(--color-border-subtle)"
              strokeWidth={strokeWidth}
            />

            {/* Slices */}
            {slices.map(slice => {
              const isHovered = hoveredLevel === slice.level;
              return (
                <circle
                  key={slice.level}
                  cx="80"
                  cy="80"
                  r={radius}
                  fill="transparent"
                  stroke={slice.color}
                  strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                  strokeDasharray={slice.strokeDasharray}
                  strokeDashoffset={slice.strokeDashoffset}
                  className="transition-all duration-150 cursor-pointer"
                  onMouseEnter={() => setHoveredLevel(slice.level)}
                  onMouseLeave={() => setHoveredLevel(null)}
                  onClick={() => setHoveredLevel(hoveredLevel === slice.level ? null : slice.level)}
                />
              );
            })}
          </svg>

          {/* Center Content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
            <span className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--color-text-main)] tabular-nums">
              {hoveredLevel ? slices.find(s => s.level === hoveredLevel)?.count : total}
            </span>
            <span className="text-[9px] uppercase font-semibold text-[var(--color-text-subtle)] tracking-wider">
              {hoveredLevel ? `${hoveredLevel} Risk` : 'Total Items'}
            </span>
          </div>
        </div>

        {/* Legend */}
        <div className="space-y-2 w-full xs:w-auto min-w-[120px]">
          {slices.map(item => {
            const isHovered = hoveredLevel === item.level;
            return (
              <div
                key={item.level}
                onMouseEnter={() => setHoveredLevel(item.level)}
                onMouseLeave={() => setHoveredLevel(null)}
                onClick={() => setHoveredLevel(hoveredLevel === item.level ? null : item.level)}
                className={`flex items-center justify-between gap-3 text-xs p-1.5 rounded-lg cursor-pointer transition-colors ${
                  isHovered ? 'bg-[var(--color-bg-hover)]' : ''
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="font-medium text-[var(--color-text-main)]">{item.level} Risk</span>
                </div>
                <div className="flex items-center gap-1.5 font-mono">
                  <span className="font-semibold text-[var(--color-text-main)]">{item.count}</span>
                  <span className="text-[10px] text-[var(--color-text-muted)]">({item.percent}%)</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
