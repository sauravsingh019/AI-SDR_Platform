"use client";
import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import {
  BookOpen, FileText, Search, PlusCircle, Check, Copy, Pencil,
  Sparkles, Trash2, Mail, Users, AlertCircle, Save, Filter
} from "lucide-react";
import toast from "react-hot-toast";
import clsx from "clsx";

interface PlaybookTemplate {
  id: number;
  title: string;
  category: "Email" | "LinkedIn" | "Objections";
  subject?: string;
  body: string;
  description: string;
}

const INITIAL_PLAYBOOKS: PlaybookTemplate[] = [
  {
    id: 1,
    title: "The B2B Pain Point Hook",
    category: "Email",
    subject: "Solving pipeline bottlenecks at {{company}}",
    body: "Hi {{name}},\n\nI noticed you oversee sales growth as {{job_title}} at {{company}}. Many B2B leaders tell me that scaling manual prospecting leaves their reps with less than 2 hours a day for high-intent conversations.\n\nWe provide autonomous sales development agents that qualify and enrich B2B leads in the background—saving teams up to 20 hours per week.\n\nWould you be open to a quick 10-minute sync this Thursday at 2 PM to see if this could streamline your outbound pipeline?\n\nBest,\n{{sdr_name}}",
    description: "Cold outreach hook focusing on SDR labor efficiency and time-saving metrics."
  },
  {
    id: 2,
    title: "The Enterprise Case Study Pitch",
    category: "Email",
    subject: "3.2x outbound pipeline ROI for Zoom",
    body: "Hi {{name}},\n\nSince you manage growth operations at {{company}}, I wanted to share a quick metric: we recently helped Zoom's outbound reps scale qualified leads by 3.2x while reducing cost-per-lead by 45%.\n\nOur AI SDR agents handle the research, cold messaging, and objection handling on autopilot, sync'ing directly to HubSpot/Salesforce.\n\nAre you free next Tuesday at 10 AM for a brief screen share? I'd love to share the exact playbook Zoom used.\n\nRegards,\n{{sdr_name}}",
    description: "Proof-based case study template demonstrating pipeline expansion and cost metrics."
  },
  {
    id: 3,
    title: "LinkedIn Connection Note",
    category: "LinkedIn",
    body: "Hi {{name}} - saw your profile focused on B2B sales development at {{company}}. I'd love to connect and share some new research we compiled on automating CRM lead qualification workflows. Best, {{sdr_name}}",
    description: "Low-pressure connection invite under the strict 300 character limit."
  },
  {
    id: 4,
    title: "No Budget Objection Counter",
    category: "Objections",
    body: "I completely understand that budgets are tight, {{name}}. That's precisely why we built this. Our AI SDR agent costs less than $0.15 per qualified lead, yielding positive ROI in month one by automating lead research. What if we run a 10-day test first?",
    description: "Objection defense reframing software expense into B2B cash savings."
  },
  {
    id: 5,
    title: "Already Using Competitor",
    category: "Objections",
    body: "That is great to hear, {{name}}—{{competitor}} is a solid tool. Most of our clients use us alongside them because our agent actually crawls prospect domains and runs live voice roleplays, which {{competitor}} does not support. Let's do a quick comparison sync?",
    description: "Competitive play reframing feature differences into cooperative advantages."
  }
];

