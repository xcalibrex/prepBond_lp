export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      practice_tests: {
        Row: {
          id: string
          type: 'worksheet' | 'exam'
          title: string
          description: string | null
          branch: 'PERCEIVING' | 'USING' | 'UNDERSTANDING' | 'MANAGING' | null
          time_limit_minutes: number | null
          created_at: string
        }
        Insert: {
          id?: string
          type: 'worksheet' | 'exam'
          title: string
          description?: string | null
          branch?: 'PERCEIVING' | 'USING' | 'UNDERSTANDING' | 'MANAGING' | null
          time_limit_minutes?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          type?: 'worksheet' | 'exam'
          title?: string
          description?: string | null
          branch?: 'PERCEIVING' | 'USING' | 'UNDERSTANDING' | 'MANAGING' | null
          time_limit_minutes?: number | null
          created_at?: string
        }
      }
      test_sections: {
        Row: {
          id: string
          test_id: string
          title: string
          instructions: string | null
          order_index: number
          created_at: string
        }
        Insert: {
          id?: string
          test_id: string
          title: string
          instructions?: string | null
          order_index: number
          created_at?: string
        }
        Update: {
          id?: string
          test_id?: string
          title?: string
          instructions?: string | null
          order_index?: number
          created_at?: string
        }
      }
      questions: {
        Row: {
          id: string
          section_id: string
          type: 'MCQ' | 'LIKERT_GRID' | 'SCENARIO'
          scenario_context: string | null
          scenario_image_url: string | null
          question_text: string
          order_index: number
          created_at: string
        }
        Insert: {
          id?: string
          section_id: string
          type: 'MCQ' | 'LIKERT_GRID' | 'SCENARIO'
          scenario_context?: string | null
          scenario_image_url?: string | null
          question_text: string
          order_index: number
          created_at?: string
        }
        Update: {
          id?: string
          section_id?: string
          type?: 'MCQ' | 'LIKERT_GRID' | 'SCENARIO'
          scenario_context?: string | null
          scenario_image_url?: string | null
          question_text?: string
          order_index?: number
          created_at?: string
        }
      }
      question_options: {
        Row: {
          id: string
          question_id: string
          label: string
          value: string
          order_index: number
          created_at: string
        }
        Insert: {
          id?: string
          question_id: string
          label: string
          value: string
          order_index: number
          created_at?: string
        }
        Update: {
          id?: string
          question_id?: string
          label?: string
          value?: string
          order_index?: number
          created_at?: string
        }
      }
      answer_keys: {
        Row: {
          id: string
          question_id: string | null
          question_option_id: string | null
          correct_answer: string | null
          points: number
          created_at: string
        }
        Insert: {
          id?: string
          question_id?: string | null
          question_option_id?: string | null
          correct_answer?: string | null
          points: number
          created_at?: string
        }
        Update: {
          id?: string
          question_id?: string | null
          question_option_id?: string | null
          correct_answer?: string | null
          points?: number
          created_at?: string
        }
      }
      user_test_sessions: {
        Row: {
          id: string
          user_id: string
          test_id: string
          status: 'in_progress' | 'completed'
          started_at: string
          completed_at: string | null
          total_score: number
        }
        Insert: {
          id?: string
          user_id: string
          test_id: string
          status: 'in_progress' | 'completed'
          started_at?: string
          completed_at?: string | null
          total_score?: number
        }
        Update: {
          id?: string
          user_id?: string
          test_id?: string
          status?: 'in_progress' | 'completed'
          started_at?: string
          completed_at?: string | null
          total_score?: number
        }
      }
      user_responses: {
        Row: {
          id: string
          session_id: string
          question_id: string
          question_option_id: string | null
          response_value: string
          points_awarded: number
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          question_id: string
          question_option_id?: string | null
          response_value: string
          points_awarded?: number
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          question_id?: string
          question_option_id?: string | null
          response_value?: string
          points_awarded?: number
          created_at?: string
        }
      }
    }
  }
}

// --- Application Types (Legacy & Helpers) ---

export interface IQuestionOption {
  id: string;
  label: string;
  value: string;
  order_index?: number;
}

export interface IQuestion {
  id: string;
  section_id: string;
  type: 'MCQ' | 'LIKERT_GRID' | 'SCENARIO';
  scenario_context?: string;
  scenario_image_url?: string;
  question_text: string;
  order_index: number;
  options: IQuestionOption[];
}

export interface ITestSection {
  id: string;
  test_id: string;
  title: string;
  instructions: string;
  order_index: number;
  questions: IQuestion[];
  branch?: Branch | null;
}

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
  isReviewing?: boolean;
}

export interface HistoryItem {
  id: string;
  date: string;
  score: number;
  branch: Branch;
  testTitle?: string; // New: to show which worksheet/exam
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

export type TaskType = 'user_created' | 'group_class' | 'curriculum' | 'key_date';

export interface Task {
  id: string;
  title: string;
  description?: string;
  due_date: string;
  type: TaskType;
  user_id: string;
  is_public?: boolean;
}