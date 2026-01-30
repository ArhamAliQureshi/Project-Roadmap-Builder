
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
      className={`bg-white p-6 rounded-2xl border border-slate-200 shadow-sm transition-all hover:shadow-md hover:border-indigo-100 group relative ${isDragging ? 'opacity-40 scale-[0.98] border-indigo-400 border-dashed' : 'opacity-100'}`}
    >
      {/* Drag Handle */}
      <div className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing p-1">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-4 text-slate-300" viewBox="0 0 20 20" fill="currentColor">
          <path d="M7 7h2v2H7V7zm0 4h2v2H7v-2zm4-4h2v2h-2V7zm0 4h2v2h-2v-2z" />
          <path d="M7 3h2v2H7V3zm0 12h2v2H7v-2zm4-12h2v2h-2V3zm0 12h2v2h-2v-2z" opacity="0.5" />
        </svg>
      </div>

      <div className="flex items-start gap-5 pl-4">
        <div 
          className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-xl flex-shrink-0 shadow-inner select-none"
          style={{ backgroundColor: stage.color }}
        >
          {index + 1}
        </div>
        
        <div className="flex-grow space-y-4">
          <div className="flex gap-4 items-center">
            <div className="flex-grow">
              <input
                type="text"
                value={stage.title}
                aria-label={`Stage ${index + 1} title`}
                onChange={(e) => onUpdate({ title: e.target.value })}
                className="w-full font-black text-xl border-b-2 border-transparent focus:border-indigo-500 outline-none pb-1 transition-colors placeholder:text-slate-400 bg-transparent"
                style={{ color: stage.color }}
                placeholder="Name your stage..."
              />
            </div>
            <button
              onClick={onRemove}
              aria-label={`Remove stage ${index + 1}`}
              className="text-slate-400 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100 active:scale-90 p-1 rounded-lg hover:bg-red-50"
              title="Remove Stage"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          
          <div className="relative">
            <textarea
              value={stage.description}
              aria-label={`Stage ${index + 1} description`}
              onChange={(e) => onUpdate({ description: e.target.value })}
              className="w-full text-sm text-slate-900 font-bold bg-slate-50/50 border border-slate-100 rounded-xl p-3 focus:bg-white focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none resize-none h-24 transition-all placeholder:text-slate-400"
              placeholder="What happens in this stage?"
            />
          </div>

          <div className="flex items-center gap-3 pt-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Theme Color</span>
            <div className="flex gap-2.5 flex-wrap">
              {THEME_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => onUpdate({ color })}
                  aria-label={`Set stage color to ${color}`}
                  className={`w-5 h-5 rounded-full ring-offset-2 transition-all hover:scale-125 hover:shadow-lg ${stage.color === color ? 'ring-2 ring-slate-800 scale-110' : 'ring-0'}`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StageEditor;
