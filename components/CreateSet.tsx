
import React, { useState, useRef, useEffect } from 'react';
import { Flashcard, StudySet, PrivacyStatus, AiGenerationRecord, StudySetType } from '../types';
import { generateStudySetWithAI, generateStudySetFromFile } from '../services/geminiService';
import { studySetService, CreateStudySetRequest, UpdateStudySetRequest } from '../services/studySetService';
import { Plus, Trash2, Sparkles, Save, FileText, Upload, CheckCircle, Keyboard, ScanLine, ArrowLeft, BrainCircuit, Check, X, AlertCircle, Lightbulb, Layers, List, BookOpen, Link, Globe, Lock, Building, GraduationCap, Hash, Bookmark, Eye, AlertTriangle, HelpCircle, Copy, Info, Clock, CheckSquare, Loader2, FileEdit, ChevronRight } from 'lucide-react';
import ThemeLoader from './ThemeLoader';
import { v4 as uuidv4 } from 'uuid';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useApp } from '../contexts/AppContext';

interface CreateSetProps {
  onSave: (set: StudySet) => void;
  onCancel: () => void;
  onGoToAiTextbook: () => void;
  history?: AiGenerationRecord[];
  onSelectHistory?: (record: AiGenerationRecord) => void;
}

type CreationMode = 'MENU' | 'EDITOR';
type AiGenerationMode = 'TEXT_TOPIC' | 'FILE_SCAN_QUIZ';
type EditorMode = 'VISUAL' | 'TEXT';

const EDUCATION_LEVELS = [
  'Trung học phổ thông',
  'Đại học',
  'Cao đẳng',
  'Cao học',
  'Trung cấp',
  'Khác'
];

const SAMPLE_TEXT_FORMAT = `Thủ đô của Việt Nam là gì?
A. Thành phố Hồ Chí Minh
*B. Hà Nội
C. Đà Nẵng
D. Hải Phòng

Công thức hóa học của nước là?
A. H2O2
*B. H2O
C. HO
D. O2`;

