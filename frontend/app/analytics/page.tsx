"use client";
import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import {
  BarChart2, TrendingUp, Mail, Users, ArrowUpRight, ArrowDownRight,
  Activity, ShieldCheck, MailWarning, Award, Sparkles, RefreshCw
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend
} from "recharts";
import { useTheme } from "@/app/theme-provider";

const OUTBOUND_TREND_DATA = [
  { day: "Mon", Emails: 120, LinkedIn: 80 },
  { day: "Tue", Emails: 150, LinkedIn: 95 },
  { day: "Wed", Emails: 180, LinkedIn: 110 },
  { day: "Thu", Emails: 220, LinkedIn: 135 },
  { day: "Fri", Emails: 190, LinkedIn: 120 },
  { day: "Sat", Emails: 60, LinkedIn: 30 },
  { day: "Sun", Emails: 45, LinkedIn: 20 },
];

const SENTIMENT_BREAKDOWN = [
  { name: "Positive (Interested)", value: 45, color: "#10b981" },
  { name: "Neutral (OOO/Forward)", value: 35, color: "#94a3b8" },
  { name: "Negative (Refusals)", value: 20, color: "#f43f5e" },
];

const LEADERBOARD_DATA = [
  { name: "Alex (Enterprise Outbound)", Leads: 180, Meetings: 15, Rate: 8.3 },
  { name: "Marcus (SMB Inbound)", Leads: 250, Meetings: 22, Rate: 8.8 },
  { name: "Chloe (DevTech Outreach)", Leads: 120, Meetings: 11, Rate: 9.1 },
  { name: "SDR-Alpha (AI Agent)", Leads: 320, Meetings: 29, Rate: 9.0 },
];

