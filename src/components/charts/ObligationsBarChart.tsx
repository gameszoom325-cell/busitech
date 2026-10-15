import React, { useState } from 'react';
import { CATEGORY_CHART_DATA } from '../../data/mockData';

type FilterType = 'all' | 'approved' | 'pending';

export const ObligationsBarChart: React.FC = () => {
  const [filter, setFilter] = useState<FilterType>('all');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const maxValue = 10;
  const chartHeight = 150;
  const barWidth = 24;
  const gap = 38;
  const leftMargin = 32;
  const topMargin = 20;

  return (
    <div className="flex flex-col h-full w-full min-w-0">
      {/* Chart Header with Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
        <div className="min-w-0">
          <h4 className="text-xs font-semibold text-[var(--color-text-main)] truncate">Obligations by Category</h4>
          <p className="text-[11px] text-[var(--color-text-muted)] truncate">Distribution across commitment types</p>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1 p-0.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card-subtle)] text-[11px] self-start sm:self-auto shrink-0">
          {(['all', 'approved', 'pending'] as FilterType[]).map(tab => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-2.5 py-1.5 font-medium rounded-md capitalize transition-colors min-h-[32px] sm:min-h-auto ${
                filter === tab
                  ? 'bg-[var(--color-bg-card)] text-[var(--color-primary-text)] font-semibold shadow-xs'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* SVG Bar Chart */}
      <div className="relative flex-1 w-full min-h-[180px] overflow-hidden">
        <svg
          viewBox={`0 0 ${leftMargin + CATEGORY_CHART_DATA.length * gap + 15} ${chartHeight + topMargin + 30}`}
          preserveAspectRatio="xMidYMid meet"
          className="w-full h-full overflow-visible"
        >
          {/* Y Axis Gridlines and Labels */}
          {[0, 2, 4, 6, 8, 10].map(val => {
            const y = topMargin + chartHeight - (val / maxValue) * chartHeight;
            return (
              <g key={val}>
                <line
                  x1={leftMargin}
                  y1={y}
                  x2={leftMargin + CATEGORY_CHART_DATA.length * gap + 5}
                  y2={y}
                  stroke="var(--color-border)"
                  strokeDasharray={val === 0 ? undefined : '3 3'}
                  strokeWidth="1"
                />
                <text
                  x={leftMargin - 6}
                  y={y + 3}
                  textAnchor="end"
                  className="text-[9px] fill-[var(--color-text-subtle)] font-mono"
                >
                  {val}
                </text>
              </g>
            );
          })}

          {/* Bars */}
          {CATEGORY_CHART_DATA.map((item, i) => {
            const val = filter === 'all' ? item.all : filter === 'approved' ? item.approved : item.pending;
            const barH = (val / maxValue) * chartHeight;
            const x = leftMargin + i * gap + 6;
            const y = topMargin + chartHeight - barH;
            const isHovered = hoveredIndex === i;

            return (
              <g
                key={item.category}
                className="cursor-pointer group"
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
                onClick={() => setHoveredIndex(hoveredIndex === i ? null : i)}
              >
                {/* Background column highlight on hover */}
                {isHovered && (
                  <rect
                    x={x - 4}
                    y={topMargin}
                    width={barWidth + 8}
                    height={chartHeight}
                    rx="4"
                    fill="var(--color-bg-hover)"
                    opacity="0.6"
                  />
                )}

                {/* The Bar */}
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={Math.max(barH, 3)}
                  rx="3"
                  fill={isHovered ? 'var(--color-primary-hover)' : 'var(--color-primary)'}
                  className="transition-colors duration-150"
                />

                {/* Value on top of bar */}
                <text
                  x={x + barWidth / 2}
                  y={Math.max(y - 5, topMargin + 10)}
                  textAnchor="middle"
                  className={`text-[9px] font-mono font-semibold ${
                    isHovered ? 'fill-[var(--color-primary)] font-bold' : 'fill-[var(--color-text-muted)]'
                  }`}
                >
                  {val}
                </text>

                {/* X Axis Label */}
                <text
                  x={x + barWidth / 2}
                  y={topMargin + chartHeight + 16}
                  textAnchor="middle"
                  className="text-[9px] fill-[var(--color-text-muted)] font-medium"
                >
                  {item.category.substring(0, 4)}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Hover Tooltip display */}
        {hoveredIndex !== null && (
          <div
            className="absolute top-0 right-0 p-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)] shadow-[var(--shadow-dropdown)] text-[11px] pointer-events-none z-10 animate-in fade-in duration-100 max-w-[150px]"
          >
            <div className="font-semibold text-[var(--color-text-main)] truncate">
              {CATEGORY_CHART_DATA[hoveredIndex].category}
            </div>
            <div className="text-[var(--color-text-muted)] mt-0.5 space-y-0.5">
              <div>Total: <span className="font-semibold text-[var(--color-text-main)]">{CATEGORY_CHART_DATA[hoveredIndex].all}</span></div>
              <div>Approved: <span className="text-[var(--color-success-text)] font-semibold">{CATEGORY_CHART_DATA[hoveredIndex].approved}</span></div>
              <div>Pending: <span className="text-[var(--color-warning-text)] font-semibold">{CATEGORY_CHART_DATA[hoveredIndex].pending}</span></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
