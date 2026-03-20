'use client';

import { STEP_WIDTH, STEP_NODE_HEIGHT } from './step-node';

interface TransitionLineProps {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  label: string | null;
  isSelected: boolean;
  onClick: () => void;
}

export function TransitionLine({
  fromX,
  fromY,
  toX,
  toY,
  label,
  isSelected,
  onClick,
}: TransitionLineProps) {
  const startX = fromX + STEP_WIDTH / 2;
  const startY = fromY + STEP_NODE_HEIGHT;
  const endX = toX + STEP_WIDTH / 2;
  const endY = toY;

  const dy = endY - startY;
  const ctrlOffset = Math.max(Math.abs(dy) * 0.5, 40);

  const path = `M ${startX} ${startY} C ${startX} ${startY + ctrlOffset}, ${endX} ${endY - ctrlOffset}, ${endX} ${endY}`;

  const labelX = (startX + endX) / 2;
  const labelY = (startY + endY) / 2;

  return (
    <g className="cursor-pointer" onClick={onClick}>
      {/* Wide invisible hit area */}
      <path
        d={path}
        fill="none"
        stroke="transparent"
        strokeWidth={16}
        style={{ pointerEvents: 'auto' }}
      />
      {/* Visible path */}
      <path
        d={path}
        fill="none"
        stroke={
          isSelected
            ? 'hsl(var(--primary))'
            : 'hsl(var(--muted-foreground))'
        }
        strokeWidth={isSelected ? 2.5 : 1.5}
        strokeOpacity={isSelected ? 1 : 0.5}
        style={{ pointerEvents: 'none' }}
        markerEnd={isSelected ? 'url(#arrowhead-active)' : 'url(#arrowhead)'}
      />
      {label && (
        <g transform={`translate(${labelX}, ${labelY})`}>
          <rect
            x={-label.length * 3.5 - 8}
            y={-10}
            width={label.length * 7 + 16}
            height={20}
            rx={4}
            fill="hsl(var(--background))"
            stroke="hsl(var(--border))"
            strokeWidth={1}
            style={{ pointerEvents: 'none' }}
          />
          <text
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={11}
            fill="hsl(var(--muted-foreground))"
            style={{ pointerEvents: 'none' }}
          >
            {label}
          </text>
        </g>
      )}
    </g>
  );
}

export function TransitionDefs() {
  return (
    <defs>
      <marker
        id="arrowhead"
        markerWidth="10"
        markerHeight="7"
        refX="10"
        refY="3.5"
        orient="auto"
      >
        <polygon
          points="0 0, 10 3.5, 0 7"
          fill="hsl(var(--muted-foreground))"
          opacity="0.5"
        />
      </marker>
      <marker
        id="arrowhead-active"
        markerWidth="10"
        markerHeight="7"
        refX="10"
        refY="3.5"
        orient="auto"
      >
        <polygon points="0 0, 10 3.5, 0 7" fill="hsl(var(--primary))" />
      </marker>
    </defs>
  );
}
