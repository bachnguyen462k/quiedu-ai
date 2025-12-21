
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { User, ClassGroup, StudySet, ClassAssignment, StudentResult } from '../types';
import { Users, Plus, BookOpen, BarChart3, MoreVertical, Calendar, ChevronRight, Search, ArrowLeft, Trophy, TrendingUp, AlertCircle, ChevronLeft, Check, X, Eye, Upload, FileText, Sparkles, Paperclip, Download } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { gradeSubmissionWithAI } from '../services/geminiService';
import { useTranslation } from 'react-i18next';
import ThemeLoader from './ThemeLoader';

interface ClassManagementProps {
  currentUser: User;
  sets: StudySet[];
}

const MOCK_CLASSES: ClassGroup[] = [
  {
    id: 'c1',
    name: 'Lớp 12A1 - Anh Văn',
    teacherId: 't1',
    description: 'Lớp chuyên Anh niên khóa 2024-2025',
    studentCount: 34,
    assignments: [
      {
        id: 'a1',
        studySetId: '1',
        studySetTitle: 'Từ vựng Tiếng Anh - Chủ đề Gia đình',
        assignedAt: Date.now() - 86400000 * 2,
        attachmentName: 'Bai_tap_bo_sung.pdf',
        results: [
            { studentId: 's1', studentName: 'Nguyễn Văn Nam', score: 90, totalQuestions: 10, completedAt: Date.now() },
            { studentId: 's2', studentName: 'Trần Thị B', score: 60, totalQuestions: 10, completedAt: Date.now() },
            { studentId: 's3', studentName: 'Lê Văn C', score: 85, totalQuestions: 10, completedAt: Date.now() },
            { studentId: 's4', studentName: 'Phạm Văn D', score: 40, totalQuestions: 10, completedAt: Date.now() },
            { studentId: 's5', studentName: 'Đỗ Thị E', score: 100, totalQuestions: 10, completedAt: Date.now() },
        ]
      }
    ]
  },
  {
    id: 'c2',
    name: 'Lớp 10C2 - Ôn thi HK1',
    teacherId: 't1',
    description: 'Nhóm ôn tập bổ trợ buổi chiều',
    studentCount: 12,
    assignments: []
  }
];

const ITEMS_PER_PAGE = 5;

