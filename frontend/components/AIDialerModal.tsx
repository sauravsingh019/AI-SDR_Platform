"use client";
import { useState, useEffect, useRef } from "react";
import { Phone, PhoneOff, User, Volume2, Mic, CheckCircle, Clock, Sparkles } from "lucide-react";
import { leadsApi } from "@/lib/api";
import toast from "react-hot-toast";
import clsx from "clsx";

interface Props {
  lead: any;
  onClose: () => void;
  onUpdate: (updatedLead: any) => void;
}

interface Message {
  sender: "sdr" | "prospect";
  text: string;
  timestamp: string;
}

export default function AIDialerModal({ lead, onClose, onUpdate }: Props) {
  // Call stages: "dialing" | "connected" | "completed" | "ended"
  const [callStage, setCallStage] = useState<"dialing" | "connected" | "completed" | "ended">("dialing");
  const [seconds, setSeconds] = useState(0);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [currentSpeaker, setCurrentSpeaker] = useState<"sdr" | "prospect" | null>(null);
  const [updating, setUpdating] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Retrieve custom SDR settings from localStorage
  const [sdrSettings, setSdrSettings] = useState({
    sdr_name: "Alex Chen",
    company_name: "TechCorp",
    company_pitch: "Our intelligent agent framework automates outbound pipelines, saving SDRs up to 20 hours per week."
  });

  useEffect(() => {
    const saved = localStorage.getItem("ai-sdr-settings");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSdrSettings({
          sdr_name: parsed.sdr_name || "Alex Chen",
          company_name: parsed.company_name || "TechCorp",
          company_pitch: parsed.company_pitch || "Our intelligent agent framework automates outbound pipelines, saving SDRs up to 20 hours per week."
        });
      } catch (e) {}
    }
  }, []);

  // Format call duration timer
  useEffect(() => {
    let interval: any;
    if (callStage === "connected") {
      interval = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [callStage]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  // Scroll to bottom of message list
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Dialogue script flow
  const dialogueLines = [
    {
      sender: "sdr" as const,
      text: `Hi ${lead.name}, this is ${sdrSettings.sdr_name} from ${sdrSettings.company_name}. I noticed you lead operations as ${lead.job_title || "a leader"} at ${lead.company || "your company"}. How are you doing today?`
    },
    {
      sender: "prospect" as const,
      text: "Hi, I'm doing alright. I'm actually in the middle of a project review meeting right now. What is this about?"
    },
    {
      sender: "sdr" as const,
      text: `I completely respect your time, ${lead.name}. I'll be brief. Many companies in the ${lead.industry || "B2B"} sector struggle with manual outbound pipelines and pain points like: '${lead.pain_points || "growth operations"}'. We help teams bypass this bottleneck. ${sdrSettings.company_pitch}`
    },
    {
      sender: "prospect" as const,
      text: "To be honest, we don't have the budget or bandwidth to evaluate new software tools at the moment."
    },
    {
      sender: "sdr" as const,
      text: "That makes total sense, and that's precisely why I reached out. Our autonomous framework runs in the background to handle the heavy lifting, allowing your current team to focus solely on high-intent calls. Most clients see positive ROI and pipeline expansion within their first month."
    },
    {
      sender: "prospect" as const,
      text: "Interesting. Can you just send me an email with some case studies and pricing details?"
    },
    {
      sender: "sdr" as const,
      text: `Absolutely, I will send a full summary to ${lead.email}. But to make sure I include only the most relevant materials for ${lead.company || "your team"}, would you be open to a quick 10-minute discovery sync this Thursday at 2 PM?`
    },
    {
      sender: "prospect" as const,
      text: "Actually, Thursday at 2 PM works. Shoot me a calendar invite and let's see what you've got."
    },
    {
      sender: "sdr" as const,
      text: `Perfect! I'm sending the calendar invite to ${lead.email} right now. Thank you, ${lead.name}, looking forward to speaking with you on Thursday!`
    }
  ];

  // Automate call stages and transcript flow
  useEffect(() => {
    if (callStage === "dialing") {
      const connectTimer = setTimeout(() => {
        setCallStage("connected");
      }, 2500);
      return () => clearTimeout(connectTimer);
    }

    if (callStage === "connected") {
      let currentIdx = 0;

      const playNextLine = () => {
        if (currentIdx >= dialogueLines.length) {
          setTimeout(() => {
            setCallStage("completed");
          }, 1500);
          return;
        }

        const line = dialogueLines[currentIdx];
        setIsTyping(true);
        setCurrentSpeaker(line.sender);

        // Simulated speech delay
        const delay = Math.max(1500, line.text.length * 15);

        const speechTimer = setTimeout(() => {
          setIsTyping(false);
          setCurrentSpeaker(null);
          setMessages((prev) => [
            ...prev,
            {
              sender: line.sender,
              text: line.text,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
            }
          ]);
          currentIdx++;
          // Wait briefly before starting next reply
          setTimeout(playNextLine, 1000);
        }, delay);

        return speechTimer;
      };

      const initialDelay = setTimeout(playNextLine, 1000);
      return () => {
        clearTimeout(initialDelay);
      };
    }
  }, [callStage]);

  const handleHangup = () => {
    setCallStage("ended");
  };

  const handleUpdateLead = async () => {
    setUpdating(true);
    try {
      const updatedNotes = (lead.notes ? lead.notes + "\n" : "") + 
        `[Simulated Call Log - ${new Date().toLocaleDateString()}] Phone call connected. Objections deflected. Meeting booked successfully for Thursday at 2 PM.`;
      
      const res = await leadsApi.update(lead.id, {
        status: "qualified",
        notes: updatedNotes
      });
      
      toast.success("Lead status updated to Qualified!");
      onUpdate(res.data);
      onClose();
    } catch (e) {
      toast.error("Failed to update lead status");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/75 z-55 flex items-center justify-center p-4 backdrop-blur-md">
      <div className={clsx(
        "bg-slate-900 border border-slate-800 text-slate-100 rounded-2xl w-full max-w-xl shadow-2xl flex flex-col overflow-hidden max-h-[85vh] transition-all duration-300",
        callStage === "dialing" ? "h-[320px]" : "h-[650px]"
      )}>
        
        {/* Call Header */}
        <div className="bg-slate-950 p-6 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className={clsx(
              "w-10 h-10 rounded-full flex items-center justify-center text-white",
              callStage === "dialing" && "bg-blue-600 animate-pulse",
              callStage === "connected" && "bg-emerald-600",
              callStage === "completed" && "bg-indigo-600",
              callStage === "ended" && "bg-rose-600"
            )}>
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-white leading-tight">
                {lead.name}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {lead.company || "Prospect"} • {lead.phone || "+1 (555) 019-2834"}
              </p>
            </div>
          </div>
          
          <div className="text-right">
            {callStage === "dialing" && (
              <span className="text-xs font-medium text-blue-400 uppercase tracking-widest animate-pulse">Dialing...</span>
            )}
            {callStage === "connected" && (
              <div className="flex items-center gap-1.5 text-emerald-400">
                <Clock className="w-3.5 h-3.5" />
                <span className="text-xs font-mono font-medium">{formatTime(seconds)}</span>
              </div>
            )}
            {callStage === "completed" && (
              <span className="text-xs font-medium text-indigo-400 uppercase tracking-wide flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" /> Meeting Booked
              </span>
            )}
            {callStage === "ended" && (
              <span className="text-xs font-medium text-rose-400 uppercase tracking-wide">Call Ended</span>
            )}
          </div>
        </div>

        {/* Call Body */}
        {callStage === "dialing" ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-4">
            <p className="text-sm text-slate-400 animate-pulse">Connecting outbound line through AI SDR Dialer...</p>
            <button
              onClick={handleHangup}
              className="p-4 rounded-full bg-rose-600 hover:bg-rose-500 text-white transition-all transform hover:scale-105 active:scale-95 shadow-lg shadow-rose-600/20"
              title="Cancel Call"
            >
              <PhoneOff className="w-6 h-6" />
            </button>
          </div>
        ) : (
          <div className="flex-1 flex flex-col min-h-0 bg-slate-900/50">
            {/* Conversation Feed */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 pr-1.5 scrollbar-thin">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={clsx(
                    "flex flex-col max-w-[80%] rounded-2xl p-3.5 text-xs md:text-sm leading-relaxed",
                    msg.sender === "sdr"
                      ? "bg-blue-600/20 border border-blue-500/30 text-blue-100 ml-auto rounded-tr-none"
                      : "bg-slate-800 border border-slate-750 text-slate-200 mr-auto rounded-tl-none"
                  )}
                >
                  <div className="flex items-center gap-1.5 mb-1 text-[10px] text-slate-400">
                    <User className="w-3 h-3" />
                    <span className="font-semibold">
                      {msg.sender === "sdr" ? `${sdrSettings.sdr_name} (SDR)` : lead.name}
                    </span>
                    <span className="ml-auto opacity-70 font-mono">{msg.timestamp}</span>
                  </div>
                  <p>{msg.text}</p>
                </div>
              ))}

              {isTyping && (
                <div
                  className={clsx(
                    "flex items-center gap-1 bg-slate-800 border border-slate-750 rounded-2xl px-4 py-3 max-w-[120px]",
                    currentSpeaker === "sdr" ? "ml-auto" : "mr-auto"
                  )}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" />
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0.4s]" />
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Bottom Controls / Actions */}
            <div className="bg-slate-950 p-4 border-t border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400">
                  <Mic className="w-4 h-4" />
                </div>
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400">
                  <Volume2 className="w-4 h-4" />
                </div>
              </div>

              {callStage === "connected" && (
                <button
                  onClick={handleHangup}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-medium text-xs flex items-center gap-1.5 transition-all shadow-md shadow-rose-600/10"
                >
                  <PhoneOff className="w-4 h-4" /> Hang Up
                </button>
              )}

              {callStage === "completed" && (
                <button
                  onClick={handleUpdateLead}
                  disabled={updating}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium text-xs flex items-center gap-1.5 transition-all shadow-md shadow-indigo-600/20"
                >
                  <Sparkles className="w-4 h-4 text-yellow-300" />
                  {updating ? "Saving..." : "Book Meeting & Mark Qualified"}
                </button>
              )}

              {callStage === "ended" && (
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-xl bg-slate-850 hover:bg-slate-800 text-white font-medium text-xs transition-all border border-slate-750"
                >
                  Close Simulator
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
