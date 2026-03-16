
import React, { useState, useEffect } from 'react';
import { Users, TrendingUp, CheckCircle2, AlertCircle, Layers, PartyPopper, Smile } from 'lucide-react';
import { MOCK_CLASSES } from '../constants';
import { data } from '../services/api';

const MyClassPage: React.FC<{ user: any, studentList: any[], groupList?: any[] }> = ({ user, studentList, groupList = MOCK_CLASSES }) => {
  const classObj = groupList.find(c => c.id === user.assignedClassId);
  const classStudents = studentList.filter(s => s.classId === user.assignedClassId);

  const [topPresent, setTopPresent] = useState<{name: string; score: string; id: string; avatar: string}[]>([]);
  const [topAbsent, setTopAbsent] = useState<{name: string; score: string; id: string; avatar: string}[]>([]);
  const [attendanceRate, setAttendanceRate] = useState<string>('--');
  const [absentCount, setAbsentCount] = useState<number>(0);
  const [attendanceLoaded, setAttendanceLoaded] = useState(false);

  // If the user is a subject teacher, show the subject teacher banner
  if (user?.type !== 'CLASS_TEACHER') {
    return (
      <div className="space-y-6 page-enter px-2 pt-6">
        <div className="bg-gradient-to-br from-indigo-600 to-purple-600 text-white p-10 rounded-[3rem] shadow-2xl shadow-indigo-600/20 relative overflow-hidden flex flex-col sm:flex-row items-center gap-8 justify-center sm:justify-start text-center sm:text-left transition-transform">
           <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-[80px] rounded-full translate-x-1/2 -translate-y-1/2"></div>
           <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 blur-[60px] rounded-full -translate-x-1/2 translate-y-1/2"></div>

           <div className="w-24 h-24 rounded-[2rem] bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center shrink-0 shadow-lg shadow-black/10 rotate-3 z-10">
              <PartyPopper size={40} className="text-white drop-shadow-md" />
           </div>
           
           <div className="z-10">
              <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight mb-2">You are a Subject Teacher!</h2>
              <p className="text-indigo-100 font-medium text-sm max-w-sm">
                You are not assigned as a Class Teacher. Enjoy the flexibility, focus on your subjects, and have fun! <Smile className="inline w-4 h-4 ml-1 mb-1" />
              </p>
              <div className="mt-4 inline-flex items-center gap-2 px-4 py-1.5 bg-black/20 rounded-xl border border-white/10 text-[10px] font-black uppercase tracking-widest">
                 Role: {user?.type?.replace('_', ' ')}
              </div>
           </div>
        </div>
      </div>
    );
  }

  // Show proper message if CLASS_TEACHER but no class assigned
  if (!user.assignedClassId || !classObj) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8 page-enter px-4">
        {/* Decorative icon */}
        <div className="relative">
          <div className="w-32 h-32 bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-900 rounded-[2.5rem] flex items-center justify-center shadow-inner border border-slate-200 dark:border-slate-700">
            <Users size={48} className="text-slate-300 dark:text-slate-700" strokeWidth={1.5} />
          </div>
          {/* Floating badge */}
          <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl flex items-center justify-center shadow-lg">
            <Layers size={18} className="text-slate-400 dark:text-slate-500" />
          </div>
        </div>

        {/* Message */}
        <div className="space-y-3 max-w-xs">
          <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
            No Group Assigned
          </h3>
          <p className="text-sm text-slate-400 dark:text-slate-500 leading-relaxed">
            You haven't been assigned to a group yet. Please contact the admin to get assigned.
          </p>
        </div>

        {/* Info card */}
        <div className="w-full max-w-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
              <AlertCircle size={16} className="text-indigo-500 dark:text-indigo-400" />
            </div>
            <div className="text-left">
              <p className="text-[11px] font-bold text-slate-900 dark:text-white uppercase tracking-wide">
                How to get assigned
              </p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 leading-relaxed">
                Your administrator can assign you to a group from the Settings panel. Once assigned, you'll see your group details here.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Format class label
  const classLabel = classObj.code ? `${classObj.name} (${classObj.code})` : classObj.name;

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        const weeklyData = await data.getStaffActivity(user.id);
        if (weeklyData.week && weeklyData.week.length > 0) {
          const totalPresent = weeklyData.week.reduce((sum: number, d: any) => sum + (d.total_present || 0), 0);
          const totalStudents = weeklyData.week.reduce((sum: number, d: any) => sum + (d.total_students || 0), 0);
          const rate = totalStudents > 0 ? (totalPresent / totalStudents * 100).toFixed(0) : '0';
          setAttendanceRate(`${rate}%`);
          // Use latest day's absent count
          const latest = weeklyData.week[weeklyData.week.length - 1];
          setAbsentCount((latest.total_students || 0) - (latest.total_present || 0));
        }

        if (classStudents.length > 0) {
          const registered = classStudents.filter((s: any) => s.faceDataRegistered);
          const unregistered = classStudents.filter((s: any) => !s.faceDataRegistered);
          
          setTopPresent(registered.slice(0, 3).map((s: any) => ({
             name: s.name, score: '100%', id: s.id, avatar: s.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(s.name)}&background=10B981&color=fff`
          })));
          setTopAbsent(unregistered.slice(0, 3).map((s: any) => ({
             name: s.name, score: 'High Absence', id: s.id, avatar: s.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(s.name)}&background=EF4444&color=fff`
          })));
        }
      } catch (e) {
        console.error('Failed to fetch attendance data', e);
      } finally {
        setAttendanceLoaded(true);
      }
    };
    fetchAttendance();
  }, [user.id, classStudents.length]);

  return (
    <div className="space-y-8 page-enter pt-4 px-2">
      <div className="animate-in fade-in slide-in-from-top-4 duration-700">
        <p className="text-[11px] font-black text-indigo-500 uppercase tracking-widest flex items-center gap-2 mb-1">
          <TrendingUp size={14} /> Class Teacher Overview
        </p>
        <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase leading-none mt-1 tracking-tighter">
          {classLabel}
        </h2>
      </div>

      <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[80px] rounded-full translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500/5 blur-[100px] rounded-full translate-x-1/2 translate-y-1/2"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row gap-8 justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Overall Class Performance</h3>
            <div className="flex items-end gap-3">
              <p className="text-6xl font-black text-emerald-600 dark:text-emerald-500 tracking-tighter leading-none">{attendanceRate}</p>
              <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest bg-emerald-50 dark:bg-emerald-900/40 px-3 py-1.5 rounded-xl border border-emerald-500/10 mb-2">{attendanceLoaded ? 'Weekly Average' : 'Loading...'}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-2 min-w-[200px]">
            <div className="flex items-center gap-3 px-5 py-4 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm">
              <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
              <div className="flex-1">
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Enrolled</p>
                <p className="text-sm font-black text-slate-900 dark:text-white mt-0.5">{classStudents.length} Students</p>
              </div>
            </div>
            <div className="flex items-center gap-3 px-5 py-4 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm">
              <AlertCircle size={18} className="text-rose-500 shrink-0" />
              <div className="flex-1">
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Absences</p>
                <p className="text-sm font-black text-slate-900 dark:text-white mt-0.5">{absentCount} Recent</p>
              </div>
            </div>
          </div>
        </div>

        {/* Best Students & High Absence */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10 relative z-10 pt-8 border-t border-slate-100 dark:border-slate-800/50">
           {/* Best 3 */}
           <div className="space-y-4">
              <h4 className="text-[10px] font-black text-emerald-600 dark:text-emerald-500 uppercase tracking-[0.2em] flex items-center gap-2">
                <CheckCircle2 size={14} /> Top 3 Members (Attendance)
              </h4>
              <div className="space-y-3">
                {topPresent.length > 0 ? topPresent.map((std, i) => (
                  <div key={std.id} className="flex items-center gap-4 bg-white dark:bg-slate-900/80 p-4 rounded-[1.5rem] border border-slate-100 dark:border-white/5 shadow-sm">
                    <img src={std.avatar} className="w-10 h-10 rounded-xl object-cover shrink-0 border border-slate-200 dark:border-slate-800" alt={std.name} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{std.name}</p>
                      <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mt-0.5">{std.score} Present</p>
                    </div>
                  </div>
                )) : (
                   <p className="text-xs text-slate-400 p-2">Not enough data.</p>
                )}
              </div>
           </div>

           {/* High Absences */}
           <div className="space-y-4">
              <h4 className="text-[10px] font-black text-rose-600 dark:text-rose-500 uppercase tracking-[0.2em] flex items-center gap-2">
                <AlertCircle size={14} /> High Absent Rate
              </h4>
              <div className="space-y-3">
                {topAbsent.length > 0 ? topAbsent.map((std, i) => (
                  <div key={std.id} className="flex items-center gap-4 bg-white dark:bg-slate-900/80 p-4 rounded-[1.5rem] border border-slate-100 dark:border-white/5 shadow-sm">
                     <img src={std.avatar} className="w-10 h-10 rounded-xl object-cover shrink-0 border border-slate-200 dark:border-slate-800" alt={std.name} />
                     <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{std.name}</p>
                      <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest mt-0.5">{std.score}</p>
                    </div>
                  </div>
                )) : (
                   <p className="text-xs text-slate-400 p-2">No high absences!</p>
                )}
              </div>
           </div>
        </div>
      </div>

      <div className="space-y-4 mt-8">
        <h3 className="text-[12px] font-bold text-slate-900 dark:text-white uppercase tracking-widest px-2">Member List</h3>
        {classStudents.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 text-center shadow-sm">
            <Users size={32} className="text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-400 dark:text-slate-500">No members enrolled in this group yet</p>
            <p className="text-[10px] text-slate-300 dark:text-slate-600 mt-1 uppercase tracking-widest">Members can be added from admin panel</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {classStudents.map(student => (
              <div key={student.id} className="bg-white dark:bg-slate-900 p-5 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4 tap-active hover:border-indigo-500/50 transition-colors">
                <img src={student.avatar} className="w-12 h-12 rounded-xl object-cover border border-slate-200 dark:border-slate-800 shadow-sm" alt="" />
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-black text-slate-900 dark:text-white truncate leading-none mb-1.5">{student.name}</h4>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">{student.rollNo}</p>
                </div>
                <div className={`px-3 py-1.5 rounded-xl text-[9px] font-black tracking-widest uppercase border ${student.faceDataRegistered ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800/30' : 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-800/30'}`}>{student.faceDataRegistered ? 'Registered' : 'No Face Data'}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyClassPage;
