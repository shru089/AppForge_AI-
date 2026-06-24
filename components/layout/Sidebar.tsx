"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  FolderOpen,
  LogOut,
  ChevronRight,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/projects", label: "Projects", icon: FolderOpen },
];

interface SidebarProps {
  user?: { name?: string | null; email?: string | null; image?: string | null };
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="w-64 h-screen flex flex-col border-r border-gray-200 dark:border-white/10 bg-white/40 dark:bg-black/40 backdrop-blur-[40px] fixed left-0 top-0 z-40 transition-colors duration-500">
      {/* Logo */}
      <div className="px-6 py-8 border-b border-gray-200 dark:border-white/10 transition-colors duration-500">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="relative w-10 h-10 flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="AppForge AI Logo" className="w-full h-auto object-contain drop-shadow-2xl mix-blend-multiply dark:mix-blend-screen" />
          </div>
          <span className="text-lg font-extrabold text-black dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-r dark:from-white dark:to-white/70 tracking-tight">AppForge AI</span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className="block"
            >
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-300 group relative overflow-hidden",
                  isActive
                    ? "text-black dark:text-white"
                    : "text-gray-500 dark:text-white/50 hover:text-black dark:hover:text-white"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-gray-100 dark:bg-white/10 border border-gray-200 dark:border-white/20 rounded-2xl transition-colors duration-500"
                    initial={false}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <Icon className={cn("w-5 h-5 relative z-10 transition-colors duration-500", isActive ? "text-[#aadd00] dark:text-indigo-400" : "text-gray-400 dark:text-white/40 group-hover:text-black dark:group-hover:text-white/80")} />
                <span className="relative z-10">{item.label}</span>
                {isActive && <ChevronRight className="w-4 h-4 ml-auto relative z-10 text-gray-500 dark:text-white/50 transition-colors duration-500" />}
              </motion.div>
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className="px-4 py-6 border-t border-gray-200 dark:border-white/10 space-y-3 transition-colors duration-500">
        {user && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-white/5 transition-colors duration-500">
            {user.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.image}
                alt={user.name ?? "User"}
                className="w-8 h-8 rounded-full ring-2 ring-gray-200 dark:ring-white/10"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#dced31] to-[#fb8f44] dark:from-indigo-500 dark:to-purple-500 flex items-center justify-center text-xs font-bold text-white shadow-lg">
                {user.name?.[0]?.toUpperCase() ?? "U"}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-black dark:text-white/90 truncate tracking-tight">{user.name}</p>
              <p className="text-xs font-medium text-gray-500 dark:text-white/40 truncate">{user.email}</p>
            </div>
          </div>
        )}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-gray-500 dark:text-white/50 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-colors font-medium text-sm"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </motion.button>
      </div>
    </aside>
  );
}
