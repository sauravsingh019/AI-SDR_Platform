"use client";
import { useEffect, useState } from "react";
import { leadsApi } from "@/lib/api";
import { loadNotifications, saveNotifications, addNotification as pushNotification } from "@/lib/notification-utils";
import Sidebar from "@/components/Sidebar";
import { Users, Flame, TrendingUp, Mail, BarChart2, ArrowUpRight, Zap, Bell, PlusCircle, Inbox, Settings, Sparkles, Lightbulb, Coins, DollarSign } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, LineChart, Line, LabelList } from "recharts";
import Link from "next/link";
import clsx from "clsx";
import { useTheme } from "@/app/theme-provider";

const SCORE_COLORS = { hot: "#ef4444", warm: "#f97316", cold: "#3b82f6", unscored: "#94a3b8" };

const SCORE_GRADIENTS: Record<string, string> = {
  hot: "url(#pieHot)",
  warm: "url(#pieWarm)",
  cold: "url(#pieCold)",
  unscored: "url(#pieUnscored)"
};

const BAR_GRADIENTS = [
  "url(#barBlue)", "url(#barPurple)", "url(#barGreen)", "url(#barRed)", "url(#barOrange)"
];

// ── Empty state component ────────────────────────────────────────────────────
const EmptyCard = ({ icon, title, desc, height = "h-48" }: {
  icon?: React.ReactNode; title: string; desc: string; height?: string;
}) => (
  <div className={`${height} flex flex-col items-center justify-center gap-2 text-center px-4`}>
    {icon && <div className="text-gray-300 dark:text-slate-600 mb-1">{icon}</div>}
    <p className="text-sm font-medium text-gray-500 dark:text-slate-400">{title}</p>
    <p className="text-xs text-gray-400 dark:text-slate-500">{desc}</p>
  </div>
);

