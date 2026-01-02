import { Note, UserStats } from "../types";

const NOTES_KEY = 'neoclass_notes';
const STATS_KEY = 'neoclass_stats';

const DEFAULT_STATS: UserStats = {
  streak: 0,
  xp: 0,
  level: 1,
  mandalaProgress: 0
};

export const storageService = {
  getNotes: (): Note[] => {
    try {
      const stored = localStorage.getItem(NOTES_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error("Failed to load notes", e);
      return [];
    }
  },

  saveNotes: (notes: Note[]) => {
    try {
      localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
    } catch (e) {
      console.error("Failed to save notes", e);
    }
  },

  getStats: (): UserStats => {
    try {
      const stored = localStorage.getItem(STATS_KEY);
      return stored ? JSON.parse(stored) : DEFAULT_STATS;
    } catch (e) {
      console.error("Failed to load stats", e);
      return DEFAULT_STATS;
    }
  },

  saveStats: (stats: UserStats) => {
    try {
      localStorage.setItem(STATS_KEY, JSON.stringify(stats));
    } catch (e) {
      console.error("Failed to save stats", e);
    }
  },

  // Helper to clear data for testing
  clearAll: () => {
    localStorage.removeItem(NOTES_KEY);
    localStorage.removeItem(STATS_KEY);
  }
};
