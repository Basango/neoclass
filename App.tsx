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
  MoreHorizontal,
  Calendar as CalendarIcon,
  CheckCircle2,
  BrainCircuit,
  HelpCircle,
  ChevronRight,
  LogOut,
  Loader2,
  ChevronLeft,
  GripVertical,
  Flag,
  CalendarDays,
  Coffee
} from 'lucide-react';
import { analyzeImage } from './services/geminiService';
import { storageService } from './services/storageService';
import { authService } from './services/authService';
import { supabase } from './services/supabase';
import { Note, UserStats, ProcessingState, UserProfile } from './types';
import { GalaxyLoader } from './components/Loaders';
import { MandalaProgress } from './components/MandalaProgress';
import { LandingPage } from './components/LandingPage';

// --- Helper Functions ---
const getNextStatus = (currentStatus: Note['status']): Note['status'] => {
  if (currentStatus === 'new') return 'review_1';
  if (currentStatus === 'review_1') return 'review_3';
  if (currentStatus === 'review_3') return 'review_7';
  return 'mastered';
};

const compressImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const MAX_WIDTH = 1024;
        const MAX_HEIGHT = 1024;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        // Get raw base64 data (remove prefix)
        const dataUrl = canvas.toDataURL('image/jpeg', 0.6); // 60% quality is enough for OCR
        const base64 = dataUrl.split(',')[1];
        resolve(base64);
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
};

const isSameDay = (d1: string | Date, d2: string | Date) => {
    const date1 = new Date(d1);
    const date2 = new Date(d2);
    return date1.toDateString() === date2.toDateString();
};

// --- UI Components ---

