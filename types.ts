
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

export type StudySetType = 'MANUAL' | 'AI_TOPIC' | 'AI_FILE' | 'AI_TEXTBOOK';

export interface StudySet {
  id: string;
  title: string;
  description: string;
  author: string;
  createdAt: number;
  plays?: number;
  totalAttempts?: number; // Số lượng người đã làm quiz
  averageScore?: number; 
  cards: Flashcard[];
  reviews?: Review[]; 
  isFavorite?: boolean; 
  
  privacy: PrivacyStatus;
  status?: string;
  type?: StudySetType;
  level?: string;      
  school?: string;     
  major?: string;      
  subject?: string;    
  topic?: string;      
}

// --- Server-side Quiz Types ---

export interface ServerQuestion {
  attemptQuestionId: number;
  questionNo: number;
  cardId: number;
  term: string;
  options: string[];
  selectedAnswer: string | null; // Đáp án đã chọn (nếu có)
}

export interface QuizAttempt {
  attemptId: number;
  studySet: {
    id: number;
    title: string;
    description: string;
    totalQuestions?: number; // Backend trả ở đây
  };
  questions: ServerQuestion[] | null; // Có thể null khi mới start
  totalQuestions: number; // Dự phòng
  startedAt: string;
}

export interface QuizHistoryItem {
  attemptId: number;
  studySetId: number;
  studySetTitle: string;
  correctCount: number;
  totalQuestions: number;
  totalScore: number;
  totalTimeSec: number;
  submittedAt: string;
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
  QUIZ = 'QUIZ',
  REVIEW = 'REVIEW'
}

// --- Auth & Class Management Types ---

export type UserRole = 'USER' | 'ADMIN' | 'TEACHER';

export interface User {
  id: string;
  name: string;
  email: string;
  roles: UserRole[]; 
  permissions: string[];
  avatar?: string;
  darkMode?: boolean;
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

export type EventTheme = 'DEFAULT' | 'CHRISTMAS' | 'TET' | 'AUTUMN';
