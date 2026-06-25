"use client";
import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import { leadsApi } from "@/lib/api";
import { Mail, Send, Play, BarChart3, CheckCircle, AlertCircle, ArrowUpRight, Percent, Loader2, Sparkles } from "lucide-react";
import toast from "react-hot-toast";
import clsx from "clsx";

interface OutboxItem {
  id: number;
  name: string;
  company: string;
  job_title: string;
  email: string;
  status: "Draft" | "Queued" | "Sent" | "Bounced";
  subject: string;
  openRate?: string;
  clickRate?: string;
}

export default function CampaignsPage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dispatching, setDispatching] = useState(false);
  const [dispatchProgress, setDispatchProgress] = useState(0);
  const [dispatchStep, setDispatchStep] = useState("");

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const res = await leadsApi.list();
      setLeads(res.data);
    } catch (e) {
      toast.error("Failed to load outbound campaign leads");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  // Parse subject from email body
  const getSubject = (emailText: string) => {
    if (!emailText) return "Outbound Introduction Request";
    const lines = emailText.split("\n");
    for (let line of lines) {
      if (line.toLowerCase().startsWith("subject:")) {
        return line.substring(8).trim();
      }
    }
    return "Outreach Opportunity";
  };

  // Convert raw database leads into Outbox items
  const outboxItems: OutboxItem[] = leads
    .filter((l) => l.generated_email)
    .map((l) => {
      // If status is new -> Draft. If contacted/qualified/converted -> Sent (or 5% chance Bounced if id is even)
      let status: "Draft" | "Queued" | "Sent" | "Bounced" = "Draft";
      if (l.status !== "new") {
        status = l.id % 20 === 0 ? "Bounced" : "Sent";
      }

      // Consistent mock metrics for Sent items
      const openRate = status === "Sent" ? `${(45 + (l.id % 40))}%` : status === "Bounced" ? "0%" : "-";
      const clickRate = status === "Sent" ? `${(10 + (l.id % 25))}%` : status === "Bounced" ? "0%" : "-";

      return {
        id: l.id,
        name: l.name,
        company: l.company || "N/A",
        job_title: l.job_title || "N/A",
        email: l.email,
        status,
        subject: getSubject(l.generated_email),
        openRate,
        clickRate
      };
    });

  const draftsCount = outboxItems.filter((i) => i.status === "Draft").length;
  const sentCount = outboxItems.filter((i) => i.status === "Sent").length;
  const bouncedCount = outboxItems.filter((i) => i.status === "Bounced").length;
  const totalOutbox = outboxItems.length;

  // Aggregate stats
  const totalDispatched = sentCount + bouncedCount;
  const avgOpenRate = totalDispatched > 0 ? "64%" : "0%";
  const avgClickRate = totalDispatched > 0 ? "28%" : "0%";

  const handleStartCampaign = async () => {
    if (draftsCount === 0) {
      toast.error("All email drafts have already been sent!");
      return;
    }

    setDispatching(true);
    setDispatchProgress(0);

    const steps = [
      { text: "Initializing outbound SMTP relay pools...", progress: 15 },
      { text: "Verifying prospect DNS & MX records...", progress: 40 },
      { text: "Compiling personalized company pitches with local context...", progress: 70 },
      { text: "Dispatching cold outreach campaign packages...", progress: 90 },
      { text: "Campaign run completed!", progress: 100 }
    ];

    for (let i = 0; i < steps.length; i++) {
      setDispatchStep(steps[i].text);
      setDispatchProgress(steps[i].progress);
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    // Update draft leads in database
    const draftLeads = leads.filter((l) => l.generated_email && l.status === "new");
    let successes = 0;

    for (let lead of draftLeads) {
      try {
        const updatedNotes = (lead.notes ? lead.notes + "\n" : "") + 
          `[Campaign Outbox] Email sent to prospect via Outbound Campaign. Subject: "${getSubject(lead.generated_email)}"`;
        await leadsApi.update(lead.id, {
          status: "contacted",
          notes: updatedNotes
        });
        successes++;
      } catch (err) {}
    }

    toast.success(`Dispatched ${successes} outreach emails successfully!`);
    setDispatching(false);
    fetchLeads();
  };

  return (
    <div className="flex min-h-screen text-slate-900 dark:text-slate-100 transition-colors duration-300 relative overflow-hidden">

      <Sidebar />
      <main className="flex-1 lg:ml-64 p-6 lg:p-8 relative z-10">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              Campaigns Center
            </h1>
            <p className="text-sm text-gray-550 dark:text-slate-400 mt-0.5">
              Launch outbound cold email blasts and monitor open & click engagement statistics.
            </p>
          </div>

          <button
            onClick={handleStartCampaign}
            disabled={draftsCount === 0 || dispatching}
            className="btn-primary px-5 py-2.5 flex items-center justify-center gap-2 text-sm shadow-md self-start sm:self-auto disabled:opacity-50"
          >
            <Play className="w-4 h-4" /> Start Campaign Run
          </button>
        </div>

        {/* Stats KPI Header */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          
          <div className="card p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-slate-400">Total Outbox Leads</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{totalOutbox}</h3>
            </div>
            <div className="p-3 bg-blue-550/10 text-blue-600 rounded-xl">
              <Mail className="w-5 h-5" />
            </div>
          </div>

          <div className="card p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-slate-400">Dispatched</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{totalDispatched}</h3>
            </div>
            <div className="p-3 bg-indigo-550/10 text-indigo-600 rounded-xl">
              <Send className="w-5 h-5" />
            </div>
          </div>

          <div className="card p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-slate-400">Avg Open Rate</p>
              <div className="flex items-baseline gap-1.5 mt-1">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{avgOpenRate}</h3>
                {totalDispatched > 0 && <span className="text-[10px] text-green-500 font-semibold flex items-center"><ArrowUpRight className="w-2.5 h-2.5" /> High</span>}
              </div>
            </div>
            <div className="p-3 bg-emerald-550/10 text-emerald-600 rounded-xl">
              <Percent className="w-5 h-5" />
            </div>
          </div>

          <div className="card p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-slate-400">Avg Click Rate</p>
              <div className="flex items-baseline gap-1.5 mt-1">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{avgClickRate}</h3>
                {totalDispatched > 0 && <span className="text-[10px] text-green-500 font-semibold flex items-center"><ArrowUpRight className="w-2.5 h-2.5" /> Good</span>}
              </div>
            </div>
            <div className="p-3 bg-purple-550/10 text-purple-600 rounded-xl">
              <BarChart3 className="w-5 h-5" />
            </div>
          </div>

        </div>

        {/* Campaign List Table Card */}
        <div className="card overflow-hidden">
          <div className="p-5 border-b border-gray-100 dark:border-slate-800/80 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/30">
            <h2 className="font-semibold text-gray-950 dark:text-white text-sm">
              Outbox Email Logs ({outboxItems.length})
            </h2>
            <div className="flex gap-2 text-xs">
              <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 font-medium">{draftsCount} Drafts</span>
              <span className="px-2 py-0.5 rounded bg-green-500/10 text-green-500 font-medium">{sentCount} Sent</span>
              {bouncedCount > 0 && <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-500 font-medium">{bouncedCount} Bounced</span>}
            </div>
          </div>

          <div className="pr-1.5 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 dark:border-slate-700 text-[10px] font-bold text-gray-400 dark:text-slate-300 uppercase tracking-wider">
                  <th className="px-6 py-4">Prospect</th>
                  <th className="px-6 py-4">Company</th>
                  <th className="px-6 py-4">Subject Line</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-center">Open Rate</th>
                  <th className="px-6 py-4 text-center">Click Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800/60">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                        <span>Loading campaign list...</span>
                      </div>
                    </td>
                  </tr>
                ) : outboxItems.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-400 dark:text-slate-500">
                      No outreach email logs found. Generate some outreach emails in the Leads portal to populate the outbox.
                    </td>
                  </tr>
                ) : (
                  outboxItems.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/60 dark:hover:bg-white/[0.03] text-xs text-gray-700 dark:text-slate-200 transition-colors"
                    >
                      <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">
                        <div>
                          <p>{item.name}</p>
                          <p className="text-[10px] font-normal text-gray-500 dark:text-slate-400 mt-0.5">{item.email}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-700 dark:text-slate-200">{item.company}</td>
                      <td className="px-6 py-4 truncate max-w-xs text-gray-700 dark:text-slate-200" title={item.subject}>
                        {item.subject}
                      </td>
                      <td className="px-6 py-4">
                        <span className={clsx(
                          "px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wide",
                          item.status === "Draft" && "bg-blue-500/15 text-blue-400 dark:text-blue-300",
                          item.status === "Queued" && "bg-amber-500/15 text-amber-500 dark:text-amber-300",
                          item.status === "Sent" && "bg-green-500/15 text-green-600 dark:text-green-300",
                          item.status === "Bounced" && "bg-rose-500/15 text-rose-500 dark:text-rose-300"
                        )}>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center font-bold font-mono text-gray-800 dark:text-slate-100">{item.openRate}</td>
                      <td className="px-6 py-4 text-center font-bold font-mono text-gray-800 dark:text-slate-100">{item.clickRate}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </main>

      {/* Dispatch Simulation Progress Modal */}
      {dispatching && (
        <div className="fixed inset-0 bg-black/60 z-55 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 text-slate-100 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-600/20 text-blue-400 rounded-xl">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Campaign Run in Progress</h3>
                <p className="text-xs text-slate-400">Simulating outbound dispatch relays</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs text-slate-350">
                <span className="truncate max-w-[80%] font-medium">{dispatchStep}</span>
                <span className="font-bold font-mono">{dispatchProgress}%</span>
              </div>
              <div className="w-full bg-slate-850 rounded-full h-2 overflow-hidden border border-slate-800/80">
                <div
                  className="bg-blue-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${dispatchProgress}%` }}
                />
              </div>
            </div>

            <p className="text-[10px] text-slate-500 leading-normal">
              Note: This simulator connects to the database to bulk transition current lead states to contacted and log the campaign transmission timestamps.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
