import { useState, useEffect } from 'react';
import { collection, query, getDocs, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firebaseUtils';
import { AttendanceRecord, Student } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format, subDays, isWithinInterval, parseISO } from 'date-fns';
import { Calendar, Download, Filter, BarChart3, TrendingUp } from 'lucide-react';
import { motion } from 'motion/react';

export default function ReportViewer() {
  const [data, setData] = useState<AttendanceRecord[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    start: format(subDays(new Date(), 7), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd')
  });

  useEffect(() => {
    async function fetchData() {
      try {
        const [atSnap, stSnap] = await Promise.all([
          getDocs(collection(db, 'attendance')),
          getDocs(collection(db, 'students'))
        ]);
        setData(atSnap.docs.map(d => d.data() as AttendanceRecord));
        setStudents(stSnap.docs.map(d => ({ id: d.id, ...d.data() } as Student)));
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'reports');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const filteredData = data.filter(record => {
    const date = record.date;
    return date >= dateRange.start && date <= dateRange.end;
  });

  // Aggregate by date for the chart
  const aggByDate: Record<string, any> = {};
  filteredData.forEach(r => {
    if (!aggByDate[r.date]) aggByDate[r.date] = { date: r.date, present: 0, absent: 0, tardy: 0 };
    aggByDate[r.date][r.status]++;
  });

  const chartData = Object.values(aggByDate).sort((a: any, b: any) => a.date.localeCompare(b.date));

  const totalPossible = students.length * (chartData.length || 1);
  const presentCount = filteredData.filter(d => d.status === 'present').length;
  const attendanceRate = totalPossible > 0 ? (presentCount / totalPossible * 100).toFixed(1) : '0';

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-8 lg:p-12 space-y-12"
    >
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-7xl font-serif text-[#6B705C] font-black tracking-tighter">Academic Insights</h1>
          <p className="text-[#A5A58D] font-serif italic text-xl mt-2">Historical trends and enrollment analysis</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-3 rounded-[2.5rem] border border-[#E5DEC9] shadow-sm">
          <div className="flex items-center gap-4 px-6 border-r border-[#F2EDE4]">
            <Calendar size={18} className="text-[#A5A58D]" />
            <input 
              type="date" 
              value={dateRange.start}
              onChange={e => setDateRange(p => ({ ...p, start: e.target.value }))}
              className="bg-transparent text-xs font-black uppercase tracking-widest focus:outline-none text-[#433E37]"
            />
            <span className="text-[#A5A58D] font-black uppercase tracking-widest text-[9px]">to</span>
            <input 
              type="date" 
              value={dateRange.end}
              onChange={e => setDateRange(p => ({ ...p, end: e.target.value }))}
              className="bg-transparent text-xs font-black uppercase tracking-widest focus:outline-none text-[#433E37]"
            />
          </div>
          <button className="bg-[#6B705C] text-white px-8 py-3 rounded-[1.5rem] flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-[#433E37] transition-all shadow-md shadow-[#6B705C]/20">
            <Filter size={14} />
            Filter Archive
          </button>
        </div>
      </header>

      <div className="grid lg:grid-cols-4 gap-8">
        <div className="bg-[#6B705C] text-white p-12 rounded-[4rem] shadow-3xl flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute -right-10 -bottom-10 opacity-5 group-hover:scale-110 transition-transform">
             <BarChart3 size={200} />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40 mb-8 relative">Presence Quota</p>
          <div className="relative">
            <h2 className="text-8xl font-serif font-black tracking-tighter italic">{attendanceRate}%</h2>
            <p className="text-white/60 font-black uppercase text-[9px] mt-6 tracking-[0.2em] italic">Derived from {filteredData.length} entries</p>
          </div>
        </div>

        <div className="lg:col-span-3 bg-white p-12 rounded-[4rem] border border-[#E5DEC9] shadow-sm h-[500px]">
           <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f2efe4" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tickFormatter={d => format(parseISO(d), 'MMM dd')} 
                  style={{ fontSize: '10px', fontWeight: 'bold', fill: '#A5A58D' }}
                />
                <YAxis axisLine={false} tickLine={false} style={{ fontSize: '10px', fontWeight: 'bold', fill: '#A5A58D' }} />
                <Tooltip 
                  cursor={{ fill: '#F9F7F2' }}
                  contentStyle={{ 
                    borderRadius: '24px', 
                    border: '1px solid #E5DEC9', 
                    boxShadow: '0 20px 40px -10px rgb(0 0 0 / 0.1)',
                    backgroundColor: '#fff',
                    padding: '20px'
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.1em' }} />
                <Bar dataKey="present" fill="#6B705C" radius={[12, 12, 0, 0]} name="Confirmed" />
                <Bar dataKey="tardy" fill="#E9C46A" radius={[12, 12, 0, 0]} name="Delayed" />
                <Bar dataKey="absent" fill="#D95D39" radius={[12, 12, 0, 0]} name="Vacant" />
              </BarChart>
            </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-[4rem] border border-[#E5DEC9] shadow-sm overflow-hidden">
        <div className="px-12 py-8 border-b border-[#F2EDE4] flex justify-between items-center bg-[#F9F7F2]/30">
          <h3 className="font-black font-serif italic text-lg text-[#6B705C]">Tabular Audit Trail</h3>
          <button className="flex items-center gap-2 text-[#D95D39] font-black uppercase tracking-[0.2em] text-[10px] hover:translate-x-1 transition-transform bg-white px-6 py-3 rounded-2xl border border-[#E5DEC9]">
            <Download size={14} /> Export CSV Dossier
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[11px] font-black text-[#A5A58D] uppercase tracking-[0.2em] border-b border-[#F2EDE4]">
                <th className="px-12 py-8">Registration Date</th>
                <th className="px-12 py-8">Member Name</th>
                <th className="px-12 py-8">Current State</th>
                <th className="px-12 py-8 text-right">Audit Reference</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {filteredData.map((row, idx) => {
                const s = students.find(st => st.id === row.studentId);
                return (
                  <tr key={idx} className="group border-t border-[#F2EDE4]/30 hover:bg-[#F9F7F2] transition-colors">
                    <td className="px-12 py-7 text-xs tabular-nums font-bold text-[#A5A58D]">{row.date}</td>
                    <td className="px-12 py-7 font-serif font-bold text-[#433E37] text-lg">{s?.name || 'Unknown'}</td>
                    <td className="px-12 py-7"><StatusBadge status={row.status} /></td>
                    <td className="px-12 py-7 text-right font-black text-[9px] text-[#A5A58D] opacity-40 uppercase tracking-widest group-hover:opacity-100 transition-opacity">ID_{row.studentId.slice(0, 8)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: any = {
    present: 'text-emerald-500',
    absent: 'text-red-500',
    tardy: 'text-amber-500'
  };
  return <span className={`font-black uppercase tracking-tighter text-sm ${colors[status]}`}>{status}</span>;
}
