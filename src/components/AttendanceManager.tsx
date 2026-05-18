import { useState, useEffect } from 'react';
import { collection, query, getDocs, setDoc, doc, where } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firebaseUtils';
import { Student, AttendanceStatus, AttendanceRecord } from '../types';
import { Check, X, Clock, Send, Search } from 'lucide-react';
import { motion } from 'motion/react';
import { format } from 'date-fns';

export default function AttendanceManager() {
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [notifying, setNotifying] = useState<string | null>(null);

  const todayStr = format(new Date(), 'yyyy-MM-dd');

  useEffect(() => {
    async function fetchData() {
      try {
        const [studentsSnap, attendanceSnap] = await Promise.all([
          getDocs(collection(db, 'students')),
          getDocs(query(collection(db, 'attendance'), where('date', '==', todayStr)))
        ]);

        const studentList = studentsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Student));
        setStudents(studentList);

        const attendanceMap: Record<string, AttendanceStatus> = {};
        attendanceSnap.docs.forEach(d => {
          const data = d.data();
          attendanceMap[data.studentId] = data.status;
        });
        setAttendance(attendanceMap);
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'attendance');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [todayStr]);

  const markAttendance = async (student: Student, status: AttendanceStatus) => {
    if (!auth.currentUser) return;

    try {
      setNotifying(student.id);
      const recordId = `${student.id}_${todayStr}`;
      const record: AttendanceRecord = {
        studentId: student.id,
        status,
        date: todayStr,
        timestamp: Date.now(),
        markedBy: auth.currentUser.uid
      };

      await setDoc(doc(db, 'attendance', recordId), record);
      setAttendance(prev => ({ ...prev, [student.id]: status }));

      // Call notification API
      if (status !== 'present') {
        const response = await fetch('/api/notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            studentName: student.name,
            status: status,
            parentPhone: student.parentPhone,
            date: todayStr
          })
        });
        const result = await response.json();
        console.log('Notification result:', result);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'attendance');
    } finally {
      setNotifying(null);
    }
  };

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) || 
    s.studentId.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="p-8 lg:p-12 space-y-8"
    >
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-5xl font-serif text-[#6B705C] font-bold tracking-tight">Enrollment Logic</h1>
          <p className="text-[#A5A58D] font-serif italic text-lg">{format(new Date(), 'EEEE, MMMM do')}</p>
        </div>
        
        <div className="relative group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A5A58D] group-focus-within:text-[#6B705C] transition-colors" />
          <input 
            type="text"
            placeholder="Search roster..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-14 pr-8 py-4 bg-white border border-[#E5DEC9] rounded-[2rem] w-full md:w-96 focus:outline-none focus:ring-4 focus:ring-[#E5DEC9]/30 focus:border-[#6B705C] transition-all shadow-sm font-medium"
          />
        </div>
      </header>

      <div className="bg-white rounded-[3rem] border border-[#E5DEC9] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F2EDE4]/30">
                <th className="px-10 py-6 text-[11px] font-black text-[#A5A58D] uppercase tracking-[0.2em]">Full Member Name</th>
                <th className="px-10 py-6 text-[11px] font-black text-[#A5A58D] uppercase tracking-[0.2em]">Academic Level</th>
                <th className="px-10 py-6 text-[11px] font-black text-[#A5A58D] uppercase tracking-[0.2em]">Current Status</th>
                <th className="px-10 py-6 text-[11px] font-black text-[#A5A58D] uppercase tracking-[0.2em] text-right">Commit Action</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {filteredStudents.length > 0 ? filteredStudents.map((student) => (
                <tr key={student.id} className="group hover:bg-[#F9F7F2] transition-colors border-t border-[#F2EDE4]/50">
                  <td className="px-10 py-7">
                    <div>
                      <p className="font-bold text-[#433E37] text-base">{student.name}</p>
                      <p className="text-[10px] text-[#A5A58D] font-black tracking-widest mt-1 opacity-60">REF: {student.studentId}</p>
                    </div>
                  </td>
                  <td className="px-10 py-7">
                    <span className="px-3 py-1 bg-[#F2EDE4] text-[#6B705C] text-[10px] rounded-full border border-[#E5DEC9] font-black uppercase tracking-widest">
                       Grade {student.grade}
                    </span>
                  </td>
                  <td className="px-10 py-7">
                    <StatusBadge status={attendance[student.id]} />
                  </td>
                  <td className="px-10 py-7">
                    <div className="flex items-center justify-end gap-3">
                       <ActionButton 
                        icon={<Check size={20} />} 
                        label="Present" 
                        color="emerald"
                        active={attendance[student.id] === 'present'}
                        onClick={() => markAttendance(student, 'present')}
                        disabled={notifying === student.id}
                      />
                       <ActionButton 
                        icon={<X size={20} />} 
                        label="Absent" 
                        color="red"
                        active={attendance[student.id] === 'absent'}
                        onClick={() => markAttendance(student, 'absent')}
                        disabled={notifying === student.id}
                      />
                       <ActionButton 
                        icon={<Clock size={20} />} 
                        label="Tardy" 
                        color="amber"
                        active={attendance[student.id] === 'tardy'}
                        onClick={() => markAttendance(student, 'tardy')}
                        disabled={notifying === student.id}
                      />
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={4} className="px-10 py-32 text-center">
                    {loading ? (
                      <div className="flex justify-center flex-col items-center gap-6">
                        <div className="w-12 h-12 border-4 border-[#F2EDE4] border-t-[#6B705C] rounded-full animate-spin" />
                        <p className="text-xs font-black text-[#A5A58D] uppercase tracking-widest animate-pulse">Syncing Roster...</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-4 opacity-30">
                        <Users size={64} className="text-[#A5A58D]" strokeWidth={1} />
                        <p className="text-[#A5A58D] font-serif italic text-lg uppercase tracking-widest">Roster Empty</p>
                      </div>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}

function StatusBadge({ status }: { status?: AttendanceStatus }) {
  if (!status) return <span className="text-[10px] font-black text-[#A5A58D] uppercase tracking-[0.2em] italic opacity-40">Awaiting...</span>;

  const styles = {
    present: 'bg-[#8A9A5B]/20 text-[#6B705C] border-[#8A9A5B]/30',
    absent: 'bg-[#D95D39]/10 text-[#D95D39] border-[#D95D39]/20',
    tardy: 'bg-[#E9C46A]/20 text-[#9E813A] border-[#E9C46A]/30'
  };

  return (
    <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] border ${styles[status]}`}>
      {status}
    </span>
  );
}

function ActionButton({ icon, label, color, onClick, active, disabled }: any) {
  const baseClasses = "w-12 h-12 rounded-2xl transition-all flex items-center justify-center border disabled:opacity-50 active:scale-90 shadow-sm";
  
  const colors: any = {
    emerald: active ? 'bg-[#6B705C] text-white border-[#6B705C] shadow-lg shadow-[#6B705C]/30' : 'bg-white text-[#6B705C] border-[#E5DEC9] hover:bg-[#F9F7F2] hover:border-[#6B705C]',
    red: active ? 'bg-[#D95D39] text-white border-[#D95D39] shadow-lg shadow-[#D95D39]/30' : 'bg-white text-[#D95D39] border-[#E5DEC9] hover:bg-[#F9F7F2] hover:border-[#D95D39]',
    amber: active ? 'bg-[#E9C46A] text-white border-[#E9C46A] shadow-lg shadow-[#E9C46A]/30' : 'bg-white text-[#9E813A] border-[#E5DEC9] hover:bg-[#F9F7F2] hover:border-[#E9C46A]',
  };

  return (
    <button 
      onClick={onClick} 
      title={label}
      disabled={disabled}
      className={`${baseClasses} ${colors[color]}`}
    >
      {icon}
    </button>
  );
}

function Users(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
