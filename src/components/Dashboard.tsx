import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firebaseUtils';
import { Users, UserCheck, Clock, AlertCircle, BarChart3, MessageSquare } from 'lucide-react';
import { motion } from 'motion/react';
import { format } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalStudents: 0,
    presentToday: 0,
    absentToday: 0,
    tardyToday: 0,
  });
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const todayStr = format(new Date(), 'yyyy-MM-dd');
        
        // Parallel queries
        const [studentsSnap, attendanceSnap, behaviorSnap] = await Promise.all([
          getDocs(collection(db, 'students')),
          getDocs(query(collection(db, 'attendance'), where('date', '==', todayStr))),
          getDocs(query(collection(db, 'behaviorLogs'), orderBy('timestamp', 'desc'), limit(5)))
        ]);

        const attendanceData = attendanceSnap.docs.map(doc => doc.data());
        
        setStats({
          totalStudents: studentsSnap.size,
          presentToday: attendanceData.filter(a => a.status === 'present').length,
          absentToday: attendanceData.filter(a => a.status === 'absent').length,
          tardyToday: attendanceData.filter(a => a.status === 'tardy').length,
        });

        setRecentLogs(behaviorSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'stats');
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  const chartData = [
    { name: 'Present', value: stats.presentToday, color: '#10b981' },
    { name: 'Absent', value: stats.absentToday, color: '#ef4444' },
    { name: 'Tardy', value: stats.tardyToday, color: '#f59e0b' },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-8 lg:p-12 space-y-12"
    >
      <header>
        <h1 className="text-5xl font-serif text-[#6B705C] font-bold tracking-tight">System Overview</h1>
        <p className="text-[#A5A58D] font-serif italic text-lg">Metrics and trends for {format(new Date(), 'MMMM do, yyyy')}</p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          icon={<Users className="text-[#6B705C]" />} 
          label="Enrollment" 
          value={stats.totalStudents} 
          color="natural-sidebar"
        />
        <StatCard 
          icon={<UserCheck className="text-emerald-700" />} 
          label="Confirmed Present" 
          value={stats.presentToday} 
          color="emerald"
        />
        <StatCard 
          icon={<AlertCircle className="text-[#D95D39]" />} 
          label="Marked Absent" 
          value={stats.absentToday} 
          color="natural-accent"
        />
        <StatCard 
          icon={<Clock className="text-amber-700" />} 
          label="Arrival Tardy" 
          value={stats.tardyToday} 
          color="amber"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-12">
        {/* Chart Column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] border border-[#E5DEC9] shadow-sm h-[400px]">
            <h3 className="text-xl font-serif text-[#6B705C] mb-8 flex items-center gap-3">
              <BarChart3 className="w-5 h-5 opacity-40" />
              Daily Participation Map
            </h3>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F2EDE4" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#A5A58D', fontSize: 12, fontWeight: 700 }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#A5A58D', fontSize: 12, fontWeight: 700 }}
                />
                <Tooltip 
                  cursor={{ fill: '#F9F7F2' }}
                  contentStyle={{ 
                    borderRadius: '20px', 
                    border: '1px solid #E5DEC9', 
                    boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.05)',
                    backgroundColor: '#fff',
                    padding: '16px'
                  }}
                />
                <Bar dataKey="value" radius={[12, 12, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sidebar Column */}
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] border border-[#E5DEC9] shadow-sm flex flex-col h-full">
            <h3 className="text-xl font-serif text-[#6B705C] mb-6 flex items-center gap-3">
              <MessageSquare className="w-5 h-5 opacity-40" />
              Behavior Notes
            </h3>
            <div className="space-y-4 flex-1">
              {recentLogs.length > 0 ? recentLogs.map((log) => (
                <div key={log.id} className="p-5 rounded-[1.5rem] bg-[#F2EDE4] border border-[#E5DEC9] text-sm text-[#433E37]">
                  <p className="italic font-serif leading-relaxed line-clamp-3">"{log.comment}"</p>
                  <div className="mt-4 flex items-center justify-between text-[9px] font-bold text-[#A5A58D] uppercase tracking-widest bg-white/40 px-3 py-1 rounded-full w-fit">
                    {format(log.timestamp, 'HH:mm aaa')}
                  </div>
                </div>
              )) : (
                <div className="flex flex-col items-center justify-center h-40 text-[#A5A58D] text-center border-2 border-dashed border-[#F2EDE4] rounded-[2rem]">
                  <MessageSquare size={32} className="opacity-10 mb-2" />
                  <p className="text-xs font-serif italic">No logs for today yet.</p>
                </div>
              )}
            </div>
            <button className="mt-8 w-full bg-[#6B705C] text-white py-3 rounded-2xl text-xs font-bold uppercase tracking-[0.2em] shadow-lg shadow-[#6B705C]/20 hover:-translate-y-0.5 transition-transform">
              Full Scroll Logs
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function StatCard({ icon, label, value, color }: { icon: any, label: string, value: number, color: string }) {
  const bgMap: Record<string, string> = {
    'natural-sidebar': 'bg-[#F2EDE4]',
    'emerald': 'bg-emerald-50',
    'natural-accent': 'bg-[#D95D39]/10',
    'amber': 'bg-amber-50',
  };

  return (
    <div className="bg-white p-8 rounded-[2.5rem] border border-[#E5DEC9] shadow-sm group hover:border-[#6B705C]/30 transition-all">
      <div className="flex items-center justify-between mb-6">
        <div className={`p-4 rounded-2xl ${bgMap[color]} group-hover:scale-110 group-hover:rotate-3 transition-transform`}>
          {icon}
        </div>
      </div>
      <p className="text-4xl font-black tracking-tighter text-[#433E37] mb-1">{value}</p>
      <p className="text-[10px] font-black text-[#A5A58D] uppercase tracking-widest">{label}</p>
    </div>
  );
}


