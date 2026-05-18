import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firebaseUtils';
import { EmergencyClosure, Student } from '../types';
import { AlertTriangle, Send, History, CheckCircle2, ShieldAlert } from 'lucide-react';
import { motion } from 'motion/react';
import { format } from 'date-fns';

export default function EmergencyCenter() {
  const [students, setStudents] = useState<Student[]>([]);
  const [history, setHistory] = useState<EmergencyClosure[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  
  const [msg, setMsg] = useState({
    title: '',
    message: ''
  });

  useEffect(() => {
    async function fetchData() {
      try {
        const [stSnap, ecSnap] = await Promise.all([
          getDocs(collection(db, 'students')),
          getDocs(collection(db, 'emergencyClosures'))
        ]);
        setStudents(stSnap.docs.map(d => ({ id: d.id, ...d.data() } as Student)));
        setHistory(ecSnap.docs.map(d => ({ id: d.id, ...d.data() } as EmergencyClosure))
          .sort((a,b) => b.sentAt - a.sentAt));
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'emergency');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !msg.title || !msg.message) return;

    if (!confirm("CRITICAL: This will send notifications to ALL parents. Proceed?")) return;

    try {
      setSending(true);
      const payload: Omit<EmergencyClosure, 'id'> = {
        title: msg.title,
        message: msg.message,
        sentAt: Date.now(),
        senderId: auth.currentUser.uid
      };

      await addDoc(collection(db, 'emergencyClosures'), payload);
      
      // Call backend to "send" SMS
      await fetch('/api/emergency-send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: payload.title,
          content: payload.message,
          recipients: students.map(s => s.parentPhone)
        })
      });

      setHistory(prev => [{ id: 'temp', ...payload }, ...prev]);
      setMsg({ title: '', message: '' });
      alert("Broadcast sent successfully.");
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'emergency');
    } finally {
      setSending(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-8 lg:p-12 space-y-12"
    >
      <header>
        <div className="flex items-center gap-6 mb-4">
          <div className="p-4 bg-[#D95D39] text-white rounded-[2rem] shadow-xl shadow-[#D95D39]/20 animate-pulse">
            <ShieldAlert size={36} />
          </div>
          <div>
            <h1 className="text-7xl font-serif text-[#D95D39] font-black tracking-tighter italic">Critical Broadcast</h1>
            <p className="text-[#A5A58D] font-serif italic text-xl mt-2">Immediate notification gateway for registered members</p>
          </div>
        </div>
      </header>

      <div className="grid lg:grid-cols-2 gap-12">
        {/* Broadcast Form */}
        <div className="bg-white p-14 rounded-[4rem] border border-[#E5DEC9] shadow-3xl space-y-10 relative overflow-hidden group">
          <div className="absolute -top-10 -right-10 p-12 opacity-5 rotate-12 group-hover:scale-110 transition-transform duration-700">
             <AlertTriangle size={240} className="text-[#D95D39]" />
          </div>
          
          <div className="space-y-4">
            <h2 className="text-3xl font-serif font-black tracking-tighter text-[#D95D39] italic">New Transmission</h2>
            <p className="text-sm text-[#A5A58D] font-bold leading-relaxed max-w-sm">Craft the message of urgency below. All broadcasts are final and archived permanently.</p>
          </div>

          <form onSubmit={handleBroadcast} className="space-y-8">
            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-[0.4em] text-[#A5A58D] ml-2">Header / Subject</label>
              <input 
                required
                value={msg.title}
                onChange={e => setMsg(p => ({ ...p, title: e.target.value }))}
                placeholder="e.g. URGENT: Campus Access Revoked"
                className="w-full px-10 py-6 bg-[#F9F7F2]/50 border border-[#E5DEC9] rounded-[2.5rem] focus:outline-none focus:ring-4 focus:ring-[#D95D39]/10 focus:border-[#D95D39] focus:bg-white text-xl font-serif font-bold text-[#433E37] placeholder-[#433E37]/10"
              />
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-[0.4em] text-[#A5A58D] ml-2">Transmission Body</label>
              <textarea 
                required
                value={msg.message}
                onChange={e => setMsg(p => ({ ...p, message: e.target.value }))}
                placeholder="Detailed instructions and chronological context..."
                className="w-full h-56 px-10 py-8 bg-[#F9F7F2]/50 border border-[#E5DEC9] rounded-[3rem] focus:outline-none focus:ring-4 focus:ring-[#D95D39]/10 focus:border-[#D95D39] focus:bg-white resize-none text-lg font-serif italic text-[#433E37] placeholder-[#433E37]/10 leading-relaxed"
              />
            </div>

            <button 
              type="submit"
              disabled={sending}
              className="w-full bg-[#D95D39] text-white py-8 rounded-[2.5rem] font-black uppercase tracking-[0.3em] text-sm shadow-3xl shadow-[#D95D39]/30 hover:bg-[#B04B2E] hover:-translate-y-2 active:scale-95 transition-all disabled:opacity-30"
            >
              {sending ? 'Uplinking Broadcast...' : <div className="flex items-center justify-center gap-4"><Send size={24} strokeWidth={3} /> Initiate Global Pulse</div>}
            </button>
          </form>
        </div>

        {/* History Panel */}
        <div className="space-y-10">
           <h2 className="text-2xl font-serif font-bold text-[#6B705C] flex items-center gap-4 ml-4">
             <History className="opacity-30" />
             Transmission Archive
           </h2>
           
           <div className="space-y-6 max-h-[800px] overflow-y-auto pr-6 custom-scrollbar pb-10">
             {history.length > 0 ? history.map((log) => (
               <div key={log.id} className="bg-white p-10 rounded-[3.5rem] border border-[#E5DEC9] shadow-sm relative overflow-hidden group hover:border-[#D95D39]/30 transition-all">
                  <div className="absolute top-0 right-0 w-2 h-full bg-[#D95D39] opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="flex justify-between items-start mb-6">
                    <h4 className="font-serif font-black text-2xl text-[#433E37] group-hover:text-[#D95D39] transition-colors italic">{log.title}</h4>
                    <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-4 py-1.5 rounded-full border border-emerald-100">
                      <CheckCircle2 size={12} strokeWidth={3} />
                      <span className="text-[9px] font-black tracking-widest uppercase">Validated</span>
                    </div>
                  </div>
                  <p className="text-[#433E37]/80 text-base font-serif italic mb-8 leading-relaxed">"{log.message}"</p>
                  <div className="flex items-center justify-between pt-6 border-t border-[#F2EDE4]">
                    <span className="text-[9px] font-black text-[#A5A58D] uppercase tracking-[0.3em]">{format(log.sentAt, 'MMMM do, yyyy')}</span>
                    <span className="text-[9px] font-black text-[#A5A58D] uppercase tracking-[0.3em] font-mono opacity-40">{format(log.sentAt, 'HH:mm:ss')}</span>
                  </div>
               </div>
             )) : (
                <div className="p-24 text-center border-2 border-dashed border-[#E5DEC9] rounded-[4rem] opacity-30">
                  <p className="text-[#A5A58D] font-black uppercase tracking-[0.4em] text-[10px]">Registry is currently blank</p>
                </div>
             )}
           </div>
        </div>
      </div>
    </motion.div>
  );
}
