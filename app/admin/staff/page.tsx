'use client';

import React, { useEffect, useState } from 'react';
import { AdminShell } from '@/components/admin/AdminShell';
import { useStore } from '@/components/shared/StoreProvider';
import { createClient } from '@/lib/supabase/client';

type Profile = {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string;
};
type Staff = {
  id: string;
  user_id: string;
  branch_id: string | null;
  employee_code: string | null;
  job_title: string | null;
  is_active: boolean;
};
type Branch = { id: string; name: string };

export default function AdminStaffPage() {
  const c = createClient();
  const { confirmAction } = useStore();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [userId, setUserId] = useState('');
  const [branchId, setBranchId] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [employeeCode, setEmployeeCode] = useState('');
  const [error, setError] = useState('');

  const load = async () => {
    if (!c) return;
    const [a, b, d] = await Promise.all([
      c
        .from('profiles')
        .select('id,full_name,email,role')
        .order('full_name'),
      c
        .from('staff_profiles')
        .select('*')
        .order('created_at', { ascending: false }),
      c
        .from('branches')
        .select('id,name')
        .eq('is_active', true)
        .order('name'),
    ]);
    if (a.error || b.error || d.error)
      setError(
        a.error?.message ||
          b.error?.message ||
          d.error?.message ||
          'Unable to load staff'
      );
    else {
      setProfiles((a.data || []) as Profile[]);
      setStaff((b.data || []) as Staff[]);
      setBranches((d.data || []) as Branch[]);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const reset = () => {
    setEditingId(null);
    setUserId('');
    setBranchId('');
    setJobTitle('');
    setEmployeeCode('');
    setError('');
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!c || !userId) return;
    setError('');
    const payload = {
      user_id: userId,
      branch_id: branchId || null,
      employee_code: employeeCode.trim() || null,
      job_title: jobTitle.trim() || null,
      is_active: true,
    };
    const r = editingId
      ? await c.from('staff_profiles').update(payload).eq('id', editingId)
      : await c.from('staff_profiles').insert(payload);
    if (r.error) setError(r.error.message);
    else {
      reset();
      await load();
    }
  };

  const handleDelete = async (s: Staff) => {
    if (!c) return;
    const p = profiles.find((x) => x.id === s.user_id);
    const ok = await confirmAction({
      title: 'Delete Staff Profile Permanently',
      message: `Are you sure you want to permanently delete the staff profile for "${
        p?.full_name || p?.email || s.user_id
      }"?`,
      confirmLabel: 'Delete Permanently',
    });
    if (!ok) return;
    await c
      .from('appointments')
      .update({ assigned_staff_id: null })
      .eq('assigned_staff_id', s.id);
    await c
      .from('service_slots')
      .update({ staff_id: null })
      .eq('staff_id', s.id);
    const r = await c.from('staff_profiles').delete().eq('id', s.id);
    if (r.error) setError(r.error.message);
    else {
      if (editingId === s.id) reset();
      await load();
    }
  };

  return (
    <AdminShell
      title="Staff & Technicians"
      subtitle="Assign staff profiles to users and branches for service operations."
    >
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <form
          onSubmit={save}
          className="xl:col-span-5 bg-white border border-[#E5E5E0] rounded-xl p-6 space-y-4 h-fit"
        >
          <div className="flex items-center justify-between">
            <h2 className="font-display font-bold">
              {editingId ? 'Edit Staff Profile' : 'Add Staff Profile'}
            </h2>
            {editingId && (
              <button
                type="button"
                onClick={reset}
                className="text-xs font-semibold hover:underline"
              >
                Cancel
              </button>
            )}
          </div>
          <select
            required
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="w-full px-3 py-2 border border-[#E5E5E0] rounded-lg bg-[#FAF9F6] text-sm"
          >
            <option value="">Choose user</option>
            {profiles
              .filter(
                (p) =>
                  (!editingId && !staff.some((s) => s.user_id === p.id)) ||
                  (editingId && p.id === userId)
              )
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name || p.email || p.id}{' '}
                  {p.role === 'admin' ? '(admin)' : ''}
                </option>
              ))}
          </select>
          <select
            value={branchId}
            onChange={(e) => setBranchId(e.target.value)}
            className="w-full px-3 py-2 border border-[#E5E5E0] rounded-lg bg-[#FAF9F6] text-sm"
          >
            <option value="">No branch</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
          <input
            value={employeeCode}
            onChange={(e) => setEmployeeCode(e.target.value)}
            placeholder="Employee code"
            className="w-full px-3 py-2 border border-[#E5E5E0] rounded-lg bg-[#FAF9F6] text-sm"
          />
          <input
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
            placeholder="Job title"
            className="w-full px-3 py-2 border border-[#E5E5E0] rounded-lg bg-[#FAF9F6] text-sm"
          />
          {error && <p className="text-xs text-red-700">{error}</p>}
          <button className="w-full py-2.5 bg-[#141413] text-white rounded-lg text-xs font-semibold">
            {editingId ? 'Save Staff Profile' : 'Create Staff Profile'}
          </button>
        </form>
        <section className="xl:col-span-7 bg-white border border-[#E5E5E0] rounded-xl p-6">
          <h2 className="font-display font-bold mb-5">
            Staff Profiles ({staff.length})
          </h2>
          <div className="space-y-3">
            {staff.map((s) => {
              const p = profiles.find((x) => x.id === s.user_id);
              const b = branches.find((x) => x.id === s.branch_id);
              return (
                <div
                  key={s.id}
                  className="border border-[#E5E5E0] rounded-lg p-4 flex justify-between items-center gap-4"
                >
                  <div>
                    <p className="text-sm font-semibold">
                      {p?.full_name || p?.email || s.user_id}
                    </p>
                    <p className="text-xs text-[#6E6E68]">
                      {s.job_title || 'Staff'} · {b?.name || 'No branch'} ·{' '}
                      {s.employee_code || 'No code'}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(s.id);
                        setUserId(s.user_id);
                        setBranchId(s.branch_id || '');
                        setEmployeeCode(s.employee_code || '');
                        setJobTitle(s.job_title || '');
                      }}
                      className="font-semibold hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDelete(s)}
                      className="font-semibold text-red-700 hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </AdminShell>
  );
}
