import { useEffect, useState, type FormEvent } from 'react';
import {
  Plus, Pencil, Trash2, X, Loader2, BookOpen, Clock, DollarSign, TrendingDown,
} from 'lucide-react';
import { supabase, type Course } from '@/lib/supabase';
import { useAuth, isAdmin } from '@/context/AuthContext';
import { formatCurrency } from '@/components/ui';

export default function CoursesPage() {
  const { profile } = useAuth();
  const admin = isAdmin(profile);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Course | null>(null);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase.from('courses').select('*').order('created_at', { ascending: false });
    if (error) { console.error(error.message); }
    setCourses((data ?? []) as Course[]);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function deleteCourse(id: string) {
    if (!confirm('Delete this course? Leads referencing it will keep their records but lose the course link.')) return;
    const { error } = await supabase.from('courses').delete().eq('id', id);
    if (error) { alert('Failed to delete: ' + error.message); return; }
    setCourses((prev) => prev.filter((c) => c.id !== id));
  }

  return (
    <div className="space-y-5">
      {admin && (
        <div className="flex justify-end">
          <button
            onClick={() => { setEditing(null); setModalOpen(true); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-sky-600 text-white text-sm font-medium hover:bg-sky-700 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add Course
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : courses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-2xl border border-slate-200">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
            <BookOpen className="w-5 h-5 text-slate-400" />
          </div>
          <p className="text-sm font-medium text-slate-700">No courses yet</p>
          <p className="text-xs text-slate-500 mt-1">{admin ? 'Add your first course to get started.' : 'Check back soon for available courses.'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {courses.map((course) => (
            <div
              key={course.id}
              className="group bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-lg hover:border-slate-300 transition-all flex flex-col"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-sky-500 to-emerald-500 flex items-center justify-center shrink-0">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                {admin && (
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => { setEditing(course); setModalOpen(true); }}
                      className="p-1.5 rounded-md text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteCourse(course.id)}
                      className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              <h3 className="font-semibold text-slate-900 leading-snug">{course.title}</h3>
              <p className="text-sm text-slate-500 mt-2 flex-1 line-clamp-3">{course.description ?? 'No description available.'}</p>

              <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-slate-100">
                <CourseStat icon={<Clock className="w-3.5 h-3.5" />} label="Duration" value={`${course.duration_weeks} wk`} />
                <CourseStat icon={<DollarSign className="w-3.5 h-3.5" />} label="Price" value={formatCurrency(course.price)} />
                {admin && (
                  <CourseStat icon={<TrendingDown className="w-3.5 h-3.5" />} label="Cost" value={formatCurrency(course.cost)} />
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <CourseModal
          course={editing}
          onClose={() => setModalOpen(false)}
          onSaved={() => { setModalOpen(false); load(); }}
        />
      )}
    </div>
  );
}

function CourseStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="text-center">
      <div className="flex items-center justify-center text-slate-400 mb-1">{icon}</div>
      <p className="text-sm font-semibold text-slate-900">{value}</p>
      <p className="text-[11px] text-slate-400">{label}</p>
    </div>
  );
}

function CourseModal({ course, onClose, onSaved }: { course: Course | null; onClose: () => void; onSaved: () => void }) {
  const [title, setTitle] = useState(course?.title ?? '');
  const [description, setDescription] = useState(course?.description ?? '');
  const [durationWeeks, setDurationWeeks] = useState(String(course?.duration_weeks ?? 4));
  const [price, setPrice] = useState(String(course?.price ?? ''));
  const [cost, setCost] = useState(String(course?.cost ?? '0'));
  const [isActive, setIsActive] = useState(course?.is_active ?? true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) { setError('Title is required'); return; }
    setBusy(true);
    setError(null);

    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      duration_weeks: parseInt(durationWeeks) || 4,
      price: parseFloat(price) || 0,
      cost: parseFloat(cost) || 0,
      is_active: isActive,
    };

    const res = course
      ? await supabase.from('courses').update(payload).eq('id', course.id)
      : await supabase.from('courses').insert(payload);

    setBusy(false);
    if (res.error) { setError(res.error.message); return; }
    onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white rounded-t-2xl">
          <h3 className="font-semibold text-slate-900">{course ? 'Edit Course' : 'Add New Course'}</h3>
          <button onClick={onClose} className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Course Title *</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              placeholder="Full-Stack Web Development"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 resize-none"
              placeholder="What will students learn?"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Duration (weeks)</label>
              <input
                type="number"
                min={1}
                value={durationWeeks}
                onChange={(e) => setDurationWeeks(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Price ($)</label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                placeholder="1200"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Cost ($)</label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                placeholder="400"
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
            />
            Active (visible to all employees)
          </label>

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
              {course ? 'Save Changes' : 'Add Course'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
