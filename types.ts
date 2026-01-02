export interface Note {
  id: string;
  title: string;
  subject: string;
  summary: string;
  originalText: string; // The main content
  cues: string[]; // Cornell method cues/keywords
  quiz: { question: string, answer: string }[]; // AI generated quiz
  dateCreated: string;
  status: 'new' | 'review_1' | 'review_3' | 'review_7' | 'mastered';
  tags: string[];
  examDate?: string; // ISO String
  nextReview?: string; // ISO String
}

export interface UserStats {
  streak: number;
  xp: number;
  level: number;
  mandalaProgress: number; // 0-100
}

export interface ProcessingState {
  isProcessing: boolean;
  stage: 'idle' | 'uploading' | 'analyzing' | 'gamifying' | 'complete';
}

export interface UserProfile {
  id?: string;
  name: string;
  email: string;
  grade: string;
  joinedAt: string;
}

export enum Subject {
  MATH = 'Mathematics',
  SCIENCE = 'Science',
  ENGLISH = 'English',
  HINDI = 'Hindi',
  SOCIAL_SCIENCE = 'Social Science',
}