"use client";
import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import { Cable, Loader2, ArrowRight } from "lucide-react";
import toast from "react-hot-toast";
import clsx from "clsx";

interface IntegrationItem {
  id: string;
  name: string;
  category: "CRM" | "Email" | "Voice" | "Alerts" | "Scheduler" | "Data";
  desc: string;
  connected: boolean;
  iconColor: string;
  btnStyle: string;
  configFields?: { label: string; key: string; type: "text" | "toggle"; value: any }[];
}

function BrandLogo({ id, className }: { id: string; className?: string }) {
  if (id === "hubspot") {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none">
        <path fill="#FF7A59" d="M19.5 10.8c-.3-1.1-1.2-2-2.3-2.3V5.5c.6-.2 1-.8 1-1.5 0-1-.8-1.8-1.8-1.8S14.6 3 14.6 4c0 .7.4 1.3 1 1.5v3c-1.1.3-2 1.2-2.3 2.3h-3L8.2 9.6c.3-.3.4-.7.4-1.1 0-1-.8-1.8-1.8-1.8S5 7.5 5 8.5s.8 1.8 1.8 1.8c.4 0 .8-.1 1.1-.4l1.2 1.2v3l-1.2 1.2c-.3-.3-.7-.4-1.1-.4-1 0-1.8.8-1.8 1.8s.8 1.8 1.8 1.8 1.8-.8 1.8-1.8c0-.4-.1-.8-.4-1.1l1.2-1.2h3c.3 1.1 1.2 2 2.3 2.3v3c-.6.2-1 .8-1 1.5 0 1 .8 1.8 1.8 1.8s1.8-.8 1.8-1.8c0-.7-.4-1.3-1-1.5v-3c1.1-.3 2-1.2 2.3-2.3h3.1c.3.3.7.4 1.1.4 1 0 1.8-.8 1.8-1.8s-.8-1.8-1.8-1.8c-.4 0-.8.1-1.1.4H19.5zm-3.1 2.7c-.8 0-1.4-.6-1.4-1.4s.6-1.4 1.4-1.4 1.4.6 1.4 1.4-.6 1.4-1.4 1.4z"/>
      </svg>
    );
  }
  if (id === "salesforce") {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none">
        <path fill="#00A1E0" d="M18.8 10.9c-.2-.6-.7-1.1-1.3-1.4-.2-1.5-1.5-2.7-3.1-2.7-.4 0-.8.1-1.2.2C12.4 5.3 10.7 4.5 9 4.5c-2.3 0-4.3 1.5-5 3.6-.8-.1-1.6.4-1.9 1.2A3 3 0 0 0 0 12.1c0 1.7 1.4 3 3.1 3H18c2 0 3.6-1.6 3.6-3.6 0-1.8-1.3-3.3-2.8-3.6z"/>
      </svg>
    );
  }
  if (id === "gmail") {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none">
        <path fill="#4285F4" d="M20 4H16v8l-4-3-4 3V4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2z"/>
        <path fill="#EA4335" d="M20 4H16l-4 4.5L8 4H4C2.9 4 2 4.9 2 6l10 7.5L22 6c0-1.1-.9-2-2-2z"/>
        <path fill="#FBBC05" d="M2 6v12c0 1.1.9 2 2 2h4V8l-6-2z"/>
        <path fill="#34A853" d="M22 6v12c0 1.1-.9 2-2 2h-4V8l6-2z"/>
      </svg>
    );
  }
  if (id === "outlook") {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none">
        <path fill="#0078D4" d="M2 5.5l9.5-3.5v20L2 18.5V5.5zm11 0l9 2.5v12l-9 2.5V5.5zm1.5 2.5v8h6V8h-6z"/>
      </svg>
    );
  }
  if (id === "twilio") {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" fill="#F22F46"/>
        <circle cx="9" cy="9" r="1.5" fill="white"/>
        <circle cx="15" cy="9" r="1.5" fill="white"/>
        <circle cx="9" cy="15" r="1.5" fill="white"/>
        <circle cx="15" cy="15" r="1.5" fill="white"/>
      </svg>
    );
  }
  if (id === "slack") {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none">
        <path d="M5 11.5A1.5 1.5 0 1 1 5 10h1.5v1.5H5zm0-2.5A1.5 1.5 0 0 1 5 6c.8 0 1.5.7 1.5 1.5V11a1.5 1.5 0 0 1-1.5-2z" fill="#36C5F0"/>
        <rect x="6.5" y="6" width="1.5" height="5" rx="0.75" fill="#36C5F0"/>
        <path d="M12.5 5A1.5 1.5 0 1 1 14 5v1.5h-1.5V5zm2.5 0a1.5 1.5 0 0 1-3 0c0-.8.7-1.5 1.5-1.5H15a1.5 1.5 0 0 1 0 3z" fill="#2EB67D"/>
        <rect x="11" y="6.5" width="5" height="1.5" rx="0.75" fill="#2EB67D"/>
        <path d="M19 12.5a1.5 1.5 0 1 1 0 3H17.5v-1.5H19zm0 2.5a1.5 1.5 0 0 1 0 3c-.8 0-1.5-.7-1.5-1.5V14a1.5 1.5 0 0 1 1.5 1z" fill="#ECB22E"/>
        <rect x="16" y="13" width="1.5" height="5" rx="0.75" fill="#ECB22E"/>
        <path d="M11.5 19a1.5 1.5 0 1 1-1.5-1.5H11.5V19zm-2.5 0a1.5 1.5 0 0 1 3 0c0 .8-.7 1.5-1.5 1.5H9a1.5 1.5 0 0 1 0-3z" fill="#E01E5A"/>
        <rect x="8" y="16" width="5" height="1.5" rx="0.75" fill="#E01E5A"/>
      </svg>
    );
  }
  if (id === "linkedin") {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none">
        <rect width="24" height="24" rx="4" fill="#0A66C2"/>
        <path fill="white" d="M6.5 8.375h2.775v8.375H6.5zM7.887 5c.956 0 1.55.625 1.569 1.444 0 .8-.593 1.444-1.569 1.444-.956 0-1.569-.644-1.569-1.444C6.318 5.625 6.95 5 7.887 5zm4.837 3.375h2.775v1.144h.038c.387-.694 1.225-1.425 2.525-1.425 2.7 0 3.2 1.831 3.2 4.212v4.444h-2.775V12.3c0-1.062-.375-1.787-1.312-1.787-.719 0-1.15.5-1.338.981-.069.175-.088.419-.088.663v4.219H12.75l.006-8.376z"/>
      </svg>
    );
  }
  if (id === "calendly") {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none">
        <path fill="#006BFF" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2V7zm0 8h2v2h-2v-2z"/>
      </svg>
    );
  }
  if (id === "zapier") {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none">
        <path fill="#FF4F00" d="M12 2L9.5 8.5H3l5.2 3.8L6.2 19 12 15l5.8 4-2-6.7 5.2-3.8h-6.5L12 2z"/>
      </svg>
    );
  }
  if (id === "zoom") {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" fill="#2D8CFF"/>
        <path fill="white" d="M8 9.5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1v-5zm7.5.5l-1.5 1.13v1.74l1.5 1.13A.5.5 0 0 0 16 13.6v-3.2a.5.5 0 0 0-.5-.4z"/>
      </svg>
    );
  }
  if (id === "apollo") {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none">
        <path fill="#FF6B00" d="M12 2.25L3.75 20.25h16.5L12 2.25zm0 3.75l5.5 11.25H6.5L12 6z"/>
      </svg>
    );
  }
  return null;
}

