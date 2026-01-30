
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { ProjectStage, RoadmapData } from './types';
import { INITIAL_STAGES, THEME_COLORS } from './constants';
import Timeline from './components/Timeline';
import StageEditor from './components/StageEditor';
import JsonEditor from './components/JsonEditor';

const STORAGE_KEY = 'roadmap_visionary_data_v2';
const MAX_HISTORY = 30;

const DEFAULT_ROADMAP: RoadmapData = {
  title: 'Roadmap Visionary',
  description: 'Visualize your project journey with precision. Add stages manually or let AI draft your entire strategy.',
  stages: INITIAL_STAGES
};

const App: React.FC = () => {
  const [data, setData] = useState<RoadmapData>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return { ...DEFAULT_ROADMAP, stages: parsed };
        }
        return parsed;
      } catch (e) {
        return DEFAULT_ROADMAP;
      }
    }
    return DEFAULT_ROADMAP;
  });

  const [history, setHistory] = useState<RoadmapData[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved'>('idle');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [activeSidebarTab, setActiveSidebarTab] = useState<'ai' | 'json'>('json');

  useEffect(() => {
    if (saveStatus === 'saved') {
      const timer = setTimeout(() => setSaveStatus('idle'), 3000);
      return () => clearTimeout(timer);
    }
  }, [saveStatus]);

  const pushToHistory = useCallback((currentState: RoadmapData) => {
    setHistory(prev => {
      const newHistory = [...prev, JSON.parse(JSON.stringify(currentState))];
      if (newHistory.length > MAX_HISTORY) return newHistory.slice(1);
      return newHistory;
    });
  }, []);

  const undo = () => {
    if (history.length === 0) return;
    const previousState = history[history.length - 1];
    setHistory(prev => prev.slice(0, -1));
    setData(previousState);
  };

  const updateHeader = (updates: Partial<Pick<RoadmapData, 'title' | 'description'>>) => {
    setData(prev => ({ ...prev, ...updates }));
  };

  const addNewStage = () => {
    pushToHistory(data);
    const newId = Math.random().toString(36).substr(2, 9);
    const color = THEME_COLORS[data.stages.length % THEME_COLORS.length];
    const newStages = [...data.stages, { 
      id: newId, 
      title: 'New Milestone', 
      description: 'Describe what happens in this stage of your journey.', 
      color 
    }];
    setData(prev => ({ ...prev, stages: newStages }));
  };

  const removeStage = (id: string) => {
    pushToHistory(data);
    const newStages = data.stages.filter(s => s.id !== id);
    setData(prev => ({ ...prev, stages: newStages }));
  };

  const updateStage = (id: string, updates: Partial<ProjectStage>) => {
    setData(prev => {
      const newStages = prev.stages.map(s => s.id === id ? { ...s, ...updates } : s);
      return { ...prev, stages: newStages };
    });
  };

  const handleJsonChange = (newData: RoadmapData) => {
    if (JSON.stringify(newData) !== JSON.stringify(data)) {
      pushToHistory(data);
      setData(newData);
    }
  };

  const saveToLocalStorage = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    setSaveStatus('saved');
  };

  const exportAsSvg = () => {
    const svgElement = document.getElementById('roadmap-svg-export');
    if (!svgElement) return;

    const clonedSvg = svgElement.cloneNode(true) as SVGElement;
    clonedSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    clonedSvg.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');

    // Reveal the hidden header elements specifically for the export
    const exportOnlyElements = clonedSvg.querySelectorAll('.svg-export-only');
    exportOnlyElements.forEach(el => {
      (el as HTMLElement).style.display = 'block';
    });

    // Remove elements that should not be exported (like the plus button)
    const noExportElements = clonedSvg.querySelectorAll('.no-export');
    noExportElements.forEach(el => {
      el.remove();
    });

    const serializer = new XMLSerializer();
    let source = serializer.serializeToString(clonedSvg);

    const preface = '<?xml version="1.0" standalone="no"?>\r\n';
    const svgBlob = new Blob([preface, source], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);
    
    const downloadLink = document.createElement('a');
    downloadLink.href = svgUrl;
    downloadLink.download = `${data.title.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.svg`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(svgUrl);
  };

  const handleDragStart = (index: number) => {
    pushToHistory(data);
    setDraggedIndex(index);
  };

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newStages = [...data.stages];
    const item = newStages[draggedIndex];
    newStages.splice(draggedIndex, 1);
    newStages.splice(index, 0, item);
    
    setDraggedIndex(index);
    setData(prev => ({ ...prev, stages: newStages }));
  }, [draggedIndex, data.stages]);

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const generateWithAi = async () => {
    if (!prompt.trim()) return;
    setIsAiLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Create a professional 5-7 stage project timeline for the following project description: "${prompt}". Return as JSON array of objects with title and description fields. Each title should be concise (1-3 words).`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING }
              },
              required: ['title', 'description']
            }
          }
        }
      });

      const parsedStages = JSON.parse(response.text);
      pushToHistory(data);
      const newStages = parsedStages.map((item: any, index: number) => ({
        id: Math.random().toString(36).substr(2, 9),
        title: item.title,
        description: item.description,
        color: THEME_COLORS[index % THEME_COLORS.length]
      }));
      setData(prev => ({ ...prev, stages: newStages }));
      setPrompt('');
    } catch (error) {
      console.error('Error generating stages:', error);
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fcfcfd] text-slate-900 selection:bg-indigo-100">
      <header className="bg-white border-b border-slate-200 pt-12 pb-8 text-center relative overflow-hidden group">
        <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px] opacity-40"></div>
        <div className="container mx-auto px-4 relative z-10 flex flex-col items-center">
          <div className="inline-block px-3 py-1 mb-4 text-xs font-bold tracking-widest text-indigo-600 uppercase bg-indigo-50 rounded-full">
            Strategic Planning
          </div>
          
          <div className="relative w-full max-w-4xl px-4 mb-2 flex justify-center">
            <div className="relative inline-block w-full text-center">
              <input 
                value={data.title}
                onChange={(e) => updateHeader({ title: e.target.value })}
                onFocus={() => pushToHistory(data)}
                className="w-full text-4xl md:text-6xl font-black tracking-tight text-slate-900 bg-transparent text-center border-none outline-none focus:ring-0 placeholder:text-slate-200"
                placeholder="Roadmap Title"
              />
            </div>
          </div>

          <div className="relative w-full max-w-2xl px-4">
            <textarea 
              value={data.description}
              onChange={(e) => updateHeader({ description: e.target.value })}
              onFocus={() => pushToHistory(data)}
              rows={2}
              className="w-full text-lg text-slate-500 font-medium bg-transparent text-center border-none outline-none focus:ring-0 resize-none placeholder:text-slate-200"
              placeholder="Visualize your project journey with precision..."
            />
          </div>
        </div>
      </header>

      <main className="flex-grow bg-white py-6 relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent"></div>
        <div className="overflow-x-auto overflow-y-visible pb-12 custom-scrollbar scroll-smooth">
          <Timeline 
            data={data} 
            onAddStage={addNewStage} 
            onUpdateStage={updateStage}
            onPushHistory={() => pushToHistory(data)}
          />
        </div>
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent"></div>
      </main>

      <section className="bg-[#f8faff] border-t border-slate-200 p-8 md:p-12">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            <div className="lg:col-span-7">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Project Stages</h2>
                  <p className="text-sm text-slate-500 mt-1">Manage the milestones of your timeline.</p>
                </div>
                
                <div className="flex items-center gap-3">
                  <button 
                    onClick={undo}
                    disabled={history.length === 0}
                    className="flex items-center gap-2 px-4 py-2.5 bg-white text-slate-700 rounded-xl transition-all border border-slate-200 shadow-sm hover:shadow-md active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed group"
                    title="Undo last action"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 transition-transform group-active:-rotate-45" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                    </svg>
                    <span className="font-bold text-[11px] uppercase tracking-widest">Undo</span>
                  </button>

                  <button 
                    onClick={exportAsSvg}
                    disabled={data.stages.length === 0}
                    className="flex items-center gap-2 px-5 py-2.5 bg-white text-slate-700 rounded-xl transition-all border border-slate-200 shadow-sm hover:shadow-md active:scale-95 disabled:opacity-50"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    <span className="font-bold text-[11px] uppercase tracking-widest">Export SVG</span>
                  </button>

                  <button 
                    onClick={saveToLocalStorage}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl transition-all shadow-xl active:scale-95 ${saveStatus === 'saved' ? 'bg-indigo-500 text-white shadow-indigo-200' : 'bg-indigo-600 text-white shadow-[0_10px_20px_-5px_rgba(79,70,229,0.4)]'}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="font-black text-[11px] uppercase tracking-widest">
                      {saveStatus === 'saved' ? 'Saved' : 'Save Roadmap'}
                    </span>
                  </button>
                </div>
              </div>
              
              <div className="space-y-6 max-h-[900px] overflow-y-auto pr-4 custom-scrollbar">
                {data.stages.length === 0 ? (
                  <div className="text-center py-24 border-2 border-dashed border-slate-200 rounded-3xl bg-white flex flex-col items-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </div>
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mb-6">Your roadmap is currently empty.</p>
                    <button 
                      onClick={addNewStage}
                      className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-black text-sm uppercase tracking-tight hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 flex items-center gap-2"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                      </svg>
                      Add First Stage
                    </button>
                  </div>
                ) : (
                  <>
                    {data.stages.map((stage, idx) => (
                      <StageEditor 
                        key={stage.id} 
                        stage={stage} 
                        index={idx}
                        isDragging={draggedIndex === idx}
                        onUpdate={(updates) => updateStage(stage.id, updates)}
                        onRemove={() => removeStage(stage.id)}
                        onDragStart={() => handleDragStart(idx)}
                        onDragOver={(e) => handleDragOver(e, idx)}
                        onDragEnd={handleDragEnd}
                      />
                    ))}
                    
                    <button 
                      onClick={addNewStage}
                      className="w-full py-12 border-2 border-dashed border-slate-200 rounded-3xl text-slate-400 font-black uppercase tracking-widest text-[10px] hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50/30 transition-all flex items-center justify-center gap-4 group"
                    >
                      <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                      Add Milestone to Path
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="bg-[#f1f3f5] p-6 rounded-[48px] border border-slate-200/50 sticky top-8 flex flex-col min-h-[700px]">
                <div className="bg-white p-6 rounded-[40px] shadow-sm flex-grow flex flex-col">
                  <div className="flex bg-[#f8fafc] p-1.5 rounded-[22px] mb-8 border border-slate-100">
                    <button 
                      onClick={() => setActiveSidebarTab('ai')}
                      className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-[18px] text-[10px] font-black uppercase tracking-widest transition-all ${activeSidebarTab === 'ai' ? 'bg-white shadow-md text-indigo-600 border border-slate-100' : 'text-slate-400 hover:text-slate-500'}`}
                    >
                      <span className="text-xs">✨</span> AI Blueprint
                    </button>
                    <button 
                      onClick={() => setActiveSidebarTab('json')}
                      className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-[18px] text-[10px] font-black uppercase tracking-widest transition-all ${activeSidebarTab === 'json' ? 'bg-white shadow-md text-indigo-600 border border-slate-100' : 'text-slate-400 hover:text-slate-500'}`}
                    >
                      <span className="text-xs">{"{ }"}</span> JSON Source
                    </button>
                  </div>
                  
                  {activeSidebarTab === 'ai' ? (
                    <div className="space-y-6 flex-grow animate-in fade-in slide-in-from-right-4 duration-300">
                      <div className="flex items-center gap-4 mb-2">
                        <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center border border-amber-100 shadow-inner">
                          <span className="text-2xl text-amber-500">✨</span>
                        </div>
                        <div>
                          <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">AI Assistant</h3>
                          <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Draft in seconds.</p>
                        </div>
                      </div>
                      
                      <div>
                        <label htmlFor="ai-prompt" className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 pl-1">
                          What are you building?
                        </label>
                        <textarea
                          id="ai-prompt"
                          value={prompt}
                          onChange={(e) => setPrompt(e.target.value)}
                          placeholder="e.g., A comprehensive launch plan for a SaaS startup..."
                          className="w-full h-56 p-6 text-sm font-semibold bg-slate-50 border border-slate-200 rounded-[28px] focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none resize-none transition-all placeholder:text-slate-400 text-slate-800"
                        />
                      </div>
                      <button
                        onClick={generateWithAi}
                        disabled={isAiLoading || !prompt.trim()}
                        className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-100 disabled:text-slate-300 text-white rounded-[24px] font-black uppercase tracking-widest transition-all active:scale-[0.98] flex justify-center items-center gap-3 shadow-xl shadow-indigo-100"
                      >
                        {isAiLoading ? (
                          <div className="flex items-center gap-3">
                            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Processing...
                          </div>
                        ) : (
                          <>
                            Generate Roadmap
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </>
                        )}
                      </button>
                    </div>
                  ) : (
                    <div className="flex-grow flex flex-col animate-in fade-in slide-in-from-left-4 duration-300">
                      <JsonEditor data={data} onChange={handleJsonChange} />
                      <p className="mt-6 text-[11px] text-slate-400 font-bold leading-relaxed opacity-70">
                        Pro Tip: Edits here will instantly reflect in the visual roadmap and the editor on the left. You can copy-paste entire roadmaps from other projects here.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-white border-t border-slate-200 py-12">
        <div className="container mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-3 mb-6 bg-slate-50 px-4 py-2 rounded-full border border-slate-100">
             <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
             <p className="text-slate-500 text-[10px] font-black tracking-widest uppercase">Systems Active</p>
          </div>
          <p className="text-slate-400 text-xs font-medium tracking-tight">© 2025 Roadmap Visionary. Design matters.</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
