import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, updateDoc, doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ShieldCheck, User, Mail, Award, Edit3, Save, X, UserPlus, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface StaffProfile {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'teacher';
  facultyId?: string;
}

interface Invitation {
  email: string;
  role: 'teacher' | 'admin';
  invitedAt: any;
}

export default function StaffManagement() {
  const [staff, setStaff] = useState<StaffProfile[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<StaffProfile>>({});
  
  // Invitation Form
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'teacher' | 'admin'>('teacher');
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const [staffSnap, inviteSnap] = await Promise.all([
          getDocs(collection(db, 'users')),
          getDocs(collection(db, 'invitations'))
        ]);

        const staffData = staffSnap.docs
          .filter(d => d.id !== 'bootstrap')
          .map(d => ({ 
            id: d.id, 
            ...d.data(),
            facultyId: d.data().facultyId || `FAC-${d.id.slice(0, 4).toUpperCase()}`
          } as StaffProfile));
        
        setStaff(staffData);
        setInvitations(inviteSnap.docs.map(d => ({ email: d.id, ...d.data() } as Invitation)));
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;
    setInviting(true);
    try {
      await setDoc(doc(db, 'invitations', inviteEmail.toLowerCase()), {
        role: inviteRole,
        invitedAt: serverTimestamp()
      });
      setInvitations(prev => [...prev, { email: inviteEmail.toLowerCase(), role: inviteRole, invitedAt: new Date() }]);
      setInviteEmail('');
      setShowInviteModal(false);
    } catch (error) {
      console.error("Invite error:", error);
      alert("Failed to send invitation.");
    } finally {
      setInviting(false);
    }
  };

  const removeInvitation = async (email: string) => {
    try {
      await deleteDoc(doc(db, 'invitations', email));
      setInvitations(prev => prev.filter(i => i.email !== email));
    } catch (error) {
      console.error("Remove invitation error:", error);
    }
  };

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
    <div className="p-8 lg:p-12 space-y-12 pb-32">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-7xl font-serif text-[#6B705C] font-black tracking-tighter">Faculty Management</h1>
          <p className="text-[#A5A58D] font-serif italic text-xl mt-2">Oversee authorized personnel and credentials</p>
        </div>

        <button 
          onClick={() => setShowInviteModal(true)}
          className="flex items-center gap-3 bg-[#6B705C] text-white px-8 py-5 rounded-[2.5rem] font-black tracking-widest uppercase text-xs shadow-xl shadow-[#6B705C]/20 hover:-translate-y-1 hover:bg-[#433E37] transition-all"
        >
          <UserPlus size={18} />
          Pre-Authorize Account
        </button>
      </header>

      {/* Authorized Staff Table */}
      <section className="space-y-6">
        <h2 className="text-[10px] font-black text-[#A5A58D] uppercase tracking-[0.3em] ml-2">Active Faculty Members</h2>
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
      </section>

      {/* Invitations Section */}
      {invitations.length > 0 && (
        <section className="space-y-6">
          <h2 className="text-[10px] font-black text-[#A5A58D] uppercase tracking-[0.3em] ml-2">Pending Authorizations</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {invitations.map(invite => (
              <div key={invite.email} className="bg-[#F2EDE4]/30 border border-[#E5DEC9] p-6 rounded-3xl flex items-center justify-between">
                <div>
                  <p className="font-bold text-[#433E37] text-sm">{invite.email}</p>
                  <p className="text-[10px] font-black text-[#A5A58D] uppercase tracking-widest mt-1">Role: {invite.role}</p>
                </div>
                <button 
                  onClick={() => removeInvitation(invite.email)}
                  className="p-3 text-[#A5A58D] hover:text-[#D95D39] transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Invitation Modal */}
      <AnimatePresence>
        {showInviteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowInviteModal(false)}
              className="absolute inset-0 bg-[#433E37]/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-[#F9F7F2] w-full max-w-lg rounded-[3rem] shadow-3xl border border-[#E5DEC9] overflow-hidden relative z-10 p-12"
            >
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h2 className="text-3xl font-serif font-black text-[#6B705C] tracking-tighter italic">Pre-Authorize Faculty</h2>
                  <p className="text-[#A5A58D] font-serif mt-2 italic text-sm">Allow a specific email to join the school staff.</p>
                </div>
                <button onClick={() => setShowInviteModal(false)} className="p-3 bg-white hover:bg-[#D95D39] hover:text-white rounded-2xl border border-[#E5DEC9] transition-all">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleInvite} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[#A5A58D] uppercase tracking-widest ml-2">Google Email Address</label>
                  <input 
                    required
                    type="email"
                    value={inviteEmail}
                    onChange={e => setInviteEmail(e.target.value)}
                    placeholder="teacher@school.gov.ph"
                    className="w-full px-6 py-4 bg-white border border-[#E5DEC9] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#6B705C] font-medium"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[#A5A58D] uppercase tracking-widest ml-2">Default Permissions</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setInviteRole('teacher')}
                      className={`py-4 rounded-2xl border-2 font-bold text-xs uppercase tracking-widest transition-all ${inviteRole === 'teacher' ? 'bg-[#6B705C] text-white border-[#6B705C]' : 'bg-white text-[#A5A58D] border-[#E5DEC9]'}`}
                    >
                      Teacher
                    </button>
                    <button
                      type="button"
                      onClick={() => setInviteRole('admin')}
                      className={`py-4 rounded-2xl border-2 font-bold text-xs uppercase tracking-widest transition-all ${inviteRole === 'admin' ? 'bg-[#6B705C] text-white border-[#6B705C]' : 'bg-white text-[#A5A58D] border-[#E5DEC9]'}`}
                    >
                      Admin
                    </button>
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={inviting}
                  className="w-full bg-[#6B705C] text-white py-5 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-[#433E37] transition-all disabled:opacity-50 mt-4"
                >
                  {inviting ? 'Sending Authorization...' : 'Grant Access Rights'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      <div className="bg-[#6B705C] p-12 rounded-[4rem] text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 p-12 opacity-10"><ShieldCheck size={200} /></div>
        <div className="relative max-w-2xl space-y-6">
          <h2 className="text-4xl font-serif font-black tracking-tighter italic">Authorized Entry Protocol</h2>
          <p className="text-white/70 font-medium leading-relaxed">
            Teachers must be pre-authorized by an administrator using their Google email. 
            Once authorized, they simply sign in to gain instant access to their registry dashboard.
            <br/><br/>
            Security Note: First-time administrators can bypass authorization to bootstrap the school system.
          </p>
        </div>
      </div>
    </div>
  );
}
