import React from "react";
import { cn } from "@/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  glass?: boolean;
  glow?: boolean;
  children: React.ReactNode;
}

export function Card({ glass = true, glow = false, children, className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border transition-all duration-200",
        glass
          ? "bg-white/50 dark:bg-white/5 border-gray-200 dark:border-white/10 backdrop-blur-sm"
          : "bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800",
        glow && "hover:border-violet-500/50 hover:shadow-lg hover:shadow-violet-500/10",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("px-6 py-4 border-b border-gray-200 dark:border-white/10", className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn("text-base font-semibold text-black dark:text-white", className)} {...props}>
      {children}
    </h3>
  );
}

export function CardContent({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("px-6 py-4", className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("px-6 py-4 border-t border-gray-200 dark:border-white/10", className)} {...props}>
      {children}
    </div>
  );
}
