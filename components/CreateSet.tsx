
import React, { useState, useRef, useEffect } from 'react';
import { Flashcard, StudySet, PrivacyStatus, AiGenerationRecord, StudySetType } from '../types';
import { generateStudySetWithAI, generateStudySetFromFile } from '../services/geminiService';
import { studySetService, CreateStudySetRequest, UpdateStudySetRequest } from '../services/studySetService';
import { Plus, Trash2, Sparkles, Save, FileText, Upload, CheckCircle, Keyboard, ScanLine, ArrowLeft, BrainCircuit, Check, X, AlertCircle, Lightbulb, Layers, List, BookOpen, Link, Globe, Lock, Building, GraduationCap, Hash, Bookmark, Eye, AlertTriangle, HelpCircle, Copy, Info, Clock, CheckSquare, Loader2, FileEdit, ChevronDown, ChevronUp, Settings2 } from 'lucide-react';
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
  const [major, setMajor] = useState('');
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');

  // Mobile visibility states
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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

  useEffect(() => { if (editorMode === 'TEXT') setParsedPreviewCards(parseTextToCards(textEditorContent)); }, [textEditorContent, editorMode]);

  const handleSwitchMode = (newMode: EditorMode) => {
      if (newMode === 'TEXT') setTextEditorContent(stringifyCardsToText(cards));
      else {
          const parsed = parseTextToCards(textEditorContent);
          if (parsed.length > 0) setCards(parsed);
      }
      setEditorMode(newMode);
  };

  const handleAddCard = () => {
    const newId = uuidv4();
    setCards([...cards, { id: newId, term: '', definition: '', options: ['', '', '', ''], explanation: '', relatedLink: '' }]);
    setTimeout(() => scrollToCard(newId), 100);
  };

  const scrollToCard = (id: string) => {
      setActiveCardId(id);
      setIsSidebarOpen(false); // Close mobile sidebar if user jumps from TOC
      const element = cardRefs.current[id];
      if (element) {
          const headerOffset = 150;
          const elementPosition = element.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
          window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
      }
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
            onSave({ id: response.result?.toString() || editingSetId?.toString() || uuidv4(), title, description, author: user?.name || 'Bạn', createdAt: Date.now(), cards: validCards, privacy, level, school, major, subject, topic, type: creationSource, status });
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
          const detail = await studySetService.getStudySetById(postResponse.result);
          if (detail.code === 1000) {
              const apiData = detail.result;
              setEditingSetId(apiData.id); setTitle(apiData.title); setDescription(apiData.description); setTopic(apiData.topic || ''); setStatus(apiData.status || 'ACTIVE');
              setCards(apiData.cards.map((c: any) => ({ id: c.id.toString(), term: c.term, definition: c.definition, options: c.options || [], explanation: c.explanation || '', relatedLink: '' })));
              setCreationStep('EDITOR'); setShowAiModal(false);
          }
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
      case 'MANUAL': return <div className="flex items-center gap-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-md text-[10px] uppercase font-black"><Keyboard size={iconSize} /> <span>Thủ công</span></div>;
      case 'AI_TOPIC': return <div className="flex items-center gap-1.5 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 px-2 py-0.5 rounded-md text-[10px] uppercase font-black"><Sparkles size={iconSize} /> <span>AI Chủ đề</span></div>;
      case 'AI_FILE': return <div className="flex items-center gap-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-md text-[10px] uppercase font-black"><ScanLine size={iconSize} /> <span>AI Quét file</span></div>;
      case 'AI_TEXTBOOK': return <div className="flex items-center gap-1.5 bg-pink-50 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 px-2 py-0.5 rounded-md text-[10px] uppercase font-black"><BookOpen size={iconSize} /> <span>AI Giáo án</span></div>;
      default: return <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-md text-[10px] uppercase font-black"><Layers size={iconSize} /> <span>Quiz</span></div>;
    }
  };

  if (creationStep === 'MENU') {
      return (
          <div className="max-w-6xl mx-auto px-4 py-12 animate-fade-in relative pb-32">
              <div className="text-center mb-10">
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{t('create_set.title_method')}</h2>
                  <p className="text-gray-500 dark:text-gray-400">{t('create_set.desc_method')}</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
                  <button onClick={() => { setCreationStep('EDITOR'); setEditingSetId(null); setCreationSource('MANUAL'); setStatus('ACTIVE'); setTitle(''); setCards([{id:uuidv4(),term:'',definition:'',options:['','','',''],explanation:'',relatedLink:''}])}} disabled={!canManualEntry} className={`group bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 transition-all text-left flex flex-col h-full relative ${canManualEntry ? 'hover:border-blue-500 hover:shadow-xl dark:hover:border-blue-400' : 'opacity-50 grayscale'}`}>
                      <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center mb-4"><Keyboard size={24} /></div>
                      <h3 className="text-lg font-bold dark:text-white mb-1">{t('create_set.manual_title')}</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{t('create_set.manual_desc')}</p>
                  </button>
                  <button onClick={() => { setAiMode('TEXT_TOPIC'); setShowAiModal(true); }} disabled={!canAiTopic} className={`group bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 transition-all text-left flex flex-col h-full relative ${canAiTopic ? 'hover:border-purple-500 hover:shadow-xl dark:hover:border-purple-400' : 'opacity-50 grayscale'}`}>
                      <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-xl flex items-center justify-center mb-4"><BrainCircuit size={24} /></div>
                      <h3 className="text-lg font-bold dark:text-white mb-1">{t('create_set.ai_topic_title')}</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{t('create_set.ai_topic_desc')}</p>
                  </button>
                  <button onClick={() => { setAiMode('FILE_SCAN_QUIZ'); setShowAiModal(true); }} disabled={!canScanDoc} className={`group bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 transition-all text-left flex flex-col h-full relative ${canScanDoc ? 'hover:border-indigo-500 hover:shadow-xl dark:hover:border-indigo-400' : 'opacity-50 grayscale'}`}>
                      <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center mb-4"><ScanLine size={24} /></div>
                      <h3 className="text-lg font-bold dark:text-white mb-1">{t('create_set.scan_file_title')}</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{t('create_set.scan_file_desc')}</p>
                  </button>
                  <button onClick={onGoToAiTextbook} disabled={!canAiPlanner} className={`group bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-800 dark:to-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 transition-all text-left flex flex-col h-full relative ${canAiPlanner ? 'hover:border-pink-500 hover:shadow-xl dark:hover:border-pink-400' : 'opacity-50 grayscale'}`}>
                      <div className="w-12 h-12 bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 rounded-xl flex items-center justify-center mb-4"><BookOpen size={24} /></div>
                      <h3 className="text-lg font-bold dark:text-white mb-1">{t('create_set.ai_textbook_title')}</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{t('create_set.ai_textbook_desc')}</p>
                  </button>
              </div>
              <div className="max-w-6xl mx-auto bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                  <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 flex items-center justify-between">
                      <h3 className="font-black flex items-center gap-2 dark:text-white uppercase tracking-tighter text-sm"><Clock size={18} className="text-brand-blue" /> {t('create_set.recent_activity')}</h3>
                      {isLoadingSets && <Loader2 size={16} className="animate-spin text-blue-500" />}
                  </div>
                  <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                          <thead className="bg-gray-50/80 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 font-black uppercase text-[10px] tracking-widest">
                              <tr><th className="px-6 py-4">Tên</th><th className="px-6 py-4">Loại</th><th className="px-6 py-4">Ngày</th><th className="px-6 py-4">Trạng thái</th><th className="px-6 py-4 text-right">Hành động</th></tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                              {serverSets.map((r) => (
                                  <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                      <td className="px-6 py-4 font-bold dark:text-white truncate max-w-xs">{r.title}</td>
                                      <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                                          {renderTypeCell(r.type)}
                                      </td>
                                      <td className="px-6 py-4 text-gray-500 dark:text-gray-400 font-medium">{new Date(r.createdAt).toLocaleDateString('vi-VN')}</td>
                                      <td className="px-6 py-4">
                                          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${r.status === 'DRAFT' ? 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600' : 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800/30'}`}>{r.status === 'DRAFT' ? 'Bản nháp' : 'Hoạt động'}</span>
                                      </td>
                                      <td className="px-6 py-4 text-right">
                                          <button onClick={() => handleSelectServerSet(r.id)} className="text-indigo-600 dark:text-indigo-400 font-black text-xs border border-indigo-100 dark:border-indigo-800 px-4 py-2 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all">Xem lại</button>
                                      </td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
              </div>
              {showAiModal && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-gray-800 rounded-[32px] w-full max-w-lg p-8 shadow-2xl border border-gray-100 dark:border-gray-700">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-2xl font-black flex items-center gap-2 dark:text-white">{aiMode === 'TEXT_TOPIC' ? <BrainCircuit className="text-purple-600" /> : <ScanLine className="text-indigo-600" />} {aiMode === 'TEXT_TOPIC' ? t('create_set.ai_modal_topic_title') : t('create_set.ai_modal_scan_title')}</h3>
                            <button onClick={() => setShowAiModal(false)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"><X size={24} className="text-gray-400" /></button>
                        </div>
                        {aiMode === 'TEXT_TOPIC' ? (
                            <textarea className="w-full border-2 border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 dark:text-white rounded-2xl p-4 h-40 mb-6 outline-none focus:ring-4 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 focus:border-indigo-500 font-medium" placeholder={t('create_set.ai_modal_topic_ph')} value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} />
                        ) : (
                            <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-3xl p-12 text-center relative mb-8 hover:border-indigo-400 transition-colors group bg-gray-50/50 dark:bg-gray-700/30">
                                <input type="file" onChange={(e) => { if(e.target.files?.[0]) { const f=e.target.files[0]; const r=new FileReader(); r.readAsDataURL(f); r.onload=()=>setAiFile({name:f.name,data:r.result as string}); } }} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                {aiFile ? <div className="text-indigo-600 dark:text-indigo-400 font-black text-lg">{aiFile.name}</div> : <div className="text-gray-400"><Upload size={48} className="mx-auto mb-4 group-hover:scale-110 transition-transform" />{t('create_set.click_upload')}</div>}
                            </div>
                        )}
                        <div className="flex justify-end gap-3">
                            <button onClick={() => setShowAiModal(false)} className="px-6 py-3 text-gray-500 dark:text-gray-400 font-bold hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-all">Hủy</button>
                            <button onClick={handleAiGenerate} disabled={isGenerating} className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-black flex items-center gap-2 shadow-lg shadow-indigo-100 dark:shadow-none hover:bg-indigo-700 transition-all active:scale-95">
                                {isGenerating ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} />} Tạo ngay
                            </button>
                        </div>
                    </div>
                </div>
              )}
          </div>
      );
  }

  return (
    <div className="w-full h-[calc(100vh-64px)] flex flex-col animate-fade-in bg-gray-50 dark:bg-gray-900 overflow-hidden relative">
      {/* Top Header Toolbar */}
      <div className="flex justify-between items-center px-4 sm:px-6 py-3 bg-white dark:bg-gray-800 z-30 border-b border-gray-100 dark:border-gray-700 shrink-0 transition-colors">
        <div className="flex items-center gap-2 sm:gap-4">
            <button onClick={() => setCreationStep('MENU')} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 transition-colors"><ArrowLeft size={20} /></button>
            <h2 className="text-lg sm:text-xl font-black dark:text-white truncate max-w-[150px] sm:max-w-none">{editingSetId ? "Chỉnh sửa" : t('create_set.editor_title')}</h2>
        </div>
        <div className="flex items-center gap-2">
            <button onClick={onCancel} className="px-3 sm:px-4 py-2 text-gray-500 dark:text-gray-400 font-bold text-sm">Hủy</button>
            <button onClick={handleSave} disabled={isSaving} className="px-4 sm:px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-black text-sm flex items-center gap-2 shadow-md shadow-indigo-100 dark:shadow-none transition-all active:scale-95">
                {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} <span className="hidden sm:inline">Lưu học phần</span><span className="sm:hidden">Lưu</span>
            </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="mx-auto w-full max-w-7xl grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-8 p-4 sm:p-6">
              
              {/* Sidebar Config - Desktop: Side, Mobile: Collapsible Top */}
              <div className="lg:col-span-1 space-y-4">
                  {/* Collapsible Section Header for Mobile */}
                  <button 
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="w-full flex lg:hidden items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 font-black text-sm uppercase tracking-widest text-indigo-600 dark:text-indigo-400 transition-colors"
                  >
                    <div className="flex items-center gap-2"><Settings2 size={18} /> Cấu hình & Mục lục</div>
                    {isSidebarOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>

                  <div className={`${isSidebarOpen ? 'block' : 'hidden'} lg:block space-y-6 animate-fade-in`}>
                      <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-100 dark:border-gray-700 transition-colors shadow-sm">
                          <h3 className="font-black mb-6 flex items-center gap-2 dark:text-white uppercase tracking-tighter text-sm"><FileText size={18} className="text-indigo-500" /> Thông tin chung</h3>
                          <div className="space-y-5">
                              <div><label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5">Tiêu đề</label><input type="text" className="w-full p-3 bg-gray-50 dark:bg-gray-700 dark:text-white border-2 border-transparent focus:border-indigo-500 rounded-xl outline-none font-bold text-sm transition-all" value={title} onChange={e => setTitle(e.target.value)} placeholder="Tên học phần..." /></div>
                              <div><label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5">Mô tả</label><textarea className="w-full p-3 bg-gray-50 dark:bg-gray-700 dark:text-white border-2 border-transparent focus:border-indigo-500 rounded-xl outline-none resize-none text-sm transition-all" rows={3} value={description} onChange={e => setDescription(e.target.value)} placeholder="Mô tả nội dung học..." /></div>
                              <div className="grid grid-cols-2 gap-3">
                                  <div><label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5">Quyền</label><select value={privacy} onChange={e => setPrivacy(e.target.value as any)} className="w-full p-3 bg-gray-50 dark:bg-gray-700 dark:text-white rounded-xl text-xs font-bold outline-none border-2 border-transparent focus:border-indigo-500"><option value="PUBLIC">Công khai</option><option value="PRIVATE">Riêng tư</option></select></div>
                                  <div><label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5">Trạng thái</label><select value={status} onChange={e => setStatus(e.target.value)} className="w-full p-3 bg-gray-50 dark:bg-gray-700 dark:text-white rounded-xl text-xs font-bold outline-none border-2 border-transparent focus:border-indigo-500"><option value="ACTIVE">Hoạt động</option><option value="DRAFT">Bản nháp</option></select></div>
                              </div>
                              <div><label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5">Môn học</label><input type="text" className="w-full p-3 bg-gray-50 dark:bg-gray-700 dark:text-white border-2 border-transparent focus:border-indigo-500 rounded-xl text-sm font-bold outline-none transition-all" value={subject} onChange={e => setSubject(e.target.value)} placeholder="Toán, Anh..." /></div>
                          </div>
                      </div>
                      
                      <div className="bg-white dark:bg-gray-800 rounded-3xl p-5 border border-gray-100 dark:border-gray-700 flex flex-col max-h-[400px] transition-colors shadow-sm">
                          <h3 className="font-black mb-4 flex items-center gap-2 dark:text-white uppercase tracking-tighter text-sm"><List size={18} className="text-indigo-500" /> Danh sách câu hỏi</h3>
                          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1 pr-1">
                              {cards.map((c, i) => (
                                  <button key={c.id} onClick={() => scrollToCard(c.id)} className={`w-full text-left px-3 py-2.5 rounded-xl text-xs truncate border-2 transition-all ${activeCardId === c.id ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border-indigo-100 dark:border-indigo-800 font-bold shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 border-transparent'}`}>
                                      <span className="opacity-50 mr-1.5">{i + 1}.</span> {c.term || "Câu hỏi mới..."}
                                  </button>
                              ))}
                          </div>
                      </div>
                  </div>
              </div>

              {/* Main Editor Area */}
              <div className="lg:col-span-3 space-y-4 sm:space-y-6">
                  {/* Editor Mode Selector */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white dark:bg-gray-800 p-3 sm:p-4 rounded-3xl border border-gray-100 dark:border-gray-700 transition-colors shadow-sm gap-3">
                      <div className="flex gap-2 w-full sm:w-auto overflow-x-auto no-scrollbar">
                          <button onClick={() => handleSwitchMode('VISUAL')} className={`px-4 py-2.5 rounded-xl font-black text-xs flex items-center gap-2 whitespace-nowrap transition-all uppercase tracking-widest ${editorMode === 'VISUAL' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 dark:shadow-none' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'}`}><Layers size={14} /> Thẻ</button>
                          <button onClick={() => handleSwitchMode('TEXT')} className={`px-4 py-2.5 rounded-xl font-black text-xs flex items-center gap-2 whitespace-nowrap transition-all uppercase tracking-widest ${editorMode === 'TEXT' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 dark:shadow-none' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'}`}><FileText size={14} /> Văn bản</button>
                      </div>
                      <button onClick={() => setShowTextGuide(true)} className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 text-xs font-bold transition-colors whitespace-nowrap ml-1 uppercase tracking-tighter"><HelpCircle size={14} /> Hướng dẫn nhập</button>
                  </div>

                  {editorMode === 'VISUAL' ? (
                      <div className="space-y-4 sm:space-y-8 pb-32">
                        {cards.map((card, index) => (
                        <div key={card.id} ref={el => { cardRefs.current[card.id] = el; }} className={`bg-white dark:bg-gray-800 rounded-[32px] border-2 p-4 sm:p-8 transition-all ${activeCardId === card.id ? 'border-indigo-500 dark:border-indigo-400 ring-8 ring-indigo-50 dark:ring-indigo-900/20 shadow-xl' : 'border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 shadow-sm'}`} onClick={() => setActiveCardId(card.id)}>
                            <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-50 dark:border-gray-700">
                                <div className="flex items-center gap-3"><span className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-gray-700 dark:text-white flex items-center justify-center font-black text-xs">{index+1}</span><span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400">Câu hỏi trắc nghiệm</span></div>
                                <button onClick={(e) => { e.stopPropagation(); if(confirm('Xóa câu hỏi này?')) setCards(cards.filter(c=>c.id!==card.id)); }} className="p-2 rounded-xl text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"><Trash2 size={20} /></button>
                            </div>
                            <div className="space-y-6">
                                <div><label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest block mb-2">Nội dung câu hỏi</label><textarea className="w-full p-4 sm:p-6 rounded-2xl bg-gray-50 dark:bg-gray-700/50 dark:text-white border-2 border-transparent focus:border-indigo-500 outline-none font-bold text-base sm:text-xl focus:ring-4 focus:ring-indigo-100 dark:focus:ring-indigo-900/20 transition-all" rows={2} placeholder="Nhập câu hỏi tại đây..." value={card.term} onChange={e=>setCards(cards.map(c=>c.id===card.id?{...c,term:e.target.value}:c))} /></div>
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest block mb-3">Các lựa chọn đáp án (Chọn 1 đáp án đúng)</label>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                                        {card.options?.map((opt, oi) => {
                                            const isCorrect = card.definition === opt && opt !== '';
                                            return (
                                                <div key={oi} className={`flex items-center gap-3 p-3 sm:p-4 rounded-2xl border-2 transition-all group ${isCorrect ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'bg-white dark:bg-gray-855 border-gray-100 dark:border-gray-700 hover:border-indigo-200 dark:hover:border-indigo-900'}`}>
                                                    <button onClick={() => setCards(cards.map(c=>c.id===card.id?{...c,definition:opt}:c))} className={`w-8 h-8 rounded-xl border-2 flex items-center justify-center shrink-0 transition-all ${isCorrect ? 'bg-green-500 border-green-500 text-white scale-110' : 'border-gray-200 dark:border-gray-600 text-transparent hover:border-indigo-400'}`}><Check size={18} strokeWidth={4} /></button>
                                                    <input type="text" className="flex-1 bg-transparent outline-none text-sm sm:text-base font-bold dark:text-white placeholder-gray-300" placeholder={`Đáp án ${String.fromCharCode(65+oi)}...`} value={opt} onChange={e=>{const next=[...(card.options||[])]; next[oi]=e.target.value; setCards(cards.map(c=>c.id===card.id?{...c,options:next,definition:isCorrect?e.target.value:c.definition}:c));}} />
                                                    <button onClick={()=> {const next=[...(card.options||[])]; next.splice(oi,1); setCards(cards.map(c=>c.id===card.id?{...c,options:next,definition:card.definition===opt?'':card.definition}:c));}} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><X size={18} /></button>
                                                </div>
                                            );
                                        })}
                                        <button onClick={()=>setCards(cards.map(c=>c.id===card.id?{...c,options:[...(c.options||[]),'']}:c))} className="flex items-center justify-center p-4 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl text-gray-400 hover:text-indigo-600 hover:border-indigo-400 transition-all font-black text-xs uppercase tracking-widest gap-2 bg-gray-50/30 dark:bg-gray-700/10">+ Thêm phương án</button>
                                    </div>
                                </div>
                                <div className="pt-2">
                                    <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest block mb-2">Giải thích chi tiết (Tùy chọn)</label>
                                    <textarea className="w-full p-4 rounded-2xl bg-gray-50 dark:bg-gray-700/50 dark:text-white border-2 border-transparent focus:border-indigo-500 outline-none text-sm font-medium transition-all" rows={2} placeholder="Tại sao đáp án này đúng?..." value={card.explanation} onChange={e=>setCards(cards.map(c=>c.id===card.id?{...c,explanation:e.target.value}:c))} />
                                </div>
                            </div>
                        </div>
                        ))}
                        <button onClick={handleAddCard} className="w-full py-8 bg-white dark:bg-gray-800 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-[32px] text-gray-400 font-black text-sm uppercase tracking-[0.2em] hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all flex items-center justify-center gap-3 shadow-sm hover:shadow-xl active:scale-[0.99]"><Plus size={24} strokeWidth={3} /> Thêm câu hỏi mới</button>
                      </div>
                  ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8 h-[calc(100vh-220px)] sm:h-[calc(100vh-280px)]">
                          <div className="flex flex-col h-full bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
                              <div className="p-3 border-b border-gray-50 dark:border-gray-700 font-black text-[10px] uppercase text-indigo-600 tracking-widest">Bộ soạn thảo</div>
                              <textarea className="flex-1 w-full p-4 sm:p-6 font-mono text-sm outline-none dark:bg-gray-800 dark:text-white resize-none" placeholder="Nhập câu hỏi theo định dạng..." value={textEditorContent} onChange={e=>setTextEditorContent(e.target.value)} />
                          </div>
                          <div className="hidden md:flex flex-col h-full bg-gray-50/50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-3xl overflow-hidden shadow-inner transition-colors">
                              <div className="p-3 border-b border-gray-100 dark:border-gray-700 font-black text-[10px] uppercase text-gray-500 tracking-widest">Xem trước ({parsedPreviewCards.length})</div>
                              <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                                  {parsedPreviewCards.map((p, i) => (
                                      <div key={i} className="p-5 bg-white dark:bg-gray-855 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm transition-all hover:scale-[1.02]">
                                          <div className="font-bold text-base dark:text-white mb-3"><span className="text-indigo-500 mr-2">{i+1}.</span>{p.term}</div>
                                          <div className="space-y-2 pl-6">
                                            {p.options?.map((o,oi)=>(
                                              <div key={oi} className={`text-sm flex items-center gap-2 ${o===p.definition?'text-green-600 dark:text-green-400 font-black':'text-gray-500 dark:text-gray-400'}`}>
                                                <div className={`w-1.5 h-1.5 rounded-full ${o===p.definition ? 'bg-green-500' : 'bg-gray-300'}`} /> {o}
                                              </div>
                                            ))}
                                          </div>
                                      </div>
                                  ))}
                                  {parsedPreviewCards.length === 0 && <div className="text-gray-400 dark:text-gray-500 text-sm italic text-center py-20 flex flex-col items-center gap-3"><Layers size={32} opacity={0.3} />Dữ liệu xem trước trống...</div>}
                              </div>
                          </div>
                      </div>
                  )}
              </div>
          </div>
      </div>

      {/* Floating Action Button for Mobile Add Card */}
      <div className="fixed bottom-6 right-6 lg:hidden z-40">
          <button 
            onClick={handleAddCard}
            className="w-14 h-14 bg-indigo-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:bg-indigo-700 active:scale-90 transition-all border-4 border-white dark:border-gray-900"
          >
              <Plus size={32} strokeWidth={3} />
          </button>
      </div>

      {/* Text Guide Modal */}
      {showTextGuide && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in" onClick={() => setShowTextGuide(false)}>
            <div className="bg-white dark:bg-gray-800 rounded-[32px] w-full max-w-lg shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50 transition-colors">
                    <h3 className="font-black flex items-center gap-2 dark:text-white uppercase tracking-tighter"><Info size={20} className="text-indigo-600 dark:text-indigo-400" /> Hướng dẫn nhập nhanh</h3>
                    <button onClick={() => setShowTextGuide(false)} className="text-gray-400 dark:hover:text-white"><X size={24} /></button>
                </div>
                <div className="p-8 space-y-6 text-sm text-gray-600 dark:text-gray-300">
                    <div className="grid grid-cols-1 gap-4 font-bold text-xs uppercase tracking-widest text-gray-400">
                        <div className="flex items-center gap-3 bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded-xl text-indigo-700 dark:text-indigo-300"><span className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-[10px]">1</span> Câu hỏi ở dòng đầu tiên</div>
                        <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-xl"><span className="w-6 h-6 rounded-lg bg-gray-400 text-white flex items-center justify-center text-[10px]">2</span> Các dòng tiếp theo là đáp án</div>
                        <div className="flex items-center gap-3 bg-green-50 dark:bg-green-900/20 p-3 rounded-xl text-green-700 dark:text-green-300"><span className="w-6 h-6 rounded-lg bg-green-600 text-white flex items-center justify-center text-[10px]">*</span> Dấu * trước đáp án ĐÚNG</div>
                        <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-xl"><span className="w-6 h-6 rounded-lg bg-gray-400 text-white flex items-center justify-center text-[10px]">&crarr;</span> Cách 1 dòng trống để qua câu mới</div>
                    </div>
                    <div className="bg-gray-950 p-5 rounded-2xl relative group border-2 border-gray-800 shadow-inner">
                        <pre className="text-[11px] text-green-400 font-mono whitespace-pre-wrap leading-relaxed">{SAMPLE_TEXT_FORMAT}</pre>
                        <button onClick={() => { setTextEditorContent(SAMPLE_TEXT_FORMAT); setShowTextGuide(false); }} className="absolute top-3 right-3 bg-indigo-600 text-white px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-colors shadow-lg">Thử mẫu</button>
                    </div>
                </div>
                <div className="p-6 border-t border-gray-100 dark:border-gray-700 flex justify-end transition-colors bg-gray-50 dark:bg-gray-800/30">
                    <button onClick={() => setShowTextGuide(false)} className="bg-white dark:bg-gray-700 dark:text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-sm border border-gray-200 dark:border-gray-600 transition-all hover:bg-gray-50 dark:hover:bg-gray-600">Đã hiểu</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default CreateSet;
