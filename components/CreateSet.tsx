
import React, { useState, useRef, useEffect } from 'react';
import { Flashcard, StudySet, PrivacyStatus, AiGenerationRecord, StudySetType } from '../types';
import { generateStudySetWithAI, generateStudySetFromFile } from '../services/geminiService';
import { studySetService, CreateStudySetRequest, UpdateStudySetRequest } from '../services/studySetService';
import { Plus, Trash2, Sparkles, Save, FileText, Upload, CheckCircle, Keyboard, ScanLine, ArrowLeft, BrainCircuit, Check, X, AlertCircle, Lightbulb, Layers, List, BookOpen, Link, Globe, Lock, Building, GraduationCap, Hash, Bookmark, Eye, AlertTriangle, HelpCircle, Copy, Info, Clock, CheckSquare, Loader2, FileEdit } from 'lucide-react';
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

const SCHOOLS_BY_LEVEL: Record<string, string[]> = {
  'Trung học phổ thông': ['THPT Chuyên Hà Nội - Amsterdam', 'THPT Chu Văn An', 'THPT Lương Thế Vinh', 'THPT Nguyễn Huệ', 'THPT Lê Hồng Phong', 'THPT Chuyên Ngoại Ngữ', 'THPT Marie Curie'],
  'Đại học': ['Đại học Bách Khoa Hà Nội', 'Đại học Quốc Gia Hà Nội', 'Đại học Kinh Tế Quốc Dân', 'Đại học FPT', 'Đại học RMIT', 'Đại học Ngoại Thương', 'Học viện Công nghệ Bưu chính Viễn thông'],
  'Cao đẳng': ['Cao đẳng FPT Polytechnic', 'Cao đẳng Công nghệ cao Hà Nội', 'Cao đẳng Du lịch', 'Cao đẳng Y tế', 'Cao đẳng Kinh tế Kỹ thuật'],
  'Cao học': ['Học viện Khoa học xã hội', 'Viện Hàn lâm Khoa học xã hội Việt Nam', 'Đại học Quốc Gia - Khoa Sau Đại học'],
  'Trung cấp': ['Trung cấp Nghề', 'Trung cấp Y dược', 'Trung cấp Kinh tế']
};

