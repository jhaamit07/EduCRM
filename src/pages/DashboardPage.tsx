import { useEffect, useState } from 'react';
import {
  Users, BookOpen, DollarSign, ArrowUpRight, Sparkles,
  CheckCircle2, type LucideIcon,
} from 'lucide-react';
import { supabase, type Lead, type Course, type LeadStatus } from '@/lib/supabase';
import { useAuth, isAdmin } from '@/context/AuthContext';
import { LEAD_STATUS_META, formatCurrency } from '@/components/ui';
import type { PageKey } from '@/components/AppLayout';

interface Stats {
  totalLeads: number;
  converted: number;
  contacted: number;
  newLeads: number;
  lost: number;
  courses: number;
  revenue: number;
}

export default function DashboardPage({ onNavigate }: { onNavigate: (p: PageKey) => void }) {
  const { profile } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [recent, setRecent] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [leadsRes, coursesRes] = await Promise.all([
        supabase.from('leads').select('*, course:courses(*)'),
        supabase.from('courses').select('*').eq('is_active', true),
      ]);

      const leads = (leadsRes.data ?? []) as Lead[];
      const courses = (coursesRes.data ?? []) as Course[];

      const converted = leads.filter((l) => l.status === 'converted');
      const revenue = converted.reduce((sum, l) => {
        const price = l.course?.price ?? 0;
        return sum + Number(price);
      }, 0);

      setStats({
        totalLeads: leads.length,
        converted: converted.length,
        contacted: leads.filter((l) => l.status === 'contacted').length,
        newLeads: leads.filter((l) => l.status === 'new').length,
        lost: leads.filter((l) => l.status === 'lost').length,
        courses: courses.length,
        revenue,
      });
      setRecent(
        [...leads]
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 6),
      );
      setLoading(false);
    })();
  }, []);

  if (loading) return <DashboardSkeleton />;

  const conversionRate = stats && stats.totalLeads > 0
    ? Math.round((stats.converted / stats.totalLeads) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 lg:p-8 text-white">
        <div className="absolute -top-20 -right-10 w-64 h-64 rounded-full bg-sky-500/20 blur-3xl" />
        <div className="absolute -bottom-16 left-1/3 w-48 h-48 rounded-full bg-emerald-500/15 blur-3xl" />
        <div className="relative">
          <p className="text-sky-300 text-sm font-medium mb-1">Welcome back</p>
          <h2 className="text-2xl lg:text-3xl font-bold">{profile?.full_name ?? 'Employee'}</h2>
          <p className="text-slate-400 mt-2 max-w-lg">
            {isAdmin(profile)
              ? 'You have admin access — manage courses, leads, and view full profit analytics.'
              : 'Track your leads, update statuses, and monitor conversions across your pipeline.'}
          </p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Leads" value={stats!.totalLeads} accent="sky" />
        <StatCard icon={CheckCircle2} label="Converted" value={stats!.converted} accent="emerald" sub={`${conversionRate}% conversion rate`} />
        <StatCard icon={BookOpen} label="Active Courses" value={stats!.courses} accent="violet" />
        <StatCard icon={DollarSign} label="Revenue" value={formatCurrency(stats!.revenue)} accent="amber" />
      </div>

      {/* Pipeline breakdown + recent leads */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-900 mb-4">Pipeline Overview</h3>
          <div className="space-y-3">
            <PipelineRow status="new" count={stats!.newLeads} total={stats!.totalLeads} />
            <PipelineRow status="contacted" count={stats!.contacted} total={stats!.totalLeads} />
            <PipelineRow status="converted" count={stats!.converted} total={stats!.totalLeads} />
            <PipelineRow status="lost" count={stats!.lost} total={stats!.totalLeads} />
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900">Recent Leads</h3>
            <button
              onClick={() => onNavigate('leads')}
              className="text-sm text-sky-600 hover:text-sky-700 font-medium flex items-center gap-1"
            >
              View all <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
          {recent.length === 0 ? (
            <EmptyState text="No leads yet. Add your first prospective student to get started." />
          ) : (
            <div className="divide-y divide-slate-100">
              {recent.map((lead) => (
                <div key={lead.id} className="flex items-center gap-3 py-3">
                  <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-medium text-sm shrink-0">
                    {lead.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-900 truncate">{lead.name}</p>
                    <p className="text-xs text-slate-500 truncate">{lead.email ?? lead.phone ?? 'No contact info'}</p>
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${LEAD_STATUS_META[lead.status].classes}`}>
                    {LEAD_STATUS_META[lead.status].label}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon, label, value, accent, sub,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  accent: 'sky' | 'emerald' | 'violet' | 'amber';
  sub?: string;
}) {
  const accents = {
    sky: 'bg-sky-50 text-sky-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    violet: 'bg-violet-50 text-violet-600',
    amber: 'bg-amber-50 text-amber-600',
  };
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-md hover:border-slate-300 transition-all">
      <div className="flex items-start justify-between">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${accents[accent]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <p className="text-2xl font-bold text-slate-900 mt-3">{value}</p>
      <p className="text-sm text-slate-500">{label}</p>
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
    </div>
  );
}

function PipelineRow({ status, count, total }: { status: LeadStatus; count: number; total: number }) {
  const meta = LEAD_STATUS_META[status];
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1.5">
        <span className="flex items-center gap-2 text-slate-700">
          <span className={`w-2 h-2 rounded-full ${meta.dot}`} />
          {meta.label}
        </span>
        <span className="text-slate-500 font-medium">{count} · {pct}%</span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full ${meta.dot} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
        <Sparkles className="w-5 h-5 text-slate-400" />
      </div>
      <p className="text-sm text-slate-500 max-w-xs">{text}</p>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-32 rounded-2xl bg-slate-200" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((i) => <div key={i} className="h-28 rounded-2xl bg-slate-200" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="h-48 rounded-2xl bg-slate-200" />
        <div className="h-48 rounded-2xl bg-slate-200 lg:col-span-2" />
      </div>
    </div>
  );
}
