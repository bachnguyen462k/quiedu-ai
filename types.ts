
export interface Flashcard {
  id: string;
  term: string;
  definition: string;
  options?: string[]; 
  explanation?: string; 
  relatedLink?: string; 
}

export interface Review {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number; 
  comment: string;
  createdAt: number;
}

export type PrivacyStatus = 'PUBLIC' | 'PRIVATE';

export interface StudySet {
  id: string;
  title: string;
  description: string;
  author: string;
  createdAt: number;
  plays?: number;
  averageScore?: number; 
  cards: Flashcard[];
  reviews?: Review[]; 
  isFavorite?: boolean; 
  
  privacy: PrivacyStatus;
  level?: string;      
  school?: string;     
  major?: string;      
  subject?: string;    
  topic?: string;      
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  relatedLink?: string; 
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
  roles: UserRole[]; // Changed from single role to array
  avatar?: string;
}

export interface LoginCredentials {
  email: string;
  password?: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken?: string;
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
  details?: StudentQuizDetail[]; 
  
  submissionUrl?: string; 
  submissionType?: 'image' | 'pdf';
  aiFeedback?: string; 
}

export interface ClassAssignment {
  id: string;
  studySetId: string;
  studySetTitle: string;
  assignedAt: number;
  results: StudentResult[];
  
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
  options?: string[];
  correctAnswer?: string;
  solutionGuide: string; 
  knowledgeApplied: string; 
}

export interface AITopic {
  topicName: string; 
  summary: string;
  keyPoints: string[]; 
  formulas: string[]; 
  questions: AIQuestion[]; 
}

export interface TextbookAnalysisResult {
  subject: string; 
  grade: string;   
  overallSummary: string; 
  topics: AITopic[]; 
}

export interface AiGenerationRecord {
  id: string;
  createdAt: number;
  fileName: string; 
  result: TextbookAnalysisResult;
}

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

export interface Notification {
  id: string;
  message: string;
  type: NotificationType;
}

export type ThemeMode = 'light' | 'dark';