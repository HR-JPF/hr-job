import React, { useState, useEffect } from 'react';
import { 
  Smartphone, Clock, Video, CheckCircle2, MessageSquare, Send, 
  Sparkles, Star, RefreshCw, Eye, Check, X, AlertCircle, Phone, Mail, 
  MapPin, HelpCircle, ChevronLeft, Calendar, BellRing, ArrowLeft, Camera,
  Briefcase, Award, CheckCircle, Info, LogOut
} from 'lucide-react';
import { Candidate, Application, Interview, Job } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface CandidatePortalSimulatorProps {
  candidates: Candidate[];
  applications: Application[];
  interviews: Interview[];
  setInterviews: React.Dispatch<React.SetStateAction<Interview[]>>;
  jobs: Job[];
  setApplications: React.Dispatch<React.SetStateAction<Application[]>>;
  candidateMessages: { [candidateId: string]: { sender: 'candidate' | 'bot'; text: string; time: string }[] };
  setCandidateMessages: React.Dispatch<React.SetStateAction<{ [candidateId: string]: { sender: 'candidate' | 'bot'; text: string; time: string }[] }>>;
  selectedCandidateId?: string;
  onBackToAdmin?: () => void;
  onLogout?: () => void;
}

export default function CandidatePortalSimulator({
  candidates,
  applications,
  interviews,
  setInterviews,
  jobs,
  setApplications,
  candidateMessages,
  setCandidateMessages,
  selectedCandidateId,
  onBackToAdmin,
  onLogout
}: CandidatePortalSimulatorProps) {
  
  // Resolve active candidate
  const currentCandId = selectedCandidateId || candidates[0]?.id || '';
  const candidate = candidates.find(c => c.id === currentCandId);
  
  const app = applications.find(a => a.candidate_id === currentCandId);
  const job = jobs.find(j => j.id === app?.job_id);
  const interview = interviews.find(i => i.application_id === app?.id);
  
  // Local state for interactive button feedback
  const [attendanceConfirmed, setAttendanceConfirmed] = useState<boolean>(false);
  const [attendanceDeclined, setAttendanceDeclined] = useState<boolean>(false);
  const [chatInput, setChatInput] = useState('');

  // Reset confirmation states when candidate changes
  useEffect(() => {
    setAttendanceConfirmed(false);
    setAttendanceDeclined(false);
  }, [currentCandId]);

  if (!candidate) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center bg-slate-50">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 mb-4 border border-amber-100">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-slate-800 mb-2">عذراً، لم نتمكن من العثور على بيانات المرشح</h3>
        <p className="text-sm text-slate-500 max-w-md leading-relaxed">
          يرجى التأكد من الرابط أو التواصل مع فريق التوظيف في الشركة للحصول على رابط صالح لبوابة المرشح الخاصة بك.
        </p>
        {onBackToAdmin && (
          <button 
            onClick={onBackToAdmin}
            className="mt-6 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold shadow-md hover:bg-slate-800 transition-colors"
          >
            العودة للوحة الإدارة
          </button>
        )}
      </div>
    );
  }

  // Handle Attendance Actions
  const handleConfirmAttendance = () => {
    setAttendanceConfirmed(true);
    setAttendanceDeclined(false);
    
    if (app) {
      const updatedNotes = (app.notes || '') + '\n[تأكيد حضور المقابلة بواسطة المرشح]';
      if (isSupabaseConfigured()) {
        supabase.from('applications').update({ notes: updatedNotes }).eq('id', app.id).then(({ error }) => {
          if (error) console.error('Failed to sync confirm attendance to Supabase:', error);
        });
      }
      setApplications(prev => prev.map(a => a.id === app.id ? { ...a, notes: updatedNotes } : a));
    }
  };

  const handleDeclineAttendance = () => {
    setAttendanceDeclined(true);
    setAttendanceConfirmed(false);
    
    if (app) {
      const updatedNotes = (app.notes || '') + '\n[الاعتذار وطلب إعادة جدولة بواسطة المرشح]';
      if (isSupabaseConfigured()) {
        supabase.from('applications').update({ notes: updatedNotes }).eq('id', app.id).then(({ error }) => {
          if (error) console.error('Failed to sync decline attendance to Supabase:', error);
        });
      }
      setApplications(prev => prev.map(a => a.id === app.id ? { ...a, notes: updatedNotes } : a));
    }
  };

  // Check-in (State 2 -> State 3)
  const handleCheckIn = () => {
    if (interview) {
      if (isSupabaseConfigured()) {
        supabase.from('interviews').update({ waiting_room_status: 'Waiting' }).eq('id', interview.id).then(({ error }) => {
          if (error) console.error('Failed to sync waiting status check-in to Supabase:', error);
        });
      }
      setInterviews(prev => prev.map(i => i.id === interview.id ? { ...i, waiting_room_status: 'Waiting' } : i));
    }
  };

  // Send WhatsApp message in simulated candidate chat
  const handleSendChat = () => {
    if (!chatInput.trim()) return;
    const timeNow = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
    
    const updatedMessages = [
      ...(candidateMessages[candidate.id] || []),
      { sender: 'candidate', text: chatInput, time: timeNow }
    ];

    setCandidateMessages(prev => ({
      ...prev,
      [candidate.id]: updatedMessages
    }));

    const textSent = chatInput;
    setChatInput('');

    // Dynamic chatbot response
    setTimeout(() => {
      let response = 'مرحباً بك! تم تسجيل استفسارك بنجاح وسيتواصل معك منسق المقابلات قريباً.';
      if (textSent.includes('موعد') || textSent.includes('تغيير')) {
        response = 'إذا كنت ترغب بتغيير موعد المقابلة، يرجى كتابة التاريخ والوقت الجديد وسيقوم فريق الموارد البشرية بالتحقق من الجدول وتحديثه.';
      } else if (textSent.includes('رابط') || textSent.includes('كيف')) {
        response = 'بمجرد أن يبدأ المقابل الجلسة، سيظهر لك زر أخضر كبير "الانضمام للمقابلة الحية (Google Meet)" مباشرة على الشاشة.';
      } else if (textSent.includes('انتظار') || textSent.includes('دور')) {
        response = 'أنت حالياً في ساحة الانتظار الافتراضية. بمجرد انتهاء المرشح الذي أمامك، ستتلقى نغمة وتنبيه مباشر للدخول.';
      }

      setCandidateMessages(prev => ({
        ...prev,
        [candidate.id]: [
          ...(prev[candidate.id] || []),
          { sender: 'bot', text: response, time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) }
        ]
      }));
    }, 1000);
  };

  const resolveApplicationStatus = () => {
    if (!app) return 'لا يوجد طلب نشط';
    const statusMap: { [key: string]: string } = {
      'New': 'جديد',
      'Screening': 'فحص السيرة الذاتية',
      'Interviewing': 'المقابلات الجارية',
      'Offered': 'عرض عمل مبدئي 🎉',
      'Rejected': 'نعتذر، لم يحالفك الحظ',
      'Hired': 'تم التعيين والقبول النهائي 🏆'
    };
    return statusMap[app.status] || app.status;
  };

  const getQueuePosition = () => {
    const waitingInts = interviews.filter(i => i.waiting_room_status === 'Waiting');
    const index = waitingInts.findIndex(i => i.application_id === app?.id);
    if (index !== -1) return index + 1;
    return interview?.waiting_room_status === 'In Progress' ? 0 : waitingInts.length + 1;
  };

  const getWaitTime = () => {
    const pos = getQueuePosition();
    if (pos === 0) return '0 دقيقة (حان دورك)';
    return `${pos * 15} دقيقة`;
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 text-right font-sans" dir="rtl">
      
      {/* GLOBAL NAVBAR */}
      <nav className="sticky top-0 z-40 bg-white border-b border-slate-200/80 shadow-xs px-4 py-3.5">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-sky-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <span className="text-sm font-extrabold text-sky-800 block">بوابة المرشح الذكية</span>
              <p className="text-[10px] text-slate-400 font-semibold">بواسطة ApplyWell Pro</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200/50 px-2.5 py-1 rounded-full font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              اتصال آمن وموثق
            </span>
            
            {onBackToAdmin && (
              <button 
                onClick={onBackToAdmin}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                لوحة الإدارة
              </button>
            )}

            {onLogout && (
              <button 
                onClick={onLogout}
                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-[10px] font-bold flex items-center gap-1 border border-rose-100"
              >
                <LogOut className="w-3.5 h-3.5" />
                خروج المرشح 🚪
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* PORTAL MAIN BODY CONTAINER */}
      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        
        {/* CANDIDATE INFORMATION CARD */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 relative overflow-hidden">
          <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-l from-sky-500 to-sky-700" />
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-sky-50 text-sky-700 border border-sky-100 font-bold flex items-center justify-center text-xl shadow-xs">
                {candidate.name.substring(0, 2)}
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">أهلاً بك، {candidate.name} 👋</h2>
                <div className="flex items-center gap-1.5 mt-1 text-slate-500 text-xs">
                  <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                  <span>الوظيفة المرشح لها: <strong>{job?.title || 'جاري التحميل...'}</strong></span>
                </div>
              </div>
            </div>

            <div className="shrink-0 bg-sky-50/80 border border-sky-100 px-3.5 py-1.5 rounded-xl">
              <span className="text-[10px] text-slate-400 font-bold block mb-0.5">حالة ملف الترشيح</span>
              <span className="text-xs font-extrabold text-sky-800">{resolveApplicationStatus()}</span>
            </div>
          </div>
        </div>

        {/* DETAILED INTERACTION PANEL */}
        {interview ? (
          <div className="space-y-6">
            
            {/* DYNAMIC CASE 1: ATTENDANCE CONFIRMATION */}
            {interview.waiting_room_status === 'Not Joined' && (
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 space-y-5">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <Calendar className="w-5 h-5 text-sky-600" />
                  <h3 className="text-sm font-extrabold text-slate-800">دعوة لحضور المقابلة الفنية المجدولة</h3>
                </div>

                <div className="p-4 bg-sky-50 text-sky-900 rounded-2xl border border-sky-100/50 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                  <div>
                    <span className="text-[9px] uppercase tracking-wider font-bold bg-sky-200/50 text-sky-800 px-2.5 py-0.5 rounded-full">تفاصيل الفرصة</span>
                    <h4 className="text-sm font-extrabold mt-1">{job?.title}</h4>
                    <p className="text-xs text-sky-700/80 mt-1">{job?.department} | {job?.location} | {job?.type}</p>
                  </div>
                  <div className="text-left w-full sm:w-auto">
                    <span className="text-xs font-bold text-slate-500 block">مدّة الجلسة:</span>
                    <span className="text-xs font-extrabold text-sky-950">{interview.duration} دقيقة</span>
                  </div>
                </div>

                <div className="space-y-3.5">
                  <span className="text-[10px] text-slate-400 block font-bold">الموعد المحدد للمقابلة:</span>
                  <div className="flex items-center gap-3.5 bg-slate-50 p-4 rounded-2xl border border-slate-200/60">
                    <div className="w-11 h-11 rounded-xl bg-white border border-slate-200 text-sky-600 flex flex-col items-center justify-center font-extrabold shadow-2xs">
                      <span className="text-[9px]">اليوم</span>
                      <span className="text-sm">29</span>
                    </div>
                    <div>
                      <p className="text-xs font-extrabold text-slate-800">الاثنين، 29 يونيو 2026</p>
                      <p className="text-xs text-slate-500 mt-0.5">الوقت: {interview.time} م (بتوقيت الرياض)</p>
                    </div>
                  </div>
                </div>

                {/* CONFIRMATION CTAS */}
                <div className="pt-2 border-t border-slate-100">
                  {attendanceConfirmed ? (
                    <div className="space-y-4">
                      <div className="p-4 bg-emerald-50 text-emerald-800 rounded-2xl border border-emerald-100/80 text-xs font-bold flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        <span>تم تأكيد حضورك بنجاح! يسعدنا حضورك اليوم في تمام الساعة {interview.time} م.</span>
                      </div>

                      {/* Day of check-in appears immediately upon confirmation */}
                      <div className="bg-amber-50/50 border border-amber-200/60 p-5 rounded-2xl text-right flex flex-col md:flex-row gap-4 justify-between items-center">
                        <div className="space-y-1">
                          <p className="text-xs font-extrabold text-amber-800 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                            <span>سجل حضورك الآن لساحة الانتظار الرقمية!</span>
                          </p>
                          <p className="text-[10px] text-slate-500 leading-relaxed">
                            يرجى الدخول إلى ساحة الانتظار لإشعار لجنة المقابلات بوجودك.
                          </p>
                        </div>
                        <button
                          onClick={handleCheckIn}
                          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-500/10 hover:scale-102 transition-all shrink-0"
                        >
                          دخول ساحة الانتظار (Check-in)
                        </button>
                      </div>
                    </div>
                  ) : attendanceDeclined ? (
                    <div className="p-4 bg-amber-50 text-amber-800 rounded-2xl border border-amber-100 text-xs font-bold flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-amber-600" />
                      <span>تم تسجيل اعتذارك وطلب إعادة جدولة المقابلة بنجاح. سنرسل لك الموعد الجديد فور اعتماده.</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        onClick={handleConfirmAttendance}
                        className="py-3 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm hover:shadow flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle className="w-4 h-4" />
                        نعم، سأحضر في الموعد المحدد ✅
                      </button>
                      <button
                        onClick={handleDeclineAttendance}
                        className="py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5"
                      >
                        <X className="w-4 h-4" />
                        اعتذر وأطلب موعد آخر
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* DYNAMIC CASE 2: LIVE QUEUE / WAITING ROOM */}
            {interview.waiting_room_status === 'Waiting' && (
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 space-y-5 animate-fade-in">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-amber-500" />
                    <h3 className="text-sm font-extrabold text-slate-800">ساحة الانتظار الرقمية الحية</h3>
                  </div>
                  <span className="flex h-2.5 w-2.5 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                  </span>
                </div>

                <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl text-center space-y-4">
                  <p className="text-xs text-slate-500">أنت الآن في طابور الانتظار الافتراضي. سيقوم المهندس بإدخالك فوراً بمجرد انتهاء المقابلة الجارية.</p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div className="bg-white p-4 rounded-xl border border-slate-100 text-center shadow-2xs">
                      <span className="text-[10px] text-slate-400 block font-bold mb-1">ترتيبك الحالي في الطابور:</span>
                      <span className="text-lg font-extrabold text-sky-800">يوجد {getQueuePosition()} مرشحين أمامك</span>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-slate-100 text-center shadow-2xs">
                      <span className="text-[10px] text-slate-400 block font-bold mb-1">الوقت المتبقي التقريبي:</span>
                      <span className="text-lg font-extrabold text-amber-600">{getWaitTime()}</span>
                    </div>
                  </div>
                </div>

                <div className="p-3.5 bg-sky-50 border border-sky-100 text-[11px] text-sky-800 rounded-xl leading-relaxed font-semibold text-center">
                  ⏱️ يرجى إبقاء هذه الصفحة مفتوحة. ستتلقى نغمة وتنبيه مباشر عند استدعائك للمقابلة.
                </div>
              </div>
            )}

            {/* DYNAMIC CASE 3: IN PROGRESS / CALL TO GOOGLE MEET */}
            {interview.waiting_room_status === 'In Progress' && (
              <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-3xl p-6 text-white shadow-xl space-y-5 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                    <Video className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold">حان دورك الآن للمقابلة! 🎉</h3>
                    <p className="text-xs text-emerald-100 mt-0.5">عبدالرحمن العتيبي في انتظارك في قاعة المقابلات الحية.</p>
                  </div>
                </div>

                <div className="p-4 bg-white/10 rounded-2xl text-xs text-emerald-50 leading-relaxed border border-white/10 text-right">
                  يرجى التأكد من جهوزية الكاميرا والميكروفون قبل النقر على زر الانضمام أدناه. نتمنى لك كل التوفيق!
                </div>

                <div className="pt-2 text-center">
                  <a 
                    href={interview.meeting_link || "https://meet.google.com/abc-defg-hij"} 
                    target="_blank" 
                    rel="noreferrer"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-white text-emerald-700 hover:bg-emerald-50 text-xs font-extrabold rounded-xl shadow-lg transition-all transform hover:scale-102"
                  >
                    <Camera className="w-4 h-4 text-emerald-700" />
                    الانضمام للمقابلة الحية (Google Meet) 🟢
                  </a>
                  <p className="text-[10px] text-emerald-200 mt-2">سيتم فتح مكالمة الفيديو الآمنة في نافذة جديدة بخصوصية تامة.</p>
                </div>
              </div>
            )}

            {/* DYNAMIC CASE 4: FINISHED */}
            {interview.waiting_room_status === 'Finished' && (
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 text-center space-y-4">
                <div className="w-12 h-12 bg-emerald-50 border border-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-extrabold text-slate-800">تمت المقابلة بنجاح!</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                  شكراً لتمثيلك الرائع ووقتك الثمين معنا اليوم. تم رفع تقييماتك بنجاح لقسم الموارد البشرية، وسيقوم المنسق بالتواصل معك لموافاتك بالنتائج والخطوات التالية قريباً جداً.
                </p>
              </div>
            )}

          </div>
        ) : (
          /* NO INTERVIEW SCHEDULED YET */
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 text-center space-y-4">
            <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
              <Info className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-extrabold text-slate-800">لا توجد مقابلات مجدولة حالياً</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              تم استلام طلبك ومستنداتك بنجاح. بمجرد جدولة مقابلة من قبل فريق العمل، ستتلقى إشعاراً مباشراً عبر الواتساب لتأكيد حضورك ومتابعة دورك هنا.
            </p>
          </div>
        )}

        {/* SUPPORT & AUTOMATED LIVE CHAT PANEL */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
          <div className="bg-slate-50 px-5 py-3 border-b border-slate-200/80 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-sky-600" />
              <span className="text-xs font-extrabold text-slate-700">الدعم الفني والآلي للمرشح</span>
            </div>
            <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-emerald-500"></span>
              مساعد الموارد البشرية نشط
            </span>
          </div>
          
          {/* CHAT MESSAGES PANEL */}
          <div className="p-4 h-[220px] overflow-y-auto space-y-3 bg-slate-50/50">
            {(candidateMessages[candidate.id] || []).length === 0 ? (
              <p className="text-center text-[10px] text-slate-400 py-12">ابدأ المحادثة مع المساعد الآلي لطرح أي استفسار بخصوص مقابلتك.</p>
            ) : (
              (candidateMessages[candidate.id] || []).map((msg, index) => (
                <div 
                  key={index}
                  className={`flex flex-col max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                    msg.sender === 'candidate'
                      ? 'bg-sky-600 text-white mr-auto rounded-tl-none shadow-xs'
                      : 'bg-white text-slate-800 ml-auto rounded-tr-none shadow-xs border border-slate-200/60'
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.text}</p>
                  <span className={`text-[8px] text-left block mt-1 ${msg.sender === 'candidate' ? 'text-sky-100' : 'text-slate-400'}`}>
                    {msg.time}
                  </span>
                </div>
              ))
            )}
          </div>

          {/* INPUT FORM */}
          <div className="p-3 border-t border-slate-200/80 flex gap-2 bg-white">
            <input 
              type="text"
              placeholder="طرح استفسار بخصوص الموعد، رابط اللقاء، أو كيفية الانتظار..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSendChat(); }}
              className="flex-1 px-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-sky-500 text-right"
            />
            <button
              onClick={handleSendChat}
              className="p-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl transition-colors shadow-xs"
              title="إرسال"
            >
              <Send className="w-4 h-4 transform rotate-180" />
            </button>
          </div>
        </div>

      </main>
    </div>
  );
}
