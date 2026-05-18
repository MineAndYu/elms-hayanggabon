import { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firebaseUtils';
import { AttendanceRecord, Student } from '../types';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths,
  isToday
} from 'date-fns';
import { ChevronLeft, ChevronRight, Activity, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function CalendarView() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [atSnap, stSnap] = await Promise.all([
          getDocs(collection(db, 'attendance')),
          getDocs(collection(db, 'students'))
        ]);
        setAttendance(atSnap.docs.map(d => d.data() as AttendanceRecord));
        setStudents(stSnap.docs.map(d => ({ id: d.id, ...d.data() } as Student)));
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'calendar');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const calendarDays = eachDayOfInterval({
    start: startDate,
    end: endDate,
  });

  const getDayStats = (day: Date) => {
    const dayStr = format(day, 'yyyy-MM-dd');
    const dayRecords = attendance.filter(r => r.date === dayStr);
    const absent = dayRecords.filter(r => r.status === 'absent').length;
    const tardy = dayRecords.filter(r => r.status === 'tardy').length;
    return { absent, tardy, count: dayRecords.length };
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-8 lg:p-12 space-y-12"
    >
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-7xl font-serif text-[#6B705C] font-black tracking-tighter">Academic Rhythm</h1>
          <p className="text-[#A5A58D] font-serif italic text-xl mt-2">Chronological mapping of attendance velocity</p>
        </div>

        <div className="flex items-center gap-6 bg-white px-8 py-4 rounded-[2rem] border border-[#E5DEC9] shadow-sm">
          <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-3 text-[#6B705C] hover:bg-[#F2EDE4] rounded-2xl transition-all">
            <ChevronLeft size={20} strokeWidth={3} />
          </button>
          <div className="text-xl font-serif font-black tracking-tight w-56 text-center text-[#433E37] italic">
            {format(currentMonth, 'MMMM yyyy')}
          </div>
          <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-3 text-[#6B705C] hover:bg-[#F2EDE4] rounded-2xl transition-all">
            <ChevronRight size={20} strokeWidth={3} />
          </button>
        </div>
      </header>

      <div className="bg-white rounded-[4rem] border border-[#E5DEC9] shadow-sm overflow-hidden p-12">
        <div className="grid grid-cols-7 mb-8">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center py-4 text-[11px] font-black uppercase tracking-[0.4em] text-[#A5A58D] font-serif italic opacity-60">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-6">
          {calendarDays.map((day, idx) => {
            const isCurrentMonth = isSameMonth(day, monthStart);
            const { absent, tardy, count } = getDayStats(day);
            const today = isToday(day);

            return (
              <div 
                key={idx} 
                className={`min-h-[160px] rounded-[2.5rem] p-6 relative group transition-all border ${
                  !isCurrentMonth ? 'opacity-20 grayscale' : 'hover:bg-[#F9F7F2] border-transparent hover:border-[#E5DEC9]'
                } ${today ? 'bg-[#6B705C] text-white shadow-3xl shadow-[#6B705C]/30 border-none' : 'bg-white border-[#F2EDE4]/50'}`}
              >
                <span className={`text-2xl font-serif font-black transition-colors ${
                  today ? 'text-white' : 'text-[#433E37]/30 group-hover:text-[#433E37]'
                }`}>
                  {format(day, 'd')}
                </span>

                <div className="mt-6 flex flex-col gap-3">
                  {absent > 0 && (
                    <div className="h-2 rounded-full bg-[#D95D39] shadow-sm" style={{ width: `${Math.min(100, (absent/students.length || 1)*300)}%` }} />
                  )}
                  {tardy > 0 && (
                    <div className="h-2 rounded-full bg-[#E9C46A] shadow-sm" style={{ width: `${Math.min(100, (tardy/students.length || 1)*300)}%` }} />
                  )}
                </div>

                {count > 0 && (
                  <div className={`absolute bottom-6 right-8 flex items-center gap-2 transform transition-all ${today ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0'}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${today ? 'bg-white' : 'bg-[#6B705C]'} animate-pulse`} />
                    <span className={`text-[9px] font-black uppercase tracking-widest ${today ? 'text-white/60' : 'text-[#A5A58D]'}`}>{count} LOGS</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-12 justify-center pt-8">
        <div className="flex items-center gap-4 group cursor-help">
          <div className="w-4 h-4 rounded-full bg-[#D95D39] shadow-md group-hover:scale-125 transition-transform" />
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#A5A58D]">Vacant Threshold</span>
        </div>
        <div className="flex items-center gap-4 group cursor-help">
          <div className="w-4 h-4 rounded-full bg-[#E9C46A] shadow-md group-hover:scale-125 transition-transform" />
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#A5A58D]">Delayed Entries</span>
        </div>
      </div>
    </motion.div>
  );
}
