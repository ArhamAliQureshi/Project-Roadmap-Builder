
import React from 'react';
import { ProjectStage } from '../types';
import { THEME_COLORS } from '../constants';

interface StageEditorProps {
  stage: ProjectStage;
  index: number;
  isDragging?: boolean;
  onUpdate: (updates: Partial<ProjectStage>) => void;
  onRemove: () => void;
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragEnd: () => void;
}

const StageEditor: React.FC<StageEditorProps> = ({ 
  stage, 
  index, 
  isDragging, 
  onUpdate, 
  onRemove,
  onDragStart,
  onDragOver,
  onDragEnd
}) => {
  return (
    <div 
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      className={`bg-white p-8 rounded-[40px] border border-slate-200/40 shadow-sm transition-all relative flex flex-col md:flex-row gap-8 ${isDragging ? 'opacity-40 scale-[0.98]' : 'opacity-100 hover:shadow-xl hover:border-slate-300/50'}`}
    >
      {/* Circle Index - Matching screenshot exactly */}
      <div 
        className="w-14 h-14 rounded-[22px] flex items-center justify-center text-white font-black text-2xl flex-shrink-0 shadow-lg transition-transform hover:scale-105"
        style={{ 
          backgroundColor: stage.color, 
          boxShadow: `0 10px 20px -4px ${stage.color}44`
        }}
      >
        {index + 1}
      </div>

      <div className="flex-grow flex flex-col gap-5">
        {/* Title Row */}
        <div className="flex justify-between items-center">
          <input
            value={stage.title}
            onChange={(e) => onUpdate({ title: e.target.value })}
            className="font-black text-2xl outline-none w-full bg-transparent placeholder:text-slate-100 tracking-tight"
            style={{ color: stage.color }}
            placeholder="Milestone Title"
          />
          <button 
            onClick={onRemove} 
            className="text-slate-200 hover:text-rose-500 transition-all p-2 rounded-full hover:bg-rose-50"
            title="Remove Stage"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/></svg>
          </button>
        </div>

        {/* Description Box - Rounded recessed area from screenshot */}
        <div className="bg-[#f8fafc] rounded-[28px] p-6 border border-slate-100 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]">
          <textarea
            value={stage.description}
            onChange={(e) => onUpdate({ description: e.target.value })}
            className="w-full text-[13px] font-semibold text-slate-600 bg-transparent outline-none resize-none h-24 leading-relaxed placeholder:text-slate-300"
            placeholder="What happens in this project phase?"
          />
        </div>

        {/* Theme Color Selector - Label matches screenshot */}
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.1em] flex-shrink-0">Theme Color</span>
          <div className="flex gap-2.5 flex-wrap">
            {THEME_COLORS.map((color) => (
              <button
                key={color}
                onClick={() => onUpdate({ color })}
                className={`w-6 h-6 rounded-full transition-all relative ${stage.color === color ? 'scale-110 shadow-md ring-2 ring-slate-800 ring-offset-2' : 'opacity-80 hover:scale-110 hover:opacity-100'}`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StageEditor;