export default function IntegrationsPage() {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [integrations, setIntegrations] = useState<IntegrationItem[]>([
    {
      id: "hubspot",
      name: "HubSpot CRM",
      category: "CRM",
      desc: "Automatically push newly qualified leads, objection battle cards, and transcripts to HubSpot contacts.",
      connected: false,
      iconColor: "text-orange-500 bg-orange-500/10",
      btnStyle: "bg-orange-600 hover:bg-orange-500",
      configFields: [
        { label: "Sync Qualified Leads automatically", key: "auto_sync", type: "toggle", value: true },
        { label: "Sync dialer calls as contacts", key: "sync_calls", type: "toggle", value: false },
      ]
    },
    {
      id: "salesforce",
      name: "Salesforce CRM",
      category: "CRM",
      desc: "Synchronize prospects with Salesforce leads, update opportunity pipelines, and track outbound email campaigns.",
      connected: false,
      iconColor: "text-blue-500 bg-blue-500/10",
      btnStyle: "bg-blue-600 hover:bg-blue-500",
      configFields: [
        { label: "Create leads as Opportunities", key: "create_opps", type: "toggle", value: true },
        { label: "Attach battle card to Notes", key: "attach_notes", type: "toggle", value: true }
      ]
    },
    {
      id: "gmail",
      name: "Google Workspace / Gmail",
      category: "Email",
      desc: "Connect your business Gmail account via OAuth to send cold outreach campaigns directly from your domain.",
      connected: false,
      iconColor: "text-red-500 bg-red-500/10",
      btnStyle: "bg-red-600 hover:bg-red-500",
      configFields: [
        { label: "Daily Email Limit (Safety)", key: "daily_limit", type: "text", value: "150" }
      ]
    },
    {
      id: "outlook",
      name: "Microsoft Outlook",
      category: "Email",
      desc: "Authenticate business Outlook accounts. Set up customized SMTP/IMAP outreach pipelines safely.",
      connected: false,
      iconColor: "text-blue-600 bg-blue-600/10",
      btnStyle: "bg-blue-600 hover:bg-blue-500",
      configFields: [
        { label: "Daily Email Limit (Safety)", key: "daily_limit", type: "text", value: "100" }
      ]
    },
    {
      id: "twilio",
      name: "Twilio Dialer Voice",
      category: "Voice",
      desc: "Provision Twilio phone lines to execute interactive dialing. Supports SMS text outreach workflows.",
      connected: false,
      iconColor: "text-red-500 bg-red-500/10",
      btnStyle: "bg-red-600 hover:bg-red-500",
      configFields: [
        { label: "Twilio Phone Number", key: "phone_num", type: "text", value: "+1 (555) 019-2834" }
      ]
    },
    {
      id: "slack",
      name: "Slack Notifications",
      category: "Alerts",
      desc: "Instantly alert your sales team in Slack channels whenever a prospect replies positively or books a meeting.",
      connected: false,
      iconColor: "text-purple-500 bg-purple-500/10",
      btnStyle: "bg-purple-600 hover:bg-purple-500",
      configFields: [
        { label: "Webhook Channel URL", key: "slack_webhook", type: "text", value: "https://hooks.slack.com/services/T00000000/B00000000/XXXX" }
      ]
    },
    {
      id: "linkedin",
      name: "LinkedIn Sales Navigator",
      category: "CRM",
      desc: "Connect LinkedIn Sales Navigator profiles. Automatically view targets, send invitations, and sync connection threads.",
      connected: false,
      iconColor: "text-blue-700 bg-blue-700/10",
      btnStyle: "bg-blue-700 hover:bg-blue-650",
      configFields: [
        { label: "LinkedIn Cookie (li_at)", key: "li_cookie", type: "text", value: "AQFA_cookie_xxxx" }
      ]
    },
    {
      id: "calendly",
      name: "Calendly Booking Sync",
      category: "Scheduler",
      desc: "Synchronize your Calendly slots. Automatically generate and inject booking links inside positive prospect AI reply recommendations.",
      connected: false,
      iconColor: "text-sky-500 bg-sky-500/10",
      btnStyle: "bg-sky-600 hover:bg-sky-500",
      configFields: [
        { label: "Calendly API Token", key: "calendly_token", type: "text", value: "cal_token_xxxx" }
      ]
    },
    {
      id: "zapier",
      name: "Zapier Automation Hooks",
      category: "Alerts",
      desc: "Trigger Zapier multi-app workflows automatically when prospects are qualified as Hot or meetings are booked.",
      connected: false,
      iconColor: "text-orange-600 bg-orange-600/10",
      btnStyle: "bg-orange-600 hover:bg-orange-500",
      configFields: [
        { label: "Zapier Webhook Catch URL", key: "zap_webhook", type: "text", value: "https://hooks.zapier.com/hooks/catch/..." }
      ]
    },
    {
      id: "zoom",
      name: "Zoom Meeting Generator",
      category: "Voice",
      desc: "Auto-generate Zoom video conference links when meetings are booked inside the Sentiment Inbox, and send calendar invites.",
      connected: false,
      iconColor: "text-blue-400 bg-blue-400/10",
      btnStyle: "bg-blue-500 hover:bg-blue-400",
      configFields: [
        { label: "Sync Zoom with Outlook/Gmail Calendar", key: "sync_zoom_calendar", type: "toggle", value: true }
      ]
    },
    {
      id: "apollo",
      name: "Apollo.io Sourcing Sync",
      category: "Data",
      desc: "Fetch fresh B2B emails, direct dials, and mobile numbers from Apollo's database using search filters.",
      connected: false,
      iconColor: "text-sky-650 bg-sky-500/10",
      btnStyle: "bg-sky-600 hover:bg-sky-500",
      configFields: [
        { label: "Apollo API Key", key: "apollo_key", type: "text", value: "ap_key_xxxx" }
      ]
    }
  ]);

  // Load configuration from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("ai-sdr-integrations");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setIntegrations((prev) =>
          prev.map((item) => {
            const savedItem = parsed.find((p: any) => p.id === item.id);
            if (savedItem) {
              return {
                ...item,
                connected: savedItem.connected,
                configFields: item.configFields?.map((f) => {
                  const savedField = savedItem.configFields?.find((sf: any) => sf.key === f.key);
                  return savedField ? { ...f, value: savedField.value } : f;
                })
              };
            }
            return item;
          })
        );
      } catch (e) {}
    }
  }, []);

  const persistIntegrations = (items: IntegrationItem[]) => {
    localStorage.setItem(
      "ai-sdr-integrations",
      JSON.stringify(
        items.map((item) => ({
          id: item.id,
          connected: item.connected,
          configFields: item.configFields?.map((f) => ({ key: f.key, value: f.value }))
        }))
      )
    );
  };

  const handleToggleConnect = async (id: string, currentlyConnected: boolean) => {
    setLoadingId(id);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setLoadingId(null);

    setIntegrations((prev) => {
      const updated = prev.map((item) => {
        if (item.id === id) {
          const nextState = !currentlyConnected;
          if (nextState) {
            toast.success(`${item.name} connected successfully!`);
          } else {
            toast.success(`${item.name} disconnected.`);
          }
          return { ...item, connected: nextState };
        }
        return item;
      });
      persistIntegrations(updated);
      return updated;
    });

    if (id === "hubspot" || id === "salesforce") {
      const settingsKey = "ai-sdr-settings";
      const savedSettings = localStorage.getItem(settingsKey);
      if (savedSettings) {
        try {
          const parsed = JSON.parse(savedSettings);
          parsed[`crm_${id === "hubspot" ? "hubspot" : "salesforce"}`] = !currentlyConnected;
          localStorage.setItem(settingsKey, JSON.stringify(parsed));
        } catch {}
      }
    }
  };

  const handleConfigChange = (integrationId: string, fieldKey: string, nextValue: any) => {
    setIntegrations((prev) => {
      const updated = prev.map((item) => {
        if (item.id === integrationId) {
          return {
            ...item,
            configFields: item.configFields?.map((f) =>
              f.key === fieldKey ? { ...f, value: nextValue } : f
            )
          };
        }
        return item;
      });
      persistIntegrations(updated);
      return updated;
    });
  };

  return (
    <div className="flex min-h-screen text-slate-900 dark:text-slate-100 transition-colors duration-300 relative overflow-hidden bg-slate-50 dark:bg-slate-950">
      <Sidebar />
      <main className="flex-1 lg:ml-64 px-6 pt-8 pb-4 lg:px-10 lg:pt-10 lg:pb-6 relative z-10">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Cable className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Connection & Integration Hub</h1>
              <p className="text-sm text-gray-550 dark:text-slate-400 mt-0.5">
                Connect and sync CRM workspaces, dialers, email addresses, and team Slack notification endpoints.
              </p>
            </div>
          </div>
        </div>

        {/* Integrations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {integrations.map((item) => {
            const isLoading = loadingId === item.id;

            return (
              <div key={item.id} className="card p-6 flex flex-col justify-between bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-white/5 relative overflow-hidden group hover:shadow-lg transition-all duration-300">
                
                {/* Background Glow */}
                <div className={clsx("absolute top-[-40px] right-[-40px] w-28 h-28 rounded-full blur-[40px] opacity-10 group-hover:opacity-20 transition-all pointer-events-none",
                  item.connected ? "bg-emerald-500" : "bg-blue-500"
                )} />

                <div className="space-y-4">
                  {/* Top Header Card */}
                  <div className="flex justify-between items-start">
                    <div className={clsx("p-3 rounded-xl", item.iconColor)}>
                      <BrandLogo id={item.id} className="w-5 h-5" />
                    </div>
                    <span className={clsx("text-[9px] font-bold px-2 py-0.5 rounded-full border shadow-sm uppercase tracking-wider",
                      item.connected
                        ? "bg-emerald-500/15 text-emerald-500 border-emerald-500/25 animate-fade-in"
                        : "bg-slate-100 dark:bg-slate-800 text-gray-400 dark:text-slate-500 border-gray-150 dark:border-slate-800"
                    )}>
                      {item.connected ? "Connected" : "Disconnected"}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white text-sm">{item.name}</h3>
                    <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-1 leading-relaxed min-h-[48px]">
                      {item.desc}
                    </p>
                  </div>

                  {/* Connected Configuration Form */}
                  {item.connected && item.configFields && (
                    <div className="space-y-3 pt-3 border-t border-gray-100 dark:border-slate-800/80 animate-fade-in">
                      {item.configFields.map((field) => (
                        <div key={field.key} className="flex flex-col gap-1.5">
                          <span className="text-[10px] font-semibold text-gray-500 dark:text-slate-400">{field.label}</span>
                          {field.type === "toggle" ? (
                            <label className="relative inline-flex items-center cursor-pointer mt-0.5">
                              <input
                                type="checkbox"
                                checked={field.value}
                                onChange={(e) => handleConfigChange(item.id, field.key, e.target.checked)}
                                className="sr-only peer"
                              />
                              <div className="w-9 h-5 bg-gray-200 dark:bg-slate-800 rounded-full peer peer-focus:ring-1 peer-focus:ring-blue-500/20 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600" />
                            </label>
                          ) : (
                            <input
                              type="text"
                              value={field.value}
                              onChange={(e) => handleConfigChange(item.id, field.key, e.target.value)}
                              className="input-field py-1 px-2.5 text-xs font-mono w-full"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-5 mt-4 border-t border-gray-100 dark:border-slate-800/50 flex justify-end">
                  <button
                    onClick={() => handleToggleConnect(item.id, item.connected)}
                    disabled={isLoading}
                    className={clsx(
                      "px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm active:scale-95 disabled:opacity-50",
                      item.connected
                        ? "bg-slate-100 hover:bg-slate-200 text-gray-600 dark:bg-slate-800 dark:hover:bg-slate-750 dark:text-slate-300"
                        : clsx("text-white", item.btnStyle)
                    )}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Processing...
                      </>
                    ) : item.connected ? (
                      "Disconnect"
                    ) : (
                      <>
                        Connect
                        <ArrowRight className="w-3 h-3" />
                      </>
                    )}
                  </button>
                </div>

              </div>
            );
          })}
        </div>

      </main>
    </div>
  );
}