export default function AnalyticsPage() {
  const { theme } = useTheme();
  const [stats, setStats] = useState({
    totalOutbound: 1980,
    openRate: 68.4,
    meetingsBooked: 29,
    conversionRate: 9.2,
  });

  const tooltipStyle = {
    contentStyle: {
      backgroundColor: theme === "dark" ? "#1e293b" : "#ffffff",
      borderColor: theme === "dark" ? "rgba(255,255,255,0.1)" : "#e2e8f0",
      borderRadius: "8px",
      color: theme === "dark" ? "#f8fafc" : "#0f172a",
      fontSize: "11px",
    },
    itemStyle: { color: theme === "dark" ? "#f8fafc" : "#0f172a" },
    labelStyle: { color: theme === "dark" ? "#94a3b8" : "#64748b" }
  };

  return (
    <div className="flex min-h-screen text-slate-900 dark:text-slate-100 transition-colors duration-300 relative overflow-hidden">
      <Sidebar />
      <main className="flex-1 lg:ml-64 px-6 pt-8 pb-4 lg:px-10 lg:pt-10 lg:pb-6 relative z-10">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <BarChart2 className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Outreach Analytics</h1>
              <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">
                Analyze pipeline statistics, domain reputation, and AI agent conversion metrics.
              </p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="card p-5 flex flex-col justify-between min-h-[120px]">
            <div>
              <span className="text-[11px] font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Total Outbound touches</span>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1.5 font-mono">{stats.totalOutbound}</h3>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-emerald-500 font-semibold mt-2">
              <ArrowUpRight className="w-3.5 h-3.5" /> +12.4% vs last week
            </div>
          </div>

          <div className="card p-5 flex flex-col justify-between min-h-[120px]">
            <div>
              <span className="text-[11px] font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Email Open Rate</span>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1.5 font-mono">{stats.openRate}%</h3>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-emerald-500 font-semibold mt-2">
              <ArrowUpRight className="w-3.5 h-3.5" /> +3.2% vs industry avg
            </div>
          </div>

          <div className="card p-5 flex flex-col justify-between min-h-[120px]">
            <div>
              <span className="text-[11px] font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Meetings Booked</span>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1.5 font-mono">{stats.meetingsBooked}</h3>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-emerald-500 font-semibold mt-2">
              <ArrowUpRight className="w-3.5 h-3.5" /> +8 meetings this month
            </div>
          </div>

          <div className="card p-5 flex flex-col justify-between min-h-[120px]">
            <div>
              <span className="text-[11px] font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Conversion Ratio</span>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1.5 font-mono">{stats.conversionRate}%</h3>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-emerald-500 font-semibold mt-2">
              <ArrowUpRight className="w-3.5 h-3.5" /> Outperforming human benchmark
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 mb-8">
          
          {/* Trend Chart */}
          <div className="xl:col-span-8 card p-6 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-6 text-sm flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-blue-500" />
              Multi-Channel Outbound Volume Trend
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={OUTBOUND_TREND_DATA}>
                  <defs>
                    <linearGradient id="colorEmails" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorLinkedIn" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme === "dark" ? "rgba(255,255,255,0.05)" : "#f1f5f9"} />
                  <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} />
                  <Tooltip {...tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Area type="monotone" dataKey="Emails" stroke="#3b82f6" fillOpacity={1} fill="url(#colorEmails)" strokeWidth={2} />
                  <Area type="monotone" dataKey="LinkedIn" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorLinkedIn)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Sentiment Donut */}
          <div className="xl:col-span-4 card p-6 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md flex flex-col justify-between">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4 text-sm flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-500" />
              Reply Sentiment Analysis
            </h3>
            <div className="h-44 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={SENTIMENT_BREAKDOWN}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {SENTIMENT_BREAKDOWN.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip {...tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-2">
                <span className="text-xl font-bold font-mono">45%</span>
                <span className="text-[9px] text-gray-400 dark:text-slate-500 uppercase tracking-wider font-semibold">Positive</span>
              </div>
            </div>

            <div className="space-y-2 mt-4 pt-4 border-t border-gray-100 dark:border-slate-800/80">
              {SENTIMENT_BREAKDOWN.map((entry) => (
                <div key={entry.name} className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                    <span className="text-gray-500 dark:text-slate-400 font-medium">{entry.name}</span>
                  </div>
                  <span className="font-bold text-gray-900 dark:text-white font-mono">{entry.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Deliverability & Leaderboard Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
          
          {/* Deliverability Health Card */}
          <div className="card p-6 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-6 text-sm flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              Inbox & Domain Deliverability Health
            </h3>
            
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="p-4 bg-slate-50/50 dark:bg-slate-950/20 border border-gray-100 dark:border-slate-850 rounded-xl text-center">
                <p className="text-[10px] text-gray-400 dark:text-slate-500 uppercase tracking-wider font-semibold">Bounce Rate</p>
                <p className="text-lg font-bold text-emerald-500 mt-1 font-mono">0.8%</p>
                <p className="text-[8px] text-gray-400 mt-0.5">Limit: &lt; 2.0%</p>
              </div>

              <div className="p-4 bg-slate-50/50 dark:bg-slate-950/20 border border-gray-100 dark:border-slate-850 rounded-xl text-center">
                <p className="text-[10px] text-gray-400 dark:text-slate-500 uppercase tracking-wider font-semibold">Spam Rate</p>
                <p className="text-lg font-bold text-emerald-500 mt-1 font-mono">0.02%</p>
                <p className="text-[8px] text-gray-400 mt-0.5">Limit: &lt; 0.10%</p>
              </div>

              <div className="p-4 bg-slate-50/50 dark:bg-slate-950/20 border border-gray-100 dark:border-slate-850 rounded-xl text-center">
                <p className="text-[10px] text-gray-400 dark:text-slate-500 uppercase tracking-wider font-semibold">Reputation</p>
                <p className="text-lg font-bold text-blue-500 mt-1 font-mono">99 / 100</p>
                <p className="text-[8px] text-gray-400 mt-0.5">Excellent standing</p>
              </div>
            </div>

            <div className="space-y-3.5">
              <div className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span className="text-gray-500 dark:text-slate-400">SPF, DKIM, DMARC DNS Records</span>
                </div>
                <span className="text-emerald-500 font-bold uppercase tracking-wider text-[9px] bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">Verified</span>
              </div>

              <div className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span className="text-gray-500 dark:text-slate-400">Domain Blacklist Status</span>
                </div>
                <span className="text-emerald-500 font-bold uppercase tracking-wider text-[9px] bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">0 Lists</span>
              </div>
            </div>
          </div>

          {/* Leaderboard/Reps performance */}
          <div className="card p-6 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-6 text-sm flex items-center gap-1.5">
              <Award className="w-4 h-4 text-purple-500" />
              SDR Team Performance Leaderboard
            </h3>
            
            <div className="space-y-4">
              {LEADERBOARD_DATA.map((rep, idx) => {
                const colors = ["bg-indigo-500", "bg-purple-500", "bg-pink-500", "bg-blue-500"];
                return (
                  <div key={rep.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold flex items-center justify-center text-slate-500">
                        #{idx + 1}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-900 dark:text-white">{rep.name}</p>
                        <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-0.5">
                          {rep.Leads} leads contacted &bull; {rep.Rate}% booking rate
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-gray-900 dark:text-white font-mono bg-slate-50 dark:bg-slate-950/20 px-3 py-1 rounded-lg border border-gray-100 dark:border-slate-850">
                      {rep.Meetings} Meetings
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </main>
    </div>
  );
}
