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
  Loader2
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
const getNextReviewDate = (currentStatus: Note['status']): string => {
  const today = new Date();
  let daysToAdd = 0;
  
  switch(currentStatus) {
    case 'new': daysToAdd = 1; break; // 1 day later
    case 'review_1': daysToAdd = 3; break; // 3 days later
    case 'review_3': daysToAdd = 7; break; // 7 days later
    case 'review_7': daysToAdd = 14; break; // 14 days later (mastery maintenance)
    default: daysToAdd = 30;
  }
  
  today.setDate(today.getDate() + daysToAdd);
  return today.toISOString();
};

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

// --- UI Components ---

const Sidebar = ({ activeTab, setActiveTab, onLogout }: { activeTab: string, setActiveTab: (t: string) => void, onLogout: () => void }) => {
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

const NoteCard = ({ note, onClick }: { note: Note, onClick: () => void }) => (
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
      {note.nextReview && (
        <span className="text-[10px] text-zinc-400 flex items-center gap-1">
           <Clock size={10} /> {new Date(note.nextReview).toLocaleDateString(undefined, {month:'short', day:'numeric'})}
        </span>
      )}
    </div>
  </div>
);

const QuizCard = ({ question, index }: { question: { question: string, answer: string }, index: number }) => {
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
        <div className="p-6 border-t border-zinc-200/50 dark:border-white/5 bg-white/50 dark:bg-[#0a0a0a]/80 backdrop-blur-md flex justify-between items-center">
           <div className="text-xs text-zinc-400">
              Last reviewed: {note.nextReview ? new Date(new Date(note.nextReview).getTime() - 86400000).toLocaleDateString() : 'Never'}
           </div>
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

    try {
      setProcessingState({ isProcessing: true, stage: 'analyzing' });
      
      const base64Data = await compressImage(file);
      const result = await analyzeImage(base64Data);
      
      const newNote: Note = {
        id: crypto.randomUUID(), // Use UUID instead of Date.now() for robustness
        title: result.title || 'Untitled Note',
        subject: result.subject || 'General',
        summary: result.summary || 'No summary available.',
        originalText: result.originalText || '',
        cues: result.cues || [],
        quiz: result.quiz || [],
        dateCreated: new Date().toISOString(),
        status: 'new',
        tags: result.tags || [],
        nextReview: getNextReviewDate('new')
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

const RevisionBoard = ({ notes, onUpdateExamDate }: { notes: Note[], onUpdateExamDate: (id: string, date: string) => void }) => {
  const today = new Date();
  today.setHours(0,0,0,0);
  
  const upcomingReviews = notes
    .filter(n => n.nextReview)
    .sort((a, b) => new Date(a.nextReview!).getTime() - new Date(b.nextReview!).getTime());

  const handleDateChange = (noteId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdateExamDate(noteId, e.target.value);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
       <div className="glass-panel p-6 rounded-2xl border-l-4 border-l-indigo-500">
          <h2 className="text-lg font-medium text-zinc-900 dark:text-white mb-2">Study Plan</h2>
          <p className="text-sm text-zinc-500 font-light">
             The spacing effect algorithm schedules your reviews. Enter an exam date for priority scheduling.
          </p>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {upcomingReviews.map(note => {
             const reviewDate = new Date(note.nextReview!);
             const isDue = reviewDate <= today;
             const daysUntil = Math.ceil((reviewDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
             
             return (
               <div key={note.id} className="glass-panel p-5 rounded-xl flex flex-col relative group">
                  <div className={`absolute top-0 right-0 px-3 py-1 rounded-bl-xl text-[10px] font-bold uppercase tracking-wider ${isDue ? 'bg-indigo-500 text-white' : 'bg-zinc-100 dark:bg-white/10 text-zinc-500'}`}>
                     {isDue ? 'Due Now' : `In ${daysUntil} Days`}
                  </div>
                  
                  <div className="mb-4">
                     <span className="text-[10px] text-zinc-400 uppercase tracking-wide">{note.subject}</span>
                     <h3 className="text-base font-medium text-zinc-900 dark:text-white mt-1 line-clamp-1">{note.title}</h3>
                  </div>

                  <div className="mt-auto space-y-3">
                     <div className="flex items-center gap-2 text-xs text-zinc-500">
                        <CalendarIcon size={14} />
                        <span>Exam: </span>
                        <input 
                          type="date" 
                          className="bg-transparent border-b border-zinc-200 dark:border-white/20 focus:outline-none focus:border-indigo-500 text-zinc-800 dark:text-zinc-200 w-28"
                          defaultValue={note.examDate ? new Date(note.examDate).toISOString().split('T')[0] : ''}
                          onChange={(e) => handleDateChange(note.id, e)}
                        />
                     </div>
                     
                     <div className="w-full bg-zinc-100 dark:bg-white/5 rounded-full h-1.5 overflow-hidden">
                        <div 
                           className="h-full bg-indigo-500 transition-all duration-500" 
                           style={{ width: `${note.status === 'mastered' ? 100 : note.status === 'review_7' ? 75 : note.status === 'review_3' ? 50 : 25}%` }}
                        />
                     </div>
                  </div>
               </div>
             );
          })}
          
          {upcomingReviews.length === 0 && (
             <div className="col-span-full py-12 text-center text-zinc-400 italic font-light">
                No upcoming reviews scheduled. Upload notes to start.
             </div>
          )}
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
        const nextDate = getNextReviewDate(nextStatus);
        
        const updatedNote = { ...note, status: nextStatus, nextReview: nextDate };
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

  const updateExamDate = async (noteId: string, date: string) => {
    const noteToUpdate = notes.find(n => n.id === noteId);
    if (!noteToUpdate) return;
    
    const updatedNote = { ...noteToUpdate, examDate: date };
    const updatedNotes = notes.map(n => n.id === noteId ? updatedNote : n);
    setNotes(updatedNotes);
    
    try {
        await storageService.upsertNote(updatedNote);
    } catch (e) {
        console.error("Failed to update exam date", e);
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
                   <div className="lg:col-span-2 glass-panel rounded-2xl p-8 relative overflow-hidden group">
                      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 via-transparent to-transparent dark:from-indigo-950/30 pointer-events-none"></div>
                      <div className="relative z-10 flex flex-col h-full justify-between">
                        {notes.length > 0 ? (
                            <>
                                <div>
                                <span className="inline-block px-2 py-1 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 text-[10px] font-bold uppercase tracking-wider rounded mb-3">Priority</span>
                                <h2 className="text-3xl font-light text-zinc-900 dark:text-white mb-2 tracking-tight">Focus on <span className="font-medium text-indigo-600 dark:text-indigo-400">{notes[0].subject}</span></h2>
                                <p className="text-zinc-600 dark:text-zinc-400 font-light max-w-md leading-relaxed text-sm line-clamp-2">
                                    "{notes[0].title}" is up next for review. Keep your memory fresh.
                                </p>
                                </div>
                                <button onClick={() => openNoteDetail(notes[0])} className="w-fit flex items-center gap-2 text-sm font-medium text-zinc-900 dark:text-white hover:gap-3 transition-all mt-6 group/btn">
                                    Start Session <ArrowRight size={16} className="text-indigo-500" />
                                </button>
                            </>
                        ) : (
                            <>
                                <div>
                                <h2 className="text-3xl font-light text-zinc-900 dark:text-white mb-2 tracking-tight">Welcome to <span className="font-medium text-indigo-600 dark:text-indigo-400">Neoclass</span></h2>
                                <p className="text-zinc-600 dark:text-zinc-400 font-light max-w-md leading-relaxed text-sm">
                                    Your AI-powered study companion. Upload your first note to begin.
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
                  notes.map(note => <NoteCard key={note.id} note={note} onClick={() => openNoteDetail(note)} />)
                )}
             </div>
          )}

          {activeTab === 'revision' && (
            <div className="animate-in fade-in duration-500 h-full">
               <RevisionBoard notes={notes} onUpdateExamDate={updateExamDate} />
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