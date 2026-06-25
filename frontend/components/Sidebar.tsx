"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Zap, LayoutDashboard, Users, LogOut, Menu, X, Sun, Moon, Settings, Mail } from "lucide-react";
import { useState } from "react";
import clsx from "clsx";
import { useTheme } from "@/app/theme-provider";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/leads", icon: Users, label: "Leads" },
  { href: "/campaigns", icon: Mail, label: "Campaigns" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setOpen(!open)}
        className={clsx(
          "lg:hidden fixed top-4 left-4 z-50 p-2.5 backdrop-blur-md rounded-xl border transition-colors shadow-lg",
          "bg-white border-slate-200 text-slate-800 hover:bg-slate-50",
          "dark:bg-slate-900/90 dark:border-white/10 dark:text-white dark:hover:bg-slate-800"
        )}
      >
        {open ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
      </button>

      {/* Overlay */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 bg-black/40 dark:bg-black/60 z-30 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar - Translucent card with outline */}
      <aside
        className={clsx(
          "fixed top-4 left-4 bottom-4 w-60 z-40 flex flex-col transition-all duration-300 rounded-2xl border backdrop-blur-xl",
          "bg-white/25 border-slate-200/60 shadow-[0_15px_40px_rgba(0,0,0,0.03)] text-slate-800",
          "dark:bg-slate-900/45 dark:border-white/5 dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)] dark:shadow-indigo-950/10 dark:text-white",
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo & Theme Toggle */}
        <div className="flex items-center justify-between px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/25">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-sm tracking-wide text-slate-900 dark:text-white">AI SDR</span>
          </div>
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100/50 dark:hover:bg-white/5 transition-colors"
            title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {theme === "dark" ? (
              <Sun className="w-4 h-4 text-yellow-500" />
            ) : (
              <Moon className="w-4 h-4 text-blue-400" />
            )}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-4 py-3 space-y-2">
          {navItems.map(({ href, icon: Icon, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={clsx(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                pathname === href
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20 translate-x-1"
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-100/50 dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/5 hover:translate-x-1"
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}
        </nav>

        {/* Logout */}
        <div className="px-4 py-4">
          <button
            onClick={logout}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-500 hover:text-slate-900 hover:bg-slate-100/50 dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/5 transition-all duration-200 w-full"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}
