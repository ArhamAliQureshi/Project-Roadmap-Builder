
import React, { useMemo } from 'react';
import { RoadmapData } from '../types';

interface TimelineProps {
  data: RoadmapData;
}

const Timeline: React.FC<TimelineProps> = ({ data }) => {
  const STAGES_PER_ROW = 3;
  const STAGE_WIDTH = 450;
  const ROW_HEIGHT = 500;
  const ROAD_OFFSET_Y = 150; // Padding for the header in SVG
  const HORIZONTAL_PADDING = 100;

  const numRows = Math.ceil(data.stages.length / STAGES_PER_ROW);
  const VIEWBOX_WIDTH = STAGES_PER_ROW * STAGE_WIDTH + (HORIZONTAL_PADDING * 2);
  const VIEWBOX_HEIGHT = numRows * ROW_HEIGHT + ROAD_OFFSET_Y + 100;

  // Helper to get coordinates for a stage index
  const getStagePos = (i: number) => {
    const row = Math.floor(i / STAGES_PER_ROW);
    const col = i % STAGES_PER_ROW;
    const isEvenRow = row % 2 === 0;
    
    // Calculate X based on row direction (L->R or R->L)
    const x = isEvenRow 
      ? (col + 0.5) * STAGE_WIDTH + HORIZONTAL_PADDING
      : (STAGES_PER_ROW - col - 0.5) * STAGE_WIDTH + HORIZONTAL_PADDING;
    
    const y = row * ROW_HEIGHT + ROW_HEIGHT / 2 + ROAD_OFFSET_Y;
    
    return { x, y, row, col, isEvenRow };
  };

  const pathData = useMemo(() => {
    if (data.stages.length === 0) return '';
    
    const firstPos = getStagePos(0);
    // Start with a move to the extension point
    let d = `M ${firstPos.x - (firstPos.isEvenRow ? 100 : -100)} ${firstPos.y}`;
    
    // Add initial line to first stage
    d += ` L ${firstPos.x} ${firstPos.y}`;
    
    for (let i = 0; i < data.stages.length - 1; i++) {
      const current = getStagePos(i);
      const next = getStagePos(i + 1);
      
      if (current.row === next.row) {
        // Horizontal segment within the same row - slightly curved for organic feel
        const cp1x = current.x + (current.isEvenRow ? STAGE_WIDTH / 2 : -STAGE_WIDTH / 2);
        const cp2x = next.x - (next.isEvenRow ? STAGE_WIDTH / 2 : -STAGE_WIDTH / 2);
        d += ` C ${cp1x} ${current.y}, ${cp2x} ${next.y}, ${next.x} ${next.y}`;
      } else {
        // Row transition segment (U-turn)
        const isRightTurn = current.isEvenRow; 
        // We use a single cubic Bezier to create a smooth, bulbous 180-turn
        // The control points are placed far enough out to approximate a circular arc
        const bulgeWidth = STAGE_WIDTH * 0.7; 
        const cp1x = current.x + (isRightTurn ? bulgeWidth : -bulgeWidth);
        const cp2x = next.x + (isRightTurn ? bulgeWidth : -bulgeWidth);
        
        d += ` C ${cp1x} ${current.y}, ${cp2x} ${next.y}, ${next.x} ${next.y}`;
      }
    }
    
    // Extend slightly after the last stage
    const lastPos = getStagePos(data.stages.length - 1);
    d += ` L ${lastPos.x + (lastPos.isEvenRow ? 100 : -100)} ${lastPos.y}`;
    
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
        <defs>
          <filter id="road-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Background Rectangle for Exports */}
        <rect width={VIEWBOX_WIDTH} height={VIEWBOX_HEIGHT} fill="white" />

        {/* Header Section for SVG Export - Hidden in UI via .svg-export-only class */}
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

        {/* The Path Shadow/Blur */}
        <path
          d={pathData}
          fill="none"
          stroke="#eef2f6"
          strokeWidth="80"
          strokeLinecap="round"
        />

        {/* The Path Body (Asphalt) */}
        <path
          d={pathData}
          fill="none"
          stroke="#1e293b"
          strokeWidth="60"
          strokeLinecap="round"
        />

        {/* The Path Center Line (Dashed Markings) */}
        <path
          d={pathData}
          fill="none"
          stroke="white"
          strokeWidth="4"
          strokeDasharray="15, 25"
          strokeLinecap="round"
          opacity="0.5"
        />

        {/* Markers and Labels */}
        {data.stages.map((stage, i) => {
          const pos = getStagePos(i);
          const isPeak = i % 2 === 1; // Alternates height locally for visual rhythm
          
          return (
            <g key={stage.id} className="cursor-default">
              {/* Marker Position Indicator */}
              <g 
                transform={`translate(${pos.x}, ${pos.y})`} 
                style={{ transformOrigin: 'center', transformBox: 'fill-box' }}
              >
                {/* Milestone Pin */}
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

              {/* Text Card - Positioned above or below the road based on peak/valley */}
              <foreignObject
                x={pos.x - 130}
                y={isPeak ? pos.y + 40 : pos.y - 280}
                width="260"
                height="220"
                className="overflow-visible"
              >
                <div 
                  xmlns="http://www.w3.org/1999/xhtml"
                  style={{ 
                    backgroundColor: 'white',
                    fontFamily: 'Inter, sans-serif',
                    padding: '24px',
                    borderRadius: '24px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    textAlign: 'left',
                    width: '260px',
                    boxSizing: 'border-box'
                  }}
                >
                  <h3 style={{ 
                    margin: '0 0 16px 0', 
                    fontSize: '18px', 
                    fontWeight: 900, 
                    color: '#0f172a', 
                    textTransform: 'uppercase', 
                    letterSpacing: '0.05em', 
                    lineHeight: 1,
                    width: '100%',
                    borderBottom: '1px solid #f1f5f9',
                    paddingBottom: '12px'
                  }}>
                    {stage.title}
                  </h3>
                  <p style={{ 
                    margin: 0, 
                    color: '#1e293b', 
                    fontSize: '13px', 
                    lineHeight: 1.6, 
                    fontWeight: 700,
                    width: '100%'
                  }}>
                    {stage.description}
                  </p>
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
