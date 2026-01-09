export enum Branch {
  Perceiving = 'Perceiving Emotions',
  Using = 'Using Emotions',
  Understanding = 'Understanding Emotions',
  Managing = 'Managing Emotions',
}

export enum QuestionType {
  MultipleChoice = 'MC',
  Likert = 'Likert',
  ImageAnalysis = 'Image',
}

export interface Question {
  id: string;
  branch: Branch;
  type: QuestionType;
  scenario: string;
  imageUrl?: string; // For Perceiving branch
  options: {
    id: string;
    text: string;
    score: number; // 0.0 to 1.0 consensus score
  }[];
  explanation?: string;
}

export interface AssessmentState {
  isActive: boolean;
  currentBranch: Branch | null;
  questions: Question[];
  currentIndex: number;
  answers: Record<string, number>; // questionId -> score obtained
  isComplete: boolean;
}

export interface HistoryItem {
  id: string;
  date: string;
  score: number;
  branch: Branch;
}

export interface UserStats {
  scores: Record<Branch, number>; // 0-100 scale
  masteryLevels: Record<Branch, number>; // 1-10 level
  consensusAlignment: number; // Overall 0-100 average
  percentile: number; // 0-100 relative to med aspirants
  history: HistoryItem[];
  weakestBranch: Branch;
  completionCount: number;
}

export interface TrainingModule {
  id: string;
  title: string;
  description: string;
  branch: Branch;
  duration: string;
  requiredLevel?: number;
}