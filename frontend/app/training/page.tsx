"use client";
import { useState, useEffect, useRef } from "react";
import Sidebar from "@/components/Sidebar";
import { aiApi } from "@/lib/api";
import { Trophy, Mic, MicOff, MessageSquare, Award, AlertCircle, ChevronRight, Play, RefreshCw, Send, CheckCircle2 } from "lucide-react";
import clsx from "clsx";

interface Critique {
  overall_score: number;
  empathy_score: number;
  value_pitch_score: number;
  objection_handling_score: number;
  feedback: string;
}

const PROFILES = [
  {
    id: "cto",
    role: "Busy Tech CTO",
    difficulty: "Hard",
    avatar: "👨‍💻",
    description: "Arthur Pendragon, CTO at Camelot Growth. Impatient, tech-savvy, hates sales fluff. Focus on engineering time saved and code reliability.",
    intro: "Hello, Arthur here. I'm in the middle of resolving an API outage, so you have exactly 30 seconds. What is this about?",
  },
  {
    id: "cfo",
    role: "Price-Sensitive CFO",
    difficulty: "Medium",
    avatar: "📊",
    description: "Jane Watson, CFO at Saasly. Highly focused on cost reduction, payback period, and software consolidation.",
    intro: "Hi, this is Jane. We actually froze all external vendor spending last quarter. Why should I budget for you?",
  },
  {
    id: "vpsales",
    role: "Impatient Head of Sales",
    difficulty: "Easy",
    avatar: "⚡",
    description: "Mark Jenkins, VP Sales at FintechFlow. Wants quick SDR efficiency, higher pipeline value, and direct contact details.",
    intro: "Hey, Mark here. Our sales reps are struggling with low email reply rates. Do you have a direct solution for this?",
  },
];

