"use client";
import { useEffect, useState, useCallback } from "react";
import { leadsApi, aiApi } from "@/lib/api";
import { loadNotifications, saveNotifications, addNotification as pushNotif } from "@/lib/notification-utils";
import Sidebar from "@/components/Sidebar";
import LeadModal from "@/components/LeadModal";
import LeadDetailModal from "@/components/LeadDetailModal";
import { Search, Plus, Flame, Thermometer, Snowflake, Loader2, Trash2, Eye, Sparkles, Mail, Pencil, Bell, Upload, X, Globe, MessageSquare, Trophy } from "lucide-react";
import toast from "react-hot-toast";

import clsx from "clsx";

const SCORE_ICONS: any = {
  hot: <Flame className="w-3 h-3" />,
  warm: <Thermometer className="w-3 h-3" />,
  cold: <Snowflake className="w-3 h-3" />,
  unscored: null,
};

export default function LeadsPage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editLead, setEditLead] = useState<any>(null);
  const [detailLead, setDetailLead] = useState<any>(null);
  const [aiLoading, setAiLoading] = useState<Record<number, string>>({});
  const [sortBy, setSortBy] = useState("newest");
  const [industryFilter, setIndustryFilter] = useState("");
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  
  // AI Lead Finder modal states
  const [showFinderModal, setShowFinderModal] = useState(false);
  const [finderTab, setFinderTab] = useState<"keyword" | "domain" | "icp">("keyword");
  const [finderKeyword, setFinderKeyword] = useState("");
  const [finderDomain, setFinderDomain] = useState("");
  const [finderValueProp, setFinderValueProp] = useState("");
  const [finderLoading, setFinderLoading] = useState(false);


  // Pagination states
  const [page, setPage] = useState(1);
  const [totalLeads, setTotalLeads] = useState(0);
  const LIMIT = 10;

  // Reset pagination on filter change
  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, industryFilter]);

  useEffect(() => {
    setNotifications(loadNotifications());
  }, []);

  const markAllRead = () => {
    const updated = notifications.map((n) => ({ ...n, read: true }));
    setNotifications(updated);
    saveNotifications(updated);
  };

  const addNotification = (title: string, desc: string) => {
    setNotifications((prev) => pushNotif(title, desc, prev));
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const [leadsRes, statsRes] = await Promise.all([
        leadsApi.list({
          search: search || undefined,
          status: statusFilter || undefined,
          skip: (page - 1) * LIMIT,
          limit: LIMIT
        }),
        leadsApi.stats()
      ]);
      setLeads(leadsRes.data);
      setTotalLeads(statsRes.data.total);
    } catch {
      toast.error("Failed to load leads");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, page]);

  useEffect(() => {
    const t = setTimeout(fetchLeads, 300);
    return () => clearTimeout(t);
  }, [fetchLeads]);

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this lead?")) return;
    await leadsApi.delete(id);
    toast.success("Lead deleted");
    fetchLeads();
  };

  const handleQualify = async (id: number) => {
    setAiLoading((p) => ({ ...p, [id]: "qualify" }));
    try {
      let settings = {};
      const saved = localStorage.getItem("ai-sdr-settings");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.prompt_qualify) {
            settings = { system_prompt: parsed.prompt_qualify };
          }
        } catch {}
      }
      await aiApi.qualify(id, settings);
      toast.success("Lead qualified with AI!");
      const lead = leads.find((l) => l.id === id);
      const leadName = lead?.name || `Lead #${id}`;
      addNotification("Lead Qualified", `AI qualified ${leadName} successfully.`);
      
      // Update local state if details modal is open
      if (detailLead && detailLead.id === id) {
        leadsApi.get(id).then((res) => setDetailLead(res.data));
      }
      fetchLeads();
    } catch (e: any) {
      toast.error(e.response?.data?.detail || "Qualification failed");
    } finally {
      setAiLoading((p) => { const n = { ...p }; delete n[id]; return n; });
    }
  };

  const handleEmail = async (id: number) => {
    setAiLoading((p) => ({ ...p, [id]: "email" }));
    try {
      let settings = {};
      const saved = localStorage.getItem("ai-sdr-settings");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          settings = {
            sdr_name: parsed.sdr_name,
            company_name: parsed.company_name,
            company_pitch: parsed.company_pitch,
            system_prompt: parsed.prompt_email,
          };
        } catch {}
      }
      const res = await aiApi.generateEmail(id, settings);
      fetchLeads();
      const lead = leads.find((l) => l.id === id);
      if (lead) {
        setDetailLead({ ...lead, generated_email: res.data.email_content });
        addNotification("Email Generated", `AI drafted outreach email for ${lead.name}.`);
      }
      toast.success("Email generated!");
    } catch (e: any) {
      toast.error(e.response?.data?.detail || "Email generation failed");
    } finally {
      setAiLoading((p) => { const n = { ...p }; delete n[id]; return n; });
    }
  };

  // CSV Bulk Upload Handler
  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const text = evt.target?.result as string;
      const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
      if (lines.length < 2) {
        toast.error("CSV file is empty or missing data rows");
        return;
      }

      // Parse headers
      const headers = lines[0].split(",").map((h) => h.trim().replace(/^["']|["']$/g, "").toLowerCase());
      const nameIdx = headers.indexOf("name");
      const emailIdx = headers.indexOf("email");
      const companyIdx = headers.indexOf("company");
      const titleIdx = headers.indexOf("job_title") !== -1 ? headers.indexOf("job_title") : headers.indexOf("title");
      const industryIdx = headers.indexOf("industry");
      const painIdx = headers.indexOf("pain_points") !== -1 ? headers.indexOf("pain_points") : headers.indexOf("pain");

      if (nameIdx === -1 || emailIdx === -1) {
        toast.error("CSV must contain 'name' and 'email' columns");
        return;
      }

      let successCount = 0;
      let failCount = 0;
      toast.loading("Uploading leads...", { id: "csv-upload" });

      for (let i = 1; i < lines.length; i++) {
        const row = lines[i].split(",").map((r) => r.trim().replace(/^["']|["']$/g, ""));
        if (row.length < 2 || !row[nameIdx] || !row[emailIdx]) continue;

        try {
          await leadsApi.create({
            name: row[nameIdx],
            email: row[emailIdx],
            company: companyIdx !== -1 ? row[companyIdx] : undefined,
            job_title: titleIdx !== -1 ? row[titleIdx] : undefined,
            industry: industryIdx !== -1 ? row[industryIdx] : undefined,
            pain_points: painIdx !== -1 ? row[painIdx] : undefined,
            status: "new",
          });
          successCount++;
        } catch {
          failCount++;
        }
      }

      toast.dismiss("csv-upload");
      if (successCount > 0) {
        toast.success(`Successfully imported ${successCount} leads!`);
        addNotification("CSV Uploaded", `Imported ${successCount} leads via CSV.`);
        fetchLeads();
      }
      if (failCount > 0) {
        toast.error(`Failed to import ${failCount} leads.`);
      }
    };
    reader.readAsText(file);
    // Reset file input value
    e.target.value = "";
  };
  // AI Lead Finder
  const handleAIFindLeads = async () => {
    if (!finderKeyword.trim()) return;
    setFinderLoading(true);
    try {
      const keyword = finderKeyword.trim();
      const res = await aiApi.discoverLeads(keyword);
      const count = res.data?.length ?? 0;
      toast.success(`AI discovered ${count} matching leads!`);
      addNotification("AI Leads Found", `Discovered ${count} prospects matching: "${keyword}"`);
      setShowFinderModal(false);
      setFinderKeyword("");
      fetchLeads();
    } catch (e: any) {
      toast.error(e.response?.data?.detail || "AI Lead discovery failed");
    } finally {
      setFinderLoading(false);
    }
  };

  const handleAIDomainScrape = async () => {
    if (!finderDomain.trim()) return;
    setFinderLoading(true);
    try {
      const domain = finderDomain.trim();
      const res = await aiApi.enrichDomain(domain);
      const count = res.data?.length ?? 0;
      toast.success(`AI enriched & imported ${count} stakeholders for ${domain}!`);
      addNotification("Domain Leads Scraped", `Discovered and imported ${count} prospects from ${domain}`);
      setShowFinderModal(false);
      setFinderDomain("");
      fetchLeads();
    } catch (e: any) {
      toast.error(e.response?.data?.detail || "Domain enrichment failed");
    } finally {
      setFinderLoading(false);
    }
  };

  const handleAIICPLeads = async () => {
    if (!finderValueProp.trim()) return;
    setFinderLoading(true);
    try {
      const valProp = finderValueProp.trim();
      const res = await aiApi.icpLeads(valProp);
      const count = res.data?.length ?? 0;
      toast.success(`AI generated target ICP & imported ${count} prospects!`);
      addNotification("ICP Leads Generated", `Generated target ICP prospects for: "${valProp.substring(0, 30)}..."`);
      setShowFinderModal(false);
      setFinderValueProp("");
      fetchLeads();
    } catch (e: any) {
      toast.error(e.response?.data?.detail || "ICP Leads generation failed");
    } finally {
      setFinderLoading(false);
    }
  };

  // HTML5 Drag and Drop Handlers removed (Kanban mode disabled)

  const scoreBadgeClass: any = {
    hot: "badge-hot",
    warm: "badge-warm",
    cold: "badge-cold",
    unscored: "badge-unscored",
  };

  const statusBadgeClass: any = {
    new: "status-new",
    contacted: "status-contacted",
    qualified: "status-qualified",
    unqualified: "status-unqualified",
    converted: "status-converted",
  };

  // Get unique industries dynamically
  const industries = Array.from(
    new Set(leads.map((l) => l.industry).filter(Boolean))
  ) as string[];

  // Filter and sort leads locally
  const processedLeads = [...leads]
    .filter((lead) => {
      if (!industryFilter) return true;
      return lead.industry === industryFilter;
    })
    .sort((a, b) => {
      if (sortBy === "newest") {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      if (sortBy === "oldest") {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
      if (sortBy === "name") {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === "hot") {
        const scorePriority: Record<string, number> = { hot: 3, warm: 2, cold: 1, unscored: 0 };
        const scoreA = scorePriority[a.score] ?? 0;
        const scoreB = scorePriority[b.score] ?? 0;
        if (scoreB !== scoreA) return scoreB - scoreA;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      return 0;
    });

  return (
    <div className="flex min-h-screen text-slate-900 dark:text-slate-100 transition-colors duration-300 relative overflow-hidden">

      <Sidebar />
      <main className="flex-1 lg:ml-64 p-6 lg:p-8 relative z-10">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Leads</h1>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">{totalLeads} total leads</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Notification Center */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-850 relative transition-all shadow-sm flex items-center justify-center"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-[10px] font-bold text-white rounded-full flex items-center justify-center animate-bounce">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-gray-100 dark:border-slate-800/80 z-50 p-4 space-y-3">
                  <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-slate-800/60">
                    <span className="font-semibold text-sm text-gray-900 dark:text-white">Notifications</span>
                    {unreadCount > 0 && (
                      <button onClick={markAllRead} className="text-xs text-blue-500 hover:text-blue-600 font-medium">
                        Mark all as read
                      </button>
                    )}
                  </div>
                  <div className="max-h-[240px] overflow-y-auto space-y-3 pr-1 scrollbar-thin">
                    {notifications.length === 0 ? (
                      <div className="flex flex-col items-center py-6 gap-2">
                        <Bell className="w-8 h-8 text-gray-200 dark:text-slate-700" />
                        <p className="text-xs text-gray-400 dark:text-slate-500 text-center">No notifications yet.<br />AI actions will appear here.</p>
                      </div>
                    ) : (
                      notifications.map((n: any) => (
                        <div key={n.id} className={clsx("p-2 rounded-lg text-xs transition-colors", n.read ? "bg-transparent" : "bg-blue-50/40 dark:bg-blue-950/20")}>
                          <div className="flex justify-between items-start">
                            <span className="font-semibold text-gray-900 dark:text-white">{n.title}</span>
                            <span className="text-[10px] text-gray-400 dark:text-slate-500 shrink-0 ml-2">{n.time}</span>
                          </div>
                          <p className="text-gray-500 dark:text-slate-400 mt-0.5 leading-relaxed">{n.desc}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* AI Lead Finder Trigger */}
            <button
              onClick={() => setShowFinderModal(true)}
              className="btn-secondary text-xs px-3 py-1.8 flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-500" />
              Find with AI
            </button>

            {/* CSV Upload Label Trigger */}
            <label className="btn-secondary text-xs px-3 py-1.8 flex items-center gap-1.5 cursor-pointer">
              <Upload className="w-3.5 h-3.5 text-purple-500" />
              Upload CSV
              <input
                type="file"
                accept=".csv"
                onChange={handleCSVUpload}
                className="hidden"
              />
            </label>

            <button onClick={() => { setEditLead(null); setShowModal(true); }} className="btn-primary text-xs">
              <Plus className="w-4 h-4" />
              Add Lead
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-6 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder="Search leads..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-9"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field w-40"
          >
            <option value="">All Statuses</option>
            {["new", "contacted", "qualified", "unqualified", "converted"].map((s) => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
          <select
            value={industryFilter}
            onChange={(e) => setIndustryFilter(e.target.value)}
            className="input-field w-44"
          >
            <option value="">All Industries</option>
            {industries.map((ind) => (
              <option key={ind} value={ind}>{ind}</option>
            ))}
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="input-field w-44"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="hot">Hot Leads First</option>
            <option value="name">Alphabetical (A-Z)</option>
          </select>
        </div>

        {/* View Layout Render */}
        {loading ? (
          <div className="card flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
          </div>
        ) : leads.length === 0 ? (
          <div className="card text-center py-16">
            <p className="text-gray-400 dark:text-slate-500 mb-3">No leads yet</p>
            <button onClick={() => setShowModal(true)} className="btn-primary mx-auto text-xs">
              <Plus className="w-4 h-4" /> Add your first lead
            </button>
          </div>
        ) : processedLeads.length === 0 ? (
          <div className="card text-center py-16">
            <p className="text-gray-400 dark:text-slate-500 mb-3">No leads match the selected filters</p>
            {(search || statusFilter || industryFilter) && (
              <button
                onClick={() => {
                  setSearch("");
                  setStatusFilter("");
                  setIndustryFilter("");
                }}
                className="btn-secondary mx-auto text-xs"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          /* TABLE VIEW MODE */
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 dark:bg-slate-900/50 border-b border-gray-100 dark:border-slate-800/80">
                    {["Name", "Company", "Status", "Score", "Actions"].map((h) => (
                      <th key={h} className="text-left text-xs font-semibold text-gray-500 dark:text-slate-400 px-4 py-3 uppercase tracking-wide">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-slate-800/60">
                  {processedLeads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/20 transition-colors">
                      <td className="px-4 py-3.5">
                        <p className="font-medium text-gray-900 dark:text-white text-sm">{lead.name}</p>
                        <p className="text-xs text-gray-400 dark:text-slate-500">{lead.email}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="text-sm text-gray-700 dark:text-slate-300">{lead.company || "—"}</p>
                        <p className="text-xs text-gray-400 dark:text-slate-500">{lead.job_title || ""}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={statusBadgeClass[lead.status] || "badge-unscored"}>
                          {lead.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={clsx(scoreBadgeClass[lead.score], "flex items-center gap-1 w-fit")}>
                          {SCORE_ICONS[lead.score]}
                          {lead.score}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setDetailLead(lead)}
                            title="View details"
                            className="p-1.5 rounded text-gray-400 hover:text-gray-700 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-850 transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => { setEditLead(lead); setShowModal(true); }}
                            title="Edit"
                            className="p-1.5 rounded text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleQualify(lead.id)}
                            disabled={!!aiLoading[lead.id]}
                            title="AI Qualify"
                            className="p-1.5 rounded text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors disabled:opacity-50"
                          >
                            {aiLoading[lead.id] === "qualify" ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Sparkles className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => handleEmail(lead.id)}
                            disabled={!!aiLoading[lead.id]}
                            title="Generate Email"
                            className="p-1.5 rounded text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/40 transition-colors disabled:opacity-50"
                          >
                            {aiLoading[lead.id] === "email" ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Mail className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => handleDelete(lead.id)}
                            title="Delete"
                            className="p-1.5 rounded text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
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
            {/* Pagination Controls */}
            <div className="bg-gray-50 dark:bg-slate-900/30 px-4 py-3 border-t border-gray-100 dark:border-slate-800/80 flex items-center justify-between">
              <div className="text-xs text-gray-500 dark:text-slate-400">
                Showing {((page - 1) * LIMIT) + 1} to {Math.min(page * LIMIT, totalLeads)} of {totalLeads} leads
              </div>
              <div className="flex gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                  className="px-3 py-1 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800 text-xs font-medium rounded-lg text-slate-700 dark:text-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <button
                  disabled={leads.length < LIMIT}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-3 py-1 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800 text-xs font-medium rounded-lg text-slate-700 dark:text-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* AI Lead Finder Modal */}
      {showFinderModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl border border-gray-150 dark:border-slate-800/80 p-6 space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-lg text-gray-900 dark:text-white flex items-center gap-1.5">
                  <Sparkles className="w-5 h-5 text-blue-500 animate-pulse" />
                  Lead Generation Center
                </h3>
                <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">Discover contacts via AI Search or scrape target stakeholders by company domain.</p>
              </div>
              <button onClick={() => setShowFinderModal(false)} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex border-b border-gray-100 dark:border-slate-800">
              <button
                onClick={() => setFinderTab("keyword")}
                className={clsx(
                  "flex-1 pb-3 text-xs font-semibold border-b-2 transition-all flex items-center justify-center gap-1.5",
                  finderTab === "keyword"
                    ? "border-blue-500 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-gray-400 dark:text-slate-500"
                )}
              >
                <Sparkles className="w-3.5 h-3.5" />
                AI Keyword
              </button>
              <button
                onClick={() => setFinderTab("domain")}
                className={clsx(
                  "flex-1 pb-3 text-xs font-semibold border-b-2 transition-all flex items-center justify-center gap-1.5",
                  finderTab === "domain"
                    ? "border-blue-500 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-gray-400 dark:text-slate-500"
                )}
              >
                <Globe className="w-3.5 h-3.5" />
                Domain Scraper
              </button>
              <button
                onClick={() => setFinderTab("icp")}
                className={clsx(
                  "flex-1 pb-3 text-xs font-semibold border-b-2 transition-all flex items-center justify-center gap-1.5",
                  finderTab === "icp"
                    ? "border-blue-500 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-gray-400 dark:text-slate-500"
                )}
              >
                <Trophy className="w-3.5 h-3.5" />
                AI ICP
              </button>
            </div>
            
            {finderTab === "keyword" && (
              <div className="space-y-3 pt-1">
                <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400">Target Keyword / Role Profile</label>
                <input
                  type="text"
                  placeholder="e.g. Fintech Tech Directors, SaaS CEOs..."
                  value={finderKeyword}
                  onChange={(e) => setFinderKeyword(e.target.value)}
                  className="input-field w-full text-sm"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !finderLoading) handleAIFindLeads();
                  }}
                />
                <button
                  onClick={handleAIFindLeads}
                  disabled={finderLoading || !finderKeyword.trim()}
                  className="btn-primary w-full flex items-center justify-center gap-2 py-2.5 text-xs disabled:opacity-50"
                >
                  {finderLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Searching B2B databases...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Discover Prospects
                    </>
                  )}
                </button>
              </div>
            )}
            
            {finderTab === "domain" && (
              <div className="space-y-3 pt-1">
                <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400">Target Company Website Domain</label>
                <input
                  type="text"
                  placeholder="e.g. stripe.com, zoom.us, salesforce.com"
                  value={finderDomain}
                  onChange={(e) => setFinderDomain(e.target.value)}
                  className="input-field w-full text-sm"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !finderLoading) handleAIDomainScrape();
                  }}
                />
                <button
                  onClick={handleAIDomainScrape}
                  disabled={finderLoading || !finderDomain.trim()}
                  className="btn-primary w-full flex items-center justify-center gap-2 py-2.5 text-xs disabled:opacity-50 bg-indigo-600 hover:bg-indigo-700"
                >
                  {finderLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Scraping & enriching domain...
                    </>
                  ) : (
                    <>
                      <Globe className="w-4 h-4" />
                      Enrich & Import Leads
                    </>
                  )}
                </button>
              </div>
            )}

            {finderTab === "icp" && (
              <div className="space-y-3 pt-1">
                <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400">Your Company Product / Value Proposition</label>
                <textarea
                  placeholder="e.g. We build a database monitor that reduces AWS cost for fintech enterprises..."
                  value={finderValueProp}
                  onChange={(e) => setFinderValueProp(e.target.value)}
                  className="input-field w-full text-sm min-h-[80px]"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey && !finderLoading) {
                      e.preventDefault();
                      handleAIICPLeads();
                    }
                  }}
                />
                <button
                  onClick={handleAIICPLeads}
                  disabled={finderLoading || !finderValueProp.trim()}
                  className="btn-primary w-full flex items-center justify-center gap-2 py-2.5 text-xs disabled:opacity-50 bg-violet-600 hover:bg-violet-700 shadow-lg shadow-violet-500/20"
                >
                  {finderLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating ICP & prospects...
                    </>
                  ) : (
                    <>
                      <Trophy className="w-4 h-4" />
                      Generate ICP & Import Leads
                    </>
                  )}
                </button>
              </div>
            )}

          </div>
        </div>
      )}

      {/* Modals */}
      {showModal && (
        <LeadModal
          lead={editLead}
          onClose={() => setShowModal(false)}
          onSave={() => { setShowModal(false); fetchLeads(); }}
        />
      )}
      {detailLead && (
        <LeadDetailModal
          lead={detailLead}
          onClose={() => setDetailLead(null)}
          onQualify={() => handleQualify(detailLead.id)}
          onGenerateEmail={() => handleEmail(detailLead.id)}
          onUpdate={(updatedLead) => {
            setDetailLead(updatedLead);
            fetchLeads();
          }}
        />
      )}
    </div>
  );
}