const CreateSet: React.FC<CreateSetProps> = ({ onSave, onCancel, onGoToAiTextbook, history = [], onSelectHistory }) => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { addNotification } = useApp();

  const [creationStep, setCreationStep] = useState<CreationMode>('MENU');
  const [editorMode, setEditorMode] = useState<EditorMode>('VISUAL');
  const [editingSetId, setEditingSetId] = useState<string | number | null>(null);
  const [creationSource, setCreationSource] = useState<StudySetType>('MANUAL');
  const [status, setStatus] = useState<string>('ACTIVE');
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [privacy, setPrivacy] = useState<PrivacyStatus>('PUBLIC');
  const [level, setLevel] = useState('Trung học phổ thông');
  const [school, setSchool] = useState('');
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');

  const [cards, setCards] = useState<Flashcard[]>([
    { id: uuidv4(), term: '', definition: '', options: ['', '', '', ''], explanation: '', relatedLink: '' },
    { id: uuidv4(), term: '', definition: '', options: ['', '', '', ''], explanation: '', relatedLink: '' },
  ]);
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const [textEditorContent, setTextEditorContent] = useState('');
  const [parsedPreviewCards, setParsedPreviewCards] = useState<Flashcard[]>([]);
  const [showTextGuide, setShowTextGuide] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [serverSets, setServerSets] = useState<any[]>([]);
  const [isLoadingSets, setIsLoadingSets] = useState(false);
  const [aiMode, setAiMode] = useState<AiGenerationMode>('TEXT_TOPIC');
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiQuestionCount, setAiQuestionCount] = useState<number>(10);
  const [aiFile, setAiFile] = useState<{name: string, data: string} | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const cardRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const fetchRecentSets = async () => {
    setIsLoadingSets(true);
    try {
      const response = await studySetService.getMyStudySets(0, 10);
      if (response.code === 1000) {
        setServerSets(response.result.content);
      }
    } catch (error) { console.error(error); }
    finally { setIsLoadingSets(false); }
  };

  useEffect(() => { if (creationStep === 'MENU') fetchRecentSets(); }, [creationStep]);

  const hasPerm = (perm: string) => user?.permissions?.includes(perm) || false;
  const canManualEntry = hasPerm('MANUAL_ENTRY_POST');
  const canScanDoc = hasPerm('SCAN_DOCUMENT_POST');
  const canAiTopic = hasPerm('AI_BY_TOPIC_POST');
  const canAiPlanner = hasPerm('AI_LESON_PLANNER_POST');

  const scrollToCard = (id: string) => {
      setActiveCardId(id);
      const element = cardRefs.current[id];
      if (element) element.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const handleSave = async () => {
    let finalCards = editorMode === 'TEXT' ? parseTextToCards(textEditorContent) : cards;
    if (!title.trim()) { alert(t('notifications.enter_title')); return; }
    const validCards = finalCards.filter(c => c.term.trim() && c.definition.trim());
    if (validCards.length < 2) { alert(t('notifications.min_cards')); return; }

    setIsSaving(true);
    try {
        const cardPayload = validCards.map(c => ({
            id: (c.id && !isNaN(Number(c.id))) ? Number(c.id) : undefined,
            term: c.term,
            definition: c.definition,
            options: c.options || [],
            explanation: c.explanation || ''
        }));
        const baseRequest = {
            topic: topic || subject || title,
            language: i18n.language || 'vi',
            title, description, type: creationSource, status,
            cards: cardPayload
        };
        let response = editingSetId ? await studySetService.updateStudySet({ ...baseRequest, id: editingSetId }) : await studySetService.createStudySet(baseRequest as CreateStudySetRequest);

        if (response.code === 1000) {
            addNotification(editingSetId ? "Đã cập nhật thành công!" : "Đã tạo mới thành công!", "success");
            onSave({ id: response.result?.toString() || editingSetId?.toString() || uuidv4(), title, description, author: user?.name || 'Bạn', createdAt: Date.now(), cards: validCards, privacy, level, school, subject, topic, type: creationSource, status });
        }
    } catch (error) { addNotification("Lỗi khi lưu học phần.", "error"); }
    finally { setIsSaving(false); }
  };

  const handleAiGenerate = async () => {
    if ((aiMode === 'TEXT_TOPIC' && !aiPrompt.trim()) || (aiMode === 'FILE_SCAN_QUIZ' && !aiFile)) return;
    setIsGenerating(true);
    const source: StudySetType = aiMode === 'TEXT_TOPIC' ? 'AI_TOPIC' : 'AI_FILE';
    setCreationSource(source);
    try {
      const result = aiMode === 'TEXT_TOPIC' ? await generateStudySetWithAI(aiPrompt, aiQuestionCount) : await generateStudySetFromFile(aiFile!.data, aiFile!.name);
      const postResponse = await studySetService.createStudySet({
          topic: aiMode === 'TEXT_TOPIC' ? aiPrompt : aiFile!.name,
          language: i18n.language || 'vi',
          title: result.title, description: result.description, type: source, status: 'ACTIVE',
          cards: result.cards.map(c => ({ term: c.term, definition: c.definition, options: c.options || [], explanation: c.explanation || '' }))
      });
      if (postResponse.code === 1000) {
          handleSelectServerSet(postResponse.result);
          setShowAiModal(false);
      }
    } catch (error) { alert(t('notifications.ai_error')); }
    finally { setIsGenerating(false); }
  };

  const handleSelectServerSet = async (setId: number | string) => {
      setIsLoadingSets(true);
      try {
          const response = await studySetService.getStudySetById(setId);
          if (response.code === 1000) {
              const d = response.result;
              setEditingSetId(d.id); setTitle(d.title); setDescription(d.description); setTopic(d.topic || ''); setCreationSource(d.type || 'MANUAL'); setStatus(d.status || 'ACTIVE'); setPrivacy(d.privacy || 'PUBLIC');
              setCards(d.cards.map((c: any) => ({ id: c.id.toString(), term: c.term, definition: c.definition, options: c.options || [], explanation: c.explanation || '', relatedLink: '' })));
              setCreationStep('EDITOR'); setEditorMode('VISUAL');
          }
      } catch (error) { addNotification("Lỗi tải học phần", "error"); }
      finally { setIsLoadingSets(false); }
  };

  const renderTypeCell = (type?: string) => {
    const iconSize = 14;
    switch (type) {
      case 'MANUAL': return <div className="flex items-center gap-1.5"><Keyboard size={iconSize} className="text-blue-500" /> <span className="font-bold">Thủ công</span></div>;
      case 'AI_TOPIC': return <div className="flex items-center gap-1.5"><Sparkles size={iconSize} className="text-purple-500" /> <span className="font-bold">AI Chủ đề</span></div>;
      case 'AI_FILE': return <div className="flex items-center gap-1.5"><ScanLine size={iconSize} className="text-indigo-500" /> <span className="font-bold">AI Quét file</span></div>;
      case 'AI_TEXTBOOK': return <div className="flex items-center gap-1.5"><BookOpen size={iconSize} className="text-pink-500" /> <span className="font-bold">AI Giáo án</span></div>;
      default: return <div className="flex items-center gap-1.5"><Layers size={iconSize} className="text-gray-400" /> <span className="font-bold">Quiz</span></div>;
    }
  };

  if (creationStep === 'MENU') {
      return (
          <div className="max-w-6xl mx-auto px-4 py-8 animate-fade-in relative pb-32 transition-colors">
              <div className="text-center mb-10">
                  <h2 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white mb-2 tracking-tight">{t('create_set.title_method')}</h2>
                  <p className="text-gray-500 dark:text-gray-400 font-medium">{t('create_set.desc_method')}</p>
              </div>

              {/* Grid Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
                  <button onClick={() => { setCreationStep('EDITOR'); setEditingSetId(null); setCreationSource('MANUAL'); setStatus('ACTIVE'); setTitle(''); setCards([{id:uuidv4(),term:'',definition:'',options:['','','',''],explanation:'',relatedLink:''}])}} disabled={!canManualEntry} className={`group bg-white dark:bg-gray-800 p-6 rounded-[28px] border border-gray-100 dark:border-gray-700 transition-all text-left flex flex-col h-full relative ${canManualEntry ? 'hover:border-brand-blue hover:shadow-xl' : 'opacity-50 grayscale'}`}>
                      <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 text-brand-blue rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110"><Keyboard size={24} /></div>
                      <h3 className="text-lg font-black dark:text-white mb-1">{t('create_set.manual_title')}</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed font-medium">{t('create_set.manual_desc')}</p>
                  </button>
                  <button onClick={() => { setAiMode('TEXT_TOPIC'); setShowAiModal(true); }} disabled={!canAiTopic} className={`group bg-white dark:bg-gray-800 p-6 rounded-[28px] border border-gray-100 dark:border-gray-700 transition-all text-left flex flex-col h-full relative ${canAiTopic ? 'hover:border-purple-500 hover:shadow-xl' : 'opacity-50 grayscale'}`}>
                      <div className="w-12 h-12 bg-purple-50 dark:bg-purple-900/30 text-purple-600 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110"><BrainCircuit size={24} /></div>
                      <h3 className="text-lg font-black dark:text-white mb-1">{t('create_set.ai_topic_title')}</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed font-medium">{t('create_set.ai_topic_desc')}</p>
                  </button>
                  <button onClick={() => { setAiMode('FILE_SCAN_QUIZ'); setShowAiModal(true); }} disabled={!canScanDoc} className={`group bg-white dark:bg-gray-800 p-6 rounded-[28px] border border-gray-100 dark:border-gray-700 transition-all text-left flex flex-col h-full relative ${canScanDoc ? 'hover:border-indigo-500 hover:shadow-xl' : 'opacity-50 grayscale'}`}>
                      <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110"><ScanLine size={24} /></div>
                      <h3 className="text-lg font-black dark:text-white mb-1">{t('create_set.scan_file_title')}</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed font-medium">{t('create_set.scan_file_desc')}</p>
                  </button>
                  <button onClick={onGoToAiTextbook} disabled={!canAiPlanner} className={`group bg-white dark:bg-gray-800 p-6 rounded-[28px] border border-gray-100 dark:border-gray-700 transition-all text-left flex flex-col h-full relative ${canAiPlanner ? 'hover:border-pink-500 hover:shadow-xl' : 'opacity-50 grayscale'}`}>
                      <div className="w-12 h-12 bg-pink-50 dark:bg-pink-900/30 text-pink-600 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110"><BookOpen size={24} /></div>
                      <h3 className="text-lg font-black dark:text-white mb-1">{t('create_set.ai_textbook_title')}</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed font-medium">{t('create_set.ai_textbook_desc')}</p>
                  </button>
              </div>

              {/* Recent Activity: Desktop Table / Mobile Cards */}
              <div className="max-w-6xl mx-auto bg-white dark:bg-gray-800 rounded-[32px] shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors">
                  <div className="px-8 py-5 border-b border-gray-50 dark:border-gray-700 bg-gray-50/30 dark:bg-gray-700/30 flex items-center justify-between">
                      <h3 className="font-black flex items-center gap-2 dark:text-white uppercase tracking-tight text-sm"><Clock size={18} className="text-brand-blue" /> {t('create_set.recent_activity')}</h3>
                      {isLoadingSets && <Loader2 size={16} className="animate-spin text-brand-blue" />}
                  </div>

                  {/* Mobile View: Cards */}
                  <div className="block md:hidden p-4 space-y-3">
                      {serverSets.map((r) => (
                          <div key={r.id} onClick={() => handleSelectServerSet(r.id)} className="bg-gray-50 dark:bg-gray-855 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 active:scale-95 transition-all">
                              <div className="flex justify-between items-start mb-3">
                                  <div className="flex-1 min-w-0 pr-2">
                                      <h4 className="font-black text-gray-900 dark:text-white truncate text-base">{r.title}</h4>
                                      <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mt-1">{new Date(r.createdAt).toLocaleDateString()}</p>
                                  </div>
                                  <ChevronRight size={18} className="text-gray-300 shrink-0" />
                              </div>
                              <div className="flex items-center justify-between gap-2 mt-4 pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
                                  {renderTypeCell(r.type)}
                                  <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${r.status === 'DRAFT' ? 'bg-gray-100 text-gray-500' : 'bg-green-50 text-green-600'}`}>{r.status || 'ACTIVE'}</span>
                              </div>
                          </div>
                      ))}
                      {serverSets.length === 0 && !isLoadingSets && <div className="py-10 text-center text-gray-400 text-sm font-medium italic">Chưa có hoạt động nào.</div>}
                  </div>

                  {/* Desktop View: Table */}
                  <div className="hidden md:block overflow-x-auto">
                      <table className="w-full text-left text-sm">
                          <thead className="bg-gray-50/50 dark:bg-gray-700/50 text-gray-400 dark:text-gray-500 font-black uppercase text-[10px] tracking-widest">
                              <tr><th className="px-8 py-4">Tên học phần</th><th className="px-8 py-4">Phương thức</th><th className="px-8 py-4">Ngày tạo</th><th className="px-8 py-4">Trạng thái</th><th className="px-8 py-4 text-right">Thao tác</th></tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                              {serverSets.map((r) => (
                                  <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors group">
                                      <td className="px-8 py-5 font-black text-gray-900 dark:text-white truncate max-w-xs">{r.title}</td>
                                      <td className="px-8 py-5 text-gray-500 dark:text-gray-400">
                                          {renderTypeCell(r.type)}
                                      </td>
                                      <td className="px-8 py-5 text-gray-500 dark:text-gray-400 font-medium">{new Date(r.createdAt).toLocaleDateString()}</td>
                                      <td className="px-8 py-5">
                                          <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${r.status === 'DRAFT' ? 'bg-gray-100 text-gray-500 dark:bg-gray-700' : 'bg-green-50 text-green-600 dark:bg-green-900/30'}`}>{r.status || 'ACTIVE'}</span>
                                      </td>
                                      <td className="px-8 py-5 text-right">
                                          <button onClick={() => handleSelectServerSet(r.id)} className="text-brand-blue dark:text-blue-400 font-black text-[10px] uppercase tracking-widest border border-brand-blue/20 dark:border-blue-800 px-4 py-2 rounded-xl hover:bg-brand-blue hover:text-white transition-all shadow-sm">Xem lại</button>
                                      </td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
              </div>

              {/* AI Modal */}
              {showAiModal && (
                <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-gray-800 rounded-[32px] w-full max-w-lg p-8 shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden relative">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-xl font-black flex items-center gap-3 dark:text-white">
                                {aiMode === 'TEXT_TOPIC' ? <BrainCircuit className="text-purple-600" /> : <ScanLine className="text-indigo-600" />} 
                                {aiMode === 'TEXT_TOPIC' ? "Tạo theo chủ đề" : "Trích xuất từ File"}
                            </h3>
                            <button onClick={() => setShowAiModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"><X size={24} className="text-gray-400" /></button>
                        </div>
                        {aiMode === 'TEXT_TOPIC' ? (
                            <div className="space-y-4">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Bạn muốn AI tạo về nội dung gì?</label>
                                <textarea className="w-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 dark:text-white rounded-2xl p-5 h-36 mb-2 outline-none focus:ring-4 focus:ring-purple-100 dark:focus:ring-purple-900/20 font-medium transition-all" placeholder="Ví dụ: 10 câu trắc nghiệm về Chiến tranh thế giới thứ 2..." value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} />
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-gray-500">Số câu đề xuất:</span>
                                    <div className="flex gap-2">
                                        {[5, 10, 15].map(v => <button key={v} onClick={()=>setAiQuestionCount(v)} className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all ${aiQuestionCount === v ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}>{v}</button>)}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-[32px] p-12 text-center relative mb-8 hover:border-brand-blue transition-colors bg-gray-50/50 dark:bg-gray-900/20">
                                <input type="file" onChange={(e) => { if(e.target.files?.[0]) { const f=e.target.files[0]; const r=new FileReader(); r.readAsDataURL(f); r.onload=()=>setAiFile({name:f.name,data:r.result as string}); } }} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                {aiFile ? <div className="text-brand-blue dark:text-blue-400 font-black flex flex-col items-center gap-2"><FileText size={40} /><span className="truncate max-w-[200px]">{aiFile.name}</span></div> : <div className="text-gray-400 flex flex-col items-center gap-3"><Upload size={40} className="text-gray-300" /><span className="font-black text-sm uppercase tracking-widest">Chọn file tài liệu</span><span className="text-[10px] font-medium text-gray-400">Hỗ trợ PDF, Hình ảnh, Word</span></div>}
                            </div>
                        )}
                        <div className="flex justify-end gap-4 pt-4">
                            <button onClick={() => setShowAiModal(false)} className="px-6 py-3 text-gray-500 dark:text-gray-400 font-black uppercase text-xs tracking-widest">Đóng</button>
                            <button onClick={handleAiGenerate} disabled={isGenerating} className="px-8 py-3 bg-brand-blue text-white rounded-2xl font-black flex items-center gap-2 shadow-xl shadow-brand-blue/20 transition-all active:scale-95 disabled:opacity-50">
                                {isGenerating ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} />} 
                                {isGenerating ? "Đang xử lý..." : "Bắt đầu tạo"}
                            </button>
                        </div>
                    </div>
                </div>
              )}
          </div>
      );
  }

  return (
    <div className="w-full h-[calc(100vh-64px-54px)] lg:h-[calc(100vh-64px)] flex flex-col animate-fade-in bg-gray-50 dark:bg-gray-900 overflow-hidden transition-colors">
      {/* Editor Header */}
      <div className="flex justify-between items-center px-4 md:px-8 py-4 bg-white dark:bg-gray-800 z-30 border-b border-gray-100 dark:border-gray-700 shrink-0">
        <div className="flex items-center gap-3">
            <button onClick={() => setCreationStep('MENU')} className="p-2 rounded-full hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-400 transition-colors"><ArrowLeft size={20} /></button>
            <h2 className="text-lg md:text-xl font-black text-gray-900 dark:text-white truncate">{editingSetId ? "Chỉnh sửa Quiz" : "Tạo Quiz mới"}</h2>
        </div>
        <div className="flex gap-2">
            <button onClick={onCancel} className="px-4 py-2 text-gray-400 font-black text-xs uppercase tracking-widest hidden sm:block">Hủy</button>
            <button onClick={handleSave} disabled={isSaving} className="px-6 py-2.5 bg-brand-blue text-white rounded-xl font-black text-sm flex items-center gap-2 transition-all shadow-lg shadow-brand-blue/20 active:scale-95">
                {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} <span className="hidden xs:inline">Lưu học phần</span><span className="xs:hidden">Lưu</span>
            </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8">
          <div className="mx-auto w-full max-w-7xl grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Left Settings */}
              <div className="lg:col-span-1 space-y-6">
                  <div className="bg-white dark:bg-gray-800 rounded-[32px] p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
                      <h3 className="font-black mb-6 flex items-center gap-2 dark:text-white uppercase tracking-widest text-xs"><FileText size={16} className="text-brand-blue" /> Thông tin chung</h3>
                      <div className="space-y-5">
                          <div><label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Tiêu đề</label><input type="text" className="w-full p-3 bg-gray-50 dark:bg-gray-700/50 dark:text-white border border-gray-100 dark:border-gray-700 rounded-xl outline-none font-black focus:ring-4 focus:ring-brand-blue/5 transition-all" value={title} onChange={e => setTitle(e.target.value)} placeholder="VD: Toán 12 - Giải tích" /></div>
                          <div><label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Mô tả</label><textarea className="w-full p-3 bg-gray-50 dark:bg-gray-700/50 dark:text-white border border-gray-100 dark:border-gray-700 rounded-xl outline-none resize-none focus:ring-4 focus:ring-brand-blue/5 transition-all font-medium" rows={2} value={description} onChange={e => setDescription(e.target.value)} placeholder="Nhập mô tả ngắn..." /></div>
                          <div className="grid grid-cols-2 gap-3">
                              <div><label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Quyền hạn</label><select value={privacy} onChange={e => setPrivacy(e.target.value as any)} className="w-full p-3 bg-gray-50 dark:bg-gray-700/50 dark:text-white border border-gray-100 dark:border-gray-700 rounded-xl text-xs font-bold outline-none"><option value="PUBLIC">Công khai</option><option value="PRIVATE">Riêng tư</option></select></div>
                              <div><label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Môn học</label><input type="text" className="w-full p-3 bg-gray-50 dark:bg-gray-700/50 dark:text-white border border-gray-100 dark:border-gray-700 rounded-xl text-xs font-bold outline-none" value={subject} onChange={e => setSubject(e.target.value)} placeholder="Toán..." /></div>
                          </div>
                      </div>
                  </div>
              </div>

              {/* Main Editor */}
              <div className="lg:col-span-3 space-y-6">
                  <div className="flex flex-wrap gap-4 bg-white dark:bg-gray-800 p-4 rounded-3xl border border-gray-100 dark:border-gray-700 items-center justify-between">
                      <div className="flex gap-2">
                          <button onClick={() => setEditorMode('VISUAL')} className={`px-5 py-2 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${editorMode === 'VISUAL' ? 'bg-brand-blue text-white shadow-lg shadow-brand-blue/20' : 'text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>Giao diện thẻ</button>
                          <button onClick={() => { setTextEditorContent(stringifyCardsToText(cards)); setEditorMode('TEXT'); }} className={`px-5 py-2 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${editorMode === 'TEXT' ? 'bg-brand-blue text-white shadow-lg shadow-brand-blue/20' : 'text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>Nhập nhanh</button>
                      </div>
                      <button onClick={() => setShowTextGuide(true)} className="flex items-center gap-1.5 text-gray-400 hover:text-brand-blue transition-colors text-[10px] font-black uppercase tracking-widest"><HelpCircle size={14} /> Hướng dẫn định dạng</button>
                  </div>

                  {editorMode === 'VISUAL' ? (
                      <div className="space-y-6 pb-20">
                        {cards.map((card, index) => (
                        <div key={card.id} ref={el => { cardRefs.current[card.id] = el; }} className={`bg-white dark:bg-gray-800 rounded-[32px] border-2 p-6 md:p-8 transition-all ${activeCardId === card.id ? 'border-brand-blue shadow-2xl shadow-brand-blue/5' : 'border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600'}`} onClick={() => setActiveCardId(card.id)}>
                            <div className="flex justify-between items-center mb-6 border-b border-gray-50 dark:border-gray-700 pb-4">
                                <div className="flex items-center gap-3"><span className="w-10 h-10 rounded-2xl bg-gray-50 dark:bg-gray-700 dark:text-gray-200 flex items-center justify-center font-black text-sm">{index+1}</span><span className="text-[10px] font-black uppercase tracking-widest text-brand-blue bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded-lg">CÂU HỎI TRẮC NGHIỆM</span></div>
                                <button onClick={(e) => { e.stopPropagation(); setCards(cards.filter(c=>c.id!==card.id)); }} className="p-2 text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={20} /></button>
                            </div>
                            <div className="space-y-6">
                                <div><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Nội dung câu hỏi</label><textarea className="w-full p-5 rounded-[24px] bg-gray-50/50 dark:bg-gray-900/30 dark:text-white border border-gray-100 dark:border-gray-700 outline-none font-bold text-lg md:text-xl focus:ring-4 focus:ring-brand-blue/5 transition-all" rows={2} value={card.term} onChange={e=>setCards(cards.map(c=>c.id===card.id?{...c,term:e.target.value}:c))} placeholder="Nhập câu hỏi của bạn..." /></div>
                                <div><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-4">Các phương án trả lời (Nhấn nút check để chọn đáp án đúng)</label><div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {card.options?.map((opt, oi) => {
                                        const isCorrect = card.definition === opt && opt !== '';
                                        return (
                                            <div key={oi} className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${isCorrect ? 'border-green-500 bg-green-50/50 dark:bg-green-900/10 shadow-lg shadow-green-100 dark:shadow-none' : 'bg-white dark:bg-gray-855 border-gray-100 dark:border-gray-700'}`}>
                                                <div onClick={() => setCards(cards.map(c=>c.id===card.id?{...c,definition:opt}:c))} className={`w-8 h-8 rounded-full border-2 flex items-center justify-center cursor-pointer transition-all ${isCorrect ? 'bg-green-500 border-green-500 text-white shadow-md' : 'border-gray-200 dark:border-gray-600'}`}><Check size={18} strokeWidth={4} /></div>
                                                <input type="text" className="flex-1 bg-transparent outline-none text-sm md:text-base font-bold dark:text-white" value={opt} onChange={e=>{const next=[...(card.options||[])]; next[oi]=e.target.value; setCards(cards.map(c=>c.id===card.id?{...c,options:next,definition:isCorrect?e.target.value:c.definition}:c));}} placeholder={`Lựa chọn ${oi+1}...`} />
                                                <button onClick={()=> {const next=[...(card.options||[])]; next.splice(oi,1); setCards(cards.map(c=>c.id===card.id?{...c,options:next,definition:card.definition===opt?'':card.definition}:c));}} className="text-gray-300 hover:text-red-500 transition-colors"><X size={16} /></button>
                                            </div>
                                        );
                                    })}
                                </div><button onClick={()=>setCards(cards.map(c=>c.id===card.id?{...c,options:[...(c.options||[]),'']}:c))} className="mt-4 text-brand-blue dark:text-blue-400 text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:underline transition-all"><Plus size={16} /> Thêm lựa chọn</button></div>
                            </div>
                        </div>
                        ))}
                        <button onClick={() => { const newId=uuidv4(); setCards([...cards,{id:newId,term:'',definition:'',options:['','','',''],explanation:'',relatedLink:''}]); setTimeout(()=>scrollToCard(newId),100); }} className="w-full py-8 bg-white dark:bg-gray-800 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-[32px] text-gray-400 font-black uppercase tracking-widest hover:border-brand-blue hover:text-brand-blue transition-all flex items-center justify-center gap-3 shadow-sm"><Plus size={24} /> Thêm câu hỏi mới</button>
                      </div>
                  ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[600px]">
                          <textarea className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-[32px] p-8 font-mono text-sm outline-none dark:text-white focus:ring-4 focus:ring-brand-blue/5 transition-all shadow-sm" placeholder="Nhập câu hỏi theo định dạng..." value={textEditorContent} onChange={e=>setTextEditorContent(e.target.value)} />
                          <div className="bg-gray-50/50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-[32px] overflow-hidden flex flex-col shadow-sm">
                              <div className="p-5 border-b border-gray-100 dark:border-gray-700 font-black text-[10px] uppercase tracking-widest text-gray-400">Xem trước kết quả ({parsedPreviewCards.length})</div>
                              <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                                  {parsedPreviewCards.map((p, i) => (
                                      <div key={i} className="p-5 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                                          <div className="font-black text-sm text-gray-900 dark:text-white mb-3 leading-snug">{i+1}. {p.term}</div>
                                          <div className="space-y-2">{p.options?.map((o,oi)=><div key={oi} className={`text-xs p-2 rounded-lg flex items-center gap-2 font-bold ${o===p.definition?'bg-green-50 text-green-600 dark:bg-green-900/20':'bg-gray-50 text-gray-400 dark:bg-gray-750'}`}>{o===p.definition && <Check size={12} strokeWidth={4}/>} {o}</div>)}</div>
                                      </div>
                                  ))}
                                  {parsedPreviewCards.length === 0 && <div className="text-gray-400 dark:text-gray-500 text-sm italic text-center py-20 font-medium">Đang chờ nhập dữ liệu...</div>}
                              </div>
                          </div>
                      </div>
                  )}
              </div>
          </div>
      </div>

      {showTextGuide && (
        <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in" onClick={() => setShowTextGuide(false)}>
            <div className="bg-white dark:bg-gray-800 rounded-[32px] w-full max-w-lg shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden relative" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-gray-50 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-700/50">
                    <h3 className="font-black flex items-center gap-2 dark:text-white uppercase tracking-widest text-xs"><Info size={20} className="text-brand-blue" /> Hướng dẫn nhập nhanh</h3>
                    <button onClick={() => setShowTextGuide(false)} className="text-gray-400 hover:text-gray-600 transition-colors"><X size={24} /></button>
                </div>
                <div className="p-8 space-y-6 text-sm text-gray-600 dark:text-gray-300">
                    <div className="space-y-3 font-medium">
                        <p>1. Dòng đầu tiên là <strong className="text-gray-900 dark:text-white">Nội dung câu hỏi</strong>.</p>
                        <p>2. Các dòng tiếp theo là các <strong className="text-gray-900 dark:text-white">Lựa chọn đáp án</strong>.</p>
                        <p>3. Thêm dấu <strong className="text-green-600 font-black">*</strong> ngay trước phương án đúng.</p>
                        <p>4. Để trống 1 dòng giữa các câu hỏi để phân tách.</p>
                    </div>
                    <div className="bg-gray-900 p-6 rounded-[24px] relative group border border-gray-700">
                        <pre className="text-[10px] text-green-400 font-mono whitespace-pre-wrap font-bold leading-relaxed">{SAMPLE_TEXT_FORMAT}</pre>
                        <button onClick={() => { setTextEditorContent(SAMPLE_TEXT_FORMAT); setShowTextGuide(false); setEditorMode('TEXT'); }} className="absolute top-4 right-4 bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20">Sao chép mẫu</button>
                    </div>
                </div>
                <div className="p-6 border-t border-gray-50 dark:border-gray-700 flex justify-end bg-gray-50/50 dark:bg-gray-800/50">
                    <button onClick={() => setShowTextGuide(false)} className="bg-white dark:bg-gray-700 dark:text-white px-8 py-3 rounded-2xl font-black uppercase text-xs tracking-widest border border-gray-200 dark:border-gray-600 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 transition-all">Đã hiểu</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

const parseTextToCards = (text: string): Flashcard[] => {
    const blocks = text.split(/\n\s*\n/);
    const parsed: Flashcard[] = [];
    blocks.forEach(block => {
        const lines = block.trim().split('\n').map(l => l.trim()).filter(l => l);
        if (lines.length === 0) return;
        const term = lines[0].replace(/<br\s*\/?>/gi, '\n');
        let definition = '';
        const options: string[] = [];
        if (lines.length > 1) {
            for (let i = 1; i < lines.length; i++) {
                let optLine = lines[i];
                const isCorrect = optLine.startsWith('*');
                if (isCorrect) optLine = optLine.substring(1).trim();
                const cleanOpt = optLine.replace(/<br\s*\/?>/gi, '\n');
                options.push(cleanOpt);
                if (isCorrect) definition = cleanOpt;
            }
        }
        parsed.push({ id: uuidv4(), term, definition, options: options.length > 0 ? options : ['', '', '', ''], explanation: '', relatedLink: '' });
    });
    return parsed;
};

const stringifyCardsToText = (currentCards: Flashcard[]) => {
    return currentCards.map(c => {
        let text = `${c.term.replace(/\n/g, '<br />')}\n`;
        c.options?.forEach(opt => {
            const isCorrect = opt === c.definition && opt !== '';
            text += `${isCorrect ? '*' : ''}${opt.replace(/\n/g, '<br />')}\n`;
        });
        return text;
    }).join('\n\n');
};

export default CreateSet;
