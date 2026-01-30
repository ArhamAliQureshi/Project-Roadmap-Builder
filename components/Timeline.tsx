
import React, { useMemo } from 'react';
import { RoadmapData, ProjectStage } from '../types';

interface TimelineProps {
  data: RoadmapData;
  onAddStage?: () => void;
  onUpdateStage?: (id: string, updates: Partial<ProjectStage>) => void;
  onPushHistory?: () => void;
}

const Timeline: React.FC<TimelineProps> = ({ data, onAddStage, onUpdateStage, onPushHistory }) => {
  const STAGES_PER_ROW = 3;
  const STAGE_WIDTH = 450;
  const ROW_HEIGHT = 500;
  const ROAD_OFFSET_Y = 140;
  const HORIZONTAL_PADDING = 100;

  const numRows = Math.ceil(data.stages.length / STAGES_PER_ROW);
  const VIEWBOX_WIDTH = STAGES_PER_ROW * STAGE_WIDTH + (HORIZONTAL_PADDING * 2);
  const VIEWBOX_HEIGHT = numRows * ROW_HEIGHT + ROAD_OFFSET_Y + 50;

  const getStagePos = (i: number) => {
    const row = Math.floor(i / STAGES_PER_ROW);
    const col = i % STAGES_PER_ROW;
    const isEvenRow = row % 2 === 0;
    
    const x = isEvenRow 
      ? (col + 0.5) * STAGE_WIDTH + HORIZONTAL_PADDING
      : (STAGES_PER_ROW - col - 0.5) * STAGE_WIDTH + HORIZONTAL_PADDING;
    
    const y = row * ROW_HEIGHT + ROW_HEIGHT / 2 + ROAD_OFFSET_Y;
    
    return { x, y, row, col, isEvenRow };
  };

  const pathData = useMemo(() => {
    if (data.stages.length === 0) return '';
    
    const firstPos = getStagePos(0);
    let d = `M ${firstPos.x - (firstPos.isEvenRow ? 100 : -100)} ${firstPos.y}`;
    d += ` L ${firstPos.x} ${firstPos.y}`;
    
    for (let i = 0; i < data.stages.length - 1; i++) {
      const current = getStagePos(i);
      const next = getStagePos(i + 1);
      
      if (current.row === next.row) {
        const cp1x = current.x + (current.isEvenRow ? STAGE_WIDTH / 2 : -STAGE_WIDTH / 2);
        const cp2x = next.x - (next.isEvenRow ? STAGE_WIDTH / 2 : -STAGE_WIDTH / 2);
        d += ` C ${cp1x} ${current.y}, ${cp2x} ${next.y}, ${next.x} ${next.y}`;
      } else {
        const isRightTurn = current.isEvenRow; 
        const bulgeWidth = STAGE_WIDTH * 0.7; 
        const cp1x = current.x + (isRightTurn ? bulgeWidth : -bulgeWidth);
        const cp2x = next.x + (isRightTurn ? bulgeWidth : -bulgeWidth);
        d += ` C ${cp1x} ${current.y}, ${cp2x} ${next.y}, ${next.x} ${next.y}`;
      }
    }
    
    const lastPos = getStagePos(data.stages.length - 1);
    d += ` L ${lastPos.x + (lastPos.isEvenRow ? 150 : -150)} ${lastPos.y}`;
    
    return d;
  }, [data.stages]);

  if (data.stages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-300">
        <div className="w-20 h-20 rounded-full border-4 border-slate-100 flex items-center justify-center mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A2 2 0 013 15.488V5.512a2 2 0 011.553-1.954L9 2l5.447 2.724A2 2 0 0116 6.678v9.834a2 2 0 01-1.553 1.954L9 20z" />
          </svg>
        </div>
        <p className="text-xl font-bold text-slate-400 uppercase tracking-widest text-xs">Your roadmap starts here.</p>
        <p className="text-sm text-slate-300 mt-2 font-medium">Add stages below to visualize the path.</p>
      </div>
    );
  }

  const lastIdx = data.stages.length - 1;
  const lastPos = getStagePos(lastIdx);
  const plusX = lastPos.x + (lastPos.isEvenRow ? 150 : -150);
  const plusY = lastPos.y;

  return (
    <div className="relative overflow-visible">
      <svg
        id="roadmap-svg-export"
        viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
        width={VIEWBOX_WIDTH}
        height={VIEWBOX_HEIGHT}
        xmlns="http://www.w3.org/2000/svg"
        className="overflow-visible"
        style={{ minWidth: '100%' }}
      >
        <rect width={VIEWBOX_WIDTH} height={VIEWBOX_HEIGHT} fill="white" />

        <g transform={`translate(${VIEWBOX_WIDTH / 2}, 60)`} className="svg-export-only">
          <text
            textAnchor="middle"
            style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: '48px', fill: '#0f172a' }}
          >
            {data.title}
          </text>
          <text
            y="50"
            textAnchor="middle"
            style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: '18px', fill: '#64748b' }}
          >
            {data.description}
          </text>
        </g>

        {/* Road Base */}
        <path
          d={pathData}
          fill="none"
          stroke="#eef2f6"
          strokeWidth="80"
          strokeLinecap="round"
        />

        {/* Main Road Surface */}
        <path
          d={pathData}
          fill="none"
          stroke="#1e293b"
          strokeWidth="65"
          strokeLinecap="round"
        />

        {/* Road Dashes */}
        <path
          d={pathData}
          fill="none"
          stroke="white"
          strokeWidth="5"
          strokeDasharray="25, 30"
          strokeLinecap="round"
          opacity="0.4"
        />

        {/* Final Add Button */}
        <g 
          className="no-export cursor-pointer group/plus" 
          transform={`translate(${plusX}, ${plusY})`}
          onClick={onAddStage}
          style={{ pointerEvents: 'all' }}
        >
          <circle r="40" fill="#1e293b" stroke="#ffffff33" strokeWidth="2" className="transition-all group-hover/plus:fill-indigo-600" />
          <path d="M-12 0 L12 0 M0 -12 L0 12" stroke="white" strokeWidth="6" strokeLinecap="round" />
        </g>

        {data.stages.map((stage, i) => {
          const pos = getStagePos(i);
          const isPeak = i % 2 === 1; 
          
          return (
            <g key={stage.id}>
              {/* Pin Marker */}
              <g 
                transform={`translate(${pos.x}, ${pos.y})`} 
                style={{ pointerEvents: 'none' }}
              >
                <path
                  d="M0 0 C-15 -15 -25 -40 -25 -55 A25 25 0 1 1 25 -55 C25 -40 15 -15 0 0 Z"
                  fill={stage.color}
                />
                <circle cx="0" cy="-55" r="14" fill="white" />
                <text
                  x="0"
                  y="-51"
                  textAnchor="middle"
                  fill={stage.color}
                  style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: '14px' }}
                >
                  {i + 1}
                </text>
              </g>

              {/* Stage Detail Card */}
              <foreignObject
                x={pos.x - 110}
                y={isPeak ? pos.y + 35 : pos.y - 255}
                width="220"
                height="170"
                className="overflow-visible"
                style={{ pointerEvents: 'auto' }}
              >
                <div 
                  style={{ 
                    backgroundColor: 'white',
                    fontFamily: 'Inter, sans-serif',
                    padding: '16px',
                    borderRadius: '20px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    textAlign: 'left',
                    width: '220px',
                    height: '170px',
                    boxSizing: 'border-box',
                    overflow: 'hidden'
                  }}
                >
                  <input
                    value={stage.title}
                    onFocus={onPushHistory}
                    onChange={(e) => onUpdateStage?.(stage.id, { title: e.target.value })}
                    style={{ 
                      margin: '0 0 10px 0', 
                      fontSize: '15px', 
                      fontWeight: 900, 
                      color: '#0f172a', 
                      textTransform: 'uppercase', 
                      letterSpacing: '0.05em', 
                      lineHeight: 1.2,
                      width: '100%',
                      border: 'none',
                      borderBottom: '1px solid #f1f5f9',
                      paddingBottom: '4px',
                      background: 'transparent',
                      outline: 'none',
                      fontFamily: 'inherit'
                    }}
                    placeholder="TITLE"
                  />
                  <textarea
                    value={stage.description}
                    onFocus={onPushHistory}
                    onChange={(e) => onUpdateStage?.(stage.id, { description: e.target.value })}
                    style={{ 
                      margin: 0, 
                      color: '#475569', 
                      fontSize: '12px', 
                      lineHeight: 1.5, 
                      fontWeight: 600,
                      width: '100%',
                      flex: 1,
                      border: 'none',
                      background: 'transparent',
                      outline: 'none',
                      resize: 'none',
                      fontFamily: 'inherit'
                    }}
                    placeholder="Brief description..."
                  />
                </div>
              </foreignObject>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export default Timeline;
