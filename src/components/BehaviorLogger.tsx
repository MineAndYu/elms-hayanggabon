import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, addDoc, orderBy, limit } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firebaseUtils';
import { Student, BehaviorLog } from '../types';
import { MessageSquare, User, Search, Send, Clock } from 'lucide-react';
import { motion } from 'motion/react';
import { format } from 'date-fns';

export default function BehaviorLogger() {
  const [students, setStudents] = useState<Student[]>([]);
  const [logs, setLogs] = useState<BehaviorLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [comment, setComment] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function fetchData() {
      try {
        const [stSnap, logSnap] = await Promise.all([
          getDocs(collection(db, 'students')),
          getDocs(query(collection(db, 'behaviorLogs'), orderBy('timestamp', 'desc'), limit(20)))
        ]);
        setStudents(stSnap.docs.map(d => ({ id: d.id, ...d.data() } as Student)));
        setLogs(logSnap.docs.map(d => ({ id: d.id, ...d.data() } as BehaviorLog)));
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'behavior');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !comment.trim() || !auth.currentUser) return;

    try {
      const newLog: Omit<BehaviorLog, 'id'> = {
        studentId: selectedStudent,
        teacherId: auth.currentUser.uid,
        comment: comment.trim(),
        timestamp: Date.now(),
        date: format(new Date(), 'yyyy-MM-dd')
      };

      const docRef = await addDoc(collection(db, 'behaviorLogs'), newLog);
      setLogs(prev => [{ id: docRef.id, ...newLog }, ...prev]);
      setComment('');
      setSelectedStudent(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'behavior');
    }
  };

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-8 lg:p-12 h-screen flex flex-col"
    >
      <header className="mb-10">
        <h1 className="text-7xl font-serif text-[#6B705C] font-black tracking-tighter">Observational Ledger</h1>
        <p className="text-[#A5A58D] font-serif italic text-xl mt-2 text-balance">The academy's official registry of qualitative student evaluations</p>
      </header>

      <div className="flex-1 min-h-0 grid lg:grid-cols-3 gap-12 overflow-hidden">
        {/* Selector Panel */}
        <div className="bg-white rounded-[4rem] border border-[#E5DEC9] shadow-sm flex flex-col overflow-hidden">
          <div className="p-8 border-b border-[#F2EDE4] bg-[#F9F7F2]/50">
            <div className="relative group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A5A58D] group-focus-within:text-[#6B705C] transition-colors" />
              <input 
                type="text" 
                placeholder="Locate academic member..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-14 pr-6 py-5 bg-white border border-[#E5DEC9] rounded-[2rem] text-sm focus:outline-none focus:ring-4 focus:ring-[#E5DEC9]/30 focus:border-[#6B705C] transition-all font-bold placeholder-[#A5A58D]/40"
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
            {filteredStudents.map(student => (
              <button
                key={student.id}
                onClick={() => setSelectedStudent(student.id)}
                className={`w-full flex items-center gap-5 p-5 rounded-[2.5rem] transition-all duration-300 relative group overflow-hidden ${
                  selectedStudent === student.id 
                    ? 'bg-[#6B705C] text-white shadow-xl shadow-[#6B705C]/20 -translate-y-1' 
                    : 'hover:bg-[#F9F7F2] text-[#433E37]'
                }`}
              >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-serif font-black text-lg transition-all ${
                   selectedStudent === student.id ? 'bg-white/20 text-white' : 'bg-[#F2EDE4] text-[#A5A58D]'
                }`}>
                  {student.name.charAt(0)}
                </div>
                <div className="text-left">
                  <p className="text-base font-bold leading-tight group-hover:tracking-tight transition-all">{student.name}</p>
                  <p className={`text-[9px] uppercase tracking-[0.2em] font-black mt-1 ${
                     selectedStudent === student.id ? 'text-white/60' : 'text-[#A5A58D]'
                  }`}>Grade Level {student.grade}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Input/Activity Panel */}
        <div className="lg:col-span-2 flex flex-col gap-12 overflow-hidden">
          {/* Input Area */}
          <div className="bg-white p-12 rounded-[4rem] border border-[#E5DEC9] shadow-sm shrink-0">
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-[#A5A58D]">
                  {selectedStudent ? `Entry for ${students.find(s => s.id === selectedStudent)?.name}` : 'Await student selection'}
                </h3>
                {selectedStudent && (
                   <button 
                    type="button" 
                    onClick={() => setSelectedStudent(null)}
                    className="text-[10px] uppercase font-black tracking-widest text-[#D95D39] hover:underline"
                   >Revoke Selection</button>
                )}
              </div>
              <textarea 
                disabled={!selectedStudent}
                value={comment}
                onChange={e => setComment(e.target.value)}
                placeholder="Elaborate on the behavior, academic milestone, or interaction observed..."
                className="w-full h-40 p-8 bg-[#F9F7F2]/50 rounded-[2.5rem] border border-[#E5DEC9] focus:outline-none focus:ring-4 focus:ring-[#E5DEC9]/30 focus:border-[#6B705C] focus:bg-white transition-all disabled:opacity-30 resize-none font-serif italic text-lg text-[#433E37] placeholder-[#A5A58D]/30 leading-relaxed"
              />
              <div className="flex justify-end">
                <button 
                  disabled={!selectedStudent || !comment.trim()}
                  className="flex items-center gap-3 bg-[#6B705C] text-white px-12 py-5 rounded-[2rem] font-black uppercase tracking-[0.2em] text-[10px] hover:bg-[#433E37] hover:-translate-y-1 transition-all shadow-xl shadow-[#6B705C]/20 disabled:opacity-30"
                >
                  <Send size={16} strokeWidth={3} />
                  Archive Entry
                </button>
              </div>
            </form>
          </div>

          {/* Feed Area */}
          <div className="flex-1 overflow-y-auto space-y-6 pr-4 custom-scrollbar">
             <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-[#A5A58D] mb-4 ml-6">Registry Transcription</h3>
             {logs.map(log => {
               const s = students.find(st => st.id === log.studentId);
               return (
                 <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={log.id} 
                  className="bg-white p-8 rounded-[3rem] border border-[#E5DEC9] shadow-sm hover:border-[#6B705C]/30 transition-all group"
                 >
                   <div className="flex items-start justify-between gap-6">
                     <div className="flex-1">
                        <div className="flex items-center gap-3 mb-4">
                           <span className="font-serif font-black text-[#6B705C] text-xl italic group-hover:tracking-tighter transition-all">{s?.name || 'Anonymous Member'}</span>
                           <span className="text-[9px] text-[#A5A58D] font-black uppercase tracking-[0.2em]">• {log.date}</span>
                        </div>
                        <p className="text-[#433E37]/80 text-lg font-serif italic leading-relaxed group-hover:text-[#433E37] transition-colors">"{log.comment}"</p>
                     </div>
                     <div className="flex flex-col items-end gap-2 shrink-0">
                        <div className="w-10 h-10 rounded-2xl bg-[#F2EDE4] flex items-center justify-center text-[#A5A58D]">
                          <Clock size={18} />
                        </div>
                        <span className="text-[9px] font-black text-[#A5A58D] uppercase tracking-widest">{format(log.timestamp, 'HH:mm aaa')}</span>
                     </div>
                   </div>
                 </motion.div>
               );
             })}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
