import React, { useState } from 'react';
import { 
  ArrowRight, 
  Sparkles, 
  BrainCircuit, 
  ShieldCheck, 
  ChevronRight, 
  LogIn, 
  Camera, 
  FileText, 
  CheckCircle2, 
  Zap, 
  Lock,
  ChevronDown,
  ChevronUp,
  GraduationCap,
  Clock
} from 'lucide-react';
import { UserProfile } from '../types';
import { authService } from '../services/authService';
import { GalaxyLoader } from './Loaders';

const FaqItem = ({ question, answer }: { question: string, answer: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-white/5 last:border-0">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-4 flex items-center justify-between text-left hover:text-indigo-400 transition-colors"
      >
        <span className="text-sm font-medium text-zinc-200">{question}</span>
        {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
      {isOpen && (
        <div className="pb-4 text-sm text-zinc-500 font-light leading-relaxed animate-in fade-in slide-in-from-top-1">
          {answer}
        </div>
      )}
    </div>
  );
};

export const LandingPage = ({ onLogin }: { onLogin: (user: UserProfile) => void }) => {
  const [step, setStep] = useState<'intro' | 'auth'>('intro');
  const [authMode, setAuthMode] = useState<'signup' | 'signin'>('signup');
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [grade, setGrade] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Before/After Toggle State
  const [showAfter, setShowAfter] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    if (authMode === 'signup' && (!name || !grade)) return;

    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    
    try {
      if (authMode === 'signup') {
         const { user, session } = await authService.signUp(name, email, password, grade);
         if (user && session) {
             onLogin(user);
         } else if (user && !session) {
             setAuthMode('signin');
             setSuccessMsg("Account created successfully! Please sign in.");
             setPassword('');
         }
      } else {
         const user = await authService.signIn(email, password);
         onLogin(user);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (mode: 'signup' | 'signin') => {
    setAuthMode(mode);
    setError(null);
    setSuccessMsg(null);
  };

  const scrollToAuth = () => {
    setAuthMode('signup'); 
    setStep('auth');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white relative overflow-hidden font-sans selection:bg-indigo-500/30">
      {/* Background Ambience */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none mix-blend-screen" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[100px] pointer-events-none mix-blend-screen" />
      <div className="bg-grid-white/[0.02] fixed inset-0 pointer-events-none z-0" />

      {/* Nav */}
      <nav className="relative z-20 flex justify-between items-center px-6 md:px-10 py-6 max-w-7xl mx-auto backdrop-blur-sm sticky top-0 border-b border-white/5 bg-[#050505]/80">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setStep('intro')}>
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <span className="text-white font-medium text-lg">N</span>
          </div>
          <span className="text-sm font-medium tracking-[0.2em]">NEOCLASS</span>
        </div>
        <div className="flex items-center gap-4 md:gap-6">
            <button 
                onClick={() => { setAuthMode('signin'); setStep('auth'); }}
                className="text-xs font-medium text-zinc-300 hover:text-white transition-colors flex items-center gap-2"
            >
                <LogIn size={14} />
                Sign In
            </button>
            <button 
                onClick={scrollToAuth}
                className="hidden md:flex text-xs font-bold bg-white text-black px-4 py-2 rounded-full hover:bg-zinc-200 transition-colors"
            >
                Start for Free
            </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 w-full flex flex-col items-center">
        
        {loading ? (
            <div className="h-[80vh] flex items-center justify-center">
                <GalaxyLoader />
            </div>
        ) : step === 'intro' ? (
          <div className="w-full flex flex-col items-center animate-in fade-in duration-700">
            
            {/* HERO SECTION */}
            <section className="px-6 py-20 md:py-32 text-center max-w-4xl mx-auto">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-[10px] uppercase tracking-wider text-indigo-300 mb-8 animate-pulse-slow">
                  <Sparkles size={12} />
                  <span>The #1 Study Companion for Boards 2025</span>
                </div>
                
                <h1 className="text-4xl md:text-7xl font-light tracking-tight mb-6 leading-[1.1]">
                  Stop Drowning in <br className="hidden md:block"/> Messy Notes. <span className="font-medium text-indigo-400">Ace Boards.</span>
                </h1>
                
                <p className="text-base md:text-xl text-zinc-400 font-light mb-10 max-w-2xl mx-auto leading-relaxed">
                  Neoclass instantly organizes your handwritten chaos into structured Cornell notes, practice quizzes, and a 1-3-7 revision schedule. Don't just work hard—study smart for CBSE & ICSE.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <button 
                    onClick={scrollToAuth}
                    className="w-full sm:w-auto group relative inline-flex items-center justify-center gap-3 px-8 py-4 bg-white text-black rounded-full text-sm font-bold hover:bg-indigo-50 transition-all duration-300 hover:shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                  >
                    Start Acing Your Boards
                    <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                  </button>
                  <p className="text-xs text-zinc-500 flex items-center gap-2 mt-2 sm:mt-0">
                    <ShieldCheck size={12} /> No credit card needed • Free tier available
                  </p>
                </div>

                <div className="mt-12 flex items-center justify-center gap-4 text-xs text-zinc-500 font-light">
                   <div className="flex -space-x-2">
                      {[1,2,3,4].map(i => (
                        <div key={i} className="w-6 h-6 rounded-full bg-zinc-800 border border-black flex items-center justify-center text-[8px] text-zinc-400">
                           {String.fromCharCode(64+i)}
                        </div>
                      ))}
                   </div>
                   <p>Join hundreds of students from <span className="text-zinc-300">DPS, KV, and Ryan International</span></p>
                </div>
            </section>

            {/* BEFORE / AFTER DEMO */}
            <section className="w-full max-w-5xl px-6 pb-24">
               <div className="glass-panel p-1 md:p-2 rounded-2xl border border-white/10 bg-[#0A0A0A]/50 backdrop-blur-md relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 opacity-20"></div>
                  
                  {/* Toggle */}
                  <div className="flex justify-center py-6">
                     <div className="bg-black/40 border border-white/5 p-1 rounded-full flex relative">
                        <button 
                          onClick={() => setShowAfter(false)}
                          className={`relative z-10 px-6 py-2 rounded-full text-xs font-medium transition-colors ${!showAfter ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                        >
                          Messy Notebook
                        </button>
                        <button 
                          onClick={() => setShowAfter(true)}
                          className={`relative z-10 px-6 py-2 rounded-full text-xs font-medium transition-colors ${showAfter ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                        >
                          Neoclass Smart Note
                        </button>
                        <div 
                           className={`absolute top-1 bottom-1 w-[50%] bg-zinc-800 rounded-full transition-all duration-300 ${showAfter ? 'left-[49%]' : 'left-[1%]'}`} 
                        />
                     </div>
                  </div>

                  {/* Content Display */}
                  <div className="relative min-h-[300px] md:min-h-[400px] rounded-xl overflow-hidden bg-[#0e0e0e] border border-white/5 m-2 md:m-4 flex items-center justify-center">
                     {!showAfter ? (
                        <div className="w-full h-full flex flex-col items-center justify-center p-8 opacity-60">
                           <div className="w-full max-w-md space-y-4 font-serif italic text-zinc-500">
                             <div className="h-4 bg-zinc-800/50 rounded w-3/4 transform rotate-1"></div>
                             <div className="h-4 bg-zinc-800/50 rounded w-full transform -rotate-1"></div>
                             <div className="h-4 bg-zinc-800/50 rounded w-5/6 transform rotate-0.5"></div>
                             <div className="h-4 bg-zinc-800/50 rounded w-full transform -rotate-0.5"></div>
                             <div className="h-20 bg-zinc-800/30 rounded w-1/2 mx-auto mt-8 border-2 border-dashed border-zinc-700/50 flex items-center justify-center">
                                <span className="not-italic text-xs font-sans">Photo of Notes</span>
                             </div>
                           </div>
                           <p className="mt-8 text-zinc-600 font-sans text-sm">Hard to read. Harder to revise.</p>
                        </div>
                     ) : (
                        <div className="w-full h-full p-6 md:p-8 animate-in zoom-in-95 duration-300">
                           <div className="flex justify-between items-start mb-6">
                              <div>
                                 <span className="text-[10px] text-indigo-400 uppercase tracking-wider border border-indigo-500/20 px-2 py-0.5 rounded">Biology</span>
                                 <h3 className="text-xl md:text-2xl font-light text-white mt-2">Photosynthesis Process</h3>
                              </div>
                              <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                                 <CheckCircle2 size={16} className="text-emerald-500" />
                              </div>
                           </div>
                           
                           <div className="grid grid-cols-3 gap-6">
                              <div className="col-span-1 border-r border-white/5 pr-4 hidden md:block">
                                 <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-3">CUES</p>
                                 <ul className="space-y-3">
                                    <li className="text-xs text-indigo-300">Chloroplasts</li>
                                    <li className="text-xs text-indigo-300">Light Reaction</li>
                                    <li className="text-xs text-indigo-300">ATP Cycle</li>
                                 </ul>
                              </div>
                              <div className="col-span-3 md:col-span-2">
                                 <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-3">SUMMARY</p>
                                 <p className="text-sm text-zinc-300 font-light leading-relaxed">
                                    Photosynthesis takes place in chloroplasts, using chlorophyll to absorb sunlight. The process converts CO2 and H2O into glucose and oxygen, providing energy for the plant and releasing O2 into the atmosphere.
                                 </p>
                                 <div className="mt-6 p-4 rounded-lg bg-white/5 border border-white/5">
                                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-2">QUIZ QUESTION</p>
                                    <p className="text-sm text-white">What is the primary pigment responsible for light absorption?</p>
                                 </div>
                              </div>
                           </div>
                        </div>
                     )}
                  </div>
               </div>
            </section>

            {/* HOW IT WORKS */}
            <section className="py-20 px-6 max-w-7xl mx-auto w-full border-t border-white/5">
               <div className="text-center mb-16">
                  <h2 className="text-2xl md:text-3xl font-light text-white mb-4">From Chaos to Clarity in 4 Steps</h2>
                  <p className="text-zinc-500 font-light text-sm md:text-base">Designed for the Indian education system's syllabus load.</p>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                  {[
                     { 
                       icon: Camera, 
                       step: "01", 
                       title: "Snap & Upload", 
                       desc: "Take a photo of your class notes. Neoclass handles English, Hindi, and messy handwriting." 
                     },
                     { 
                       icon: BrainCircuit, 
                       step: "02", 
                       title: "AI Analysis", 
                       desc: "Our engine extracts key concepts and organizes them into the Cornell Note-taking System." 
                     },
                     { 
                       icon: FileText, 
                       step: "03", 
                       title: "Active Recall", 
                       desc: "Get auto-generated quiz questions to test your understanding immediately." 
                     },
                     { 
                       icon: Clock, 
                       step: "04", 
                       title: "Spaced Revision", 
                       desc: "The 1-3-7 scheduler tells you exactly when to revise so you never forget before the exam." 
                     }
                  ].map((item, idx) => (
                     <div key={idx} className="relative group">
                        <div className="absolute -inset-0.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl opacity-0 group-hover:opacity-30 blur transition duration-500"></div>
                        <div className="relative p-6 bg-[#0E0E0E] border border-white/5 rounded-2xl h-full flex flex-col items-start hover:bg-[#121212] transition-colors">
                           <span className="text-4xl font-thin text-white/10 mb-4">{item.step}</span>
                           <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center mb-4 text-indigo-400">
                              <item.icon size={20} strokeWidth={1.5} />
                           </div>
                           <h3 className="text-lg font-medium text-white mb-2">{item.title}</h3>
                           <p className="text-sm text-zinc-500 font-light leading-relaxed">{item.desc}</p>
                        </div>
                     </div>
                  ))}
               </div>
            </section>

            {/* PRICING */}
            <section className="py-20 px-6 max-w-5xl mx-auto w-full">
               <div className="text-center mb-16">
                  <h2 className="text-2xl md:text-3xl font-light text-white mb-4">Invest in Your Grades</h2>
                  <p className="text-zinc-500 font-light text-sm">Cheaper than one tuition class.</p>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                  {/* Free Plan */}
                  <div className="p-8 rounded-3xl border border-white/10 bg-white/[0.02] flex flex-col">
                     <div className="mb-8">
                        <h3 className="text-lg font-medium text-zinc-300">Basic Student</h3>
                        <div className="flex items-baseline gap-1 mt-2">
                           <span className="text-3xl font-bold text-white">₹0</span>
                           <span className="text-zinc-500">/ forever</span>
                        </div>
                        <p className="text-xs text-zinc-500 mt-2">Perfect for trying it out.</p>
                     </div>
                     <ul className="space-y-4 mb-8 flex-1">
                        {[
                           "5 Smart Note conversions/mo",
                           "Basic Cornell formatting",
                           "Standard Revision Schedule",
                           "Mobile access"
                        ].map((feat, i) => (
                           <li key={i} className="flex items-center gap-3 text-sm text-zinc-400">
                              <CheckCircle2 size={16} className="text-zinc-600" /> {feat}
                           </li>
                        ))}
                     </ul>
                     <button 
                       onClick={scrollToAuth}
                       className="w-full py-3 rounded-full border border-white/10 text-white text-sm font-medium hover:bg-white/5 transition-colors"
                     >
                        Start Free
                     </button>
                  </div>

                  {/* Pro Plan */}
                  <div className="relative p-8 rounded-3xl border border-indigo-500/30 bg-indigo-900/10 flex flex-col overflow-hidden">
                     <div className="absolute top-0 right-0 bg-indigo-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-wider">
                        Most Popular
                     </div>
                     <div className="mb-8">
                        <h3 className="text-lg font-medium text-indigo-200">Board Topper</h3>
                        <div className="flex items-baseline gap-1 mt-2">
                           <span className="text-3xl font-bold text-white">₹99</span>
                           <span className="text-zinc-400">/ month</span>
                        </div>
                        <p className="text-xs text-indigo-300/60 mt-2">Less than a notebook's cost.</p>
                     </div>
                     <ul className="space-y-4 mb-8 flex-1">
                        {[
                           "Unlimited Smart Notes",
                           "Priority AI Processing",
                           "Unlimited Quizzes & Practice",
                           "Exam Countdown Timer",
                           "Advanced Progress Analytics"
                        ].map((feat, i) => (
                           <li key={i} className="flex items-center gap-3 text-sm text-zinc-300">
                              <CheckCircle2 size={16} className="text-indigo-400" /> {feat}
                           </li>
                        ))}
                     </ul>
                     <button 
                       onClick={scrollToAuth}
                       className="w-full py-3 rounded-full bg-white text-black text-sm font-bold hover:bg-zinc-200 transition-colors shadow-lg shadow-indigo-900/20"
                     >
                        Get Pro Access
                     </button>
                  </div>
               </div>
            </section>

            {/* FAQ */}
            <section className="py-20 px-6 max-w-3xl mx-auto w-full border-t border-white/5">
               <h2 className="text-2xl font-light text-white mb-10 text-center">Frequently Asked Questions</h2>
               <div className="space-y-2">
                  <FaqItem 
                    question="Does it work with messy handwriting?"
                    answer="Yes! Our AI is trained to recognize varied Indian student handwriting styles, including cursive. However, clearer photos yield better results."
                  />
                  <FaqItem 
                    question="Can I upload notes in Hindi?"
                    answer="Absolutely. Neoclass supports both English and Hindi (Devanagari script) for OCR and summary generation."
                  />
                  <FaqItem 
                    question="What subjects are supported?"
                    answer="Neoclass works best for theory-heavy subjects like Science (Biology, Physics, Chemistry), Social Studies (History, Geography), and Languages (English, Hindi). Math support is currently experimental."
                  />
                  <FaqItem 
                    question="Is my data safe?"
                    answer="Your notes are your property. We use industry-standard encryption and never share your data with third parties."
                  />
               </div>
            </section>

             {/* Footer CTA */}
             <section className="py-20 text-center px-6">
                <h2 className="text-3xl md:text-5xl font-light text-white mb-6">Ready to score 95%+?</h2>
                <button 
                    onClick={scrollToAuth}
                    className="inline-flex items-center gap-3 px-8 py-4 bg-indigo-600 text-white rounded-full text-sm font-medium hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-500/20"
                >
                    Organize Your Notes Now <ArrowRight size={16} />
                </button>
             </section>

          </div>
        ) : (
          /* AUTH SECTION */
          <div className="w-full max-w-md animate-in zoom-in-95 duration-500 mt-10 mb-20 px-4">
             <div className="p-8 rounded-2xl border border-white/10 bg-[#0A0A0A]/80 backdrop-blur-xl shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500"></div>
                
                <div className="text-left mb-8">
                <h2 className="text-2xl font-medium mb-2">{authMode === 'signup' ? 'Create Student Profile' : 'Welcome Back'}</h2>
                <p className="text-zinc-500 text-sm font-light">
                    {authMode === 'signup' ? 'Join thousands of students mastering their boards.' : 'Continue your revision journey.'}
                </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                {authMode === 'signup' && (
                    <div className="space-y-1.5 text-left animate-in fade-in slide-in-from-top-2">
                        <label className="text-[10px] font-bold text-zinc-500 ml-1 uppercase tracking-wider">Full Name</label>
                        <input 
                            type="text" 
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Aryan Sharma"
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500/50 focus:bg-white/10 transition-all text-white placeholder:text-zinc-700"
                            autoFocus
                        />
                    </div>
                )}

                <div className="space-y-1.5 text-left">
                    <label className="text-[10px] font-bold text-zinc-500 ml-1 uppercase tracking-wider">Email Address</label>
                    <input 
                        type="email" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="e.g. aryan@student.com"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500/50 focus:bg-white/10 transition-all text-white placeholder:text-zinc-700"
                    />
                </div>

                <div className="space-y-1.5 text-left">
                    <label className="text-[10px] font-bold text-zinc-500 ml-1 uppercase tracking-wider">Password</label>
                    <input 
                        type="password" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500/50 focus:bg-white/10 transition-all text-white placeholder:text-zinc-700"
                    />
                </div>
                
                {authMode === 'signup' && (
                    <div className="space-y-1.5 text-left animate-in fade-in slide-in-from-top-2">
                        <label className="text-[10px] font-bold text-zinc-500 ml-1 uppercase tracking-wider">Current Class</label>
                        <div className="relative">
                            <select 
                                value={grade}
                                onChange={(e) => setGrade(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500/50 focus:bg-white/10 transition-all text-white appearance-none cursor-pointer"
                            >
                                <option value="" className="bg-[#121212] text-zinc-500">Select Grade</option>
                                <option value="5" className="bg-[#121212]">Class 5</option>
                                <option value="6" className="bg-[#121212]">Class 6</option>
                                <option value="7" className="bg-[#121212]">Class 7</option>
                                <option value="8" className="bg-[#121212]">Class 8</option>
                                <option value="9" className="bg-[#121212]">Class 9</option>
                                <option value="10" className="bg-[#121212]">Class 10 (Boards)</option>
                                <option value="11" className="bg-[#121212]">Class 11</option>
                                <option value="12" className="bg-[#121212]">Class 12 (Boards)</option>
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" size={16} />
                        </div>
                    </div>
                )}

                {successMsg && (
                    <p className="text-xs text-emerald-400 mt-2 bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20 flex items-center gap-2">
                        <CheckCircle2 size={12} /> {successMsg}
                    </p>
                )}

                {error && (
                    <p className="text-xs text-red-400 mt-2 bg-red-500/10 p-2 rounded-lg border border-red-500/20">{error}</p>
                )}

                <button 
                    type="submit"
                    disabled={!email || !password || (authMode === 'signup' && (!name || !grade))}
                    className="w-full py-3.5 bg-white hover:bg-zinc-200 text-black rounded-xl text-sm font-bold transition-all shadow-lg shadow-white/5 disabled:opacity-50 disabled:cursor-not-allowed mt-4 flex justify-center items-center gap-2"
                >
                    {authMode === 'signup' ? 'Start Studying Smart' : 'Sign In'} <ChevronRight size={16} />
                </button>
                </form>
                
                <div className="mt-6 flex flex-col items-center gap-3">
                    <p className="text-xs text-zinc-500">
                        {authMode === 'signup' ? "Already have an account?" : "Don't have an account?"}
                        <button 
                            onClick={() => switchMode(authMode === 'signup' ? 'signin' : 'signup')}
                            className="ml-2 text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
                        >
                            {authMode === 'signup' ? "Sign In" : "Sign Up"}
                        </button>
                    </p>
                    <button onClick={() => setStep('intro')} className="text-[10px] text-zinc-600 hover:text-zinc-400 transition-colors uppercase tracking-wider">
                    Back to Home
                    </button>
                </div>
             </div>
          </div>
        )}
      </main>
      
      {/* Footer */}
      <footer className="w-full border-t border-white/5 py-8 text-center bg-[#050505] relative z-10">
         <div className="flex items-center justify-center gap-2 mb-4">
             <div className="w-6 h-6 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-md flex items-center justify-center">
                <span className="text-white font-medium text-xs">N</span>
             </div>
             <span className="text-xs font-bold text-zinc-300 tracking-widest">NEOCLASS</span>
         </div>
         <p className="text-[10px] text-zinc-600">
            Made with <span className="text-red-900">♥</span> for Indian Students. © 2025
         </p>
      </footer>
    </div>
  );
};
