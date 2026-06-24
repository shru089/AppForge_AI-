"use client";

import { signIn } from "next-auth/react";
import { Mail, ArrowRight, Sparkles, Code2, Network, ShieldCheck, Eye, CloudUpload, ChevronDown, Moon, Sun, Lock } from "lucide-react";
import { motion } from "framer-motion";
import nextDynamic from "next/dynamic";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

const LiquidBackground = nextDynamic(
  () => import("@/components/ui/LiquidBackground").then((mod) => mod.LiquidBackground),
  { ssr: false }
);

export const dynamic = "force-dynamic";

export default function LoginPage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-[#fcfcfc] dark:bg-[#080509] text-[#1a1a1a] dark:text-white overflow-hidden relative font-sans transition-colors duration-500">
      {/* Background Water Ripple Effect */}
      <div className={theme === 'dark' ? 'opacity-30 mix-blend-screen' : 'opacity-100'}>
        <LiquidBackground />
      </div>

      {/* Top Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#ccff00] flex items-center justify-center border border-[#aadd00] dark:border-none">
            <Code2 className="w-5 h-5 text-black" />
          </div>
          <span className="text-xl font-bold tracking-tight text-black dark:text-white">AppForge <span className="text-[#aadd00]">AI</span></span>
        </div>
        <div className="flex items-center gap-8 text-sm font-medium text-gray-600 dark:text-white/70">
          <a href="#" className="hover:text-black dark:hover:text-white transition-colors">Features</a>
          <a href="#" className="hover:text-black dark:hover:text-white transition-colors">Pricing</a>
          <a href="#" className="hover:text-black dark:hover:text-white transition-colors">Docs</a>
          <a href="#" className="hover:text-black dark:hover:text-white transition-colors flex items-center gap-1.5">
            Changelog <span className="w-1.5 h-1.5 rounded-full bg-[#ccff00]" />
          </a>
          <button className="px-5 py-2 rounded-full border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-gray-50 dark:hover:bg-white/10 transition-colors text-black dark:text-white shadow-sm">
            Sign in
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-8 pt-6 pb-24 flex flex-col items-center">
        
        {/* Header Section */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-gray-200 dark:border-white/10 bg-white/50 dark:bg-white/5 backdrop-blur-sm mb-6">
            <Sparkles className="w-3.5 h-3.5 text-[#ccff00]" />
            <span className="text-xs font-semibold tracking-wider text-gray-600 dark:text-white/80 uppercase">AI-Powered App Generator</span>
          </div>
          <h1 className="text-6xl md:text-7xl font-bold tracking-tight mb-4 text-black dark:text-white">
            AppForge <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ccff00] to-[#e6d000]">AI</span>
          </h1>
          <p className="text-lg text-gray-500 dark:text-white/50 font-medium">Melt ideas into complete applications.</p>
        </div>

        <div className="w-full flex flex-col lg:flex-row items-center justify-center gap-8">
          
          {/* Main Login Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-[440px] rounded-[32px] border border-white/50 dark:border-white/10 bg-white/70 dark:bg-white/[0.03] backdrop-blur-xl p-8 lg:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-2xl relative overflow-hidden transition-colors duration-500"
          >
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-black dark:text-white mb-2">Welcome back</h2>
              <p className="text-sm text-gray-500 dark:text-white/50">Sign in to continue building</p>
            </div>

            <div className="space-y-4">
              <button 
                onClick={() => signIn("credentials", { callbackUrl: "/dashboard" })}
                className="w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-xl font-semibold text-white bg-gradient-to-r from-[#dced31] via-[#fb8f44] to-[#f65a6c] hover:opacity-90 transition-opacity shadow-[0_4px_14px_0_rgba(251,143,68,0.39)] dark:shadow-none"
              >
                <Sparkles className="w-4 h-4" />
                Instant Demo Login
              </button>

              <button 
                onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
                className="w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-xl font-semibold text-black dark:text-white bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/10 transition-colors shadow-sm dark:shadow-none"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </button>
            </div>

            <div className="flex items-center gap-4 my-8">
              <div className="h-[1px] flex-1 bg-gray-200 dark:bg-white/10" />
              <span className="text-xs text-gray-400 dark:text-white/40 font-medium">or continue with email</span>
              <div className="h-[1px] flex-1 bg-gray-200 dark:bg-white/10" />
            </div>

            <div className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-white/40" />
                <input 
                  type="email" 
                  placeholder="you@company.com" 
                  aria-label="Email Address"
                  className="w-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl py-3.5 pl-11 pr-4 text-sm text-black dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/30 focus:outline-none focus:border-gray-400 dark:focus:border-white/30 focus:ring-1 focus:ring-gray-400 dark:focus:ring-0 transition-all"
                />
              </div>
              <button className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl font-semibold text-black dark:text-white bg-gradient-to-r from-[#fef4e8] to-[#fce4fb] dark:from-white/5 dark:to-white/5 border border-gray-100 dark:border-white/10 hover:opacity-90 dark:hover:bg-white/10 transition-all group">
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                Send magic link
              </button>
            </div>

            <div className="mt-8 text-center">
              <p className="text-[11px] text-gray-400 dark:text-white/40 leading-relaxed">
                By continuing, you agree to our <a href="#" className="text-[#bade00] font-medium hover:underline">Terms of Service</a> and <a href="#" className="text-[#bade00] font-medium hover:underline">Privacy Policy</a>.
              </p>
            </div>
          </motion.div>

          {/* Right Side Features Card */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="w-full max-w-[320px] rounded-[24px] border border-white/50 dark:border-white/10 bg-white/70 dark:bg-white/[0.02] backdrop-blur-md p-6 hidden lg:block shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none transition-colors duration-500"
          >
            <div className="space-y-6">
              {[
                { icon: <Mail className="w-4 h-4 text-[#4caf50] dark:text-[#ccff00]" />, title: "Describe your idea", desc: "In natural language", bg: "bg-[#e8f5e9] dark:bg-white/5 border-transparent dark:border-white/10" },
                { icon: <Network className="w-4 h-4 text-[#4caf50]" />, title: "AI builds the blueprint", desc: "Schemas, APIs, DB & more", bg: "bg-[#e8f5e9] dark:bg-white/5 border-transparent dark:border-white/10" },
                { icon: <ShieldCheck className="w-4 h-4 text-[#9c27b0]" />, title: "Validate & repair", desc: "Auto-fix issues intelligently", bg: "bg-[#f3e5f5] dark:bg-white/5 border-transparent dark:border-white/10" },
                { icon: <Eye className="w-4 h-4 text-[#f44336]" />, title: "Preview your app", desc: "See it come to life instantly", bg: "bg-[#ffebee] dark:bg-white/5 border-transparent dark:border-white/10" },
                { icon: <CloudUpload className="w-4 h-4 text-[#ff9800]" />, title: "Export & deploy", desc: "Use it anywhere, anytime", bg: "bg-[#fff3e0] dark:bg-white/5 border-transparent dark:border-white/10" },
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className={`mt-0.5 w-8 h-8 rounded-xl border ${step.bg} flex items-center justify-center flex-shrink-0 transition-colors duration-500`}>
                    {step.icon}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white/90">{step.title}</h4>
                    <p className="text-[11px] text-gray-500 dark:text-white/40 mt-0.5">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </main>

      {/* Footer Elements */}
      <div className="absolute bottom-6 left-8 right-8 flex items-center justify-between z-20 pointer-events-none">
        <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-gray-200 dark:border-white/10 bg-white/80 dark:bg-white/5 backdrop-blur-md pointer-events-auto shadow-sm transition-colors duration-500">
          <Lock className="w-3.5 h-3.5 text-gray-500 dark:text-white/50" />
          <span className="text-xs font-medium text-gray-600 dark:text-white/50 tracking-wide">Secure • Private • Encrypted</span>
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 ml-1" />
        </div>

        <button aria-label="Scroll Down" className="w-10 h-10 rounded-full border border-gray-200 dark:border-white/10 bg-white/80 dark:bg-white/5 backdrop-blur-md flex items-center justify-center text-gray-500 dark:text-white/50 hover:text-black dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/10 shadow-sm transition-colors pointer-events-auto">
          <ChevronDown className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-1 px-1 py-1 rounded-full border border-gray-200 dark:border-white/10 bg-white/80 dark:bg-white/5 backdrop-blur-md pointer-events-auto shadow-sm transition-colors duration-500">
          <button 
            onClick={() => setTheme('light')}
            aria-label="Light Mode" 
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${mounted && theme !== 'dark' ? 'bg-[#ccff00]/20 text-yellow-600' : 'text-gray-400 dark:text-white/50 hover:text-gray-800 dark:hover:text-white'}`}
          >
            <Sun className="w-3.5 h-3.5" />
          </button>
          <button 
            onClick={() => setTheme('dark')}
            aria-label="Dark Mode" 
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${mounted && theme === 'dark' ? 'bg-[#ccff00]/20 text-[#ccff00]' : 'text-gray-400 hover:text-gray-800 transition-colors'}`}
          >
            <Moon className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
