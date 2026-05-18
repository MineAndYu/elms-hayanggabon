import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ShieldCheck, User, Mail, Award, Edit3, Save, X } from 'lucide-react';
import { motion } from 'motion/react';

interface StaffProfile {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'teacher';
  facultyId?: string;
}

export default function StaffManagement() {
  const [staff, setStaff] = useState<StaffProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<StaffProfile>>({});

  useEffect(() => {
    async function fetchStaff() {
      try {
        const snap = await getDocs(collection(db, 'users'));
        const staffData = snap.docs
          .filter(d => d.id !== 'bootstrap')
          .map(d => ({ 
            id: d.id, 
            ...d.data(),
            facultyId: d.data().facultyId || `FAC-${d.id.slice(0, 4).toUpperCase()}`
          } as StaffProfile));
        setStaff(staffData);
      } catch (error) {
        console.error("Error fetching staff:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchStaff();
  }, []);

  const handleStartEdit = (member: StaffProfile) => {
    setEditingId(member.id);
    setEditForm({ ...member });
  };

  const handleSave = async (id: string) => {
    try {
      const docRef = doc(db, 'users', id);
      await updateDoc(docRef, {
        role: editForm.role,
        facultyId: editForm.facultyId
      });
      setStaff(prev => prev.map(s => s.id === id ? { ...s, ...editForm } as StaffProfile : s));
      setEditingId(null);
    } catch (error) {
      console.error("Error updating staff:", error);
      alert("Failed to update permissions.");
    }
  };

  if (loading) {
    return (
      <div className="p-12 flex justify-center">
        <div className="w-10 h-10 border-4 border-[#E5DEC9] border-t-[#6B705C] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8 lg:p-12 space-y-12">
      <header>
        <h1 className="text-7xl font-serif text-[#6B705C] font-black tracking-tighter">Faculty Management</h1>
        <p className="text-[#A5A58D] font-serif italic text-xl mt-2">Oversee authorized personnel and credentials</p>
      </header>

      <div className="bg-white rounded-[3rem] border border-[#E5DEC9] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F2EDE4]/30">
                <th className="px-10 py-6 text-[10px] font-black text-[#A5A58D] uppercase tracking-widest">Faculty Member</th>
                <th className="px-10 py-6 text-[10px] font-black text-[#A5A58D] uppercase tracking-widest">Faculty ID</th>
                <th className="px-10 py-6 text-[10px] font-black text-[#A5A58D] uppercase tracking-widest">Authorized Role</th>
                <th className="px-10 py-6 text-[10px] font-black text-[#A5A58D] uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {staff.map((member) => (
                <tr key={member.id} className="border-t border-[#F2EDE4] hover:bg-[#F9F7F2]/50 transition-colors">
                  <td className="px-10 py-8">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-[#F2EDE4] flex items-center justify-center text-[#6B705C]">
                        <User size={20} />
                      </div>
                      <div>
                        <p className="font-black text-[#433E37] text-lg leading-tight">{member.name}</p>
                        <p className="text-xs text-[#A5A58D] mt-1">{member.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-10 py-8">
                    {editingId === member.id ? (
                      <input 
                        className="px-4 py-2 border border-[#E5DEC9] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6B705C] bg-[#F9F7F2] font-bold text-xs"
                        value={editForm.facultyId}
                        onChange={e => setEditForm(p => ({ ...p, facultyId: e.target.value }))}
                      />
                    ) : (
                      <span className="px-4 py-2 bg-[#F9F7F2] text-[#6B705C] rounded-xl font-bold border border-[#E5DEC9] text-xs">
                        {member.facultyId}
                      </span>
                    )}
                  </td>
                  <td className="px-10 py-8">
                    {editingId === member.id ? (
                      <select 
                        className="px-4 py-2 border border-[#E5DEC9] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6B705C] bg-[#F9F7F2] font-bold text-xs"
                        value={editForm.role}
                        onChange={e => setEditForm(p => ({ ...p, role: e.target.value as any }))}
                      >
                        <option value="teacher">Teacher</option>
                        <option value="admin">Administrator</option>
                      </select>
                    ) : (
                      <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest ${
                        member.role === 'admin' 
                          ? 'bg-[#6B705C] text-white border-[#6B705C]' 
                          : 'bg-[#F2EDE4] text-[#6B705C] border-[#E5DEC9]'
                      }`}>
                        {member.role === 'admin' ? <ShieldCheck size={12} /> : <Award size={12} />}
                        {member.role}
                      </div>
                    )}
                  </td>
                  <td className="px-10 py-8 text-right">
                    {editingId === member.id ? (
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleSave(member.id)}
                          className="p-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/20"
                        >
                          <Save size={18} />
                        </button>
                        <button 
                          onClick={() => setEditingId(null)}
                          className="p-3 bg-white text-[#A5A58D] border border-[#E5DEC9] rounded-xl hover:bg-[#F2EDE4] transition-colors"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => handleStartEdit(member)}
                        className="p-4 bg-white text-[#6B705C] border border-[#E5DEC9] rounded-2xl hover:bg-[#6B705C] hover:text-white transition-all shadow-sm group"
                      >
                        <Edit3 size={18} className="group-hover:scale-110 transition-transform" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="bg-[#6B705C] p-12 rounded-[4rem] text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 p-12 opacity-10"><ShieldCheck size={200} /></div>
        <div className="relative max-w-2xl space-y-6">
          <h2 className="text-4xl font-serif font-black tracking-tighter italic">Adding New Faculty</h2>
          <p className="text-white/70 font-medium leading-relaxed">
            New members should sign in using their official school Google account via the Faculty Portal. 
            Once they sign in for the first time, they will appear in this directory automatically. 
            Admins can then assign them a <span className="font-bold text-white italic underline underline-offset-4">Faculty ID</span> and upgrade their permissions.
          </p>
        </div>
      </div>
    </div>
  );
}
