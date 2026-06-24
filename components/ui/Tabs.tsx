"use client";
import React, { useState } from "react";
import { cn } from "@/lib/utils";

interface TabsProps {
  tabs: { id: string; label: string; icon?: React.ReactNode }[];
  children: React.ReactNode[];
  className?: string;
}

export function Tabs({ tabs, children, className }: TabsProps) {
  const [active, setActive] = useState(0);

  return (
    <div className={cn("w-full", className)}>
      <div className="flex gap-1 bg-white/5 p-1 rounded-lg border border-white/10 mb-4 overflow-x-auto">
        {tabs.map((tab, i) => (
          <button
            key={tab.id}
            onClick={() => setActive(i)}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 whitespace-nowrap",
              active === i
                ? "bg-violet-600 text-white shadow-lg shadow-violet-500/25"
                : "text-slate-400 hover:text-white hover:bg-white/10"
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>
      <div className="animate-fade-in">
        {children[active]}
      </div>
    </div>
  );
}
