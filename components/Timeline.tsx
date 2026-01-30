
import React, { useMemo } from 'react';
import { ProjectStage } from '../types';

interface TimelineProps {
  stages: ProjectStage[];
}

const Timeline: React.FC<TimelineProps> = ({ stages }) => {
  const STAGE_WIDTH = 380;
  const HEIGHT = 600;
  const VIEWBOX_WIDTH = Math.max(1200, (stages.length + 0.5) * STAGE_WIDTH);

  const pathData = useMemo(() => {
    if (stages.length === 0) return '';
    
    const centerY = HEIGHT / 2;
    const amplitude = 150;
    
    let d = `M 0 ${centerY}`;
    
    for (let i = 0; i < stages.length + 1; i++) {
      const xStart = i * STAGE_WIDTH;
      const xEnd = (i + 1) * STAGE_WIDTH;
      const xMid = xStart + STAGE_WIDTH / 2;
      
      const isPeak = i % 2 === 1;
      const targetY = isPeak ? centerY - amplitude : centerY + amplitude;
      
      const cp1x = xStart + STAGE_WIDTH * 0.3;
      const cp1y = i === 0 ? centerY : (i % 2 === 0 ? centerY - amplitude : centerY + amplitude);
      
      const cp2x = xMid - STAGE_WIDTH * 0.3;
      const cp2y = targetY;

      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${xMid} ${targetY}`;

      const cp3x = xMid + STAGE_WIDTH * 0.3;
      const cp3y = targetY;
      const cp4x = xEnd - STAGE_WIDTH * 0.3;
      const cp4y = centerY;
      
      d += ` C ${cp3x} ${cp3y}, ${cp4x} ${centerY}, ${xEnd} ${centerY}`;
    }
    
    return d;
  }, [stages, STAGE_WIDTH]);

  if (stages.length === 0) {
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
        viewBox={`0 0 ${VIEWBOX_WIDTH} ${HEIGHT}`}
        width={VIEWBOX_WIDTH}
        height={HEIGHT}
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
        <rect width={VIEWBOX_WIDTH} height={HEIGHT} fill="white" />

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
          className="transition-all duration-700 ease-in-out"
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
        {stages.map((stage, i) => {
          const x = i * STAGE_WIDTH + STAGE_WIDTH / 2;
          const isPeak = i % 2 === 1;
          const centerY = HEIGHT / 2;
          const amplitude = 150;
          const y = isPeak ? centerY - amplitude : centerY + amplitude;
          
          return (
            <g key={stage.id} className="cursor-default">
              {/* Marker Position Indicator */}
              <g 
                transform={`translate(${x}, ${y})`} 
                style={{ transformOrigin: 'center', transformBox: 'fill-box' }}
              >
                {/* Milestone Pin */}
                <path
                  d="M0 0 C-15 -15 -25 -40 -25 -55 A25 25 0 1 1 25 -55 C25 -40 15 -15 0 0 Z"
                  fill={stage.color}
                  style={{ filter: 'drop-shadow(0 8px 6px rgba(0,0,0,0.2))' }}
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

              {/* Text Card - Matches the screenshot with left alignment and proper padding */}
              <foreignObject
                x={x - 130}
                y={isPeak ? y + 40 : y - 260}
                width="260"
                height="200"
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
