"use client";
import {
  X, Flame, Thermometer, Snowflake, Sparkles, Mail, Copy, Check,
  Pencil, Save, Clock, Phone, BookOpen, Layers, Loader2, Linkedin,
  Search, ShieldAlert, Link
} from "lucide-react";
import { useState, useEffect } from "react";
import clsx from "clsx";
import toast from "react-hot-toast";
import { leadsApi, aiApi } from "@/lib/api";
import AIDialerModal from "./AIDialerModal";

interface Props {
  lead: any;
  onClose: () => void;
  onQualify: () => void;
  onGenerateEmail: () => void;
  onUpdate?: (updatedLead: any) => void;
}

type TabType = "overview" | "sequence" | "script" | "linkedin" | "research" | "battlecard";

export default function LeadDetailModal({ lead, onClose, onQualify, onGenerateEmail, onUpdate }: Props) {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedEmail, setEditedEmail] = useState(lead.generated_email || "");
  const [isSaving, setIsSaving] = useState(false);
  const [showDialer, setShowDialer] = useState(false);

  // Tab State
  const [activeTab, setActiveTab] = useState<TabType>("overview");

  // Call script state
  const [callScript, setCallScript] = useState("");
  const [scriptLoading, setScriptLoading] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);

  // LinkedIn Outreach State
  const [connectionNote, setConnectionNote] = useState("");
  const [inmailDraft, setInmailDraft] = useState("");
  const [linkedinLoading, setLinkedinLoading] = useState(false);
  const [copiedNote, setCopiedNote] = useState(false);
  const [copiedInmail, setCopiedInmail] = useState(false);

  // Market Research State
  const [companyProfile, setCompanyProfile] = useState("");
  const [techStack, setTechStack] = useState("");
  const [competitors, setCompetitors] = useState("");
  const [researchLoading, setResearchLoading] = useState(false);

  // Objection Battle Card State
  const [battleCard, setBattleCard] = useState("");
  const [battleCardLoading, setBattleCardLoading] = useState(false);
  const [copiedBattleCard, setCopiedBattleCard] = useState(false);

  // CRM Sync state
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    setEditedEmail(lead.generated_email || "");
  }, [lead.generated_email]);

  const copyEmail = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const copyScriptText = () => {
    if (!callScript) return;
    navigator.clipboard.writeText(callScript);
    setCopiedScript(true);
    toast.success("Script copied!");
    setTimeout(() => setCopiedScript(false), 2000);
  };

  const copyNoteText = () => {
    if (!connectionNote) return;
    navigator.clipboard.writeText(connectionNote);
    setCopiedNote(true);
    toast.success("Connection note copied!");
    setTimeout(() => setCopiedNote(false), 2000);
  };

  const copyInmailText = () => {
    if (!inmailDraft) return;
    navigator.clipboard.writeText(inmailDraft);
    setCopiedInmail(true);
    toast.success("InMail draft copied!");
    setTimeout(() => setCopiedInmail(false), 2000);
  };

  const copyBattleCardText = () => {
    if (!battleCard) return;
    navigator.clipboard.writeText(battleCard);
    setCopiedBattleCard(true);
    toast.success("Battle Card copied!");
    setTimeout(() => setCopiedBattleCard(false), 2000);
  };

  const saveEmail = async () => {
    setIsSaving(true);
    try {
      const res = await leadsApi.update(lead.id, { generated_email: editedEmail });
      toast.success("Email draft saved!");
      setIsEditing(false);
      if (onUpdate) {
        onUpdate(res.data);
      }
    } catch {
      toast.error("Failed to update email draft");
    } finally {
      setIsSaving(false);
    }
  };

  const generateCallScript = async () => {
    setScriptLoading(true);
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
            system_prompt: parsed.prompt_dialer,
          };
        } catch {}
      }
      const res = await aiApi.generateCallScript(lead.id, settings);
      setCallScript(res.data.call_script);
      toast.success("Call script generated!");
    } catch (e: any) {
      toast.error("Failed to generate call script");
    } finally {
      setScriptLoading(false);
    }
  };

  const generateLinkedInOutreach = async () => {
    setLinkedinLoading(true);
    try {
      let settings = {};
      const saved = localStorage.getItem("ai-sdr-settings");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          settings = { system_prompt: parsed.prompt_linkedin };
        } catch {}
      }
      const res = await aiApi.generateLinkedIn(lead.id, settings);
      setConnectionNote(res.data.connection_note);
      setInmailDraft(res.data.inmail_draft);
      toast.success("LinkedIn outreach drafted!");
    } catch {
      toast.error("Failed to generate LinkedIn outreach");
    } finally {
      setLinkedinLoading(false);
    }
  };

  const generateMarketResearch = async () => {
    setResearchLoading(true);
    try {
      let settings = {};
      const saved = localStorage.getItem("ai-sdr-settings");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          settings = { system_prompt: parsed.prompt_research };
        } catch {}
      }
      const res = await aiApi.generateResearch(lead.id, settings);
      setCompanyProfile(res.data.company_profile);
      setTechStack(res.data.tech_stack);
      setCompetitors(res.data.competitors);
      toast.success("Market research completed!");
    } catch {
      toast.error("Failed to perform market research");
    } finally {
      setResearchLoading(false);
    }
  };

  const generateBattleCard = async () => {
    setBattleCardLoading(true);
    try {
      let settings = {};
      const saved = localStorage.getItem("ai-sdr-settings");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          settings = { system_prompt: parsed.prompt_battle_card };
        } catch {}
      }
      const res = await aiApi.generateBattleCard(lead.id, settings);
      setBattleCard(res.data.battle_card);
      toast.success("Objection battle card generated!");
    } catch {
      toast.error("Failed to generate battle card");
    } finally {
      setBattleCardLoading(false);
    }
  };

  const syncWithCRM = async () => {
    // Check connected CRMs from localStorage
    const savedSettings = localStorage.getItem("ai-sdr-settings");
    let crmName = "CRM";
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        if (parsed.crm_hubspot && parsed.crm_salesforce) crmName = "HubSpot & Salesforce";
        else if (parsed.crm_hubspot) crmName = "HubSpot";
        else if (parsed.crm_salesforce) crmName = "Salesforce";
      } catch {}
    }

    setSyncing(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1200));
      // Log event in lead notes
      const updatedNotes = (lead.notes ? lead.notes + "\n" : "") + 
        `[CRM Integration] Synchronized lead to ${crmName} systems. Status: Active.`;
      const res = await leadsApi.update(lead.id, { notes: updatedNotes });
      if (onUpdate) onUpdate(res.data);
      toast.success(`Prospect successfully synced to ${crmName}!`);
    } catch {
      toast.error("CRM Sync failed");
    } finally {
      setSyncing(false);
    }
  };

  const ScoreIcon = { hot: Flame, warm: Thermometer, cold: Snowflake }[lead.score as string] || Sparkles;
  const scoreColor = { hot: "text-red-500", warm: "text-orange-500", cold: "text-blue-500", unscored: "text-gray-400 dark:text-slate-500" }[lead.score as string] || "text-gray-400 dark:text-slate-500";

  const Row = ({ label, value }: any) =>
    value ? (
      <div className="flex gap-3">
        <span className="text-xs text-gray-400 dark:text-slate-500 w-28 shrink-0 pt-0.5">{label}</span>
        <span className="text-sm text-gray-700 dark:text-slate-200">{value}</span>
      </div>
    ) : null;

  // Generate dynamic log timeline of activities
  const getTimelineHistory = () => {
    const history = [];
    if (lead.created_at) {
      history.push({
        title: "Lead Created",
        desc: `Prospect profile added to system. Industry: ${lead.industry || "Not Specified"}.`,
        time: new Date(lead.created_at).toLocaleDateString(),
      });
    }
    if (lead.score && lead.score !== "unscored") {
      history.push({
        title: "AI Qualification Run",
        desc: `Evaluated score as ${lead.score.toUpperCase()}. Reason: ${lead.score_reason || "Analyzed pain points."}`,
        time: "Recent Update",
      });
    }
    if (lead.generated_email) {
      history.push({
        title: "Outreach Email Generated",
        desc: "AI drafted a personalized sales cold outreach draft.",
        time: "Recent Update",
      });
    }
    if (lead.notes && lead.notes.includes("CRM Integration")) {
      history.push({
        title: "CRM Sync Event",
        desc: "Prospect accounts pushed to connected CRM networks.",
        time: "Recent Update",
      });
    }
    if (lead.status === "contacted" || lead.status === "qualified") {
      history.push({
        title: "Simulated Phone Call Booked",
        desc: "Response: Positive - Discovery scheduled.",
        time: "Recent Update",
      });
    }
    return history;
  };

  // Mock Day 3 / Day 5 emails for sequencing
  const day3Followup = `Subject: Re: Solving pipeline bottlenecks at ${lead.company || "your company"}\n\nHi ${lead.name},\n\nI wanted to follow up on my previous email. I know you're busy leading growth and operations as ${lead.job_title || "professional"} at ${lead.company || "your company"}.\n\nIf outbound automation or resolving pain points like "${lead.pain_points || "scaling inefficiencies"}" isn't a focus right now, I completely understand.\n\nJust wanted to see if you'd be open to a brief 2-minute video overview showing how we do this in your industry.\n\nRegards,\nAlex Chen\nSDR, TechCorp`;

  const day5Breakup = `Subject: Final touch - Alex from TechCorp\n\nHi ${lead.name},\n\nI haven't heard back, so I'll assume automating outreach operations isn't a priority for ${lead.company || "your company"} at the moment.\n\nI won't crowd your inbox. If things change in the future and you want to look at our autonomous agent discovery tool, you can reach me here.\n\nBest of luck with your scaling goals!\n\nBest,\nAlex Chen\nSDR, TechCorp`;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-backdrop">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-gray-100 dark:border-slate-800/80 animate-modal-content">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-gray-100 dark:border-slate-800/80 shrink-0">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="font-semibold text-gray-900 dark:text-white text-lg">{lead.name}</h2>
              <button
                onClick={syncWithCRM}
                disabled={syncing}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400 hover:bg-emerald-100/50 rounded-full border border-emerald-500/20 shadow-sm transition-all"
              >
                {syncing ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <Link className="w-3 h-3" />
                    Sync to CRM
                  </>
                )}
              </button>
            </div>
            <p className="text-sm text-gray-500 dark:text-slate-400">{lead.email}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400 btn-scale-interactive">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation - 2-Column Grid */}
        <div className="grid grid-cols-2 gap-2 px-6 py-3 border-b border-gray-100 dark:border-slate-800/60 shrink-0 bg-slate-50/30 dark:bg-slate-900/10">
          {[
            { id: "overview", label: "Details & Analysis", icon: BookOpen },
            { id: "sequence", label: "Outreach Sequence", icon: Layers },
            { id: "linkedin", label: "LinkedIn Outreach", icon: Linkedin },
            { id: "script", label: "AI Call Script", icon: Phone },
            { id: "research", label: "Market Research", icon: Search },
            { id: "battlecard", label: "Objection Battle Card", icon: ShieldAlert }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={clsx(
                  "py-2 px-3 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all duration-200 border",
                  isActive
                    ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/15"
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-slate-900 dark:border-white/5 dark:text-slate-300 dark:hover:bg-slate-800/60"
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>


        <div className="flex-1 flex flex-col overflow-hidden pr-1.5">
          <div key={activeTab} className="flex-1 overflow-y-auto pl-6 pr-4.5 py-6 space-y-6 scrollbar-thin animate-tab-pane">

            {/* TAB 1: OVERVIEW */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                {/* Basic info */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Details</p>
                  <Row label="Company" value={lead.company} />
                  <Row label="Job Title" value={lead.job_title} />
                  <Row label="Phone" value={lead.phone} />
                  <Row label="Industry" value={lead.industry} />
                  <Row label="Company Size" value={lead.company_size} />
                  <Row label="Revenue" value={lead.annual_revenue} />
                  <Row label="Pain Points" value={lead.pain_points} />
                  <Row label="Notes" value={lead.notes} />
                </div>

                {/* AI Qualification */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider">AI Qualification</p>
                    <button onClick={onQualify} className="btn-secondary text-xs px-3 py-1.5 btn-scale-interactive">
                      <Sparkles className="w-3 h-3 animate-pulse" />
                      {lead.score === "unscored" ? "Qualify Now" : "Re-qualify"}
                    </button>
                  </div>

                  {lead.score !== "unscored" ? (
                    <div className="bg-gray-50 dark:bg-slate-950/40 rounded-xl p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <ScoreIcon className={clsx("w-5 h-5", scoreColor)} />
                        <span className={clsx("font-semibold capitalize", scoreColor)}>{lead.score} Lead</span>
                      </div>
                      {lead.score_reason && (
                        <p className="text-sm text-gray-600 dark:text-slate-350 leading-relaxed">{lead.score_reason}</p>
                      )}
                      {lead.qualification_result && (
                        <div className="border-t border-gray-200 dark:border-slate-800/80 pt-3">
                          <p className="text-xs text-gray-400 dark:text-slate-500 mb-1">Full Analysis</p>
                          <p className="text-sm text-gray-600 dark:text-slate-350 leading-relaxed">{lead.qualification_result}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-gray-50 dark:bg-slate-950/40 rounded-xl p-4 text-center text-sm text-gray-400 dark:text-slate-500">
                      Not qualified yet. Click "Qualify Now" to get AI analysis.
                    </div>
                  )}
                </div>

                {/* History Timeline */}
                <div className="border-t border-gray-100 dark:border-slate-800/60 pt-4">
                  <p className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-4">Communication & History Timeline</p>
                  <div className="relative ml-4 space-y-5">
                    <div className="absolute left-0 top-0 bottom-0 w-px bg-gray-200 dark:bg-slate-700" />
                    {getTimelineHistory().map((item, idx) => (
                      <div key={idx} className="relative pl-6 animate-list-item">
                        <span className="absolute left-[-5px] top-1 w-[10px] h-[10px] rounded-full bg-blue-500 dark:bg-blue-400 border-2 border-white dark:border-slate-900 z-10" />
                        <div className="flex justify-between items-start text-xs">
                          <span className="font-semibold text-gray-900 dark:text-white">{item.title}</span>
                          <span className="text-gray-400 dark:text-slate-500 font-mono text-[10px] shrink-0 ml-3">{item.time}</span>
                        </div>
                        <p className="text-xs text-gray-555 dark:text-slate-400 mt-1 leading-relaxed">{item.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: EMAIL OUTREACH SEQUENCE */}
            {activeTab === "sequence" && (
              <div className="space-y-6">
                <div className="border-b border-gray-100 dark:border-slate-800/60 pb-3">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Email Outreach Sequence</h3>
                  <p className="text-xs text-gray-450 dark:text-slate-500 mt-0.5">Automated B2B sequences mapped to qualify the lead.</p>
                </div>

                {/* Day 1: Outreach Email */}
                <div className="relative border-l-2 border-blue-500 pl-4 space-y-3">
                  <div className="absolute -left-1.5 top-0.5 w-3 h-3 rounded-full bg-blue-500" />
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-blue-500 uppercase tracking-wide">Day 1: Outreach Email</span>
                    <div className="flex gap-1.5">
                      {lead.generated_email && (
                        <button
                          onClick={() => setIsEditing(!isEditing)}
                          className="btn-secondary text-[10px] px-2 py-1 flex items-center gap-1 btn-scale-interactive"
                        >
                          <Pencil className="w-3 h-3" />
                          {isEditing ? "Cancel" : "Edit"}
                        </button>
                      )}
                      <button onClick={onGenerateEmail} className="btn-secondary text-[10px] px-2 py-1 flex items-center gap-1 btn-scale-interactive">
                        <Mail className="w-3 h-3" />
                        {lead.generated_email ? "Regenerate" : "Generate"}
                      </button>
                    </div>
                  </div>

                  {lead.generated_email ? (
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 relative hover-lift transition-all">
                      {isEditing ? (
                        <div className="space-y-3">
                          <textarea
                            value={editedEmail}
                            onChange={(e) => setEditedEmail(e.target.value)}
                            className="w-full min-h-[160px] bg-slate-950 text-slate-200 border border-slate-850 rounded-lg p-3 text-xs font-mono focus:outline-none focus:border-blue-500/50 leading-relaxed resize-y"
                          />
                          <div className="flex justify-end">
                            <button
                              onClick={saveEmail}
                              disabled={isSaving}
                              className="btn-primary text-[10px] px-2.5 py-1 flex items-center gap-1 btn-scale-interactive"
                            >
                              <Save className="w-3 h-3" />
                              {isSaving ? "Saving..." : "Save Draft"}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <pre className="text-xs text-slate-300 whitespace-pre-wrap font-mono leading-relaxed">
                            {lead.generated_email}
                          </pre>
                          <button
                            onClick={() => copyEmail(lead.generated_email)}
                            className="absolute top-3 right-3 p-1.5 rounded bg-white/10 hover:bg-white/20 text-white/70 transition-colors"
                          >
                            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="bg-gray-50 dark:bg-slate-950/40 rounded-xl p-4 text-center text-xs text-gray-400 dark:text-slate-500">
                      No outreach email generated yet. Click "Generate" to construct the initial cold mail.
                    </div>
                  )}
                </div>

                {/* Day 3: Follow-up Email */}
                <div className="relative border-l-2 border-purple-400 pl-4 space-y-3">
                  <div className="absolute -left-1.5 top-0.5 w-3 h-3 rounded-full bg-purple-400" />
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-purple-500 dark:text-purple-400 uppercase tracking-wide">Day 3: Follow-up email</span>
                    <button
                      onClick={() => copyEmail(day3Followup)}
                      className="btn-secondary text-[10px] px-2 py-1 flex items-center gap-1 btn-scale-interactive"
                    >
                      <Copy className="w-3 h-3" /> Copy Follow-up
                    </button>
                  </div>
                  <div className="bg-purple-50 dark:bg-slate-900 border border-purple-100 dark:border-slate-700/60 rounded-xl p-4 hover-lift transition-all">
                    <pre className="text-xs text-gray-700 dark:text-slate-300 whitespace-pre-wrap font-mono leading-relaxed">
                      {day3Followup}
                    </pre>
                  </div>
                </div>

                {/* Day 5: Breakup Email */}
                <div className="relative border-l-2 border-gray-300 dark:border-slate-600 pl-4 space-y-3">
                  <div className="absolute -left-1.5 top-0.5 w-3 h-3 rounded-full bg-gray-400 dark:bg-slate-500" />
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide">Day 5: Breakup email</span>
                    <button
                      onClick={() => copyEmail(day5Breakup)}
                      className="btn-secondary text-[10px] px-2 py-1 flex items-center gap-1 btn-scale-interactive"
                    >
                      <Copy className="w-3 h-3" /> Copy Breakup
                    </button>
                  </div>
                  <div className="bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700/60 rounded-xl p-4 hover-lift transition-all">
                    <pre className="text-xs text-gray-650 dark:text-slate-450 whitespace-pre-wrap font-mono leading-relaxed">
                      {day5Breakup}
                    </pre>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: LINKEDIN OUTREACH */}
            {activeTab === "linkedin" && (
              <div className="space-y-6">
                <div className="flex justify-between items-start border-b border-gray-100 dark:border-slate-800/60 pb-3">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">LinkedIn Outreach Generator</h3>
                    <p className="text-xs text-gray-450 dark:text-slate-500 mt-0.5">Generate connection requests and message threads.</p>
                  </div>
                  <button
                    onClick={generateLinkedInOutreach}
                    disabled={linkedinLoading}
                    className="btn-primary text-xs px-3.5 py-1.8 flex items-center gap-1.5 disabled:opacity-50 btn-scale-interactive"
                  >
                    {linkedinLoading ? (
                      <><Loader2 className="w-3.5 h-3.5 animate-spin" />Generating...</>
                    ) : (
                      <><Sparkles className="w-3.5 h-3.5" />{connectionNote ? "Regenerate Message" : "Generate Drafts"}</>
                    )}
                  </button>
                </div>

                {connectionNote ? (
                  <div className="space-y-5">
                    {/* Connection Note */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-sky-500 uppercase tracking-wide">300-Char Connection Invitation Note</span>
                        <button onClick={copyNoteText} className="btn-secondary text-[10px] px-2 py-1 flex items-center gap-1">
                          {copiedNote ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          Copy Note
                        </button>
                      </div>
                      <div className="bg-sky-50/50 dark:bg-slate-900 border border-sky-100 dark:border-slate-800 rounded-xl p-4">
                        <p className="text-xs text-gray-700 dark:text-slate-300 font-mono leading-relaxed">{connectionNote}</p>
                        <div className="mt-3 flex justify-end text-[10px] text-gray-400 font-mono">
                          Character Count: {connectionNote.length}/300
                        </div>
                      </div>
                    </div>

                    {/* InMail Draft */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-blue-500 uppercase tracking-wide">LinkedIn InMail/Message Draft</span>
                        <button onClick={copyInmailText} className="btn-secondary text-[10px] px-2 py-1 flex items-center gap-1">
                          {copiedInmail ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          Copy InMail
                        </button>
                      </div>
                      <div className="bg-blue-50/20 dark:bg-slate-900 border border-blue-100/50 dark:border-slate-800 rounded-xl p-4">
                        <pre className="text-xs text-gray-700 dark:text-slate-300 whitespace-pre-wrap font-mono leading-relaxed">{inmailDraft}</pre>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 dark:bg-slate-950/40 rounded-xl p-8 text-center space-y-3">
                    <div className="inline-flex p-3 rounded-full bg-sky-50 dark:bg-sky-950/30 text-sky-500">
                      <Linkedin className="w-6 h-6" />
                    </div>
                    <p className="text-sm text-gray-550 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                      Generate hyper-personalized social outreach copy optimized for LinkedIn Connection Limits.
                    </p>
                    <button
                      onClick={generateLinkedInOutreach}
                      disabled={linkedinLoading}
                      className="btn-secondary text-xs px-4 py-2 mx-auto flex items-center gap-1.5 disabled:opacity-50 btn-scale-interactive"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-sky-500" />
                      Generate LinkedIn Copy
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: AI CALL SCRIPT */}
            {activeTab === "script" && (
              <div className="space-y-6">
                <div className="flex justify-between items-start border-b border-gray-100 dark:border-slate-800/60 pb-3">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">AI B2B Cold Call Script</h3>
                    <p className="text-xs text-gray-450 dark:text-slate-500 mt-0.5">Custom script tailored for cold outreach pitches.</p>
                  </div>
                  <div className="flex gap-2">
                    {callScript && (
                      <button
                        onClick={() => setShowDialer(true)}
                        className="btn-secondary text-xs px-3.5 py-1.8 flex items-center gap-1.5 btn-scale-interactive"
                      >
                        <Phone className="w-3.5 h-3.5 text-blue-500" />
                        Simulate B2B Call 📞
                      </button>
                    )}
                    <button
                      onClick={generateCallScript}
                      disabled={scriptLoading}
                      className="btn-primary text-xs px-3.5 py-1.8 flex items-center gap-1.5 disabled:opacity-50 btn-scale-interactive"
                    >
                      {scriptLoading ? (
                        <><Loader2 className="w-3.5 h-3.5 animate-spin" />Generating...</>
                      ) : (
                        <><Sparkles className="w-3.5 h-3.5" />{callScript ? "Regenerate Script" : "Generate Script"}</>
                      )}
                    </button>
                  </div>
                </div>

                {callScript ? (
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 relative space-y-4 hover-lift transition-all">
                    <pre className="text-xs text-slate-300 whitespace-pre-wrap font-mono leading-relaxed">
                      {callScript}
                    </pre>
                    <button
                      onClick={copyScriptText}
                      className="absolute top-3 right-3 p-1.5 rounded bg-white/10 hover:bg-white/20 text-white/70 transition-colors"
                    >
                      {copiedScript ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                ) : (
                  <div className="bg-gray-50 dark:bg-slate-950/40 rounded-xl p-8 text-center space-y-3">
                    <div className="inline-flex p-3 rounded-full bg-blue-50 dark:bg-blue-950/30 text-blue-500">
                      <Phone className="w-6 h-6" />
                    </div>
                    <p className="text-sm text-gray-550 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                      Get an instant custom phone pitch tailored specifically to this prospect's pain points.
                    </p>
                    <button
                      onClick={generateCallScript}
                      disabled={scriptLoading}
                      className="btn-secondary text-xs px-4 py-2 mx-auto flex items-center gap-1.5 disabled:opacity-50 btn-scale-interactive"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                      Generate Call Script
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* TAB 5: MARKET RESEARCH */}
            {activeTab === "research" && (
              <div className="space-y-6">
                <div className="flex justify-between items-start border-b border-gray-100 dark:border-slate-800/60 pb-3">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">AI Market Research</h3>
                    <p className="text-xs text-gray-450 dark:text-slate-500 mt-0.5">Deep-dive company profiles, predicted technology stacks, and competitor maps.</p>
                  </div>
                  <button
                    onClick={generateMarketResearch}
                    disabled={researchLoading}
                    className="btn-primary text-xs px-3.5 py-1.8 flex items-center gap-1.5 disabled:opacity-50 btn-scale-interactive"
                  >
                    {researchLoading ? (
                      <><Loader2 className="w-3.5 h-3.5 animate-spin" />Researching...</>
                    ) : (
                      <><Sparkles className="w-3.5 h-3.5" />{companyProfile ? "Refresh Research" : "Conduct Research"}</>
                    )}
                  </button>
                </div>

                {companyProfile ? (
                  <div className="space-y-5">
                    {/* Profile */}
                    <div className="bg-gray-50 dark:bg-slate-950/40 rounded-xl p-5 border border-gray-100 dark:border-slate-800/80">
                      <h4 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-blue-500" /> Company Profile & Value Drivers
                      </h4>
                      <p className="text-sm text-gray-650 dark:text-slate-300 leading-relaxed">{companyProfile}</p>
                    </div>

                    {/* Tech Stack */}
                    <div className="bg-gray-50 dark:bg-slate-950/40 rounded-xl p-5 border border-gray-100 dark:border-slate-800/80">
                      <h4 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-purple-500" /> Predicted Tech Stack & Infrastructure
                      </h4>
                      <p className="text-sm text-gray-650 dark:text-slate-300 leading-relaxed font-mono">{techStack}</p>
                    </div>

                    {/* Competitors */}
                    <div className="bg-gray-50 dark:bg-slate-950/40 rounded-xl p-5 border border-gray-100 dark:border-slate-800/80">
                      <h4 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Flame className="w-3.5 h-3.5 text-orange-500" /> Competitive Landscape
                      </h4>
                      <p className="text-sm text-gray-650 dark:text-slate-300 leading-relaxed">{competitors}</p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 dark:bg-slate-950/40 rounded-xl p-8 text-center space-y-3">
                    <div className="inline-flex p-3 rounded-full bg-purple-50 dark:bg-purple-950/30 text-purple-500">
                      <Search className="w-6 h-6" />
                    </div>
                    <p className="text-sm text-gray-550 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                      Analyze target company data to discover competitive intelligence, tech stack requirements, and business opportunities.
                    </p>
                    <button
                      onClick={generateMarketResearch}
                      disabled={researchLoading}
                      className="btn-secondary text-xs px-4 py-2 mx-auto flex items-center gap-1.5 disabled:opacity-50 btn-scale-interactive"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                      Conduct Market Research
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* TAB 6: OBJECTION BATTLE CARD */}
            {activeTab === "battlecard" && (
              <div className="space-y-6">
                <div className="flex justify-between items-start border-b border-gray-100 dark:border-slate-800/60 pb-3">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Objection & Consulting Battle Card</h3>
                    <p className="text-xs text-gray-450 dark:text-slate-500 mt-0.5">Sales playbook triggers to counter objections and drive value conversations.</p>
                  </div>
                  <div className="flex gap-2">
                    {battleCard && (
                      <button onClick={copyBattleCardText} className="btn-secondary text-xs px-3 py-1.8 flex items-center gap-1.5">
                        {copiedBattleCard ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        Copy Book
                      </button>
                    )}
                    <button
                      onClick={generateBattleCard}
                      disabled={battleCardLoading}
                      className="btn-primary text-xs px-3.5 py-1.8 flex items-center gap-1.5 disabled:opacity-50 btn-scale-interactive"
                    >
                      {battleCardLoading ? (
                        <><Loader2 className="w-3.5 h-3.5 animate-spin" />Building Card...</>
                      ) : (
                        <><Sparkles className="w-3.5 h-3.5" />{battleCard ? "Regenerate Card" : "Build Battle Card"}</>
                      )}
                    </button>
                  </div>
                </div>

                {battleCard ? (
                  <div className="bg-slate-50 dark:bg-slate-950/40 border border-gray-150 dark:border-slate-800 rounded-xl p-5 hover-lift transition-all relative">
                    <div className="prose prose-slate dark:prose-invert max-w-none text-xs leading-relaxed font-mono whitespace-pre-wrap text-gray-700 dark:text-slate-350">
                      {battleCard}
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 dark:bg-slate-950/40 rounded-xl p-8 text-center space-y-3">
                    <div className="inline-flex p-3 rounded-full bg-rose-50 dark:bg-rose-950/30 text-rose-500">
                      <ShieldAlert className="w-6 h-6" />
                    </div>
                    <p className="text-sm text-gray-550 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                      Build consulting playbooks detailing how to handle common objections and highlight business drivers for enterprise sales.
                    </p>
                    <button
                      onClick={generateBattleCard}
                      disabled={battleCardLoading}
                      className="btn-secondary text-xs px-4 py-2 mx-auto flex items-center gap-1.5 disabled:opacity-50 btn-scale-interactive"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-rose-500" />
                      Build Battle Card
                    </button>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </div>
      {showDialer && (
        <AIDialerModal
          lead={lead}
          onClose={() => setShowDialer(false)}
          onUpdate={(updatedLead) => {
            if (onUpdate) onUpdate(updatedLead);
          }}
        />
      )}
    </div>
  );
}