const ClassManagement: React.FC<ClassManagementProps> = ({ currentUser, sets }) => {
  const { t } = useTranslation();
  const [classes, setClasses] = useState<ClassGroup[]>(MOCK_CLASSES);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'MEMBERS' | 'STATS'>('OVERVIEW');
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null); 
  const [resultsPage, setResultsPage] = useState(1);
  const [viewingStudentResult, setViewingStudentResult] = useState<StudentResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [teacherAttachment, setTeacherAttachment] = useState<{name: string, data: string} | null>(null);
  const [studentSubmission, setStudentSubmission] = useState<{name: string, data: string} | null>(null);
  const [isStudentSubmitting, setIsStudentSubmitting] = useState<string | null>(null); 
  const [aiFeedback, setAiFeedback] = useState<string>('');
  const [isGrading, setIsGrading] = useState(false);

  useEffect(() => {
    // Giả lập việc fetch dữ liệu lớp học
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, [selectedClassId, selectedAssignmentId]);

  const selectedClass = classes.find(c => c.id === selectedClassId);
  const selectedAssignment = selectedClass?.assignments.find(a => a.id === selectedAssignmentId);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleCreateClass = () => {
    const name = prompt(t('class_mgmt.create_class_prompt'));
    if (name) {
      const newClass: ClassGroup = {
        id: `c${Date.now()}`,
        name,
        teacherId: currentUser.id,
        description: t('class_mgmt.default_desc'),
        studentCount: 0,
        assignments: []
      };
      setClasses([...classes, newClass]);
    }
  };

  const handleTeacherFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const base64 = await fileToBase64(file);
      setTeacherAttachment({ name: file.name, data: base64 });
    }
  };

  const handleStudentFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        const base64 = await fileToBase64(file);
        setStudentSubmission({ name: file.name, data: base64 });
    }
  };

  const handleAssignSet = (setId: string, setTitle: string) => {
    if (!selectedClass) return;
    const newAssignment: ClassAssignment = {
        id: `as${Date.now()}`,
        studySetId: setId,
        studySetTitle: setTitle,
        assignedAt: Date.now(),
        results: [],
        attachmentName: teacherAttachment?.name,
        attachmentUrl: teacherAttachment?.data
    };
    const updatedClasses = classes.map(c => {
        if (c.id === selectedClass.id) {
            return { ...c, assignments: [newAssignment, ...c.assignments] };
        }
        return c;
    });
    setClasses(updatedClasses);
    setTeacherAttachment(null);
    setIsAssignModalOpen(false);
  };

  const handleSubmitAssignment = () => {
      if (!studentSubmission || !isStudentSubmitting) return;
      const updatedClasses = classes.map(cls => ({
          ...cls,
          assignments: cls.assignments.map(assign => {
              if (assign.id === isStudentSubmitting) {
                  const existingResultIndex = assign.results.findIndex(r => r.studentId === currentUser.id);
                  const newResult: StudentResult = {
                      studentId: currentUser.id,
                      studentName: currentUser.name,
                      score: 0, 
                      totalQuestions: 0,
                      completedAt: Date.now(),
                      submissionUrl: studentSubmission.data,
                      submissionType: 'image'
                  };
                  let newResults = [...assign.results];
                  if (existingResultIndex >= 0) newResults[existingResultIndex] = newResult;
                  else newResults.push(newResult);
                  return { ...assign, results: newResults };
              }
              return assign;
          })
      }));
      setClasses(updatedClasses);
      setStudentSubmission(null);
      setIsStudentSubmitting(null);
      alert(t('notifications.submitted_success'));
  };

  const handleTriggerAIGrading = async () => {
      if (!viewingStudentResult?.submissionUrl || !selectedAssignment) return;
      setIsGrading(true);
      const feedback = await gradeSubmissionWithAI(viewingStudentResult.submissionUrl, selectedAssignment.studySetTitle);
      setAiFeedback(feedback);
      setIsGrading(false);
      setViewingStudentResult(prev => prev ? ({ ...prev, aiFeedback: feedback }) : null);
      setClasses(classes.map(cls => ({
        ...cls,
        assignments: cls.assignments.map(assign => {
            if (assign.id === selectedAssignment.id) {
                return {
                    ...assign,
                    results: assign.results.map(res => 
                        res.studentId === viewingStudentResult.studentId 
                        ? { ...res, aiFeedback: feedback } 
                        : res
                    )
                };
            }
            return assign;
        })
      })));
  };

  const handleViewStudentResult = (result: StudentResult) => {
      if (!selectedAssignmentId) return;
      setViewingStudentResult({ ...result });
      setAiFeedback(result.aiFeedback || '');
  };

  const getAssignmentStats = (assignment: ClassAssignment) => {
    const scores = assignment.results.map(r => r.score);
    const avg = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    const max = scores.length > 0 ? Math.max(...scores) : 0;
    const min = scores.length > 0 ? Math.min(...scores) : 0;
    const distribution = [
        { name: t('class_mgmt.dist_weak'), range: [0, 49], count: 0, fill: '#EF4444' },
        { name: t('class_mgmt.dist_avg'), range: [50, 69], count: 0, fill: '#F59E0B' },
        { name: t('class_mgmt.dist_good'), range: [70, 84], count: 0, fill: '#3B82F6' },
        { name: t('class_mgmt.dist_excellent'), range: [85, 100], count: 0, fill: '#10B981' },
    ];
    scores.forEach(s => {
        if (s < 50) distribution[0].count++;
        else if (s < 70) distribution[1].count++;
        else if (s < 85) distribution[2].count++;
        else distribution[3].count++;
    });
    return { avg, max, min, distribution };
  };

  // UI Loading State
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in">
          <ThemeLoader size={48} />
          <p className="mt-4 text-gray-500 dark:text-gray-400 font-bold text-sm uppercase tracking-widest">{t('dashboard.loading')}</p>
      </div>
    );
  }

  // --- View Logic for Teacher ---
  if (currentUser.roles.includes('TEACHER')) {
    if (selectedClass) {
        return (
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 pb-20 animate-fade-in">
                <button 
                    onClick={() => {
                        setIsLoading(true);
                        setSelectedClassId(null);
                        setSelectedAssignmentId(null);
                        setActiveTab('OVERVIEW');
                    }}
                    className="mb-4 text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 flex items-center gap-2 text-sm font-medium transition-colors"
                >
                    &larr; {t('class_mgmt.back_list')}
                </button>

                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden mb-6 transition-colors">
                    <div className="h-32 bg-gradient-to-r from-indigo-600 to-purple-600 p-8 flex flex-col justify-end">
                        <h1 className="text-3xl font-bold text-white">{selectedClass.name}</h1>
                        <p className="text-indigo-100">{selectedClass.description}</p>
                    </div>
                    <div className="px-6 py-2 border-b border-gray-100 dark:border-gray-700 flex gap-6 overflow-x-auto">
                        {['OVERVIEW', 'MEMBERS', 'STATS'].map((tab) => (
                            <button 
                                key={tab}
                                onClick={() => { setIsLoading(true); setActiveTab(tab as any); setSelectedAssignmentId(null); }}
                                className={`py-3 px-2 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${activeTab === tab ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
                            >
                                {t(`class_mgmt.tab_${tab.toLowerCase()}`)} {tab === 'MEMBERS' && `(${selectedClass.studentCount})`}
                            </button>
                        ))}
                    </div>
                </div>

                {activeTab === 'OVERVIEW' && (
                    <div>
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">{t('class_mgmt.assignments_title')}</h3>
                            <button onClick={() => setIsAssignModalOpen(true)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-indigo-700 flex items-center gap-2 transition-colors"><Plus size={16} /> {t('class_mgmt.assign_new')}</button>
                        </div>
                        {selectedClass.assignments.length === 0 ? (
                             <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 transition-colors">
                                <BookOpen className="mx-auto text-gray-300 dark:text-gray-600 mb-3" size={40} />
                                <p className="text-gray-500 dark:text-gray-400">{t('class_mgmt.no_assignments')}</p>
                             </div>
                        ) : (
                            <div className="space-y-4">
                                {selectedClass.assignments.map(assign => (
                                    <div key={assign.id} className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between hover:border-indigo-300 dark:hover:border-indigo-500 transition-colors gap-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0"><BookOpen size={20} /></div>
                                            <div>
                                                <h4 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">{assign.studySetTitle}{assign.attachmentName && <Paperclip size={14} className="text-gray-400" />}</h4>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">{t('class_mgmt.assigned_date')} {new Date(assign.assignedAt).toLocaleDateString('vi-VN')}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-6 justify-end">
                                            <div className="text-right">
                                                <div className="text-sm font-bold text-gray-900 dark:text-white">{assign.results.length}/{selectedClass.studentCount}</div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400">{t('class_mgmt.submitted_count')}</div>
                                            </div>
                                            <button className="text-gray-400 hover:text-gray-900 dark:hover:text-white"><MoreVertical size={20} /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
                
                {/* Các Tab Khác giữ nguyên nội dung hiển thị nhưng bọc bởi logic loading đã thêm ở useEffect trên */}
                {activeTab === 'STATS' && (
                     <div>
                        {!selectedAssignmentId ? (
                             <div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">{t('class_mgmt.select_stat')}</h3>
                                {selectedClass.assignments.length === 0 ? (
                                    <div className="text-center text-gray-500 dark:text-gray-400 py-10">{t('class_mgmt.no_stats')}</div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {selectedClass.assignments.map(assign => {
                                            const stats = getAssignmentStats(assign);
                                            return (
                                                <div 
                                                    key={assign.id}
                                                    onClick={() => { setIsLoading(true); setSelectedAssignmentId(assign.id); }}
                                                    className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-500 cursor-pointer transition-all group"
                                                >
                                                    <div className="flex justify-between items-start mb-4">
                                                        <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-colors"><BarChart3 size={20} /></div>
                                                        <span className="text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded">{new Date(assign.assignedAt).toLocaleDateString('vi-VN')}</span>
                                                    </div>
                                                    <h4 className="font-bold text-gray-900 dark:text-white text-lg mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">{assign.studySetTitle}</h4>
                                                    <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                                                        <div><p className="text-xs text-gray-500 dark:text-gray-400">{t('class_mgmt.submitted_count')}</p><p className="font-bold text-gray-900 dark:text-white">{assign.results.length}/{selectedClass.studentCount}</p></div>
                                                        <div><p className="text-xs text-gray-500 dark:text-gray-400">{t('class_mgmt.avg_score')}</p><p className={`font-bold ${stats.avg >= 80 ? 'text-green-600 dark:text-green-400' : stats.avg >= 50 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'}`}>{stats.avg}/100</p></div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                             </div>
                        ) : (
                            selectedAssignment && (
                                <div className="animate-fade-in">
                                    <button onClick={() => { setIsLoading(true); setSelectedAssignmentId(null); setResultsPage(1); }} className="mb-4 text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 flex items-center gap-1 text-sm font-bold transition-colors"><ArrowLeft size={16} /> {t('class_mgmt.back_stats')}</button>
                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">{selectedAssignment.studySetTitle}</h2>
                                    <p className="text-gray-500 text-sm">Hiển thị thống kê chi tiết...</p>
                                </div>
                            )
                        )}
                     </div>
                )}
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 pb-20 animate-fade-in">
            <div className="flex justify-between items-center mb-8">
                <div><h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('class_mgmt.mgmt_title')}</h1><p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{t('class_mgmt.mgmt_desc')}</p></div>
                <button onClick={handleCreateClass} className="bg-indigo-600 text-white px-4 py-2.5 rounded-lg font-bold hover:bg-indigo-700 flex items-center gap-2 shadow-sm transition-colors"><Plus size={18} /> <span className="hidden sm:inline">{t('class_mgmt.create_class_btn')}</span><span className="sm:hidden">{t('class_mgmt.add_short')}</span></button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {classes.map(cls => (
                    <div key={cls.id} onClick={() => { setIsLoading(true); setSelectedClassId(cls.id); }} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-500 hover:shadow-md cursor-pointer transition-all group">
                        <div className="flex items-start justify-between mb-4">
                            <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-colors"><Users size={24} /></div>
                            <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-bold px-2 py-1 rounded">{cls.studentCount} {t('class_mgmt.student_count')}</span>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{cls.name}</h3>
                        <p className="text-gray-500 dark:text-gray-400 text-sm line-clamp-2 mb-4">{cls.description}</p>
                        <div className="border-t border-gray-100 dark:border-gray-700 pt-4 flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                             <span className="flex items-center gap-1"><BookOpen size={14} /> {cls.assignments.length} {t('class_mgmt.exercises_count')}</span>
                             <span className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-medium group-hover:underline">{t('class_mgmt.detail_link')} <ChevronRight size={14} /></span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 pb-20 animate-fade-in">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">{t('class_mgmt.my_classes')}</h1>
        <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">{t('class_mgmt.no_classes')}</p>
            <button className="mt-4 text-indigo-600 dark:text-indigo-400 font-bold hover:underline">{t('class_mgmt.join_class')}</button>
        </div>
    </div>
  );
};

export default ClassManagement;
