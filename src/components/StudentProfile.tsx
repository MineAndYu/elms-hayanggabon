import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firebaseUtils';
import { Student, AttendanceRecord, BehaviorLog } from '../types';
import { ArrowLeft, Calendar, UserCheck, MessageSquare, Phone, Mail, GraduationCap } from 'lucide-react';
import { motion } from 'motion/react';
import { format } from 'date-fns';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

export default function StudentProfile() {
  const { id } = useParams();
  const [student, setStudent] = useState<Student | null>(null);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [behavior, setBehavior] = useState<BehaviorLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!id) return;
      try {
        const studentSnap = await getDoc(doc(db, 'students', id));
        if (studentSnap.exists()) {
          setStudent({ id: studentSnap.id, ...studentSnap.data() } as Student);
        }

        const [attendanceSnap, behaviorSnap] = await Promise.all([
          getDocs(query(collection(db, 'attendance'), where('studentId', '==', id))),
          getDocs(query(collection(db, 'behaviorLogs'), where('studentId', '==', id), orderBy('timestamp', 'desc')))
        ]);

        setAttendance(attendanceSnap.docs.map(d => ({ id: d.id, ...d.data() } as AttendanceRecord)));
        setBehavior(behaviorSnap.docs.map(d => ({ id: d.id, ...d.data() } as BehaviorLog)));
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `student_${id}`);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  if (loading) return (
    <div className="p-12 flex justify-center">
      <div className="w-10 h-10 border-4 border-zinc-200 border-t-black rounded-full animate-spin" />
    </div>
  );

  if (!student) return <div className="p-12">Student not found.</div>;

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

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-8 lg:p-12 space-y-12"
    >
      <Link to="/students" className="inline-flex items-center gap-3 text-[#A5A58D] hover:text-[#6B705C] transition-all font-black uppercase tracking-[0.2em] text-[10px] mb-8 group">
        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
        Back to Directory
      </Link>

      <div className="grid lg:grid-cols-3 gap-12">
        {/* Profile Card */}
        <div className="space-y-8">
          <div className="bg-white p-10 rounded-[3rem] border border-[#E5DEC9] shadow-sm space-y-8 relative overflow-hidden group">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#F2EDE4] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            
            <div className="relative">
              <div className="w-32 h-32 rounded-[2.5rem] bg-[#F2EDE4] border border-[#E5DEC9] flex items-center justify-center text-4xl font-serif font-black text-[#6B705C] shadow-inner group-hover:bg-[#6B705C] group-hover:text-white transition-all duration-500">
                {student.name.charAt(0)}
              </div>
            </div>

            <div className="relative">
              <h1 className="text-4xl font-serif font-black text-[#433E37] tracking-tighter mb-2">{student.name}</h1>
              <div className="flex items-center gap-3">
                 <span className="px-3 py-1 bg-[#F1F3E9] text-[#6B705C] text-[10px] rounded-full border border-[#D1D9B5] font-black uppercase tracking-widest">
                    Grade {student.grade}
                 </span>
                 <span className="text-[10px] font-black text-[#A5A58D] uppercase tracking-[0.2em] opacity-60">REF: {student.studentId}</span>
              </div>
            </div>

            <div className="space-y-6 pt-8 border-t border-[#F2EDE4] relative">
              <ContactInfo icon={<Phone size={18} />} label="Domestic Line" value={student.parentPhone} />
              <ContactInfo icon={<Mail size={18} />} label="Electronic Mail" value={student.parentEmail} />
            </div>
          </div>

          <div className="bg-white p-10 rounded-[3rem] border border-[#E5DEC9] shadow-sm h-[350px] flex flex-col">
            <h3 className="text-[10px] font-black text-[#A5A58D] uppercase tracking-[0.3em] mb-8 border-b border-[#F2EDE4] pb-4">Attendance Map</h3>
            <div className="flex-1">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      innerRadius={70}
                      outerRadius={90}
                      paddingAngle={8}
                      dataKey="value"
                      stroke="none"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        borderRadius: '20px', 
                        border: '1px solid #E5DEC9', 
                        boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.05)',
                        padding: '12px',
                        fontSize: '12px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-full opacity-20 italic font-serif">
                   <p>No historical data recorded.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Records Columns */}
        <div className="lg:col-span-2 space-y-12">
          {/* Attendance History */}
          <section>
            <h2 className="text-xl font-serif text-[#6B705C] font-bold mb-8 flex items-center gap-3">
              <Calendar className="opacity-30" />
              Chronological Attendance
            </h2>
            <div className="bg-white rounded-[2.5rem] border border-[#E5DEC9] shadow-sm overflow-hidden">
              {attendance.length > 0 ? attendance.map((row, idx) => (
                <div key={idx} className="flex items-center justify-between px-10 py-6 border-t first:border-t-0 border-[#F2EDE4]/50 hover:bg-[#F9F7F2] transition-colors">
                  <div className="flex items-center gap-8">
                    <div className="text-[11px] font-black text-[#A5A58D] uppercase tracking-[0.2em] tabular-nums">
                      {format(new Date(row.date), 'MMM dd, yyyy')}
                    </div>
                    <StatusBadge status={row.status} />
                  </div>
                </div>
              )) : (
                <div className="p-20 text-center text-[#A5A58D] font-serif italic">The archive holds no records for this entity.</div>
              )}
            </div>
          </section>

          {/* Behavior Logs */}
          <section>
            <h2 className="text-xl font-serif text-[#6B705C] font-bold mb-8 flex items-center gap-3">
              <MessageSquare className="opacity-30" />
              Observational Logs
            </h2>
            <div className="space-y-6">
              {behavior.length > 0 ? behavior.map((log) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  key={log.id} 
                  className="bg-white p-10 rounded-[2.5rem] border border-[#E5DEC9] shadow-sm group hover:border-[#6B705C]/30 transition-all"
                >
                  <p className="text-lg font-serif italic text-[#433E37] leading-relaxed mb-6">"{log.comment}"</p>
                  <div className="flex items-center justify-between text-[9px] font-black text-[#A5A58D] uppercase tracking-[0.3em] bg-[#F2EDE4]/50 px-4 py-2 rounded-full w-fit">
                    {format(log.timestamp, 'MMMM do, yyyy')}
                  </div>
                </motion.div>
              )) : (
                <div className="bg-white p-20 text-center rounded-[3rem] border border-dashed border-[#E5DEC9] opacity-40">
                   <p className="font-serif italic">No qualitative notes in the record.</p>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </motion.div>
  );
}

function ContactInfo({ icon, label, value }: { icon: any, label: string, value: string }) {
  return (
    <div className="flex items-center gap-5 group">
      <div className="w-12 h-12 rounded-2xl bg-[#F2EDE4] flex items-center justify-center text-[#A5A58D] group-hover:bg-[#6B705C] group-hover:text-white transition-all duration-300">
        {icon}
      </div>
      <div>
        <p className="text-[9px] font-black text-[#A5A58D] uppercase tracking-[0.2em] leading-none mb-2">{label}</p>
        <p className="font-bold text-[#433E37]">{value}</p>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: any = {
    present: 'bg-[#8A9A5B]/20 text-[#6B705C] border-[#8A9A5B]/30',
    absent: 'bg-[#D95D39]/10 text-[#D95D39] border-[#D95D39]/20',
    tardy: 'bg-[#E9C46A]/20 text-[#9E813A] border-[#E9C46A]/30'
  };
  return (
    <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] border ${styles[status]}`}>
      {status}
    </span>
  );
}
