import { useEffect, useState, type FormEvent } from 'react';
import {
  Plus, Search, Pencil, Trash2, X, Loader2, Filter, Users, Mail, Phone, StickyNote,
} from 'lucide-react';
import { supabase, type Lead, type Course, type LeadStatus, type Profile } from '@/lib/supabase';
import { useAuth, isAdmin } from '@/context/AuthContext';
import { LEAD_STATUSES, LEAD_STATUS_META, formatDate } from '@/components/ui';

export default function LeadsPage() {
  const { profile } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [employees, setEmployees] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'all'>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Lead | null>(null);

  async function load() {
    setLoading(true);
    const [leadsRes, coursesRes, profilesRes] = await Promise.all([
      supabase.from('leads').select('*, course:courses(*), assignee:profiles(*)').order('created_at', { ascending: false }),
      supabase.from('courses').select('*').eq('is_active', true),
      supabase.from('profiles').select('*'),
    ]);
    setLeads((leadsRes.data ?? []) as Lead[]);
    setCourses((coursesRes.data ?? []) as Course[]);
    setEmployees((profilesRes.data ?? []) as Profile[]);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const filtered = leads.filter((l) => {
    const matchesSearch =
      !search ||
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      (l.email ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (l.phone ?? '').includes(search);
    const matchesStatus = statusFilter === 'all' || l.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  async function updateStatus(id: string, status: LeadStatus) {
    const { error } = await supabase.from('leads').update({ status }).eq('id', id);
    if (error) { alert('Failed to update status: ' + error.message); return; }
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l)));
  }

  async function deleteLead(id: string) {
    if (!confirm('Delete this lead? This cannot be undone.')) return;
    const { error } = await supabase.from('leads').delete().eq('id', id);
    if (error) { alert('Failed to delete: ' + error.message); return; }
    setLeads((prev) => prev.filter((l) => l.id !== id));
  }

  function openAdd() { setEditing(null); setModalOpen(true); }
  function openEdit(lead: Lead) { setEditing(lead); setModalOpen(true); }

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or phone..."
            className="w-full pl-10 pr-3 py-2.5 rounded-lg bg-white border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as LeadStatus | 'all')}
              className="pl-9 pr-8 py-2.5 rounded-lg bg-white border border-slate-200 text-sm text-slate-700 focus:outline-none focus:border-sky-500 appearance-none cursor-pointer"
            >
              <option value="all">All Statuses</option>
              {LEAD_STATUSES.map((s) => (
                <option key={s} value={s}>{LEAD_STATUS_META[s].label}</option>
              ))}
            </select>
          </div>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-sky-600 text-white text-sm font-medium hover:bg-sky-700 transition-colors shadow-sm whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            Add Lead
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-4">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
              <Users className="w-5 h-5 text-slate-400" />
            </div>
            <p className="text-sm font-medium text-slate-700">No leads found</p>
            <p className="text-xs text-slate-500 mt-1">
              {leads.length === 0 ? 'Add your first prospective student to get started.' : 'Try adjusting your search or filter.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
                  <th className="text-left font-medium px-5 py-3">Name</th>
                  <th className="text-left font-medium px-5 py-3">Contact</th>
                  <th className="text-left font-medium px-5 py-3">Course</th>
                  <th className="text-left font-medium px-5 py-3">Status</th>
                  <th className="text-left font-medium px-5 py-3">Created</th>
                  <th className="text-right font-medium px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-medium text-xs shrink-0">
                          {lead.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-slate-900">{lead.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-slate-600">
                      <div className="space-y-0.5">
                        {lead.email && <p className="truncate max-w-[180px]">{lead.email}</p>}
                        {lead.phone && <p className="text-xs text-slate-400">{lead.phone}</p>}
                        {!lead.email && !lead.phone && <p className="text-slate-300">—</p>}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-slate-600">
                      {lead.course ? (
                        <span className="truncate max-w-[160px] block">{lead.course.title}</span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <select
                        value={lead.status}
                        onChange={(e) => updateStatus(lead.id, e.target.value as LeadStatus)}
                        className={`text-xs font-medium px-2.5 py-1.5 rounded-full border cursor-pointer focus:outline-none focus:ring-1 focus:ring-sky-400 ${LEAD_STATUS_META[lead.status].classes}`}
                      >
                        {LEAD_STATUSES.map((s) => (
                          <option key={s} value={s}>{LEAD_STATUS_META[s].label}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-5 py-3 text-slate-500 text-xs whitespace-nowrap">{formatDate(lead.created_at)}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(lead)}
                          className="p-1.5 rounded-md text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition-colors"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteLead(lead.id)}
                          className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalOpen && (
        <LeadModal
          lead={editing}
          courses={courses}
          employees={employees}
          currentUserId={profile?.id ?? null}
          isAdminUser={isAdmin(profile)}
          onClose={() => setModalOpen(false)}
          onSaved={() => { setModalOpen(false); load(); }}
        />
      )}
    </div>
  );
}

function LeadModal({
  lead, courses, employees, currentUserId, isAdminUser, onClose, onSaved,
}: {
  lead: Lead | null;
  courses: Course[];
  employees: Profile[];
  currentUserId: string | null;
  isAdminUser: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(lead?.name ?? '');
  const [email, setEmail] = useState(lead?.email ?? '');
  const [phone, setPhone] = useState(lead?.phone ?? '');
  const [status, setStatus] = useState<LeadStatus>(lead?.status ?? 'new');
  const [courseId, setCourseId] = useState<string>(lead?.course_id ?? '');
  const [assignedTo, setAssignedTo] = useState<string>(lead?.assigned_to ?? currentUserId ?? '');
  const [notes, setNotes] = useState(lead?.notes ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError('Name is required'); return; }
    setBusy(true);
    setError(null);

    const payload = {
      name: name.trim(),
      email: email.trim() || null,
      phone: phone.trim() || null,
      status,
      course_id: courseId || null,
      assigned_to: assignedTo || null,
      notes: notes.trim() || null,
    };

    const res = lead
      ? await supabase.from('leads').update(payload).eq('id', lead.id)
      : await supabase.from('leads').insert(payload);

    setBusy(false);
    if (res.error) { setError(res.error.message); return; }
    onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white rounded-t-2xl">
          <h3 className="font-semibold text-slate-900">{lead ? 'Edit Lead' : 'Add New Lead'}</h3>
          <button onClick={onClose} className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Full Name *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              placeholder="Jane Doe"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                  placeholder="jane@email.com"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Phone</label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                  placeholder="+1 555 0100"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as LeadStatus)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-sky-500 bg-white"
              >
                {LEAD_STATUSES.map((s) => (
                  <option key={s} value={s}>{LEAD_STATUS_META[s].label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Course of Interest</label>
              <select
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-sky-500 bg-white"
              >
                <option value="">— None —</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Assigned To</label>
            <select
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-sky-500 bg-white"
            >
              <option value="">— Unassigned —</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.full_name ?? emp.email}{emp.id === currentUserId ? ' (You)' : ''}
                </option>
              ))}
            </select>
            {!isAdminUser && (
              <p className="text-[11px] text-slate-400 mt-1">Only admins can reassign leads to other employees.</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Notes</label>
            <div className="relative">
              <StickyNote className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full pl-10 pr-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 resize-none"
                placeholder="Any notes about this lead..."
              />
            </div>
          </div>

          {error && (
            <div className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">{error}</div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100">
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-600 text-white text-sm font-medium hover:bg-sky-700 disabled:opacity-60"
            >
              {busy && <Loader2 className="w-4 h-4 animate-spin" />}
              {lead ? 'Save Changes' : 'Add Lead'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
