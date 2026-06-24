import { cn } from "@/lib/utils";

interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  label?: string;
}

export function Spinner({ size = "md", className, label }: SpinnerProps) {
  const sizes = { sm: "w-4 h-4", md: "w-6 h-6", lg: "w-10 h-10" };
  return (
    <div className={cn("flex flex-col items-center gap-3", className)}>
      <div className={cn("relative", sizes[size])}>
        <div className={cn("absolute inset-0 rounded-full border-2 border-white/10", sizes[size])} />
        <div
          className={cn(
            "absolute inset-0 rounded-full border-2 border-t-violet-500 border-r-transparent border-b-transparent border-l-transparent animate-spin",
            sizes[size]
          )}
        />
      </div>
      {label && <p className="text-sm text-slate-400 animate-pulse">{label}</p>}
    </div>
  );
}

export function PageLoader({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Spinner size="lg" label={label} />
    </div>
  );
}

export function SkeletonLine({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "h-4 rounded-md bg-gradient-to-r from-white/5 via-white/10 to-white/5 animate-shimmer bg-[length:200%_100%]",
        className
      )}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-6 space-y-4">
      <SkeletonLine className="w-1/3 h-5" />
      <SkeletonLine className="w-full h-3" />
      <SkeletonLine className="w-4/5 h-3" />
      <SkeletonLine className="w-2/3 h-3" />
    </div>
  );
}
