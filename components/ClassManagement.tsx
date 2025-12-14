import React, { useState, useMemo, useRef } from 'react';
import { User, ClassGroup, StudySet, ClassAssignment, StudentResult } from '../types';
import { Users, Plus, BookOpen, BarChart3, MoreVertical, Calendar, ChevronRight, Search, ArrowLeft, Trophy, TrendingUp, AlertCircle, ChevronLeft, Check, X, Eye, Upload, FileText, Sparkles, Paperclip, Download } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { gradeSubmissionWithAI } from '../services/geminiService';

interface ClassManagementProps {
  currentUser: User;
  sets: StudySet[]; // Available sets to assign
}

// Mock Data for Classes
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
            { studentId: 's6', studentName: 'Hoàng Văn F', score: 75, totalQuestions: 10, completedAt: Date.now() },
            { studentId: 's7', studentName: 'Bùi Thị G', score: 90, totalQuestions: 10, completedAt: Date.now() },
            { studentId: 's8', studentName: 'Ngô Văn H', score: 55, totalQuestions: 10, completedAt: Date.now() },
            { studentId: 's9', studentName: 'Đặng Thị I', score: 80, totalQuestions: 10, completedAt: Date.now() },
            { studentId: 's10', studentName: 'Vũ Văn K', score: 65, totalQuestions: 10, completedAt: Date.now() },
        ]
      },
      {
        id: 'a2',
        studySetId: '3',
        studySetTitle: 'Lịch Sử 12 - Cách mạng tháng 8',
        assignedAt: Date.now() - 86400000 * 5,
        results: [
            { studentId: 's1', studentName: 'Nguyễn Văn Nam', score: 95, totalQuestions: 20, completedAt: Date.now() },
            { studentId: 's2', studentName: 'Trần Thị B', score: 80, totalQuestions: 20, completedAt: Date.now() },
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
  const [classes, setClasses] = useState<ClassGroup[]>(MOCK_CLASSES);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'MEMBERS' | 'STATS'>('OVERVIEW');
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null); 
  const [resultsPage, setResultsPage] = useState(1);
  const [viewingStudentResult, setViewingStudentResult] = useState<StudentResult | null>(null);
  
  // File upload states
  const [teacherAttachment, setTeacherAttachment] = useState<{name: string, data: string} | null>(null);
  const [studentSubmission, setStudentSubmission] = useState<{name: string, data: string} | null>(null);
  const [isStudentSubmitting, setIsStudentSubmitting] = useState<string | null>(null); // assignment ID
  
  // AI Grading state
  const [aiFeedback, setAiFeedback] = useState<string>('');
  const [isGrading, setIsGrading] = useState(false);

  const selectedClass = classes.find(c => c.id === selectedClassId);
  const selectedAssignment = selectedClass?.assignments.find(a => a.id === selectedAssignmentId);

  // Helper to convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleCreateClass = () => {
    const name = prompt("Nhập tên lớp học mới:");
    if (name) {
      const newClass: ClassGroup = {
        id: `c${Date.now()}`,
        name,
        teacherId: currentUser.id,
        description: 'Mô tả lớp học...',
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

      // Mock submitting by finding the assignment and adding a "result"
      const updatedClasses = classes.map(cls => ({
          ...cls,
          assignments: cls.assignments.map(assign => {
              if (assign.id === isStudentSubmitting) {
                  // Check if student already submitted
                  const existingResultIndex = assign.results.findIndex(r => r.studentId === currentUser.id);
                  const newResult: StudentResult = {
                      studentId: currentUser.id,
                      studentName: currentUser.name,
                      score: 0, // Pending grading
                      totalQuestions: 0,
                      completedAt: Date.now(),
                      submissionUrl: studentSubmission.data,
                      submissionType: 'image'
                  };

                  let newResults = [...assign.results];
                  if (existingResultIndex >= 0) {
                      newResults[existingResultIndex] = newResult;
                  } else {
                      newResults.push(newResult);
                  }
                  
                  return { ...assign, results: newResults };
              }
              return assign;
          })
      }));

      setClasses(updatedClasses);
      setStudentSubmission(null);
      setIsStudentSubmitting(null);
      alert("Đã nộp bài thành công!");
  };

  const handleTriggerAIGrading = async () => {
      if (!viewingStudentResult?.submissionUrl || !selectedAssignment) return;
      
      setIsGrading(true);
      const feedback = await gradeSubmissionWithAI(viewingStudentResult.submissionUrl, selectedAssignment.studySetTitle);
      setAiFeedback(feedback);
      setIsGrading(false);
      
      // Update the result with AI feedback locally
      setViewingStudentResult(prev => prev ? ({ ...prev, aiFeedback: feedback }) : null);
      
      // Update in main state
      const updatedClasses = classes.map(cls => ({
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
      }));
      setClasses(updatedClasses);
  };

  // Helper to generate mock details for viewing a student's submission (Quiz mode)
  const generateMockDetails = (assignmentId: string, result: StudentResult) => {
    if (result.submissionUrl) return []; // If it's a file submission, no quiz details

    const assignment = selectedClass?.assignments.find(a => a.id === assignmentId);
    const relatedSet = sets.find(s => s.id === assignment?.studySetId) || sets[0];
    
    // Simulate details based on score
    const correctCount = Math.round((result.score / 100) * result.totalQuestions);
    
    return relatedSet.cards.slice(0, result.totalQuestions).map((card, idx) => {
        const isCorrect = idx < correctCount;
        return {
            questionTerm: card.term,
            userAnswer: isCorrect ? card.definition : "Đáp án sai (Mô phỏng)",
            correctAnswer: card.definition,
            isCorrect: isCorrect
        };
    });
  };

  const handleViewStudentResult = (result: StudentResult) => {
      if (!selectedAssignmentId) return;
      const details = generateMockDetails(selectedAssignmentId, result);
      setViewingStudentResult({ ...result, details });
      setAiFeedback(result.aiFeedback || '');
  };

  // Helper to calculate stats for chart
  const getAssignmentStats = (assignment: ClassAssignment) => {
    const scores = assignment.results.map(r => r.score);
    const avg = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    const max = scores.length > 0 ? Math.max(...scores) : 0;
    const min = scores.length > 0 ? Math.min(...scores) : 0;

    // Distribution Data
    const distribution = [
        { name: 'Yếu (<50)', range: [0, 49], count: 0, fill: '#EF4444' }, // Red
        { name: 'TB (50-69)', range: [50, 69], count: 0, fill: '#F59E0B' }, // Yellow
        { name: 'Khá (70-84)', range: [70, 84], count: 0, fill: '#3B82F6' }, // Blue
        { name: 'Giỏi (85+)', range: [85, 100], count: 0, fill: '#10B981' }, // Green
    ];

    scores.forEach(s => {
        if (s < 50) distribution[0].count++;
        else if (s < 70) distribution[1].count++;
        else if (s < 85) distribution[2].count++;
        else distribution[3].count++;
    });

    return { avg, max, min, distribution };
  };

  // --- View: Teacher Dashboard ---
  if (currentUser.role === 'TEACHER') {
    if (selectedClass) {
        // Detailed Class View
        return (
            <div className="max-w-6xl mx-auto px-6 py-8 pb-20">
                <button 
                    onClick={() => {
                        setSelectedClassId(null);
                        setSelectedAssignmentId(null);
                        setActiveTab('OVERVIEW');
                    }}
                    className="mb-4 text-gray-500 hover:text-indigo-600 flex items-center gap-2 text-sm font-medium"
                >
                    &larr; Quay lại danh sách lớp
                </button>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-6">
                    <div className="h-32 bg-gradient-to-r from-indigo-600 to-purple-600 p-8 flex flex-col justify-end">
                        <h1 className="text-3xl font-bold text-white">{selectedClass.name}</h1>
                        <p className="text-indigo-100">{selectedClass.description}</p>
                    </div>
                    <div className="px-6 py-2 border-b border-gray-100 flex gap-6 overflow-x-auto">
                        <button 
                            onClick={() => { setActiveTab('OVERVIEW'); setSelectedAssignmentId(null); }}
                            className={`py-3 px-2 border-b-2 font-medium text-sm transition-colors ${activeTab === 'OVERVIEW' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-900'}`}
                        >
                            Bài tập & Hoạt động
                        </button>
                        <button 
                             onClick={() => { setActiveTab('MEMBERS'); setSelectedAssignmentId(null); }}
                             className={`py-3 px-2 border-b-2 font-medium text-sm transition-colors ${activeTab === 'MEMBERS' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-900'}`}
                        >
                            Thành viên ({selectedClass.studentCount})
                        </button>
                        <button 
                             onClick={() => { setActiveTab('STATS'); setSelectedAssignmentId(null); }}
                             className={`py-3 px-2 border-b-2 font-medium text-sm transition-colors ${activeTab === 'STATS' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-900'}`}
                        >
                            Bảng điểm & Thống kê
                        </button>
                    </div>
                </div>

                {/* --- TAB: OVERVIEW --- */}
                {activeTab === 'OVERVIEW' && (
                    <div>
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-gray-900">Bài tập đã giao</h3>
                            <button 
                                onClick={() => setIsAssignModalOpen(true)}
                                className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-indigo-700 flex items-center gap-2"
                            >
                                <Plus size={16} /> Giao bài mới
                            </button>
                        </div>
                        
                        {selectedClass.assignments.length === 0 ? (
                             <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                                <BookOpen className="mx-auto text-gray-300 mb-3" size={40} />
                                <p className="text-gray-500">Chưa có bài tập nào được giao.</p>
                             </div>
                        ) : (
                            <div className="space-y-4">
                                {selectedClass.assignments.map(assign => (
                                    <div key={assign.id} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between hover:border-indigo-300 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                                                <BookOpen size={20} />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-gray-900 flex items-center gap-2">
                                                    {assign.studySetTitle}
                                                    {assign.attachmentName && <Paperclip size={14} className="text-gray-400" />}
                                                </h4>
                                                <p className="text-xs text-gray-500">Giao ngày: {new Date(assign.assignedAt).toLocaleDateString('vi-VN')}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <div className="text-right">
                                                <div className="text-sm font-bold text-gray-900">{assign.results.length}/{selectedClass.studentCount}</div>
                                                <div className="text-xs text-gray-500">Đã nộp</div>
                                            </div>
                                            <button className="text-gray-400 hover:text-gray-900">
                                                <MoreVertical size={20} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* --- TAB: STATS --- */}
                {activeTab === 'STATS' && (
                     <div>
                        {/* Level 1: List of Assignments (Hierarchy) */}
                        {!selectedAssignmentId ? (
                             <div>
                                <h3 className="text-xl font-bold text-gray-900 mb-6">Chọn bài kiểm tra để xem thống kê</h3>
                                {selectedClass.assignments.length === 0 ? (
                                    <div className="text-center text-gray-500 py-10">Chưa có dữ liệu thống kê.</div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {selectedClass.assignments.map(assign => {
                                            const stats = getAssignmentStats(assign);
                                            return (
                                                <div 
                                                    key={assign.id}
                                                    onClick={() => setSelectedAssignmentId(assign.id)}
                                                    className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-indigo-300 cursor-pointer transition-all group"
                                                >
                                                    <div className="flex justify-between items-start mb-4">
                                                        <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                                            <BarChart3 size={20} />
                                                        </div>
                                                        <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                                            {new Date(assign.assignedAt).toLocaleDateString('vi-VN')}
                                                        </span>
                                                    </div>
                                                    <h4 className="font-bold text-gray-900 text-lg mb-2 group-hover:text-indigo-600">{assign.studySetTitle}</h4>
                                                    <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-100">
                                                        <div>
                                                            <p className="text-xs text-gray-500">Đã nộp</p>
                                                            <p className="font-bold text-gray-900">{assign.results.length}/{selectedClass.studentCount}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-gray-500">Điểm TB</p>
                                                            <p className={`font-bold ${stats.avg >= 80 ? 'text-green-600' : stats.avg >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                                                                {stats.avg}/100
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                             </div>
                        ) : (
                            /* Level 2: Detail Stats for specific Assignment */
                            selectedAssignment && (() => {
                                const stats = getAssignmentStats(selectedAssignment);
                                const sortedResults = [...selectedAssignment.results].sort((a, b) => b.score - a.score);
                                const totalPages = Math.ceil(sortedResults.length / ITEMS_PER_PAGE);
                                const currentResults = sortedResults.slice((resultsPage - 1) * ITEMS_PER_PAGE, resultsPage * ITEMS_PER_PAGE);

                                return (
                                    <div className="animate-fade-in">
                                        <button 
                                            onClick={() => { setSelectedAssignmentId(null); setResultsPage(1); }}
                                            className="mb-4 text-indigo-600 hover:text-indigo-800 flex items-center gap-1 text-sm font-bold"
                                        >
                                            <ArrowLeft size={16} /> Quay lại danh sách
                                        </button>

                                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                                            <div>
                                                <h2 className="text-2xl font-bold text-gray-900">{selectedAssignment.studySetTitle}</h2>
                                                <p className="text-gray-500 text-sm">Thống kê chi tiết kết quả làm bài của học sinh</p>
                                            </div>
                                            <div className="flex gap-2">
                                                 <div className="bg-white border px-4 py-2 rounded-lg text-center shadow-sm">
                                                    <div className="text-xs text-gray-500 uppercase font-bold">Điểm TB</div>
                                                    <div className="text-xl font-bold text-indigo-600">{stats.avg}</div>
                                                 </div>
                                                 <div className="bg-white border px-4 py-2 rounded-lg text-center shadow-sm">
                                                    <div className="text-xs text-gray-500 uppercase font-bold">Cao nhất</div>
                                                    <div className="text-xl font-bold text-green-600">{stats.max}</div>
                                                 </div>
                                                 <div className="bg-white border px-4 py-2 rounded-lg text-center shadow-sm">
                                                    <div className="text-xs text-gray-500 uppercase font-bold">Thấp nhất</div>
                                                    <div className="text-xl font-bold text-red-600">{stats.min}</div>
                                                 </div>
                                            </div>
                                        </div>

                                        {/* Chart Section */}
                                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-8">
                                            <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                                <BarChart3 size={20} className="text-gray-400" /> Biểu đồ phân bổ điểm số
                                            </h4>
                                            <div className="h-64 w-full">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <BarChart data={stats.distribution}>
                                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} dy={10} />
                                                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} />
                                                        <Tooltip 
                                                            cursor={{fill: 'transparent'}}
                                                            contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                                                        />
                                                        <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={50}>
                                                            {stats.distribution.map((entry, index) => (
                                                                <Cell key={`cell-${index}`} fill={entry.fill} />
                                                            ))}
                                                        </Bar>
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>

                                        {/* Result Table */}
                                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                                                <h4 className="font-bold text-gray-800">Danh sách học sinh ({selectedAssignment.results.length} đã nộp)</h4>
                                            </div>
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-sm text-left">
                                                    <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                                        <tr>
                                                            <th className="px-6 py-3">Học sinh</th>
                                                            <th className="px-6 py-3">Điểm số</th>
                                                            <th className="px-6 py-3">Trạng thái</th>
                                                            <th className="px-6 py-3">Thời gian nộp</th>
                                                            <th className="px-6 py-3">Chi tiết</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {currentResults.length > 0 ? (
                                                            currentResults.map((res, idx) => (
                                                                <tr 
                                                                    key={idx} 
                                                                    onClick={() => handleViewStudentResult(res)}
                                                                    className="bg-white border-b hover:bg-indigo-50 cursor-pointer transition-colors group"
                                                                >
                                                                    <td className="px-6 py-4 font-medium text-gray-900 flex items-center gap-3">
                                                                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs">
                                                                            {res.studentName.charAt(0)}
                                                                        </div>
                                                                        {res.studentName}
                                                                        {(resultsPage - 1) * ITEMS_PER_PAGE + idx === 0 && <Trophy size={16} className="text-yellow-500" />}
                                                                    </td>
                                                                    <td className="px-6 py-4">
                                                                        {res.score === 0 && res.submissionUrl ? (
                                                                           <span className="px-2 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600">Chờ chấm</span>
                                                                        ) : (
                                                                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                                                                res.score >= 85 ? 'bg-green-100 text-green-700' : 
                                                                                res.score >= 70 ? 'bg-blue-100 text-blue-700' :
                                                                                res.score >= 50 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                                                                            }`}>
                                                                                {res.score}/100
                                                                            </span>
                                                                        )}
                                                                    </td>
                                                                    <td className="px-6 py-4 text-gray-600">
                                                                        {res.submissionUrl ? (
                                                                            <span className="flex items-center gap-1 text-indigo-600"><FileText size={14} /> File đính kèm</span>
                                                                        ) : (
                                                                            `${Math.round((res.score / 100) * res.totalQuestions)}/${res.totalQuestions} câu đúng`
                                                                        )}
                                                                    </td>
                                                                    <td className="px-6 py-4 text-gray-500">{new Date(res.completedAt).toLocaleString('vi-VN')}</td>
                                                                    <td className="px-6 py-4 text-gray-400 group-hover:text-indigo-600">
                                                                        <Eye size={18} />
                                                                    </td>
                                                                </tr>
                                                            ))
                                                        ) : (
                                                            <tr>
                                                                <td colSpan={5} className="px-6 py-8 text-center text-gray-500 italic">Chưa có học sinh nào nộp bài</td>
                                                            </tr>
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                            
                                            {/* Pagination Controls */}
                                            {sortedResults.length > ITEMS_PER_PAGE && (
                                                <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
                                                    <div className="flex flex-1 justify-between sm:hidden">
                                                        <button 
                                                            onClick={() => setResultsPage(Math.max(1, resultsPage - 1))}
                                                            disabled={resultsPage === 1}
                                                            className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                                                        >
                                                            Trước
                                                        </button>
                                                        <button 
                                                            onClick={() => setResultsPage(Math.min(totalPages, resultsPage + 1))}
                                                            disabled={resultsPage === totalPages}
                                                            className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                                                        >
                                                            Sau
                                                        </button>
                                                    </div>
                                                    <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                                                        <div>
                                                            <p className="text-sm text-gray-700">
                                                                Hiển thị <span className="font-medium">{(resultsPage - 1) * ITEMS_PER_PAGE + 1}</span> đến <span className="font-medium">{Math.min(resultsPage * ITEMS_PER_PAGE, sortedResults.length)}</span> trong số <span className="font-medium">{sortedResults.length}</span> kết quả
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                                                                <button 
                                                                    onClick={() => setResultsPage(Math.max(1, resultsPage - 1))}
                                                                    disabled={resultsPage === 1}
                                                                    className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                                                                >
                                                                    <span className="sr-only">Trước</span>
                                                                    <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                                                                </button>
                                                                
                                                                {Array.from({ length: totalPages }).map((_, i) => (
                                                                    <button
                                                                        key={i}
                                                                        onClick={() => setResultsPage(i + 1)}
                                                                        className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                                                                            resultsPage === i + 1 
                                                                                ? 'z-10 bg-indigo-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600' 
                                                                                : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                                                                        }`}
                                                                    >
                                                                        {i + 1}
                                                                    </button>
                                                                ))}

                                                                <button 
                                                                    onClick={() => setResultsPage(Math.min(totalPages, resultsPage + 1))}
                                                                    disabled={resultsPage === totalPages}
                                                                    className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                                                                >
                                                                    <span className="sr-only">Sau</span>
                                                                    <ChevronRight className="h-5 w-5" aria-hidden="true" />
                                                                </button>
                                                            </nav>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })()
                        )}
                     </div>
                )}
                
                {/* --- TAB: MEMBERS --- */}
                {activeTab === 'MEMBERS' && (
                    <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                        <Users className="mx-auto text-gray-300 mb-3" size={40} />
                        <p className="text-gray-500 mb-4">Danh sách thành viên lớp học</p>
                        <button className="text-indigo-600 font-bold hover:underline">Thêm học sinh</button>
                    </div>
                )}

                {/* Modal View Student Result Detail */}
                {viewingStudentResult && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-2xl w-full max-w-4xl p-6 max-h-[90vh] flex flex-col">
                            <div className="flex justify-between items-start mb-6 border-b border-gray-100 pb-4">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-1">{viewingStudentResult.studentName}</h3>
                                    <p className="text-sm text-gray-500">
                                        Điểm: <span className="font-bold text-indigo-600">{viewingStudentResult.score}/100</span>
                                    </p>
                                </div>
                                <button onClick={() => setViewingStudentResult(null)} className="text-gray-400 hover:text-gray-900">
                                    <X size={24} />
                                </button>
                            </div>
                            
                            <div className="flex-1 overflow-y-auto pr-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Left: Answer List / File View */}
                                <div>
                                    {viewingStudentResult.submissionUrl ? (
                                        <div className="bg-gray-100 rounded-lg p-4 flex flex-col items-center justify-center min-h-[300px]">
                                            <img 
                                                src={viewingStudentResult.submissionUrl} 
                                                alt="Student Submission" 
                                                className="max-w-full h-auto rounded shadow-sm mb-4"
                                            />
                                            <a 
                                                href={viewingStudentResult.submissionUrl} 
                                                download="bai_lam_hoc_sinh.png"
                                                className="text-indigo-600 text-sm font-medium hover:underline flex items-center gap-1"
                                            >
                                                <Download size={14} /> Tải ảnh xuống
                                            </a>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {viewingStudentResult.details?.map((detail, idx) => (
                                                <div key={idx} className={`p-4 rounded-lg border-l-4 ${detail.isCorrect ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-500'}`}>
                                                    <p className="font-bold text-gray-800 mb-2">Câu {idx + 1}: {detail.questionTerm}</p>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                                                        <div className={detail.isCorrect ? 'text-green-700' : 'text-red-700'}>
                                                            <span className="font-semibold block text-xs uppercase opacity-70 mb-1">Học sinh chọn:</span>
                                                            <div className="flex items-center gap-2">
                                                                {detail.isCorrect ? <Check size={16} /> : <X size={16} />}
                                                                {detail.userAnswer}
                                                            </div>
                                                        </div>
                                                        {!detail.isCorrect && (
                                                            <div className="text-green-700">
                                                                <span className="font-semibold block text-xs uppercase opacity-70 mb-1">Đáp án đúng:</span>
                                                                <div className="flex items-center gap-2">
                                                                    <Check size={16} />
                                                                    {detail.correctAnswer}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Right: AI Grading / Stats */}
                                <div className="space-y-4">
                                     <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                                         <h4 className="font-bold text-indigo-900 mb-2 flex items-center gap-2">
                                             <Sparkles size={18} /> Trợ lý AI
                                         </h4>
                                         {viewingStudentResult.submissionUrl && (
                                             <button 
                                                onClick={handleTriggerAIGrading}
                                                disabled={isGrading}
                                                className="w-full bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-indigo-700 disabled:opacity-50 mb-4"
                                             >
                                                {isGrading ? 'Đang phân tích...' : 'Chấm bài ngay'}
                                             </button>
                                         )}
                                         
                                         {aiFeedback ? (
                                             <div className="text-sm text-gray-700 prose prose-sm max-w-none bg-white p-3 rounded-lg border border-gray-200">
                                                 <pre className="whitespace-pre-wrap font-sans">{aiFeedback}</pre>
                                             </div>
                                         ) : (
                                            <p className="text-sm text-gray-500">
                                                {viewingStudentResult.submissionUrl 
                                                    ? "Nhấn nút để AI phân tích bài làm của học sinh." 
                                                    : "AI chỉ hỗ trợ chấm bài tự luận qua hình ảnh."}
                                            </p>
                                         )}
                                     </div>
                                </div>
                            </div>
                            
                            <div className="pt-4 mt-4 border-t border-gray-100 text-right">
                                <button 
                                    onClick={() => setViewingStudentResult(null)}
                                    className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
                                >
                                    Đóng
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Modal Assign Set */}
                {isAssignModalOpen && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-2xl w-full max-w-lg p-6 max-h-[80vh] flex flex-col">
                            <h3 className="text-lg font-bold mb-4">Giao bài tập cho lớp</h3>
                            
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Đính kèm tài liệu (PDF, Ảnh)</label>
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:bg-gray-50 transition-colors relative">
                                    <input 
                                        type="file" 
                                        onChange={handleTeacherFileChange}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    />
                                    {teacherAttachment ? (
                                        <div className="flex items-center justify-center gap-2 text-indigo-600 font-medium">
                                            <FileText size={20} /> {teacherAttachment.name}
                                        </div>
                                    ) : (
                                        <div className="text-gray-500">
                                            <Upload size={24} className="mx-auto mb-2 text-gray-400" />
                                            <span className="text-sm">Nhấn để tải lên</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto space-y-2 mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Chọn học phần</label>
                                {sets.map(set => (
                                    <button 
                                        key={set.id}
                                        onClick={() => handleAssignSet(set.id, set.title)}
                                        className="w-full text-left p-3 rounded-lg hover:bg-indigo-50 border border-gray-200 hover:border-indigo-300 transition-all flex items-center justify-between group"
                                    >
                                        <span className="font-medium text-gray-700 group-hover:text-indigo-700">{set.title}</span>
                                        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">{set.cards.length} câu</span>
                                    </button>
                                ))}
                            </div>
                            <button 
                                onClick={() => setIsAssignModalOpen(false)}
                                className="w-full py-2 text-gray-500 hover:bg-gray-100 rounded-lg font-medium"
                            >
                                Hủy bỏ
                            </button>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // List of Classes
    return (
        <div className="max-w-6xl mx-auto px-6 py-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Quản lý lớp học</h1>
                    <p className="text-gray-500 text-sm mt-1">Tạo lớp, giao bài và theo dõi tiến độ của học sinh.</p>
                </div>
                <button 
                    onClick={handleCreateClass}
                    className="bg-indigo-600 text-white px-4 py-2.5 rounded-lg font-bold hover:bg-indigo-700 flex items-center gap-2 shadow-sm"
                >
                    <Plus size={18} /> Tạo lớp mới
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {classes.map(cls => (
                    <div 
                        key={cls.id}
                        onClick={() => setSelectedClassId(cls.id)}
                        className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:border-indigo-300 hover:shadow-md cursor-pointer transition-all group"
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                <Users size={24} />
                            </div>
                            <span className="bg-gray-100 text-gray-600 text-xs font-bold px-2 py-1 rounded">
                                {cls.studentCount} HS
                            </span>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors">{cls.name}</h3>
                        <p className="text-gray-500 text-sm line-clamp-2 mb-4">{cls.description}</p>
                        
                        <div className="border-t border-gray-100 pt-4 flex items-center justify-between text-sm text-gray-500">
                             <span className="flex items-center gap-1"><BookOpen size={14} /> {cls.assignments.length} bài tập</span>
                             <span className="flex items-center gap-1 text-indigo-600 font-medium group-hover:underline">Chi tiết <ChevronRight size={14} /></span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
  }

  // --- View: Student Dashboard (Simplified) ---
  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Lớp học của tôi</h1>
        
        {classes.length > 0 ? (
             <div className="grid grid-cols-1 gap-4">
                {classes.map(cls => (
                    <div key={cls.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                                    <Users size={24} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">{cls.name}</h3>
                                    <p className="text-gray-500 text-sm">Giáo viên: Cô Thu Lan</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <h4 className="font-bold text-gray-700 text-sm uppercase tracking-wide">Bài tập cần làm</h4>
                            {cls.assignments.map(assign => {
                                const submitted = assign.results.some(r => r.studentId === currentUser.id);
                                return (
                                <div key={assign.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded bg-white flex items-center justify-center text-indigo-600 shadow-sm">
                                            <BookOpen size={16} />
                                        </div>
                                        <div>
                                            <div className="font-bold text-gray-900 flex items-center gap-2">
                                                {assign.studySetTitle}
                                                {assign.attachmentName && (
                                                    <span className="text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                                        <Paperclip size={10} /> {assign.attachmentName}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-xs text-gray-500">Hạn chót: {new Date(assign.assignedAt + 86400000 * 7).toLocaleDateString('vi-VN')}</div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        {submitted ? (
                                            <span className="px-4 py-2 bg-green-100 text-green-700 font-bold rounded-lg text-sm flex items-center gap-1">
                                                <Check size={16} /> Đã nộp
                                            </span>
                                        ) : (
                                            <>
                                                <button 
                                                    onClick={() => setIsStudentSubmitting(assign.id)}
                                                    className="px-3 py-2 border border-indigo-600 text-indigo-600 text-sm font-bold rounded-lg hover:bg-indigo-50 flex items-center gap-1"
                                                >
                                                    <Upload size={16} /> Nộp file
                                                </button>
                                                <button className="px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-lg hover:bg-indigo-700">
                                                    Làm bài
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            )})}
                            {cls.assignments.length === 0 && <p className="text-gray-400 text-sm italic">Không có bài tập nào.</p>}
                        </div>
                    </div>
                ))}
             </div>
        ) : (
            <div className="text-center py-12">
                <p className="text-gray-500">Bạn chưa tham gia lớp học nào.</p>
                <button className="mt-4 text-indigo-600 font-bold hover:underline">Tham gia lớp học bằng mã</button>
            </div>
        )}

        {/* Student Submission Modal */}
        {isStudentSubmitting && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl w-full max-w-md p-6">
                    <h3 className="text-lg font-bold mb-4">Nộp bài làm</h3>
                    <p className="text-gray-500 text-sm mb-4">Tải lên ảnh chụp vở bài tập hoặc file PDF.</p>
                    
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:bg-gray-50 transition-colors relative mb-6">
                        <input 
                            type="file" 
                            onChange={handleStudentFileChange}
                            accept="image/*,application/pdf"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        {studentSubmission ? (
                            <div className="flex flex-col items-center justify-center gap-2 text-indigo-600 font-medium">
                                <FileText size={32} /> 
                                <span>{studentSubmission.name}</span>
                                <span className="text-xs text-green-600">Đã sẵn sàng nộp</span>
                            </div>
                        ) : (
                            <div className="text-gray-500">
                                <Upload size={32} className="mx-auto mb-2 text-gray-400" />
                                <span className="font-medium">Nhấn để tải lên file</span>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-3">
                        <button 
                            onClick={() => { setIsStudentSubmitting(null); setStudentSubmission(null); }}
                            className="flex-1 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium"
                        >
                            Hủy
                        </button>
                        <button 
                            onClick={handleSubmitAssignment}
                            disabled={!studentSubmission}
                            className="flex-1 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Nộp bài
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default ClassManagement;