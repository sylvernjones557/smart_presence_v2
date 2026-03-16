
import React, { useState, useEffect } from 'react';
import { PlayCircle, MapPin, CalendarDays, Layers, Users, Sparkles, Table2, X, Clock, ChevronDown, Radio, BookOpen } from 'lucide-react';
import { QuickAction, SummaryCard } from './Dashboard';
import { isTestClass, PERIOD_TIMINGS, getPeriodTime, getCurrentPeriod } from '../constants';
import { data as dataApi } from '../services/api';

interface StaffHomeProps {
  user: any;
  onNavigate: (path: string, params?: any) => void;
  groupList?: any[];
}

const StaffHome: React.FC<StaffHomeProps> = ({ user, onNavigate, groupList = [] }) => {
  const [showTimetable, setShowTimetable] = useState(false);
  const [weeklyTimetable, setWeeklyTimetable] = useState<any[]>([]);
  const [timetableLoading, setTimetableLoading] = useState(false);
  const [liveClass, setLiveClass] = useState<{ subject: string; group_name: string; group_id: string; period: number; time: string } | null>(null);
  const [liveLoading, setLiveLoading] = useState(true);

  const now = new Date();
  const today = now.toLocaleDateString('en-US', { weekday: 'long' });
  const todayDate = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  
  const assignedGroupId = user?.assignedClassId || '';
  const assignedGroup = groupList.find((g: any) => g.id === assignedGroupId);
  const groupDisplayName = assignedGroup ? assignedGroup.name : (assignedGroupId || 'Unassigned');
  const isReady = Boolean(assignedGroupId) || Boolean(liveClass);
  const isTest = isTestClass(assignedGroup);

  const handleStartAttendance = () => {
    // Priority 1: Current live class period
    if (liveClass) {
      onNavigate('/attendance', { classId: liveClass.group_id });
    } else if (assignedGroupId) {
       // Priority 2: Assigned class teacher group
      onNavigate('/attendance', { classId: assignedGroupId });
    }
  };

  // Fetch live class status
  useEffect(() => {
    const checkLiveStatus = async () => {
      setLiveLoading(true);
      try {
        const currentPeriod = getCurrentPeriod();
        if (!currentPeriod || !user?.id) {
          setLiveClass(null);
          return;
        }

        const todayDay = new Date().getDay();
        const isoDay = todayDay === 0 ? 7 : todayDay;
        
        const timetable = await dataApi.getTimetable({ staff_id: user.id, day_of_week: isoDay });
        const currentEntry = (timetable || []).find((e: any) => e.period === currentPeriod.period);

        if (currentEntry) {
          // Find group name
          let groupName = 'Unknown Glass';
          if (currentEntry.group_id) {
             const groups = await dataApi.getGroups();
             const group = groups.find((g: any) => g.id === currentEntry.group_id);
             groupName = group?.name || 'Assigned Group';
          }
          
          setLiveClass({
            subject: currentEntry.subject || 'Session',
            group_name: groupName,
            group_id: currentEntry.group_id,
            period: currentEntry.period,
            time: getPeriodTime(currentEntry.period),
          });
        } else {
          setLiveClass(null);
        }
      } catch (e) {
        console.error("Live status check failed", e);
        setLiveClass(null);
      } finally {
        setLiveLoading(false);
      }
    };
    checkLiveStatus();
  }, [user?.id]);

  const handleOpenTimetable = async () => {
    setShowTimetable(true);
    if (weeklyTimetable.length > 0) return; // Already loaded
    setTimetableLoading(true);
    try {
      const entries = await dataApi.getTimetable({ staff_id: user?.id || undefined });
      // Group by day_of_week
      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
      const byDay: Record<number, any[]> = {};
      for (const e of entries) {
        const d = e.day_of_week || 1;
        if (!byDay[d]) byDay[d] = [];
        byDay[d].push(e);
      }
      const schedule = days.map((day, i) => ({
        day,
        shortDay: day.substring(0, 3),
        periods: (byDay[i + 1] || []).sort((a: any, b: any) => a.period - b.period).map((e: any) => ({
          period: e.period,
          subject: e.subject || 'Free',
          time: getPeriodTime(e.period) || (e.start_time && e.end_time ? `${e.start_time}-${e.end_time}` : ''),
        }))
      }));
      setWeeklyTimetable(schedule);
    } catch {
      setWeeklyTimetable([]);
    } finally {
      setTimetableLoading(false);
    }
  };

  return (
    <div className="space-y-8 page-enter">
      {/* Dynamic Hero Banner */}
      <div 
        onClick={handleStartAttendance}
        className={`p-8 rounded-[3rem] text-white shadow-2xl relative overflow-hidden transition-all duration-500 ${
          isReady 
          ? 'bg-indigo-600 tap-active group cursor-pointer shadow-indigo-500/30 ring-2 ring-indigo-500/20' 
          : 'bg-slate-900 dark:bg-slate-900 border border-slate-800 cursor-default opacity-90'
        }`}
      >
        <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/10 blur-3xl rounded-full"></div>
        {liveClass && (
           <div className="absolute bottom-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[80px] rounded-full translate-x-1/2 translate-y-1/2"></div>
        )}

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <span className={`flex h-2.5 w-2.5 rounded-full ${isReady ? 'bg-emerald-400 animate-pulse shadow-[0_0_12px_#34d399]' : 'bg-slate-600'}`}></span>
              <p className="text-white/70 text-[12px] font-bold uppercase tracking-widest">
                {liveClass ? 'Live Class Active' : isTest ? 'Test Mode • All Students' : isReady ? 'Ready for Session' : 'No Group Assigned'}
              </p>
            </div>
            {liveClass && (
               <div className="px-3 py-1 bg-emerald-500/20 backdrop-blur-md rounded-lg border border-emerald-500/30 flex items-center gap-2">
                  <Radio size={12} className="text-emerald-400 animate-pulse" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-emerald-300">Period {liveClass.period}</span>
               </div>
            )}
          </div>
          
          <h2 className="text-3xl font-black tracking-tight leading-none uppercase mb-8">
            {liveClass ? `Start ${liveClass.subject}` : isReady ? 'Take Attendance' : 'No Schedule'}
          </h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/10 px-5 py-4 rounded-2xl border border-white/5 backdrop-blur-md">
               <p className="text-[10px] font-bold uppercase text-white/50 tracking-wider mb-1 flex items-center gap-2">
                 <CalendarDays size={14} /> {todayDate}
               </p>
               <p className="font-bold text-sm tracking-tight">{today}</p>
            </div>
            <div className="bg-white/10 px-5 py-4 rounded-2xl border border-white/5 backdrop-blur-md">
               <p className="text-[10px] font-bold uppercase text-white/50 tracking-wider mb-1 flex items-center gap-2">
                 <MapPin size={14} /> {liveClass ? 'Current Class' : 'Assigned'}
               </p>
               <p className="font-bold text-sm tracking-tight truncate">{liveClass ? liveClass.group_name : groupDisplayName}</p>
            </div>
          </div>

          {isReady && (
            <button className="w-full mt-6 py-4 bg-white text-indigo-600 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl group-hover:scale-[1.02] transition-transform">
              Begin Face Scanning <PlayCircle size={20} />
            </button>
          )}
        </div>
      </div>

      {/* ── Live Class Mini-Card ── */}
      <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-sm transition-all">
         <div className="flex items-center justify-between mb-6">
            <h3 className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-3">
               <Radio size={16} className={liveClass ? "text-indigo-600 animate-pulse" : "text-slate-300"} />
               Live Class Status
            </h3>
            {liveClass && (
               <span className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1.5 rounded-lg border border-emerald-500/10">Active Period</span>
            )}
         </div>

         {liveLoading ? (
            <div className="flex items-center gap-4 animate-pulse">
               <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-2xl"></div>
               <div className="space-y-2 flex-1">
                  <div className="h-4 w-24 bg-slate-100 dark:bg-slate-800 rounded-md"></div>
                  <div className="h-3 w-40 bg-slate-50 dark:bg-slate-900 rounded-md"></div>
               </div>
            </div>
         ) : liveClass ? (
            <div 
               onClick={handleStartAttendance}
               className="flex items-center gap-5 p-5 bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-950/20 dark:to-slate-900 rounded-[2.25rem] border border-indigo-100 dark:border-indigo-800/40 tap-active group/live cursor-pointer"
            >
               <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-xl shadow-lg ring-4 ring-indigo-500/10">
                  {liveClass.period}
               </div>
               <div className="flex-1 min-w-0">
                  <h4 className="text-base font-bold text-slate-900 dark:text-white uppercase tracking-tight truncate group-hover/live:text-indigo-600 transition-colors">{liveClass.subject}</h4>
                  <p className="text-[10px] font-bold text-indigo-500 dark:text-indigo-400 mt-1 uppercase tracking-widest flex items-center gap-2">
                     <BookOpen size={12} /> {liveClass.group_name} · {liveClass.time}
                  </p>
               </div>
               <ChevronDown size={20} className="text-slate-300 -rotate-90" />
            </div>
         ) : (
            <div className="flex items-center gap-4 p-5 bg-slate-50 dark:bg-slate-950 rounded-[2.25rem] border border-slate-100 dark:border-slate-800 opacity-60">
               <div className="w-12 h-12 rounded-2xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center">
                  <Clock size={20} className="text-slate-400" />
               </div>
               <div>
                  <h4 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight">Staff Has No Class Now</h4>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                     {getCurrentPeriod() ? `Free during ${getCurrentPeriod()?.label}` : 'Outside teaching hours'}
                  </p>
               </div>
            </div>
         )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <SummaryCard title="Groups" value={user?.assignedClassId ? '1' : '0'} color="bg-indigo-600" />
        <SummaryCard title="Periods" value={liveClass ? 'Active' : 'Free'} color={liveClass ? "bg-indigo-600" : "bg-slate-600"} />
      </div>

      {/* Weekly Timetable Button */}
      <button
        onClick={handleOpenTimetable}
        className="w-full bg-gradient-to-br from-indigo-700 via-indigo-600 to-indigo-500 p-6 rounded-[3rem] text-white shadow-xl shadow-indigo-600/20 flex items-center gap-5 group tap-active transition-all hover:shadow-2xl active:scale-[0.98] relative overflow-hidden h-32"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl translate-x-1/2 -translate-y-1/2"></div>
        <div className="w-14 h-14 bg-white/15 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/10 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shrink-0">
          <Table2 size={24} strokeWidth={2} />
        </div>
        <div className="flex-1 text-left relative z-10">
          <h3 className="text-sm font-black uppercase tracking-widest leading-none">Weekly Timetable</h3>
          <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest mt-2">
            View My Schedule • {today}
          </p>
        </div>
      </button>

      <div className="grid grid-cols-2 gap-4">
        <QuickAction label="My Groups" icon={Layers} color="bg-blue-600" onClick={() => onNavigate('/staff-subjects')} />
        <QuickAction label="Chat" icon={Users} color="bg-emerald-600" onClick={() => onNavigate('/staff-chat')} />
      </div>

      {/* Weekly Timetable Popup */}
      {showTimetable && (
        <div className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-md animate-in fade-in duration-300">
          <div className="absolute inset-0" onClick={() => setShowTimetable(false)} />
          <div className="relative w-full sm:max-w-lg max-h-[82vh] overflow-hidden flex flex-col bg-white dark:bg-slate-950 sm:rounded-[2.5rem] rounded-t-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-2xl animate-in slide-in-from-bottom-6 duration-300">
            {/* Header */}
            <div className="shrink-0 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-100 dark:border-slate-800 p-6 flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center">
                  <Table2 size={20} className="text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h2 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight">Weekly Schedule</h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">My Personal Timetable</p>
                </div>
              </div>
              <button onClick={() => setShowTimetable(false)} className="w-10 h-10 flex items-center justify-center bg-slate-50 dark:bg-slate-900 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
                <X size={20} className="text-slate-500" />
              </button>
            </div>

            {/* Schedule Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
              {timetableLoading ? (
                <div className="flex flex-col items-center justify-center p-12 text-slate-400">
                  <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3"></div>
                  <span className="text-[10px] font-bold uppercase tracking-widest">Loading Schedule...</span>
                </div>
              ) : weeklyTimetable.length === 0 || weeklyTimetable.every(d => d.periods.length === 0) ? (
                <div className="text-center p-12 text-slate-400">
                  <CalendarDays size={40} className="mx-auto mb-3 opacity-30" />
                  <p className="text-sm font-bold">No timetable entries found</p>
                  <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest">Timetable not synced yet</p>
                </div>
              ) : (
                weeklyTimetable.map((daySchedule, dayIdx) => {
                  const isToday = daySchedule.day === today;
                  const dayColors = [
                    'border-indigo-200 dark:border-indigo-800/30 bg-indigo-50/50 dark:bg-indigo-900/10',
                    'border-emerald-200 dark:border-emerald-800/30 bg-emerald-50/50 dark:bg-emerald-900/10',
                    'border-amber-200 dark:border-amber-800/30 bg-amber-50/50 dark:bg-amber-900/10',
                    'border-purple-200 dark:border-purple-800/30 bg-purple-50/50 dark:bg-purple-900/10',
                    'border-rose-200 dark:border-rose-800/30 bg-rose-50/50 dark:bg-rose-900/10',
                  ];
                  return (
                    <div key={daySchedule.day} className={`rounded-[2rem] border p-5 ${isToday ? 'border-indigo-400 dark:border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 ring-2 ring-indigo-500/10' : dayColors[dayIdx % 5]}`}>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">{daySchedule.day}</span>
                          {isToday && (
                            <span className="px-2 py-0.5 bg-indigo-600 text-white text-[8px] font-bold uppercase tracking-widest rounded-md">Today</span>
                          )}
                        </div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{daySchedule.periods.length} Periods</span>
                      </div>
                      {daySchedule.periods.length > 0 ? (
                        <div className="space-y-2">
                          {daySchedule.periods.map((period: any) => (
                            <div key={period.period} className="flex items-center gap-4 bg-white/70 dark:bg-slate-900/50 p-3 rounded-2xl border border-slate-100 dark:border-slate-800/50">
                              <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[12px] font-black text-slate-600 dark:text-slate-300 shrink-0">
                                {period.period}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-slate-900 dark:text-white truncate uppercase tracking-tight">{period.subject}</p>
                                {period.time && (
                                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mt-1">
                                    <Clock size={10} /> {period.time}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center py-4 bg-white/30 dark:bg-black/10 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">Free Day</p>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffHome;
