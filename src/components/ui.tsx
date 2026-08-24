import type { LeadStatus } from '@/lib/supabase';
import { CheckCircle2, Phone, Sparkles, XCircle } from 'lucide-react';

export const LEAD_STATUS_META: Record<LeadStatus, { label: string; classes: string; dot: string; icon: React.ReactNode }> = {
  new: {
    label: 'New',
    classes: 'bg-sky-50 text-sky-700 border-sky-200',
    dot: 'bg-sky-500',
    icon: <Sparkles className="w-3 h-3" />,
  },
  contacted: {
    label: 'Contacted',
    classes: 'bg-amber-50 text-amber-700 border-amber-200',
    dot: 'bg-amber-500',
    icon: <Phone className="w-3 h-3" />,
  },
  converted: {
    label: 'Converted',
    classes: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-500',
    icon: <CheckCircle2 className="w-3 h-3" />,
  },
  lost: {
    label: 'Lost',
    classes: 'bg-rose-50 text-rose-700 border-rose-200',
    dot: 'bg-rose-500',
    icon: <XCircle className="w-3 h-3" />,
  },
};

export const LEAD_STATUSES: LeadStatus[] = ['new', 'contacted', 'converted', 'lost'];

export function StatusBadge({ status }: { status: LeadStatus }) {
  const meta = LEAD_STATUS_META[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${meta.classes}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
      {meta.label}
    </span>
  );
}

export function formatCurrency(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
