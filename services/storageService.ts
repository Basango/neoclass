import { Note, UserStats } from "../types";
import { supabase } from "./supabase";

const DEFAULT_STATS: UserStats = {
  streak: 0,
  xp: 0,
  level: 1,
  mandalaProgress: 0
};

export const storageService = {
  getNotes: async (): Promise<Note[]> => {
    // --- SUPABASE MODE ---
    if (supabase) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];

        const { data, error } = await supabase
          .from('notes')
          .select('*')
          .eq('user_id', user.id)
          .order('date_created', { ascending: false });
        
        if (error) {
            console.error("Supabase fetch error:", error.message);
            throw error;
        }
        
        return (data || []).map((d: any) => ({
          id: d.id,
          title: d.title,
          subject: d.subject,
          summary: d.summary,
          originalText: d.original_text,
          dateCreated: d.date_created,
          status: d.status,
          tags: d.tags || [],
          cues: d.cues || [],
          quiz: d.quiz || [],
          examDate: d.exam_date,
          nextReview: d.next_review
        }));
    }

    // --- LOCAL STORAGE MODE ---
    const stored = localStorage.getItem('neoclass_notes');
    return stored ? JSON.parse(stored) : [];
  },

  upsertNote: async (note: Note) => {
    // --- SUPABASE MODE ---
    if (supabase) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("User not authenticated");

        const dbNote = {
          id: note.id,
          user_id: user.id,
          title: note.title,
          subject: note.subject,
          summary: note.summary,
          original_text: note.originalText,
          status: note.status,
          tags: note.tags,
          date_created: note.dateCreated,
          cues: note.cues,
          quiz: note.quiz,
          exam_date: note.examDate,
          next_review: note.nextReview
        };

        const { error } = await supabase.from('notes').upsert(dbNote);
        if (error) {
           console.error("Supabase single note upsert error:", error.message);
           throw error;
        }
        return;
    }

    // --- LOCAL STORAGE MODE ---
    const notes = JSON.parse(localStorage.getItem('neoclass_notes') || '[]');
    const index = notes.findIndex((n: Note) => n.id === note.id);
    if (index >= 0) {
        notes[index] = note;
    } else {
        notes.unshift(note);
    }
    localStorage.setItem('neoclass_notes', JSON.stringify(notes));
  },

  // Deprecated: Use upsertNote
  saveNotes: async (notes: Note[]) => {
    // Compatibility stub
  },

  getStats: async (): Promise<UserStats> => {
    // --- SUPABASE MODE ---
    if (supabase) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return DEFAULT_STATS;

        const { data, error } = await supabase
            .from('user_stats')
            .select('*')
            .eq('user_id', user.id)
            .single();
        
        if (error && error.code !== 'PGRST116') {
             console.error("Supabase stats fetch error:", error.message);
        }

        if (data) {
          return {
            streak: data.streak,
            xp: data.xp,
            level: data.level,
            mandalaProgress: data.mandala_progress
          };
        }
        return DEFAULT_STATS;
    }

    // --- LOCAL STORAGE MODE ---
    const stored = localStorage.getItem('neoclass_stats');
    return stored ? JSON.parse(stored) : DEFAULT_STATS;
  },

  saveStats: async (stats: UserStats) => {
    // --- SUPABASE MODE ---
    if (supabase) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("User not authenticated");

        const dbStats = {
            user_id: user.id,
            streak: stats.streak,
            xp: stats.xp,
            level: stats.level,
            mandala_progress: stats.mandalaProgress
        };
         
         const { error } = await supabase.from('user_stats').upsert(dbStats);
         if (error) {
             console.error("Supabase stats save error:", error.message);
             throw error;
         }
         return;
    }

    // --- LOCAL STORAGE MODE ---
    localStorage.setItem('neoclass_stats', JSON.stringify(stats));
  }
};