export default function DashboardPage() {
  const { theme } = useTheme();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [roiLeads, setRoiLeads] = useState<number>(50);
  const [roiRate, setRoiRate] = useState<number>(35);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) setUser(JSON.parse(storedUser));

    leadsApi.stats()
      .then((r) => {
        let finalStats = r.data;
        const savedStats = localStorage.getItem("ai-sdr-stats");
        if (savedStats) {
          try {
            const parsed = JSON.parse(savedStats);
            finalStats = {
              ...r.data,
              by_status: {
                ...r.data.by_status,
                qualified: (r.data.by_status?.qualified || 0) + (parsed.meetingsBooked || 0)
              }
            };
          } catch {}
        }
        setStats(finalStats);
        if (finalStats?.total) {
          setRoiLeads(finalStats.total);
        }
      })
      .catch(() => setStats(null))
      .finally(() => setLoading(false));

    setNotifications(loadNotifications());
  }, []);

  const markAllRead = () => {
    const updated = notifications.map((n) => ({ ...n, read: true }));
    setNotifications(updated);
    saveNotifications(updated);
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const getTrendData = (finalVal: number) => {
    const val = typeof finalVal === "number" && !isNaN(finalVal) ? finalVal : 0;
    return [
      { pv: Math.round(val * 0.2) }, { pv: Math.round(val * 0.4) },
      { pv: Math.round(val * 0.3) }, { pv: Math.round(val * 0.6) },
      { pv: Math.round(val * 0.7) }, { pv: Math.round(val * 0.9) },
      { pv: val }
    ];
  };

  const tooltipProps = {
    contentStyle: {
      backgroundColor: theme === "dark" ? "#1e293b" : "#ffffff",
      borderColor: theme === "dark" ? "rgba(255,255,255,0.1)" : "#e2e8f0",
      borderRadius: "8px", padding: "6px 10px", fontSize: "11px",
      boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
      color: theme === "dark" ? "#f8fafc" : "#0f172a"
    },
    itemStyle: { color: theme === "dark" ? "#f8fafc" : "#0f172a", padding: 0 },
    labelStyle: { color: theme === "dark" ? "#94a3b8" : "#64748b", fontWeight: 600, marginBottom: "2px" }
  };

  const hasLeads = stats && (stats.total ?? 0) > 0;

  const scoreData = hasLeads
    ? Object.entries(stats.by_score || {}).filter(([, v]) => (v as number) > 0).map(([name, value]) => ({ name, value }))
    : [];

  const statusData = hasLeads
    ? Object.entries(stats.by_status || {}).filter(([, v]) => (v as number) > 0).map(([name, value]) => ({ name, value }))
    : [];

  // Real funnel numbers derived from actual stats
  const totalLeads = stats?.total ?? 0;
  const contactedLeads = (stats?.by_status?.contacted ?? 0)
    + (stats?.by_status?.qualified ?? 0)
    + (stats?.by_status?.converted ?? 0);
  const qualifiedLeads = (stats?.by_status?.qualified ?? 0)
    + (stats?.by_status?.converted ?? 0);
  const convertedLeads = stats?.by_status?.converted ?? 0;

  const contactRate = totalLeads > 0 ? Math.round((contactedLeads / totalLeads) * 100) : 0;
  const qualifyRate = totalLeads > 0 ? Math.round((qualifiedLeads / totalLeads) * 100) : 0;
  const convertRate = totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0;

  // Real email-generated count
  const emailsGenerated = stats?.emails_generated ?? 0;
  const emailRate = totalLeads > 0 ? Math.round((emailsGenerated / totalLeads) * 100) : 0;

  const pipelineValue = ((stats?.by_score?.hot ?? 0) * 12000 + (stats?.by_score?.warm ?? 0) * 4500);
  const formattedPipeline = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(pipelineValue);

  const statCards = [
    { label: "Total Leads", value: stats?.total ?? 0, icon: Users, color: "blue", trend: getTrendData(stats?.total ?? 0), stroke: "#3b82f6" },
    { label: "Hot Leads", value: stats?.by_score?.hot ?? 0, icon: Flame, color: "red", trend: getTrendData(stats?.by_score?.hot ?? 0), stroke: "#ef4444" },
    { label: "Pipeline Value", value: formattedPipeline, icon: Coins, color: "green", trend: getTrendData(pipelineValue / 1000), stroke: "#10b981" },
    { label: "Qualified Rate", value: `${stats?.qualified_rate ?? 0}%`, icon: TrendingUp, color: "blue", trend: getTrendData(stats?.qualified_rate ?? 0), stroke: "#3b82f6" },
    { label: "Converted", value: stats?.by_status?.converted ?? 0, icon: Mail, color: "purple", trend: getTrendData(stats?.by_status?.converted ?? 0), stroke: "#8b5cf6" },
  ];

  const colorMap: any = {
    blue: "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400",
    red: "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400",
    green: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400",
    purple: "bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400",
  };

  return (
    <div className="flex min-h-screen text-slate-900 dark:text-slate-100 transition-colors duration-300 relative overflow-hidden">

      <Sidebar />
      <main className="flex-1 lg:ml-64 p-6 lg:p-8 relative z-10">

        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <p className="text-sm text-gray-500 dark:text-slate-400">Good day,</p>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{user?.name ?? "Sales Rep"} 👋</h1>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
              {hasLeads ? "Here's your pipeline overview" : "Add your first lead to get started"}
            </p>
          </div>

          {/* Notification Bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 text-gray-500 dark:text-slate-400 hover:bg-gray-50 relative transition-all shadow-sm flex items-center justify-center"
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
                <div className="max-h-[240px] overflow-y-auto space-y-3 pr-1">
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
        </div>

        {/* ── No leads → full-page empty state ────────────────────────────── */}
        {!loading && !hasLeads ? (
          <div className="card p-12 flex flex-col items-center justify-center text-center gap-5 min-h-[400px]">
            <div className="w-20 h-20 rounded-full bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center">
              <Inbox className="w-9 h-9 text-blue-400 dark:text-blue-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No data yet</h2>
              <p className="text-sm text-gray-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                Your dashboard will populate automatically as you add leads and run AI actions — scores, charts, activity logs, and campaign metrics will all show up here.
              </p>
            </div>
            <div className="flex gap-3">
              <Link href="/leads?action=new" className="btn-primary text-sm flex items-center gap-2">
                <PlusCircle className="w-4 h-4" />
                Add Your First Lead
              </Link>
              <Link href="/leads" className="btn-secondary text-sm flex items-center gap-2">
                <Users className="w-4 h-4" />
                Go to Leads
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
              {statCards.map(({ label, value, icon: Icon, color, trend, stroke }) => (
                <div key={label} className="card p-5 flex flex-col justify-between min-h-[140px]">
                  <div>
                    <div className="flex items-center justify-between">
                      <div className={`inline-flex p-2 rounded-lg ${colorMap[color]}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      {hasLeads && (
                        <div className="w-16 h-8">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={trend}>
                              <Line type="monotone" dataKey="pv" stroke={stroke} strokeWidth={1.5} dot={false} isAnimationActive={false} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                    </div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-4">
                      {loading ? <span className="text-gray-300 dark:text-slate-600">—</span> : value}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{label}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Charts row */}
            <div className="grid lg:grid-cols-2 gap-6 mb-8">
              {/* Score distribution */}
              <div className="card p-6">
                <h2 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-gray-400 dark:text-slate-500" />
                  Lead Score Distribution
                </h2>
                {scoreData.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <defs>
                          <linearGradient id="pieHot" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#f87171" /><stop offset="100%" stopColor="#b91c1c" /></linearGradient>
                          <linearGradient id="pieWarm" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#fb923c" /><stop offset="100%" stopColor="#c2410c" /></linearGradient>
                          <linearGradient id="pieCold" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#60a5fa" /><stop offset="100%" stopColor="#1d4ed8" /></linearGradient>
                          <linearGradient id="pieUnscored" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#cbd5e1" /><stop offset="100%" stopColor="#64748b" /></linearGradient>
                        </defs>
                        <Pie data={scoreData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value" nameKey="name" paddingAngle={3}>
                          {scoreData.map((entry: any) => (
                            <Cell key={entry.name} fill={SCORE_GRADIENTS[entry.name] || "#94a3b8"} style={{ filter: "drop-shadow(0px 4px 6px rgba(0,0,0,0.2))" }} />
                          ))}
                        </Pie>
                        <Tooltip {...tooltipProps} formatter={(v: any, n: any) => [v, n.charAt(0).toUpperCase() + n.slice(1)]} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex gap-4 justify-center mt-2">
                      {Object.entries(SCORE_COLORS).map(([k, v]) => (
                        <div key={k} className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-slate-400">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ background: v }} />
                          {k.charAt(0).toUpperCase() + k.slice(1)}
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <EmptyCard icon={<BarChart2 className="w-10 h-10" />} title="No scored leads yet" desc="Run AI Qualify on your leads to see score distribution." />
                )}
              </div>

              {/* Status breakdown */}
              <div className="card p-6">
                <h2 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-gray-400 dark:text-slate-500" />
                  Pipeline by Status
                </h2>
                {statusData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={statusData} barSize={32}>
                      <defs>
                        <linearGradient id="barBlue" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#2563eb" /><stop offset="100%" stopColor="#1d4ed8" /></linearGradient>
                        <linearGradient id="barPurple" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#7c3aed" /><stop offset="100%" stopColor="#6d28d9" /></linearGradient>
                        <linearGradient id="barGreen" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#059669" /><stop offset="100%" stopColor="#047857" /></linearGradient>
                        <linearGradient id="barRed" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#dc2626" /><stop offset="100%" stopColor="#b91c1c" /></linearGradient>
                        <linearGradient id="barOrange" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#ea580c" /><stop offset="100%" stopColor="#c2410c" /></linearGradient>
                      </defs>
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: "currentColor" }} tickFormatter={(v) => v.charAt(0).toUpperCase() + v.slice(1)} className="text-slate-400 dark:text-slate-500" />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "currentColor" }} className="text-slate-400 dark:text-slate-500" />
                      <Tooltip cursor={false} {...tooltipProps} />
                      <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                        {statusData.map((_: any, i: number) => (
                          <Cell key={i} fill={BAR_GRADIENTS[i % BAR_GRADIENTS.length]} style={{ filter: "drop-shadow(0px 4px 6px rgba(0,0,0,0.15))" }} />
                        ))}
                        <LabelList
                          dataKey="value"
                          position="top"
                          style={{
                            fontSize: "12px",
                            fontWeight: 700,
                            fill: theme === "dark" ? "#94a3b8" : "#475569",
                          }}
                        />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyCard icon={<BarChart2 className="w-10 h-10" />} title="No status data yet" desc="Update lead statuses to see your pipeline breakdown." />
                )}
              </div>
            </div>

            {/* Funnel + Activity Row */}
            <div className="grid lg:grid-cols-2 gap-6 mb-8">
              {/* Pipeline Funnel — real data only */}
              <div className="card p-6">
                <h2 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-purple-500" />
                  Pipeline Funnel Conversion
                </h2>
                {totalLeads > 0 ? (() => {
                  const funnelData = [
                    { stage: "Total", leads: totalLeads, rate: 100, fill: "url(#funnelBlue)" },
                    { stage: "Contacted", leads: contactedLeads, rate: contactRate, fill: "url(#funnelIndigo)" },
                    { stage: "Qualified", leads: qualifiedLeads, rate: qualifyRate, fill: "url(#funnelPurple)" },
                    { stage: "Converted", leads: convertedLeads, rate: convertRate, fill: "url(#funnelGreen)" },
                  ];
                  return (
                    <ResponsiveContainer width="100%" height={190}>
                      <BarChart data={funnelData} barSize={40} margin={{ top: 24, right: 8, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="funnelBlue" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#60a5fa" /><stop offset="100%" stopColor="#2563eb" /></linearGradient>
                          <linearGradient id="funnelIndigo" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#818cf8" /><stop offset="100%" stopColor="#4f46e5" /></linearGradient>
                          <linearGradient id="funnelPurple" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#c084fc" /><stop offset="100%" stopColor="#7c3aed" /></linearGradient>
                          <linearGradient id="funnelGreen" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#34d399" /><stop offset="100%" stopColor="#059669" /></linearGradient>
                        </defs>
                        <XAxis dataKey="stage" tick={{ fontSize: 11, fill: theme === "dark" ? "#94a3b8" : "#64748b" }} axisLine={false} tickLine={false} />
                        <YAxis hide />
                        <Tooltip
                          cursor={false}
                          {...tooltipProps}
                          formatter={(v: any, _: any, props: any) => [`${props.payload.leads} leads (${props.payload.rate}%)`, props.payload.stage]}
                        />
                        <Bar dataKey="leads" radius={[8, 8, 0, 0]}>
                          {funnelData.map((entry, i) => (
                            <Cell key={i} fill={entry.fill} style={{ filter: "drop-shadow(0px 4px 8px rgba(0,0,0,0.18))" }} />
                          ))}
                          <LabelList
                            content={({ x, y, width, value, index }: any) => {
                              const item = funnelData[index];
                              return (
                                <g>
                                  <text x={Number(x) + Number(width) / 2} y={Number(y) - 14} textAnchor="middle" fontSize={13} fontWeight={700} fill={theme === "dark" ? "#f8fafc" : "#1e293b"}>
                                    {item.leads}
                                  </text>
                                  <text x={Number(x) + Number(width) / 2} y={Number(y) - 2} textAnchor="middle" fontSize={10} fontWeight={500} fill={theme === "dark" ? "#94a3b8" : "#64748b"}>
                                    {item.rate}%
                                  </text>
                                </g>
                              );
                            }}
                          />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  );
                })() : (
                  <EmptyCard icon={<TrendingUp className="w-10 h-10" />} title="No funnel data yet" desc="Add and update leads to track your conversion funnel." height="h-40" />
                )}
              </div>

              {/* AI Activity Log — only real notifications */}
              <div className="card p-6">
                <h2 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-blue-500" />
                  AI SDR Activity Log
                </h2>
                {notifications.length > 0 ? (
                  <div className="space-y-3">
                    {notifications.slice(0, 5).map((n: any, i: number) => {
                      const colors = ["bg-green-500", "bg-blue-500", "bg-purple-500", "bg-amber-500", "bg-rose-500"];
                      return (
                        <div key={n.id} className={`flex items-start gap-3 text-sm ${i < notifications.slice(0, 5).length - 1 ? "border-b border-gray-100 dark:border-slate-800/60 pb-3" : ""}`}>
                          <div className={`w-2 h-2 rounded-full ${colors[i % colors.length]} mt-1.5 shrink-0`} />
                          <div>
                            <p className="text-gray-900 dark:text-slate-100 font-medium">{n.title}</p>
                            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{n.time} • {n.desc}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <EmptyCard icon={<Zap className="w-10 h-10" />} title="No AI activity yet" desc="AI actions like email generation and lead qualification will appear here." height="h-40" />
                )}
              </div>
            </div>

            {/* Outreach & ROI Metrics */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
              {/* Campaign Outreach Performance */}
              <div className="card p-6">
                <h2 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-purple-500" />
                  Campaign Outreach Performance
                </h2>
                {emailsGenerated > 0 ? (
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-500 dark:text-slate-400">Emails Generated</span>
                        <span className="font-semibold text-gray-900 dark:text-white">{emailsGenerated} / {totalLeads} leads ({emailRate}%)</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-slate-800 rounded-full h-2">
                        <div className="bg-indigo-600 dark:bg-indigo-500 h-2 rounded-full transition-all" style={{ width: `${emailRate}%` }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-500 dark:text-slate-400">Qualified</span>
                        <span className="font-semibold text-gray-900 dark:text-white">{qualifiedLeads} leads ({qualifyRate}%)</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-slate-800 rounded-full h-2">
                        <div className="bg-emerald-600 dark:bg-emerald-500 h-2 rounded-full transition-all" style={{ width: `${qualifyRate}%` }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-500 dark:text-slate-400">Converted</span>
                        <span className="font-semibold text-gray-900 dark:text-white">{convertedLeads} leads ({convertRate}%)</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-slate-800 rounded-full h-2">
                        <div className="bg-purple-600 dark:bg-purple-500 h-2 rounded-full transition-all" style={{ width: `${convertRate}%` }} />
                      </div>
                    </div>
                  </div>
                ) : (
                  <EmptyCard icon={<Mail className="w-10 h-10" />} title="No outreach yet" desc="Generate emails for your leads to track campaign performance here." height="h-40" />
                )}
              </div>

              {/* AI Sales ROI Calculator */}
              <div className="card p-6 flex flex-col justify-between">
                <div>
                  <h2 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-500" />
                    AI Agent ROI & Efficiency Calculator
                  </h2>
                  <p className="text-[11px] text-gray-405 dark:text-slate-500 mb-5 leading-relaxed">
                    Compare manual human prospecting with the automated AI SDR framework costs.
                  </p>

                  <div className="space-y-4">
                    {/* Slider 1: Lead Volume */}
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-505 dark:text-slate-400">Total Leads (Campaign Size)</span>
                        <span className="font-bold text-gray-900 dark:text-white">{roiLeads} prospects</span>
                      </div>
                      <input
                        type="range"
                        min={10}
                        max={500}
                        step={5}
                        value={roiLeads}
                        onChange={(e) => setRoiLeads(Number(e.target.value))}
                        className="w-full h-1.5 bg-gray-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      />
                    </div>

                    {/* Slider 2: Human SDR wage */}
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-505 dark:text-slate-400">Human SDR Equiv. Wage</span>
                        <span className="font-bold text-gray-900 dark:text-white">${roiRate}/hr</span>
                      </div>
                      <input
                        type="range"
                        min={15}
                        max={100}
                        step={1}
                        value={roiRate}
                        onChange={(e) => setRoiRate(Number(e.target.value))}
                        className="w-full h-1.5 bg-gray-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      />
                    </div>
                  </div>

                  {/* Calculations breakdown */}
                  <div className="grid grid-cols-2 gap-4 mt-6 pt-5 border-t border-gray-100 dark:border-slate-800/80">
                    <div className="bg-slate-50/50 dark:bg-slate-900/30 p-3 rounded-xl border border-gray-100/50 dark:border-slate-850">
                      <p className="text-[10px] text-gray-400 dark:text-slate-500 uppercase tracking-wider font-semibold">Hours Saved</p>
                      <p className="text-xl font-bold text-blue-600 dark:text-blue-400 mt-1 font-mono">
                        {(roiLeads * 4.5).toFixed(0)} hrs
                      </p>
                      <p className="text-[9px] text-gray-400 mt-0.5">4.5 hrs saved per lead</p>
                    </div>

                    <div className="bg-slate-50/50 dark:bg-slate-900/30 p-3 rounded-xl border border-gray-100/50 dark:border-slate-850">
                      <p className="text-[10px] text-gray-400 dark:text-slate-500 uppercase tracking-wider font-semibold">B2B Labor Savings</p>
                      <p className="text-xl font-bold text-emerald-500 mt-1 font-mono">
                        ${(roiLeads * 4.5 * roiRate - roiLeads * 0.15).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </p>
                      <p className="text-[9px] text-gray-400 mt-0.5 font-medium">Net cash saved (minus AI costs)</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
