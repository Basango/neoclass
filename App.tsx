import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, 
  Layout, 
  BookOpen, 
  Trophy, 
  Clock,
  Sparkles,
  Camera,
  Languages,
  Sun,
  Moon,
  X,
  ArrowRight,
  MoreHorizontal
} from 'lucide-react';
import { analyzeImage } from './services/geminiService';
import { storageService } from './services/storageService';
import { Note, UserStats, ProcessingState } from './types';
import { GalaxyLoader } from './components/Loaders';
import { MandalaProgress } from './components/MandalaProgress';

// --- UI Components ---

const Sidebar = ({ activeTab, setActiveTab }: { activeTab: string, setActiveTab: (t: string) => void }) => {
  const menuItems = [
    { id: 'dashboard', icon: Layout, label: 'Dashboard' },
    { id: 'notes', icon: BookOpen, label: 'Notes' },
    { id: 'revision', icon: Clock, label: 'Revision' },
    { id: 'achievements', icon: Trophy, label: 'Progress' },
  ];

  return (
    <aside className="fixed left-0 top-0 h-screen w-16 md:w-64 glass-panel border-r-0 md:border-r z-30 flex flex-col transition-all duration-300">
      <div className="h-20 flex items-center justify-center md:justify-start px-0 md:px-8 gap-3">
        <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <span className="text-white font-medium text-lg">N</span>
        </div>
        <span className="hidden md:block text-sm font-medium tracking-[0.2em] text-zinc-800 dark:text-zinc-100">NEOCLASS</span>
      </div>

      <nav className="flex-1 px-2 md:px-4 py-8 space-y-1">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200 group relative ${
              activeTab === item.id 
                ? 'bg-zinc-100 dark:bg-white/10 text-zinc-900 dark:text-white' 
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-white/5'
            }`}
          >
            <item.icon 
              className={`w-5 h-5 transition-colors ${activeTab === item.id ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300'}`} 
              strokeWidth={1.5} 
            />
            <span className="hidden md:block text-sm font-medium">{item.label}</span>
            {activeTab === item.id && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-indigo-500 rounded-r-full shadow-[0_0_8px_rgba(99,102,241,0.6)]"></div>
            )}
          </button>
        ))}
      </nav>

      <div className="p-4 md:p-6">
        <div className="glass-panel p-4 rounded-xl relative overflow-hidden group cursor-pointer hover:border-indigo-500/30 transition-colors hidden md:block">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="flex justify-between items-center mb-1">
             <p className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">Exam Countdown</p>
             <Clock size={12} className="text-indigo-500" />
          </div>
          <p className="text-2xl font-light text-zinc-900 dark:text-white">42 <span className="text-xs font-normal text-zinc-500">days</span></p>
        </div>
      </div>
    </aside>
  );
};

const NoteCard = ({ note }: { note: Note }) => (
  <div className="glass-panel p-5 rounded-xl hover-card group cursor-pointer h-full flex flex-col relative overflow-hidden">
    {/* Subtle gradient blob on hover */}
    <div className="absolute -right-10 -top-10 w-32 h-32 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-3xl group-hover:bg-indigo-500/10 dark:group-hover:bg-indigo-500/20 transition-all duration-500"></div>
    
    <div className="flex justify-between items-start mb-3 relative z-10">
      <span className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-white/10 px-2 py-0.5 rounded-md uppercase tracking-wider bg-zinc-50 dark:bg-white/5">
        {note.subject}
      </span>
      {note.status === 'new' && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)]"></div>}
    </div>
    
    <h3 className="text-base font-medium text-zinc-900 dark:text-zinc-100 mb-2 leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
      {note.title}
    </h3>
    
    <p className="text-zinc-500 dark:text-zinc-400 text-xs font-light leading-relaxed line-clamp-3 mb-4 flex-1">
      {note.summary}
    </p>
    
    <div className="flex gap-2 flex-wrap mt-auto pt-3 border-t border-zinc-100 dark:border-white/5">
      {note.tags.slice(0, 2).map(tag => (
        <span key={tag} className="text-[10px] text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors">#{tag}</span>
      ))}
    </div>
  </div>
);

