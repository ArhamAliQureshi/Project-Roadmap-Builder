
import React, { useMemo } from 'react';
import { ProjectStage } from '../types';

interface TimelineProps {
  stages: ProjectStage[];
}

const Timeline: React.FC<TimelineProps> = ({ stages }) => {
  const STAGE_WIDTH = 380;
  const HEIGHT = 600;
  const VIEWBOX_WIDTH = Math.max(1200, stages.length * STAGE_WIDTH);

  const pathData = useMemo(() => {
    if (stages.length === 0) return '';
    
    const centerY = HEIGHT / 2;
    const amplitude = 150;
    
    let d = `M 0 ${centerY}`;
    
    for (let i = 0; i < stages.length; i++) {
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
        <p className="text-xl font-bold text-slate-400">Your roadmap starts here.</p>
        <p className="text-sm text-slate-300 mt-2">Add stages below to visualize the path.</p>
      </div>
    );
  }

  return (
    <div className="relative overflow-visible">
      <svg
        viewBox={`0 0 ${VIEWBOX_WIDTH} ${HEIGHT}`}
        width={VIEWBOX_WIDTH}
        height={HEIGHT}
        className="overflow-visible"
        style={{ minWidth: '100%' }}
      >
        <defs>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* The Path Shadow/Blur */}
        <path
          d={pathData}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth="60"
          strokeLinecap="round"
          className="opacity-50"
        />

        {/* The Path Body */}
        <path
          d={pathData}
          fill="none"
          stroke="#1e293b"
          strokeWidth="48"
          strokeLinecap="round"
          className="transition-all duration-700 ease-in-out"
        />

        {/* The Path Center Line */}
        <path
          d={pathData}
          fill="none"
          stroke="#94a3b8"
          strokeWidth="3"
          strokeDasharray="12, 18"
          strokeLinecap="round"
          className="opacity-40"
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
              {/* Marker with distinct drop shadow */}
              <g 
                transform={`translate(${x}, ${y})`} 
                style={{ transformOrigin: 'center', transformBox: 'fill-box' }}
              >
                <circle cx="0" cy="0" r="45" fill="white" className="shadow-xl" opacity="0.1" />
                <path
                  d="M0 0 C-22 -22 -32 -55 -32 -75 A32 32 0 1 1 32 -75 C32 -55 22 -22 0 0 Z"
                  fill={stage.color}
                  className="drop-shadow-[0_10px_10px_rgba(0,0,0,0.15)]"
                />
                <circle cx="0" cy="-75" r="24" fill="white" />
                <text
                  x="0"
                  y="-67"
                  textAnchor="middle"
                  fill={stage.color}
                  className="text-2xl font-black select-none"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  {i + 1}
                </text>
              </g>

              {/* Text Area - Darker text and more opaque background */}
              <foreignObject
                x={x - 140}
                y={isPeak ? y + 55 : y - 315}
                width="280"
                height="240"
                className="overflow-visible"
              >
                <div className="flex flex-col items-center text-center p-5 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200 shadow-xl transition-all">
                  <h3 className="text-xl font-black text-slate-900 mb-2 uppercase tracking-tight leading-tight">
                    {stage.title}
                  </h3>
                  <div className="h-0.5 w-10 bg-slate-100 mb-3"></div>
                  <p className="text-slate-800 text-sm leading-relaxed font-bold line-clamp-4">
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
