
import React, { useState, useEffect, useCallback } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { ProjectStage } from './types';
import { INITIAL_STAGES, THEME_COLORS } from './constants';
import Timeline from './components/Timeline';
import StageEditor from './components/StageEditor';

const STORAGE_KEY = 'roadmap_visionary_data';

const App: React.FC = () => {
  const [stages, setStages] = useState<ProjectStage[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : INITIAL_STAGES;
  });
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved'>('idle');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Clear save status message after 3 seconds
  useEffect(() => {
    if (saveStatus === 'saved') {
      const timer = setTimeout(() => setSaveStatus('idle'), 3000);
      return () => clearTimeout(timer);
    }
  }, [saveStatus]);

  const addNewStage = () => {
    const newId = Math.random().toString(36).substr(2, 9);
    const color = THEME_COLORS[stages.length % THEME_COLORS.length];
    setStages([...stages, { 
      id: newId, 
      title: 'New Milestone', 
      description: 'Describe what happens in this stage of your journey.', 
      color 
    }]);
  };

  const removeStage = (id: string) => {
    setStages(stages.filter(s => s.id !== id));
  };

  const updateStage = (id: string, updates: Partial<ProjectStage>) => {
    setStages(stages.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const saveToLocalStorage = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stages));
    setSaveStatus('saved');
  };

  // Drag and Drop Logic
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newStages = [...stages];
    const item = newStages[draggedIndex];
    newStages.splice(draggedIndex, 1);
    newStages.splice(index, 0, item);
    
    setDraggedIndex(index);
    setStages(newStages);
  }, [draggedIndex, stages]);

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

      const data = JSON.parse(response.text);
      const newStages = data.map((item: any, index: number) => ({
        id: Math.random().toString(36).substr(2, 9),
        title: item.title,
        description: item.description,
        color: THEME_COLORS[index % THEME_COLORS.length]
      }));
      setStages(newStages);
      setPrompt('');
    } catch (error) {
      console.error('Error generating stages:', error);
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fcfcfd] text-slate-900 selection:bg-indigo-100">
      <header className="bg-white border-b border-slate-200 pt-16 pb-12 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px] opacity-40"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="inline-block px-3 py-1 mb-6 text-xs font-bold tracking-widest text-indigo-600 uppercase bg-indigo-50 rounded-full">
            Strategic Planning
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-slate-900 mb-4">
            Roadmap <span className="text-indigo-600">Visionary</span>
          </h1>
          <p className="max-w-2xl mx-auto text-lg text-slate-500 font-medium">
            Visualize your project journey with precision. Add stages manually or let AI draft your entire strategy.
          </p>
        </div>
      </header>

      <main className="flex-grow bg-white py-12 relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent"></div>
        <div className="overflow-x-auto overflow-y-visible pb-12 custom-scrollbar scroll-smooth">
          <Timeline stages={stages} />
        </div>
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent"></div>
      </main>

      <section className="bg-[#f8faff] border-t border-slate-200 p-8 md:p-12">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            <div className="lg:col-span-7">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Project Stages</h2>
                  <p className="text-sm text-slate-500 mt-1">Manage the milestones of your timeline.</p>
                </div>
                
                <div className="flex items-center gap-3 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm">
                  <button 
                    onClick={saveToLocalStorage}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all ${saveStatus === 'saved' ? 'bg-emerald-50 text-emerald-600' : 'bg-white hover:bg-slate-50 text-slate-700'}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="font-extrabold text-sm uppercase tracking-tight">
                      {saveStatus === 'saved' ? 'Saved' : 'Save Roadmap'}
                    </span>
                  </button>
                </div>
              </div>
              
              <div className="space-y-4 max-h-[700px] overflow-y-auto pr-4 custom-scrollbar">
                {stages.length === 0 ? (
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
                    {stages.map((stage, idx) => (
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
                      className="w-full py-8 border-2 border-dashed border-slate-200 rounded-3xl text-slate-400 font-black uppercase tracking-widest text-[10px] hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50/30 transition-all flex items-center justify-center gap-4 group"
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
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 sticky top-8">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center border border-amber-100">
                    <span className="text-2xl text-amber-500">✨</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900">AI Blueprint</h3>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Draft in seconds.</p>
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <label htmlFor="ai-prompt" className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">
                      What are you building?
                    </label>
                    <textarea
                      id="ai-prompt"
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="e.g., A comprehensive launch plan for a SaaS startup..."
                      className="w-full h-48 p-5 text-sm font-semibold bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none resize-none transition-all placeholder:text-slate-400 text-slate-800"
                    />
                  </div>
                  <button
                    onClick={generateWithAi}
                    disabled={isAiLoading || !prompt.trim()}
                    className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-100 disabled:text-slate-300 text-white rounded-2xl font-black uppercase tracking-tight transition-all active:scale-[0.98] flex justify-center items-center gap-3 shadow-xl shadow-indigo-100"
                  >
                    {isAiLoading ? (
                      <>
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Planning...
                      </>
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
