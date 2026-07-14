"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api";
import toast from "react-hot-toast";
import { Zap, Mail, Lock, User, ArrowRight, Loader2, Eye, EyeOff, Sparkles, Target, BarChart3, Workflow, Sun, Moon } from "lucide-react";
import { useTheme } from "@/app/theme-provider";

export default function LoginPage() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [mode, setMode] = useState<"login" | "register">("login");

  // Hide scrollbar on login page only
  useEffect(() => {
    document.documentElement.classList.add("no-scrollbar");
    return () => document.documentElement.classList.remove("no-scrollbar");
  }, []);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = mode === "login"
        ? await authApi.login({ email: form.email, password: form.password })
        : await authApi.register(form);

      localStorage.setItem("token", res.data.access_token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      toast.success(mode === "login" ? "Welcome back!" : "Account created!");
      router.push("/dashboard");
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setLoading(true);
    try {
      const demoEmail = "demo@aisdr.com";
      const demoPassword = "demo1234";
      setForm({ name: "", email: demoEmail, password: demoPassword });
      const res = await authApi.login({ email: demoEmail, password: demoPassword });
      localStorage.setItem("token", res.data.access_token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      toast.success("Welcome back (Demo User)!");
      router.push("/dashboard");
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Something went wrong with Demo Login");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    if (!form.email) {
      toast.error("Please enter your email address first!");
      return;
    }
    toast.success(`Password reset link sent to ${form.email}!`);
  };

  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: "", color: "bg-slate-700" };
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    if (score <= 1) return { score, label: "Weak 🔴", color: "bg-red-500 w-1/3" };
    if (score <= 3) return { score, label: "Medium 🟡", color: "bg-yellow-500 w-2/3" };
    return { score, label: "Strong 🟢", color: "bg-green-500 w-full" };
  };

  const strength = getPasswordStrength(form.password);

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 overflow-hidden no-scrollbar">

      {/* Theme Toggle — top right, same as Sidebar */}
      <button
        onClick={toggleTheme}
        className="fixed top-4 right-4 z-50 p-2.5 rounded-xl border transition-all shadow-lg bg-white border-slate-200 text-slate-700 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800 dark:text-white dark:hover:bg-slate-800"
        title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
      >
        {theme === "dark" ? (
          <Sun className="w-4 h-4 text-yellow-500" />
        ) : (
          <Moon className="w-4 h-4 text-blue-500" />
        )}
      </button>

      {/* Decorative background orbs */}
      <div
        className="absolute rounded-full blur-[140px] pointer-events-none animate-blob"
        style={{ width: 600, height: 600, background: "radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)", top: "-15%", left: "-8%" }}
      />
      <div
        className="absolute rounded-full blur-[120px] pointer-events-none animate-blob animation-delay-2000"
        style={{ width: 500, height: 500, background: "radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)", bottom: "-15%", right: "-8%" }}
      />
      <div
        className="absolute rounded-full blur-[100px] pointer-events-none animate-blob"
        style={{ width: 300, height: 300, background: "radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 70%)", top: "40%", left: "30%", animationDelay: "6s" }}
      />

      <div className="relative w-full max-w-6xl flex flex-col lg:flex-row items-center justify-between gap-12 z-10 px-4 md:px-8">

        {/* ── Left column: Branding + Feature grid ── */}
        <div className="w-full lg:w-1/2 text-left space-y-8 lg:pr-8">

          <div className="animate-entrance-heading">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-slate-800 border border-blue-200 dark:border-slate-700 text-blue-600 dark:text-blue-400 text-xs font-semibold mb-4">
              <Zap className="w-3.5 h-3.5 animate-pulse" />
              Next-Gen Sales Automation
            </div>
            <h1 className="text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-white leading-tight tracking-tight">
              AI SDR{" "}
              <span className="bg-gradient-to-r from-blue-500 to-indigo-500 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
                Platform
              </span>
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-lg mt-3 max-w-lg">
              Automate your lead generation, personalized cold email campaigns, and analytics tracking with AI intelligence.
            </p>
          </div>

          {/* 4 Feature Boxes — light shade with dark blue blur effect */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            {/* Box 1 — AI Email Generation */}
            <div className="rounded-xl p-5 bg-blue-500/10 dark:bg-blue-950/40 backdrop-blur-md border border-blue-500/20 dark:border-blue-500/30 hover:border-blue-500/40 dark:hover:border-blue-400/50 hover:shadow-xl hover:shadow-blue-500/10 dark:hover:shadow-blue-500/20 transition-all duration-300 group animate-entrance-box-static cursor-default" style={{ animationDelay: '0s' }}>
              <div className="w-10 h-10 rounded-lg bg-blue-100/80 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-3 group-hover:bg-blue-200/80 dark:group-hover:bg-blue-900 transition-all">
                <Sparkles className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
              </div>
              <h3 className="text-slate-900 dark:text-white font-semibold text-base mb-1">AI Email Generation</h3>
              <p className="text-slate-600 dark:text-blue-200/80 text-sm">Generate highly personalized cold outreach emails targeted to each lead.</p>
            </div>

            {/* Box 2 — Smart Lead Scoring */}
            <div className="rounded-xl p-5 bg-blue-500/10 dark:bg-blue-950/40 backdrop-blur-md border border-blue-500/20 dark:border-blue-500/30 hover:border-blue-500/40 dark:hover:border-blue-400/50 hover:shadow-xl hover:shadow-blue-500/10 dark:hover:shadow-blue-500/20 transition-all duration-300 group animate-entrance-box-static cursor-default" style={{ animationDelay: '0.1s' }}>
              <div className="w-10 h-10 rounded-lg bg-blue-100/80 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-3 group-hover:bg-blue-200/80 dark:group-hover:bg-blue-900 transition-all">
                <Target className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
              </div>
              <h3 className="text-slate-900 dark:text-white font-semibold text-base mb-1">Smart Lead Scoring</h3>
              <p className="text-slate-600 dark:text-blue-200/80 text-sm">Automatically capture, filter, and score leads based on conversion potential.</p>
            </div>

            {/* Box 3 — Outreach Analytics */}
            <div className="rounded-xl p-5 bg-blue-500/10 dark:bg-blue-950/40 backdrop-blur-md border border-blue-500/20 dark:border-blue-500/30 hover:border-blue-500/40 dark:hover:border-blue-400/50 hover:shadow-xl hover:shadow-blue-500/10 dark:hover:shadow-blue-500/20 transition-all duration-300 group animate-entrance-box-static cursor-default" style={{ animationDelay: '0.2s' }}>
              <div className="w-10 h-10 rounded-lg bg-blue-100/80 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-3 group-hover:bg-blue-200/80 dark:group-hover:bg-blue-900 transition-all">
                <BarChart3 className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
              </div>
              <h3 className="text-slate-900 dark:text-white font-semibold text-base mb-1">Outreach Analytics</h3>
              <p className="text-slate-600 dark:text-blue-200/80 text-sm">Track open rates, reply rates, and meeting bookings in one centralized dashboard.</p>
            </div>

            {/* Box 4 — Automated Workflows */}
            <div className="rounded-xl p-5 bg-blue-500/10 dark:bg-blue-950/40 backdrop-blur-md border border-blue-500/20 dark:border-blue-500/30 hover:border-blue-500/40 dark:hover:border-blue-400/50 hover:shadow-xl hover:shadow-blue-500/10 dark:hover:shadow-blue-500/20 transition-all duration-300 group animate-entrance-box-static cursor-default" style={{ animationDelay: '0.3s' }}>
              <div className="w-10 h-10 rounded-lg bg-blue-100/80 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-3 group-hover:bg-blue-200/80 dark:group-hover:bg-blue-900 transition-all">
                <Workflow className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
              </div>
              <h3 className="text-slate-900 dark:text-white font-semibold text-base mb-1">Automated Workflows</h3>
              <p className="text-slate-600 dark:text-blue-200/80 text-sm">Set follow-ups, trigger sequences, and sync with your CRM databases seamlessly.</p>
            </div>

          </div>
        </div>

        <div className="w-full lg:w-[420px] shrink-0 animate-entrance-heading">
          <div className="bg-blue-500/10 dark:bg-blue-950/40 backdrop-blur-md border border-blue-500/20 dark:border-blue-500/30 rounded-2xl p-8 shadow-2xl hover:shadow-blue-500/10 dark:hover:shadow-blue-500/20 hover:border-blue-500/40 dark:hover:border-blue-400/50 transition-all duration-300">

            {/* Header — small screens only */}
            <div className="text-center mb-6 lg:hidden">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-500 rounded-xl mb-3 shadow-lg shadow-blue-500/30">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl font-bold text-slate-800 dark:text-white">AI SDR Platform</h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Intelligent Sales Development</p>
            </div>

            {/* Header — large screens */}
            <div className="hidden lg:block text-left mb-6">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                {mode === "login" ? "Welcome Back" : "Get Started"}
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                {mode === "login" ? "Sign in to manage your campaigns" : "Create an account to start prospecting"}
              </p>
            </div>

            {/* Tab toggle */}
            <div className="flex bg-black/5 dark:bg-white/5 rounded-lg p-1 mb-6">
              {(["login", "register"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                    mode === m
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  {m === "login" ? "Sign In" : "Create Account"}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">

              {mode === "register" && (
                <div className="relative group">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                  <input
                    type="text"
                    placeholder="Full name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                    className="w-full bg-white/50 dark:bg-black/20 border border-slate-200 dark:border-blue-900/30 rounded-lg pl-10 pr-4 py-2.5 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm"
                  />
                </div>
              )}

              <div className="relative group">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                <input
                  type="email"
                  placeholder="Email address"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                  className="w-full bg-white/50 dark:bg-black/20 border border-slate-200 dark:border-blue-900/30 rounded-lg pl-10 pr-4 py-2.5 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm"
                />
              </div>

              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  className="w-full bg-white/50 dark:bg-black/20 border border-slate-200 dark:border-blue-900/30 rounded-lg pl-10 pr-10 py-2.5 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password Strength */}
              {mode === "register" && form.password && (
                <div className="space-y-1.5 px-0.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Password Strength:</span>
                    <span className="font-semibold text-slate-800 dark:text-white">{strength.label}</span>
                  </div>
                  <div className="h-1 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className={`h-full ${strength.color} transition-all duration-300`} />
                  </div>
                </div>
              )}

              {/* Remember Me & Forgot Password */}
              {mode === "login" && (
                <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 px-0.5">
                  <label className="flex items-center gap-2 cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-3.5 h-3.5 rounded border-slate-200 dark:border-blue-900/30 bg-white/50 dark:bg-black/20 text-blue-600 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                    />
                    <span>Remember me</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="hover:text-blue-500 dark:hover:text-blue-400 transition-colors font-medium"
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm mt-2 shadow-lg shadow-blue-600/20"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    {mode === "login" ? "Sign In" : "Create Account"}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {mode === "login" && (
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleDemoLogin}
                  className="w-full bg-white/40 dark:bg-white/5 hover:bg-white/60 dark:hover:bg-white/10 border border-slate-200 dark:border-blue-900/30 text-slate-800 dark:text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm mt-2"
                >
                  <Zap className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                  Try Demo Account
                </button>
              )}

            </form>

            {/* Divider */}
            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 border-t border-slate-200/50 dark:border-blue-900/30" />
              <span className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider whitespace-nowrap">
                Or continue with
              </span>
              <div className="flex-1 border-t border-slate-200/50 dark:border-blue-900/30" />
            </div>

            {/* Social Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => toast.success("Connecting with Google...")}
                className="flex items-center justify-center gap-2 bg-white/40 dark:bg-white/5 hover:bg-white/60 dark:hover:bg-white/10 border border-slate-200 dark:border-blue-900/30 text-slate-800 dark:text-white font-medium py-2 rounded-lg transition-colors text-xs"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                </svg>
                Google
              </button>
              <button
                type="button"
                onClick={() => toast.success("Connecting with LinkedIn...")}
                className="flex items-center justify-center gap-2 bg-white/40 dark:bg-white/5 hover:bg-white/60 dark:hover:bg-white/10 border border-slate-200 dark:border-blue-900/30 text-slate-800 dark:text-white font-medium py-2 rounded-lg transition-colors text-xs"
              >
                <svg className="w-4 h-4 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                </svg>
                LinkedIn
              </button>
            </div>

            {/* T&C */}
            <p className="text-center text-[10px] text-slate-500 dark:text-slate-500 mt-5 leading-normal">
              By continuing, you agree to our{" "}
              <a href="#" className="hover:text-blue-500 dark:hover:text-blue-400 transition-colors underline">Terms of Service</a>{" "}
              and{" "}
              <a href="#" className="hover:text-blue-500 dark:hover:text-blue-400 transition-colors underline">Privacy Policy</a>.
            </p>

          </div>
        </div>

      </div>
    </div>
  );
}
