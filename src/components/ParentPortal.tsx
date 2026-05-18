import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Student, AttendanceRecord, BehaviorLog } from '../types';
import { format } from 'date-fns';
import { motion } from 'motion/react';
import { 
  Calendar, 
  UserCheck, 
  MessageSquare, 
  GraduationCap, 
  Phone, 
  Mail,
  Clock,
  LogOut,
  LayoutDashboard
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface ParentPortalProps {
  student: Student;
  onLogout: () => void;
}

export default function ParentPortal({ student, onLogout }: ParentPortalProps) {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [behavior, setBehavior] = useState<BehaviorLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [attendanceSnap, behaviorSnap] = await Promise.all([
          getDocs(query(collection(db, 'attendance'), where('studentId', '==', student.id))),
          getDocs(query(collection(db, 'behaviorLogs'), where('studentId', '==', student.id), orderBy('timestamp', 'desc'), limit(10)))
        ]);

        setAttendance(attendanceSnap.docs.map(d => ({ id: d.id, ...d.data() } as AttendanceRecord)));
        setBehavior(behaviorSnap.docs.map(d => ({ id: d.id, ...d.data() } as BehaviorLog)));
      } catch (error) {
        console.error("Error fetching parent data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [student.id]);

  const stats = {
    present: attendance.filter(a => a.status === 'present').length,
    absent: attendance.filter(a => a.status === 'absent').length,
    tardy: attendance.filter(a => a.status === 'tardy').length,
  };

  const chartData = [
    { name: 'Present', value: stats.present, color: '#10b981' },
    { name: 'Absent', value: stats.absent, color: '#ef4444' },
    { name: 'Tardy', value: stats.tardy, color: '#f59e0b' },
  ].filter(d => d.value > 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9F7F2]">
        <div className="w-10 h-10 border-4 border-[#E5DEC9] border-t-[#6B705C] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F7F2] text-[#433E37]">
      {/* Parent Header */}
      <nav className="h-20 bg-white border-b border-[#E5DEC9] px-8 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-[#6B705C] flex items-center justify-center text-white">
            <GraduationCap size={20} />
          </div>
          <div>
            <h1 className="text-xl font-serif font-black text-[#6B705C]">Parent Portal</h1>
            <p className="text-[10px] uppercase font-black text-[#A5A58D] tracking-widest">Hayanggabon ES</p>
          </div>
        </div>
        
        <button 
          onClick={onLogout}
          className="flex items-center gap-2 text-[#A5A58D] hover:text-[#D95D39] transition-colors text-xs font-black uppercase tracking-widest"
        >
          <LogOut size={16} />
          Exit Portal
        </button>
      </nav>

      <main className="p-8 lg:p-12 max-w-7xl mx-auto space-y-12">
        <section className="bg-[#6B705C] p-12 rounded-[4rem] text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 p-12 opacity-10">
            <GraduationCap size={240} />
          </div>
          <div className="relative space-y-6">
            <p className="text-sm font-black uppercase tracking-[0.4em] opacity-60">Connected Student Record</p>
            <h2 className="text-7xl font-serif font-black tracking-tighter leading-none">{student.name}</h2>
            <div className="flex items-center gap-4 flex-wrap">
              <div className="px-6 py-2 bg-white/10 rounded-2xl border border-white/20 text-sm font-bold">Grade {student.grade}</div>
              <div className="px-6 py-2 bg-white/10 rounded-2xl border border-white/20 text-sm font-bold">LRN: {student.studentId}</div>
            </div>
          </div>
        </section>

        <div className="grid lg:grid-cols-3 gap-12">
          {/* Left Column: Summary */}
          <div className="space-y-8">
            <div className="bg-white p-10 rounded-[3rem] border border-[#E5DEC9] shadow-sm">
                <h3 className="text-[10px] font-black text-[#A5A58D] uppercase tracking-[0.3em] mb-8 border-b border-[#F2EDE4] pb-4 flex items-center gap-2">
                  <UserCheck size={14} />
                  Attendance Summary
                </h3>
                <div className="h-[250px]">
                  {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={chartData} innerRadius={60} outerRadius={80} paddingAngle={8} dataKey="value" stroke="none">
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: '20px', border: '1px solid #E5DEC9', padding: '12px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-[#A5A58D] italic font-serif opacity-40">No records yet</div>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-2 mt-8">
                    <StatItem label="Present" value={stats.present} color="text-emerald-600" />
                    <StatItem label="Absent" value={stats.absent} color="text-red-500" />
                    <StatItem label="Tardy" value={stats.tardy} color="text-amber-500" />
                </div>
            </div>

            <div className="bg-white p-10 rounded-[3rem] border border-[#E5DEC9] shadow-sm space-y-6">
                <h3 className="text-[10px] font-black text-[#A5A58D] uppercase tracking-[0.3em] border-b border-[#F2EDE4] pb-4">Registered Contact</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-[#F2EDE4] flex items-center justify-center text-[#6B705C]"><Phone size={16} /></div>
                    <p className="text-sm font-bold text-[#433E37]">{student.parentPhone}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-[#F2EDE4] flex items-center justify-center text-[#6B705C]"><Mail size={16} /></div>
                    <p className="text-sm font-bold text-[#433E37] truncate">{student.parentEmail}</p>
                  </div>
                </div>
            </div>
          </div>

          {/* Right Column: Logs */}
          <div className="lg:col-span-2 space-y-12">
            <section>
              <h3 className="text-xl font-serif text-[#6B705C] font-black mb-8 flex items-center gap-3">
                <LayoutDashboard className="opacity-30" />
                Recent Participation Logs
              </h3>
              <div className="space-y-6">
                {behavior.length > 0 ? behavior.map(log => (
                  <div key={log.id} className="bg-white p-8 rounded-[2.5rem] border border-[#E5DEC9] shadow-sm">
                    <p className="font-serif italic text-[#433E37] leading-relaxed mb-4">"{log.comment}"</p>
                    <div className="text-[10px] font-black text-[#A5A58D] uppercase tracking-widest">{format(log.timestamp, 'MMMM do, yyyy \u2022 p')}</div>
                  </div>
                )) : (
                  <div className="bg-white p-20 text-center rounded-[2.5rem] border border-dashed border-[#E5DEC9] text-[#A5A58D] font-serif italic">
                    No academic or behavior logs found in recent history.
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}

function StatItem({ label, value, color }: { label: string, value: number, color: string }) {
  return (
    <div className="text-center p-3 rounded-2xl bg-[#F9F7F2] border border-[#E5DEC9]/40">
      <p className={`text-xl font-black ${color}`}>{value}</p>
      <p className="text-[8px] font-black text-[#A5A58D] uppercase tracking-tighter">{label}</p>
    </div>
  );
}
