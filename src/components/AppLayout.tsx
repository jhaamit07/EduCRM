import { useState, type ReactNode } from 'react';
import {
  GraduationCap, LayoutDashboard, Users, BookOpen, TrendingUp,
  LogOut, Menu, X, Shield, UserCircle,
} from 'lucide-react';
import { useAuth, isAdmin } from '@/context/AuthContext';

export type PageKey = 'dashboard' | 'leads' | 'courses' | 'profits';

interface NavItem {
  key: PageKey;
  label: string;
  icon: ReactNode;
}

const NAV: NavItem[] = [
  { key: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
  { key: 'leads', label: 'Leads', icon: <Users className="w-5 h-5" /> },
  { key: 'courses', label: 'Courses', icon: <BookOpen className="w-5 h-5" /> },
  { key: 'profits', label: 'Profits & Conversions', icon: <TrendingUp className="w-5 h-5" /> },
];

export default function AppLayout({
  page, onNavigate, children,
}: {
  page: PageKey;
  onNavigate: (p: PageKey) => void;
  children: ReactNode;
}) {
  const { profile, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const activeLabel = NAV.find((n) => n.key === page)?.label ?? '';

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar — desktop */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-40 h-screen w-64 bg-slate-900 text-slate-300 flex flex-col transition-transform duration-300 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex items-center gap-3 px-6 h-16 border-b border-slate-800 shrink-0">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-sky-500 to-emerald-500 flex items-center justify-center shrink-0">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-white leading-tight">EduCRM</p>
            <p className="text-[11px] text-slate-500 leading-tight">EdTech CRM Suite</p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV.map((item) => (
            <button
              key={item.key}
              onClick={() => { onNavigate(item.key); setMobileOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                page === item.key
                  ? 'bg-sky-500/15 text-sky-300 border border-sky-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-slate-800 shrink-0">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-slate-800/40 mb-2">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center shrink-0">
              <UserCircle className="w-5 h-5 text-slate-300" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">{profile?.full_name ?? 'Employee'}</p>
              <p className="text-[11px] text-slate-500 truncate">{profile?.email}</p>
            </div>
          </div>
          <div className="flex items-center justify-between px-3">
            <span
              className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-1 rounded-full ${
                isAdmin(profile)
                  ? 'bg-amber-500/15 text-amber-300'
                  : 'bg-emerald-500/15 text-emerald-300'
              }`}
            >
              {isAdmin(profile) ? <Shield className="w-3 h-3" /> : <UserCircle className="w-3 h-3" />}
              {isAdmin(profile) ? 'Admin' : 'Sales / Counselor'}
            </span>
            <button
              onClick={signOut}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-rose-300 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Main */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-20 bg-white/80 backdrop-blur border-b border-slate-200 h-16 flex items-center px-4 lg:px-8 gap-4">
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden p-2 -ml-2 text-slate-600 hover:text-slate-900"
          >
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold text-slate-900">{activeLabel}</h1>
          <div className="ml-auto hidden sm:flex items-center gap-2 text-sm text-slate-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Connected
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
