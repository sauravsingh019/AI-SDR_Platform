"use client";
import { useState, useEffect, useRef } from "react";
import { Phone, PhoneOff, User, Volume2, Mic, CheckCircle, Clock, Sparkles, Send, Loader2 } from "lucide-react";
import { leadsApi, aiApi } from "@/lib/api";
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
  const [callStage, setCallStage] = useState<"dialing" | "connected" | "completed" | "ended">("dialing");
  const [seconds, setSeconds] = useState(0);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isAIResponding, setIsAIResponding] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [history, setHistory] = useState<string>("");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const audioWaveInterval = useRef<any>(null);
  const [waveHeights, setWaveHeights] = useState<number[]>([10, 15, 8, 20, 12, 18, 10, 14, 8, 12]);

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
    
    // Initialize Web Speech Synthesis
    if (typeof window !== "undefined" && window.speechSynthesis) {
      synthRef.current = window.speechSynthesis;
    }
  }, []);

  // Format call timer
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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isAIResponding]);

  // Audio wave animation when speaking or listening
  useEffect(() => {
    if (isListening || isAISpeaking) {
      audioWaveInterval.current = setInterval(() => {
        setWaveHeights(Array.from({ length: 10 }, () => Math.floor(Math.random() * 30) + 5));
      }, 120);
    } else {
      if (audioWaveInterval.current) clearInterval(audioWaveInterval.current);
      setWaveHeights([10, 10, 10, 10, 10, 10, 10, 10, 10, 10]);
    }
    return () => {
      if (audioWaveInterval.current) clearInterval(audioWaveInterval.current);
    };
  }, [isListening, isAISpeaking]);

  // Speech synthesis helper
  const speakLoud = (text: string) => {
    if (!synthRef.current) return;
    synthRef.current.cancel(); // Stop active speaking
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Attempt to pick a premium natural sounding voice if available
    const voices = synthRef.current.getVoices();
    const englishVoice = voices.find(v => v.lang.includes("en-US") && v.name.includes("Google")) || voices.find(v => v.lang.includes("en"));
    if (englishVoice) utterance.voice = englishVoice;
    
    utterance.onstart = () => setIsAISpeaking(true);
    utterance.onend = () => setIsAISpeaking(false);
    utterance.onerror = () => setIsAISpeaking(false);
    synthRef.current.speak(utterance);
  };

  // Start outbound call connection simulation
  useEffect(() => {
    if (callStage === "dialing") {
      const connectTimer = setTimeout(() => {
        setCallStage("connected");
        // Start the call with the AI SDR's greeting
        const greeting = `Hi ${lead.name}, this is ${sdrSettings.sdr_name} from ${sdrSettings.company_name}. I noticed you lead operations as ${lead.job_title || "a leader"} at ${lead.company || "your company"}. How are you doing today?`;
        
        setMessages([
          {
            sender: "sdr",
            text: greeting,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
          }
        ]);
        setHistory(`SDR: ${greeting}`);
        // Speak greeting
        speakLoud(greeting);
      }, 2000);
      return () => clearTimeout(connectTimer);
    }
  }, [callStage]);

  // Web Speech Recognition
  const startSpeechRecognition = () => {
    if (typeof window === "undefined") return;
    
    const SpeechRecObj = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecObj) {
      toast.error("Web Speech API is not supported in this browser. Please type your objection instead.");
      return;
    }

    if (synthRef.current) synthRef.current.cancel(); // Mute speech when listening

    const recognition = new SpeechRecObj();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const result = event.results[0][0].transcript;
      if (result) {
        handleObjectionSubmitted(result);
      }
    };

    recognition.onerror = () => {
      setIsListening(false);
      toast.error("Objection voice recognition timed out or failed. Please try again.");
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const handleObjectionSubmitted = async (text: string) => {
    if (!text.trim()) return;
    
    // Append prospect response
    const prospectMsg: Message = {
      sender: "prospect",
      text: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    };
    
    setMessages((prev) => [...prev, prospectMsg]);
    setInputText("");
    setIsAIResponding(true);

    const updatedHistory = history + `\nProspect: ${text}`;
    setHistory(updatedHistory);

    try {
      // API call to fetch AI SDR response dynamically
      const res = await aiApi.respondDialer(lead.id, text, updatedHistory);
      const aiResponseText = res.data.ai_response;

      const sdrMsg: Message = {
        sender: "sdr",
        text: aiResponseText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      };
      
      setMessages((prev) => [...prev, sdrMsg]);
      setHistory((prev) => prev + `\nSDR: ${aiResponseText}`);
      
      // Speak AI response out loud
      speakLoud(aiResponseText);
    } catch (e) {
      toast.error("Objection processing failed. Simulating answer...");
      const fallbackText = "I understand your concern. Many companies experience resource limits initially. However, our solution is fully autonomous and operates with virtually zero bandwidth requirements from your existing team.";
      setMessages((prev) => [
        ...prev,
        {
          sender: "sdr",
          text: fallbackText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        }
      ]);
      speakLoud(fallbackText);
    } finally {
      setIsAIResponding(false);
    }
  };

  const handleHangup = () => {
    if (synthRef.current) synthRef.current.cancel();
    setCallStage("completed");
  };

  const handleUpdateLead = async () => {
    setUpdating(true);
    try {
      const updatedNotes = (lead.notes ? lead.notes + "\n" : "") + 
        `[Interactive Voice Call - ${new Date().toLocaleDateString()}] Dialer roleplay complete. Successfully pitched value proposition. Outbox meeting confirmed.`;
      
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
        "bg-slate-900 border border-slate-800 text-slate-100 rounded-2xl w-full max-w-xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300",
        callStage === "dialing" ? "h-[320px]" : "h-[620px]"
      )}>
        
        {/* Call Header */}
        <div className="bg-slate-950 p-5 flex items-center justify-between border-b border-slate-800 shrink-0">
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
                <CheckCircle className="w-3.5 h-3.5" /> Pitch Complete
              </span>
            )}
          </div>
        </div>

        {/* Call Body */}
        {callStage === "dialing" ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-4">
            <p className="text-sm text-slate-450 animate-pulse">Connecting outbound line through AI SDR Dialer...</p>
            <button
              onClick={() => setCallStage("ended")}
              className="p-4 rounded-full bg-rose-600 hover:bg-rose-500 text-white transition-all transform hover:scale-105 active:scale-95 shadow-lg shadow-rose-600/20"
              title="Cancel Call"
            >
              <PhoneOff className="w-6 h-6" />
            </button>
          </div>
        ) : callStage === "connected" ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Transcript Messages */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-thin bg-slate-950/20">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={clsx(
                    "flex flex-col max-w-[80%] rounded-2xl p-4.5 text-xs leading-relaxed",
                    msg.sender === "sdr"
                      ? "bg-blue-600/10 border border-blue-500/20 text-slate-200 self-start"
                      : "bg-slate-800 border border-slate-700 text-slate-100 self-end"
                  )}
                >
                  <div className="flex items-center gap-1.5 mb-1 text-[10px] uppercase font-bold tracking-wider text-slate-400">
                    {msg.sender === "sdr" ? (
                      <><Sparkles className="w-3 h-3 text-blue-400" /> {sdrSettings.sdr_name} (AI SDR)</>
                    ) : (
                      <><User className="w-3 h-3 text-slate-300" /> {lead.name}</>
                    )}
                  </div>
                  <p>{msg.text}</p>
                </div>
              ))}
              {isAIResponding && (
                <div className="bg-blue-600/10 border border-blue-500/20 rounded-2xl p-4.5 text-xs text-slate-300 self-start flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />
                  AI SDR is formulating pitch...
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Speech Waveform Overlay */}
            <div className="px-5 py-3 bg-slate-950/45 border-t border-slate-800/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-end gap-1 h-6">
                  {waveHeights.map((h, i) => (
                    <div
                      key={i}
                      className={clsx(
                        "w-1 rounded-full transition-all duration-100",
                        isListening ? "bg-emerald-500" : isAISpeaking ? "bg-blue-500" : "bg-slate-700"
                      )}
                      style={{ height: `${h}px` }}
                    />
                  ))}
                </div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-450">
                  {isListening ? "Listening to mic..." : isAISpeaking ? "AI SDR is speaking..." : "Line active"}
                </span>
              </div>
              <button
                onClick={startSpeechRecognition}
                disabled={isListening || isAIResponding}
                className={clsx(
                  "px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md active:scale-95",
                  isListening
                    ? "bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 animate-pulse"
                    : "bg-emerald-600 hover:bg-emerald-500 text-white"
                )}
              >
                <Mic className="w-3.5 h-3.5" />
                {isListening ? "Listening..." : "Objection via Mic"}
              </button>
            </div>

            {/* Input Action Panel */}
            <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center gap-3 shrink-0">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleObjectionSubmitted(inputText)}
                placeholder="Type prospect objection (e.g. 'We don't have budget')..."
                className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-medium"
              />
              <button
                onClick={() => handleObjectionSubmitted(inputText)}
                disabled={!inputText.trim() || isAIResponding}
                className="p-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl transition-all shadow-md shadow-blue-600/10 active:scale-95"
              >
                <Send className="w-4 h-4" />
              </button>
              <button
                onClick={handleHangup}
                className="p-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl transition-all active:scale-95"
                title="Hang up call"
              >
                <PhoneOff className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-6 text-center">
            <div className="w-16 h-16 rounded-full bg-indigo-500/10 text-indigo-500 flex items-center justify-center border border-indigo-500/20 animate-pulse">
              <CheckCircle className="w-8 h-8" />
            </div>
            <div>
              <h4 className="font-semibold text-lg text-white">Call Roleplay Concluded</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mt-2 leading-relaxed">
                You successfully roleplayed handling objections. Would you like to mark this prospect as qualified?
              </p>
            </div>
            <div className="flex gap-3 w-full max-w-xs">
              <button
                onClick={onClose}
                className="flex-1 btn-secondary text-xs py-3 justify-center text-slate-300 border-slate-800 hover:bg-slate-800"
              >
                Close Dialer
              </button>
              <button
                onClick={handleUpdateLead}
                disabled={updating}
                className="flex-1 btn-primary text-xs py-3 justify-center bg-indigo-600 hover:bg-indigo-500 shadow-md font-semibold"
              >
                {updating ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Updating...</> : "Mark Qualified"}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