const Sidebar = ({ activeTab, setActiveTab, onLogout }: { activeTab: string, setActiveTab: (t: string) => void, onLogout: () => void }) => {
  const menuItems = [
    { id: 'dashboard', icon: Layout, label: 'Dashboard' },
    { id: 'notes', icon: BookOpen, label: 'Notes' },
    { id: 'revision', icon: CalendarDays, label: 'Revision' },
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

      {/* Logout Button in Sidebar */}
      <div className="p-4 mt-auto">
        <button 
          onClick={onLogout}
          className="w-full flex items-center gap-3 p-3 text-zinc-400 hover:text-red-500 transition-colors"
        >
          <LogOut size={20} strokeWidth={1.5} />
          <span className="hidden md:block text-sm">Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

// Fixed NoteCard type definition to include React.FC for correct key prop handling
const NoteCard: React.FC<{ note: Note, onClick: () => void }> = ({ note, onClick }) => {
  // Determine if note is scheduled for future
  const upcoming = note.studySchedule
    .map(d => new Date(d))
    .filter(d => d > new Date())
    .sort((a,b) => a.getTime() - b.getTime())[0];

  return (
    <div onClick={onClick} className="glass-panel p-5 rounded-xl hover-card group cursor-pointer h-full flex flex-col relative overflow-hidden">
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
      
      <div className="flex justify-between items-center mt-auto pt-3 border-t border-zinc-100 dark:border-white/5">
        <div className="flex gap-2 flex-wrap">
          {note.tags.slice(0, 2).map(tag => (
            <span key={tag} className="text-[10px] text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors">#{tag}</span>
          ))}
        </div>
        {upcoming && (
          <span className="text-[10px] text-zinc-400 flex items-center gap-1">
             <Clock size={10} /> {upcoming.toLocaleDateString(undefined, {month:'short', day:'numeric'})}
          </span>
        )}
      </div>
    </div>
  );
};

// Fixed QuizCard type definition to include React.FC for correct key prop handling
const QuizCard: React.FC<{ question: { question: string, answer: string }, index: number }> = ({ question, index }) => {
  const [isRevealed, setIsRevealed] = useState(false);

  return (
    <div className="glass-panel p-6 rounded-xl border border-zinc-200 dark:border-white/10 transition-all duration-300 hover:border-indigo-500/30">
       <div className="flex gap-4">
          <span className="flex-shrink-0 w-8 h-8 rounded-full bg-zinc-100 dark:bg-white/5 text-zinc-500 flex items-center justify-center text-sm font-medium border border-zinc-200 dark:border-white/5">{index + 1}</span>
          <div className="space-y-3 flex-1">
             <h3 className="text-base md:text-lg text-zinc-800 dark:text-zinc-100 font-medium leading-snug">{question.question}</h3>
             
             <div 
               onClick={() => setIsRevealed(!isRevealed)}
               className={`relative overflow-hidden rounded-lg border transition-all duration-300 cursor-pointer ${
                 isRevealed 
                   ? 'bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-500/20' 
                   : 'bg-zinc-50 dark:bg-white/5 border-zinc-100 dark:border-white/5 hover:bg-zinc-100 dark:hover:bg-white/10'
               }`}
             >
                <div className="p-4">
                   <div className="flex items-center justify-between mb-2">
                       <span className={`text-[10px] font-bold uppercase tracking-widest ${isRevealed ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-400'}`}>
                         Answer
                       </span>
                       {isRevealed ? (
                           <span className="text-[10px] text-zinc-400 uppercase tracking-wider">Tap to hide</span>
                       ) : null}
                   </div>
                   
                   <div className="relative">
                       {/* Blur answer logic: We render the text but blur it if not revealed. 'user-select-none' prevents cheating by highlighting. */}
                       <p className={`text-sm leading-relaxed transition-all duration-500 text-zinc-700 dark:text-zinc-300 ${isRevealed ? 'blur-0' : 'blur-md select-none opacity-50'}`}>
                          {question.answer}
                       </p>
                       
                       {!isRevealed && (
                           <div className="absolute inset-0 flex items-center justify-center z-10">
                               <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/50 dark:bg-black/50 backdrop-blur-sm border border-zinc-200/50 dark:border-white/10 shadow-sm">
                                  <HelpCircle size={14} /> Tap to reveal
                               </span>
                           </div>
                       )}
                   </div>
                </div>
             </div>
          </div>
       </div>
    </div>
  );
};

const NoteDetailModal = ({ 
    note, 
    isOpen, 
    onClose, 
    onMarkRevised, 
    isUpdating 
}: { 
    note: Note | null, 
    isOpen: boolean, 
    onClose: () => void, 
    onMarkRevised: (n: Note) => void,
    isUpdating?: boolean
}) => {
  const [tab, setTab] = useState<'cornell' | 'quiz'>('cornell');
  
  if (!isOpen || !note) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-6">
      <div className="absolute inset-0 bg-white/60 dark:bg-black/80 backdrop-blur-md transition-opacity duration-300" onClick={onClose} />
      
      <div className="w-full h-full md:max-w-5xl md:h-[90vh] glass-panel md:rounded-2xl relative flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 border-none md:border md:border-zinc-200 md:dark:border-white/10 bg-zinc-50/90 dark:bg-[#0a0a0a]/90">
        
        {/* Modal Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-zinc-200/50 dark:border-white/5 bg-white/50 dark:bg-white/5 backdrop-blur-sm">
           <div className="flex items-center gap-4">
              <button onClick={onClose} className="p-2 -ml-2 rounded-full hover:bg-zinc-100 dark:hover:bg-white/10 text-zinc-400">
                <ArrowRight size={20} className="rotate-180" strokeWidth={1.5} />
              </button>
              <div>
                <h2 className="text-lg font-medium text-zinc-900 dark:text-white line-clamp-1">{note.title}</h2>
                <div className="flex items-center gap-2 text-xs text-zinc-500">
                   <span>{note.subject}</span>
                   <span className="w-1 h-1 bg-zinc-300 rounded-full"></span>
                   <span className="uppercase">{note.status.replace('_', ' ')}</span>
                </div>
              </div>
           </div>

           <div className="flex gap-2">
             <button 
               onClick={() => setTab('cornell')}
               className={`px-4 py-2 text-xs font-medium rounded-lg transition-colors ${tab === 'cornell' ? 'bg-zinc-900 dark:bg-white text-white dark:text-black' : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-white/5'}`}
             >
               Cornell Notes
             </button>
             <button 
               onClick={() => setTab('quiz')}
               className={`px-4 py-2 text-xs font-medium rounded-lg transition-colors ${tab === 'quiz' ? 'bg-zinc-900 dark:bg-white text-white dark:text-black' : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-white/5'}`}
             >
               Quiz ({note.quiz?.length || 0})
             </button>
           </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 md:p-10 bg-white/40 dark:bg-[#050505]/40">
           {tab === 'cornell' && (
             <div className="max-w-4xl mx-auto min-h-full flex flex-col shadow-sm border border-zinc-200 dark:border-white/5 bg-white dark:bg-[#121212] rounded-lg overflow-hidden">
                {/* Header of Paper */}
                <div className="p-6 border-b border-zinc-100 dark:border-white/5 bg-zinc-50/50 dark:bg-white/[0.02]">
                   <h1 className="text-2xl font-serif text-zinc-900 dark:text-white mb-2">{note.title}</h1>
                   <div className="flex gap-2">
                      {note.tags.map(t => <span key={t} className="text-[10px] px-2 py-0.5 bg-zinc-100 dark:bg-white/10 rounded text-zinc-500">#{t}</span>)}
                   </div>
                </div>

                <div className="flex-1 flex flex-col md:flex-row">
                   {/* Left Column: Cues */}
                   <div className="w-full md:w-[30%] border-b md:border-b-0 md:border-r border-zinc-100 dark:border-white/5 p-6 bg-zinc-50/30 dark:bg-white/[0.01]">
                      <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <BrainCircuit size={14} /> Cues
                      </h3>
                      <ul className="space-y-4">
                        {(note.cues || []).map((cue, i) => (
                           <li key={i} className="text-sm font-medium text-indigo-600 dark:text-indigo-400 leading-snug">{cue}</li>
                        ))}
                        {(note.cues?.length === 0) && <p className="text-xs text-zinc-400 italic">No cues generated.</p>}
                      </ul>
                   </div>

                   {/* Right Column: Notes */}
                   <div className="w-full md:w-[70%] p-6 md:p-8">
                      <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4">Notes</h3>
                      <div className="prose dark:prose-invert prose-sm max-w-none text-zinc-700 dark:text-zinc-300 font-light leading-relaxed whitespace-pre-wrap">
                         {note.originalText}
                      </div>
                   </div>
                </div>

                {/* Bottom: Summary */}
                <div className="border-t border-zinc-100 dark:border-white/5 p-6 bg-indigo-50/30 dark:bg-indigo-950/10">
                   <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Summary</h3>
                   <p className="text-sm text-zinc-600 dark:text-zinc-300 italic">"{note.summary}"</p>
                </div>
             </div>
           )}

           {tab === 'quiz' && (
             <div className="max-w-2xl mx-auto space-y-6">
                {(note.quiz || []).map((q, i) => (
                   <QuizCard key={i} question={q} index={i} />
                ))}
                {(note.quiz?.length === 0) && (
                   <div className="text-center py-20 text-zinc-400">
                      <HelpCircle size={48} className="mx-auto mb-4 opacity-20" />
                      <p>No quiz questions available for this note.</p>
                   </div>
                )}
             </div>
           )}
        </div>

        {/* Modal Footer */}
        <div className="p-6 border-t border-zinc-200/50 dark:border-white/5 bg-white/50 dark:bg-[#0a0a0a]/80 backdrop-blur-md flex justify-end items-center">
           <button 
             onClick={() => onMarkRevised(note)}
             disabled={isUpdating}
             className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-full text-sm font-medium transition-all shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/40 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed"
           >
             {isUpdating ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
             Mark Revised
           </button>
        </div>
      </div>
    </div>
  );
};

const UploadModal = ({ isOpen, onClose, onNoteProcessed }: { isOpen: boolean, onClose: () => void, onNoteProcessed: (note: Note) => void }) => {
  const [processingState, setProcessingState] = useState<ProcessingState>({ isProcessing: false, stage: 'idle' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input so same file can be selected again if user retries
    e.target.value = '';

    try {
      setProcessingState({ isProcessing: true, stage: 'analyzing' });
      
      const base64Data = await compressImage(file);
      const result = await analyzeImage(base64Data);
      
      const newNote: Note = {
        id: crypto.randomUUID(),
        title: result.title || 'Untitled Note',
        subject: result.subject || 'General',
        summary: result.summary || 'No summary available.',
        originalText: result.originalText || '',
        cues: result.cues || [],
        quiz: result.quiz || [],
        dateCreated: new Date().toISOString(),
        status: 'new',
        tags: result.tags || [],
        studySchedule: [] // Initialize as empty
      };

      setProcessingState({ isProcessing: true, stage: 'gamifying' });
      // Minimal delay just to show the status transition
      await new Promise(r => setTimeout(r, 500));
      
      onNoteProcessed(newNote);
      onClose();
    } catch (err) {
      console.error(err);
      alert('Failed to process image. Please try again.');
    } finally {
      setProcessingState({ isProcessing: false, stage: 'idle' });
    }
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
               <p className="text-zinc-500 font-light text-sm">Upload a photo to instantly digitize, create Cornell notes, and quizzes.</p>
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
          </div>
        )}
      </div>
    </div>
  );
};

const CalendarBoard = ({ 
  notes, 
  onUpdateNote 
}: { 
  notes: Note[], 
  onUpdateNote: (note: Note) => void 
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [draggedNoteId, setDraggedNoteId] = useState<string | null>(null);

  // Calendar Logic
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const handlePrevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const handleDragStart = (e: React.DragEvent, noteId: string) => {
    e.dataTransfer.setData("text/plain", noteId);
    setDraggedNoteId(noteId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Allow drop
  };

  const handleDrop = (e: React.DragEvent, day: number) => {
    e.preventDefault();
    const noteId = e.dataTransfer.getData("text/plain");
    const targetDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    
    // Set time to noon to avoid timezone shift issues
    targetDate.setHours(12, 0, 0, 0);
    const targetDateIso = targetDate.toISOString();

    const note = notes.find(n => n.id === noteId);
    if (note) {
      // Add date to existing schedule (don't duplicate if already there for that specific day)
      const existing = note.studySchedule.find(d => isSameDay(d, targetDateIso));
      if (!existing) {
         const newSchedule = [...note.studySchedule, targetDateIso].sort();
         const updatedNote = { ...note, studySchedule: newSchedule };
         onUpdateNote(updatedNote);
      }
    }
    setDraggedNoteId(null);
  };

  const handleExamDateChange = (noteId: string, dateStr: string) => {
    const note = notes.find(n => n.id === noteId);
    if (note) {
      const updatedNote = { ...note, examDate: dateStr };
      onUpdateNote(updatedNote);
    }
  };

  const generate137Plan = (note: Note) => {
     if (!note.examDate) return;
     // 1-3-7 Plan: Schedule for Day 1, Day 3, and Day 7 from TODAY
     const today = new Date();
     const day1 = new Date(today); day1.setDate(today.getDate() + 1);
     const day3 = new Date(today); day3.setDate(today.getDate() + 3);
     const day7 = new Date(today); day7.setDate(today.getDate() + 7);
     
     const newSchedule = [
         day1.toISOString(),
         day3.toISOString(),
         day7.toISOString()
     ];

     const updatedNote = { ...note, status: 'new' as const, studySchedule: newSchedule };
     onUpdateNote(updatedNote);
     alert(`1-3-7 Plan Activated for "${note.title}". Review sessions added.`);
  };

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-140px)] gap-6 animate-in fade-in duration-500">
      
      {/* Sidebar: Study Queue */}
      <div className="w-full lg:w-80 flex flex-col glass-panel rounded-2xl overflow-hidden flex-shrink-0">
         <div className="p-4 border-b border-zinc-100 dark:border-white/5 bg-zinc-50/50 dark:bg-white/[0.02]">
            <h3 className="text-sm font-medium text-zinc-900 dark:text-white flex items-center gap-2">
               <GripVertical size={16} className="text-zinc-400" /> Study Queue
            </h3>
            <p className="text-[10px] text-zinc-500 mt-1">Drag notes to calendar to reschedule.</p>
         </div>
         <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {notes.map(note => (
               <div 
                  key={note.id} 
                  draggable
                  onDragStart={(e) => handleDragStart(e, note.id)}
                  className="bg-white dark:bg-[#121212] p-3 rounded-xl border border-zinc-200 dark:border-white/5 shadow-sm hover:shadow-md cursor-move group transition-all"
               >
                  <div className="flex justify-between items-start mb-2">
                     <span className="text-[10px] uppercase tracking-wider text-zinc-500 bg-zinc-100 dark:bg-white/5 px-1.5 py-0.5 rounded">
                        {note.subject}
                     </span>
                     {note.examDate && <Flag size={12} className="text-red-500 fill-red-500/20" />}
                  </div>
                  <h4 className="text-sm font-medium text-zinc-800 dark:text-zinc-200 line-clamp-2 leading-tight">{note.title}</h4>
                  
                  {/* Quick Exam Input */}
                  <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-white/5 flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-zinc-400">Exam:</span>
                        <input 
                            type="date" 
                            className="bg-transparent text-[10px] text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-white/10 rounded px-1 py-0.5 focus:outline-none focus:border-indigo-500 w-full"
                            value={note.examDate ? note.examDate.split('T')[0] : ''}
                            onChange={(e) => handleExamDateChange(note.id, e.target.value)}
                        />
                      </div>
                      {note.examDate && (
                          <button 
                            onClick={() => generate137Plan(note)}
                            className="text-[10px] bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 py-1 rounded hover:bg-indigo-200 dark:hover:bg-indigo-500/30 transition-colors w-full"
                          >
                             Generate 1-3-7 Plan
                          </button>
                      )}
                  </div>
               </div>
            ))}
         </div>
      </div>

      {/* Main Calendar */}
      <div className="flex-1 glass-panel rounded-2xl p-6 flex flex-col overflow-hidden">
         {/* Calendar Header */}
         <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-light text-zinc-900 dark:text-white capitalize">
               {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </h2>
            <div className="flex gap-2">
               <button onClick={handlePrevMonth} className="p-2 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-full text-zinc-500 transition-colors">
                  <ChevronLeft size={20} />
               </button>
               <button onClick={handleNextMonth} className="p-2 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-full text-zinc-500 transition-colors">
                  <ChevronRight size={20} />
               </button>
            </div>
         </div>

         {/* Days Header */}
         <div className="grid grid-cols-7 mb-4">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
               <div key={day} className="text-center text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  {day}
               </div>
            ))}
         </div>

         {/* Calendar Grid */}
         <div className="flex-1 grid grid-cols-7 grid-rows-5 gap-2 md:gap-4 overflow-y-auto">
            {/* Empty cells for previous month */}
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
               <div key={`empty-${i}`} className="opacity-0" />
            ))}
            
            {/* Days */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
               const day = i + 1;
               const dateStr = new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString();
               const isToday = new Date().toDateString() === dateStr;
               
               // Find items for this day
               const daysNotes = notes.filter(n => {
                   return n.studySchedule.some(s => isSameDay(s, dateStr));
               });
               
               const daysExams = notes.filter(n => {
                   if (!n.examDate) return false;
                   return isSameDay(n.examDate, dateStr);
               });

               return (
                  <div 
                     key={day}
                     onDragOver={handleDragOver}
                     onDrop={(e) => handleDrop(e, day)}
                     className={`relative border rounded-xl p-2 transition-all min-h-[80px] flex flex-col gap-1 overflow-hidden ${
                        isToday 
                           ? 'bg-indigo-50/50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/30 ring-1 ring-indigo-500/20' 
                           : 'bg-zinc-50/30 dark:bg-white/[0.02] border-zinc-100 dark:border-white/5 hover:bg-zinc-100 dark:hover:bg-white/5'
                     }`}
                  >
                     <span className={`text-xs font-medium mb-1 ${isToday ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-400'}`}>
                        {day}
                     </span>
                     
                     {/* Exams */}
                     {daysExams.map(note => (
                        <div key={`exam-${note.id}`} className="bg-red-100 dark:bg-red-500/20 border border-red-200 dark:border-red-500/30 rounded px-1.5 py-0.5 flex items-center gap-1">
                           <Flag size={10} className="text-red-600 dark:text-red-400 fill-red-600" />
                           <span className="text-[10px] font-bold text-red-800 dark:text-red-200 truncate w-full">{note.subject} Exam</span>
                        </div>
                     ))}

                     {/* Revision Sessions */}
                     <div className="flex flex-col gap-1 overflow-y-auto hide-scrollbar">
                        {daysNotes.map(note => (
                           <div key={`rev-${note.id}`} className="bg-white dark:bg-[#1e1e1e] border border-zinc-200 dark:border-white/10 rounded px-1.5 py-1 shadow-sm flex items-center gap-1 group/item cursor-pointer hover:border-indigo-400 transition-colors">
                              <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                                 note.status === 'mastered' ? 'bg-emerald-500' :
                                 note.status === 'review_7' ? 'bg-purple-500' : 
                                 'bg-indigo-500'
                              }`} />
                              <span className="text-[10px] text-zinc-700 dark:text-zinc-300 truncate">{note.title}</span>
                           </div>
                        ))}
                     </div>
                  </div>
               );
            })}
         </div>
      </div>
    </div>
  );
};

// --- Main App ---

function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Data State
  const [notes, setNotes] = useState<Note[]>([]);
  const [stats, setStats] = useState<UserStats>({ streak: 0, xp: 0, level: 1, mandalaProgress: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  // Computed state for today's tasks
  const todaysNotes = notes.filter(n => n.studySchedule.some(d => isSameDay(d, new Date())));

  const loadData = async () => {
      try {
          const [loadedNotes, loadedStats] = await Promise.all([
              storageService.getNotes(),
              storageService.getStats()
          ]);
          setNotes(loadedNotes);
          setStats(loadedStats);
      } catch (e) {
          console.error("Failed to load data", e);
      }
      setIsLoading(false);
  };

  // Initialization: Listen to Supabase Auth Changes
  useEffect(() => {
    // 1. Initial Session Check
    if (supabase) {
        supabase.auth.getUser().then(({ data: { user } }) => {
            if (user) {
                const meta = user.user_metadata || {};
                setUser({
                    id: user.id,
                    name: meta.full_name || 'Student',
                    email: user.email || '',
                    grade: meta.grade || '10',
                    joinedAt: user.created_at
                });
                loadData();
            } else {
                setIsLoading(false);
            }
        });

        // 2. Subscribe to auth changes (Sign In / Sign Out)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' && session?.user) {
                const user = session.user;
                const meta = user.user_metadata || {};
                setUser({
                    id: user.id,
                    name: meta.full_name || 'Student',
                    email: user.email || '',
                    grade: meta.grade || '10',
                    joinedAt: user.created_at
                });
                loadData();
            } else if (event === 'SIGNED_OUT') {
                setUser(null);
                setNotes([]);
                setStats({ streak: 0, xp: 0, level: 1, mandalaProgress: 0 });
                setActiveTab('dashboard');
            }
        });

        return () => subscription.unsubscribe();
    } else {
        setIsLoading(false);
    }
  }, []);

  // Theme Management
  useEffect(() => {
      document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  // Handle Login State Change (Only used by LandingPage to force refresh if listener doesn't catch it immediately)
  const handleLogin = (newUser: UserProfile) => {
      setUser(newUser);
      loadData();
  };

  const handleLogout = () => {
      authService.logout();
      // State is cleared by onAuthStateChange listener
  };

  const addNote = async (note: Note) => {
    const newNotes = [note, ...notes];
    setNotes(newNotes);
    
    const newStats = { 
        ...stats, 
        xp: stats.xp + 50, 
        mandalaProgress: Math.min(stats.mandalaProgress + 5, 100)
    };
    setStats(newStats);

    // Save only the new note to DB to avoid bulk errors
    try {
        await Promise.all([
          storageService.upsertNote(note),
          storageService.saveStats(newStats)
        ]);
    } catch (e) {
        console.error("Failed to persist new note", e);
        // Optional: revert state or show alert
    }
  };

  const handleMarkRevised = async (note: Note) => {
    setIsUpdating(true);
    try {
        const nextStatus = getNextStatus(note.status);
        
        // Update status but keep schedule intact
        const updatedNote = { ...note, status: nextStatus };
        const updatedNotes = notes.map(n => n.id === note.id ? updatedNote : n);
        
        setNotes(updatedNotes);
        setSelectedNote(updatedNote); 

        const newStats = {
        ...stats,
        xp: stats.xp + 100,
        streak: stats.streak + 1,
        mandalaProgress: Math.min(stats.mandalaProgress + 15, 100)
        };
        setStats(newStats);

        await Promise.all([
            storageService.upsertNote(updatedNote),
            storageService.saveStats(newStats)
        ]);
    } catch (e) {
        console.error("Failed to mark revised", e);
        alert("Could not save progress. Please try again.");
    } finally {
        setIsUpdating(false);
    }
  };

  const updateNote = async (updatedNote: Note) => {
    const updatedNotes = notes.map(n => n.id === updatedNote.id ? updatedNote : n);
    setNotes(updatedNotes);
    try {
        await storageService.upsertNote(updatedNote);
    } catch (e) {
        console.error("Failed to update note", e);
    }
  };

  const openNoteDetail = (note: Note) => {
    setSelectedNote(note);
    setIsDetailOpen(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-[#050505] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin"></div>
      </div>
    );
  }

  // AUTH CHECK: Render Landing Page if no user
  if (!user) {
      return <LandingPage onLogin={handleLogin} />;
  }

  // MAIN DASHBOARD
  return (
    <div className="min-h-screen text-zinc-900 dark:text-zinc-200 font-sans">
      <div className="bg-grid-black/[0.02] dark:bg-grid-white/[0.02] fixed inset-0 pointer-events-none z-0" />
      
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} onLogout={handleLogout} />
      
      <main className="pl-16 md:pl-64 flex flex-col min-h-screen relative z-10 transition-all duration-300">
        
        {/* Header */}
        <header className="h-20 flex items-center justify-between px-6 md:px-10 sticky top-0 z-20 backdrop-blur-xl bg-white/70 dark:bg-[#050505]/70 border-b border-zinc-200/50 dark:border-white/5">
          <div>
            <h1 className="text-lg font-medium text-zinc-900 dark:text-white capitalize tracking-tight">{activeTab}</h1>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 font-normal mt-0.5">Welcome back, {user.name.split(' ')[0]}</p>
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
                   <div className="lg:col-span-2 glass-panel rounded-2xl p-8 relative overflow-hidden group min-h-[300px] flex flex-col">
                      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 via-transparent to-transparent dark:from-indigo-950/30 pointer-events-none"></div>
                      
                      {todaysNotes.length > 0 ? (
                            <div className="relative z-10 flex flex-col h-full">
                                <span className="inline-block w-fit px-2 py-1 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 text-[10px] font-bold uppercase tracking-wider rounded mb-6">Today's Focus</span>
                                
                                <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                                   {todaysNotes.map(note => (
                                     <div key={note.id} onClick={() => openNoteDetail(note)} className="bg-white/50 dark:bg-white/5 hover:bg-white/80 dark:hover:bg-white/10 p-4 rounded-xl border border-zinc-100 dark:border-white/5 cursor-pointer transition-colors flex items-center justify-between group/item">
                                        <div>
                                            <h3 className="text-sm font-medium text-zinc-900 dark:text-white">{note.title}</h3>
                                            <p className="text-xs text-zinc-500">{note.subject}</p>
                                        </div>
                                        <ArrowRight size={16} className="text-zinc-300 group-hover/item:text-indigo-400 transition-colors" />
                                     </div>
                                   ))}
                                </div>
                            </div>
                        ) : (
                            <div className="relative z-10 flex flex-col items-center justify-center h-full text-center p-6">
                                <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center mb-4">
                                   <Coffee size={24} className="text-emerald-600 dark:text-emerald-400" strokeWidth={1.5} />
                                </div>
                                <h2 className="text-2xl font-light text-zinc-900 dark:text-white mb-2 tracking-tight">You're free for now.</h2>
                                <p className="text-zinc-600 dark:text-zinc-400 font-light max-w-sm text-sm">
                                    Nothing scheduled for today. Take a break or upload a new note to get ahead.
                                </p>
                                <button onClick={() => setIsUploadOpen(true)} className="mt-6 text-sm text-indigo-500 hover:text-indigo-400 font-medium">
                                   Upload New Note
                                </button>
                            </div>
                        )}
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
                  notes.map(note => <NoteCard key={note.id} note={note} onClick={() => openNoteDetail(note)} />)
                )}
             </div>
          )}

          {activeTab === 'revision' && (
            <div className="h-full">
               <CalendarBoard notes={notes} onUpdateNote={updateNote} />
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
      
      <NoteDetailModal 
        note={selectedNote}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        onMarkRevised={handleMarkRevised}
        isUpdating={isUpdating}
      />
    </div>
  );
}

export default App;