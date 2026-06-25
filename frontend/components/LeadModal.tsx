"use client";
import { useState } from "react";
import { leadsApi } from "@/lib/api";
import toast from "react-hot-toast";
import { X, Loader2 } from "lucide-react";

interface Props {
  lead?: any;
  onClose: () => void;
  onSave: () => void;
}

export default function LeadModal({ lead, onClose, onSave }: Props) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: lead?.name || "",
    email: lead?.email || "",
    company: lead?.company || "",
    job_title: lead?.job_title || "",
    phone: lead?.phone || "",
    website: lead?.website || "",
    linkedin_url: lead?.linkedin_url || "",
    industry: lead?.industry || "",
    company_size: lead?.company_size || "",
    annual_revenue: lead?.annual_revenue || "",
    pain_points: lead?.pain_points || "",
    notes: lead?.notes || "",
    status: lead?.status || "new",
  });

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (lead) {
        await leadsApi.update(lead.id, form);
        toast.success("Lead updated!");
      } else {
        await leadsApi.create(form);
        toast.success("Lead created!");
      }
      onSave();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Save failed");
    } finally {
      setLoading(false);
    }
  };

  const Field = ({ label, name, type = "text", placeholder = "" }: any) => (
    <div>
      <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">{label}</label>
      <input
        type={type}
        value={(form as any)[name]}
        onChange={set(name)}
        placeholder={placeholder}
        className="input-field"
      />
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-gray-100 dark:border-slate-800/80">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-slate-800/80 shrink-0">
          <h2 className="font-semibold text-gray-900 dark:text-white">{lead ? "Edit Lead" : "Add New Lead"}</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 flex flex-col overflow-hidden pr-1.5">
          <form id="lead-modal-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto pl-6 pr-4.5 py-6 space-y-5 scrollbar-thin">
            {/* Basic info */}
            <div>
              <p className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-3">Contact Info</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <Field label="Full Name *" name="name" placeholder="John Doe" />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <Field label="Email *" name="email" type="email" placeholder="john@company.com" />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <Field label="Phone" name="phone" placeholder="+91 98765 43210" />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <Field label="LinkedIn URL" name="linkedin_url" placeholder="linkedin.com/in/..." />
                </div>
              </div>
            </div>

            {/* Company info */}
            <div>
              <p className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-3">Company</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <Field label="Company" name="company" placeholder="Acme Corp" />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <Field label="Job Title" name="job_title" placeholder="VP of Sales" />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <Field label="Industry" name="industry" placeholder="SaaS, Fintech..." />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <Field label="Company Size" name="company_size" placeholder="50-200 employees" />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <Field label="Annual Revenue" name="annual_revenue" placeholder="$5M - $20M" />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <Field label="Website" name="website" placeholder="https://company.com" />
                </div>
              </div>
            </div>

            {/* Context */}
            <div>
              <p className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-3">Sales Context</p>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">Pain Points</label>
                  <textarea
                    value={form.pain_points}
                    onChange={set("pain_points")}
                    rows={2}
                    placeholder="What problems are they trying to solve?"
                    className="input-field resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">Notes</label>
                  <textarea
                    value={form.notes}
                    onChange={set("notes")}
                    rows={2}
                    placeholder="Any additional context..."
                    className="input-field resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">Status</label>
                  <select value={form.status} onChange={set("status")} className="input-field bg-white dark:bg-slate-900 text-gray-900 dark:text-white border-gray-200 dark:border-slate-800">
                    {["new", "contacted", "qualified", "unqualified", "converted"].map((s) => (
                      <option key={s} value={s} className="bg-white dark:bg-slate-900 text-gray-900 dark:text-white">{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 dark:border-slate-800/80 bg-gray-50/50 dark:bg-slate-900/50 flex gap-3 shrink-0 rounded-b-2xl">
          <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center text-xs">
            Cancel
          </button>
          <button type="submit" form="lead-modal-form" disabled={loading} className="btn-primary flex-1 justify-center text-xs">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (lead ? "Update Lead" : "Create Lead")}
          </button>
        </div>
      </div>
    </div>
  );
}