export default function PlaybooksPage() {
  const [playbooks, setPlaybooks] = useState<PlaybookTemplate[]>(INITIAL_PLAYBOOKS);
  const [selectedId, setSelectedId] = useState<number>(1);
  const [filter, setFilter] = useState<"All" | "Email" | "LinkedIn" | "Objections">("All");
  const [search, setSearch] = useState("");
  const [copied, setCopied] = useState(false);

  const [editTitle, setEditTitle] = useState("");
  const [editSubject, setEditSubject] = useState("");
  const [editBody, setEditBody] = useState("");
  const [editDesc, setEditDesc] = useState("");

  const selectedTemplate = playbooks.find((p) => p.id === selectedId) || playbooks[0];

  useEffect(() => {
    // Load from localStorage if custom templates exist
    const saved = localStorage.getItem("ai-sdr-playbooks");
    if (saved) {
      try {
        setPlaybooks(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    if (selectedTemplate) {
      setEditTitle(selectedTemplate.title);
      setEditSubject(selectedTemplate.subject || "");
      setEditBody(selectedTemplate.body);
      setEditDesc(selectedTemplate.description);
    }
  }, [selectedId]);

  const handleCopy = () => {
    if (selectedTemplate) {
      const fullText = selectedTemplate.subject 
        ? `Subject: ${selectedTemplate.subject}\n\n${selectedTemplate.body}`
        : selectedTemplate.body;
      navigator.clipboard.writeText(fullText);
      setCopied(true);
      toast.success("Template copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSaveChanges = () => {
    const updated = playbooks.map((p) => {
      if (p.id === selectedId) {
        return {
          ...p,
          title: editTitle,
          subject: p.category === "Email" ? editSubject : undefined,
          body: editBody,
          description: editDesc
        };
      }
      return p;
    });

    setPlaybooks(updated);
    localStorage.setItem("ai-sdr-playbooks", JSON.stringify(updated));
    toast.success("Playbook template changes saved!");
  };

  const handleAddTemplate = () => {
    const newTemplate: PlaybookTemplate = {
      id: Date.now(),
      title: "New Sales Pitch",
      category: filter === "All" ? "Email" : filter,
      subject: filter === "Email" || filter === "All" ? "Intro to {{company}}" : undefined,
      body: "Hi {{name}},\n\nType your custom pitch template here.\n\nBest,\n{{sdr_name}}",
      description: "Brief playbook summary."
    };

    const updated = [...playbooks, newTemplate];
    setPlaybooks(updated);
    localStorage.setItem("ai-sdr-playbooks", JSON.stringify(updated));
    setSelectedId(newTemplate.id);
    toast.success("New template added to playbook!");
  };

  const handleDeleteTemplate = () => {
    if (playbooks.length <= 1) {
      toast.error("You must keep at least one template.");
      return;
    }
    const updated = playbooks.filter((p) => p.id !== selectedId);
    setPlaybooks(updated);
    localStorage.setItem("ai-sdr-playbooks", JSON.stringify(updated));
    setSelectedId(updated[0].id);
    toast.success("Template removed from playbook");
  };

  const filteredPlaybooks = playbooks
    .filter((p) => filter === "All" || p.category === filter)
    .filter((p) =>
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.body.toLowerCase().includes(search.toLowerCase())
    );

  const categoryColor = {
    Email: "bg-blue-500/10 text-blue-500 border border-blue-500/20",
    LinkedIn: "bg-purple-500/10 text-purple-500 border border-purple-500/20",
    Objections: "bg-rose-500/10 text-rose-500 border border-rose-500/20"
  }[selectedTemplate?.category || "Email"];

  const categoryIcon = {
    Email: Mail,
    LinkedIn: Users,
    Objections: AlertCircle
  }[selectedTemplate?.category || "Email"];

  const CategoryIcon = categoryIcon;

  return (
    <div className="flex min-h-screen text-slate-900 dark:text-slate-100 transition-colors duration-300 relative overflow-hidden">
      <Sidebar />
      <main className="flex-1 lg:ml-64 px-6 pt-8 pb-4 lg:px-10 lg:pt-10 lg:pb-6 relative z-10">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Playbooks & Templates</h1>
              <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">
                Manage your outbound sales campaign emails, LinkedIn messages, and objection battle cards templates.
              </p>
            </div>
          </div>
          <button
            onClick={handleAddTemplate}
            className="btn-primary px-4 py-2 text-xs flex items-center gap-1.5 shadow-md hover-lift"
          >
            <PlusCircle className="w-4 h-4" />
            New Playbook
          </button>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 h-[72vh] items-stretch">
          
          {/* List Column */}
          <div className="xl:col-span-4 card flex flex-col overflow-hidden bg-white/60 dark:bg-slate-900/60 backdrop-blur-md">
            
            <div className="p-4 border-b border-gray-100 dark:border-slate-800/80 space-y-3 shrink-0">
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search playbooks..."
                  className="input-field pl-9 text-xs py-2 bg-slate-50/50"
                />
              </div>

              {/* Filter Tabs */}
              <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {["All", "Email", "LinkedIn", "Objections"].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setFilter(cat as any)}
                    className={clsx(
                      "px-3 py-1 rounded-lg text-[10px] font-bold border transition-all whitespace-nowrap active:scale-95",
                      filter === cat
                        ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                        : "bg-white text-gray-500 border-gray-250 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800"
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-gray-100 dark:divide-slate-850 scrollbar-thin">
              {filteredPlaybooks.map((item) => {
                const badgeColor = {
                  Email: "border-blue-500 text-blue-500",
                  LinkedIn: "border-purple-500 text-purple-500",
                  Objections: "border-rose-500 text-rose-500"
                }[item.category];

                return (
                  <button
                    key={item.id}
                    onClick={() => setSelectedId(item.id)}
                    className={clsx(
                      "w-full text-left p-4 hover:bg-slate-50 dark:hover:bg-slate-950/20 transition-all border-l-2 flex flex-col gap-1",
                      item.id === selectedId
                        ? "bg-slate-100/60 dark:bg-slate-950/30 border-blue-500"
                        : "border-transparent"
                    )}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-semibold text-xs text-gray-900 dark:text-white truncate pr-2">
                        {item.title}
                      </span>
                      <span className={clsx("text-[8px] font-bold px-1.5 py-0.5 rounded border uppercase font-mono", badgeColor)}>
                        {item.category}
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-400 dark:text-slate-500 line-clamp-1 leading-normal font-medium">
                      {item.description}
                    </p>
                    <p className="text-[10px] text-gray-600 dark:text-slate-350 line-clamp-2 mt-1 whitespace-pre-wrap font-mono leading-relaxed">
                      {item.body}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Editor & Preview Column */}
          <div className="xl:col-span-8 card flex flex-col overflow-hidden bg-white/60 dark:bg-slate-900/60 backdrop-blur-md">
            {selectedTemplate && (
              <>
                {/* Preview Toolbar */}
                <div className="p-4 border-b border-gray-100 dark:border-slate-800/80 flex items-center justify-between shrink-0 bg-slate-50/30 dark:bg-slate-950/10">
                  <div className="flex items-center gap-3">
                    <span className={clsx("inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full border shadow-sm uppercase tracking-wider", categoryColor)}>
                      <CategoryIcon className="w-3.5 h-3.5" />
                      {selectedTemplate.category} Template
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleCopy}
                      className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 flex items-center gap-1.5 transition-all active:scale-95"
                    >
                      {copied ? (
                        <><Check className="w-3.5 h-3.5 text-emerald-500" /> Copied</>
                      ) : (
                        <><Copy className="w-3.5 h-3.5" /> Copy Pitch</>
                      )}
                    </button>
                    <button
                      onClick={handleDeleteTemplate}
                      className="p-2 rounded-lg bg-white dark:bg-slate-900 text-gray-500 border border-gray-200 dark:border-slate-800 hover:text-red-500 transition-colors"
                      title="Delete Playbook"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
                  
                  {/* Playbook Metadata Configuration */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Playbook Name</label>
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="input-field text-xs py-2 w-full font-medium"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Summary Description</label>
                      <input
                        type="text"
                        value={editDesc}
                        onChange={(e) => setEditDesc(e.target.value)}
                        className="input-field text-xs py-2 w-full font-medium"
                      />
                    </div>
                  </div>

                  {/* Subject Line (only for Emails) */}
                  {selectedTemplate.category === "Email" && (
                    <div className="space-y-1 pt-1">
                      <label className="block text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Subject Line Template</label>
                      <input
                        type="text"
                        value={editSubject}
                        onChange={(e) => setEditSubject(e.target.value)}
                        className="input-field text-xs py-2 w-full font-mono"
                      />
                    </div>
                  )}

                  {/* Template Pitch Body */}
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                      Template Copy ({selectedTemplate.category === "LinkedIn" ? "Max 300 Chars" : "Standard"})
                    </label>
                    <textarea
                      rows={9}
                      value={editBody}
                      onChange={(e) => setEditBody(e.target.value)}
                      className="input-field text-xs font-mono w-full leading-relaxed p-4 bg-slate-50/30"
                      placeholder="Type template body..."
                    />
                    <div className="flex justify-between items-center text-[10px] text-gray-400 dark:text-slate-500">
                      <span>Use variables: <code>{"{{name}}"}</code>, <code>{"{{company}}"}</code>, <code>{"{{job_title}}"}</code>, <code>{"{{sdr_name}}"}</code></span>
                      <span className="font-mono">{editBody.length} characters</span>
                    </div>
                  </div>

                  {/* Actions footer */}
                  <div className="flex justify-end pt-3 border-t border-gray-100 dark:border-slate-800/80">
                    <button
                      onClick={handleSaveChanges}
                      className="btn-primary px-5 py-2.5 text-xs flex items-center gap-1.5 font-semibold shadow-md hover-lift"
                    >
                      <Save className="w-3.5 h-3.5" />
                      Save Playbook changes
                    </button>
                  </div>

                </div>
              </>
            )}
          </div>

        </div>

      </main>
    </div>
  );
}
