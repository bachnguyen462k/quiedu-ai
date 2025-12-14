export interface Flashcard {
  id: string;
  term: string;
  definition: string;
}

export interface StudySet {
  id: string;
  title: string;
  description: string;
  author: string;
  createdAt: number;
  plays?: number;
  averageScore?: number;
  cards: Flashcard[];
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
}

export type ViewState = 'LANDING' | 'LOGIN' | 'DASHBOARD' | 'LIBRARY' | 'CLASSES' | 'CREATE' | 'SET_DETAILS' | 'STUDY' | 'QUIZ' | 'AI_CREATOR';

export enum StudyMode {
  FLASHCARD = 'FLASHCARD',
  QUIZ = 'QUIZ'
}

// --- Auth & Class Management Types ---

export type UserRole = 'STUDENT' | 'TEACHER';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

export interface StudentQuizDetail {
  questionTerm: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
}

export interface StudentResult {
  studentId: string;
  studentName: string;
  score: number;
  totalQuestions: number;
  completedAt: number;
  details?: StudentQuizDetail[]; // Optional: for viewing detailed answers
  
  // File upload features
  submissionUrl?: string; // Base64 string of the uploaded file/image
  submissionType?: 'image' | 'pdf';
  aiFeedback?: string; // AI analysis of the submission
}

export interface ClassAssignment {
  id: string;
  studySetId: string;
  studySetTitle: string;
  assignedAt: number;
  results: StudentResult[];
  
  // Teacher attachment
  attachmentUrl?: string;
  attachmentName?: string;
}

export interface ClassGroup {
  id: string;
  name: string;
  teacherId: string;
  description?: string;
  studentCount: number;
  assignments: ClassAssignment[];
}

// --- AI Textbook Parser Types ---

export interface TextbookAnalysisResult {
  lessonTitle: string;
  summary: string;
  difficultyLevel: 'Dễ' | 'Trung bình' | 'Khó' | 'Rất khó';
  difficultyReasoning: string;
  keyPoints: string[];
  examples: string[];
  generatedQuestions: {
    question: string;
    options: string[];
    correctAnswer: string;
    explanation: string;
  }[];
}