const UploadModal = ({ isOpen, onClose, onNoteProcessed }: { isOpen: boolean, onClose: () => void, onNoteProcessed: (note: Note) => void }) => {
  const [processingState, setProcessingState] = useState<ProcessingState>({ isProcessing: false, stage: 'idle' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      const base64Data = base64String.split(',')[1];

      try {
        setProcessingState({ isProcessing: true, stage: 'analyzing' });
        await new Promise(r => setTimeout(r, 2000)); 
        
        const result = await analyzeImage(base64Data);
        
        const newNote: Note = {
          id: Date.now().toString(),
          title: result.title || 'Untitled Note',
          subject: result.subject || 'General',
          summary: result.summary || 'No summary available.',
          originalText: result.originalText || '',
          dateCreated: new Date().toISOString(),
          status: 'new',
          tags: result.tags || []
        };

        setProcessingState({ isProcessing: true, stage: 'gamifying' });
        await new Promise(r => setTimeout(r, 1000));
        
        onNoteProcessed(newNote);
        onClose();
      } catch (err) {
        console.error(err);
        alert('Failed to process image. Please try again.');
      } finally {
        setProcessingState({ isProcessing: false, stage: 'idle' });
      }
    };
    reader.readAsDataURL(file);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-white/60 dark:bg-black/80 backdrop-blur-md transition-opacity duration-300" onClick={onClose} />
      <div className="w-full max-w-xl min-h-[400px] glass-panel rounded-2xl relative flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 border border-zinc-200 dark:border-white/10">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-white/10 text-zinc-400 transition-colors z-10">
          <X size={20} strokeWidth={1.5} />
        </button>

        {processingState.isProcessing ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 bg-zinc-50/50 dark:bg-[#050505]/50">
             <GalaxyLoader />
          </div>
        ) : (
          <div className="flex-1 flex flex-col p-8">
            <div className="mb-6">
               <h2 className="text-2xl font-medium text-zinc-900 dark:text-white mb-2">Scan Notes</h2>
               <p className="text-zinc-500 font-light text-sm">Upload a photo to instantly digitize and summarize.</p>
            </div>

            <div 
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 border border-dashed border-zinc-200 dark:border-white/10 rounded-xl bg-zinc-50/50 dark:bg-white/[0.02] hover:bg-zinc-100 dark:hover:bg-white/[0.05] hover:border-indigo-400/50 transition-all duration-300 flex flex-col items-center justify-center gap-4 cursor-pointer group relative overflow-hidden"
            >
              <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-white/5 flex items-center justify-center group-hover:scale-105 transition-transform duration-300 border border-zinc-200 dark:border-white/5">
                <Camera className="w-6 h-6 text-zinc-400 group-hover:text-indigo-500 transition-colors" strokeWidth={1.5} />
              </div>
              <div className="text-center z-10">
                <p className="text-sm font-medium text-zinc-700 dark:text-zinc-200">Click to upload</p>
                <p className="text-xs text-zinc-400 mt-1">JPEG, PNG</p>
              </div>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
            </div>
            
            <div className="mt-6 flex items-center justify-between text-zinc-400 text-xs font-light px-1">
               <div className="flex items-center gap-2">
                 <Languages size={14} strokeWidth={1.5} />
                 <span>English & Hindi Supported</span>
               </div>
               <span>AI-Powered</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const RevisionBoard = ({ notes }: { notes: Note[] }) => {
  const columns = [
    { id: 'new', label: 'In Queue', days: 0 },
    { id: 'review_1', label: 'Tomorrow', days: 1 },
    { id: 'review_3', label: '3 Days', days: 3 },
    { id: 'review_7', label: 'Next Week', days: 7 },
  ];

  return (
    <div className="h-full overflow-x-auto pb-4">
      <div className="flex gap-4 min-w-[900px] h-full">
        {columns.map(col => (
          <div key={col.id} className="flex-1 min-w-[220px] flex flex-col gap-3">
            <div className="flex items-center justify-between px-1 py-2">
              <span className="text-xs font-medium text-zinc-400 uppercase tracking-widest">{col.label}</span>
              <span className="text-[10px] text-zinc-500 bg-zinc-100 dark:bg-white/10 px-2 py-0.5 rounded-full font-medium">
                {notes.filter(n => n.status === col.id).length}
              </span>
            </div>
            
            <div className="flex-1 space-y-3 p-1">
              {notes.filter(n => n.status === col.id).length === 0 ? (
                 <div className="h-24 border border-dashed border-zinc-200 dark:border-white/5 rounded-lg flex items-center justify-center">
                    <span className="text-[10px] text-zinc-400 uppercase tracking-widest">Empty</span>
                 </div>
              ) : (
                notes.filter(n => n.status === col.id).map(note => (
                    <div key={note.id} className="glass-panel p-4 rounded-lg hover:border-indigo-400/30 dark:hover:border-indigo-500/30 transition-all cursor-pointer group shadow-sm hover:shadow-md">
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">{note.subject}</span>
                        {note.status !== 'new' && <Clock size={10} className="text-amber-500" />}
                    </div>
                    <h4 className="text-zinc-800 dark:text-zinc-100 font-medium text-sm mb-1">{note.title}</h4>
                    <p className="text-zinc-500 dark:text-zinc-500 text-xs line-clamp-2">{note.summary}</p>
                    </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- Main App ---

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  
  // Data State
  const [notes, setNotes] = useState<Note[]>([]);
  const [stats, setStats] = useState<UserStats>({ streak: 0, xp: 0, level: 1, mandalaProgress: 0 });
  
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  // Initialization: Load data from storage
  useEffect(() => {
    const loadedNotes = storageService.getNotes();
    const loadedStats = storageService.getStats();
    setNotes(loadedNotes);
    setStats(loadedStats);

    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const addNote = (note: Note) => {
    const newNotes = [note, ...notes];
    setNotes(newNotes);
    storageService.saveNotes(newNotes);

    // Gamification Logic: XP gain
    const newStats = { 
        ...stats, 
        xp: stats.xp + 50, 
        mandalaProgress: Math.min(stats.mandalaProgress + 10, 100),
        // Simple streak logic: increment if this is the first action today (mocked)
        streak: stats.streak === 0 ? 1 : stats.streak 
    };
    setStats(newStats);
    storageService.saveStats(newStats);
  };

  // Determine priority note for Dashboard Hero
  const priorityNote = notes.find(n => n.status !== 'mastered' && n.status !== 'new') || notes[0];

  return (
    <div className="min-h-screen text-zinc-900 dark:text-zinc-200 font-sans">
      <div className="bg-grid-black/[0.02] dark:bg-grid-white/[0.02] fixed inset-0 pointer-events-none z-0" />
      
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="pl-16 md:pl-64 flex flex-col min-h-screen relative z-10 transition-all duration-300">
        
        {/* Header */}
        <header className="h-20 flex items-center justify-between px-6 md:px-10 sticky top-0 z-20 backdrop-blur-xl bg-white/70 dark:bg-[#050505]/70 border-b border-zinc-200/50 dark:border-white/5">
          <div>
            <h1 className="text-lg font-medium text-zinc-900 dark:text-white capitalize tracking-tight">{activeTab}</h1>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 font-normal mt-0.5">Welcome back, Student</p>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-400 transition-colors"
            >
              {theme === 'dark' ? <Sun size={18} strokeWidth={1.5} /> : <Moon size={18} strokeWidth={1.5} />}
            </button>

            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-50 dark:bg-orange-500/10 border border-orange-100 dark:border-orange-500/20">
               <Sparkles size={14} className="text-orange-500" />
               <span className="text-xs font-semibold text-orange-600 dark:text-orange-300">{stats.streak} Day Streak</span>
            </div>
            
            <button 
              onClick={() => setIsUploadOpen(true)}
              className="flex items-center gap-2 bg-zinc-900 dark:bg-white text-white dark:text-black px-4 py-2 rounded-full text-sm font-medium hover:opacity-90 transition-opacity shadow-lg shadow-indigo-500/10"
            >
              <Plus size={16} strokeWidth={2} />
              <span className="hidden sm:inline">Add Note</span>
            </button>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full">
          {activeTab === 'dashboard' && (
             <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Hero */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                   <div className="lg:col-span-2 glass-panel rounded-2xl p-8 relative overflow-hidden group">
                      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 via-transparent to-transparent dark:from-indigo-950/30 pointer-events-none"></div>
                      <div className="relative z-10 flex flex-col h-full justify-between">
                        {priorityNote ? (
                            <>
                                <div>
                                <span className="inline-block px-2 py-1 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 text-[10px] font-bold uppercase tracking-wider rounded mb-3">Priority</span>
                                <h2 className="text-3xl font-light text-zinc-900 dark:text-white mb-2 tracking-tight">Focus on <span className="font-medium text-indigo-600 dark:text-indigo-400">{priorityNote.subject}</span></h2>
                                <p className="text-zinc-600 dark:text-zinc-400 font-light max-w-md leading-relaxed text-sm line-clamp-2">
                                    "{priorityNote.title}" is up next for review. 
                                    {priorityNote.status === 'new' ? ' Start your first study session.' : ' Keep your memory fresh.'}
                                </p>
                                </div>
                                <button onClick={() => setActiveTab('revision')} className="w-fit flex items-center gap-2 text-sm font-medium text-zinc-900 dark:text-white hover:gap-3 transition-all mt-6 group/btn">
                                    Start Session <ArrowRight size={16} className="text-indigo-500" />
                                </button>
                            </>
                        ) : (
                            <>
                                <div>
                                <span className="inline-block px-2 py-1 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 text-[10px] font-bold uppercase tracking-wider rounded mb-3">Welcome</span>
                                <h2 className="text-3xl font-light text-zinc-900 dark:text-white mb-2 tracking-tight">Welcome to <span className="font-medium text-indigo-600 dark:text-indigo-400">Neoclass</span></h2>
                                <p className="text-zinc-600 dark:text-zinc-400 font-light max-w-md leading-relaxed text-sm">
                                    Your AI-powered study companion. Upload your first note to begin your journey to mastery.
                                </p>
                                </div>
                                <button onClick={() => setIsUploadOpen(true)} className="w-fit flex items-center gap-2 text-sm font-medium text-zinc-900 dark:text-white hover:gap-3 transition-all mt-6 group/btn">
                                    Upload First Note <ArrowRight size={16} className="text-indigo-500" />
                                </button>
                            </>
                        )}
                      </div>
                   </div>
                   
                   <div className="glass-panel rounded-2xl p-6 flex flex-col items-center justify-center relative min-h-[240px]">
                      <div className="absolute top-4 right-4">
                        <MoreHorizontal size={20} className="text-zinc-300 dark:text-white/20" />
                      </div>
                      <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-6">Mastery Level</h3>
                      <MandalaProgress progress={stats.mandalaProgress} />
                   </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Total Notes', value: notes.length, sub: 'digitized' },
                    { label: 'Reviews Due', value: notes.filter(n => n.status.startsWith('review')).length, sub: 'pending' },
                    { label: 'Mastered', value: notes.filter(n => n.status === 'mastered').length, sub: 'topics' },
                    { label: 'Knowledge XP', value: stats.xp, sub: 'points' },
                  ].map((stat, idx) => (
                    <div key={idx} className="glass-panel p-5 rounded-xl hover-card">
                      <p className="text-2xl font-light text-zinc-900 dark:text-white mb-1">{stat.value}</p>
                      <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">{stat.label}</p>
                      <p className="text-[10px] text-zinc-400 dark:text-zinc-600 mt-1">{stat.sub}</p>
                    </div>
                  ))}
                </div>
             </div>
          )}

          {activeTab === 'notes' && (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
                {notes.length === 0 ? (
                  <div className="col-span-full h-64 flex flex-col items-center justify-center text-zinc-400 dark:text-zinc-600 border border-dashed border-zinc-200 dark:border-white/10 rounded-2xl bg-zinc-50/50 dark:bg-white/[0.02]">
                    <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-white/5 flex items-center justify-center mb-4">
                       <BookOpen size={24} className="opacity-50" strokeWidth={1.5} />
                    </div>
                    <p className="font-light text-sm">Your knowledge universe is empty.</p>
                    <button onClick={() => setIsUploadOpen(true)} className="text-xs text-indigo-500 hover:underline mt-2">Upload your first note</button>
                  </div>
                ) : (
                  notes.map(note => <NoteCard key={note.id} note={note} />)
                )}
             </div>
          )}

          {activeTab === 'revision' && (
            <div className="animate-in fade-in duration-500 h-full">
              <RevisionBoard notes={notes} />
            </div>
          )}

          {activeTab === 'achievements' && (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-8 animate-in zoom-in-95 duration-500">
               <div className="relative">
                 <div className="absolute inset-0 bg-yellow-500/20 blur-3xl rounded-full"></div>
                 <div className="relative w-28 h-28 rounded-full bg-gradient-to-tr from-yellow-50 to-orange-50 dark:from-yellow-400/10 dark:to-orange-500/10 flex items-center justify-center border border-yellow-500/20 shadow-xl">
                    <Trophy size={48} className="text-yellow-600 dark:text-yellow-500" strokeWidth={1} />
                 </div>
               </div>
               
               <div>
                 <h2 className="text-3xl font-light text-zinc-900 dark:text-white tracking-tight">Level {stats.level} Scholar</h2>
                 <p className="text-zinc-500 mt-2 font-light text-sm max-w-xs mx-auto">Consistently reviewing helps you unlock the "Board Exam Warrior" badge.</p>
               </div>
               
               <div className="w-full max-w-sm">
                 <div className="flex justify-between text-[10px] text-zinc-400 uppercase tracking-wider mb-2">
                   <span>Current Progress</span>
                   <span>{stats.xp} / 2000 XP</span>
                 </div>
                 <div className="h-1.5 w-full bg-zinc-100 dark:bg-white/10 rounded-full overflow-hidden">
                   <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 w-[60%] rounded-full relative">
                      <div className="absolute inset-0 bg-white/20 animate-shine"></div>
                   </div>
                 </div>
               </div>
            </div>
          )}
        </div>
      </main>

      <UploadModal 
        isOpen={isUploadOpen} 
        onClose={() => setIsUploadOpen(false)}
        onNoteProcessed={addNote}
      />
    </div>
  );
}

export default App;