import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firebaseUtils';
import { Student } from '../types';
import { Plus, User, Mail, Phone, GraduationCap, X, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';

export default function StudentDirectory() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  
  // Form state
  const [newStudent, setNewStudent] = useState({
    name: '',
    studentId: '',
    grade: '',
    parentPhone: '',
    parentEmail: ''
  });

  useEffect(() => {
    async function fetchStudents() {
      try {
        const snap = await getDocs(collection(db, 'students'));
        setStudents(snap.docs.map(d => ({ id: d.id, ...d.data() } as Student)));
      } catch (err) {
        console.error('Error fetching students:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchStudents();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const studentData = {
        ...newStudent,
        createdAt: Date.now()
      };
      const docRef = await addDoc(collection(db, 'students'), studentData);
      setStudents(prev => [...prev, { id: docRef.id, ...studentData }]);
      setShowAddModal(false);
      setNewStudent({ name: '', studentId: '', grade: '', parentPhone: '', parentEmail: '' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to enroll student. Please check your permissions.');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-8 lg:p-12 space-y-12"
    >
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-7xl font-serif text-[#6B705C] font-black tracking-tighter">Student Registry</h1>
          <p className="text-[#A5A58D] font-serif italic text-xl mt-2">Managing the future generations of Oakwood</p>
        </div>
        
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-3 bg-[#D95D39] text-white px-10 py-5 rounded-[2rem] font-black uppercase tracking-widest text-xs shadow-xl shadow-[#D95D39]/20 hover:-translate-y-1 transition-all active:scale-95"
        >
          <Plus size={24} />
          New Enrollment
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {loading ? (
          <div className="col-span-full py-32 text-center">
            <div className="w-12 h-12 border-4 border-[#F2EDE4] border-t-[#6B705C] rounded-full animate-spin mx-auto" />
          </div>
        ) : students.map((student) => (
          <Link key={student.id} to={`/students/${student.id}`}>
            <motion.div 
              whileHover={{ y: -10 }}
              className="bg-white p-10 rounded-[3rem] border border-[#E5DEC9] shadow-sm hover:shadow-2xl hover:border-[#6B705C]/40 transition-all cursor-pointer relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                 <GraduationCap size={120} className="text-[#6B705C]" />
              </div>

              <div className="relative space-y-8">
                <div className="w-20 h-20 rounded-[2rem] bg-[#F2EDE4] border border-[#E5DEC9] flex items-center justify-center text-3xl font-serif font-black text-[#6B705C] group-hover:bg-[#6B705C] group-hover:text-white transition-all">
                  {student.name.charAt(0)}
                </div>

                <div>
                  <h3 className="text-3xl font-serif font-bold text-[#433E37] tracking-tight">{student.name}</h3>
                  <div className="flex items-center gap-3 mt-3">
                    <span className="px-3 py-1 bg-[#F1F3E9] text-[#6B705C] text-[10px] rounded-full border border-[#D1D9B5] font-black uppercase tracking-widest">
                       Grade {student.grade}
                    </span>
                    <span className="text-[10px] font-black text-[#A5A58D] uppercase tracking-widest opacity-60">ID: {student.studentId}</span>
                  </div>
                </div>

                <div className="space-y-4 pt-8 border-t border-[#F2EDE4]">
                  <div className="flex items-center gap-3 text-sm text-[#A5A58D] font-medium">
                    <Phone size={16} className="opacity-40" />
                    {student.parentPhone}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-[#A5A58D] font-medium">
                    <Mail size={16} className="opacity-40" />
                    {student.parentEmail}
                  </div>
                </div>
              </div>
            </motion.div>
          </Link>
        ))}
      </div>

      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 sm:p-24 backdrop-blur-md bg-[#6B705C]/20">
            <motion.div 
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className="bg-[#F9F7F2] w-full max-w-3xl rounded-[4rem] shadow-3xl border border-[#E5DEC9] overflow-hidden"
            >
                <div className="p-16 pb-0 flex justify-between items-start">
                  <div>
                    <h2 className="text-5xl font-serif font-black text-[#6B705C] tracking-tighter italic">Enrollment Form</h2>
                    <p className="text-[#A5A58D] font-serif mt-2 italic">Fill all details accurately for the student file.</p>
                  </div>
                  <button onClick={() => setShowAddModal(false)} className="p-4 bg-white hover:bg-[#D95D39] hover:text-white rounded-[2rem] border border-[#E5DEC9] transition-all shadow-sm">
                    <X size={24} />
                  </button>
                </div>

                {error && (
                  <div className="mx-16 mt-8 p-6 bg-[#D95D39]/10 border border-[#D95D39]/20 rounded-3xl flex items-center gap-4 text-[#D95D39]">
                    <AlertTriangle size={24} />
                    <p className="text-sm font-bold">{error}</p>
                  </div>
                )}

                <form onSubmit={handleAdd} className="p-16 space-y-10">
                  <div className="grid md:grid-cols-2 gap-10">
                    <InputField 
                      label="Full Name" 
                      value={newStudent.name} 
                      onChange={v => setNewStudent(p => ({ ...p, name: v }))} 
                      icon={<User size={18} />}
                      disabled={submitting}
                    />
                    <InputField 
                      label="Academic ID" 
                      value={newStudent.studentId} 
                      onChange={v => setNewStudent(p => ({ ...p, studentId: v }))} 
                      icon={<GraduationCap size={18} />}
                      disabled={submitting}
                    />
                    <InputField 
                      label="Grade / Class" 
                      value={newStudent.grade} 
                      onChange={v => setNewStudent(p => ({ ...p, grade: v }))} 
                      disabled={submitting}
                    />
                    <InputField 
                      label="Primary Contact" 
                      value={newStudent.parentPhone} 
                      onChange={v => setNewStudent(p => ({ ...p, parentPhone: v }))} 
                      icon={<Phone size={18} />}
                      disabled={submitting}
                    />
                    <div className="md:col-span-2">
                      <InputField 
                        label="Contact Email Address" 
                        value={newStudent.parentEmail} 
                        onChange={v => setNewStudent(p => ({ ...p, parentEmail: v }))} 
                        icon={<Mail size={18} />}
                        disabled={submitting}
                      />
                    </div>
                  </div>

                  <div className="pt-6">
                    <button 
                      type="submit"
                      disabled={submitting}
                      className="w-full bg-[#6B705C] text-white py-6 rounded-[2.5rem] font-black tracking-widest uppercase text-sm shadow-2xl shadow-[#6B705C]/20 hover:-translate-y-1 hover:bg-[#433E37] transition-all disabled:opacity-50 disabled:translate-y-0"
                    >
                      {submitting ? 'Authenticating Enrollment...' : 'Finalize Student Registry'}
                    </button>
                  </div>
                </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function InputField({ label, value, onChange, icon, disabled }: any) {
  return (
    <div className="space-y-3">
      <label className="text-[10px] font-black text-[#A5A58D] uppercase tracking-[0.2em] ml-2">{label}</label>
      <div className="relative">
        {icon && <div className="absolute left-6 top-1/2 -translate-y-1/2 text-[#A5A58D]">{icon}</div>}
        <input 
          required
          disabled={disabled}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full ${icon ? 'pl-16' : 'px-8'} py-5 bg-white border border-[#E5DEC9] rounded-[2rem] shadow-sm focus:outline-none focus:ring-4 focus:ring-[#E5DEC9]/30 focus:border-[#6B705C] transition-all font-medium text-[#433E37] disabled:opacity-50`}
        />
      </div>
    </div>
  );
}
