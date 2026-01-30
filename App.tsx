
import React, { useState, useEffect, useCallback } from 'react';
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

  const getSanitizedSvg = () => {
    const svgElement = document.getElementById('roadmap-svg-export');
    if (!svgElement) return null;

    const clonedSvg = svgElement.cloneNode(true) as SVGElement;
    clonedSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

    // Handle export-only elements
    const exportOnlyElements = clonedSvg.querySelectorAll('.svg-export-only');
    exportOnlyElements.forEach(el => {
      (el as HTMLElement).style.display = 'block';
    });

    // Handle no-export elements
    const noExportElements = clonedSvg.querySelectorAll('.no-export');
    noExportElements.forEach(el => {
      el.remove();
    });

    // Inline basic styles to ensure they carry over
    const styles = `
      text { font-family: 'Inter', sans-serif; }
      .svg-export-only { display: block !important; }
    `;
    const styleElement = document.createElement('style');
    styleElement.textContent = styles;
    clonedSvg.prepend(styleElement);

    return clonedSvg;
  };

  const exportAsSvg = () => {
    const clonedSvg = getSanitizedSvg();
    if (!clonedSvg) return;

    const serializer = new XMLSerializer();
    const source = serializer.serializeToString(clonedSvg);
    const svgBlob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${data.title.toLowerCase().replace(/\s+/g, '-')}.svg`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportAsJpg = async () => {
    const clonedSvg = getSanitizedSvg();
    if (!clonedSvg) return;

    // To prevent "tainted canvas" error with foreignObject, we must ensure 
    // the image is drawn from a data URL and the browser doesn't block the export.
    // Note: Some browsers strictly block toDataURL if foreignObject is present.
    const width = parseFloat(clonedSvg.getAttribute('width') || '2000');
    const height = parseFloat(clonedSvg.getAttribute('height') || '2000');
    
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(clonedSvg);
    
    // Using base64 encoding instead of Blob URL can sometimes help with tainting
    const svgBase64 = btoa(unescape(encodeURIComponent(svgString)));
    const img = new Image();
    img.crossOrigin = 'anonymous'; // Try to avoid tainting

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const scale = 2; // Retina quality
        canvas.width = width * scale;
        canvas.height = height * scale;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.scale(scale, scale);
          ctx.drawImage(img, 0, 0);
          
          // If this fails, it's due to foreignObject security restrictions in the browser
          const jpgUrl = canvas.toDataURL('image/jpeg', 0.9);
          const link = document.createElement('a');
          link.download = `${data.title.toLowerCase().replace(/\s+/g, '-')}.jpg`;
          link.href = jpgUrl;
          link.click();
        }
      } catch (err) {
        console.error('Export failed due to browser security restrictions on SVG foreignObjects:', err);
        alert('Could not export as JPG due to security restrictions. Please try SVG export instead.');
      }
    };
    img.src = `data:image/svg+xml;base64,${svgBase64}`;
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
        contents: `Create a professional project timeline: "${prompt}". Return JSON array of objects: {title, description}.`,
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
      console.error('AI Error:', error);
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fcfcfd] text-slate-900">
      <header className="bg-white pt-12 pb-8 text-center relative">
        <div className="container mx-auto px-4 flex flex-col items-center">
          <input 
            value={data.title}
            onChange={(e) => updateHeader({ title: e.target.value })}
            className="w-full text-4xl md:text-6xl font-black text-slate-900 bg-transparent text-center border-none outline-none focus:ring-0 placeholder:text-slate-200"
            placeholder="Roadmap Title"
          />
          <textarea 
            value={data.description}
            onChange={(e) => updateHeader({ description: e.target.value })}
            rows={2}
            className="w-full max-w-2xl text-lg text-slate-500 font-medium bg-transparent text-center border-none outline-none focus:ring-0 resize-none placeholder:text-slate-200 mt-2"
            placeholder="Description..."
          />
        </div>
      </header>

      <main className="flex-grow bg-white py-6">
        <div className="overflow-x-auto overflow-y-visible pb-12 custom-scrollbar">
          <Timeline 
            data={data} 
            onAddStage={addNewStage}
            onUpdateStage={updateStage}
            onPushHistory={() => pushToHistory(data)}
          />
        </div>
      </main>

      <section className="bg-[#f8faff] border-t border-slate-100 p-8 md:p-12">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          <div className="lg:col-span-7">
            <div className="flex justify-between items-start mb-10">
              <div>
                <h2 className="text-2xl font-black text-slate-900">Project Stages</h2>
                <p className="text-sm text-slate-500 font-medium">Manage the milestones of your timeline.</p>
              </div>
              
              <div className="flex flex-col items-end gap-3">
                <div className="flex items-center gap-3">
                  {/* Undo Button */}
                  <button 
                    onClick={undo}
                    disabled={history.length === 0}
                    className="flex items-center gap-2 px-6 py-2.5 bg-white text-slate-400 border border-slate-200 rounded-2xl transition-all font-black text-[10px] uppercase tracking-widest disabled:opacity-30 hover:text-slate-900 shadow-sm"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"/></svg>
                    Undo
                  </button>

                  {/* Segmented Export Control */}
                  <div className="flex bg-white rounded-2xl border border-slate-200 p-1 shadow-sm">
                    <button 
                      onClick={exportAsSvg} 
                      className="px-5 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-900 transition-all flex items-center gap-1.5 border-r border-slate-100"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                      SVG
                    </button>
                    <button 
                      onClick={exportAsJpg} 
                      className="px-5 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-900 transition-all flex items-center gap-1.5"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                      JPG
                    </button>
                  </div>
                </div>

                {/* Prominent Save Button */}
                <button 
                  onClick={saveToLocalStorage}
                  className="w-full md:w-auto px-10 py-3 bg-[#5046e5] text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl shadow-indigo-100 flex items-center justify-center gap-2 transition-all hover:bg-[#4338ca] active:scale-[0.98]"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/></svg>
                  {saveStatus === 'saved' ? 'Roadmap Saved!' : 'Save Roadmap'}
                </button>
              </div>
            </div>
            
            <div className="space-y-6">
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
              <button onClick={addNewStage} className="w-full py-10 border-2 border-dashed border-slate-200 rounded-[40px] text-slate-400 font-black uppercase tracking-widest text-[11px] hover:bg-white hover:border-indigo-300 hover:text-indigo-600 transition-all flex items-center justify-center gap-2">
                <span className="text-xl">+</span> Add Stage
              </button>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="bg-[#f1f3f5] p-6 rounded-[56px] sticky top-8">
              <div className="bg-white p-8 rounded-[48px] shadow-sm min-h-[640px] flex flex-col">
                <div className="flex bg-[#f8fafc] p-1.5 rounded-[26px] mb-8 border border-slate-100">
                  <button 
                    onClick={() => setActiveSidebarTab('ai')}
                    className={`flex-1 py-4 rounded-[22px] text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeSidebarTab === 'ai' ? 'bg-white shadow-md text-indigo-600' : 'text-slate-400'}`}
                  >
                    ✨ AI Blueprint
                  </button>
                  <button 
                    onClick={() => setActiveSidebarTab('json')}
                    className={`flex-1 py-4 rounded-[22px] text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeSidebarTab === 'json' ? 'bg-white shadow-md text-indigo-600' : 'text-slate-400'}`}
                  >
                    <span className="text-sm">{"{ }"}</span> JSON Source
                  </button>
                </div>
                
                {activeSidebarTab === 'ai' ? (
                  <div className="space-y-6 flex-grow">
                    <textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="Describe your project journey in a few sentences..."
                      className="w-full h-56 p-6 text-sm font-semibold bg-slate-50 border border-slate-200 rounded-[32px] focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none resize-none transition-all"
                    />
                    <button
                      onClick={generateWithAi}
                      disabled={isAiLoading || !prompt.trim()}
                      className="w-full py-5 bg-[#5046e5] text-white rounded-[28px] font-black uppercase tracking-widest transition-all hover:bg-[#4338ca] disabled:opacity-50 shadow-lg shadow-indigo-100"
                    >
                      {isAiLoading ? 'Synthesizing Roadmap...' : 'Generate Roadmap'}
                    </button>
                  </div>
                ) : (
                  <div className="flex-grow flex flex-col">
                    <JsonEditor data={data} onChange={handleJsonChange} />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default App;
