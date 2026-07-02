"use client";
import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import {
  Save, User, Briefcase, Building, FileText, CheckCircle,
  Sparkles, Mail, Phone, Clock, ToggleLeft, ToggleRight,
  Sliders, MessageSquare, Target, Zap, Link, Linkedin,
  Building2, Users, BadgeCheck, X, Plus
} from "lucide-react";
import toast from "react-hot-toast";
import clsx from "clsx";

interface SettingsState {
  sdr_name: string;
  sdr_title: string;
  company_name: string;
  company_pitch: string;
  email_tone: string;
  follow_up_days: string;
  max_email_words: string;
  cta_style: string;
  auto_qualify: boolean;
  send_followups: boolean;
  track_opens: boolean;
  // Signature
  sdr_phone: string;
  sdr_linkedin: string;
  calendar_link: string;
  // ICP
  target_industries: string[];
  target_company_sizes: string[];
  target_titles: string[];
  // Prompts
  prompt_qualify: string;
  prompt_email: string;
  prompt_linkedin: string;
  prompt_dialer: string;
  prompt_research: string;
  prompt_battle_card: string;
  // CRM
  crm_hubspot: boolean;
  crm_salesforce: boolean;
  crm_auto_sync: boolean;
}

const TONE_OPTIONS = ["Professional", "Conversational", "Consultative", "Direct & Urgent", "Friendly"];
const CTA_OPTIONS = ["15-min call", "Quick reply", "Demo request", "Video walkthrough", "Discovery sync"];

const SIZE_OPTIONS = ["1–10", "11–50", "51–200", "201–500", "500–1000", "1000+"];
const INDUSTRY_SUGGESTIONS = ["SaaS", "Fintech", "HealthTech", "E-commerce", "EdTech", "Logistics", "Real Estate", "Manufacturing", "Cybersecurity", "AI / ML"];
const TITLE_SUGGESTIONS = ["CEO", "CTO", "VP Sales", "Head of Growth", "Founder", "Director", "Product Manager", "VP Engineering", "CMO", "COO"];