export default function TrainingArena() {
  const [selectedProfile, setSelectedProfile] = useState(PROFILES[0]);
  const [pitchInput, setPitchInput] = useState("");
  const [messages, setMessages] = useState<Array<{ sender: "prospect" | "user"; text: string }>>([
    { sender: "prospect", text: PROFILES[0].intro },
  ]);
  const [isListening, setIsListening] = useState(false);
  const [loading, setLoading] = useState(false);
  const [critique, setCritique] = useState<Critique | null>(null);
  const [error, setError] = useState("");
  const recognitionRef = useRef<any>(null);

  // Sync opening message when changing profile
  const handleProfileChange = (profile: typeof PROFILES[0]) => {
    setSelectedProfile(profile);
    setMessages([{ sender: "prospect", text: profile.intro }]);
    setCritique(null);
    setPitchInput("");
    setError("");
  };

  // Web Speech recognition setup
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const rec = new SpeechRecognition();
        rec.continuous = false;
        rec.interimResults = false;
        rec.lang = "en-US";

        rec.onresult = (e: any) => {
          const transcript = e.results[0][0].transcript;
          setPitchInput(transcript);
          setIsListening(false);
        };

        rec.onerror = () => {
          setIsListening(false);
        };

        rec.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = rec;
      }
    }
  }, []);

  const toggleListen = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in this browser. Please type your pitch.");
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  const handleSendPitch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pitchInput.trim() || loading) return;

    setError("");
    const userText = pitchInput;
    setMessages((prev) => [...prev, { sender: "user", text: userText }]);
    setPitchInput("");
    setLoading(true);

    try {
      const response = await aiApi.ratePitch(selectedProfile.role, userText);
      const data = response.data;
      setCritique(data);
      setMessages((prev) => [
        ...prev,
        { sender: "prospect", text: "Training session evaluated! Check your capability score below." },
      ]);
    } catch (err: any) {
      setError("Unable to score pitch. Please check connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const resetGame = () => {
    setMessages([{ sender: "prospect", text: selectedProfile.intro }]);
    setCritique(null);
    setPitchInput("");
    setError("");
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex transition-colors duration-300">
      <Sidebar />
      <main className="flex-1 lg:ml-64 p-6 lg:p-8 overflow-x-hidden">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <Trophy className="w-6 h-6 text-yellow-500 animate-pulse" />
              SDR Training Arena
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              Pitch against AI roleplay avatars and optimize objection handlers in real-time.
            </p>
          </div>
          <button
            onClick={resetGame}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reset Simulator
          </button>
        </div>

        {/* Content grid */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          {/* Profiles Column (4 cols) */}
          <div className="xl:col-span-4 space-y-4">
            <div className="p-5 rounded-2xl border border-slate-200/60 dark:border-white/5 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md shadow-sm">
              <h2 className="text-sm font-semibold text-slate-800 dark:text-white mb-4">Select Target Profile</h2>
              <div className="space-y-3">
                {PROFILES.map((profile) => {
                  const isActive = selectedProfile.id === profile.id;
                  return (
                    <button
                      key={profile.id}
                      onClick={() => handleProfileChange(profile)}
                      className={clsx(
                        "w-full text-left p-4 rounded-xl border transition-all duration-200 flex items-start gap-4",
                        isActive
                          ? "bg-blue-600/5 dark:bg-blue-500/5 border-blue-500/80 shadow-md shadow-blue-500/5"
                          : "bg-white dark:bg-slate-900 border-slate-100 hover:border-slate-300 dark:border-white/5 dark:hover:border-white/15"
                      )}
                    >
                      <span className="text-3xl p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">{profile.avatar}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-slate-900 dark:text-white">{profile.role}</span>
                          <span
                            className={clsx(
                              "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider",
                              profile.difficulty === "Hard" && "bg-red-500/10 text-red-500",
                              profile.difficulty === "Medium" && "bg-amber-500/10 text-amber-500",
                              profile.difficulty === "Easy" && "bg-green-500/10 text-green-500"
                            )}
                          >
                            {profile.difficulty}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                          {profile.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Interactive Chat and Coach Grader (8 cols) */}
          <div className="xl:col-span-8 space-y-6">
            {/* Chat room */}
            <div className="rounded-2xl border border-slate-200/60 dark:border-white/5 bg-white dark:bg-slate-900 shadow-sm flex flex-col min-h-[420px]">
              {/* Profile Card Header */}
              <div className="p-4 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{selectedProfile.avatar}</span>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{selectedProfile.role}</h3>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">Outbound Roleplay active</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-ping" />
                  <span className="text-xs text-green-600 dark:text-green-400 font-medium">Ready</span>
                </div>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 p-6 space-y-4 overflow-y-auto max-h-[300px]">
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={clsx(
                      "flex max-w-[80%] flex-col rounded-2xl px-4 py-3 text-sm shadow-sm",
                      msg.sender === "prospect"
                        ? "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 self-start rounded-tl-none border border-slate-200/40 dark:border-white/5"
                        : "bg-blue-600 text-white self-end rounded-tr-none"
                    )}
                  >
                    {msg.text}
                  </div>
                ))}
                {loading && (
                  <div className="flex items-center gap-2 self-start bg-slate-100 dark:bg-slate-800 text-slate-500 px-4 py-3 rounded-2xl rounded-tl-none">
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-75" />
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-150" />
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-225" />
                  </div>
                )}
              </div>

              {/* Chat Input */}
              <form onSubmit={handleSendPitch} className="p-4 border-t border-slate-100 dark:border-white/5 flex gap-3">
                <button
                  type="button"
                  onClick={toggleListen}
                  className={clsx(
                    "p-3 rounded-xl border transition-colors flex items-center justify-center relative",
                    isListening
                      ? "bg-red-500/10 border-red-500 text-red-500 hover:bg-red-500/20"
                      : "bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-600 dark:bg-slate-800 dark:border-white/5 dark:text-slate-300 dark:hover:bg-slate-700"
                  )}
                  title="Speak Objection pitch via microphone"
                >
                  {isListening ? (
                    <>
                      <Mic className="w-4 h-4" />
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-ping" />
                    </>
                  ) : (
                    <MicOff className="w-4 h-4" />
                  )}
                </button>
                <input
                  type="text"
                  value={pitchInput}
                  onChange={(e) => setPitchInput(e.target.value)}
                  placeholder={isListening ? "Listening..." : "Type your counter-argument / pitch objection deflector..."}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={!pitchInput.trim() || loading}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-all shadow-md shadow-blue-500/15 flex items-center gap-2 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  Grade Pitch
                </button>
              </form>
            </div>

            {/* Critique Dashboard Gauge Card */}
            {critique && (
              <div className="rounded-2xl border border-slate-200/60 dark:border-white/5 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-6 animate-fade-in">
                <div className="flex items-center gap-2 mb-2">
                  <Award className="w-5 h-5 text-yellow-500" />
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">AI Pitch scorecard</h3>
                </div>

                {/* Score indicators */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {/* Overall Gauge circle */}
                  <div className="flex flex-col items-center p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-white/5">
                    <div className="relative w-16 h-16 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                        <path
                          className="text-slate-200 dark:text-slate-800"
                          strokeWidth="3.5"
                          stroke="currentColor"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        <path
                          className="text-yellow-500"
                          strokeWidth="3.5"
                          strokeDasharray={`${critique.overall_score}, 100`}
                          strokeLinecap="round"
                          stroke="currentColor"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                      </svg>
                      <span className="absolute text-sm font-extrabold text-slate-950 dark:text-white">
                        {critique.overall_score}
                      </span>
                    </div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400 mt-3 text-center">
                      Overall Score
                    </span>
                  </div>

                  {/* Empathy score */}
                  <div className="flex flex-col items-center p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-white/5">
                    <div className="relative w-16 h-16 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                        <path
                          className="text-slate-200 dark:text-slate-800"
                          strokeWidth="3.5"
                          stroke="currentColor"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        <path
                          className="text-emerald-500"
                          strokeWidth="3.5"
                          strokeDasharray={`${critique.empathy_score}, 100`}
                          strokeLinecap="round"
                          stroke="currentColor"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                      </svg>
                      <span className="absolute text-sm font-extrabold text-slate-950 dark:text-white">
                        {critique.empathy_score}
                      </span>
                    </div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400 mt-3 text-center">
                      Tone Empathy
                    </span>
                  </div>

                  {/* Value Pitch */}
                  <div className="flex flex-col items-center p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-white/5">
                    <div className="relative w-16 h-16 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                        <path
                          className="text-slate-200 dark:text-slate-800"
                          strokeWidth="3.5"
                          stroke="currentColor"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        <path
                          className="text-blue-500"
                          strokeWidth="3.5"
                          strokeDasharray={`${critique.value_pitch_score}, 100`}
                          strokeLinecap="round"
                          stroke="currentColor"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                      </svg>
                      <span className="absolute text-sm font-extrabold text-slate-950 dark:text-white">
                        {critique.value_pitch_score}
                      </span>
                    </div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400 mt-3 text-center">
                      Value Pitch
                    </span>
                  </div>

                  {/* Objection Handling */}
                  <div className="flex flex-col items-center p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-white/5">
                    <div className="relative w-16 h-16 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                        <path
                          className="text-slate-200 dark:text-slate-800"
                          strokeWidth="3.5"
                          stroke="currentColor"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        <path
                          className="text-violet-500"
                          strokeWidth="3.5"
                          strokeDasharray={`${critique.objection_handling_score}, 100`}
                          strokeLinecap="round"
                          stroke="currentColor"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                      </svg>
                      <span className="absolute text-sm font-extrabold text-slate-950 dark:text-white">
                        {critique.objection_handling_score}
                      </span>
                    </div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400 mt-3 text-center">
                      Objection deflection
                    </span>
                  </div>
                </div>

                {/* AI Critique feedback */}
                <div className="p-4 rounded-xl border border-blue-500/10 bg-blue-500/5">
                  <h4 className="text-xs font-bold text-slate-850 dark:text-white mb-2 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />
                    Coach critique & recommendations
                  </h4>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                    {critique.feedback}
                  </p>
                </div>
              </div>
            )}

            {error && (
              <div className="p-4 rounded-xl border border-red-500/10 bg-red-500/5 text-red-600 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
