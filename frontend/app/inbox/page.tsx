"use client";
import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import {
  MessageSquare, Search, Trash2, Check, ArrowRight, Sparkles, Loader2,
  Calendar, Inbox, BadgeCheck, AlertCircle, Ban, RefreshCw
} from "lucide-react";
import toast from "react-hot-toast";
import clsx from "clsx";

interface ReplyItem {
  id: number;
  name: string;
  email: string;
  company: string;
  job_title: string;
  sentiment: "Positive" | "Negative" | "Neutral";
  message: string;
  subject: string;
  time: string;
  read: boolean;
  suggestedReply: string;
}

const INITIAL_REPLIES: ReplyItem[] = [
  {
    id: 1,
    name: "Sarah Smith",
    email: "sarah.smith@zoom.us",
    company: "Zoom",
    job_title: "CEO",
    sentiment: "Positive",
    subject: "Re: Sales pipeline automation",
    message: "Hi Alex,\n\nThanks for reaching out. The pitch looks interesting. We have some bottlenecks with manual outbound qualified leads right now. Let's connect next Tuesday for a brief chat. Can you send over a booking link?\n\nBest,\nSarah",
    time: "10:15 AM",
    read: false,
    suggestedReply: "Subject: Re: Sales pipeline automation\n\nHi Sarah,\n\nGlad to hear you are open to connecting! Here is my calendar link to choose a time that works best for you next Tuesday: https://calendly.com/techcorp/15min\n\nLooking forward to speaking with you!\n\nBest,\nAlex Chen\nSDR, TechCorp"
  },
  {
    id: 2,
    name: "Dave Miller",
    email: "dave.miller@stripe.com",
    company: "Stripe",
    job_title: "Founder",
    sentiment: "Negative",
    subject: "Re: Solving outbound bottlenecks",
    message: "Alex - please unsubscribe me from your emails. We are not interested in scaling outreach platforms right now. We handle this internally.\n\nDave",
    time: "9:30 AM",
    read: false,
    suggestedReply: "Subject: Re: Solving outbound bottlenecks\n\nHi Dave,\n\nUnderstood completely. I have marked your email as unsubscribed and you will not receive any further correspondence. Wishing Stripe the best of luck with your scaling goals!\n\nRegards,\nAlex Chen\nSDR, TechCorp"
  },
  {
    id: 3,
    name: "Jessica Vance",
    email: "jessica.vance@figma.com",
    company: "Figma",
    job_title: "Growth Lead",
    sentiment: "Positive",
    subject: "Re: Scaling Figma outreach",
    message: "Hi Alex,\n\nWe are currently evaluating automation tools for our outbound operations. Your timing is pretty good. Do you have a 2-minute video overview or a brief demo pitch deck you can share before we book a slot?\n\nThanks,\nJessica",
    time: "Yesterday",
    read: true,
    suggestedReply: "Subject: Re: Scaling Figma outreach\n\nHi Jessica,\n\nAbsolutely! Here is a link to a quick 2-minute video overview demonstrating how we automate outreach and CRM sync workflows: https://techcorp.io/demo-figma\n\nLet me know if you have any questions after reviewing, and I'd be happy to schedule a discovery call.\n\nBest,\nAlex Chen\nSDR, TechCorp"
  },
  {
    id: 4,
    name: "Chris Evans",
    email: "c.evans@netflix.com",
    company: "Netflix",
    job_title: "Director of Operations",
    sentiment: "Neutral",
    subject: "Automatic Reply: Solving pipelines",
    message: "Hello,\n\nThank you for your email. I am currently out of the office on annual leave with limited access to email. I will return on Monday. If your request is urgent, please contact support@netflix.com.\n\nBest,\nChris",
    time: "2 days ago",
    read: true,
    suggestedReply: "Subject: Re: Automatic Reply: Solving pipelines\n\nHi Chris,\n\nHope you have a restful leave! I will reach back out next Tuesday once you have settled back into the office.\n\nBest,\nAlex Chen\nSDR, TechCorp"
  }
];