export default function SettingsPage() {
  const [form, setForm] = useState<SettingsState>({
    sdr_name: "Alex Chen",
    sdr_title: "SDR",
    company_name: "TechCorp",
    company_pitch: "Our intelligent agent framework automates outbound pipelines, saving SDRs up to 20 hours per week.",
    email_tone: "Professional",
    follow_up_days: "3",
    max_email_words: "150",
    cta_style: "15-min call",
    auto_qualify: true,
    send_followups: true,
    track_opens: true,
    sdr_phone: "",
    sdr_linkedin: "",
    calendar_link: "",
    target_industries: ["SaaS", "Fintech"],
    target_company_sizes: ["51–200", "201–500"],
    target_titles: ["CEO", "VP Sales", "Founder"],
    prompt_qualify: "You are an expert sales analyst. Qualify the lead using the FANT framework (Funding, Authority, Need, Timeline) and assign a score (hot, warm, cold).",
    prompt_email: "You are an elite sales copywriter. Generate a highly personalized cold email based on the prospect's profile, company size, and pain points.",
    prompt_linkedin: "Draft a professional LinkedIn connection invite (max 300 characters) and a detailed InMail pitch.",
    prompt_dialer: "Generate a cold calling dialer script with an introduction, value proposition, handling for common objections, and a clear call to action.",
    prompt_research: "Analyze the company's background, industry position, predicted technologies, and key competitors.",
    prompt_battle_card: "Construct a sales battle card detailing standard objections from this role/company size and the exact counter-arguments.",
    crm_hubspot: false,
    crm_salesforce: false,
    crm_auto_sync: false,
  });
  const [saved, setSaved] = useState(false);
  const [newIndustry, setNewIndustry] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [errors, setErrors] = useState({
    sdr_phone: "",
    sdr_linkedin: "",
    calendar_link: "",
  });

  useEffect(() => {
    const stored = localStorage.getItem("ai-sdr-settings");
    if (stored) {
      try { setForm((prev) => ({ ...prev, ...JSON.parse(stored) })); } catch {}
    }
  }, []);

  const handleChange = (key: keyof SettingsState) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
    if (key in errors) {
      setErrors((prev) => ({ ...prev, [key]: "" }));
    }
  };

  const toggleBool = (key: keyof SettingsState) =>
    setForm((prev) => ({ ...prev, [key]: !prev[key] }));

  const toggleChip = (key: "target_industries" | "target_company_sizes" | "target_titles", val: string) => {
    setForm((prev) => {
      const arr = prev[key] as string[];
      return { ...prev, [key]: arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val] };
    });
  };

  const addCustomTag = (key: "target_industries" | "target_titles", val: string, setter: (v: string) => void) => {
    const trimmed = val.trim();
    if (!trimmed) return;
    setForm((prev) => {
      const arr = prev[key] as string[];
      if (arr.includes(trimmed)) return prev;
      return { ...prev, [key]: [...arr, trimmed] };
    });
    setter("");
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors = {
      sdr_phone: "",
      sdr_linkedin: "",
      calendar_link: "",
    };
    let hasError = false;

    // 1. Phone validation: max 10 digits
    if (form.sdr_phone) {
      const digits = form.sdr_phone.replace(/\D/g, "");
      if (digits.length > 10) {
        newErrors.sdr_phone = "Phone number cannot contain more than 10 digits!";
        hasError = true;
      }
    }

    // 2. LinkedIn URL validation: must contain linkedin.com
    if (form.sdr_linkedin) {
      const lowerLinkedin = form.sdr_linkedin.toLowerCase();
      if (!lowerLinkedin.includes("linkedin.com")) {
        newErrors.sdr_linkedin = "LinkedIn Profile URL must be a valid linkedin.com URL!";
        hasError = true;
      }
    }

    // 3. Calendly URL validation: must contain calendly.com
    if (form.calendar_link) {
      const lowerCalendar = form.calendar_link.toLowerCase();
      if (!lowerCalendar.includes("calendly.com")) {
        newErrors.calendar_link = "Calendar link must be a valid calendly.com URL!";
        hasError = true;
      }
    }

    if (hasError) {
      setErrors(newErrors);
      const firstError = newErrors.sdr_phone || newErrors.sdr_linkedin || newErrors.calendar_link;
      toast.error(firstError);
      return;
    }

    localStorage.setItem("ai-sdr-settings", JSON.stringify(form));
    toast.success("Settings saved successfully!");
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const Toggle = ({ field, label, desc }: { field: keyof SettingsState; label: string; desc: string }) => (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-slate-800/60 last:border-0 last:pb-0">
      <div>
        <p className="text-sm font-medium text-gray-800 dark:text-slate-200">{label}</p>
        <p className="text-[11px] text-gray-450 dark:text-slate-500 mt-0.5">{desc}</p>
      </div>
      <button type="button" onClick={() => toggleBool(field)} className="ml-4 shrink-0 transition-transform active:scale-95">
        {form[field]
          ? <ToggleRight className="w-8 h-8 text-blue-500" />
          : <ToggleLeft className="w-8 h-8 text-gray-300 dark:text-slate-600" />}
      </button>
    </div>
  );

  const Chip = ({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) => (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
        active
          ? "bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-600/20"
          : "bg-gray-50 dark:bg-slate-900/60 text-gray-600 dark:text-slate-400 border-gray-200 dark:border-slate-700 hover:border-blue-400 hover:text-blue-600"
      }`}
    >
      {active && <span className="mr-1">✓</span>}{label}
    </button>
  );

  return (
    <div className="flex min-h-screen text-slate-900 dark:text-slate-100 transition-colors duration-300 relative overflow-hidden">

      <Sidebar />
      <main className="flex-1 lg:ml-64 px-6 pt-8 pb-4 lg:px-10 lg:pt-10 lg:pb-6 relative z-10">

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <Sparkles className="w-4 h-4" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
            </div>
            <p className="text-sm text-gray-500 dark:text-slate-400 ml-0.5">
              Configure your AI SDR persona, ICP targeting, outreach preferences, and automation.
            </p>
          </div>
          <button form="settings-form" type="submit"
            className="btn-primary px-6 py-2.5 flex items-center gap-2 text-sm shadow-md shrink-0">
            {saved ? <><CheckCircle className="w-4 h-4 text-green-300" />Saved!</> : <><Save className="w-4 h-4" />Save All</>}
          </button>
        </div>

        <form id="settings-form" onSubmit={handleSave}>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">

            {/* ── LEFT COLUMN ─────────────────── */}
            <div className="space-y-5">

              {/* Agent Persona */}
              <div className="card p-6">
                <div className="flex items-center gap-2.5 mb-5 pb-4 border-b border-gray-100 dark:border-slate-800/70">
                  <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500"><User className="w-4 h-4" /></div>
                  <div>
                    <h2 className="font-semibold text-gray-900 dark:text-white text-sm">AI SDR Persona</h2>
                    <p className="text-[11px] text-gray-450 dark:text-slate-500 mt-0.5">Name and role used in all AI-generated content.</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1.5 flex items-center gap-1.5"><User className="w-3 h-3" />Representative Name</label>
                    <input type="text" value={form.sdr_name} onChange={handleChange("sdr_name")} placeholder="e.g. Alex Chen" className="input-field" required />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1.5 flex items-center gap-1.5"><Briefcase className="w-3 h-3" />Job Title</label>
                    <input type="text" value={form.sdr_title} onChange={handleChange("sdr_title")} placeholder="e.g. SDR / Account Executive" className="input-field" required />
                  </div>
                </div>
              </div>

              {/* Company & Value Prop */}
              <div className="card p-6">
                <div className="flex items-center gap-2.5 mb-5 pb-4 border-b border-gray-100 dark:border-slate-800/70">
                  <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-500"><Building className="w-4 h-4" /></div>
                  <div>
                    <h2 className="font-semibold text-gray-900 dark:text-white text-sm">Company & Value Proposition</h2>
                    <p className="text-[11px] text-gray-450 dark:text-slate-500 mt-0.5">Injected into every AI email and call script prompt.</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1.5 flex items-center gap-1.5"><Building className="w-3 h-3" />Company Name</label>
                    <input type="text" value={form.company_name} onChange={handleChange("company_name")} placeholder="e.g. TechCorp" className="input-field" required />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1.5 flex items-center gap-1.5"><FileText className="w-3 h-3" />Pitch / Value Proposition</label>
                    <textarea value={form.company_pitch} onChange={handleChange("company_pitch")} rows={4} placeholder="Describe your product, the problems it solves, and your unique differentiators..." className="input-field resize-none leading-relaxed" required />
                    <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-1.5">Embedded directly into AI prompts for cold emails and call scripts.</p>
                  </div>
                </div>
              </div>

              {/* AI Generation Preferences */}
              <div className="card p-6">
                <div className="flex items-center gap-2.5 mb-5 pb-4 border-b border-gray-100 dark:border-slate-800/70">
                  <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-500"><Sliders className="w-4 h-4" /></div>
                  <div>
                    <h2 className="font-semibold text-gray-900 dark:text-white text-sm">AI Generation Preferences</h2>
                    <p className="text-[11px] text-gray-450 dark:text-slate-500 mt-0.5">Fine-tune how the AI writes your emails and scripts.</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1.5 flex items-center gap-1.5"><MessageSquare className="w-3 h-3" />Email Tone</label>
                    <select value={form.email_tone} onChange={handleChange("email_tone")} className="input-field">
                      {TONE_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1.5 flex items-center gap-1.5"><Target className="w-3 h-3" />Preferred CTA</label>
                    <select value={form.cta_style} onChange={handleChange("cta_style")} className="input-field">
                      {CTA_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1.5 flex items-center gap-1.5"><Mail className="w-3 h-3" />Max Email Words</label>
                    <input type="number" min={80} max={400} value={form.max_email_words} onChange={handleChange("max_email_words")} className="input-field" />
                    <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-1">Target word count for generated emails.</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1.5 flex items-center gap-1.5"><Clock className="w-3 h-3" />Follow-up Gap (days)</label>
                    <input type="number" min={1} max={14} value={form.follow_up_days} onChange={handleChange("follow_up_days")} className="input-field" />
                    <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-1">Days between Day 1 and Day 3 follow-up.</p>
                  </div>
                </div>
              </div>

              {/* CRM Integrations */}
              <div className="card p-6">
                <div className="flex items-center gap-2.5 mb-5 pb-4 border-b border-gray-100 dark:border-slate-800/70">
                  <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500"><Link className="w-4 h-4" /></div>
                  <div>
                    <h2 className="font-semibold text-gray-955 dark:text-white text-sm">CRM Management</h2>
                    <p className="text-[11px] text-gray-450 dark:text-slate-500 mt-0.5">Integrate leads and outbound activities with Salesforce or HubSpot.</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-slate-800/60">
                    <div>
                      <p className="text-sm font-medium text-gray-800 dark:text-slate-200">HubSpot Integration</p>
                      <p className="text-[10px] text-gray-450 dark:text-slate-500">Sync qualified leads and generated email outbox items.</p>
                    </div>
                    <button type="button" onClick={() => toggleBool("crm_hubspot")} className="ml-4 shrink-0 transition-transform active:scale-95">
                      {form.crm_hubspot
                        ? <ToggleRight className="w-8 h-8 text-blue-500" />
                        : <ToggleLeft className="w-8 h-8 text-gray-300 dark:text-slate-600" />}
                    </button>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-slate-800/60">
                    <div>
                      <p className="text-sm font-medium text-gray-800 dark:text-slate-200">Salesforce Integration</p>
                      <p className="text-[10px] text-gray-450 dark:text-slate-500">Push qualified accounts and prospects directly to CRM.</p>
                    </div>
                    <button type="button" onClick={() => toggleBool("crm_salesforce")} className="ml-4 shrink-0 transition-transform active:scale-95">
                      {form.crm_salesforce
                        ? <ToggleRight className="w-8 h-8 text-blue-500" />
                        : <ToggleLeft className="w-8 h-8 text-gray-300 dark:text-slate-600" />}
                    </button>
                  </div>
                  <Toggle field="crm_auto_sync" label="Auto-Sync Leads on Qualification" desc="Trigger background sync to active CRM whenever a lead is hot/warm rated." />
                </div>
              </div>

            </div>

            {/* ── RIGHT COLUMN ─────────────────── */}
            <div className="space-y-5">

              {/* ICP Targeting */}
              <div className="card p-6">
                <div className="flex items-center gap-2.5 mb-5 pb-4 border-b border-gray-100 dark:border-slate-800/70">
                  <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500"><Target className="w-4 h-4" /></div>
                  <div>
                    <h2 className="font-semibold text-gray-900 dark:text-white text-sm">Ideal Customer Profile (ICP)</h2>
                    <p className="text-[11px] text-gray-450 dark:text-slate-500 mt-0.5">Narrow AI targeting to your best-fit prospects.</p>
                  </div>
                </div>

                {/* Target Industries */}
                <div className="mb-5">
                  <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-2 flex items-center gap-1.5">
                    <Building2 className="w-3 h-3" />Target Industries
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2.5">
                    {INDUSTRY_SUGGESTIONS.map((ind) => (
                      <Chip key={ind} label={ind} active={form.target_industries.includes(ind)} onClick={() => toggleChip("target_industries", ind)} />
                    ))}
                    {form.target_industries.filter((i) => !INDUSTRY_SUGGESTIONS.includes(i)).map((ind) => (
                      <button key={ind} type="button" onClick={() => toggleChip("target_industries", ind)}
                        className="px-3 py-1.5 rounded-full text-xs font-medium bg-blue-600 text-white border border-blue-600 flex items-center gap-1">
                        {ind}<X className="w-3 h-3" />
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input value={newIndustry} onChange={(e) => setNewIndustry(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustomTag("target_industries", newIndustry, setNewIndustry))}
                      placeholder="Add custom industry..." className="input-field text-xs py-1.5 flex-1" />
                    <button type="button" onClick={() => addCustomTag("target_industries", newIndustry, setNewIndustry)}
                      className="p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-500 transition-colors">
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Target Company Sizes */}
                <div className="mb-5">
                  <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-2 flex items-center gap-1.5">
                    <Users className="w-3 h-3" />Target Company Sizes (employees)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {SIZE_OPTIONS.map((sz) => (
                      <Chip key={sz} label={sz} active={form.target_company_sizes.includes(sz)} onClick={() => toggleChip("target_company_sizes", sz)} />
                    ))}
                  </div>
                </div>

                {/* Target Job Titles */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-2 flex items-center gap-1.5">
                    <BadgeCheck className="w-3 h-3" />Target Decision Maker Titles
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2.5">
                    {TITLE_SUGGESTIONS.map((t) => (
                      <Chip key={t} label={t} active={form.target_titles.includes(t)} onClick={() => toggleChip("target_titles", t)} />
                    ))}
                    {form.target_titles.filter((t) => !TITLE_SUGGESTIONS.includes(t)).map((t) => (
                      <button key={t} type="button" onClick={() => toggleChip("target_titles", t)}
                        className="px-3 py-1.5 rounded-full text-xs font-medium bg-blue-600 text-white border border-blue-600 flex items-center gap-1">
                        {t}<X className="w-3 h-3" />
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustomTag("target_titles", newTitle, setNewTitle))}
                      placeholder="Add custom title..." className="input-field text-xs py-1.5 flex-1" />
                    <button type="button" onClick={() => addCustomTag("target_titles", newTitle, setNewTitle)}
                      className="p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-500 transition-colors">
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Email Signature & Contact */}
              <div className="card p-6">
                <div className="flex items-center gap-2.5 mb-5 pb-4 border-b border-gray-100 dark:border-slate-800/70">
                  <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-500"><Mail className="w-4 h-4" /></div>
                  <div>
                    <h2 className="font-semibold text-gray-900 dark:text-white text-sm">Email Signature & Contact</h2>
                    <p className="text-[11px] text-gray-450 dark:text-slate-500 mt-0.5">Appended to every outreach email as a professional signature.</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1.5 flex items-center gap-1.5"><Phone className="w-3 h-3" />Phone Number</label>
                    <input
                      type="tel"
                      value={form.sdr_phone}
                      onChange={handleChange("sdr_phone")}
                      placeholder="e.g. +1 (555) 000-1234"
                      className={clsx("input-field", errors.sdr_phone && "border-red-500 focus:border-red-500 focus:ring-red-500/20")}
                    />
                    {errors.sdr_phone && (
                      <p className="text-[11px] text-red-500 mt-1 font-medium">{errors.sdr_phone}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1.5 flex items-center gap-1.5"><Linkedin className="w-3 h-3" />LinkedIn Profile URL</label>
                    <input
                      type="url"
                      value={form.sdr_linkedin}
                      onChange={handleChange("sdr_linkedin")}
                      placeholder="https://linkedin.com/in/yourprofile"
                      className={clsx("input-field", errors.sdr_linkedin && "border-red-500 focus:border-red-500 focus:ring-red-500/20")}
                    />
                    {errors.sdr_linkedin && (
                      <p className="text-[11px] text-red-500 mt-1 font-medium">{errors.sdr_linkedin}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1.5 flex items-center gap-1.5"><Link className="w-3 h-3" />Calendar / Booking Link</label>
                    <input
                      type="url"
                      value={form.calendar_link}
                      onChange={handleChange("calendar_link")}
                      placeholder="https://calendly.com/yourlink"
                      className={clsx("input-field", errors.calendar_link && "border-red-500 focus:border-red-500 focus:ring-red-500/20")}
                    />
                    {errors.calendar_link ? (
                      <p className="text-[11px] text-red-500 mt-1 font-medium">{errors.calendar_link}</p>
                    ) : (
                      <p className="text-[11px] text-gray-450 dark:text-slate-500 mt-1.5">Used as the CTA link in email signatures and follow-ups.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Automation Settings */}
              <div className="card p-6">
                <div className="flex items-center gap-2.5 mb-5 pb-4 border-b border-gray-100 dark:border-slate-800/70">
                  <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500"><Zap className="w-4 h-4" /></div>
                  <div>
                    <h2 className="font-semibold text-gray-900 dark:text-white text-sm">Automation Settings</h2>
                    <p className="text-[11px] text-gray-450 dark:text-slate-500 mt-0.5">Control which automated SDR behaviors are active.</p>
                  </div>
                </div>
                <Toggle field="auto_qualify" label="Auto-Qualify New Leads" desc="Automatically run AI qualification when a new lead is added." />
                <Toggle field="send_followups" label="Enable Follow-up Sequences" desc="Include Day 3 and Day 5 auto-follow-ups in outreach sequences." />
                <Toggle field="track_opens" label="Track Email Opens & Clicks" desc="Simulate open and click rate tracking for dispatched campaigns." />
              </div>

            </div>
          </div>

          {/* Prompt Engineering Studio */}
          <div className="card p-6 mt-5 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md">
            <div className="flex items-center gap-2.5 mb-5 pb-4 border-b border-gray-100 dark:border-slate-800/70">
              <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-500"><Sliders className="w-4 h-4" /></div>
              <div>
                <h2 className="font-semibold text-gray-950 dark:text-white text-sm">Prompt Engineering Studio</h2>
                <p className="text-[11px] text-gray-450 dark:text-slate-500 mt-0.5">Customize the system instructions used for AI generation models.</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-650 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-blue-500" /> Lead Qualification Prompt (FANT)
                </label>
                <textarea
                  value={form.prompt_qualify}
                  onChange={handleChange("prompt_qualify")}
                  rows={2}
                  placeholder="Default system prompt will be used if left blank..."
                  className="input-field text-xs font-mono leading-relaxed"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-655 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-purple-500" /> Cold Email Outreach Prompt
                </label>
                <textarea
                  value={form.prompt_email}
                  onChange={handleChange("prompt_email")}
                  rows={2}
                  placeholder="Default system prompt will be used if left blank..."
                  className="input-field text-xs font-mono leading-relaxed"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-655 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
                  <Linkedin className="w-3.5 h-3.5 text-sky-500" /> LinkedIn Outreach Prompt (Note & InMail)
                </label>
                <textarea
                  value={form.prompt_linkedin}
                  onChange={handleChange("prompt_linkedin")}
                  rows={2}
                  placeholder="Default system prompt will be used if left blank..."
                  className="input-field text-xs font-mono leading-relaxed"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-655 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-500" /> Call Script / Dialer Prompt
                </label>
                <textarea
                  value={form.prompt_dialer}
                  onChange={handleChange("prompt_dialer")}
                  rows={2}
                  placeholder="Default system prompt will be used if left blank..."
                  className="input-field text-xs font-mono leading-relaxed"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-655 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-amber-500" /> Market Research Prompt
                  </label>
                  <textarea
                    value={form.prompt_research}
                    onChange={handleChange("prompt_research")}
                    rows={2}
                    placeholder="Default prompt..."
                    className="input-field text-xs font-mono leading-relaxed"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-655 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
                    <BadgeCheck className="w-3.5 h-3.5 text-rose-500" /> Battle Card Prompt
                  </label>
                  <textarea
                    value={form.prompt_battle_card}
                    onChange={handleChange("prompt_battle_card")}
                    rows={2}
                    placeholder="Default prompt..."
                    className="input-field text-xs font-mono leading-relaxed"
                  />
                </div>
              </div>
            </div>
          </div>

        </form>
      </main>
    </div>
  );
}
