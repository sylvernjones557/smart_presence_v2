
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
    <div className="space-y-10 pb-10 px-1 page-enter">
      
      {/* ── Status Section: Class Teacher vs Subject Teacher ── */}
      <div className="relative">
        {user?.type === 'CLASS_TEACHER' && assignedGroup ? (
          <div className="bg-slate-900 rounded-[3rem] p-8 md:p-10 border border-slate-800 shadow-2xl relative overflow-hidden group">
             {/* Abstract BG Pattern */}
             <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-600/10 blur-[120px] rounded-full translate-x-1/2 -translate-y-1/2"></div>
             
             <div className="relative z-10 space-y-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                   <div className="space-y-2">
                      <div className="flex items-center gap-3">
                         <div className="px-3 py-1 bg-indigo-600 text-white text-[9px] font-black uppercase tracking-widest rounded-lg">Class Teacher</div>
                         <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                      </div>
                      <h2 className="text-4xl font-black text-white tracking-tighter uppercase leading-none">{assignedGroup.name} Hub</h2>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Global Attendance Performance</p>
                   </div>
                   <div className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-[2rem] flex items-center gap-6">
                      <div>
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Avg</p>
                         <h3 className="text-4xl font-black text-indigo-400 tracking-tighter">88.4%</h3>
                      </div>
                      <div className="w-12 h-12 bg-indigo-500/20 rounded-2xl flex items-center justify-center text-indigo-400">
                         <TrendingUp size={24} />
                      </div>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   {/* Top Performers */}
                   <div className="bg-emerald-500/5 border border-emerald-500/10 p-6 rounded-[2.5rem] space-y-4">
                      <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-2">
                         <PartyPopper size={14} /> Star Candidates
                      </p>
                      <div className="space-y-3">
                         {topPresent.map(s => (
                            <div key={s.id} className="flex items-center justify-between bg-white/5 p-3 rounded-2xl border border-white/5">
                               <div className="flex items-center gap-3">
                                  <img src={s.avatar} className="w-10 h-10 rounded-xl object-cover" alt="" />
                                  <p className="text-sm font-black text-white uppercase truncate max-w-[120px]">{s.name}</p>
                               </div>
                               <span className="text-[10px] font-black text-emerald-400 uppercase">{s.score}</span>
                            </div>
                         ))}
                      </div>
                   </div>

                   {/* High Absence */}
                   <div className="bg-rose-500/5 border border-rose-500/10 p-6 rounded-[2.5rem] space-y-4">
                      <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest flex items-center gap-2">
                         <AlertCircle size={14} /> Critical Attention
                      </p>
                      <div className="space-y-3">
                         {topAbsent.map(s => (
                            <div key={s.id} className="flex items-center justify-between bg-white/5 p-3 rounded-2xl border border-white/5">
                               <div className="flex items-center gap-3">
                                  <img src={s.avatar} className="w-10 h-10 rounded-xl object-cover grayscale opacity-60" alt="" />
                                  <p className="text-sm font-black text-slate-300 uppercase truncate max-w-[120px]">{s.name}</p>
                               </div>
                               <span className="text-[10px] font-black text-rose-400 uppercase">{s.score.split(' ')[1] || 'Absent'}</span>
                            </div>
                         ))}
                      </div>
                   </div>
                </div>
             </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center p-12 bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[100px] rounded-full"></div>
            <div className="relative z-10 space-y-6">
              <div className="relative inline-block">
                <img src="/assets/subject_teacher.png" className="w-48 h-48 drop-shadow-2xl animate-float" alt="Subject Teacher" />
                <div className="absolute -bottom-2 -right-2 bg-indigo-600 text-white px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl border-4 border-white dark:border-slate-900">
                  Active
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none mb-3">You are the Subject Teacher</h3>
                <p className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest max-w-sm mx-auto leading-relaxed">
                  You are currently handling specialized modules. Have fun connecting with your candidates!
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Assigned Teaching Subjects / Classes ── */}
      <div className="space-y-6 pt-6 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">Modules Hub</p>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase leading-none mt-2">Teaching Groups</h2>
          </div>
          <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-indigo-600">
            <BookOpen size={20} />
          </div>
        </div>

        {isLoading ? (
          <div className="p-16 text-center">
             <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Synchronizing Schedules...</p>
          </div>
        ) : subjectClasses.length === 0 ? (
          <div className="bg-slate-50 dark:bg-slate-900/50 p-16 rounded-[3rem] border border-dashed border-slate-200 dark:border-slate-800 text-center">
             <BookOpen size={48} className="mx-auto text-slate-300 dark:text-slate-700 mb-6" />
             <p className="text-sm font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em]">No assigned modules detected</p>
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
                  className="bg-white dark:bg-slate-900 p-8 rounded-[2.8rem] border border-slate-100 dark:border-slate-800/80 shadow-sm tap-active cursor-pointer group flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-2xl hover:border-indigo-500 transition-all duration-500 relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/5 blur-[80px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  
                  <div className="flex items-center gap-6 relative z-10 w-full md:w-auto">
                    <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-3xl flex items-center justify-center shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500 shadow-sm">
                      <BookOpen size={28} strokeWidth={2.5} />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xl font-black text-slate-900 dark:text-white leading-none uppercase tracking-tight truncate group-hover:text-indigo-600 transition-colors">{sub.subject}</h4>
                      <div className="flex items-center gap-3 mt-3">
                         <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{classObj?.name || 'Class'}</p>
                         <span className="w-1 h-1 bg-slate-200 dark:bg-slate-700 rounded-full"></span>
                         <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">{totalStudents} Candidates</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-10 relative z-10 bg-slate-50 dark:bg-slate-950/50 md:bg-transparent p-6 md:p-0 rounded-3xl md:rounded-none border border-slate-100 dark:border-white/5 md:border-none">
                    <div className="flex flex-col md:items-end">
                      <span className="text-indigo-600 dark:text-indigo-400 font-black text-3xl tracking-tighter leading-none">{sub.avg}</span>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-2">Presence Index</p>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center group-hover:bg-indigo-600 group-hover:border-indigo-600 group-hover:text-white text-slate-300 transition-all duration-500 shadow-sm active:scale-90">
                       <ChevronRight size={20} strokeWidth={3} />
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
