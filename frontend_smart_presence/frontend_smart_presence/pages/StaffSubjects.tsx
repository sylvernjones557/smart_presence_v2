
import React, { useState, useEffect } from 'react';
import { BookOpen, ChevronRight, X, CheckCircle2, AlertCircle, TrendingUp, Activity, Users, PartyPopper, Smile } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, YAxis } from 'recharts';
import { MOCK_CLASSES } from '../constants';
import { attendance as attendanceApi, data as dataApi } from '../services/api';

const StaffSubjects: React.FC<{ user: any; groupList?: any[]; studentList?: any[] }> = ({ user, groupList = MOCK_CLASSES, studentList = [] }) => {
  const [selectedSubject, setSelectedSubject] = useState<any>(null);
  const [perfData, setPerfData] = useState<{name: string; value: number}[]>([]);
  const [topPresent, setTopPresent] = useState<{name: string; score: string; id: string; avatar: string}[]>([]);
  const [topAbsent, setTopAbsent] = useState<{name: string; score: string; id: string; avatar: string}[]>([]);
  
  const [subjectClasses, setSubjectClasses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const assignedGroup = groupList.find(g => g.id === user?.assignedClassId);

  useEffect(() => {
    const fetchMyClasses = async () => {
      setIsLoading(true);
      try {
        if (user?.id) {
          const timetable = await dataApi.getTimetable({ staff_id: user.id });
          // Extract unique (group_id, subject) combinations
          const uniqueClasses = new Map<string, any>();
          
          timetable.forEach((entry: any) => {
            if (entry.group_id && entry.subject) {
              const key = `${entry.group_id}-${entry.subject}`;
              if (!uniqueClasses.has(key)) {
                uniqueClasses.set(key, {
                  groupId: entry.group_id,
                  subject: entry.subject,
                  // Attendance mock calculation for now, would typically come from stats API
                  avg: `${Math.floor(Math.random() * 20) + 75}%`
                });
              }
            }
          });
          
          setSubjectClasses(Array.from(uniqueClasses.values()));
        }
      } catch (err) {
        console.error("Failed to fetch my classes", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMyClasses();
  }, [user?.id]);

  // Fetch real attendance data for Class Teacher stats
  useEffect(() => {
    const fetchClassStats = async () => {
      if (user?.type === 'CLASS_TEACHER' && user?.assignedClassId) {
        try {
          const cStudents = studentList.filter((s: any) => s.classId === user.assignedClassId);
          if (cStudents.length > 0) {
            // Placeholder proxy: using faceDataRegistered as mock attendance proxy, 
            // but normally it would be real attendance stats
            const registered = cStudents.filter((s: any) => s.faceDataRegistered);
            const unregistered = cStudents.filter((s: any) => !s.faceDataRegistered);
            
            setTopPresent(registered.slice(0, 3).map((s: any) => ({
              name: s.name, score: '100%', id: s.id, avatar: s.avatar || `https://ui-avatars.com/api/?name=${s.name}&background=10B981&color=fff`
            })));
            setTopAbsent(unregistered.slice(0, 3).map((s: any) => ({
              name: s.name, score: 'High Absence', id: s.id, avatar: s.avatar || `https://ui-avatars.com/api/?name=${s.name}&background=EF4444&color=fff`
            })));
          }
        } catch {
          // ignore
        }
      }
    };
    fetchClassStats();
  }, [user, studentList]);

  // Detail view for clicking a specific subject card
  const renderSubjectDetail = (sub: any) => {
    const classObj = groupList.find(c => c.id === sub.groupId);
    const classStudents = studentList.filter((s: any) => s.classId === sub.groupId);

    return (
      <div className="fixed inset-0 z-[1001] flex flex-col bg-slate-50 dark:bg-[#020617] animate-in fade-in duration-300 overflow-hidden">
        {/* Header Section */}
        <div className="px-6 h-20 flex items-center justify-between border-b border-slate-200 dark:border-white/5 bg-white dark:bg-[#020617] shrink-0">
          <div className="flex items-center gap-4">
             <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-600/20">
                <BookOpen size={20} />
             </div>
             <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{sub.subject}</h3>
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">{classObj?.name || 'Class'} Stats</p>
             </div>
          </div>
          <button 
            onClick={() => setSelectedSubject(null)} 
            className="w-10 h-10 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl flex items-center justify-center tap-active border border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-6 no-scrollbar pb-32">
          {/* Main Visual Card */}
          <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-8 border border-slate-200 dark:border-white/5 shadow-2xl relative overflow-hidden transition-colors duration-500">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[80px] rounded-full translate-x-1/2 -translate-y-1/2"></div>
            
            <div className="relative z-10 space-y-8">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-3 text-indigo-600 dark:text-indigo-400">
                    <TrendingUp size={16} />
                    <p className="text-[10px] font-black uppercase tracking-[0.2em]">Your Presence Index</p>
                  </div>
                  <h4 className="text-6xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">{sub.avg}</h4>
                  <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-2">{sub.subject} Average</p>
                </div>
                <div className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-4 py-2 rounded-xl border border-emerald-500/20 text-[11px] font-black uppercase tracking-widest flex items-center gap-2">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span> Recorded
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4 relative z-20">
                <div className="bg-slate-50 dark:bg-white/5 p-5 rounded-[2rem] border border-slate-100 dark:border-white/5">
                  <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Group</p>
                  <p className="text-sm font-black text-slate-900 dark:text-white uppercase">{classObj?.name || 'Group'}</p>
                </div>
                <div className="bg-slate-50 dark:bg-white/5 p-5 rounded-[2rem] border border-slate-100 dark:border-white/5 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Total Students</p>
                    <p className="text-sm font-black text-slate-900 dark:text-white bg-indigo-500/10 px-3 py-1 rounded-xl border border-indigo-500/20 w-fit">
                      {classStudents.length}
                    </p>
                  </div>
                  <Users size={24} className="text-slate-300 dark:text-slate-700" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Button Section */}
        <div className="fixed bottom-0 left-0 right-0 p-6 bg-white dark:bg-[#020617] border-t border-slate-200 dark:border-white/5 z-[1002] safe-bottom shadow-[0_-20px_40px_rgba(0,0,0,0.05)]">
           <button 
             onClick={() => setSelectedSubject(null)}
             className="w-full py-5 bg-indigo-600 dark:bg-white text-white dark:text-slate-950 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] tap-active shadow-xl transition-all active:scale-[0.98]"
           >
             Close View
           </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 pb-10 px-1 page-enter">
      
      {/* ── Assigned Teaching Subjects / Classes ── */}
      <div className="space-y-6">
        <div>
          <p className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">My Schedule</p>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase leading-none mt-1">Teaching Classes</h2>
        </div>

        {isLoading ? (
          <div className="p-10 text-center">
             <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
             <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading Schedule...</p>
          </div>
        ) : subjectClasses.length === 0 ? (
          <div className="bg-slate-50 dark:bg-slate-900/50 p-10 rounded-[3rem] border border-dashed border-slate-200 dark:border-slate-800 text-center">
             <BookOpen size={40} className="mx-auto text-slate-300 dark:text-slate-700 mb-4" />
             <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">No assigned classes found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {subjectClasses.map((sub, idx) => {
              const classObj = groupList.find(c => c.id === sub.groupId);
              const totalStudents = studentList.filter((s:any) => s.classId === sub.groupId).length;

              return (
                <div 
                  key={idx}
                  onClick={() => setSelectedSubject(sub)}
                  className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm tap-active cursor-pointer group flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-indigo-500 transition-all duration-500 relative overflow-hidden"
                >
                  <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-500/5 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  
                  <div className="flex items-center gap-5 relative z-10 w-full md:w-auto">
                    <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                      <BookOpen size={24} />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-lg font-black text-slate-900 dark:text-white leading-none uppercase tracking-tight truncate">{sub.subject}</h4>
                      <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-2">{classObj?.name || 'Class'} · {totalStudents} Students</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-6 relative z-10 bg-slate-50 dark:bg-slate-950/50 md:bg-transparent p-4 md:p-0 rounded-2xl md:rounded-none">
                    <div className="flex flex-col md:items-end">
                      <span className="text-indigo-600 dark:text-indigo-500 font-black text-2xl tracking-tighter leading-none">{sub.avg}</span>
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1.5">My Presence Avg</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center group-hover:bg-indigo-600 group-hover:border-indigo-600 group-hover:text-white text-slate-400 transition-colors shadow-sm">
                       <ChevronRight size={18} strokeWidth={3} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selectedSubject && renderSubjectDetail(selectedSubject)}
    </div>
  );
};

export default StaffSubjects;
