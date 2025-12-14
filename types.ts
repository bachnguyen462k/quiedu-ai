
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

export type ViewState = 'LANDING' | 'LOGIN' | 'DASHBOARD' | 'LIBRARY' | 'CLASSES' | 'CREATE' | 'SET_DETAILS' | 'STUDY' | 'QUIZ' | 'AI_CREATOR' | 'SETTINGS';

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

export type QuestionDifficulty = 'Nhận biết' | 'Thông hiểu' | 'Vận dụng' | 'Vận dụng cao';

export interface AIQuestion {
  type: 'QUIZ' | 'ESSAY';
  difficulty: QuestionDifficulty;
  question: string;
  // For Quiz
  options?: string[];
  correctAnswer?: string;
  // For Essay & Teacher Guide
  solutionGuide: string; // Step-by-step guide or final answer
  knowledgeApplied: string; // Specific formula or concept used (e.g. "Hằng đẳng thức số 1")
}

export interface AITopic {
  topicName: string; // e.g., "Bài 1: Căn bậc hai"
  summary: string;
  keyPoints: string[]; // Bullet points of theory
  formulas: string[]; // Mathematical formulas or key rules identified
  questions: AIQuestion[]; // Sorted from Easy to Hard
}

export interface TextbookAnalysisResult {
  subject: string; // Detected subject
  grade: string;   // Detected grade level
  overallSummary: string; // Summary of the whole file
  topics: AITopic[]; // List of extracted lessons/topics
}

export interface AiGenerationRecord {
  id: string;
  createdAt: number;
  fileName: string; // Name of the uploaded file
  result: TextbookAnalysisResult;
}