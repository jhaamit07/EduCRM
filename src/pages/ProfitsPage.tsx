import { useEffect, useMemo, useState } from 'react';
import {
  TrendingUp, DollarSign, CheckCircle2, Percent, ArrowDownRight, ArrowUpRight,
  BookOpen, Loader2, type LucideIcon,
} from 'lucide-react';
import { supabase, type Lead, type Course } from '@/lib/supabase';
import { formatCurrency, LEAD_STATUS_META } from '@/components/ui';

interface CoursePerf {
  course: Course;
  enrolled: number;
  revenue: number;
  cost: number;
  profit: number;
}

export default function ProfitsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [leadsRes, coursesRes] = await Promise.all([
        supabase.from('leads').select('*, course:courses(*)'),
        supabase.from('courses').select('*'),
      ]);
      setLeads((leadsRes.data ?? []) as Lead[]);
      setCourses((coursesRes.data ?? []) as Course[]);
      setLoading(false);
    })();
  }, []);

  const metrics = useMemo(() => {
    const converted = leads.filter((l) => l.status === 'converted');
    const totalRevenue = converted.reduce((sum, l) => sum + Number(l.course?.price ?? 0), 0);
    const totalCost = converted.reduce((sum, l) => sum + Number(l.course?.cost ?? 0), 0);
    const netProfit = totalRevenue - totalCost;
    const conversionRate = leads.length > 0 ? (converted.length / leads.length) * 100 : 0;
    const avgRevenue = converted.length > 0 ? totalRevenue / converted.length : 0;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    return { convertedCount: converted.length, totalRevenue, totalCost, netProfit, conversionRate, avgRevenue, profitMargin };
  }, [leads]);

  const coursePerf = useMemo<CoursePerf[]>(() => {
    const map = new Map<string, CoursePerf>();
    for (const c of courses) {
      map.set(c.id, { course: c, enrolled: 0, revenue: 0, cost: 0, profit: 0 });
    }
    for (const l of leads) {
      if (l.status !== 'converted' || !l.course) continue;
      const entry = map.get(l.course.id);
      if (!entry) continue;
      entry.enrolled += 1;
      entry.revenue += Number(l.course.price);
      entry.cost += Number(l.course.cost);
      entry.profit += Number(l.course.price) - Number(l.course.cost);
    }
    return Array.from(map.values()).sort((a, b) => b.profit - a.profit);
  }, [leads, courses]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { new: 0, contacted: 0, converted: 0, lost: 0 };
    for (const l of leads) counts[l.status] = (counts[l.status] ?? 0) + 1;
    return counts;
  }, [leads]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          icon={CheckCircle2}
          label="Total Conversions"
          value={String(metrics.convertedCount)}
          accent="emerald"
          sub={`out of ${leads.length} leads`}
        />
        <MetricCard
          icon={DollarSign}
          label="Revenue Generated"
          value={formatCurrency(metrics.totalRevenue)}
          accent="sky"
          sub={`Avg ${formatCurrency(metrics.avgRevenue)} / enrollment`}
        />
        <MetricCard
          icon={ArrowDownRight}
          label="Delivery Cost"
          value={formatCurrency(metrics.totalCost)}
          accent="rose"
          sub="Across all conversions"
        />
        <MetricCard
          icon={TrendingUp}
          label="Net Profit"
          value={formatCurrency(metrics.netProfit)}
          accent="amber"
          sub={`${metrics.profitMargin.toFixed(1)}% margin`}
        />
      </div>

      {/* Conversion funnel + rate */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 lg:col-span-2">
          <h3 className="font-semibold text-slate-900 mb-1">Conversion Funnel</h3>
          <p className="text-xs text-slate-500 mb-5">How leads move through each pipeline stage</p>
          <div className="space-y-4">
            {(['new', 'contacted', 'converted', 'lost'] as const).map((status) => {
              const count = statusCounts[status] ?? 0;
              const pct = leads.length > 0 ? (count / leads.length) * 100 : 0;
              const meta = LEAD_STATUS_META[status];
              return (
                <div key={status}>
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <span className="flex items-center gap-2 text-slate-700 font-medium">
                      <span className={`w-2.5 h-2.5 rounded-full ${meta.dot}`} />
                      {meta.label}
                    </span>
                    <span className="text-slate-500">{count} <span className="text-slate-400">({pct.toFixed(0)}%)</span></span>
                  </div>
                  <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${meta.dot} rounded-full transition-all duration-700 ease-out`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 text-white flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center mb-4">
              <Percent className="w-5 h-5 text-sky-300" />
            </div>
            <p className="text-sm text-slate-400">Conversion Rate</p>
            <p className="text-4xl font-bold mt-1">{metrics.conversionRate.toFixed(1)}%</p>
          </div>
          <div className="mt-6 pt-6 border-t border-white/10">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Profit Margin</span>
              <span className="font-semibold text-emerald-300">{metrics.profitMargin.toFixed(1)}%</span>
            </div>
            <div className="flex items-center justify-between text-sm mt-2">
              <span className="text-slate-400">Revenue / Lead</span>
              <span className="font-semibold text-sky-300">
                {leads.length > 0 ? formatCurrency(metrics.totalRevenue / leads.length) : '$0'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Course performance table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-900">Course Profitability</h3>
          <p className="text-xs text-slate-500 mt-0.5">Revenue, cost, and net profit per course based on enrolled leads</p>
        </div>
        {coursePerf.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
              <BookOpen className="w-5 h-5 text-slate-400" />
            </div>
            <p className="text-sm text-slate-500">No courses available.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
                  <th className="text-left font-medium px-6 py-3">Course</th>
                  <th className="text-center font-medium px-6 py-3">Enrolled</th>
                  <th className="text-right font-medium px-6 py-3">Revenue</th>
                  <th className="text-right font-medium px-6 py-3">Cost</th>
                  <th className="text-right font-medium px-6 py-3">Net Profit</th>
                  <th className="text-right font-medium px-6 py-3 pr-8">Margin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {coursePerf.map((cp) => {
                  const margin = cp.revenue > 0 ? (cp.profit / cp.revenue) * 100 : 0;
                  return (
                    <tr key={cp.course.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                            <BookOpen className="w-4 h-4 text-slate-500" />
                          </div>
                          <span className="font-medium text-slate-900">{cp.course.title}</span>
                        </div>
                      </td>
                      <td className="px-6 py-3.5 text-center text-slate-600 font-medium">{cp.enrolled}</td>
                      <td className="px-6 py-3.5 text-right text-slate-700">{formatCurrency(cp.revenue)}</td>
                      <td className="px-6 py-3.5 text-right text-rose-600">{formatCurrency(cp.cost)}</td>
                      <td className={`px-6 py-3.5 text-right font-semibold ${cp.profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {formatCurrency(cp.profit)}
                      </td>
                      <td className="px-6 py-3.5 pr-8 text-right">
                        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
                          margin >= 50 ? 'bg-emerald-50 text-emerald-700' : margin >= 20 ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'
                        }`}>
                          {margin >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                          {Math.abs(margin).toFixed(0)}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50 font-semibold text-slate-900">
                  <td className="px-6 py-3.5">Total</td>
                  <td className="px-6 py-3.5 text-center">{metrics.convertedCount}</td>
                  <td className="px-6 py-3.5 text-right">{formatCurrency(metrics.totalRevenue)}</td>
                  <td className="px-6 py-3.5 text-right text-rose-600">{formatCurrency(metrics.totalCost)}</td>
                  <td className="px-6 py-3.5 text-right text-emerald-600">{formatCurrency(metrics.netProfit)}</td>
                  <td className="px-6 py-3.5 pr-8" />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function MetricCard({
  icon: Icon, label, value, accent, sub,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  accent: 'sky' | 'emerald' | 'amber' | 'rose';
  sub?: string;
}) {
  const accents = {
    sky: 'bg-sky-50 text-sky-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    rose: 'bg-rose-50 text-rose-600',
  };
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-md hover:border-slate-300 transition-all">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${accents[accent]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-2xl font-bold text-slate-900 mt-3">{value}</p>
      <p className="text-sm text-slate-500">{label}</p>
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
    </div>
  );
}