const SAMPLE_TEXT_FORMAT = `Thủ đô của Việt Nam là gì?
A. Thành phố Hồ Chí Minh
*B. Hà Nội
C. Đà Nẵng
D. Hải Phòng

Công thức hóa học của nước là?
A. H2O2
*B. H2O
C. HO
D. O2

Ai là người sáng lập Microsoft?
A. Steve Jobs
B. Elon Musk
*C. Bill Gates`;

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
      case 'MANUAL': return <div className="flex items-center gap-1.5"><Keyboard size={iconSize} className="text-blue-500" /> <span className="font-medium">Thủ công</span></div>;
      case 'AI_TOPIC': return <div className="flex items-center gap-1.5"><Sparkles size={iconSize} className="text-purple-500" /> <span className="font-medium">AI Chủ đề</span></div>;
      case 'AI_FILE': return <div className="flex items-center gap-1.5"><ScanLine size={iconSize} className="text-indigo-500" /> <span className="font-medium">AI Quét file</span></div>;
      case 'AI_TEXTBOOK': return <div className="flex items-center gap-1.5"><BookOpen size={iconSize} className="text-pink-500" /> <span className="font-medium">AI Giáo án</span></div>;
      default: return <div className="flex items-center gap-1.5"><Layers size={iconSize} className="text-gray-400" /> <span className="font-medium">Quiz</span></div>;
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
                  <button onClick={() => { setCreationStep('EDITOR'); setEditingSetId(null); setCreationSource('MANUAL'); setStatus('ACTIVE'); setTitle(''); setCards([{id:uuidv4(),term:'',definition:'',options:['','','',''],explanation:'',relatedLink:''}])}} disabled={!canManualEntry} className={`group bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 transition-all text-left flex flex-col h-full relative ${canManualEntry ? 'hover:border-blue-500 hover:shadow-xl dark:hover:border-blue-400' : 'opacity-50 grayscale'}`}>
                      <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center mb-4"><Keyboard size={24} /></div>
                      <h3 className="text-lg font-bold dark:text-white mb-1">{t('create_set.manual_title')}</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{t('create_set.manual_desc')}</p>
                  </button>
                  <button onClick={() => { setAiMode('TEXT_TOPIC'); setShowAiModal(true); }} disabled={!canAiTopic} className={`group bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 transition-all text-left flex flex-col h-full relative ${canAiTopic ? 'hover:border-purple-500 hover:shadow-xl dark:hover:border-purple-400' : 'opacity-50 grayscale'}`}>
                      <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-xl flex items-center justify-center mb-4"><BrainCircuit size={24} /></div>
                      <h3 className="text-lg font-bold dark:text-white mb-1">{t('create_set.ai_topic_title')}</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{t('create_set.ai_topic_desc')}</p>
                  </button>
                  <button onClick={() => { setAiMode('FILE_SCAN_QUIZ'); setShowAiModal(true); }} disabled={!canScanDoc} className={`group bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 transition-all text-left flex flex-col h-full relative ${canScanDoc ? 'hover:border-indigo-500 hover:shadow-xl dark:hover:border-indigo-400' : 'opacity-50 grayscale'}`}>
                      <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center mb-4"><ScanLine size={24} /></div>
                      <h3 className="text-lg font-bold dark:text-white mb-1">{t('create_set.scan_file_title')}</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{t('create_set.scan_file_desc')}</p>
                  </button>
                  <button onClick={onGoToAiTextbook} disabled={!canAiPlanner} className={`group bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-800 dark:to-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 transition-all text-left flex flex-col h-full relative ${canAiPlanner ? 'hover:border-pink-500 hover:shadow-xl dark:hover:border-pink-400' : 'opacity-50 grayscale'}`}>
                      <div className="w-12 h-12 bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 rounded-xl flex items-center justify-center mb-4"><BookOpen size={24} /></div>
                      <h3 className="text-lg font-bold dark:text-white mb-1">{t('create_set.ai_textbook_title')}</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{t('create_set.ai_textbook_desc')}</p>
                  </button>
              </div>
              <div className="max-w-6xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-700/50 flex items-center justify-between">
                      <h3 className="font-bold flex items-center gap-2 dark:text-white"><Clock size={18} /> {t('create_set.recent_activity')}</h3>
                      {isLoadingSets && <Loader2 size={16} className="animate-spin text-blue-500" />}
                  </div>
                  <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                          <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 font-medium uppercase text-xs">
                              <tr><th className="px-6 py-3">Tên</th><th className="px-6 py-3">Loại</th><th className="px-6 py-3">Ngày</th><th className="px-6 py-3">Trạng thái</th><th className="px-6 py-3 text-right">Hành động</th></tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                              {serverSets.map((r) => (
                                  <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                      <td className="px-6 py-4 font-medium dark:text-white truncate max-w-xs">{r.title}</td>
                                      <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                                          {renderTypeCell(r.type)}
                                      </td>
                                      <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{new Date(r.createdAt).toLocaleDateString()}</td>
                                      <td className="px-6 py-4">
                                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${r.status === 'DRAFT' ? 'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-200 dark:border-gray-500' : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800/30'}`}>{r.status || 'ACTIVE'}</span>
                                      </td>
                                      <td className="px-6 py-4 text-right">
                                          <button onClick={() => handleSelectServerSet(r.id)} className="text-indigo-600 dark:text-indigo-400 font-medium text-xs border border-indigo-200 dark:border-indigo-800 px-3 py-1.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20">Xem lại</button>
                                      </td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
              </div>
              {showAiModal && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl border border-gray-100 dark:border-gray-700">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold flex items-center gap-2 dark:text-white">{aiMode === 'TEXT_TOPIC' ? <BrainCircuit className="text-purple-600" /> : <ScanLine className="text-indigo-600" />} {aiMode === 'TEXT_TOPIC' ? t('create_set.ai_modal_topic_title') : t('create_set.ai_modal_scan_title')}</h3>
                            <button onClick={() => setShowAiModal(false)}><X size={24} className="text-gray-400" /></button>
                        </div>
                        {aiMode === 'TEXT_TOPIC' ? (
                            <textarea className="w-full border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 dark:text-white rounded-xl p-4 h-32 mb-4 outline-none focus:ring-2 focus:ring-indigo-500" placeholder={t('create_set.ai_modal_topic_ph')} value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} />
                        ) : (
                            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center relative mb-6">
                                <input type="file" onChange={(e) => { if(e.target.files?.[0]) { const f=e.target.files[0]; const r=new FileReader(); r.readAsDataURL(f); r.onload=()=>setAiFile({name:f.name,data:r.result as string}); } }} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                {aiFile ? <div className="text-indigo-600 dark:text-indigo-400 font-bold">{aiFile.name}</div> : <div className="text-gray-400"><Upload size={32} className="mx-auto mb-2" />{t('create_set.click_upload')}</div>}
                            </div>
                        )}
                        <div className="flex justify-end gap-3 pt-2">
                            <button onClick={() => setShowAiModal(false)} className="px-5 py-2.5 text-gray-500 dark:text-gray-400 font-medium">Hủy</button>
                            <button onClick={handleAiGenerate} disabled={isGenerating} className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold flex items-center gap-2">
                                {isGenerating ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />} Tạo ngay
                            </button>
                        </div>
                    </div>
                </div>
              )}
          </div>
      );
  }

  return (
    <div className="w-full h-[calc(100vh-80px)] flex flex-col animate-fade-in bg-gray-50 dark:bg-gray-900 overflow-hidden">
      <div className="flex justify-between items-center px-6 py-3 bg-white dark:bg-gray-800 z-30 border-b border-gray-200 dark:border-gray-700 shrink-0 transition-colors">
        <div className="flex items-center gap-3">
            <button onClick={() => setCreationStep('MENU')} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 transition-colors"><ArrowLeft size={20} /></button>
            <h2 className="text-xl font-bold dark:text-white">{editingSetId ? "Chỉnh sửa" : t('create_set.editor_title')}</h2>
        </div>
        <div className="flex gap-3">
            <button onClick={onCancel} className="px-4 py-2 text-gray-500 dark:text-gray-400 font-medium">Hủy</button>
            <button onClick={handleSave} disabled={isSaving} className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium flex items-center gap-2 transition-colors">
                {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} Lưu học phần
            </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
          <div className="mx-auto w-full max-w-[1920px] grid grid-cols-1 lg:grid-cols-4 gap-8">
              <div className="lg:col-span-1 space-y-6">
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 transition-colors">
                      <h3 className="font-bold mb-4 flex items-center gap-2 dark:text-white"><FileText size={18} /> Thông tin chung</h3>
                      <div className="space-y-4">
                          <div><label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Tiêu đề</label><input type="text" className="w-full p-2 bg-gray-50 dark:bg-gray-700 dark:text-white border border-gray-200 dark:border-gray-600 rounded-lg outline-none font-bold focus:ring-2 focus:ring-indigo-500" value={title} onChange={e => setTitle(e.target.value)} /></div>
                          <div><label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Mô tả</label><textarea className="w-full p-2 bg-gray-50 dark:bg-gray-700 dark:text-white border border-gray-200 dark:border-gray-600 rounded-lg outline-none resize-none focus:ring-2 focus:ring-indigo-500" rows={2} value={description} onChange={e => setDescription(e.target.value)} /></div>
                          <div className="grid grid-cols-2 gap-3">
                              <div><label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Quyền</label><select value={privacy} onChange={e => setPrivacy(e.target.value as any)} className="w-full p-2 bg-gray-50 dark:bg-gray-700 dark:text-white border border-gray-200 dark:border-gray-600 rounded-lg text-sm outline-none"><option value="PUBLIC">Công khai</option><option value="PRIVATE">Riêng tư</option></select></div>
                              <div><label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Trạng thái</label><select value={status} onChange={e => setStatus(e.target.value)} className="w-full p-2 bg-gray-50 dark:bg-gray-700 dark:text-white border border-gray-200 dark:border-gray-600 rounded-lg text-sm outline-none"><option value="ACTIVE">Hoạt động</option><option value="DRAFT">Bản nháp</option></select></div>
                          </div>
                          <div><label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Cấp học</label><select value={level} onChange={e => setLevel(e.target.value)} className="w-full p-2 bg-gray-50 dark:bg-gray-700 dark:text-white border border-gray-200 dark:border-gray-600 rounded-lg text-sm outline-none">{EDUCATION_LEVELS.map(l=><option key={l} value={l}>{l}</option>)}</select></div>
                          <div><label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Môn học</label><input type="text" className="w-full p-2 bg-gray-50 dark:bg-gray-700 dark:text-white border border-gray-200 dark:border-gray-600 rounded-lg text-sm outline-none" value={subject} onChange={e => setSubject(e.target.value)} /></div>
                      </div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 flex flex-col max-h-[400px] transition-colors">
                      <h3 className="font-bold mb-3 flex items-center gap-2 dark:text-white text-sm"><List size={18} /> Danh sách câu hỏi</h3>
                      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1">
                          {cards.map((c, i) => (
                              <button key={c.id} onClick={() => scrollToCard(c.id)} className={`w-full text-left px-3 py-2 rounded-lg text-sm truncate border-l-2 ${activeCardId === c.id ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 border-l-indigo-600 font-medium' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 border-l-transparent'}`}>
                                  {i + 1}. {c.term || "Câu hỏi mới..."}
                              </button>
                          ))}
                      </div>
                  </div>
              </div>
              <div className="lg:col-span-3 space-y-6">
                  <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 transition-colors">
                      <div className="flex gap-4 overflow-x-auto">
                          <button onClick={() => handleSwitchMode('VISUAL')} className={`px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 whitespace-nowrap transition-colors ${editorMode === 'VISUAL' ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'}`}><Layers size={16} /> Giao diện thẻ</button>
                          <button onClick={() => handleSwitchMode('TEXT')} className={`px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 whitespace-nowrap transition-colors ${editorMode === 'TEXT' ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'}`}><FileText size={16} /> Nhập văn bản</button>
                          <button onClick={() => setShowTextGuide(true)} className="flex items-center gap-1 text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 text-sm font-medium transition-colors whitespace-nowrap"><HelpCircle size={16} /> Hướng dẫn nhập</button>
                      </div>
                  </div>
                  {editorMode === 'VISUAL' ? (
                      <div className="space-y-6 pb-20">
                        {cards.map((card, index) => (
                        <div key={card.id} ref={el => { cardRefs.current[card.id] = el; }} className={`bg-white dark:bg-gray-800 rounded-xl border p-6 transition-all ${activeCardId === card.id ? 'border-indigo-500 dark:border-indigo-400 ring-1 ring-indigo-200 dark:ring-indigo-900 shadow-md' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-500'}`} onClick={() => setActiveCardId(card.id)}>
                            <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-100 dark:border-gray-700">
                                <div className="flex items-center gap-3"><span className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 dark:text-gray-200 flex items-center justify-center font-bold text-sm">{index+1}</span><span className="text-xs font-bold uppercase text-indigo-600 dark:text-indigo-400">QUIZ</span></div>
                                <button onClick={(e) => { e.stopPropagation(); setCards(cards.filter(c=>c.id!==card.id)); }} className="text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={18} /></button>
                            </div>
                            <div className="space-y-4">
                                <div><label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase block mb-1">Câu hỏi</label><textarea className="w-full p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 dark:text-white border border-gray-200 dark:border-gray-600 outline-none font-medium text-lg focus:ring-2 focus:ring-indigo-500 transition-all" rows={2} value={card.term} onChange={e=>setCards(cards.map(c=>c.id===card.id?{...c,term:e.target.value}:c))} /></div>
                                <div><label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase block mb-1">Các lựa chọn</label><div className="grid md:grid-cols-2 gap-4">
                                    {card.options?.map((opt, oi) => {
                                        const isCorrect = card.definition === opt && opt !== '';
                                        return (
                                            <div key={oi} className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${isCorrect ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'bg-white dark:bg-gray-855 border-gray-200 dark:border-gray-700'}`}>
                                                <div onClick={() => setCards(cards.map(c=>c.id===card.id?{...c,definition:opt}:c))} className={`w-6 h-6 rounded-full border-2 flex items-center justify-center cursor-pointer transition-colors ${isCorrect ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300 dark:border-gray-600'}`}><Check size={14} /></div>
                                                <input type="text" className="flex-1 bg-transparent outline-none text-sm dark:text-white" value={opt} onChange={e=>{const next=[...(card.options||[])]; next[oi]=e.target.value; setCards(cards.map(c=>c.id===card.id?{...c,options:next,definition:isCorrect?e.target.value:c.definition}:c));}} />
                                                <button onClick={()=> {const next=[...(card.options||[])]; next.splice(oi,1); setCards(cards.map(c=>c.id===card.id?{...c,options:next,definition:card.definition===opt?'':card.definition}:c));}} className="text-gray-300 hover:text-red-500 transition-colors"><X size={14} /></button>
                                            </div>
                                        );
                                    })}
                                </div><button onClick={()=>setCards(cards.map(c=>c.id===card.id?{...c,options:[...(c.options||[]),'']}:c))} className="mt-2 text-indigo-600 dark:text-indigo-400 text-xs font-bold transition-all hover:underline">+ Thêm lựa chọn</button></div>
                            </div>
                        </div>
                        ))}
                        <button onClick={handleAddCard} className="w-full py-4 bg-gray-100 dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl text-gray-500 dark:text-gray-400 font-bold hover:border-indigo-500 dark:hover:border-indigo-400 transition-all flex items-center justify-center gap-2"><Plus size={20} /> Thêm câu hỏi mới</button>
                      </div>
                  ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[calc(100vh-250px)]">
                          <textarea className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 font-mono text-sm outline-none dark:text-white focus:ring-2 focus:ring-indigo-500 transition-all" placeholder="Nhập câu hỏi theo định dạng..." value={textEditorContent} onChange={e=>setTextEditorContent(e.target.value)} />
                          <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden flex flex-col transition-colors">
                              <div className="p-3 border-b border-gray-200 dark:border-gray-700 font-bold text-xs uppercase text-gray-500 dark:text-gray-400">Xem trước ({parsedPreviewCards.length})</div>
                              <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                                  {parsedPreviewCards.map((p, i) => (
                                      <div key={i} className="p-3 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 shadow-sm transition-colors">
                                          <div className="font-bold text-sm dark:text-white">{i+1}. {p.term}</div>
                                          <div className="mt-2 space-y-1">{p.options?.map((o,oi)=><div key={oi} className={`text-xs ${o===p.definition?'text-green-600 dark:text-green-400 font-bold':'text-gray-500 dark:text-gray-400'}`}>- {o}</div>)}</div>
                                      </div>
                                  ))}
                                  {parsedPreviewCards.length === 0 && <div className="text-gray-400 dark:text-gray-500 text-sm italic text-center py-10">Dữ liệu xem trước trống...</div>}
                              </div>
                          </div>
                      </div>
                  )}
              </div>
          </div>
      </div>

      {showTextGuide && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in" onClick={() => setShowTextGuide(false)}>
            <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-700 transition-colors">
                    <h3 className="font-bold flex items-center gap-2 dark:text-white"><Info size={20} className="text-indigo-600 dark:text-indigo-400" /> Hướng dẫn nhập văn bản</h3>
                    <button onClick={() => setShowTextGuide(false)} className="text-gray-400 dark:hover:text-white"><X size={24} /></button>
                </div>
                <div className="p-6 space-y-4 text-sm text-gray-600 dark:text-gray-300">
                    <div className="space-y-1">
                        <p>1. Dòng đầu tiên là <strong>Câu hỏi</strong>.</p>
                        <p>2. Các dòng tiếp theo là <strong>Đáp án</strong>.</p>
                        <p>3. Thêm dấu <strong>*</strong> trước đáp án đúng.</p>
                        <p>4. Cách nhau 1 dòng trống giữa các câu hỏi.</p>
                    </div>
                    <div className="bg-gray-900 p-4 rounded-lg relative group border border-gray-700">
                        <pre className="text-xs text-green-400 font-mono whitespace-pre-wrap">{SAMPLE_TEXT_FORMAT}</pre>
                        <button onClick={() => { setTextEditorContent(SAMPLE_TEXT_FORMAT); setShowTextGuide(false); }} className="absolute top-2 right-2 bg-indigo-600 text-white p-1.5 rounded text-[10px] font-bold hover:bg-indigo-700 transition-colors">Copy mẫu</button>
                    </div>
                </div>
                <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex justify-end transition-colors">
                    <button onClick={() => setShowTextGuide(false)} className="bg-gray-100 dark:bg-gray-700 dark:text-white px-4 py-2 rounded-lg font-bold text-sm transition-colors hover:bg-gray-200 dark:hover:bg-gray-600">Đã hiểu</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default CreateSet;
