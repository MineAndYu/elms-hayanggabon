import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut, User as FirebaseUser } from 'firebase/auth';
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

interface UserProfile {
  name: string;
  email: string;
  role: 'admin' | 'teacher';
}

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
            role: role
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

  const logout = () => signOut(auth);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f5f0]">
        <motion.div 
          animate={{ scale: [1, 1.1, 1] }} 
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="text-[#5A5A40] font-serif text-2xl italic"
        >
          EduTrack Pro...
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen grid lg:grid-cols-2 bg-[#F9F7F2]">
        <div className="hidden lg:flex flex-col justify-center p-16 bg-[#6B705C] text-[#F9F7F2]">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-8xl font-serif leading-none mb-8 font-black tracking-tighter"
          >
            OAKWOOD<br />ACADEMY
          </motion.h1>
          <p className="text-white/60 max-w-sm text-lg leading-relaxed font-sans">
            A comprehensive management system for modern educational institutions. 
            Track attendance, manage student behavior, and keep parents informed.
          </p>
        </div>
        <div className="flex flex-col justify-center items-center p-8">
          <div className="w-full max-w-sm space-y-8 bg-white p-8 rounded-[2rem] shadow-sm border border-[#E5DEC9]">
            <div className="text-center">
              <h2 className="text-2xl font-serif font-bold tracking-tight text-[#433E37]">Welcome Back</h2>
              <p className="text-sm text-[#A5A58D] mt-2 italic font-serif">Sign in to access your dashboard</p>
            </div>
            
            <button
              onClick={login}
              className="w-full flex items-center justify-center gap-3 bg-[#6B705C] text-white py-4 rounded-xl font-medium hover:bg-[#433E37] transition-all active:scale-[0.98] shadow-md shadow-[#6B705C]/20"
            >
              <ShieldCheck className="w-5 h-5" />
              Sign in with Google
            </button>

            <div className="text-center">
              <p className="text-xs text-[#A5A58D]">
                Secured by Oakwood Security Systems
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
              <h1 className="text-2xl font-serif text-[#6B705C] font-bold tracking-tight leading-tight">Oakwood<br/>Academy</h1>
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
