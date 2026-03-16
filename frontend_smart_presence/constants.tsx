
import React from 'react';
import {
  LayoutDashboard,
  Layers,
  Users,
  Settings,
  ArrowLeft,
  Calendar,
  GraduationCap,
  MessageSquare,
  BookOpen
} from 'lucide-react';

// ── Global Period Timings (Institution-wide) ──
export const PERIOD_TIMINGS = [
  { period: 1, label: 'Period 1', start: '09:00', end: '10:00', startH: 9, startM: 0, endH: 10, endM: 0 },
  { period: 2, label: 'Period 2', start: '10:00', end: '11:00', startH: 10, startM: 0, endH: 11, endM: 0 },
  { period: 3, label: 'Period 3', start: '11:00', end: '12:00', startH: 11, startM: 0, endH: 12, endM: 0 },
];

/** Get the formatted time range for a given period number */
export const getPeriodTime = (periodNum: number): string => {
  const p = PERIOD_TIMINGS.find(t => t.period === periodNum);
  if (!p) return '';
  const fmt = (h: number) => {
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hh = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return `${hh}:00 ${ampm}`;
  };
  return `${fmt(p.startH)} - ${fmt(p.endH)}`;
};

/** Get the current active period info based on current time, or null if outside class hours */
export const getCurrentPeriod = (): { period: number; label: string; start: string; end: string; status: 'ACTIVE' | 'DONE' | 'WAITING' } | null => {
  const now = new Date();
  const h = now.getHours();
  const m = now.getMinutes();
  const nowMins = h * 60 + m;
  
  for (const p of PERIOD_TIMINGS) {
    const startMins = p.startH * 60 + p.startM;
    const endMins = p.endH * 60 + p.endM;
    if (nowMins >= startMins && nowMins < endMins) {
      return { period: p.period, label: p.label, start: p.start, end: p.end, status: 'ACTIVE' };
    }
  }
  return null;
};

/** Check if attendance is being taken late (after the period's scheduled end time) */
export const isLateAttendance = (periodNum: number): boolean => {
  const p = PERIOD_TIMINGS.find(t => t.period === periodNum);
  if (!p) return false;
  const now = new Date();
  const nowMins = now.getHours() * 60 + now.getMinutes();
  const endMins = p.endH * 60 + p.endM;
  return nowMins > endMins;
};

/** Get period status based on current time */
export const getPeriodStatus = (periodNum: number): 'ACTIVE' | 'DONE' | 'WAITING' => {
  const now = new Date();
  const nowMins = now.getHours() * 60 + now.getMinutes();
  const p = PERIOD_TIMINGS.find(t => t.period === periodNum);
  if (!p) return 'WAITING';
  const startMins = p.startH * 60 + p.startM;
  const endMins = p.endH * 60 + p.endM;
  if (nowMins >= endMins) return 'DONE';
  if (nowMins >= startMins) return 'ACTIVE';
  return 'WAITING';
};

export const COLORS = {
  primary: '#4F46E5',
  secondary: '#64748B',
  accent: '#818CF8',
  background: '#F8FAFC',
  surface: '#FFFFFF',
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
};

export const MOCK_ADMIN: any = {
  id: 'adm-001',
  name: 'Dept Head - Sarah Wilson',
  email: 'hod@college.edu',
  role: 'ADMIN',
  avatar: 'https://ui-avatars.com/api/?name=Admin&background=4F46E5&color=fff&size=150&bold=true'
};

export const MOCK_CLASSES = [
  { id: 'g1', name: 'Class A', code: 'A' },
  { id: 'g2', name: 'Class B', code: 'B' },
  { id: 'g3', name: 'Batch 3', code: 'B3' },
  { id: 'g4', name: 'Batch 4', code: 'B4' },
  { id: 'g-test', name: 'Lab Test Class', code: 'TEST' },
];

/**
 * Check if a class/group is the special "Test Class".
 * Test Class bypasses timetable logic and shows ALL registered students.
 */
export const isTestClass = (cls: { name?: string; code?: string; id?: string } | null | undefined): boolean => {
  if (!cls) return false;
  const name = (cls.name || '').toLowerCase();
  const code = (cls.code || '').toLowerCase();
  return name.includes('test') || code === 'test' || code === 'tst';
};

export const NAV_ITEMS = {
  ADMIN: [
    { label: 'Home', icon: <LayoutDashboard size={24} />, path: '/dashboard' },
    { label: 'Classes', icon: <Layers size={24} />, path: '/classes' },
    { label: 'Staff', icon: <GraduationCap size={24} />, path: '/staff' },
    { label: 'Settings', icon: <Settings size={24} />, path: '/settings' },
  ],
  STAFF: [
    { label: 'Home', icon: <LayoutDashboard size={24} />, path: '/staff-home' },
    { label: 'Groups', icon: <BookOpen size={24} />, path: '/staff-subjects' },
    { label: 'My Group', icon: <Users size={24} />, path: '/my-class' },
    { label: 'Chat', icon: <MessageSquare size={24} />, path: '/staff-chat' },
  ]
};

export const BackButton = ({ onClick }: { onClick: () => void }) => (
  <button
    onClick={(e) => {
      e.stopPropagation();
      onClick();
    }}
    className="flex items-center gap-3 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors py-3 px-1 mb-4 group tap-active"
  >
    <div className="w-10 h-10 flex items-center justify-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl group-hover:border-indigo-500 transition-all shadow-sm">
      <ArrowLeft size={18} />
    </div>
    <span className="text-sm font-bold uppercase tracking-widest">Back</span>
  </button>
);