export default function InboxPage() {
  const [replies, setReplies] = useState<ReplyItem[]>(INITIAL_REPLIES);
  const [selectedId, setSelectedId] = useState<number>(1);
  const [search, setSearch] = useState("");
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const [booking, setBooking] = useState(false);

  const selectedItem = replies.find((r) => r.id === selectedId) || replies[0];

  useEffect(() => {
    // Mark as read when selected
    if (selectedItem && !selectedItem.read) {
      setReplies((prev) =>
        prev.map((r) => (r.id === selectedItem.id ? { ...r, read: true } : r))
      );
    }
  }, [selectedId]);

  const filteredReplies = replies.filter(
    (r) =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.company.toLowerCase().includes(search.toLowerCase()) ||
      r.message.toLowerCase().includes(search.toLowerCase())
  );

  const handleSendResponse = async () => {
    setSending(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setSending(false);
    toast.success("Suggested reply sent successfully!");
    // Remove or archive item
    setReplies((prev) => prev.filter((r) => r.id !== selectedId));
    if (replies.length > 1) {
      const remaining = replies.filter((r) => r.id !== selectedId);
      setSelectedId(remaining[0].id);
    }
  };

  const handleBookMeeting = async () => {
    setBooking(true);
    await new Promise((resolve) => setTimeout(resolve, 1200));
    setBooking(false);
    toast.success("Meeting booked & CRM calendar invite dispatched!");
    
    // Add meeting to stats
    const savedStats = localStorage.getItem("ai-sdr-stats");
    if (savedStats) {
      try {
        const stats = JSON.parse(savedStats);
        stats.meetingsBooked = (stats.meetingsBooked || 0) + 1;
        stats.leadsQualified = (stats.leadsQualified || 0) + 1;
        localStorage.setItem("ai-sdr-stats", JSON.stringify(stats));
      } catch {}
    }
    
    // Log meeting booked notes in lead history simulator
    toast.success("Dashboard metrics updated (+1 Meeting Booked)");
    setReplies((prev) => prev.filter((r) => r.id !== selectedId));
    if (replies.length > 1) {
      const remaining = replies.filter((r) => r.id !== selectedId);
      setSelectedId(remaining[0].id);
    }
  };

  const handleDelete = () => {
    setReplies((prev) => prev.filter((r) => r.id !== selectedId));
    toast.success("Thread archived");
    if (replies.length > 1) {
      const remaining = replies.filter((r) => r.id !== selectedId);
      setSelectedId(remaining[0]?.id || 1);
    }
  };

  const sentimentColor = {
    Positive: "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20",
    Negative: "bg-rose-500/10 text-rose-500 border border-rose-500/20",
    Neutral: "bg-slate-500/10 text-slate-500 border border-slate-500/20"
  }[selectedItem?.sentiment || "Neutral"];

  const sentimentIcon = {
    Positive: BadgeCheck,
    Negative: Ban,
    Neutral: AlertCircle
  }[selectedItem?.sentiment || "Neutral"];

  const SentimentIcon = sentimentIcon;

  return (
    <div className="flex min-h-screen text-slate-900 dark:text-slate-100 transition-colors duration-300 relative overflow-hidden">
      <Sidebar />
      <main className="flex-1 lg:ml-64 px-6 pt-8 pb-4 lg:px-10 lg:pt-10 lg:pb-6 relative z-10">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">AI Inbox</h1>
              <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">
                Simulated response mailbox. Review prospect replies and handle objections dynamically.
              </p>
            </div>
          </div>
        </div>

        {replies.length === 0 ? (
          <div className="card p-12 text-center space-y-4 max-w-2xl mx-auto mt-10">
            <div className="inline-flex p-4 rounded-full bg-blue-50 dark:bg-blue-950/30 text-blue-500">
              <Inbox className="w-8 h-8 animate-bounce" />
            </div>
            <h2 className="font-semibold text-lg">Inbox Clean & Clear!</h2>
            <p className="text-sm text-gray-550 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
              No replies to review right now. All outreach campaign items have been processed or archived.
            </p>
            <button
              onClick={() => setReplies(INITIAL_REPLIES)}
              className="btn-secondary text-xs px-4 py-2 mx-auto flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reset Simulated Inbox
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 h-[72vh] items-stretch">
            
            {/* List Column */}
            <div className="xl:col-span-4 card flex flex-col overflow-hidden bg-white/60 dark:bg-slate-900/60 backdrop-blur-md">
              <div className="p-4 border-b border-gray-100 dark:border-slate-800/80 flex items-center gap-2 shrink-0">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search inbox..."
                    className="input-field pl-9 text-xs py-2 bg-slate-50/50"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto divide-y divide-gray-100 dark:divide-slate-850 scrollbar-thin">
                {filteredReplies.map((item) => {
                  const itemColor = {
                    Positive: "border-emerald-500",
                    Negative: "border-rose-500",
                    Neutral: "border-slate-400"
                  }[item.sentiment];

                  return (
                    <button
                      key={item.id}
                      onClick={() => setSelectedId(item.id)}
                      className={clsx(
                        "w-full text-left p-4 hover:bg-slate-50 dark:hover:bg-slate-950/20 transition-all border-l-2 flex flex-col gap-1.5 relative",
                        item.id === selectedId
                          ? "bg-slate-100/60 dark:bg-slate-950/30 border-blue-500"
                          : "border-transparent"
                      )}
                    >
                      <div className="flex justify-between items-start">
                        <span className={clsx("font-semibold text-xs text-gray-900 dark:text-white", !item.read && "font-bold")}>
                          {item.name}
                        </span>
                        <span className="text-[10px] text-gray-400 font-mono">{item.time}</span>
                      </div>
                      <div className="text-[11px] text-gray-500 dark:text-slate-400 truncate font-medium">
                        {item.company} &bull; {item.job_title}
                      </div>
                      <div className="text-[11px] text-gray-600 dark:text-slate-350 line-clamp-2 leading-relaxed">
                        {item.message}
                      </div>
                      <div className="flex justify-between items-center mt-1">
                        <span className={clsx("text-[9px] font-bold px-2 py-0.5 rounded border capitalize", itemColor)}>
                          {item.sentiment}
                        </span>
                        {!item.read && (
                          <span className="w-2 h-2 rounded-full bg-blue-500" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Detail Column */}
            <div className="xl:col-span-8 card flex flex-col overflow-hidden bg-white/60 dark:bg-slate-900/60 backdrop-blur-md">
              {selectedItem && (
                <>
                  {/* Action Toolbar */}
                  <div className="p-4 border-b border-gray-100 dark:border-slate-800/80 flex items-center justify-between shrink-0 bg-slate-50/30 dark:bg-slate-950/10">
                    <div className="flex items-center gap-3">
                      <span className={clsx("inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full border shadow-sm capitalize", sentimentColor)}>
                        <SentimentIcon className="w-3.5 h-3.5" />
                        {selectedItem.sentiment} Sentiment
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleDelete}
                        className="p-2 rounded-lg bg-white dark:bg-slate-900 text-gray-500 border border-gray-200 dark:border-slate-800 hover:text-red-500 transition-colors"
                        title="Archive Thread"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Mail Message View */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
                    <div className="border-b border-gray-100 dark:border-slate-850 pb-4">
                      <h2 className="font-semibold text-gray-900 dark:text-white text-base mb-1">
                        {selectedItem.subject}
                      </h2>
                      <div className="flex justify-between text-xs text-gray-500 dark:text-slate-450">
                        <span>
                          <strong>{selectedItem.name}</strong> &lt;{selectedItem.email}&gt;
                        </span>
                        <span>{selectedItem.company} &bull; {selectedItem.job_title}</span>
                      </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-950/20 border border-gray-100 dark:border-slate-850 rounded-xl p-5 leading-relaxed text-sm whitespace-pre-wrap text-gray-700 dark:text-slate-300">
                      {selectedItem.message}
                    </div>

                    {/* AI Suggested Reply */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-blue-500" />
                        <h3 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                          AI Suggested Reply ({selectedItem.sentiment === "Positive" ? "Close Deal" : "Acknowledge"})
                        </h3>
                      </div>
                      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 relative hover:border-slate-700 transition-all">
                        <pre className="text-xs text-slate-300 whitespace-pre-wrap font-mono leading-relaxed">
                          {selectedItem.suggestedReply}
                        </pre>
                      </div>

                      {/* Suggested Reply Actions */}
                      <div className="flex gap-3 justify-end pt-2">
                        {selectedItem.sentiment === "Positive" && (
                          <button
                            onClick={handleBookMeeting}
                            disabled={booking}
                            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-md transition-all active:scale-95 disabled:opacity-50"
                          >
                            {booking ? (
                              <><Loader2 className="w-3.5 h-3.5 animate-spin" />Booking...</>
                            ) : (
                              <><Calendar className="w-3.5 h-3.5" /> Book 15-Min Meeting 📅</>
                            )}
                          </button>
                        )}
                        <button
                          onClick={handleSendResponse}
                          disabled={sending}
                          className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-md transition-all active:scale-95 disabled:opacity-50"
                        >
                          {sending ? (
                            <><Loader2 className="w-3.5 h-3.5 animate-spin" />Sending...</>
                          ) : (
                            <><Check className="w-3.5 h-3.5" /> Accept & Send Reply</>
                          )}
                        </button>
                      </div>
                    </div>

                  </div>
                </>
              )}
            </div>

          </div>
        )}

      </main>
    </div>
  );
}
