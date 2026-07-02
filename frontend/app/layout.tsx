import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import ThemeProviderWrapper from "./theme-provider";

export const metadata: Metadata = {
  title: "AI SDR — Sales Intelligence Platform",
  description: "AI-powered Sales Development Representative tool",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="relative min-h-screen overflow-x-hidden">
        <ThemeProviderWrapper>
          {/* Global Background Glow Blobs wrapped to prevent document scroll overflow */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
            <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-blue-500/5 dark:bg-blue-500/10 blur-[120px] animate-blob" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-500/5 dark:bg-indigo-500/10 blur-[120px] animate-blob animation-delay-2000" />
          </div>
          
          <div className="relative z-10">
            {children}
          </div>
          <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
        </ThemeProviderWrapper>
      </body>
    </html>
  );
}
