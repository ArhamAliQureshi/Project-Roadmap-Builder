
import React, { useState, useEffect, useRef } from 'react';
import { ProjectStage } from '../types';

interface JsonEditorProps {
  stages: ProjectStage[];
  onChange: (newStages: ProjectStage[]) => void;
}

const JsonEditor: React.FC<JsonEditorProps> = ({ stages, onChange }) => {
  const [localValue, setLocalValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!isFocused) {
      setLocalValue(JSON.stringify(stages, null, 2));
      setError(null);
    }
  }, [stages, isFocused]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);

    try {
      const parsed = JSON.parse(newValue);
      if (Array.isArray(parsed)) {
        const isValid = parsed.every(item => 
          typeof item === 'object' && 
          item !== null && 
          typeof item.title === 'string'
        );
        
        if (isValid) {
          onChange(parsed);
          setError(null);
        } else {
          setError('Invalid stage structure.');
        }
      } else {
        setError('Must be a JSON array.');
      }
    } catch (err) {
      setError('Invalid JSON syntax');
    }
  };

  const syncScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = e.currentTarget.scrollTop;
      scrollRef.current.scrollLeft = e.currentTarget.scrollLeft;
    }
  };

  // Improved syntax highlighter for a "pretty" look
  const highlightJson = (code: string) => {
    if (!code) return null;
    
    return code.split(/(".*?"|[\{\}\[\],:]|\d+)/).map((part, i) => {
      if (part.startsWith('"')) {
        // If it ends with ':', it's likely a key
        const isKey = part.endsWith(':') || code.substring(code.indexOf(part) + part.length).trim().startsWith(':');
        return <span key={i} className={isKey ? 'text-[#818cf8]' : 'text-[#f472b6]'}>{part}</span>;
      }
      if (/^\d+$/.test(part)) return <span key={i} className="text-[#fbbf24]">{part}</span>;
      if (['{', '}', '[', ']', ',', ':'].includes(part)) return <span key={i} className="text-slate-500 font-bold">{part}</span>;
      return <span key={i} className="text-slate-300">{part}</span>;
    });
  };

  return (
    <div className="flex flex-col flex-grow">
      {/* Screenshot-matched Header */}
      <div className="flex items-center justify-between mb-4 px-2">
        <div className="flex items-center gap-2.5">
          <div className={`w-2 h-2 rounded-full transition-all duration-500 ${isFocused ? 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)] animate-pulse' : 'bg-slate-400'}`}></div>
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Source Code</span>
        </div>
        <div className="flex items-center gap-2">
          {error ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-rose-50 border border-rose-100 rounded-full">
              <span className="text-[9px] font-black text-rose-500 uppercase tracking-tight">Invalid Format</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-100 rounded-full">
               <span className="text-[9px] font-black text-emerald-500 uppercase tracking-tight">Valid JSON</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Dark Theme Code Editor */}
      <div className={`relative flex-grow group rounded-[32px] border-2 transition-all duration-500 bg-[#0c111d] overflow-hidden ${error ? 'border-rose-200 shadow-lg shadow-rose-100' : isFocused ? 'border-indigo-400 shadow-2xl shadow-indigo-100/50' : 'border-slate-100'}`}>
        {/* Highlight Layer */}
        <div 
          ref={scrollRef}
          className="absolute inset-0 p-8 font-mono text-xs leading-relaxed pointer-events-none whitespace-pre overflow-hidden"
          aria-hidden="true"
        >
          {highlightJson(localValue)}
        </div>

        {/* Interaction Layer */}
        <textarea
          ref={textareaRef}
          value={localValue}
          onChange={handleInputChange}
          onScroll={syncScroll}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className="absolute inset-0 w-full h-full p-8 font-mono text-xs leading-relaxed bg-transparent text-transparent caret-indigo-400 outline-none resize-none custom-scrollbar selection:bg-indigo-500/20"
          spellCheck={false}
        />

        {/* Footer Icon */}
        <div className="absolute bottom-6 right-6 opacity-10 pointer-events-none group-hover:opacity-40 transition-opacity">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
        </div>
      </div>
    </div>
  );
};

export default JsonEditor;
