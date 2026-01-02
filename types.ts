export interface Note {
  id: string;
  title: string;
  subject: string;
  summary: string;
  originalText: string; // Bilingual content
  dateCreated: string;
  status: 'new' | 'review_1' | 'review_3' | 'review_7' | 'mastered';
  tags: string[];
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

export enum Subject {
  MATH = 'Mathematics',
  SCIENCE = 'Science',
  ENGLISH = 'English',
  HINDI = 'Hindi',
  SOCIAL_SCIENCE = 'Social Science',
}
