import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  signInAnonymously,
  User as FirebaseUser 
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from './lib/firebase';
import { 
  Users, 
  UserCheck, 
  AlertTriangle, 
  BarChart3, 
  Calendar, 
  User as UserIcon, 
  LogOut, 
  LayoutDashboard,
  MessageSquare,
  ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import { format } from 'date-fns';

// Components
import Dashboard from './components/Dashboard';
import AttendanceManager from './components/AttendanceManager';
import StudentDirectory from './components/StudentDirectory';
import StudentProfile from './components/StudentProfile';
import ReportViewer from './components/ReportViewer';
import BehaviorLogger from './components/BehaviorLogger';
import EmergencyCenter from './components/EmergencyCenter';
import CalendarView from './components/CalendarView';
import ParentPortal from './components/ParentPortal';
import StaffManagement from './components/StaffManagement';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { Student } from './types';

interface UserProfile {
  name: string;
  email: string;
  role: 'admin' | 'teacher';
  facultyId?: string;
}

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [loginRole, setLoginRole] = useState<'admin' | 'parent'>('admin');
  
  // Parent Mode
  const [parentStudent, setParentStudent] = useState<Student | null>(null);
  const [lrnInput, setLrnInput] = useState('');
  const [parentLoading, setParentLoading] = useState(false);
  const [parentError, setParentError] = useState<string | null>(null);

  useEffect(() => {
    // Check if parent info is in local storage
    const savedParent = localStorage.getItem('parent_student');
    if (savedParent) {
      setParentStudent(JSON.parse(savedParent));
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setProfile(docSnap.data() as UserProfile);
        } else {
          // If profile doesn't exist, this might be first setup or we need to create it
          // For MVP, we'll check if a bootstrap doc exists. If not, make first user admin.
          const bootstrapRef = doc(db, 'users', 'bootstrap');
          const bootstrapSnap = await getDoc(bootstrapRef);
          
          let role: 'admin' | 'teacher' = 'teacher';
          if (!bootstrapSnap.exists()) {
            role = 'admin';
            await setDoc(bootstrapRef, { initialized: true });
          }

          const newProfile: UserProfile = {
            name: user.displayName || 'Staff Member',
            email: user.email || '',
            role: role,
            facultyId: `FAC-${user.uid.slice(0, 4).toUpperCase()}`
          };
          await setDoc(docRef, newProfile);
          setProfile(newProfile);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = () => {
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider);
  };

  const logout = () => {
    signOut(auth);
    setParentStudent(null);
    localStorage.removeItem('parent_student');
  };

  const handleParentLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setParentLoading(true);
    setParentError(null);
    try {
      // Sign in anonymously if not already signed in
      if (!auth.currentUser) {
        await signInAnonymously(auth);
      }
      
      const q = query(collection(db, 'students'), where('studentId', '==', lrnInput), limit(1));
      const snap = await getDocs(q);
      
      if (!snap.empty) {
        const studentData = { id: snap.docs[0].id, ...snap.docs[0].data() } as Student;
        setParentStudent(studentData);
        localStorage.setItem('parent_student', JSON.stringify(studentData));
      } else {
        setParentError("No student found with this LRN. Please check and try again.");
      }
    } catch (err: any) {
      console.error("Parent login error:", err);
      setParentError(err.message || "Connection error. Please try again later.");
    } finally {
      setParentLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f5f0]">
        <motion.div 
          animate={{ scale: [1, 1.1, 1] }} 
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="text-[#5A5A40] font-serif text-2xl italic"
        >
          Hayanggabon ES...
        </motion.div>
      </div>
    );
  }

  // Parent Portal view takes precedence if entered
  if (parentStudent) {
    return <ParentPortal student={parentStudent} onLogout={logout} />;
  }

  if (!user) {
    return (
      <div className="min-h-screen grid lg:grid-cols-2 bg-[#F9F7F2]">
        <div className="hidden lg:flex flex-col justify-center p-16 bg-[#6B705C] text-[#F9F7F2]">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-12"
          >
            <div className="w-24 h-24 bg-white/20 rounded-3xl flex items-center justify-center mb-6">
              <ShieldCheck size={48} className="text-white" />
            </div>
            <h1 className="text-7xl font-serif leading-none font-black tracking-tighter">
              HAYANGGABON<br />ELEMENTARY
            </h1>
            <p className="text-white/60 max-w-sm text-lg mt-6 leading-relaxed font-sans">
              Official Management System. 
              Connecting teachers, parents, and students through digital transparency.
            </p>
          </motion.div>
        </div>
        <div className="flex flex-col justify-center items-center p-8">
          <div className="w-full max-w-md space-y-8 bg-white p-10 rounded-[3rem] shadow-2xl border border-[#E5DEC9]">
            <div className="text-center">
              <div className="inline-flex p-1 bg-[#F2EDE4] rounded-2xl mb-6">
                <button 
                  onClick={() => setLoginRole('admin')}
                  className={`px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${loginRole === 'admin' ? 'bg-[#6B705C] text-white shadow-lg' : 'text-[#A5A58D]'}`}
                >
                  Admin/Staff
                </button>
                <button 
                  onClick={() => setLoginRole('parent')}
                  className={`px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${loginRole === 'parent' ? 'bg-[#6B705C] text-white shadow-lg' : 'text-[#A5A58D]'}`}
                >
                  Student/Parent
                </button>
              </div>
              <h2 className="text-3xl font-serif font-bold tracking-tight text-[#433E37]">
                {loginRole === 'admin' ? 'Gateway Portal' : 'Family Access'}
              </h2>
              <p className="text-sm text-[#A5A58D] mt-2 italic font-serif">
                {loginRole === 'admin' ? 'Authorized personnel only' : 'Check student progress via LRN'}
              </p>
            </div>
            
            {loginRole === 'admin' ? (
              <button
                onClick={login}
                className="w-full flex items-center justify-center gap-3 bg-[#6B705C] text-white py-5 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-[#433E37] transition-all active:scale-[0.98] shadow-xl shadow-[#6B705C]/20"
              >
                <ShieldCheck className="w-5 h-5" />
                Sign in with Faculty ID
              </button>
            ) : (
              <form onSubmit={handleParentLogin} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[#A5A58D] uppercase tracking-widest ml-2">Student LRN</label>
                  <input 
                    type="text" 
                    value={lrnInput}
                    onChange={(e) => setLrnInput(e.target.value)}
                    placeholder="Enter 12-digit LRN" 
                    required
                    className="w-full px-6 py-4 bg-[#F9F7F2] border border-[#E5DEC9] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#6B705C] font-medium"
                  />
                </div>
                {parentError && <p className="text-xs text-[#D95D39] font-bold px-2">{parentError}</p>}
                <button
                  type="submit"
                  disabled={parentLoading}
                  className="w-full bg-[#D95D39] text-white py-5 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-[#A53F2B] transition-all active:scale-[0.98] shadow-xl shadow-[#D95D39]/20 disabled:opacity-50"
                >
                  {parentLoading ? 'Validating LRN...' : 'Access Student Portal'}
                </button>
              </form>
            )}

            <div className="text-center pt-4">
              <p className="text-[10px] uppercase font-bold tracking-widest text-[#A5A58D]">
                Surigao del Norte, Philippines
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#F9F7F2] text-[#433E37] flex flex-col lg:flex-row">
        {/* Navigation Sidebar */}
        <nav className="w-full lg:w-72 bg-[#F2EDE4] border-r border-[#E5DEC9] flex flex-col h-screen overflow-y-auto">
          <div className="p-8">
            <Link to="/" className="flex items-center gap-2 mb-10">
              <h1 className="text-2xl font-serif text-[#6B705C] font-bold tracking-tight leading-tight">Hayanggabon<br/>Elementary</h1>
            </Link>

            <div className="space-y-2">
              <p className="text-[10px] font-bold text-[#A5A58D] uppercase tracking-widest mb-4">Nav Main</p>
              <NavItem to="/" icon={<LayoutDashboard size={20} />} label="Dashboard" />
              <NavItem to="/attendance" icon={<UserCheck size={20} />} label="Attendance" />
              <NavItem to="/students" icon={<Users size={20} />} label="Students" />
              <NavItem to="/reports" icon={<BarChart3 size={20} />} label="Reports" />
              <NavItem to="/calendar" icon={<Calendar size={20} />} label="Calendar" />
              <NavItem to="/behavior" icon={<MessageSquare size={20} />} label="Behavior Logs" />
              
              {profile?.role === 'admin' && (
                <>
                  <p className="text-[10px] font-bold text-[#A5A58D] uppercase tracking-widest mt-8 mb-4">Admin Hub</p>
                  <NavItem to="/staff" icon={<ShieldCheck size={20} />} label="Staff Management" />
                  <div className="bg-[#D95D39] text-white p-4 rounded-2xl shadow-lg shadow-[#D95D39]/20 group">
                    <p className="text-[10px] font-bold uppercase tracking-widest mb-2 opacity-70">Security</p>
                    <Link 
                      to="/emergency" 
                      className="w-full text-left font-serif py-1 flex items-center justify-between hover:translate-x-1 transition-transform"
                    >
                      Notify Parents
                      <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="mt-auto p-8 border-t border-[#E5DEC9]">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-[#A5A58D] border-2 border-white flex items-center justify-center font-bold text-white shadow-sm overflow-hidden">
                {profile?.name.charAt(0)}
              </div>
              <div>
                <p className="text-sm font-bold truncate max-w-[140px] text-[#6B705C]">{profile?.name}</p>
                <p className="text-[10px] text-[#A5A58D] uppercase font-bold tracking-widest">{profile?.role}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="w-full flex items-center justify-center gap-2 text-[#A5A58D] hover:text-[#D95D39] transition-colors py-2 text-xs font-bold uppercase tracking-widest"
            >
              <LogOut size={14} />
              Logout System
            </button>
          </div>
        </nav>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto">
          {/* Top Header Panel */}
          <header className="h-20 border-b border-[#E5DEC9] flex items-center justify-between px-8 bg-white/50 backdrop-blur-md sticky top-0 z-10">
            <div className="flex items-center space-x-4">
              <div className="text-xs font-bold text-[#A5A58D] uppercase tracking-widest">{format(new Date(), 'EEEE, MMM d, yyyy')}</div>
              <div className="h-4 w-[1px] bg-[#E5DEC9]"></div>
              <div className="text-sm font-medium text-[#6B705C]">Welcome back, <span className="font-serif italic">{profile?.name}</span></div>
            </div>
            <div className="flex items-center space-x-4">
              <button className="p-2.5 bg-[#E5DEC9] rounded-xl text-[#6B705C] hover:bg-[#6B705C] hover:text-white transition-all transform active:scale-95">
                <ShieldCheck size={20} />
              </button>
            </div>
          </header>

          <AnimatePresence mode="wait">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/attendance" element={<AttendanceManager />} />
              <Route path="/students" element={<StudentDirectory />} />
              <Route path="/students/:id" element={<StudentProfile />} />
              <Route path="/reports" element={<ReportViewer />} />
              <Route path="/calendar" element={<CalendarView />} />
              <Route path="/behavior" element={<BehaviorLogger />} />
              <Route path="/staff" element={profile?.role === 'admin' ? <StaffManagement /> : <Navigate to="/" />} />
              <Route path="/emergency" element={profile?.role === 'admin' ? <EmergencyCenter /> : <Navigate to="/" />} />
            </Routes>
          </AnimatePresence>
        </main>
      </div>
    </BrowserRouter>
  );
}

function NavItem({ to, icon, label }: { to: string, icon: React.ReactNode, label: string }) {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link
      to={to}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
        isActive 
          ? 'bg-[#E5DEC9] text-[#6B705C] shadow-sm' 
          : 'text-[#433E37] hover:bg-[#E5DEC9]/50 hover:text-[#6B705C]'
      }`}
    >
      <span className={isActive ? 'text-[#6B705C]' : 'opacity-40'}>{icon}</span>
      <span className={isActive ? 'font-bold' : ''}>{label}</span>
      {isActive && <motion.div layoutId="nav-pill" className="w-1 h-1 rounded-full bg-[#6B705C] ml-auto" />}
    </Link>
  );
}
