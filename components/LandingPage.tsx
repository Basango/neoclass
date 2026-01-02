import React, { useState } from 'react';
import { ArrowRight, Sparkles, BrainCircuit, ShieldCheck, ChevronRight, LogIn } from 'lucide-react';
import { UserProfile } from '../types';
import { authService } from '../services/authService';
import { GalaxyLoader } from './Loaders';

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
             // If confirmation is enforced by backend but we aren't handling the flow explicitly
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

  return (
    <div className="min-h-screen bg-[#050505] text-white relative overflow-hidden font-sans selection:bg-indigo-500/30">
      {/* Background Ambience */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none mix-blend-screen" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[100px] pointer-events-none mix-blend-screen" />
      <div className="bg-grid-white/[0.02] fixed inset-0 pointer-events-none z-0" />

      {/* Nav */}
      <nav className="relative z-10 flex justify-between items-center px-8 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setStep('intro')}>
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <span className="text-white font-medium text-lg">N</span>
          </div>
          <span className="text-sm font-medium tracking-[0.2em]">NEOCLASS</span>
        </div>
        <div className="flex items-center gap-6">
            <div className="hidden md:flex gap-6 text-xs font-medium text-zinc-400">
                <span>FEATURES</span>
                <span>METHODOLOGY</span>
            </div>
            {step === 'intro' && (
                <button 
                    onClick={() => { setAuthMode('signin'); setStep('auth'); }}
                    className="text-xs font-medium text-white hover:text-indigo-400 transition-colors flex items-center gap-2"
                >
                    <LogIn size={14} />
                    Sign In
                </button>
            )}
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-20 flex flex-col items-center text-center">
        
        {loading ? (
            <div className="mt-20">
                <GalaxyLoader />
            </div>
        ) : step === 'intro' ? (
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-[10px] uppercase tracking-wider text-indigo-300 mb-8 backdrop-blur-md">
              <Sparkles size={12} />
              <span>Version 2.0 Now Live</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-thin tracking-tight mb-8 leading-[1.1]">
              Master your syllabus.<br />
              <span className="font-medium bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent animate-shine bg-[length:200%_auto]">Gamify your growth.</span>
            </h1>
            
            <p className="text-lg text-zinc-400 font-light mb-12 max-w-xl mx-auto leading-relaxed">
              The AI-powered companion for Indian students. Turn messy notes into structured Cornell summaries and track revision with the 1-3-7 spacing method.
            </p>

            <button 
              onClick={() => { setAuthMode('signup'); setStep('auth'); }}
              className="group relative inline-flex items-center gap-3 px-8 py-4 bg-white text-black rounded-full text-sm font-medium hover:bg-indigo-50 transition-all duration-300 hover:pr-10"
            >
              Start Your Journey
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
              <div className="absolute inset-0 rounded-full ring-4 ring-white/10 group-hover:ring-white/20 transition-all" />
            </button>

            {/* Feature Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-24 text-left">
               {[
                 { icon: BrainCircuit, title: "AI-Powered OCR", desc: "Instantly digitize handwritten Hindi/English notes." },
                 { icon: ShieldCheck, title: "1-3-7 Revision", desc: "Scientific spacing algorithm to beat the forgetting curve." },
                 { icon: Sparkles, title: "Cosmic Gamification", desc: "Earn XP, unlock badges, and build your knowledge galaxy." }
               ].map((f, i) => (
                 <div key={i} className="p-6 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition-colors backdrop-blur-sm group">
                    <f.icon className="w-8 h-8 text-indigo-400 mb-4 stroke-1 group-hover:scale-110 transition-transform" />
                    <h3 className="text-lg font-medium mb-2">{f.title}</h3>
                    <p className="text-sm text-zinc-500 font-light">{f.desc}</p>
                 </div>
               ))}
            </div>
          </div>
        ) : (
          <div className="w-full max-w-md animate-in zoom-in-95 duration-500 mt-10">
             <div className="p-8 rounded-2xl border border-white/10 bg-[#0A0A0A]/80 backdrop-blur-xl shadow-2xl">
                
                <div className="text-left mb-8">
                <h2 className="text-2xl font-medium mb-2">{authMode === 'signup' ? 'Create Profile' : 'Welcome Back'}</h2>
                <p className="text-zinc-500 text-sm font-light">
                    {authMode === 'signup' ? 'Join thousands of students mastering their boards.' : 'Continue your revision journey.'}
                </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                {authMode === 'signup' && (
                    <div className="space-y-1.5 text-left animate-in fade-in slide-in-from-top-2">
                        <label className="text-xs font-medium text-zinc-400 ml-1">FULL NAME</label>
                        <input 
                            type="text" 
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Aryan Sharma"
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500/50 focus:bg-white/10 transition-all text-white placeholder:text-zinc-600"
                            autoFocus
                        />
                    </div>
                )}

                <div className="space-y-1.5 text-left">
                    <label className="text-xs font-medium text-zinc-400 ml-1">EMAIL ADDRESS</label>
                    <input 
                        type="email" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="e.g. aryan@student.com"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500/50 focus:bg-white/10 transition-all text-white placeholder:text-zinc-600"
                    />
                </div>

                <div className="space-y-1.5 text-left">
                    <label className="text-xs font-medium text-zinc-400 ml-1">PASSWORD</label>
                    <input 
                        type="password" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500/50 focus:bg-white/10 transition-all text-white placeholder:text-zinc-600"
                    />
                </div>
                
                {authMode === 'signup' && (
                    <div className="space-y-1.5 text-left animate-in fade-in slide-in-from-top-2">
                        <label className="text-xs font-medium text-zinc-400 ml-1">GRADE / CLASS</label>
                        <select 
                            value={grade}
                            onChange={(e) => setGrade(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500/50 focus:bg-white/10 transition-all text-white appearance-none cursor-pointer"
                        >
                            <option value="" className="bg-zinc-900 text-zinc-500">Select Grade</option>
                            <option value="5" className="bg-zinc-900">Class 5</option>
                            <option value="6" className="bg-zinc-900">Class 6</option>
                            <option value="7" className="bg-zinc-900">Class 7</option>
                            <option value="8" className="bg-zinc-900">Class 8</option>
                            <option value="9" className="bg-zinc-900">Class 9</option>
                            <option value="10" className="bg-zinc-900">Class 10 (Boards)</option>
                            <option value="11" className="bg-zinc-900">Class 11</option>
                            <option value="12" className="bg-zinc-900">Class 12 (Boards)</option>
                        </select>
                    </div>
                )}

                {successMsg && (
                    <p className="text-xs text-emerald-400 mt-2 bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20">{successMsg}</p>
                )}

                {error && (
                    <p className="text-xs text-red-400 mt-2 bg-red-500/10 p-2 rounded-lg border border-red-500/20">{error}</p>
                )}

                <button 
                    type="submit"
                    disabled={!email || !password || (authMode === 'signup' && (!name || !grade))}
                    className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed mt-4 flex justify-center items-center gap-2"
                >
                    {authMode === 'signup' ? 'Get Started' : 'Sign In'} <ChevronRight size={16} />
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
      <footer className="absolute bottom-6 w-full text-center">
         <p className="text-[10px] text-zinc-600 uppercase tracking-widest">Designed for India • Est 2024</p>
      </footer>
    </div>
  );
};