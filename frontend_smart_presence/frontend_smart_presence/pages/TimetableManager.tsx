
import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Clock, User, BookOpen, AlertCircle, CheckCircle2, X, ChevronRight, Sparkles, Filter } from 'lucide-react';
import { data } from '../services/api';
import { useToast } from '../components/Toast';
import { BackButton } from '../constants';

interface TimetableManagerProps {
  onBack: () => void;
  groupList: any[];
}

const TimetableManager: React.FC<TimetableManagerProps> = ({ onBack, groupList }) => {
  const toast = useToast();
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const [selectedDay, setSelectedDay] = useState(1); // 1 = Mon
  const [selectedClassId, setSelectedClassId] = useState<string>(groupList[0]?.id || '');
  const [timetableEntries, setTimetableEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentSlot, setCurrentSlot] = useState<{ period: number; day: number } | null>(null);
  const [subjectInput, setSubjectInput] = useState('');
  const [availability, setAvailability] = useState<{ recommended: any[], available: any[], busy: any[] }>({
    recommended: [], available: [], busy: []
  });
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);

  // Fetch entries for selected day/class
  const fetchEntries = async () => {
    if (!selectedClassId) return;
    setLoading(true);
    try {
      const result = await data.getTimetable({ group_id: selectedClassId, day_of_week: selectedDay });
      setTimetableEntries(result);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, [selectedDay, selectedClassId]);

  const handleOpenAdd = (period: number) => {
    setCurrentSlot({ period, day: selectedDay });
    setSubjectInput('');
    setAvailability({ recommended: [], available: [], busy: [] });
    setIsModalOpen(true);
  };

  // Debounced check for availability
  useEffect(() => {
    const timer = setTimeout(() => {
      if (subjectInput.length > 1) {
        checkWhosFree(subjectInput);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [subjectInput]);

  // Check backend for who's free
  const checkWhosFree = async (subject: string) => {
    if (!currentSlot) return;
    setIsCheckingAvailability(true);
    try {
      const res = await data.checkStaffAvailability(currentSlot.day, currentSlot.period, subject);
      setAvailability(res);
    } catch (e) {
      console.error(e);
    } finally {
      setIsCheckingAvailability(false);
    }
  };

  const handleAssign = async (staffId: string) => {
    if (!currentSlot || !subjectInput) return;
    try {
      await data.addTimetable({
        group_id: selectedClassId,
        day_of_week: currentSlot.day,
        period: currentSlot.period,
        subject: subjectInput,
        staff_id: staffId,
        start_time: "09:00", // Defaulting for now
        end_time: "09:45"
      });
      toast.showToast('success', 'Assigned Successfully', `Period ${currentSlot.period} is now linked to the teacher.`);
      setIsModalOpen(false);
      fetchEntries();
    } catch (e: any) {
      toast.showToast('error', 'Assignment Failed', e.response?.data?.detail || 'Overlap detected');
    }
  };

  const handleDelete = async (entryId: string) => {
    try {
      await data.deleteTimetable(entryId);
      toast.showToast('info', 'Slot Cleared', 'The schedule entry has been removed.');
      fetchEntries();
    } catch (e) {
      toast.showToast('error', 'Failed', 'Could not delete entry');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-32">
      <div className="flex items-center justify-between px-1">
        <BackButton onClick={onBack} />
        <div className="text-right">
          <p className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Master Control</p>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase mt-1 leading-none tracking-tighter">Schedule Hub</h2>
        </div>
      </div>

      {/* Class Picker Horizontal Scroll */}
      <div className="flex gap-3 overflow-x-auto no-scrollbar py-2 -mx-4 px-4">
        {groupList.map(g => (
          <button
            key={g.id}
            onClick={() => setSelectedClassId(g.id)}
            className={`px-6 py-4 rounded-3xl text-[11px] font-black uppercase tracking-widest transition-all shrink-0 border-2 ${
              selectedClassId === g.id 
              ? 'bg-indigo-600 border-indigo-500 text-white shadow-xl shadow-indigo-600/20 scale-105' 
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 hover:border-indigo-400'
            }`}
          >
            {g.name}
          </button>
        ))}
      </div>

      {/* Day Picker Matrix (Compact for Mobile) */}
      <div className="bg-slate-100 dark:bg-slate-900/50 p-1 rounded-2xl border border-slate-200 dark:border-slate-800 flex mx-1">
        {days.map((day, i) => (
          <button
            key={day}
            onClick={() => setSelectedDay(i + 1)}
            className={`flex-1 py-3 rounded-xl text-[9px] font-black tracking-widest transition-all ${
              selectedDay === i + 1 
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
              : 'text-slate-400 dark:text-slate-600'
            }`}
          >
            {day.substring(0, 3).toUpperCase()}
          </button>
        ))}
      </div>

      {/* Slots Grid */}
      <div className="space-y-4 px-1">
        {[1, 2, 3, 4, 5, 6].map(period => {
          const entry = timetableEntries.find(e => e.period === period);
          return (
            <div key={period} className="relative">
              {entry ? (
                <div className="bg-white dark:bg-slate-900 p-4 rounded-[1.8rem] border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-3 sm:gap-6 group hover:border-indigo-500 transition-all">
                  <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 font-black text-base sm:text-lg border border-indigo-100 dark:border-indigo-800/50 shrink-0">
                    {period}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm sm:text-lg font-black text-slate-900 dark:text-white uppercase leading-tight truncate">{entry.subject}</h4>
                    <p className="text-[9px] sm:text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mt-1 flex items-center gap-1.5 truncate">
                       <User size={10} className="text-indigo-600" /> {entry.staff_name || 'Staff Linked'}
                    </p>
                  </div>
                  <button 
                    onClick={() => handleDelete(entry.id)}
                    className="w-8 h-8 sm:w-10 sm:h-10 bg-rose-50 dark:bg-rose-900/20 text-rose-500 rounded-lg sm:rounded-xl flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all tap-active shrink-0"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => handleOpenAdd(period)}
                  className="w-full bg-slate-50/10 dark:bg-slate-900/10 border border-dashed border-slate-300 dark:border-slate-800 py-4 sm:py-8 rounded-[1.8rem] flex flex-row sm:flex-col items-center justify-center gap-3 text-slate-400 dark:text-slate-600 hover:border-indigo-500 hover:text-indigo-500 transition-all tap-active group"
                >
                  <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-lg sm:rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                    <Plus size={16} />
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-[0.2em]">Open Slot {period}</span>
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Assignment Modal (Glassmorphism) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[2000] flex items-end sm:items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-300">
           <div className="bg-white dark:bg-[#020617] w-full max-w-lg rounded-[3rem] p-8 border border-slate-200 dark:border-white/10 shadow-2xl space-y-8 animate-in slide-in-from-bottom-10 duration-500 max-h-[90vh] overflow-y-auto no-scrollbar">
              <div className="flex justify-between items-start">
                 <div>
                   <h3 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">Assign Slot</h3>
                   <p className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-2">
                     Period {currentSlot?.period} • {days[(currentSlot?.day || 1) - 1]}
                   </p>
                 </div>
                 <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 bg-slate-100 dark:bg-slate-900 rounded-xl flex items-center justify-center text-slate-400">
                   <X size={20} />
                 </button>
              </div>

              <div className="space-y-4">
                 <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Subject Title</p>                  <div className="relative">
                     <BookOpen size={20} className="absolute left-6 top-1/2 -translate-y-1/2 text-indigo-600" />
                     <input 
                       type="text" 
                       placeholder="e.g. ENGLISH, TAMIL, MATHS" 
                       value={subjectInput}
                       onChange={(e) => setSubjectInput(e.target.value.toUpperCase())}
                       className="w-full bg-slate-50 dark:bg-slate-900/50 border-2 border-slate-200 dark:border-slate-800 py-6 pl-16 pr-6 rounded-3xl font-black text-sm uppercase tracking-tight focus:border-indigo-500 focus:outline-none transition-all"
                     />
                  </div>
               </div>

               {/* Stress-Free Logic Display */}
               <div className="space-y-6">
                  <div className="flex items-center justify-between">
                     <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Staff Recommendations</p>
                     {isCheckingAvailability && <Sparkles size={16} className="text-indigo-500 animate-pulse" />}
                  </div>

                  <div className="space-y-4">
                     {/* Specialist Staff */}
                     {availability.recommended.map(staff => (
                        <button 
                          key={staff.id} 
                          onClick={() => handleAssign(staff.id)}
                          className="w-full p-6 rounded-[2rem] flex items-center gap-4 text-left shadow-lg transition-all hover:scale-[1.02] tap-active border bg-indigo-600 text-white shadow-indigo-600/20 border-indigo-500"
                        >
                           <img src={staff.avatar} className="w-12 h-12 rounded-xl object-cover border-2 border-white/20" alt=""/>
                           <div className="flex-1">
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className="text-[9px] font-black uppercase tracking-widest bg-white/20 px-1.5 py-0.5 rounded">PREFERRED</span>
                                <p className="text-[9px] font-bold uppercase text-white/70 tracking-tighter truncate">
                                  Expert in {staff.specializations[0]}
                                </p>
                              </div>
                              <h5 className="font-black text-base uppercase leading-none">{staff.name}</h5>
                           </div>
                           <CheckCircle2 size={24} className="text-white/20" />
                        </button>
                     ))}

                    {/* General Available Staff */}
                    {availability.available.map(staff => (
                       <button 
                         key={staff.id} 
                         onClick={() => handleAssign(staff.id)}
                         className="w-full p-6 bg-slate-50 dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 flex items-center gap-4 text-left hover:border-indigo-400 transition-all tap-active"
                       >
                          <img src={staff.avatar} className="w-12 h-12 rounded-xl object-cover border border-slate-200 dark:border-slate-800" alt=""/>
                          <div className="flex-1">
                             <div className="flex items-center gap-2 mb-0.5">
                               <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">SUBSTITUTE</span>
                               <p className="text-[9px] font-bold uppercase text-slate-500 tracking-tighter truncate">
                                 {staff.specializations.filter(Boolean).join(' • ') || 'Generalist'}
                               </p>
                             </div>
                             <h5 className="font-black text-base uppercase leading-none text-slate-900 dark:text-white">{staff.name}</h5>
                          </div>
                          <ChevronRight size={18} className="text-slate-300" />
                       </button>
                    ))}

                    {/* Busy Staff */}
                    {availability.busy.map(staff => (
                       <div key={staff.id} className="w-full p-6 bg-slate-50/50 dark:bg-white/5 rounded-[2rem] border border-slate-100 dark:border-white/5 flex items-center gap-4 text-left opacity-60 grayscale">
                          <img src={staff.avatar} className="w-12 h-12 rounded-xl object-cover" alt=""/>
                          <div className="flex-1">
                             <p className="text-[10px] font-black uppercase text-rose-500 tracking-widest mb-0.5">BUSY WITH {staff.busy_with}</p>
                             <h5 className="font-black text-base uppercase leading-none text-slate-400">{staff.name}</h5>
                          </div>
                          <AlertCircle size={18} className="text-rose-500/50" />
                       </div>
                    ))}

                    {!isCheckingAvailability && availability.recommended.length === 0 && availability.available.length === 0 && availability.busy.length === 0 && (
                       <div className="text-center py-10 opacity-40">
                          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">Enter a subject to see smart suggestions</p>
                       </div>
                    )}
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default TimetableManager;
